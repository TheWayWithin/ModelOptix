import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { OpportunityWithDetails } from '@/types/opportunity';

/**
 * GET /api/opportunities/[id]
 *
 * Fetch a single opportunity with all related data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch opportunity with joins
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: opportunity, error: queryError } = await (supabase as any)
      .from('opportunities')
      .select(`
        id,
        use_case_id,
        recommended_model_id,
        opportunity_type,
        improvement_percentage,
        estimated_monthly_savings,
        confidence_score,
        evidence,
        recommendation_reason,
        trade_offs,
        status,
        dismissed_reason,
        actioned_at,
        expires_at,
        created_at,
        updated_at,
        use_cases!inner (
          id,
          name,
          current_model_id,
          products!inner (
            name,
            user_id
          )
        )
      `)
      .eq('id', id)
      .eq('use_cases.products.user_id', user.id)
      .single();

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Opportunity not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching opportunity:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch opportunity' },
        { status: 500 }
      );
    }

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Get model details for current and recommended models
    const modelIds = [
      opportunity.recommended_model_id,
      opportunity.use_cases?.current_model_id,
    ].filter(Boolean);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let modelsMap: Record<string, any> = {};

    if (modelIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: models } = await (supabase as any)
        .from('models')
        .select(`
          id,
          name,
          context_length,
          latency_p50,
          providers (
            name
          ),
          model_provider_pricing (
            input_price,
            output_price,
            is_primary
          )
        `)
        .in('id', modelIds);

      if (models) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        modelsMap = Object.fromEntries(models.map((m: any) => [m.id, m]));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getModelSummary = (modelData: any) => {
      if (!modelData) return null;
      const pricing = modelData.model_provider_pricing?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p.is_primary
      );
      return {
        id: modelData.id,
        name: modelData.name,
        providerName: modelData.providers?.name || 'Unknown',
        contextLength: modelData.context_length,
        latencyP50: modelData.latency_p50,
        inputPrice: pricing?.input_price ?? null,
        outputPrice: pricing?.output_price ?? null,
      };
    };

    const useCase = opportunity.use_cases;
    const currentModelData = useCase?.current_model_id
      ? modelsMap[useCase.current_model_id]
      : null;
    const recommendedModelData = opportunity.recommended_model_id
      ? modelsMap[opportunity.recommended_model_id]
      : null;

    const result: OpportunityWithDetails = {
      id: opportunity.id,
      useCaseId: opportunity.use_case_id,
      useCase: {
        id: useCase.id,
        name: useCase.name,
        productName: useCase.products?.name || 'Unknown',
      },
      currentModel: getModelSummary(currentModelData),
      recommendedModel: getModelSummary(recommendedModelData),
      opportunityType: opportunity.opportunity_type,
      improvementPercentage: opportunity.improvement_percentage,
      estimatedMonthlySavings: opportunity.estimated_monthly_savings,
      confidenceScore: opportunity.confidence_score,
      recommendationReason: opportunity.recommendation_reason,
      tradeOffs: opportunity.trade_offs || [],
      status: opportunity.status,
      dismissedReason: opportunity.dismissed_reason,
      actionedAt: opportunity.actioned_at,
      expiresAt: opportunity.expires_at,
      createdAt: opportunity.created_at,
      updatedAt: opportunity.updated_at,
      // Include raw evidence for detail page
      evidence: opportunity.evidence,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Opportunity detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/opportunities/[id]
 *
 * Update opportunity status.
 * When accepting, also updates the use case's current model
 * to record the model switch.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate status if provided
    const validStatuses = ['active', 'dismissed', 'accepted', 'expired'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // First verify ownership and get full opportunity details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: checkError } = await (supabase as any)
      .from('opportunities')
      .select(`
        id,
        use_case_id,
        recommended_model_id,
        estimated_monthly_savings,
        status,
        use_cases!inner (
          id,
          current_model_id,
          products!inner (
            user_id
          )
        )
      `)
      .eq('id', id)
      .eq('use_cases.products.user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Prevent re-accepting an already accepted opportunity
    if (body.status === 'accepted' && existing.status === 'accepted') {
      return NextResponse.json(
        { error: 'Opportunity has already been accepted' },
        { status: 400 }
      );
    }

    // Build update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};
    if (body.status) {
      updates.status = body.status;
      if (body.status === 'dismissed') {
        updates.dismissed_reason = body.reason || 'User dismissed';
      }
      if (body.status === 'accepted') {
        updates.actioned_at = new Date().toISOString();
      }
    }

    // Update the opportunity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase as any)
      .from('opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating opportunity:', updateError);
      return NextResponse.json(
        { error: 'Failed to update opportunity' },
        { status: 500 }
      );
    }

    // If accepting, update the use case's current model and record savings
    if (body.status === 'accepted' && existing.recommended_model_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: useCaseError } = await (supabase as any)
        .from('use_cases')
        .update({
          current_model_id: existing.recommended_model_id,
        })
        .eq('id', existing.use_case_id);

      if (useCaseError) {
        console.error('Error updating use case model:', useCaseError);
        // Note: Opportunity is already updated, we log the error but continue
        // The user can manually update the model if needed
      }

      // Record savings from this optimization
      try {
        const { recordSavingsFromOpportunity } = await import(
          '@/lib/savings/record-savings'
        );
        const savingsRecord = await recordSavingsFromOpportunity(id, user.id);
        if (savingsRecord) {
          console.log(
            'Savings recorded:',
            savingsRecord.id,
            'Amount:',
            savingsRecord.monthly_savings
          );
        }
      } catch (savingsError) {
        console.error('Error recording savings:', savingsError);
        // Non-blocking - savings recording failure shouldn't fail the accept
      }

      // Expire other active opportunities for this use case
      // (since the model has changed, old recommendations are stale)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('opportunities')
        .update({
          status: 'expired',
          expires_at: new Date().toISOString(),
        })
        .eq('use_case_id', existing.use_case_id)
        .eq('status', 'active')
        .neq('id', id);
    }

    // If restoring to active from dismissed, clear the dismissed reason
    if (body.status === 'active' && existing.status === 'dismissed') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('opportunities')
        .update({ dismissed_reason: null })
        .eq('id', id);
    }

    return NextResponse.json({
      opportunity: updated,
      modelUpdated: body.status === 'accepted',
      message:
        body.status === 'accepted'
          ? 'Recommendation accepted. Use case model has been updated.'
          : body.status === 'dismissed'
            ? 'Opportunity dismissed.'
            : 'Opportunity restored.',
    });
  } catch (error) {
    console.error('Opportunity update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
