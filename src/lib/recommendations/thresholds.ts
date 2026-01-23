/**
 * Configurable Thresholds for Recommendation Engine
 *
 * These thresholds control when recommendations are generated
 * and how various factors are scored.
 *
 * @see architecture.md Section 4.1 - FitScore Algorithm
 */

/**
 * Minimum improvement percentage required to create an opportunity.
 * A model must score at least this much better than the current model
 * to be recommended.
 */
export const MINIMUM_IMPROVEMENT_PERCENT = 10;

/**
 * Trust tier scores for provider reliability.
 * Higher values indicate more trusted providers.
 *
 * Tier A: Established providers (OpenAI, Anthropic, Google)
 * Tier B: Growing providers (Mistral, Cohere)
 * Tier C: Newer/smaller providers
 * Unknown: No tier assigned yet
 */
export const TRUST_TIER_SCORES: Record<'A' | 'B' | 'C' | 'unknown', number> = {
  A: 1.0,
  B: 0.7,
  C: 0.4,
  unknown: 0.2,
};

/**
 * Default context length requirement when use case doesn't specify.
 * 4096 tokens is a reasonable baseline for most tasks.
 */
export const DEFAULT_REQUIRED_CONTEXT = 4096;

/**
 * Editorial downrank penalty.
 * Applied as a multiplier to the final score.
 * 0.5 = 50% reduction in score.
 */
export const DOWNRANK_PENALTY = 0.5;

/**
 * Normalization defaults when no models exist in database.
 * These prevent division by zero errors.
 */
export const DEFAULT_NORMALIZATION_RANGES = {
  cost: {
    min: 0.0001,  // $0.0001 per 1K tokens (very cheap)
    max: 0.1,     // $0.10 per 1K tokens (expensive)
  },
  speed: {
    min: 100,     // 100ms (very fast)
    max: 10000,   // 10 seconds (slow)
  },
  quality: {
    min: 0,       // Lowest quality index
    max: 100,     // Highest quality index
  },
};

/**
 * Price ratio for combined cost calculation.
 * Most LLM usage is input-heavy (prompts > completions).
 * 70% input / 30% output is typical for most applications.
 */
export const PRICE_RATIO = {
  input: 0.7,
  output: 0.3,
};

/**
 * Median latency fallback when model has no latency data.
 * 2000ms is a reasonable middle ground.
 */
export const MEDIAN_LATENCY_FALLBACK = 2000;

/**
 * Quality index range for ELO conversion.
 * Used when model only has quality_elo, not quality_index.
 */
export const ELO_TO_INDEX_CONVERSION = {
  minElo: 800,
  maxElo: 1400,
  // Formula: index = ((elo - minElo) / (maxElo - minElo)) * 100
};

/**
 * Maximum number of recommendations to return per use case.
 */
export const MAX_RECOMMENDATIONS_PER_USE_CASE = 5;

/**
 * Thresholds for categorizing improvement levels.
 * Used for UI display and prioritization.
 */
export const IMPROVEMENT_CATEGORIES = {
  minor: { min: 10, max: 25 },    // 10-25% improvement
  moderate: { min: 25, max: 50 }, // 25-50% improvement
  major: { min: 50, max: 100 },   // 50%+ improvement
};

/**
 * Cache TTL for normalization ranges (in milliseconds).
 * Recalculate ranges every 5 minutes to account for new models.
 */
export const NORMALIZATION_CACHE_TTL = 5 * 60 * 1000;
