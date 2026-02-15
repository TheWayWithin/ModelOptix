/**
 * Standalone script to trigger OpenRouter model catalog sync
 *
 * Mirrors the logic in src/lib/jobs/sync-model-catalog.ts but runs
 * independently without Next.js path aliases.
 *
 * Usage: npx tsx scripts/trigger-sync.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// --- Types ---

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: { prompt: string; completion: string; image?: string; request?: string };
  architecture: { modality: string; tokenizer: string; instruct_type: string | null };
  top_provider: { max_completion_tokens: number | null; is_moderated: boolean };
  per_request_limits: null;
}

interface SyncStats {
  providersCreated: number;
  providersUpdated: number;
  modelsCreated: number;
  modelsUpdated: number;
  pricingRecordsUpserted: number;
  errors: string[];
}

// --- Helpers ---

const PROVIDER_NAMES: Record<string, string> = {
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

function formatProviderName(slug: string): string {
  if (PROVIDER_NAMES[slug]) return PROVIDER_NAMES[slug]!;
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// --- Main ---

async function main() {
  console.log('=== OpenRouter Model Catalog Sync ===\n');

  // Validate env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  if (!openrouterKey) {
    console.error('Missing OPENROUTER_API_KEY in .env.local');
    process.exit(1);
  }

  console.log('Supabase URL:', supabaseUrl);
  console.log('OpenRouter key:', openrouterKey.slice(0, 10) + '...\n');

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const stats: SyncStats = {
    providersCreated: 0,
    providersUpdated: 0,
    modelsCreated: 0,
    modelsUpdated: 0,
    pricingRecordsUpserted: 0,
    errors: [],
  };

  // 1. Fetch models from OpenRouter
  console.log('Fetching models from OpenRouter API...');
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      Authorization: `Bearer ${openrouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://modeloptix.com',
      'X-Title': 'ModelOptix',
    },
  });

  if (!response.ok) {
    console.error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const data = await response.json();
  const models: OpenRouterModel[] = data.data;
  console.log(`Fetched ${models.length} models\n`);

  // 2. Group by provider
  const byProvider: Record<string, OpenRouterModel[]> = {};
  for (const m of models) {
    const slug = m.id.split('/')[0]!;
    if (!byProvider[slug]) byProvider[slug] = [];
    byProvider[slug]!.push(m);
  }
  const providerSlugs = Object.keys(byProvider);
  console.log(`Found ${providerSlugs.length} unique providers\n`);

  // 3. Upsert providers
  const providerIdMap = new Map<string, string>();

  for (const slug of providerSlugs) {
    try {
      // Look up by slug
      const { data: existing } = await supabase
        .from('providers')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing?.id) {
        providerIdMap.set(slug, existing.id);
        stats.providersUpdated++;
        continue;
      }

      // Look up by name (handle slug mismatch)
      const name = formatProviderName(slug);
      const { data: byName } = await supabase
        .from('providers')
        .select('id')
        .eq('name', name)
        .maybeSingle();

      if (byName?.id) {
        await supabase.from('providers').update({ slug }).eq('id', byName.id);
        providerIdMap.set(slug, byName.id);
        stats.providersUpdated++;
        console.log(`  Updated provider slug for ${name} -> ${slug}`);
        continue;
      }

      // Create new
      const { data: created, error: createErr } = await supabase
        .from('providers')
        .insert({
          name,
          slug,
          trust_tier: 'unknown',
          status: 'active',
          features: {},
          metadata: { auto_created: true, source: 'openrouter_sync', created_at: new Date().toISOString() },
        })
        .select('id')
        .single();

      if (createErr) throw createErr;
      providerIdMap.set(slug, created!.id);
      stats.providersCreated++;
      console.log(`  Created provider: ${name} (${slug})`);
    } catch (err) {
      const msg = `Provider ${slug}: ${err instanceof Error ? err.message : err}`;
      stats.errors.push(msg);
      console.error(`  ERROR: ${msg}`);
    }
  }

  console.log(`\nProviders: ${stats.providersCreated} created, ${stats.providersUpdated} existing\n`);

  // 4. Upsert models + pricing
  let processed = 0;
  for (const [slug, providerModels] of Object.entries(byProvider)) {
    const providerId = providerIdMap.get(slug);
    if (!providerId) {
      stats.errors.push(`No provider ID for ${slug}, skipping ${providerModels!.length} models`);
      continue;
    }

    for (const m of providerModels!) {
      processed++;
      const modelSlug = m.id.split('/').slice(1).join('/') || m.id;
      const modality = m.architecture?.modality || '';

      try {
        // Check if model exists (to track create vs update)
        const { data: existing } = await supabase
          .from('models')
          .select('id')
          .eq('openrouter_id', m.id)
          .maybeSingle();

        // Upsert model - column names match src/lib/jobs/sync-model-catalog.ts
        const { data: upserted, error: modelErr } = await supabase
          .from('models')
          .upsert(
            {
              provider_id: providerId,
              openrouter_id: m.id,
              name: modelSlug,
              display_name: m.name,
              description: m.description || null,
              context_length: m.context_length,
              max_output_tokens: m.top_provider?.max_completion_tokens || null,
              is_available: true,
              supports_vision: modality.includes('image'),
              supports_function_calling: false,
              supports_streaming: true,
              supports_json_mode: false,
              supports_system_prompt: modality.includes('text'),
              capabilities: {
                modality: m.architecture?.modality,
                tokenizer: m.architecture?.tokenizer,
                instruct_type: m.architecture?.instruct_type,
                is_moderated: m.top_provider?.is_moderated,
              },
              metadata: {
                openrouter_raw: { architecture: m.architecture, top_provider: m.top_provider },
                image_price: m.pricing?.image,
                request_price: m.pricing?.request,
              },
            },
            { onConflict: 'openrouter_id', ignoreDuplicates: false }
          )
          .select('id')
          .single();

        if (modelErr) throw new Error(`Model upsert: ${modelErr.message}`);

        if (existing) {
          stats.modelsUpdated++;
        } else {
          stats.modelsCreated++;
        }

        // Upsert pricing
        const inputPrice = parseFloat(m.pricing?.prompt || '0') * 1000;
        const outputPrice = parseFloat(m.pricing?.completion || '0') * 1000;

        const { error: priceErr } = await supabase
          .from('model_provider_pricing')
          .upsert(
            {
              model_id: upserted!.id,
              provider_id: providerId,
              input_price: inputPrice,
              output_price: outputPrice,
              is_primary: true,
              last_synced_at: new Date().toISOString(),
              metadata: { source: 'openrouter_sync', synced_at: new Date().toISOString() },
            },
            { onConflict: 'model_id,provider_id', ignoreDuplicates: false }
          );

        if (priceErr) throw new Error(`Pricing upsert: ${priceErr.message}`);
        stats.pricingRecordsUpserted++;

        // Log progress every 50 models
        if (processed % 50 === 0) {
          console.log(`  [${processed}/${models.length}] ${m.id}`);
        }
      } catch (err) {
        const msg = `Model ${m.id}: ${err instanceof Error ? err.message : err}`;
        stats.errors.push(msg);
        if (stats.errors.length <= 10) console.error(`  ERROR: ${msg}`);
      }
    }
  }

  // 5. Final stats
  console.log('\n' + '='.repeat(50));
  console.log('SYNC COMPLETE');
  console.log('='.repeat(50));
  console.log(`Providers created:    ${stats.providersCreated}`);
  console.log(`Providers existing:   ${stats.providersUpdated}`);
  console.log(`Models created:       ${stats.modelsCreated}`);
  console.log(`Models updated:       ${stats.modelsUpdated}`);
  console.log(`Pricing records:      ${stats.pricingRecordsUpserted}`);
  console.log(`Errors:               ${stats.errors.length}`);
  console.log('='.repeat(50));

  if (stats.errors.length > 0) {
    console.log(`\nFirst ${Math.min(stats.errors.length, 20)} errors:`);
    stats.errors.slice(0, 20).forEach(e => console.log(`  - ${e}`));
    if (stats.errors.length > 20) {
      console.log(`  ... and ${stats.errors.length - 20} more`);
    }
  }

  // Verify final count
  const { count } = await supabase.from('models').select('id', { count: 'exact', head: true });
  console.log(`\nTotal models in database: ${count}`);

  process.exit(stats.errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
