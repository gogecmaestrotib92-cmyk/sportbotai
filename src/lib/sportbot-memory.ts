/**
 * SportBot Memory System
 * 
 * Tracks chat queries, trending topics, and agent posts.
 * Enables learning from patterns and outcome validation.
 * 
 * Features:
 * - Track frequent questions
 * - Detect trending topics
 * - Provide context for agent "memory"
 * - Learn from prediction outcomes
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

interface QueryMetadata {
  query: string;
  category?: string;
  brainMode?: string;
  sport?: string;
  team?: string;
  league?: string;
  usedRealTimeSearch?: boolean;
  responseLength?: number;
  hadCitations?: boolean;
}

interface AgentPostData {
  content: string;
  category: string;
  homeTeam?: string;
  awayTeam?: string;
  matchRef?: string;
  league?: string;
  sport?: string;
  narrativeAngle?: string;
  publicMismatch?: string;
  clarityLevel?: number;
  confidence?: number;
  severity?: number;
  realTimeData?: boolean;
  citations?: string[];
}

// ============================================
// QUERY TRACKING
// ============================================

/**
 * Generate a hash for query deduplication
 */
function hashQuery(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
  return crypto.createHash('md5').update(normalized).digest('hex').slice(0, 16);
}

/**
 * Extract team name from query (simple extraction)
 */
