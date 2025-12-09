/**
 * API-Sports Multi-Sport Integration
 * 
 * Unified client for API-Sports family:
 * - API-Football (Soccer)
 * - API-Basketball (NBA, EuroLeague, etc.)
 * - API-American-Football (NFL)
 * - API-Hockey (NHL)
 * - API-Baseball (MLB)
 * 
 * All use the same API key from api-sports.io
 * Free tier: 100 requests/day (shared across all sports)
 * 
 * Dashboard: https://dashboard.api-football.com/
 */

import { FormMatch, HeadToHeadMatch, TeamStats } from '@/types';

// ============================================
// API ENDPOINTS BY SPORT
// ============================================

const API_BASES: Record<string, string> = {
  soccer: 'https://v3.football.api-sports.io',
  basketball: 'https://v1.basketball.api-sports.io',
  american_football: 'https://v1.american-football.api-sports.io',
  hockey: 'https://v1.hockey.api-sports.io',
  baseball: 'https://v1.baseball.api-sports.io',
};

// Map common sport names to API-Sports sport keys
const SPORT_MAPPING: Record<string, string> = {
  // Soccer variants
  'soccer': 'soccer',
  'football': 'soccer',
  'soccer_epl': 'soccer',
  'soccer_spain_la_liga': 'soccer',
  'soccer_germany_bundesliga': 'soccer',
  'soccer_italy_serie_a': 'soccer',
  'soccer_france_ligue_one': 'soccer',
  'soccer_uefa_champs_league': 'soccer',
  
  // Basketball variants
  'basketball': 'basketball',
  'basketball_nba': 'basketball',
  'basketball_euroleague': 'basketball',
  'basketball_ncaab': 'basketball',
  
  // American Football
  'americanfootball': 'american_football',
  'americanfootball_nfl': 'american_football',
  'americanfootball_ncaaf': 'american_football',
  
  // Hockey
  'hockey': 'hockey',
  'icehockey': 'hockey',
  'icehockey_nhl': 'hockey',
  
  // Baseball
  'baseball': 'baseball',
  'baseball_mlb': 'baseball',
};

// ============================================
// TYPES
// ============================================

interface GameResult {
  result: 'W' | 'D' | 'L';
  score: string;
  opponent: string;
  date: string;
  home: boolean;
}

interface H2HMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

interface TeamSeasonStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws?: number;
  pointsFor: number;
  pointsAgainst: number;
  winPercentage?: number;
}

export interface MultiSportEnrichedData {
  sport: string;
  homeForm: FormMatch[] | null;
  awayForm: FormMatch[] | null;
  headToHead: HeadToHeadMatch[] | null;
  h2hSummary: {
    totalMatches: number;
    homeWins: number;
    awayWins: number;
    draws: number;
  } | null;
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
  dataSource: 'API_SPORTS' | 'CACHE' | 'UNAVAILABLE';
}

// ============================================
// CACHE
// ============================================

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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

// ============================================
// API REQUEST HELPER
// ============================================

async function apiRequest<T>(baseUrl: string, endpoint: string): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY; // Same key works for all sports
  
  if (!apiKey) {
    console.warn('API_FOOTBALL_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    if (!response.ok) {
      console.error(`API-Sports error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API-Sports request failed:', error);
    return null;
  }
}

// ============================================
// SPORT DETECTION
// ============================================

function getSportKey(sportInput: string): string | null {
  const normalized = sportInput.toLowerCase().replace(/[^a-z_]/g, '_');
  
  // Direct match
  if (SPORT_MAPPING[normalized]) {
    return SPORT_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(SPORT_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  return null;
}

function getApiBase(sportKey: string): string | null {
  return API_BASES[sportKey] || null;
}

// ============================================
// SOCCER FUNCTIONS
// ============================================

async function findSoccerTeam(teamName: string, baseUrl: string): Promise<number | null> {
  const cacheKey = `soccer:team:${teamName}`;
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(teamName)}`);
  
  if (response?.response?.length > 0) {
    const teamId = response.response[0].team.id;
    setCache(cacheKey, teamId);
    return teamId;
  }
  
  return null;
}

async function getSoccerTeamFixtures(teamId: number, baseUrl: string): Promise<GameResult[]> {
  const cacheKey = `soccer:fixtures:${teamId}`;
  const cached = getCached<GameResult[]>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/fixtures?team=${teamId}&last=5`);
  
  if (!response?.response) return [];

  const matches: GameResult[] = response.response.map((fixture: any) => {
    const isHome = fixture.teams.home.id === teamId;
    const teamScore = isHome ? fixture.goals.home : fixture.goals.away;
    const oppScore = isHome ? fixture.goals.away : fixture.goals.home;
    
    let result: 'W' | 'D' | 'L' = 'D';
    if (teamScore > oppScore) result = 'W';
    else if (teamScore < oppScore) result = 'L';

    return {
      result,
      score: `${fixture.goals.home}-${fixture.goals.away}`,
      opponent: isHome ? fixture.teams.away.name : fixture.teams.home.name,
      date: fixture.fixture.date,
      home: isHome,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

async function getSoccerTeamStats(teamId: number, baseUrl: string): Promise<TeamSeasonStats | null> {
  const cacheKey = `soccer:stats:${teamId}`;
  const cached = getCached<TeamSeasonStats>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/teams/statistics?team=${teamId}&season=2024`);
  
  if (!response?.response) return null;

  const stats = response.response;
  const result: TeamSeasonStats = {
    gamesPlayed: stats.fixtures?.played?.total || 0,
    wins: stats.fixtures?.wins?.total || 0,
    losses: stats.fixtures?.loses?.total || 0,
    draws: stats.fixtures?.draws?.total || 0,
    pointsFor: stats.goals?.for?.total?.total || 0,
    pointsAgainst: stats.goals?.against?.total?.total || 0,
  };

  setCache(cacheKey, result);
  return result;
}

