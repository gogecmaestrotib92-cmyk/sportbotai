/**
 * Query Learning Service
 * 
 * Systematic approach to improving chat intelligence over time:
 * 1. Track every query with full context
 * 2. Detect mismatches automatically
 * 3. Learn from feedback
 * 4. Surface patterns for improvement
 * 5. Suggest new patterns based on failures
 * 
 * Philosophy: "Every failed query is a learning opportunity"
 */

import { prisma } from '@/lib/prisma';
import { QueryIntent } from '@/lib/query-intelligence';

// ============================================================================
// Types
// ============================================================================

export interface QueryTrackingData {
  query: string;
  queryNormalized?: string;
  expandedQuery?: string;
  
  // Classification
  detectedIntent?: QueryIntent;
  intentConfidence?: number;
  entitiesDetected?: string[];
  patternMatched?: string;
  wasLLMClassified?: boolean;
  
  // Context
  category?: string;
  sport?: string;
  team?: string;
  league?: string;
  
  // Response
  answer?: string;
  responseSource?: 'CACHE' | 'VERIFIED_STATS' | 'PERPLEXITY' | 'OUR_PREDICTION' | 'LLM' | 'HYBRID';
  cacheHit?: boolean;
  latencyMs?: number;
  citations?: string[];
  
  // Quality
  dataConfidenceLevel?: string;
  dataConfidenceScore?: number;
  dataSources?: string[];
  
  // User
  userId?: string;
  
  // A/B Testing
  abTestVariant?: 'A' | 'B';
  abTestId?: string;
}

export interface MismatchCheck {
  hasMismatch: boolean;
  details?: string;
  queryEntities: string[];
  responseEntities: string[];
}

