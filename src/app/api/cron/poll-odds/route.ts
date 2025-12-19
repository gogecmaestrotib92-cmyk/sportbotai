/**
 * Odds Polling Cron Job
 * 
 * Polls The Odds API every 30 minutes to:
 * 1. Fetch current odds for upcoming matches across major sports
 * 2. Store snapshots in OddsSnapshot table
 * 3. Detect steam moves (≥2.5% odds change)
 * 4. Mark matches with significant movements for Market Alerts
 * 
 * This enables REAL steam move detection vs only seeing changes when user visits.
 * 
 * Schedule: Every 30 minutes
 * Quota usage: 5-10 API calls per run (1 per sport with eu+us regions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { theOddsClient, OddsApiEvent } from '@/lib/theOdds';

export const maxDuration = 60; // 60 second timeout

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

// Sports to poll (prioritize popular sports with high volume)
const POLL_SPORTS = [
  { key: 'soccer_epl', title: 'EPL', league: 'Premier League', hasDraw: true },
  { key: 'soccer_spain_la_liga', title: 'La Liga', league: 'La Liga', hasDraw: true },
  { key: 'soccer_germany_bundesliga', title: 'Bundesliga', league: 'Bundesliga', hasDraw: true },
  { key: 'basketball_nba', title: 'NBA', league: 'NBA', hasDraw: false },
  { key: 'americanfootball_nfl', title: 'NFL', league: 'NFL', hasDraw: false },
];

// Steam move threshold (2.5% change = significant movement)
const STEAM_THRESHOLD = 2.5;

// ============================================
// HELPER FUNCTIONS
// ============================================

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
      } else if (name === 'draw' || name === 'the draw') {
        drawTotal += outcome.price;
        drawCount++;
      }
    }
  }
  
  if (homeCount === 0 || awayCount === 0) return null;
  
  return {
    home: homeTotal / homeCount,
    away: awayTotal / awayCount,
    draw: drawCount > 0 ? drawTotal / drawCount : undefined,
  };
}

/**
 * Calculate percentage change between two odds values
 */
