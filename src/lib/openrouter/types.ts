/**
 * OpenRouter API Response Types
 * Based on https://openrouter.ai/api/v1/models
 */

export interface OpenRouterModel {
  id: string; // e.g., "openai/gpt-4o"
  name: string; // e.g., "OpenAI: GPT-4o"
  description?: string;
  pricing: OpenRouterPricing;
  context_length: number;
  architecture: OpenRouterArchitecture;
  top_provider: OpenRouterTopProvider;
  per_request_limits?: OpenRouterRequestLimits;
}

export interface OpenRouterPricing {
  prompt: string; // Price per token as string (e.g., "0.000005")
  completion: string;
  image?: string;
  request?: string;
}

export interface OpenRouterArchitecture {
  modality: string; // e.g., "text+image->text"
  tokenizer: string; // e.g., "GPT"
  instruct_type?: string | null;
}

export interface OpenRouterTopProvider {
  context_length?: number;
  max_completion_tokens?: number;
  is_moderated?: boolean;
}

export interface OpenRouterRequestLimits {
  prompt_tokens?: string;
  completion_tokens?: string;
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

/**
 * Parsed model data for our database schema
 */
export interface ParsedModelData {
  providerSlug: string;
  modelSlug: string;
  openrouterId: string;
  name: string;
  displayName: string;
  description: string | null;
  contextLength: number;
  maxOutputTokens: number | null;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;
  supportsJsonMode: boolean;
  supportsSystemPrompt: boolean;
  inputPrice: number;
  outputPrice: number;
  capabilities: Record<string, unknown>;
  metadata: Record<string, unknown>;
}
