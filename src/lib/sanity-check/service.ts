/**
 * Sanity Check Service
 *
 * Orchestrates side-by-side model comparisons using OpenRouter.
 * Handles database operations for creating, running, and evaluating sanity checks.
 *
 * @see architecture.md Section 5 - Sanity Checks
 */

import { createServiceClient } from '@/lib/supabase/service';
import { runSanityCheck } from '@/lib/openrouter';
import type {
  CreateSanityCheckRequest,
  SanityCheckWithDetails,
  SanityCheckStatus,
  SubmitEvaluationRequest,
} from '@/types/sanity-check';

/**
 * Create a new sanity check and run it.
 */
export async function createAndRunSanityCheck(
  request: CreateSanityCheckRequest,
  userId?: string
): Promise<SanityCheckWithDetails> {
  const supabase = createServiceClient();

  // Fetch model details including OpenRouter IDs and pricing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: models, error: modelsError } = await (supabase as any)
    .from('models')
    .select(`
      id,
      name,
      openrouter_id,
      providers (
        name
      ),
      model_provider_pricing (
        input_price,
        output_price,
        is_primary
      )
    `)
    .in('id', [request.currentModelId, request.recommendedModelId]);

  if (modelsError || !models || models.length < 2) {
    throw new Error('Failed to fetch model details');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentModel = models.find((m: any) => m.id === request.currentModelId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recommendedModel = models.find((m: any) => m.id === request.recommendedModelId);

  if (!currentModel || !recommendedModel) {
    throw new Error('One or more models not found');
  }

  // Get pricing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPricing = currentModel.model_provider_pricing?.find((p: any) => p.is_primary);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recommendedPricing = recommendedModel.model_provider_pricing?.find((p: any) => p.is_primary);

  // Create the sanity check record
  const sanityCheckData = {
    use_case_id: request.useCaseId || null,
    user_id: userId || null,
    prompt: request.prompt,
    test_parameters: request.parameters || {},
    current_model_id: request.currentModelId,
    recommended_model_id: request.recommendedModelId,
    is_guest: request.isGuest || false,
    guest_session_id: request.guestSessionId || null,
    status: 'running' as const,
    // Expire guest sanity checks after 24 hours
    expires_at: request.isGuest
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sanityCheck, error: insertError } = await (supabase as any)
    .from('sanity_checks')
    .insert(sanityCheckData)
    .select()
    .single();

  if (insertError || !sanityCheck) {
    throw new Error(`Failed to create sanity check: ${insertError?.message}`);
  }

  // Run the sanity check via OpenRouter
  let result;
  let status: SanityCheckStatus = 'completed';
  let errorMessage: string | null = null;

  try {
    result = await runSanityCheck(
      request.prompt,
      currentModel.openrouter_id,
      recommendedModel.openrouter_id,
      {
        inputPrice: currentPricing?.input_price || 0,
        outputPrice: currentPricing?.output_price || 0,
      },
      {
        inputPrice: recommendedPricing?.input_price || 0,
        outputPrice: recommendedPricing?.output_price || 0,
      },
      {
        systemPrompt: request.parameters?.systemPrompt,
        maxTokens: request.parameters?.maxTokens,
        temperature: request.parameters?.temperature,
      }
    );

    // Check for errors in either result
    if (result.current.error && result.recommended.error) {
      status = 'failed';
      errorMessage = `Both models failed: Current: ${result.current.error}, Recommended: ${result.recommended.error}`;
    } else if (result.current.error || result.recommended.error) {
      // Partial failure - still mark as completed but store error
      errorMessage = result.current.error || result.recommended.error || null;
    }
  } catch (error) {
    status = 'failed';
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  // Update the sanity check with results
  const updateData = {
    status,
    error_message: errorMessage,
    completed_at: new Date().toISOString(),
    ...(result && {
      current_response: result.current.response || null,
      current_latency: result.current.latencyMs,
      current_tokens_used: result.current.totalTokens,
      current_cost: result.current.cost,
      recommended_response: result.recommended.response || null,
      recommended_latency: result.recommended.latencyMs,
      recommended_tokens_used: result.recommended.totalTokens,
      recommended_cost: result.recommended.cost,
    }),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateError } = await (supabase as any)
    .from('sanity_checks')
    .update(updateData)
    .eq('id', sanityCheck.id)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to update sanity check:', updateError);
  }

  // Build the response
  return buildSanityCheckResponse(updated || sanityCheck, currentModel, recommendedModel);
}

/**
 * Get a sanity check by ID.
 */
export async function getSanityCheck(
  id: string,
  userId?: string,
  guestSessionId?: string
): Promise<SanityCheckWithDetails | null> {
  const supabase = createServiceClient();

  // Fetch sanity check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('sanity_checks')
    .select(`
      *,
      current_model:models!sanity_checks_current_model_id_fkey (
        id,
        name,
        openrouter_id,
        providers (name),
        model_provider_pricing (input_price, output_price, is_primary)
      ),
      recommended_model:models!sanity_checks_recommended_model_id_fkey (
        id,
        name,
        openrouter_id,
        providers (name),
        model_provider_pricing (input_price, output_price, is_primary)
      )
    `)
    .eq('id', id);

  // Add ownership check
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (guestSessionId) {
    query = query.eq('guest_session_id', guestSessionId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return buildSanityCheckResponse(data, data.current_model, data.recommended_model);
}

/**
 * Submit user evaluation for a sanity check.
 */
export async function submitEvaluation(
  id: string,
  evaluation: SubmitEvaluationRequest,
  userId?: string,
  guestSessionId?: string
): Promise<SanityCheckWithDetails | null> {
  const supabase = createServiceClient();

  // Build update
  const updateData = {
    user_preference: evaluation.preference,
    user_notes: evaluation.notes || null,
    evaluation_criteria: evaluation.criteria || {},
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('sanity_checks')
    .update(updateData)
    .eq('id', id)
    .eq('status', 'completed'); // Can only evaluate completed checks

  // Add ownership check
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (guestSessionId) {
    query = query.eq('guest_session_id', guestSessionId);
  }

  const { data, error } = await query.select().single();

  if (error || !data) {
    return null;
  }

  // Fetch model details for response
  return getSanityCheck(id, userId, guestSessionId);
}

/**
 * Build a SanityCheckWithDetails response from database data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSanityCheckResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentModel: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recommendedModel: any
): SanityCheckWithDetails {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getModelSummary = (model: any) => {
    if (!model) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pricing = model.model_provider_pricing?.find((p: any) => p.is_primary);
    return {
      id: model.id,
      name: model.name,
      providerName: model.providers?.name || 'Unknown',
      openrouterId: model.openrouter_id,
      inputPrice: pricing?.input_price || 0,
      outputPrice: pricing?.output_price || 0,
    };
  };

  return {
    id: data.id,
    useCaseId: data.use_case_id,
    userId: data.user_id,
    prompt: data.prompt,
    testParameters: data.test_parameters || {},
    currentModel: getModelSummary(currentModel),
    recommendedModel: getModelSummary(recommendedModel),
    currentResult: {
      response: data.current_response,
      latencyMs: data.current_latency,
      tokensUsed: data.current_tokens_used,
      cost: data.current_cost,
    },
    recommendedResult: {
      response: data.recommended_response,
      latencyMs: data.recommended_latency,
      tokensUsed: data.recommended_tokens_used,
      cost: data.recommended_cost,
    },
    userPreference: data.user_preference,
    userNotes: data.user_notes,
    evaluationCriteria: data.evaluation_criteria || {},
    isGuest: data.is_guest,
    guestSessionId: data.guest_session_id,
    status: data.status,
    errorMessage: data.error_message,
    completedAt: data.completed_at,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
