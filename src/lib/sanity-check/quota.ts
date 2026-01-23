/**
 * Sanity Check Quota Service
 *
 * Enforces per-user and per-guest quotas for sanity checks.
 * Tracks usage in the usage_tracking table.
 *
 * @see architecture.md Section 13 - Sanity Checks
 */

import { createServiceClient } from '@/lib/supabase/service';

/**
 * Subscription tier quotas for sanity checks per month.
 */
export const TIER_QUOTAS: Record<string, number> = {
  free: 3,
  solo: 10,
  growth: 30,
  pro: 100,
  enterprise: 500,
};

/**
 * Guest session limit (total checks, not per month).
 */
export const GUEST_LIMIT = 3;

/**
 * Rate limit: minimum seconds between sanity checks.
 */
export const RATE_LIMIT_SECONDS = 60;

export interface QuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  isExceeded: boolean;
  resetAt?: string; // ISO date for next month
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  status: QuotaStatus;
  upgradePrompt?: string;
}

/**
 * Get current month string in YYYY-MM format.
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get next month's first day for reset date.
 */
function getNextMonthReset(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
}

/**
 * Check and enforce quota for an authenticated user.
 */
export async function checkUserQuota(userId: string): Promise<QuotaCheckResult> {
  const supabase = createServiceClient();
  const month = getCurrentMonth();

  // Get user's subscription tier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (supabase as any)
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return {
      allowed: false,
      reason: 'Unable to verify subscription',
      status: { used: 0, limit: 0, remaining: 0, isExceeded: true },
    };
  }

  const tier = profile.subscription_tier || 'free';
  const limit = TIER_QUOTAS[tier] ?? TIER_QUOTAS.free ?? 3;

  // Get or create usage tracking record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usageResult = await (supabase as any)
    .from('usage_tracking')
    .select('sanity_checks_used')
    .eq('user_id', userId)
    .eq('month', month)
    .single();

  let usageData = usageResult.data;

  // Create record if doesn't exist
  if (usageResult.error && usageResult.error.code === 'PGRST116') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUsage } = await (supabase as any)
      .from('usage_tracking')
      .insert({
        user_id: userId,
        month,
        sanity_checks_used: 0,
      })
      .select('sanity_checks_used')
      .single();
    usageData = newUsage;
  }

  const used = usageData?.sanity_checks_used || 0;
  const remaining = Math.max(0, limit - used);
  const isExceeded = used >= limit;

  const status: QuotaStatus = {
    used,
    limit,
    remaining,
    isExceeded,
    resetAt: getNextMonthReset(),
  };

  if (isExceeded) {
    return {
      allowed: false,
      reason: `Monthly sanity check limit reached (${limit} checks)`,
      status,
      upgradePrompt: tier === 'free'
        ? 'Upgrade to Solo for 10 monthly checks'
        : tier === 'solo'
          ? 'Upgrade to Growth for 30 monthly checks'
          : tier === 'growth'
            ? 'Upgrade to Pro for 100 monthly checks'
            : undefined,
    };
  }

  return {
    allowed: true,
    status,
  };
}

/**
 * Increment sanity check usage for an authenticated user.
 * Updates or inserts usage record.
 */
export async function incrementUsage(userId: string): Promise<void> {
  const supabase = createServiceClient();
  const month = getCurrentMonth();

  // Try to update existing record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('usage_tracking')
    .select('id, sanity_checks_used')
    .eq('user_id', userId)
    .eq('month', month)
    .single();

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('usage_tracking')
      .update({ sanity_checks_used: (existing.sanity_checks_used || 0) + 1 })
      .eq('id', existing.id);
  } else {
    // Insert new record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('usage_tracking')
      .insert({
        user_id: userId,
        month,
        sanity_checks_used: 1,
      });
  }
}

/**
 * Check quota for a guest session.
 */
export async function checkGuestQuota(guestSessionId: string): Promise<QuotaCheckResult> {
  const supabase = createServiceClient();

  // Count sanity checks for this guest session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from('sanity_checks')
    .select('id', { count: 'exact', head: true })
    .eq('guest_session_id', guestSessionId)
    .eq('is_guest', true);

  if (error) {
    console.error('Error checking guest quota:', error);
    // Allow on error (fail open for guests)
    return {
      allowed: true,
      status: { used: 0, limit: GUEST_LIMIT, remaining: GUEST_LIMIT, isExceeded: false },
    };
  }

  const used = count || 0;
  const remaining = Math.max(0, GUEST_LIMIT - used);
  const isExceeded = used >= GUEST_LIMIT;

  const status: QuotaStatus = {
    used,
    limit: GUEST_LIMIT,
    remaining,
    isExceeded,
  };

  if (isExceeded) {
    return {
      allowed: false,
      reason: `Guest limit reached (${GUEST_LIMIT} checks). Sign up for more!`,
      status,
      upgradePrompt: 'Create a free account to get 3 more checks per month',
    };
  }

  return {
    allowed: true,
    status,
  };
}

/**
 * Check rate limit for a user or IP.
 * Returns true if allowed, false if rate limited.
 */
export async function checkRateLimit(
  identifier: string,
  isGuest: boolean
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = createServiceClient();

  // Check for recent sanity checks from this user/session
  const since = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('sanity_checks')
    .select('created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1);

  if (isGuest) {
    query = query.eq('guest_session_id', identifier);
  } else {
    query = query.eq('user_id', identifier);
  }

  const { data, error } = await query;

  if (error) {
    // Fail open on error
    return { allowed: true };
  }

  if (data && data.length > 0) {
    const lastCheck = new Date(data[0].created_at);
    const elapsed = (Date.now() - lastCheck.getTime()) / 1000;
    const retryAfter = Math.ceil(RATE_LIMIT_SECONDS - elapsed);

    if (retryAfter > 0) {
      return { allowed: false, retryAfter };
    }
  }

  return { allowed: true };
}

/**
 * Get quota status for display in UI.
 */
export async function getQuotaStatus(
  userId?: string,
  guestSessionId?: string
): Promise<QuotaStatus | null> {
  if (userId) {
    const result = await checkUserQuota(userId);
    return result.status;
  }

  if (guestSessionId) {
    const result = await checkGuestQuota(guestSessionId);
    return result.status;
  }

  return null;
}
