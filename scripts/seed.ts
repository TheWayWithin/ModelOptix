/**
 * ModelOptix Seed Script
 *
 * Seeds the database with:
 * - Initial admin user (is_admin = true)
 * - 6 providers with varied trust tiers
 * - 30+ models with realistic data
 * - Trust scores across all 8 dimensions
 *
 * Usage: pnpm seed
 *
 * Environment Requirements:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SEED_ADMIN_EMAIL (optional, defaults to admin@modeloptix.com)
 */

import { createClient } from '@supabase/supabase-js';

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================================
// Type Definitions
// ============================================================================

interface Provider {
  name: string;
  slug: string;
  hq_country: string;
  api_base_url: string;
  trust_tier: 'A' | 'B' | 'C' | 'unknown';
  trust_tier_reason: string;
  logo_url: string;
  documentation_url: string;
  status: 'active' | 'deprecated' | 'beta';
  features: Record<string, boolean>;
}

interface Model {
  openrouter_id: string;
  name: string;
  display_name: string;
  description: string;
  context_length: number;
  max_output_tokens: number;
  latency_p50: number;
  latency_p95: number;
  is_available: boolean;
  supports_vision: boolean;
  supports_function_calling: boolean;
  supports_streaming: boolean;
  supports_json_mode: boolean;
  supports_system_prompt: boolean;
  benchmarks: Record<string, number>;
  status: 'active' | 'deprecated' | 'preview' | 'sunset';
  is_featured: boolean;
  release_date: string;
  provider_slug: string; // For linking
  input_price: number; // Per 1M tokens
  output_price: number;
}

interface TrustScore {
  dimension: string;
  score: number;
  confidence: number;
  evidence: string;
}

// ============================================================================
// Seed Data: Providers
// ============================================================================

const providers: Provider[] = [
  {
    name: 'OpenAI',
    slug: 'openai',
    hq_country: 'USA',
    api_base_url: 'https://api.openai.com/v1',
    trust_tier: 'A',
    trust_tier_reason:
      'Industry leader with enterprise-grade security, SOC 2 Type II compliance, and clear data handling policies',
    logo_url: '/logos/openai.svg',
    documentation_url: 'https://platform.openai.com/docs',
    status: 'active',
    features: {
      batch_api: true,
      fine_tuning: true,
      embeddings: true,
      assistants: true,
    },
  },
  {
    name: 'Anthropic',
    slug: 'anthropic',
    hq_country: 'USA',
    api_base_url: 'https://api.anthropic.com/v1',
    trust_tier: 'A',
    trust_tier_reason:
      'Strong safety focus, transparent Constitutional AI approach, SOC 2 Type II certified',
    logo_url: '/logos/anthropic.svg',
    documentation_url: 'https://docs.anthropic.com',
    status: 'active',
    features: {
      computer_use: true,
      extended_thinking: true,
      prompt_caching: true,
    },
  },
  {
    name: 'Google',
    slug: 'google',
    hq_country: 'USA',
    api_base_url: 'https://generativelanguage.googleapis.com/v1beta',
    trust_tier: 'A',
    trust_tier_reason:
      'Google Cloud enterprise compliance, extensive certifications, clear data governance',
    logo_url: '/logos/google.svg',
    documentation_url: 'https://ai.google.dev/docs',
    status: 'active',
    features: {
      grounding: true,
      code_execution: true,
      multimodal: true,
    },
  },
  {
    name: 'Mistral AI',
    slug: 'mistral',
    hq_country: 'France',
    api_base_url: 'https://api.mistral.ai/v1',
    trust_tier: 'B',
    trust_tier_reason:
      'EU-based with GDPR compliance, growing track record but less established than tier A',
    logo_url: '/logos/mistral.svg',
    documentation_url: 'https://docs.mistral.ai',
    status: 'active',
    features: {
      fine_tuning: true,
      function_calling: true,
    },
  },
  {
    name: 'Meta',
    slug: 'meta',
    hq_country: 'USA',
    api_base_url: '',
    trust_tier: 'B',
    trust_tier_reason:
      'Open weights model (Llama), varied deployment options but self-hosting requires own security measures',
    logo_url: '/logos/meta.svg',
    documentation_url: 'https://llama.meta.com/docs',
    status: 'active',
    features: {
      open_weights: true,
      commercial_license: true,
    },
  },
  {
    name: 'Cohere',
    slug: 'cohere',
    hq_country: 'Canada',
    api_base_url: 'https://api.cohere.ai/v1',
    trust_tier: 'B',
    trust_tier_reason:
      'Strong enterprise focus with SOC 2, but smaller market presence than tier A providers',
    logo_url: '/logos/cohere.svg',
    documentation_url: 'https://docs.cohere.com',
    status: 'active',
    features: {
      rag: true,
      rerank: true,
      embed: true,
    },
  },
];

