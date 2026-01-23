/**
 * Recommendation Engine Types
 *
 * These types support the FitScore calculation algorithm and weight system
 * that powers ModelOptix's core recommendation engine.
 *
 * @see architecture.md Section 4 - Recommendation Engine
 */

/**
 * The five scoring factors used in FitScore calculation.
 * Users rank these in order of priority for their use case.
 */
export type ScoringFactor = 'cost' | 'speed' | 'quality' | 'trust' | 'context';

/**
 * Weight configuration for each scoring factor.
 * Values should sum to 1.0 for proper normalization.
 */
export interface WeightConfig {
  cost: number;
  speed: number;
  quality: number;
  trust: number;
  context: number;
}

/**
 * Individual scores for each factor before weighting.
 * All values normalized to 0-1 range.
 */
export interface FactorScores {
  cost: number;     // Lower price = higher score
  speed: number;    // Lower latency = higher score
  quality: number;  // Higher benchmark = higher score
  trust: number;    // Provider trust tier score
  context: number;  // Context sufficiency ratio
}

/**
 * Editorial status attached to a model's FitScore result.
 * Used to communicate editorial decisions in the UI.
 */
export interface EditorialStatus {
  type: 'exclude' | 'downrank' | 'flag';
  reason: string;
}

/**
 * Complete FitScore calculation result for a model.
 */
export interface FitScoreResult {
  /** Final weighted score (0-1) */
  score: number;
  /** Individual factor scores before weighting */
  factorScores: FactorScores;
  /** Weights applied in this calculation */
  appliedWeights: WeightConfig;
  /** Editorial override if applicable */
  editorialStatus?: EditorialStatus;
  /** Debug info for transparency */
  debug?: {
    rawScores: FactorScores;
    normalizedScores: FactorScores;
    editorialPenalty?: number;
  };
}

/**
 * A model candidate in the recommendation results.
 */
export interface ModelCandidate {
  modelId: string;
  modelName: string;
  providerId: string;
  providerName: string;
  fitScore: FitScoreResult;
  isCurrentModel: boolean;
  /** Potential savings if switching from current model */
  potentialSavings?: {
    costReductionPercent: number;
    estimatedMonthlySavings?: number;
  };
}

/**
 * User's priority ranking for scoring factors.
 * The user selects their top 3 priorities.
 */
export interface PriorityRanking {
  primary: ScoringFactor;
  secondary: ScoringFactor | null;
  tertiary: ScoringFactor | null;
  useEqualWeights: boolean;
}

/**
 * Normalization ranges for each factor.
 * Used to normalize raw values to 0-1 scale.
 */
export interface NormalizationRanges {
  cost: { min: number; max: number };
  speed: { min: number; max: number };
  quality: { min: number; max: number };
}

/**
 * Input for FitScore calculation.
 */
export interface FitScoreInput {
  /** Model data */
  model: {
    id: string;
    name: string;
    providerId: string;
    providerName: string;
    providerTrustTier: 'A' | 'B' | 'C' | 'unknown';
    contextLength: number;
    latencyP50: number | null;
    benchmarks: {
      qualityIndex?: number;
      qualityElo?: number;
    } | null;
    pricing: {
      inputPrice: number;  // per 1K tokens
      outputPrice: number; // per 1K tokens
    } | null;
  };
  /** Use case requirements */
  useCase: {
    id: string;
    requiredContextLength: number | null;
    priorities: PriorityRanking;
  };
  /** Normalization ranges (pre-calculated for efficiency) */
  ranges: NormalizationRanges;
  /** Editorial overrides for this model */
  editorialOverrides: Array<{
    type: 'exclude' | 'downrank' | 'flag';
    reason: string;
  }>;
}

/**
 * Recommendation opportunity - a better model found for a use case.
 */
export interface RecommendationOpportunity {
  useCaseId: string;
  useCaseName: string;
  currentModel: ModelCandidate | null;
  recommendedModel: ModelCandidate;
  improvementPercent: number;
  reasons: string[];
}

/**
 * Full recommendation result for a portfolio.
 */
export interface PortfolioRecommendations {
  opportunities: RecommendationOpportunity[];
  totalPotentialSavings: number;
  generatedAt: string;
}
