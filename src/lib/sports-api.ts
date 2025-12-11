/**
 * API-Sports Multi-Sport Integration
 * 
 * Unified client for API-Sports family:
 * - API-Football (Soccer)
 * - API-Basketball (NBA, EuroLeague, etc.)
 * - API-American-Football (NFL)
 * - API-Hockey (NHL)
 * - API-MMA (UFC, Bellator)
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
  nba: 'https://v2.nba.api-sports.io',  // Dedicated NBA API
  basketball: 'https://v1.basketball.api-sports.io',  // EuroLeague, NCAAB, etc.
  american_football: 'https://v1.american-football.api-sports.io',
  hockey: 'https://v1.hockey.api-sports.io',
  mma: 'https://v1.mma.api-sports.io',  // UFC, Bellator, etc.
};

// ============================================
// DYNAMIC SEASON HELPERS
// ============================================

/**
 * Get current basketball season (NBA runs Oct-June)
 * Format: "2024-2025"
 */
function getCurrentBasketballSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // If Oct or later, it's the new season
  if (month >= 10) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Get current hockey season (NHL runs Oct-June)
 * Format: 2024 (represents 2024-2025 season)
 */
function getCurrentHockeySeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 10) {
    return year;
  }
  return year - 1;
}

/**
 * Get current NFL season (runs Sept-Feb)
 * Format: 2024
 */
function getCurrentNFLSeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 9) {
    return year;
  }
  return year - 1;
}

/**
 * Get current soccer season
 * Format: 2024 (represents 2024-2025 season for most leagues)
 */
function getCurrentSoccerSeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 8) {
    return year;
  }
  return year - 1;
}

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
  
  // Basketball variants - NBA uses dedicated API
  'basketball': 'basketball',
  'basketball_nba': 'nba',  // Dedicated NBA API
  'basketball_euroleague': 'basketball',
  'basketball_ncaab': 'basketball',
  'nba': 'nba',  // Dedicated NBA API
  
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
  
  // MMA / UFC
  'mma': 'mma',
  'mma_mixed_martial_arts': 'mma',
  'ufc': 'mma',
  'bellator': 'mma',
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

// NBA API Types
interface NBAGame {
  status?: { short?: number; long?: string };
  date: { start: string };
  teams: {
    home: { id: number; name: string };
    visitors: { id: number; name: string };
  };
  scores: {
    home: { points: number };
    visitors: { points: number };
  };
}

interface NBAStanding {
  win?: { total?: number; percentage?: string };
  loss?: { total?: number };
}

// MMA API Types
interface MMAFighter {
  id: number;
  name: string;
}

interface MMAFighterRecord {
  total?: { win: number; loss: number; draw: number };
  ko?: { win: number; loss: number };
  sub?: { win: number; loss: number };
}

interface MMAFight {
  date: string;
  status: { short: string; long: string };
  fighters: {
    first: { id: number; name: string; winner: boolean };
    second: { id: number; name: string; winner: boolean };
  };
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
  const apiKey = process.env.API_FOOTBALL_KEY;
  
