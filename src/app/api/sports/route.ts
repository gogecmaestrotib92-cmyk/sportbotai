/**
 * API Route: /api/sports
 * 
 * Fetches list of available sports from The Odds API.
 * This endpoint is FREE and does not use API quota.
 */

import { NextResponse } from 'next/server';
import { theOddsClient, groupSportsByCategory } from '@/lib/theOdds';

export async function GET() {
  try {
    if (!theOddsClient.isConfigured()) {
      return NextResponse.json(
        { error: 'ODDS_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const { data: sports, requestsRemaining } = await theOddsClient.getSports();
    
    // Filter active sports and group them
    const activeSports = sports.filter(s => s.active && !s.has_outrights);
    const grouped = groupSportsByCategory(activeSports);

    return NextResponse.json({
      sports: activeSports,
      grouped,
      requestsRemaining,
    });
  } catch (error) {
    console.error('Error fetching sports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sports' },
      { status: 500 }
    );
  }
}
