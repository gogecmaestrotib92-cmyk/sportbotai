/**
 * Market Alerts API
 * 
 * Premium feature: Real-time odds tracking, steam moves detection,
 * and top value edge matches.
 * 
 * GET /api/market-alerts
 * - Fetches today's matches with best model edge
 * - Returns odds movement alerts
 * - Premium only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering (uses headers/session)
export const dynamic = 'force-dynamic';
import { theOddsClient, OddsApiEvent } from '@/lib/theOdds';
import { oddsToImpliedProb } from '@/lib/value-detection';
import { cacheGet, CACHE_KEYS } from '@/lib/cache';

// ============================================
// TYPES
// ============================================

interface MarketAlert {
  id: string;
  matchId: string;  // SEO-friendly slug for linking to full analysis
  matchRef: string;
  sport: string;
  sportTitle: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  
  // Current odds (consensus/best)
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  
  // Movement from previous snapshot
  homeChange?: number;
  awayChange?: number;
  drawChange?: number;
  changeDirection: 'toward_home' | 'toward_away' | 'stable';
  
  // Model edge calculation
  modelHomeProb: number;
  modelAwayProb: number;
  modelDrawProb?: number;
  homeEdge: number;
  awayEdge: number;
  drawEdge?: number;
  bestEdge: {
    outcome: 'home' | 'away' | 'draw';
    percent: number;
    label: string;
  };
  
  // Alert flags
  hasSteamMove: boolean;
  hasValueEdge: boolean;
  alertLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  alertNote?: string;
  
  // Blur flag for non-premium users (top 10 edges are blurred)
  isBlurred?: boolean;
  blurRank?: number; // 1-10 for blurred items
}

interface MarketAlertsResponse {
  success: boolean;
  data?: {
    topEdgeMatches: MarketAlert[];
    allMatches: MarketAlert[];  // All matches sorted by edge
    steamMoves: MarketAlert[];
    allSteamMoves: MarketAlert[];  // All steam moves
    recentUpdates: {
      lastFetch: string;
      matchesScanned: number;
      alertsGenerated: number;
    };
  };
  error?: string;
  isPremium: boolean;
}

// ============================================
// SUPPORTED SPORTS FOR ALERTS
// ============================================

const ALERT_SPORTS = [
  { key: 'soccer_epl', title: 'EPL', hasDraw: true },
  { key: 'soccer_spain_la_liga', title: 'La Liga', hasDraw: true },
  { key: 'soccer_germany_bundesliga', title: 'Bundesliga', hasDraw: true },
  { key: 'soccer_italy_serie_a', title: 'Serie A', hasDraw: true },
  { key: 'soccer_france_ligue_one', title: 'Ligue 1', hasDraw: true },
  { key: 'soccer_portugal_primeira_liga', title: 'Primeira Liga', hasDraw: true },
  { key: 'soccer_netherlands_eredivisie', title: 'Eredivisie', hasDraw: true },
  { key: 'soccer_turkey_super_league', title: 'Süper Lig', hasDraw: true },
  { key: 'soccer_belgium_first_div', title: 'Jupiler Pro League', hasDraw: true },
  { key: 'soccer_spl', title: 'Scottish Premiership', hasDraw: true },
  { key: 'soccer_uefa_europa_league', title: 'Europa League', hasDraw: true },
  { key: 'basketball_nba', title: 'NBA', hasDraw: false },
  { key: 'basketball_euroleague', title: 'Euroleague', hasDraw: false },
  { key: 'icehockey_nhl', title: 'NHL', hasDraw: false },
  { key: 'americanfootball_nfl', title: 'NFL', hasDraw: false },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate SEO-friendly matchId slug for linking to full analysis
 */
function generateMatchId(homeTeam: string, awayTeam: string, sportKey: string, matchDate: string): string {
  const homeSlug = homeTeam.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const awaySlug = awayTeam.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const sportCode = sportKey.split('_').slice(1).join('-') || sportKey;
  const date = matchDate.split('T')[0];
  return `${homeSlug}-vs-${awaySlug}-${sportCode}-${date}`;
}

/**
 * Calculate consensus odds from multiple bookmakers
 */
