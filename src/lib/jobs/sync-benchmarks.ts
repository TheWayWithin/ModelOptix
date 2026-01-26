/**
 * Benchmark Sync Job
 *
 * Syncs benchmark data from Artificial Analysis API to models.benchmarks JSONB column.
 * Scheduled to run weekly on Sunday at 4am UTC.
 *
 * Artificial Analysis provides quality metrics, speed benchmarks, and other
 * performance data that helps users compare models beyond just pricing.
 */

import { createServiceClient } from '@/lib/supabase/service';
import {
  fetchAAModels,
  type AAModelResponse,
  type NormalizedBenchmarks,
} from '@/lib/artificial-analysis';

interface SyncBenchmarksStats {
  aaModelsReceived: number;
  modelsMatched: number;
  benchmarksUpdated: number;
  errors: string[];
}

export interface SyncBenchmarksResult {
  success: boolean;
  stats: SyncBenchmarksStats;
  duration: number;
}

/**
 * Normalize benchmark data from AA API v2 to our schema
 */
function normalizeBenchmarks(aaModel: AAModelResponse): NormalizedBenchmarks {
  return {
    source: 'artificial_analysis',
    fetched_at: new Date().toISOString(),

    // Intelligence scores from evaluations
    intelligence_index: aaModel.evaluations?.artificial_analysis_intelligence_index,
    coding_index: aaModel.evaluations?.artificial_analysis_coding_index,
    math_index: aaModel.evaluations?.artificial_analysis_math_index,

    // Individual benchmark scores
    mmlu_pro: aaModel.evaluations?.mmlu_pro,
    gpqa: aaModel.evaluations?.gpqa,
    livecodebench: aaModel.evaluations?.livecodebench,

    // Speed metrics
    tokens_per_second: aaModel.median_output_tokens_per_second,
    time_to_first_token_seconds: aaModel.median_time_to_first_token_seconds,

    // Pricing (per million tokens)
    input_price_per_million: aaModel.pricing?.price_1m_input_tokens,
    output_price_per_million: aaModel.pricing?.price_1m_output_tokens,

    // Provider info
    provider_name: aaModel.model_creator?.name,
    provider_slug: aaModel.model_creator?.slug,

    // Raw reference
    raw_id: aaModel.id,
    raw_slug: aaModel.slug,
  };
}

/**
 * Normalize model name for fuzzy matching
 * Removes version numbers, converts to lowercase, removes special chars
 */
function normalizeModelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_.]/g, ' ') // Replace separators with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/v?\d+(\.\d+)*$/i, '') // Remove trailing version numbers
    .trim();
}

/**
 * Try to match AA model to our database model
 * Uses provider slug and model slug/name for matching against openrouter_id
 */
function findMatchingModel(
  aaModel: AAModelResponse,
  dbModels: Array<{ id: string; openrouter_id: string | null; name: string }>
): { id: string; name: string } | null {
  // Get provider slug from model_creator (v2 API format)
  const aaProvider = aaModel.model_creator?.slug?.toLowerCase() || '';
  const aaSlug = aaModel.slug?.toLowerCase() || '';
  const aaName = normalizeModelName(aaModel.name);

  for (const dbModel of dbModels) {
    if (dbModel.openrouter_id) {
      const orId = dbModel.openrouter_id.toLowerCase();

      // Try direct slug match: openai/gpt-4o matches AA slug "gpt-4o" with provider "openai"
      if (aaProvider && aaSlug) {
        const expectedOrId = `${aaProvider}/${aaSlug}`;
        if (orId === expectedOrId || orId.includes(aaSlug)) {
          return { id: dbModel.id, name: dbModel.name };
        }
      }

      // Try matching by provider prefix and name similarity
      if (aaProvider && orId.startsWith(aaProvider + '/')) {
        const orModelPart = orId.split('/').slice(1).join('/');
        const normalizedOrModel = normalizeModelName(orModelPart);

        // Check for significant overlap
        if (
          normalizedOrModel === aaName ||
          normalizedOrModel === aaSlug ||
          normalizedOrModel.includes(aaSlug) ||
          aaSlug.includes(normalizedOrModel) ||
          normalizedOrModel.includes(aaName) ||
          aaName.includes(normalizedOrModel)
        ) {
          return { id: dbModel.id, name: dbModel.name };
        }
      }
    }

    // Fallback: fuzzy name matching
    const normalizedDBName = normalizeModelName(dbModel.name);
    if (normalizedDBName === aaName || normalizedDBName === aaSlug) {
      return { id: dbModel.id, name: dbModel.name };
    }
  }

  return null;
}

/**
 * Main benchmark sync function
 */
export async function syncBenchmarks(): Promise<SyncBenchmarksResult> {
  console.log('[BenchmarkSync] Starting benchmark sync...');
  const startTime = Date.now();

  const stats: SyncBenchmarksStats = {
    aaModelsReceived: 0,
    modelsMatched: 0,
    benchmarksUpdated: 0,
    errors: [],
  };

  try {
    // Fetch benchmark data from Artificial Analysis
    const aaModels = await fetchAAModels();
    stats.aaModelsReceived = aaModels.length;
    console.log(
      `[BenchmarkSync] Fetched ${aaModels.length} models from Artificial Analysis`
    );

    if (aaModels.length === 0) {
      console.warn('[BenchmarkSync] No models returned from Artificial Analysis');
      return {
        success: true,
        stats,
        duration: Date.now() - startTime,
      };
    }

    const supabase = createServiceClient();

    // Get all models from our database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbModels, error: fetchError } = await (supabase as any)
      .from('models')
      .select('id, openrouter_id, name');

    if (fetchError) {
      throw new Error(`Failed to fetch models: ${fetchError.message}`);
    }

    console.log(`[BenchmarkSync] Found ${dbModels?.length ?? 0} models in database`);

    // Process each AA model
    for (const aaModel of aaModels) {
      const dbModel = findMatchingModel(aaModel, dbModels ?? []);

      if (!dbModel) {
        // No matching model in our database, skip
        continue;
      }

      stats.modelsMatched++;

      try {
        const benchmarks = normalizeBenchmarks(aaModel);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('models')
          .update({
            benchmarks,
            // Also update latency fields if we have them (convert seconds to ms)
            ...(aaModel.median_time_to_first_token_seconds && {
              latency_p50: Math.round(aaModel.median_time_to_first_token_seconds * 1000),
            }),
          })
          .eq('id', dbModel.id);

        if (updateError) {
          stats.errors.push(
            `Failed to update benchmarks for ${dbModel.name}: ${updateError.message}`
          );
        } else {
          stats.benchmarksUpdated++;
        }
      } catch (error) {
        const errorMsg = `Error processing ${aaModel.name}: ${error}`;
        console.error(`[BenchmarkSync] ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[BenchmarkSync] Sync completed in ${(duration / 1000).toFixed(2)}s`
    );
    console.log(`[BenchmarkSync] Stats:`, {
      aaModelsReceived: stats.aaModelsReceived,
      modelsMatched: stats.modelsMatched,
      benchmarksUpdated: stats.benchmarksUpdated,
      errorCount: stats.errors.length,
    });

    if (stats.errors.length > 0) {
      console.warn(
        `[BenchmarkSync] Encountered ${stats.errors.length} errors during sync`
      );
    }

    return {
      success: stats.errors.length === 0,
      stats,
      duration,
    };
  } catch (error) {
    console.error('[BenchmarkSync] Fatal error during sync:', error);
    stats.errors.push(`Fatal error: ${error}`);
    return {
      success: false,
      stats,
      duration: Date.now() - startTime,
    };
  }
}
