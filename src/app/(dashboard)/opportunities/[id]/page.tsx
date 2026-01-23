import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OpportunityDetail } from '@/components/opportunities/opportunity-detail';
import type { OpportunityWithDetails } from '@/types/opportunity';

export const metadata: Metadata = {
  title: 'Opportunity Details | ModelOptix',
  description: 'View model optimization opportunity details',
};

async function getOpportunity(id: string): Promise<OpportunityWithDetails | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch opportunity with ownership verification
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opportunity, error } = await (supabase as any)
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
        functions!inner (
          name,
          products!inner (
            name,
            user_id
          )
        )
      )
    `)
    .eq('id', id)
    .eq('use_cases.functions.products.user_id', user.id)
    .single();

  if (error || !opportunity) {
    return null;
  }

  // Get model details
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pricing = modelData.model_provider_pricing?.find((p: any) => p.is_primary);
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

  return {
    id: opportunity.id,
    useCaseId: opportunity.use_case_id,
    useCase: {
      id: useCase.id,
      name: useCase.name,
      functionName: useCase.functions?.name || 'Unknown',
      productName: useCase.functions?.products?.name || 'Unknown',
    },
    currentModel: getModelSummary(modelsMap[useCase?.current_model_id]),
    recommendedModel: getModelSummary(modelsMap[opportunity.recommended_model_id]),
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
    evidence: opportunity.evidence,
  };
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunity(id);

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <OpportunityDetail opportunity={opportunity} />
    </div>
  );
}
