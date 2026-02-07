/**
 * Unified Match Service
 * 
 * THE SINGLE SOURCE OF TRUTH FOR ALL MATCH DATA
 * 
 * This service ensures ALL components use the same data pipeline:
 * - Blog generator
 * - News/Match previews
 * - Pre-analyzer cron
 * - AI Chat analysis
 * - Agent posts
 * 
 * DATA LAYER LEVELS:
 * - Data-0: Infrastructure (logging, caching, circuit breaker)
 * - Data-1: Normalization (vig removal, implied probs, raw stats)
 * - Data-2: Modeling (Poisson, Elo, form weighting, calibration)
 * - Data-2.5: Validation (quality gating, edge filtering)
 * - Data-3: LLM (narrative generation, READ-ONLY computed data)
 * 
 * RESILIENCE FEATURES:
 * - Circuit breaker pattern for API failures
 * - Enhanced response metadata with sources[]
 * - Graceful degradation with dataQuality tracking
 */

import { getEnrichedMatchDataV2 } from '@/lib/data-layer/bridge';
import {
  apiSportsBreaker,
  oddsApiBreaker,
  type DataSource,
  type ResponseMetadata,
  type QualityFactor,
  createResponseMetadata,
  STANDARD_FIELDS,
} from '@/lib/resilience';
import { 
  normalizeToUniversalSignals,
  type RawMatchInput,
  type UniversalSignals,
} from '@/lib/universal-signals';
import { 
  analyzeMarket,
  type OddsData,
  type MarketIntel,
} from '@/lib/value-detection';
import { 
  computeNarrativeAngle,
  type NarrativeAngle,
} from '@/lib/sportbot-brain';
import { theOddsClient } from '@/lib/theOdds';
import { prisma } from '@/lib/prisma';

// ============================================
// TYPES
// ============================================

export interface MatchIdentifier {
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league?: string;
  kickoff?: string;
}

export interface OddsInfo {
  home: number;
  away: number;
  draw?: number | null;
}

export interface FormMatch {
  result: 'W' | 'L' | 'D';
  opponent: string;
  score: string;
  date: string;
}

export interface H2HMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
}

export interface TeamStats {
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
  wins: number;
  losses: number;
  draws?: number;
  played?: number;
  averageScored?: number;
  averageConceded?: number;
}

export interface ComputedAnalysis {
  // Probabilities (Data-2 output)
  probabilities: {
    home: number;
    away: number;
    draw: number | null;
  };
  
  // Edge analysis (Data-2.5 output)
  edge: {
    direction: 'home' | 'away' | 'draw' | 'neutral';
    percentage: number;
    quality: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  
  // Quality signals
  confidence: number;
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  
  // Narrative signals (for Data-3 LLM)
  narrativeAngle: NarrativeAngle;
  favored: 'home' | 'away' | 'draw' | 'even';
  
  // Raw market intel (for advanced use)
  marketIntel?: MarketIntel;
}

export interface UnifiedMatchData {
  // Match identifier
  match: MatchIdentifier;
  
  // Raw enriched data (Data-0/1)
  enrichedData: {
    homeForm: FormMatch[] | null;
    awayForm: FormMatch[] | null;
    headToHead: H2HMatch[] | null;
    h2hSummary: { totalMatches: number; homeWins: number; awayWins: number; draws: number } | null;
    homeStats: TeamStats | null;
    awayStats: TeamStats | null;
    dataSource: 'API_SPORTS' | 'CACHE' | 'DATABASE' | 'UNAVAILABLE';
  };
  
  // Odds data
  odds: OddsInfo | null;
  
  // Computed analysis (Data-2 + Data-2.5)
  analysis: ComputedAnalysis | null;
  
