/**
 * FitScore Calculation Algorithm
 *
 * The FitScore is the core metric for ranking models against a use case.
 * It combines five factors (cost, speed, quality, trust, context) with
 * user-defined weights to produce a single 0-1 score.
 *
 * Algorithm Overview:
 * 1. Normalize each factor to 0-1 scale
 * 2. Apply user's weight priorities
 * 3. Calculate weighted sum
 * 4. Apply editorial adjustments
 * 5. Return final score with debug info
 *
 * @see architecture.md Section 4.1 - FitScore Algorithm
 */

import type {
  FitScoreInput,
  FitScoreResult,
  FactorScores,
  WeightConfig,
  NormalizationRanges,
} from '@/types/recommendation';

import { calculateWeights } from './weights';
import {
  TRUST_TIER_SCORES,
  DEFAULT_REQUIRED_CONTEXT,
  MEDIAN_LATENCY_FALLBACK,
  PRICE_RATIO,
  ELO_TO_INDEX_CONVERSION,
} from './thresholds';
import {
  shouldExcludeModel,
  getDownrankPenalty,
  getEditorialStatus,
  type EditorialOverride,
} from './editorial';

/**
 * Calculate the FitScore for a model against a use case.
 *
 * @param input - All data needed for FitScore calculation
 * @returns Complete FitScore result with breakdown
 */
export function calculateFitScore(input: FitScoreInput): FitScoreResult {
  const { model, useCase, ranges, editorialOverrides } = input;

  // Convert editorial overrides to the format expected by editorial.ts
  const overrides: EditorialOverride[] = editorialOverrides.map((o, i) => ({
    id: `override-${i}`,
    modelId: model.id,
    overrideType: o.type,
    reason: o.reason,
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: null,
  }));

  // Check for exclusion first (short-circuit)
  if (shouldExcludeModel(overrides)) {
    return createExcludedResult(overrides);
  }

  // Calculate individual factor scores (normalized 0-1)
  const factorScores = calculateFactorScores(model, useCase, ranges);

  // Calculate weights based on user priorities
  const appliedWeights = calculateWeights(useCase.priorities);

  // Calculate weighted sum
  const rawScore = calculateWeightedSum(factorScores, appliedWeights);

  // Apply editorial penalty if applicable
  const editorialPenalty = getDownrankPenalty(overrides);
  const finalScore = rawScore * editorialPenalty;

  // Get editorial status for UI
  const editorialStatus = getEditorialStatus(overrides);

  return {
    score: clampScore(finalScore),
    factorScores,
    appliedWeights,
    editorialStatus,
    debug: {
      rawScores: factorScores,
      normalizedScores: factorScores, // Same since we normalize during calculation
      editorialPenalty: editorialPenalty < 1.0 ? editorialPenalty : undefined,
    },
  };
}

/**
 * Calculate individual scores for each factor.
 */
function calculateFactorScores(
  model: FitScoreInput['model'],
  useCase: FitScoreInput['useCase'],
  ranges: NormalizationRanges
): FactorScores {
  return {
    cost: calculateCostScore(model.pricing, ranges.cost),
    speed: calculateSpeedScore(model.latencyP50, ranges.speed),
    quality: calculateQualityScore(model.benchmarks, ranges.quality),
    trust: calculateTrustScore(model.providerTrustTier),
    context: calculateContextScore(model.contextLength, useCase.requiredContextLength),
  };
}

/**
 * Calculate cost score (lower price = higher score).
 *
 * Uses weighted combination of input and output prices.
 * Normalized against min/max prices in the database.
 */
function calculateCostScore(
  pricing: FitScoreInput['model']['pricing'],
  range: NormalizationRanges['cost']
): number {
  if (!pricing) {
    return 0.5; // Neutral score when no pricing available
  }

  // Calculate effective price using typical input/output ratio
  const effectivePrice =
    pricing.inputPrice * PRICE_RATIO.input +
    pricing.outputPrice * PRICE_RATIO.output;

  // Normalize: lower price = higher score
  // Score = 1 - ((price - min) / (max - min))
  const normalized = normalizeInverse(effectivePrice, range.min, range.max);

  return clampScore(normalized);
}

/**
 * Calculate speed score (lower latency = higher score).
 *
 * Uses p50 latency in milliseconds.
 * Falls back to median if no latency data available.
 */
function calculateSpeedScore(
  latencyP50: number | null,
  range: NormalizationRanges['speed']
): number {
  // Use fallback for missing latency data
  const latency = latencyP50 ?? MEDIAN_LATENCY_FALLBACK;

  // Normalize: lower latency = higher score
  const normalized = normalizeInverse(latency, range.min, range.max);

  return clampScore(normalized);
}

/**
 * Calculate quality score (higher benchmark = higher score).
 *
 * Prefers quality_index if available, falls back to quality_elo.
 */
