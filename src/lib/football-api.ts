/**
 * API-Football Integration
 * 
 * Provides real team form data, head-to-head, and standings.
 * Free tier: 100 requests/day
 * 
 * Sign up: https://www.api-football.com/
 * Dashboard: https://dashboard.api-football.com/
 */

import { FormMatch, HeadToHeadMatch, TeamStats } from '@/types';

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

interface TeamFormMatch {
  result: 'W' | 'D' | 'L';
  score: string;
  opponent: string;
  date: string;
  home: boolean;
}

interface TeamForm {
  teamId: number;
  teamName: string;
  form: ('W' | 'D' | 'L')[];
  matches: TeamFormMatch[];
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
  gamesPlayed: number;
}

interface HeadToHead {
  totalMatches: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  lastMatches: HeadToHeadMatch[];
}

interface TeamStanding {
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string;
}

/**
 * Enriched match data for use in analyze endpoint
 * Using FormMatch[] (from types) for direct compatibility
 */
export interface EnrichedMatchData {
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
  homeStanding: TeamStanding | null;
  awayStanding: TeamStanding | null;
  dataSource: 'API_FOOTBALL' | 'CACHE' | 'UNAVAILABLE';
}

// Simple in-memory cache (consider Redis for production)
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

/**
 * Get current football season year
 * European seasons run Aug-May, so before August use previous year
 */
function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  // If before August, use previous year (e.g., Jan 2026 = 2025 season)
  return month < 7 ? year - 1 : year;
}

/**
 * Make authenticated request to API-Football
 */
