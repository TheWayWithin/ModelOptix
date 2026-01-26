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
 *
 * Returns:
 *   - preview mode: ImportPreview with detected usage patterns
 *   - import mode: ImportResult with created product/use case IDs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    const preview: ImportPreview = analysis;

    // Preview mode - just return the analysis
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

    // Create product
    const productName = body.productName?.trim() || preview.suggestedProduct.name;

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: productName,
        description: `Imported from OpenRouter on ${new Date().toLocaleDateString()}. ${preview.modelsDetected.length} models detected.`,
        status: 'active',
        metadata: {
          import_source: 'openrouter',
          imported_at: new Date().toISOString(),
          openrouter_key_label: preview.keyLabel,
          models_detected: preview.modelsDetected.length,
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
    let useCasesCreated = 0;

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
