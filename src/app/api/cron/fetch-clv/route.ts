/**
 * Closing Line Value (CLV) Fetcher Cron Job
 * 
 * Fetches closing odds for predictions just before their kickoff time.
 * CLV = Closing Line Value - the most important metric to validate if our edge is real.
 * 
 * If closingProb > openingProb for our side, we're beating the market (positive CLV).
 * Sharp bettors aim for consistent +CLV - it proves genuine edge over the long term.
 * 
 * Schedule: Every hour (0 * * * *)
 * 
 * Process:
 * 1. Find predictions where kickoff is within next 2 hours and CLV not fetched
 * 2. Fetch current odds from The Odds API (these are "closing" for our purposes)
 * 3. Calculate CLV percentage and store it
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { theOddsClient } from '@/lib/theOdds';

export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

interface CLVResult {
  predictionId: string;
  matchName: string;
  openingOdds: number;
  closingOdds: number;
  clvPercentage: number;
  beatingMarket: boolean;
}

/**
 * Convert decimal odds to implied probability
 */
function oddsToProb(odds: number): number {
  if (odds <= 1) return 0;
  return 1 / odds;
}

/**
 * Convert implied probability to decimal odds
 */
function probToOdds(prob: number): number {
  if (prob <= 0 || prob >= 1) return 0;
  return 1 / prob;
}

/**
 * Calculate CLV percentage
 * Positive CLV = our side's closing prob > opening prob = we beat the market
 */
function calculateCLV(openingOdds: number, closingOdds: number): number {
  const openingProb = oddsToProb(openingOdds);
  const closingProb = oddsToProb(closingOdds);
  
  if (openingProb === 0) return 0;
  
  // CLV = (closingProb - openingProb) / openingProb * 100
  // Positive = market moved toward our side (good)
  // Negative = market moved away from our side (bad)
  return ((closingProb - openingProb) / openingProb) * 100;
}

/**
 * Get current odds for a match from The Odds API
 */
async function getCurrentOdds(sportKey: string, homeTeam: string, awayTeam: string): Promise<{
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
} | null> {
  try {
    // Fetch odds for the sport
    const { data } = await theOddsClient.getOddsForSport(sportKey, {
      regions: ['eu', 'uk'],
      markets: ['h2h'],
    });
    
    if (!data || data.length === 0) return null;
    
    // Find matching event
    const event = data.find(e => {
      const homeMatch = e.home_team.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0]) ||
                        homeTeam.toLowerCase().includes(e.home_team.toLowerCase().split(' ')[0]);
      const awayMatch = e.away_team.toLowerCase().includes(awayTeam.toLowerCase().split(' ')[0]) ||
                        awayTeam.toLowerCase().includes(e.away_team.toLowerCase().split(' ')[0]);
      return homeMatch && awayMatch;
    });
    
    if (!event || !event.bookmakers || event.bookmakers.length === 0) return null;
    
    // Use Pinnacle if available (sharpest book), otherwise first available
    const pinnacle = event.bookmakers.find(b => b.key === 'pinnacle');
    const bookmaker = pinnacle || event.bookmakers[0];
    
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2hMarket || !h2hMarket.outcomes) return null;
    
    const homeOutcome = h2hMarket.outcomes.find(o => 
      o.name.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0]) ||
      o.name.toLowerCase() === event.home_team.toLowerCase()
    );
    const awayOutcome = h2hMarket.outcomes.find(o => 
      o.name.toLowerCase().includes(awayTeam.toLowerCase().split(' ')[0]) ||
      o.name.toLowerCase() === event.away_team.toLowerCase()
    );
    const drawOutcome = h2hMarket.outcomes.find(o => o.name.toLowerCase() === 'draw');
    
    return {
      homeOdds: homeOutcome?.price || 0,
      drawOdds: drawOutcome?.price || 0,
      awayOdds: awayOutcome?.price || 0,
    };
  } catch (error) {
    console.error(`[Fetch-CLV] Error fetching odds for ${sportKey}:`, error);
    return null;
  }
}

/**
 * Extract prediction side from prediction text
 */
