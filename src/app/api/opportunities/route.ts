import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type {
  OpportunityWithDetails,
  OpportunitiesResponse,
  OpportunityStatus,
  OpportunityType,
  OpportunitySortBy,
} from '@/types/opportunity';

/**
 * GET /api/opportunities
 *
 * Fetch opportunities for authenticated user's use cases.
 * Supports filtering and sorting.
 *
 * Query params:
 * - status: 'active' | 'dismissed' | 'accepted' | 'expired' | 'all' (default: 'active')
 * - use_case_id: UUID (optional)
 * - opportunity_type: OpportunityType | 'all' (optional)
 * - min_improvement: number (optional)
 * - sort_by: 'improvement' | 'savings' | 'created_at' (default: 'improvement')
 * - sort_order: 'asc' | 'desc' (default: 'desc')
 * - page: number (default: 1)
 * - page_size: number (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = (searchParams.get('status') || 'active') as OpportunityStatus | 'all';
    const useCaseId = searchParams.get('use_case_id');
    const opportunityType = searchParams.get('opportunity_type') as OpportunityType | 'all' | null;
    const minImprovement = searchParams.get('min_improvement');
    const sortBy = (searchParams.get('sort_by') || 'improvement') as OpportunitySortBy;
    const sortOrder = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20', 10)));

    // Build query - opportunities for user's use cases
    // Join through: opportunities -> use_cases -> functions -> products -> user_id
    let query = supabase
      .from('opportunities')
      .select(`
        id,
        use_case_id,
        recommended_model_id,
        opportunity_type,
        improvement_percentage,
        estimated_monthly_savings,
        confidence_score,
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
          functions!inner (
            name,
            products!inner (
              name,
              user_id
            )
          )
        )
      `, { count: 'exact' })
      .eq('use_cases.functions.products.user_id', user.id);

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (useCaseId) {
      query = query.eq('use_case_id', useCaseId);
    }

    if (opportunityType && opportunityType !== 'all') {
      query = query.eq('opportunity_type', opportunityType);
    }

    if (minImprovement) {
      const minValue = parseFloat(minImprovement);
      if (!isNaN(minValue)) {
        query = query.gte('improvement_percentage', minValue);
      }
    }

    // Apply sorting
    const sortColumn = sortBy === 'improvement' ? 'improvement_percentage'
      : sortBy === 'savings' ? 'estimated_monthly_savings'
      : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc', nullsFirst: false });

    // Apply pagination
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    // Execute query
    const { data: opportunities, count, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching opportunities:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch opportunities' },
        { status: 500 }
      );
    }

    if (!opportunities) {
      return NextResponse.json({
        opportunities: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
      } satisfies OpportunitiesResponse);
    }

    // Get model details for current and recommended models
    const modelIds = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    opportunities.forEach((opp: any) => {
      if (opp.recommended_model_id) modelIds.add(opp.recommended_model_id);
      if (opp.use_cases?.current_model_id) modelIds.add(opp.use_cases.current_model_id);
    });

    let modelsMap: Record<string, { id: string; name: string; providers: { name: string }; model_provider_pricing: { input_price: number; output_price: number }[] }> = {};

    if (modelIds.size > 0) {
      const { data: models } = await supabase
        .from('models')
        .select(`
          id,
          name,
          providers (
            name
          ),
          model_provider_pricing (
            input_price,
            output_price
          )
        `)
        .in('id', Array.from(modelIds));

      if (models) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        modelsMap = Object.fromEntries(models.map((m: any) => [m.id, m]));
      }
    }

    // Transform to API response format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedOpportunities: OpportunityWithDetails[] = opportunities.map((opp: any) => {
      const useCase = opp.use_cases;
      const currentModelData = useCase?.current_model_id ? modelsMap[useCase.current_model_id] : null;
      const recommendedModelData = opp.recommended_model_id ? modelsMap[opp.recommended_model_id] : null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getModelSummary = (modelData: any) => {
        if (!modelData) return null;
        const pricing = modelData.model_provider_pricing?.[0];
        return {
          id: modelData.id,
          name: modelData.name,
          providerName: modelData.providers?.name || 'Unknown',
          inputPrice: pricing?.input_price ?? null,
          outputPrice: pricing?.output_price ?? null,
        };
      };

      return {
        id: opp.id,
        useCaseId: opp.use_case_id,
        useCase: {
          id: useCase.id,
          name: useCase.name,
          functionName: useCase.functions?.name || 'Unknown',
          productName: useCase.functions?.products?.name || 'Unknown',
        },
        currentModel: getModelSummary(currentModelData),
        recommendedModel: getModelSummary(recommendedModelData),
        opportunityType: opp.opportunity_type,
        improvementPercentage: opp.improvement_percentage,
        estimatedMonthlySavings: opp.estimated_monthly_savings,
        confidenceScore: opp.confidence_score,
        recommendationReason: opp.recommendation_reason,
        tradeOffs: opp.trade_offs || [],
        status: opp.status,
        dismissedReason: opp.dismissed_reason,
        actionedAt: opp.actioned_at,
        expiresAt: opp.expires_at,
        createdAt: opp.created_at,
        updatedAt: opp.updated_at,
      };
    });

    const total = count || 0;
    const hasMore = from + pageSize < total;

    return NextResponse.json({
      opportunities: transformedOpportunities,
      total,
      page,
      pageSize,
      hasMore,
    } satisfies OpportunitiesResponse);
  } catch (error) {
    console.error('Opportunities API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
