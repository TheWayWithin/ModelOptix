/**
 * Rate Limiting Utility
 *
 * Implements rate limiting using Upstash Redis with sliding window algorithm.
 * Designed for Cloudflare-proxied requests with proper IP extraction.
 *
 * Rate Limits (from architecture.md Section 10):
 * - API: 100 requests per 15 minutes per IP
 * - Sanity Check: 10 per hour per user/IP
 *
 * @see architecture.md Section 10 - Rate Limiting
 */

import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient, isRedisConfigured } from './redis';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the rate limit resets
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
}

// ============================================================================
// Rate Limiters
// ============================================================================

let apiLimiterInstance: Ratelimit | null = null;
let sanityCheckLimiterInstance: Ratelimit | null = null;

/**
 * API Rate Limiter
 *
 * Limits: 100 requests per 15 minutes per IP
 * Use for general API endpoints.
 */
export function getApiLimiter(): Ratelimit | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!apiLimiterInstance) {
    apiLimiterInstance = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(100, '15 m'),
      prefix: 'ratelimit:api',
      analytics: true,
    });
  }

  return apiLimiterInstance;
}

/**
 * Sanity Check Rate Limiter
 *
 * Limits: 10 per hour per user/IP
 * Use for expensive operations like model analysis.
 */
export function getSanityCheckLimiter(): Ratelimit | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!sanityCheckLimiterInstance) {
    sanityCheckLimiterInstance = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      prefix: 'ratelimit:sanity',
      analytics: true,
    });
  }

  return sanityCheckLimiterInstance;
}

// ============================================================================
// IP Extraction (Cloudflare-aware)
// ============================================================================

/**
 * Check if request came through Cloudflare
 *
 * Cloudflare adds CF-Ray header to all proxied requests.
 * This helps verify the request is legitimate and not spoofed.
 */
export function isCloudflareRequest(request: Request): boolean {
  return request.headers.has('CF-Ray');
}

/**
 * Extract client IP from request
 *
 * Priority order:
 * 1. CF-Connecting-IP (Cloudflare - most reliable when behind CF)
 * 2. X-Forwarded-For (first IP in chain)
 * 3. X-Real-IP (some proxies)
 * 4. Fallback to 'unknown'
 *
 * @param request - The incoming request
 * @param requireCloudflare - If true, only trust CF-Connecting-IP
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(
  request: Request,
  requireCloudflare: boolean = false
): string {
  // If requiring Cloudflare, only use CF-Connecting-IP
  if (requireCloudflare) {
    const cfIP = request.headers.get('CF-Connecting-IP');
    if (cfIP && isCloudflareRequest(request)) {
      return cfIP;
    }
    // Return unknown if not a valid Cloudflare request
    return 'unknown';
  }

  // Priority 1: Cloudflare's CF-Connecting-IP (most reliable)
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Priority 2: X-Forwarded-For (first IP in the chain)
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // The first one is the original client
    const firstIP = xForwardedFor.split(',')[0]?.trim();
    if (firstIP) {
      return firstIP;
    }
  }

  // Priority 3: X-Real-IP
  const xRealIP = request.headers.get('X-Real-IP');
  if (xRealIP) {
    return xRealIP;
  }

  // Fallback
  return 'unknown';
}

// ============================================================================
// Rate Limit Checking
// ============================================================================

/**
 * Check rate limit for a given identifier
 *
 * @param limiter - The rate limiter to use (api or sanityCheck)
 * @param identifier - Unique identifier (usually IP or user ID)
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  // If rate limiting is not configured, allow the request
  if (!limiter) {
    return {
      success: true,
      limit: -1,
      remaining: -1,
      reset: -1,
    };
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Generate rate limit headers for response
 *
 * Standard headers for rate limit information:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Requests remaining in window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 */
export function getRateLimitHeaders(result: RateLimitResult): RateLimitHeaders {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  };
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Check API rate limit for a request
 *
 * Convenience function that extracts IP and checks against API limiter.
 *
 * @param request - The incoming request
 * @returns Rate limit result
 */
export async function checkApiRateLimit(
  request: Request
): Promise<RateLimitResult> {
  const ip = getClientIP(request);
  return checkRateLimit(getApiLimiter(), ip);
}

/**
 * Check sanity check rate limit for a request
 *
 * Convenience function for expensive operations.
 * Uses user ID if available, falls back to IP.
 *
 * @param request - The incoming request
 * @param userId - Optional user ID for more accurate limiting
 * @returns Rate limit result
 */
export async function checkSanityCheckRateLimit(
  request: Request,
  userId?: string
): Promise<RateLimitResult> {
  const identifier = userId || getClientIP(request);
  return checkRateLimit(getSanityCheckLimiter(), identifier);
}

/**
 * Create rate limit exceeded response
 *
 * Returns a properly formatted 429 response with rate limit headers.
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  message: string = 'Too many requests. Please try again later.'
): Response {
  const headers = getRateLimitHeaders(result);
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'rate_limit_exceeded',
      message,
      retryAfter: retryAfter > 0 ? retryAfter : 1,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        'Retry-After': String(retryAfter > 0 ? retryAfter : 1),
      },
    }
  );
}
