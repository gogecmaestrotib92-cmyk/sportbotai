/**
 * Daily Picks API
 * 
 * Returns today's AI picks sorted by edge + confidence.
 * Free users see limited info, Pro users see full details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isPro = session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM';
    
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // Get today's date range (UTC)
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(todayStart);
    tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 2); // Today + tomorrow

    // Build where clause
    const where: Record<string, unknown> = {
      kickoff: {
        gte: now, // Only upcoming matches
        lte: tomorrowEnd,
      },
      outcome: 'PENDING',
      // Only show picks with meaningful edge
      edgeValue: {
        gte: 2, // At least 2% edge
      },
      modelProbability: {
        gte: 40, // At least 40% model confidence
      },
    };

    if (sport && sport !== 'all') {
      where.sport = sport;
    }

    // Fetch predictions
    const predictions = await prisma.prediction.findMany({
      where,
      orderBy: [
        { edgeValue: 'desc' }, // Highest edge first
        { modelProbability: 'desc' }, // Then by confidence
      ],
      take: limit,
      select: {
        id: true,
        matchId: true,
        matchName: true,
        sport: true,
        league: true,
        kickoff: true,
        // Edge & confidence data
        edgeValue: true,
        edgeBucket: true,
        modelProbability: true,
        marketOddsAtPrediction: true,
        // Selection (what we're picking)
        selection: true,
        valueBetSide: true,
        // Probabilities
        homeWin: true,
        draw: true,
        awayWin: true,
        predictedScore: true,
        headline: true,
        // For verification
        outcome: true,
      },
    });

    // Get total count for "X more picks" display
    const totalCount = await prisma.prediction.count({ where });

    // Transform data based on user tier
    const picks = predictions.map((pred) => {
      const [homeTeam, awayTeam] = pred.matchName.split(' vs ');
      
      // Normalize headline - can be string or object with {text, icon, viral, favors}
      const rawHeadline = pred.headline as unknown;
      let headlineText: string | null = null;
      if (typeof rawHeadline === 'string') {
        headlineText = rawHeadline;
      } else if (rawHeadline && typeof rawHeadline === 'object' && 'text' in rawHeadline) {
        headlineText = String((rawHeadline as { text?: unknown }).text || '');
      }
      
      // Base info everyone sees
      const basePick = {
        id: pred.id,
        matchId: pred.matchId,
        homeTeam: homeTeam?.trim() || 'TBD',
        awayTeam: awayTeam?.trim() || 'TBD',
        sport: pred.sport,
        league: pred.league,
        kickoff: pred.kickoff.toISOString(),
        // Show that there's an edge (teaser)
        hasEdge: (pred.edgeValue || 0) >= 3,
        hasHighConfidence: (pred.modelProbability || 0) >= 60,
        edgeBucket: pred.edgeBucket, // SLIGHT, MODERATE, STRONG, VERY_STRONG
      };

      // Pro users get full details
      if (isPro) {
        return {
          ...basePick,
          // Unlock the goods
          edgeValue: pred.edgeValue,
          confidence: pred.modelProbability,
          selection: pred.selection || pred.valueBetSide,
          odds: pred.marketOddsAtPrediction,
          probabilities: {
            home: pred.homeWin,
            draw: pred.draw,
            away: pred.awayWin,
          },
          predictedScore: pred.predictedScore,
          headline: headlineText,
        };
      }

      // Free users get teaser only
      return {
        ...basePick,
        // Blurred placeholders
        edgeValue: null,
        confidence: null,
        selection: null,
        odds: null,
        probabilities: null,
        predictedScore: null,
        headline: null,
        locked: true,
      };
    });

    return NextResponse.json({
      success: true,
      picks,
      meta: {
        total: totalCount,
        showing: picks.length,
        isPro,
        moreAvailable: totalCount > picks.length,
      },
    });
  } catch (error) {
    console.error('[Daily Picks API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch picks' },
      { status: 500 }
    );
  }
}
