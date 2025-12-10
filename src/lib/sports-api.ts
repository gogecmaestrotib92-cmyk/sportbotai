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
  // Common league names that should map to soccer
  'premier_league': 'soccer',
  'la_liga': 'soccer',
  'bundesliga': 'soccer',
  'serie_a': 'soccer',
  'ligue_1': 'soccer',
  'ligue_one': 'soccer',
  'champions_league': 'soccer',
  'europa_league': 'soccer',
  'english_premier_league': 'soccer',
  'epl': 'soccer',
  
  // Basketball variants
  'basketball': 'basketball',
  'basketball_nba': 'basketball',
  'basketball_euroleague': 'basketball',
  'basketball_ncaab': 'basketball',
  'nba': 'basketball',
  
  // American Football
  'americanfootball': 'american_football',
  'americanfootball_nfl': 'american_football',
  'americanfootball_ncaaf': 'american_football',
  'nfl': 'american_football',
  'ncaaf': 'american_football',
  
  // Hockey
  'hockey': 'hockey',
  'icehockey': 'hockey',
  'icehockey_nhl': 'hockey',
  'nhl': 'hockey',
  
  // Baseball
  'baseball': 'baseball',
  'baseball_mlb': 'baseball',
  'mlb': 'baseball',
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
// CACHE (using Upstash Redis with memory fallback)
// ============================================

import { 
  cacheGet, 
  cacheSet, 
  cached, 
  CACHE_TTL, 
  CACHE_KEYS 
} from './cache';

// Legacy sync cache functions for backward compatibility
// These now wrap the async Redis cache
const syncCache = new Map<string, { data: any; timestamp: number }>();
const SYNC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for sync fallback