// ============================================================================
// Seed Data: Models
// ============================================================================

const models: Model[] = [
  // OpenAI Models
  {
    openrouter_id: 'openai/gpt-4o',
    name: 'gpt-4o',
    display_name: 'GPT-4o',
    description:
      "OpenAI's flagship multimodal model with vision, excellent at reasoning and code",
    context_length: 128000,
    max_output_tokens: 16384,
    latency_p50: 800,
    latency_p95: 2000,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 88.7, humaneval: 90.2, gpqa: 53.6 },
    status: 'active',
    is_featured: true,
    release_date: '2024-05-13',
    provider_slug: 'openai',
    input_price: 2.5,
    output_price: 10.0,
  },
  {
    openrouter_id: 'openai/gpt-4o-mini',
    name: 'gpt-4o-mini',
    display_name: 'GPT-4o Mini',
    description:
      'Cost-efficient small model with excellent speed and reasonable capabilities',
    context_length: 128000,
    max_output_tokens: 16384,
    latency_p50: 400,
    latency_p95: 900,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 82.0, humaneval: 87.0, gpqa: 43.0 },
    status: 'active',
    is_featured: true,
    release_date: '2024-07-18',
    provider_slug: 'openai',
    input_price: 0.15,
    output_price: 0.6,
  },
  {
    openrouter_id: 'openai/gpt-4-turbo',
    name: 'gpt-4-turbo',
    display_name: 'GPT-4 Turbo',
    description: 'Previous generation GPT-4 with vision, still highly capable',
    context_length: 128000,
    max_output_tokens: 4096,
    latency_p50: 1200,
    latency_p95: 3000,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 86.4, humaneval: 87.1, gpqa: 49.1 },
    status: 'active',
    is_featured: false,
    release_date: '2024-04-09',
    provider_slug: 'openai',
    input_price: 10.0,
    output_price: 30.0,
  },
  {
    openrouter_id: 'openai/o1',
    name: 'o1',
    display_name: 'o1',
    description:
      "OpenAI's reasoning model with extended thinking for complex problems",
    context_length: 200000,
    max_output_tokens: 100000,
    latency_p50: 15000,
    latency_p95: 60000,
    is_available: true,
    supports_vision: true,
    supports_function_calling: false,
    supports_streaming: true,
    supports_json_mode: false,
    supports_system_prompt: false,
    benchmarks: { mmlu: 91.8, humaneval: 94.8, gpqa: 78.0 },
    status: 'active',
    is_featured: true,
    release_date: '2024-12-05',
    provider_slug: 'openai',
    input_price: 15.0,
    output_price: 60.0,
  },
  {
    openrouter_id: 'openai/o1-mini',
    name: 'o1-mini',
    display_name: 'o1 Mini',
    description: 'Smaller reasoning model, faster than o1 with good STEM performance',
    context_length: 128000,
    max_output_tokens: 65536,
    latency_p50: 8000,
    latency_p95: 30000,
    is_available: true,
    supports_vision: false,
    supports_function_calling: false,
    supports_streaming: true,
    supports_json_mode: false,
    supports_system_prompt: false,
    benchmarks: { mmlu: 85.2, humaneval: 92.4, gpqa: 60.0 },
    status: 'active',
    is_featured: false,
    release_date: '2024-09-12',
    provider_slug: 'openai',
    input_price: 3.0,
    output_price: 12.0,
  },

  // Anthropic Models
  {
    openrouter_id: 'anthropic/claude-3.5-sonnet',
    name: 'claude-3-5-sonnet-20241022',
    display_name: 'Claude 3.5 Sonnet',
    description:
      "Anthropic's most intelligent model, excellent for coding and complex analysis",
    context_length: 200000,
    max_output_tokens: 8192,
    latency_p50: 600,
    latency_p95: 1500,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 88.7, humaneval: 92.0, gpqa: 59.4 },
    status: 'active',
    is_featured: true,
    release_date: '2024-10-22',
    provider_slug: 'anthropic',
    input_price: 3.0,
    output_price: 15.0,
  },
  {
    openrouter_id: 'anthropic/claude-3.5-haiku',
    name: 'claude-3-5-haiku-20241022',
    display_name: 'Claude 3.5 Haiku',
    description:
      'Fastest Claude model, excellent for high-throughput tasks and quick responses',
    context_length: 200000,
    max_output_tokens: 8192,
    latency_p50: 250,
    latency_p95: 600,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 75.2, humaneval: 88.1, gpqa: 41.6 },
    status: 'active',
    is_featured: true,
    release_date: '2024-10-22',
    provider_slug: 'anthropic',
    input_price: 0.8,
    output_price: 4.0,
  },
  {
    openrouter_id: 'anthropic/claude-3-opus',
    name: 'claude-3-opus-20240229',
    display_name: 'Claude 3 Opus',
    description:
      'Most capable Claude 3 model, excellent for complex reasoning and analysis',
    context_length: 200000,
    max_output_tokens: 4096,
    latency_p50: 1500,
    latency_p95: 4000,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 86.8, humaneval: 84.9, gpqa: 50.4 },
    status: 'active',
    is_featured: false,
    release_date: '2024-02-29',
    provider_slug: 'anthropic',
    input_price: 15.0,
    output_price: 75.0,
  },
  {
    openrouter_id: 'anthropic/claude-3-sonnet',
    name: 'claude-3-sonnet-20240229',
    display_name: 'Claude 3 Sonnet',
    description: 'Balanced Claude 3 model, good mix of speed and capability',
    context_length: 200000,
    max_output_tokens: 4096,
    latency_p50: 800,
    latency_p95: 2000,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 79.0, humaneval: 73.0, gpqa: 40.4 },
    status: 'active',
    is_featured: false,
    release_date: '2024-02-29',
    provider_slug: 'anthropic',
    input_price: 3.0,
    output_price: 15.0,
  },
  {
    openrouter_id: 'anthropic/claude-3-haiku',
    name: 'claude-3-haiku-20240307',
    display_name: 'Claude 3 Haiku',
    description: 'Fast and affordable Claude 3 model for simple tasks',
    context_length: 200000,
    max_output_tokens: 4096,
    latency_p50: 300,
    latency_p95: 700,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 75.2, humaneval: 75.9, gpqa: 33.3 },
    status: 'active',
    is_featured: false,
    release_date: '2024-03-07',
    provider_slug: 'anthropic',
    input_price: 0.25,
    output_price: 1.25,
  },

  // Google Models
  {
    openrouter_id: 'google/gemini-2.0-flash-exp',
    name: 'gemini-2.0-flash-exp',
    display_name: 'Gemini 2.0 Flash',
    description:
      'Latest Gemini with native tool use, code execution, and multimodal capabilities',
    context_length: 1000000,
    max_output_tokens: 8192,
    latency_p50: 350,
    latency_p95: 800,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 84.0, humaneval: 89.0, gpqa: 55.0 },
    status: 'preview',
    is_featured: true,
    release_date: '2024-12-11',
    provider_slug: 'google',
    input_price: 0.075,
    output_price: 0.3,
  },
  {
    openrouter_id: 'google/gemini-1.5-pro',
    name: 'gemini-1.5-pro',
    display_name: 'Gemini 1.5 Pro',
    description:
      'High capability model with 1M context window for long document analysis',
    context_length: 2000000,
    max_output_tokens: 8192,
    latency_p50: 900,
    latency_p95: 2500,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 85.9, humaneval: 84.1, gpqa: 46.2 },
    status: 'active',
    is_featured: true,
    release_date: '2024-05-14',
    provider_slug: 'google',
    input_price: 1.25,
    output_price: 5.0,
  },
  {
    openrouter_id: 'google/gemini-1.5-flash',
    name: 'gemini-1.5-flash',
    display_name: 'Gemini 1.5 Flash',
    description:
      'Fast and cost-efficient with long context, good for high-volume use',
    context_length: 1000000,
    max_output_tokens: 8192,
    latency_p50: 300,
    latency_p95: 700,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 78.9, humaneval: 74.3, gpqa: 39.5 },
    status: 'active',
    is_featured: false,
    release_date: '2024-05-14',
    provider_slug: 'google',
    input_price: 0.075,
    output_price: 0.3,
  },
  {
    openrouter_id: 'google/gemini-1.5-flash-8b',
    name: 'gemini-1.5-flash-8b',
    display_name: 'Gemini 1.5 Flash 8B',
    description: 'Smallest Gemini model, extremely fast for simple tasks',
    context_length: 1000000,
    max_output_tokens: 8192,
    latency_p50: 150,
    latency_p95: 350,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 65.0, humaneval: 62.0, gpqa: 28.0 },
    status: 'active',
    is_featured: false,
    release_date: '2024-10-03',
    provider_slug: 'google',
    input_price: 0.0375,
    output_price: 0.15,
  },

  // Mistral Models
  {
    openrouter_id: 'mistral/mistral-large-latest',
    name: 'mistral-large-2411',
    display_name: 'Mistral Large',
    description:
      "Mistral's flagship model, strong at multilingual and code generation",
    context_length: 128000,
    max_output_tokens: 8192,
    latency_p50: 700,
    latency_p95: 1800,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 84.0, humaneval: 92.1, gpqa: 51.0 },
    status: 'active',
    is_featured: true,
    release_date: '2024-11-18',
    provider_slug: 'mistral',
    input_price: 2.0,
    output_price: 6.0,
  },
  {
    openrouter_id: 'mistral/pixtral-large-latest',
    name: 'pixtral-large-2411',
    display_name: 'Pixtral Large',
    description:
      'Multimodal Mistral model with vision capabilities, based on Mistral Large',
    context_length: 128000,
    max_output_tokens: 8192,
    latency_p50: 900,
    latency_p95: 2200,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 83.0, humaneval: 85.0, gpqa: 48.0 },
    status: 'active',
    is_featured: false,
    release_date: '2024-11-18',
    provider_slug: 'mistral',
    input_price: 2.0,
    output_price: 6.0,
  },
  {
    openrouter_id: 'mistral/mistral-small-latest',
    name: 'mistral-small-2501',
    display_name: 'Mistral Small',
    description:
      'Cost-efficient model with strong performance for its size, good for simple tasks',
    context_length: 32000,
    max_output_tokens: 8192,
    latency_p50: 350,
    latency_p95: 800,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 72.0, humaneval: 81.0, gpqa: 38.0 },
    status: 'active',
    is_featured: false,
    release_date: '2025-01-07',
    provider_slug: 'mistral',
    input_price: 0.1,
    output_price: 0.3,
  },
  {
    openrouter_id: 'mistral/codestral-latest',
    name: 'codestral-2501',
    display_name: 'Codestral',
    description:
      'Specialized code model from Mistral, excellent for code generation and review',
    context_length: 32000,
    max_output_tokens: 8192,
    latency_p50: 400,
    latency_p95: 950,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { humaneval: 94.2, mbpp: 88.0 },
    status: 'active',
    is_featured: false,
    release_date: '2025-01-14',
    provider_slug: 'mistral',
    input_price: 0.3,
    output_price: 0.9,
  },
  {
    openrouter_id: 'mistral/ministral-8b-latest',
    name: 'ministral-8b-2410',
    display_name: 'Ministral 8B',
    description: 'Compact model for edge and on-device deployment scenarios',
    context_length: 128000,
    max_output_tokens: 8192,
    latency_p50: 200,
    latency_p95: 450,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 62.0, humaneval: 72.0, gpqa: 28.0 },
    status: 'active',
    is_featured: false,
    release_date: '2024-10-16',
    provider_slug: 'mistral',
    input_price: 0.1,
    output_price: 0.1,
  },
  {
    openrouter_id: 'mistral/ministral-3b-latest',
    name: 'ministral-3b-2410',
    display_name: 'Ministral 3B',
    description: 'Smallest Mistral model, extremely efficient for basic tasks',
    context_length: 128000,
    max_output_tokens: 8192,
    latency_p50: 120,
    latency_p95: 280,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 53.0, humaneval: 62.0, gpqa: 22.0 },
    status: 'active',
    is_featured: false,
    release_date: '2024-10-16',
    provider_slug: 'mistral',
    input_price: 0.04,
    output_price: 0.04,
  },

  // Meta Llama Models
  {
    openrouter_id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'llama-3.3-70b-instruct',
    display_name: 'Llama 3.3 70B',
    description:
      'Latest Llama model from Meta, excellent for various tasks at lower cost',
    context_length: 128000,
    max_output_tokens: 8192,
    latency_p50: 600,
    latency_p95: 1400,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 86.0, humaneval: 88.4, gpqa: 50.0 },
    status: 'active',
    is_featured: true,
    release_date: '2024-12-06',
    provider_slug: 'meta',
    input_price: 0.35,
    output_price: 0.4,
  },
  {
    openrouter_id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'llama-3.1-405b-instruct',
    display_name: 'Llama 3.1 405B',
    description: 'Largest open weights model, competitive with top proprietary models',
    context_length: 128000,
    max_output_tokens: 8192,
    latency_p50: 1500,
    latency_p95: 4000,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 88.6, humaneval: 89.0, gpqa: 51.1 },
    status: 'active',
    is_featured: false,
    release_date: '2024-07-23',
    provider_slug: 'meta',
    input_price: 3.0,
    output_price: 3.0,
  },
  {
    openrouter_id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'llama-3.1-70b-instruct',
    display_name: 'Llama 3.1 70B',
    description: 'Strong open model, good balance of capability and cost',
    context_length: 128000,
    max_output_tokens: 8192,
    latency_p50: 500,
    latency_p95: 1200,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 83.6, humaneval: 80.5, gpqa: 46.7 },
    status: 'active',
    is_featured: false,
    release_date: '2024-07-23',
    provider_slug: 'meta',
    input_price: 0.35,
    output_price: 0.4,
  },
  {
    openrouter_id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'llama-3.1-8b-instruct',
    display_name: 'Llama 3.1 8B',
    description:
      'Smallest Llama 3.1 model, very fast and efficient for basic use cases',
    context_length: 128000,
    max_output_tokens: 8192,
    latency_p50: 150,
    latency_p95: 350,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 69.4, humaneval: 72.6, gpqa: 32.8 },
    status: 'active',
    is_featured: false,
    release_date: '2024-07-23',
    provider_slug: 'meta',
    input_price: 0.055,
    output_price: 0.055,
  },
  {
    openrouter_id: 'meta-llama/llama-3.2-90b-vision-instruct',
    name: 'llama-3.2-90b-vision-instruct',
    display_name: 'Llama 3.2 90B Vision',
    description: 'Multimodal Llama model with vision capabilities',
    context_length: 128000,
    max_output_tokens: 8192,
    latency_p50: 1100,
    latency_p95: 2800,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 86.0, humaneval: 85.0, gpqa: 48.0 },
    status: 'active',
    is_featured: false,
    release_date: '2024-09-25',
    provider_slug: 'meta',
    input_price: 0.35,
    output_price: 0.4,
  },
  {
    openrouter_id: 'meta-llama/llama-3.2-11b-vision-instruct',
    name: 'llama-3.2-11b-vision-instruct',
    display_name: 'Llama 3.2 11B Vision',
    description: 'Compact vision model for efficient multimodal tasks',
    context_length: 128000,
    max_output_tokens: 8192,
    latency_p50: 280,
    latency_p95: 650,
    is_available: true,
    supports_vision: true,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 68.0, humaneval: 72.0, gpqa: 30.0 },
    status: 'active',
    is_featured: false,
    release_date: '2024-09-25',
    provider_slug: 'meta',
    input_price: 0.055,
    output_price: 0.055,
  },

  // Cohere Models
  {
    openrouter_id: 'cohere/command-r-plus-08-2024',
    name: 'command-r-plus-08-2024',
    display_name: 'Command R+',
    description:
      'Enterprise-grade model with RAG capabilities, excellent for business applications',
    context_length: 128000,
    max_output_tokens: 4096,
    latency_p50: 800,
    latency_p95: 2000,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 75.0, humaneval: 75.0, gpqa: 33.0 },
    status: 'active',
    is_featured: false,
    release_date: '2024-08-30',
    provider_slug: 'cohere',
    input_price: 2.5,
    output_price: 10.0,
  },
  {
    openrouter_id: 'cohere/command-r-08-2024',
    name: 'command-r-08-2024',
    display_name: 'Command R',
    description: 'Efficient model with excellent RAG and tool use capabilities',
    context_length: 128000,
    max_output_tokens: 4096,
    latency_p50: 450,
    latency_p95: 1000,
    is_available: true,
    supports_vision: false,
    supports_function_calling: true,
    supports_streaming: true,
    supports_json_mode: true,
    supports_system_prompt: true,
    benchmarks: { mmlu: 68.0, humaneval: 68.0, gpqa: 28.0 },
    status: 'active',
    is_featured: false,
    release_date: '2024-08-30',
    provider_slug: 'cohere',
    input_price: 0.15,
    output_price: 0.6,
  },
];

