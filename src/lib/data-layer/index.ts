/**
 * Unified Data Layer
 * 
 * This is the main entry point for all data access.
 * Agents and consumers interact with this layer only - never directly with APIs.
 * 
 * Benefits:
 * - Single interface for all sports
 * - Provider-agnostic (can swap API-Sports for another provider)
 * - Built-in caching support
 * - Consistent error handling
 * - Type-safe responses
 */

import {
  Sport,
  DataLayerResponse,
  NormalizedTeam,
  NormalizedMatch,
  NormalizedTeamStats,
  NormalizedH2H,
  NormalizedRecentGames,
  NormalizedInjury,
  NormalizedOdds,
  EnrichedMatchData,
  TeamQuery,
  MatchQuery,
  StatsQuery,
  H2HQuery,
} from './types';

import { theOddsClient } from '@/lib/theOdds';

import { ISportAdapter, AdapterRegistry } from './adapters/base';
import { getBasketballAdapter } from './adapters/basketball';
import { getHockeyAdapter } from './adapters/hockey';
import { getNFLAdapter } from './adapters/nfl';
import { getSoccerAdapter } from './adapters/soccer';

/**
 * Data Layer Configuration
 */
export interface DataLayerConfig {
  enableCaching?: boolean;
  cacheTTL?: number; // seconds
  logRequests?: boolean;
}

/**
 * Main Data Layer Class
 */
export class DataLayer {
  private registry: AdapterRegistry;
  private config: DataLayerConfig;
  private cache: Map<string, { data: unknown; expiry: Date }>;
  
  constructor(config: DataLayerConfig = {}) {
    this.config = {
      enableCaching: config.enableCaching ?? true,
      cacheTTL: config.cacheTTL ?? 300, // 5 minutes default
      logRequests: config.logRequests ?? false,
    };
    
    this.registry = new AdapterRegistry();
    this.cache = new Map();
    
    // Register all adapters
    this.registerAdapters();
  }
  
  /**
   * Register all sport adapters
   */
  private registerAdapters(): void {
    this.registry.register(getSoccerAdapter());
    this.registry.register(getBasketballAdapter());
    this.registry.register(getHockeyAdapter());
    this.registry.register(getNFLAdapter());
  }
  
  /**
   * Get adapter for a sport
   */
  private getAdapter(sport: Sport): ISportAdapter | undefined {
    return this.registry.get(sport);
  }
  
  /**
   * Log a request if enabled
   */
  private log(message: string, data?: unknown): void {
    if (this.config.logRequests) {
      console.log(`[DataLayer] ${message}`, data || '');
    }
  }
  
