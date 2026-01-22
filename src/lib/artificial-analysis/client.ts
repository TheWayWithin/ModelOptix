/**
 * Artificial Analysis API Client
 *
 * Fetches benchmark data from Artificial Analysis public API.
 * No API key required for public model data.
 */

import type {
  AAModelResponse,
  AAApiResponse,
  AAClientOptions,
} from './types';

const DEFAULT_BASE_URL = 'https://artificialanalysis.ai/api/v1';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Artificial Analysis API client with retry logic
 */
export class ArtificialAnalysisClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: AAClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  }

  /**
   * Fetch with retry logic and exponential backoff
   */
  private async fetchWithRetry<T>(url: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'ModelOptix/1.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        console.warn(
          `[ArtificialAnalysis] Attempt ${attempt}/${this.maxRetries} failed:`,
          lastError.message
        );

        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          console.log(`[ArtificialAnalysis] Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    throw new Error(
      `[ArtificialAnalysis] All ${this.maxRetries} attempts failed. Last error: ${lastError?.message}`
    );
  }

  /**
   * Fetch all models with benchmark data
   */
  async getModels(): Promise<AAModelResponse[]> {
    console.log('[ArtificialAnalysis] Fetching models from API...');

    const url = `${this.baseUrl}/models`;
    const response = await this.fetchWithRetry<
      AAApiResponse | AAModelResponse[]
    >(url);

    // Handle both array and wrapped response formats
    const models = Array.isArray(response) ? response : response.models;

    console.log(`[ArtificialAnalysis] Fetched ${models.length} models`);
    return models;
  }
}

// Singleton instance for convenience
let defaultClient: ArtificialAnalysisClient | null = null;

/**
 * Get the default client instance
 */
export function getAAClient(): ArtificialAnalysisClient {
  if (!defaultClient) {
    defaultClient = new ArtificialAnalysisClient();
  }
  return defaultClient;
}

/**
 * Fetch all models (convenience function)
 */
export async function fetchAAModels(): Promise<AAModelResponse[]> {
  return getAAClient().getModels();
}
