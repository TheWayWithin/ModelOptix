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
 * Normalize benchmark data from AA API to our schema
 */
function normalizeBenchmarks(aaModel: AAModelResponse): NormalizedBenchmarks {
  return {
    source: 'artificial_analysis',
    fetched_at: new Date().toISOString(),

    // Quality scores
    quality_index: aaModel.quality_index,
    quality_elo: aaModel.quality_elo,

    // Speed metrics
    speed_index: aaModel.speed_index,
    tokens_per_second: aaModel.tokens_per_second,
    time_to_first_token_ms: aaModel.time_to_first_token_ms,
    latency_ms: aaModel.latency_ms,

    // Capabilities
    context_length: aaModel.context_length,
    max_output_tokens: aaModel.max_output_tokens,
    supports_vision: aaModel.supports_vision,
    supports_function_calling: aaModel.supports_function_calling,
    supports_streaming: aaModel.supports_streaming,

    // Raw reference
    raw_id: aaModel.id,
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
 * First by model_id (if matches openrouter format), then by fuzzy name matching
 */
function findMatchingModel(
  aaModel: AAModelResponse,
  dbModels: Array<{ id: string; openrouter_id: string | null; name: string }>
): { id: string; name: string } | null {
  // Try exact match by model_id (if AA provides it and it matches openrouter format)
  if (aaModel.model_id) {
    const exactMatch = dbModels.find((m) => m.openrouter_id === aaModel.model_id);
    if (exactMatch) return { id: exactMatch.id, name: exactMatch.name };
  }

  // Try matching by provider/name combination
  const aaProvider = aaModel.provider?.toLowerCase();
  const aaName = normalizeModelName(aaModel.name);

  for (const dbModel of dbModels) {
    // Check if openrouter_id contains the provider and name pattern
    if (dbModel.openrouter_id) {
      const orId = dbModel.openrouter_id.toLowerCase();
      if (aaProvider && orId.startsWith(aaProvider + '/')) {
        const orModelPart = orId.split('/').slice(1).join('/');
        const normalizedOrModel = normalizeModelName(orModelPart);

        // Check for significant overlap
        if (
          normalizedOrModel === aaName ||
          normalizedOrModel.includes(aaName) ||
          aaName.includes(normalizedOrModel)
        ) {
          return { id: dbModel.id, name: dbModel.name };
        }
      }
    }

    // Fallback: fuzzy name matching
    const normalizedDBName = normalizeModelName(dbModel.name);
    if (normalizedDBName === aaName) {
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
            // Also update latency fields if we have them
            ...(aaModel.latency_ms && { latency_p50: Math.round(aaModel.latency_ms) }),
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