function calculateOddsChange(current: number, previous: number | null): number | undefined {
  if (!previous || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

/**
 * Detect if change qualifies as steam move
 */
function detectSteamMove(
  homeChange: number | undefined,
  awayChange: number | undefined
): { 
  hasSteam: boolean; 
  direction: 'toward_home' | 'toward_away' | 'stable';
  note?: string;
} {
  const absHomeChange = Math.abs(homeChange || 0);
  const absAwayChange = Math.abs(awayChange || 0);
  
  // Check if either movement exceeds threshold
  if (absHomeChange >= STEAM_THRESHOLD || absAwayChange >= STEAM_THRESHOLD) {
    // Determine direction based on which side is shortening
    // Shortening odds = more money coming in = steam
    const homeShortening = homeChange && homeChange < -STEAM_THRESHOLD;
    const awayShortening = awayChange && awayChange < -STEAM_THRESHOLD;
    
    if (homeShortening && !awayShortening) {
      return {
        hasSteam: true,
        direction: 'toward_home',
        note: `Sharp action on home team (-${absHomeChange.toFixed(1)}% odds drop)`,
      };
    } else if (awayShortening && !homeShortening) {
      return {
        hasSteam: true,
        direction: 'toward_away',
        note: `Sharp action on away team (-${absAwayChange.toFixed(1)}% odds drop)`,
      };
    } else if (homeShortening && awayShortening) {
      // Both shortening? Rare, but favors the one that shortened more
      return {
        hasSteam: true,
        direction: absHomeChange > absAwayChange ? 'toward_home' : 'toward_away',
        note: `Unusual market movement on both sides`,
      };
    }
  }
  
  return { hasSteam: false, direction: 'stable' };
}

/**
 * Determine alert level based on edge and steam
 */
function getAlertLevel(
  hasSteam: boolean,
  bestEdge: number
): 'HIGH' | 'MEDIUM' | 'LOW' | null {
  if (hasSteam && bestEdge > 5) return 'HIGH';
  if (hasSteam || bestEdge > 8) return 'MEDIUM';
  if (bestEdge > 3) return 'LOW';
  return null;
}

/**
 * Simple probability estimate (calibrated quick model)
 * Used to calculate value edge vs market odds
 */
function calculateQuickProbability(
  homeOdds: number, 
  awayOdds: number, 
  drawOdds?: number
): { home: number; away: number; draw?: number } {
  // Convert to implied probabilities
  const impliedHome = 1 / homeOdds;
  const impliedAway = 1 / awayOdds;
  const impliedDraw = drawOdds ? 1 / drawOdds : 0;
  
  // Normalize and adjust (remove ~5% vig)
  const total = impliedHome + impliedAway + impliedDraw;
  const fairHome = impliedHome / total;
  const fairAway = impliedAway / total;
  const fairDraw = drawOdds ? impliedDraw / total : undefined;
  
  // Our model tends to favor strong teams slightly less than market
  // This creates natural value edge opportunities
  const homeStrength = 1 / homeOdds;
  const awayStrength = 1 / awayOdds;
  const strengthRatio = homeStrength / (homeStrength + awayStrength);
  
  // Regression toward the mean - reduce extreme favorites
  const regressionFactor = 0.15;
  let modelHome = fairHome * (1 - regressionFactor) + 0.4 * regressionFactor;
  let modelAway = fairAway * (1 - regressionFactor) + 0.4 * regressionFactor;
  
  // Slight underdog boost
  if (strengthRatio > 0.6) {
    modelAway += 0.02;
    modelHome -= 0.02;
  } else if (strengthRatio < 0.4) {
    modelHome += 0.02;
    modelAway -= 0.02;
  }
  
  // Normalize
  const modelTotal = modelHome + modelAway + (fairDraw || 0);
  
  return {
    home: Math.min(0.85, Math.max(0.08, modelHome / modelTotal)),
    away: Math.min(0.85, Math.max(0.08, modelAway / modelTotal)),
    draw: fairDraw ? Math.min(0.4, Math.max(0.05, (fairDraw || 0) / modelTotal)) : undefined,
  };
}

// ============================================
// MAIN CRON HANDLER
// ============================================

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[Poll-Odds] Starting odds polling cron job...');
  
  if (!theOddsClient.isConfigured()) {
    console.error('[Poll-Odds] Odds API not configured');
    return NextResponse.json({ error: 'Odds API not configured' }, { status: 500 });
  }
  
  const stats = {
    sportsPolled: 0,
    matchesProcessed: 0,
    snapshotsCreated: 0,
    snapshotsUpdated: 0,
    steamMovesDetected: 0,
    errors: [] as string[],
  };
  
  // Process each sport
  for (const sport of POLL_SPORTS) {
    try {
      console.log(`[Poll-Odds] Fetching odds for ${sport.key}...`);
      
      const oddsResponse = await theOddsClient.getOddsForSport(sport.key, {
        regions: ['eu', 'us'],
        markets: ['h2h'],
      });
      
      if (!oddsResponse.data || oddsResponse.data.length === 0) {
        console.log(`[Poll-Odds] No events found for ${sport.key}`);
        continue;
      }
      
      stats.sportsPolled++;
      
      // Filter to next 72 hours
      const now = new Date();
      const cutoff = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      
      const upcomingEvents = oddsResponse.data.filter(event => {
        const matchDate = new Date(event.commence_time);
        return matchDate >= now && matchDate <= cutoff;
      });
      
      console.log(`[Poll-Odds] Found ${upcomingEvents.length} upcoming events for ${sport.key}`);
      
      for (const event of upcomingEvents) {
        try {
          const consensus = getConsensusOdds(event);
          if (!consensus) continue;
          
          const matchRef = `${event.home_team} vs ${event.away_team}`;
          const matchDate = new Date(event.commence_time);
          
          // Get previous snapshot
          const prevSnapshot = await prisma.oddsSnapshot.findUnique({
            where: {
              matchRef_sport_bookmaker: {
                matchRef,
                sport: sport.key,
                bookmaker: 'consensus',
              },
            },
          });
          
          // Calculate changes
          const homeChange = calculateOddsChange(consensus.home, prevSnapshot?.homeOdds ?? null);
          const awayChange = calculateOddsChange(consensus.away, prevSnapshot?.awayOdds ?? null);
          const drawChange = consensus.draw && prevSnapshot?.drawOdds
            ? calculateOddsChange(consensus.draw, prevSnapshot.drawOdds)
            : undefined;
          
          // Detect steam moves
          const steam = detectSteamMove(homeChange, awayChange);
          
          // Calculate model probabilities and edges
          const modelProbs = calculateQuickProbability(
            consensus.home,
            consensus.away,
            consensus.draw
          );
          
          // Convert to percentages for consistency with pre-analyze
          // modelProbs returns decimals (0.40), convert to percentages (40)
          const modelHomeProb = modelProbs.home * 100;
          const modelAwayProb = modelProbs.away * 100;
          const modelDrawProb = modelProbs.draw ? modelProbs.draw * 100 : null;
          
          // Use percentage-based implied probabilities
          const impliedHome = (1 / consensus.home) * 100;
          const impliedAway = (1 / consensus.away) * 100;
          const impliedDraw = consensus.draw ? (1 / consensus.draw) * 100 : 0;
          
          // Edge = model probability - implied probability (both in percentage)
          const homeEdge = modelHomeProb - impliedHome;
          const awayEdge = modelAwayProb - impliedAway;
          const drawEdge = modelDrawProb && impliedDraw
            ? modelDrawProb - impliedDraw
            : undefined;
          
          // Determine best edge
          const edges: Array<{ outcome: 'home' | 'away' | 'draw'; edge: number }> = [
            { outcome: 'home', edge: homeEdge },
            { outcome: 'away', edge: awayEdge },
          ];
          if (drawEdge !== undefined) {
            edges.push({ outcome: 'draw', edge: drawEdge });
          }
          
          const bestEdge = edges.reduce((max, e) => e.edge > max.edge ? e : max, edges[0]);
          const hasValueEdge = bestEdge.edge > 3;
          
          // Get alert level
          const alertLevel = getAlertLevel(steam.hasSteam, bestEdge.edge);
          
          // Upsert snapshot
          const snapshotData = {
            matchRef,
            sport: sport.key,
            league: sport.league,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            matchDate,
            homeOdds: consensus.home,
            awayOdds: consensus.away,
            drawOdds: consensus.draw ?? null,
            prevHomeOdds: prevSnapshot?.homeOdds ?? null,
            prevAwayOdds: prevSnapshot?.awayOdds ?? null,
            prevDrawOdds: prevSnapshot?.drawOdds ?? null,
            homeChange: homeChange ?? null,
            awayChange: awayChange ?? null,
            drawChange: drawChange ?? null,
            modelHomeProb: modelHomeProb,  // Store as percentage (0-100)
            modelAwayProb: modelAwayProb,
            modelDrawProb: modelDrawProb,
            homeEdge,
            awayEdge,
            drawEdge: drawEdge ?? null,
            hasSteamMove: steam.hasSteam,
            hasValueEdge,
            alertLevel,
            alertNote: steam.note ?? null,
            bookmaker: 'consensus',
          };
          
          await prisma.oddsSnapshot.upsert({
            where: {
              matchRef_sport_bookmaker: {
                matchRef,
                sport: sport.key,
                bookmaker: 'consensus',
              },
            },
            update: snapshotData,
            create: snapshotData,
          });
          
          if (prevSnapshot) {
            stats.snapshotsUpdated++;
          } else {
            stats.snapshotsCreated++;
          }
          
          if (steam.hasSteam) {
            stats.steamMovesDetected++;
            console.log(`[Poll-Odds] 🔥 Steam move detected: ${matchRef} - ${steam.note}`);
          }
          
          stats.matchesProcessed++;
        } catch (eventError) {
          console.error(`[Poll-Odds] Error processing event:`, eventError);
          stats.errors.push(`${event.home_team} vs ${event.away_team}: ${eventError}`);
        }
      }
      
      console.log(`[Poll-Odds] Remaining API quota: ${oddsResponse.requestsRemaining}`);
      
    } catch (sportError) {
      console.error(`[Poll-Odds] Error fetching ${sport.key}:`, sportError);
      stats.errors.push(`${sport.key}: ${sportError}`);
    }
  }
  
  // Clean up old snapshots (matches > 24h ago)
  try {
    const cleanupCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deleted = await prisma.oddsSnapshot.deleteMany({
      where: {
        matchDate: { lt: cleanupCutoff },
      },
    });
    console.log(`[Poll-Odds] Cleaned up ${deleted.count} old snapshots`);
  } catch (cleanupError) {
    console.error('[Poll-Odds] Cleanup error:', cleanupError);
  }
  
  console.log('[Poll-Odds] Cron job complete:', stats);
  
  return NextResponse.json({
    success: true,
    stats,
    timestamp: new Date().toISOString(),
  });
}
