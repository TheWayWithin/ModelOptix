/**
 * Admin Opportunity Generation API
 *
 * Allows admins to manually trigger opportunity generation.
 * POST /api/admin/opportunities/generate
 *
 * Returns: { success: boolean, result: GenerateOpportunitiesResult }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAllOpportunities } from '@/lib/recommendations/opportunity-generator';

/**
 * POST /api/admin/opportunities/generate
 *
 * Manually trigger opportunity generation for all active use cases.
 */
export async function POST() {
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

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log(`[AdminOpportunities] Admin ${user.email} triggered opportunity generation`);

    const startTime = Date.now();
    const result = await generateAllOpportunities();
    const duration = Date.now() - startTime;

    console.log(
      `[AdminOpportunities] Generation completed in ${(duration / 1000).toFixed(2)}s: ` +
        `${result.processed} use cases, ${result.opportunitiesCreated} opportunities`
    );

    return NextResponse.json({
      success: result.errors.length === 0,
      result: {
        processed: result.processed,
        opportunitiesCreated: result.opportunitiesCreated,
        errors: result.errors,
        duration,
      },
    });
  } catch (error) {
    console.error('[AdminOpportunities] API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
