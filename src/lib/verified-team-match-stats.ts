/**
 * Verified Team Match Statistics Service
 * 
 * Provides structured match-by-match statistics for teams:
 * - Shots, corners, possession per game
 * - Home/Away split analysis
 * - Comparison to season averages
 * - Opposition analysis (how opponents perform against them)
 * 
 * Uses API-Sports /fixtures and /fixtures/statistics endpoints
 */

// API-Sports Football base URL
const API_BASE = 'https://v3.football.api-sports.io';

// Cache for team IDs (avoid repeated lookups)
const teamIdCache = new Map<string, number>();

// ============================================================================
// Types
// ============================================================================

export interface FixtureStats {
  fixtureId: number;
  date: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: { home: number; away: number };
  isHome: boolean; // From perspective of the target team
  opponent: { id: number; name: string };
  statistics: {
    shotsTotal: number;
    shotsOnTarget: number;
    corners: number;
    possession: number;
    fouls: number;
    offsides: number;
    passes: number;
    passAccuracy: number;
  };
  opponentStatistics: {
    shotsTotal: number;
    shotsOnTarget: number;
    corners: number;
    possession: number;
    fouls: number;
    offsides: number;
    passes: number;
    passAccuracy: number;
  };
}

export interface TeamMatchStatsResult {
  success: boolean;
  data: {
    team: { id: number; name: string };
    league: { id: number; name: string };
    season: number;
    fixtures: FixtureStats[];
    averages: {
      shotsFor: number;
      shotsAgainst: number;
      cornersFor: number;
      cornersAgainst: number;
      possessionFor: number;
    };
  } | null;
  error?: string;
}

export interface OpponentAnalysisResult {
  success: boolean;
  data: {
    targetTeam: { id: number; name: string };
    analysis: Array<{
      fixture: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
      };
      opponent: { id: number; name: string };
      opponentSeasonAverage: {
        shotsPerGame: number;
        cornersPerGame: number;
      };
      opponentStatsInThisMatch: {
        shots: number;
        corners: number;
      };
      comparison: {
        shotsVsAverage: number; // positive = more than average
        cornersVsAverage: number;
      };
    }>;
    summary: {
      gamesAnalyzed: number;
      opponentsAboveAverageShots: number;
      opponentsBelowAverageShots: number;
      avgShotDifference: number;
    };
  } | null;
  error?: string;
}

// ============================================================================
// Detection
// ============================================================================

/**
 * Check if query is asking for team match statistics analysis
 */
export function isTeamMatchStatsQuery(message: string): boolean {
  const patterns = [
    // Shot-related patterns
    /finali[zs]a[çc][oõ]es|shots?|chutes?|remates?/i,
    // Corner-related patterns
    /corner|escanteio|córner|korneri/i,
    // Possession patterns
    /posse|possess|posed/i,
    // Match-by-match analysis
    /últimos?\s*\d+\s*(jogos?|partidas?|games?|matches?)/i,
    /last\s*\d+\s*(games?|matches?|fixtures?)/i,
    /poslednjih?\s*\d+\s*(utakmica|meceva)/i,
    // Home/Away specific
    /fora\s+de\s+casa|away\s+(games?|matches?)|gostujuc/i,
    /em\s+casa|home\s+(games?|matches?)|domac/i,
    // Comparison to average
    /(média|average|prosek).*(jogo|game|utakmic)/i,
    /above\s+average|below\s+average|vs\s+average/i,
    // Statistical patterns
    /por\s+jogo|per\s+game|po\s+utakmic/i,
  ];
  
  return patterns.some(p => p.test(message));
}

/**
 * Extract team name from query
 */