  if (!apiKey) {
    console.warn('[API-Sports] API_FOOTBALL_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    if (!response.ok) {
      console.error(`[API-Sports] Error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[API-Sports] Request failed:', error);
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

// Soccer league IDs for API-Football
const SOCCER_LEAGUE_IDS: Record<string, number> = {
  // England
  'premier_league': 39,
  'epl': 39,
  'english_premier_league': 39,
  // Spain
  'la_liga': 140,
  'laliga': 140,
  'spain_la_liga': 140,
  // Germany
  'bundesliga': 78,
  'germany_bundesliga': 78,
  // Italy
  'serie_a': 135,
  'italy_serie_a': 135,
  // France
  'ligue_1': 61,
  'ligue_one': 61,
  'france_ligue_one': 61,
  // UEFA
  'champions_league': 2,
  'ucl': 2,
  'europa_league': 3,
  'uel': 3,
  // Portugal
  'primeira_liga': 94,
  // Netherlands
  'eredivisie': 88,
  // Belgium
  'jupiler_pro': 144,
};

/**
 * Detect soccer league ID from team's league or try multiple leagues
 */
async function detectSoccerLeagueForTeam(teamId: number, baseUrl: string): Promise<number | null> {
  // Try to get team info to find their league
  const teamResponse = await apiRequest<any>(baseUrl, `/teams?id=${teamId}`);
  
  if (teamResponse?.response?.[0]?.team) {
    // The team endpoint doesn't directly give league, so we'll try common leagues
    const commonLeagues = [39, 140, 78, 135, 61, 2, 3]; // EPL, La Liga, Bundesliga, Serie A, Ligue 1, UCL, UEL
    
    for (const leagueId of commonLeagues) {
      const testResponse = await apiRequest<any>(baseUrl, `/teams/statistics?team=${teamId}&season=${getCurrentSoccerSeason()}&league=${leagueId}`);
      if (testResponse?.response?.fixtures?.played?.total > 0) {
        console.log(`[Soccer] Found team ${teamId} in league ${leagueId}`);
        return leagueId;
      }
    }
  }
  
  return null;
}

async function getSoccerTeamStats(teamId: number, baseUrl: string): Promise<TeamSeasonStats | null> {
  const cacheKey = `soccer:stats:${teamId}`;
  const cached = getCached<TeamSeasonStats>(cacheKey);
  if (cached) return cached;

  const currentSeason = getCurrentSoccerSeason();
  
  // Try common leagues to find the team's stats
  const leaguesToTry = [39, 140, 78, 135, 61, 2, 3, 94, 88]; // EPL, La Liga, Bundesliga, Serie A, Ligue 1, UCL, UEL, Primeira, Eredivisie
  
  let response = null;
  let foundLeague = null;
  
  for (const leagueId of leaguesToTry) {
    response = await apiRequest<any>(baseUrl, `/teams/statistics?team=${teamId}&season=${currentSeason}&league=${leagueId}`);
    if (response?.response?.fixtures?.played?.total > 0) {
      foundLeague = leagueId;
      break;
    }
  }
  
  if (!response?.response || !foundLeague) {
    console.log(`[Soccer] No stats found for team ${teamId} in season ${currentSeason}`);
    return null;
  }

  console.log(`[Soccer] Found stats for team ${teamId} in league ${foundLeague} season ${currentSeason}`);
  
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

// NBA team name mappings
const NBA_TEAM_MAPPINGS: Record<string, string> = {
  // Full names to short
  'los angeles lakers': 'Lakers',
  'los angeles clippers': 'Clippers',
  'la lakers': 'Lakers',
  'la clippers': 'Clippers',
  'golden state warriors': 'Warriors',
  'san antonio spurs': 'Spurs',
  'oklahoma city thunder': 'Thunder',
  'portland trail blazers': 'Trail Blazers',
  'minnesota timberwolves': 'Timberwolves',
  'new orleans pelicans': 'Pelicans',
  'new york knicks': 'Knicks',
  'brooklyn nets': 'Nets',
  'boston celtics': 'Celtics',
  'philadelphia 76ers': '76ers',
  'miami heat': 'Heat',
  'orlando magic': 'Magic',
  'atlanta hawks': 'Hawks',
  'chicago bulls': 'Bulls',
  'cleveland cavaliers': 'Cavaliers',
  'detroit pistons': 'Pistons',
  'indiana pacers': 'Pacers',
  'milwaukee bucks': 'Bucks',
  'toronto raptors': 'Raptors',
  'washington wizards': 'Wizards',
  'charlotte hornets': 'Hornets',
  'denver nuggets': 'Nuggets',
  'utah jazz': 'Jazz',
  'phoenix suns': 'Suns',
  'sacramento kings': 'Kings',
  'dallas mavericks': 'Mavericks',
  'houston rockets': 'Rockets',
  'memphis grizzlies': 'Grizzlies',
};

function normalizeBasketballTeamName(name: string): string {
  const lower = name.toLowerCase().trim();
  return NBA_TEAM_MAPPINGS[lower] || name;
}

async function findBasketballTeam(teamName: string, baseUrl: string): Promise<number | null> {
  const normalizedName = normalizeBasketballTeamName(teamName);
  const cacheKey = `basketball:team:${normalizedName}`;
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  // Try with NBA league ID (12) first, then without
  let response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(normalizedName)}&league=12`);
  
  // If not found in NBA, try EuroLeague (120)
  if (!response?.response?.length) {
    response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(normalizedName)}&league=120`);
  }
  
  // Fallback: search without league filter
  if (!response?.response?.length && normalizedName !== teamName) {
    response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(teamName)}`);
  }
  
  if (response?.response?.length > 0) {
    const teamId = response.response[0].id;
    console.log(`[Basketball] Found team "${teamName}" -> ID ${teamId}`);
    setCache(cacheKey, teamId);
    return teamId;
  }
  
