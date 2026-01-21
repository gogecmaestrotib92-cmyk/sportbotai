/**
 * API Route: /api/match-data
 * 
 * Multi-sport match data endpoint.
 * Fetches and processes match data from The Odds API for various sports.
 * 
 * Endpoints:
 * - GET /api/match-data?sport=nba - Get events list for a sport
 * - GET /api/match-data?sportKey=basketball_nba - Get events by Odds API sport key
 * - GET /api/match-data?sportKey=basketball_nba&eventId=abc123 - Get specific event with odds
 * - GET /api/match-data?sportKey=basketball_nba&includeOdds=true - Get events with odds (uses quota)
 */

import { NextRequest, NextResponse } from 'next/server';
import { MatchData, MatchDataResponse } from '@/types';
import {
  getSportConfig,
  SportConfig
} from '@/lib/config/sportsConfig';
import {
  theOddsClient,
  OddsApiEvent,
  calculateAverageOdds,
  extractTotals,
  extractBookmakerOdds,
  oddsToImpliedProbability,
} from '@/lib/theOdds/theOddsClient';
import {
  buildMatchDataFromOddsApiEvent,
  eventToSimplifiedSummary,
  SimplifiedEventSummary,
} from '@/lib/matchData/multiSportMatchData';

// ============================================
// MAIN GET HANDLER
// ============================================

