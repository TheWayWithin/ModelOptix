import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ModelWithProvider } from '@/types/model';

// GET /api/models/compare?ids=id1,id2,id3 - Get multiple models for comparison
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse model IDs from query
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 });
    }

    const ids = idsParam.split(',').filter(Boolean);

    if (ids.length < 2) {
      return NextResponse.json({ error: 'At least 2 model IDs required' }, { status: 400 });
    }

    if (ids.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 models can be compared' }, { status: 400 });
    }

    // Fetch models with provider and pricing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: models, error } = await (supabase as any)
      .from('models')
      .select(`
        *,
        provider:providers(
          id,
          name,
          slug,
          hq_country,
          api_base_url,
          trust_tier,
          trust_tier_reason,
          logo_url,
          documentation_url,
          status,
          features,
          metadata,
          created_at,
          updated_at
        ),
        pricing:model_provider_pricing(
          id,
          model_id,
          provider_id,
          input_price,
          output_price,
          cached_input_price,
          is_primary,
          availability,
          rate_limits,
          last_synced_at,
          created_at,
          updated_at
        )
      `)
      .in('id', ids);

    if (error) {
      console.error('Error fetching models:', error);
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }

    // Transform models
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedModels: ModelWithProvider[] = (models || []).map((model: any) => {
      const pricingArray = model.pricing || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const primaryPricing = pricingArray.find((p: any) => p.is_primary) || pricingArray[0] || null;

      return {
        ...model,
        provider: model.provider,
        pricing: primaryPricing,
      };
    });

    // Sort by the order of IDs provided
    const sortedModels = ids
      .map(id => transformedModels.find(m => m.id === id))
      .filter(Boolean) as ModelWithProvider[];

    return NextResponse.json({ models: sortedModels });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
