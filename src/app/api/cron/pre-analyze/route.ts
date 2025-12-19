/**
 * Pre-Analyze Matches Cron Job
 * 
 * Runs daily to pre-analyze ALL upcoming matches across major sports.
 * This ensures:
 * 1. INSTANT loading for all users (pre-warmed cache)
 * 2. Consistent edges between Market Alerts and Analyzer (same AI model)
 * 3. Reduced per-user API costs (analysis done once, shared)
 * 
 * Process:
 * 1. Fetch all upcoming events from The Odds API (next 48 hours)
 * 2. Generate matchId for each event
 * 3. Call match-preview API internally to run AI analysis
 * 4. Cache results in Redis + update OddsSnapshot with real AI edges
 * 
 * Schedule: Daily at 6 AM UTC (0 6 * * *)
 * Also can be triggered manually: GET /api/cron/pre-analyze?secret=xxx
 * 
 * Quota usage: ~5 API calls for events (free) + ~5 for odds
 * AI usage: ~50-100 analyses per day (gpt-4o-mini)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { theOddsClient, OddsApiEvent } from '@/lib/theOdds';
import { cacheSet, CACHE_TTL, CACHE_KEYS } from '@/lib/cache';
import { analyzeMarket, type MarketIntel, type OddsData } from '@/lib/value-detection';
import { getEnrichedMatchDataV2, normalizeSport } from '@/lib/data-layer/bridge';
import { getEnrichedMatchData, getMatchInjuries, getMatchGoalTiming, getMatchKeyPlayers, getFixtureReferee, getMatchFixtureInfo } from '@/lib/football-api';
import { normalizeToUniversalSignals, formatSignalsForAI, getSignalSummary, type RawMatchInput } from '@/lib/universal-signals';
import { ANALYSIS_PERSONALITY } from '@/lib/sportbot-brain';
import OpenAI from 'openai';

export const maxDuration = 300; // 5 minute timeout for batch processing

const CRON_SECRET = process.env.CRON_SECRET;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sports to pre-analyze
const PRE_ANALYZE_SPORTS = [
  { key: 'soccer_epl', title: 'EPL', league: 'Premier League', hasDraw: true },
  { key: 'soccer_spain_la_liga', title: 'La Liga', league: 'La Liga', hasDraw: true },
  { key: 'soccer_germany_bundesliga', title: 'Bundesliga', league: 'Bundesliga', hasDraw: true },
  { key: 'soccer_italy_serie_a', title: 'Serie A', league: 'Serie A', hasDraw: true },
  { key: 'soccer_france_ligue_one', title: 'Ligue 1', league: 'Ligue 1', hasDraw: true },
  { key: 'basketball_nba', title: 'NBA', league: 'NBA', hasDraw: false },
  { key: 'americanfootball_nfl', title: 'NFL', league: 'NFL', hasDraw: false },
  { key: 'icehockey_nhl', title: 'NHL', league: 'NHL', hasDraw: false },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get consensus odds from bookmakers
 */
