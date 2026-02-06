/**
 * Editorial Picks API
 * 
 * Returns top picks with full analysis data for editorial content.
 * Sorted by model confidence (not edge) for "safest" picks.
 * 
 * CACHING: Picks are cached for the entire day to ensure consistency.
 * The same picks appear all day, regardless of new data arriving.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateMatchSlug } from '@/lib/match-utils';

export const dynamic = 'force-dynamic';

// In-memory cache for daily picks
// Key format: "YYYY-MM-DD" -> cached picks data
interface CachedPicks {
  date: string;
  pickIds: string[]; // Store just IDs, fetch fresh data each time for user-specific content
  generatedAt: Date;
}

let dailyPicksCache: CachedPicks | null = null;

/**
 * Get today's date string in YYYY-MM-DD format (UTC)
 */
function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

interface FullResponse {
  story?: string;
  headlines?: string[];
  viralStats?: string[];
  momentumAndForm?: {
    homeForm?: string;
    awayForm?: string;
    homeTrend?: string;
    awayTrend?: string;
    h2hSummary?: string;
    keyFormFactors?: string[];
    homeMomentumScore?: number;
    awayMomentumScore?: number;
  };
  injuries?: {
    home?: Array<{ player: string; status: string; impact: string }>;
    away?: Array<{ player: string; status: string; impact: string }>;
  };
  contextFactors?: string[];
  universalSignals?: Array<{ label: string; value: string; sentiment: string }>;
  marketIntel?: {
    lineMovement?: string;
    publicMoney?: string;
    sharpAction?: string;
  };
}

/**
 * Calculate data confidence score based on available analysis data.
 * This measures HOW MUCH DATA we have to make this prediction - not win probability.
 * More data = more confident in the analysis quality.
 */
