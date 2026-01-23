/**
 * Opportunity UI Types
 *
 * Types for displaying model optimization opportunities in the UI.
 * Extends database schema with computed/joined fields.
 *
 * @see architecture.md Section 4 - Recommendation Engine
 */

/**
 * Opportunity status values from database.
 */
export type OpportunityStatus = 'active' | 'dismissed' | 'accepted' | 'expired';

/**
 * Opportunity type indicating primary improvement area.
 */
export type OpportunityType =
  | 'cost_saving'
  | 'speed_improvement'
  | 'quality_upgrade'
  | 'trust_upgrade';

/**
 * Sort options for opportunity list.
 */
export type OpportunitySortBy = 'improvement' | 'savings' | 'created_at';

/**
 * Filter options for opportunity list.
 */
export interface OpportunityFilters {
  status?: OpportunityStatus | 'all';
  useCaseId?: string;
  opportunityType?: OpportunityType | 'all';
  minImprovement?: number;
  sortBy?: OpportunitySortBy;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Model summary for opportunity display.
 */
export interface OpportunityModelSummary {
  id: string;
  name: string;
  providerName: string;
  contextLength?: number;
  latencyP50?: number | null;
  inputPrice: number | null;
  outputPrice: number | null;
}

/**
 * Use case summary for opportunity display.
 */
export interface OpportunityUseCaseSummary {
  id: string;
  name: string;
  functionName: string;
  productName: string;
}

/**
 * Full opportunity with joined details for UI display.
 */
export interface OpportunityWithDetails {
  id: string;
  useCaseId: string;
  useCase: OpportunityUseCaseSummary;
  currentModel: OpportunityModelSummary | null;
  recommendedModel: OpportunityModelSummary | null;
  opportunityType: OpportunityType;
  improvementPercentage: number | null;
  estimatedMonthlySavings: number | null;
  confidenceScore: number;
  recommendationReason: string | null;
  tradeOffs: string[];
  status: OpportunityStatus;
  dismissedReason: string | null;
  actionedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Raw evidence JSONB for detail page (optional) */
  evidence?: OpportunityEvidence | null;
}

/**
 * Evidence stored with opportunity for detail display.
 */
export interface OpportunityEvidence {
  currentModel: {
    id: string;
    name: string;
    fitScore: number;
    factorScores: {
      cost: number;
      speed: number;
      quality: number;
      trust: number;
      context: number;
    };
  } | null;
  recommendedModel: {
    id: string;
    name: string;
    fitScore: number;
    factorScores: {
      cost: number;
      speed: number;
      quality: number;
      trust: number;
      context: number;
    };
  };
  appliedWeights: {
    cost: number;
    speed: number;
    quality: number;
    trust: number;
    context: number;
  };
  reasons: string[];
  generatedAt: string;
}

/**
 * API response for opportunity list.
 */
export interface OpportunitiesResponse {
  opportunities: OpportunityWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Helper to get human-readable opportunity type label.
 */
export function getOpportunityTypeLabel(type: OpportunityType): string {
  const labels: Record<OpportunityType, string> = {
    cost_saving: 'Cost Saving',
    speed_improvement: 'Speed Improvement',
    quality_upgrade: 'Quality Upgrade',
    trust_upgrade: 'Trust Upgrade',
  };
  return labels[type];
}

/**
 * Helper to get opportunity type badge color.
 */
export function getOpportunityTypeColor(type: OpportunityType): string {
  const colors: Record<OpportunityType, string> = {
    cost_saving: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    speed_improvement: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    quality_upgrade: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    trust_upgrade: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  };
  return colors[type];
}

/**
 * Helper to get status badge color.
 */
export function getOpportunityStatusColor(status: OpportunityStatus): string {
  const colors: Record<OpportunityStatus, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status];
}

/**
 * Format improvement percentage for display.
 */
export function formatImprovement(percent: number | null): string {
  if (percent === null) return 'N/A';
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
}

/**
 * Format savings for display.
 */
export function formatSavings(amount: number | null): string {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
