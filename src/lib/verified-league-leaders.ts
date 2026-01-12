/**
 * Verified League Leaders Service
 * 
 * Provides structured league top scorers and top assists data:
 * - Top 20 scorers in any league
 * - Top 20 assist providers
 * - Supports all major European leagues
 * 
 * Uses API-Sports /players/topscorers and /players/topassists endpoints
 */

// API-Sports Football base URL
const API_BASE = 'https://v3.football.api-sports.io';

// ============================================================================
// Types
// ============================================================================

export interface TopPlayer {
  rank: number;
  player: {
    id: number;
    name: string;
    photo: string;
    nationality: string;
    age: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  stats: {
    goals: number;
    assists: number;
    appearances: number;
    minutes: number;
    penalties: number;
  };
}

export interface LeagueLeadersResult {
  success: boolean;
  data: {
    league: { id: number; name: string; country: string; logo: string; season: number };
    type: 'scorers' | 'assists';
    players: TopPlayer[];
  } | null;
  error?: string;
}

// League ID mapping
const LEAGUE_IDS: Record<string, number> = {
  'premier league': 39,
  'epl': 39,
  'english': 39,
  'la liga': 140,
  'spanish': 140,
  'serie a': 135,
  'italian': 135,
  'bundesliga': 78,
  'german': 78,
  'ligue 1': 61,
  'french': 61,
  'champions league': 2,
  'ucl': 2,
  'europa league': 3,
  'mls': 253,
  'eredivisie': 88,
  'portuguese': 94,
  'primeira liga': 94,
  'scottish': 179,
};

// Team name to League mapping (for "Team's top scorer" queries)
const TEAM_TO_LEAGUE: Record<string, number> = {
  // Premier League
  'arsenal': 39, 'chelsea': 39, 'liverpool': 39, 'manchester city': 39, 'man city': 39,
  'manchester united': 39, 'man united': 39, 'tottenham': 39, 'spurs': 39, 'aston villa': 39,
  'newcastle': 39, 'west ham': 39, 'brighton': 39, 'crystal palace': 39, 'everton': 39,
  'fulham': 39, 'brentford': 39, 'nottingham forest': 39, 'bournemouth': 39, 'wolves': 39,
  // La Liga
  'barcelona': 140, 'real madrid': 140, 'atletico madrid': 140, 'atletico': 140, 'sevilla': 140,
  'real sociedad': 140, 'villarreal': 140, 'athletic bilbao': 140, 'valencia': 140, 'betis': 140,
  // Bundesliga
  'bayern munich': 78, 'bayern': 78, 'dortmund': 78, 'borussia dortmund': 78, 'bvb': 78,
  'leipzig': 78, 'rb leipzig': 78, 'leverkusen': 78, 'bayer leverkusen': 78, 'stuttgart': 78,
  'frankfurt': 78, 'eintracht frankfurt': 78, 'wolfsburg': 78, 'gladbach': 78, 'freiburg': 78,
  'union berlin': 78, 'hoffenheim': 78, 'mainz': 78, 'werder bremen': 78, 'augsburg': 78,
  // Serie A
  'inter milan': 135, 'inter': 135, 'ac milan': 135, 'milan': 135, 'juventus': 135, 'juve': 135,
  'napoli': 135, 'roma': 135, 'lazio': 135, 'atalanta': 135, 'fiorentina': 135, 'bologna': 135,
  'sassuolo': 135, 'torino': 135, 'monza': 135, 'udinese': 135, 'empoli': 135, 'lecce': 135,
  // Ligue 1
  'psg': 61, 'paris saint-germain': 61, 'marseille': 61, 'monaco': 61, 'lyon': 61, 'lille': 61,
  'nice': 61, 'lens': 61, 'rennes': 61, 'toulouse': 61, 'montpellier': 61, 'nantes': 61,
};

// ============================================================================
// Detection
// ============================================================================

/**
 * Check if query is asking for league top scorers
 */
export function isTopScorersQuery(message: string): boolean {
  return /top\s*scor|best\s*scor|leading\s*scor|golden\s*boot|goal.*king|artilheir|goleador|najbol.+strel/i.test(message) &&
    !/last\s+game|yesterday|match|vs\s/i.test(message); // Exclude match-specific queries
}

/**
 * Check if query is asking for league top assists
 */
export function isTopAssistsQuery(message: string): boolean {
  return /top\s*assist|most\s*assist|leading\s*assist|best\s*playmaker|assist.*leader|najbol.+asist/i.test(message);
}

/**
 * Extract team name from the query (for filtering league scorers by team)
 */
function extractTeamFromQuery(message: string): string | null {
  const lower = message.toLowerCase();
  
  for (const teamName of Object.keys(TEAM_TO_LEAGUE)) {
    if (lower.includes(teamName)) {
      return teamName;
    }
  }
  
  return null;
}

/**
 * Detect which league from the query
 */
function detectLeague(message: string): { id: number; name: string; teamFilter?: string } | null {
  const lower = message.toLowerCase();
  
  // First, check for explicit league mentions
  for (const [keyword, id] of Object.entries(LEAGUE_IDS)) {
    if (lower.includes(keyword)) {
      return { id, name: keyword };
    }
  }
  
  // Second, check for team names → infer league
  for (const [teamName, leagueId] of Object.entries(TEAM_TO_LEAGUE)) {
    if (lower.includes(teamName)) {
      const leagueName = Object.entries(LEAGUE_IDS).find(([, id]) => id === leagueId)?.[0] || 'unknown';
      console.log(`[League-Leaders] Inferred ${leagueName} (${leagueId}) from team "${teamName}"`);
      return { id: leagueId, name: leagueName, teamFilter: teamName };
    }
  }
  
  // Default to Premier League if no league or team specified
  if (/premier|england|english/i.test(lower) || !Object.keys(LEAGUE_IDS).some(k => lower.includes(k))) {
    return { id: 39, name: 'Premier League' };
  }
  
  return null;
}

/**
 * Get current season based on league type
 */
function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  // European leagues: Aug-May
  return month >= 7 ? year : year - 1;
}

