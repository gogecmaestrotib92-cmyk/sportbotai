/**
 * MMA Adapter
 * 
 * Transforms API-Sports MMA data into normalized format.
 * Handles UFC and other MMA promotions.
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
  getMMAFighters,
  getMMAFighterRecord,
  getMMAFights,
  getMMAFightResults,
  searchMMAFighter,
  calculateFighterStats,
  MMAFighter,
  MMAFighterRecord,
  MMAFight,
} from '@/lib/apiSports/mmaClient';

/**
 * Map MMA fight status to normalized status
 */
function mapFightStatus(status: string): MatchStatus {
  const statusMap: Record<string, MatchStatus> = {
    'NS': 'scheduled',
    'IN': 'live',
    'PF': 'live',
    'LIVE': 'live',
    'EOR': 'live',
    'FT': 'finished',
    'WO': 'live',
    'CANC': 'cancelled',
    'PST': 'postponed',
  };
  return statusMap[status] || 'unknown';
}

/**
 * Convert fighter to normalized team format
 * (In MMA, "teams" are individual fighters)
 */
function fighterToNormalizedTeam(fighter: MMAFighter): NormalizedTeam {
  return {
    id: String(fighter.id),
    externalId: String(fighter.id),
    name: fighter.name,
    shortName: fighter.nickname || fighter.name.split(' ').pop() || fighter.name,
    logo: fighter.image || undefined,
    sport: 'mma',
    league: fighter.category || 'UFC',
    // MMA fighters might be associated with a gym/team
    venue: fighter.team?.name ? {
      name: fighter.team.name,
      city: 'Unknown',
    } : undefined,
  };
}

/**
 * Convert fight to normalized match format
 */
function fightToNormalizedMatch(fight: MMAFight): NormalizedMatch {
  return {
    id: String(fight.id),
    externalId: String(fight.id),
    sport: 'mma',
    league: 'UFC',
    leagueId: 'mma_ufc',
    season: String(new Date(fight.date).getFullYear()),
    homeTeam: fighterToNormalizedTeam(fight.fighters.first),
    awayTeam: fighterToNormalizedTeam(fight.fighters.second),
    status: mapFightStatus(fight.status.short),
    date: new Date(fight.timestamp * 1000),
    venue: fight.category,
    score: fight.results ? {
      home: fight.results.first || 0,
      away: fight.results.second || 0,
    } : undefined,
    provider: 'api-sports',
    fetchedAt: new Date(),
  };
}

export class MMAAdapter extends BaseSportAdapter {
  readonly sport: Sport = 'mma';
  readonly provider: DataProvider = 'api-sports';
  
  constructor(config: AdapterConfig = {}) {
    super({
      ...config,
      apiKey: config.apiKey || process.env.API_FOOTBALL_KEY,
    });
  }
  
  isAvailable(): boolean {
    return !!process.env.API_FOOTBALL_KEY;
  }
  
