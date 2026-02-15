/**
 * Weight System Configuration
 *
 * Users rank their top 3 priorities from the 5 scoring factors.
 * The 4th and 5th unranked factors receive minimal weight.
 *
 * Weight Distribution (Ranked Mode):
 * - Primary:   55% - Statistically dominant factor
 * - Secondary: 22% - Strong secondary influence
 * - Tertiary:  12% - Moderate influence
 * - Fourth:     7% - Minimal influence
 * - Fifth:      4% - Baseline influence
 *
 * Equal Weights Mode:
 * - All factors: 20% each
 *
 * @see architecture.md Section 4.1 - FitScore Algorithm
 */

import type { ScoringFactor, WeightConfig, PriorityRanking } from '@/types/recommendation';

/**
 * Weight values for ranked priority mode.
 * Sum = 1.00 (100%)
 */
export const RANKED_WEIGHTS = {
  primary: 0.55,
  secondary: 0.22,
  tertiary: 0.12,
  fourth: 0.07,
  fifth: 0.04,
} as const;

/**
 * Weight value for equal weights mode.
 * Each of 5 factors gets 20%.
 */
export const EQUAL_WEIGHT = 0.20;

/**
 * All available scoring factors.
 */
export const ALL_FACTORS: readonly ScoringFactor[] = [
  'cost',
  'speed',
  'quality',
  'trust',
  'context',
] as const;

/**
 * Calculate weights based on user's priority ranking.
 *
 * @param ranking - User's priority ranking (top 3 + equal weights flag)
 * @returns WeightConfig with values summing to 1.0
 */
export function calculateWeights(ranking: PriorityRanking): WeightConfig {
  // Equal weights mode - all factors get same weight
  if (ranking.useEqualWeights) {
    return {
      cost: EQUAL_WEIGHT,
      speed: EQUAL_WEIGHT,
      quality: EQUAL_WEIGHT,
      trust: EQUAL_WEIGHT,
      context: EQUAL_WEIGHT,
    };
  }

  // Ranked mode - distribute weights based on priority
  const weights: WeightConfig = {
    cost: 0,
    speed: 0,
    quality: 0,
    trust: 0,
    context: 0,
  };

  // Track which factors have been assigned
  const rankedFactors = new Set<ScoringFactor>();

  // Assign primary weight
  weights[ranking.primary] = RANKED_WEIGHTS.primary;
  rankedFactors.add(ranking.primary);

  // Assign secondary weight (if specified)
  if (ranking.secondary) {
    weights[ranking.secondary] = RANKED_WEIGHTS.secondary;
    rankedFactors.add(ranking.secondary);
  }

  // Assign tertiary weight (if specified)
  if (ranking.tertiary) {
    weights[ranking.tertiary] = RANKED_WEIGHTS.tertiary;
    rankedFactors.add(ranking.tertiary);
  }

  // Get unranked factors
  const unrankedFactors = ALL_FACTORS.filter(f => !rankedFactors.has(f));

  // Distribute remaining weights to unranked factors
  // If user only ranked 1-2 priorities, we need to handle the remaining weight
  const remainingWeights = [
    ...(!ranking.secondary ? [RANKED_WEIGHTS.secondary] : []),
    ...(!ranking.tertiary ? [RANKED_WEIGHTS.tertiary] : []),
    RANKED_WEIGHTS.fourth,
    RANKED_WEIGHTS.fifth,
  ];

  // Assign remaining weights to unranked factors in order
  unrankedFactors.forEach((factor, index) => {
    if (index < remainingWeights.length) {
      weights[factor] = remainingWeights[index] ?? 0;
    }
  });

  // Normalize to ensure sum = 1.0 (handles floating point precision)
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    const adjustment = (1.0 - sum) / 5;
    (Object.keys(weights) as ScoringFactor[]).forEach(key => {
      weights[key] += adjustment;
    });
  }

  return weights;
}

/**
 * Validate that a WeightConfig sums to 1.0.
 *
 * @param weights - Weight configuration to validate
 * @returns true if valid, false otherwise
 */
export function validateWeights(weights: WeightConfig): boolean {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1.0) < 0.001;
}

/**
 * Get human-readable description of weight distribution.
 * Useful for transparency in the UI.
 *
 * @param weights - Weight configuration
 * @returns Array of factor-weight pairs sorted by weight descending
 */
export function describeWeights(weights: WeightConfig): Array<{ factor: ScoringFactor; weight: number; percentage: string }> {
  return (Object.entries(weights) as Array<[ScoringFactor, number]>)
    .sort(([, a], [, b]) => b - a)
    .map(([factor, weight]) => ({
      factor,
      weight,
      percentage: `${Math.round(weight * 100)}%`,
    }));
}

/**
 * Create a default priority ranking (cost-focused).
 * Used when user hasn't configured priorities.
 */
export function getDefaultPriorityRanking(): PriorityRanking {
  return {
    primary: 'cost',
    secondary: 'quality',
    tertiary: 'speed',
    useEqualWeights: false,
  };
}