async function getSoccerH2H(homeTeamId: number, awayTeamId: number, baseUrl: string): Promise<{ matches: H2HMatch[], summary: any } | null> {
  const cacheKey = `soccer:h2h:${homeTeamId}:${awayTeamId}`;
  const cached = getCached<{ matches: H2HMatch[], summary: any }>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/fixtures/headtohead?h2h=${homeTeamId}-${awayTeamId}&last=10`);
  
  if (!response?.response) return null;

  const fixtures = response.response;
  let homeWins = 0, awayWins = 0, draws = 0;

  const matches: H2HMatch[] = fixtures.slice(0, 5).map((f: any) => {
    const isHomeTeamHome = f.teams.home.id === homeTeamId;
    const homeScore = f.goals.home;
    const awayScore = f.goals.away;

    if (isHomeTeamHome) {
      if (homeScore > awayScore) homeWins++;
      else if (homeScore < awayScore) awayWins++;
      else draws++;
    } else {
      if (awayScore > homeScore) homeWins++;
      else if (awayScore < homeScore) awayWins++;
      else draws++;
    }

    return {
      date: f.fixture.date,
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      homeScore,
      awayScore,
    };
  });

  const result = {
    matches,
    summary: {
      totalMatches: fixtures.length,
      homeWins,
      awayWins,
      draws,
    }
  };

  setCache(cacheKey, result);
  return result;
}

// ============================================
// BASKETBALL FUNCTIONS
// ============================================

async function findBasketballTeam(teamName: string, baseUrl: string): Promise<number | null> {
  const cacheKey = `basketball:team:${teamName}`;
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(teamName)}`);
  
  if (response?.response?.length > 0) {
    const teamId = response.response[0].id;
    setCache(cacheKey, teamId);
    return teamId;
  }
  
  return null;
}

async function getBasketballTeamGames(teamId: number, baseUrl: string): Promise<GameResult[]> {
  const cacheKey = `basketball:games:${teamId}`;
  const cached = getCached<GameResult[]>(cacheKey);
  if (cached) return cached;

  // Get games from current season
  const response = await apiRequest<any>(baseUrl, `/games?team=${teamId}&season=2024-2025&last=5`);
  
  if (!response?.response) return [];

  const games: GameResult[] = response.response.map((game: any) => {
    const isHome = game.teams.home.id === teamId;
    const teamScore = isHome ? game.scores.home.total : game.scores.away.total;
    const oppScore = isHome ? game.scores.away.total : game.scores.home.total;
    
    // Basketball has no draws
    const result: 'W' | 'L' = teamScore > oppScore ? 'W' : 'L';

    return {
      result,
      score: `${game.scores.home.total}-${game.scores.away.total}`,
      opponent: isHome ? game.teams.away.name : game.teams.home.name,
      date: game.date,
      home: isHome,
    };
  });

  setCache(cacheKey, games);
  return games;
}