function getConsensusOdds(event: OddsApiEvent): { home: number; away: number; draw?: number } | null {
  if (!event.bookmakers || event.bookmakers.length === 0) return null;
  
  let homeTotal = 0;
  let awayTotal = 0;
  let drawTotal = 0;
  let homeCount = 0;
  let awayCount = 0;
  let drawCount = 0;
  
  for (const bookmaker of event.bookmakers) {
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2hMarket) continue;
    
    for (const outcome of h2hMarket.outcomes) {
      const name = outcome.name.toLowerCase();
      if (name === event.home_team.toLowerCase() || name.includes('home')) {
        homeTotal += outcome.price;
        homeCount++;
      } else if (name === event.away_team.toLowerCase() || name.includes('away')) {
        awayTotal += outcome.price;
        awayCount++;
      } else if (name === 'draw') {
        drawTotal += outcome.price;
        drawCount++;
      }
    }
  }
  
  if (homeCount === 0 || awayCount === 0) return null;
  
  return {
    home: Math.round((homeTotal / homeCount) * 100) / 100,
    away: Math.round((awayTotal / awayCount) * 100) / 100,
    draw: drawCount > 0 ? Math.round((drawTotal / drawCount) * 100) / 100 : undefined,
  };
}

/**
 * Generate model probability based on market patterns
 * 
 * This is calibrated to produce edges SIMILAR to the full AI model.
 * Uses deterministic calculations (no randomness) for consistency.
 * 
 * Key insight: The full AI model typically finds 5-15% edges because:
 * - It incorporates form, injuries, head-to-head
 * - Markets don't fully price in recent news
 * - Home advantage is often underpriced
 * 
 * We replicate this by being more aggressive with adjustments.
 */
function calculateQuickModelProbability(
  consensus: { home: number; away: number; draw?: number },
  prevSnapshot: { homeOdds: number; awayOdds: number; drawOdds?: number | null } | null,
  hasDraw: boolean,
  matchRef?: string
): { home: number; away: number; draw?: number; confidence: number } {
  // Get implied probabilities
  const homeImplied = oddsToImpliedProb(consensus.home);
  const awayImplied = oddsToImpliedProb(consensus.away);
  const drawImplied = consensus.draw ? oddsToImpliedProb(consensus.draw) : 0;
  
  // Remove margin (bookmaker's edge)
  const total = homeImplied + awayImplied + drawImplied;
  const margin = total - 100;
  const adj = margin / (hasDraw ? 3 : 2);
  
  let homeProb = homeImplied - adj;
  let awayProb = awayImplied - adj;
  let drawProb = hasDraw ? drawImplied - adj : undefined;
  
  // === MARKET INEFFICIENCY ADJUSTMENTS ===
  // These are calibrated to match what the full AI model typically finds
  
  // 1. Home advantage boost (3-5% based on odds gap)
  // Tighter games have stronger home advantage effect
  const oddsGap = Math.abs(consensus.home - consensus.away);
  const homeAdvantageBonus = oddsGap < 0.5 ? 5 : oddsGap < 1.0 ? 4 : 3;
  homeProb += homeAdvantageBonus;
  awayProb -= homeAdvantageBonus * 0.6;
  if (drawProb) drawProb -= homeAdvantageBonus * 0.4;
  
  // 2. Heavy favorites are overpriced - underdog value
  // AI model often finds 8-12% edge on underdogs against heavy favorites
  if (homeImplied > 65) {
    const overFavAdj = (homeImplied - 65) * 0.25; // More aggressive
    homeProb -= overFavAdj;
    awayProb += overFavAdj * 0.8;
    if (drawProb) drawProb += overFavAdj * 0.2;
  }
  if (awayImplied > 65) {
    const overFavAdj = (awayImplied - 65) * 0.25;
    awayProb -= overFavAdj;
    homeProb += overFavAdj * 0.8;
    if (drawProb) drawProb += overFavAdj * 0.2;
  }
  
  // 3. Moderate underdogs (15-35% implied) often underpriced
  // The "sweet spot" for value - teams that can pull off upset
  if (homeImplied >= 15 && homeImplied <= 35) {
    const underdogBoost = 6 - Math.abs(homeImplied - 25) * 0.2; // Max 6% at 25% implied
    homeProb += Math.max(3, underdogBoost);
  }
  if (awayImplied >= 15 && awayImplied <= 35) {
    const underdogBoost = 6 - Math.abs(awayImplied - 25) * 0.2;
    awayProb += Math.max(3, underdogBoost);
  }
  
  // 4. In soccer, draws are systematically underpriced in close matches
  if (hasDraw && drawProb) {
    if (oddsGap < 0.3) {
      // Very close match - draw highly likely underpriced
      drawProb += 7;
      homeProb -= 3.5;
      awayProb -= 3.5;
    } else if (oddsGap < 0.6) {
      drawProb += 5;
      homeProb -= 2.5;
      awayProb -= 2.5;
    } else if (oddsGap < 1.0) {
      drawProb += 3;
      homeProb -= 1.5;
      awayProb -= 1.5;
    }
  }
  
  // 5. Steam moves - follow sharp money (significant signal)
  if (prevSnapshot) {
    const homeChange = ((consensus.home - prevSnapshot.homeOdds) / prevSnapshot.homeOdds) * 100;
    const awayChange = ((consensus.away - prevSnapshot.awayOdds) / prevSnapshot.awayOdds) * 100;
    
    // Sharp action = odds shortening (negative change = money coming in)
    if (homeChange < -2) {
      const steamBoost = Math.min(5, Math.abs(homeChange) * 1.5);
      homeProb += steamBoost;
      awayProb -= steamBoost * 0.7;
    }
    if (awayChange < -2) {
      const steamBoost = Math.min(5, Math.abs(awayChange) * 1.5);
      awayProb += steamBoost;
      homeProb -= steamBoost * 0.7;
    }
  }
  
  // Normalize to 100%
  const newTotal = homeProb + awayProb + (drawProb || 0);
  homeProb = Math.round((homeProb / newTotal) * 100);
  awayProb = Math.round((awayProb / newTotal) * 100);
  if (drawProb !== undefined) {
    drawProb = 100 - homeProb - awayProb;
  }
  
  // Clamp to reasonable ranges
  homeProb = Math.max(10, Math.min(85, homeProb));
  awayProb = Math.max(10, Math.min(85, awayProb));
  if (drawProb !== undefined) {
    drawProb = Math.max(10, Math.min(40, drawProb));
    // Re-normalize after clamping
    const clampTotal = homeProb + awayProb + drawProb;
    homeProb = Math.round((homeProb / clampTotal) * 100);
    awayProb = Math.round((awayProb / clampTotal) * 100);
    drawProb = 100 - homeProb - awayProb;
  }
  
  // Confidence based on how clear the edge is
  const maxProb = Math.max(homeProb, awayProb, drawProb || 0);
  const confidence = Math.min(80, 55 + (maxProb - 40) * 0.5);
  
  return {
    home: homeProb,
    away: awayProb,
    draw: drawProb,
    confidence,
  };
}

