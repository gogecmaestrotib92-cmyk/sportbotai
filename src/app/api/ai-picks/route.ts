/**
 * AI Picks API
 * 
 * Returns matches that the AI has flagged based on pre-analyzed predictions.
 * These are REAL AI picks based on:
 * - Full model analysis (form, injuries, H2H, signals)
 * - Value edge calculation (model prob vs market odds)
 * - Conviction scoring
 * 
 * Unlike client-side heuristics, this uses the actual pre-analyze cron data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 300; // Cache for 5 minutes

// Minimum edge to consider a match "AI Flagged"
const MIN_VALUE_EDGE = 3.0;
const MIN_CONVICTION = 55;

interface AIPick {
  matchId: string;
  matchName: string;
  sport: string;
  league: string;
  kickoff: string;
  prediction: string;
  valueBetSide: string | null;
  valueBetEdge: number | null;
  valueBetOdds: number | null;
  conviction: number;
  reasoning: string;
  aiReason: string; // Short display text
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport'); // Optional sport filter
    const league = searchParams.get('league'); // Optional league filter
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get upcoming predictions with value edges
    const now = new Date();
    const in72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    
    const predictions = await prisma.prediction.findMany({
      where: {
        kickoff: {
          gte: now,
          lte: in72Hours,
        },
        outcome: 'PENDING',
        // Filter by sport/league if provided
        ...(sport && { sport }),
        ...(league && { league }),
        // Only matches with significant edge OR high conviction
        OR: [
          {
            valueBetEdge: {
              gte: MIN_VALUE_EDGE,
            },
          },
          {
            conviction: {
              gte: MIN_CONVICTION + 10, // High conviction picks
            },
          },
        ],
      },
      orderBy: [
        { valueBetEdge: 'desc' }, // Highest edge first
        { conviction: 'desc' },
      ],
      take: limit,
    });
    
    // Transform to AI Picks format
    const aiPicks: AIPick[] = predictions.map(p => {
      // Generate short AI reason for display
      let aiReason = 'AI Flagged';
      if (p.valueBetEdge && p.valueBetEdge >= 8) {
        aiReason = `🎯 ${p.valueBetSide} +${p.valueBetEdge.toFixed(1)}% edge`;
      } else if (p.valueBetEdge && p.valueBetEdge >= 5) {
        aiReason = `📊 ${p.valueBetSide} +${p.valueBetEdge.toFixed(1)}% edge`;
      } else if (p.valueBetEdge && p.valueBetEdge >= MIN_VALUE_EDGE) {
        aiReason = `📈 ${p.valueBetSide} +${p.valueBetEdge.toFixed(1)}% edge`;
      } else if (p.conviction >= MIN_CONVICTION + 10) {
        aiReason = `💪 High conviction (${p.conviction}%)`;
      }
      
      return {
        matchId: p.matchId,
        matchName: p.matchName,
        sport: p.sport,
        league: p.league,
        kickoff: p.kickoff.toISOString(),
        prediction: p.prediction,
        valueBetSide: p.valueBetSide,
        valueBetEdge: p.valueBetEdge,
        valueBetOdds: p.valueBetOdds,
        conviction: p.conviction,
        reasoning: p.reasoning,
        aiReason,
      };
    });
    
    // Also return match IDs for quick lookup
    const flaggedMatchIds = aiPicks.map(p => p.matchId);
    
    return NextResponse.json({
      success: true,
      aiPicks,
      flaggedMatchIds,
      count: aiPicks.length,
      criteria: {
        minValueEdge: MIN_VALUE_EDGE,
        minConviction: MIN_CONVICTION,
        timeWindow: '72h',
      },
    });
    
  } catch (error) {
    console.error('[AI-Picks] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI picks' },
      { status: 500 }
    );
  }
}
