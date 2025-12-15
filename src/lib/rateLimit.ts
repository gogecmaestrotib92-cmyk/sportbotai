/**
 * Rate Limiting Utility using Upstash Redis
 * 
 * Provides sliding window rate limiting for API protection
 * with tier-based limits for different subscription plans.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Plan } from '@prisma/client';

// Initialize Redis client (will be null if not configured)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// ============================================
// TIER-BASED CHAT RATE LIMITS (Daily)
// Matches pricing tiers displayed on /pricing
// ============================================

export const CHAT_RATE_LIMITS = {
  FREE: { requests: 5, window: '1 d' },       // 5 per day (matches pricing)
  PRO: { requests: 50, window: '1 d' },       // 50 per day (matches pricing)
  PREMIUM: { requests: 1000, window: '1 d' }, // Effectively unlimited (1000/day)
  ANONYMOUS: { requests: 3, window: '1 d' },  // 3 per day (not logged in)
} as const;

// Create tier-specific rate limiters for chat
export const chatRateLimiters = {
  FREE: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(CHAT_RATE_LIMITS.FREE.requests, CHAT_RATE_LIMITS.FREE.window),
        analytics: true,
        prefix: 'ratelimit:chat:free',
      })
    : null,
    
  PRO: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(CHAT_RATE_LIMITS.PRO.requests, CHAT_RATE_LIMITS.PRO.window),
        analytics: true,
        prefix: 'ratelimit:chat:pro',
      })
    : null,
    
  PREMIUM: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(CHAT_RATE_LIMITS.PREMIUM.requests, CHAT_RATE_LIMITS.PREMIUM.window),
        analytics: true,
        prefix: 'ratelimit:chat:premium',
      })
    : null,
    
  ANONYMOUS: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(CHAT_RATE_LIMITS.ANONYMOUS.requests, CHAT_RATE_LIMITS.ANONYMOUS.window),
        analytics: true,
        prefix: 'ratelimit:chat:anon',
      })
    : null,
};

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
 * Check rate limit for chat based on user's subscription tier
 * @param identifier - User ID or IP address
 * @param plan - User's subscription plan (or null for anonymous)
 * @returns Object with success status, remaining requests, and tier info
 */
export async function checkChatRateLimit(
  identifier: string,
  plan: Plan | null
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  tier: string;
}> {
  const tier = plan || 'ANONYMOUS';
  const limiter = chatRateLimiters[tier];
  const limits = CHAT_RATE_LIMITS[tier];
  
  // If rate limiting is not configured, allow all requests
  if (!limiter) {
    return {
      success: true,
      limit: limits.requests,
      remaining: limits.requests,
      reset: 0,
      tier,
    };
  }

  const result = await limiter.limit(identifier);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    tier,
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
