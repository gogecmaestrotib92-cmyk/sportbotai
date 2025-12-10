/**
 * Multi-Sport Stats Fetcher
 * 
 * Unified interface to fetch team statistics, standings, and H2H
 * for Basketball, NFL, and Hockey using API-Sports.
 */

import {
  detectSportAPI,
  getLeagueIdForSport,
  searchTeamByName,
  SupportedSportAPI,
  // Basketball
  getBasketballTeamStats,
  getBasketballStandings,
  getBasketballH2H,
  searchBasketballTeam,
  BasketballStanding,
  BasketballGame,
  BasketballTeamStats,
  // NFL
  getNFLTeamStats,
  getNFLStandings,
  getNFLH2H,
  searchNFLTeam,
  NFLStanding,
  NFLGame,
  NFLTeamStats,
  // Hockey
  getHockeyTeamStats,
  getHockeyStandings,
  getHockeyH2H,
  searchHockeyTeam,
  HockeyStanding,
  HockeyGame,
  HockeyTeamStats,
} from './index';

// ============================================
// UNIFIED TYPES
// ============================================

export interface UnifiedTeamStats {
  sport: SupportedSportAPI;
  teamId: number;
  teamName: string;
  teamLogo?: string;
  games: {
    played: number;
    wins: number;
    losses: number;
    winPercentage: string;
  };
  homeRecord?: {
    wins: number;
    losses: number;
  };
  awayRecord?: {
    wins: number;
    losses: number;
  };
  scoring: {
    for: number;
    against: number;
    average: number;
    averageAgainst: number;
  };
  form?: string; // Last 5 games W/L
  streak?: string;
  standingPosition?: number;
  // Sport-specific extras
  extras?: Record<string, unknown>;
}

export interface UnifiedH2HResult {
  sport: SupportedSportAPI;
  totalGames: number;
  homeTeamWins: number;
  awayTeamWins: number;
  draws: number;
  recentGames: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    winner: 'home' | 'away' | 'draw' | null;
  }>;
}

export interface MultiSportStatsResult {
  success: boolean;
  sport: SupportedSportAPI;
  homeTeam: UnifiedTeamStats | null;
  awayTeam: UnifiedTeamStats | null;
  h2h: UnifiedH2HResult | null;
  error?: string;
}

// ============================================
// TEAM ID CACHE (simple in-memory cache)
// ============================================

const teamIdCache = new Map<string, number>();

function getCacheKey(teamName: string, sport: string): string {
  return `${sport}:${teamName.toLowerCase()}`;
}

// ============================================
// MAIN FETCH FUNCTION
// ============================================

/**
 * Fetch comprehensive stats for a match
 */
