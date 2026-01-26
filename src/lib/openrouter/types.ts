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
 * Chat Completion Types
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string; // OpenRouter model ID (e.g., "openai/gpt-4o")
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string;
  };
  finish_reason: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}

/**
 * Sanity Check Result from a single model
 */
export interface ModelCompletionResult {
  modelId: string;
  response: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  error?: string;
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

/**
 * OpenRouter Auth Key Response
 * GET /api/v1/auth/key
 */
export interface OpenRouterKeyInfo {
  data: {
    label?: string;
    usage: number; // Total credits used
    limit: number | null; // Credit limit (null = unlimited)
    is_free_tier: boolean;
    rate_limit: {
      requests: number;
      interval: string;
    };
  };
}

/**
 * OpenRouter Activity/Generation Response
 * GET /api/v1/generation?offset=0&limit=50
 */
export interface OpenRouterGeneration {
  id: string;
  model: string; // Model ID used
  created_at: string;
  tokens_prompt: number;
  tokens_completion: number;
  native_tokens_prompt?: number;
  native_tokens_completion?: number;
  total_cost: number;
  latency?: number;
  is_byok?: boolean;
}

export interface OpenRouterGenerationResponse {
  data: OpenRouterGeneration[];
}

/**
 * User Import Types
 */
export interface DetectedUsagePattern {
  modelId: string; // OpenRouter model ID (e.g., "openai/gpt-4o")
  modelName: string;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  avgLatency?: number;
  lastUsed: string;
}

export interface ImportPreview {
  keyValid: boolean;
  keyLabel?: string;
  totalUsage: number;
  isFreeTier: boolean;
  modelsDetected: DetectedUsagePattern[];
  suggestedProduct: {
    name: string;
    useCases: Array<{
      name: string;
      modelId: string;
      taskType: string;
      avgInputTokens: number;
      avgOutputTokens: number;
      monthlyVolume: number;
    }>;
  };
}

export interface ImportResult {
  success: boolean;
  productId?: string;
  useCasesCreated: number;
  error?: string;
}