  console.warn(`[Basketball] Team not found: "${teamName}" (normalized: "${normalizedName}")`);
  return null;
}

async function getBasketballTeamGames(teamId: number, baseUrl: string): Promise<GameResult[]> {
  const cacheKey = `basketball:games:${teamId}`;
  const cached = getCached<GameResult[]>(cacheKey);
  if (cached) return cached;

  // Get games from current season
  const season = getCurrentBasketballSeason();
  const response = await apiRequest<any>(baseUrl, `/games?team=${teamId}&season=${season}&last=5`);
  
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

  const season = getCurrentBasketballSeason();
  const response = await apiRequest<any>(baseUrl, `/statistics?team=${teamId}&season=${season}`);
  
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

// NHL team name mappings
const NHL_TEAM_MAPPINGS: Record<string, string> = {
  'los angeles kings': 'Kings',
  'la kings': 'Kings',
  'new york rangers': 'Rangers',
  'new york islanders': 'Islanders',
  'ny rangers': 'Rangers',
  'ny islanders': 'Islanders',
  'tampa bay lightning': 'Lightning',
  'vegas golden knights': 'Golden Knights',
  'colorado avalanche': 'Avalanche',
  'carolina hurricanes': 'Hurricanes',
  'florida panthers': 'Panthers',
  'toronto maple leafs': 'Maple Leafs',
  'boston bruins': 'Bruins',
  'edmonton oilers': 'Oilers',
  'dallas stars': 'Stars',
  'winnipeg jets': 'Jets',
  'vancouver canucks': 'Canucks',
  'minnesota wild': 'Wild',
  'seattle kraken': 'Kraken',
  'detroit red wings': 'Red Wings',
  'pittsburgh penguins': 'Penguins',
  'washington capitals': 'Capitals',
  'new jersey devils': 'Devils',
  'philadelphia flyers': 'Flyers',
  'ottawa senators': 'Senators',
  'montreal canadiens': 'Canadiens',
  'calgary flames': 'Flames',
  'nashville predators': 'Predators',
  'st. louis blues': 'Blues',
  'st louis blues': 'Blues',
  'chicago blackhawks': 'Blackhawks',
  'arizona coyotes': 'Coyotes',
  'san jose sharks': 'Sharks',
  'columbus blue jackets': 'Blue Jackets',
  'buffalo sabres': 'Sabres',
  'anaheim ducks': 'Ducks',
  'utah hockey club': 'Utah HC',
};

function normalizeHockeyTeamName(name: string): string {
  const lower = name.toLowerCase().trim();
  return NHL_TEAM_MAPPINGS[lower] || name;
}

async function findHockeyTeam(teamName: string, baseUrl: string): Promise<number | null> {
  const normalizedName = normalizeHockeyTeamName(teamName);
  const cacheKey = `hockey:team:${normalizedName}`;
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  // Try with NHL league ID (57) first
  let response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(normalizedName)}&league=57`);
  
  // Fallback: search without league filter
  if (!response?.response?.length && normalizedName !== teamName) {
    response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(teamName)}`);
  }
  
  if (response?.response?.length > 0) {
    const teamId = response.response[0].id;
    console.log(`[Hockey] Found team "${teamName}" -> ID ${teamId}`);
    setCache(cacheKey, teamId);
    return teamId;
  }
  
  console.warn(`[Hockey] Team not found: "${teamName}" (normalized: "${normalizedName}")`);
  return null;
}

