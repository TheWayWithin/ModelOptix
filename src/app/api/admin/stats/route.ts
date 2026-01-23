import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export interface AdminStats {
  users: {
    total: number;
    byTier: {
      free: number;
      solo: number;
      growth: number;
      pro: number;
    };
    newThisWeek: number;
    admins: number;
  };
  content: {
    products: number;
    functions: number;
    useCases: number;
  };
  opportunities: {
    active: number;
    accepted: number;
    dismissed: number;
    totalSavings: number;
  };
  sanityChecks: {
    today: number;
    thisWeek: number;
    total: number;
    guestChecks: number;
  };
  catalog: {
    models: number;
    providers: number;
    trustScores: number;
  };
  jobs: {
    running: number;
    failed: number;
    recentRuns: Array<{
      id: string;
      job_name: string;
      status: string;
      started_at: string;
      completed_at: string | null;
    }>;
  };
  overrides: {
    active: number;
  };
}

/**
 * GET /api/admin/stats
 *
 * Platform-wide statistics for admin dashboard.
 * Requires admin privileges.
 */
export async function GET() {
  try {
    // Verify admin access
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check is_admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Use service client for aggregate queries (bypasses RLS)
    const serviceClient = createServiceClient();

    // Calculate date boundaries
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Fetch all stats in parallel
    const [
      usersResult,
      usersByTierResult,
      newUsersResult,
      adminsResult,
      productsResult,
      functionsResult,
      useCasesResult,
      activeOppsResult,
      acceptedOppsResult,
      dismissedOppsResult,
      savingsResult,
      sanityTodayResult,
      sanityWeekResult,
      sanityTotalResult,
      guestSanityResult,
      modelsResult,
      providersResult,
      trustScoresResult,
      runningJobsResult,
      failedJobsResult,
      recentJobsResult,
      overridesResult,
    ] = await Promise.all([
      // User counts
      serviceClient.from('user_profiles').select('id', { count: 'exact', head: true }),
      serviceClient.from('user_profiles').select('subscription_tier'),
      serviceClient
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString()),
      serviceClient
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_admin', true),

      // Content counts
      serviceClient.from('products').select('id', { count: 'exact', head: true }),
      serviceClient.from('functions').select('id', { count: 'exact', head: true }),
      serviceClient.from('use_cases').select('id', { count: 'exact', head: true }),

      // Opportunity counts
      serviceClient
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      serviceClient
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted'),
      serviceClient
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'dismissed'),
      serviceClient.from('savings_records').select('monthly_savings'),

      // Sanity check counts
      serviceClient
        .from('sanity_checks')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString()),
      serviceClient
        .from('sanity_checks')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString()),
      serviceClient.from('sanity_checks').select('id', { count: 'exact', head: true }),
      serviceClient
        .from('sanity_checks')
        .select('id', { count: 'exact', head: true })
        .eq('is_guest', true),

      // Catalog counts
      serviceClient.from('models').select('id', { count: 'exact', head: true }),
      serviceClient.from('providers').select('id', { count: 'exact', head: true }),
      serviceClient.from('model_trust_scores').select('id', { count: 'exact', head: true }),

      // Job stats
      serviceClient
        .from('job_runs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'running'),
      serviceClient
        .from('job_runs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('started_at', startOfWeek.toISOString()),
      serviceClient
        .from('job_runs')
        .select('id, job_name, status, started_at, completed_at')
        .order('started_at', { ascending: false })
        .limit(5),

      // Editorial overrides
      serviceClient
        .from('editorial_overrides')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
    ]);

    // Calculate tier breakdown
    const tierCounts = { free: 0, solo: 0, growth: 0, pro: 0 };
    if (usersByTierResult.data) {
      usersByTierResult.data.forEach((u: { subscription_tier: string }) => {
        const tier = u.subscription_tier as keyof typeof tierCounts;
        if (tier in tierCounts) {
          tierCounts[tier]++;
        }
      });
    }

    // Calculate total savings
    const totalSavings =
      savingsResult.data?.reduce(
        (sum: number, r: { monthly_savings: number }) => sum + Number(r.monthly_savings || 0),
        0
      ) || 0;

    const stats: AdminStats = {
      users: {
        total: usersResult.count || 0,
        byTier: tierCounts,
        newThisWeek: newUsersResult.count || 0,
        admins: adminsResult.count || 0,
      },
      content: {
        products: productsResult.count || 0,
        functions: functionsResult.count || 0,
        useCases: useCasesResult.count || 0,
      },
      opportunities: {
        active: activeOppsResult.count || 0,
        accepted: acceptedOppsResult.count || 0,
        dismissed: dismissedOppsResult.count || 0,
        totalSavings,
      },
      sanityChecks: {
        today: sanityTodayResult.count || 0,
        thisWeek: sanityWeekResult.count || 0,
        total: sanityTotalResult.count || 0,
        guestChecks: guestSanityResult.count || 0,
      },
      catalog: {
        models: modelsResult.count || 0,
        providers: providersResult.count || 0,
        trustScores: trustScoresResult.count || 0,
      },
      jobs: {
        running: runningJobsResult.count || 0,
        failed: failedJobsResult.count || 0,
        recentRuns: recentJobsResult.data || [],
      },
      overrides: {
        active: overridesResult.count || 0,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
