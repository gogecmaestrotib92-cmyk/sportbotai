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
 * Search for team by name
 */
async function findTeam(teamName: string, league?: string): Promise<number | null> {
  const cacheKey = `team:${teamName}:${league || ''}`;
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(`/teams?search=${encodeURIComponent(teamName)}`);
  
  if (response?.response?.length > 0) {
    const teamId = response.response[0].team.id;
    setCache(cacheKey, teamId);
    return teamId;
  }
  
  return null;
}

/**
 * Get team's last 5 matches form
 */
async function getTeamForm(teamId: number): Promise<TeamForm | null> {
  const cacheKey = `form:${teamId}`;
  const cached = getCached<TeamForm>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<any>(`/teams/statistics?team=${teamId}&season=2024`);
  
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

    // Fetch all data in parallel
    const [homeTeamForm, awayTeamForm, homeFixtures, awayFixtures, h2h] = await Promise.all([
      getTeamForm(homeTeamId),
      getTeamForm(awayTeamId),
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

  const response = await apiRequest<any>(`/injuries?team=${teamId}&season=2024`);
  
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
export async function getTeamGoalTiming(teamId: number): Promise<GoalTimingData> {
  const cacheKey = `goaltiming:${teamId}`;
  const cached = getCached<GoalTimingData>(cacheKey);
  if (cached) return cached;

  // Get team statistics which includes goals by minute
  const response = await apiRequest<any>(`/teams/statistics?team=${teamId}&season=2024`);
  
  const defaultTiming: GoalTimingData = {
    scoring: { '0-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90': 0 },
    conceding: { '0-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90': 0 },
    totalGoals: 0,
  };

  if (!response?.response?.goals) return defaultTiming;

  const goalsFor = response.response.goals?.for?.minute || {};
  const goalsAgainst = response.response.goals?.against?.minute || {};

  const extractMinutes = (data: any): GoalTimingData['scoring'] => ({
    '0-15': (data['0-15']?.total || 0),
    '16-30': (data['16-30']?.total || 0),
    '31-45': (data['31-45']?.total || 0) + (data['46-60']?.total || 0) * 0, // 31-45 only
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

  const [homeTiming, awayTiming] = await Promise.all([
    getTeamGoalTiming(homeTeamId),
    getTeamGoalTiming(awayTeamId),
  ]);

  return { home: homeTiming, away: awayTiming };
}