// ============================================================================
// Trust Score Generation
// ============================================================================

const trustDimensions = [
  'data_handling',
  'transparency',
  'security',
  'reliability',
  'consistency',
  'safety',
  'accuracy',
  'cost_stability',
];

function generateTrustScores(
  providerTrustTier: string,
  modelBenchmarks: Record<string, number>
): TrustScore[] {
  const baseScores: Record<string, { min: number; max: number }> = {
    A: { min: 75, max: 95 },
    B: { min: 60, max: 85 },
    C: { min: 40, max: 70 },
    unknown: { min: 30, max: 60 },
  };

  const defaultRange = { min: 30, max: 60 };
  const range = baseScores[providerTrustTier] ?? defaultRange;
  const hasHighMMLU = (modelBenchmarks?.mmlu ?? 0) > 80;

  return trustDimensions.map((dimension) => {
    // Adjust score based on dimension and model benchmarks
    let minScore = range.min;
    let maxScore = range.max;

    // Boost accuracy if model has high MMLU score
    if (dimension === 'accuracy' && hasHighMMLU) {
      minScore += 5;
      maxScore = Math.min(100, maxScore + 5);
    }

    // Slight random variation
    const score = Math.floor(minScore + Math.random() * (maxScore - minScore));
    const confidence = Math.floor(50 + Math.random() * 45); // 50-95%

    return {
      dimension,
      score,
      confidence,
      evidence: getEvidenceForDimension(dimension, providerTrustTier),
    };
  });
}

