import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyWebhookSignature } from '@/lib/stripe/client';
import { getTierFromPriceId } from '@/lib/stripe';
import type Stripe from 'stripe';

// Webhook event types we handle
type WebhookEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed';

// Valid subscription_status values in database
// CHECK constraint: ('active', 'past_due', 'cancelled', 'trialing')
type DbSubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';

// POST /api/webhooks/stripe - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Stripe Webhook] Missing signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(body, signature);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type as WebhookEventType) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/**
 * Handle checkout.session.completed
 * This fires when a customer completes checkout - subscription is active
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
) {
  console.log('[Stripe Webhook] Checkout completed:', session.id);

  // Get user ID from metadata
  const userId = session.client_reference_id || session.metadata?.userId;
  if (!userId) {
    console.error('[Stripe Webhook] No userId in checkout session');
    return;
  }

  // Get customer ID
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id;

  // Get subscription ID
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : (session.subscription as Stripe.Subscription)?.id;

  // Determine tier from line items if available
  let tier = 'solo';
  if (session.line_items?.data?.[0]?.price?.id) {
    const tierInfo = getTierFromPriceId(session.line_items.data[0].price.id);
    if (tierInfo) tier = tierInfo.tier;
  }

  // Update user profile
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active' as DbSubscriptionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[Stripe Webhook] Failed to update user profile:', error);
    throw error;
  }

  console.log(`[Stripe Webhook] User ${userId} subscribed to ${tier}`);
}

/**
 * Handle customer.subscription.created
 * This fires when a subscription is created (but may not be active yet)
 */
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient
) {
  console.log('[Stripe Webhook] Subscription created:', subscription.id);

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.log('[Stripe Webhook] No userId in subscription metadata');
    return;
  }

  // Get tier from price
  const priceId = subscription.items.data[0]?.price?.id;
  let tier = 'solo';
  if (priceId) {
    const tierInfo = getTierFromPriceId(priceId);
    if (tierInfo) tier = tierInfo.tier;
  }

  // Map Stripe status to our status
  const status = mapStripeStatus(subscription.status);

  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: tier,
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[Stripe Webhook] Failed to update subscription created:', error);
  }
}

/**
 * Handle customer.subscription.updated
 * This fires on upgrades, downgrades, status changes, etc.
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient
) {
  console.log('[Stripe Webhook] Subscription updated:', subscription.id);

  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Try to find user by subscription ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!profile) {
      console.log('[Stripe Webhook] Could not find user for subscription', subscription.id);
      return;
    }

    await updateUserSubscription(profile.id, subscription, supabase);
    return;
  }

  await updateUserSubscription(userId, subscription, supabase);
}

/**
 * Handle customer.subscription.deleted
 * Subscription canceled or expired
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient
) {
  console.log('[Stripe Webhook] Subscription deleted:', subscription.id);

  // Find user by subscription ID
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!profile) {
    console.log('[Stripe Webhook] Could not find user for deleted subscription');
    return;
  }

  // Downgrade to free tier
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: 'free',
      subscription_status: 'cancelled' as DbSubscriptionStatus,
      stripe_subscription_id: null,
      trial_ends_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  if (error) {
    console.error('[Stripe Webhook] Failed to downgrade user:', error);
    throw error;
  }

  console.log(`[Stripe Webhook] User ${profile.id} downgraded to free tier`);
}

/**
 * Handle invoice.paid
 * Successful recurring payment
 */
async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  supabase: SupabaseClient
) {
  console.log('[Stripe Webhook] Invoice paid:', invoice.id);

  // Get subscription ID - cast to any because newer Stripe types may vary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;
  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id;

  if (!subscriptionId) return;

  // Find user by subscription
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!profile) {
    console.log('[Stripe Webhook] Could not find user for invoice');
    return;
  }

  // Ensure subscription is active
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'active' as DbSubscriptionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  if (error) {
    console.error('[Stripe Webhook] Failed to update after invoice paid:', error);
  }
}

/**
 * Handle invoice.payment_failed
 * Failed recurring payment - subscription may become past_due
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: SupabaseClient
) {
  console.log('[Stripe Webhook] Payment failed:', invoice.id);

  // Get subscription ID - cast to any because newer Stripe types may vary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any;
  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id;

  if (!subscriptionId) return;

  // Find user by subscription
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!profile) {
    console.log('[Stripe Webhook] Could not find user for failed invoice');
    return;
  }

  // Mark as past_due (Stripe will retry)
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'past_due' as DbSubscriptionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  if (error) {
    console.error('[Stripe Webhook] Failed to update after payment failed:', error);
  }

  // TODO: Send email notification about failed payment
  console.log(`[Stripe Webhook] User ${profile.id} has past_due subscription`);
}

/**
 * Helper: Update user subscription from Stripe subscription object
 */
async function updateUserSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  supabase: SupabaseClient
) {
  const priceId = subscription.items.data[0]?.price?.id;
  let tier = 'solo';
  if (priceId) {
    const tierInfo = getTierFromPriceId(priceId);
    if (tierInfo) tier = tierInfo.tier;
  }

  const status = mapStripeStatus(subscription.status);

  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: tier,
      subscription_status: status,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[Stripe Webhook] Failed to update subscription:', error);
    throw error;
  }

  console.log(`[Stripe Webhook] User ${userId} updated to ${tier} (${status})`);
}

/**
 * Helper: Map Stripe subscription status to our database status
 * DB CHECK constraint: ('active', 'past_due', 'cancelled', 'trialing')
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): DbSubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, DbSubscriptionStatus> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    incomplete: 'past_due',
    incomplete_expired: 'cancelled',
    paused: 'past_due',
  };
  return statusMap[stripeStatus] || 'active';
}
