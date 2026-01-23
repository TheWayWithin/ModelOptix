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
 */
export type TrustDimension =
  | 'data_handling'
  | 'transparency'
  | 'security'
  | 'compliance'
  | 'reliability'
  | 'ethics';

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
    compliance: 'Compliance',
    reliability: 'Reliability',
    ethics: 'Ethics',
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
    compliance: 'Adherence to regulations (GDPR, SOC 2, etc.)',
    reliability: 'Uptime, consistency, and service level agreements',
    ethics: 'Ethical AI practices, bias mitigation, and responsible development',
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
