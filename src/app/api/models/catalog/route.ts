import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ModelCatalogResponse, ModelWithProvider, ProviderSummary } from '@/types/model';

// GET /api/models/catalog - Browse model catalog with filtering, search, pagination
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const providers = searchParams.get('providers')?.split(',').filter(Boolean) || [];
    const capabilities = searchParams.get('capabilities')?.split(',').filter(Boolean) || [];
    const availability = searchParams.get('availability')?.split(',').filter(Boolean) || [];
    const trustTiers = searchParams.get('trustTiers')?.split(',').filter(Boolean) || [];
    const minContext = parseInt(searchParams.get('minContext') || '0', 10);
    const maxInputPrice = parseFloat(searchParams.get('maxInputPrice') || '0');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('models')
      .select(`
        *,
        provider:providers!inner(
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
      `, { count: 'exact' })
      .eq('is_available', true);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,display_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply provider filter
    if (providers.length > 0) {
      query = query.in('provider.slug', providers);
    }

    // Apply trust tier filter
    if (trustTiers.length > 0) {
      query = query.in('provider.trust_tier', trustTiers);
    }

    // Apply capability filters
    if (capabilities.includes('vision')) {
      query = query.eq('supports_vision', true);
    }
    if (capabilities.includes('function_calling')) {
      query = query.eq('supports_function_calling', true);
    }
    if (capabilities.includes('streaming')) {
      query = query.eq('supports_streaming', true);
    }
    if (capabilities.includes('json_mode')) {
      query = query.eq('supports_json_mode', true);
    }

    // Apply context length filter
    if (minContext > 0) {
      query = query.gte('context_length', minContext);
    }

    // Apply sorting
    const validSortFields = ['name', 'context_length', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    // Execute query
    const { data: models, error, count } = await query;

    if (error) {
      console.error('Error fetching models:', error);
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }

    // Transform models to include primary pricing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedModels: ModelWithProvider[] = (models || []).map((model: any) => {
      // Get primary pricing or first available
      const pricingArray = model.pricing || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const primaryPricing = pricingArray.find((p: any) => p.is_primary) || pricingArray[0] || null;

      // Apply availability filter if specified
      if (availability.length > 0 && primaryPricing) {
        if (!availability.includes(primaryPricing.availability)) {
          return null;
        }
      }

      // Apply max input price filter
      if (maxInputPrice > 0 && primaryPricing?.input_price) {
        if (primaryPricing.input_price > maxInputPrice) {
          return null;
        }
      }

      return {
        ...model,
        provider: model.provider,
        pricing: primaryPricing,
      } as ModelWithProvider;
    }).filter(Boolean);

    // Get provider summaries for filter options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: providerData, error: providerError } = await (supabase as any)
      .from('providers')
      .select(`
        id,
        name,
        slug,
        trust_tier,
        models!inner(id)
      `)
      .eq('status', 'active');

    if (providerError) {
      console.error('Error fetching providers:', providerError);
    }

    const providerSummaries: ProviderSummary[] = (providerData || []).map((p: {
      id: string;
      name: string;
      slug: string;
      trust_tier: string;
      models: unknown[];
    }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      trust_tier: p.trust_tier,
      model_count: p.models?.length || 0,
    }));

    const response: ModelCatalogResponse = {
      models: transformedModels,
      total: count || 0,
      page,
      pageSize,
      providers: providerSummaries,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
