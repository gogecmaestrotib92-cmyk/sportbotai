/**
 * Basketball Adapter
 * 
 * Transforms API-Sports basketball data into normalized format.
 * Handles NBA and other basketball leagues.
 */

import { BaseSportAdapter, AdapterConfig } from './base';
import {
  Sport,
  DataProvider,
  DataLayerResponse,
  NormalizedTeam,
  NormalizedMatch,
  NormalizedTeamStats,
  NormalizedPlayerStats,
  NormalizedH2H,
  NormalizedRecentGames,
  NormalizedPlayer,
  MatchStatus,
  TeamQuery,
  MatchQuery,
  StatsQuery,
  H2HQuery,
} from '../types';
import {
  getAPISportsProvider,
  LEAGUE_IDS,
  BasketballTeamResponse,
  BasketballGameResponse,
  BasketballStandingsResponse,
  BasketballPlayerResponse,
  BasketballPlayerStatsResponse,
} from '../providers/api-sports';
import { resolveTeamName, getSearchVariations } from '../team-resolver';

// Team name mappings for NBA - DEPRECATED: Now using team-resolver.ts
// Kept for backwards compatibility but team-resolver is the source of truth
const NBA_TEAM_MAPPINGS: Record<string, string> = {
  // Short names
  'lakers': 'Lakers',
  'celtics': 'Celtics',
  'warriors': 'Warriors',
  'nets': 'Nets',
  'knicks': 'Knicks',
  'bulls': 'Bulls',
  'heat': 'Heat',
  'sixers': '76ers',
  '76ers': '76ers',
  'suns': 'Suns',
  'bucks': 'Bucks',
  'mavericks': 'Mavericks',
  'mavs': 'Mavericks',
  'clippers': 'Clippers',
  'nuggets': 'Nuggets',
  'grizzlies': 'Grizzlies',
  'pelicans': 'Pelicans',
  'timberwolves': 'Timberwolves',
  'wolves': 'Timberwolves',
  'thunder': 'Thunder',
  'blazers': 'Trail Blazers',
  'trail blazers': 'Trail Blazers',
  'jazz': 'Jazz',
  'kings': 'Kings',
  'spurs': 'Spurs',
  'rockets': 'Rockets',
  'hawks': 'Hawks',
  'hornets': 'Hornets',
  'cavaliers': 'Cavaliers',
  'cavs': 'Cavaliers',
  'pistons': 'Pistons',
  'pacers': 'Pacers',
  'raptors': 'Raptors',
  'magic': 'Magic',
  'wizards': 'Wizards',
  
  // City names
  'los angeles lakers': 'Lakers',
  'la lakers': 'Lakers',
  'los angeles clippers': 'Clippers',
  'la clippers': 'Clippers',
  'golden state': 'Warriors',
  'golden state warriors': 'Warriors',
  'brooklyn': 'Nets',
  'brooklyn nets': 'Nets',
  'new york': 'Knicks',
  'new york knicks': 'Knicks',
  'boston': 'Celtics',
  'boston celtics': 'Celtics',
  'chicago': 'Bulls',
  'chicago bulls': 'Bulls',
  'miami': 'Heat',
  'miami heat': 'Heat',
  'philadelphia': '76ers',
  'philadelphia 76ers': '76ers',
  'phoenix': 'Suns',
  'phoenix suns': 'Suns',
  'milwaukee': 'Bucks',
  'milwaukee bucks': 'Bucks',
  'dallas': 'Mavericks',
  'dallas mavericks': 'Mavericks',
  'denver': 'Nuggets',
  'denver nuggets': 'Nuggets',
  'memphis': 'Grizzlies',
  'memphis grizzlies': 'Grizzlies',
  'new orleans': 'Pelicans',
  'new orleans pelicans': 'Pelicans',
  'minnesota': 'Timberwolves',
  'minnesota timberwolves': 'Timberwolves',
  'oklahoma city': 'Thunder',
  'oklahoma city thunder': 'Thunder',
  'okc': 'Thunder',
  'portland': 'Trail Blazers',
  'portland trail blazers': 'Trail Blazers',
  'utah': 'Jazz',
  'utah jazz': 'Jazz',
  'sacramento': 'Kings',
  'sacramento kings': 'Kings',
  'san antonio': 'Spurs',
  'san antonio spurs': 'Spurs',
  'houston': 'Rockets',
  'houston rockets': 'Rockets',
  'atlanta': 'Hawks',
  'atlanta hawks': 'Hawks',
  'charlotte': 'Hornets',
  'charlotte hornets': 'Hornets',
  'cleveland': 'Cavaliers',
  'cleveland cavaliers': 'Cavaliers',
  'detroit': 'Pistons',
  'detroit pistons': 'Pistons',
  'indiana': 'Pacers',
  'indiana pacers': 'Pacers',
  'toronto': 'Raptors',
  'toronto raptors': 'Raptors',
  'orlando': 'Magic',
  'orlando magic': 'Magic',
  'washington': 'Wizards',
  'washington wizards': 'Wizards',
};

