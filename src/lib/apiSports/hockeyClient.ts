/**
 * Hockey API Client (API-Sports)
 * 
 * Fetches NHL and other hockey league data
 * Uses same API key as football API
 */

const API_KEY = process.env.API_FOOTBALL_KEY || '';
const BASE_URL = 'https://v1.hockey.api-sports.io';

// ============================================
// TYPES
// ============================================

export interface HockeyTeam {
  id: number;
  name: string;
  logo: string;
}

export interface HockeyLeague {
  id: number;
  name: string;
  type: string;
  logo: string;
  season: number;
  country: {
    name: string;
    code: string;
    flag: string;
  };
}

export interface HockeyGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  week: string | null;
  timer: string | null;
  status: {
    long: string;
    short: string;
  };
  league: HockeyLeague;
  country: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
  teams: {
    home: HockeyTeam;
    away: HockeyTeam;
  };
  scores: {
    home: number | null;
    away: number | null;
  };
  periods: {
    first: { home: number | null; away: number | null };
    second: { home: number | null; away: number | null };
    third: { home: number | null; away: number | null };
    overtime: { home: number | null; away: number | null } | null;
    penalties: { home: number | null; away: number | null } | null;
  };
  events: boolean;
}

export interface HockeyStanding {
  position: number;
  stage: string;
  group: {
    name: string;
  };
  team: HockeyTeam;
  league: HockeyLeague;
  country: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
  games: {
    played: number;
  };
  points: number;
  form: string | null;
  win: {
    total: number;
    percentage: string;
    overtime: number;
  };
  lose: {
    total: number;
    percentage: string;
    overtime: number;
  };
  goals: {
    for: number;
    against: number;
  };
  description: string | null;
}

export interface HockeyTeamStats {
  team: HockeyTeam;
  country: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
  league: HockeyLeague;
  games: {
    played: { home: number; away: number; all: number };
  };
  wins: {
    home: { total: number; percentage: string };
    away: { total: number; percentage: string };
    all: { total: number; percentage: string };
  };
  loses: {
    home: { total: number; percentage: string };
    away: { total: number; percentage: string };
    all: { total: number; percentage: string };
  };
  goals: {
    for: {
      total: { home: number; away: number; all: number };
      average: { home: string; away: string; all: string };
    };
    against: {
      total: { home: number; away: number; all: number };
      average: { home: string; away: string; all: string };
    };
  };
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchHockey<T>(endpoint: string, params: Record<string, string | number>): Promise<T | null> {
  if (!API_KEY) {
    console.error('Hockey API: No API key configured');
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
      console.error(`Hockey API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.response as T;
  } catch (error) {
    console.error('Hockey API fetch error:', error);
    return null;
  }
}

/**
 * Get upcoming hockey games
 */
export async function getHockeyGames(
  leagueId: number,
  season: number,
  options?: { date?: string; next?: number }
): Promise<HockeyGame[]> {
  const params: Record<string, string | number> = {
    league: leagueId,
    season,
  };

  if (options?.date) params.date = options.date;
  if (options?.next) params.next = options.next;

  const games = await fetchHockey<HockeyGame[]>('/games', params);
  return games || [];
}

/**
 * Get hockey standings
 */
export async function getHockeyStandings(
  leagueId: number,
  season: number
): Promise<HockeyStanding[][]> {
  const standings = await fetchHockey<HockeyStanding[][]>('/standings', {
    league: leagueId,
    season,
  });
  return standings || [];
}

/**
 * Get team statistics for a season
 */
export async function getHockeyTeamStats(
  teamId: number,
  leagueId: number,
  season: number
): Promise<HockeyTeamStats | null> {
  const stats = await fetchHockey<HockeyTeamStats[]>('/teams/statistics', {
    team: teamId,
    league: leagueId,
    season,
  });
  return stats?.[0] || null;
}

/**
 * Get head-to-head history between two teams
 */
export async function getHockeyH2H(
  team1Id: number,
  team2Id: number
): Promise<HockeyGame[]> {
  const h2h = await fetchHockey<HockeyGame[]>('/games/h2h', {
    h2h: `${team1Id}-${team2Id}`,
  });
  return h2h || [];
}

/**
 * Search for hockey team by name
 */
export async function searchHockeyTeam(
  name: string,
  leagueId?: number
): Promise<HockeyTeam[]> {
  const params: Record<string, string | number> = { search: name };
  if (leagueId) params.league = leagueId;
  
  const teams = await fetchHockey<Array<{ id: number; name: string; logo: string }>>('/teams', params);
  return teams || [];
}

// ============================================
// LEAGUE ID MAPPINGS  
// ============================================

export const HOCKEY_LEAGUES = {
  // NHL
  NHL: 57,
  // KHL (Russia)
  KHL: 50,
  // SHL (Sweden)
  SHL: 135,
  // Liiga (Finland)
  LIIGA: 62,
  // AHL (American Hockey League)
  AHL: 58,
  // DEL (Germany)
  DEL: 73,
} as const;

/**
 * Get current hockey season year
 * NHL season: October to June
 */
export function getCurrentHockeySeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // If before October, it's the previous year's season
  if (month < 10) {
    return year - 1;
  }
  return year;
}
