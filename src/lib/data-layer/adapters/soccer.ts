/**
 * Soccer Adapter
 * 
 * Transforms API-Sports football data into normalized format.
 * Handles major leagues: Premier League, La Liga, Bundesliga, Serie A, etc.
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
  NormalizedInjury,
  MatchStatus,
  TeamQuery,
  MatchQuery,
  StatsQuery,
  H2HQuery,
} from '../types';
import {
  getAPISportsProvider,
  LEAGUE_IDS,
  SoccerTeamResponse,
  SoccerFixtureResponse,
  SoccerTeamStatsResponse,
  SoccerInjuryResponse,
} from '../providers/api-sports';
import { resolveTeamName, getSearchVariations } from '../team-resolver';

// Popular league mappings
const LEAGUE_MAPPINGS: Record<string, number> = {
  'premier league': LEAGUE_IDS.PREMIER_LEAGUE,
  'epl': LEAGUE_IDS.PREMIER_LEAGUE,
  'english premier league': LEAGUE_IDS.PREMIER_LEAGUE,
  'soccer_epl': LEAGUE_IDS.PREMIER_LEAGUE,
  'la liga': LEAGUE_IDS.LA_LIGA,
  'laliga': LEAGUE_IDS.LA_LIGA,
  'spanish league': LEAGUE_IDS.LA_LIGA,
  'soccer_spain_la_liga': LEAGUE_IDS.LA_LIGA,
  'la liga 2': LEAGUE_IDS.LA_LIGA_2,
  'segunda': LEAGUE_IDS.LA_LIGA_2,
  'segunda division': LEAGUE_IDS.LA_LIGA_2,
  'soccer_spain_segunda_division': LEAGUE_IDS.LA_LIGA_2,
  'bundesliga': LEAGUE_IDS.BUNDESLIGA,
  'german league': LEAGUE_IDS.BUNDESLIGA,
  'soccer_germany_bundesliga': LEAGUE_IDS.BUNDESLIGA,
  'serie a': LEAGUE_IDS.SERIE_A,
  'italian league': LEAGUE_IDS.SERIE_A,
  'soccer_italy_serie_a': LEAGUE_IDS.SERIE_A,
  'ligue 1': LEAGUE_IDS.LIGUE_1,
  'french league': LEAGUE_IDS.LIGUE_1,
  'soccer_france_ligue_one': LEAGUE_IDS.LIGUE_1,
  'mls': LEAGUE_IDS.MLS,
  'major league soccer': LEAGUE_IDS.MLS,
  'champions league': LEAGUE_IDS.CHAMPIONS_LEAGUE,
  'ucl': LEAGUE_IDS.CHAMPIONS_LEAGUE,
};

export class SoccerAdapter extends BaseSportAdapter {
  readonly sport: Sport = 'soccer';
  readonly provider: DataProvider = 'api-sports';
  
  private apiProvider = getAPISportsProvider();
  
  constructor(config: AdapterConfig = {}) {
    super({
      ...config,
      apiKey: config.apiKey || process.env.API_FOOTBALL_KEY,
    });
    console.log(`[Soccer] Adapter initialized, API available: ${this.isAvailable()}`);
  }
  
  isAvailable(): boolean {
    const available = this.apiProvider.isConfigured();
    return available;
  }
  
  /**
   * Get current soccer season year
   */
  private getCurrentSeason(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Most leagues run Aug-May
    if (month >= 8) {
      return year;
    } else {
      return year - 1;
    }
  }
  
  /**
   * Resolve league name to ID
   */
  private resolveLeagueId(league?: string): number | undefined {
    if (!league) return undefined;
    const lower = league.toLowerCase().trim();
    return LEAGUE_MAPPINGS[lower];
  }
  
  /**
   * Find a soccer team with improved matching
   * API-Sports requires league parameter, so we try major leagues if not specified
   */
  async findTeam(query: TeamQuery): Promise<DataLayerResponse<NormalizedTeam>> {
    if (!query.name && !query.id) {
      return this.error('INVALID_QUERY', 'Team name or ID required');
    }
    
    const season = this.getCurrentSeason();
    const leagueId = this.resolveLeagueId(query.league);
    
    // Major leagues to try if no league specified (ordered by popularity)
    // Includes second-tier leagues for promoted/relegated teams
    const majorLeagues = [
      LEAGUE_IDS.PREMIER_LEAGUE,    // 39 - EPL
      LEAGUE_IDS.LA_LIGA,           // 140 - Spain
      LEAGUE_IDS.BUNDESLIGA,        // 78 - Germany
      LEAGUE_IDS.SERIE_A,           // 135 - Italy
      LEAGUE_IDS.LIGUE_1,           // 61 - France
      LEAGUE_IDS.CHAMPIONSHIP,      // 40 - England 2nd
      LEAGUE_IDS.LA_LIGA_2,         // 141 - Spain 2nd
      LEAGUE_IDS.BUNDESLIGA_2,      // 79 - Germany 2nd
      LEAGUE_IDS.SERIE_B,           // 136 - Italy 2nd
      LEAGUE_IDS.LIGUE_2,           // 62 - France 2nd
      LEAGUE_IDS.CHAMPIONS_LEAGUE,  // 2 - UCL
      LEAGUE_IDS.EUROPA_LEAGUE,     // 3 - UEL
      LEAGUE_IDS.MLS,               // 253 - USA
    ];
    
    // Try by ID first
    if (query.id) {
      const result = await this.apiProvider.getSoccerTeams({
        id: parseInt(query.id),
        season,
      });
      
      if (result.success && result.data && result.data.length > 0) {
        return this.success(this.transformTeam(result.data[0]));
      }
    }
    
    // Search by name with variations
    if (query.name) {
      const searchVariations = getSearchVariations(query.name, 'soccer');
      console.log(`[Soccer] Searching for "${query.name}" with variations:`, searchVariations, `league: ${leagueId || 'auto-detect'}`);
      
      // If league is specified, only try that league
      const leaguesToTry = leagueId ? [leagueId] : majorLeagues;
      
      // Try each league
      for (const tryLeague of leaguesToTry) {
        // Try each name variation
        for (const searchName of searchVariations) {
          const params: { name?: string; search?: string; league: number; season: number } = {
            season,
            league: tryLeague,
          };
          
          // Try exact name first
          params.name = searchName;
          
          const result = await this.apiProvider.getSoccerTeams(params);
          
          if (result.success && result.data && result.data.length > 0) {
            console.log(`[Soccer] Found team: "${query.name}" → "${result.data[0].team.name}" in league ${tryLeague}`);
            return this.success(this.transformTeam(result.data[0]));
          }
          
          // Try search parameter (more lenient)
          delete params.name;
          (params as any).search = searchName;
          
          const searchResult = await this.apiProvider.getSoccerTeams(params);
          
          if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
            // Find best match from results
            const lowerSearch = searchName.toLowerCase();
            const exactMatch = searchResult.data.find(t => 
              t.team.name.toLowerCase() === lowerSearch
            );
            
            if (exactMatch) {
              console.log(`[Soccer] Found exact match: "${query.name}" → "${exactMatch.team.name}" in league ${tryLeague}`);
              return this.success(this.transformTeam(exactMatch));
            }
            
            // Return first result if no exact match
            console.log(`[Soccer] Found via search: "${query.name}" → "${searchResult.data[0].team.name}" in league ${tryLeague}`);
            return this.success(this.transformTeam(searchResult.data[0]));
          }
        }
        
        // Only try first league variation if we found nothing - avoid too many API calls
        // Increased to 6 to cover top + second tier of major leagues
        if (!leagueId && leaguesToTry.indexOf(tryLeague) >= 6) {
          console.log(`[Soccer] Stopping league search after checking ${leaguesToTry.indexOf(tryLeague) + 1} leagues`);
          break;
        }
      }
      
      // Final fallback: try resolved name directly with Premier League
      const resolvedName = resolveTeamName(query.name, 'soccer');
      if (resolvedName !== query.name) {
        const finalResult = await this.apiProvider.getSoccerTeams({
          search: resolvedName,
          season,
          league: LEAGUE_IDS.PREMIER_LEAGUE,
        });
        
        if (finalResult.success && finalResult.data && finalResult.data.length > 0) {
          console.log(`[Soccer] Found via resolver: "${query.name}" → "${finalResult.data[0].team.name}"`);
          return this.success(this.transformTeam(finalResult.data[0]));
        }
      }
    }
    
    console.error(`[Soccer] Could not find team: "${query.name}"`);
    return this.error('TEAM_NOT_FOUND', `Could not find soccer team: ${query.name || query.id}`);
  }
  
  /**
   * Get soccer matches
   */
  async getMatches(query: MatchQuery): Promise<DataLayerResponse<NormalizedMatch[]>> {
    const season = this.getCurrentSeason();
    const leagueId = this.resolveLeagueId(query.league);
    
    const params: Record<string, string | number> = {
      season,
    };
    
    if (leagueId) {
      params.league = leagueId;
    }
    
    if (query.team) {
      const teamResult = await this.findTeam({ name: query.team, sport: 'soccer', league: query.league });
      if (teamResult.success && teamResult.data) {
        params.team = parseInt(teamResult.data.externalId);
      }
    }
    
    if (query.date) {
      params.date = query.date.toISOString().split('T')[0];
    }
    
    if (query.dateRange) {
      params.from = query.dateRange.from.toISOString().split('T')[0];
      params.to = query.dateRange.to.toISOString().split('T')[0];
    }
    
    const result = await this.apiProvider.getSoccerFixtures(params);
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch soccer matches');
    }
    
    const matches = result.data
      .slice(0, query.limit || 20)
      .map(fixture => this.transformMatch(fixture));
    
    return this.success(matches);
  }
  
  /**
   * Get team statistics
   */
  async getTeamStats(query: StatsQuery): Promise<DataLayerResponse<NormalizedTeamStats>> {
    const season = query.season ? parseInt(query.season) : this.getCurrentSeason();
    const leagueId = this.resolveLeagueId(query.league) || LEAGUE_IDS.PREMIER_LEAGUE;
    
    const result = await this.apiProvider.getSoccerTeamStats({
      team: parseInt(query.teamId),
      league: leagueId,
      season,
    });
    
    if (!result.success || !result.data) {
      return this.error('STATS_NOT_FOUND', result.error || 'Failed to fetch stats');
    }
    
    return this.success(this.transformStats(result.data, query.teamId, String(season)));
  }
  
  /**
   * Get recent games for a team
   */
  async getRecentGames(teamId: string, limit: number = 5): Promise<DataLayerResponse<NormalizedRecentGames>> {
    const result = await this.apiProvider.getSoccerFixtures({
      team: parseInt(teamId),
      last: limit,
    });
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch games');
    }
    
    const matches = result.data.map(f => this.transformMatch(f));
    
    // Calculate summary
    let wins = 0, losses = 0, draws = 0, goalsFor = 0, goalsAgainst = 0;
    
    for (const fixture of result.data) {
      const isHome = fixture.teams.home.id === parseInt(teamId);
      const teamGoals = isHome ? fixture.goals.home : fixture.goals.away;
      const oppGoals = isHome ? fixture.goals.away : fixture.goals.home;
      
      if (teamGoals !== null && oppGoals !== null) {
        goalsFor += teamGoals;
        goalsAgainst += oppGoals;
        
        if (teamGoals > oppGoals) wins++;
        else if (teamGoals < oppGoals) losses++;
        else draws++;
      }
    }
    
    return this.success({
      teamId,
      sport: 'soccer',
      games: matches,
      summary: {
        wins,
        losses,
        draws,
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
    const team1Result = await this.findTeam({ name: query.team1, sport: 'soccer' });
    const team2Result = await this.findTeam({ name: query.team2, sport: 'soccer' });
    
    if (!team1Result.success || !team1Result.data) {
      return this.error('TEAM_NOT_FOUND', `Could not find team: ${query.team1}`);
    }
    if (!team2Result.success || !team2Result.data) {
      return this.error('TEAM_NOT_FOUND', `Could not find team: ${query.team2}`);
    }
    
    const team1Id = team1Result.data.externalId;
    const team2Id = team2Result.data.externalId;
    const h2hString = `${team1Id}-${team2Id}`;
    
    const result = await this.apiProvider.getSoccerH2H({
      h2h: h2hString,
      last: query.limit || 10,
    });
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch H2H');
    }
    
    const matches = result.data.map(f => this.transformMatch(f));
    
    // Calculate summary
    let team1Wins = 0, team2Wins = 0, draws = 0, team1Goals = 0, team2Goals = 0;
    
    for (const fixture of result.data) {
      const homeIsTeam1 = fixture.teams.home.id === parseInt(team1Id);
      const homeGoals = fixture.goals.home || 0;
      const awayGoals = fixture.goals.away || 0;
      
      if (homeIsTeam1) {
        team1Goals += homeGoals;
        team2Goals += awayGoals;
        if (homeGoals > awayGoals) team1Wins++;
        else if (homeGoals < awayGoals) team2Wins++;
        else draws++;
      } else {
        team2Goals += homeGoals;
        team1Goals += awayGoals;
        if (homeGoals > awayGoals) team2Wins++;
        else if (homeGoals < awayGoals) team1Wins++;
        else draws++;
      }
    }
    
    return this.success({
      team1Id,
      team2Id,
      sport: 'soccer',
      summary: {
        totalGames: result.data.length,
        team1Wins,
        team2Wins,
        draws,
        team1Goals,
        team2Goals,
      },
      matches,
      provider: 'api-sports',
      fetchedAt: new Date(),
    });
  }
  
  /**
   * Get injuries for a team
   */
  async getInjuries(teamId: string): Promise<DataLayerResponse<NormalizedInjury[]>> {
    const season = this.getCurrentSeason();
    
    const result = await this.apiProvider.getSoccerInjuries({
      team: parseInt(teamId),
      season,
    });
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch injuries');
    }
    
    const injuries = result.data.map(i => this.transformInjury(i));
    
    return this.success(injuries);
  }
  
  // ============================================================================
  // Transform Methods
  // ============================================================================
  
  private transformTeam(raw: SoccerTeamResponse): NormalizedTeam {
    return {
      id: `soccer-${raw.team.id}`,
      externalId: String(raw.team.id),
      name: raw.team.name,
      shortName: raw.team.code || raw.team.name.substring(0, 3).toUpperCase(),
      logo: raw.team.logo,
      venue: raw.venue ? {
        name: raw.venue.name,
        city: raw.venue.city,
        capacity: raw.venue.capacity,
      } : undefined,
      country: raw.team.country,
      founded: raw.team.founded,
      sport: 'soccer',
    };
  }
  
  private transformMatch(raw: SoccerFixtureResponse): NormalizedMatch {
    return {
      id: `soccer-${raw.fixture.id}`,
      externalId: String(raw.fixture.id),
      sport: 'soccer',
      league: raw.league.name,
      leagueId: String(raw.league.id),
      season: String(raw.league.season),
      round: raw.league.round,
      
      homeTeam: {
        id: `soccer-${raw.teams.home.id}`,
        externalId: String(raw.teams.home.id),
        name: raw.teams.home.name,
        shortName: raw.teams.home.name.substring(0, 3).toUpperCase(),
        logo: raw.teams.home.logo,
        sport: 'soccer',
      },
      awayTeam: {
        id: `soccer-${raw.teams.away.id}`,
        externalId: String(raw.teams.away.id),
        name: raw.teams.away.name,
        shortName: raw.teams.away.name.substring(0, 3).toUpperCase(),
        logo: raw.teams.away.logo,
        sport: 'soccer',
      },
      
      status: this.mapStatus(raw.fixture.status.short),
      date: new Date(raw.fixture.timestamp * 1000),
      venue: raw.fixture.venue?.name,
      
      score: {
        home: raw.goals.home || 0,
        away: raw.goals.away || 0,
        halftime: raw.score.halftime.home !== null ? {
          home: raw.score.halftime.home,
          away: raw.score.halftime.away || 0,
        } : undefined,
      },
      
      provider: 'api-sports',
      fetchedAt: new Date(),
    };
  }
  
  private transformStats(raw: SoccerTeamStatsResponse, teamId: string, season: string): NormalizedTeamStats {
    return {
      teamId,
      season,
      league: raw.league.name,
      sport: 'soccer',
      
      record: {
        wins: raw.fixtures.wins.total,
        losses: raw.fixtures.loses.total,
        draws: raw.fixtures.draws.total,
        winPercentage: raw.fixtures.played.total > 0 
          ? raw.fixtures.wins.total / raw.fixtures.played.total 
          : 0,
      },
      
      scoring: {
        totalFor: raw.goals.for.total.total,
        totalAgainst: raw.goals.against.total.total,
        averageFor: parseFloat(raw.goals.for.average.total),
        averageAgainst: parseFloat(raw.goals.against.average.total),
        homeFor: raw.goals.for.total.home,
        homeAgainst: raw.goals.against.total.home,
        awayFor: raw.goals.for.total.away,
        awayAgainst: raw.goals.against.total.away,
      },
      
      form: raw.form ? {
        last5: raw.form.slice(0, 5),
        last10: raw.form.slice(0, 10),
        streak: this.parseStreak(raw.form),
      } : undefined,
      
      extended: {
        cleanSheets: raw.clean_sheet.total,
        failedToScore: raw.failed_to_score.total,
        biggestWinHome: raw.biggest.wins.home,
        biggestWinAway: raw.biggest.wins.away,
        biggestLossHome: raw.biggest.loses.home,
        biggestLossAway: raw.biggest.loses.away,
        winStreak: raw.biggest.streak.wins,
        lossStreak: raw.biggest.streak.loses,
        drawStreak: raw.biggest.streak.draws,
      },
      
      provider: 'api-sports',
      fetchedAt: new Date(),
    };
  }
  
  private transformInjury(raw: SoccerInjuryResponse): NormalizedInjury {
    return {
      playerId: String(raw.player.id),
      playerName: raw.player.name,
      teamId: String(raw.team.id),
      teamName: raw.team.name,
      sport: 'soccer',
      type: raw.player.type,
      status: this.mapInjuryStatus(raw.player.type),
      description: raw.player.reason,
      provider: 'api-sports',
      fetchedAt: new Date(),
    };
  }
  
  private parseStreak(form: string): { type: 'win' | 'loss' | 'draw'; count: number } | undefined {
    if (!form || form.length === 0) return undefined;
    
    const firstChar = form[0];
    let count = 0;
    
    for (const char of form) {
      if (char === firstChar) count++;
      else break;
    }
    
    const typeMap: Record<string, 'win' | 'loss' | 'draw'> = {
      'W': 'win',
      'L': 'loss',
      'D': 'draw',
    };
    
    return {
      type: typeMap[firstChar] || 'draw',
      count,
    };
  }
  
  private mapInjuryStatus(type: string): 'out' | 'doubtful' | 'questionable' | 'probable' | 'day-to-day' {
    const lower = type.toLowerCase();
    if (lower.includes('missing') || lower.includes('out')) return 'out';
    if (lower.includes('doubtful')) return 'doubtful';
    if (lower.includes('questionable')) return 'questionable';
    return 'day-to-day';
  }
  
  private mapStatus(status: string): MatchStatus {
    const statusMap: Record<string, MatchStatus> = {
      'TBD': 'scheduled',
      'NS': 'scheduled',
      '1H': 'live',
      'HT': 'halftime',
      '2H': 'live',
      'ET': 'live',
      'BT': 'halftime',
      'P': 'live',
      'SUSP': 'suspended',
      'INT': 'suspended',
      'FT': 'finished',
      'AET': 'finished',
      'PEN': 'finished',
      'PST': 'postponed',
      'CANC': 'cancelled',
      'ABD': 'cancelled',
      'AWD': 'finished',
      'WO': 'finished',
      'LIVE': 'live',
    };
    return statusMap[status] || 'unknown';
  }
}

// Export singleton
let instance: SoccerAdapter | null = null;

export function getSoccerAdapter(): SoccerAdapter {
  if (!instance) {
    instance = new SoccerAdapter();
  }
  return instance;
}