async function getHockeyTeamGames(teamId: number, baseUrl: string): Promise<GameResult[]> {
  const cacheKey = `hockey:games:${teamId}`;
  const cached = getCached<GameResult[]>(cacheKey);
  if (cached) return cached;

  const season = getCurrentHockeySeason();
  const response = await apiRequest<any>(baseUrl, `/games?team=${teamId}&season=${season}&last=5`);
  
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

async function getHockeyTeamStats(teamId: number, baseUrl: string): Promise<TeamSeasonStats | null> {
  const cacheKey = `hockey:stats:${teamId}`;
  const cached = getCached<TeamSeasonStats>(cacheKey);
  if (cached) return cached;

  const season = getCurrentHockeySeason();
  const response = await apiRequest<any>(baseUrl, `/teams/statistics?team=${teamId}&season=${season}`);
  
  if (!response?.response) return null;

  const stats = response.response;
  const gamesPlayed = stats.games?.played?.all || 0;
  const wins = stats.wins?.all?.total || 0;
  const losses = stats.loses?.all?.total || 0;
  
  const result: TeamSeasonStats = {
    gamesPlayed,
    wins,
    losses,
    pointsFor: stats.goals?.for?.total?.all || 0,
    pointsAgainst: stats.goals?.against?.total?.all || 0,
    winPercentage: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
  };

  setCache(cacheKey, result);
  return result;
}

async function getHockeyH2H(homeTeamId: number, awayTeamId: number, baseUrl: string): Promise<{ matches: H2HMatch[], summary: any } | null> {
  const cacheKey = `hockey:h2h:${homeTeamId}:${awayTeamId}`;
  const cached = getCached<{ matches: H2HMatch[], summary: any }>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(baseUrl, `/games?h2h=${homeTeamId}-${awayTeamId}&last=10`);
  
  if (!response?.response || response.response.length === 0) return null;

  const games = response.response;
  let homeWins = 0, awayWins = 0;

  const matches: H2HMatch[] = games.slice(0, 5).map((g: any) => {
    const homeScore = g.scores.home;
    const awayScore = g.scores.away;
    
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
      draws: 0, // No draws in hockey (shootouts decide)
    }
  };

  setCache(cacheKey, result);
  return result;
}

// ============================================
// NFL (AMERICAN FOOTBALL) FUNCTIONS
// ============================================

// NFL team name mappings
const NFL_TEAM_MAPPINGS: Record<string, string> = {
  'kansas city chiefs': 'Chiefs',
  'san francisco 49ers': '49ers',
  'philadelphia eagles': 'Eagles',
  'buffalo bills': 'Bills',
  'dallas cowboys': 'Cowboys',
  'miami dolphins': 'Dolphins',
  'detroit lions': 'Lions',
  'baltimore ravens': 'Ravens',
  'jacksonville jaguars': 'Jaguars',
  'los angeles rams': 'Rams',
  'la rams': 'Rams',
  'los angeles chargers': 'Chargers',
  'la chargers': 'Chargers',
  'seattle seahawks': 'Seahawks',
  'cleveland browns': 'Browns',
  'green bay packers': 'Packers',
  'cincinnati bengals': 'Bengals',
  'new york jets': 'Jets',
  'new york giants': 'Giants',
  'ny jets': 'Jets',
  'ny giants': 'Giants',
  'minnesota vikings': 'Vikings',
  'houston texans': 'Texans',
  'pittsburgh steelers': 'Steelers',
  'indianapolis colts': 'Colts',
  'denver broncos': 'Broncos',
  'las vegas raiders': 'Raiders',
  'new england patriots': 'Patriots',
  'tennessee titans': 'Titans',
  'atlanta falcons': 'Falcons',
  'new orleans saints': 'Saints',
  'tampa bay buccaneers': 'Buccaneers',
  'carolina panthers': 'Panthers',
  'arizona cardinals': 'Cardinals',
  'chicago bears': 'Bears',
  'washington commanders': 'Commanders',
};

function normalizeNFLTeamName(name: string): string {
  const lower = name.toLowerCase().trim();
  return NFL_TEAM_MAPPINGS[lower] || name;
}

async function findNFLTeam(teamName: string, baseUrl: string): Promise<number | null> {
  const normalizedName = normalizeNFLTeamName(teamName);
  const cacheKey = `nfl:team:${normalizedName}`;
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  // Try with NFL league ID (1) first
  let response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(normalizedName)}&league=1`);
  
  // Fallback: search without league filter
  if (!response?.response?.length && normalizedName !== teamName) {
    response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(teamName)}`);
  }
  
  if (response?.response?.length > 0) {
    const teamId = response.response[0].id;
    console.log(`[NFL] Found team "${teamName}" -> ID ${teamId}`);
    setCache(cacheKey, teamId);
    return teamId;
  }
  
  console.warn(`[NFL] Team not found: "${teamName}" (normalized: "${normalizedName}")`);
  return null;
}