async function getBasketballTeamStats(teamId: number, baseUrl: string): Promise<TeamSeasonStats | null> {
  const cacheKey = `basketball:stats:${teamId}`;
  const cached = getCached<TeamSeasonStats>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/statistics?team=${teamId}&season=2024-2025`);
  
  if (!response?.response) return null;

  const stats = response.response;
  const gamesPlayed = (stats.games?.played?.all || 0);
  const wins = stats.games?.wins?.all?.total || 0;
  const losses = stats.games?.loses?.all?.total || 0;
  
  const result: TeamSeasonStats = {
    gamesPlayed,
    wins,
    losses,
    pointsFor: stats.points?.for?.total?.all || 0,
    pointsAgainst: stats.points?.against?.total?.all || 0,
    winPercentage: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
  };

  setCache(cacheKey, result);
  return result;
}

async function getBasketballH2H(homeTeamId: number, awayTeamId: number, baseUrl: string): Promise<{ matches: H2HMatch[], summary: any } | null> {
  const cacheKey = `basketball:h2h:${homeTeamId}:${awayTeamId}`;
  const cached = getCached<{ matches: H2HMatch[], summary: any }>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/games?h2h=${homeTeamId}-${awayTeamId}&last=10`);
  
  if (!response?.response || response.response.length === 0) return null;

  const games = response.response;
  let homeWins = 0, awayWins = 0;

  const matches: H2HMatch[] = games.slice(0, 5).map((g: any) => {
    const homeScore = g.scores.home.total;
    const awayScore = g.scores.away.total;
    
    // Check if our "home team" won
    const isHomeTeamHome = g.teams.home.id === homeTeamId;
    if (isHomeTeamHome) {
      if (homeScore > awayScore) homeWins++;
      else awayWins++;
    } else {
      if (awayScore > homeScore) homeWins++;
      else awayWins++;
    }

    return {
      date: g.date,
      homeTeam: g.teams.home.name,
      awayTeam: g.teams.away.name,
      homeScore,
      awayScore,
    };
  });

  const result = {
    matches,
    summary: {
      totalMatches: games.length,
      homeWins,
      awayWins,
      draws: 0, // No draws in basketball
    }
  };

  setCache(cacheKey, result);
  return result;
}

// ============================================
// HOCKEY FUNCTIONS (NHL)
// ============================================

async function findHockeyTeam(teamName: string, baseUrl: string): Promise<number | null> {
  const cacheKey = `hockey:team:${teamName}`;
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(teamName)}`);
  
  if (response?.response?.length > 0) {
    const teamId = response.response[0].id;
    setCache(cacheKey, teamId);
    return teamId;
  }
  
  return null;
}

async function getHockeyTeamGames(teamId: number, baseUrl: string): Promise<GameResult[]> {
  const cacheKey = `hockey:games:${teamId}`;
  const cached = getCached<GameResult[]>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/games?team=${teamId}&season=2024&last=5`);
  
  if (!response?.response) return [];

  const games: GameResult[] = response.response.map((game: any) => {
    const isHome = game.teams.home.id === teamId;
    const teamScore = isHome ? game.scores.home : game.scores.away;
    const oppScore = isHome ? game.scores.away : game.scores.home;
    
    // Hockey can have OT ties that go to shootout, but final result is W/L
    const result: 'W' | 'L' = teamScore > oppScore ? 'W' : 'L';

    return {
      result,
      score: `${game.scores.home}-${game.scores.away}`,
      opponent: isHome ? game.teams.away.name : game.teams.home.name,
      date: game.date,
      home: isHome,
    };
  });

  setCache(cacheKey, games);
  return games;
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

/**
 * Get enriched match data for any supported sport
 */
export async function getMultiSportEnrichedData(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  league?: string
): Promise<MultiSportEnrichedData> {
  const emptyResult: MultiSportEnrichedData = {
    sport,
    homeForm: null,
    awayForm: null,
    headToHead: null,
    h2hSummary: null,
    homeStats: null,
    awayStats: null,
    dataSource: 'UNAVAILABLE',
  };

  // Check if API is configured
  if (!process.env.API_FOOTBALL_KEY) {
    return emptyResult;
  }

  // Determine sport type
  const sportKey = getSportKey(sport);
  if (!sportKey) {
    console.log(`[API-Sports] Sport not supported: ${sport}`);
    return emptyResult;
  }

  const baseUrl = getApiBase(sportKey);
  if (!baseUrl) {
    return emptyResult;
  }

  console.log(`[API-Sports] Fetching ${sportKey} data for ${homeTeam} vs ${awayTeam}`);

  try {
    switch (sportKey) {
      case 'soccer':
        return await fetchSoccerData(homeTeam, awayTeam, baseUrl);
      
      case 'basketball':
        return await fetchBasketballData(homeTeam, awayTeam, baseUrl);
      
      case 'hockey':
        return await fetchHockeyData(homeTeam, awayTeam, baseUrl);
      
      // Add more sports as needed
      default:
        console.log(`[API-Sports] Sport handler not implemented: ${sportKey}`);
        return emptyResult;
    }
  } catch (error) {
    console.error(`[API-Sports] Error fetching ${sportKey} data:`, error);
    return emptyResult;
  }
}

