/**
 * API Route: /api/odds/[sport]
 * 
 * Fetches odds for a specific sport.
 * WARNING: This endpoint USES API quota (1 credit per region/market)!
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  theOddsClient, 
  calculateAverageOdds, 
  oddsToImpliedProbability, 
  findBestOdds 
} from '@/lib/theOdds';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sport: string }> }
) {
  try {
    const { sport } = await params;

    if (!theOddsClient.isConfigured()) {
      return NextResponse.json(
        { error: 'ODDS_API_KEY is not configured' },
        { status: 500 }
      );
    }

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport key is required' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const regions = searchParams.get('regions')?.split(',') || ['eu'];
    const markets = searchParams.get('markets')?.split(',') || ['h2h'];
    const bookmakers = searchParams.get('bookmakers')?.split(',');

    const { data: events, requestsRemaining, requestsUsed } = await theOddsClient.getOddsForSport(
      sport,
      { regions, markets, bookmakers }
    );

    // Enrich data with average odds and implied probability
    const enrichedEvents = events.map(event => {
      const averageOdds = calculateAverageOdds(event);
      const bestHome = findBestOdds(event, 'home');
      const bestAway = findBestOdds(event, 'away');
      const bestDraw = findBestOdds(event, 'draw');

      return {
        ...event,
        analysis: {
          averageOdds,
          impliedProbability: {
            home: oddsToImpliedProbability(averageOdds.home),
            draw: averageOdds.draw ? oddsToImpliedProbability(averageOdds.draw) : null,
            away: oddsToImpliedProbability(averageOdds.away),
          },
          bestOdds: {
            home: bestHome,
            draw: bestDraw,
            away: bestAway,
          },
        },
      };
    });

    // Sort by start time
    const sortedEvents = enrichedEvents.sort(
      (a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
    );

    return NextResponse.json({
      events: sortedEvents,
      requestsRemaining,
      requestsUsed,
    });
  } catch (error) {
    console.error('Error fetching odds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch odds' },
      { status: 500 }
    );
  }
}
