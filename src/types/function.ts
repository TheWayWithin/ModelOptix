/**
 * DEPRECATED: The functions layer has been eliminated.
 *
 * Use cases now link directly to products.
 * Use types from '@/types/use-case' instead.
 *
 * Migration completed: 2026-01-25
 * Safe to delete this file after: 2026-04-25
 */

// Legacy types kept for backwards compatibility during migration
export interface Function {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FunctionWithUseCaseCount extends Function {
  use_case_count: number;
}

export interface CreateFunctionInput {
  name: string;
  description?: string;
}

export interface UpdateFunctionInput {
  name?: string;
  description?: string;
}

// MIGRATION NOTE: Import from '@/types/use-case' instead
// Use cases now have all the fields that were on functions:
// - priority, latency_requirement_ms, quality_requirement
// - monthly_volume, avg_input_tokens, avg_output_tokens
