// Use case types matching the actual database schema

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

// Input/output types
export const INPUT_TYPES = ['text', 'code', 'structured', 'multimodal'] as const;
export type InputType = (typeof INPUT_TYPES)[number];

export const OUTPUT_TYPES = ['text', 'code', 'json', 'classification'] as const;
export type OutputType = (typeof OUTPUT_TYPES)[number];

// Status options
export const USE_CASE_STATUSES = ['active', 'archived', 'draft'] as const;
export type UseCaseStatus = (typeof USE_CASE_STATUSES)[number];

export interface UseCase {
  id: string;
  function_id: string;
  name: string;
  description: string | null;
  current_model_id: string | null;
  primary_need: PriorityNeed;
  secondary_need: PriorityNeed | null;
  tertiary_need: PriorityNeed | null;
  use_equal_weights: boolean;
  required_context: number;
  estimated_monthly_tokens: number | null;
  estimated_monthly_spend: number | null;
  input_type: InputType | null;
  output_type: OutputType | null;
  requires_vision: boolean;
  requires_function_calling: boolean;
  requires_streaming: boolean;
  monthly_cost_current: number | null;
  monthly_cost_optimized: number | null;
  last_analyzed_at: string | null;
  status: UseCaseStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UseCaseWithModel extends UseCase {
  model?: {
    id: string;
    name: string;
    provider_id: string;
  } | null;
}

export interface UseCaseWithFunction extends UseCase {
  function: {
    id: string;
    name: string;
    product_id: string;
  };
}

export interface CreateUseCaseInput {
  name: string;
  description?: string | null;
  current_model_id?: string | null;
  primary_need: PriorityNeed;
  secondary_need?: PriorityNeed | null;
  tertiary_need?: PriorityNeed | null;
  use_equal_weights?: boolean;
  required_context?: number;
  estimated_monthly_tokens?: number | null;
  input_type?: InputType | null;
  output_type?: OutputType | null;
  requires_vision?: boolean;
  requires_function_calling?: boolean;
  requires_streaming?: boolean;
}

export type UpdateUseCaseInput = Partial<CreateUseCaseInput>;

// Legacy export for backwards compatibility during migration
export const TASK_TYPES = PRIORITY_NEEDS;
export type TaskType = PriorityNeed;
export const TASK_TYPE_LABELS = PRIORITY_NEED_LABELS;
