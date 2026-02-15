/**
 * Model Catalog Sync Job
 *
 * Syncs AI model catalog from OpenRouter API to the local database.
 * Runs daily at 2am UTC to keep model information up-to-date.
 *
 * - Fetches all models from OpenRouter API
 * - Upserts providers (creates new ones with 'unknown' trust tier)
 * - Upserts models using openrouter_id as unique key
 * - Upserts pricing into model_provider_pricing table
 */

import { createServiceClient } from '@/lib/supabase/service';
import {
  fetchOpenRouterModels,
  parseOpenRouterModel,
  isOpenRouterConfigured,
  ParsedModelData,
} from '@/lib/openrouter';

interface SyncStats {
  providersCreated: number;
  providersUpdated: number;
  modelsCreated: number;
  modelsUpdated: number;
  pricingRecordsUpserted: number;
  errors: string[];
}

export interface SyncModelCatalogResult {
  success: boolean;
  stats: SyncStats;
  duration: number;
}

/**
 * Main sync function - orchestrates the full sync process
 */
export async function syncModelCatalog(): Promise<SyncModelCatalogResult> {
  console.log('[ModelCatalogSync] Starting model catalog sync...');
  const startTime = Date.now();

  const stats: SyncStats = {
    providersCreated: 0,
    providersUpdated: 0,
    modelsCreated: 0,
    modelsUpdated: 0,
    pricingRecordsUpserted: 0,
    errors: [],
  };

  // Check if OpenRouter is configured
  if (!isOpenRouterConfigured()) {
    console.warn(
      '[ModelCatalogSync] OPENROUTER_API_KEY not configured, skipping sync'
    );
    return {
      success: true,
      stats,
      duration: Date.now() - startTime,
    };
  }

  try {
    // Fetch models from OpenRouter
    const openRouterModels = await fetchOpenRouterModels();
    console.log(
      `[ModelCatalogSync] Fetched ${openRouterModels.length} models from OpenRouter`
    );

    if (openRouterModels.length === 0) {
      console.warn('[ModelCatalogSync] No models returned from OpenRouter');
      return {
        success: true,
        stats,
        duration: Date.now() - startTime,
      };
    }

    // Parse all models
    const parsedModels = openRouterModels.map(parseOpenRouterModel);

    // Group models by provider
    const modelsByProvider = groupModelsByProvider(parsedModels);
    console.log(
      `[ModelCatalogSync] Found ${Object.keys(modelsByProvider).length} unique providers`
    );

    // Create Supabase service client (bypasses RLS)
    const supabase = createServiceClient();

    // Step 1: Upsert providers
    const providerIdMap = await upsertProviders(
      supabase,
      Object.keys(modelsByProvider),
      stats
    );

    // Step 2: Upsert models and pricing
    for (const [providerSlug, models] of Object.entries(modelsByProvider)) {
      const providerId = providerIdMap.get(providerSlug);
      if (!providerId) {
        stats.errors.push(`Provider ID not found for: ${providerSlug}`);
        continue;
      }

      for (const model of models) {
        try {
          await upsertModelAndPricing(supabase, model, providerId, stats);
        } catch (error) {
          const errorMsg = `Failed to upsert model ${model.openrouterId}: ${error}`;
          console.error(`[ModelCatalogSync] ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[ModelCatalogSync] Sync completed in ${(duration / 1000).toFixed(2)}s`
    );
    console.log(`[ModelCatalogSync] Stats:`, {
      providersCreated: stats.providersCreated,
      providersUpdated: stats.providersUpdated,
      modelsCreated: stats.modelsCreated,
      modelsUpdated: stats.modelsUpdated,
      pricingRecordsUpserted: stats.pricingRecordsUpserted,
      errorCount: stats.errors.length,
    });

    if (stats.errors.length > 0) {
      console.warn(
        `[ModelCatalogSync] Encountered ${stats.errors.length} errors during sync`
      );
    }

    return {
      success: stats.errors.length === 0,
      stats,
      duration,
    };
  } catch (error) {
    console.error('[ModelCatalogSync] Fatal error during sync:', error);
    stats.errors.push(`Fatal error: ${error}`);
    return {
      success: false,
      stats,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Group parsed models by their provider slug
 */
function groupModelsByProvider(
  models: ParsedModelData[]
): Record<string, ParsedModelData[]> {
  return models.reduce<Record<string, ParsedModelData[]>>(
    (acc, model) => {
      const slug = model.providerSlug;
      if (!acc[slug]) {
        acc[slug] = [];
      }
      acc[slug]!.push(model);
      return acc;
    },
    {}
  );
}

/**
 * Upsert providers and return a map of slug -> id
 */
async function upsertProviders(
  supabase: ReturnType<typeof createServiceClient>,
  providerSlugs: string[],
  stats: SyncStats
): Promise<Map<string, string>> {
  const providerIdMap = new Map<string, string>();

  for (const slug of providerSlugs) {
    try {
      // Check if provider exists by slug
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing, error: selectError } = await (supabase as any)
        .from('providers')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (selectError) {
        throw selectError;
      }

      if (existing?.id) {
        // Provider exists, just map it
        providerIdMap.set(slug, existing.id);
        stats.providersUpdated++;
      } else {
        // Slug not found - check if provider exists under a different slug
        // (e.g., seed used "mistral" but OpenRouter uses "mistralai")
        const providerName = formatProviderName(slug);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: byName } = await (supabase as any)
          .from('providers')
          .select('id')
          .eq('name', providerName)
          .maybeSingle();

        if (byName?.id) {
          // Found by name - update slug to match OpenRouter and map it
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('providers')
            .update({ slug })
            .eq('id', byName.id);
          providerIdMap.set(slug, byName.id);
          stats.providersUpdated++;
          console.log(
            `[ModelCatalogSync] Updated provider slug: ${providerName} -> ${slug}`
          );
        } else {
          // Create new provider with placeholder data
          const providerData = {
            name: providerName,
            slug: slug,
            trust_tier: 'unknown',
            status: 'active',
            features: {},
            metadata: {
              auto_created: true,
              source: 'openrouter_sync',
              created_at: new Date().toISOString(),
            },
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: created, error: insertError } = await (supabase as any)
            .from('providers')
            .insert(providerData)
            .select('id')
            .single();

          if (insertError) throw insertError;
          if (!created) throw new Error('Provider insert returned no data');

          providerIdMap.set(slug, (created as { id: string }).id);
          stats.providersCreated++;
          console.log(
            `[ModelCatalogSync] Created new provider: ${providerName} (${slug})`
          );
        }
      }
    } catch (error) {
      console.error(
        `[ModelCatalogSync] Error upserting provider ${slug}:`,
        error
      );
      stats.errors.push(`Provider upsert failed for ${slug}: ${error}`);
    }
  }

  return providerIdMap;
}

/**
 * Upsert a single model and its pricing
 */
async function upsertModelAndPricing(
  supabase: ReturnType<typeof createServiceClient>,
  model: ParsedModelData,
  providerId: string,
  stats: SyncStats
): Promise<void> {
  // Upsert model using openrouter_id as the unique key
  const modelData = {
    provider_id: providerId,
    openrouter_id: model.openrouterId,
    name: model.name,
    display_name: model.displayName,
    description: model.description,
    context_length: model.contextLength,
    max_output_tokens: model.maxOutputTokens,
    is_available: true,
    supports_vision: model.supportsVision,
    supports_function_calling: model.supportsFunctionCalling,
    supports_streaming: model.supportsStreaming,
    supports_json_mode: model.supportsJsonMode,
    supports_system_prompt: model.supportsSystemPrompt,
    capabilities: model.capabilities,
    metadata: model.metadata,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upsertedModel, error: modelError } = await (supabase as any)
    .from('models')
    .upsert(modelData, {
      onConflict: 'openrouter_id',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (modelError) {
    throw new Error(`Model upsert failed: ${modelError.message}`);
  }

  if (!upsertedModel) {
    throw new Error('Model upsert returned no data');
  }

  // Track as update (upsert doesn't distinguish create vs update)
  stats.modelsUpdated++;

  // Upsert pricing record
  const pricingData = {
    model_id: upsertedModel.id,
    provider_id: providerId,
    input_price: model.inputPrice,
    output_price: model.outputPrice,
    is_primary: true,
    last_synced_at: new Date().toISOString(),
    metadata: {
      source: 'openrouter_sync',
      synced_at: new Date().toISOString(),
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: pricingError } = await (supabase as any)
    .from('model_provider_pricing')
    .upsert(pricingData, {
      onConflict: 'model_id,provider_id',
      ignoreDuplicates: false,
    });

  if (pricingError) {
    throw new Error(`Pricing upsert failed: ${pricingError.message}`);
  }

  stats.pricingRecordsUpserted++;
}

/**
 * Format a provider slug into a display name
 * e.g., "openai" -> "OpenAI", "meta-llama" -> "Meta Llama"
 */
function formatProviderName(slug: string): string {
  // Special cases for known providers
  const specialCases: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    'meta-llama': 'Meta Llama',
    mistralai: 'Mistral AI',
    cohere: 'Cohere',
    perplexity: 'Perplexity',
    deepseek: 'DeepSeek',
    qwen: 'Qwen',
    microsoft: 'Microsoft',
    'x-ai': 'xAI',
    amazon: 'Amazon',
    ai21: 'AI21 Labs',
  };

  if (specialCases[slug]) {
    return specialCases[slug];
  }

  // Default: capitalize words
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