function getCached<T>(key: string): T | null {
  const cached = syncCache.get(key);
  if (cached && Date.now() - cached.timestamp < SYNC_CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  syncCache.set(key, { data, timestamp: Date.now() });
  // Also set in Redis asynchronously (fire and forget)
  cacheSet(key, data, CACHE_TTL.TEAM_FORM).catch(() => {});
}

// ============================================
// API REQUEST HELPER
// ============================================

async function apiRequest<T>(baseUrl: string, endpoint: string): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY; // Same key works for all sports
  
  if (!apiKey) {
    console.error('[API-Sports] ❌ API_FOOTBALL_KEY not configured in environment variables!');
    return null;
  }

  const fullUrl = `${baseUrl}${endpoint}`;
  console.log(`[API-Sports] 🔗 Requesting: ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    console.log(`[API-Sports] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API-Sports] ❌ Error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log(`[API-Sports] ✅ Data received, results: ${data?.results || 0}`);
    return data;
  } catch (error) {
    console.error('[API-Sports] ❌ Request failed:', error);
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

// Common team name mappings (full name -> API-Football name)
const TEAM_NAME_MAPPINGS: Record<string, string> = {
  // English Premier League
  'brighton and hove albion': 'Brighton',
  'brighton & hove albion': 'Brighton',
  'wolverhampton wanderers': 'Wolves',
  'west ham united': 'West Ham',
  'tottenham hotspur': 'Tottenham',
  'manchester united': 'Manchester United',
  'manchester city': 'Manchester City',
  'newcastle united': 'Newcastle',
  'nottingham forest': 'Nottingham Forest',
  'afc bournemouth': 'Bournemouth',
  'leicester city': 'Leicester',
  'crystal palace': 'Crystal Palace',
  'ipswich town': 'Ipswich',
  // Spanish La Liga
  'atletico madrid': 'Atletico Madrid',
  'athletic bilbao': 'Athletic Club',
  'real sociedad': 'Real Sociedad',
  'real betis': 'Real Betis',
  'celta vigo': 'Celta Vigo',
  'rayo vallecano': 'Rayo Vallecano',
  // German Bundesliga  
  'bayern munich': 'Bayern Munich',
  'borussia dortmund': 'Borussia Dortmund',
  'bayer leverkusen': 'Bayer 04 Leverkusen',
  'rb leipzig': 'RB Leipzig',
  'eintracht frankfurt': 'Eintracht Frankfurt',
  // Italian Serie A
  'inter milan': 'Inter',
  'ac milan': 'AC Milan',
  'as roma': 'AS Roma',
  'ss lazio': 'Lazio',
  'juventus fc': 'Juventus',
  // French Ligue 1
  'paris saint-germain': 'Paris Saint Germain',
  'paris saint germain': 'Paris Saint Germain',
  'olympique marseille': 'Marseille',
  'olympique lyon': 'Lyon',
  'as monaco': 'Monaco',
};

function normalizeTeamName(name: string): string {
  const lower = name.toLowerCase().trim();
  
  // Check direct mapping
  if (TEAM_NAME_MAPPINGS[lower]) {
    return TEAM_NAME_MAPPINGS[lower];
  }
  
  // Try partial matches for common patterns
  for (const [pattern, mapped] of Object.entries(TEAM_NAME_MAPPINGS)) {
    if (lower.includes(pattern) || pattern.includes(lower)) {
      return mapped;
    }
  }
  
  // Return first word for very long names (often works for "X and Y" patterns)
  if (name.includes(' and ') || name.includes(' & ')) {
    return name.split(/\s+and\s+|\s+&\s+/i)[0].trim();
  }
  
  return name;
}

async function findSoccerTeam(teamName: string, baseUrl: string): Promise<number | null> {
  const cacheKey = `soccer:team:${teamName.toLowerCase()}`;
  const cached = getCached<number>(cacheKey);
  if (cached) {
    console.log(`[Soccer] Cache hit for team: ${teamName} -> ${cached}`);
    return cached;
  }

  // Try normalized name first
  const normalizedName = normalizeTeamName(teamName);
  const searchName = normalizedName !== teamName ? normalizedName : teamName;
  
  console.log(`[Soccer] Searching for team: "${teamName}"${normalizedName !== teamName ? ` (normalized: "${normalizedName}")` : ''}`);
  
  let response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(searchName)}`);
  
  // If normalized search fails, try original name
  if ((!response?.response?.length) && normalizedName !== teamName) {
    console.log(`[Soccer] Normalized search failed, trying original: "${teamName}"`);
    response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(teamName)}`);
  }
  
  // If still no results, try first word only
  if (!response?.response?.length) {
    const firstWord = teamName.split(/\s+/)[0];
    if (firstWord.length > 3 && firstWord.toLowerCase() !== searchName.toLowerCase()) {
      console.log(`[Soccer] Trying first word only: "${firstWord}"`);
      response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(firstWord)}`);
    }
  }
  
  if (response?.response?.length > 0) {
    const teamId = response.response[0].team.id;
    const foundName = response.response[0].team.name;
    console.log(`[Soccer] Found team: "${foundName}" (ID: ${teamId})`);
    setCache(cacheKey, teamId);
    return teamId;
  }
  
  console.log(`[Soccer] Team not found: "${teamName}"`);
  return null;
}

async function getSoccerTeamFixtures(teamId: number, baseUrl: string): Promise<GameResult[]> {
  const cacheKey = `soccer:fixtures:${teamId}`;
  const cached = getCached<GameResult[]>(cacheKey);
  if (cached) return cached;

  // Use last=5 to get most recent fixtures (Pro tier has current season data)
  const response = await apiRequest<any>(baseUrl, `/fixtures?team=${teamId}&last=5`);
  
  if (!response?.response || response.response.length === 0) {
    console.log(`[Soccer] No fixtures found for team ${teamId}`);
    return [];
  }

  console.log(`[Soccer] Found ${response.response.length} fixtures for team ${teamId}`);
  
  const matches: GameResult[] = response.response.slice(0, 5).map((fixture: any) => {
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

  // Get current season year (Premier League season spans Aug-May, so use year of August)
  const now = new Date();
  const currentSeason = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  
  // Need to specify league (39 = Premier League) for statistics
  const response = await apiRequest<any>(baseUrl, `/teams/statistics?team=${teamId}&season=${currentSeason}&league=39`);
  
  if (!response?.response) {
    console.log(`[Soccer] No stats found for team ${teamId} in season ${currentSeason}`);
    return null;
  }

  console.log(`[Soccer] Found stats for team ${teamId} in season ${currentSeason}`);
  
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

  // Don't use 'last' parameter as it doesn't work reliably on free tier
  const response = await apiRequest<any>(baseUrl, `/fixtures/headtohead?h2h=${homeTeamId}-${awayTeamId}`);
  
  if (!response?.response || response.response.length === 0) {
    console.log(`[Soccer] No H2H data for teams ${homeTeamId} vs ${awayTeamId}`);
    return null;
  }

  console.log(`[Soccer] Found ${response.response.length} H2H matches`);
  
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
// NFL (AMERICAN FOOTBALL) FUNCTIONS
// ============================================

async function findNFLTeam(teamName: string, baseUrl: string): Promise<number | null> {
  const cacheKey = `nfl:team:${teamName}`;
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

async function getNFLTeamGames(teamId: number, baseUrl: string): Promise<GameResult[]> {
  const cacheKey = `nfl:games:${teamId}`;
  const cached = getCached<GameResult[]>(cacheKey);
  if (cached) return cached;

  // NFL season 2024
  const response = await apiRequest<any>(baseUrl, `/games?team=${teamId}&season=2024&last=5`);
  
  if (!response?.response) return [];

  const games: GameResult[] = response.response.map((game: any) => {
    const isHome = game.teams.home.id === teamId;
    const teamScore = isHome ? game.scores.home.total : game.scores.away.total;
    const oppScore = isHome ? game.scores.away.total : game.scores.home.total;
    
    // NFL has no ties in regular season (overtime rules)
    const result: 'W' | 'L' | 'D' = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';

    return {
      result,
      score: `${game.scores.home.total}-${game.scores.away.total}`,
      opponent: isHome ? game.teams.away.name : game.teams.home.name,
      date: game.game.date.date,
      home: isHome,
    };
  });

  setCache(cacheKey, games);
  return games;
}

async function getNFLTeamStats(teamId: number, baseUrl: string): Promise<TeamSeasonStats | null> {
  const cacheKey = `nfl:stats:${teamId}`;
  const cached = getCached<TeamSeasonStats>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/teams/statistics?id=${teamId}&season=2024`);
  
  if (!response?.response) return null;

  const stats = response.response;
  const gamesPlayed = (stats.games?.played || 0);
  const wins = stats.games?.wins?.total || 0;
  const losses = stats.games?.loses?.total || 0;
  
  const result: TeamSeasonStats = {
    gamesPlayed,
    wins,
    losses,
    pointsFor: stats.points?.for?.total || 0,
    pointsAgainst: stats.points?.against?.total || 0,
    winPercentage: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
  };

  setCache(cacheKey, result);
  return result;
}