function getEvidenceForDimension(dimension: string, tier: string): string {
  const evidenceMap: Record<string, Record<string, string>> = {
    data_handling: {
      A: 'SOC 2 Type II certified, GDPR compliant, data retention policies documented',
      B: 'Privacy policy available, data handling documented, some certifications',
      C: 'Basic privacy policy, limited data handling documentation',
      unknown: 'Data handling practices not publicly documented',
    },
    transparency: {
      A: 'Model cards published, training data disclosed, regular safety reports',
      B: 'Some transparency reports, partial training data disclosure',
      C: 'Limited public documentation',
      unknown: 'No transparency reports available',
    },
    security: {
      A: 'Enterprise security features, encryption at rest and in transit, audit logs',
      B: 'Standard security measures, encryption available',
      C: 'Basic security, limited enterprise features',
      unknown: 'Security practices not publicly documented',
    },
    reliability: {
      A: '99.9% uptime SLA, global infrastructure, redundancy',
      B: '99% uptime, established infrastructure',
      C: 'No SLA, limited track record',
      unknown: 'Uptime metrics not available',
    },
    consistency: {
      A: 'Deterministic outputs available, low variance in responses',
      B: 'Generally consistent, some variance observed',
      C: 'Higher variance, less predictable',
      unknown: 'Consistency metrics not available',
    },
    safety: {
      A: 'RLHF alignment, content filtering, safety testing documented',
      B: 'Safety measures in place, some documentation',
      C: 'Basic content filtering',
      unknown: 'Safety measures not documented',
    },
    accuracy: {
      A: 'Top benchmark scores, regular evaluation, accuracy metrics published',
      B: 'Good benchmark performance, periodic evaluation',
      C: 'Limited benchmark data',
      unknown: 'Accuracy metrics not available',
    },
    cost_stability: {
      A: 'Published pricing, no surprise changes, volume discounts available',
      B: 'Stable pricing, occasional changes with notice',
      C: 'Pricing may vary, limited notice of changes',
      unknown: 'Pricing stability unknown',
    },
  };

  return evidenceMap[dimension]?.[tier] || evidenceMap[dimension]?.['unknown'] || 'No evidence available';
}