  /**
   * Generate cache key
   */
  private getCacheKey(method: string, params: unknown): string {
    return `${method}:${JSON.stringify(params)}`;
  }
  
  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): T | undefined {
    if (!this.config.enableCaching) return undefined;
    
    const cached = this.cache.get(key);
    if (cached && cached.expiry > new Date()) {
      this.log(`Cache hit: ${key}`);
      return cached.data as T;
    }
    
    return undefined;
  }
  
  /**
   * Set cache
   */
  private setCache(key: string, data: unknown): void {
    if (!this.config.enableCaching) return;
    
    const expiry = new Date(Date.now() + (this.config.cacheTTL! * 1000));
    this.cache.set(key, { data, expiry });
  }
  
  // ============================================================================
  // Public API Methods
  // ============================================================================
  
  /**
   * List available sports
   */
  getAvailableSports(): Sport[] {
    return this.registry.getAvailable();
  }
  
  /**
   * Check if a sport is available
   */
  isSportAvailable(sport: Sport): boolean {
    const adapter = this.getAdapter(sport);
    return adapter?.isAvailable() ?? false;
  }
  
  /**
   * Find a team across any sport
   */
  async findTeam(query: TeamQuery): Promise<DataLayerResponse<NormalizedTeam>> {
    const cacheKey = this.getCacheKey('findTeam', query);
    const cached = this.getFromCache<DataLayerResponse<NormalizedTeam>>(cacheKey);
    if (cached) return cached;
    
    this.log('findTeam', query);
    
    const adapter = this.getAdapter(query.sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${query.sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.findTeam(query);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get matches for a sport
   */
  async getMatches(query: MatchQuery): Promise<DataLayerResponse<NormalizedMatch[]>> {
    const cacheKey = this.getCacheKey('getMatches', query);
    const cached = this.getFromCache<DataLayerResponse<NormalizedMatch[]>>(cacheKey);
    if (cached) return cached;
    
    this.log('getMatches', query);
    
    const adapter = this.getAdapter(query.sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${query.sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.getMatches(query);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get team statistics
   */
  async getTeamStats(query: StatsQuery): Promise<DataLayerResponse<NormalizedTeamStats>> {
    const cacheKey = this.getCacheKey('getTeamStats', query);
    const cached = this.getFromCache<DataLayerResponse<NormalizedTeamStats>>(cacheKey);
    if (cached) return cached;
    
    this.log('getTeamStats', query);
    
    const adapter = this.getAdapter(query.sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${query.sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.getTeamStats(query);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get recent games for a team
   */
  async getRecentGames(
    sport: Sport,
    teamId: string,
    limit?: number
  ): Promise<DataLayerResponse<NormalizedRecentGames>> {
    const cacheKey = this.getCacheKey('getRecentGames', { sport, teamId, limit });
    const cached = this.getFromCache<DataLayerResponse<NormalizedRecentGames>>(cacheKey);
    if (cached) return cached;
    
    this.log('getRecentGames', { sport, teamId, limit });
    
    const adapter = this.getAdapter(sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.getRecentGames(teamId, limit);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get head-to-head history
   */
  async getH2H(query: H2HQuery): Promise<DataLayerResponse<NormalizedH2H>> {
    const cacheKey = this.getCacheKey('getH2H', query);
    const cached = this.getFromCache<DataLayerResponse<NormalizedH2H>>(cacheKey);
    if (cached) return cached;
    
    this.log('getH2H', query);
    
    const adapter = this.getAdapter(query.sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${query.sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.getH2H(query);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get injuries for a team (if supported by the sport)
   */
  async getInjuries(sport: Sport, teamId: string): Promise<DataLayerResponse<NormalizedInjury[]>> {
    const cacheKey = this.getCacheKey('getInjuries', { sport, teamId });
    const cached = this.getFromCache<DataLayerResponse<NormalizedInjury[]>>(cacheKey);
    if (cached) return cached;
    
    this.log('getInjuries', { sport, teamId });
    
    const adapter = this.getAdapter(sport);
    if (!adapter) {
      return {
        success: false,
        error: {
          code: 'SPORT_NOT_SUPPORTED',
          message: `Sport "${sport}" is not supported`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    if (!adapter.getInjuries) {
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: `Injuries data is not available for ${sport}`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    const result = await adapter.getInjuries(teamId);
    
    if (result.success) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Get upcoming events for a sport from The Odds API
   * This is a free endpoint (no quota usage)
   */
  async getUpcomingEvents(
    sportKey: string,
    options: {
      dateFormat?: string;
    } = {}
  ): Promise<DataLayerResponse<Array<{
    id: string;
    sport: string;
    sportKey: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
  }>>> {
    const cacheKey = this.getCacheKey('getUpcomingEvents', { sportKey });
    const cached = this.getFromCache<DataLayerResponse<Array<{
      id: string;
      sport: string;
      sportKey: string;
      homeTeam: string;
      awayTeam: string;
      commenceTime: string;
    }>>>(cacheKey);
    if (cached) return cached;
    
    this.log('getUpcomingEvents', { sportKey });
    
    // Check if API is configured
    if (!theOddsClient.isConfigured()) {
      return {
        success: false,
        error: {
          code: 'API_NOT_CONFIGURED',
          message: 'The Odds API key is not configured',
        },
        metadata: {
          provider: 'the-odds-api',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    try {
      const response = await theOddsClient.getEvents(sportKey);
      
      const events = response.data.map((event: { id: string; sport_title?: string; home_team: string; away_team: string; commence_time: string }) => ({
        id: event.id,
        sport: event.sport_title || sportKey,
        sportKey: sportKey,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        commenceTime: event.commence_time,
      }));
      
      const result: DataLayerResponse<typeof events> = {
        success: true,
        data: events,
        metadata: {
          provider: 'the-odds-api',
          cached: false,
          fetchedAt: new Date(),
          quotaUsed: 0, // Events endpoint is free
          quotaRemaining: response.requestsRemaining,
        },
      };
      
      this.setCache(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error('[DataLayer] Error fetching events:', error);
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch events',
        },
        metadata: {
          provider: 'the-odds-api',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
  }
  
  /**
   * Get odds for a match from The Odds API
   * Maps sport to The Odds API sport key format
   */
  async getOdds(
    sport: Sport,
    homeTeam: string,
    awayTeam: string,
    options: {
      regions?: string[];
      markets?: string[];
      sportKey?: string; // Optional: pass exact Odds API sport key (e.g., 'soccer_spain_la_liga')
    } = {}
  ): Promise<DataLayerResponse<NormalizedOdds[]>> {
    const opts = {
      regions: options.regions ?? ['eu', 'us'],
      markets: options.markets ?? ['h2h', 'spreads', 'totals'],
    };
    
    // Use provided sportKey or map from internal sport type
    const resolvedSportKey = options.sportKey || this.mapSportToOddsKey(sport);
    
    const cacheKey = this.getCacheKey('getOdds', { sport: resolvedSportKey, homeTeam, awayTeam, ...opts });
    const cached = this.getFromCache<DataLayerResponse<NormalizedOdds[]>>(cacheKey);
    if (cached) return cached;
    
    this.log('getOdds', { sport, sportKey: resolvedSportKey, homeTeam, awayTeam, options: opts });
    
    // Check if odds API is configured
    if (!theOddsClient.isConfigured()) {
      return {
        success: false,
        error: {
          code: 'API_NOT_CONFIGURED',
          message: 'The Odds API key is not configured',
        },
        metadata: {
          provider: 'the-odds-api',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    try {
      // Use resolved sport key for the API call
      const oddsResponse = await theOddsClient.getOddsForSport(resolvedSportKey, {
        regions: opts.regions,
        markets: opts.markets,
      });
      
      if (!oddsResponse.data || oddsResponse.data.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_ODDS_FOUND',
            message: `No odds available for ${sport}`,
          },
          metadata: {
            provider: 'the-odds-api',
            cached: false,
            fetchedAt: new Date(),
          },
        };
      }
      
      // Find the matching event
      const matchingEvent = oddsResponse.data.find((e: { home_team: string; away_team: string }) => 
        this.fuzzyMatchTeam(e.home_team, homeTeam) && this.fuzzyMatchTeam(e.away_team, awayTeam)
      );
      
      if (!matchingEvent || !matchingEvent.bookmakers || matchingEvent.bookmakers.length === 0) {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_FOUND',
            message: `Could not find odds for ${homeTeam} vs ${awayTeam}`,
          },
          metadata: {
            provider: 'the-odds-api',
            cached: false,
            fetchedAt: new Date(),
          },
        };
      }
      
      // Normalize the odds data
      const normalizedOdds: NormalizedOdds[] = matchingEvent.bookmakers.map((bookmaker: {
        key: string;
        title: string;
        last_update?: string;
        markets?: Array<{
          key: string;
          outcomes: Array<{ name: string; price: number; point?: number }>;
        }>;
      }) => {
        const h2hMarket = bookmaker.markets?.find((m: { key: string }) => m.key === 'h2h');
        const spreadsMarket = bookmaker.markets?.find((m: { key: string }) => m.key === 'spreads');
        const totalsMarket = bookmaker.markets?.find((m: { key: string }) => m.key === 'totals');
        
        const normalized: NormalizedOdds = {
          matchId: matchingEvent.id,
          sport,
          bookmaker: bookmaker.title || bookmaker.key,
          lastUpdate: bookmaker.last_update ? new Date(bookmaker.last_update) : new Date(),
          provider: 'the-odds-api',
          fetchedAt: new Date(),
        };
        
        // H2H (Moneyline)
        if (h2hMarket?.outcomes) {
          const homeOutcome = h2hMarket.outcomes.find((o: { name: string; price: number }) => 
            this.fuzzyMatchTeam(o.name, homeTeam)
          );
          const awayOutcome = h2hMarket.outcomes.find((o: { name: string; price: number }) => 
            this.fuzzyMatchTeam(o.name, awayTeam)
          );
          const drawOutcome = h2hMarket.outcomes.find((o: { name: string; price: number }) => 
            o.name.toLowerCase() === 'draw'
          );
          
          if (homeOutcome && awayOutcome) {
            normalized.moneyline = {
              home: homeOutcome.price,
              away: awayOutcome.price,
              draw: drawOutcome?.price,
            };
          }
        }
        
        // Spreads
        if (spreadsMarket?.outcomes) {
          const homeSpread = spreadsMarket.outcomes.find((o: { name: string }) => 
            this.fuzzyMatchTeam(o.name, homeTeam)
          );
          const awaySpread = spreadsMarket.outcomes.find((o: { name: string }) => 
            this.fuzzyMatchTeam(o.name, awayTeam)
          );
          
          if (homeSpread && awaySpread) {
            normalized.spread = {
              home: { line: homeSpread.point ?? 0, odds: homeSpread.price },
              away: { line: awaySpread.point ?? 0, odds: awaySpread.price },
            };
          }
        }
        
        // Totals
        if (totalsMarket?.outcomes) {
          const over = totalsMarket.outcomes.find((o: { name: string }) => 
            o.name.toLowerCase() === 'over'
          );
          const under = totalsMarket.outcomes.find((o: { name: string }) => 
            o.name.toLowerCase() === 'under'
          );
          
          if (over && under) {
            normalized.total = {
              over: { line: over.point ?? 0, odds: over.price },
              under: { line: under.point ?? 0, odds: under.price },
            };
          }
        }
        
        return normalized;
      });
      
      const result: DataLayerResponse<NormalizedOdds[]> = {
        success: true,
        data: normalizedOdds,
        metadata: {
          provider: 'the-odds-api',
          cached: false,
          fetchedAt: new Date(),
          quotaUsed: oddsResponse.requestsUsed,
          quotaRemaining: oddsResponse.requestsRemaining,
        },
      };
      
      this.setCache(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error('[DataLayer] Error fetching odds:', error);
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch odds',
        },
        metadata: {
          provider: 'the-odds-api',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
  }
  
  /**
   * Map internal sport type to The Odds API sport key
   */
  private mapSportToOddsKey(sport: Sport): string {
    const mapping: Record<Sport, string> = {
      soccer: 'soccer_epl', // Default to EPL, can be overridden
      basketball: 'basketball_nba',
      hockey: 'icehockey_nhl',
      american_football: 'americanfootball_nfl',
      baseball: 'baseball_mlb',
      mma: 'mma_mixed_martial_arts',
      tennis: 'tennis_atp_french_open', // Default, varies by tournament
    };
    return mapping[sport] || sport;
  }
  
  /**
   * Fuzzy match team names (handles partial matches)
   * Improved to handle teams that share common words (e.g., "Real Madrid" vs "Real Betis")
   */
  private fuzzyMatchTeam(oddsName: string, teamName: string): boolean {
    const n1 = oddsName.toLowerCase().trim();
    const n2 = teamName.toLowerCase().trim();
    
    // Exact match
    if (n1 === n2) return true;
    
    // One contains the other fully
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    // Split into words and check for significant word matches
    const words1 = n1.split(/\s+/).filter(w => w.length > 2);
    const words2 = n2.split(/\s+/).filter(w => w.length > 2);
    
    // Skip common prefixes like "Real", "FC", "CF", "AC", "AS", "SC"
    const commonPrefixes = ['real', 'fc', 'cf', 'ac', 'as', 'sc', 'cd', 'ud', 'rc', 'rcd', 'athletic', 'atletico'];
    const significantWords1 = words1.filter(w => !commonPrefixes.includes(w));
    const significantWords2 = words2.filter(w => !commonPrefixes.includes(w));
    
    // If we have significant words, match on those
    if (significantWords1.length > 0 && significantWords2.length > 0) {
      return significantWords1.some(w1 => 
        significantWords2.some(w2 => w1.includes(w2) || w2.includes(w1))
      );
    }
    
    // Fallback: check if any word matches (excluding very short words)
    return words1.some(w1 => 
      words2.some(w2 => (w1.length >= 4 && w2.length >= 4) && (w1.includes(w2) || w2.includes(w1)))
    );
  }
  
  /**
   * Get enriched match data for analysis
   * This is the main method agents should use for match analysis
   */
  async getEnrichedMatchData(
    sport: Sport,
    homeTeam: string,
    awayTeam: string,
    options: {
      includeStats?: boolean;
      includeRecentGames?: boolean;
      includeH2H?: boolean;
      includeInjuries?: boolean;
      recentGamesLimit?: number;
      h2hLimit?: number;
    } = {}
  ): Promise<DataLayerResponse<EnrichedMatchData>> {
    const opts = {
      includeStats: options.includeStats ?? true,
      includeRecentGames: options.includeRecentGames ?? true,
      includeH2H: options.includeH2H ?? true,
      includeInjuries: options.includeInjuries ?? true,
      recentGamesLimit: options.recentGamesLimit ?? 5,
      h2hLimit: options.h2hLimit ?? 5,
    };
    
    this.log('getEnrichedMatchData', { sport, homeTeam, awayTeam, options: opts });
    
    // Find both teams
    const [homeTeamResult, awayTeamResult] = await Promise.all([
      this.findTeam({ name: homeTeam, sport }),
      this.findTeam({ name: awayTeam, sport }),
    ]);
    
    // Log team lookup results
    console.log(`[DataLayer] Home team lookup: ${homeTeamResult.success ? homeTeamResult.data?.name : 'FAILED - ' + homeTeamResult.error?.message}`);
    console.log(`[DataLayer] Away team lookup: ${awayTeamResult.success ? awayTeamResult.data?.name : 'FAILED - ' + awayTeamResult.error?.message}`);
    
    // If BOTH teams fail, return error (can't do anything without teams)
    if (!homeTeamResult.success && !awayTeamResult.success) {
      return {
        success: false,
        error: {
          code: 'TEAMS_NOT_FOUND',
          message: `Could not find either team: ${homeTeam} or ${awayTeam}`,
        },
        metadata: {
          provider: 'api-sports',
          cached: false,
          fetchedAt: new Date(),
        },
      };
    }
    
    // Create placeholder team if one fails (allows partial data to still work)
    const createPlaceholderTeam = (name: string): NormalizedTeam => ({
      id: `placeholder-${name.toLowerCase().replace(/\s+/g, '-')}`,
      externalId: '0',
      name,
      shortName: name.split(' ').pop() || name,
      sport,
    });
    
    const home = homeTeamResult.success && homeTeamResult.data 
      ? homeTeamResult.data 
      : createPlaceholderTeam(homeTeam);
      
    const away = awayTeamResult.success && awayTeamResult.data 
      ? awayTeamResult.data 
      : createPlaceholderTeam(awayTeam);
    
    const homeFound = homeTeamResult.success && homeTeamResult.data;
    const awayFound = awayTeamResult.success && awayTeamResult.data;
    
    // Fetch data in parallel (only for teams we found)
    const promises: Promise<unknown>[] = [];
    
    // Stats - only fetch if team was found
    if (opts.includeStats && homeFound) {
      promises.push(this.getTeamStats({ teamId: home.externalId, sport }));
    } else {
      promises.push(Promise.resolve(null));
    }
    if (opts.includeStats && awayFound) {
      promises.push(this.getTeamStats({ teamId: away.externalId, sport }));
    } else {
      promises.push(Promise.resolve(null));
    }
    
    // Recent games - only fetch if team was found
    if (opts.includeRecentGames && homeFound) {
      promises.push(this.getRecentGames(sport, home.externalId, opts.recentGamesLimit));
    } else {
      promises.push(Promise.resolve(null));
    }
    if (opts.includeRecentGames && awayFound) {
      promises.push(this.getRecentGames(sport, away.externalId, opts.recentGamesLimit));
    } else {
      promises.push(Promise.resolve(null));
    }
    
    // H2H - only if both teams found
    if (opts.includeH2H && homeFound && awayFound) {
      promises.push(this.getH2H({ team1: homeTeam, team2: awayTeam, sport, limit: opts.h2hLimit }));
    } else {
      promises.push(Promise.resolve(null));
    }
    
    // Injuries - only fetch if team was found
    if (opts.includeInjuries && homeFound) {
      promises.push(this.getInjuries(sport, home.externalId));
    } else {
      promises.push(Promise.resolve(null));
    }
    if (opts.includeInjuries && awayFound) {
      promises.push(this.getInjuries(sport, away.externalId));
    } else {
      promises.push(Promise.resolve(null));
    }
    
    const [
      homeStats,
      awayStats,
      homeGames,
      awayGames,
      h2h,
      homeInjuries,
      awayInjuries,
    ] = await Promise.all(promises) as [
      DataLayerResponse<NormalizedTeamStats> | null,
      DataLayerResponse<NormalizedTeamStats> | null,
      DataLayerResponse<NormalizedRecentGames> | null,
      DataLayerResponse<NormalizedRecentGames> | null,
      DataLayerResponse<NormalizedH2H> | null,
      DataLayerResponse<NormalizedInjury[]> | null,
      DataLayerResponse<NormalizedInjury[]> | null,
    ];
    
    // Build enriched data
    const enrichedData: EnrichedMatchData = {
      match: {
        id: `${sport}-${home.externalId}-${away.externalId}`,
        externalId: '',
        sport,
        league: home.league || '',
        leagueId: '',
        season: '',
        homeTeam: home,
        awayTeam: away,
        status: 'scheduled',
        date: new Date(),
        provider: 'api-sports',
        fetchedAt: new Date(),
      },
      
      homeTeam: {
        team: home,
        stats: homeStats?.success ? homeStats.data : undefined,
        recentGames: homeGames?.success ? homeGames.data : undefined,
        injuries: homeInjuries?.success ? homeInjuries.data : undefined,
      },
      
      awayTeam: {
        team: away,
        stats: awayStats?.success ? awayStats.data : undefined,
        recentGames: awayGames?.success ? awayGames.data : undefined,
        injuries: awayInjuries?.success ? awayInjuries.data : undefined,
      },
      
      h2h: h2h?.success ? h2h.data : undefined,
      
      fetchedAt: new Date(),
    };
    
    return {
      success: true,
      data: enrichedData,
      metadata: {
        provider: 'api-sports',
        cached: false,
        fetchedAt: new Date(),
      },
    };
  }
  
  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.log('Cache cleared');
  }
  
  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let instance: DataLayer | null = null;

/**
 * Get the singleton DataLayer instance
 */
export function getDataLayer(config?: DataLayerConfig): DataLayer {
  if (!instance) {
    instance = new DataLayer(config);
  }
  return instance;
}

/**
 * Create a new DataLayer instance (for testing)
 */
export function createDataLayer(config?: DataLayerConfig): DataLayer {
  return new DataLayer(config);
}