export class BasketballAdapter extends BaseSportAdapter {
  readonly sport: Sport = 'basketball';
  readonly provider: DataProvider = 'api-sports';
  
  private apiProvider = getAPISportsProvider();
  
  // Store the current league context (can be set per-request)
  private currentLeagueId: number = LEAGUE_IDS.NBA;
  
  constructor(config: AdapterConfig = {}) {
    super({
      ...config,
      apiKey: config.apiKey || process.env.API_FOOTBALL_KEY,
    });
  }
  
  isAvailable(): boolean {
    return this.apiProvider.isConfigured();
  }
  
  /**
   * Set the league context for subsequent operations
   */
  setLeague(leagueId: number): void {
    this.currentLeagueId = leagueId;
    console.log(`[Basketball] League set to: ${leagueId} (${leagueId === LEAGUE_IDS.NBA ? 'NBA' : leagueId === LEAGUE_IDS.EUROLEAGUE ? 'Euroleague' : 'Other'})`);
  }
  
  /**
   * Get current league ID
   */
  getLeagueId(): number {
    return this.currentLeagueId;
  }
  
  /**
   * Check if current league is Euroleague
   */
  private isEuroleague(): boolean {
    return this.currentLeagueId === LEAGUE_IDS.EUROLEAGUE;
  }
  