// ============================================================================
// Main Seed Function
// ============================================================================

async function seed(): Promise<void> {
  console.log('🌱 Starting ModelOptix seed...\n');

  // Track created IDs
  const providerIds: Record<string, string> = {};
  const modelIds: string[] = [];

  try {
    // ========================================================================
    // Step 1: Seed Providers
    // ========================================================================
    console.log('📦 Seeding providers...');

    for (const provider of providers) {
      const { data, error } = await supabase
        .from('providers')
        .upsert(provider, { onConflict: 'slug' })
        .select('id')
        .single();

      if (error) {
        console.error(`   ❌ Failed to seed provider ${provider.name}:`, error);
        continue;
      }

      providerIds[provider.slug] = data.id;
      console.log(`   ✅ ${provider.name} (trust tier: ${provider.trust_tier})`);
    }

    console.log(`   → ${Object.keys(providerIds).length} providers seeded\n`);

    // ========================================================================
    // Step 2: Seed Models
    // ========================================================================
    console.log('🤖 Seeding models...');

    for (const model of models) {
      const providerId = providerIds[model.provider_slug];
      if (!providerId) {
        console.error(`   ❌ Provider not found for ${model.name}: ${model.provider_slug}`);
        continue;
      }

      // Extract pricing for separate table
      const { input_price, output_price, provider_slug, ...modelData } = model;

      const { data: insertedModel, error: modelError } = await supabase
        .from('models')
        .upsert(
          {
            ...modelData,
            provider_id: providerId,
          },
          { onConflict: 'openrouter_id' }
        )
        .select('id')
        .single();

      if (modelError) {
        console.error(`   ❌ Failed to seed model ${model.name}:`, modelError);
        continue;
      }

      modelIds.push(insertedModel.id);
      console.log(`   ✅ ${model.display_name}`);

      // Insert pricing
      const { error: pricingError } = await supabase.from('model_provider_pricing').upsert(
        {
          model_id: insertedModel.id,
          provider_id: providerId,
          input_price: input_price / 1000, // Convert from per-1M to per-1K
          output_price: output_price / 1000,
          is_primary: true,
          availability: 'available',
        },
        { onConflict: 'model_id,provider_id' }
      );

      if (pricingError) {
        console.error(`   ⚠️  Failed to add pricing for ${model.name}:`, pricingError);
      }
    }

    console.log(`   → ${modelIds.length} models seeded\n`);

    // ========================================================================
    // Step 3: Seed Trust Scores
    // ========================================================================
    console.log('🛡️  Seeding trust scores...');

    let trustScoreCount = 0;

    for (const model of models) {
      // Find model ID
      const { data: modelData } = await supabase
        .from('models')
        .select('id, provider_id')
        .eq('openrouter_id', model.openrouter_id)
        .single();

      if (!modelData) continue;

      // Get provider trust tier
      const { data: providerData } = await supabase
        .from('providers')
        .select('trust_tier')
        .eq('id', modelData.provider_id)
        .single();

      if (!providerData) continue;

      // Generate and insert trust scores
      const scores = generateTrustScores(providerData.trust_tier, model.benchmarks);

      for (const score of scores) {
        const { error } = await supabase.from('model_trust_scores').upsert(
          {
            model_id: modelData.id,
            dimension: score.dimension,
            score: score.score,
            confidence: score.confidence,
            evidence: score.evidence,
          },
          { onConflict: 'model_id,dimension' }
        );

        if (!error) trustScoreCount++;
      }
    }

    console.log(`   → ${trustScoreCount} trust scores seeded\n`);

    // ========================================================================
    // Step 4: Create Admin User (if auth is set up)
    // ========================================================================
    console.log('👤 Creating admin user profile...');

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@modeloptix.com';

    // Note: This creates the user_profile record, but the actual auth user
    // must be created through Supabase Auth (sign up flow or dashboard)
    // The auth trigger (003_auth_trigger.sql) will normally create this,
    // but we can also upsert a placeholder for testing

    // First check if we can use admin API to create a real auth user
    const { data: adminAuth, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      email_confirm: true,
      user_metadata: { is_admin: true, display_name: 'Admin' },
    });

    if (authError) {
      console.log(`   ⚠️  Could not create auth user (may already exist): ${authError.message}`);
    } else if (adminAuth?.user) {
      // Update the user_profile to set is_admin
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ is_admin: true })
        .eq('id', adminAuth.user.id);

      if (profileError) {
        console.log(`   ⚠️  Could not update admin flag: ${profileError.message}`);
      } else {
        console.log(`   ✅ Admin user created: ${adminEmail} (is_admin: true)`);
      }
    }

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('\n✨ Seed complete!\n');
    console.log('Summary:');
    console.log(`   - ${Object.keys(providerIds).length} providers`);
    console.log(`   - ${modelIds.length} models`);
    console.log(`   - ${trustScoreCount} trust scores (8 dimensions × ${modelIds.length} models)`);
    console.log(`   - Admin user: ${adminEmail}\n`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seed();