export async function fetchMultiSportStats(
  sportKey: string,
  homeTeamName: string,
  awayTeamName: string
): Promise<MultiSportStatsResult> {
  const sportAPI = detectSportAPI(sportKey);
  const leagueInfo = getLeagueIdForSport(sportKey);

  // If not a supported sport or no league mapping, return empty
  if (!leagueInfo || sportAPI === 'odds-api' || sportAPI === 'football') {
    return {
      success: false,
      sport: sportAPI,
      homeTeam: null,
      awayTeam: null,
      h2h: null,
      error: sportAPI === 'football' 
        ? 'Use football API for soccer stats'
        : 'Sport not supported for detailed stats',
    };
  }

  try {
    // Find team IDs
    const [homeTeamId, awayTeamId] = await Promise.all([
      findTeamId(homeTeamName, sportAPI, leagueInfo.leagueId),
      findTeamId(awayTeamName, sportAPI, leagueInfo.leagueId),
    ]);

    if (!homeTeamId || !awayTeamId) {
      return {
        success: false,
        sport: sportAPI,
        homeTeam: null,
        awayTeam: null,
        h2h: null,
        error: `Could not find team IDs: ${!homeTeamId ? homeTeamName : ''} ${!awayTeamId ? awayTeamName : ''}`.trim(),
      };
    }

    // Fetch stats in parallel
    const [homeStats, awayStats, h2hGames, standings] = await Promise.all([
      fetchTeamStats(sportAPI, homeTeamId, leagueInfo.leagueId, leagueInfo.season),
      fetchTeamStats(sportAPI, awayTeamId, leagueInfo.leagueId, leagueInfo.season),
      fetchH2H(sportAPI, homeTeamId, awayTeamId),
      fetchStandings(sportAPI, leagueInfo.leagueId, leagueInfo.season),
    ]);

    // Add standing positions
    if (standings && homeStats) {
      homeStats.standingPosition = findTeamPosition(standings, homeTeamId);
    }
    if (standings && awayStats) {
      awayStats.standingPosition = findTeamPosition(standings, awayTeamId);
    }

    // Process H2H
    const h2h = processH2H(sportAPI, h2hGames, homeTeamId, awayTeamId);

    return {
      success: true,
      sport: sportAPI,
      homeTeam: homeStats,
      awayTeam: awayStats,
      h2h,
    };
  } catch (error) {
    console.error('Error fetching multi-sport stats:', error);
    return {
      success: false,
      sport: sportAPI,
      homeTeam: null,
      awayTeam: null,
      h2h: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function findTeamId(
  teamName: string,
  sport: SupportedSportAPI,
  leagueId: number
): Promise<number | null> {
  // Check cache first
  const cacheKey = getCacheKey(teamName, sport);
  if (teamIdCache.has(cacheKey)) {
    return teamIdCache.get(cacheKey)!;
  }

  try {
    let teams: Array<{ id: number; name: string }> = [];

    switch (sport) {
      case 'basketball':
        teams = await searchBasketballTeam(teamName, leagueId);
        break;
      case 'nfl':
        teams = await searchNFLTeam(teamName, leagueId);
        break;
      case 'hockey':
        teams = await searchHockeyTeam(teamName, leagueId);
        break;
    }

    // Find best match (exact or partial)
    const exactMatch = teams.find(t => 
      t.name.toLowerCase() === teamName.toLowerCase()
    );
    const partialMatch = teams.find(t => 
      t.name.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(t.name.toLowerCase())
    );

    const match = exactMatch || partialMatch || teams[0];
    
    if (match) {
      teamIdCache.set(cacheKey, match.id);
      return match.id;
    }
  } catch (error) {
    console.error(`Error finding team ${teamName}:`, error);
  }

  return null;
}

async function fetchTeamStats(
  sport: SupportedSportAPI,
  teamId: number,
  leagueId: number,
  season: string | number
): Promise<UnifiedTeamStats | null> {
  try {
    switch (sport) {
      case 'basketball': {
        const stats = await getBasketballTeamStats(teamId, leagueId, String(season));
        if (stats?.statistics) {
          return normalizeBasketballStats(stats);
        }
        break;
      }
      case 'nfl': {
        const stats = await getNFLTeamStats(teamId, Number(season));
        if (stats) {
          return normalizeNFLStats(stats);
        }
        break;
      }
      case 'hockey': {
        const stats = await getHockeyTeamStats(teamId, leagueId, Number(season));
        if (stats) {
          return normalizeHockeyStats(stats);
        }
        break;
      }
    }
  } catch (error) {
    console.error(`Error fetching stats for team ${teamId}:`, error);
  }
  return null;
}

async function fetchH2H(
  sport: SupportedSportAPI,
  team1Id: number,
  team2Id: number
): Promise<BasketballGame[] | NFLGame[] | HockeyGame[]> {
  try {
    switch (sport) {
      case 'basketball':
        return await getBasketballH2H(team1Id, team2Id);
      case 'nfl':
        return await getNFLH2H(team1Id, team2Id);
      case 'hockey':
        return await getHockeyH2H(team1Id, team2Id);
    }
  } catch (error) {
    console.error('Error fetching H2H:', error);
  }
  return [];
}

async function fetchStandings(
  sport: SupportedSportAPI,
  leagueId: number,
  season: string | number
): Promise<BasketballStanding[][] | NFLStanding[] | HockeyStanding[][] | null> {
  try {
    switch (sport) {
      case 'basketball':
        return await getBasketballStandings(leagueId, String(season));
      case 'nfl':
        return await getNFLStandings(leagueId, Number(season));
      case 'hockey':
        return await getHockeyStandings(leagueId, Number(season));
    }
  } catch (error) {
    console.error('Error fetching standings:', error);
  }
  return null;
}

// ============================================
// NORMALIZATION FUNCTIONS
// ============================================

function normalizeBasketballStats(stats: BasketballTeamStats): UnifiedTeamStats {
  const s = stats.statistics!;
  return {
    sport: 'basketball',
    teamId: stats.team.id,
    teamName: stats.team.name,
    teamLogo: stats.team.logo,
    games: {
      played: s.games.played.all,
      wins: s.games.wins.all.total,
      losses: s.games.loses.all.total,
      winPercentage: s.games.wins.all.percentage,
    },
    homeRecord: {
      wins: s.games.wins.home.total,
      losses: s.games.loses.home.total,
    },
    awayRecord: {
      wins: s.games.wins.away.total,
      losses: s.games.loses.away.total,
    },
    scoring: {
      for: s.points.for.total.all,
      against: s.points.against.total.all,
      average: parseFloat(s.points.for.average.all) || 0,
      averageAgainst: parseFloat(s.points.against.average.all) || 0,
    },
    extras: {
      ppgHome: parseFloat(s.points.for.average.home) || 0,
      ppgAway: parseFloat(s.points.for.average.away) || 0,
    },
  };
}

function normalizeNFLStats(stats: NFLTeamStats): UnifiedTeamStats {
  const winPct = stats.games > 0 
    ? ((stats.games - ((stats as NFLTeamStats & { losses?: number }).losses ?? 0)) / stats.games * 100).toFixed(1)
    : '0';
    
  return {
    sport: 'nfl',
    teamId: stats.team.id,
    teamName: stats.team.name,
    teamLogo: stats.team.logo,
    games: {
      played: stats.games,
      wins: 0, // Would need standings for this
      losses: 0,
      winPercentage: winPct,
    },
    scoring: {
      for: 0,
      against: 0,
      average: stats.yards?.total ? stats.yards.total / Math.max(stats.games, 1) : 0,
      averageAgainst: 0,
    },
    extras: {
      totalYards: stats.yards?.total || 0,
      passingYards: stats.yards?.pass || 0,
      rushingYards: stats.yards?.rush || 0,
      turnovers: stats.turnovers?.total || 0,
      passing: stats.passing,
      rushing: stats.rushing,
    },
  };
}

function normalizeHockeyStats(stats: HockeyTeamStats): UnifiedTeamStats {
  return {
    sport: 'hockey',
    teamId: stats.team.id,
    teamName: stats.team.name,
    teamLogo: stats.team.logo,
    games: {
      played: stats.games.played.all,
      wins: stats.wins.all.total,
      losses: stats.loses.all.total,
      winPercentage: stats.wins.all.percentage,
    },
    homeRecord: {
      wins: stats.wins.home.total,
      losses: stats.loses.home.total,
    },
    awayRecord: {
      wins: stats.wins.away.total,
      losses: stats.loses.away.total,
    },
    scoring: {
      for: stats.goals.for.total.all,
      against: stats.goals.against.total.all,
      average: parseFloat(stats.goals.for.average.all) || 0,
      averageAgainst: parseFloat(stats.goals.against.average.all) || 0,
    },
    extras: {
      goalsForHome: stats.goals.for.total.home,
      goalsForAway: stats.goals.for.total.away,
      goalsAgainstHome: stats.goals.against.total.home,
      goalsAgainstAway: stats.goals.against.total.away,
    },
  };
}

function findTeamPosition(
  standings: BasketballStanding[][] | NFLStanding[] | HockeyStanding[][] | null,
  teamId: number
): number | undefined {
  if (!standings) return undefined;

  // Handle nested arrays (Basketball, Hockey)
  if (Array.isArray(standings[0])) {
    for (const group of standings as (BasketballStanding[][] | HockeyStanding[][])) {
      for (const standing of group) {
        if ('team' in standing && standing.team.id === teamId) {
          return standing.position;
        }
      }
    }
  } else {
    // Handle flat array (NFL)
    for (const standing of standings as NFLStanding[]) {
      if (standing.team.id === teamId) {
        return standing.position;
      }
    }
  }
  
  return undefined;
}

function processH2H(
  sport: SupportedSportAPI,
  games: BasketballGame[] | NFLGame[] | HockeyGame[],
  homeTeamId: number,
  awayTeamId: number
): UnifiedH2HResult | null {
  if (!games || games.length === 0) {
    return null;
  }

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  const recentGames: UnifiedH2HResult['recentGames'] = [];

  // Take last 10 games
  const relevantGames = games.slice(0, 10);

  for (const game of relevantGames) {
    let homeScore: number | null = null;
    let awayScore: number | null = null;
    let homeTeamName = '';
    let awayTeamName = '';
    let gameDate = '';

    if (sport === 'basketball') {
      const g = game as BasketballGame;
      homeScore = g.scores.home.total;
      awayScore = g.scores.away.total;
      homeTeamName = g.teams.home.name;
      awayTeamName = g.teams.away.name;
      gameDate = g.date;
    } else if (sport === 'nfl') {
      const g = game as NFLGame;
      homeScore = g.scores.home.total;
      awayScore = g.scores.away.total;
      homeTeamName = g.teams.home.name;
      awayTeamName = g.teams.away.name;
      gameDate = g.game.date.date;
    } else if (sport === 'hockey') {
      const g = game as HockeyGame;
      homeScore = g.scores.home;
      awayScore = g.scores.away;
      homeTeamName = g.teams.home.name;
      awayTeamName = g.teams.away.name;
      gameDate = g.date;
    }

    let winner: 'home' | 'away' | 'draw' | null = null;
    if (homeScore !== null && awayScore !== null) {
      if (homeScore > awayScore) {
        winner = 'home';
        // Check if "home" in this game is our homeTeam
        const isOurHome = homeTeamName.toLowerCase().includes(String(homeTeamId)) || 
                          (game as { teams: { home: { id: number } } }).teams?.home?.id === homeTeamId;
        if (isOurHome) homeWins++;
        else awayWins++;
      } else if (awayScore > homeScore) {
        winner = 'away';
        const isOurAway = awayTeamName.toLowerCase().includes(String(awayTeamId)) ||
                          (game as { teams: { away: { id: number } } }).teams?.away?.id === awayTeamId;
        if (isOurAway) awayWins++;
        else homeWins++;
      } else {
        winner = 'draw';
        draws++;
      }
    }

    recentGames.push({
      date: gameDate,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      homeScore,
      awayScore,
      winner,
    });
  }

  return {
    sport,
    totalGames: relevantGames.length,
    homeTeamWins: homeWins,
    awayTeamWins: awayWins,
    draws,
    recentGames,
  };
}
