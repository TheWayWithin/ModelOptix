import { createClient } from '@/lib/supabase/server';
import { SavingsRecord } from '@/types/savings';

export async function recordSavingsFromOpportunity(
  opportunityId: string,
  userId: string
): Promise<SavingsRecord | null> {
  const supabase = await createClient();

  // Fetch the opportunity with related use case, product, and model details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opportunity, error: fetchError } = await (supabase as any)
    .from('opportunities')
    .select(`
      id,
      use_case_id,
      recommended_model_id,
      estimated_monthly_savings,
      improvement_percentage,
      use_cases!inner (
        id,
        current_model_id,
        product_id,
        products!inner (
          id,
          user_id
        )
      )
    `)
    .eq('id', opportunityId)
    .eq('use_cases.products.user_id', userId)
    .single();

  if (fetchError || !opportunity) {
    console.error('Error fetching opportunity for savings:', fetchError);
    return null;
  }

  // Check if savings already recorded for this opportunity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('savings_records')
    .select('id')
    .eq('opportunity_id', opportunityId)
    .maybeSingle();

  if (existing) {
    console.log('Savings already recorded for opportunity:', opportunityId);
    return null;
  }

  // Fetch model details for old and new models
  const modelIds = [
    opportunity.use_cases?.current_model_id,
    opportunity.recommended_model_id,
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
        providers (
          name
        )
      `)
      .in('id', modelIds);

    if (models) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modelsMap = Object.fromEntries(models.map((m: any) => [m.id, m]));
    }
  }

  const oldModelId = opportunity.use_cases?.current_model_id;
  const newModelId = opportunity.recommended_model_id;
  const oldModel = oldModelId ? modelsMap[oldModelId] : null;
  const newModel = newModelId ? modelsMap[newModelId] : null;

  // Record the savings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('savings_records')
    .insert({
      user_id: userId,
      opportunity_id: opportunity.id,
      product_id: opportunity.use_cases?.product_id || opportunity.use_cases?.products?.id || null,
      old_model: oldModel?.name || 'Unknown',
      old_provider: oldModel?.providers?.name || 'Unknown',
      new_model: newModel?.name || 'Unknown',
      new_provider: newModel?.providers?.name || 'Unknown',
      monthly_savings: opportunity.estimated_monthly_savings || 0,
      savings_percentage: opportunity.improvement_percentage || null,
      switched_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording savings:', error);
    return null;
  }

  return data;
}