// ============================================
// SPORT-SPECIFIC DATA FETCHERS
// ============================================

async function fetchSoccerData(homeTeam: string, awayTeam: string, baseUrl: string): Promise<MultiSportEnrichedData> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findSoccerTeam(homeTeam, baseUrl),
    findSoccerTeam(awayTeam, baseUrl),
  ]);

  if (!homeTeamId || !awayTeamId) {
    console.warn(`[API-Sports] Could not find soccer teams: ${homeTeam} or ${awayTeam}`);
    return {
      sport: 'soccer',
      homeForm: null,
      awayForm: null,
      headToHead: null,
      h2hSummary: null,
      homeStats: null,
      awayStats: null,
      dataSource: 'UNAVAILABLE',
    };
  }

  const [homeFixtures, awayFixtures, homeSeasonStats, awaySeasonStats, h2hData] = await Promise.all([
    getSoccerTeamFixtures(homeTeamId, baseUrl),
    getSoccerTeamFixtures(awayTeamId, baseUrl),
    getSoccerTeamStats(homeTeamId, baseUrl),
    getSoccerTeamStats(awayTeamId, baseUrl),
    getSoccerH2H(homeTeamId, awayTeamId, baseUrl),
  ]);

  const homeForm = homeFixtures.length > 0 ? homeFixtures.map(f => ({
    result: f.result,
    score: f.score,
    opponent: f.opponent,
    date: f.date,
    home: f.home,
  })) : null;

  const awayForm = awayFixtures.length > 0 ? awayFixtures.map(f => ({
    result: f.result,
    score: f.score,
    opponent: f.opponent,
    date: f.date,
    home: f.home,
  })) : null;

  const homeStats: TeamStats | null = homeSeasonStats ? {
    goalsScored: homeSeasonStats.pointsFor,
    goalsConceded: homeSeasonStats.pointsAgainst,
    cleanSheets: 0, // Would need separate call
    avgGoalsScored: homeSeasonStats.gamesPlayed > 0 
      ? Math.round((homeSeasonStats.pointsFor / homeSeasonStats.gamesPlayed) * 100) / 100 
      : 0,
    avgGoalsConceded: homeSeasonStats.gamesPlayed > 0 
      ? Math.round((homeSeasonStats.pointsAgainst / homeSeasonStats.gamesPlayed) * 100) / 100 
      : 0,
  } : null;

  const awayStats: TeamStats | null = awaySeasonStats ? {
    goalsScored: awaySeasonStats.pointsFor,
    goalsConceded: awaySeasonStats.pointsAgainst,
    cleanSheets: 0,
    avgGoalsScored: awaySeasonStats.gamesPlayed > 0 
      ? Math.round((awaySeasonStats.pointsFor / awaySeasonStats.gamesPlayed) * 100) / 100 
      : 0,
    avgGoalsConceded: awaySeasonStats.gamesPlayed > 0 
      ? Math.round((awaySeasonStats.pointsAgainst / awaySeasonStats.gamesPlayed) * 100) / 100 
      : 0,
  } : null;

  return {
    sport: 'soccer',
    homeForm,
    awayForm,
    headToHead: h2hData?.matches || null,
    h2hSummary: h2hData?.summary || null,
    homeStats,
    awayStats,
    dataSource: (homeForm || awayForm) ? 'API_SPORTS' : 'UNAVAILABLE',
  };
}

