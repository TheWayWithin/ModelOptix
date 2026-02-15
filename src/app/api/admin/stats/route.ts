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
 * 
 * Performance: Uses get_admin_stats() Postgres function for single round-trip.
 * (Previously made 22 separate queries)
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

    // Use service client to call the stats function (bypasses RLS)
    const serviceClient = createServiceClient();
    
    // Single database call instead of 22 queries
    const { data, error } = await serviceClient.rpc('get_admin_stats');
    
    if (error) {
      console.error('Admin stats function error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // The function returns the stats in the correct shape
    const stats: AdminStats = data as AdminStats;

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
