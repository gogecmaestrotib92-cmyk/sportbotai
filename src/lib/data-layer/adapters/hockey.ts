/**
 * Hockey Adapter
 * 
 * Transforms API-Sports hockey data into normalized format.
 * Handles NHL and other hockey leagues.
 */

import { BaseSportAdapter, AdapterConfig } from './base';
import {
  Sport,
  DataProvider,
  DataLayerResponse,
  NormalizedTeam,
  NormalizedMatch,
  NormalizedTeamStats,
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
  HockeyTeamResponse,
  HockeyGameResponse,
  HockeyStandingsResponse,
  HockeyPlayerResponse,
} from '../providers/api-sports';
import { resolveTeamName, getSearchVariations } from '../team-resolver';

// Team name mappings for NHL - DEPRECATED: Now using team-resolver.ts
const NHL_TEAM_MAPPINGS: Record<string, string> = {
  // Short names
  'bruins': 'Bruins',
  'sabres': 'Sabres',
  'red wings': 'Red Wings',
  'panthers': 'Panthers',
  'canadiens': 'Canadiens',
  'habs': 'Canadiens',
  'senators': 'Senators',
  'sens': 'Senators',
  'lightning': 'Lightning',
  'bolts': 'Lightning',
  'maple leafs': 'Maple Leafs',
  'leafs': 'Maple Leafs',
  'hurricanes': 'Hurricanes',
  'canes': 'Hurricanes',
  'blue jackets': 'Blue Jackets',
  'jackets': 'Blue Jackets',
  'devils': 'Devils',
  'islanders': 'Islanders',
  'isles': 'Islanders',
  'rangers': 'Rangers',
  'flyers': 'Flyers',
  'penguins': 'Penguins',
  'pens': 'Penguins',
  'capitals': 'Capitals',
  'caps': 'Capitals',
  'blackhawks': 'Blackhawks',
  'hawks': 'Blackhawks',
  'avalanche': 'Avalanche',
  'avs': 'Avalanche',
  'stars': 'Stars',
  'wild': 'Wild',
  'predators': 'Predators',
  'preds': 'Predators',
  'blues': 'Blues',
  'jets': 'Jets',
  'flames': 'Flames',
  'oilers': 'Oilers',
  'kings': 'Kings',
  'ducks': 'Ducks',
  'sharks': 'Sharks',
  'kraken': 'Kraken',
  'canucks': 'Canucks',
  'golden knights': 'Golden Knights',
  'knights': 'Golden Knights',
  'utah hockey club': 'Utah Hockey Club',
  'utah hc': 'Utah Hockey Club',
  
  // City mappings
  'boston': 'Bruins',
  'buffalo': 'Sabres',
  'detroit': 'Red Wings',
  'florida': 'Panthers',
  'montreal': 'Canadiens',
  'ottawa': 'Senators',
  'tampa bay': 'Lightning',
  'tampa': 'Lightning',
  'toronto': 'Maple Leafs',
  'carolina': 'Hurricanes',
  'columbus': 'Blue Jackets',
  'new jersey': 'Devils',
  'new york islanders': 'Islanders',
  'ny islanders': 'Islanders',
  'new york rangers': 'Rangers',
  'ny rangers': 'Rangers',
  'philadelphia': 'Flyers',
  'pittsburgh': 'Penguins',
  'washington': 'Capitals',
  'chicago': 'Blackhawks',
  'colorado': 'Avalanche',
  'dallas': 'Stars',
  'minnesota': 'Wild',
  'nashville': 'Predators',
  'st. louis': 'Blues',
  'st louis': 'Blues',
  'winnipeg': 'Jets',
  'calgary': 'Flames',
  'edmonton': 'Oilers',
  'los angeles': 'Kings',
  'la kings': 'Kings',
  'anaheim': 'Ducks',
  'utah': 'Utah Hockey Club',
  'san jose': 'Sharks',
  'seattle': 'Kraken',
  'vancouver': 'Canucks',
  'vegas': 'Golden Knights',
  'las vegas': 'Golden Knights',
};

