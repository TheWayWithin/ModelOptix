/**
 * Recommendation Engine
 *
 * This module exports all recommendation engine functionality.
 *
 * @example
 * ```typescript
 * import {
 *   calculateFitScore,
 *   calculateWeights,
 *   TRUST_TIER_SCORES,
 * } from '@/lib/recommendations';
 *
 * const weights = calculateWeights(useCase.priorities);
 * const result = calculateFitScore({ model, useCase, ranges, editorialOverrides });
 * ```
 *
 * @see architecture.md Section 4 - Recommendation Engine
 */

// Core FitScore calculation
export {
  calculateFitScore,
  calculateImprovement,
  generateRecommendationReasons,
} from './fit-score';

// Weight system
export {
  calculateWeights,
  validateWeights,
  describeWeights,
  getDefaultPriorityRanking,
  RANKED_WEIGHTS,
  EQUAL_WEIGHT,
  ALL_FACTORS,
} from './weights';

// Thresholds and constants
export {
  MINIMUM_IMPROVEMENT_PERCENT,
  TRUST_TIER_SCORES,
  DEFAULT_REQUIRED_CONTEXT,
  DOWNRANK_PENALTY,
  DEFAULT_NORMALIZATION_RANGES,
  PRICE_RATIO,
  MEDIAN_LATENCY_FALLBACK,
  ELO_TO_INDEX_CONVERSION,
  MAX_RECOMMENDATIONS_PER_USE_CASE,
  IMPROVEMENT_CATEGORIES,
  NORMALIZATION_CACHE_TTL,
} from './thresholds';

// Editorial overrides
export {
  shouldExcludeModel,
  getDownrankPenalty,
  getEditorialStatus,
  applyEditorialAdjustments,
  filterExcludedModels,
  formatEditorialReason,
  type EditorialOverride,
} from './editorial';

// Re-export types for convenience
export type {
  ScoringFactor,
  WeightConfig,
  FactorScores,
  EditorialStatus,
  FitScoreResult,
  FitScoreInput,
  ModelCandidate,
  PriorityRanking,
  NormalizationRanges,
  RecommendationOpportunity,
  PortfolioRecommendations,
} from '@/types/recommendation';