// ============================================================================
// API Functions
// ============================================================================

async function apiRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.error('[League-Leaders] API_FOOTBALL_KEY not configured');
    return null;
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  try {
    const response = await fetch(url.toString(), {
      headers: { 'x-apisports-key': apiKey },
    });

    if (!response.ok) {
      console.error(`[League-Leaders] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[League-Leaders] Fetch error:', error);
    return null;
  }
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get top scorers for a league
 */
export async function getVerifiedTopScorers(message: string): Promise<LeagueLeadersResult> {
  const league = detectLeague(message);
  if (!league) {
    return { success: false, data: null, error: 'Could not identify league' };
  }

  const season = getCurrentSeason();
  console.log(`[League-Leaders] Fetching top scorers for league ${league.id}, season ${season}${league.teamFilter ? `, filtered by team: ${league.teamFilter}` : ''}`);

  const result = await apiRequest<{
    response: Array<{
      player: { id: number; name: string; photo: string; nationality: string; age: number };
      statistics: Array<{
        team: { id: number; name: string; logo: string };
        league: { id: number; name: string; country: string; logo: string; season: number };
        games: { appearences: number; minutes: number };
        goals: { total: number; assists: number };
        penalty: { scored: number };
      }>;
    }>;
  }>('/players/topscorers', { league: league.id, season });

  if (!result?.response || result.response.length === 0) {
    return { success: false, data: null, error: 'No top scorers data found' };
  }

  const firstEntry = result.response[0];
  const leagueInfo = firstEntry.statistics[0].league;

  // Filter by team if teamFilter is specified
  let filteredResponse = result.response;
  if (league.teamFilter) {
    const teamFilterLower = league.teamFilter.toLowerCase();
    filteredResponse = result.response.filter(p => {
      const teamName = p.statistics[0]?.team?.name?.toLowerCase() || '';
      return teamName.includes(teamFilterLower) || teamFilterLower.includes(teamName.split(' ')[0]);
    });
    console.log(`[League-Leaders] Filtered to ${filteredResponse.length} players for team "${league.teamFilter}"`);
  }

  const players: TopPlayer[] = filteredResponse.slice(0, 20).map((p, index) => {
    const stats = p.statistics[0];
    return {
      rank: index + 1,
      player: {
        id: p.player.id,
        name: p.player.name,
        photo: p.player.photo,
        nationality: p.player.nationality,
        age: p.player.age,
      },
      team: {
        id: stats.team.id,
        name: stats.team.name,
        logo: stats.team.logo,
      },
      stats: {
        goals: stats.goals.total || 0,
        assists: stats.goals.assists || 0,
        appearances: stats.games.appearences || 0,
        minutes: stats.games.minutes || 0,
        penalties: stats.penalty.scored || 0,
      },
    };
  });

  // If no players after filtering, return helpful error
  if (players.length === 0 && league.teamFilter) {
    return { 
      success: false, 
      data: null, 
      error: `No top scorers found for ${league.teamFilter}. The team may not have any players in the league's top 20 scorers.` 
    };
  }

  return {
    success: true,
    data: {
      league: {
        id: leagueInfo.id,
        name: leagueInfo.name,
        country: leagueInfo.country,
        logo: leagueInfo.logo,
        season: leagueInfo.season,
      },
      type: 'scorers',
      players,
    },
  };
}