export class HockeyAdapter extends BaseSportAdapter {
  readonly sport: Sport = 'hockey';
  readonly provider: DataProvider = 'api-sports';
  
  private apiProvider = getAPISportsProvider();
  
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
   * Get current NHL season (single year format)
   */
  private getCurrentSeason(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // NHL season runs Oct-June
    if (month >= 10) {
      return year;
    } else {
      return year - 1;
    }
  }
  
  /**
   * Normalize team name for search - Uses centralized team resolver
   */
  private normalizeTeamName(name: string): string {
    return resolveTeamName(name, 'hockey');
  }
  
  /**
   * Find a hockey team with improved fuzzy matching
   * Tries current season first, falls back to previous season if no teams found
   */
  async findTeam(query: TeamQuery): Promise<DataLayerResponse<NormalizedTeam>> {
    console.log(`[Hockey] findTeam called with:`, { name: query.name, id: query.id, sport: query.sport });
    
    if (!query.name && !query.id) {
      return this.error('INVALID_QUERY', 'Team name or ID required');
    }
    
    let season = this.getCurrentSeason();
    const leagueId = LEAGUE_IDS.NHL;
    console.log(`[Hockey] Using season=${season}, leagueId=${leagueId}`);
    
    // Try by ID first
    if (query.id) {
      let result = await this.apiProvider.getHockeyTeams({
        id: parseInt(query.id),
        league: leagueId,
        season,
      });
      
      // Fallback to previous season if no results
      if ((!result.success || !result.data || result.data.length === 0) && season > 2020) {
        console.log(`[Hockey] No team by ID in ${season}, trying ${season - 1}`);
        result = await this.apiProvider.getHockeyTeams({
          id: parseInt(query.id),
          league: leagueId,
          season: season - 1,
        });
      }
      
      if (result.success && result.data && result.data.length > 0) {
        return this.success(this.transformTeam(result.data[0]));
      }
    }
    
    // Search by name with multiple variations
    if (query.name) {
      const searchVariations = getSearchVariations(query.name, 'hockey');
      console.log(`[Hockey] Searching for "${query.name}" with variations:`, searchVariations);
      
      // Get all teams once for efficient matching
      let allTeams = await this.apiProvider.getHockeyTeams({
        league: leagueId,
        season,
      });
      
      // Fallback to previous season if no teams found
      if ((!allTeams.success || !allTeams.data || allTeams.data.length === 0) && season > 2020) {
        console.log(`[Hockey] No teams in ${season}, trying ${season - 1}`);
        season = season - 1;
        allTeams = await this.apiProvider.getHockeyTeams({
          league: leagueId,
          season,
        });
      }
      
      if (!allTeams.success || !allTeams.data || allTeams.data.length === 0) {
        return this.error('FETCH_ERROR', 'Could not fetch NHL teams');
      }
      
      // Try each variation
      for (const searchName of searchVariations) {
        const lowerSearch = searchName.toLowerCase();
        
        // Exact match
        const exactMatch = allTeams.data.find(t => 
          t.name.toLowerCase() === lowerSearch
        );
        if (exactMatch) {
          console.log(`[Hockey] Exact match found: "${query.name}" → "${exactMatch.name}"`);
          return this.success(this.transformTeam(exactMatch));
        }
        
        // Partial match (contains)
        const partialMatch = allTeams.data.find(t => 
          t.name.toLowerCase().includes(lowerSearch) || lowerSearch.includes(t.name.toLowerCase())
        );
        if (partialMatch) {
          console.log(`[Hockey] Partial match found: "${query.name}" → "${partialMatch.name}"`);
          return this.success(this.transformTeam(partialMatch));
        }
      }
      
      // Final fallback: fuzzy match on best similarity
      const resolvedName = resolveTeamName(query.name, 'hockey');
      const lowerResolved = resolvedName.toLowerCase();
      
      let bestMatch: HockeyTeamResponse | null = null;
      let bestScore = 0;
      
      for (const team of allTeams.data) {
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
        console.log(`[Hockey] Fuzzy match found: "${query.name}" → "${bestMatch.name}" (score: ${bestScore})`);
        return this.success(this.transformTeam(bestMatch));
      }
    }
    
    console.error(`[Hockey] Could not find team: "${query.name}"`);
    return this.error('TEAM_NOT_FOUND', `Could not find hockey team: ${query.name || query.id}`);
  }
  
