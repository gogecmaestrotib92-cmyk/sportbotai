/**
 * Team Profile API
 * 
 * GET /api/team/[teamId]
 * Returns comprehensive team statistics and form data
 */

import { NextRequest, NextResponse } from 'next/server';
import { TeamProfileData } from '@/types';

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

// Cache for API responses (1 hour TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function apiRequest<T>(endpoint: string): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  
  if (!apiKey) {
    console.warn('API_FOOTBALL_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`${API_FOOTBALL_BASE}${endpoint}`, {
      headers: { 'x-apisports-key': apiKey },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`API-Football error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API-Football request failed:', error);
    return null;
  }
}

// TeamProfileData type is now in @/types/index.ts

// Common team slug to API ID mappings
const TEAM_SLUG_MAP: Record<string, number> = {
  // Premier League
  'arsenal': 42,
  'aston-villa': 66,
  'bournemouth': 35,
  'brentford': 55,
  'brighton': 51,
  'chelsea': 49,
  'crystal-palace': 52,
  'everton': 45,
  'fulham': 36,
  'liverpool': 40,
  'manchester-city': 50,
  'manchester-united': 33,
  'newcastle': 34,
  'nottingham-forest': 65,
  'tottenham': 47,
  'west-ham': 48,
  'wolves': 39,
  'luton': 1359,
  'burnley': 44,
  'sheffield-united': 62,
  'ipswich': 57,
  'leicester': 46,
  'southampton': 41,
  
  // La Liga
  'real-madrid': 541,
  'barcelona': 529,
  'atletico-madrid': 530,
  'sevilla': 536,
  'real-sociedad': 548,
  'villarreal': 533,
  'athletic-bilbao': 531,
  'real-betis': 543,
  
  // Serie A
  'inter-milan': 505,
  'ac-milan': 489,
  'juventus': 496,
  'napoli': 492,
  'roma': 497,
  'lazio': 487,
  'atalanta': 499,
  'fiorentina': 502,
  
  // Bundesliga
  'bayern-munich': 157,
  'borussia-dortmund': 165,
  'rb-leipzig': 173,
  'bayer-leverkusen': 168,
  
  // Ligue 1
  'psg': 85,
  'marseille': 81,
  'monaco': 91,
  'lyon': 80,
  
  // NBA
  'los-angeles-lakers': 17,
  'boston-celtics': 2,
  'golden-state-warriors': 11,
  'miami-heat': 20,
  'phoenix-suns': 28,
  'dallas-mavericks': 8,
  'denver-nuggets': 9,
  'milwaukee-bucks': 21,
  'philadelphia-76ers': 27,
  'new-york-knicks': 24,
  'los-angeles-clippers': 16,
  'oklahoma-city-thunder': 25,
  'minnesota-timberwolves': 22,
  'cleveland-cavaliers': 7,
  'memphis-grizzlies': 19,
  'sacramento-kings': 30,
  'indiana-pacers': 15,
  'new-orleans-pelicans': 23,
  'orlando-magic': 26,
  'chicago-bulls': 6,
  
  // NHL
  'toronto-maple-leafs': 699,
  'boston-bruins': 681,
  'new-york-rangers': 697,
  'florida-panthers': 687,
  'carolina-hurricanes': 684,
  'edmonton-oilers': 686,
  'colorado-avalanche': 685,
  'dallas-stars': 682,
  'vegas-golden-knights': 716,
  'winnipeg-jets': 718,
  'tampa-bay-lightning': 712,
  
  // NFL
  'kansas-city-chiefs': 1,
  'buffalo-bills': 4,
  'baltimore-ravens': 3,
  'san-francisco-49ers': 25,
  'dallas-cowboys': 9,
  'philadelphia-eagles': 26,
  'miami-dolphins': 20,
  'green-bay-packers': 12,
  'detroit-lions': 10,
  'cincinnati-bengals': 7,
};

function resolveTeamId(teamIdOrSlug: string): number | null {
  // Check if it's already a number
  const numId = parseInt(teamIdOrSlug, 10);
  if (!isNaN(numId)) {
    return numId;
  }
  
  // Try slug lookup
  const slug = teamIdOrSlug.toLowerCase();
  return TEAM_SLUG_MAP[slug] || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const teamIdNum = resolveTeamId(teamId);

  if (!teamIdNum) {
    return NextResponse.json({ 
      error: 'Team not found. Try searching for the team.', 
      slug: teamId 
    }, { status: 404 });
  }

  // Check cache first
  const cacheKey = `team-profile:${teamIdNum}`;
  const cached = getCached<TeamProfileData>(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true });
  }

  try {
    // Fetch team info, statistics, fixtures in parallel
    const [teamInfoRes, statsRes, fixturesRes, nextFixturesRes] = await Promise.all([
      apiRequest<any>(`/teams?id=${teamIdNum}`),
      apiRequest<any>(`/teams/statistics?team=${teamIdNum}&season=2024`),
      apiRequest<any>(`/fixtures?team=${teamIdNum}&last=10`),
      apiRequest<any>(`/fixtures?team=${teamIdNum}&next=5`),
    ]);

    if (!teamInfoRes?.response?.[0]) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const teamInfo = teamInfoRes.response[0];
    const stats = statsRes?.response;
    const fixtures = fixturesRes?.response || [];
    const nextFixtures = nextFixturesRes?.response || [];

    // Get league standings if we have a league
    let standing = null;
    if (stats?.league?.id) {
      const standingsRes = await apiRequest<any>(
        `/standings?league=${stats.league.id}&season=2024`
      );
      
      if (standingsRes?.response?.[0]?.league?.standings) {
        const allStandings = standingsRes.response[0].league.standings.flat();
        const teamStanding = allStandings.find((s: any) => s.team.id === teamIdNum);
        if (teamStanding) {
          standing = {
            position: teamStanding.rank,
            points: teamStanding.points,
            played: teamStanding.all.played,
            wins: teamStanding.all.win,
            draws: teamStanding.all.draw,
            losses: teamStanding.all.lose,
            goalsFor: teamStanding.all.goals.for,
            goalsAgainst: teamStanding.all.goals.against,
            goalDiff: teamStanding.goalsDiff,
            form: teamStanding.form || '',
          };
        }
      }
    }

    // Process recent matches
    const recentMatches = fixtures.map((f: any) => {
      const isHome = f.teams.home.id === teamIdNum;
      const teamScore = isHome ? f.goals.home : f.goals.away;
      const oppScore = isHome ? f.goals.away : f.goals.home;
      
      let result: 'W' | 'D' | 'L' = 'D';
      if (teamScore > oppScore) result = 'W';
      else if (teamScore < oppScore) result = 'L';

      return {
        date: f.fixture.date,
        opponent: isHome ? f.teams.away.name : f.teams.home.name,
        opponentLogo: isHome ? f.teams.away.logo : f.teams.home.logo,
        score: `${f.goals.home}-${f.goals.away}`,
        result,
        home: isHome,
        competition: f.league.name,
      };
    });

    // Process upcoming matches
    const upcomingMatches = nextFixtures.map((f: any) => {
      const isHome = f.teams.home.id === teamIdNum;
      return {
        date: f.fixture.date,
        opponent: isHome ? f.teams.away.name : f.teams.home.name,
        opponentLogo: isHome ? f.teams.away.logo : f.teams.home.logo,
        home: isHome,
        competition: f.league.name,
      };
    });

    // Build stats object
    const formString = stats?.form || '';
    const teamStats = stats ? {
      form: formString,
      formArray: formString.slice(-10).split('') as ('W' | 'D' | 'L')[],
      goalsScored: stats.goals?.for?.total?.total || 0,
      goalsConceded: stats.goals?.against?.total?.total || 0,
      cleanSheets: stats.clean_sheet?.total || 0,
      failedToScore: stats.failed_to_score?.total || 0,
      avgGoalsScored: stats.goals?.for?.average?.total ? parseFloat(stats.goals.for.average.total) : 0,
      avgGoalsConceded: stats.goals?.against?.average?.total ? parseFloat(stats.goals.against.average.total) : 0,
      homeRecord: {
        played: stats.fixtures?.played?.home || 0,
        wins: stats.fixtures?.wins?.home || 0,
        draws: stats.fixtures?.draws?.home || 0,
        losses: stats.fixtures?.loses?.home || 0,
      },
      awayRecord: {
        played: stats.fixtures?.played?.away || 0,
        wins: stats.fixtures?.wins?.away || 0,
        draws: stats.fixtures?.draws?.away || 0,
        losses: stats.fixtures?.loses?.away || 0,
      },
      biggestWin: stats.biggest?.wins?.home || stats.biggest?.wins?.away || null,
      biggestLoss: stats.biggest?.loses?.home || stats.biggest?.loses?.away || null,
    } : null;

    const profileData: TeamProfileData = {
      team: {
        id: teamInfo.team.id,
        name: teamInfo.team.name,
        logo: teamInfo.team.logo,
        country: teamInfo.team.country,
        founded: teamInfo.team.founded,
        venue: teamInfo.venue ? {
          name: teamInfo.venue.name,
          city: teamInfo.venue.city,
          capacity: teamInfo.venue.capacity,
        } : null,
      },
      league: stats?.league ? {
        id: stats.league.id,
        name: stats.league.name,
        logo: stats.league.logo,
        country: stats.league.country,
        season: stats.league.season,
      } : null,
      standing,
      stats: teamStats,
      recentMatches,
      upcomingMatches,
    };

    // Cache the result
    setCache(cacheKey, profileData);

    return NextResponse.json({ success: true, data: profileData });
  } catch (error) {
    console.error('Team profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team profile' },
      { status: 500 }
    );
  }
}
