/**
 * Editorial Picks API
 * 
 * Returns top 3 picks with full analysis data for editorial content.
 * Sorted by model confidence (not edge) for "safest" picks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isPro = session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM';
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '3'), 12);
    
    // Get upcoming date range (next 3 days to catch weekend matches)
    const now = new Date();
    const futureLimit = new Date(now);
    futureLimit.setUTCDate(futureLimit.getUTCDate() + 3);
    futureLimit.setUTCHours(23, 59, 59, 999);

    // Build where clause
    // DAILY PICKS = Our MOST CONFIDENT predictions (highest model probability)
    // These are the picks we're proud to show publicly and track record for
    const whereClause = {
      kickoff: {
        gte: now,
        lte: futureLimit,
      },
      outcome: 'PENDING' as const,
      modelProbability: {
        gte: 60, // High confidence only (60%+ model probability)
      },
      edgeValue: {
        gte: 3, // Must have meaningful edge (market is wrong)
      },
    };

    // Get total count for "X more picks" display
    const totalCount = await prisma.prediction.count({ where: whereClause });

    // Sort by MODEL CONFIDENCE first (our most confident picks)
    // These are the picks we can be proud of and track publicly
    const predictions = await prisma.prediction.findMany({
      where: whereClause,
      orderBy: [
        { modelProbability: 'desc' }, // Primary: highest confidence
        { edgeValue: 'desc' },        // Secondary: best edge
      ],
      take: limit,
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

    // Transform to editorial format
    const picks = predictions.map((pred, index) => {
      const [homeTeam, awayTeam] = pred.matchName.split(' vs ');
      const fr = pred.fullResponse as FullResponse | null;
      
      // Normalize headline - can be string or object with {text, icon, viral, favors}
      const rawHeadline = pred.headline as unknown;
      let headlineText: string | null = null;
      if (typeof rawHeadline === 'string') {
        headlineText = rawHeadline;
      } else if (rawHeadline && typeof rawHeadline === 'object' && 'text' in rawHeadline) {
        headlineText = String((rawHeadline as { text?: unknown }).text || '');
      }

      // Base pick info
      const basePick = {
        rank: index + 1,
        id: pred.id,
        matchId: pred.matchId,
        homeTeam: homeTeam?.trim() || 'TBD',
        awayTeam: awayTeam?.trim() || 'TBD',
        sport: pred.sport,
        league: pred.league,
        kickoff: pred.kickoff.toISOString(),
        confidence: pred.modelProbability,
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

      // Free users get teaser with probabilities but no selection/edge
      if (!isPro) {
        return {
          ...basePick,
          selection: null,
          odds: null,
          // Show probabilities to all users (teaser value)
          probabilities: {
            home: pred.homeWin,
            draw: pred.draw,
            away: pred.awayWin,
          },
          // Teaser content
          headline: displayHeadline,
          locked: true,
          // No detailed analysis
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
        selection: pred.selection || pred.valueBetSide,
        odds: pred.marketOddsAtPrediction,
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
