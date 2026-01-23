import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Type definitions for query results
interface ProviderRow {
  id: string;
  name: string;
  slug: string;
  hq_country: string | null;
  api_base_url: string | null;
  trust_tier: 'A' | 'B' | 'C' | 'unknown';
  trust_tier_reason: string | null;
  logo_url: string | null;
  documentation_url: string | null;
  status: 'active' | 'deprecated' | 'beta';
  features: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/admin/providers
 *
 * List all providers with model counts for admin.
 * Supports search, filtering, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const trustTier = searchParams.get('trust_tier');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    // Build query
    let query = serviceClient
      .from('providers')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }
    if (trustTier) {
      query = query.eq('trust_tier', trustTier);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching admin providers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch providers' },
        { status: 500 }
      );
    }

    const providers = data as ProviderRow[];

    // Get model counts per provider
    const providerIds = providers?.map((p) => p.id) || [];
    const modelCountsMap: Record<string, number> = {};

    if (providerIds.length > 0) {
      const { data: modelCounts } = await serviceClient
        .from('models')
        .select('provider_id')
        .in('provider_id', providerIds);

      if (modelCounts) {
        modelCounts.forEach((m: { provider_id: string }) => {
          modelCountsMap[m.provider_id] = (modelCountsMap[m.provider_id] || 0) + 1;
        });
      }
    }

    // Format response
    const formattedProviders = providers?.map((provider) => ({
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      hqCountry: provider.hq_country,
      apiBaseUrl: provider.api_base_url,
      trustTier: provider.trust_tier,
      trustTierReason: provider.trust_tier_reason,
      logoUrl: provider.logo_url,
      documentationUrl: provider.documentation_url,
      status: provider.status,
      features: provider.features,
      metadata: provider.metadata,
      modelCount: modelCountsMap[provider.id] || 0,
      createdAt: provider.created_at,
      updatedAt: provider.updated_at,
    }));

    return NextResponse.json({
      providers: formattedProviders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin providers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/providers
 *
 * Update a provider's details.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Allowed fields for update
    const allowedFields = [
      'name',
      'slug',
      'hq_country',
      'api_base_url',
      'trust_tier',
      'trust_tier_reason',
      'logo_url',
      'documentation_url',
      'status',
      'features',
      'metadata',
    ];

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient
      .from('providers')
      .update(filteredUpdates as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating provider:', error);
      return NextResponse.json(
        { error: 'Failed to update provider' },
        { status: 500 }
      );
    }

    return NextResponse.json({ provider: data });
  } catch (error) {
    console.error('Admin providers PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
