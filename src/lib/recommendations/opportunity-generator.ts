/**
 * Opportunity Generator
 *
 * Scans use cases and generates improvement opportunities
 * by comparing current model FitScores with alternatives.
 *
 * Schedule: Daily at 5am UTC (runs after model catalog sync at 2-4am)
 * Threshold: Create Opportunity if improvement > 10%
 *
 * @see architecture.md Section 4 - Recommendation Engine
 */

import { createServiceClient } from '@/lib/supabase/service';
import type {
  FitScoreInput,
  FitScoreResult,
  NormalizationRanges,
  PriorityRanking,
  FactorScores,
  WeightConfig,
  ScoringFactor,
} from '@/types/recommendation';

import {
  calculateFitScore,
  calculateImprovement,
  generateRecommendationReasons,
  MINIMUM_IMPROVEMENT_PERCENT,
  MAX_RECOMMENDATIONS_PER_USE_CASE,
  DEFAULT_NORMALIZATION_RANGES,
  NORMALIZATION_CACHE_TTL,
} from './index';

// Cache for normalization ranges
let normalizationCache: {
  data: NormalizationRanges | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

/**
 * Extended use case with joined context data.
 */
interface UseCaseWithContext {
  id: string;
  name: string;
  currentModelId: string | null;
  primaryNeed: ScoringFactor;
  secondaryNeed: ScoringFactor | null;
  tertiaryNeed: ScoringFactor | null;
  useEqualWeights: boolean;
  requiredContext: number | null;
  functionId: string;
  functionName: string;
  productId: string;
  productName: string;
  userId: string;
}

/**
 * Model with provider and pricing context.
 */
interface ModelWithContext {
  id: string;
  name: string;
  contextLength: number;
  latencyP50: number | null;
  benchmarks: {
    qualityIndex?: number;
    qualityElo?: number;
    [key: string]: number | undefined;
  } | null;
  providerId: string;
  providerName: string;
  trustTier: 'A' | 'B' | 'C' | 'unknown';
  inputPrice: number | null;
  outputPrice: number | null;
}

/**
 * Editorial override from database.
 */
interface DbEditorialOverride {
  modelId: string;
  overrideType: 'exclude' | 'downrank' | 'flag';
  reason: string;
  active: boolean;
}

/**
 * Evidence stored with each opportunity.
 */
interface OpportunityEvidence {
  currentModel: {
    id: string;
    name: string;
    fitScore: number;
    factorScores: FactorScores;
  } | null;
  recommendedModel: {
    id: string;
    name: string;
    fitScore: number;
    factorScores: FactorScores;
  };
  appliedWeights: WeightConfig;
  reasons: string[];
  generatedAt: string;
}

type OpportunityType =
  | 'cost_saving'
  | 'speed_improvement'
  | 'quality_upgrade'
  | 'trust_upgrade'
  | 'general_improvement';

/**
 * Result of opportunity generation.
 */
export interface GenerateOpportunitiesResult {
  processed: number;
  opportunitiesCreated: number;
  errors: string[];
}

/**
 * Fetch normalization ranges from database.
 * Cached for NORMALIZATION_CACHE_TTL (5 minutes).
 */
async function getNormalizationRanges(): Promise<NormalizationRanges> {
  const now = Date.now();

  // Return cached data if still valid
  if (
    normalizationCache.data &&
    now - normalizationCache.timestamp < NORMALIZATION_CACHE_TTL
  ) {
    return normalizationCache.data;
  }

  const supabase = createServiceClient();

  // Fetch min/max values for normalization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: models, error } = await (supabase as any)
    .from('models')
    .select(
      `
      latency_p50,
      benchmarks,
      model_provider_pricing (
        input_price,
        output_price,
        is_primary
      )
    `
    )
    .eq('is_available', true);

  if (error) {
    console.error('[getNormalizationRanges] Error:', error);
    // Return defaults if query fails
    return DEFAULT_NORMALIZATION_RANGES;
  }

  if (!models || models.length === 0) {
    return DEFAULT_NORMALIZATION_RANGES;
  }

  // Calculate ranges from actual data
  let minCost = Infinity;
  let maxCost = 0;
  let minSpeed = Infinity;
  let maxSpeed = 0;
  let minQuality = Infinity;
  let maxQuality = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const model of models as any[]) {
    // Speed (latency)
    if (model.latency_p50 !== null) {
      minSpeed = Math.min(minSpeed, model.latency_p50);
      maxSpeed = Math.max(maxSpeed, model.latency_p50);
    }

    // Cost (use primary pricing, weighted average)
    const pricing = model.model_provider_pricing as Array<{
      input_price: number | null;
      output_price: number | null;
      is_primary: boolean;
    }> | null;
    const primaryPricing = pricing?.find((p) => p.is_primary);
    if (primaryPricing?.input_price && primaryPricing?.output_price) {
      const avgCost =
        primaryPricing.input_price * 0.7 + primaryPricing.output_price * 0.3;
      minCost = Math.min(minCost, avgCost);
      maxCost = Math.max(maxCost, avgCost);
    }

    // Quality (from benchmarks)
    const benchmarks = model.benchmarks as Record<string, number> | null;
    const qualityValue =
      benchmarks?.quality_index ?? benchmarks?.qualityIndex ?? benchmarks?.mmlu;
    if (qualityValue !== undefined) {
      minQuality = Math.min(minQuality, qualityValue);
      maxQuality = Math.max(maxQuality, qualityValue);
    }
  }

  const ranges: NormalizationRanges = {
    cost: {
      min: minCost === Infinity ? DEFAULT_NORMALIZATION_RANGES.cost.min : minCost,
      max: maxCost === 0 ? DEFAULT_NORMALIZATION_RANGES.cost.max : maxCost,
    },
    speed: {
      min: minSpeed === Infinity ? DEFAULT_NORMALIZATION_RANGES.speed.min : minSpeed,
      max: maxSpeed === 0 ? DEFAULT_NORMALIZATION_RANGES.speed.max : maxSpeed,
    },
    quality: {
      min: minQuality === Infinity ? DEFAULT_NORMALIZATION_RANGES.quality.min : minQuality,
      max: maxQuality === 0 ? DEFAULT_NORMALIZATION_RANGES.quality.max : maxQuality,
    },
  };

  // Update cache
  normalizationCache = { data: ranges, timestamp: now };
  console.log('[getNormalizationRanges] Computed ranges:', ranges);

  return ranges;
}

