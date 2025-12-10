/**
 * Rate Limiting Utility using Upstash Redis
 * 
 * Provides sliding window rate limiting for API protection
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client (will be null if not configured)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limiters for different use cases
export const rateLimiters = {
  // API analysis endpoint - stricter limit
  analyze: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
        analytics: true,
        prefix: 'ratelimit:analyze',
      })
    : null,

  // General API endpoints
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
        analytics: true,
        prefix: 'ratelimit:api',
      })
    : null,

  // Authentication endpoints - very strict
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 attempts per minute
        analytics: true,
        prefix: 'ratelimit:auth',
      })
    : null,

  // Stripe endpoints
  stripe: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
        analytics: true,
        prefix: 'ratelimit:stripe',
      })
    : null,
};

export type RateLimiterType = keyof typeof rateLimiters;

/**
 * Check rate limit for a given identifier
 * @param type - The type of rate limiter to use
 * @param identifier - Unique identifier (usually IP or user ID)
 * @returns Object with success status and remaining requests
 */
export async function checkRateLimit(
  type: RateLimiterType,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const limiter = rateLimiters[type];
  
  // If rate limiting is not configured, allow all requests
  if (!limiter) {
    return {
      success: true,
      limit: -1,
      remaining: -1,
      reset: 0,
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
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Vercel-specific header
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }
  
  return 'unknown';
}

/**
 * Create rate limit response with proper headers
 */
export function rateLimitResponse(reset: number) {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(reset),
      },
    }
  );
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitingEnabled(): boolean {
  return redis !== null;
}
