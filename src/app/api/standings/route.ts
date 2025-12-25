/**
 * Standings API - Multi-Sport Support
 * 
 * Fetches league standings using the data layer:
 * - Soccer (Premier League, La Liga, etc.)
 * - Basketball (NBA)
 * - Hockey (NHL)
 * - American Football (NFL)
 * 
 * Endpoints:
 * - GET /api/standings?sport=soccer&league=39&season=2024 - Premier League
 * - GET /api/standings?sport=basketball&league=12&season=2024-2025 - NBA
 * - GET /api/standings?sport=hockey&league=57&season=2024 - NHL
 * - GET /api/standings?sport=nfl&league=1&season=2024 - NFL
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPISportsProvider } from '@/lib/data-layer/providers/api-sports';

// Cache for standings (1 hour - standings don't change that often)
const standingsCache = new Map<string, { data: StandingsResponse; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Normalized standing entry for frontend
interface StandingEntry {
  position: number;
  teamId: number;
  teamName: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: string | null;
  group: string | null;
  description: string | null;
}

interface StandingsResponse {
  success: boolean;
  data: {
    league: {
      id: number;
      name: string;
      logo: string;
      country: string;
      season: string;
    };
    standings: StandingEntry[];
  } | null;
  error?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport') || 'soccer';
  const league = parseInt(searchParams.get('league') || '39'); // Default to Premier League
  const season = searchParams.get('season') || getCurrentSeason(sport);
  
  // Check cache
  const cacheKey = `${sport}-${league}-${season}`;
  const cached = standingsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }
  
  const apiProvider = getAPISportsProvider();
  
  try {
    let result: StandingsResponse;
    
    switch (sport) {
      case 'soccer':
      case 'football': {
        const response = await apiProvider.getSoccerStandings({
          league,
          season: parseInt(season),
        });
        
        if (!response.success || !response.data || response.data.length === 0) {
          result = { success: false, data: null, error: response.error || 'No standings found' };
          break;
        }
        
        const leagueData = response.data[0].league;
        const rawStandings = leagueData.standings[0]; // First group
        
        const standings: StandingEntry[] = rawStandings.map((team) => ({
          position: team.rank,
          teamId: team.team.id,
          teamName: team.team.name,
          teamLogo: team.team.logo,
          played: team.all.played,
          won: team.all.win,
          drawn: team.all.draw,
          lost: team.all.lose,
          goalsFor: team.all.goals.for,
          goalsAgainst: team.all.goals.against,
          goalDiff: team.goalsDiff,
          points: team.points,
          form: team.form || null,
          group: team.group || null,
          description: team.description || null,
        }));
        
        result = {
          success: true,
          data: {
            league: {
              id: leagueData.id,
              name: leagueData.name,
              logo: leagueData.logo,
              country: leagueData.country,
              season: String(leagueData.season),
            },
            standings,
          },
        };
        break;
      }
      
      case 'basketball':
      case 'nba': {
        const response = await apiProvider.getBasketballStandings({
          league,
          season,
        });
        
        if (!response.success || !response.data || response.data.length === 0) {
          result = { success: false, data: null, error: response.error || 'No standings found' };
          break;
        }
        
        const allStandings = response.data.flat();
        const firstEntry = allStandings[0];
        
        const standings: StandingEntry[] = allStandings.map((team) => ({
          position: team.position,
          teamId: team.team.id,
          teamName: team.team.name,
          teamLogo: team.team.logo,
          played: team.games.played,
          won: team.games.win.total,
          drawn: 0,
          lost: team.games.lose.total,
          goalsFor: team.points.for,
          goalsAgainst: team.points.against,
          goalDiff: team.points.for - team.points.against,
          points: team.games.win.total,
          form: team.form || null,
          group: team.group?.name || null,
          description: team.description || null,
        }));
        
        result = {
          success: true,
          data: {
            league: {
              id: firstEntry.league.id,
              name: firstEntry.league.name,
              logo: firstEntry.league.logo,
              country: firstEntry.country?.name || 'USA',
              season,
            },
            standings,
          },
        };
        break;
      }
      
      case 'hockey':
      case 'nhl': {
        const response = await apiProvider.getHockeyStandings({
          league,
          season: parseInt(season),
        });
        
        if (!response.success || !response.data || response.data.length === 0) {
          result = { success: false, data: null, error: response.error || 'No standings found' };
          break;
        }
        
        const allStandings = response.data.flat();
        const firstEntry = allStandings[0];
        
        const standings: StandingEntry[] = allStandings.map((team) => ({
          position: team.position,
          teamId: team.team.id,
          teamName: team.team.name,
          teamLogo: team.team.logo,
          played: team.games.played,
          won: team.games.win.total,
          drawn: 0,
          lost: team.games.lose.total,
          goalsFor: team.points.for,
          goalsAgainst: team.points.against,
          goalDiff: team.points.for - team.points.against,
          points: team.games.win.total,
          form: team.form || null,
          group: team.group?.name || null,
          description: team.description || null,
        }));
        
        result = {
          success: true,
          data: {
            league: {
              id: firstEntry.league.id,
              name: firstEntry.league.name,
              logo: firstEntry.league.logo,
              country: firstEntry.country?.name || 'USA',
              season: String(season),
            },
            standings,
          },
        };
        break;
      }
      
      case 'nfl':
      case 'american_football': {
        const response = await apiProvider.getNFLStandings({
          league,
          season: parseInt(season),
        });
        
        if (!response.success || !response.data || response.data.length === 0) {
          result = { success: false, data: null, error: response.error || 'No standings found' };
          break;
        }
        
        const allStandings = response.data.flat();
        const firstEntry = allStandings[0];
        
        const standings: StandingEntry[] = allStandings.map((team) => ({
          position: team.position,
          teamId: team.team.id,
          teamName: team.team.name,
          teamLogo: team.team.logo,
          played: team.won + team.lost + team.ties,
          won: team.won,
          drawn: team.ties,
          lost: team.lost,
          goalsFor: team.points.for,
          goalsAgainst: team.points.against,
          goalDiff: team.points.for - team.points.against,
          points: team.won,
          form: null,
          group: team.division || null,
          description: null,
        }));
        
        result = {
          success: true,
          data: {
            league: {
              id: firstEntry.league.id,
              name: firstEntry.league.name,
              logo: firstEntry.league.logo,
              country: 'USA',
              season: String(season),
            },
            standings,
          },
        };
        break;
      }
      
      default:
        return NextResponse.json(
          { success: false, data: null, error: `Unsupported sport: ${sport}` },
          { status: 400 }
        );
    }
    
    // Cache successful results
    if (result.success) {
      standingsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}

function getCurrentSeason(sport: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  switch (sport) {
    case 'soccer':
    case 'football':
      // Soccer season runs Aug-May, use year when season started
      return month >= 7 ? String(year) : String(year - 1);
    case 'basketball':
    case 'nba':
      // NBA runs Oct-June, format: "2024-2025"
      return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    case 'hockey':
    case 'nhl':
      // NHL runs Oct-June
      return month >= 9 ? String(year) : String(year - 1);
    case 'nfl':
    case 'american_football':
      // NFL runs Sep-Feb
      return month >= 8 ? String(year) : String(year - 1);
    default:
      return String(year);
  }
}
