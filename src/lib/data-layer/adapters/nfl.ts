/**
 * NFL Adapter
 * 
 * Transforms API-Sports American Football data into normalized format.
 * Handles NFL and NCAA Football leagues.
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
  NFLTeamResponse,
  NFLGameResponse,
  NFLStandingsResponse,
  NFLPlayerResponse,
} from '../providers/api-sports';
import { resolveTeamName, getSearchVariations } from '../team-resolver';

// Team name mappings for NFL - DEPRECATED: Now using team-resolver.ts
const NFL_TEAM_MAPPINGS: Record<string, string> = {
  // Short names
  'chiefs': 'Chiefs',
  'eagles': 'Eagles',
  '49ers': '49ers',
  'niners': '49ers',
  'bills': 'Bills',
  'cowboys': 'Cowboys',
  'dolphins': 'Dolphins',
  'lions': 'Lions',
  'ravens': 'Ravens',
  'bengals': 'Bengals',
  'vikings': 'Vikings',
  'packers': 'Packers',
  'chargers': 'Chargers',
  'seahawks': 'Seahawks',
  'jaguars': 'Jaguars',
  'jags': 'Jaguars',
  'broncos': 'Broncos',
  'browns': 'Browns',
  'texans': 'Texans',
  'steelers': 'Steelers',
  'jets': 'Jets',
  'giants': 'Giants',
  'raiders': 'Raiders',
  'buccaneers': 'Buccaneers',
  'bucs': 'Buccaneers',
  'commanders': 'Commanders',
  'saints': 'Saints',
  'falcons': 'Falcons',
  'panthers': 'Panthers',
  'cardinals': 'Cardinals',
  'rams': 'Rams',
  'colts': 'Colts',
  'titans': 'Titans',
  'patriots': 'Patriots',
  'pats': 'Patriots',
  'bears': 'Bears',
  
  // City mappings
  'kansas city': 'Chiefs',
  'kc chiefs': 'Chiefs',
  'philadelphia': 'Eagles',
  'philly': 'Eagles',
  'san francisco': '49ers',
  'sf 49ers': '49ers',
  'buffalo': 'Bills',
  'dallas': 'Cowboys',
  'miami': 'Dolphins',
  'detroit': 'Lions',
  'baltimore': 'Ravens',
  'cincinnati': 'Bengals',
  'minnesota': 'Vikings',
  'green bay': 'Packers',
  'los angeles chargers': 'Chargers',
  'la chargers': 'Chargers',
  'seattle': 'Seahawks',
  'jacksonville': 'Jaguars',
  'denver': 'Broncos',
  'cleveland': 'Browns',
  'houston': 'Texans',
  'pittsburgh': 'Steelers',
  'new york jets': 'Jets',
  'ny jets': 'Jets',
  'new york giants': 'Giants',
  'ny giants': 'Giants',
  'las vegas': 'Raiders',
  'lv raiders': 'Raiders',
  'tampa bay': 'Buccaneers',
  'tampa': 'Buccaneers',
  'washington': 'Commanders',
  'new orleans': 'Saints',
  'atlanta': 'Falcons',
  'carolina': 'Panthers',
  'arizona': 'Cardinals',
  'los angeles rams': 'Rams',
  'la rams': 'Rams',
  'indianapolis': 'Colts',
  'indy': 'Colts',
  'tennessee': 'Titans',
  'new england': 'Patriots',
  'chicago': 'Bears',
};

export class NFLAdapter extends BaseSportAdapter {
  readonly sport: Sport = 'american_football';
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
   * Get current NFL season year
   * NFL season naming: "2024 season" runs from Sept 2024 to Feb 2025
   * So in Dec 2024 - Feb 2025, we're still in the "2024" season
   */
  private getCurrentSeason(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // NFL season runs Sept-Feb, but is named after the starting year
    // Sept-Dec = current year's season
    // Jan-Aug = previous year's season (playoffs end Feb, preseason starts Aug)
    if (month >= 9) {
      return year; // Sept-Dec: current year's season
    } else {
      return year - 1; // Jan-Aug: previous year's season
    }
  }
  
  /**
   * Normalize team name for search - Uses centralized team resolver
   */
  private normalizeTeamName(name: string): string {
    return resolveTeamName(name, 'american_football');
  }
  
  /**
   * Find an NFL team with improved fuzzy matching
   */
  async findTeam(query: TeamQuery): Promise<DataLayerResponse<NormalizedTeam>> {
    console.log(`[NFL] findTeam called with:`, { name: query.name, id: query.id, sport: query.sport });
    
    if (!query.name && !query.id) {
      return this.error('INVALID_QUERY', 'Team name or ID required');
    }
    
    let season = this.getCurrentSeason();
    const leagueId = LEAGUE_IDS.NFL;
    console.log(`[NFL] Using season=${season}, leagueId=${leagueId}`);
    
    // Try by ID first
    if (query.id) {
      let result = await this.apiProvider.getNFLTeams({
        id: parseInt(query.id),
        league: leagueId,
        season,
      });
      
      // Fallback to previous season if no results
      if ((!result.success || !result.data || result.data.length === 0) && season > 2020) {
        console.log(`[NFL] No team by ID in ${season}, trying ${season - 1}`);
        result = await this.apiProvider.getNFLTeams({
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
      const searchVariations = getSearchVariations(query.name, 'american_football');
      console.log(`[NFL] Searching for "${query.name}" with variations:`, searchVariations);
      
      // Get all teams once for efficient matching
      let allTeams = await this.apiProvider.getNFLTeams({
        league: leagueId,
        season,
      });
      
      // Fallback to previous season if no teams found
      if ((!allTeams.success || !allTeams.data || allTeams.data.length === 0) && season > 2020) {
        console.log(`[NFL] No teams in ${season}, trying ${season - 1}`);
        season = season - 1;
        allTeams = await this.apiProvider.getNFLTeams({
          league: leagueId,
          season,
        });
      }
      
      console.log(`[NFL] All teams fetch: success=${allTeams.success}, count=${allTeams.data?.length || 0}`);
      
      if (!allTeams.success || !allTeams.data || allTeams.data.length === 0) {
        console.error(`[NFL] Failed to fetch teams list: ${allTeams.error}`);
        return this.error('FETCH_ERROR', 'Could not fetch NFL teams');
      }
      
      // Try each variation
      for (const searchName of searchVariations) {
        const lowerSearch = searchName.toLowerCase();
        
        // Exact match
        const exactMatch = allTeams.data.find(t => 
          t.name.toLowerCase() === lowerSearch
        );
        if (exactMatch) {
          console.log(`[NFL] Exact match found: "${query.name}" → "${exactMatch.name}"`);
          return this.success(this.transformTeam(exactMatch));
        }
        
        // Partial match (contains)
        const partialMatch = allTeams.data.find(t => 
          t.name.toLowerCase().includes(lowerSearch) || lowerSearch.includes(t.name.toLowerCase())
        );
        if (partialMatch) {
          console.log(`[NFL] Partial match found: "${query.name}" → "${partialMatch.name}"`);
          return this.success(this.transformTeam(partialMatch));
        }
      }
      
      // Final fallback: fuzzy match on best similarity
      const resolvedName = resolveTeamName(query.name, 'american_football');
      const lowerResolved = resolvedName.toLowerCase();
      
      let bestMatch: NFLTeamResponse | null = null;
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
        console.log(`[NFL] Fuzzy match found: "${query.name}" → "${bestMatch.name}" (score: ${bestScore})`);
        return this.success(this.transformTeam(bestMatch));
      }
    }
    
    console.error(`[NFL] Could not find team: "${query.name}"`);
    return this.error('TEAM_NOT_FOUND', `Could not find NFL team: ${query.name || query.id}`);
  }
  
  /**
   * Get NFL matches
   */
  async getMatches(query: MatchQuery): Promise<DataLayerResponse<NormalizedMatch[]>> {
    const season = this.getCurrentSeason();
    const params: Record<string, string | number> = {
      league: LEAGUE_IDS.NFL,
      season,
    };
    
    if (query.team) {
      const teamResult = await this.findTeam({ name: query.team, sport: 'american_football' });
      if (teamResult.success && teamResult.data) {
        params.team = parseInt(teamResult.data.externalId);
      }
    }
    
    if (query.date) {
      params.date = query.date.toISOString().split('T')[0];
    }
    
    const result = await this.apiProvider.getNFLGames(params);
    
    if (!result.success || !result.data) {
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch NFL games');
    }
    
    const matches = result.data
      .slice(0, query.limit || 20)
      .map(game => this.transformMatch(game));
    
    return this.success(matches);
  }
  
  /**
   * Get team statistics from standings (NFL API doesn't have /teams/statistics)
   */
  async getTeamStats(query: StatsQuery): Promise<DataLayerResponse<NormalizedTeamStats>> {
    let season = query.season ? parseInt(query.season) : this.getCurrentSeason();
    const leagueId = LEAGUE_IDS.NFL;
    
    let standingsResult = await this.apiProvider.getNFLStandings({
      league: leagueId,
      season,
    });
    
    // Fallback to previous season if no standings found
    if ((!standingsResult.success || !standingsResult.data || standingsResult.data.length === 0) && season > 2020) {
      console.log(`[NFL] No standings in ${season}, trying ${season - 1}`);
      season = season - 1;
      standingsResult = await this.apiProvider.getNFLStandings({
        league: leagueId,
        season,
      });
    }
    
    if (standingsResult.success && standingsResult.data) {
      const allStandings = standingsResult.data.flat();
      const teamStanding = allStandings.find(s => 
        s.team.id === parseInt(query.teamId)
      );
      
      if (teamStanding) {
        return this.success(this.transformStandingsToStats(teamStanding, String(season)));
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
    console.log(`[NFL] getRecentGames: teamId=${teamId}, season=${season}, limit=${limit}`);
    
    // Try current season first
    let result = await this.apiProvider.getNFLGames({
      team: parseInt(teamId),
      league: LEAGUE_IDS.NFL,
      season,
    });
    
    console.log(`[NFL] Games API response: success=${result.success}, count=${result.data?.length || 0}`);
    
    if (!result.success || !result.data) {
      console.error(`[NFL] Failed to fetch games: ${result.error}`);
      return this.error('FETCH_ERROR', result.error || 'Failed to fetch games');
    }
    
    // Filter to finished regular season games
    let finishedGames = result.data
      .filter(g => (g.game.status.short === 'FT' || g.game.status.short === 'AOT') && g.game.stage === 'Regular Season')
      .sort((a, b) => b.game.date.timestamp - a.game.date.timestamp);
    
    console.log(`[NFL] Finished games after filter: ${finishedGames.length}`);
    
    // If no finished regular season games in current season, try previous season
    if (finishedGames.length === 0 && season > 2020) {
      console.log(`[NFL] No finished games in ${season}, trying ${season - 1}`);
      season = season - 1;
      result = await this.apiProvider.getNFLGames({
        team: parseInt(teamId),
        league: LEAGUE_IDS.NFL,
        season,
      });
      
      if (result.success && result.data) {
        finishedGames = result.data
          .filter(g => (g.game.status.short === 'FT' || g.game.status.short === 'AOT') && g.game.stage === 'Regular Season')
          .sort((a, b) => b.game.date.timestamp - a.game.date.timestamp);
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
      sport: 'american_football',
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
    const team1Result = await this.findTeam({ name: query.team1, sport: 'american_football' });
    const team2Result = await this.findTeam({ name: query.team2, sport: 'american_football' });
    
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
    let result = await this.apiProvider.getNFLGames({
      h2h: h2hString,
      league: LEAGUE_IDS.NFL,
      season,
    });
    
    // Fallback to previous season if no H2H found
    if ((!result.success || !result.data || result.data.length === 0) && season > 2020) {
      console.log(`[NFL H2H] No games in ${season}, trying ${season - 1}`);
      season = season - 1;
      result = await this.apiProvider.getNFLGames({
        h2h: h2hString,
        league: LEAGUE_IDS.NFL,
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
      sport: 'american_football',
      summary: {
        totalGames: games.length,
        team1Wins,
        team2Wins,
        draws: 0, // NFL has no draws (overtime)
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
    const externalId = teamId.replace('nfl-', '');
    const season = this.getCurrentSeason();
    
    console.log(`[NFL] Fetching roster for team ${externalId}, season ${season}`);
    
    const result = await this.apiProvider.getNFLPlayers({
      team: parseInt(externalId, 10),
      season,
    });
    
    if (!result.success || !result.data) {
      return this.error('ROSTER_FETCH_FAILED', result.error || 'Failed to fetch team roster');
    }
    
    const players = result.data
      .map((raw: NFLPlayerResponse) => this.transformPlayer(raw))
      .slice(0, 20); // NFL has more positions, get top 20
    
    console.log(`[NFL] Found ${players.length} players for team ${externalId}`);
    
    return this.success(players);
  }
  
  /**
   * Transform raw player data to normalized format
   */
  private transformPlayer(raw: NFLPlayerResponse): NormalizedPlayer {
    return {
      id: `nfl-player-${raw.id}`,
      externalId: String(raw.id),
      name: raw.name,
      position: raw.position || raw.group || 'Unknown',
      number: raw.number ?? undefined,
      age: raw.age ?? undefined,
    };
  }
  
  // ============================================================================
  // Transform Methods
  // ============================================================================
  
  private transformTeam(raw: NFLTeamResponse): NormalizedTeam {
    return {
      id: `nfl-${raw.id}`,
      externalId: String(raw.id),
      name: raw.name,
      shortName: raw.code || raw.name.split(' ').pop() || raw.name,
      logo: raw.logo,
      venue: {
        name: raw.stadium,
        city: raw.city,
      },
      country: raw.country?.name || 'USA',
      founded: raw.established,
      sport: 'american_football',
      league: 'NFL',
    };
  }
  
  private transformMatch(raw: NFLGameResponse): NormalizedMatch {
    return {
      id: `nfl-${raw.game.id}`,
      externalId: String(raw.game.id),
      sport: 'american_football',
      league: raw.league.name,
      leagueId: String(raw.league.id),
      season: String(raw.league.season),
      round: raw.game.week,
      
      homeTeam: {
        id: `nfl-${raw.teams.home.id}`,
        externalId: String(raw.teams.home.id),
        name: raw.teams.home.name,
        shortName: raw.teams.home.name.split(' ').pop() || raw.teams.home.name,
        logo: raw.teams.home.logo,
        sport: 'american_football',
      },
      awayTeam: {
        id: `nfl-${raw.teams.away.id}`,
        externalId: String(raw.teams.away.id),
        name: raw.teams.away.name,
        shortName: raw.teams.away.name.split(' ').pop() || raw.teams.away.name,
        logo: raw.teams.away.logo,
        sport: 'american_football',
      },
      
      status: this.mapStatus(raw.game.status.short),
      date: new Date(raw.game.date.timestamp * 1000),
      venue: raw.game.venue?.name,
      
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
  
  private transformStandingsToStats(standing: NFLStandingsResponse, season: string): NormalizedTeamStats {
    const totalGames = standing.won + standing.lost + standing.ties;
    
    return {
      teamId: String(standing.team.id),
      season,
      league: 'NFL',
      sport: 'american_football',
      
      record: {
        wins: standing.won,
        losses: standing.lost,
        draws: standing.ties,
        winPercentage: totalGames > 0 ? standing.won / totalGames : 0,
      },
      
      scoring: {
        totalFor: standing.points.for,
        totalAgainst: standing.points.against,
        averageFor: totalGames > 0 ? standing.points.for / totalGames : 0,
        averageAgainst: totalGames > 0 ? standing.points.against / totalGames : 0,
      },
      
      form: standing.streak ? {
        last5: standing.streak,
      } : undefined,
      
      extended: {
        division: standing.division,
        homeRecord: standing.records?.home || '',
        roadRecord: standing.records?.road || '',
        conferenceRecord: standing.records?.conference || '',
        divisionRecord: standing.records?.division || '',
        pointDifference: standing.points.difference,
      },
      
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
      'AOT': 'finished', // After overtime
      'POST': 'postponed',
      'CANC': 'cancelled',
      'SUSP': 'suspended',
    };
    return statusMap[status] || 'unknown';
  }
}

// Export singleton
let instance: NFLAdapter | null = null;

export function getNFLAdapter(): NFLAdapter {
  if (!instance) {
    instance = new NFLAdapter();
  }
  return instance;
}