  /**
   * Get hockey matches
   */
  async getMatches(query: MatchQuery): Promise<DataLayerResponse<NormalizedMatch[]>> {
    const season = this.getCurrentSeason();
    const params: Record<string, string | number> = {
      league: LEAGUE_IDS.NHL,
      season,
    };
    
    if (query.team) {
      const teamResult = await this.findTeam({ name: query.team, sport: 'hockey' });
      if (teamResult.success && teamResult.data) {
        params.team = parseInt(teamResult.data.externalId);
      }
    }
    
    if (query.date) {
      params.date = query.date.toISOString().split('T')[0];
    }
    
    const result = await this.apiProvider.getHockeyGames(params);
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch hockey games');
    }
    
    const matches = result.data
      .slice(0, query.limit || 20)
      .map(game => this.transformMatch(game));
    
    return this.success(matches);
  }
  
  /**
   * Get team statistics
   * Tries current season first, falls back to previous season if no stats found
   */
  async getTeamStats(query: StatsQuery): Promise<DataLayerResponse<NormalizedTeamStats>> {
    let season = query.season ? parseInt(query.season) : this.getCurrentSeason();
    const leagueId = LEAGUE_IDS.NHL;
    
    // Try /teams/statistics endpoint first
    let statsResult = await this.apiProvider.getHockeyTeamStats({
      team: parseInt(query.teamId),
      league: leagueId,
      season,
    });
    
    if (statsResult.success && statsResult.data) {
      return this.success(this.transformStats(statsResult.data, query.teamId, String(season)));
    }
    
    // Try previous season if current season has no stats
    if (!query.season && season > 2020) {
      console.log(`[Hockey Stats] No stats in ${season}, trying ${season - 1}`);
      season = season - 1;
      statsResult = await this.apiProvider.getHockeyTeamStats({
        team: parseInt(query.teamId),
        league: leagueId,
        season,
      });
      
      if (statsResult.success && statsResult.data) {
        return this.success(this.transformStats(statsResult.data, query.teamId, String(season)));
      }
    }
    
    // Fallback to standings (try both current and previous season)
    let standingsResult = await this.apiProvider.getHockeyStandings({
      league: leagueId,
      season,
    });
    
    if (standingsResult.success && standingsResult.data) {
      const allStandings = standingsResult.data.flat();
      const teamStanding = allStandings.find(s => 
        s.team.id === parseInt(query.teamId)
      );
      
      if (teamStanding) {
        return this.success(this.transformStandingsToStats(teamStanding, String(season)));
      }
    }
    
    // Try previous season for standings too
    if (season === this.getCurrentSeason() && season > 2020) {
      standingsResult = await this.apiProvider.getHockeyStandings({
        league: leagueId,
        season: season - 1,
      });
      
      if (standingsResult.success && standingsResult.data) {
        const allStandings = standingsResult.data.flat();
        const teamStanding = allStandings.find(s => 
          s.team.id === parseInt(query.teamId)
        );
        
        if (teamStanding) {
          return this.success(this.transformStandingsToStats(teamStanding, String(season - 1)));
        }
      }
    }
    
    return this.error('STATS_NOT_FOUND', `Could not find stats for team ${query.teamId}`);
  }
  
  /**
   * Get recent games for a team
   * Tries current season first, falls back to previous season if no finished games
   */
  async getRecentGames(teamId: string, limit: number = 5): Promise<DataLayerResponse<NormalizedRecentGames>> {
    let season = this.getCurrentSeason();
    
    // Try current season first
    let result = await this.apiProvider.getHockeyGames({
      team: parseInt(teamId),
      league: LEAGUE_IDS.NHL,
      season,
    });
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch games');
    }
    
    // Filter to finished games and sort by date descending
    let finishedGames = result.data
      .filter(g => g.status.short === 'FT' || g.status.short === 'AOT' || g.status.short === 'AP')
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // If no finished games in current season, try previous season
    if (finishedGames.length === 0 && season > 2020) {
      console.log(`[NHL] No finished games in ${season}, trying ${season - 1}`);
      season = season - 1;
      result = await this.apiProvider.getHockeyGames({
        team: parseInt(teamId),
        league: LEAGUE_IDS.NHL,
        season,
      });
      
      if (result.success && result.data) {
        finishedGames = result.data
          .filter(g => g.status.short === 'FT' || g.status.short === 'AOT' || g.status.short === 'AP')
          .sort((a, b) => b.timestamp - a.timestamp);
      }
    }
    
    finishedGames = finishedGames.slice(0, limit);
    
    const matches = finishedGames.map(g => this.transformMatch(g));
    
    // Calculate summary
    let wins = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    
    for (const game of finishedGames) {
      const isHome = game.teams.home.id === parseInt(teamId);
      const teamScore = isHome ? game.scores.home : game.scores.away;
      const oppScore = isHome ? game.scores.away : game.scores.home;
      
      if (teamScore !== null && oppScore !== null) {
        goalsFor += teamScore;
        goalsAgainst += oppScore;
        if (teamScore > oppScore) wins++;
        else losses++;
      }
    }
    
    return this.success({
      teamId,
      sport: 'hockey',
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
   * Tries current season first, falls back to previous season
   */
  async getH2H(query: H2HQuery): Promise<DataLayerResponse<NormalizedH2H>> {
    // Find both teams
    const team1Result = await this.findTeam({ name: query.team1, sport: 'hockey' });
    const team2Result = await this.findTeam({ name: query.team2, sport: 'hockey' });
    
    if (!team1Result.success || !team1Result.data) {
      return this.error('TEAM_NOT_FOUND', `Could not find team: ${query.team1}`);
    }
    if (!team2Result.success || !team2Result.data) {
      return this.error('TEAM_NOT_FOUND', `Could not find team: ${query.team2}`);
    }
    
    const team1Id = team1Result.data.externalId;
    const team2Id = team2Result.data.externalId;
    const h2hString = `${team1Id}-${team2Id}`;
    
    let season = this.getCurrentSeason();
    let result = await this.apiProvider.getHockeyGames({
      h2h: h2hString,
      league: LEAGUE_IDS.NHL,
      season,
    });
    
    // Fallback to previous season if no H2H found
    if ((!result.success || !result.data || result.data.length === 0) && season > 2020) {
      console.log(`[Hockey H2H] No games in ${season}, trying ${season - 1}`);
      season = season - 1;
      result = await this.apiProvider.getHockeyGames({
        h2h: h2hString,
        league: LEAGUE_IDS.NHL,
        season,
      });
    }
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch H2H');
    }
    
    const games = result.data.slice(0, query.limit || 10);
    const matches = games.map(g => this.transformMatch(g));
    
    // Calculate summary
    let team1Wins = 0, team2Wins = 0, team1Goals = 0, team2Goals = 0;
    
    for (const game of games) {
      const homeIsTeam1 = game.teams.home.id === parseInt(team1Id);
      const homeScore = game.scores.home || 0;
      const awayScore = game.scores.away || 0;
      
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
      sport: 'hockey',
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
    const externalId = teamId.replace('hockey-', '');
    const season = this.getCurrentSeason();
    
    console.log(`[Hockey] Fetching roster for team ${externalId}, season ${season}`);
    
    const result = await this.apiProvider.getHockeyPlayers({
      team: parseInt(externalId, 10),
      season,
    });
    
    if (!result.success || !result.data) {
      return this.error(result.error || 'Failed to fetch team roster');
    }
    
    const players = result.data
      .map((raw: HockeyPlayerResponse) => this.transformPlayer(raw))
      .slice(0, 15); // Limit to top 15 players
    
    console.log(`[Hockey] Found ${players.length} players for team ${externalId}`);
    
    return this.success(players);
  }
  
  /**
   * Transform raw player data to normalized format
   */
  private transformPlayer(raw: HockeyPlayerResponse): NormalizedPlayer {
    return {
      id: `hockey-player-${raw.id}`,
      externalId: String(raw.id),
      name: raw.name || `${raw.firstname} ${raw.lastname}`.trim(),
      firstName: raw.firstname,
      lastName: raw.lastname,
      position: raw.position || 'Unknown',
      number: raw.number ?? undefined,
      nationality: raw.nationality || undefined,
      age: raw.age ?? undefined,
    };
  }
  
  // ============================================================================
  // Transform Methods
  // ============================================================================
  
  private transformTeam(raw: HockeyTeamResponse): NormalizedTeam {
    return {
      id: `hockey-${raw.id}`,
      externalId: String(raw.id),
      name: raw.name,
      shortName: raw.name.split(' ').pop() || raw.name,
      logo: raw.logo,
      country: raw.country?.name,
      sport: 'hockey',
      league: 'NHL',
    };
  }
  
  private transformMatch(raw: HockeyGameResponse): NormalizedMatch {
    return {
      id: `hockey-${raw.id}`,
      externalId: String(raw.id),
      sport: 'hockey',
      league: raw.league.name,
      leagueId: String(raw.league.id),
      season: String(raw.league.season),
      
      homeTeam: {
        id: `hockey-${raw.teams.home.id}`,
        externalId: String(raw.teams.home.id),
        name: raw.teams.home.name,
        shortName: raw.teams.home.name.split(' ').pop() || raw.teams.home.name,
        logo: raw.teams.home.logo,
        sport: 'hockey',
      },
      awayTeam: {
        id: `hockey-${raw.teams.away.id}`,
        externalId: String(raw.teams.away.id),
        name: raw.teams.away.name,
        shortName: raw.teams.away.name.split(' ').pop() || raw.teams.away.name,
        logo: raw.teams.away.logo,
        sport: 'hockey',
      },
      
      status: this.mapStatus(raw.status.short),
      date: new Date(raw.timestamp * 1000),
      
      score: {
        home: raw.scores.home || 0,
        away: raw.scores.away || 0,
        periods: [
          { home: raw.periods.first?.home || 0, away: raw.periods.first?.away || 0 },
          { home: raw.periods.second?.home || 0, away: raw.periods.second?.away || 0 },
          { home: raw.periods.third?.home || 0, away: raw.periods.third?.away || 0 },
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
      league: 'NHL',
      sport: 'hockey',
      
      record: {
        wins: raw.games?.wins?.total || 0,
        losses: raw.games?.loses?.total || 0,
        winPercentage: parseFloat(raw.games?.wins?.percentage || '0'),
      },
      
      scoring: {
        totalFor: raw.goals?.for || 0,
        totalAgainst: raw.goals?.against || 0,
        averageFor: raw.games?.played ? (raw.goals?.for || 0) / raw.games.played : 0,
        averageAgainst: raw.games?.played ? (raw.goals?.against || 0) / raw.games.played : 0,
      },
      
      provider: 'api-sports',
      fetchedAt: new Date(),
    };
  }
  
  private transformStandingsToStats(standing: HockeyStandingsResponse, season: string): NormalizedTeamStats {
    return {
      teamId: String(standing.team.id),
      season,
      league: 'NHL',
      sport: 'hockey',
      
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
      'P1': 'live',
      'P2': 'live',
      'P3': 'live',
      'OT': 'live',
      'PT': 'live', // Penalty time
      'BT': 'halftime', // Break time
      'FT': 'finished',
      'AOT': 'finished', // After overtime
      'AP': 'finished', // After penalties
      'POST': 'postponed',
      'CANC': 'cancelled',
      'SUSP': 'suspended',
    };
    return statusMap[status] || 'unknown';
  }
}

// Export singleton
let instance: HockeyAdapter | null = null;

export function getHockeyAdapter(): HockeyAdapter {
  if (!instance) {
    instance = new HockeyAdapter();
  }
  return instance;
}
