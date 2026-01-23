import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/public/models
 *
 * Public endpoint for guest sanity checks.
 * Returns list of available models for comparison.
 * No authentication required - but limited information returned.
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    // Fetch available models with limited info for public display
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: models, error } = await (supabase as any)
      .from('models')
      .select(`
        id,
        name,
        display_name,
        openrouter_id,
        context_length,
        providers (
          name,
          trust_tier
        ),
        model_provider_pricing (
          input_price,
          output_price,
          is_primary
        )
      `)
      .eq('is_available', true)
      .order('name', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching models:', error);
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }

    // Transform for public display
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const publicModels = models?.map((model: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pricing = model.model_provider_pricing?.find((p: any) => p.is_primary);
      return {
        id: model.id,
        name: model.name,
        displayName: model.display_name || model.name,
        provider: model.providers?.name || model.provider || 'Unknown',
        providerTrustTier: model.providers?.trust_tier || 'Unknown',
        contextLength: model.context_length,
        inputPrice: pricing?.input_price || 0,
        outputPrice: pricing?.output_price || 0,
      };
    }) || [];

    // Group by provider for easier UI display
    const modelsByProvider: Record<string, typeof publicModels> = {};
    for (const model of publicModels) {
      const provider = model.provider;
      if (!modelsByProvider[provider]) {
        modelsByProvider[provider] = [];
      }
      modelsByProvider[provider].push(model);
    }

    return NextResponse.json({
      models: publicModels,
      modelsByProvider,
      total: publicModels.length,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
