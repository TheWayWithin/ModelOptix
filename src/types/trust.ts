/**
 * Trust Types
 *
 * Types for provider trust tiers and model trust scores.
 *
 * @see architecture.md Section 6 - Database Schema
 */

/**
 * Provider trust tier levels.
 * A = Most trusted, C = Least trusted, unknown = Not yet evaluated
 */
export type TrustTier = 'A' | 'B' | 'C' | 'unknown';

/**
 * Trust score dimensions for evaluating models.
 * These 8 dimensions match the database schema constraint.
 */
export type TrustDimension =
  | 'data_handling'
  | 'transparency'
  | 'security'
  | 'reliability'
  | 'consistency'
  | 'safety'
  | 'accuracy'
  | 'cost_stability';

/**
 * All trust dimensions in display order.
 */
export const TRUST_DIMENSIONS: TrustDimension[] = [
  'data_handling',
  'transparency',
  'security',
  'reliability',
  'consistency',
  'safety',
  'accuracy',
  'cost_stability',
];

/**
 * Confidence levels for trust scores.
 */
export type TrustConfidence = 'low' | 'medium' | 'high';

/**
 * Provider with trust tier information.
 */
export interface ProviderWithTrust {
  id: string;
  name: string;
  slug: string;
  trustTier: TrustTier;
  modelCount: number;
}

/**
 * Model trust score for a specific dimension.
 */
export interface ModelTrustScore {
  id: string;
  modelId: string;
  dimension: TrustDimension;
  score: number; // 0-100
  evidence: string | null;
  sourceUrl: string | null;
  reviewedAt: string | null;
}

/**
 * Model with trust information.
 */
export interface ModelWithTrust {
  id: string;
  name: string;
  displayName: string | null;
  provider: {
    id: string;
    name: string;
    trustTier: TrustTier;
  } | null;
  trustScores: ModelTrustScore[];
  averageTrustScore: number | null;
}

/**
 * Trust tier summary statistics.
 */
export interface TrustTierStats {
  tier: TrustTier;
  label: string;
  description: string;
  providerCount: number;
  modelCount: number;
  color: string;
}

/**
 * Helper function to get trust tier label.
 */
export function getTrustTierLabel(tier: TrustTier): string {
  const labels: Record<TrustTier, string> = {
    A: 'Tier A - Highly Trusted',
    B: 'Tier B - Trusted',
    C: 'Tier C - Caution',
    unknown: 'Not Yet Evaluated',
  };
  return labels[tier];
}

/**
 * Helper function to get trust tier color.
 */
export function getTrustTierColor(tier: TrustTier): string {
  const colors: Record<TrustTier, string> = {
    A: 'text-emerald-600 dark:text-emerald-400',
    B: 'text-blue-600 dark:text-blue-400',
    C: 'text-amber-600 dark:text-amber-400',
    unknown: 'text-gray-500 dark:text-gray-400',
  };
  return colors[tier];
}

/**
 * Helper function to get trust tier background color.
 */
export function getTrustTierBgColor(tier: TrustTier): string {
  const colors: Record<TrustTier, string> = {
    A: 'bg-emerald-100 dark:bg-emerald-900/30',
    B: 'bg-blue-100 dark:bg-blue-900/30',
    C: 'bg-amber-100 dark:bg-amber-900/30',
    unknown: 'bg-gray-100 dark:bg-gray-900/30',
  };
  return colors[tier];
}

/**
 * Helper function to get trust tier description.
 */
export function getTrustTierDescription(tier: TrustTier): string {
  const descriptions: Record<TrustTier, string> = {
    A: 'Excellent track record with strong data practices, transparency, and security. Recommended for sensitive applications.',
    B: 'Good overall trust profile. Suitable for most applications with standard data requirements.',
    C: 'Some concerns identified. Consider carefully for applications with sensitive data.',
    unknown: 'Provider has not been fully evaluated. Exercise caution and verify practices independently.',
  };
  return descriptions[tier];
}

/**
 * Helper function to get dimension label.
 */
export function getDimensionLabel(dimension: TrustDimension): string {
  const labels: Record<TrustDimension, string> = {
    data_handling: 'Data Handling',
    transparency: 'Transparency',
    security: 'Security',
    reliability: 'Reliability',
    consistency: 'Consistency',
    safety: 'Safety',
    accuracy: 'Accuracy',
    cost_stability: 'Cost Stability',
  };
  return labels[dimension];
}

/**
 * Helper function to get dimension description.
 */
export function getDimensionDescription(dimension: TrustDimension): string {
  const descriptions: Record<TrustDimension, string> = {
    data_handling: 'How the provider handles, stores, and processes your data',
    transparency: 'Clarity about model capabilities, limitations, and training data',
    security: 'Infrastructure security, encryption, and access controls',
    reliability: 'Uptime, consistency, and service level agreements',
    consistency: 'Consistent output quality and behavior across requests',
    safety: 'Content safety, guardrails, and responsible AI practices',
    accuracy: 'Factual accuracy and hallucination rate',
    cost_stability: 'Pricing predictability and cost transparency',
  };
  return descriptions[dimension];
}

/**
 * Response type for trust overview API.
 */
export interface TrustOverviewResponse {
  tierStats: TrustTierStats[];
  providers: ProviderWithTrust[];
  totalModels: number;
  lastUpdated: string | null;
}

// =============================================================================
// Admin Trust Queue Types
// =============================================================================

/**
 * Full database record for model trust scores.
 */
export interface ModelTrustScoreRecord {
  id: string;
  model_id: string;
  dimension: TrustDimension;
  score: number | null;
  confidence: number;
  evidence: string | null;
  source_url: string | null;
  sample_size: number | null;
  measurement_period_days: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  measured_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Trust score input for creating/updating scores.
 */
export interface TrustScoreInput {
  dimension: TrustDimension;
  score: number | null;
  confidence: number;
  evidence: string | null;
  source_url: string | null;
  notes: string | null;
}

/**
 * Item in the trust queue list view.
 */
export interface TrustQueueItem {
  id: string;
  name: string;
  providerName: string;
  providerTrustTier: TrustTier;
  scoresCompleted: number;
  totalDimensions: number;
  averageScore: number | null;
  lastUpdated: string | null;
}

/**
 * Response type for trust queue list API.
 */
export interface TrustQueueResponse {
  models: TrustQueueItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Response type for single model trust scores API.
 */
export interface ModelTrustScoresResponse {
  modelId: string;
  modelName: string;
  providerName: string;
  scores: ModelTrustScoreRecord[];
}

/**
 * Convert confidence number (0-100) to level string.
 */
export function getConfidenceLevel(confidence: number): TrustConfidence {
  if (confidence >= 70) return 'high';
  if (confidence >= 40) return 'medium';
  return 'low';
}

/**
 * Convert confidence level string to default number.
 */
export function getConfidenceValue(level: TrustConfidence): number {
  switch (level) {
    case 'high':
      return 85;
    case 'medium':
      return 50;
    case 'low':
      return 25;
  }
}