function getPredictionSide(prediction: string): 'home' | 'away' | 'draw' | null {
  const lower = prediction.toLowerCase();
  if (lower.includes('home win') || lower.includes('home -')) return 'home';
  if (lower.includes('away win') || lower.includes('away -')) return 'away';
  if (lower.includes('draw')) return 'draw';
  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');
    
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const startTime = Date.now();
    console.log('[Fetch-CLV] Starting CLV fetch...');
    
    // Find predictions where:
    // 1. Kickoff is within next 2 hours (closing line time)
    // 2. CLV hasn't been fetched yet
    // 3. We have opening odds stored
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    const predictionsToFetch = await prisma.prediction.findMany({
      where: {
        kickoff: {
          gte: now,
          lte: twoHoursFromNow,
        },
        clvFetched: false,
        openingOdds: { not: null },
        outcome: 'PENDING',
      },
      take: 20, // Limit to avoid API quota issues
      orderBy: { kickoff: 'asc' },
    });
    
    console.log(`[Fetch-CLV] Found ${predictionsToFetch.length} predictions needing CLV fetch`);
    
    const results: CLVResult[] = [];
    let updated = 0;
    let errors = 0;
    
    for (const pred of predictionsToFetch) {
      try {
        // Parse teams from matchName
        const [homeTeam, awayTeam] = pred.matchName.split(' vs ').map(t => t.trim());
        if (!homeTeam || !awayTeam) {
          console.log(`[Fetch-CLV] Invalid match name format: ${pred.matchName}`);
          continue;
        }
        
        // Get current odds
        const currentOdds = await getCurrentOdds(pred.sport, homeTeam, awayTeam);
        
        if (!currentOdds) {
          console.log(`[Fetch-CLV] Could not fetch odds for: ${pred.matchName}`);
          // Mark as fetched to avoid repeated attempts
          await prisma.prediction.update({
            where: { id: pred.id },
            data: { clvFetched: true },
          });
          continue;
        }
        
        // Determine which side we predicted
        const side = getPredictionSide(pred.prediction);
        if (!side) {
          console.log(`[Fetch-CLV] Could not determine side for: ${pred.prediction}`);
          continue;
        }
        
        // Get closing odds for our predicted side
        const closingOdds = side === 'home' ? currentOdds.homeOdds :
                           side === 'away' ? currentOdds.awayOdds :
                           currentOdds.drawOdds;
        
        if (closingOdds <= 1 || !pred.openingOdds) {
          console.log(`[Fetch-CLV] Invalid odds for ${pred.matchName}`);
          continue;
        }
        
        // Calculate CLV
        const clvPercentage = calculateCLV(pred.openingOdds, closingOdds);
        
        // Update prediction with CLV data
        await prisma.prediction.update({
          where: { id: pred.id },
          data: {
            closingOdds,
            clvPercentage,
            clvFetched: true,
          },
        });
        
        const result: CLVResult = {
          predictionId: pred.id,
          matchName: pred.matchName,
          openingOdds: pred.openingOdds,
          closingOdds,
          clvPercentage,
          beatingMarket: clvPercentage > 0,
        };
        
        results.push(result);
        updated++;
        
        const emoji = clvPercentage > 0 ? '✅' : clvPercentage < -2 ? '❌' : '➖';
        console.log(`[Fetch-CLV] ${emoji} ${pred.matchName}: ${pred.openingOdds.toFixed(2)} → ${closingOdds.toFixed(2)} (CLV: ${clvPercentage.toFixed(1)}%)`);
        
        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`[Fetch-CLV] Error processing ${pred.matchName}:`, error);
        errors++;
      }
    }
    
    // Calculate aggregate stats
    const avgCLV = results.length > 0 
      ? results.reduce((sum, r) => sum + r.clvPercentage, 0) / results.length 
      : 0;
    const positiveCLV = results.filter(r => r.beatingMarket).length;
    
    console.log(`[Fetch-CLV] Completed in ${Date.now() - startTime}ms`);
    console.log(`[Fetch-CLV] Summary: ${updated} updated, ${positiveCLV}/${results.length} positive CLV, avg: ${avgCLV.toFixed(1)}%`);
    
    return NextResponse.json({
      success: true,
      processed: predictionsToFetch.length,
      updated,
      errors,
      avgCLV: avgCLV.toFixed(2),
      positiveCLVRate: results.length > 0 ? (positiveCLV / results.length * 100).toFixed(1) : '0',
      results,
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    console.error('[Fetch-CLV] Error:', error);
    return NextResponse.json(
      { error: 'CLV fetch failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