async function getNFLTeamGames(teamId: number, baseUrl: string): Promise<GameResult[]> {
  const cacheKey = `nfl:games:${teamId}`;
  const cached = getCached<GameResult[]>(cacheKey);
  if (cached) return cached;

  // NFL season
  const season = getCurrentNFLSeason();
  const response = await apiRequest<any>(baseUrl, `/games?team=${teamId}&season=${season}&last=5`);
  
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

  const season = getCurrentNFLSeason();
  const response = await apiRequest<any>(baseUrl, `/teams/statistics?id=${teamId}&season=${season}`);
  
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
      
      case 'nba':
        return await fetchNBAData(homeTeam, awayTeam, baseUrl);
      
      case 'basketball':
        return await fetchBasketballData(homeTeam, awayTeam, baseUrl);
      
      case 'hockey':
        return await fetchHockeyData(homeTeam, awayTeam, baseUrl);
      
      case 'american_football':
        return await fetchNFLData(homeTeam, awayTeam, baseUrl);
      
      case 'mma':
        return await fetchMMAData(homeTeam, awayTeam, baseUrl);
      
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

// ============================================
// NBA-SPECIFIC FUNCTIONS (v2.nba.api-sports.io)
// ============================================

/**
 * Get current NBA season (format: 2024 for 2024-25 season)
 */
function getCurrentNBASeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // NBA season starts in October
  if (month >= 10) {
    return year;
  }
  return year - 1;
}

