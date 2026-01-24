import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ModelTrustScoreRecord, TRUST_DIMENSIONS, TrustDimension } from '@/types/trust';

interface ModelRow {
  id: string;
  name: string;
  provider_id: string;
}

interface ProviderRow {
  id: string;
  name: string;
}

/**
 * GET /api/admin/trust/[modelId]
 *
 * Get all trust scores for a specific model.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;

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

    const serviceClient = createServiceClient();

    // Get model details
    const { data: modelData, error: modelError } = await serviceClient
      .from('models')
      .select('id, name, provider_id')
      .eq('id', modelId)
      .single();

    if (modelError || !modelData) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    const model = modelData as ModelRow;

    // Get provider name
    const { data: providerData } = await serviceClient
      .from('providers')
      .select('id, name')
      .eq('id', model.provider_id)
      .single();

    const provider = providerData as ProviderRow | null;

    // Get all trust scores for this model
    const { data: scoresData, error: scoresError } = await serviceClient
      .from('model_trust_scores')
      .select('*')
      .eq('model_id', modelId)
      .order('dimension', { ascending: true });

    if (scoresError) {
      console.error('Error fetching trust scores:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch trust scores' },
        { status: 500 }
      );
    }

    const scores = (scoresData || []) as ModelTrustScoreRecord[];

    return NextResponse.json({
      modelId: model.id,
      modelName: model.name,
      providerName: provider?.name || 'Unknown',
      scores,
    });
  } catch (error) {
    console.error('Admin trust GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/trust/[modelId]
 *
 * Update trust scores for a specific model.
 * Accepts an array of scores to upsert.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;

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
    const { scores } = body;

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
    console.error('Admin trust PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