/**
 * Fetch all active use cases with their priorities.
 */
async function getActiveUseCases(): Promise<UseCaseWithContext[]> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('use_cases')
    .select(
      `
      id,
      name,
      current_model_id,
      primary_need,
      secondary_need,
      tertiary_need,
      use_equal_weights,
      required_context,
      function_id,
      functions!inner (
        id,
        name,
        status,
        product_id,
        products!inner (
          id,
          name,
          user_id,
          status
        )
      )
    `
    )
    .eq('status', 'active');

  if (error) {
    console.error('[getActiveUseCases] Error:', error);
    throw new Error(`Failed to fetch use cases: ${error.message}`);
  }

  if (!data) return [];

  // Filter and transform
  return data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((row: any) => {
      const func = row.functions as { status: string; products: { status: string } };
      return func?.status === 'active' && func?.products?.status === 'active';
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => {
      const func = row.functions as {
        id: string;
        name: string;
        products: { id: string; name: string; user_id: string };
      };

      return {
        id: row.id,
        name: row.name,
        currentModelId: row.current_model_id,
        primaryNeed: (row.primary_need ?? 'cost') as ScoringFactor,
        secondaryNeed: row.secondary_need as ScoringFactor | null,
        tertiaryNeed: row.tertiary_need as ScoringFactor | null,
        useEqualWeights: row.use_equal_weights ?? false,
        requiredContext: row.required_context,
        functionId: func.id,
        functionName: func.name,
        productId: func.products.id,
        productName: func.products.name,
        userId: func.products.user_id,
      };
    });
}

/**
 * Fetch all available models with pricing.
 */
