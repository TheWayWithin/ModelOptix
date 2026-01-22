import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ModelWithProvider } from '@/types/model';

// GET /api/models/[id] - Get a single model with full details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch model with provider and pricing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: model, error } = await (supabase as any)
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
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Model not found' }, { status: 404 });
      }
      console.error('Error fetching model:', error);
      return NextResponse.json({ error: 'Failed to fetch model' }, { status: 500 });
    }

    // Get primary pricing or first available
    const pricingArray = model.pricing || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const primaryPricing = pricingArray.find((p: any) => p.is_primary) || pricingArray[0] || null;

    const modelWithProvider: ModelWithProvider = {
      ...model,
      provider: model.provider,
      pricing: primaryPricing,
    };

    return NextResponse.json({ model: modelWithProvider });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
