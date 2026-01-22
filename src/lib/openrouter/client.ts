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

  // Parse pricing (convert string to number, prices are per-token)
  const inputPrice = parseFloat(model.pricing?.prompt || '0');
  const outputPrice = parseFloat(model.pricing?.completion || '0');

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