  // Enhanced metadata (resilience layer)
  metadata?: ResponseMetadata;
    // Metadata
  fetchedAt: Date;
  cached: boolean;
  predictionId?: string;
}

// ============================================
// CACHE (Data-0)
// ============================================

const matchCache = new Map<string, { data: UnifiedMatchData; expiry: Date }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(match: MatchIdentifier): string {
  return `${match.homeTeam}:${match.awayTeam}:${match.sport}`.toLowerCase();
}

function getFromCache(match: MatchIdentifier): UnifiedMatchData | null {
  const key = getCacheKey(match);
  const cached = matchCache.get(key);
  
  if (cached && cached.expiry > new Date()) {
    console.log(`[UnifiedMatchService] Cache HIT: ${key}`);
    return { ...cached.data, cached: true };
  }
  
  if (cached) {
    matchCache.delete(key);
  }
  return null;
}

function setCache(match: MatchIdentifier, data: UnifiedMatchData): void {
  const key = getCacheKey(match);
  matchCache.set(key, {
    data,
    expiry: new Date(Date.now() + CACHE_TTL_MS),
  });
}

// ============================================
// DATA-1: NORMALIZATION LAYER
// ============================================

function hasDraw(sport: string): boolean {
  const lower = sport.toLowerCase();
  return (
    lower.includes('soccer') ||
    lower === 'football' ||
    lower.includes('_epl') ||
    lower.includes('_la_liga') ||
    lower.includes('_serie') ||
    lower.includes('_bundesliga') ||
    lower.includes('_ligue')
  );
}

function extractFormString(matches: FormMatch[] | null | undefined): string {
  if (!matches?.length) return '';
  return matches.slice(0, 5).map(m => m.result).join('');
}

function countWins(form: string): number {
  return (form.match(/W/g) || []).length;
}

function countLosses(form: string): number {
  return (form.match(/L/g) || []).length;
}

// ============================================
// DATA-2: COMPUTE PROBABILITIES
// ============================================

function computeAnalysis(
  enrichedData: UnifiedMatchData['enrichedData'],
  odds: OddsInfo,
  match: MatchIdentifier
): ComputedAnalysis | null {
  const { homeStats, awayStats, homeForm, awayForm, headToHead } = enrichedData;
  
  // Minimum data check
  if (!homeStats || !awayStats || !odds.home || !odds.away) {
    console.log('[UnifiedMatchService] Insufficient data for analysis');
    return null;
  }
  
  const homeFormStr = extractFormString(homeForm);
  const awayFormStr = extractFormString(awayForm);
  const sport = match.sport;
  const includesDraw = hasDraw(sport);
  
  // Build raw input for universal signals
  const rawInput: RawMatchInput = {
    sport,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeForm: homeFormStr,
    awayForm: awayFormStr,
    homeStats: {
      played: homeStats.wins !== undefined && homeStats.losses !== undefined 
        ? (homeStats.wins + homeStats.losses + (homeStats.draws || 0)) 
        : homeFormStr.length || 5,
      wins: homeStats.wins ?? countWins(homeFormStr),
      draws: homeStats.draws ?? 0,
      losses: homeStats.losses ?? countLosses(homeFormStr),
      scored: homeStats.goalsScored,
      conceded: homeStats.goalsConceded,
    },
    awayStats: {
      played: awayStats.wins !== undefined && awayStats.losses !== undefined 
        ? (awayStats.wins + awayStats.losses + (awayStats.draws || 0)) 
        : awayFormStr.length || 5,
      wins: awayStats.wins ?? countWins(awayFormStr),
      draws: awayStats.draws ?? 0,
      losses: awayStats.losses ?? countLosses(awayFormStr),
      scored: awayStats.goalsScored,
      conceded: awayStats.goalsConceded,
    },
    h2h: {
      total: headToHead?.length || 0,
      homeWins: headToHead?.filter(m => m.homeScore > m.awayScore).length || 0,
      awayWins: headToHead?.filter(m => m.awayScore > m.homeScore).length || 0,
      draws: headToHead?.filter(m => m.homeScore === m.awayScore).length || 0,
    },
  };
  
  // Compute universal signals (Data-1 → Data-2)
  let signals: UniversalSignals;
  try {
    signals = normalizeToUniversalSignals(rawInput);
  } catch (error) {
    console.error('[UnifiedMatchService] Failed to compute universal signals:', error);
    return null;
  }
  
  // Build odds data
  const oddsData: OddsData = {
    homeOdds: odds.home,
    awayOdds: odds.away,
    drawOdds: includesDraw && odds.draw ? odds.draw : undefined,
  };
  
  // Run market analysis (Data-2)
  const leagueFromSport = sport.includes('_') ? sport.split('_').slice(-1)[0] : sport;
  let marketIntel: MarketIntel | null = null;
  try {
    marketIntel = analyzeMarket(signals, oddsData, includesDraw, undefined, leagueFromSport);
  } catch (error) {
    console.error('[UnifiedMatchService] Failed to analyze market:', error);
    return null;
  }
  
  // Extract computed probabilities
  const homeProb = marketIntel.modelProbability.home;
  const awayProb = marketIntel.modelProbability.away;
  const drawProb = includesDraw ? marketIntel.modelProbability.draw || null : null;
  
  // Extract edge
  const strengthEdge = {
    direction: signals.display.edge.direction as 'home' | 'away' | 'draw' | 'neutral',
    percentage: signals.display.edge.percentage,
  };
  
  // Determine data quality (Data-2.5)
  const hasFormData = homeFormStr.length > 0 && awayFormStr.length > 0;
  const hasH2H = (headToHead?.length || 0) > 0;
  const dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT' = 
    hasFormData && hasH2H ? 'HIGH' :
    hasFormData ? 'MEDIUM' : 
    homeStats && awayStats ? 'LOW' : 'INSUFFICIENT';
  
  // Compute edge quality
  const edgeQuality: 'HIGH' | 'MEDIUM' | 'LOW' = 
    Math.abs(strengthEdge.percentage) >= 10 ? 'HIGH' :
    Math.abs(strengthEdge.percentage) >= 5 ? 'MEDIUM' : 'LOW';
  
  // Determine favored
  // CRITICAL: For sports without draws (basketball, NFL, hockey), NEVER use 'even'
  // Always pick a side based on probability
  let favored: 'home' | 'away' | 'draw' | 'even' = 'even';
  const probDiff = Math.abs(homeProb - awayProb);
  
  if (probDiff >= 5) {
    if (homeProb > awayProb && homeProb > (drawProb || 0)) {
      favored = 'home';
    } else if (awayProb > homeProb && awayProb > (drawProb || 0)) {
      favored = 'away';
    } else if (drawProb && drawProb > homeProb && drawProb > awayProb) {
      favored = 'draw';
    }
  } else if (!includesDraw) {
    // For non-draw sports with close probabilities, still pick the higher side
    favored = homeProb >= awayProb ? 'home' : 'away';
  }
  
  // Derive narrative angle (for Data-3 LLM)
  // Calculate volatility from form consistency
  const homeWins = homeFormStr.split('').filter(c => c === 'W').length;
  const awayWins = awayFormStr.split('').filter(c => c === 'W').length;
  const formLength = Math.max(homeFormStr.length, awayFormStr.length, 1);
  const volatility = Math.abs(homeWins - awayWins) < 2 ? 80 : 40; // High volatility if forms are similar
  const powerGap = Math.abs(homeProb - awayProb);
  const formWeirdness = Math.abs((homeWins / formLength) - (awayWins / formLength)) * 100;
  const narrativeAngle = computeNarrativeAngle(volatility, powerGap, formWeirdness);
  
  console.log('[UnifiedMatchService] Analysis computed:', {
    probs: { home: homeProb, away: awayProb, draw: drawProb },
    edge: strengthEdge,
    dataQuality,
    favored,
    narrative: narrativeAngle,
  });
  
  return {
    probabilities: {
      home: homeProb,
      away: awayProb,
      draw: drawProb,
    },
    edge: {
      ...strengthEdge,
      quality: edgeQuality,
    },
    confidence: signals.confidence === 'high' ? 0.8 : signals.confidence === 'medium' ? 0.5 : 0.3,
    dataQuality,
    narrativeAngle,
    favored,
    marketIntel,
  };
}

// ============================================
// DATABASE FALLBACK
// ============================================

async function getFromDatabase(match: MatchIdentifier): Promise<{
  analysis: ComputedAnalysis | null;
  predictionId?: string;
} | null> {
  try {
    // Check for existing prediction in database
    const prediction = await prisma.prediction.findFirst({
      where: {
        OR: [
          { matchName: { contains: match.homeTeam, mode: 'insensitive' } },
          { matchName: { contains: match.awayTeam, mode: 'insensitive' } },
        ],
        outcome: { in: ['PENDING', 'HIT', 'MISS'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    if (prediction) {
      console.log(`[UnifiedMatchService] Found prediction in DB: ${prediction.id}`);
      
      // Reconstruct analysis from prediction
      // Since we don't have detailed probs, estimate from prediction text
      const isHomeCall = prediction.prediction?.toLowerCase().includes('home') ||
                         prediction.prediction?.toLowerCase().includes(match.homeTeam.toLowerCase());
      const isAwayCall = prediction.prediction?.toLowerCase().includes('away') ||
                         prediction.prediction?.toLowerCase().includes(match.awayTeam.toLowerCase());
      
      const analysis: ComputedAnalysis = {
        probabilities: {
          home: isHomeCall ? 55 : isAwayCall ? 45 : 50,
          away: isAwayCall ? 55 : isHomeCall ? 45 : 50,
          draw: prediction.sport?.includes('soccer') ? 25 : null,
        },
        edge: {
          direction: isHomeCall ? 'home' : isAwayCall ? 'away' : 'neutral',
          percentage: prediction.valueBetEdge || (prediction.conviction || 5) * 2,
          quality: (prediction.conviction || 0) >= 7 ? 'HIGH' : 
                   (prediction.conviction || 0) >= 4 ? 'MEDIUM' : 'LOW',
        },
        confidence: (prediction.conviction || 5) / 10,
        dataQuality: 'MEDIUM',
        narrativeAngle: 'CONTROL',
        favored: isHomeCall ? 'home' : isAwayCall ? 'away' : 'even',
      };
      
      return { analysis, predictionId: prediction.id };
    }
    
    return null;
  } catch (error) {
    console.error('[UnifiedMatchService] Database lookup failed:', error);
    return null;
  }
}

// ============================================
// ODDS FETCHING
// ============================================

async function fetchOdds(match: MatchIdentifier): Promise<OddsInfo | null> {
  try {
    if (!theOddsClient.isConfigured()) {
      return null;
    }
    
    // Try to get from events API first (free, no quota)
    const sportKey = match.sport;
    const eventsResponse = await theOddsClient.getEvents(sportKey);
    const events = eventsResponse.data || [];
    
    // Find matching event
    const event = events.find((e) => 
      e.home_team.toLowerCase().includes(match.homeTeam.toLowerCase()) ||
      e.away_team.toLowerCase().includes(match.awayTeam.toLowerCase())
    );
    
    if (!event) {
      return null;
    }
    
    // Get odds for this event (uses quota)
    const oddsResponse = await theOddsClient.getOddsForSport(sportKey, {
      markets: ['h2h'],
      regions: ['eu'],
    });
    
    const oddsData = oddsResponse.data || [];
    const matchOdds = oddsData.find((o) => 
      o.home_team === event.home_team && o.away_team === event.away_team
    );
    
    if (matchOdds?.bookmakers?.[0]?.markets?.[0]?.outcomes) {
      const outcomes = matchOdds.bookmakers[0].markets[0].outcomes;
      return {
        home: outcomes.find((o) => o.name === matchOdds.home_team)?.price || 2.0,
        away: outcomes.find((o) => o.name === matchOdds.away_team)?.price || 2.0,
        draw: outcomes.find((o) => o.name === 'Draw')?.price || null,
      };
    }
    
    return null;
  } catch (error) {
    console.error('[UnifiedMatchService] Failed to fetch odds:', error);
    return null;
  }
}

// ============================================
// MAIN FUNCTION
// ============================================

export interface GetMatchDataOptions {
  includeOdds?: boolean;
  skipCache?: boolean;
  odds?: OddsInfo; // Pre-fetched odds
}

/**
 * Get unified match data with computed analysis
 * 
 * This is THE function to call for any match data needs.
 * It runs through all 4 data layers and returns consistent data.
 */
export async function getUnifiedMatchData(
  match: MatchIdentifier,
  options: GetMatchDataOptions = {}
): Promise<UnifiedMatchData> {
  const { includeOdds = true, skipCache = false, odds: preloadedOdds } = options;
  const startTime = Date.now();
  const sources: DataSource[] = [];
  const warnings: string[] = [];
  let circuitBreakerTriggered = false;
  let fallbackUsed = false;
  
  console.log(`[UnifiedMatchService] Fetching: ${match.homeTeam} vs ${match.awayTeam} (${match.sport})`);
  
  // Check cache first
  if (!skipCache) {
    const cached = getFromCache(match);
    if (cached) {
      return cached;
    }
  }
  
  // Fetch enriched data (Data-0 + Data-1) with circuit breaker
  let enrichedData: UnifiedMatchData['enrichedData'];
  const enrichedStartTime = Date.now();
  
  // Check circuit breaker before making request
  const cbStatus = apiSportsBreaker.shouldAllowRequest('enriched-data');
  
  if (!cbStatus.allowed) {
    console.log(`[UnifiedMatchService] Circuit breaker: ${cbStatus.reason}`);
    circuitBreakerTriggered = true;
    warnings.push('Using cached data due to API issues');
    
    // Try database as fallback
    const dbFallback = await getFromDatabase(match);
    if (dbFallback?.analysis) {
      fallbackUsed = true;
      sources.push({
        name: 'PostgreSQL',
        type: 'DATABASE',
        fetchedAt: new Date(),
        latencyMs: Date.now() - enrichedStartTime,
        notes: 'Circuit breaker active - database fallback',
      });
      enrichedData = {
        homeForm: null,
        awayForm: null,
        headToHead: null,
        h2hSummary: null,
        homeStats: null,
        awayStats: null,
        dataSource: 'DATABASE',
      };
    } else {
      enrichedData = {
        homeForm: null,
        awayForm: null,
        headToHead: null,
        h2hSummary: null,
        homeStats: null,
        awayStats: null,
        dataSource: 'UNAVAILABLE',
      };
    }
  } else {
    try {
      const result = await getEnrichedMatchDataV2(
        match.homeTeam,
        match.awayTeam,
        match.sport,
        match.league
      );
      
      // Record success with circuit breaker
      apiSportsBreaker.recordSuccess('enriched-data');
      
      enrichedData = {
        homeForm: result.homeForm,
        awayForm: result.awayForm,
        headToHead: result.headToHead,
        h2hSummary: result.h2hSummary,
        homeStats: result.homeStats,
        awayStats: result.awayStats,
        dataSource: result.dataSource,
      };
      
      // Track source
      sources.push({
        name: 'API-Sports',
        type: result.dataSource === 'API_SPORTS' ? 'LIVE' : 
              result.dataSource === 'CACHE' ? 'CACHE' : 'DATABASE',
        fetchedAt: new Date(),
        latencyMs: Date.now() - enrichedStartTime,
        provider: 'api-football',
      });
      
    } catch (error) {
      // Record failure with circuit breaker
      apiSportsBreaker.recordFailure('enriched-data', error instanceof Error ? error : undefined);
      console.error('[UnifiedMatchService] Failed to fetch enriched data:', error);
      warnings.push('Team statistics temporarily unavailable');
      
      enrichedData = {
        homeForm: null,
        awayForm: null,
        headToHead: null,
        h2hSummary: null,
        homeStats: null,
        awayStats: null,
        dataSource: 'UNAVAILABLE',
      };
    }
  }
  
  // Get odds with circuit breaker
  let odds: OddsInfo | null = preloadedOdds || null;
  const oddsStartTime = Date.now();
  
  if (!odds && includeOdds) {
    const oddsCbStatus = oddsApiBreaker.shouldAllowRequest('fetch-odds');
    
    if (!oddsCbStatus.allowed) {
      console.log(`[UnifiedMatchService] Odds circuit breaker: ${oddsCbStatus.reason}`);
      warnings.push('Live odds temporarily unavailable');
    } else {
      try {
        odds = await fetchOdds(match);
        if (odds) {
          oddsApiBreaker.recordSuccess('fetch-odds');
          sources.push({
            name: 'The Odds API',
            type: 'LIVE',
            fetchedAt: new Date(),
            latencyMs: Date.now() - oddsStartTime,
            provider: 'the-odds-api',
          });
        }
      } catch (error) {
        oddsApiBreaker.recordFailure('fetch-odds', error instanceof Error ? error : undefined);
        console.error('[UnifiedMatchService] Failed to fetch odds:', error);
      }
    }
  } else if (preloadedOdds) {
    sources.push({
      name: 'Pre-loaded odds',
      type: 'CACHE',
      fetchedAt: new Date(),
      latencyMs: 0,
      notes: 'Odds provided by caller',
    });
  }
  
  // Compute analysis (Data-2 + Data-2.5)
  let analysis: ComputedAnalysis | null = null;
  let predictionId: string | undefined;
  
  if (odds && enrichedData.dataSource !== 'UNAVAILABLE') {
    analysis = computeAnalysis(enrichedData, odds, match);
  }
  
  // Fallback to database if no analysis computed
  if (!analysis) {
    const dbResult = await getFromDatabase(match);
    if (dbResult) {
      analysis = dbResult.analysis;
      predictionId = dbResult.predictionId;
      fallbackUsed = true;
      
      // Add DB as source if not already there
      if (!sources.find(s => s.name === 'PostgreSQL')) {
        sources.push({
          name: 'PostgreSQL',
          type: 'DATABASE',
          fetchedAt: new Date(),
          notes: 'Analysis from stored prediction',
        });
      }
    }
  }
  
  // Build quality factors
  const qualityFactors: QualityFactor[] = [
    { name: STANDARD_FIELDS.HOME_FORM, available: !!enrichedData.homeForm?.length, weight: 0.15 },
    { name: STANDARD_FIELDS.AWAY_FORM, available: !!enrichedData.awayForm?.length, weight: 0.15 },
    { name: STANDARD_FIELDS.HEAD_TO_HEAD, available: !!enrichedData.headToHead?.length, weight: 0.10 },
    { name: STANDARD_FIELDS.HOME_STATS, available: !!enrichedData.homeStats, weight: 0.10 },
    { name: STANDARD_FIELDS.AWAY_STATS, available: !!enrichedData.awayStats, weight: 0.10 },
    { name: STANDARD_FIELDS.ODDS, available: !!odds, weight: 0.20 },
    { name: STANDARD_FIELDS.AI_PROBABILITIES, available: !!analysis, weight: 0.20 },
  ];
  
  // Build missing fields list
  const missingFields: string[] = [];
  if (!enrichedData.homeForm?.length) missingFields.push('homeForm');
  if (!enrichedData.awayForm?.length) missingFields.push('awayForm');
  if (!enrichedData.headToHead?.length) missingFields.push('headToHead');
  if (!enrichedData.homeStats) missingFields.push('homeStats');
  if (!enrichedData.awayStats) missingFields.push('awayStats');
  if (!odds) missingFields.push('odds');
  
  // Create enhanced metadata
  const metadata = createResponseMetadata({
    sources,
    factors: qualityFactors,
    missingFields,
    warnings,
    totalLatencyMs: Date.now() - startTime,
    circuitBreakerTriggered,
    fallbackUsed,
    seasonValidated: true, // Would be set by verification layer
    leagueValidated: true,
    teamsValidated: true,
  });
  
  // Build result
  const result: UnifiedMatchData = {
    match,
    enrichedData,
    odds,
    analysis,
    metadata,
    fetchedAt: new Date(),
    cached: false,
    predictionId,
  };
  
  // Cache result
  setCache(match, result);
  
  console.log(`[UnifiedMatchService] Complete in ${metadata.totalLatencyMs}ms | Quality: ${metadata.dataQuality} | Sources: ${sources.map(s => s.name).join(', ')}`);
  
  return result;
}

/**
 * Quick analysis for minimal data scenarios
 * Used by agent posts, live intel, etc.
 */
export async function getQuickAnalysis(
  match: MatchIdentifier,
  odds: OddsInfo
): Promise<ComputedAnalysis | null> {
  // Try full analysis first
  const fullData = await getUnifiedMatchData(match, { odds, includeOdds: false });
  if (fullData.analysis) {
    return fullData.analysis;
  }
  
  // Fallback: compute from odds only
  return computeFromOddsOnly(match, odds);
}

function computeFromOddsOnly(
  match: MatchIdentifier,
  odds: OddsInfo
): ComputedAnalysis {
  const includesDraw = hasDraw(match.sport);
  
  // Calculate implied probabilities from odds
  const homeImplied = 1 / odds.home;
  const awayImplied = 1 / odds.away;
  const drawImplied = odds.draw ? 1 / odds.draw : 0;
  const total = homeImplied + awayImplied + drawImplied;
  
  // Remove vig (normalize to 100%)
  const homeProb = (homeImplied / total) * 100;
  const awayProb = (awayImplied / total) * 100;
  const drawProb = includesDraw && odds.draw ? (drawImplied / total) * 100 : null;
  
  // Determine favored
  let favored: 'home' | 'away' | 'draw' | 'even' = 'even';
  if (homeProb > awayProb + 5) favored = 'home';
  else if (awayProb > homeProb + 5) favored = 'away';
  
  return {
    probabilities: { home: homeProb, away: awayProb, draw: drawProb },
    edge: { direction: 'neutral', percentage: 0, quality: 'LOW' },
    confidence: 0.3, // Low confidence with odds only
    dataQuality: 'LOW',
    narrativeAngle: 'CONTROL', // Default to CONTROL for low-data scenarios
    favored,
  };
}

// ============================================
// EXPORTS
// ============================================

export {
  hasDraw,
  extractFormString,
  getCacheKey,
};