/**
 * GET /api/match-data
 * 
 * Query params:
 * - sport: Internal sport ID (e.g., "nba", "nfl")
 * - sportKey: Odds API sport key (e.g., "basketball_nba")
 * - eventId: Optional. If provided, fetches odds for specific event
 * - includeOdds: Optional. If "true", includes odds with events list (uses quota)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract parameters
    const sport = searchParams.get('sport'); // Internal sport ID (e.g., "nba")
    const sportKey = searchParams.get('sportKey'); // Odds API key (e.g., "basketball_nba")
    const eventId = searchParams.get('eventId');
    const includeOdds = searchParams.get('includeOdds') === 'true';

    // Validate API key
    if (!theOddsClient.isConfigured()) {
      return NextResponse.json<MatchDataResponse>(
        {
          success: false,
          error: 'ODDS_API_KEY is not configured. Please add it to your environment variables.',
        },
        { status: 500 }
      );
    }

    // Resolve sport configuration
    const resolvedSportKey = sportKey || sport;
    if (!resolvedSportKey) {
      return NextResponse.json<MatchDataResponse>(
        {
          success: false,
          error: 'Either "sport" or "sportKey" query parameter is required',
        },
        { status: 400 }
      );
    }

    // Get sport configuration
    const sportConfig = getSportConfig(resolvedSportKey);
    if (!sportConfig) {
      return NextResponse.json<MatchDataResponse>(
        {
          success: false,
          error: `Unknown sport: ${resolvedSportKey}. Please check the sport key.`,
        },
        { status: 400 }
      );
    }

    // Route to appropriate handler
    if (eventId) {
      // Fetch specific event with full odds
      return await handleSingleEvent(sportConfig, eventId);
    } else if (includeOdds) {
      // Fetch all events with odds (uses quota)
      return await handleEventsWithOdds(sportConfig);
    } else {
      // Fetch events list without odds (free)
      return await handleEventsWithoutOdds(sportConfig);
    }

  } catch (error) {
    console.error('Error in /api/match-data:', error);
    return NextResponse.json<MatchDataResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// HANDLER: Single Event with Full Odds
// ============================================

async function handleSingleEvent(
  sportConfig: SportConfig,
  eventId: string
): Promise<NextResponse<MatchDataResponse>> {
  try {
    const result = await theOddsClient.getEventOdds(
      sportConfig.oddsApiSportKey,
      eventId,
      {
        regions: ['eu', 'uk', 'us'],
        markets: ['h2h', 'totals'],
        oddsFormat: 'decimal',
      }
    );

    const event = result.data;
    const matchData = buildMatchDataFromOddsApiEvent(sportConfig, event);

    return NextResponse.json<MatchDataResponse>({
      success: true,
      data: matchData,
      requestsRemaining: result.requestsRemaining,
    });
  } catch (error) {
    // If event not found, return 404
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json<MatchDataResponse>(
        {
          success: false,
          error: `Event ${eventId} not found`,
        },
        { status: 404 }
      );
    }
    throw error;
  }
}

// ============================================
// HANDLER: Events List with Odds (Uses Quota)
// ============================================

async function handleEventsWithOdds(
  sportConfig: SportConfig
): Promise<NextResponse<MatchDataResponse>> {
  const result = await theOddsClient.getOddsForSport(
    sportConfig.oddsApiSportKey,
    {
      regions: ['eu'],
      markets: ['h2h', 'totals'],
      oddsFormat: 'decimal',
    }
  );

  const events = result.data.map(event =>
    buildMatchDataFromOddsApiEvent(sportConfig, event)
  );

  return NextResponse.json<MatchDataResponse>({
    success: true,
    events,
    requestsRemaining: result.requestsRemaining,
  });
}

// ============================================
// HANDLER: Events List without Odds (Free)
// ============================================

async function handleEventsWithoutOdds(
  sportConfig: SportConfig
): Promise<NextResponse<MatchDataResponse>> {
  const result = await theOddsClient.getEvents(sportConfig.oddsApiSportKey);

  // Build basic match data for each event (won't have odds)
  const events: MatchData[] = result.data.map((event: OddsApiEvent) => ({
    matchId: event.id,
    sport: sportConfig.displayName,
    sportKey: sportConfig.oddsApiSportKey,
    league: event.sport_title || sportConfig.displayName,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    sourceType: 'API' as const,
    odds: {
      home: 0,
      draw: sportConfig.hasDraw ? null : null,
      away: 0,
    },
    bookmakers: [],
    averageOdds: { home: 0, draw: null, away: 0 },
    impliedProbabilities: { home: 0, draw: null, away: 0 },
  }));

  // Return with Cache-Control headers for browser/CDN caching
  // This reduces repeated fetches from MatchBrowser on mobile
  return NextResponse.json<MatchDataResponse>(
    {
      success: true,
      events,
      requestsRemaining: result.requestsRemaining,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}

// ============================================
// POST HANDLER (for manual data submission)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.homeTeam || !body.awayTeam) {
      return NextResponse.json<MatchDataResponse>(
        {
          success: false,
          error: 'homeTeam and awayTeam are required',
        },
        { status: 400 }
      );
    }

    // Get sport config if sport is provided
    const sportConfig = body.sport ? getSportConfig(body.sport) : null;

    // Build manual match data
    const matchData: MatchData = {
      matchId: `manual_${Date.now()}`,
      sport: sportConfig?.displayName || body.sport || 'Soccer',
      sportKey: sportConfig?.oddsApiSportKey || body.sportKey || 'soccer',
      league: body.league || 'Unknown League',
      homeTeam: body.homeTeam,
      awayTeam: body.awayTeam,
      commenceTime: body.matchDate || new Date().toISOString(),
      sourceType: 'MANUAL',
      odds: {
        home: body.odds?.home || body.oddsHome || 0,
        draw: body.odds?.draw ?? body.oddsDraw ?? null,
        away: body.odds?.away || body.oddsAway || 0,
        overUnderLine: body.odds?.overUnderLine,
        over: body.odds?.over,
        under: body.odds?.under,
      },
      bookmakers: [],
      averageOdds: {
        home: body.odds?.home || body.oddsHome || 0,
        draw: body.odds?.draw ?? body.oddsDraw ?? null,
        away: body.odds?.away || body.oddsAway || 0,
      },
      impliedProbabilities: {
        home: body.odds?.home > 0 ? oddsToImpliedProbability(body.odds.home) : 0,
        draw: body.odds?.draw > 0 ? oddsToImpliedProbability(body.odds.draw) : null,
        away: body.odds?.away > 0 ? oddsToImpliedProbability(body.odds.away) : 0,
      },
    };

    return NextResponse.json<MatchDataResponse>({
      success: true,
      data: matchData,
    });

  } catch (error) {
    console.error('Error in POST /api/match-data:', error);
    return NextResponse.json<MatchDataResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
