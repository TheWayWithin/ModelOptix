/**
 * Admin Sync API
 *
 * Allows admins to manually trigger data sync jobs.
 * POST /api/admin/sync
 *
 * Request body: { job: 'model-catalog' | 'pricing' | 'benchmarks' | 'all' }
 * Returns: { success: boolean, job: string, result: object }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  syncModelCatalog,
  syncPricing,
  syncBenchmarks,
  type SyncModelCatalogResult,
  type SyncPricingResult,
  type SyncBenchmarksResult,
} from '@/lib/jobs';

type JobType = 'model-catalog' | 'pricing' | 'benchmarks' | 'all';

interface SyncResponse {
  success: boolean;
  job: JobType;
  results: {
    modelCatalog?: SyncModelCatalogResult;
    pricing?: SyncPricingResult;
    benchmarks?: SyncBenchmarksResult;
  };
  totalDuration: number;
}

/**
 * GET /api/admin/sync
 *
 * Returns sync status information including last sync times.
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

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get sync status from database
    const serviceClient = createServiceClient();

    const [modelsSync, pricingSync, benchmarksSync, modelCount] = await Promise.all([
      // Last model sync time
      serviceClient
        .from('models')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Last pricing sync time (exclude NULLs - they sort first in DESC)
      serviceClient
        .from('model_provider_pricing')
        .select('last_synced_at')
        .not('last_synced_at', 'is', null)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Last benchmark sync time (from benchmarks JSONB)
      serviceClient
        .from('models')
        .select('benchmarks')
        .not('benchmarks', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Total model count
      serviceClient.from('models').select('id', { count: 'exact', head: true }),
    ]);

    // Extract fetched_at from benchmarks JSONB
    let lastBenchmarkSync: string | null = null;
    const benchmarksData = benchmarksSync.data as { benchmarks?: { fetched_at?: string } } | null;
    if (benchmarksData?.benchmarks?.fetched_at) {
      lastBenchmarkSync = benchmarksData.benchmarks.fetched_at;
    }

    const modelsSyncData = modelsSync.data as { updated_at?: string } | null;
    const pricingSyncData = pricingSync.data as { last_synced_at?: string } | null;

    return NextResponse.json({
      status: {
        modelCatalog: {
          lastSync: modelsSyncData?.updated_at || null,
          modelCount: modelCount.count || 0,
        },
        pricing: {
          lastSync: pricingSyncData?.last_synced_at || null,
        },
        benchmarks: {
          lastSync: lastBenchmarkSync,
        },
      },
      openrouterConfigured: !!process.env.OPENROUTER_API_KEY,
    });
  } catch (error) {
    console.error('Admin sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sync
 *
 * Triggers a sync job manually.
 * Body: { job: 'model-catalog' | 'pricing' | 'benchmarks' | 'all' }
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const job = body.job as JobType;

    if (!job || !['model-catalog', 'pricing', 'benchmarks', 'all'].includes(job)) {
      return NextResponse.json(
        { error: 'Invalid job type. Must be: model-catalog, pricing, benchmarks, or all' },
        { status: 400 }
      );
    }

    // Check if OpenRouter is configured
    if (!process.env.OPENROUTER_API_KEY && (job === 'model-catalog' || job === 'pricing' || job === 'all')) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured. Cannot run model or pricing sync.' },
        { status: 400 }
      );
    }

    console.log(`[AdminSync] Admin ${user.email} triggered ${job} sync`);

    const startTime = Date.now();
    const response: SyncResponse = {
      success: true,
      job,
      results: {},
      totalDuration: 0,
    };

    // Run the requested job(s)
    if (job === 'model-catalog' || job === 'all') {
      console.log('[AdminSync] Running model catalog sync...');
      const result = await syncModelCatalog();
      response.results.modelCatalog = result;
      if (!result.success) {
        response.success = false;
      }
    }

    if (job === 'pricing' || job === 'all') {
      console.log('[AdminSync] Running pricing sync...');
      const result = await syncPricing();
      response.results.pricing = result;
      if (!result.success) {
        response.success = false;
      }
    }

    if (job === 'benchmarks' || job === 'all') {
      console.log('[AdminSync] Running benchmarks sync...');
      const result = await syncBenchmarks();
      response.results.benchmarks = result;
      if (!result.success) {
        response.success = false;
      }
    }

    response.totalDuration = Date.now() - startTime;

    console.log(
      `[AdminSync] Sync completed in ${(response.totalDuration / 1000).toFixed(2)}s, success: ${response.success}`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin sync API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
