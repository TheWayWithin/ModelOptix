import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { TrustQueueItem, TRUST_DIMENSIONS, TrustDimension } from '@/types/trust';

interface ModelRow {
  id: string;
  name: string;
  provider_id: string;
}

interface ProviderRow {
  id: string;
  name: string;
  trust_tier: 'A' | 'B' | 'C' | 'unknown';
}

interface TrustScoreRow {
  model_id: string;
  dimension: string;
  score: number | null;
  updated_at: string;
}

/**
 * GET /api/admin/trust
 *
 * List all models with their trust score completion status.
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
    const provider = searchParams.get('provider');
    const status = searchParams.get('status'); // 'incomplete' | 'complete' | 'all'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    // Build query for models
    let modelsQuery = serviceClient
      .from('models')
      .select('id, name, provider_id', { count: 'exact' })
      .order('name', { ascending: true });

    // Apply search filter
    if (search) {
      modelsQuery = modelsQuery.ilike('name', `%${search}%`);
    }

    // Apply provider filter
    if (provider) {
      modelsQuery = modelsQuery.eq('provider_id', provider);
    }

    // Apply pagination
    modelsQuery = modelsQuery.range(offset, offset + limit - 1);

    const { data: modelsData, error: modelsError, count } = await modelsQuery;

    if (modelsError) {
      console.error('Error fetching models:', modelsError);
      return NextResponse.json(
        { error: 'Failed to fetch models' },
        { status: 500 }
      );
    }

    const models = modelsData as ModelRow[];

    if (!models || models.length === 0) {
      return NextResponse.json({
        models: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Get all providers for these models
    const providerIds = [...new Set(models.map((m) => m.provider_id))];
    const { data: providersData } = await serviceClient
      .from('providers')
      .select('id, name, trust_tier')
      .in('id', providerIds);

    const providers = (providersData || []) as ProviderRow[];
    const providerMap = new Map(providers.map((p) => [p.id, p]));

    // Get trust scores for these models
    const modelIds = models.map((m) => m.id);
    const { data: scoresData } = await serviceClient
      .from('model_trust_scores')
      .select('model_id, dimension, score, updated_at')
      .in('model_id', modelIds);

    const scores = (scoresData || []) as TrustScoreRow[];

    // Build scores map: modelId -> { scoresCompleted, averageScore, lastUpdated }
    const scoresMap = new Map<
      string,
      { scoresCompleted: number; averageScore: number | null; lastUpdated: string | null }
    >();

    // Initialize all models with empty scores
    modelIds.forEach((id) => {
      scoresMap.set(id, { scoresCompleted: 0, averageScore: null, lastUpdated: null });
    });

    // Group scores by model
    const modelScores = new Map<string, TrustScoreRow[]>();
    scores.forEach((score) => {
      if (!modelScores.has(score.model_id)) {
        modelScores.set(score.model_id, []);
      }
      modelScores.get(score.model_id)!.push(score);
    });

    // Calculate stats for each model
    modelScores.forEach((modelScoreList, modelId) => {
      const validScores = modelScoreList.filter((s) => s.score !== null);
      const scoresCompleted = validScores.length;
      const averageScore =
        validScores.length > 0
          ? validScores.reduce((sum, s) => sum + (s.score || 0), 0) / validScores.length
          : null;
      const lastUpdated =
        modelScoreList.length > 0
          ? modelScoreList.reduce(
              (latest: string, s) => (s.updated_at > latest ? s.updated_at : latest),
              modelScoreList[0]!.updated_at
            )
          : null;

      scoresMap.set(modelId, { scoresCompleted, averageScore, lastUpdated });
    });

    // Build response
    let queueItems: TrustQueueItem[] = models.map((model) => {
      const provider = providerMap.get(model.provider_id);
      const scoreStats = scoresMap.get(model.id)!;

      return {
        id: model.id,
        name: model.name,
        providerName: provider?.name || 'Unknown',
        providerTrustTier: provider?.trust_tier || 'unknown',
        scoresCompleted: scoreStats.scoresCompleted,
        totalDimensions: TRUST_DIMENSIONS.length,
        averageScore: scoreStats.averageScore,
        lastUpdated: scoreStats.lastUpdated,
      };
    });

    // Apply status filter (post-fetch since it depends on calculated values)
    if (status === 'incomplete') {
      queueItems = queueItems.filter(
        (item) => item.scoresCompleted < item.totalDimensions
      );
    } else if (status === 'complete') {
      queueItems = queueItems.filter(
        (item) => item.scoresCompleted === item.totalDimensions
      );
    }

    return NextResponse.json({
      models: queueItems,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin trust API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/trust
 *
 * Create or update trust scores for a model.
 * Accepts an array of scores to upsert.
 */
export async function POST(request: NextRequest) {
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
    const { modelId, scores } = body;

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    if (!Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json({ error: 'Scores array is required' }, { status: 400 });
    }

    // Validate dimensions
    const validDimensions = new Set<string>(TRUST_DIMENSIONS);
    for (const score of scores) {
      if (!validDimensions.has(score.dimension)) {
        return NextResponse.json(
          { error: `Invalid dimension: ${score.dimension}` },
          { status: 400 }
        );
      }
    }

    const serviceClient = createServiceClient();

    // Verify model exists
    const { data: model } = await serviceClient
      .from('models')
      .select('id')
      .eq('id', modelId)
      .single();

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Upsert scores
    const now = new Date().toISOString();
    const scoresToUpsert = scores.map((score: {
      dimension: TrustDimension;
      score: number | null;
      confidence: number;
      evidence: string | null;
      source_url: string | null;
      notes: string | null;
    }) => ({
      model_id: modelId,
      dimension: score.dimension,
      score: score.score,
      confidence: score.confidence || 50,
      evidence: score.evidence || null,
      source_url: score.source_url || null,
      notes: score.notes || null,
      reviewed_by: user.id,
      reviewed_at: now,
      measured_at: now,
    }));

    const { data: upsertedScores, error: upsertError } = await serviceClient
      .from('model_trust_scores')
      .upsert(scoresToUpsert as never[], {
        onConflict: 'model_id,dimension',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error('Error upserting trust scores:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save trust scores' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scores: upsertedScores,
    });
  } catch (error) {
    console.error('Admin trust POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