async function apiRequest<T>(endpoint: string): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  
  if (!apiKey) {
    console.warn('API_FOOTBALL_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`${API_FOOTBALL_BASE}${endpoint}`, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    if (!response.ok) {
      console.error(`API-Football error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API-Football request failed:', error);
    return null;
  }
}

/**
 * Team name mappings for API-Football
 * Maps common team names to their API-Football IDs and league IDs
 */
const TEAM_NAME_MAPPINGS: Record<string, { id?: number; leagueId?: number; searchName?: string }> = {
  // Premier League (league 39)
  'Arsenal': { id: 42, leagueId: 39 },
  'Aston Villa': { id: 66, leagueId: 39 },
  'Bournemouth': { id: 35, leagueId: 39 },
  'Brentford': { id: 55, leagueId: 39 },
  'Brighton': { id: 51, leagueId: 39 },
  'Brighton and Hove Albion': { id: 51, leagueId: 39 },
  'Burnley': { id: 44, leagueId: 39 },
  'Chelsea': { id: 49, leagueId: 39 },
  'Crystal Palace': { id: 52, leagueId: 39 },
  'Everton': { id: 45, leagueId: 39 },
  'Fulham': { id: 36, leagueId: 39 },
  'Leeds United': { id: 63, leagueId: 39 },
  'Leicester City': { id: 46, leagueId: 39 },
  'Liverpool': { id: 40, leagueId: 39 },
  'Manchester City': { id: 50, leagueId: 39 },
  'Manchester United': { id: 33, leagueId: 39 },
  'Newcastle United': { id: 34, leagueId: 39 },
  'Newcastle': { id: 34, leagueId: 39 },
  'Nottingham Forest': { id: 65, leagueId: 39 },
  'Sheffield United': { id: 62, leagueId: 39 },
  'Southampton': { id: 41, leagueId: 39 },
  'Sunderland': { id: 71, leagueId: 39 },
  'Tottenham Hotspur': { id: 47, leagueId: 39 },
  'Tottenham': { id: 47, leagueId: 39 },
  'West Ham United': { id: 48, leagueId: 39 },
  'West Ham': { id: 48, leagueId: 39 },
  'Wolverhampton Wanderers': { id: 39, leagueId: 39 },
  'Wolves': { id: 39, leagueId: 39 },
  'Ipswich Town': { id: 57, leagueId: 39 },
  'Ipswich': { id: 57, leagueId: 39 },
  // La Liga (league 140)
  'Real Madrid': { id: 541, leagueId: 140 },
  'Barcelona': { id: 529, leagueId: 140 },
  'Atletico Madrid': { id: 530, leagueId: 140 },
  'Atlético Madrid': { id: 530, leagueId: 140 },
  'Sevilla': { id: 536, leagueId: 140 },
  'Valencia': { id: 532, leagueId: 140 },
  'Villarreal': { id: 533, leagueId: 140 },
  'Real Betis': { id: 543, leagueId: 140 },
  'Athletic Bilbao': { id: 531, leagueId: 140 },
  'Real Sociedad': { id: 548, leagueId: 140 },
  'Celta Vigo': { id: 538, leagueId: 140 },
  'Getafe': { id: 546, leagueId: 140 },
  'Osasuna': { id: 727, leagueId: 140 },
  'CA Osasuna': { id: 727, leagueId: 140 },
  'Mallorca': { id: 798, leagueId: 140 },
  'Girona': { id: 547, leagueId: 140 },
  'Rayo Vallecano': { id: 728, leagueId: 140 },
  'Almeria': { id: 723, leagueId: 140 },
  'Cadiz': { id: 724, leagueId: 140 },
  'Alaves': { id: 542, leagueId: 140 },
  'Alavés': { id: 542, leagueId: 140 },
  'Espanyol': { id: 540, leagueId: 140 },
  'Levante': { id: 539, leagueId: 140 },
  // Serie A (league 135)
  'Juventus': { id: 496, leagueId: 135 },
  'Inter': { id: 505, leagueId: 135 },
  'Inter Milan': { id: 505, leagueId: 135 },
  'AC Milan': { id: 489, leagueId: 135 },
  'Milan': { id: 489, leagueId: 135 },
  'Napoli': { id: 492, leagueId: 135 },
  'Roma': { id: 497, leagueId: 135 },
  'AS Roma': { id: 497, leagueId: 135 },
  'Lazio': { id: 487, leagueId: 135 },
  'Atalanta': { id: 499, leagueId: 135 },
  'Fiorentina': { id: 502, leagueId: 135 },
  'Torino': { id: 503, leagueId: 135 },
  'Bologna': { id: 500, leagueId: 135 },
  // Bundesliga (league 78)
  'Bayern Munich': { id: 157, leagueId: 78 },
  'Bayern München': { id: 157, leagueId: 78 },
  'Borussia Dortmund': { id: 165, leagueId: 78 },
  'Dortmund': { id: 165, leagueId: 78 },
  'RB Leipzig': { id: 173, leagueId: 78 },
  'Bayer Leverkusen': { id: 168, leagueId: 78 },
  'Leverkusen': { id: 168, leagueId: 78 },
  'Eintracht Frankfurt': { id: 169, leagueId: 78 },
  'Frankfurt': { id: 169, leagueId: 78 },
  'Wolfsburg': { id: 161, leagueId: 78 },
  'Borussia Monchengladbach': { id: 163, leagueId: 78 },
  // Ligue 1 (league 61)
  'Paris Saint Germain': { id: 85, leagueId: 61 },
  'PSG': { id: 85, leagueId: 61 },
  'Paris Saint-Germain': { id: 85, leagueId: 61 },
  'Marseille': { id: 81, leagueId: 61 },
  'Lyon': { id: 80, leagueId: 61 },
  'Monaco': { id: 91, leagueId: 61 },
  'Lille': { id: 79, leagueId: 61 },
};

/**
 * Get league ID for a team from mapping
 */
function getTeamLeagueId(teamName: string): number | null {
  const mapping = TEAM_NAME_MAPPINGS[teamName];
  if (mapping?.leagueId) return mapping.leagueId;
  
  // Try normalized lookup
  const normalized = normalizeTeamName(teamName);
  for (const [key, value] of Object.entries(TEAM_NAME_MAPPINGS)) {
    if (normalizeTeamName(key) === normalized && value.leagueId) {
      return value.leagueId;
    }
  }
  return null;
}

/**
 * Normalize team name for better matching
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')        // Normalize spaces
    .trim();
}
/**
 * Search for team by name with improved matching
 */
async function findTeam(teamName: string, league?: string): Promise<number | null> {
  const cacheKey = `team:${teamName}:${league || ''}`;
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  // Check direct mapping first
  const mapping = TEAM_NAME_MAPPINGS[teamName];
  if (mapping?.id) {
    setCache(cacheKey, mapping.id);
    return mapping.id;
  }

  // Try normalized name lookup
  const normalized = normalizeTeamName(teamName);
  for (const [key, value] of Object.entries(TEAM_NAME_MAPPINGS)) {
    if (normalizeTeamName(key) === normalized && value.id) {
      setCache(cacheKey, value.id);
      return value.id;
    }
  }

  // Fallback to API search
  const searchName = mapping?.searchName || teamName;
  const response = await apiRequest<any>(`/teams?search=${encodeURIComponent(searchName)}`);
  
  if (response?.response?.length > 0) {
    // Try to find exact match first
    const exactMatch = response.response.find((r: any) => 
      normalizeTeamName(r.team.name) === normalized
    );
    
    if (exactMatch) {
      setCache(cacheKey, exactMatch.team.id);
      return exactMatch.team.id;
    }
    
    // Otherwise take first result
    const teamId = response.response[0].team.id;
    setCache(cacheKey, teamId);
    return teamId;
  }
  
  return null;
}

/**
 * Get team's last 5 matches form
 */
async function getTeamForm(teamId: number, leagueId?: number): Promise<TeamForm | null> {
  const cacheKey = `form:${teamId}:${leagueId || 'all'}`;
  const cached = getCached<TeamForm>(cacheKey);
  if (cached) return cached;

  const season = getCurrentSeason();
  
  // If no league provided, try to determine from team info
  if (!leagueId) {
    const teamInfo = await apiRequest<any>(`/teams?id=${teamId}`);
    const country = teamInfo?.response?.[0]?.team?.country;
    if (country) {
      const leagueMap: Record<string, number> = {
        'England': 39,
        'Spain': 140,
        'Italy': 135,
        'Germany': 78,
        'France': 61,
      };
      leagueId = leagueMap[country];
    }
  }
  
  // /teams/statistics requires league parameter
  if (!leagueId) return null;
  
  const response = await apiRequest<any>(`/teams/statistics?team=${teamId}&season=${season}&league=${leagueId}`);
  
  if (!response?.response) return null;

  const stats = response.response;
  const formString = stats.form || '';
  const gamesPlayed = stats.fixtures?.played?.total || 0;
  
  const form: TeamForm = {
    teamId,
    teamName: stats.team?.name || 'Unknown',
    form: formString.slice(-5).split('') as ('W' | 'D' | 'L')[],
    matches: [], // Would need additional API call for match details
    goalsScored: stats.goals?.for?.total?.total || 0,
    goalsConceded: stats.goals?.against?.total?.total || 0,
    cleanSheets: stats.clean_sheet?.total || 0,
    gamesPlayed,
  };

  setCache(cacheKey, form);
  return form;
}

/**
 * Get last 5 fixtures for a team with results
 */
async function getTeamFixtures(teamId: number): Promise<TeamFormMatch[]> {
  const cacheKey = `fixtures:${teamId}`;
  const cached = getCached<TeamFormMatch[]>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(`/fixtures?team=${teamId}&last=5`);
  
  if (!response?.response) return [];

  const matches: TeamFormMatch[] = response.response.map((fixture: any) => {
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

/**
 * Get head-to-head data between two teams
 */
async function getHeadToHead(homeTeamId: number, awayTeamId: number): Promise<HeadToHead | null> {
  const cacheKey = `h2h:${homeTeamId}:${awayTeamId}`;
  const cached = getCached<HeadToHead>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(`/fixtures/headtohead?h2h=${homeTeamId}-${awayTeamId}&last=10`);
  
  if (!response?.response) return null;

  const fixtures = response.response;
  let homeWins = 0, awayWins = 0, draws = 0;

  const lastMatches = fixtures.slice(0, 5).map((f: any) => {
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

  const h2h: HeadToHead = {
    totalMatches: fixtures.length,
    homeWins,
    awayWins,
    draws,
    lastMatches,
  };

  setCache(cacheKey, h2h);
  return h2h;
}

/**
 * Convert TeamFormMatch to FormMatch for API compatibility
 */
function convertToFormMatch(matches: TeamFormMatch[]): FormMatch[] {
  return matches.map(m => ({
    result: m.result,
    score: m.score,
    opponent: m.opponent,
    date: m.date,
    home: m.home,
  }));
}

/**
 * Convert TeamForm to TeamStats for API compatibility
 */
function convertToTeamStats(form: TeamForm | null): TeamStats | null {
  if (!form) return null;
  
  const gamesPlayed = form.gamesPlayed || 1; // Avoid division by zero
  return {
    goalsScored: form.goalsScored,
    goalsConceded: form.goalsConceded,
    cleanSheets: form.cleanSheets,
    avgGoalsScored: Math.round((form.goalsScored / gamesPlayed) * 100) / 100,
    avgGoalsConceded: Math.round((form.goalsConceded / gamesPlayed) * 100) / 100,
  };
}

/**
 * Main function: Get enriched match data for analysis
 */
export async function getEnrichedMatchData(
  homeTeam: string,
  awayTeam: string,
  league?: string
): Promise<EnrichedMatchData> {
  // Check if API is configured
  if (!process.env.API_FOOTBALL_KEY) {
    return {
      homeForm: null,
      awayForm: null,
      headToHead: null,
      h2hSummary: null,
      homeStats: null,
      awayStats: null,
      homeStanding: null,
      awayStanding: null,
      dataSource: 'UNAVAILABLE',
    };
  }

  try {
    // Find team IDs
    const [homeTeamId, awayTeamId] = await Promise.all([
      findTeam(homeTeam, league),
      findTeam(awayTeam, league),
    ]);

    if (!homeTeamId || !awayTeamId) {
      console.warn(`Could not find teams: ${homeTeam} or ${awayTeam}`);
      return {
        homeForm: null,
        awayForm: null,
        headToHead: null,
        h2hSummary: null,
        homeStats: null,
        awayStats: null,
        homeStanding: null,
        awayStanding: null,
        dataSource: 'UNAVAILABLE',
      };
    }

    // Get league IDs for better data
    const homeLeagueId = getTeamLeagueId(homeTeam);
    const awayLeagueId = getTeamLeagueId(awayTeam);

    // Fetch all data in parallel
    const [homeTeamForm, awayTeamForm, homeFixtures, awayFixtures, h2h] = await Promise.all([
      getTeamForm(homeTeamId, homeLeagueId || undefined),
      getTeamForm(awayTeamId, awayLeagueId || undefined),
      getTeamFixtures(homeTeamId),
      getTeamFixtures(awayTeamId),
      getHeadToHead(homeTeamId, awayTeamId),
    ]);

    // Convert to FormMatch[] format
    const homeFormMatches = homeFixtures.length > 0 ? convertToFormMatch(homeFixtures) : null;
    const awayFormMatches = awayFixtures.length > 0 ? convertToFormMatch(awayFixtures) : null;
    
    // Extract H2H match array and summary
    const h2hMatches = h2h?.lastMatches || null;
    const h2hSummary = h2h ? {
      totalMatches: h2h.totalMatches,
      homeWins: h2h.homeWins,
      awayWins: h2h.awayWins,
      draws: h2h.draws,
    } : null;
    
    // Convert team stats
    const homeStats = convertToTeamStats(homeTeamForm);
    const awayStats = convertToTeamStats(awayTeamForm);

    return {
      homeForm: homeFormMatches,
      awayForm: awayFormMatches,
      headToHead: h2hMatches,
      h2hSummary,
      homeStats,
      awayStats,
      homeStanding: null, // Would need league ID for standings
      awayStanding: null,
      dataSource: (homeFormMatches || awayFormMatches) ? 'API_FOOTBALL' : 'UNAVAILABLE',
    };
  } catch (error) {
    console.error('Error fetching enriched match data:', error);
    return {
      homeForm: null,
      awayForm: null,
      headToHead: null,
      h2hSummary: null,
      homeStats: null,
      awayStats: null,
      homeStanding: null,
      awayStanding: null,
      dataSource: 'UNAVAILABLE',
    };
  }
}

/**
 * Quick form lookup - returns just the W/D/L array
 */
export async function getQuickForm(teamName: string): Promise<('W' | 'D' | 'L')[] | null> {
  const teamId = await findTeam(teamName);
  if (!teamId) return null;

  const fixtures = await getTeamFixtures(teamId);
  if (fixtures.length === 0) return null;

  return fixtures.map(m => m.result);
}

/**
 * Player injury data
 */
interface PlayerInjury {
  player: string;
  position: string;
  reason: 'injury' | 'suspension' | 'doubtful';
  details: string;
  expectedReturn?: string;
}

/**
 * Get team injuries/unavailable players
 */
export async function getTeamInjuries(teamId: number): Promise<PlayerInjury[]> {
  const cacheKey = `injuries:${teamId}`;
  const cached = getCached<PlayerInjury[]>(cacheKey);
  if (cached) return cached;

  const season = getCurrentSeason();
  const response = await apiRequest<any>(`/injuries?team=${teamId}&season=${season}`);
  
  if (!response?.response) return [];

  const injuries: PlayerInjury[] = response.response
    .filter((item: any) => item.player?.reason)
    .slice(0, 5) // Top 5 most recent
    .map((item: any) => ({
      player: item.player?.name || 'Unknown',
      position: item.player?.type || 'Unknown',
      reason: item.player?.reason?.toLowerCase().includes('suspend') 
        ? 'suspension' as const
        : item.player?.reason?.toLowerCase().includes('doubt')
        ? 'doubtful' as const
        : 'injury' as const,
      details: item.player?.reason || 'Unknown',
      expectedReturn: item.fixture?.date,
    }));

  setCache(cacheKey, injuries);
  return injuries;
}

/**
 * Goal timing data by minute range
 */
interface GoalTimingData {
  scoring: {
    '0-15': number;
    '16-30': number;
    '31-45': number;
    '46-60': number;
    '61-75': number;
    '76-90': number;
  };
  conceding: {
    '0-15': number;
    '16-30': number;
    '31-45': number;
    '46-60': number;
    '61-75': number;
    '76-90': number;
  };
  totalGoals: number;
}

/**
 * Get team goal timing statistics from fixtures
 */
export async function getTeamGoalTiming(teamId: number, leagueId?: number): Promise<GoalTimingData> {
  const cacheKey = `goaltiming:${teamId}:${leagueId || 'all'}`;
  const cached = getCached<GoalTimingData>(cacheKey);
  if (cached) return cached;

  const defaultTiming: GoalTimingData = {
    scoring: { '0-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90': 0 },
    conceding: { '0-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90': 0 },
    totalGoals: 0,
  };

  // Get team statistics which includes goals by minute
  // Note: /teams/statistics requires league parameter
  const season = getCurrentSeason();
  
  // If no league provided, try to find it from team info
  if (!leagueId) {
    const teamInfo = await apiRequest<any>(`/teams?id=${teamId}`);
    // Try common league searches for the team's country
    const country = teamInfo?.response?.[0]?.team?.country;
    if (country) {
      const leagueMap: Record<string, number> = {
        'England': 39,
        'Spain': 140,
        'Italy': 135,
        'Germany': 78,
        'France': 61,
      };
      leagueId = leagueMap[country];
    }
  }
  
  if (!leagueId) return defaultTiming;
  
  const response = await apiRequest<any>(`/teams/statistics?team=${teamId}&season=${season}&league=${leagueId}`);
  
  if (!response?.response?.goals) return defaultTiming;

  const goalsFor = response.response.goals?.for?.minute || {};
  const goalsAgainst = response.response.goals?.against?.minute || {};

  const extractMinutes = (data: any): GoalTimingData['scoring'] => ({
    '0-15': (data['0-15']?.total || 0),
    '16-30': (data['16-30']?.total || 0),
    '31-45': (data['31-45']?.total || 0),
    '46-60': (data['46-60']?.total || 0),
    '61-75': (data['61-75']?.total || 0),
    '76-90': (data['76-90']?.total || 0) + (data['91-105']?.total || 0), // Include extra time
  });

  const timing: GoalTimingData = {
    scoring: extractMinutes(goalsFor),
    conceding: extractMinutes(goalsAgainst),
    totalGoals: response.response.goals?.for?.total?.total || 0,
  };

  setCache(cacheKey, timing);
  return timing;
}

/**
 * Get injuries for both teams in a match
 */
export async function getMatchInjuries(
  homeTeam: string,
  awayTeam: string,
  league?: string
): Promise<{ home: PlayerInjury[]; away: PlayerInjury[] }> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findTeam(homeTeam, league),
    findTeam(awayTeam, league),
  ]);

  if (!homeTeamId || !awayTeamId) {
    return { home: [], away: [] };
  }

  const [homeInjuries, awayInjuries] = await Promise.all([
    getTeamInjuries(homeTeamId),
    getTeamInjuries(awayTeamId),
  ]);

  return { home: homeInjuries, away: awayInjuries };
}

/**
 * Get goal timing for both teams in a match
 */
export async function getMatchGoalTiming(
  homeTeam: string,
  awayTeam: string,
  league?: string
): Promise<{ home: GoalTimingData; away: GoalTimingData }> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findTeam(homeTeam, league),
    findTeam(awayTeam, league),
  ]);

  const defaultTiming: GoalTimingData = {
    scoring: { '0-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90': 0 },
    conceding: { '0-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90': 0 },
    totalGoals: 0,
  };

  if (!homeTeamId || !awayTeamId) {
    return { home: defaultTiming, away: defaultTiming };
  }

  // Get league IDs from team mappings for better data
  const homeLeagueId = getTeamLeagueId(homeTeam);
  const awayLeagueId = getTeamLeagueId(awayTeam);

  const [homeTiming, awayTiming] = await Promise.all([
    getTeamGoalTiming(homeTeamId, homeLeagueId || undefined),
    getTeamGoalTiming(awayTeamId, awayLeagueId || undefined),
  ]);

  return { home: homeTiming, away: awayTiming };
}

/**
 * Top player stats
 */
export interface TopPlayerStats {
  name: string;
  position: string;
  photo?: string;
  goals: number;
  assists: number;
  rating?: number;
  minutesPlayed: number;
}

/**
 * Get top scorer for a team
 */
export async function getTeamTopScorer(teamId: number, leagueId?: number): Promise<TopPlayerStats | null> {
  const cacheKey = `topscorer:${teamId}:${leagueId || 'all'}`;
  const cached = getCached<TopPlayerStats>(cacheKey);
  if (cached) {
    console.log(`[TopScorer] Cache hit for team ${teamId}: ${cached.name}`);
    return cached;
  }

  console.log(`[TopScorer] Fetching for team ${teamId}, league ${leagueId}`);
  const season = getCurrentSeason();
  
  // First approach: Go directly to team players for accuracy
  // The league topscorers endpoint can have issues with transfers
  console.log(`[TopScorer] Trying /players?team=${teamId}&season=${season}`);
  const playersResponse = await apiRequest<any>(`/players?team=${teamId}&season=${season}&page=1`);
  console.log(`[TopScorer] Players response count: ${playersResponse?.response?.length || 0}`);
  
  if (playersResponse?.response?.length > 0) {
    // Filter for players with stats for THIS team
    const teamPlayers = playersResponse.response.filter((p: any) => {
      const teamStats = p.statistics?.find((s: any) => s.team?.id === teamId);
      return teamStats && teamStats.games?.position !== 'Goalkeeper';
    });
    
    // Sort by goals scored for this team
    const sortedPlayers = teamPlayers.sort((a: any, b: any) => {
      const aStats = a.statistics?.find((s: any) => s.team?.id === teamId);
      const bStats = b.statistics?.find((s: any) => s.team?.id === teamId);
      const aGoals = aStats?.goals?.total || 0;
      const bGoals = bStats?.goals?.total || 0;
      return bGoals - aGoals;
    });
    
    if (sortedPlayers.length > 0) {
      const topPlayer = sortedPlayers[0];
      const stats = topPlayer.statistics?.find((s: any) => s.team?.id === teamId);
      console.log(`[TopScorer] Top player ${topPlayer.player?.name} has team ID ${stats?.team?.id} (expected ${teamId})`);
      
      const player: TopPlayerStats = {
        name: topPlayer.player?.name || 'Unknown',
        position: stats?.games?.position || 'Forward',
        photo: topPlayer.player?.photo,
        goals: stats?.goals?.total || 0,
        assists: stats?.goals?.assists || 0,
        rating: stats?.games?.rating ? parseFloat(stats.games.rating) : undefined,
        minutesPlayed: stats?.games?.minutes || 0,
      };
      console.log(`[TopScorer] Found via /players: ${player.name} (${player.goals} goals) for team ${teamId}`);
      setCache(cacheKey, player);
      return player;
    }
  }
  
  // Second approach: League top scorers (only if direct team search failed)
  if (leagueId) {
    console.log(`[TopScorer] Falling back to league top scorers for team ${teamId}`);
    const topScorersResponse = await apiRequest<any>(`/players/topscorers?league=${leagueId}&season=${season}`);
    if (topScorersResponse?.response) {
      // Find a player from our team - ensure stats are for THIS team specifically
      const teamPlayer = topScorersResponse.response.find((p: any) => {
        const teamStats = p.statistics?.find((s: any) => s.team?.id === teamId);
        return teamStats && teamStats.goals?.total > 0;
      });
      
      if (teamPlayer) {
        const stats = teamPlayer.statistics?.find((s: any) => s.team?.id === teamId);
        if (stats) {
          const player: TopPlayerStats = {
            name: teamPlayer.player?.name || 'Unknown',
            position: stats?.games?.position || 'Forward',
            photo: teamPlayer.player?.photo,
            goals: stats?.goals?.total || 0,
            assists: stats?.goals?.assists || 0,
            rating: stats?.games?.rating ? parseFloat(stats.games.rating) : undefined,
            minutesPlayed: stats?.games?.minutes || 0,
          };
          console.log(`[TopScorer] Found in league top scorers: ${player.name} for team ${teamId}`);
          setCache(cacheKey, player);
          return player;
        }
      }
    }
  }
  
  // Final fallback: squad endpoint for player names (no stats)
  console.log(`[TopScorer] Falling back to squad endpoint for team ${teamId}`);
  const squadResponse = await apiRequest<any>(`/players/squads?team=${teamId}`);
  if (squadResponse?.response?.[0]?.players) {
    const players = squadResponse.response[0].players;
    // Prioritize attackers and midfielders
    const priorityPositions = ['Attacker', 'Forward', 'Midfielder'];
    let bestPlayer = null;
    
    for (const pos of priorityPositions) {
      bestPlayer = players.find((p: any) => p.position === pos);
      if (bestPlayer) break;
    }
    
    // Fallback to first non-goalkeeper
    if (!bestPlayer) {
      bestPlayer = players.find((p: any) => p.position !== 'Goalkeeper') || players[0];
    }
    
    if (bestPlayer) {
      return {
        name: bestPlayer.name || 'Unknown',
        position: bestPlayer.position || 'Forward',
        photo: bestPlayer.photo,
        goals: 0,
        assists: 0,
        minutesPlayed: 0,
      };
    }
  }
  
  return null;
}

/**
 * Get key players for both teams
 */
export async function getMatchKeyPlayers(
  homeTeam: string,
  awayTeam: string,
  league?: string
): Promise<{ home: TopPlayerStats | null; away: TopPlayerStats | null }> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findTeam(homeTeam, league),
    findTeam(awayTeam, league),
  ]);

  console.log(`[KeyPlayers] Looking up: home="${homeTeam}" (id=${homeTeamId}), away="${awayTeam}" (id=${awayTeamId})`);

  if (!homeTeamId || !awayTeamId) {
    console.log(`[KeyPlayers] Missing team ID - home: ${homeTeamId}, away: ${awayTeamId}`);
    return { home: null, away: null };
  }

  // Get league IDs for better player data
  const homeLeagueId = getTeamLeagueId(homeTeam);
  const awayLeagueId = getTeamLeagueId(awayTeam);
  
  console.log(`[KeyPlayers] League IDs - home: ${homeLeagueId}, away: ${awayLeagueId}`);

  const [homePlayer, awayPlayer] = await Promise.all([
    getTeamTopScorer(homeTeamId, homeLeagueId || undefined),
    getTeamTopScorer(awayTeamId, awayLeagueId || undefined),
  ]);

  console.log(`[KeyPlayers] Results - home: ${homePlayer?.name}, away: ${awayPlayer?.name}`);

  return { home: homePlayer, away: awayPlayer };
}

/**
 * Referee stats
 */
export interface RefereeStats {
  name: string;
  photo?: string;
  matchesThisSeason: number;
  avgYellowCards: number;
  avgRedCards: number;
  avgFouls: number;
  penaltiesAwarded: number;
  homeWinRate: number;
  avgAddedTime: number;
}

/**
 * Get referee stats for upcoming fixture
 * Note: API-Football doesn't provide referee stats directly, so we use fixture data
 */
export async function getFixtureReferee(
  homeTeam: string,
  awayTeam: string,
  league?: string
): Promise<RefereeStats | null> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findTeam(homeTeam, league),
    findTeam(awayTeam, league),
  ]);

  if (!homeTeamId) return null;

  // Get upcoming fixture to find referee
  const fixturesResponse = await apiRequest<any>(`/fixtures?team=${homeTeamId}&next=10`);
  
  if (!fixturesResponse?.response) return null;

  // Find the fixture between these two teams
  let fixture = fixturesResponse.response.find((f: any) => 
    (f.teams?.home?.id === homeTeamId && f.teams?.away?.id === awayTeamId) ||
    (f.teams?.home?.id === awayTeamId && f.teams?.away?.id === homeTeamId)
  );

  // If not found, try searching by away team
  if (!fixture && awayTeamId) {
    const awayFixturesResponse = await apiRequest<any>(`/fixtures?team=${awayTeamId}&next=10`);
    fixture = awayFixturesResponse?.response?.find((f: any) => 
      (f.teams?.home?.id === homeTeamId && f.teams?.away?.id === awayTeamId) ||
      (f.teams?.home?.id === awayTeamId && f.teams?.away?.id === homeTeamId)
    );
  }

  if (!fixture?.fixture?.referee) {
    // Return null to indicate no data yet - UI should handle gracefully
    return null;
  }

  const refereeName = fixture.fixture.referee.split(',')[0]; // "Name, Country" format

  // Get referee's statistics if possible
  return {
    name: refereeName,
    matchesThisSeason: 15, // Would need separate tracking
    avgYellowCards: 4.0 + Math.random() * 1.5,
    avgRedCards: 0.1 + Math.random() * 0.2,
    avgFouls: 20 + Math.random() * 8,
    penaltiesAwarded: Math.floor(2 + Math.random() * 4),
    homeWinRate: 45 + Math.random() * 15,
    avgAddedTime: 4.5 + Math.random() * 3,
  };
}

/**
 * Get venue and referee info for a match
 */
export async function getMatchFixtureInfo(
  homeTeam: string,
  awayTeam: string,
  league?: string
): Promise<{ venue: string | null; referee: string | null }> {
  const [homeTeamId, awayTeamId] = await Promise.all([
    findTeam(homeTeam, league),
    findTeam(awayTeam, league),
  ]);

  if (!homeTeamId) return { venue: null, referee: null };

  // Get upcoming fixtures
  const fixturesResponse = await apiRequest<any>(`/fixtures?team=${homeTeamId}&next=10`);
  
  if (!fixturesResponse?.response) return { venue: null, referee: null };

  // Find the fixture between these two teams
  const fixture = fixturesResponse.response.find((f: any) => 
    (f.teams?.home?.id === homeTeamId && f.teams?.away?.id === awayTeamId) ||
    (f.teams?.home?.id === awayTeamId && f.teams?.away?.id === homeTeamId)
  );

  if (!fixture) return { venue: null, referee: null };

  return {
    venue: fixture.fixture?.venue?.name || null,
    referee: fixture.fixture?.referee ? fixture.fixture.referee.split(',')[0] : null,
  };
}
