/**
 * Caching Layer for SportBot AI
 * 
 * Uses Upstash Redis for serverless caching.
 * Falls back to in-memory cache if Redis is not configured.
 * 
 * Cache Strategy:
 * - API-Football data: 5 minutes (team form, H2H, stats)
 * - OpenAI analyses: 1 hour (same match + odds = same analysis)
 * - Sports/Events lists: 10 minutes
 * 
 * Setup:
 * 1. Create account at https://upstash.com
 * 2. Create a Redis database
 * 3. Add to .env.local:
 *    UPSTASH_REDIS_REST_URL=your_url
 *    UPSTASH_REDIS_REST_TOKEN=your_token
 */

import { Redis } from '@upstash/redis';

// ============================================
// REDIS CLIENT
// ============================================

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.log('[Cache] Upstash Redis not configured, using in-memory fallback');
    return null;
  }
  
  try {
    redis = new Redis({ url, token });
    console.log('[Cache] Upstash Redis connected');
    return redis;
  } catch (error) {
    console.error('[Cache] Failed to connect to Redis:', error);
    return null;
  }
}

// ============================================
// IN-MEMORY FALLBACK CACHE
// ============================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  memoryCache.forEach((entry, key) => {
    if (entry.expiresAt < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => memoryCache.delete(key));
}, 60000); // Clean every minute

// ============================================
// CACHE TTL CONSTANTS (in seconds)
// ============================================

export const CACHE_TTL = {
  // Sports data (changes frequently during match day)
  TEAM_FORM: 5 * 60,        // 5 minutes
  TEAM_STATS: 10 * 60,      // 10 minutes  
  HEAD_TO_HEAD: 30 * 60,    // 30 minutes (H2H doesn't change often)
  TEAM_ID: 24 * 60 * 60,    // 24 hours (team IDs never change)
  
  // API lists
  SPORTS_LIST: 10 * 60,     // 10 minutes
  EVENTS_LIST: 5 * 60,      // 5 minutes
  ODDS_DATA: 2 * 60,        // 2 minutes (odds change frequently)
  
  // AI Analysis
  ANALYSIS: 60 * 60,        // 1 hour (same inputs = same analysis)
  
  // User data
  USER_USAGE: 60,           // 1 minute
} as const;

// ============================================
// CACHE KEY GENERATORS
// ============================================

export const CACHE_KEYS = {
  // Sports API
  teamId: (sport: string, teamName: string) => 
    `team:${sport}:${teamName.toLowerCase().replace(/\s+/g, '_')}`,
  
  teamForm: (sport: string, teamId: number) => 
    `form:${sport}:${teamId}`,
  
  teamStats: (sport: string, teamId: number, season?: number) => 
    `stats:${sport}:${teamId}:${season || 'current'}`,
  
  h2h: (sport: string, teamId1: number, teamId2: number) => 
    `h2h:${sport}:${Math.min(teamId1, teamId2)}:${Math.max(teamId1, teamId2)}`,
  
  // API lists
  sportsList: () => 'sports:list',
  eventsList: (sport: string) => `events:${sport}`,
  odds: (sport: string, eventId?: string) => 
    eventId ? `odds:${sport}:${eventId}` : `odds:${sport}`,
  
  // Analysis
  analysis: (homeTeam: string, awayTeam: string, sport: string, oddsHash: string) => 
    `analysis:${sport}:${homeTeam.toLowerCase()}:${awayTeam.toLowerCase()}:${oddsHash}`,
  
  // User
  userUsage: (userId: string) => `user:usage:${userId}`,
};

// ============================================
// CACHE OPERATIONS
// ============================================

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redisClient = getRedis();
  
  if (redisClient) {
    try {
      const data = await redisClient.get<T>(key);
      if (data) {
        console.log(`[Cache] Redis HIT: ${key}`);
        return data;
      }
      console.log(`[Cache] Redis MISS: ${key}`);
      return null;
    } catch (error) {
      console.error(`[Cache] Redis GET error for ${key}:`, error);
      // Fall through to memory cache
    }
  }
  
  // Memory cache fallback
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) {
    console.log(`[Cache] Memory HIT: ${key}`);
    return entry.data;
  }
  
  if (entry) {
    memoryCache.delete(key);
  }
  
  console.log(`[Cache] Memory MISS: ${key}`);
  return null;
}

/**
 * Set a value in cache
 */
export async function cacheSet<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  const redisClient = getRedis();
  
  if (redisClient) {
    try {
      await redisClient.set(key, data, { ex: ttlSeconds });
      console.log(`[Cache] Redis SET: ${key} (TTL: ${ttlSeconds}s)`);
      return;
    } catch (error) {
      console.error(`[Cache] Redis SET error for ${key}:`, error);
      // Fall through to memory cache
    }
  }
  
  // Memory cache fallback
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  console.log(`[Cache] Memory SET: ${key} (TTL: ${ttlSeconds}s)`);
}

/**
 * Delete a value from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  const redisClient = getRedis();
  
  if (redisClient) {
    try {
      await redisClient.del(key);
      console.log(`[Cache] Redis DEL: ${key}`);
    } catch (error) {
      console.error(`[Cache] Redis DEL error for ${key}:`, error);
    }
  }
  
  memoryCache.delete(key);
}

/**
 * Delete multiple keys matching a pattern (Redis only)
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  const redisClient = getRedis();
  
  if (redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`[Cache] Redis DEL pattern ${pattern}: ${keys.length} keys`);
      }
    } catch (error) {
      console.error(`[Cache] Redis DEL pattern error for ${pattern}:`, error);
    }
  }
  
  // Memory cache - delete matching keys
  const patternBase = pattern.replace('*', '');
  const keysToDelete: string[] = [];
  memoryCache.forEach((_, key) => {
    if (key.includes(patternBase)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => memoryCache.delete(key));
}

// ============================================
// CACHE WRAPPER FUNCTIONS
// ============================================

/**
 * Get or fetch with caching
 * If cache miss, calls fetcher and caches the result
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cachedData = await cacheGet<T>(key);
  if (cachedData !== null) {
    return cachedData;
  }
  
  // Fetch fresh data
  const freshData = await fetcher();
  
  // Cache the result (only if not null/undefined)
  if (freshData !== null && freshData !== undefined) {
    await cacheSet(key, freshData, ttlSeconds);
  }
  
  return freshData;
}

/**
 * Generate a hash for odds (used in analysis cache key)
 */
export function hashOdds(odds: { home?: number | null; draw?: number | null; away?: number | null }): string {
  // Round to 2 decimal places to avoid tiny differences
  const h = odds.home?.toFixed(2) || '0';
  const d = odds.draw?.toFixed(2) || '0';
  const a = odds.away?.toFixed(2) || '0';
  return `${h}_${d}_${a}`;
}

// ============================================
// CACHE STATS (for monitoring)
// ============================================

export async function getCacheStats(): Promise<{
  redis: boolean;
  memorySize: number;
}> {
  const redisClient = getRedis();
  
  return {
    redis: redisClient !== null,
    memorySize: memoryCache.size,
  };
}