async function getNFLH2H(homeTeamId: number, awayTeamId: number, baseUrl: string): Promise<{ matches: H2HMatch[], summary: any } | null> {
  const cacheKey = `nfl:h2h:${homeTeamId}:${awayTeamId}`;
  const cached = getCached<{ matches: H2HMatch[], summary: any }>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/games?h2h=${homeTeamId}-${awayTeamId}&last=10`);
  
  if (!response?.response || response.response.length === 0) return null;

  const games = response.response;
  let homeWins = 0, awayWins = 0, draws = 0;

  const matches: H2HMatch[] = games.slice(0, 5).map((g: any) => {
    const homeScore = g.scores.home.total;
    const awayScore = g.scores.away.total;
    
    const isHomeTeamHome = g.teams.home.id === homeTeamId;
    if (homeScore === awayScore) {
      draws++;
    } else if (isHomeTeamHome) {
      if (homeScore > awayScore) homeWins++;
      else awayWins++;
    } else {
      if (awayScore > homeScore) homeWins++;
      else awayWins++;
    }

    return {
      date: g.game.date.date,
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
      draws,
    }
  };

  setCache(cacheKey, result);
  return result;
}

// ============================================
// MLB (BASEBALL) FUNCTIONS
// ============================================

async function findMLBTeam(teamName: string, baseUrl: string): Promise<number | null> {
  const cacheKey = `mlb:team:${teamName}`;
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

async function getMLBTeamGames(teamId: number, baseUrl: string): Promise<GameResult[]> {
  const cacheKey = `mlb:games:${teamId}`;
  const cached = getCached<GameResult[]>(cacheKey);
  if (cached) return cached;

  // MLB season 2024
  const response = await apiRequest<any>(baseUrl, `/games?team=${teamId}&season=2024&last=5`);
  
  if (!response?.response) return [];

  const games: GameResult[] = response.response.map((game: any) => {
    const isHome = game.teams.home.id === teamId;
    const teamScore = isHome ? game.scores.home.total : game.scores.away.total;
    const oppScore = isHome ? game.scores.away.total : game.scores.home.total;
    
    // Baseball has no ties
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

async function getMLBTeamStats(teamId: number, baseUrl: string): Promise<TeamSeasonStats | null> {
  const cacheKey = `mlb:stats:${teamId}`;
  const cached = getCached<TeamSeasonStats>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/teams/statistics?id=${teamId}&season=2024`);
  
  if (!response?.response) return null;

  const stats = response.response;
  const gamesPlayed = (stats.games?.played || 0);
  const wins = stats.games?.wins?.total || 0;
  const losses = stats.games?.loses?.total || 0;
  
  const result: TeamSeasonStats = {
    gamesPlayed,
    wins,
    losses,
    pointsFor: stats.runs?.for?.total || 0,
    pointsAgainst: stats.runs?.against?.total || 0,
    winPercentage: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
  };

  setCache(cacheKey, result);
  return result;
}

