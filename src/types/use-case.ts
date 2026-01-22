// Task types for AI use cases
export const TASK_TYPES = [
  'code-generation',
  'content-writing',
  'data-extraction',
  'summarization',
  'classification',
  'reasoning',
  'conversation',
  'other',
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  'code-generation': 'Code Generation',
  'content-writing': 'Content Writing',
  'data-extraction': 'Data Extraction',
  'summarization': 'Summarization',
  'classification': 'Classification',
  'reasoning': 'Reasoning',
  'conversation': 'Conversation',
  'other': 'Other',
};

export interface UseCase {
  id: string;
  function_id: string;
  name: string;
  description: string | null;
  task_type: TaskType;
  current_monthly_calls: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
  quality_threshold: number;
  latency_requirement_ms: number | null;
  created_at: string;
  updated_at: string;
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
  task_type: TaskType;
  current_monthly_calls?: number;
  avg_input_tokens?: number;
  avg_output_tokens?: number;
  quality_threshold?: number;
  latency_requirement_ms?: number | null;
}

export type UpdateUseCaseInput = Partial<CreateUseCaseInput>;
