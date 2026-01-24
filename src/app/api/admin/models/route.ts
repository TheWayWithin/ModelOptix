import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Type definitions for query results
interface ModelPricing {
  id: string;
  input_price: number;
  output_price: number;
  is_primary: boolean;
}

interface Provider {
  id: string;
  name: string;
  trust_tier: string;
}

interface ModelRow {
  id: string;
  name: string;
  description: string | null;
  provider_id: string;
  context_length: number | null;
  max_output_tokens: number | null;
  supports_vision: boolean;
  supports_function_calling: boolean;
  supports_streaming: boolean;
  supports_json_mode: boolean;
  capabilities: Record<string, unknown> | null;
  latency_p50: number | null;
  latency_p95: number | null;
  benchmarks: Record<string, number> | null;
  is_available: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  providers: Provider | null;
  model_provider_pricing: ModelPricing[];
}

interface TrustScore {
  model_id: string;
  dimension: string;
  score: number;
}

/**
 * GET /api/admin/models
 *
 * List all models with provider info and pricing for admin.
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
    const providerId = searchParams.get('provider_id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    // Build query
    let query = serviceClient
      .from('models')
      .select(
        `
        id,
        name,
        description,
        provider_id,
        context_length,
        max_output_tokens,
        supports_vision,
        supports_function_calling,
        supports_streaming,
        supports_json_mode,
        capabilities,
        latency_p50,
        latency_p95,
        benchmarks,
        is_available,
        status,
        created_at,
        updated_at,
        providers (
          id,
          name,
          trust_tier
        ),
        model_provider_pricing (
          id,
          input_price,
          output_price,
          is_primary
        )
      `,
        { count: 'exact' }
      )
      .order('name', { ascending: true });

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching admin models:', error);
      return NextResponse.json(
        { error: 'Failed to fetch models' },
        { status: 500 }
      );
    }

    // Cast to our expected type
    const models = data as unknown as ModelRow[];

    // Get trust scores for these models
    const modelIds = models?.map((m) => m.id) || [];
    const trustScoresMap: Record<string, number> = {};

    if (modelIds.length > 0) {
      const { data: trustScoreData } = await serviceClient
        .from('model_trust_scores')
        .select('model_id, dimension, score')
        .in('model_id', modelIds);

      const trustScores = trustScoreData as unknown as TrustScore[] | null;

      if (trustScores) {
        // Calculate average trust score per model
        const scoresByModel: Record<string, number[]> = {};
        trustScores.forEach((ts) => {
          if (!scoresByModel[ts.model_id]) {
            scoresByModel[ts.model_id] = [];
          }
          const modelScores = scoresByModel[ts.model_id];
          if (modelScores) {
            modelScores.push(Number(ts.score));
          }
        });

        Object.entries(scoresByModel).forEach(([modelId, scores]) => {
          trustScoresMap[modelId] =
            scores.reduce((a, b) => a + b, 0) / scores.length;
        });
      }
    }

    // Format response
    const formattedModels = models?.map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
      providerId: model.provider_id,
      providerName: model.providers?.name || 'Unknown',
      providerTrustTier: model.providers?.trust_tier || 'unknown',
      contextLength: model.context_length,
      maxOutputTokens: model.max_output_tokens,
      supportsVision: model.supports_vision,
      supportsFunctionCalling: model.supports_function_calling,
      supportsStreaming: model.supports_streaming,
      supportsJsonMode: model.supports_json_mode,
      capabilities: model.capabilities,
      latencyP50: model.latency_p50,
      latencyP95: model.latency_p95,
      benchmarks: model.benchmarks,
      isAvailable: model.is_available,
      status: model.status,
      avgTrustScore: trustScoresMap[model.id] || null,
      pricing: model.model_provider_pricing?.find((p) => p.is_primary) || null,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
    }));

    return NextResponse.json({
      models: formattedModels,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin models API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/models
 *
 * Update a model's details.
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
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Allowed fields for update
    const allowedFields = [
      'name',
      'description',
      'context_length',
      'max_output_tokens',
      'capabilities',
      'is_available',
      'status',
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
      .from('models')
      .update(filteredUpdates as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating model:', error);
      return NextResponse.json(
        { error: 'Failed to update model' },
        { status: 500 }
      );
    }

    return NextResponse.json({ model: data });
  } catch (error) {
    console.error('Admin models PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
