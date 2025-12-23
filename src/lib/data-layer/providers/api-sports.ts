/**
 * API-Sports Provider
 * 
 * Low-level client for all API-Sports family endpoints.
 * This handles the raw API calls - adapters use this to fetch data
 * and transform it into normalized formats.
 */

export interface APISportsConfig {
  apiKey: string;
}

// API-Sports base URLs
export const API_SPORTS_URLS = {
  soccer: 'https://v3.football.api-sports.io',
  basketball: 'https://v1.basketball.api-sports.io',
  hockey: 'https://v1.hockey.api-sports.io',
  american_football: 'https://v1.american-football.api-sports.io',
  baseball: 'https://v1.baseball.api-sports.io',
} as const;

// League IDs
export const LEAGUE_IDS = {
  // Soccer - Top Divisions
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  BUNDESLIGA: 78,
  SERIE_A: 135,
  LIGUE_1: 61,
  MLS: 253,
  CHAMPIONS_LEAGUE: 2,
  EUROPA_LEAGUE: 3,
  // Soccer - Second Divisions
  CHAMPIONSHIP: 40,      // England
  LA_LIGA_2: 141,        // Spain Segunda
  BUNDESLIGA_2: 79,      // Germany
  SERIE_B: 136,          // Italy
  LIGUE_2: 62,           // France
  
  // Basketball
  NBA: 12,
  EUROLEAGUE: 120,
  
  // Hockey
  NHL: 57,
  
  // American Football
  NFL: 1,
  NCAA_FOOTBALL: 2,
  
  // Baseball
  MLB: 1,
} as const;

/**
 * API-Sports Provider Class
 */
export class APISportsProvider {
  private apiKey: string;
  
  constructor(config: APISportsConfig) {
    this.apiKey = config.apiKey;
  }
  
  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  /**
   * Get headers for API-Sports requests
   */
  private getHeaders(): Record<string, string> {
    return {
      'x-apisports-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }
  
  /**
   * Generic request method
   */
  async request<T>(baseUrl: string, endpoint: string, params?: Record<string, string | number>): Promise<APISportsResponse<T>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'API key not configured',
      };
    }
    
