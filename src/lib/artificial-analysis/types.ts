/**
 * Artificial Analysis API Types
 *
 * TypeScript interfaces for the Artificial Analysis benchmark API v2.
 * API Docs: https://artificialanalysis.ai/documentation
 */

/**
 * Model creator info from AA API
 */
export interface AAModelCreator {
  id: string;
  name: string;
  slug: string;
}

/**
 * Evaluations/benchmark scores from AA API
 */
export interface AAEvaluations {
  artificial_analysis_intelligence_index?: number;
  artificial_analysis_coding_index?: number;
  artificial_analysis_math_index?: number;
  mmlu_pro?: number;
  gpqa?: number;
  hle?: number;
  livecodebench?: number;
  scicode?: number;
  math_500?: number;
  aime?: number;
  aime_25?: number;
  ifbench?: number;
  lcr?: number;
  terminalbench_hard?: number;
  tau2?: number;
}

/**
 * Pricing info from AA API (per million tokens)
 */
export interface AAPricing {
  price_1m_blended_3_to_1?: number;
  price_1m_input_tokens?: number;
  price_1m_output_tokens?: number;
}

/**
 * Raw model data from Artificial Analysis API v2
 */
export interface AAModelResponse {
  id: string;
  name: string;
  slug: string;
  release_date?: string;
  model_creator: AAModelCreator;
  evaluations: AAEvaluations;
  pricing?: AAPricing;

  // Speed metrics
  median_output_tokens_per_second?: number;
  median_time_to_first_token_seconds?: number;
  median_time_to_first_answer_token?: number;

  // Legacy fields for backward compatibility
  provider?: string;
  model_id?: string;
  quality_index?: number;
  quality_elo?: number;
  speed_index?: number;
  tokens_per_second?: number;
  time_to_first_token_ms?: number;
  latency_ms?: number;
  context_length?: number;
  max_output_tokens?: number;
  supports_vision?: boolean;
  supports_function_calling?: boolean;
  supports_streaming?: boolean;
}

/**
 * API response wrapper for v2
 */
export interface AAApiResponse {
  status: number;
  prompt_options?: {
    parallel_queries?: number;
    prompt_length?: number;
  };
  data: AAModelResponse[];
  // Legacy field
  models?: AAModelResponse[];
}

/**
 * Normalized benchmark data stored in models.benchmarks JSONB column
 */
export interface NormalizedBenchmarks {
  source: 'artificial_analysis';
  fetched_at: string;

  // Intelligence scores
  intelligence_index?: number;
  coding_index?: number;
  math_index?: number;

  // Individual benchmark scores
  mmlu_pro?: number;
  gpqa?: number;
  livecodebench?: number;

  // Speed metrics
  tokens_per_second?: number;
  time_to_first_token_seconds?: number;

  // Pricing (per million tokens)
  input_price_per_million?: number;
  output_price_per_million?: number;

  // Provider info
  provider_name?: string;
  provider_slug?: string;

  // Raw data for debugging
  raw_id?: string;
  raw_slug?: string;
}

/**
 * Client configuration options
 */
export interface AAClientOptions {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}
