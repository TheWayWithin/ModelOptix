/**
 * Sanity Check Types
 *
 * Types for side-by-side model comparison tests.
 *
 * @see architecture.md Section 5 - Sanity Checks
 */

/**
 * Sanity check status values.
 */
export type SanityCheckStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'expired';

/**
 * User preference after evaluating responses.
 */
export type UserPreference = 'current' | 'recommended' | 'neither' | 'tie';

/**
 * Model summary for sanity check display.
 */
export interface SanityCheckModelSummary {
  id: string;
  name: string;
  providerName: string;
  openrouterId: string;
  inputPrice: number;
  outputPrice: number;
}

/**
 * Test parameters for sanity check.
 */
export interface SanityCheckParameters {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Request to create a new sanity check.
 */
export interface CreateSanityCheckRequest {
  prompt: string;
  currentModelId: string;
  recommendedModelId: string;
  useCaseId?: string;
  parameters?: SanityCheckParameters;
  isGuest?: boolean;
  guestSessionId?: string;
}

/**
 * Result from a single model in the sanity check.
 */
export interface SanityCheckModelResult {
  response: string | null;
  latencyMs: number | null;
  tokensUsed: number | null;
  cost: number | null;
  error?: string;
}

/**
 * Full sanity check record with all details.
 */
export interface SanityCheckWithDetails {
  id: string;
  useCaseId: string | null;
  userId: string | null;
  prompt: string;
  testParameters: SanityCheckParameters;
  currentModel: SanityCheckModelSummary | null;
  recommendedModel: SanityCheckModelSummary | null;
  currentResult: SanityCheckModelResult;
  recommendedResult: SanityCheckModelResult;
  userPreference: UserPreference | null;
  userNotes: string | null;
  evaluationCriteria: Record<string, unknown>;
  isGuest: boolean;
  guestSessionId: string | null;
  status: SanityCheckStatus;
  errorMessage: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request to submit user evaluation.
 */
export interface SubmitEvaluationRequest {
  preference: UserPreference;
  notes?: string;
  criteria?: Record<string, unknown>;
}

/**
 * API response for sanity check list.
 */
export interface SanityChecksResponse {
  sanityChecks: SanityCheckWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