async function findNBATeam(teamName: string, baseUrl: string): Promise<number | null> {
  const normalizedName = normalizeBasketballTeamName(teamName);
  const cacheKey = `nba:team:${normalizedName}`;
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  // NBA API uses different search - try both normalized and original
  let response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(normalizedName)}`);
  
  if (!response?.response?.length && normalizedName !== teamName) {
    response = await apiRequest<any>(baseUrl, `/teams?search=${encodeURIComponent(teamName)}`);
  }
  
  if (response?.response?.length > 0) {
    // Filter for NBA franchise teams only
    const nbaTeam = response.response.find((t: any) => t.nbaFranchise === true) || response.response[0];
    const teamId = nbaTeam.id;
    console.log(`[NBA] Found team "${teamName}" -> ID ${teamId} (${nbaTeam.name})`);
    setCache(cacheKey, teamId);
    return teamId;
  }
  
  console.warn(`[NBA] Team not found: "${teamName}" (normalized: "${normalizedName}")`);
  return null;
}

async function getNBATeamGames(teamId: number, baseUrl: string): Promise<GameResult[]> {
  const cacheKey = `nba:games:${teamId}`;
  const cached = getCached<GameResult[]>(cacheKey);
  if (cached) return cached;

  const season = getCurrentNBASeason();
  const response = await apiRequest<{ response: NBAGame[] }>(baseUrl, `/games?team=${teamId}&season=${season}`);
  
  if (!response?.response) return [];

  // Filter for finished games and get last 5
  const finishedGames = response.response
    .filter((game: NBAGame) => game.status?.short === 3 || game.status?.long === 'Finished')
    .sort((a: NBAGame, b: NBAGame) => new Date(b.date.start).getTime() - new Date(a.date.start).getTime())
    .slice(0, 5);

  const games: GameResult[] = finishedGames.map((game: NBAGame) => {
    const isHome = game.teams.home.id === teamId;
    const teamScore = isHome ? game.scores.home.points : game.scores.visitors.points;
    const oppScore = isHome ? game.scores.visitors.points : game.scores.home.points;
    
    const result: 'W' | 'L' = teamScore > oppScore ? 'W' : 'L';

    return {
      result,
      score: `${game.scores.home.points}-${game.scores.visitors.points}`,
      opponent: isHome ? game.teams.visitors.name : game.teams.home.name,
      date: game.date.start,
      home: isHome,
    };
  });

  setCache(cacheKey, games);
  return games;
}

async function getNBATeamStats(teamId: number, baseUrl: string): Promise<TeamSeasonStats | null> {
  const cacheKey = `nba:stats:${teamId}`;
  const cached = getCached<TeamSeasonStats>(cacheKey);
  if (cached) return cached;

  const season = getCurrentNBASeason();
  const response = await apiRequest<{ response: NBAStanding[] }>(baseUrl, `/standings?team=${teamId}&season=${season}&league=standard`);
  
  if (!response?.response?.length) return null;
  
  const standing = response.response[0];
  const stats: TeamSeasonStats = {
    gamesPlayed: (standing.win?.total || 0) + (standing.loss?.total || 0),
    wins: standing.win?.total || 0,
    losses: standing.loss?.total || 0,
    pointsFor: 0, // Not directly available in standings
    pointsAgainst: 0,
    winPercentage: standing.win?.percentage ? parseFloat(standing.win.percentage) : 0,
  };

  setCache(cacheKey, stats);
  return stats;
}

async function getNBAH2H(homeTeamId: number, awayTeamId: number, baseUrl: string): Promise<{ matches: H2HMatch[], summary: { totalMatches: number, homeWins: number, awayWins: number, draws: number } } | null> {
  const cacheKey = `nba:h2h:${homeTeamId}:${awayTeamId}`;
  const cached = getCached<{ matches: H2HMatch[], summary: { totalMatches: number, homeWins: number, awayWins: number, draws: number } }>(cacheKey);
  if (cached) return cached;

  const season = getCurrentNBASeason();
  // Get games where both teams played each other
  const response = await apiRequest<{ response: NBAGame[] }>(baseUrl, `/games?h2h=${homeTeamId}-${awayTeamId}&season=${season}`);
  
  if (!response?.response?.length) return null;

  let homeWins = 0;
  let awayWins = 0;

  const matches: H2HMatch[] = response.response
    .filter((game: NBAGame) => game.status?.short === 3 || game.status?.long === 'Finished')
    .slice(0, 5)
    .map((game: NBAGame) => {
      const homeScore = game.scores.home.points;
      const awayScore = game.scores.visitors.points;
      
      // Determine winner relative to our home/away teams
      const gameHomeTeamId = game.teams.home.id;
      if (gameHomeTeamId === homeTeamId) {
        if (homeScore > awayScore) homeWins++;
        else awayWins++;
      } else {
        if (awayScore > homeScore) homeWins++;
        else awayWins++;
      }

      return {
        date: game.date.start,
        homeTeam: game.teams.home.name,
        awayTeam: game.teams.visitors.name,
        homeScore,
        awayScore,
      };
    });

  const result = {
    matches,
    summary: {
      totalMatches: matches.length,
      homeWins,
      awayWins,
      draws: 0, // NBA has no draws
    }
  };

  setCache(cacheKey, result);
  return result;
}

async function fetchNBAData(homeTeam: string, awayTeam: string, baseUrl: string): Promise<MultiSportEnrichedData> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findNBATeam(homeTeam, baseUrl),
    findNBATeam(awayTeam, baseUrl),
  ]);

  if (!homeTeamId || !awayTeamId) {
    console.warn(`[NBA] Could not find teams: ${homeTeam} (${homeTeamId}) or ${awayTeam} (${awayTeamId})`);
    return {
      sport: 'nba',
      homeForm: null,
      awayForm: null,
      headToHead: null,
      h2hSummary: null,
      homeStats: null,
      awayStats: null,
      dataSource: 'UNAVAILABLE',
    };
  }

  console.log(`[NBA] Found both teams - Home: ${homeTeamId}, Away: ${awayTeamId}`);

  const [homeGames, awayGames, homeSeasonStats, awaySeasonStats, h2hData] = await Promise.all([
    getNBATeamGames(homeTeamId, baseUrl),
    getNBATeamGames(awayTeamId, baseUrl),
    getNBATeamStats(homeTeamId, baseUrl),
    getNBATeamStats(awayTeamId, baseUrl),
    getNBAH2H(homeTeamId, awayTeamId, baseUrl),
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

  // For NBA, use win percentage as a stat indicator
  const homeStats: TeamStats | null = homeSeasonStats ? {
    goalsScored: homeSeasonStats.wins,
    goalsConceded: homeSeasonStats.losses,
    cleanSheets: 0,
    avgGoalsScored: homeSeasonStats.winPercentage || 0,
    avgGoalsConceded: 1 - (homeSeasonStats.winPercentage || 0),
  } : null;

  const awayStats: TeamStats | null = awaySeasonStats ? {
    goalsScored: awaySeasonStats.wins,
    goalsConceded: awaySeasonStats.losses,
    cleanSheets: 0,
    avgGoalsScored: awaySeasonStats.winPercentage || 0,
    avgGoalsConceded: 1 - (awaySeasonStats.winPercentage || 0),
  } : null;

  console.log(`[NBA] Data fetched - Home form: ${homeForm?.length || 0} games, Away form: ${awayForm?.length || 0} games, H2H: ${h2hData?.matches?.length || 0} games`);

  return {
    sport: 'nba',
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

  const [homeGames, awayGames, homeSeasonStats, awaySeasonStats, h2hData] = await Promise.all([
    getHockeyTeamGames(homeTeamId, baseUrl),
    getHockeyTeamGames(awayTeamId, baseUrl),
    getHockeyTeamStats(homeTeamId, baseUrl),
    getHockeyTeamStats(awayTeamId, baseUrl),
    getHockeyH2H(homeTeamId, awayTeamId, baseUrl),
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

  // For hockey, use goals instead of points
  const homeStats: TeamStats | null = homeSeasonStats ? {
    goalsScored: homeSeasonStats.pointsFor,
    goalsConceded: homeSeasonStats.pointsAgainst,
    cleanSheets: 0, // Shutouts - would need separate tracking
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
    sport: 'hockey',
    homeForm,
    awayForm,
    headToHead: h2hData?.matches || null,
    h2hSummary: h2hData?.summary || null,
    homeStats,
    awayStats,
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

// ============================================
// MMA-SPECIFIC FUNCTIONS (v1.mma.api-sports.io)
// ============================================

async function findMMAFighter(fighterName: string, baseUrl: string): Promise<number | null> {
  // Normalize fighter name - remove common prefixes/suffixes
  const normalizedName = fighterName
    .replace(/\s*\(.*?\)\s*/g, '') // Remove anything in parentheses
    .replace(/\s+/g, ' ')
    .trim();
  
  const cacheKey = `mma:fighter:${normalizedName.toLowerCase()}`;
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  // Try exact name search first
  let response = await apiRequest<{ response: MMAFighter[] }>(baseUrl, `/fighters?search=${encodeURIComponent(normalizedName)}`);
  
  // If not found, try with just the last name
  if (!response?.response?.length) {
    const lastName = normalizedName.split(' ').pop() || normalizedName;
    response = await apiRequest<{ response: MMAFighter[] }>(baseUrl, `/fighters?search=${encodeURIComponent(lastName)}`);
  }
  
  if (response?.response?.length > 0) {
    // Try to find exact match first
    const exactMatch = response.response.find((f: MMAFighter) => 
      f.name.toLowerCase() === normalizedName.toLowerCase()
    );
    const fighter = exactMatch || response.response[0];
    const fighterId = fighter.id;
    console.log(`[MMA] Found fighter "${fighterName}" -> ID ${fighterId} (${fighter.name})`);
    setCache(cacheKey, fighterId);
    return fighterId;
  }
  
  console.warn(`[MMA] Fighter not found: "${fighterName}" (normalized: "${normalizedName}")`);
  return null;
}

async function getMMAFighterRecord(fighterId: number, baseUrl: string): Promise<MMAFighterRecord | null> {
  const cacheKey = `mma:record:${fighterId}`;
  const cached = getCached<MMAFighterRecord>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<{ response: MMAFighterRecord[] }>(baseUrl, `/fighters/records?id=${fighterId}`);
  
  if (!response?.response?.length) return null;
  
  const record = response.response[0];
  const fighterRecord: MMAFighterRecord = {
    total: record.total || { win: 0, loss: 0, draw: 0 },
    ko: record.ko || { win: 0, loss: 0 },
    sub: record.sub || { win: 0, loss: 0 },
  };

  setCache(cacheKey, fighterRecord);
  return fighterRecord;
}

async function getMMAFighterFights(fighterId: number, baseUrl: string): Promise<MMAFight[]> {
  const cacheKey = `mma:fights:${fighterId}`;
  const cached = getCached<MMAFight[]>(cacheKey);
  if (cached) return cached;

  // Get fights from recent seasons
  const currentYear = new Date().getFullYear();
  const seasons = [currentYear, currentYear - 1];
  
  const allFights: MMAFight[] = [];
  
  for (const season of seasons) {
    const response = await apiRequest<{ response: MMAFight[] }>(baseUrl, `/fights?fighter=${fighterId}&season=${season}`);
    if (response?.response?.length) {
      allFights.push(...response.response);
    }
    if (allFights.length >= 5) break;
  }

  // Filter finished fights and sort by date
  const finishedFights = allFights
    .filter((f: MMAFight) => f.status.short === 'FT' || f.status.long === 'Finished')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  setCache(cacheKey, finishedFights);
  return finishedFights;
}

async function getMMAH2H(_fighter1Id: number, _fighter2Id: number, _baseUrl: string): Promise<{ matches: H2HMatch[], summary: { totalMatches: number, homeWins: number, awayWins: number, draws: number } } | null> {
  // For MMA, we need to search through both fighters' fight histories to find common opponents
  // The API doesn't have a direct H2H endpoint, so this is limited
  // For now, return null as direct H2H in MMA is rare
  return null;
}

function convertMMAFightsToForm(fights: MMAFight[], fighterId: number): GameResult[] {
  return fights.map(fight => {
    const isFirstFighter = fight.fighters.first.id === fighterId;
    const fighterData = isFirstFighter ? fight.fighters.first : fight.fighters.second;
    const opponentData = isFirstFighter ? fight.fighters.second : fight.fighters.first;
    
    let result: 'W' | 'L' | 'D';
    if (fighterData.winner) {
      result = 'W';
    } else if (opponentData.winner) {
      result = 'L';
    } else {
      result = 'D'; // Draw or NC
    }

    return {
      result,
      score: fight.status.long || fight.status.short,
      opponent: opponentData.name,
      date: fight.date,
      home: true, // MMA doesn't have home/away
    };
  });
}

async function fetchMMAData(fighter1: string, fighter2: string, baseUrl: string): Promise<MultiSportEnrichedData> {
  const [fighter1Id, fighter2Id] = await Promise.all([
    findMMAFighter(fighter1, baseUrl),
    findMMAFighter(fighter2, baseUrl),
  ]);

  if (!fighter1Id || !fighter2Id) {
    console.warn(`[MMA] Could not find fighters: ${fighter1} (${fighter1Id}) or ${fighter2} (${fighter2Id})`);
    return {
      sport: 'mma',
      homeForm: null,
      awayForm: null,
      headToHead: null,
      h2hSummary: null,
      homeStats: null,
      awayStats: null,
      dataSource: 'UNAVAILABLE',
    };
  }

  console.log(`[MMA] Found both fighters - Fighter 1: ${fighter1Id}, Fighter 2: ${fighter2Id}`);

  const [fighter1Fights, fighter2Fights, fighter1Record, fighter2Record, h2hData] = await Promise.all([
    getMMAFighterFights(fighter1Id, baseUrl),
    getMMAFighterFights(fighter2Id, baseUrl),
    getMMAFighterRecord(fighter1Id, baseUrl),
    getMMAFighterRecord(fighter2Id, baseUrl),
    getMMAH2H(fighter1Id, fighter2Id, baseUrl),
  ]);

  const homeForm = fighter1Fights.length > 0 
    ? convertMMAFightsToForm(fighter1Fights, fighter1Id).map(f => ({
        result: f.result as 'W' | 'D' | 'L',
        score: f.score,
        opponent: f.opponent,
        date: f.date,
        home: f.home,
      }))
    : null;

  const awayForm = fighter2Fights.length > 0 
    ? convertMMAFightsToForm(fighter2Fights, fighter2Id).map(f => ({
        result: f.result as 'W' | 'D' | 'L',
        score: f.score,
        opponent: f.opponent,
        date: f.date,
        home: f.home,
      }))
    : null;

  // For MMA, use wins/losses as stats
  const homeStats: TeamStats | null = fighter1Record ? {
    goalsScored: fighter1Record.total.win,
    goalsConceded: fighter1Record.total.loss,
    cleanSheets: fighter1Record.ko.win + fighter1Record.sub.win, // Finishes
    avgGoalsScored: fighter1Record.total.win + fighter1Record.total.loss > 0
      ? Math.round((fighter1Record.total.win / (fighter1Record.total.win + fighter1Record.total.loss)) * 100) / 100
      : 0,
    avgGoalsConceded: fighter1Record.total.win + fighter1Record.total.loss > 0
      ? Math.round((fighter1Record.total.loss / (fighter1Record.total.win + fighter1Record.total.loss)) * 100) / 100
      : 0,
  } : null;

  const awayStats: TeamStats | null = fighter2Record ? {
    goalsScored: fighter2Record.total.win,
    goalsConceded: fighter2Record.total.loss,
    cleanSheets: fighter2Record.ko.win + fighter2Record.sub.win, // Finishes
    avgGoalsScored: fighter2Record.total.win + fighter2Record.total.loss > 0
      ? Math.round((fighter2Record.total.win / (fighter2Record.total.win + fighter2Record.total.loss)) * 100) / 100
      : 0,
    avgGoalsConceded: fighter2Record.total.win + fighter2Record.total.loss > 0
      ? Math.round((fighter2Record.total.loss / (fighter2Record.total.win + fighter2Record.total.loss)) * 100) / 100
      : 0,
  } : null;

  console.log(`[MMA] Data fetched - Fighter 1 fights: ${homeForm?.length || 0}, Fighter 2 fights: ${awayForm?.length || 0}`);

  return {
    sport: 'mma',
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
    case 'nba': return 'API-NBA';
    case 'basketball': return 'API-Basketball';
    case 'hockey': return 'API-Hockey';
    case 'american_football': return 'API-NFL';
    case 'baseball': return 'API-Baseball';
    case 'mma': return 'API-MMA';
    default: return 'API-Sports';
  }
}