export interface LearningInsight {
  type: 'PATTERN_GAP' | 'ENTITY_MISS' | 'INTENT_CONFUSION' | 'LOW_CONFIDENCE';
  description: string;
  queryExample: string;
  suggestedPattern?: string;
  occurrences: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface QueryStats {
  totalQueries: number;
  last24h: number;
  last7d: number;
  avgConfidence: number;
  feedbackPositive: number;
  feedbackNegative: number;
  mismatchCount: number;
  llmFallbackRate: number;
  cacheHitRate: number;
  topCategories: { category: string; count: number }[];
  recentQueries: { query: string; category: string | null; createdAt: Date }[];
}

// ============================================================================
// Query Tracking (now uses new schema fields)
// ============================================================================

/**
 * Track a query - note: main tracking is in sportbot-memory.ts
 * This function is for additional learning-specific operations
 */
export async function trackQuery(data: QueryTrackingData): Promise<string | null> {
  // Main tracking is handled by sportbot-memory.ts
  // This is just for logging purposes
  console.log(`[QueryLearning] Query tracked: ${data.query.substring(0, 50)}... intent=${data.detectedIntent}, LLM=${data.wasLLMClassified}`);
  return null;
}

/**
 * Record feedback for a query (by query ID)
 */
export async function recordFeedback(
  queryId: string, 
  rating: 1 | 5, 
  comment?: string
): Promise<boolean> {
  try {
    await prisma.chatQuery.update({
      where: { id: queryId },
      data: {
        feedbackRating: rating,
        feedbackAt: new Date(),
        feedbackComment: comment,
      },
    });
    
    console.log(`[QueryLearning] Recorded feedback: ${rating === 5 ? '👍' : '👎'} for ${queryId}`);
    return true;
  } catch (error) {
    console.error('[QueryLearning] Failed to record feedback:', error);
    return false;
  }
}

/**
 * Record entity mismatch detection
 */
export async function recordMismatch(
  queryHash: string,
  mismatchDetails: string
): Promise<boolean> {
  try {
    // Find the query by hash and update
    const query = await prisma.chatQuery.findFirst({
      where: { queryHash },
      orderBy: { createdAt: 'desc' },
    });
    
    if (query) {
      await prisma.chatQuery.update({
        where: { id: query.id },
        data: {
          entityMismatch: true,
          mismatchDetails,
        },
      });
      console.log(`[QueryLearning] Recorded mismatch for ${query.id}: ${mismatchDetails}`);
    } else {
      console.warn(`[QueryLearning] Could not find query with hash ${queryHash} to record mismatch`);
    }
    
    return true;
  } catch (error) {
    console.error('[QueryLearning] Failed to record mismatch:', error);
    return false;
  }
}

// ============================================================================
// Mismatch Detection (works without migration)
// ============================================================================

/**
 * Common entity patterns for extraction
 */
const ENTITY_PATTERNS = {
  // NBA Teams
  nbaTeams: /\b(lakers|warriors|celtics|heat|bucks|nets|knicks|nuggets|mavericks|mavs|76ers|sixers|suns|clippers|bulls|raptors|hawks|cavaliers|cavs|grizzlies|timberwolves|wolves|thunder|spurs|rockets|magic|pelicans|kings|pacers|hornets|pistons|wizards|jazz|blazers|trailblazers)\b/gi,
  
  // Soccer Teams
  soccerTeams: /\b(arsenal|chelsea|liverpool|manchester (city|united)|man (city|utd|united)|tottenham|spurs|newcastle|brighton|aston villa|west ham|barcelona|barca|real madrid|atletico|bayern|dortmund|juventus|juve|inter|milan|psg|leicester)\b/gi,
  
  // NFL Teams
  nflTeams: /\b(chiefs|eagles|bills|cowboys|49ers|niners|ravens|bengals|dolphins|lions|packers|vikings|chargers|seahawks|steelers|patriots|saints|buccaneers|bucs|cardinals|falcons|bears|browns|broncos|colts|jaguars|giants|jets|raiders|rams|texans|titans|commanders|panthers)\b/gi,
  
  // Players (common mentions)
  players: /\b(lebron|curry|steph|giannis|jokic|joker|luka|doncic|tatum|embiid|durant|kd|haaland|salah|mbappe|messi|ronaldo|mahomes|burrow|allen|mcdavid|ovechkin|crosby)\b/gi,
};

/**
 * Extract entities from text
 */
function extractEntities(text: string): string[] {
  const entities: string[] = [];
  const lower = text.toLowerCase();
  
  for (const [, pattern] of Object.entries(ENTITY_PATTERNS)) {
    const matches = lower.match(pattern);
    if (matches) {
      entities.push(...matches.map(m => m.toLowerCase()));
    }
  }
  
  // Dedupe using Array.filter
  return entities.filter((v, i, a) => a.indexOf(v) === i);
}

/**
 * Check if response matches query entities
 * Returns mismatch details if entities don't align
 */
export function detectMismatch(query: string, response: string): MismatchCheck {
  const queryEntities = extractEntities(query);
  const responseEntities = extractEntities(response);
  
  if (queryEntities.length === 0) {
    // No entities in query, can't detect mismatch
    return { hasMismatch: false, queryEntities: [], responseEntities };
  }
  
  // Check if ANY query entity appears in response
  const matchedEntities = queryEntities.filter(qe => 
    responseEntities.some(re => re.includes(qe) || qe.includes(re))
  );
  
  if (matchedEntities.length === 0 && responseEntities.length > 0) {
    // Query mentioned X but response talks about Y
    return {
      hasMismatch: true,
      details: `Query mentioned [${queryEntities.join(', ')}] but response was about [${responseEntities.join(', ')}]`,
      queryEntities,
      responseEntities,
    };
  }
  
  return { hasMismatch: false, queryEntities, responseEntities };
}

// ============================================================================
// Learning & Insights (now uses new schema fields)
// ============================================================================

/**
 * Get overall query stats using new schema fields
 */
export async function getQueryStats(): Promise<QueryStats> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const [
    total,
    last24h,
    last7d,
    avgConfidenceResult,
    feedbackPositive,
    feedbackNegative,
    mismatchCount,
    llmFallbackCount,
    cacheHitCount,
    topCategoriesRaw,
    recentQueriesRaw,
  ] = await Promise.all([
    prisma.chatQuery.count(),
    prisma.chatQuery.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.chatQuery.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.chatQuery.aggregate({
      _avg: { intentConfidence: true },
      where: { intentConfidence: { not: null } },
    }),
    prisma.chatQuery.count({ where: { feedbackRating: 5 } }),
    prisma.chatQuery.count({ where: { feedbackRating: 1 } }),
    prisma.chatQuery.count({ where: { entityMismatch: true } }),
    prisma.chatQuery.count({ where: { wasLLMClassified: true } }),
    prisma.chatQuery.count({ where: { cacheHit: true } }),
    prisma.chatQuery.groupBy({
      by: ['category'],
      where: { category: { not: null } },
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    }),
    prisma.chatQuery.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { query: true, category: true, createdAt: true },
    }),
  ]);
  
  return {
    totalQueries: total,
    last24h,
    last7d,
    avgConfidence: avgConfidenceResult._avg?.intentConfidence ?? 0,
    feedbackPositive,
    feedbackNegative,
    mismatchCount,
    llmFallbackRate: total > 0 ? llmFallbackCount / total : 0,
    cacheHitRate: total > 0 ? cacheHitCount / total : 0,
    topCategories: topCategoriesRaw.map(r => ({ 
      category: r.category ?? 'unknown', 
      count: r._count ?? 0
    })),
    recentQueries: recentQueriesRaw,
  };
}

/**
 * Get queries needing attention (low confidence, mismatches, negative feedback)
 */