async function getAvailableModels(): Promise<ModelWithContext[]> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('models')
    .select(
      `
      id,
      name,
      context_length,
      latency_p50,
      benchmarks,
      provider_id,
      providers!inner (
        id,
        name,
        trust_tier
      ),
      model_provider_pricing (
        input_price,
        output_price,
        is_primary
      )
    `
    )
    .eq('is_available', true);

  if (error) {
    console.error('[getAvailableModels] Error:', error);
    throw new Error(`Failed to fetch models: ${error.message}`);
  }

  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => {
    const provider = row.providers as { id: string; name: string; trust_tier: string };
    const pricing = row.model_provider_pricing as Array<{
      input_price: number | null;
      output_price: number | null;
      is_primary: boolean;
    }> | null;
    const primaryPricing = pricing?.find((p) => p.is_primary);

    return {
      id: row.id,
      name: row.name,
      contextLength: row.context_length ?? 4096,
      latencyP50: row.latency_p50,
      benchmarks: row.benchmarks as ModelWithContext['benchmarks'],
      providerId: provider.id,
      providerName: provider.name,
      trustTier: (provider.trust_tier ?? 'unknown') as 'A' | 'B' | 'C' | 'unknown',
      inputPrice: primaryPricing?.input_price ?? null,
      outputPrice: primaryPricing?.output_price ?? null,
    };
  });
}

/**
 * Fetch editorial overrides for all models.
 */
async function getEditorialOverrides(): Promise<Map<string, DbEditorialOverride[]>> {
  const supabase = createServiceClient();
  const overrideMap = new Map<string, DbEditorialOverride[]>();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('editorial_overrides')
      .select('model_id, override_type, reason, active')
      .eq('active', true);

    if (error) {
      // Table might not exist yet - gracefully return empty
      console.log('[getEditorialOverrides] Skipping (table may not exist):', error.message);
      return overrideMap;
    }

    if (data) {
      for (const row of data) {
        const modelId = row.model_id;
        if (!overrideMap.has(modelId)) {
          overrideMap.set(modelId, []);
        }
        overrideMap.get(modelId)!.push({
          modelId: row.model_id,
          overrideType: row.override_type as 'exclude' | 'downrank' | 'flag',
          reason: row.reason,
          active: row.active,
        });
      }
    }
  } catch (err) {
    console.warn('[getEditorialOverrides] Exception:', err);
  }

  return overrideMap;
}

/**
 * Convert model to FitScoreInput format.
 */
function modelToFitScoreInput(
  model: ModelWithContext,
  useCase: UseCaseWithContext,
  ranges: NormalizationRanges,
  overrides: DbEditorialOverride[]
): FitScoreInput {
  // Build priority ranking
  const priorities: PriorityRanking = {
    primary: useCase.primaryNeed,
    secondary: useCase.secondaryNeed,
    tertiary: useCase.tertiaryNeed,
    useEqualWeights: useCase.useEqualWeights,
  };

  // Convert editorial overrides to expected format
  const editorialOverrides = overrides.map((o) => ({
    type: o.overrideType,
    reason: o.reason,
  }));

  return {
    model: {
      id: model.id,
      name: model.name,
      providerId: model.providerId,
      providerName: model.providerName,
      providerTrustTier: model.trustTier,
      contextLength: model.contextLength,
      latencyP50: model.latencyP50,
      benchmarks: model.benchmarks
        ? {
            qualityIndex: model.benchmarks.qualityIndex ?? model.benchmarks.quality_index,
            qualityElo: model.benchmarks.qualityElo ?? model.benchmarks.quality_elo,
          }
        : null,
      pricing:
        model.inputPrice !== null && model.outputPrice !== null
          ? {
              inputPrice: model.inputPrice,
              outputPrice: model.outputPrice,
            }
          : null,
    },
    useCase: {
      id: useCase.id,
      requiredContextLength: useCase.requiredContext,
      priorities,
    },
    ranges,
    editorialOverrides,
  };
}

/**
 * Determine opportunity type based on factor improvements.
 */