function getConsensusOdds(event: OddsApiEvent): { home: number; away: number; draw?: number } | null {
  if (!event.bookmakers || event.bookmakers.length === 0) return null;
  
  let homeTotal = 0, awayTotal = 0, drawTotal = 0;
  let homeCount = 0, awayCount = 0, drawCount = 0;
  
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
 * Generate matchId (base64 encoded match data)
 */
function generateMatchId(event: OddsApiEvent, sportKey: string, league: string): string {
  const matchData = {
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    sport: sportKey,
    league: league,
    kickoff: event.commence_time,
  };
  return Buffer.from(JSON.stringify(matchData)).toString('base64');
}

/**
 * Quick AI analysis for pre-caching
 * Simplified version focused on getting probabilities and story
 */
async function runQuickAnalysis(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  league: string,
  odds: { home: number; away: number; draw?: number },
  kickoff: string
): Promise<{
  story: { verdict: string; narrative: string; confidence: number };
  probabilities: { home: number; away: number; draw?: number };
  signals: any;
  marketIntel: MarketIntel | null;
} | null> {
  try {
    // Determine if soccer or other sport
    const isNonSoccer = !sport.startsWith('soccer_');
    
    // Get enriched match data
    let enrichedData: any;
    
    if (isNonSoccer) {
      enrichedData = await getEnrichedMatchDataV2(homeTeam, awayTeam, sport, league);
    } else {
      enrichedData = await getEnrichedMatchData(homeTeam, awayTeam, league);
    }
    
    // Build form strings
    const homeFormStr = enrichedData.homeForm?.map((m: any) => m.result).join('') || '-----';
    const awayFormStr = enrichedData.awayForm?.map((m: any) => m.result).join('') || '-----';
    
    // Create raw match input for signals (matching RawMatchInput interface)
    const rawInput: RawMatchInput = {
      sport: sport.includes('soccer') ? 'soccer' : 
             sport.includes('basketball') ? 'basketball' :
             sport.includes('american') ? 'nfl' :
             sport.includes('hockey') ? 'hockey' : 'other',
      homeTeam,
      awayTeam,
      homeForm: homeFormStr,
      awayForm: awayFormStr,
      homeStats: {
        played: enrichedData.homeStats?.played || 0,
        wins: enrichedData.homeStats?.wins || 0,
        draws: enrichedData.homeStats?.draws || 0,
        losses: enrichedData.homeStats?.losses || 0,
        scored: enrichedData.homeStats?.goalsScored || enrichedData.homeStats?.pointsScored || 0,
        conceded: enrichedData.homeStats?.goalsConceded || enrichedData.homeStats?.pointsConceded || 0,
      },
      awayStats: {
        played: enrichedData.awayStats?.played || 0,
        wins: enrichedData.awayStats?.wins || 0,
        draws: enrichedData.awayStats?.draws || 0,
        losses: enrichedData.awayStats?.losses || 0,
        scored: enrichedData.awayStats?.goalsScored || enrichedData.awayStats?.pointsScored || 0,
        conceded: enrichedData.awayStats?.goalsConceded || enrichedData.awayStats?.pointsConceded || 0,
      },
      h2h: {
        total: enrichedData.h2h?.total || 0,
        homeWins: enrichedData.h2h?.homeWins || 0,
        awayWins: enrichedData.h2h?.awayWins || 0,
        draws: enrichedData.h2h?.draws || 0,
      },
    };
    
    // Normalize to universal signals
    const signals = normalizeToUniversalSignals(rawInput);
    const signalsSummary = getSignalSummary(signals);
    
    // Build AI prompt (simplified)
    const prompt = `Analyze this ${league} match: ${homeTeam} vs ${awayTeam}

ODDS: Home ${odds.home} | Away ${odds.away}${odds.draw ? ` | Draw ${odds.draw}` : ''}

FORM: ${homeTeam}: ${homeFormStr} | ${awayTeam}: ${awayFormStr}

SIGNALS SUMMARY: ${signalsSummary}

Provide analysis as JSON:
{
  "probabilities": { "home": 0.XX, "away": 0.XX${odds.draw ? ', "draw": 0.XX' : ''} },
  "verdict": "Who wins and why (1 sentence)",
  "narrative": "Key insight (2-3 sentences)",
  "confidence": 1-10
}

Base probabilities on form, signals, and market odds. Be analytical, not promotional.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ANALYSIS_PERSONALITY },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });
    
    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    // Build market intel
    const oddsData: OddsData = {
      homeOdds: odds.home,
      awayOdds: odds.away,
      drawOdds: odds.draw,
    };
    
    const marketIntel = analyzeMarket(oddsData, {
      homeWinProb: aiResponse.probabilities?.home || 0.33,
      drawProb: aiResponse.probabilities?.draw || (odds.draw ? 0.25 : 0),
      awayWinProb: aiResponse.probabilities?.away || 0.33,
    });
    
    return {
      story: {
        verdict: aiResponse.verdict || `${homeTeam} vs ${awayTeam} preview`,
        narrative: aiResponse.narrative || 'Analysis not available.',
        confidence: aiResponse.confidence || 5,
      },
      probabilities: aiResponse.probabilities || { home: 0.33, away: 0.33, draw: 0.34 },
      signals,
      marketIntel,
    };
  } catch (error) {
    console.error(`[Pre-Analyze] AI analysis failed for ${homeTeam} vs ${awayTeam}:`, error);
    return null;
  }
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
  
  console.log('[Pre-Analyze] Starting daily pre-analysis cron job...');
  
  if (!theOddsClient.isConfigured()) {
    console.error('[Pre-Analyze] Odds API not configured');
    return NextResponse.json({ error: 'Odds API not configured' }, { status: 500 });
  }
  
  const stats = {
    sportsProcessed: 0,
    matchesFound: 0,
    matchesAnalyzed: 0,
    cacheWrites: 0,
    oddsSnapshotUpdates: 0,
    errors: [] as string[],
    analyzedMatches: [] as string[],
  };
  
  // Process each sport
  for (const sport of PRE_ANALYZE_SPORTS) {
    try {
      console.log(`[Pre-Analyze] Fetching events for ${sport.key}...`);
      
      // Get odds (includes events)
      const oddsResponse = await theOddsClient.getOddsForSport(sport.key, {
        regions: ['eu', 'us'],
        markets: ['h2h'],
      });
      
      if (!oddsResponse.data || oddsResponse.data.length === 0) {
        console.log(`[Pre-Analyze] No events for ${sport.key}`);
        continue;
      }
      
      stats.sportsProcessed++;
      
      // Filter to next 48 hours
      const now = new Date();
      const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      
      const upcomingEvents = oddsResponse.data.filter(event => {
        const matchDate = new Date(event.commence_time);
        return matchDate >= now && matchDate <= cutoff;
      });
      
      console.log(`[Pre-Analyze] Found ${upcomingEvents.length} upcoming events for ${sport.key}`);
      stats.matchesFound += upcomingEvents.length;
      
      // Limit to prevent timeout (max 10 per sport)
      const eventsToProcess = upcomingEvents.slice(0, 10);
      
      for (const event of eventsToProcess) {
        try {
          const consensus = getConsensusOdds(event);
          if (!consensus) {
            console.log(`[Pre-Analyze] No odds for ${event.home_team} vs ${event.away_team}`);
            continue;
          }
          
          const matchRef = `${event.home_team} vs ${event.away_team}`;
          const matchDate = new Date(event.commence_time).toISOString().split('T')[0];
          const cacheKey = CACHE_KEYS.matchPreview(
            event.home_team, 
            event.away_team, 
            sport.key, 
            matchDate
          );
          
          console.log(`[Pre-Analyze] Analyzing: ${matchRef}...`);
          
          // Run AI analysis
          const analysis = await runQuickAnalysis(
            event.home_team,
            event.away_team,
            sport.key,
            sport.league,
            consensus,
            event.commence_time
          );
          
          if (!analysis) {
            stats.errors.push(`${matchRef}: Analysis failed`);
            continue;
          }
          
          stats.matchesAnalyzed++;
          stats.analyzedMatches.push(matchRef);
          
          // Build full response for cache
          const cacheResponse = {
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            sport: sport.key,
            league: sport.league,
            kickoff: event.commence_time,
            story: analysis.story,
            signals: analysis.signals,
            probabilities: analysis.probabilities,
            marketIntel: analysis.marketIntel,
            odds: {
              homeOdds: consensus.home,
              awayOdds: consensus.away,
              drawOdds: consensus.draw,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
            },
            preAnalyzed: true,
            preAnalyzedAt: new Date().toISOString(),
          };
          
          // Cache the response
          try {
            await cacheSet(cacheKey, cacheResponse, CACHE_TTL.MATCH_PREVIEW);
            stats.cacheWrites++;
            console.log(`[Pre-Analyze] Cached: ${matchRef}`);
          } catch (cacheError) {
            console.error(`[Pre-Analyze] Cache write failed:`, cacheError);
          }
          
          // Update OddsSnapshot with real AI edge
          try {
            const probs = analysis.probabilities;
            const impliedHome = 1 / consensus.home;
            const impliedAway = 1 / consensus.away;
            const impliedDraw = consensus.draw ? 1 / consensus.draw : 0;
            
            const homeEdge = (probs.home - impliedHome) * 100;
            const awayEdge = (probs.away - impliedAway) * 100;
            const drawEdge = probs.draw ? (probs.draw - impliedDraw) * 100 : null;
            
            const bestEdge = Math.max(homeEdge, awayEdge, drawEdge || 0);
            const alertLevel = bestEdge > 10 ? 'HIGH' : bestEdge > 5 ? 'MEDIUM' : bestEdge > 3 ? 'LOW' : null;
            
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
                league: sport.league,
                homeTeam: event.home_team,
                awayTeam: event.away_team,
                matchDate: new Date(event.commence_time),
                homeOdds: consensus.home,
                awayOdds: consensus.away,
                drawOdds: consensus.draw ?? null,
                modelHomeProb: probs.home,
                modelAwayProb: probs.away,
                modelDrawProb: probs.draw ?? null,
                homeEdge,
                awayEdge,
                drawEdge,
                hasValueEdge: bestEdge >= 5,
                alertLevel,
                alertNote: analysis.marketIntel?.valueEdge?.label || null,
                bookmaker: 'consensus',
              },
              update: {
                homeOdds: consensus.home,
                awayOdds: consensus.away,
                drawOdds: consensus.draw ?? null,
                modelHomeProb: probs.home,
                modelAwayProb: probs.away,
                modelDrawProb: probs.draw ?? null,
                homeEdge,
                awayEdge,
                drawEdge,
                hasValueEdge: bestEdge >= 5,
                alertLevel,
                alertNote: analysis.marketIntel?.valueEdge?.label || null,
                updatedAt: new Date(),
              },
            });
            
            stats.oddsSnapshotUpdates++;
            console.log(`[Pre-Analyze] OddsSnapshot updated: ${matchRef} (${bestEdge.toFixed(1)}% edge)`);
          } catch (dbError) {
            console.error(`[Pre-Analyze] OddsSnapshot update failed:`, dbError);
          }
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (eventError) {
          const errorMsg = eventError instanceof Error ? eventError.message : 'Unknown error';
          stats.errors.push(`${event.home_team} vs ${event.away_team}: ${errorMsg}`);
          console.error(`[Pre-Analyze] Event error:`, eventError);
        }
      }
      
      console.log(`[Pre-Analyze] API quota remaining: ${oddsResponse.requestsRemaining}`);
      
    } catch (sportError) {
      const errorMsg = sportError instanceof Error ? sportError.message : 'Unknown error';
      stats.errors.push(`${sport.key}: ${errorMsg}`);
      console.error(`[Pre-Analyze] Sport error for ${sport.key}:`, sportError);
    }
  }
  
  console.log('[Pre-Analyze] Cron job complete:', stats);
  
  return NextResponse.json({
    success: true,
    stats,
    timestamp: new Date().toISOString(),
  });
}
