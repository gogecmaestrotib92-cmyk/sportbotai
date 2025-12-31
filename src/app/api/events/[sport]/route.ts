/**
 * API Route: /api/events/[sport]
 * 
 * Fetches list of events for a specific sport.
 * This endpoint is FREE and does not use API quota.
 */

import { NextRequest, NextResponse } from 'next/server';
import { theOddsClient } from '@/lib/theOdds';

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

    const { data: events, requestsRemaining } = await theOddsClient.getEvents(sport);

    // Sort by start time and transform to camelCase
    const sortedEvents = events
      .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())
      .map(event => ({
        matchId: event.id,
        sportKey: event.sport_key,
        sportTitle: event.sport_title,
        commenceTime: event.commence_time,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
      }));

    return NextResponse.json({
      events: sortedEvents,
      requestsRemaining,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
