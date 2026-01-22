// Model types for ModelOptix
// Models represent AI models that can be assigned to functions

export interface Model {
  id: string;
  provider_id: string;
  openrouter_id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  context_length: number;
  max_output_tokens: number | null;
  latency_p50: number | null;
  latency_p95: number | null;
  is_available: boolean;
  supports_vision: boolean;
  supports_function_calling: boolean;
  supports_streaming: boolean;
  supports_json_mode: boolean;
  supports_system_prompt: boolean;
  benchmarks: ModelBenchmarks | null;
  capabilities: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ModelBenchmarks {
  quality_score?: number;
  speed_score?: number;
  mmlu?: number;
  humaneval?: number;
  gsm8k?: number;
  arc?: number;
  hellaswag?: number;
  truthfulqa?: number;
  winogrande?: number;
  [key: string]: number | undefined;
}

export interface Provider {
  id: string;
  name: string;
  slug: string;
  hq_country: string | null;
  api_base_url: string | null;
  trust_tier: 'A' | 'B' | 'C' | 'unknown';
  trust_tier_reason: string | null;
  logo_url: string | null;
  documentation_url: string | null;
  status: 'active' | 'deprecated' | 'beta';
  features: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ModelPricing {
  id: string;
  model_id: string;
  provider_id: string;
  input_price: number | null;
  output_price: number | null;
  cached_input_price: number | null;
  is_primary: boolean;
  availability: 'available' | 'waitlist' | 'limited' | 'deprecated';
  rate_limits: Record<string, unknown>;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelWithProvider extends Model {
  provider: Provider;
  pricing: ModelPricing | null;
}

export interface ModelFilters {
  search?: string;
  providers?: string[];
  capabilities?: string[];
  availability?: string[];
  minContext?: number;
  maxInputPrice?: number;
  trustTiers?: string[];
}

export interface ModelCatalogResponse {
  models: ModelWithProvider[];
  total: number;
  page: number;
  pageSize: number;
  providers: ProviderSummary[];
}

export interface ProviderSummary {
  id: string;
  name: string;
  slug: string;
  trust_tier: string;
  model_count: number;
}

// Legacy types for backwards compatibility
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  displayName: string; // "Provider - Model Name" format
}

// Capability labels for display
export const CAPABILITY_LABELS: Record<string, string> = {
  supports_vision: 'Vision',
  supports_function_calling: 'Function Calling',
  supports_streaming: 'Streaming',
  supports_json_mode: 'JSON Mode',
  supports_system_prompt: 'System Prompt',
};

// Trust tier colors
export const getTrustTierColor = (tier: string): string => {
  switch (tier) {
    case 'A':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'B':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'C':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// Availability colors
export const getAvailabilityColor = (availability: string): string => {
  switch (availability) {
    case 'available':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'limited':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'waitlist':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'deprecated':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// Format price for display
export const formatPrice = (price: number | null): string => {
  if (price === null || price === undefined) return 'N/A';
  if (price === 0) return 'Free';
  if (price < 0.0001) return `$${(price * 1000000).toFixed(2)}/M`;
  if (price < 0.01) return `$${(price * 1000).toFixed(2)}/K`;
  return `$${price.toFixed(4)}/K`;
};

// Format context length for display
export const formatContextLength = (length: number): string => {
  if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
  if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
  return length.toString();
};
