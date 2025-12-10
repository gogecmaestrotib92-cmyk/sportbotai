/**
 * American Football API Client (API-Sports)
 * 
 * Fetches NFL and college football data
 * Uses same API key as football API
 */

const API_KEY = process.env.API_FOOTBALL_KEY || '';
const BASE_URL = 'https://v1.american-football.api-sports.io';

// ============================================
// TYPES
// ============================================

export interface NFLTeam {
  id: number;
  name: string;
  logo: string;
}

export interface NFLLeague {
  id: number;
  name: string;
  season: number;
  logo: string;
  country: {
    name: string;
    code: string;
    flag: string;
  };
}

export interface NFLGame {
  game: {
    id: number;
    stage: string;
    week: string;
    date: {
      timezone: string;
      date: string;
      time: string;
      timestamp: number;
    };
    venue: {
      name: string;
      city: string;
    };
    status: {
      short: string;
      long: string;
      timer: string | null;
    };
  };
  league: NFLLeague;
  teams: {
    home: NFLTeam & { 
      score?: { // Changed to optional with ? 
        total: number | null; 
      } 
    };
    away: NFLTeam & { 
      score?: { // Changed to optional with ?
        total: number | null; 
      } 
    };
  };
  scores: {
    home: {
      quarter_1: number | null;
      quarter_2: number | null;
      quarter_3: number | null;
      quarter_4: number | null;
      overtime: number | null;
      total: number | null;
    };
    away: {
      quarter_1: number | null;
      quarter_2: number | null;
      quarter_3: number | null;
      quarter_4: number | null;
      overtime: number | null;
      total: number | null;
    };
  };
}

export interface NFLStanding {
  position: number;
  team: NFLTeam;
  won: number;
  lost: number;
  ties: number;
  points: {
    for: number;
    against: number;
    difference: number;
  };
  records: {
    home: string;
    road: string;
    conference: string;
    division: string;
  };
  streak: string;
  group: {
    name: string;
    conference: string;
    division: string;
  };
}

export interface NFLTeamStats {
  team: NFLTeam;
  games: number;
  yards: {
    total: number;
    play: number;
    pass: number;
    rush: number;
  };
  passing: {
    attempts: number;
    completions: number;
    yards: number;
    touchdowns: number;
    interceptions: number;
  };
  rushing: {
    attempts: number;
    yards: number;
    touchdowns: number;
  };
  penalties: {
    total: number;
    yards: number;
  };
  turnovers: {
    total: number;
  };
  first_downs: number;
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchNFL<T>(endpoint: string, params: Record<string, string | number>): Promise<T | null> {
  if (!API_KEY) {
    console.error('NFL API: No API key configured');
    return null;
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': API_KEY,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`NFL API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.response as T;
  } catch (error) {
    console.error('NFL API fetch error:', error);
    return null;
  }
}

/**
 * Get upcoming NFL games
 */
export async function getNFLGames(
  leagueId: number,
  season: number,
  options?: { date?: string; week?: string; next?: number }
): Promise<NFLGame[]> {
  const params: Record<string, string | number> = {
    league: leagueId,
    season,
  };

  if (options?.date) params.date = options.date;
  if (options?.week) params.week = options.week;
  if (options?.next) params.next = options.next;

  const games = await fetchNFL<NFLGame[]>('/games', params);
  return games || [];
}

/**
 * Get NFL standings
 */
export async function getNFLStandings(
  leagueId: number,
  season: number
): Promise<NFLStanding[]> {
  const standings = await fetchNFL<NFLStanding[]>('/standings', {
    league: leagueId,
    season,
  });
  return standings || [];
}

/**
 * Get team statistics for a season
 */
export async function getNFLTeamStats(
  teamId: number,
  season: number
): Promise<NFLTeamStats | null> {
  const stats = await fetchNFL<NFLTeamStats[]>('/teams/statistics', {
    id: teamId,
    season,
  });
  return stats?.[0] || null;
}

/**
 * Get head-to-head history between two teams
 */
export async function getNFLH2H(
  team1Id: number,
  team2Id: number
): Promise<NFLGame[]> {
  const h2h = await fetchNFL<NFLGame[]>('/games/h2h', {
    h2h: `${team1Id}-${team2Id}`,
  });
  return h2h || [];
}

/**
 * Search for NFL team by name
 */
export async function searchNFLTeam(
  name: string,
  leagueId?: number
): Promise<NFLTeam[]> {
  const params: Record<string, string | number> = { search: name };
  if (leagueId) params.league = leagueId;
  
  const teams = await fetchNFL<Array<{ id: number; name: string; logo: string }>>('/teams', params);
  return teams || [];
}

// ============================================
// LEAGUE ID MAPPINGS
// ============================================

export const NFL_LEAGUES = {
  NFL: 1,
  NCAA: 2, // College Football
} as const;

/**
 * Get current NFL season year
 * NFL season: September to February
 */
export function getCurrentNFLSeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // If before September, it's the previous year's season
  if (month < 9) {
    return year - 1;
  }
  return year;
}

/**
 * Get current NFL week (approximate)
 */
export function getCurrentNFLWeek(): string {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 5); // Sept 5 approx
  
  if (now < seasonStart) return '1';
  
  const weeks = Math.ceil((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return String(Math.min(weeks, 18)); // Regular season is 18 weeks
}