async function getMLBH2H(homeTeamId: number, awayTeamId: number, baseUrl: string): Promise<{ matches: H2HMatch[], summary: any } | null> {
  const cacheKey = `mlb:h2h:${homeTeamId}:${awayTeamId}`;
  const cached = getCached<{ matches: H2HMatch[], summary: any }>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/games?h2h=${homeTeamId}-${awayTeamId}&last=10`);
  
  if (!response?.response || response.response.length === 0) return null;

  const games = response.response;
  let homeWins = 0, awayWins = 0;

  const matches: H2HMatch[] = games.slice(0, 5).map((g: any) => {
    const homeScore = g.scores.home.total;
    const awayScore = g.scores.away.total;
    
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
      draws: 0, // No ties in baseball
    }
  };

  setCache(cacheKey, result);
  return result;
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
  console.log('[API-Sports] ========================================');
  console.log('[API-Sports] 🚀 getMultiSportEnrichedData called');
  console.log(`[API-Sports] Teams: "${homeTeam}" vs "${awayTeam}"`);
  console.log(`[API-Sports] Sport: "${sport}", League: "${league}"`);
  console.log(`[API-Sports] API_FOOTBALL_KEY configured: ${process.env.API_FOOTBALL_KEY ? '✅ YES' : '❌ NO'}`);
  
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
    console.error('[API-Sports] ❌ API_FOOTBALL_KEY is not set! Returning empty result.');
    return emptyResult;
  }

  // Determine sport type
  const sportKey = getSportKey(sport);
  console.log(`[API-Sports] Sport key resolved: "${sportKey}"`);
  if (!sportKey) {
    console.log(`[API-Sports] ⚠️ Sport not supported: ${sport}`);
    return emptyResult;
  }

  const baseUrl = getApiBase(sportKey);
  console.log(`[API-Sports] Base URL: ${baseUrl}`);
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
      
      case 'american_football':
        return await fetchNFLData(homeTeam, awayTeam, baseUrl);
      
      case 'baseball':
        return await fetchMLBData(homeTeam, awayTeam, baseUrl);
      
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

async function fetchNFLData(homeTeam: string, awayTeam: string, baseUrl: string): Promise<MultiSportEnrichedData> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findNFLTeam(homeTeam, baseUrl),
    findNFLTeam(awayTeam, baseUrl),
  ]);

  if (!homeTeamId || !awayTeamId) {
    console.warn(`[API-Sports] Could not find NFL teams: ${homeTeam} or ${awayTeam}`);
    return {
      sport: 'american_football',
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
    getNFLTeamGames(homeTeamId, baseUrl),
    getNFLTeamGames(awayTeamId, baseUrl),
    getNFLTeamStats(homeTeamId, baseUrl),
    getNFLTeamStats(awayTeamId, baseUrl),
    getNFLH2H(homeTeamId, awayTeamId, baseUrl),
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

  // For NFL, use points
  const homeStats: TeamStats | null = homeSeasonStats ? {
    goalsScored: homeSeasonStats.pointsFor,
    goalsConceded: homeSeasonStats.pointsAgainst,
    cleanSheets: 0,
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
    sport: 'american_football',
    homeForm,
    awayForm,
    headToHead: h2hData?.matches || null,
    h2hSummary: h2hData?.summary || null,
    homeStats,
    awayStats,
    dataSource: (homeForm || awayForm) ? 'API_SPORTS' : 'UNAVAILABLE',
  };
}

async function fetchMLBData(homeTeam: string, awayTeam: string, baseUrl: string): Promise<MultiSportEnrichedData> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findMLBTeam(homeTeam, baseUrl),
    findMLBTeam(awayTeam, baseUrl),
  ]);

  if (!homeTeamId || !awayTeamId) {
    console.warn(`[API-Sports] Could not find MLB teams: ${homeTeam} or ${awayTeam}`);
    return {
      sport: 'baseball',
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
    getMLBTeamGames(homeTeamId, baseUrl),
    getMLBTeamGames(awayTeamId, baseUrl),
    getMLBTeamStats(homeTeamId, baseUrl),
    getMLBTeamStats(awayTeamId, baseUrl),
    getMLBH2H(homeTeamId, awayTeamId, baseUrl),
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

  // For MLB, use runs
  const homeStats: TeamStats | null = homeSeasonStats ? {
    goalsScored: homeSeasonStats.pointsFor, // Runs scored
    goalsConceded: homeSeasonStats.pointsAgainst, // Runs allowed
    cleanSheets: 0, // Shutouts would need separate tracking
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
    sport: 'baseball',
    homeForm,
    awayForm,
    headToHead: h2hData?.matches || null,
    h2hSummary: h2hData?.summary || null,
    homeStats,
    awayStats,
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
