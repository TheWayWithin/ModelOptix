/**
 * Redis Client Initialization
 *
 * Provides a singleton Redis client for use across the application.
 * Uses Upstash Redis for serverless-compatible Redis access.
 *
 * @see architecture.md Section 10 - Rate Limiting
 */

import { Redis } from '@upstash/redis';

/**
 * Check if Redis is configured
 * Returns false if environment variables are missing
 */
export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Singleton Redis client instance
 *
 * Lazy initialization - only creates client when first accessed.
 * Throws an error if environment variables are not configured.
 */
let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisInstance) {
    if (!isRedisConfigured()) {
      throw new Error(
        'Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
      );
    }

    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  return redisInstance;
}

/**
 * Direct Redis export for simple use cases
 * Note: Prefer getRedisClient() for better error handling
 */
export const redis = isRedisConfigured()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;