export async function getQueriesNeedingAttention(limit: number = 50): Promise<any[]> {
  const results = await prisma.chatQuery.findMany({
    where: {
      OR: [
        { feedbackRating: 1 },  // Thumbs down
        { entityMismatch: true },  // Mismatch detected
        { wasLLMClassified: true, intentConfidence: { lt: 0.7 } },  // Low confidence LLM
        { responseLength: { lt: 50 } },  // Very short responses
      ],
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      query: true,
      category: true,
      detectedIntent: true,
      intentConfidence: true,
      feedbackRating: true,
      entityMismatch: true,
      mismatchDetails: true,
      wasLLMClassified: true,
      responseLength: true,
      createdAt: true,
    },
  });
  
  return results;
}

/**
 * Generate learning insights from query patterns
 */
export async function generateLearningInsights(): Promise<LearningInsight[]> {
  const insights: LearningInsight[] = [];
  
  // 1. Find queries where LLM was needed (pattern gap)
  const llmFallbacks = await prisma.chatQuery.groupBy({
    by: ['detectedIntent'],
    where: {
      wasLLMClassified: true,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    _count: { _all: true },
  });
  
  for (const fallback of llmFallbacks) {
    const count = fallback._count._all;
    if (count >= 3) {
      const example = await prisma.chatQuery.findFirst({
        where: { wasLLMClassified: true, detectedIntent: fallback.detectedIntent },
        orderBy: { createdAt: 'desc' },
      });
      
      insights.push({
        type: 'PATTERN_GAP',
        description: `${count} queries for "${fallback.detectedIntent || 'unknown'}" needed LLM fallback - missing patterns`,
        queryExample: example?.query || 'Unknown',
        occurrences: count,
        priority: count >= 10 ? 'HIGH' : count >= 5 ? 'MEDIUM' : 'LOW',
      });
    }
  }
  
  // 2. Find entity mismatches
  const mismatchCount = await prisma.chatQuery.count({
    where: {
      entityMismatch: true,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });
  
  if (mismatchCount >= 3) {
    const example = await prisma.chatQuery.findFirst({
      where: { entityMismatch: true },
      orderBy: { createdAt: 'desc' },
    });
    
    insights.push({
      type: 'ENTITY_MISS',
      description: `${mismatchCount} queries had entity mismatches (asked about X, answered about Y)`,
      queryExample: example?.query || 'Unknown',
      occurrences: mismatchCount,
      priority: 'HIGH',
    });
  }
  
  // 3. Find low-confidence classifications
  const lowConfidence = await prisma.chatQuery.count({
    where: {
      intentConfidence: { lt: 0.6 },
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });
  
  if (lowConfidence >= 5) {
    const example = await prisma.chatQuery.findFirst({
      where: { intentConfidence: { lt: 0.6 } },
      orderBy: { createdAt: 'desc' },
    });
    
    insights.push({
      type: 'LOW_CONFIDENCE',
      description: `${lowConfidence} queries classified with low confidence (<60%)`,
      queryExample: example?.query || 'Unknown',
      occurrences: lowConfidence,
      priority: lowConfidence >= 20 ? 'HIGH' : 'MEDIUM',
    });
  }
  
  // 4. Find negative feedback patterns
  const negativeFeedback = await prisma.chatQuery.count({
    where: {
      feedbackRating: 1,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });
  
  if (negativeFeedback >= 3) {
    const example = await prisma.chatQuery.findFirst({
      where: { feedbackRating: 1 },
      orderBy: { createdAt: 'desc' },
    });
    
    insights.push({
      type: 'PATTERN_GAP',
      description: `${negativeFeedback} queries received negative feedback - review and improve`,
      queryExample: example?.query || 'Unknown',
      occurrences: negativeFeedback,
      priority: 'HIGH',
    });
  }
  
  return insights.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Suggest regex patterns based on queries that needed LLM
 */
export async function suggestPatterns(intent: QueryIntent): Promise<string[]> {
  // Find queries that were classified as this intent via LLM (pattern missed them)
  const missedQueries = await prisma.chatQuery.findMany({
    where: {
      detectedIntent: intent,
      wasLLMClassified: true,
    },
    take: 50,
    select: { query: true },
  });
  
  if (missedQueries.length === 0) return [];
  
  // Simple pattern extraction: find common words
  const wordFrequency: Record<string, number> = {};
  
  for (const { query } of missedQueries) {
    const words = query.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 3) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    }
  }
  
  // Find words appearing in 30%+ of missed queries
  const threshold = missedQueries.length * 0.3;
  const commonWords = Object.entries(wordFrequency)
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  // Generate pattern suggestions
  const suggestions: string[] = [];
  
  if (commonWords.length >= 2) {
    suggestions.push(`/\\b(${commonWords.join('|')})\\b/i`);
  }
  
  for (const word of commonWords) {
    suggestions.push(`/\\b${word}\\b.*\\b(stats|game|match|score|prediction)\\b/i`);
  }
  
  return suggestions;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Simple hash for query deduplication
 */
function hashQuery(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Export for testing
 */
export const _testing = {
  extractEntities,
  hashQuery,
};