async function fetchBasketballData(homeTeam: string, awayTeam: string, baseUrl: string): Promise<MultiSportEnrichedData> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findBasketballTeam(homeTeam, baseUrl),
    findBasketballTeam(awayTeam, baseUrl),
  ]);

  if (!homeTeamId || !awayTeamId) {
    console.warn(`[API-Sports] Could not find basketball teams: ${homeTeam} or ${awayTeam}`);
    return {
      sport: 'basketball',
      homeForm: null,
      awayForm: null,
      headToHead: null,
      h2hSummary: null,
      homeStats: null,
      awayStats: null,
      dataSource: 'UNAVAILABLE',
    };
  }

  const [homeGames, awayGames, homeSeasonStats, awaySeasonStats, h2hData] = await Promise.all([
    getBasketballTeamGames(homeTeamId, baseUrl),
    getBasketballTeamGames(awayTeamId, baseUrl),
    getBasketballTeamStats(homeTeamId, baseUrl),
    getBasketballTeamStats(awayTeamId, baseUrl),
    getBasketballH2H(homeTeamId, awayTeamId, baseUrl),
  ]);

  const homeForm = homeGames.length > 0 ? homeGames.map(g => ({
    result: g.result as 'W' | 'D' | 'L',
    score: g.score,
    opponent: g.opponent,
    date: g.date,
    home: g.home,
  })) : null;

  const awayForm = awayGames.length > 0 ? awayGames.map(g => ({
    result: g.result as 'W' | 'D' | 'L',
    score: g.score,
    opponent: g.opponent,
    date: g.date,
    home: g.home,
  })) : null;

  // For basketball, use points instead of goals
  const homeStats: TeamStats | null = homeSeasonStats ? {
    goalsScored: homeSeasonStats.pointsFor,
    goalsConceded: homeSeasonStats.pointsAgainst,
    cleanSheets: 0, // Not applicable for basketball
    avgGoalsScored: homeSeasonStats.gamesPlayed > 0 
      ? Math.round((homeSeasonStats.pointsFor / homeSeasonStats.gamesPlayed) * 10) / 10 
      : 0,
    avgGoalsConceded: homeSeasonStats.gamesPlayed > 0 
      ? Math.round((homeSeasonStats.pointsAgainst / homeSeasonStats.gamesPlayed) * 10) / 10 
      : 0,
  } : null;

  const awayStats: TeamStats | null = awaySeasonStats ? {
    goalsScored: awaySeasonStats.pointsFor,
    goalsConceded: awaySeasonStats.pointsAgainst,
    cleanSheets: 0,
    avgGoalsScored: awaySeasonStats.gamesPlayed > 0 
      ? Math.round((awaySeasonStats.pointsFor / awaySeasonStats.gamesPlayed) * 10) / 10 
      : 0,
    avgGoalsConceded: awaySeasonStats.gamesPlayed > 0 
      ? Math.round((awaySeasonStats.pointsAgainst / awaySeasonStats.gamesPlayed) * 10) / 10 
      : 0,
  } : null;

  return {
    sport: 'basketball',
    homeForm,
    awayForm,
    headToHead: h2hData?.matches || null,
    h2hSummary: h2hData?.summary || null,
    homeStats,
    awayStats,
    dataSource: (homeForm || awayForm) ? 'API_SPORTS' : 'UNAVAILABLE',
  };
}

async function fetchHockeyData(homeTeam: string, awayTeam: string, baseUrl: string): Promise<MultiSportEnrichedData> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findHockeyTeam(homeTeam, baseUrl),
    findHockeyTeam(awayTeam, baseUrl),
  ]);

  if (!homeTeamId || !awayTeamId) {
    console.warn(`[API-Sports] Could not find hockey teams: ${homeTeam} or ${awayTeam}`);
    return {
      sport: 'hockey',
      homeForm: null,
      awayForm: null,
      headToHead: null,
      h2hSummary: null,
      homeStats: null,
      awayStats: null,
      dataSource: 'UNAVAILABLE',
    };
  }

  const [homeGames, awayGames] = await Promise.all([
    getHockeyTeamGames(homeTeamId, baseUrl),
    getHockeyTeamGames(awayTeamId, baseUrl),
  ]);

  const homeForm = homeGames.length > 0 ? homeGames.map(g => ({
    result: g.result as 'W' | 'D' | 'L',
    score: g.score,
    opponent: g.opponent,
    date: g.date,
    home: g.home,
  })) : null;

  const awayForm = awayGames.length > 0 ? awayGames.map(g => ({
    result: g.result as 'W' | 'D' | 'L',
    score: g.score,
    opponent: g.opponent,
    date: g.date,
    home: g.home,
  })) : null;

  return {
    sport: 'hockey',
    homeForm,
    awayForm,
    headToHead: null, // Would need H2H endpoint for hockey
    h2hSummary: null,
    homeStats: null, // Would need stats endpoint
    awayStats: null,
    dataSource: (homeForm || awayForm) ? 'API_SPORTS' : 'UNAVAILABLE',
  };
}

/**
 * Check if a sport is supported by API-Sports
 */
export function isSportSupported(sport: string): boolean {
  return getSportKey(sport) !== null;
}

/**
 * Get the display name for data source
 */
export function getDataSourceLabel(sport: string): string {
  const sportKey = getSportKey(sport);
  switch (sportKey) {
    case 'soccer': return 'API-Football';
    case 'basketball': return 'API-Basketball';
    case 'hockey': return 'API-Hockey';
    case 'american_football': return 'API-NFL';
    case 'baseball': return 'API-Baseball';
    default: return 'API-Sports';
  }
}