    const url = new URL(`${baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    try {
      const response = await fetch(url.toString(), {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      
      const data = await response.json();
      
      // API-Sports returns errors in a specific format
      if (data.errors && Object.keys(data.errors).length > 0) {
        return {
          success: false,
          error: JSON.stringify(data.errors),
        };
      }
      
      return {
        success: true,
        data: data.response as T,
        results: data.results,
        paging: data.paging,
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  // ============================================================================
  // Soccer Endpoints
  // ============================================================================
  
  async getSoccerTeams(params: { league?: number; season?: number; name?: string; search?: string; id?: number }) {
    return this.request<SoccerTeamResponse[]>(
      API_SPORTS_URLS.soccer,
      '/teams',
      params as Record<string, string | number>
    );
  }
  
  async getSoccerFixtures(params: { 
    league?: number; 
    season?: number; 
    team?: number; 
    date?: string;
    from?: string;
    to?: string;
    last?: number;
    next?: number;
  }) {
    return this.request<SoccerFixtureResponse[]>(
      API_SPORTS_URLS.soccer,
      '/fixtures',
      params as Record<string, string | number>
    );
  }
  
  async getSoccerTeamStats(params: { league: number; season: number; team: number }) {
    return this.request<SoccerTeamStatsResponse>(
      API_SPORTS_URLS.soccer,
      '/teams/statistics',
      params as Record<string, string | number>
    );
  }
  
  async getSoccerH2H(params: { h2h: string; last?: number }) {
    return this.request<SoccerFixtureResponse[]>(
      API_SPORTS_URLS.soccer,
      '/fixtures/headtohead',
      params as Record<string, string | number>
    );
  }
  
  async getSoccerInjuries(params: { league?: number; season?: number; team?: number; fixture?: number }) {
    return this.request<SoccerInjuryResponse[]>(
      API_SPORTS_URLS.soccer,
      '/injuries',
      params as Record<string, string | number>
    );
  }
  
  // ============================================================================
  // Basketball Endpoints
  // ============================================================================
  
  async getBasketballTeams(params: { league?: number; season?: string; name?: string; id?: number }) {
    return this.request<BasketballTeamResponse[]>(
      API_SPORTS_URLS.basketball,
      '/teams',
      params as Record<string, string | number>
    );
  }
  
  async getBasketballGames(params: {
    league?: number;
    season?: string;
    team?: number;
    date?: string;
    h2h?: string;
  }) {
    return this.request<BasketballGameResponse[]>(
      API_SPORTS_URLS.basketball,
      '/games',
      params as Record<string, string | number>
    );
  }
  
  async getBasketballStandings(params: { league: number; season: string }) {
    return this.request<BasketballStandingsResponse[][]>(
      API_SPORTS_URLS.basketball,
      '/standings',
      params as Record<string, string | number>
    );
  }
  
  async getBasketballTeamStats(params: { league: number; season: string; team: number }) {
    return this.request<BasketballTeamStatsResponse>(
      API_SPORTS_URLS.basketball,
      '/statistics',
      params as Record<string, string | number>
    );
  }
  
  async getBasketballPlayers(params: { team: number; season: string }) {
    return this.request<BasketballPlayerResponse[]>(
      API_SPORTS_URLS.basketball,
      '/players',
      params as Record<string, string | number>
    );
  }
  
  // ============================================================================
  // Hockey Endpoints
  // ============================================================================
  
  async getHockeyTeams(params: { league?: number; season?: number; name?: string; id?: number }) {
    return this.request<HockeyTeamResponse[]>(
      API_SPORTS_URLS.hockey,
      '/teams',
      params as Record<string, string | number>
    );
  }
  
  async getHockeyGames(params: {
    league?: number;
    season?: number;
    team?: number;
    date?: string;
    h2h?: string;
  }) {
    return this.request<HockeyGameResponse[]>(
      API_SPORTS_URLS.hockey,
      '/games',
      params as Record<string, string | number>
    );
  }
  
  async getHockeyStandings(params: { league: number; season: number }) {
    return this.request<HockeyStandingsResponse[][]>(
      API_SPORTS_URLS.hockey,
      '/standings',
      params as Record<string, string | number>
    );
  }
  
  async getHockeyTeamStats(params: { league: number; season: number; team: number }) {
    return this.request<HockeyTeamStatsResponse>(
      API_SPORTS_URLS.hockey,
      '/teams/statistics',
      params as Record<string, string | number>
    );
  }
  
  async getHockeyPlayers(params: { team: number; season: number }) {
    return this.request<HockeyPlayerResponse[]>(
      API_SPORTS_URLS.hockey,
      '/players',
      params as Record<string, string | number>
    );
  }
  
  // ============================================================================
  // American Football Endpoints
  // ============================================================================
  
  async getNFLTeams(params: { league?: number; season?: number; name?: string; id?: number }) {
    return this.request<NFLTeamResponse[]>(
      API_SPORTS_URLS.american_football,
      '/teams',
      params as Record<string, string | number>
    );
  }
  
  async getNFLGames(params: {
    league?: number;
    season?: number;
    team?: number;
    date?: string;
    h2h?: string;
  }) {
    return this.request<NFLGameResponse[]>(
      API_SPORTS_URLS.american_football,
      '/games',
      params as Record<string, string | number>
    );
  }
  
  async getNFLStandings(params: { league: number; season: number }) {
    return this.request<NFLStandingsResponse[][]>(
      API_SPORTS_URLS.american_football,
      '/standings',
      params as Record<string, string | number>
    );
  }
  
  async getNFLPlayers(params: { team: number; season: number }) {
    return this.request<NFLPlayerResponse[]>(
      API_SPORTS_URLS.american_football,
      '/players',
      params as Record<string, string | number>
    );
  }
}

// ============================================================================
// Response Types
// ============================================================================

export interface APISportsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  results?: number;
  paging?: {
    current: number;
    total: number;
  };
}

// Soccer Types
export interface SoccerTeamResponse {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
  };
}

export interface SoccerFixtureResponse {
  fixture: {
    id: number;
    referee: string;
    timezone: string;
    date: string;
    timestamp: number;
    venue: { id: number; name: string; city: string };
    status: { long: string; short: string; elapsed: number };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface SoccerTeamStatsResponse {
  league: { id: number; name: string; country: string; logo: string; flag: string; season: number };
  team: { id: number; name: string; logo: string };
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { total: { home: number; away: number; total: number }; average: { home: string; away: string; total: string } };
    against: { total: { home: number; away: number; total: number }; average: { home: string; away: string; total: string } };
  };
  biggest: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string; away: string };
    loses: { home: string; away: string };
    goals: { for: { home: number; away: number }; against: { home: number; away: number } };
  };
  clean_sheet: { home: number; away: number; total: number };
  failed_to_score: { home: number; away: number; total: number };
}

export interface SoccerInjuryResponse {
  player: { id: number; name: string; photo: string; type: string; reason: string };
  team: { id: number; name: string; logo: string };
  fixture: { id: number; timezone: string; date: string; timestamp: number };
  league: { id: number; season: number; name: string; country: string; logo: string; flag: string };
}

// Basketball Types
export interface BasketballTeamResponse {
  id: number;
  name: string;
  logo: string;
  national: boolean;
  country: { id: number; name: string; code: string; flag: string };
}

export interface BasketballGameResponse {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  stage: string | null;
  week: string | null;
  status: { long: string; short: string; timer: string | null };
  league: { id: number; name: string; type: string; season: string; logo: string };
  country: { id: number; name: string; code: string; flag: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  scores: {
    home: { quarter_1: number | null; quarter_2: number | null; quarter_3: number | null; quarter_4: number | null; over_time: number | null; total: number | null };
    away: { quarter_1: number | null; quarter_2: number | null; quarter_3: number | null; quarter_4: number | null; over_time: number | null; total: number | null };
  };
}

export interface BasketballStandingsResponse {
  position: number;
  stage: string;
  group: { name: string; points: number | null };
  team: { id: number; name: string; logo: string };
  league: { id: number; name: string; type: string; season: string; logo: string };
  country: { id: number; name: string; code: string; flag: string };
  games: { played: number; win: { total: number; percentage: string }; lose: { total: number; percentage: string } };
  points: { for: number; against: number };
  form: string | null;
  description: string | null;
}

export interface BasketballTeamStatsResponse {
  team: { id: number; name: string; logo: string };
  league: { id: number; name: string; type: string; season: string; logo: string };
  country: { id: number; name: string; code: string; flag: string };
  games: { played: { home: number; away: number; all: number }; wins: { home: { total: number; percentage: string }; away: { total: number; percentage: string }; all: { total: number; percentage: string } }; loses: { home: { total: number; percentage: string }; away: { total: number; percentage: string }; all: { total: number; percentage: string } } };
  points: { for: { total: { home: number; away: number; all: number }; average: { home: string; away: string; all: string } }; against: { total: { home: number; away: number; all: number }; average: { home: string; away: string; all: string } } };
}

// Hockey Types
export interface HockeyTeamResponse {
  id: number;
  name: string;
  logo: string;
  national: boolean;
  country: { id: number; name: string; code: string; flag: string };
}

export interface HockeyGameResponse {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  week: string | null;
  status: { long: string; short: string };
  league: { id: number; name: string; type: string; season: number; logo: string };
  country: { id: number; name: string; code: string; flag: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  scores: {
    home: number | null;
    away: number | null;
  };
  periods: {
    first: { home: number | null; away: number | null };
    second: { home: number | null; away: number | null };
    third: { home: number | null; away: number | null };
    overtime: { home: number | null; away: number | null };
    penalties: { home: number | null; away: number | null };
  };
}

export interface HockeyStandingsResponse {
  position: number;
  stage: string;
  group: { name: string };
  team: { id: number; name: string; logo: string };
  league: { id: number; name: string; type: string; season: number; logo: string };
  country: { id: number; name: string; code: string; flag: string };
  games: { played: number; win: { total: number; percentage: string }; lose: { total: number; percentage: string } };
  points: { for: number; against: number };
  form: string | null;
  description: string | null;
}

export interface HockeyTeamStatsResponse {
  team: { id: number; name: string; logo: string };
  league: { id: number; name: string; type: string; season: number; logo: string };
  country: { id: number; name: string; code: string; flag: string };
  games: { played: number; wins: { total: number; percentage: string }; loses: { total: number; percentage: string } };
  goals: { for: number; against: number };
}

// NFL Types
export interface NFLTeamResponse {
  id: number;
  name: string;
  code: string;
  city: string;
  coach: string;
  owner: string;
  stadium: string;
  established: number;
  logo: string;
  country: { name: string; code: string; flag: string };
}

export interface NFLGameResponse {
  game: {
    id: number;
    stage: string;
    week: string;
    date: { timezone: string; date: string; time: string; timestamp: number };
    venue: { name: string; city: string };
    status: { short: string; long: string; timer: string | null };
  };
  league: { id: number; name: string; season: number; logo: string; country: { name: string; code: string; flag: string } };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  scores: {
    home: { quarter_1: number | null; quarter_2: number | null; quarter_3: number | null; quarter_4: number | null; overtime: number | null; total: number | null };
    away: { quarter_1: number | null; quarter_2: number | null; quarter_3: number | null; quarter_4: number | null; overtime: number | null; total: number | null };
  };
}

export interface NFLStandingsResponse {
  position: number;
  team: { id: number; name: string; logo: string };
  league: { id: number; name: string; season: number; logo: string };
  country: { name: string; code: string; flag: string };
  division: string;
  won: number;
  lost: number;
  ties: number;
  points: { for: number; against: number; difference: number };
  records: { home: string; road: string; conference: string; division: string };
  streak: string | null;
}

// ============================================================================
// Player Response Types
// ============================================================================

export interface BasketballPlayerResponse {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  birth: { date: string | null; country: string | null };
  nationality: string | null;
  height: { feets: string | null; inches: string | null; meters: string | null };
  weight: { pounds: string | null; kilograms: string | null };
  college: string | null;
  affiliation: string | null;
  leagues: {
    standard?: { jersey: number | null; active: boolean; pos: string | null };
    [key: string]: { jersey: number | null; active: boolean; pos: string | null } | undefined;
  };
}

export interface HockeyPlayerResponse {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number | null;
  birth: { date: string | null; place: string | null; country: string | null };
  nationality: string | null;
  height: string | null;
  weight: string | null;
  number: number | null;
  position: string | null;
  captain: boolean;
  photo: string | null;
}

export interface NFLPlayerResponse {
  id: number;
  name: string;
  age: number | null;
  height: string | null;
  weight: string | null;
  college: string | null;
  group: string | null;   // "Offense", "Defense", "Special Teams"
  position: string | null;
  number: number | null;
  salary: string | null;
  experience: string | null;
  image: string | null;
}

// ============================================================================
// Singleton Export
// ============================================================================

let providerInstance: APISportsProvider | null = null;

export function getAPISportsProvider(): APISportsProvider {
  if (!providerInstance) {
    const apiKey = process.env.API_FOOTBALL_KEY || '';
    console.log(`[API-Sports] Initializing provider, API key configured: ${!!apiKey} (length: ${apiKey.length})`);
    providerInstance = new APISportsProvider({ apiKey });
  }
  return providerInstance;
}
