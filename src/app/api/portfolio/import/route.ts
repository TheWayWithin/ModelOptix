/**
 * Portfolio Import API
 *
 * Imports user's OpenRouter usage data as a ModelOptix portfolio.
 * POST /api/portfolio/import
 *
 * Query params:
 *   - mode: 'preview' | 'import' (default: 'preview')
 *
 * Request body:
 *   - apiKey: User's OpenRouter API key
 *   - productName?: Custom product name (optional, for import mode)
 *   - selectedModels?: Array of model IDs to import (when no generation history)
 *
 * Returns:
 *   - preview mode: ImportPreview with detected usage patterns (or popular models if none)
 *   - import mode: ImportResult with created product/use case IDs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  analyzeOpenRouterAccount,
  type ImportPreview,
  type ImportResult,
} from '@/lib/openrouter';

// Map task types to primary needs
const TASK_TYPE_TO_NEED: Record<string, string> = {
  general: 'quality',
  conversational: 'quality',
  content_generation: 'quality',
  code_generation: 'quality',
  classification: 'speed',
  data_extraction: 'speed',
  image_analysis: 'quality',
};

interface ImportRequestBody {
  apiKey: string;
  productName?: string;
  selectedModels?: string[]; // Model IDs selected by user (when no generation history)
}

// Popular model providers for the selection UI - join with providers table
const POPULAR_MODELS_QUERY = `
  id,
  name,
  openrouter_id,
  context_length,
  providers!inner(name)
`;

interface CatalogModel {
  id: string;
  name: string;
  openrouter_id: string | null;
  context_length: number | null;
  providers: { name: string };
}

/**
 * POST /api/portfolio/import
 *
 * Import OpenRouter usage data as a portfolio
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user's tier limits
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    type SubscriptionTier = 'free' | 'solo' | 'growth' | 'pro';
    const tier: SubscriptionTier = (profile?.subscription_tier as SubscriptionTier) || 'free';
    const productLimits: Record<SubscriptionTier, number> = {
      free: 1,
      solo: 3,
      growth: 10,
      pro: Infinity,
    };
    const tierLimit = productLimits[tier];

    // Parse request
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'preview';

    if (!['preview', 'import'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Use "preview" or "import".' },
        { status: 400 }
      );
    }

    const body: ImportRequestBody = await request.json();

    if (!body.apiKey || typeof body.apiKey !== 'string') {
      return NextResponse.json(
        { error: 'OpenRouter API key is required' },
        { status: 400 }
      );
    }

    // Validate key format
    if (!body.apiKey.startsWith('sk-or-')) {
      return NextResponse.json(
        { error: 'Invalid OpenRouter API key format. Keys start with "sk-or-".' },
        { status: 400 }
      );
    }

    // Step 1: Analyze OpenRouter account
    const analysis = await analyzeOpenRouterAccount(body.apiKey);

    if ('error' in analysis) {
      return NextResponse.json({ error: analysis.error }, { status: 400 });
    }

    let preview: ImportPreview = analysis;

    // If no generation history found, fetch popular models from our catalog
    // NOTE: OpenRouter's generation history API requires a "provisioning key"
    // which regular users don't have. We provide model selection instead.
    console.log('[PortfolioImport] modelsDetected count:', preview.modelsDetected.length);

    if (preview.modelsDetected.length === 0) {
      console.log('[PortfolioImport] No generation history, fetching catalog models');

      try {
        const serviceSupabase = createServiceClient();

        // Fetch popular models from our catalog (grouped by provider)
        const { data: popularModels, error: modelsError } = await serviceSupabase
          .from('models')
          .select(POPULAR_MODELS_QUERY)
          .not('openrouter_id', 'is', null)
          .order('name', { ascending: true })
          .limit(100);

        console.log('[PortfolioImport] Catalog query result:', {
          count: popularModels?.length || 0,
          error: modelsError?.message || null,
        });

        if (modelsError) {
          console.error('[PortfolioImport] Error fetching catalog models:', modelsError);
        }

        if (popularModels && popularModels.length > 0) {
          // Add popular models as "catalog models" for selection
          preview = {
            ...preview,
            catalogModels: popularModels as CatalogModel[],
            requiresSelection: true, // Flag indicating user needs to select models
          };
          console.log('[PortfolioImport] Set requiresSelection=true with', popularModels.length, 'models');
        } else {
          console.log('[PortfolioImport] No catalog models found with openrouter_id');
        }
      } catch (err) {
        console.error('[PortfolioImport] Service client error:', err);
      }
    }

    // Preview mode - return the analysis (with catalog models if no history)
    if (mode === 'preview') {
      return NextResponse.json({ preview });
    }

    // Import mode - create product and use cases
    // Check product limit
    const { count: existingProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((existingProducts || 0) >= tierLimit) {
      return NextResponse.json(
        {
          error: `Product limit reached for ${tier} tier (${tierLimit} max). Upgrade to add more products.`,
        },
        { status: 403 }
      );
    }

    // Determine if this is a user-selected import or generation-history import
    const hasSelectedModels = body.selectedModels && body.selectedModels.length > 0;
    const hasGenerationHistory = preview.modelsDetected.length > 0;

    if (!hasSelectedModels && !hasGenerationHistory) {
      return NextResponse.json(
        { error: 'No models selected. Please select at least one model to import.' },
        { status: 400 }
      );
    }

    // Create product
    const productName = body.productName?.trim() || preview.suggestedProduct.name || 'My AI Portfolio';
    const modelCount = hasSelectedModels ? body.selectedModels!.length : preview.modelsDetected.length;

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: productName,
        description: `Created on ${new Date().toLocaleDateString()}. ${modelCount} model${modelCount !== 1 ? 's' : ''} configured.`,
        status: 'active',
        metadata: {
          import_source: hasSelectedModels ? 'openrouter_selection' : 'openrouter_history',
          imported_at: new Date().toISOString(),
          openrouter_key_label: preview.keyLabel,
          models_count: modelCount,
        },
      })
      .select('id')
      .single();

    if (productError) {
      console.error('[PortfolioImport] Product creation error:', productError);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    let useCasesCreated = 0;

    if (hasSelectedModels) {
      // User-selected models import - fetch model details and create use cases
      console.log('[PortfolioImport] Selected model IDs:', body.selectedModels);

      const serviceSupabase = createServiceClient();
      const { data: selectedModelData, error: selectError } = await serviceSupabase
        .from('models')
        .select('id, name, openrouter_id, context_length, providers(name)')
        .in('id', body.selectedModels!);

      // Type assertion for logging
      const modelDataForLog = selectedModelData as Array<{ id: string; name: string }> | null;
      console.log('[PortfolioImport] Models query result:', {
        count: modelDataForLog?.length || 0,
        error: selectError?.message || null,
        models: modelDataForLog?.map((m) => ({ id: m.id, name: m.name })),
      });

      if (selectError) {
        console.error('[PortfolioImport] Error fetching selected models:', selectError);
      }

      // Type assertion for the model data
      type SelectedModelRow = {
        id: string;
        name: string;
        openrouter_id: string | null;
        context_length: number | null;
        providers: { name: string } | null;
      };

      if (selectedModelData && selectedModelData.length > 0) {
        console.log('[PortfolioImport] Creating use cases for', selectedModelData.length, 'models');

        for (const model of selectedModelData as SelectedModelRow[]) {
          const providerName = model.providers?.name || 'Unknown';
          const useCaseData = {
            product_id: product.id,
            name: `${model.name} Usage`,
            description: `Use case for ${model.name} from ${providerName}`,
            current_model_id: model.id,

            // Default priority
            priority: 'medium' as const,

            // Default usage patterns (user can edit later)
            monthly_volume: 1000,
            avg_input_tokens: 500,
            avg_output_tokens: 200,

            // Optimization priorities
            primary_need: 'quality',
            use_equal_weights: false,

            // Technical requirements from model
            required_context: model.context_length || 4096,
            estimated_monthly_tokens: 700000, // (500+200) * 1000

            // Capabilities
            requires_vision: model.name.toLowerCase().includes('vision') || model.openrouter_id?.includes('4o'),
            requires_function_calling: false,
            requires_json_mode: false,

            // Metadata
            metadata: {
              import_source: 'openrouter_selection',
              selected_model_id: model.id,
            },
          };

          console.log('[PortfolioImport] Inserting use case:', {
            name: useCaseData.name,
            product_id: useCaseData.product_id,
            current_model_id: useCaseData.current_model_id,
          });

          const { data: insertedUseCase, error: useCaseError } = await supabase
            .from('use_cases')
            .insert(useCaseData)
            .select('id')
            .single();

          if (useCaseError) {
            console.error('[PortfolioImport] Use case creation error:', {
              error: useCaseError,
              code: useCaseError.code,
              message: useCaseError.message,
              details: useCaseError.details,
              hint: useCaseError.hint,
            });
          } else {
            console.log('[PortfolioImport] Use case created:', insertedUseCase?.id);
            useCasesCreated++;
          }
        }
      } else {
        console.log('[PortfolioImport] No model data returned from query');
      }
    } else {
      // Generation history import (original flow)
      // Match OpenRouter models to our database models
      const { data: dbModels } = await supabase
        .from('models')
        .select('id, openrouter_id')
        .not('openrouter_id', 'is', null);

      const modelMap = new Map<string, string>();
      if (dbModels) {
        for (const model of dbModels) {
          if (model.openrouter_id) {
            modelMap.set(model.openrouter_id, model.id);
          }
        }
      }

      // Create use cases for top models
      const useCasesToCreate = preview.suggestedProduct.useCases.slice(0, 10);

      for (const ucData of useCasesToCreate) {
        // Find matching model in our database
        const dbModelId = modelMap.get(ucData.modelId) || null;

        // Map task type to primary need
        const primaryNeed = TASK_TYPE_TO_NEED[ucData.taskType] || 'quality';

        // Find the pattern for this model to get additional data
        const pattern = preview.modelsDetected.find((p) => p.modelId === ucData.modelId);

        const useCaseData = {
          product_id: product.id,
          name: ucData.name,
          description: `Detected from OpenRouter usage. ${pattern?.totalCalls || 0} calls recorded.`,
          current_model_id: dbModelId,

          // Priority
          priority: 'medium' as const,

          // Usage patterns
          monthly_volume: ucData.monthlyVolume,
          avg_input_tokens: ucData.avgInputTokens,
          avg_output_tokens: ucData.avgOutputTokens,

          // Optimization priorities
          primary_need: primaryNeed,
          use_equal_weights: false,

          // Technical requirements (inferred)
          required_context: Math.max(ucData.avgInputTokens * 2, 4096),
          estimated_monthly_tokens:
            (ucData.avgInputTokens + ucData.avgOutputTokens) * ucData.monthlyVolume,

          // Capabilities (detect from model ID)
          requires_vision: ucData.modelId.includes('vision') || ucData.modelId.includes('4o'),
          requires_function_calling: false,
          requires_json_mode: false,

          // Metadata
          metadata: {
            import_source: 'openrouter',
            original_model_id: ucData.modelId,
            task_type_detected: ucData.taskType,
            total_cost_imported: pattern?.totalCost || 0,
          },
        };

        const { error: useCaseError } = await supabase
          .from('use_cases')
          .insert(useCaseData);

        if (useCaseError) {
          console.error('[PortfolioImport] Use case creation error:', useCaseError);
          // Continue with other use cases
        } else {
          useCasesCreated++;
        }
      }
    }

    const result: ImportResult = {
      success: true,
      productId: product.id,
      useCasesCreated,
    };

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    console.error('[PortfolioImport] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
