// Use case types matching the new simplified database schema (post-migration 007)
// Use cases now link directly to products (functions layer eliminated)

// Priority needs for model selection
export const PRIORITY_NEEDS = ['cost', 'speed', 'quality', 'trust', 'context'] as const;
export type PriorityNeed = (typeof PRIORITY_NEEDS)[number];

export const PRIORITY_NEED_LABELS: Record<PriorityNeed, string> = {
  cost: 'Cost Efficiency',
  speed: 'Low Latency',
  quality: 'Output Quality',
  trust: 'Trust & Reliability',
  context: 'Large Context',
};

// Priority levels for business importance
export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Quality requirement levels
export const QUALITY_REQUIREMENTS = ['best', 'good', 'acceptable'] as const;
export type QualityRequirement = (typeof QUALITY_REQUIREMENTS)[number];

export const QUALITY_REQUIREMENT_LABELS: Record<QualityRequirement, string> = {
  best: 'Best',
  good: 'Good',
  acceptable: 'Acceptable',
};

// Status options
export const USE_CASE_STATUSES = ['active', 'archived', 'draft'] as const;
export type UseCaseStatus = (typeof USE_CASE_STATUSES)[number];

export interface UseCase {
  id: string;
  product_id: string;  // CHANGED: was function_id - now directly linked to product
  name: string;
  description: string | null;
  current_model_id: string | null;

  // Priority & requirements (moved from functions table)
  priority: Priority;
  latency_requirement_ms: number | null;
  quality_requirement: QualityRequirement | null;

  // Optimization priorities
  primary_need: PriorityNeed;
  secondary_need: PriorityNeed | null;
  tertiary_need: PriorityNeed | null;
  use_equal_weights: boolean;

  // Usage patterns (moved from functions table)
  monthly_volume: number | null;
  avg_input_tokens: number | null;
  avg_output_tokens: number | null;

  // Technical requirements
  required_context: number;
  estimated_monthly_tokens: number | null;
  estimated_monthly_spend: number | null;

  // Capabilities (SIMPLIFIED - removed input_type, output_type, requires_streaming)
  requires_vision: boolean;
  requires_function_calling: boolean;
  requires_json_mode: boolean;  // NEW: replaces output_type='json'

  // Optimization tracking
  monthly_cost_current: number | null;
  monthly_cost_optimized: number | null;
  last_analyzed_at: string | null;

  // Lifecycle
  status: UseCaseStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UseCaseWithModel extends UseCase {
  current_model?: {
    id: string;
    name: string;
    display_name: string;
    provider_id: string;
  } | null;
}

export interface UseCaseWithProduct extends UseCase {
  product: {
    id: string;
    name: string;
    user_id: string;
  };
}

export interface CreateUseCaseInput {
  name: string;
  description?: string | null;
  current_model_id?: string | null;

  // Priority & requirements
  priority?: Priority;
  latency_requirement_ms?: number | null;
  quality_requirement?: QualityRequirement | null;

  // Optimization priorities
  primary_need: PriorityNeed;
  secondary_need?: PriorityNeed | null;
  tertiary_need?: PriorityNeed | null;
  use_equal_weights?: boolean;

  // Usage patterns
  monthly_volume?: number | null;
  avg_input_tokens?: number | null;
  avg_output_tokens?: number | null;

  // Technical requirements
  required_context?: number;
  estimated_monthly_tokens?: number | null;

  // Capabilities (simplified)
  requires_vision?: boolean;
  requires_function_calling?: boolean;
  requires_json_mode?: boolean;
}

export type UpdateUseCaseInput = Partial<CreateUseCaseInput>;

// Legacy export for backwards compatibility during migration
export const TASK_TYPES = PRIORITY_NEEDS;
export type TaskType = PriorityNeed;
export const TASK_TYPE_LABELS = PRIORITY_NEED_LABELS;

// DEPRECATED: These were removed in migration 007
// - InputType, OUTPUT_TYPE (not needed for model selection)
// - requires_streaming (UX preference, not a selection criterion)