function determineOpportunityType(
  currentScores: FactorScores | null,
  recommendedScores: FactorScores
): OpportunityType {
  if (!currentScores) {
    return 'general_improvement';
  }

  const improvements = {
    cost: recommendedScores.cost - currentScores.cost,
    speed: recommendedScores.speed - currentScores.speed,
    quality: recommendedScores.quality - currentScores.quality,
    trust: recommendedScores.trust - currentScores.trust,
  };

  // Find dominant improvement
  let maxFactor: keyof typeof improvements = 'cost';
  let maxImprovement = improvements.cost;

  for (const [factor, improvement] of Object.entries(improvements)) {
    if (improvement > maxImprovement) {
      maxImprovement = improvement;
      maxFactor = factor as keyof typeof improvements;
    }
  }

  // If no single factor dominates (< 0.1 difference), it's general
  if (maxImprovement < 0.1) {
    return 'general_improvement';
  }

  const typeMap: Record<keyof typeof improvements, OpportunityType> = {
    cost: 'cost_saving',
    speed: 'speed_improvement',
    quality: 'quality_upgrade',
    trust: 'trust_upgrade',
  };

  return typeMap[maxFactor];
}

/**
 * Estimate monthly savings based on cost difference.
 */
function estimateMonthlySavings(
  currentModel: ModelWithContext | null,
  recommendedModel: ModelWithContext,
  estimatedMonthlyTokens = 1_000_000
): number | null {
  if (!currentModel?.inputPrice || !currentModel?.outputPrice) return null;
  if (!recommendedModel.inputPrice || !recommendedModel.outputPrice) return null;

  // Weighted cost per 1K tokens
  const currentCost = currentModel.inputPrice * 0.7 + currentModel.outputPrice * 0.3;
  const recommendedCost =
    recommendedModel.inputPrice * 0.7 + recommendedModel.outputPrice * 0.3;

  // Calculate monthly savings (cost is per 1K tokens)
  const tokensInK = estimatedMonthlyTokens / 1000;
  const currentMonthly = currentCost * tokensInK;
  const recommendedMonthly = recommendedCost * tokensInK;

  const savings = currentMonthly - recommendedMonthly;
  return savings > 0 ? Math.round(savings * 100) / 100 : null;
}

/**
 * Generate opportunities for a single use case.
 */
async function generateOpportunitiesForUseCase(
  useCase: UseCaseWithContext,
  models: ModelWithContext[],
  ranges: NormalizationRanges,
  overrides: Map<string, DbEditorialOverride[]>
): Promise<Array<{
  useCaseId: string;
  recommendedModelId: string;
  opportunityType: OpportunityType;
  improvementPercentage: number;
  estimatedMonthlySavings: number | null;
  evidence: OpportunityEvidence;
}>> {
  const opportunities: Array<{
    useCaseId: string;
    recommendedModelId: string;
    opportunityType: OpportunityType;
    improvementPercentage: number;
    estimatedMonthlySavings: number | null;
    evidence: OpportunityEvidence;
  }> = [];

  // Find and score current model
  const currentModel = useCase.currentModelId
    ? models.find((m) => m.id === useCase.currentModelId)
    : null;

  let currentResult: FitScoreResult | null = null;
  if (currentModel) {
    const currentInput = modelToFitScoreInput(
      currentModel,
      useCase,
      ranges,
      overrides.get(currentModel.id) || []
    );
    currentResult = calculateFitScore(currentInput);
  }

  // Score all alternatives
  const candidates: Array<{
    model: ModelWithContext;
    result: FitScoreResult;
    improvement: number;
  }> = [];

  for (const model of models) {
    // Skip current model
    if (model.id === useCase.currentModelId) continue;

    // Skip if doesn't meet context requirements
    if (useCase.requiredContext && model.contextLength < useCase.requiredContext) {
      continue;
    }

    const input = modelToFitScoreInput(
      model,
      useCase,
      ranges,
      overrides.get(model.id) || []
    );
    const result = calculateFitScore(input);

    // Skip excluded models
    if (result.score === 0 && result.editorialStatus?.type === 'exclude') {
      continue;
    }

    const improvement = calculateImprovement(
      currentResult ?? { score: 0, factorScores: { cost: 0, speed: 0, quality: 0, trust: 0, context: 0 }, appliedWeights: result.appliedWeights },
      result
    );

    if (improvement >= MINIMUM_IMPROVEMENT_PERCENT) {
      candidates.push({ model, result, improvement });
    }
  }

  // Sort by improvement and take top N
  candidates.sort((a, b) => b.improvement - a.improvement);
  const topCandidates = candidates.slice(0, MAX_RECOMMENDATIONS_PER_USE_CASE);

  // Create opportunity records
  for (const candidate of topCandidates) {
    const opportunityType = determineOpportunityType(
      currentResult?.factorScores ?? null,
      candidate.result.factorScores
    );

    const reasons = currentResult
      ? generateRecommendationReasons(
          currentResult.factorScores,
          candidate.result.factorScores,
          candidate.result.appliedWeights
        )
      : ['Better overall performance'];

    const evidence: OpportunityEvidence = {
      currentModel: currentModel && currentResult
        ? {
            id: currentModel.id,
            name: currentModel.name,
            fitScore: currentResult.score,
            factorScores: currentResult.factorScores,
          }
        : null,
      recommendedModel: {
        id: candidate.model.id,
        name: candidate.model.name,
        fitScore: candidate.result.score,
        factorScores: candidate.result.factorScores,
      },
      appliedWeights: candidate.result.appliedWeights,
      reasons,
      generatedAt: new Date().toISOString(),
    };

    opportunities.push({
      useCaseId: useCase.id,
      recommendedModelId: candidate.model.id,
      opportunityType,
      improvementPercentage: Math.round(candidate.improvement * 10) / 10,
      estimatedMonthlySavings: estimateMonthlySavings(currentModel ?? null, candidate.model),
      evidence,
    });
  }

  return opportunities;
}

