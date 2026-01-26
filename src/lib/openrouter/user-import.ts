/**
 * OpenRouter User Import Service
 *
 * Fetches user's OpenRouter usage data and converts it to a ModelOptix portfolio.
 * This enables users to connect their existing AI usage and get immediate recommendations.
 */

import {
  OpenRouterKeyInfo,
  OpenRouterGenerationResponse,
  OpenRouterGeneration,
  DetectedUsagePattern,
  ImportPreview,
} from './types';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

/**
 * Validate an OpenRouter API key and get account info
 */
export async function validateOpenRouterKey(
  apiKey: string
): Promise<{ valid: boolean; info?: OpenRouterKeyInfo['data']; error?: string }> {
  try {
    const response = await fetch(`${OPENROUTER_API_BASE}/auth/key`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      }
      if (response.status === 429) {
        return { valid: false, error: 'Rate limited. Please try again in a few minutes.' };
      }
      return { valid: false, error: `OpenRouter API error: ${response.status}` };
    }

    const data: OpenRouterKeyInfo = await response.json();
    return { valid: true, info: data.data };
  } catch (error) {
    console.error('[OpenRouter] Key validation error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate API key',
    };
  }
}

/**
 * Fetch user's generation history from OpenRouter
 */
export async function fetchUserGenerations(
  apiKey: string,
  limit: number = 100
): Promise<OpenRouterGeneration[]> {
  const allGenerations: OpenRouterGeneration[] = [];
  let offset = 0;
  const pageSize = 50; // OpenRouter's max page size

  try {
    while (allGenerations.length < limit) {
      const response = await fetch(
        `${OPENROUTER_API_BASE}/generation?offset=${offset}&limit=${pageSize}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`[OpenRouter] Generation fetch error: ${response.status}`);
        break;
      }

      const data: OpenRouterGenerationResponse = await response.json();

      if (!data.data || data.data.length === 0) {
        break;
      }

      allGenerations.push(...data.data);
      offset += pageSize;

      // If we got less than a full page, we've reached the end
      if (data.data.length < pageSize) {
        break;
      }
    }

    return allGenerations.slice(0, limit);
  } catch (error) {
    console.error('[OpenRouter] Error fetching generations:', error);
    return allGenerations;
  }
}

/**
 * Analyze generations to detect usage patterns by model
 */
export function analyzeUsagePatterns(
  generations: OpenRouterGeneration[]
): DetectedUsagePattern[] {
  // Group by model
  const modelUsage = new Map<
    string,
    {
      calls: number;
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
      latencies: number[];
      lastUsed: string;
    }
  >();

  for (const gen of generations) {
    const existing = modelUsage.get(gen.model) || {
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
      latencies: [],
      lastUsed: gen.created_at,
    };

    existing.calls++;
    existing.inputTokens += gen.tokens_prompt || 0;
    existing.outputTokens += gen.tokens_completion || 0;
    existing.totalCost += gen.total_cost || 0;
    if (gen.latency) {
      existing.latencies.push(gen.latency);
    }
    // Keep the most recent date
    if (gen.created_at > existing.lastUsed) {
      existing.lastUsed = gen.created_at;
    }

    modelUsage.set(gen.model, existing);
  }

  // Convert to array and calculate averages
  const patterns: DetectedUsagePattern[] = [];

  for (const [modelId, usage] of modelUsage) {
    // Format model name from ID (e.g., "openai/gpt-4o" -> "GPT-4o")
    const modelName = formatModelName(modelId);

    patterns.push({
      modelId,
      modelName,
      totalCalls: usage.calls,
      totalTokens: usage.inputTokens + usage.outputTokens,
      totalCost: usage.totalCost,
      avgInputTokens: Math.round(usage.inputTokens / usage.calls),
      avgOutputTokens: Math.round(usage.outputTokens / usage.calls),
      avgLatency:
        usage.latencies.length > 0
          ? Math.round(usage.latencies.reduce((a, b) => a + b, 0) / usage.latencies.length)
          : undefined,
      lastUsed: usage.lastUsed,
    });
  }

  // Sort by total calls descending
  return patterns.sort((a, b) => b.totalCalls - a.totalCalls);
}

/**
 * Format model ID into a readable name
 */
function formatModelName(modelId: string): string {
  const parts = modelId.split('/');
  const name = parts[parts.length - 1] || modelId;

  // Common transformations
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Gpt/g, 'GPT')
    .replace(/Llama/g, 'LLaMA');
}

/**
 * Infer task type from model characteristics and usage patterns
 */
function inferTaskType(modelId: string, avgInputTokens: number, avgOutputTokens: number): string {
  const modelLower = modelId.toLowerCase();

  // Vision models
  if (modelLower.includes('vision') || modelLower.includes('4o')) {
    return 'image_analysis';
  }

  // Code-focused models
  if (
    modelLower.includes('code') ||
    modelLower.includes('codex') ||
    modelLower.includes('codellama')
  ) {
    return 'code_generation';
  }

  // High output tokens suggests content generation
  if (avgOutputTokens > 500) {
    return 'content_generation';
  }

  // Low tokens both ways suggests classification/extraction
  if (avgInputTokens < 200 && avgOutputTokens < 100) {
    return 'classification';
  }

  // Medium input, low output suggests extraction
  if (avgInputTokens > avgOutputTokens * 3) {
    return 'data_extraction';
  }

  // Similar input/output suggests conversation
  if (Math.abs(avgInputTokens - avgOutputTokens) < avgInputTokens * 0.5) {
    return 'conversational';
  }

  // Default
  return 'general';
}

/**
 * Generate a portfolio preview from usage patterns
 */
export function generateImportPreview(
  keyInfo: OpenRouterKeyInfo['data'],
  patterns: DetectedUsagePattern[]
): ImportPreview {
  // Create suggested use cases from top models
  const useCases = patterns.slice(0, 10).map((pattern) => {
    const taskType = inferTaskType(pattern.modelId, pattern.avgInputTokens, pattern.avgOutputTokens);

    // Estimate monthly volume from recent usage
    // Assume patterns represent last 30 days
    const monthlyVolume = pattern.totalCalls;

    return {
      name: `${pattern.modelName} Usage`,
      modelId: pattern.modelId,
      taskType,
      avgInputTokens: pattern.avgInputTokens,
      avgOutputTokens: pattern.avgOutputTokens,
      monthlyVolume,
    };
  });

  return {
    keyValid: true,
    keyLabel: keyInfo.label,
    totalUsage: keyInfo.usage,
    isFreeTier: keyInfo.is_free_tier,
    modelsDetected: patterns,
    suggestedProduct: {
      name: 'Imported from OpenRouter',
      useCases,
    },
  };
}

/**
 * Main entry point: Fetch and analyze user's OpenRouter usage
 */
export async function analyzeOpenRouterAccount(
  apiKey: string
): Promise<ImportPreview | { error: string }> {
  // Step 1: Validate key
  const validation = await validateOpenRouterKey(apiKey);
  if (!validation.valid) {
    return { error: validation.error || 'Invalid API key' };
  }

  // Step 2: Fetch generations
  const generations = await fetchUserGenerations(apiKey, 200);

  if (generations.length === 0) {
    return {
      keyValid: true,
      keyLabel: validation.info?.label,
      totalUsage: validation.info?.usage || 0,
      isFreeTier: validation.info?.is_free_tier || false,
      modelsDetected: [],
      suggestedProduct: {
        name: 'New AI Project',
        useCases: [],
      },
    };
  }

  // Step 3: Analyze patterns
  const patterns = analyzeUsagePatterns(generations);

  // Step 4: Generate preview
  return generateImportPreview(validation.info!, patterns);
}