  /**
   * Find a fighter by name
   */
  async findTeam(query: TeamQuery): Promise<DataLayerResponse<NormalizedTeam>> {
    try {
      if (!query.name) {
        return {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: 'Fighter name is required',
          },
          metadata: {
            provider: this.provider,
            cached: false,
            fetchedAt: new Date(),
          },
        };
      }
      
      const fighter = await searchMMAFighter(query.name);
      
      if (!fighter) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Fighter "${query.name}" not found`,
          },
          metadata: {
            provider: this.provider,
            cached: false,
            fetchedAt: new Date(),
          },
        };
      }
      
      return {
        success: true,
        data: fighterToNormalizedTeam(fighter),
        metadata: {
          provider: this.provider,
          cached: false,
          fetchedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          provider: this.provider,
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
  }
  
  /**
   * Get fights for a date or fighter
   */
  async getMatches(query: MatchQuery): Promise<DataLayerResponse<NormalizedMatch[]>> {
    try {
      const params: { date?: string; fighter?: number; season?: number } = {};
      
      if (query.date) {
        params.date = query.date.toISOString().split('T')[0];
      }
      
      // In MMA, "team" is actually a fighter - try to find by name
      if (query.team) {
        const fighter = await searchMMAFighter(query.team);
        if (fighter) {
          params.fighter = fighter.id;
        }
      }
      
      if (!params.date && !params.fighter) {
        // Default to current season
        params.season = new Date().getFullYear();
      }
      
      const fights = await getMMAFights(params);
      
      if (!fights) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: 'Failed to fetch fights',
          },
          metadata: {
            provider: this.provider,
            cached: false,
            fetchedAt: new Date(),
          },
        };
      }
      
      return {
        success: true,
        data: fights.map(fightToNormalizedMatch),
        metadata: {
          provider: this.provider,
          cached: false,
          fetchedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          provider: this.provider,
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
  }
  
  /**
   * Get fighter statistics (career record)
   */
  async getTeamStats(query: StatsQuery): Promise<DataLayerResponse<NormalizedTeamStats>> {
    try {
      const fighterId = parseInt(query.teamId, 10);
      const record = await getMMAFighterRecord(fighterId);
      
      if (!record) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Fighter record not found',
          },
          metadata: {
            provider: this.provider,
            cached: false,
            fetchedAt: new Date(),
          },
        };
      }
      
      const stats = calculateFighterStats(record);
      const totalFights = record.record.total.win + record.record.total.loss + 
                          record.record.total.draw + record.record.total.nc;
      
      return {
        success: true,
        data: {
          teamId: query.teamId,
          season: query.season || String(new Date().getFullYear()),
          league: 'UFC/MMA',
          sport: 'mma',
          record: {
            wins: record.record.total.win,
            losses: record.record.total.loss,
            draws: record.record.total.draw,
            winPercentage: stats?.winRate || 0,
          },
          scoring: {
            totalFor: record.record.ko.win + record.record.sub.win, // Finishes
            totalAgainst: record.record.ko.loss + record.record.sub.loss,
            averageFor: stats?.finishRate || 0, // Finish rate as "scoring"
            averageAgainst: 0,
          },
          form: {
            last5: '', // Would need fight history to calculate
          },
          extended: {
            koWins: record.record.ko.win,
            koLosses: record.record.ko.loss,
            subWins: record.record.sub.win,
            subLosses: record.record.sub.loss,
            decWins: record.record.dec.win,
            decLosses: record.record.dec.loss,
            noContests: record.record.total.nc,
            totalFights,
            finishRate: stats?.finishRate || 0,
            koRate: stats?.koRate || 0,
            subRate: stats?.subRate || 0,
          },
          provider: this.provider,
          fetchedAt: new Date(),
        },
        metadata: {
          provider: this.provider,
          cached: false,
          fetchedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          provider: this.provider,
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
  }
  
  /**
   * Get recent fights for a fighter
   */
  async getRecentGames(teamId: string, limit: number = 5): Promise<DataLayerResponse<NormalizedRecentGames>> {
    try {
      const fighterId = parseInt(teamId, 10);
      const fights = await getMMAFights({ fighter: fighterId });
      
      if (!fights) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: 'Failed to fetch fighter history',
          },
          metadata: {
            provider: this.provider,
            cached: false,
            fetchedAt: new Date(),
          },
        };
      }
      
      // Filter to finished fights only and limit
      const finishedFights = fights
        .filter(f => f.status.short === 'FT')
        .slice(0, limit);
      
      // Calculate summary
      let wins = 0, losses = 0, draws = 0;
      
      for (const fight of finishedFights) {
        if (fight.results) {
          const firstResult = fight.results.first ?? 0;
          const secondResult = fight.results.second ?? 0;
          
          if (firstResult > secondResult) {
            if (String(fight.fighters.first.id) === teamId) wins++;
            else losses++;
          } else if (secondResult > firstResult) {
            if (String(fight.fighters.second.id) === teamId) wins++;
            else losses++;
          } else {
            draws++;
          }
        }
      }
      
      return {
        success: true,
        data: {
          teamId,
          sport: 'mma',
          games: finishedFights.map(fightToNormalizedMatch),
          summary: {
            wins,
            losses,
            draws,
            goalsFor: wins, // Wins as "goals for"
            goalsAgainst: losses,
          },
          provider: this.provider,
          fetchedAt: new Date(),
        },
        metadata: {
          provider: this.provider,
          cached: false,
          fetchedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          provider: this.provider,
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
  }
  
  /**
   * Get head-to-head history between two fighters
   */
  async getH2H(query: H2HQuery): Promise<DataLayerResponse<NormalizedH2H>> {
    try {
      // Try to find fighter by name first
      const fighter1 = await searchMMAFighter(query.team1);
      if (!fighter1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Fighter "${query.team1}" not found`,
          },
          metadata: {
            provider: this.provider,
            cached: false,
            fetchedAt: new Date(),
          },
        };
      }
      
      const fighter2 = await searchMMAFighter(query.team2);
      if (!fighter2) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Fighter "${query.team2}" not found`,
          },
          metadata: {
            provider: this.provider,
            cached: false,
            fetchedAt: new Date(),
          },
        };
      }
      
      const fighter1Id = fighter1.id;
      const fighter2Id = fighter2.id;
      
      // Get fights for first fighter
      const fights1 = await getMMAFights({ fighter: fighter1Id });
      
      if (!fights1) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: 'Failed to fetch H2H data',
          },
          metadata: {
            provider: this.provider,
            cached: false,
            fetchedAt: new Date(),
          },
        };
      }
      
      // Filter to fights against the second fighter
      const h2hFights = fights1.filter(f => 
        f.fighters.first.id === fighter2Id ||
        f.fighters.second.id === fighter2Id
      );
      
      let team1Wins = 0, team2Wins = 0, draws = 0;
      
      for (const fight of h2hFights) {
        if (fight.status.short !== 'FT' || !fight.results) continue;
        
        const fighter1IsFirst = fight.fighters.first.id === fighter1Id;
        const firstResult = fight.results.first ?? 0;
        const secondResult = fight.results.second ?? 0;
        const firstWon = firstResult > secondResult;
        const secondWon = secondResult > firstResult;
        
        if (fighter1IsFirst) {
          if (firstWon) team1Wins++;
          else if (secondWon) team2Wins++;
          else draws++;
        } else {
          if (firstWon) team2Wins++;
          else if (secondWon) team1Wins++;
          else draws++;
        }
      }
      
      return {
        success: true,
        data: {
          team1Id: String(fighter1Id),
          team2Id: String(fighter2Id),
          sport: 'mma',
          summary: {
            totalGames: h2hFights.length,
            team1Wins,
            team2Wins,
            draws,
            team1Goals: team1Wins, // Wins as "goals"
            team2Goals: team2Wins,
          },
          matches: h2hFights.filter(f => f.status.short === 'FT').map(fightToNormalizedMatch),
          provider: this.provider,
          fetchedAt: new Date(),
        },
        metadata: {
          provider: this.provider,
          cached: false,
          fetchedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        metadata: {
          provider: this.provider,
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
  }
  
  /**
   * MMA doesn't have traditional injuries - return empty
   */
  async getInjuries(): Promise<DataLayerResponse<NormalizedInjury[]>> {
    return {
      success: true,
      data: [],
      metadata: {
        provider: this.provider,
        cached: false,
        fetchedAt: new Date(),
      },
    };
  }
}

/**
 * Get MMA adapter instance
 */
export function getMMAAdapter(): MMAAdapter {
  return new MMAAdapter();
}
