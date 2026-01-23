// Stripe client for ModelOptix

import Stripe from 'stripe';
import { stripeConfig, stripePriceIds, trialConfig, getTierFromPriceId } from './config';
import type {
  CheckoutSessionParams,
  PortalSessionParams,
  SubscriptionStatus,
  SubscriptionTier,
  BillingInterval
} from './types';

// Initialize Stripe client (server-side only)
export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

/**
 * Create a Stripe Checkout session for new subscriptions
 */
export async function createCheckoutSession(params: CheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const { userId, email, tier, interval, successUrl, cancelUrl, trialDays, applyFirstYearCoupon } = params;

  const priceId = stripePriceIds[tier][interval];
  if (!priceId) {
    throw new Error(`No price ID configured for tier "${tier}" with interval "${interval}"`);
  }

  // Build checkout session params
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tier,
      interval,
    },
    subscription_data: {
      metadata: {
        userId,
        tier,
      },
    },
    allow_promotion_codes: true, // Allow users to enter promo codes
  };

  // Apply 20% first year coupon for annual subscriptions (priority 1 signup path)
  if (interval === 'annual' && applyFirstYearCoupon !== false) {
    sessionParams.discounts = [
      {
        coupon: stripeConfig.couponFirstYear,
      },
    ];
  }

  // Add trial period if requested (priority 3 signup path - fallback)
  if (trialDays && trialDays > 0) {
    sessionParams.subscription_data!.trial_period_days = trialDays;
  }

  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Create a Stripe Customer Portal session for subscription management
 */
export async function createPortalSession(params: PortalSessionParams): Promise<Stripe.BillingPortal.Session> {
  const { customerId, returnUrl } = params;

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Get or create Stripe customer for a user
 */
export async function getOrCreateCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  const existingCustomer = existingCustomers.data[0];
  if (existingCustomer) {
    // Update metadata if userId is missing
    if (existingCustomer.metadata?.userId !== userId) {
      return stripe.customers.update(existingCustomer.id, {
        metadata: { userId },
      });
    }
    return existingCustomer;
  }

  // Create new customer
  return stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });
}

/**
 * Get subscription status for a customer
 */
export async function getSubscriptionStatus(customerId: string): Promise<SubscriptionStatus | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 1,
    expand: ['data.items.data.price'],
  });

  const subscription = subscriptions.data[0];
  if (!subscription) {
    return null;
  }

  const priceId = subscription.items.data[0]?.price?.id;

  // Determine tier from price ID
  let tier: SubscriptionTier = 'free';
  if (priceId) {
    const tierInfo = getTierFromPriceId(priceId);
    if (tierInfo) {
      tier = tierInfo.tier;
    }
  }

  return {
    id: subscription.id,
    customerId: subscription.customer as string,
    tier,
    status: subscription.status as SubscriptionStatus['status'],
    currentPeriodStart: new Date((subscription as Stripe.Subscription & { current_period_start: number }).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  };
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a canceled subscription (before period end)
 */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription to a different tier
 */
export async function updateSubscriptionTier(
  subscriptionId: string,
  newTier: SubscriptionTier,
  interval: BillingInterval
): Promise<Stripe.Subscription> {
  const newPriceId = stripePriceIds[newTier][interval];
  if (!newPriceId) {
    throw new Error(`No price ID configured for tier "${newTier}" with interval "${interval}"`);
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentItemId = subscription.items.data[0]?.id;

  if (!currentItemId) {
    throw new Error('No subscription item found');
  }

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: currentItemId,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations', // Fair billing on plan changes
    metadata: {
      tier: newTier,
    },
  });
}

/**
 * Get customer's invoices
 */
export async function getCustomerInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });
  return invoices.data;
}

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  return paymentMethods.data;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, stripeConfig.webhookSecret);
}

/**
 * Get checkout session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  });
}

/**
 * Create trial checkout session (7-day trial, card upfront)
 */
export async function createTrialCheckoutSession(
  userId: string,
  email: string,
  successUrl: string,
  cancelUrl: string,
  tier: SubscriptionTier = trialConfig.defaultTier
): Promise<Stripe.Checkout.Session> {
  return createCheckoutSession({
    userId,
    email,
    tier,
    interval: 'monthly', // Trial defaults to monthly after conversion
    successUrl,
    cancelUrl,
    trialDays: trialConfig.durationDays,
    applyFirstYearCoupon: false, // No first-year discount for trial path
  });
}