/**
 * Save opportunities to database.
 */
async function saveOpportunities(
  useCaseId: string,
  opportunities: Array<{
    useCaseId: string;
    recommendedModelId: string;
    opportunityType: OpportunityType;
    improvementPercentage: number;
    estimatedMonthlySavings: number | null;
    evidence: OpportunityEvidence;
  }>
): Promise<void> {
  const supabase = createServiceClient();

  // Expire old opportunities for this use case
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('opportunities')
    .update({ status: 'expired' })
    .eq('use_case_id', useCaseId)
    .eq('status', 'active');

  // Insert new opportunities
  if (opportunities.length > 0) {
    const records = opportunities.map((opp) => ({
      use_case_id: opp.useCaseId,
      recommended_model_id: opp.recommendedModelId,
      opportunity_type: opp.opportunityType,
      improvement_percentage: opp.improvementPercentage,
      estimated_monthly_savings: opp.estimatedMonthlySavings,
      evidence: opp.evidence,
      status: 'active' as const,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('opportunities').insert(records);

    if (error) {
      throw new Error(`Failed to save opportunities: ${error.message}`);
    }
  }
}

/**
 * Main entry point - generate all opportunities.
 */
export async function generateAllOpportunities(): Promise<GenerateOpportunitiesResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let processed = 0;
  let opportunitiesCreated = 0;

  console.log('[generateAllOpportunities] Starting');

  try {
    // Fetch all data upfront
    const [ranges, useCases, models, overrides] = await Promise.all([
      getNormalizationRanges(),
      getActiveUseCases(),
      getAvailableModels(),
      getEditorialOverrides(),
    ]);

    console.log(
      `[generateAllOpportunities] Loaded ${useCases.length} use cases, ${models.length} models`
    );

    if (useCases.length === 0 || models.length === 0) {
      return { processed: 0, opportunitiesCreated: 0, errors: [] };
    }

    // Process each use case
    for (const useCase of useCases) {
      try {
        const opportunities = await generateOpportunitiesForUseCase(
          useCase,
          models,
          ranges,
          overrides
        );

        if (opportunities.length > 0) {
          await saveOpportunities(useCase.id, opportunities);
          opportunitiesCreated += opportunities.length;
        }

        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Use case ${useCase.id}: ${msg}`);
        console.error(`[generateAllOpportunities] Error for ${useCase.id}:`, err);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[generateAllOpportunities] Complete in ${duration}ms: ${processed} processed, ${opportunitiesCreated} created, ${errors.length} errors`
    );

    return { processed, opportunitiesCreated, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[generateAllOpportunities] Fatal error:', err);
    return { processed, opportunitiesCreated, errors: [msg, ...errors] };
  }
}

/**
 * Clear normalization cache (for testing).
 */
export function clearNormalizationCache(): void {
  normalizationCache = { data: null, timestamp: 0 };
}
