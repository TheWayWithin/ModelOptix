/**
 * OpenRouter API Client
 *
 * Fetches model catalog from OpenRouter API with retry logic and error handling.
 * Used by the model catalog sync job to keep our database in sync.
 */

import {
  OpenRouterModelsResponse,
  OpenRouterModel,
  ParsedModelData,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelCompletionResult,
} from './types';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 1;

export class OpenRouterClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'OpenRouterClientError';
  }
}

/**
 * Check if the OpenRouter API key is configured
 */
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

/**
 * Fetch models from OpenRouter API with retry logic
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn(
      '[OpenRouter] OPENROUTER_API_KEY not set, skipping model fetch'
    );
    return [];
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(
          `[OpenRouter] Retry attempt ${attempt} after ${DEFAULT_RETRY_DELAY_MS}ms delay`
        );
        await sleep(DEFAULT_RETRY_DELAY_MS);
      }

      const response = await fetch(`${OPENROUTER_API_BASE}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer':
            process.env.NEXT_PUBLIC_APP_URL || 'https://modeloptix.com',
          'X-Title': 'ModelOptix',
        },
      });

      if (!response.ok) {
        const isRetryable = response.status >= 500 || response.status === 429;
        throw new OpenRouterClientError(
          `OpenRouter API error: ${response.status} ${response.statusText}`,
          response.status,
          isRetryable
        );
      }

      const data: OpenRouterModelsResponse = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        throw new OpenRouterClientError(
          'Invalid response format: missing data array'
        );
      }

      console.log(
        `[OpenRouter] Successfully fetched ${data.data.length} models`
      );
      return data.data;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof OpenRouterClientError && !error.isRetryable) {
        throw error;
      }

      if (attempt === MAX_RETRIES) {
        console.error(`[OpenRouter] All retry attempts failed:`, error);
        throw lastError;
      }

      console.warn(
        `[OpenRouter] Attempt ${attempt + 1} failed, will retry:`,
        error
      );
    }
  }

  throw lastError || new Error('Unknown error fetching models');
}

/**
 * Parse an OpenRouter model into our database schema format
 */
export function parseOpenRouterModel(model: OpenRouterModel): ParsedModelData {
  // Extract provider and model slug from ID (e.g., "openai/gpt-4o" -> "openai", "gpt-4o")
  const parts = model.id.split('/');
  const providerSlug = parts[0] || 'unknown';
  const modelSlug = parts.slice(1).join('/') || model.id; // Handle nested paths like "meta-llama/llama-3.1-8b-instruct"

  // Parse modality for capability detection
  const modality = model.architecture?.modality || '';
  const supportsVision = modality.includes('image');
  const supportsText = modality.includes('text');

  // Parse pricing - OpenRouter returns per-token, we store per-1K tokens
  // Multiply by 1000 to convert from per-token to per-1K tokens
  const inputPrice = parseFloat(model.pricing?.prompt || '0') * 1000;
  const outputPrice = parseFloat(model.pricing?.completion || '0') * 1000;

  // Extract max output tokens
  const maxOutputTokens = model.top_provider?.max_completion_tokens || null;

  // Build capabilities object
  const capabilities: Record<string, unknown> = {
    modality: model.architecture?.modality,
    tokenizer: model.architecture?.tokenizer,
    instruct_type: model.architecture?.instruct_type,
    is_moderated: model.top_provider?.is_moderated,
  };

  // Build metadata object
  const metadata: Record<string, unknown> = {
    openrouter_raw: {
      architecture: model.architecture,
      top_provider: model.top_provider,
      per_request_limits: model.per_request_limits,
    },
    image_price: model.pricing?.image,
    request_price: model.pricing?.request,
  };

  return {
    providerSlug,
    modelSlug,
    openrouterId: model.id,
    name: modelSlug,
    displayName: model.name,
    description: model.description || null,
    contextLength: model.context_length,
    maxOutputTokens,
    supportsVision,
    supportsFunctionCalling: false, // OpenRouter doesn't expose this directly
    supportsStreaming: true, // Most models support streaming
    supportsJsonMode: false, // OpenRouter doesn't expose this directly
    supportsSystemPrompt: supportsText, // Text models generally support system prompts
    inputPrice,
    outputPrice,
    capabilities,
    metadata,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a chat completion request to OpenRouter
 * Returns the completion along with latency and token usage
 */
export async function chatCompletion(
  request: ChatCompletionRequest,
  inputPricePerToken: number,
  outputPricePerToken: number
): Promise<ModelCompletionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      modelId: request.model,
      response: '',
      latencyMs: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: 0,
      error: 'OPENROUTER_API_KEY not configured',
    };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer':
          process.env.NEXT_PUBLIC_APP_URL || 'https://modeloptix.com',
        'X-Title': 'ModelOptix Sanity Check',
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        max_tokens: request.max_tokens || 1024,
        temperature: request.temperature ?? 0.7,
        stream: false,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        modelId: request.model,
        response: '',
        latencyMs,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
        error: `OpenRouter error ${response.status}: ${errorText}`,
      };
    }

    const data: ChatCompletionResponse = await response.json();

    // Extract response content
    const content = data.choices?.[0]?.message?.content || '';

    // Calculate cost
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;
    const cost =
      promptTokens * inputPricePerToken +
      completionTokens * outputPricePerToken;

    return {
      modelId: request.model,
      response: content,
      latencyMs,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      modelId: request.model,
      response: '',
      latencyMs,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run sanity check - compare two models with the same prompt
 * Runs both completions in parallel for fairness
 */
export async function runSanityCheck(
  prompt: string,
  currentModelId: string,
  recommendedModelId: string,
  currentPricing: { inputPrice: number; outputPrice: number },
  recommendedPricing: { inputPrice: number; outputPrice: number },
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<{
  current: ModelCompletionResult;
  recommended: ModelCompletionResult;
}> {
  const messages = [
    ...(options?.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }]
      : []),
    { role: 'user' as const, content: prompt },
  ];

  // Run both completions in parallel
  const [currentResult, recommendedResult] = await Promise.all([
    chatCompletion(
      {
        model: currentModelId,
        messages,
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
      },
      currentPricing.inputPrice,
      currentPricing.outputPrice
    ),
    chatCompletion(
      {
        model: recommendedModelId,
        messages,
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
      },
      recommendedPricing.inputPrice,
      recommendedPricing.outputPrice
    ),
  ]);

  return {
    current: currentResult,
    recommended: recommendedResult,
  };
}