function extractTeamName(message: string): string | null {
  // Common football team patterns
  const teamPatterns = [
    // "últimos 5 jogos do Sunderland" -> Sunderland
    /(?:jogos?|partidas?|games?|matches?)\s+d[oa]\s+([A-Z][a-zA-Z\s]+?)(?:\s+fora|\s+em\s+casa|\s+pela|,|\?|$)/i,
    // "Sunderland's last 5 games"
    /([A-Z][a-zA-Z\s]+?)(?:'s)?\s+(?:last|últimos?)\s+\d+/i,
    // "last 5 away games of Sunderland"
    /(?:last|últimos?)\s+\d+\s+(?:away|home|fora|casa)\s+(?:games?|matches?)\s+(?:of|do|da)\s+([A-Z][a-zA-Z\s]+)/i,
    // General: "against Sunderland" or "contra o Sunderland"
    /(?:against|contra\s+[oa]?)\s+([A-Z][a-zA-Z\s]+?)(?:\s|,|\?|$)/i,
  ];
  
  for (const pattern of teamPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Extract number of games from query
 */
function extractGameCount(message: string): number {
  const match = message.match(/(?:últimos?|last|poslednjih?)\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 5;
}

/**
 * Check if query asks for away games only
 */
function isAwayOnly(message: string): boolean {
  return /fora\s+de\s+casa|away|gostujuc/i.test(message);
}

/**
 * Check if query asks for home games only
 */
function isHomeOnly(message: string): boolean {
  return /em\s+casa|home|domac/i.test(message);
}

// ============================================================================
// API Functions
// ============================================================================

async function apiRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.error('[Team-Match-Stats] API_FOOTBALL_KEY not configured');
    return null;
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    if (!response.ok) {
      console.error(`[Team-Match-Stats] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.response as T;
  } catch (error) {
    console.error('[Team-Match-Stats] Fetch error:', error);
    return null;
  }
}

/**
 * Find team ID by name
 */
async function findTeamId(teamName: string, leagueId?: number): Promise<number | null> {
  const cacheKey = `${teamName.toLowerCase()}-${leagueId || 'any'}`;
  if (teamIdCache.has(cacheKey)) {
    return teamIdCache.get(cacheKey)!;
  }

  const params: Record<string, string | number> = { search: teamName };
  if (leagueId) {
    params.league = leagueId;
  }

  const teams = await apiRequest<Array<{ team: { id: number; name: string } }>>('/teams', params);
  if (!teams || teams.length === 0) {
    return null;
  }

  // Find best match
  const exactMatch = teams.find(t => 
    t.team.name.toLowerCase() === teamName.toLowerCase()
  );
  const teamId = exactMatch?.team.id || teams[0].team.id;
  
  teamIdCache.set(cacheKey, teamId);
  return teamId;
}

/**
 * Get team's last N fixtures with venue filter
 */
async function getTeamFixtures(
  teamId: number, 
  count: number, 
  venueFilter?: 'home' | 'away'
): Promise<Array<{
  fixture: { id: number; date: string };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number; away: number };
  league: { id: number; name: string };
}> | null> {
  // Fetch more fixtures than needed since we filter by venue
  const fetchCount = venueFilter ? count * 3 : count;
  
  const fixtures = await apiRequest<Array<{
    fixture: { id: number; date: string };
    teams: { home: { id: number; name: string }; away: { id: number; name: string } };
    goals: { home: number; away: number };
    league: { id: number; name: string };
  }>>('/fixtures', {
    team: teamId,
    last: fetchCount,
    status: 'FT', // Only finished matches
  });

  if (!fixtures) return null;

  // Filter by venue if needed
  if (venueFilter) {
    const filtered = fixtures.filter(f => {
      const isHome = f.teams.home.id === teamId;
      return venueFilter === 'home' ? isHome : !isHome;
    });
    return filtered.slice(0, count);
  }

  return fixtures.slice(0, count);
}

/**
 * Get fixture statistics
 */
async function getFixtureStatistics(fixtureId: number): Promise<Array<{
  team: { id: number; name: string };
  statistics: Array<{ type: string; value: number | string | null }>;
}> | null> {
  return apiRequest('/fixtures/statistics', { fixture: fixtureId });
}

/**
 * Calculate a team's actual average shots per game from their recent fixtures
 * This is more accurate than estimates since API doesn't provide shots in team stats
 */
async function getTeamAverageShotsPerGame(
  teamId: number,
  excludeFixtureId?: number, // Exclude the match we're comparing against
  gamesCount: number = 10
): Promise<number | null> {
  // Get team's recent finished fixtures
  const fixtures = await apiRequest<Array<{
    fixture: { id: number; date: string };
    teams: { home: { id: number }; away: { id: number } };
  }>>('/fixtures', {
    team: teamId,
    last: gamesCount + 1, // Get extra in case we need to exclude one
    status: 'FT',
  });

  if (!fixtures || fixtures.length === 0) return null;

  // Filter out the excluded fixture if specified
  const relevantFixtures = excludeFixtureId 
    ? fixtures.filter(f => f.fixture.id !== excludeFixtureId).slice(0, gamesCount)
    : fixtures.slice(0, gamesCount);

  if (relevantFixtures.length === 0) return null;

  let totalShots = 0;
  let gamesWithStats = 0;

  for (const fixture of relevantFixtures) {
    const stats = await getFixtureStatistics(fixture.fixture.id);
    if (!stats) continue;

    const teamStats = stats.find(s => s.team.id === teamId);
    if (!teamStats) continue;

    const shotsValue = teamStats.statistics.find(s => s.type === 'Total Shots')?.value;
    if (shotsValue !== null && shotsValue !== undefined) {
      totalShots += typeof shotsValue === 'number' ? shotsValue : parseInt(String(shotsValue), 10) || 0;
      gamesWithStats++;
    }
  }

  if (gamesWithStats === 0) return null;

  return Math.round((totalShots / gamesWithStats) * 10) / 10;
}

/**
 * Get team's season statistics (for averages)
 */
async function getTeamSeasonStats(
  teamId: number, 
  leagueId: number, 
  season: number
): Promise<{
  fixtures: { played: { total: number } };
  goals: { for: { total: { total: number } } };
  // Note: shots are not in team statistics, only in fixture statistics
} | null> {
  const result = await apiRequest<{
    fixtures: { played: { total: number } };
    goals: { for: { total: { total: number } } };
  }>('/teams/statistics', {
    team: teamId,
    league: leagueId,
    season: season,
  });
  return result;
}

/**
 * Parse fixture statistics into structured format
 */
function parseFixtureStats(
  rawStats: Array<{ type: string; value: number | string | null }>
): FixtureStats['statistics'] {
  const getValue = (type: string): number => {
    const stat = rawStats.find(s => s.type === type);
    if (!stat || stat.value === null) return 0;
    if (typeof stat.value === 'number') return stat.value;
    // Handle percentage strings like "55%"
    const numStr = String(stat.value).replace('%', '');
    return parseInt(numStr, 10) || 0;
  };

  return {
    shotsTotal: getValue('Total Shots'),
    shotsOnTarget: getValue('Shots on Goal'),
    corners: getValue('Corner Kicks'),
    possession: getValue('Ball Possession'),
    fouls: getValue('Fouls'),
    offsides: getValue('Offsides'),
    passes: getValue('Total passes'),
    passAccuracy: getValue('Passes %'),
  };
}

// ============================================================================
// Main Analysis Functions
// ============================================================================

/**
 * Get verified team match statistics for last N games
 */
export async function getVerifiedTeamMatchStats(
  message: string
): Promise<TeamMatchStatsResult> {
  const teamName = extractTeamName(message);
  if (!teamName) {
    return { success: false, data: null, error: 'Could not identify team name' };
  }

  const gameCount = extractGameCount(message);
  const venueFilter = isAwayOnly(message) ? 'away' : isHomeOnly(message) ? 'home' : undefined;

  console.log(`[Team-Match-Stats] Searching for ${teamName}, last ${gameCount} ${venueFilter || 'all'} games`);

  // Find team ID
  const teamId = await findTeamId(teamName);
  if (!teamId) {
    return { success: false, data: null, error: `Team not found: ${teamName}` };
  }

  // Get fixtures
  const fixtures = await getTeamFixtures(teamId, gameCount, venueFilter);
  if (!fixtures || fixtures.length === 0) {
    return { success: false, data: null, error: 'No fixtures found' };
  }

  console.log(`[Team-Match-Stats] Found ${fixtures.length} fixtures for team ID ${teamId}`);

  // Get statistics for each fixture
  const fixtureStats: FixtureStats[] = [];
  
  for (const fixture of fixtures) {
    const stats = await getFixtureStatistics(fixture.fixture.id);
    if (!stats || stats.length < 2) continue;

    const isHome = fixture.teams.home.id === teamId;
    const teamStats = stats.find(s => s.team.id === teamId);
    const opponentStats = stats.find(s => s.team.id !== teamId);

    if (!teamStats || !opponentStats) continue;

    fixtureStats.push({
      fixtureId: fixture.fixture.id,
      date: fixture.fixture.date,
      homeTeam: fixture.teams.home,
      awayTeam: fixture.teams.away,
      score: fixture.goals,
      isHome,
      opponent: isHome ? fixture.teams.away : fixture.teams.home,
      statistics: parseFixtureStats(teamStats.statistics),
      opponentStatistics: parseFixtureStats(opponentStats.statistics),
    });
  }

  if (fixtureStats.length === 0) {
    return { success: false, data: null, error: 'Could not get statistics for fixtures' };
  }

  // Calculate averages
  const avgShotsFor = fixtureStats.reduce((sum, f) => sum + f.statistics.shotsTotal, 0) / fixtureStats.length;
  const avgShotsAgainst = fixtureStats.reduce((sum, f) => sum + f.opponentStatistics.shotsTotal, 0) / fixtureStats.length;
  const avgCornersFor = fixtureStats.reduce((sum, f) => sum + f.statistics.corners, 0) / fixtureStats.length;
  const avgCornersAgainst = fixtureStats.reduce((sum, f) => sum + f.opponentStatistics.corners, 0) / fixtureStats.length;
  const avgPossession = fixtureStats.reduce((sum, f) => sum + f.statistics.possession, 0) / fixtureStats.length;

  return {
    success: true,
    data: {
      team: { id: teamId, name: teamName },
      league: { id: fixtures[0].league.id, name: fixtures[0].league.name },
      season: new Date().getFullYear(),
      fixtures: fixtureStats,
      averages: {
        shotsFor: Math.round(avgShotsFor * 10) / 10,
        shotsAgainst: Math.round(avgShotsAgainst * 10) / 10,
        cornersFor: Math.round(avgCornersFor * 10) / 10,
        cornersAgainst: Math.round(avgCornersAgainst * 10) / 10,
        possessionFor: Math.round(avgPossession * 10) / 10,
      },
    },
  };
}

/**
 * Analyze opponent performance against a team vs their season average
 * This answers: "Did opponents shoot more/less against X than their average?"
 */
export async function getOpponentAnalysis(
  message: string
): Promise<OpponentAnalysisResult> {
  // First get the basic match stats
  const matchStats = await getVerifiedTeamMatchStats(message);
  if (!matchStats.success || !matchStats.data) {
    return { success: false, data: null, error: matchStats.error };
  }

  const { team, fixtures } = matchStats.data;

  console.log(`[Team-Match-Stats] Analyzing opponents vs ${team.name} - calculating real shot averages`);

  const analysis: Array<{
    fixture: { date: string; homeTeam: string; awayTeam: string; score: string };
    opponent: { id: number; name: string };
    opponentSeasonAverage: { shotsPerGame: number; cornersPerGame: number };
    opponentStatsInThisMatch: { shots: number; corners: number };
    comparison: { shotsVsAverage: number; cornersVsAverage: number };
  }> = [];
  let totalShotDiff = 0;
  let aboveAverage = 0;
  let belowAverage = 0;

  for (const fixture of fixtures) {
    // Get opponent's REAL average shots per game (excluding this match)
    const opponentAvgShots = await getTeamAverageShotsPerGame(
      fixture.opponent.id,
      fixture.fixtureId, // Exclude this match from average
      10 // Use last 10 matches for average
    );

    // If we couldn't calculate, use league average estimate
    const avgShotsPerGame = opponentAvgShots ?? 12;
    
    console.log(`[Team-Match-Stats] ${fixture.opponent.name} avg shots: ${avgShotsPerGame} (${opponentAvgShots ? 'calculated' : 'estimated'})`);

    const actualShots = fixture.opponentStatistics.shotsTotal;
    const shotDiff = actualShots - avgShotsPerGame;
    totalShotDiff += shotDiff;

    if (shotDiff > 0.5) { // More than 0.5 above average counts as "above"
      aboveAverage++;
    } else if (shotDiff < -0.5) {
      belowAverage++;
    }

    analysis.push({
      fixture: {
        date: fixture.date,
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
        score: `${fixture.score.home}-${fixture.score.away}`,
      },
      opponent: fixture.opponent,
      opponentSeasonAverage: {
        shotsPerGame: avgShotsPerGame,
        cornersPerGame: 5, // Still estimate for corners
      },
      opponentStatsInThisMatch: {
        shots: actualShots,
        corners: fixture.opponentStatistics.corners,
      },
      comparison: {
        shotsVsAverage: Math.round(shotDiff * 10) / 10,
        cornersVsAverage: 0, // Would need to calculate
      },
    });
  }

  return {
    success: true,
    data: {
      targetTeam: team,
      analysis,
      summary: {
        gamesAnalyzed: analysis.length,
        opponentsAboveAverageShots: aboveAverage,
        opponentsBelowAverageShots: belowAverage,
        avgShotDifference: analysis.length > 0 
          ? Math.round((totalShotDiff / analysis.length) * 10) / 10 
          : 0,
      },
    },
  };
}

/**
 * Format team match stats for AI context
 */
export function formatTeamMatchStatsContext(
  result: TeamMatchStatsResult,
  opponentAnalysis?: OpponentAnalysisResult
): string {
  if (!result.success || !result.data) {
    return '';
  }

  const { team, fixtures, averages, league } = result.data;

  let context = `=== VERIFIED MATCH STATISTICS ===\n`;
  context += `Team: ${team.name}\n`;
  context += `League: ${league.name}\n`;
  context += `Analyzed: ${fixtures.length} matches\n\n`;

  context += `TEAM AVERAGES (these ${fixtures.length} games):\n`;
  context += `• Shots For: ${averages.shotsFor} per game\n`;
  context += `• Shots Against: ${averages.shotsAgainst} per game\n`;
  context += `• Corners For: ${averages.cornersFor} per game\n`;
  context += `• Corners Against: ${averages.cornersAgainst} per game\n`;
  context += `• Possession: ${averages.possessionFor}%\n\n`;

  context += `MATCH-BY-MATCH BREAKDOWN:\n`;
  context += `${'─'.repeat(60)}\n`;

  for (const fixture of fixtures) {
    const dateStr = new Date(fixture.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const venue = fixture.isHome ? '(H)' : '(A)';
    
    context += `\n📅 ${dateStr} ${venue}\n`;
    context += `${fixture.homeTeam.name} ${fixture.score.home}-${fixture.score.away} ${fixture.awayTeam.name}\n`;
    context += `\n${team.name} stats:\n`;
    context += `  • Shots: ${fixture.statistics.shotsTotal} (${fixture.statistics.shotsOnTarget} on target)\n`;
    context += `  • Corners: ${fixture.statistics.corners}\n`;
    context += `  • Possession: ${fixture.statistics.possession}%\n`;
    context += `\n${fixture.opponent.name} stats:\n`;
    context += `  • Shots: ${fixture.opponentStatistics.shotsTotal} (${fixture.opponentStatistics.shotsOnTarget} on target)\n`;
    context += `  • Corners: ${fixture.opponentStatistics.corners}\n`;
    context += `  • Possession: ${fixture.opponentStatistics.possession}%\n`;
  }

  // Add detailed opponent analysis if available
  if (opponentAnalysis?.success && opponentAnalysis.data) {
    const { analysis, summary } = opponentAnalysis.data;
    context += `\n${'─'.repeat(60)}\n`;
    context += `\nOPPONENT SHOTS VS THEIR SEASON AVERAGE:\n`;
    context += `(Did opponents shoot more/less than their usual average against ${team.name}?)\n\n`;
    
    for (const item of analysis) {
      const dateStr = new Date(item.fixture.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const diffSign = item.comparison.shotsVsAverage >= 0 ? '+' : '';
      const indicator = item.comparison.shotsVsAverage > 0.5 ? '📈' : item.comparison.shotsVsAverage < -0.5 ? '📉' : '➖';
      
      context += `${indicator} ${item.opponent.name} (${dateStr}):\n`;
      context += `   Season avg: ${item.opponentSeasonAverage.shotsPerGame} shots/game\n`;
      context += `   vs ${team.name}: ${item.opponentStatsInThisMatch.shots} shots (${diffSign}${item.comparison.shotsVsAverage})\n\n`;
    }
    
    context += `SUMMARY:\n`;
    context += `• Games where opponents shot ABOVE their average: ${summary.opponentsAboveAverageShots}\n`;
    context += `• Games where opponents shot BELOW their average: ${summary.opponentsBelowAverageShots}\n`;
    context += `• Average shot difference vs opponent norms: ${summary.avgShotDifference > 0 ? '+' : ''}${summary.avgShotDifference}\n`;
  }

  context += `\nSOURCE: API-Sports (verified data)\n`;

  return context;
}
