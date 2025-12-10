/**
 * Basketball API Client (API-Sports)
 * 
 * Fetches NBA, EuroLeague, and other basketball data
 * Uses same API key as football API
 */

const API_KEY = process.env.API_FOOTBALL_KEY || '';
const BASE_URL = 'https://v1.basketball.api-sports.io';

// ============================================
// TYPES
// ============================================

export interface BasketballTeam {
  id: number;
  name: string;
  logo: string;
}

export interface BasketballLeague {
  id: number;
  name: string;
  type: string;
  season: string;
  logo: string;
}

export interface BasketballGame {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  stage: string | null;
  week: string | null;
  status: {
    long: string;
    short: string;
    timer: string | null;
  };
  league: BasketballLeague;
  country: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
  teams: {
    home: BasketballTeam;
    away: BasketballTeam;
  };
  scores: {
    home: {
      quarter_1: number | null;
      quarter_2: number | null;
      quarter_3: number | null;
      quarter_4: number | null;
      over_time: number | null;
      total: number | null;
    };
    away: {
      quarter_1: number | null;
      quarter_2: number | null;
      quarter_3: number | null;
      quarter_4: number | null;
      over_time: number | null;
      total: number | null;
    };
  };
}

export interface BasketballStanding {
  position: number;
  stage: string;
  group: {
    name: string;
    points: number | null;
  };
  team: BasketballTeam;
  league: BasketballLeague;
  country: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
  games: {
    played: number;
    win: { total: number; percentage: string };
    lose: { total: number; percentage: string };
  };
  points: {
    for: number;
    against: number;
  };
  form: string | null;
  description: string | null;
}

export interface BasketballTeamStats {
  team: BasketballTeam;
  statistics: {
    games: {
      played: { home: number; away: number; all: number };
      wins: { home: { total: number; percentage: string }; away: { total: number; percentage: string }; all: { total: number; percentage: string } };
      loses: { home: { total: number; percentage: string }; away: { total: number; percentage: string }; all: { total: number; percentage: string } };
    };
    points: {
      for: { total: { home: number; away: number; all: number }; average: { home: string; away: string; all: string } };
      against: { total: { home: number; away: number; all: number }; average: { home: string; away: string; all: string } };
    };
  } | null;
}

export interface BasketballH2H {
  games: BasketballGame[];
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchBasketball<T>(endpoint: string, params: Record<string, string | number>): Promise<T | null> {
  if (!API_KEY) {
    console.error('Basketball API: No API key configured');
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
      console.error(`Basketball API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.response as T;
  } catch (error) {
    console.error('Basketball API fetch error:', error);
    return null;
  }
}

/**
 * Get upcoming basketball games for a league
 */
export async function getBasketballGames(
  leagueId: number,
  season: string,
  options?: { date?: string; next?: number }
): Promise<BasketballGame[]> {
  const params: Record<string, string | number> = {
    league: leagueId,
    season,
  };

  if (options?.date) params.date = options.date;
  if (options?.next) params.next = options.next;

  const games = await fetchBasketball<BasketballGame[]>('/games', params);
  return games || [];
}

/**
 * Get league standings
 */
export async function getBasketballStandings(
  leagueId: number,
  season: string
): Promise<BasketballStanding[][]> {
  const standings = await fetchBasketball<BasketballStanding[][]>('/standings', {
    league: leagueId,
    season,
  });
  return standings || [];
}

/**
 * Get team statistics for a season
 */
export async function getBasketballTeamStats(
  teamId: number,
  leagueId: number,
  season: string
): Promise<BasketballTeamStats | null> {
  const stats = await fetchBasketball<BasketballTeamStats[]>('/teams/statistics', {
    team: teamId,
    league: leagueId,
    season,
  });
  return stats?.[0] || null;
}

/**
 * Get head-to-head history between two teams
 */
export async function getBasketballH2H(
  team1Id: number,
  team2Id: number
): Promise<BasketballGame[]> {
  const h2h = await fetchBasketball<BasketballGame[]>('/games/h2h', {
    h2h: `${team1Id}-${team2Id}`,
  });
  return h2h || [];
}

/**
 * Search for team by name
 */
export async function searchBasketballTeam(
  name: string,
  leagueId?: number
): Promise<BasketballTeam[]> {
  const params: Record<string, string | number> = { search: name };
  if (leagueId) params.league = leagueId;
  
  const teams = await fetchBasketball<Array<{ id: number; name: string; logo: string }>>('/teams', params);
  return teams || [];
}

/**
 * Get all available basketball leagues
 */
export async function getBasketballLeagues(): Promise<BasketballLeague[]> {
  const leagues = await fetchBasketball<Array<{ id: number; name: string; type: string; logo: string }>>('/leagues', {});
  return (leagues || []).map(l => ({
    ...l,
    season: '',
  }));
}

// ============================================
// LEAGUE ID MAPPINGS
// ============================================

export const BASKETBALL_LEAGUES = {
  // NBA
  NBA: 12,
  // EuroLeague
  EUROLEAGUE: 120,
  // NCAA
  NCAA: 116,
  // Other major leagues
  ACB_SPAIN: 117,
  LEGA_ITALY: 90,
  PRO_A_FRANCE: 62,
  BBL_GERMANY: 72,
} as const;

/**
 * Get current basketball season string
 * NBA season format: "2024-2025"
 */
export function getCurrentBasketballSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // NBA season starts in October
  if (month >= 10) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}