function calculateQualityScore(
  benchmarks: FitScoreInput['model']['benchmarks'],
  range: NormalizationRanges['quality']
): number {
  if (!benchmarks) {
    return 0.5; // Neutral score when no benchmarks available
  }

  // Prefer quality_index if available
  if (benchmarks.qualityIndex !== undefined) {
    const normalized = normalize(benchmarks.qualityIndex, range.min, range.max);
    return clampScore(normalized);
  }

  // Fall back to quality_elo, converted to index scale
  if (benchmarks.qualityElo !== undefined) {
    const { minElo, maxElo } = ELO_TO_INDEX_CONVERSION;
    const qualityIndex = ((benchmarks.qualityElo - minElo) / (maxElo - minElo)) * 100;
    const normalized = normalize(qualityIndex, range.min, range.max);
    return clampScore(normalized);
  }

  return 0.5; // Neutral if no quality data
}

/**
 * Calculate trust score based on provider tier.
 *
 * Simple lookup - no normalization needed.
 */
function calculateTrustScore(
  trustTier: 'A' | 'B' | 'C' | 'unknown'
): number {
  return TRUST_TIER_SCORES[trustTier];
}

/**
 * Calculate context score based on sufficiency ratio.
 *
 * Score = min(1.0, modelContext / requiredContext)
 * Models with more context than needed get max score.
 */
function calculateContextScore(
  modelContextLength: number,
  requiredContextLength: number | null
): number {
  const required = requiredContextLength ?? DEFAULT_REQUIRED_CONTEXT;

  if (required <= 0) {
    return 1.0; // No requirement = full score
  }

  const sufficiencyRatio = modelContextLength / required;
  return clampScore(Math.min(1.0, sufficiencyRatio));
}

/**
 * Calculate weighted sum of factor scores.
 */
function calculateWeightedSum(
  scores: FactorScores,
  weights: WeightConfig
): number {
  return (
    scores.cost * weights.cost +
    scores.speed * weights.speed +
    scores.quality * weights.quality +
    scores.trust * weights.trust +
    scores.context * weights.context
  );
}

/**
 * Normalize a value to 0-1 range (higher value = higher score).
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/**
 * Normalize a value to 0-1 range (lower value = higher score).
 */
function normalizeInverse(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return 1 - (value - min) / (max - min);
}

/**
 * Clamp a score to valid 0-1 range.
 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(1, score));
}

/**
 * Create a result for excluded models.
 */
function createExcludedResult(overrides: EditorialOverride[]): FitScoreResult {
  const editorialStatus = getEditorialStatus(overrides);

  return {
    score: 0,
    factorScores: {
      cost: 0,
      speed: 0,
      quality: 0,
      trust: 0,
      context: 0,
    },
    appliedWeights: {
      cost: 0,
      speed: 0,
      quality: 0,
      trust: 0,
      context: 0,
    },
    editorialStatus,
    debug: {
      rawScores: { cost: 0, speed: 0, quality: 0, trust: 0, context: 0 },
      normalizedScores: { cost: 0, speed: 0, quality: 0, trust: 0, context: 0 },
    },
  };
}

/**
 * Compare two FitScores and return improvement percentage.
 *
 * @param current - Current model's FitScore
 * @param candidate - Candidate model's FitScore
 * @returns Improvement as a percentage (e.g., 25 for 25% better)
 */
export function calculateImprovement(
  current: FitScoreResult,
  candidate: FitScoreResult
): number {
  if (current.score === 0) {
    return candidate.score > 0 ? 100 : 0;
  }

  return ((candidate.score - current.score) / current.score) * 100;
}

/**
 * Generate human-readable reasons for a recommendation.
 *
 * @param current - Current model's scores
 * @param candidate - Candidate model's scores
 * @param weights - Applied weights
 * @returns Array of reason strings
 */
export function generateRecommendationReasons(
  current: FactorScores,
  candidate: FactorScores,
  weights: WeightConfig
): string[] {
  const reasons: string[] = [];
  const factors: Array<{ key: keyof FactorScores; label: string }> = [
    { key: 'cost', label: 'cost' },
    { key: 'speed', label: 'speed' },
    { key: 'quality', label: 'quality' },
    { key: 'trust', label: 'trust' },
    { key: 'context', label: 'context window' },
  ];

  // Sort by weight to prioritize important factors
  const sortedFactors = [...factors].sort((a, b) => weights[b.key] - weights[a.key]);

  for (const { key, label } of sortedFactors) {
    const improvement = candidate[key] - current[key];

    if (improvement > 0.1) {
      const percent = Math.round(improvement * 100);
      reasons.push(`${percent}% better ${label}`);
    }
  }

  // Limit to top 3 reasons
  return reasons.slice(0, 3);
}
