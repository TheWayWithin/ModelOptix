import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createTrialCheckoutSession } from '@/lib/stripe/client';
import type { SubscriptionTier, BillingInterval } from '@/lib/stripe';

interface CheckoutRequest {
  tier: SubscriptionTier;
  interval: BillingInterval;
  trial?: boolean;
}

// POST /api/checkout - Create Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to subscribe' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CheckoutRequest = await request.json();
    const { tier, interval, trial } = body;

    // Validate tier
    if (!tier || !['solo', 'growth', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be solo, growth, or pro.' },
        { status: 400 }
      );
    }

    // Validate interval
    if (!interval || !['monthly', 'annual'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be monthly or annual.' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
      return NextResponse.json(
        { error: 'You already have an active subscription. Use the billing portal to manage it.' },
        { status: 400 }
      );
    }

    // Build success/cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${origin}/api/checkout/success`;
    const cancelUrl = `${origin}/pricing?canceled=true`;

    // Create checkout session
    let session;

    if (trial) {
      // Trial flow (7-day, card upfront)
      session = await createTrialCheckoutSession(
        user.id,
        user.email!,
        successUrl,
        cancelUrl,
        tier
      );
    } else {
      // Direct purchase flow
      session = await createCheckoutSession({
        userId: user.id,
        email: user.email!,
        tier,
        interval,
        successUrl,
        cancelUrl,
        applyFirstYearCoupon: interval === 'annual', // Auto-apply 20% off for annual
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
