/**
 * Pricing Sync Job
 *
 * Syncs model pricing data from OpenRouter API to model_provider_pricing table.
 * Scheduled to run daily at 3am UTC.
 *
 * This job updates existing pricing records that were created by the model catalog sync.
 * It ensures pricing stays current between full catalog syncs.
 */

import { createServiceClient } from '@/lib/supabase/service';
import { fetchOpenRouterModels, parseOpenRouterModel } from '@/lib/openrouter';

interface SyncPricingStats {
  modelsProcessed: number;
  pricingUpdated: number;
  errors: string[];
}

export interface SyncPricingResult {
  success: boolean;
  stats: SyncPricingStats;
  duration: number;
}

/**
 * Main pricing sync function
 */
export async function syncPricing(): Promise<SyncPricingResult> {
  console.log('[PricingSync] Starting pricing sync...');
  const startTime = Date.now();

  const stats: SyncPricingStats = {
    modelsProcessed: 0,
    pricingUpdated: 0,
    errors: [],
  };

  try {
    // Fetch latest pricing from OpenRouter
    const openRouterModels = await fetchOpenRouterModels();
    console.log(
      `[PricingSync] Fetched ${openRouterModels.length} models from OpenRouter`
    );

    if (openRouterModels.length === 0) {
      console.warn('[PricingSync] No models returned from OpenRouter');
      return {
        success: true,
        stats,
        duration: Date.now() - startTime,
      };
    }

    const supabase = createServiceClient();

    // Get all models from our database with their pricing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbModels, error: fetchError } = await (supabase as any)
      .from('models')
      .select('id, openrouter_id');

    if (fetchError) {
      throw new Error(`Failed to fetch models: ${fetchError.message}`);
    }

    // Create lookup map by openrouter_id
    const modelMap = new Map<string, string>();
    for (const model of dbModels ?? []) {
      if (model.openrouter_id) {
        modelMap.set(model.openrouter_id, model.id);
      }
    }

    console.log(`[PricingSync] Found ${modelMap.size} models in database`);

    // Process each OpenRouter model
    for (const orModel of openRouterModels) {
      const modelId = modelMap.get(orModel.id);
      if (!modelId) {
        // Model not in our catalog yet, skip (will be added by catalog sync)
        continue;
      }

      stats.modelsProcessed++;

      try {
        // Parse pricing from OpenRouter model
        const parsed = parseOpenRouterModel(orModel);

        // Update pricing in model_provider_pricing table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('model_provider_pricing')
          .update({
            input_price: parsed.inputPrice,
            output_price: parsed.outputPrice,
            last_synced_at: new Date().toISOString(),
            metadata: {
              source: 'openrouter_pricing_sync',
              synced_at: new Date().toISOString(),
            },
          })
          .eq('model_id', modelId);

        if (updateError) {
          stats.errors.push(
            `Failed to update pricing for ${orModel.id}: ${updateError.message}`
          );
        } else {
          stats.pricingUpdated++;
        }
      } catch (error) {
        const errorMsg = `Error processing ${orModel.id}: ${error}`;
        console.error(`[PricingSync] ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[PricingSync] Sync completed in ${(duration / 1000).toFixed(2)}s`
    );
    console.log(`[PricingSync] Stats:`, {
      modelsProcessed: stats.modelsProcessed,
      pricingUpdated: stats.pricingUpdated,
      errorCount: stats.errors.length,
    });

    return {
      success: stats.errors.length === 0,
      stats,
      duration,
    };
  } catch (error) {
    console.error('[PricingSync] Fatal error during sync:', error);
    stats.errors.push(`Fatal error: ${error}`);
    return {
      success: false,
      stats,
      duration: Date.now() - startTime,
    };
  }
}
