import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession } from '@/lib/stripe/client';
import { getTierFromPriceId } from '@/lib/stripe';
import type Stripe from 'stripe';

// GET /api/checkout/success - Handle successful checkout redirect
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      // No session ID - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Retrieve the checkout session from Stripe
    const session = await getCheckoutSession(sessionId);

    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      // Payment not completed - redirect to pricing with error
      return NextResponse.redirect(new URL('/pricing?error=payment_incomplete', request.url));
    }

    // Get the user ID from session metadata
    const userId = session.client_reference_id || session.metadata?.userId;

    if (!userId) {
      console.error('No user ID in checkout session:', sessionId);
      return NextResponse.redirect(new URL('/dashboard?subscription=success', request.url));
    }

    // Determine the tier from the subscription
    let tier = 'solo'; // default
    if (session.subscription && typeof session.subscription === 'object') {
      const subscription = session.subscription;
      const priceId = (subscription as Stripe.Subscription).items?.data?.[0]?.price?.id;
      if (priceId) {
        const tierInfo = getTierFromPriceId(priceId);
        if (tierInfo) {
          tier = tierInfo.tier;
        }
      }
    }

    // Get Stripe customer ID
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

    // Update user profile with subscription info
    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: tier,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user profile:', updateError);
      // Still redirect to dashboard - webhook will handle it
    }

    // Redirect to dashboard with success message
    return NextResponse.redirect(new URL('/dashboard?subscription=success', request.url));

  } catch (error) {
    console.error('Checkout success error:', error);
    // Redirect to dashboard anyway - webhook will handle subscription
    return NextResponse.redirect(new URL('/dashboard?subscription=pending', request.url));
  }
}
