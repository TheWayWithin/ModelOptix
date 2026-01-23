import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getQuotaStatus, checkRateLimit, TIER_QUOTAS, GUEST_LIMIT } from '@/lib/sanity-check/quota';

/**
 * GET /api/sanity-checks/quota
 *
 * Get current quota status for the authenticated user or guest.
 *
 * Query params:
 * - guestSessionId?: string - For guest users
 *
 * @see architecture.md Section 13 - Sanity Checks
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const guestSessionId = searchParams.get('guestSessionId');

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Determine if guest or authenticated
    const isGuest = !user && !!guestSessionId;

    if (!user && !guestSessionId) {
      // Return default guest quota info
      return NextResponse.json({
        isAuthenticated: false,
        status: {
          used: 0,
          limit: GUEST_LIMIT,
          remaining: GUEST_LIMIT,
          isExceeded: false,
        },
        tierLimits: TIER_QUOTAS,
      });
    }

    // Get quota status
    const status = await getQuotaStatus(user?.id, guestSessionId || undefined);

    if (!status) {
      return NextResponse.json(
        { error: 'Unable to determine quota status' },
        { status: 500 }
      );
    }

    // Get rate limit status
    const identifier = isGuest ? guestSessionId! : user!.id;
    const rateLimitResult = await checkRateLimit(identifier, isGuest);

    return NextResponse.json({
      isAuthenticated: !!user,
      isGuest,
      status,
      rateLimit: {
        allowed: rateLimitResult.allowed,
        retryAfter: rateLimitResult.retryAfter || 0,
      },
      tierLimits: user ? TIER_QUOTAS : { guest: GUEST_LIMIT },
    });
  } catch (error) {
    console.error('Error fetching quota status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quota status' },
      { status: 500 }
    );
  }
}
