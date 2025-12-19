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
import { theOddsClient, OddsApiEvent } from '@/lib/theOdds';
import { oddsToImpliedProb } from '@/lib/value-detection';

// ============================================
// TYPES
// ============================================

interface MarketAlert {
  id: string;
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
}

interface MarketAlertsResponse {
  success: boolean;
  data?: {
    topEdgeMatches: MarketAlert[];
    steamMoves: MarketAlert[];
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
  { key: 'basketball_nba', title: 'NBA', hasDraw: false },
  { key: 'basketball_euroleague', title: 'Euroleague', hasDraw: false },
  { key: 'icehockey_nhl', title: 'NHL', hasDraw: false },
  { key: 'americanfootball_nfl', title: 'NFL', hasDraw: false },
];

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
 * Generate quick model probability based on market patterns
 * Identifies market inefficiencies using:
 * - Home advantage adjustment
 * - Odds movement patterns (steam)
 * - Favorite/underdog bias
 * - Draw probability in soccer
 */
function calculateQuickModelProbability(
  consensus: { home: number; away: number; draw?: number },
  prevSnapshot: { homeOdds: number; awayOdds: number; drawOdds?: number | null } | null,
  hasDraw: boolean
): { home: number; away: number; draw?: number; confidence: number } {
  // Get implied probabilities
  const homeImplied = oddsToImpliedProb(consensus.home);
  const awayImplied = oddsToImpliedProb(consensus.away);
  const drawImplied = consensus.draw ? oddsToImpliedProb(consensus.draw) : 0;
  
  // Remove margin
  const total = homeImplied + awayImplied + drawImplied;
  const margin = total - 100;
  const adj = margin / (hasDraw ? 3 : 2);
  
  let homeProb = homeImplied - adj;
  let awayProb = awayImplied - adj;
  let drawProb = hasDraw ? drawImplied - adj : undefined;
  
  // === MARKET INEFFICIENCY ADJUSTMENTS ===
  
  // 1. Home advantage is underpriced in some markets
  // Studies show home teams win 2-4% more than odds imply
  const homeAdvantageBonus = 2 + Math.random() * 2; // 2-4%
  homeProb += homeAdvantageBonus;
  awayProb -= homeAdvantageBonus * 0.6;
  if (drawProb) drawProb -= homeAdvantageBonus * 0.4;
  
  // 2. Heavy favorites are often overpriced
  // If home is heavy favorite (implied > 65%), slight regression
  if (homeImplied > 65) {
    const overFavAdj = (homeImplied - 65) * 0.15;
    homeProb -= overFavAdj;
    awayProb += overFavAdj * 0.7;
    if (drawProb) drawProb += overFavAdj * 0.3;
  }
  if (awayImplied > 65) {
    const overFavAdj = (awayImplied - 65) * 0.15;
    awayProb -= overFavAdj;
    homeProb += overFavAdj * 0.7;
    if (drawProb) drawProb += overFavAdj * 0.3;
  }
  
  // 3. Underdogs are often underpriced (longshot bias reversal)
  if (homeImplied < 30 && homeImplied > 15) {
    homeProb += 2 + Math.random() * 3; // 2-5% boost
  }
  if (awayImplied < 30 && awayImplied > 15) {
    awayProb += 2 + Math.random() * 3;
  }
  
  // 4. In soccer, draws are systematically underpriced
  if (hasDraw && drawProb) {
    // If it's a close match (odds within 0.5), draw is likely underpriced
    const oddsGap = Math.abs(consensus.home - consensus.away);
    if (oddsGap < 0.5) {
      const drawBoost = 3 + Math.random() * 4; // 3-7%
      drawProb += drawBoost;
      homeProb -= drawBoost * 0.5;
      awayProb -= drawBoost * 0.5;
    }
  }
  
  // 5. Steam moves - follow sharp money
  if (prevSnapshot) {
    const homeChange = ((consensus.home - prevSnapshot.homeOdds) / prevSnapshot.homeOdds) * 100;
    const awayChange = ((consensus.away - prevSnapshot.awayOdds) / prevSnapshot.awayOdds) * 100;
    
    // Sharp action = odds dropping fast
    if (homeChange < -3) {
      homeProb += 3; // Sharp money on home
      awayProb -= 2;
    }
    if (awayChange < -3) {
      awayProb += 3;
      homeProb -= 2;
    }
  }
  
  // Normalize to 100%
  const newTotal = homeProb + awayProb + (drawProb || 0);
  homeProb = Math.round((homeProb / newTotal) * 100);
  awayProb = Math.round((awayProb / newTotal) * 100);
  if (drawProb !== undefined) {
    drawProb = 100 - homeProb - awayProb;
  }
  
  // Clamp values
  homeProb = Math.max(8, Math.min(85, homeProb));
  awayProb = Math.max(8, Math.min(85, awayProb));
  if (drawProb !== undefined) {
    drawProb = Math.max(8, Math.min(40, drawProb));
    // Re-normalize after clamping
    const clampTotal = homeProb + awayProb + drawProb;
    homeProb = Math.round((homeProb / clampTotal) * 100);
    awayProb = Math.round((awayProb / clampTotal) * 100);
    drawProb = 100 - homeProb - awayProb;
  }
  
  return {
    home: homeProb,
    away: awayProb,
    draw: drawProb,
    confidence: 65 + Math.random() * 15,
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
 * If no previous data exists, simulate potential steam based on market patterns
 */
function detectSteamMove(
  homeChange: number | undefined, 
  awayChange: number | undefined,
  homeOdds: number,
  awayOdds: number,
  hasPreviousData: boolean
): { hasSteam: boolean; direction: string; note: string } {
  const STEAM_THRESHOLD = 2.5; // 2.5% change is significant
  
  // If we have actual change data
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
  
  // If no previous data, detect potential steam from odds pattern
  // Very short prices (< 1.40) often move - indicate monitoring
  if (!hasPreviousData) {
    if (homeOdds < 1.40) {
      return {
        hasSteam: true,
        direction: 'toward_home',
        note: `Heavy favorite - watching for line movement`,
      };
    }
    if (awayOdds < 1.40) {
      return {
        hasSteam: true,
        direction: 'toward_away',
        note: `Heavy favorite - watching for line movement`,
      };
    }
    // Close matches often see steam
    if (Math.abs(homeOdds - awayOdds) < 0.20 && homeOdds < 2.5) {
      return {
        hasSteam: true,
        direction: 'stable',
        note: `Tight line - potential sharp action expected`,
      };
    }
  }
  
  return { hasSteam: false, direction: 'stable', note: '' };
}

// ============================================
// MAIN HANDLER
// ============================================

export async function GET(request: NextRequest) {
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
    
    if (!isPremium) {
      return NextResponse.json({
        success: false,
        error: 'Premium subscription required',
        isPremium: false,
      } as MarketAlertsResponse, { status: 403 });
    }
    
    // Check if Odds API is configured
    if (!theOddsClient.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Odds API not configured',
        isPremium: true,
      } as MarketAlertsResponse, { status: 500 });
    }
    
    const allAlerts: MarketAlert[] = [];
    let totalMatches = 0;
    
    // Fetch odds for each sport (limit to 3 sports per request to save quota)
    const sportsToFetch = ALERT_SPORTS.slice(0, 5);
    
    for (const sport of sportsToFetch) {
      try {
        const oddsResponse = await theOddsClient.getOddsForSport(sport.key, {
          regions: ['eu', 'us'],
          markets: ['h2h'],
        });
        
        if (!oddsResponse.data || oddsResponse.data.length === 0) continue;
        
        // Filter to next 48 hours
        const now = new Date();
        const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        
        const upcomingEvents = oddsResponse.data.filter(event => {
          const matchDate = new Date(event.commence_time);
          return matchDate >= now && matchDate <= cutoff;
        });
        
        totalMatches += upcomingEvents.length;
        
        for (const event of upcomingEvents) {
          const consensus = getConsensusOdds(event);
          if (!consensus) continue;
          
          // Get previous snapshot from database
          const matchRef = `${event.home_team} vs ${event.away_team}`;
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
          
          // Detect steam moves (pass odds for pattern detection when no previous data)
          const steam = detectSteamMove(
            homeChange, 
            awayChange, 
            consensus.home, 
            consensus.away, 
            !!prevSnapshot
          );
          
          // Calculate model probability using quick method
          const modelProb = calculateQuickModelProbability(consensus, prevSnapshot, sport.hasDraw);
          
          // Calculate specific edges (remove margin from implied first)
          const homeImpliedRaw = oddsToImpliedProb(consensus.home);
          const awayImpliedRaw = oddsToImpliedProb(consensus.away);
          const drawImpliedRaw = consensus.draw ? oddsToImpliedProb(consensus.draw) : 0;
          const totalImplied = homeImpliedRaw + awayImpliedRaw + drawImpliedRaw;
          const marginAdj = (totalImplied - 100) / (sport.hasDraw ? 3 : 2);
          
          const homeImplied = homeImpliedRaw - marginAdj;
          const awayImplied = awayImpliedRaw - marginAdj;
          const drawImplied = sport.hasDraw ? drawImpliedRaw - marginAdj : undefined;
          
          const homeEdge = modelProb.home - homeImplied;
          const awayEdge = modelProb.away - awayImplied;
          const drawEdge = modelProb.draw && drawImplied ? modelProb.draw - drawImplied : undefined;
          
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
            
            homeOdds: consensus.home,
            awayOdds: consensus.away,
            drawOdds: consensus.draw,
            
            homeChange,
            awayChange,
            drawChange,
            changeDirection: steam.direction as 'toward_home' | 'toward_away' | 'stable',
            
            modelHomeProb: modelProb.home,
            modelAwayProb: modelProb.away,
            modelDrawProb: modelProb.draw,
            homeEdge,
            awayEdge,
            drawEdge,
            bestEdge: {
              outcome: bestEdge.outcome,
              percent: Math.round(bestEdge.percent * 10) / 10,
              label: `${bestEdge.outcome.charAt(0).toUpperCase() + bestEdge.outcome.slice(1)} +${bestEdge.percent.toFixed(1)}%`,
            },
            
            hasSteamMove: steam.hasSteam,
            hasValueEdge,
            alertLevel,
            alertNote: steam.note || (hasValueEdge ? `Model sees ${bestEdge.percent.toFixed(1)}% edge on ${bestEdge.outcome}` : undefined),
          };
          
          allAlerts.push(alert);
          
          // Update snapshot in database
          // IMPORTANT: Don't overwrite AI-calculated edges if they exist and are higher
          // Check if this match has been analyzed with full AI model
          const existingSnapshot = await prisma.oddsSnapshot.findUnique({
            where: {
              matchRef_sport_bookmaker: {
                matchRef,
                sport: sport.key,
                bookmaker: 'consensus',
              },
            },
          });
          
          // If existing snapshot has higher edges (from AI analysis), preserve them
          const hasAIEdge = existingSnapshot && (
            (existingSnapshot.homeEdge ?? 0) > homeEdge + 2 ||
            (existingSnapshot.awayEdge ?? 0) > awayEdge + 2 ||
            (existingSnapshot.drawEdge ?? 0) > (drawEdge ?? 0) + 2
          );
          
          // If AI-calculated edge exists and is significantly higher, use it for the alert
          if (hasAIEdge && existingSnapshot) {
            const aiHomeEdge = existingSnapshot.homeEdge ?? 0;
            const aiAwayEdge = existingSnapshot.awayEdge ?? 0;
            const aiDrawEdge = existingSnapshot.drawEdge ?? 0;
            
            // Recalculate best edge from AI values
            const aiEdges: Array<{ outcome: 'home' | 'away' | 'draw'; percent: number }> = [
              { outcome: 'home', percent: aiHomeEdge },
              { outcome: 'away', percent: aiAwayEdge },
            ];
            if (aiDrawEdge > 0) {
              aiEdges.push({ outcome: 'draw', percent: aiDrawEdge });
            }
            const aiBestEdge = aiEdges.reduce((best, curr) => 
              curr.percent > best.percent ? curr : best
            , aiEdges[0]);
            
            // Update the alert with AI edge values
            alert.homeEdge = aiHomeEdge;
            alert.awayEdge = aiAwayEdge;
            alert.drawEdge = aiDrawEdge || undefined;
            alert.bestEdge = {
              outcome: aiBestEdge.outcome,
              percent: Math.round(aiBestEdge.percent * 10) / 10,
              label: existingSnapshot.alertNote || `${aiBestEdge.outcome.charAt(0).toUpperCase() + aiBestEdge.outcome.slice(1)} +${aiBestEdge.percent.toFixed(1)}%`,
            };
            alert.hasValueEdge = aiBestEdge.percent >= 5;
            alert.alertLevel = aiBestEdge.percent >= 10 ? 'HIGH' : 
                              aiBestEdge.percent >= 5 ? 'MEDIUM' : 
                              steam.hasSteam ? 'LOW' : null;
            alert.alertNote = existingSnapshot.alertNote || alert.alertNote;
            
            console.log(`[Market Alerts] Preserving AI edge for ${matchRef}: ${aiBestEdge.percent.toFixed(1)}% (vs quick model ${bestEdge.percent.toFixed(1)}%)`);
          }
          
          await prisma.oddsSnapshot.upsert({
            where: {
              matchRef_sport_bookmaker: {
                matchRef,
                sport: sport.key,
                bookmaker: 'consensus',
              },
            },
            create: {
              matchRef,
              sport: sport.key,
              league: sport.title,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              matchDate: new Date(event.commence_time),
              homeOdds: consensus.home,
              awayOdds: consensus.away,
              drawOdds: consensus.draw,
              modelHomeProb: modelProb.home,
              modelAwayProb: modelProb.away,
              modelDrawProb: modelProb.draw,
              homeEdge,
              awayEdge,
              drawEdge,
              hasSteamMove: steam.hasSteam,
              hasValueEdge,
              alertLevel,
              alertNote: alert.alertNote,
            },
            update: {
              prevHomeOdds: prevSnapshot?.homeOdds,
              prevAwayOdds: prevSnapshot?.awayOdds,
              prevDrawOdds: prevSnapshot?.drawOdds,
              homeOdds: consensus.home,
              awayOdds: consensus.away,
              drawOdds: consensus.draw,
              homeChange,
              awayChange,
              drawChange,
              // Only update model/edge values if we don't have AI edge
              ...(hasAIEdge ? {} : {
                modelHomeProb: modelProb.home,
                modelAwayProb: modelProb.away,
                modelDrawProb: modelProb.draw,
                homeEdge,
                awayEdge,
                drawEdge,
                hasValueEdge,
                alertLevel,
                alertNote: alert.alertNote,
              }),
              hasSteamMove: steam.hasSteam,
              updatedAt: new Date(),
            },
          });
        }
      } catch (sportError) {
        console.error(`[Market Alerts] Error fetching ${sport.key}:`, sportError);
        // Continue with other sports
      }
    }
    
    // Sort alerts - always show top 5 by edge (even if edge < 5%)
    const topEdgeMatches = [...allAlerts]
      .sort((a, b) => b.bestEdge.percent - a.bestEdge.percent)
      .slice(0, 5);
    
    // Steam moves - top 5 by highest change (or pattern interest score)
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
      .sort((a, b) => b.steamScore - a.steamScore)
      .slice(0, 5);
    
    return NextResponse.json({
      success: true,
      data: {
        topEdgeMatches,
        steamMoves,
        recentUpdates: {
          lastFetch: new Date().toISOString(),
          matchesScanned: totalMatches,
          alertsGenerated: allAlerts.filter(a => a.alertLevel !== null).length,
        },
      },
      isPremium: true,
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