function extractTeam(query: string): string | undefined {
  const teamPatterns = [
    // "for X" patterns
    /(?:for|about|on)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    // Team names with FC/United/City etc
    /([A-Z][a-z]+(?:\s+(?:FC|United|City|Rovers|Town|Athletic))?)/,
  ];
  
  for (const pattern of teamPatterns) {
    const match = query.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

/**
 * Extract sport from query
 */
function extractSport(query: string): string | undefined {
  const q = query.toLowerCase();
  if (/nba|basketball|lakers|celtics|warriors/.test(q)) return 'basketball';
  if (/nfl|football|patriots|cowboys|chiefs/.test(q)) return 'american_football';
  if (/premier league|la liga|serie a|bundesliga|soccer|football/.test(q)) return 'soccer';
  if (/nhl|hockey|maple leafs|bruins/.test(q)) return 'hockey';
  if (/mlb|baseball|yankees|dodgers/.test(q)) return 'baseball';
  return undefined;
}

/**
 * Track a chat query for learning
 */
export async function trackQuery(metadata: QueryMetadata): Promise<void> {
  try {
    const queryHash = hashQuery(metadata.query);
    const normalized = metadata.query.toLowerCase().trim();
    const team = metadata.team || extractTeam(metadata.query);
    const sport = metadata.sport || extractSport(metadata.query);
    
    // Check if similar query exists
    const existing = await prisma.chatQuery.findFirst({
      where: { queryHash },
      orderBy: { createdAt: 'desc' },
    });
    
    if (existing) {
      // Update count for similar queries
      await prisma.chatQuery.update({
        where: { id: existing.id },
        data: { similarCount: { increment: 1 } },
      });
    } else {
      // Create new query record
      await prisma.chatQuery.create({
        data: {
          query: metadata.query,
          queryNormalized: normalized,
          queryHash,
          category: metadata.category,
          brainMode: metadata.brainMode,
          sport,
          team,
          league: metadata.league,
          usedRealTimeSearch: metadata.usedRealTimeSearch ?? false,
          responseLength: metadata.responseLength,
          hadCitations: metadata.hadCitations ?? false,
        },
      });
    }
    
    // Update trending topics
    await updateTrendingTopic(normalized, metadata.category, sport);
    
  } catch (error) {
    // Don't fail the main request if tracking fails
    console.error('[Memory] Failed to track query:', error);
  }
}

/**
 * Update or create trending topic
 */
async function updateTrendingTopic(
  query: string, 
  category?: string, 
  sport?: string
): Promise<void> {
  // Extract topic (simplified - could be smarter)
  const topic = query.slice(0, 100).toLowerCase();
  
  try {
    await prisma.trendingTopic.upsert({
      where: { topic },
      create: {
        topic,
        category,
        sport,
        queryCount: 1,
        last24hCount: 1,
      },
      update: {
        queryCount: { increment: 1 },
        last24hCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[Memory] Failed to update trending:', error);
  }
}

// ============================================
// TRENDING & POPULAR QUERIES
// ============================================

/**
 * Get most frequent query categories
 */
export async function getTopCategories(limit = 10): Promise<Array<{ category: string; count: number }>> {
  try {
    const results = await prisma.chatQuery.groupBy({
      by: ['category'],
      where: { category: { not: null } },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: limit,
    });
    
    return results.map(r => ({
      category: r.category!,
      count: r._count.category,
    }));
  } catch (error) {
    console.error('[Memory] Failed to get top categories:', error);
    return [];
  }
}

/**
 * Get most popular teams/topics
 */
export async function getTopTeams(limit = 10): Promise<Array<{ team: string; count: number }>> {
  try {
    const results = await prisma.chatQuery.groupBy({
      by: ['team'],
      where: { team: { not: null } },
      _count: { team: true },
      orderBy: { _count: { team: 'desc' } },
      take: limit,
    });
    
    return results.map(r => ({
      team: r.team!,
      count: r._count.team,
    }));
  } catch (error) {
    console.error('[Memory] Failed to get top teams:', error);
    return [];
  }
}

/**
 * Get trending topics (high recent activity)
 */
export async function getTrendingTopics(limit = 10): Promise<Array<{
  topic: string;
  category: string | null;
  queryCount: number;
  isSpike: boolean;
}>> {
  try {
    const topics = await prisma.trendingTopic.findMany({
      orderBy: [
        { last24hCount: 'desc' },
        { queryCount: 'desc' },
      ],
      take: limit,
    });
    
    return topics.map(t => ({
      topic: t.topic,
      category: t.category,
      queryCount: t.queryCount,
      isSpike: t.isSpike,
    }));
  } catch (error) {
    console.error('[Memory] Failed to get trending:', error);
    return [];
  }
}

/**
 * Get frequent questions by category
 */
export async function getFrequentQuestions(
  category?: string,
  limit = 20
): Promise<Array<{ query: string; count: number; category: string | null }>> {
  try {
    const where = category ? { category } : {};
    
    const queries = await prisma.chatQuery.findMany({
      where,
      orderBy: { similarCount: 'desc' },
      take: limit,
      select: {
        query: true,
        similarCount: true,
        category: true,
      },
    });
    
    return queries.map(q => ({
      query: q.query,
      count: q.similarCount,
      category: q.category,
    }));
  } catch (error) {
    console.error('[Memory] Failed to get frequent questions:', error);
    return [];
  }
}

// ============================================
// AGENT POST MEMORY
// ============================================

/**
 * Save an agent post for memory/context
 */
export async function saveAgentPost(data: AgentPostData): Promise<string | null> {
  try {
    const post = await prisma.agentPost.create({
      data: {
        content: data.content,
        category: data.category,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        matchRef: data.matchRef,
        league: data.league,
        sport: data.sport,
        narrativeAngle: data.narrativeAngle,
        publicMismatch: data.publicMismatch,
        clarityLevel: data.clarityLevel,
        confidence: data.confidence,
        severity: data.severity,
        realTimeData: data.realTimeData ?? false,
        citations: data.citations ?? [],
      },
    });
    
    return post.id;
  } catch (error) {
    console.error('[Memory] Failed to save agent post:', error);
    return null;
  }
}

/**
 * Get recent posts for a team (for context/memory)
 */
export async function getRecentTeamPosts(
  team: string,
  limit = 5
): Promise<Array<{ content: string; category: string; createdAt: Date }>> {
  try {
    const posts = await prisma.agentPost.findMany({
      where: {
        OR: [
          { homeTeam: { contains: team, mode: 'insensitive' } },
          { awayTeam: { contains: team, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        content: true,
        category: true,
        createdAt: true,
      },
    });
    
    return posts;
  } catch (error) {
    console.error('[Memory] Failed to get team posts:', error);
    return [];
  }
}

/**
 * Build context string from recent posts (for LLM memory)
 */
export async function buildRecentContext(team?: string, matchRef?: string): Promise<string | undefined> {
  try {
    let posts;
    
    if (team) {
      posts = await getRecentTeamPosts(team, 3);
    } else if (matchRef) {
      posts = await prisma.agentPost.findMany({
        where: { matchRef: { contains: matchRef, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { content: true, category: true, createdAt: true },
      });
    }
    
    if (!posts || posts.length === 0) return undefined;
    
    const summaries = posts.map(p => 
      `- [${p.category}] ${p.content.slice(0, 100)}...`
    );
    
    return `Recent posts about this topic:\n${summaries.join('\n')}`;
  } catch (error) {
    console.error('[Memory] Failed to build context:', error);
    return undefined;
  }
}

// ============================================
// OUTCOME LEARNING
// ============================================

/**
 * Record a prediction for later validation
 */
export async function recordPrediction(data: {
  matchRef: string;
  matchDate: Date;
  league?: string;
  narrativeAngle?: string;
  predictedScenario?: string;
  confidenceLevel?: number;
  sport?: string;
}): Promise<string | null> {
  try {
    const prediction = await prisma.prediction.create({
      data: {
        matchId: data.matchRef.replace(/\s+/g, '_').toLowerCase(),
        matchName: data.matchRef,
        sport: data.sport || 'soccer',
        league: data.league || 'Unknown',
        kickoff: data.matchDate,
        type: 'MATCH_RESULT',
        prediction: data.predictedScenario || '',
        reasoning: data.narrativeAngle || '',
        conviction: data.confidenceLevel || 5,
        source: 'AGENT_POST',
        outcome: 'PENDING',
      },
    });
    
    return prediction.id;
  } catch (error) {
    console.error('[Memory] Failed to record prediction:', error);
    return null;
  }
}

/**
 * Update prediction with actual outcome
 */
export async function updatePredictionOutcome(
  id: string,
  data: {
    actualResult: string;
    actualScore?: string;
    keyFactor?: string;
    wasAccurate: boolean;
    learningNote?: string;
  }
): Promise<boolean> {
  try {
    await prisma.prediction.update({
      where: { id },
      data: {
        actualResult: data.actualResult,
        actualScore: data.actualScore,
        outcome: data.wasAccurate ? 'HIT' : 'MISS',
        validatedAt: new Date(),
      },
    });
    
    return true;
  } catch (error) {
    console.error('[Memory] Failed to update outcome:', error);
    return false;
  }
}

/**
 * Get accuracy stats for learning
 */
export async function getAccuracyStats(): Promise<{
  total: number;
  accurate: number;
  inaccurate: number;
  pending: number;
  accuracyRate: number;
}> {
  try {
    const [total, accurate, inaccurate] = await Promise.all([
      prisma.prediction.count(),
      prisma.prediction.count({ where: { outcome: 'HIT' } }),
      prisma.prediction.count({ where: { outcome: 'MISS' } }),
    ]);
    
    const pending = total - accurate - inaccurate;
    const accuracyRate = (accurate + inaccurate) > 0 
      ? (accurate / (accurate + inaccurate)) * 100 
      : 0;
    
    return { total, accurate, inaccurate, pending, accuracyRate };
  } catch (error) {
    console.error('[Memory] Failed to get accuracy stats:', error);
    return { total: 0, accurate: 0, inaccurate: 0, pending: 0, accuracyRate: 0 };
  }
}

// ============================================
// ADMIN / STATS
// ============================================

/**
 * Get overall memory stats
 */
export async function getMemoryStats(): Promise<{
  totalQueries: number;
  uniqueQueries: number;
  topCategory: string | null;
  topTeam: string | null;
  agentPosts: number;
  predictions: number;
}> {
  try {
    const [totalQueries, agentPosts, predictions, topCategories, topTeams] = await Promise.all([
      prisma.chatQuery.count(),
      prisma.agentPost.count(),
      prisma.prediction.count(),
      getTopCategories(1),
      getTopTeams(1),
    ]);
    
    // Estimate unique queries (queries with similarCount = 1)
    const uniqueQueries = await prisma.chatQuery.count({
      where: { similarCount: 1 },
    });
    
    return {
      totalQueries,
      uniqueQueries,
      topCategory: topCategories[0]?.category ?? null,
      topTeam: topTeams[0]?.team ?? null,
      agentPosts,
      predictions,
    };
  } catch (error) {
    console.error('[Memory] Failed to get stats:', error);
    return {
      totalQueries: 0,
      uniqueQueries: 0,
      topCategory: null,
      topTeam: null,
      agentPosts: 0,
      predictions: 0,
    };
  }
}

/**
 * Clean up old data (run periodically)
 */
export async function cleanupOldData(daysToKeep = 90): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  try {
    // Don't delete high-frequency queries (they're valuable)
    await prisma.chatQuery.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        similarCount: { lt: 5 }, // Keep popular queries
      },
    });
    
    console.log('[Memory] Cleanup completed');
  } catch (error) {
    console.error('[Memory] Cleanup failed:', error);
  }
}

// ============================================
// CALL TRACKING (AIXBT-style "I told you so")
// ============================================

export interface TrackedCall {
  id: string;
  callType: 'contrarian' | 'conviction' | 'upset' | 'trend';
  matchRef: string;
  claim: string;
  conviction: number;
  wasCorrect?: boolean;
  timestamp: Date;
}

/**
 * Track a bold call for later reference
 */
export async function trackBoldCall(data: {
  matchRef: string;
  claim: string;
  callType: 'contrarian' | 'conviction' | 'upset' | 'trend';
  conviction: number;
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
}): Promise<string | null> {
  try {
    // Store as agent post with special category
    const post = await prisma.agentPost.create({
      data: {
        content: data.claim,
        category: `TRACKED_CALL_${data.callType.toUpperCase()}`,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        matchRef: data.matchRef,
        league: data.league,
        confidence: data.conviction,
        narrativeAngle: data.callType,
      },
    });
    return post.id;
  } catch (error) {
    console.error('[Memory] Failed to track call:', error);
    return null;
  }
}

/**
 * Get recent correct calls for bragging rights
 */
export async function getCorrectCalls(limit = 5): Promise<Array<{
  matchRef: string;
  claim: string;
  conviction: number;
  timestamp: Date;
}>> {
  try {
    const outcomes = await prisma.prediction.findMany({
      where: { outcome: 'HIT' },
      orderBy: { kickoff: 'desc' },
      take: limit,
      select: {
        matchName: true,
        prediction: true,
        conviction: true,
        kickoff: true,
      },
    });
    
    return outcomes.map(o => ({
      matchRef: o.matchName,
      claim: o.prediction || '',
      conviction: o.conviction || 3,
      timestamp: o.kickoff,
    }));
  } catch (error) {
    console.error('[Memory] Failed to get correct calls:', error);
    return [];
  }
}

/**
 * Build "receipts" string for LLM context (AIXBT-style)
 */
export async function buildReceiptsContext(): Promise<string | undefined> {
  try {
    const stats = await getAccuracyStats();
    const recentCorrect = await getCorrectCalls(3);
    
    if (stats.total < 5) return undefined;
    
    let context = `[SPORTBOT TRACK RECORD]\n`;
    context += `Accuracy: ${stats.accuracyRate.toFixed(1)}% (${stats.accurate}/${stats.accurate + stats.inaccurate})\n`;
    
    if (recentCorrect.length > 0) {
      context += `\nRecent correct calls:\n`;
      recentCorrect.forEach(call => {
        const ago = Math.floor((Date.now() - call.timestamp.getTime()) / (1000 * 60 * 60 * 24));
        context += `- "${call.claim}" (${ago}d ago, ${call.matchRef})\n`;
      });
    }
    
    return context;
  } catch (error) {
    console.error('[Memory] Failed to build receipts:', error);
    return undefined;
  }
}

/**
 * Get teams where SportBot has been historically accurate
 */
export async function getStrongTeamReads(limit = 5): Promise<Array<{
  team: string;
  correct: number;
  total: number;
  rate: number;
}>> {
  try {
    // Get all outcomes with team references
    const outcomes = await prisma.prediction.findMany({
      where: { outcome: { in: ['HIT', 'MISS'] } },
      select: {
        matchName: true,
        outcome: true,
      },
    });
    
    // Count by team (extract from matchName "Team A vs Team B")
    const teamStats: Record<string, { correct: number; total: number }> = {};
    
    outcomes.forEach(o => {
      const teams = o.matchName.split(' vs ').map(t => t.trim());
      teams.forEach(team => {
        if (!teamStats[team]) {
          teamStats[team] = { correct: 0, total: 0 };
        }
        teamStats[team].total += 1;
        if (o.outcome === 'HIT') teamStats[team].correct += 1;
      });
    });
    
    // Convert to array and sort by accuracy
    const results = Object.entries(teamStats)
      .filter(([, stats]) => stats.total >= 3) // Min 3 predictions
      .map(([team, stats]) => ({
        team,
        correct: stats.correct,
        total: stats.total,
        rate: (stats.correct / stats.total) * 100,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, limit);
    
    return results;
  } catch (error) {
    console.error('[Memory] Failed to get strong team reads:', error);
    return [];
  }
}