  /**
   * Get current season string based on league
   * NBA uses YYYY-YYYY format, Euroleague uses the STARTING year (e.g., "2025" for 2025-2026 season)
   */
  private getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (this.isEuroleague()) {
      // Euroleague uses the STARTING year format (e.g., "2025" for 2025-2026 season)
      // Season runs Oct-May
      if (month >= 10) {
        // Oct-Dec: season started this year
        return String(year);
      } else {
        // Jan-Sep: season started last year
        return String(year - 1);
      }
    } else {
      // NBA season runs Oct-June, uses YYYY-YYYY format
      if (month >= 10) {
        return `${year}-${year + 1}`;
      } else {
        return `${year - 1}-${year}`;
      }
    }
  }
  
  /**
   * Normalize team name for search - Uses centralized team resolver
   */
  private normalizeTeamName(name: string): string {
    return resolveTeamName(name, 'basketball');
  }
  
  /**
   * Find a basketball team with improved fuzzy matching
   */
  async findTeam(query: TeamQuery): Promise<DataLayerResponse<NormalizedTeam>> {
    if (!query.name && !query.id) {
      return this.error('INVALID_QUERY', 'Team name or ID required');
    }
    
    const season = this.getCurrentSeason();
    const leagueId = this.currentLeagueId;
    const leagueName = this.isEuroleague() ? 'Euroleague' : 'NBA';
    
    console.log(`[Basketball] Finding team in ${leagueName} (league: ${leagueId}, season: ${season})`);
    
    // Try by ID first
    if (query.id) {
      const result = await this.apiProvider.getBasketballTeams({
        id: parseInt(query.id),
        league: leagueId,
        season,
      });
      
      if (result.success && result.data && result.data.length > 0) {
        return this.success(this.transformTeam(result.data[0]));
      }
    }
    
    // Search by name with multiple variations
    if (query.name) {
      const searchVariations = getSearchVariations(query.name, 'basketball');
      console.log(`[Basketball] Searching for "${query.name}" with variations:`, searchVariations);
      
      // Get all teams once for efficient matching
      const allTeams = await this.apiProvider.getBasketballTeams({
        league: leagueId,
        season,
      });
      
      if (!allTeams.success || !allTeams.data || allTeams.data.length === 0) {
        return this.error('FETCH_ERROR', `Could not fetch ${leagueName} teams`);
      }
      
      console.log(`[Basketball] Found ${allTeams.data.length} teams in ${leagueName}`);
      
      // Try each variation
      for (const searchName of searchVariations) {
        const lowerSearch = searchName.toLowerCase();
        
        // Exact match
        const exactMatch = allTeams.data.find(t => 
          t.name.toLowerCase() === lowerSearch
        );
        if (exactMatch) {
          console.log(`[Basketball] Exact match found: "${query.name}" → "${exactMatch.name}"`);
          return this.success(this.transformTeam(exactMatch));
        }
        
        // Partial match (contains)
        const partialMatch = allTeams.data.find(t => 
          t.name.toLowerCase().includes(lowerSearch) || lowerSearch.includes(t.name.toLowerCase())
        );
        if (partialMatch) {
          console.log(`[Basketball] Partial match found: "${query.name}" → "${partialMatch.name}"`);
          return this.success(this.transformTeam(partialMatch));
        }
      }
      
      // Final fallback: fuzzy match on best similarity
      const resolvedName = resolveTeamName(query.name, 'basketball');
      const lowerResolved = resolvedName.toLowerCase();
      
      let bestMatch: BasketballTeamResponse | null = null;
      let bestScore = 0;
      
      for (const team of allTeams.data) {
        // Calculate simple word overlap score
        const teamWords = team.name.toLowerCase().split(/\s+/);
        const searchWords = lowerResolved.split(/\s+/);
        const overlap = teamWords.filter(w => searchWords.some(sw => w.includes(sw) || sw.includes(w))).length;
        const score = overlap / Math.max(teamWords.length, searchWords.length);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = team;
        }
      }
      
      if (bestMatch && bestScore >= 0.5) {
        console.log(`[Basketball] Fuzzy match found: "${query.name}" → "${bestMatch.name}" (score: ${bestScore})`);
        return this.success(this.transformTeam(bestMatch));
      }
    }
    
    console.error(`[Basketball] Could not find team: "${query.name}"`);
    return this.error('TEAM_NOT_FOUND', `Could not find basketball team: ${query.name || query.id}`);
  }
  
  /**
   * Get basketball matches
   */
  async getMatches(query: MatchQuery): Promise<DataLayerResponse<NormalizedMatch[]>> {
    const season = this.getCurrentSeason();
    const params: Record<string, string | number> = {
      league: this.currentLeagueId,
      season,
    };
    
    if (query.team) {
      const teamResult = await this.findTeam({ name: query.team, sport: 'basketball' });
      if (teamResult.success && teamResult.data) {
        params.team = parseInt(teamResult.data.externalId);
      }
    }
    
    if (query.date) {
      params.date = query.date.toISOString().split('T')[0];
    }
    
    const result = await this.apiProvider.getBasketballGames(params);
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch basketball games');
    }
    
    const matches = result.data
      .slice(0, query.limit || 20)
      .map(game => this.transformMatch(game));
    
    return this.success(matches);
  }
  
  /**
   * Get team statistics
   */
  async getTeamStats(query: StatsQuery): Promise<DataLayerResponse<NormalizedTeamStats>> {
    const season = query.season || this.getCurrentSeason();
    const leagueId = this.currentLeagueId;
    
    // Extract numeric team ID (remove 'basketball-' prefix if present)
    const numericTeamId = parseInt(query.teamId.replace('basketball-', ''));
    
    if (isNaN(numericTeamId)) {
      return this.error('INVALID_TEAM_ID', `Invalid team ID format: ${query.teamId}`);
    }
    
    // First try the /statistics endpoint
    const statsResult = await this.apiProvider.getBasketballTeamStats({
      team: numericTeamId,
      league: leagueId,
      season,
    });
    
    if (statsResult.success && statsResult.data) {
      return this.success(this.transformStats(statsResult.data, query.teamId, season));
    }
    
    // Fallback to standings
    const standingsResult = await this.apiProvider.getBasketballStandings({
      league: leagueId,
      season,
    });
    
    if (standingsResult.success && standingsResult.data) {
      const allStandings = standingsResult.data.flat();
      const teamStanding = allStandings.find(s => 
        s.team.id === numericTeamId
      );
      
      if (teamStanding) {
        return this.success(this.transformStandingsToStats(teamStanding, season));
      }
    }
    
    return this.error('STATS_NOT_FOUND', `Could not find stats for team ${query.teamId}`);
  }
  
  /**
   * Get previous season string based on league
   */
  private getPreviousSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (this.isEuroleague()) {
      // Euroleague uses the STARTING year format
      // Previous season = current season starting year - 1
      if (month >= 10) {
        // Oct-Dec: current season is year, previous is year-1
        return String(year - 1);
      } else {
        // Jan-Sep: current season is year-1, previous is year-2
        return String(year - 2);
      }
    } else {
      // NBA uses YYYY-YYYY format
      if (month >= 10) {
        return `${year - 1}-${year}`;
      } else {
        return `${year - 2}-${year - 1}`;
      }
    }
  }
  
  /**
   * Get recent games for a team
   * Tries current season first, falls back to previous season if no finished games
   */
  async getRecentGames(teamId: string, limit: number = 5): Promise<DataLayerResponse<NormalizedRecentGames>> {
    let season = this.getCurrentSeason();
    const leagueId = this.currentLeagueId;
    const leagueName = this.isEuroleague() ? 'Euroleague' : 'NBA';
    
    console.log(`[Basketball] Getting recent games for team ${teamId} in ${leagueName} (league: ${leagueId}, season: ${season})`);
    
    // Try current season first
    let result = await this.apiProvider.getBasketballGames({
      team: parseInt(teamId),
      league: leagueId,
      season,
    });
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch games');
    }
    
    // Filter to finished games and sort by date descending
    let finishedGames = result.data
      .filter(g => g.status.short === 'FT' || g.status.short === 'AOT')
      .sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`[Basketball] Found ${finishedGames.length} finished games in ${season}`);
    
    // If no finished games in current season, try previous season
    if (finishedGames.length === 0) {
      console.log(`[${leagueName}] No finished games in ${season}, trying previous season`);
      season = this.getPreviousSeason();
      result = await this.apiProvider.getBasketballGames({
        team: parseInt(teamId),
        league: leagueId,
        season,
      });
      
      if (result.success && result.data) {
        finishedGames = result.data
          .filter(g => g.status.short === 'FT' || g.status.short === 'AOT')
          .sort((a, b) => b.timestamp - a.timestamp);
        console.log(`[Basketball] Found ${finishedGames.length} finished games in ${season}`);
      }
    }
    
    finishedGames = finishedGames.slice(0, limit);
    
    const matches = finishedGames.map(g => this.transformMatch(g));
    
    // Calculate summary
    let wins = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    
    for (const game of finishedGames) {
      const isHome = game.teams.home.id === parseInt(teamId);
      const teamScore = isHome ? game.scores.home.total : game.scores.away.total;
      const oppScore = isHome ? game.scores.away.total : game.scores.home.total;
      
      if (teamScore !== null && oppScore !== null) {
        goalsFor += teamScore;
        goalsAgainst += oppScore;
        if (teamScore > oppScore) wins++;
        else losses++;
      }
    }
    
    return this.success({
      teamId,
      sport: 'basketball',
      games: matches,
      summary: {
        wins,
        losses,
        draws: 0,
        goalsFor,
        goalsAgainst,
      },
      provider: 'api-sports',
      fetchedAt: new Date(),
    });
  }
  
  /**
   * Get head-to-head history
   */
  async getH2H(query: H2HQuery): Promise<DataLayerResponse<NormalizedH2H>> {
    // Find both teams
    const team1Result = await this.findTeam({ name: query.team1, sport: 'basketball' });
    const team2Result = await this.findTeam({ name: query.team2, sport: 'basketball' });
    
    if (!team1Result.success || !team1Result.data) {
      return this.error('TEAM_NOT_FOUND', `Could not find team: ${query.team1}`);
    }
    if (!team2Result.success || !team2Result.data) {
      return this.error('TEAM_NOT_FOUND', `Could not find team: ${query.team2}`);
    }
    
    const team1Id = team1Result.data.externalId;
    const team2Id = team2Result.data.externalId;
    const h2hString = `${team1Id}-${team2Id}`;
    
    const result = await this.apiProvider.getBasketballGames({
      h2h: h2hString,
      league: this.currentLeagueId,
      season: this.getCurrentSeason(),
    });
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch H2H');
    }
    
    const games = result.data.slice(0, query.limit || 10);
    const matches = games.map(g => this.transformMatch(g));
    
    // Calculate summary
    let team1Wins = 0, team2Wins = 0, team1Goals = 0, team2Goals = 0;
    
    for (const game of games) {
      const homeIsTeam1 = game.teams.home.id === parseInt(team1Id);
      const homeScore = game.scores.home.total || 0;
      const awayScore = game.scores.away.total || 0;
      
      if (homeIsTeam1) {
        team1Goals += homeScore;
        team2Goals += awayScore;
        if (homeScore > awayScore) team1Wins++;
        else team2Wins++;
      } else {
        team2Goals += homeScore;
        team1Goals += awayScore;
        if (homeScore > awayScore) team2Wins++;
        else team1Wins++;
      }
    }
    
    return this.success({
      team1Id,
      team2Id,
      sport: 'basketball',
      summary: {
        totalGames: games.length,
        team1Wins,
        team2Wins,
        draws: 0,
        team1Goals,
        team2Goals,
      },
      matches,
      provider: 'api-sports',
      fetchedAt: new Date(),
    });
  }
  
  // ============================================================================
  // Team Roster / Players
  // ============================================================================
  
  /**
   * Get the current roster/players for a team
   * Returns players for the current season
   */
  async getTeamRoster(teamId: string): Promise<DataLayerResponse<NormalizedPlayer[]>> {
    const externalId = teamId.replace('basketball-', '');
    const season = this.getCurrentSeason();
    
    console.log(`[Basketball] Fetching roster for team ${externalId}, season ${season}`);
    
    const result = await this.apiProvider.getBasketballPlayers({
      team: parseInt(externalId, 10),
      season,
    });
    
    if (!result.success || !result.data) {
      return this.error('ROSTER_FETCH_FAILED', result.error || 'Failed to fetch team roster');
    }
    
    const players = result.data
      .filter((p: BasketballPlayerResponse) => p.leagues?.standard?.active !== false)
      .map((raw: BasketballPlayerResponse) => this.transformPlayer(raw))
      .slice(0, 15); // Limit to top 15 players
    
    console.log(`[Basketball] Found ${players.length} players for team ${externalId}`);
    
    return this.success(players);
  }
  
  /**
   * Transform raw player data to normalized format
   */
  private transformPlayer(raw: BasketballPlayerResponse): NormalizedPlayer {
    const position = raw.leagues?.standard?.pos || 'Unknown';
    const jersey = raw.leagues?.standard?.jersey;
    
    return {
      id: `basketball-player-${raw.id}`,
      externalId: String(raw.id),
      name: raw.name || `${raw.firstname} ${raw.lastname}`.trim(),
      firstName: raw.firstname,
      lastName: raw.lastname,
      position,
      number: jersey ?? undefined,
      nationality: raw.nationality || undefined,
    };
  }
  
  // ============================================================================
  // Transform Methods
  // ============================================================================
  
  private transformTeam(raw: BasketballTeamResponse): NormalizedTeam {
    return {
      id: `basketball-${raw.id}`,
      externalId: String(raw.id),
      name: raw.name,
      shortName: raw.name.split(' ').pop() || raw.name,
      logo: raw.logo,
      country: raw.country?.name,
      sport: 'basketball',
      league: 'NBA',
    };
  }
  
  private transformMatch(raw: BasketballGameResponse): NormalizedMatch {
    return {
      id: `basketball-${raw.id}`,
      externalId: String(raw.id),
      sport: 'basketball',
      league: raw.league.name,
      leagueId: String(raw.league.id),
      season: raw.league.season,
      
      homeTeam: {
        id: `basketball-${raw.teams.home.id}`,
        externalId: String(raw.teams.home.id),
        name: raw.teams.home.name,
        shortName: raw.teams.home.name.split(' ').pop() || raw.teams.home.name,
        logo: raw.teams.home.logo,
        sport: 'basketball',
      },
      awayTeam: {
        id: `basketball-${raw.teams.away.id}`,
        externalId: String(raw.teams.away.id),
        name: raw.teams.away.name,
        shortName: raw.teams.away.name.split(' ').pop() || raw.teams.away.name,
        logo: raw.teams.away.logo,
        sport: 'basketball',
      },
      
      status: this.mapStatus(raw.status.short),
      date: new Date(raw.timestamp * 1000),
      
      score: {
        home: raw.scores.home.total || 0,
        away: raw.scores.away.total || 0,
        periods: [
          { home: raw.scores.home.quarter_1 || 0, away: raw.scores.away.quarter_1 || 0 },
          { home: raw.scores.home.quarter_2 || 0, away: raw.scores.away.quarter_2 || 0 },
          { home: raw.scores.home.quarter_3 || 0, away: raw.scores.away.quarter_3 || 0 },
          { home: raw.scores.home.quarter_4 || 0, away: raw.scores.away.quarter_4 || 0 },
        ],
      },
      
      provider: 'api-sports',
      fetchedAt: new Date(),
    };
  }
  
  private transformStats(raw: any, teamId: string, season: string): NormalizedTeamStats {
    return {
      teamId,
      season,
      league: 'NBA',
      sport: 'basketball',
      
      record: {
        wins: raw.games?.wins?.all?.total || 0,
        losses: raw.games?.loses?.all?.total || 0,
        winPercentage: parseFloat(raw.games?.wins?.all?.percentage || '0'),
      },
      
      scoring: {
        totalFor: raw.points?.for?.total?.all || 0,
        totalAgainst: raw.points?.against?.total?.all || 0,
        averageFor: parseFloat(raw.points?.for?.average?.all || '0'),
        averageAgainst: parseFloat(raw.points?.against?.average?.all || '0'),
        homeFor: raw.points?.for?.total?.home,
        homeAgainst: raw.points?.against?.total?.home,
        awayFor: raw.points?.for?.total?.away,
        awayAgainst: raw.points?.against?.total?.away,
      },
      
      provider: 'api-sports',
      fetchedAt: new Date(),
    };
  }
  
  /**
   * Get player statistics for a season
   * Returns aggregated stats (averages) calculated from all games
   */
  async getPlayerStats(playerId: string, season?: string): Promise<DataLayerResponse<NormalizedPlayerStats>> {
    const seasonStr = season || this.getCurrentSeason();
    
    console.log(`[Basketball] Getting player stats for ${playerId} in season ${seasonStr}`);
    
    const result = await this.apiProvider.getBasketballPlayerStats({
      player: parseInt(playerId),
      season: seasonStr,
    });
    
    if (!result.success || !result.data || result.data.length === 0) {
      return this.error('PLAYER_STATS_NOT_FOUND', `Could not find stats for player ${playerId}`);
    }
    
    // Aggregate all game stats into season averages
    const games = result.data;
    const gamesPlayed = games.length;
    
    // Sum up all stats
    let totalPoints = 0;
    let totalAssists = 0;
    let totalRebounds = 0;
    let totalSteals = 0;
    let totalBlocks = 0;
    let totalMinutes = 0;
    let totalFGM = 0, totalFGA = 0;
    let totalTPM = 0, totalTPA = 0;
    let totalFTM = 0, totalFTA = 0;
    let teamId = '';
    
    for (const game of games) {
      totalPoints += game.points || 0;
      totalAssists += game.assists || 0;
      // Handle both old flat structure and new nested structure
      totalRebounds += game.rebounds?.total || game.totReb || 0;
      totalSteals += game.steals || 0;
      totalBlocks += game.blocks || 0;
      // Handle both structures for shooting stats
      totalFGM += game.field_goals?.total || game.fgm || 0;
      totalFGA += game.field_goals?.attempts || game.fga || 0;
      totalTPM += game.threepoint_goals?.total || game.tpm || 0;
      totalTPA += game.threepoint_goals?.attempts || game.tpa || 0;
      totalFTM += game.freethrows_goals?.total || game.ftm || 0;
      totalFTA += game.freethrows_goals?.attempts || game.fta || 0;
      teamId = String(game.team.id);
      
      // Parse minutes (format: "32:15") - handle both field names
      const minStr = game.minutes || game.min;
      if (minStr) {
        const [mins, secs] = minStr.split(':').map(Number);
        totalMinutes += mins + (secs || 0) / 60;
      }
    }
    
    // Calculate averages
    const ppg = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
    const apg = gamesPlayed > 0 ? totalAssists / gamesPlayed : 0;
    const rpg = gamesPlayed > 0 ? totalRebounds / gamesPlayed : 0;
    const spg = gamesPlayed > 0 ? totalSteals / gamesPlayed : 0;
    const bpg = gamesPlayed > 0 ? totalBlocks / gamesPlayed : 0;
    const mpg = gamesPlayed > 0 ? totalMinutes / gamesPlayed : 0;
    
    const stats: NormalizedPlayerStats = {
      playerId,
      teamId,
      season: seasonStr,
      sport: 'basketball',
      
      games: {
        played: gamesPlayed,
        minutes: Math.round(mpg * 10) / 10, // Round to 1 decimal
      },
      
      scoring: {
        points: Math.round(ppg * 10) / 10,
        assists: Math.round(apg * 10) / 10,
        fieldGoals: {
          made: Math.round((totalFGM / gamesPlayed) * 10) / 10,
          attempted: Math.round((totalFGA / gamesPlayed) * 10) / 10,
          percentage: totalFGA > 0 ? Math.round((totalFGM / totalFGA) * 1000) / 10 : 0,
        },
        threePointers: {
          made: Math.round((totalTPM / gamesPlayed) * 10) / 10,
          attempted: Math.round((totalTPA / gamesPlayed) * 10) / 10,
          percentage: totalTPA > 0 ? Math.round((totalTPM / totalTPA) * 1000) / 10 : 0,
        },
        freeThrows: {
          made: Math.round((totalFTM / gamesPlayed) * 10) / 10,
          attempted: Math.round((totalFTA / gamesPlayed) * 10) / 10,
          percentage: totalFTA > 0 ? Math.round((totalFTM / totalFTA) * 1000) / 10 : 0,
        },
      },
      
      defense: {
        rebounds: Math.round(rpg * 10) / 10,
        steals: Math.round(spg * 10) / 10,
        blocks: Math.round(bpg * 10) / 10,
      },
      
      provider: 'api-sports',
      fetchedAt: new Date(),
    };
    
    console.log(`[Basketball] Player ${playerId} season ${seasonStr}: ${ppg.toFixed(1)} PPG, ${rpg.toFixed(1)} RPG, ${apg.toFixed(1)} APG (${gamesPlayed} games)`);
    
    return this.success(stats);
  }
  
  /**
   * Search for a player by name
   * The API requires a team ID for player search, so we need to:
   * 1. Get all NBA teams
   * 2. Search each team's roster for the player name
   * 
   * For performance, we cache the player mappings
   */
  async searchPlayer(name: string, season?: string): Promise<DataLayerResponse<NormalizedPlayer[]>> {
    const seasonStr = season || this.getCurrentSeason();
    const searchName = name.toLowerCase();
    
    console.log(`[Basketball] Searching for player: "${name}" in season ${seasonStr}`);
    
    // Get all NBA teams first
    const teamsResult = await this.apiProvider.getBasketballTeams({
      league: this.currentLeagueId,
      season: seasonStr,
    });
    
    if (!teamsResult.success || !teamsResult.data || teamsResult.data.length === 0) {
      return this.error('TEAMS_NOT_FOUND', 'Could not fetch NBA teams');
    }
    
    // Map known player names to their teams for faster lookup
    const KNOWN_PLAYERS: Record<string, string[]> = {
      'embiid': ['76ers', 'philadelphia'],
      'joel embiid': ['76ers', 'philadelphia'],
      'lebron': ['lakers', 'los angeles'],
      'lebron james': ['lakers', 'los angeles'],
      'james': ['lakers', 'los angeles'], // LeBron James
      'curry': ['warriors', 'golden state'],
      'stephen curry': ['warriors', 'golden state'],
      'durant': ['suns', 'phoenix'],
      'kevin durant': ['suns', 'phoenix'],
      'giannis': ['bucks', 'milwaukee'],
      'antetokounmpo': ['bucks', 'milwaukee'],
      'jokic': ['nuggets', 'denver'],
      'nikola jokic': ['nuggets', 'denver'],
      'luka': ['mavericks', 'dallas'],
      'doncic': ['mavericks', 'dallas'],
      'tatum': ['celtics', 'boston'],
      'jayson tatum': ['celtics', 'boston'],
      'lillard': ['bucks', 'milwaukee'],
      'damian lillard': ['bucks', 'milwaukee'],
      'anthony davis': ['lakers', 'los angeles'],
      'davis': ['lakers', 'los angeles'], // Anthony Davis
      'gilgeous-alexander': ['thunder', 'oklahoma'],
      'sga': ['thunder', 'oklahoma'],
      'wembanyama': ['spurs', 'san antonio'],
      'brunson': ['knicks', 'new york'],
      'maxey': ['76ers', 'philadelphia'],
      'harden': ['clippers', 'los angeles'],
      'irving': ['mavericks', 'dallas'],
      'kyrie': ['mavericks', 'dallas'],
      'booker': ['suns', 'phoenix'],
      'edwards': ['timberwolves', 'minnesota'],
      'morant': ['grizzlies', 'memphis'],
      'young': ['hawks', 'atlanta'],
      'trae': ['hawks', 'atlanta'],
      'mitchell': ['cavaliers', 'cleveland'],
      'fox': ['kings', 'sacramento'],
      'towns': ['knicks', 'new york'],
      'butler': ['heat', 'miami'],
      'adebayo': ['heat', 'miami'],
      'ball': ['hornets', 'charlotte'],
      'brown': ['celtics', 'boston'],
      'jaylen': ['celtics', 'boston'],
      'george': ['sixers', 'philadelphia'],
      'westbrook': ['nuggets', 'denver'],
    };
    
    // Try to find team based on known player mappings
    let targetTeams = teamsResult.data;
    const knownTeamHints = KNOWN_PLAYERS[searchName];
    if (knownTeamHints) {
      const matchedTeam = teamsResult.data.find(t => 
        knownTeamHints.some(hint => t.name.toLowerCase().includes(hint))
      );
      if (matchedTeam) {
        targetTeams = [matchedTeam];
        console.log(`[Basketball] Using known team mapping: ${matchedTeam.name}`);
      }
    }
    
    // Search team rosters for the player
    for (const team of targetTeams) {
      const playersResult = await this.apiProvider.getBasketballPlayers({
        team: team.id,
        season: seasonStr,
      });
      
      if (!playersResult.success || !playersResult.data) {
        continue;
      }
      
      // Find matching player - use strict matching
      const matchingPlayers = playersResult.data.filter(p => {
        const playerName = p.name.toLowerCase();
        const firstName = p.firstname?.toLowerCase() || '';
        const lastName = p.lastname?.toLowerCase() || '';
        
        // Exact last name match (most common case: "embiid" -> "Embiid Joel")
        if (lastName === searchName) return true;
        
        // Full name in player name (e.g., "joel embiid" matches "Embiid Joel")
        if (playerName.includes(searchName)) return true;
        
        // Search name contains last name exactly (e.g., "joel embiid" contains "embiid")
        if (searchName.includes(lastName) && lastName.length >= 4) return true;
        
        return false;
      });
      
      if (matchingPlayers.length > 0) {
        // Sort by best match - exact last name match first
        matchingPlayers.sort((a, b) => {
          const aLastName = a.lastname?.toLowerCase() || '';
          const bLastName = b.lastname?.toLowerCase() || '';
          // Exact matches first
          if (aLastName === searchName && bLastName !== searchName) return -1;
          if (bLastName === searchName && aLastName !== searchName) return 1;
          // Then by name length (shorter = more likely to be correct)
          return a.name.length - b.name.length;
        });
        
        // Transform to normalized players
        const players: NormalizedPlayer[] = matchingPlayers.map(p => ({
          id: String(p.id),
          externalId: String(p.id),
          name: p.name,
          firstName: p.firstname,
          lastName: p.lastname,
          position: p.leagues?.standard?.pos || undefined,
          number: p.leagues?.standard?.jersey || undefined,
          nationality: p.nationality || undefined,
          height: p.height?.meters || undefined,
          weight: p.weight?.kilograms ? `${p.weight.kilograms} kg` : undefined,
          teamId: String(team.id),
          teamName: team.name,
        }));
        
        console.log(`[Basketball] Found ${players.length} player(s) matching "${name}" on ${team.name}`);
        
        return this.success(players);
      }
    }
    
    return this.error('PLAYER_NOT_FOUND', `Could not find player matching "${name}"`);
  }
  
  private transformStandingsToStats(standing: BasketballStandingsResponse, season: string): NormalizedTeamStats {
    return {
      teamId: String(standing.team.id),
      season,
      league: 'NBA',
      sport: 'basketball',
      
      record: {
        wins: standing.games.win.total,
        losses: standing.games.lose.total,
        winPercentage: parseFloat(standing.games.win.percentage),
      },
      
      scoring: {
        totalFor: standing.points.for,
        totalAgainst: standing.points.against,
        averageFor: standing.games.played > 0 ? standing.points.for / standing.games.played : 0,
        averageAgainst: standing.games.played > 0 ? standing.points.against / standing.games.played : 0,
      },
      
      form: standing.form ? {
        last5: standing.form.slice(0, 5),
        last10: standing.form.slice(0, 10),
      } : undefined,
      
      provider: 'api-sports',
      fetchedAt: new Date(),
    };
  }
  
  private mapStatus(status: string): MatchStatus {
    const statusMap: Record<string, MatchStatus> = {
      'NS': 'scheduled',
      'LIVE': 'live',
      'Q1': 'live',
      'Q2': 'live',
      'Q3': 'live',
      'Q4': 'live',
      'OT': 'live',
      'HT': 'halftime',
      'FT': 'finished',
      'AOT': 'finished',
      'POST': 'postponed',
      'CANC': 'cancelled',
      'SUSP': 'suspended',
    };
    return statusMap[status] || 'unknown';
  }
}

// Export singleton
let instance: BasketballAdapter | null = null;

export function getBasketballAdapter(): BasketballAdapter {
  if (!instance) {
    instance = new BasketballAdapter();
  }
  return instance;
}