/**
 * Get top assists for a league
 */
export async function getVerifiedTopAssists(message: string): Promise<LeagueLeadersResult> {
  const league = detectLeague(message);
  if (!league) {
    return { success: false, data: null, error: 'Could not identify league' };
  }

  const season = getCurrentSeason();
  console.log(`[League-Leaders] Fetching top assists for league ${league.id}, season ${season}`);

  const result = await apiRequest<{
    response: Array<{
      player: { id: number; name: string; photo: string; nationality: string; age: number };
      statistics: Array<{
        team: { id: number; name: string; logo: string };
        league: { id: number; name: string; country: string; logo: string; season: number };
        games: { appearences: number; minutes: number };
        goals: { total: number; assists: number };
        penalty: { scored: number };
      }>;
    }>;
  }>('/players/topassists', { league: league.id, season });

  if (!result?.response || result.response.length === 0) {
    return { success: false, data: null, error: 'No top assists data found' };
  }

  const firstEntry = result.response[0];
  const leagueInfo = firstEntry.statistics[0].league;

  const players: TopPlayer[] = result.response.slice(0, 20).map((p, index) => {
    const stats = p.statistics[0];
    return {
      rank: index + 1,
      player: {
        id: p.player.id,
        name: p.player.name,
        photo: p.player.photo,
        nationality: p.player.nationality,
        age: p.player.age,
      },
      team: {
        id: stats.team.id,
        name: stats.team.name,
        logo: stats.team.logo,
      },
      stats: {
        goals: stats.goals.total || 0,
        assists: stats.goals.assists || 0,
        appearances: stats.games.appearences || 0,
        minutes: stats.games.minutes || 0,
        penalties: stats.penalty.scored || 0,
      },
    };
  });

  return {
    success: true,
    data: {
      league: {
        id: leagueInfo.id,
        name: leagueInfo.name,
        country: leagueInfo.country,
        logo: leagueInfo.logo,
        season: leagueInfo.season,
      },
      type: 'assists',
      players,
    },
  };
}

/**
 * Format league leaders for AI context
 */
export function formatLeagueLeadersContext(result: LeagueLeadersResult): string {
  if (!result.success || !result.data) {
    return '';
  }

  const { league, type, players } = result.data;
  const title = type === 'scorers' ? 'TOP SCORERS' : 'TOP ASSISTS';

  let context = `=== VERIFIED ${title} ===\n`;
  context += `League: ${league.name} (${league.country})\n`;
  context += `Season: ${league.season}/${league.season + 1}\n`;
  context += `Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\n`;

  context += `${'Rank'} | ${'Player'.padEnd(22)} | ${'Team'.padEnd(18)} | ${type === 'scorers' ? 'Goals' : 'Assists'} | Apps\n`;
  context += `${'─'.repeat(70)}\n`;

  for (const p of players.slice(0, 15)) {
    const statValue = type === 'scorers' ? p.stats.goals : p.stats.assists;
    context += `${String(p.rank).padStart(2)}. | ${p.player.name.slice(0, 22).padEnd(22)} | ${p.team.name.slice(0, 18).padEnd(18)} | ${String(statValue).padStart(5)} | ${p.stats.appearances}\n`;
  }

  if (type === 'scorers') {
    context += `\nNote: Goals include penalties (shown separately if asked)\n`;
  }
  
  context += `\nSOURCE: API-Sports (official league data)\n`;

  return context;
}