function calculateDataConfidenceScore(fr: FullResponse | null, reasoning: string | null): number {
  let score = 0;
  
  // Form data: +25 points max
  if (fr?.momentumAndForm) {
    const mf = fr.momentumAndForm;
    if (mf.homeForm || mf.awayForm) score += 15; // Have form strings
    if (mf.h2hSummary) score += 5;  // Have H2H data
    if (mf.keyFormFactors?.length) score += 5; // Have form analysis
  }
  
  // Headlines/Story: +20 points max (AI has analyzed)
  if (fr?.headlines?.length) score += 10;
  if (fr?.story) score += 10;
  
  // Injuries: +15 points (critical for accuracy)
  if (fr?.injuries) {
    const hasHomeInjuries = fr.injuries.home?.length;
    const hasAwayInjuries = fr.injuries.away?.length;
    // Having injury data (even if empty array) means we checked
    if (hasHomeInjuries !== undefined || hasAwayInjuries !== undefined) score += 15;
  }
  
  // Viral stats: +10 points (extra research)
  if (fr?.viralStats?.length) score += 10;
  
  // Context factors: +10 points (situational analysis)
  if (fr?.contextFactors?.length) score += 10;
  
  // Market intel: +10 points (sharp money, line moves)
  if (fr?.marketIntel) {
    if (fr.marketIntel.lineMovement || fr.marketIntel.sharpAction) score += 10;
  }
  
  // Universal signals: +10 points
  if (fr?.universalSignals?.length) score += 10;
  
  // Reasoning exists: +10 bonus (always have some analysis)
  if (reasoning && reasoning.length > 50) score += 10;
  
  // Cap at 100
  return Math.min(100, score);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isPro = session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM';
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '3'), 12);
    const forceRefresh = searchParams.get('refresh') === 'true'; // Admin override
    
    // Get today's date key for caching
    const todayKey = getTodayKey();
    const now = new Date();
    
    // Check if we have cached picks for today
    const hasCachedPicks = dailyPicksCache && 
                           dailyPicksCache.date === todayKey && 
                           dailyPicksCache.pickIds.length > 0 &&
                           !forceRefresh;
    
    let predictionIds: string[];
    
    if (hasCachedPicks) {
      // Use cached pick IDs - same picks all day!
      predictionIds = dailyPicksCache!.pickIds;
      console.log(`[Editorial Picks] Using cached picks from ${dailyPicksCache!.generatedAt.toISOString()} (${predictionIds.length} picks)`);
    } else {
      // Generate new picks for today
      console.log(`[Editorial Picks] Generating fresh picks for ${todayKey}`);
      
      const futureLimit = new Date(now);
      futureLimit.setUTCDate(futureLimit.getUTCDate() + 3);
      futureLimit.setUTCHours(23, 59, 59, 999);

      // Build where clause for selecting daily picks
      const whereClause = {
        kickoff: {
          gte: now,
          lte: futureLimit,
        },
        outcome: 'PENDING' as const,
        edgeValue: { gte: 2 },
        modelProbability: { gte: 35 },
        NOT: {
          fullResponse: { equals: Prisma.DbNull },
        },
      };

      // Get top picks sorted by model probability then edge
      const freshPicks = await prisma.prediction.findMany({
        where: whereClause,
        orderBy: [
          { modelProbability: 'desc' },
          { edgeValue: 'desc' },
        ],
        take: 12, // Cache up to 12 picks
        select: { id: true },
      });

      predictionIds = freshPicks.map(p => p.id);

      // Cache the pick IDs for the rest of the day
      dailyPicksCache = {
        date: todayKey,
        pickIds: predictionIds,
        generatedAt: now,
      };
      
      console.log(`[Editorial Picks] Cached ${predictionIds.length} picks for ${todayKey}`);
    }

    // Now fetch full data for the cached pick IDs
    // Filter out any picks that have already started (kickoff < now)
    const predictions = await prisma.prediction.findMany({
      where: {
        id: { in: predictionIds.slice(0, limit) },
        kickoff: { gt: now }, // Only include picks that haven't started yet
      },
      select: {
        id: true,
        matchId: true,
        matchName: true,
        sport: true,
        league: true,
        kickoff: true,
        edgeValue: true,
        edgeBucket: true,
        modelProbability: true,
        marketOddsAtPrediction: true,
        odds: true,
        valueBetOdds: true,
        selection: true,
        valueBetSide: true,
        homeWin: true,
        draw: true,
        awayWin: true,
        predictedScore: true,
        headline: true,
        reasoning: true,
        fullResponse: true,
      },
    });

    // Sort by the original cached order
    const idOrder = new Map(predictionIds.map((id, idx) => [id, idx]));
    predictions.sort((a, b) => (idOrder.get(a.id) ?? 999) - (idOrder.get(b.id) ?? 999));

    // Get total count (how many cached picks are still valid)
    const validPickIds = predictionIds.filter(id => predictions.some(p => p.id === id));
    const totalCount = validPickIds.length;

    // Transform to editorial format
    const picks = predictions.map((pred, index) => {
      const [homeTeam, awayTeam] = pred.matchName.split(' vs ');
      const fr = pred.fullResponse as FullResponse | null;
      
      // Calculate data confidence (how much data we have for this prediction)
      const dataConfidence = calculateDataConfidenceScore(fr, pred.reasoning);
      
      // Normalize headline - can be string or object with {text, icon, viral, favors}
      const rawHeadline = pred.headline as unknown;
      let headlineText: string | null = null;
      if (typeof rawHeadline === 'string') {
        headlineText = rawHeadline;
      } else if (rawHeadline && typeof rawHeadline === 'object' && 'text' in rawHeadline) {
        headlineText = String((rawHeadline as { text?: unknown }).text || '');
      }

      // Base pick info
      const homeTeamTrimmed = homeTeam?.trim() || 'TBD';
      const awayTeamTrimmed = awayTeam?.trim() || 'TBD';
      const slug = generateMatchSlug(homeTeamTrimmed, awayTeamTrimmed, pred.sport, pred.kickoff.toISOString());
      
      const basePick = {
        rank: index + 1,
        id: pred.id,
        matchId: pred.matchId,
        slug, // SEO-friendly URL slug
        homeTeam: homeTeamTrimmed,
        awayTeam: awayTeamTrimmed,
        sport: pred.sport,
        league: pred.league,
        kickoff: pred.kickoff.toISOString(),
        confidence: dataConfidence, // Data quality score (0-100)
        modelProbability: pred.modelProbability, // Win probability for selected side
        edgeValue: pred.edgeValue,
        edgeBucket: pred.edgeBucket,
      };

      // Get first headline from fullResponse (can also be object or string)
      const frHeadlineRaw = fr?.headlines?.[0];
      let frHeadline: string | null = null;
      if (typeof frHeadlineRaw === 'string') {
        frHeadline = frHeadlineRaw;
      } else if (frHeadlineRaw && typeof frHeadlineRaw === 'object' && 'text' in frHeadlineRaw) {
        frHeadline = String((frHeadlineRaw as { text?: unknown }).text || '');
      }
      const displayHeadline = frHeadline || headlineText || 'AI has identified an opportunity in this match';

      // Determine selection (pick) - fallback chain
      const pickSelection = pred.selection || pred.valueBetSide || null;
      
      // Determine odds - fallback chain  
      const pickOdds = pred.marketOddsAtPrediction || pred.odds || pred.valueBetOdds || null;

      // Free users get teaser with pick/odds visible but detailed analysis locked
      if (!isPro) {
        return {
          ...basePick,
          // Show pick and odds to all - this is the "hook" to upgrade
          selection: pickSelection,
          odds: pickOdds,
          // Show probabilities to all users (teaser value)
          probabilities: {
            home: pred.homeWin,
            draw: pred.draw,
            away: pred.awayWin,
          },
          // Teaser content
          headline: displayHeadline,
          locked: true,
          // No detailed analysis - this is the premium content
          analysis: null,
        };
      }

      // Normalize headlines array - each item can be string or object with {text}
      const normalizedHeadlines: string[] = [];
      if (fr?.headlines && Array.isArray(fr.headlines)) {
        for (const h of fr.headlines) {
          if (typeof h === 'string') {
            normalizedHeadlines.push(h);
          } else if (h && typeof h === 'object' && 'text' in h) {
            normalizedHeadlines.push(String((h as { text?: unknown }).text || ''));
          }
        }
      }

      // Normalize story - can be string or object with {narrative, ...}
      let normalizedStory: string | null = null;
      const rawStory = fr?.story;
      if (typeof rawStory === 'string') {
        normalizedStory = rawStory;
      } else if (rawStory && typeof rawStory === 'object') {
        if ('narrative' in rawStory) {
          normalizedStory = String((rawStory as { narrative?: unknown }).narrative || '');
        } else if ('text' in rawStory) {
          normalizedStory = String((rawStory as { text?: unknown }).text || '');
        }
      }
      if (!normalizedStory) {
        normalizedStory = pred.reasoning || null;
      }

      // Normalize viralStats - each item can be string or object
      const normalizedViralStats: string[] = [];
      if (fr?.viralStats && Array.isArray(fr.viralStats)) {
        for (const stat of fr.viralStats) {
          if (typeof stat === 'string') {
            normalizedViralStats.push(stat);
          } else if (stat && typeof stat === 'object' && 'text' in stat) {
            normalizedViralStats.push(String((stat as { text?: unknown }).text || ''));
          }
        }
      }

      // Normalize contextFactors - each item can be string or object
      const normalizedContextFactors: string[] = [];
      if (fr?.contextFactors && Array.isArray(fr.contextFactors)) {
        for (const factor of fr.contextFactors) {
          if (typeof factor === 'string') {
            normalizedContextFactors.push(factor);
          } else if (factor && typeof factor === 'object' && 'text' in factor) {
            normalizedContextFactors.push(String((factor as { text?: unknown }).text || ''));
          }
        }
      }

      // Helper to normalize any value to string
      const normalizeToString = (val: unknown): string | null => {
        if (typeof val === 'string') return val;
        if (val && typeof val === 'object') {
          if ('text' in val) return String((val as { text?: unknown }).text || '');
          if ('narrative' in val) return String((val as { narrative?: unknown }).narrative || '');
        }
        return null;
      };

      // Format form array (matches) into W-L-D string like "W W L W L"
      const formatFormArray = (form: unknown): string | null => {
        if (typeof form === 'string') return form;
        if (Array.isArray(form)) {
          const results = form
            .slice(0, 5) // Last 5 matches
            .map((match: { result?: string }) => match?.result || '?')
            .join(' ');
          return results || null;
        }
        return null;
      };

      // Format H2H summary into readable string
      const formatH2H = (h2h: unknown): string | null => {
        if (typeof h2h === 'string') return h2h;
        if (h2h && typeof h2h === 'object') {
          const data = h2h as { homeWins?: number; awayWins?: number; draws?: number; totalMatches?: number };
          if ('homeWins' in data || 'awayWins' in data) {
            const parts = [];
            if (data.homeWins) parts.push(`${data.homeWins} home wins`);
            if (data.awayWins) parts.push(`${data.awayWins} away wins`);
            if (data.draws) parts.push(`${data.draws} draws`);
            return parts.join(', ') + ` in last ${data.totalMatches || '?'} meetings`;
          }
        }
        return null;
      };

      // Format trend string
      const formatTrend = (trend: unknown): string | null => {
        if (typeof trend === 'string') return trend;
        if (trend && typeof trend === 'object' && 'text' in trend) {
          return String((trend as { text?: unknown }).text || '');
        }
        return null;
      };

      // Normalize form key factors
      const normalizedKeyFactors: string[] = [];
      const rawKeyFactors = fr?.momentumAndForm?.keyFormFactors;
      if (rawKeyFactors && Array.isArray(rawKeyFactors)) {
        for (const kf of rawKeyFactors) {
          const normalized = normalizeToString(kf);
          if (normalized) normalizedKeyFactors.push(normalized);
        }
      }

      // Pro users get full editorial content
      return {
        ...basePick,
        selection: pickSelection,
        odds: pickOdds,
        probabilities: {
          home: pred.homeWin,
          draw: pred.draw,
          away: pred.awayWin,
        },
        predictedScore: pred.predictedScore,
        headline: displayHeadline,
        locked: false,
        // Full editorial analysis
        analysis: {
          story: normalizedStory,
          headlines: normalizedHeadlines,
          viralStats: normalizedViralStats,
          form: {
            homeForm: formatFormArray(fr?.momentumAndForm?.homeForm),
            awayForm: formatFormArray(fr?.momentumAndForm?.awayForm),
            homeTrend: formatTrend(fr?.momentumAndForm?.homeTrend),
            awayTrend: formatTrend(fr?.momentumAndForm?.awayTrend),
            h2hSummary: formatH2H(fr?.momentumAndForm?.h2hSummary),
            keyFactors: normalizedKeyFactors,
          },
          injuries: fr?.injuries,
          contextFactors: normalizedContextFactors,
          signals: fr?.universalSignals || [],
          marketIntel: fr?.marketIntel,
        },
      };
    });

    // Format date for title
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return NextResponse.json({
      success: true,
      date: dateStr,
      picks,
      isPro,
      meta: {
        generatedAt: now.toISOString(),
        total: totalCount,
        showing: picks.length,
        moreAvailable: totalCount > picks.length,
      },
    });
  } catch (error) {
    console.error('[Editorial Picks API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch picks' },
      { status: 500 }
    );
  }
}
