import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/stripe/client';

// POST /api/billing/portal - Create Stripe Customer Portal session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 400 }
      );
    }

    // Build return URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${origin}/dashboard/settings`;

    // Create portal session
    const session = await createPortalSession({
      customerId: profile.stripe_customer_id,
      returnUrl,
    });

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