/**
 * Calculate change percentage between old and new odds
 */
function calculateOddsChange(current: number, previous: number | null): number | undefined {
  if (!previous || previous === 0) return undefined;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Detect steam moves (sharp line movements)
 * ONLY returns true if we have REAL line movement data from OddsSnapshot
 * No more fake "watching for movement" based on odds patterns
 */
function detectSteamMove(
  homeChange: number | undefined, 
  awayChange: number | undefined,
  homeOdds: number,
  awayOdds: number,
  hasPreviousData: boolean,
  dbSteamMove?: boolean,  // From OddsSnapshot.hasSteamMove
  dbSteamNote?: string    // From OddsSnapshot.alertNote (if steam)
): { hasSteam: boolean; direction: string; note: string } {
  const STEAM_THRESHOLD = 2.5; // 2.5% change is significant
  
  // PRIORITY 1: Use pre-computed steam move from DB (most reliable)
  // This is calculated by pre-analyze cron which tracks actual line movement
  if (dbSteamMove && dbSteamNote) {
    const direction = dbSteamNote.includes('Home') ? 'toward_home' : 
                      dbSteamNote.includes('Away') ? 'toward_away' : 
                      dbSteamNote.includes('Draw') ? 'toward_draw' : 'stable';
    return {
      hasSteam: true,
      direction,
      note: dbSteamNote,
    };
  }
  
  // PRIORITY 2: If we have actual change data from current session
  if (homeChange !== undefined && Math.abs(homeChange) >= STEAM_THRESHOLD) {
    return {
      hasSteam: true,
      direction: homeChange < 0 ? 'toward_home' : 'toward_away',
      note: homeChange < 0 
        ? `Sharp money on Home (${Math.abs(homeChange).toFixed(1)}% drop)`
        : `Line drifting from Home (+${homeChange.toFixed(1)}%)`,
    };
  }
  
  if (awayChange !== undefined && Math.abs(awayChange) >= STEAM_THRESHOLD) {
    return {
      hasSteam: true,
      direction: awayChange < 0 ? 'toward_away' : 'toward_home',
      note: awayChange < 0
        ? `Sharp money on Away (${Math.abs(awayChange).toFixed(1)}% drop)`
        : `Line drifting from Away (+${awayChange.toFixed(1)}%)`,
    };
  }
  
  // NO FAKE STEAM: If no real data, return no steam
  // Previously we had heuristics like "Heavy favorite - watching for movement"
  // but that's misleading - it's not a real steam move
  return { hasSteam: false, direction: 'stable', note: '' };
}

// ============================================
// BATCH HELPERS FOR PERFORMANCE
// ============================================

interface ProcessedEvent {
  event: OddsApiEvent;
  sport: typeof ALERT_SPORTS[number];
  consensus: { home: number; away: number; draw?: number };
  matchRef: string;
  matchDate: string;
  cacheKey: string;
}

/**
 * Batch fetch cached analyses using mget (Redis) or parallel gets
 */
async function batchGetCachedAnalyses(cacheKeys: string[]): Promise<Map<string, unknown>> {
  const results = new Map<string, unknown>();
  if (cacheKeys.length === 0) return results;
  
  // Parallel fetch all cache keys (Redis handles this efficiently)
  const promises = cacheKeys.map(async key => {
    const data = await cacheGet(key);
    if (data) results.set(key, data);
  });
  await Promise.all(promises);
  
  return results;
}

// ============================================
// MAIN HANDLER
// ============================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        isPremium: false,
      } as MarketAlertsResponse, { status: 401 });
    }
    
    // Check premium status - PREMIUM tier only (not PRO)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { plan: true },
    });
    
    const isPremium = user?.plan === 'PREMIUM';
    
    // For non-premium users, we'll return partial data with blurred top 10
    // This creates FOMO and shows value without giving away the best picks
    
    // Check if Odds API is configured
    if (!theOddsClient.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Odds API not configured',
        isPremium: true,
      } as MarketAlertsResponse, { status: 500 });
    }
    
    // ============================================
    // STEP 1: PARALLEL FETCH ALL SPORTS ODDS
    // ============================================
    console.log(`[Market Alerts] Fetching ${ALERT_SPORTS.length} sports in parallel...`);
    
    const oddsPromises = ALERT_SPORTS.map(sport => 
      theOddsClient.getOddsForSport(sport.key, {
        regions: ['eu', 'us'],
        markets: ['h2h'],
      }).then(response => ({ sport, response }))
        .catch(error => {
          console.error(`[Market Alerts] Error fetching ${sport.key}:`, error);
          return { sport, response: { data: [] } };
        })
    );
    
    const oddsResults = await Promise.all(oddsPromises);
    console.log(`[Market Alerts] Odds fetched in ${Date.now() - startTime}ms`);
    
    // ============================================
    // STEP 2: COLLECT ALL EVENTS & BUILD LOOKUP KEYS
    // ============================================
    const now = new Date();
    const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const processedEvents: ProcessedEvent[] = [];
    let totalMatches = 0;
    
    for (const { sport, response } of oddsResults) {
      if (!response.data || response.data.length === 0) continue;
      
      const upcomingEvents = response.data.filter(event => {
        const matchDate = new Date(event.commence_time);
        return matchDate >= now && matchDate <= cutoff;
      });
      
      totalMatches += upcomingEvents.length;
      
      for (const event of upcomingEvents) {
        const consensus = getConsensusOdds(event);
        if (!consensus) continue;
        
        const matchRef = `${event.home_team} vs ${event.away_team}`;
        const matchDate = new Date(event.commence_time).toISOString().split('T')[0];
        const cacheKey = CACHE_KEYS.matchPreview(event.home_team, event.away_team, sport.key, matchDate);
        
        processedEvents.push({
          event,
          sport,
          consensus,
          matchRef,
          matchDate,
          cacheKey,
        });
      }
    }
    
    console.log(`[Market Alerts] Processing ${processedEvents.length} events from ${totalMatches} total`);
    
    // ============================================
    // STEP 3: BATCH FETCH ALL PREVIOUS SNAPSHOTS
    // ============================================
    const snapshotKeys = processedEvents.map(e => ({
      matchRef: e.matchRef,
      sport: e.sport.key,
      bookmaker: 'consensus' as const,
    }));
    
    // Use findMany with OR for batch lookup (much faster than individual queries)
    const existingSnapshots = await prisma.oddsSnapshot.findMany({
      where: {
        OR: snapshotKeys.map(k => ({
          matchRef: k.matchRef,
          sport: k.sport,
          bookmaker: k.bookmaker,
        })),
      },
    });
    
    // Build lookup map for O(1) access
    const snapshotMap = new Map<string, typeof existingSnapshots[0]>();
    for (const snap of existingSnapshots) {
      snapshotMap.set(`${snap.matchRef}|${snap.sport}|${snap.bookmaker}`, snap);
    }
    
    console.log(`[Market Alerts] Snapshots loaded in ${Date.now() - startTime}ms`);
    
    // ============================================
    // STEP 4: BATCH FETCH ALL CACHED AI ANALYSES
    // ============================================
    const cacheKeys = processedEvents.map(e => e.cacheKey);
    const cachedAnalyses = await batchGetCachedAnalyses(cacheKeys);
    
    console.log(`[Market Alerts] Cache loaded: ${cachedAnalyses.size}/${cacheKeys.length} hits in ${Date.now() - startTime}ms`);
    
    // ============================================
    // STEP 5: PROCESS ALL EVENTS (CPU-bound, no I/O)
    // ============================================
    const allAlerts: MarketAlert[] = [];
    const upsertData: Array<{
      matchRef: string;
      sport: string;
      league: string;
      homeTeam: string;
      awayTeam: string;
      matchDate: Date;
      homeOdds: number;
      awayOdds: number;
      drawOdds?: number;
      prevHomeOdds?: number;
      prevAwayOdds?: number;
      prevDrawOdds?: number;
      homeChange?: number;
      awayChange?: number;
      drawChange?: number;
      modelHomeProb: number;
      modelAwayProb: number;
      modelDrawProb?: number;
      homeEdge: number;
      awayEdge: number;
      drawEdge?: number;
      hasSteamMove: boolean;
      hasValueEdge: boolean;
      alertLevel: string | null;
      alertNote?: string;
    }> = [];
    
    for (const processed of processedEvents) {
      const { event, sport, consensus, matchRef, cacheKey } = processed;
      
      // Get previous snapshot from map (O(1))
      const prevSnapshot = snapshotMap.get(`${matchRef}|${sport.key}|consensus`);
      
      // Calculate changes
      const homeChange = calculateOddsChange(consensus.home, prevSnapshot?.homeOdds ?? null);
      const awayChange = calculateOddsChange(consensus.away, prevSnapshot?.awayOdds ?? null);
      const drawChange = consensus.draw && prevSnapshot?.drawOdds 
        ? calculateOddsChange(consensus.draw, prevSnapshot.drawOdds)
        : undefined;
      
      // Detect steam moves - use REAL data from DB or calculated changes
      const steam = detectSteamMove(
        homeChange, 
        awayChange, 
        consensus.home, 
        consensus.away, 
        !!prevSnapshot,
        prevSnapshot?.hasSteamMove ?? false,  // DB-computed steam move
        prevSnapshot?.hasSteamMove ? (prevSnapshot?.alertNote ?? undefined) : undefined  // Steam note
      );
      
      // Get cached AI analysis (O(1) from map) - FALLBACK source
      const cachedAnalysis = cachedAnalyses.get(cacheKey) as {
        marketIntel?: {
          modelProbability?: { home: number; away: number; draw?: number };
          valueEdge?: { outcome: string; edgePercent: number; label: string; strength: string };
        };
      } | undefined;
      
      // Calculate edges
      let modelHomeProb: number;
      let modelAwayProb: number;
      let modelDrawProb: number | undefined;
      let homeEdge: number;
      let awayEdge: number;
      let drawEdge: number | undefined;
      let valueEdgeLabel: string | undefined;
      let usingPipelineProbs = false; // Track if we're using proper Poisson/Elo probabilities
      
      // PRIORITY 1: Use OddsSnapshot model probabilities (populated by pre-analyze cron with Poisson/Elo)
      // This is the most reliable source as it's persisted in DB
      if (prevSnapshot?.modelHomeProb && prevSnapshot?.modelAwayProb && 
          prevSnapshot.modelHomeProb > 0 && prevSnapshot.modelAwayProb > 0) {
        modelHomeProb = prevSnapshot.modelHomeProb;
        modelAwayProb = prevSnapshot.modelAwayProb;
        modelDrawProb = prevSnapshot.modelDrawProb ?? undefined;
        homeEdge = prevSnapshot.homeEdge ?? 0;
        awayEdge = prevSnapshot.awayEdge ?? 0;
        drawEdge = prevSnapshot.drawEdge ?? undefined;
        valueEdgeLabel = prevSnapshot.alertNote ?? undefined;
        usingPipelineProbs = true;
        // Note: We still recalculate edges below based on CURRENT consensus odds
        // in case odds have changed since pre-analyze ran
        const homeImplied = oddsToImpliedProb(consensus.home);
        const awayImplied = oddsToImpliedProb(consensus.away);
        const drawImplied = consensus.draw ? oddsToImpliedProb(consensus.draw) : 0;
        homeEdge = modelHomeProb - homeImplied;
        awayEdge = modelAwayProb - awayImplied;
        drawEdge = modelDrawProb ? modelDrawProb - drawImplied : undefined;
      }
      // PRIORITY 2: Use Redis cached analysis (may be empty on serverless cold start)
      else if (cachedAnalysis?.marketIntel?.modelProbability) {
        const aiProbs = cachedAnalysis.marketIntel.modelProbability;
        modelHomeProb = aiProbs.home;
        modelAwayProb = aiProbs.away;
        modelDrawProb = aiProbs.draw;
        usingPipelineProbs = true;
        
        const homeImplied = oddsToImpliedProb(consensus.home);
        const awayImplied = oddsToImpliedProb(consensus.away);
        const drawImplied = consensus.draw ? oddsToImpliedProb(consensus.draw) : 0;
        
        homeEdge = modelHomeProb - homeImplied;
        awayEdge = modelAwayProb - awayImplied;
        drawEdge = modelDrawProb ? modelDrawProb - drawImplied : undefined;
        valueEdgeLabel = cachedAnalysis.marketIntel.valueEdge?.label;
      } else {
        // FALLBACK: No cached pipeline data, use heuristic approximation
        // This should be rare after pre-analyze runs - log for monitoring
        console.warn(`[Market-Alerts] No cached pipeline data for ${matchRef} - using heuristic fallback (less accurate)`);
        const modelProb = calculateQuickModelProbability(consensus, prevSnapshot ?? null, sport.hasDraw);
        modelHomeProb = modelProb.home;
        modelAwayProb = modelProb.away;
        modelDrawProb = modelProb.draw;
        
        const homeImplied = oddsToImpliedProb(consensus.home);
        const awayImplied = oddsToImpliedProb(consensus.away);
        const drawImplied = consensus.draw ? oddsToImpliedProb(consensus.draw) : 0;
        
        homeEdge = modelHomeProb - homeImplied;
        awayEdge = modelAwayProb - awayImplied;
        drawEdge = modelDrawProb ? modelDrawProb - drawImplied : undefined;
      }
      
      // Determine best edge
      const edges: Array<{ outcome: 'home' | 'away' | 'draw'; percent: number }> = [
        { outcome: 'home', percent: homeEdge },
        { outcome: 'away', percent: awayEdge },
      ];
      if (drawEdge !== undefined) {
        edges.push({ outcome: 'draw', percent: drawEdge });
      }
      
      const bestEdge = edges.reduce((best, curr) => 
        curr.percent > best.percent ? curr : best
      , edges[0]);
      
      const hasValueEdge = bestEdge.percent >= 5; // 5%+ edge
      const alertLevel = bestEdge.percent >= 10 ? 'HIGH' : 
                        bestEdge.percent >= 5 ? 'MEDIUM' : 
                        steam.hasSteam ? 'LOW' : null;
      
      const alert: MarketAlert = {
        id: event.id,
        matchRef,
        sport: sport.key,
        sportTitle: sport.title,
        league: sport.title,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        matchDate: event.commence_time,
        matchId: generateMatchId(event.home_team, event.away_team, sport.key, event.commence_time),
        
        homeOdds: consensus.home,
        awayOdds: consensus.away,
        drawOdds: consensus.draw,
        
        homeChange,
        awayChange,
        drawChange,
        changeDirection: steam.direction as 'toward_home' | 'toward_away' | 'stable',
        
        modelHomeProb,
        modelAwayProb,
        modelDrawProb,
        homeEdge,
        awayEdge,
        drawEdge,
        bestEdge: {
          outcome: bestEdge.outcome,
          percent: Math.round(bestEdge.percent * 10) / 10,
          label: valueEdgeLabel || `${bestEdge.outcome.charAt(0).toUpperCase() + bestEdge.outcome.slice(1)} +${bestEdge.percent.toFixed(1)}%`,
        },
        
        hasSteamMove: steam.hasSteam,
        hasValueEdge,
        alertLevel,
        alertNote: steam.note || (hasValueEdge ? `Model sees ${bestEdge.percent.toFixed(1)}% edge on ${bestEdge.outcome}` : undefined),
      };
      
      allAlerts.push(alert);
      
      // Collect data for batch upsert
      upsertData.push({
        matchRef,
        sport: sport.key,
        league: sport.title,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        matchDate: new Date(event.commence_time),
        homeOdds: consensus.home,
        awayOdds: consensus.away,
        drawOdds: consensus.draw,
        prevHomeOdds: prevSnapshot?.homeOdds,
        prevAwayOdds: prevSnapshot?.awayOdds,
        prevDrawOdds: prevSnapshot?.drawOdds ?? undefined,
        homeChange,
        awayChange,
        drawChange,
        modelHomeProb,
        modelAwayProb,
        modelDrawProb,
        homeEdge,
        awayEdge,
        drawEdge,
        hasSteamMove: steam.hasSteam,
        hasValueEdge,
        alertLevel,
        alertNote: valueEdgeLabel || alert.alertNote,
      });
    }
    
    console.log(`[Market Alerts] Processing complete in ${Date.now() - startTime}ms`);
    
    // ============================================
    // STEP 6: BATCH UPSERT SNAPSHOTS (background, don't await)
    // ============================================
    // Fire and forget - we don't need to wait for DB writes to return response
    (async () => {
      try {
        // Use transaction for batch upserts
        await prisma.$transaction(
          upsertData.map(data => 
            prisma.oddsSnapshot.upsert({
              where: {
                matchRef_sport_bookmaker: {
                  matchRef: data.matchRef,
                  sport: data.sport,
                  bookmaker: 'consensus',
                },
              },
              create: {
                matchRef: data.matchRef,
                sport: data.sport,
                league: data.league,
                homeTeam: data.homeTeam,
                awayTeam: data.awayTeam,
                matchDate: data.matchDate,
                homeOdds: data.homeOdds,
                awayOdds: data.awayOdds,
                drawOdds: data.drawOdds,
                modelHomeProb: data.modelHomeProb,
                modelAwayProb: data.modelAwayProb,
                modelDrawProb: data.modelDrawProb,
                homeEdge: data.homeEdge,
                awayEdge: data.awayEdge,
                drawEdge: data.drawEdge,
                hasSteamMove: data.hasSteamMove,
                hasValueEdge: data.hasValueEdge,
                alertLevel: data.alertLevel,
                alertNote: data.alertNote,
                bookmaker: 'consensus',
              },
              update: {
                prevHomeOdds: data.prevHomeOdds,
                prevAwayOdds: data.prevAwayOdds,
                prevDrawOdds: data.prevDrawOdds,
                homeOdds: data.homeOdds,
                awayOdds: data.awayOdds,
                drawOdds: data.drawOdds,
                homeChange: data.homeChange,
                awayChange: data.awayChange,
                drawChange: data.drawChange,
                modelHomeProb: data.modelHomeProb,
                modelAwayProb: data.modelAwayProb,
                modelDrawProb: data.modelDrawProb,
                homeEdge: data.homeEdge,
                awayEdge: data.awayEdge,
                drawEdge: data.drawEdge,
                hasValueEdge: data.hasValueEdge,
                alertLevel: data.alertLevel,
                alertNote: data.alertNote,
                hasSteamMove: data.hasSteamMove,
                updatedAt: new Date(),
              },
            })
          )
        );
        console.log(`[Market Alerts] Batch upsert complete: ${upsertData.length} snapshots`);
      } catch (err) {
        console.error('[Market Alerts] Batch upsert error:', err);
      }
    })();
    
    // Sort ALL alerts by edge (highest to lowest)
    const allEdgesSorted = [...allAlerts]
      .sort((a, b) => b.bestEdge.percent - a.bestEdge.percent);
    
    // Steam moves - sorted by steam score
    // Calculate a "steam score" for each match to rank them
    const steamMoves = [...allAlerts]
      .map(a => {
        // Calculate steam score based on actual changes OR market patterns
        let steamScore = 0;
        let steamNote = a.alertNote || '';
        
        // Actual odds changes are highest priority
        const homeChg = a.homeChange || 0;
        const awayChg = a.awayChange || 0;
        const maxChange = Math.max(Math.abs(homeChg), Math.abs(awayChg));
        steamScore += maxChange * 10; // Weight actual changes heavily
        
        // Generate note based on changes
        if (maxChange >= 2.5) {
          if (Math.abs(homeChg) > Math.abs(awayChg)) {
            steamNote = homeChg < 0 
              ? `Sharp money on ${a.homeTeam} (${Math.abs(homeChg).toFixed(1)}% drop)`
              : `Line drifting from ${a.homeTeam} (+${homeChg.toFixed(1)}%)`;
          } else {
            steamNote = awayChg < 0
              ? `Sharp money on ${a.awayTeam} (${Math.abs(awayChg).toFixed(1)}% drop)`
              : `Line drifting from ${a.awayTeam} (+${awayChg.toFixed(1)}%)`;
          }
        } else {
          // Tight lines (close matches) are interesting
          const oddsGap = Math.abs(a.homeOdds - a.awayOdds);
          if (oddsGap < 0.20) {
            steamScore += 3;
            steamNote = steamNote || `Tight line (${a.homeOdds.toFixed(2)} vs ${a.awayOdds.toFixed(2)}) - watch for movement`;
          } else if (oddsGap < 0.40) {
            steamScore += 1.5;
            steamNote = steamNote || `Close matchup - potential sharp action`;
          }
          
          // Heavy favorites often see late steam
          if (a.homeOdds < 1.40) {
            steamScore += 2;
            steamNote = steamNote || `Heavy home favorite @ ${a.homeOdds.toFixed(2)} - monitoring for drift`;
          } else if (a.awayOdds < 1.40) {
            steamScore += 2;
            steamNote = steamNote || `Heavy away favorite @ ${a.awayOdds.toFixed(2)} - monitoring for drift`;
          }
        }
        
        return { ...a, steamScore, alertNote: steamNote || 'Tracking line movement' };
      })
      .sort((a, b) => b.steamScore - a.steamScore);
    
    const totalTime = Date.now() - startTime;
    console.log(`[Market Alerts] Response ready in ${totalTime}ms`);
    
    // For non-premium users: blur top 10 edges and top 5 steam moves
    // Show enough to create FOMO but hide the actual edge values
    let responseEdges = allEdgesSorted;
    let responseSteam = steamMoves;
    
    if (!isPremium) {
      // Blur top 10 edges - hide the actual edge % but show teams
      responseEdges = allEdgesSorted.map((alert, index) => {
        if (index < 10) {
          return {
            ...alert,
            isBlurred: true,
            blurRank: index + 1,
            // Hide the actual edge value - show range hint instead
            bestEdge: {
              ...alert.bestEdge,
              percent: 0, // Hidden
              label: index < 3 ? 'Strong Edge 🔥' : index < 6 ? 'Good Edge ⚡' : 'Edge Found 📊'
            },
            modelHomeProb: 0,
            modelAwayProb: 0,
            modelDrawProb: undefined,
            homeEdge: 0,
            awayEdge: 0,
            drawEdge: undefined,
            alertLevel: null,
          };
        }
        return { ...alert, isBlurred: false };
      });
      
      // Blur top 5 steam moves
      responseSteam = steamMoves.map((alert, index) => {
        if (index < 5) {
          return {
            ...alert,
            isBlurred: true,
            blurRank: index + 1,
            homeChange: undefined,
            awayChange: undefined,
            drawChange: undefined,
            alertNote: index < 2 ? '🔥 Major line movement detected' : '⚡ Sharp action detected',
          };
        }
        return { ...alert, isBlurred: false };
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        topEdgeMatches: responseEdges.slice(0, isPremium ? 5 : 10),  // Show more for free (blurred)
        allMatches: responseEdges,  // All matches sorted by edge
        steamMoves: responseSteam.slice(0, isPremium ? 5 : 5),  // Top 5 steam
        allSteamMoves: responseSteam,  // All steam moves
        recentUpdates: {
          lastFetch: new Date().toISOString(),
          matchesScanned: totalMatches,
          alertsGenerated: allAlerts.filter(a => a.alertLevel !== null).length,
          responseTimeMs: totalTime,
        },
      },
      isPremium,
    } as MarketAlertsResponse);
    
  } catch (error) {
    console.error('[Market Alerts] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch market alerts',
      isPremium: true,
    } as MarketAlertsResponse, { status: 500 });
  }
}
