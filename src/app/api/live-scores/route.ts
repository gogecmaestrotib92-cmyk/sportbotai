/**
 * Live Scores API
 * 
 * Fetches live match scores from API-Football.
 * Supports querying specific matches or all live matches.
 * 
 * Endpoints:
 * - GET /api/live-scores - All live matches
 * - GET /api/live-scores?teams=Liverpool,Manchester - Specific match by teams
 * - GET /api/live-scores?fixtureId=123456 - Specific match by fixture ID
 */

import { NextRequest, NextResponse } from 'next/server';

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;

// Cache for live scores (short TTL - 30 seconds)
const liveCache = new Map<string, { data: any; timestamp: number }>();
const LIVE_CACHE_TTL = 30 * 1000; // 30 seconds

export interface LiveMatch {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: {
    short: string; // 1H, HT, 2H, FT, etc.
    long: string;  // First Half, Halftime, etc.
    elapsed: number | null; // Minutes played
  };
  league: string;
  leagueLogo: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  events: Array<{
    time: number;
    type: 'Goal' | 'Card' | 'Subst' | 'Var';
    team: 'home' | 'away';
    player: string;
    detail: string;
  }>;
  venue: string;
  startTime: string;
}

function getCached<T>(key: string): T | null {
  const cached = liveCache.get(key);
  if (cached && Date.now() - cached.timestamp < LIVE_CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  liveCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch all currently live matches
 */
async function fetchLiveMatches(): Promise<LiveMatch[]> {
  const cacheKey = 'live-all';
  const cached = getCached<LiveMatch[]>(cacheKey);
  if (cached) return cached;

  if (!API_KEY) {
    console.error('[Live-Scores] API_FOOTBALL_KEY not configured');
    return [];
  }

  try {
    const response = await fetch(`${API_FOOTBALL_BASE}/fixtures?live=all`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    });

    if (!response.ok) {
      console.error('[Live-Scores] API error:', response.status);
      return [];
    }

    const data = await response.json();
    const fixtures = data.response || [];

    const liveMatches: LiveMatch[] = fixtures.map((fixture: any) => ({
      fixtureId: fixture.fixture.id,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeScore: fixture.goals.home ?? 0,
      awayScore: fixture.goals.away ?? 0,
      status: {
        short: fixture.fixture.status.short,
        long: fixture.fixture.status.long,
        elapsed: fixture.fixture.status.elapsed,
      },
      league: fixture.league.name,
      leagueLogo: fixture.league.logo,
      homeTeamLogo: fixture.teams.home.logo,
      awayTeamLogo: fixture.teams.away.logo,
      events: (fixture.events || []).slice(-5).map((e: any) => ({
        time: e.time.elapsed,
        type: e.type,
        team: e.team.id === fixture.teams.home.id ? 'home' : 'away',
        player: e.player.name,
        detail: e.detail,
      })),
      venue: fixture.fixture.venue?.name || '',
      startTime: fixture.fixture.date,
    }));

    setCache(cacheKey, liveMatches);
    return liveMatches;
  } catch (error) {
    console.error('[Live-Scores] Fetch error:', error);
    return [];
  }
}

/**
 * Fetch live score for a specific match by team names
 */
async function fetchMatchByTeams(homeTeam: string, awayTeam: string): Promise<LiveMatch | null> {
  const allLive = await fetchLiveMatches();
  
  // Normalize team names for matching
  const normalizeTeam = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const homeNorm = normalizeTeam(homeTeam);
  const awayNorm = normalizeTeam(awayTeam);

  // Find matching fixture
  const match = allLive.find(m => {
    const matchHomeNorm = normalizeTeam(m.homeTeam);
    const matchAwayNorm = normalizeTeam(m.awayTeam);
    
    return (
      (matchHomeNorm.includes(homeNorm) || homeNorm.includes(matchHomeNorm)) &&
      (matchAwayNorm.includes(awayNorm) || awayNorm.includes(matchAwayNorm))
    );
  });

  return match || null;
}

/**
 * Fetch today's fixtures to check if a match is upcoming/live/finished
 */
async function fetchTodaysFixtures(): Promise<LiveMatch[]> {
  const cacheKey = 'fixtures-today';
  const cached = getCached<LiveMatch[]>(cacheKey);
  if (cached) return cached;

  if (!API_KEY) return [];

  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_FOOTBALL_BASE}/fixtures?date=${today}`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const fixtures = data.response || [];

    const matches: LiveMatch[] = fixtures.map((fixture: any) => ({
      fixtureId: fixture.fixture.id,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeScore: fixture.goals.home ?? 0,
      awayScore: fixture.goals.away ?? 0,
      status: {
        short: fixture.fixture.status.short,
        long: fixture.fixture.status.long,
        elapsed: fixture.fixture.status.elapsed,
      },
      league: fixture.league.name,
      leagueLogo: fixture.league.logo,
      homeTeamLogo: fixture.teams.home.logo,
      awayTeamLogo: fixture.teams.away.logo,
      events: [],
      venue: fixture.fixture.venue?.name || '',
      startTime: fixture.fixture.date,
    }));

    setCache(cacheKey, matches);
    return matches;
  } catch (error) {
    console.error('[Live-Scores] Error fetching today fixtures:', error);
    return [];
  }
}

/**
 * Get match status for specific teams (works for live, upcoming, and finished)
 */
async function getMatchStatus(homeTeam: string, awayTeam: string): Promise<{
  status: 'live' | 'upcoming' | 'finished' | 'not_found';
  match?: LiveMatch;
}> {
  // First check live matches
  const liveMatch = await fetchMatchByTeams(homeTeam, awayTeam);
  if (liveMatch) {
    return { status: 'live', match: liveMatch };
  }

  // Then check today's fixtures
  const todaysFixtures = await fetchTodaysFixtures();
  const normalizeTeam = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const homeNorm = normalizeTeam(homeTeam);
  const awayNorm = normalizeTeam(awayTeam);

  const todayMatch = todaysFixtures.find(m => {
    const matchHomeNorm = normalizeTeam(m.homeTeam);
    const matchAwayNorm = normalizeTeam(m.awayTeam);
    return (
      (matchHomeNorm.includes(homeNorm) || homeNorm.includes(matchHomeNorm)) &&
      (matchAwayNorm.includes(awayNorm) || awayNorm.includes(matchAwayNorm))
    );
  });

  if (todayMatch) {
    const finishedStatuses = ['FT', 'AET', 'PEN', 'SUSP', 'INT', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];
    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
    
    if (finishedStatuses.includes(todayMatch.status.short)) {
      return { status: 'finished', match: todayMatch };
    }
    if (liveStatuses.includes(todayMatch.status.short)) {
      return { status: 'live', match: todayMatch };
    }
    return { status: 'upcoming', match: todayMatch };
  }

  return { status: 'not_found' };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teams = searchParams.get('teams');
  const homeTeam = searchParams.get('home');
  const awayTeam = searchParams.get('away');
  const fixtureId = searchParams.get('fixtureId');

  try {
    // Specific match by teams (comma-separated or separate params)
    if (teams) {
      const [home, away] = teams.split(',').map(t => t.trim());
      if (home && away) {
        const result = await getMatchStatus(home, away);
        return NextResponse.json(result);
      }
    }

    if (homeTeam && awayTeam) {
      const result = await getMatchStatus(homeTeam, awayTeam);
      return NextResponse.json(result);
    }

    // All live matches
    const liveMatches = await fetchLiveMatches();
    
    return NextResponse.json({
      count: liveMatches.length,
      matches: liveMatches,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Live-Scores] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live scores' },
      { status: 500 }
    );
  }
}
