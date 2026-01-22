/**
 * Artificial Analysis API Types
 *
 * TypeScript interfaces for the Artificial Analysis benchmark API.
 * API Docs: https://artificialanalysis.ai/api/v1
 */

/**
 * Raw model data from Artificial Analysis API
 */
export interface AAModelResponse {
  id: string;
  name: string;
  provider: string;
  model_id?: string;

  // Quality metrics
  quality_index?: number;
  quality_elo?: number;

  // Speed metrics
  speed_index?: number;
  tokens_per_second?: number;
  time_to_first_token_ms?: number;
  latency_ms?: number;

  // Context and capabilities
  context_length?: number;
  max_output_tokens?: number;
  supports_vision?: boolean;
  supports_function_calling?: boolean;
  supports_streaming?: boolean;

  // Pricing (per million tokens)
  input_price_per_million?: number;
  output_price_per_million?: number;

  // Metadata
  release_date?: string;
  last_updated?: string;
}

/**
 * API response wrapper
 */
export interface AAApiResponse {
  models: AAModelResponse[];
  updated_at?: string;
}

/**
 * Normalized benchmark data stored in models.benchmarks JSONB column
 */
export interface NormalizedBenchmarks {
  source: 'artificial_analysis';
  fetched_at: string;

  // Quality scores
  quality_index?: number;
  quality_elo?: number;

  // Speed metrics
  speed_index?: number;
  tokens_per_second?: number;
  time_to_first_token_ms?: number;
  latency_ms?: number;

  // Capabilities
  context_length?: number;
  max_output_tokens?: number;
  supports_vision?: boolean;
  supports_function_calling?: boolean;
  supports_streaming?: boolean;

  // Raw data for debugging
  raw_id?: string;
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
