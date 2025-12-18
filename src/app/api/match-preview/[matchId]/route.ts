/**
 * Match Preview API - V3
 * 
 * Generates comprehensive match analysis using Universal Signals Framework:
 * - 5 Normalized Signals (Form, Edge, Tempo, Efficiency, Availability)
 * - AI Match Story (verdict + narrative)
 * - Clean JSON for AI consumption
 * 
 * No raw stats exposed. Same UI across ALL sports.
 * 
 * ANONYMOUS USER HANDLING:
 * - Unregistered users get pre-generated demo analyses (zero API cost)
 * - Registered users get real-time AI analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEnrichedMatchData, getMatchInjuries, getMatchGoalTiming, getMatchKeyPlayers, getFixtureReferee, getMatchFixtureInfo } from '@/lib/football-api';
import { getEnrichedMatchDataV2, normalizeSport } from '@/lib/data-layer/bridge';
import { normalizeToUniversalSignals, formatSignalsForAI, getSignalSummary, type RawMatchInput } from '@/lib/universal-signals';
import { analyzeMarket, type MarketIntel, type OddsData } from '@/lib/value-detection';
import { getDataLayer } from '@/lib/data-layer';
import { findMatchingDemo, getRandomFeaturedDemo, type DemoMatch } from '@/lib/demo-matches';
import { ANALYSIS_PERSONALITY } from '@/lib/sportbot-brain';
import OpenAI from 'openai';

// Allow longer execution time for multi-API calls (NBA, NFL, etc.)
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RouteParams {
  params: Promise<{ matchId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  try {
    // ==========================================
    // CHECK SESSION FIRST - Fast path for anonymous users
    // ==========================================
    const session = await getServerSession(authOptions);
    const isAnonymous = !session?.user;
    
    const { matchId } = await params;
    console.log(`[Match-Preview] Starting preview for: ${matchId.substring(0, 50)}... (anonymous: ${isAnonymous}, user: ${session?.user?.email || 'none'})`);

    // Parse match ID to extract teams
    const matchInfo = parseMatchId(matchId);
    
    if (!matchInfo) {
      console.error(`[Match-Preview] Failed to parse matchId: ${matchId}`);
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    console.log(`[Match-Preview] Parsed match: ${matchInfo.homeTeam} vs ${matchInfo.awayTeam} (${matchInfo.sport})`);
    
    if (isAnonymous) {
      const demoStartTime = Date.now();
      console.log(`[Match-Preview] Anonymous user - checking for demo match`);
      
      // Try to find a matching demo for this specific matchup
      const matchingDemo = findMatchingDemo(matchInfo.homeTeam, matchInfo.awayTeam, matchInfo.sport);
      
      if (matchingDemo) {
        console.log(`[Match-Preview] Serving demo: ${matchingDemo.id} in ${Date.now() - startTime}ms (exact match)`);
        return NextResponse.json({
          ...matchingDemo.data,
          isDemo: true,
          demoId: matchingDemo.id,
        }, {
          headers: {
            'Cache-Control': 'public, max-age=3600', // Cache demo for 1 hour
          }
        });
      }
      
      // No exact match - serve a random featured demo with registration CTA
      const randomDemo = getRandomFeaturedDemo();
      console.log(`[Match-Preview] Serving featured demo: ${randomDemo.id} in ${Date.now() - startTime}ms`);
      
      return NextResponse.json({
        ...randomDemo.data,
        isDemo: true,
        demoId: randomDemo.id,
        requestedMatch: {
          homeTeam: matchInfo.homeTeam,
          awayTeam: matchInfo.awayTeam,
          sport: matchInfo.sport,
        },
        message: 'Register for free to analyze this exact match!',
      }, {
        headers: {
          'Cache-Control': 'public, max-age=3600', // Cache demo for 1 hour
        }
      });
    }

    // ==========================================
    // REGISTERED USER - Full API analysis
    // ==========================================
    console.log(`[Match-Preview] Registered user: ${session.user.email} - proceeding with live analysis`);

    // Determine if this is a non-soccer sport
    const isNonSoccer = ['basketball', 'basketball_nba', 'basketball_euroleague', 'euroleague', 'nba', 'americanfootball', 'americanfootball_nfl', 'nfl', 'icehockey', 'icehockey_nhl', 'nhl', 'hockey', 'baseball', 'mlb', 'mma', 'ufc']
      .includes(matchInfo.sport.toLowerCase());

    // Fetch enriched data based on sport type
    let enrichedData;
    let injuries: { home: any[]; away: any[] } = { home: [], away: [] };
    let goalTimingData: any = null;
    let keyPlayers: { home: any; away: any } = { home: null, away: null };
    let referee: any = null;
    let fixtureInfo: { venue: string | null } = { venue: null };

    if (isNonSoccer) {
      // Use DataLayer for basketball, NFL, hockey, etc.
      const normalizedSport = normalizeSport(matchInfo.sport);
      console.log(`[Match-Preview] Using DataLayer for ${matchInfo.sport} (normalized: ${normalizedSport})`);
      try {
        // Pass original sport string to preserve league info (e.g., 'basketball_euroleague')
        enrichedData = await getEnrichedMatchDataV2(
          matchInfo.homeTeam,
          matchInfo.awayTeam,
          matchInfo.sport, // Use original sport, not normalizedSport - bridge needs this for league detection
          matchInfo.league
        );
        console.log(`[Match-Preview] ${matchInfo.sport} data fetched in ${Date.now() - startTime}ms:`, {
          dataSource: enrichedData.dataSource,
          homeFormGames: enrichedData.homeForm?.length || 0,
          awayFormGames: enrichedData.awayForm?.length || 0,
          h2hGames: enrichedData.headToHead?.length || 0,
        });
      } catch (sportError) {
        console.error(`[Match-Preview] Sport API error for ${matchInfo.sport}:`, sportError);
        // Use fallback empty data
        enrichedData = {
          sport: matchInfo.sport,
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
      // Use football API for soccer
      [enrichedData, injuries, goalTimingData, keyPlayers, referee, fixtureInfo] = await Promise.all([
        getEnrichedMatchData(
          matchInfo.homeTeam,
          matchInfo.awayTeam,
          matchInfo.league
        ),
        getMatchInjuries(
          matchInfo.homeTeam,
          matchInfo.awayTeam,
          matchInfo.league
        ),
        getMatchGoalTiming(
          matchInfo.homeTeam,
          matchInfo.awayTeam,
          matchInfo.league
        ),
        getMatchKeyPlayers(
          matchInfo.homeTeam,
          matchInfo.awayTeam,
          matchInfo.league
        ),
        getFixtureReferee(
          matchInfo.homeTeam,
          matchInfo.awayTeam,
          matchInfo.league
        ),
        getMatchFixtureInfo(
          matchInfo.homeTeam,
          matchInfo.awayTeam,
          matchInfo.league
        ),
      ]);
    }

    // Use venue from fixture info if available, fallback to matchInfo
    const venue = fixtureInfo?.venue || matchInfo.venue;

    // Check if we have real form data (not just fallback DDDDD)
    const hasRealFormData = !!(enrichedData.homeForm?.length || enrichedData.awayForm?.length);
    const dataSource = enrichedData.dataSource || (hasRealFormData ? 'API_SPORTS' : 'UNAVAILABLE');

    // Build form strings - use '-----' to indicate no data instead of fake DDDDD
    const homeFormStr = enrichedData.homeForm?.map(m => m.result).join('') || (hasRealFormData ? 'DDDDD' : '-----');
    const awayFormStr = enrichedData.awayForm?.map(m => m.result).join('') || (hasRealFormData ? 'DDDDD' : '-----');

    // Calculate wins/draws/losses from form
    const countForm = (form: string) => ({
      wins: (form.match(/W/g) || []).length,
      draws: (form.match(/D/g) || []).length,
      losses: (form.match(/L/g) || []).length,
      played: form.length,
    });

    const homeFormCounts = countForm(homeFormStr);
    const awayFormCounts = countForm(awayFormStr);

    // Calculate stats - use actual played count from API if available, otherwise form count
    // Type assertion needed because enrichedData can come from different sources
    const homeStatsRaw = enrichedData.homeStats as { 
      goalsScored?: number; goalsConceded?: number; played?: number; 
      wins?: number; draws?: number; losses?: number;
      averageScored?: number; averageConceded?: number;
    } | null;
    const awayStatsRaw = enrichedData.awayStats as { 
      goalsScored?: number; goalsConceded?: number; played?: number; 
      wins?: number; draws?: number; losses?: number;
      averageScored?: number; averageConceded?: number;
    } | null;

    const homeStats = {
      goalsScored: homeStatsRaw?.goalsScored || 0,
      goalsConceded: homeStatsRaw?.goalsConceded || 0,
      played: homeStatsRaw?.played || homeFormCounts.played,
      wins: homeStatsRaw?.wins || homeFormCounts.wins,
      draws: homeStatsRaw?.draws ?? homeFormCounts.draws,
      losses: homeStatsRaw?.losses || homeFormCounts.losses,
      // Pre-calculated averages from API (more accurate)
      averageScored: homeStatsRaw?.averageScored,
      averageConceded: homeStatsRaw?.averageConceded,
    };

    const awayStats = {
      goalsScored: awayStatsRaw?.goalsScored || 0,
      goalsConceded: awayStatsRaw?.goalsConceded || 0,
      played: awayStatsRaw?.played || awayFormCounts.played,
      wins: awayStatsRaw?.wins || awayFormCounts.wins,
      draws: awayStatsRaw?.draws ?? awayFormCounts.draws,
      losses: awayStatsRaw?.losses || awayFormCounts.losses,
      // Pre-calculated averages from API (more accurate)
      averageScored: awayStatsRaw?.averageScored,
      averageConceded: awayStatsRaw?.averageConceded,
    };

    // H2H summary
    const h2h = {
      totalMeetings: enrichedData.h2hSummary?.totalMatches || 0,
      homeWins: enrichedData.h2hSummary?.homeWins || 0,
      awayWins: enrichedData.h2hSummary?.awayWins || 0,
      draws: enrichedData.h2hSummary?.draws || 0,
    };

    console.log(`[Match-Preview] Stats prepared, calling AI analysis...`);
    console.log(`[Match-Preview] homeStats:`, JSON.stringify(homeStats));
    console.log(`[Match-Preview] awayStats:`, JSON.stringify(awayStats));
    console.log(`[Match-Preview] h2h:`, JSON.stringify(h2h));

    // Generate AI analysis with new comprehensive prompt
    const aiAnalysis = await generateAIAnalysis({
      homeTeam: matchInfo.homeTeam,
      awayTeam: matchInfo.awayTeam,
      league: matchInfo.league,
      sport: matchInfo.sport,
      kickoff: matchInfo.kickoff,
      homeForm: homeFormStr,
      awayForm: awayFormStr,
      homeStats,
      awayStats,
      h2h,
      // NEW: Pass enriched context for richer AI content
      enrichedContext: {
        homeFormDetails: enrichedData.homeForm?.map(m => ({
          result: m.result,
          opponent: m.opponent || 'Unknown',
          score: m.score || '0-0',
        })),
        awayFormDetails: enrichedData.awayForm?.map(m => ({
          result: m.result,
          opponent: m.opponent || 'Unknown',
          score: m.score || '0-0',
        })),
        h2hMatches: enrichedData.headToHead?.map(m => ({
          homeTeam: m.homeTeam || matchInfo.homeTeam,
          awayTeam: m.awayTeam || matchInfo.awayTeam,
          homeScore: m.homeScore ?? 0,
          awayScore: m.awayScore ?? 0,
          date: m.date || new Date().toISOString(),
        })),
        injuryDetails: {
          home: injuries.home.map(i => ({
            player: i.player || 'Unknown player',
            reason: i.reason,
          })),
          away: injuries.away.map(i => ({
            player: i.player || 'Unknown player',
            reason: i.reason,
          })),
        },
      },
    });

    console.log(`[Match-Preview] AI analysis complete:`, aiAnalysis?.story?.favored || 'no favored');

    // Build key absence from injuries data
    const findKeyAbsence = () => {
      // Check home team injuries first
      const homeKeyPlayer = injuries.home.find(i => 
        i.position?.toLowerCase().includes('forward') || 
        i.position?.toLowerCase().includes('striker') ||
        i.position?.toLowerCase().includes('midfielder')
      );
      if (homeKeyPlayer) {
        return {
          player: homeKeyPlayer.player,
          team: 'home' as const,
          impact: `${homeKeyPlayer.reason}: ${homeKeyPlayer.details}`,
        };
      }
      // Check away team
      const awayKeyPlayer = injuries.away.find(i => 
        i.position?.toLowerCase().includes('forward') || 
        i.position?.toLowerCase().includes('striker') ||
        i.position?.toLowerCase().includes('midfielder')
      );
      if (awayKeyPlayer) {
        return {
          player: awayKeyPlayer.player,
          team: 'away' as const,
          impact: `${awayKeyPlayer.reason}: ${awayKeyPlayer.details}`,
        };
      }
      // Return first injury if any
      if (injuries.home.length > 0) {
        return {
          player: injuries.home[0].player,
          team: 'home' as const,
          impact: `${injuries.home[0].reason}: ${injuries.home[0].details}`,
        };
      }
      if (injuries.away.length > 0) {
        return {
          player: injuries.away[0].player,
          team: 'away' as const,
          impact: `${injuries.away[0].reason}: ${injuries.away[0].details}`,
        };
      }
      return null;
    };

    // Build viral stats
    const viralStats = {
      h2h: {
        headline: buildH2HHeadline(matchInfo.homeTeam, matchInfo.awayTeam, h2h),
        favors: h2h.homeWins > h2h.awayWins ? 'home' : h2h.awayWins > h2h.homeWins ? 'away' : 'even',
      },
      form: {
        home: homeFormStr.slice(-5),
        away: awayFormStr.slice(-5),
      },
      keyAbsence: findKeyAbsence(),
      streak: detectStreak(homeFormStr, awayFormStr, matchInfo.homeTeam, matchInfo.awayTeam),
    };

    // Build home/away splits (using overall stats as proxy)
    const homeAwaySplits = {
      homeTeamAtHome: {
        played: Math.ceil(homeStats.played / 2),
        wins: Math.ceil(homeStats.wins * 0.6),
        draws: Math.ceil(homeStats.draws / 2),
        losses: Math.floor(homeStats.losses * 0.4),
        goalsFor: Math.ceil(homeStats.goalsScored * 0.55),
        goalsAgainst: Math.floor(homeStats.goalsConceded * 0.45),
        cleanSheets: Math.ceil(homeStats.played * 0.25),
        highlight: homeStats.wins > homeStats.losses ? `Strong at home this season` : null,
      },
      awayTeamAway: {
        played: Math.ceil(awayStats.played / 2),
        wins: Math.floor(awayStats.wins * 0.4),
        draws: Math.ceil(awayStats.draws / 2),
        losses: Math.ceil(awayStats.losses * 0.6),
        goalsFor: Math.floor(awayStats.goalsScored * 0.45),
        goalsAgainst: Math.ceil(awayStats.goalsConceded * 0.55),
        cleanSheets: Math.floor(awayStats.played * 0.15),
        highlight: awayStats.wins > awayStats.losses ? `Good travellers this season` : null,
      },
    };

    // Build goals timing from real API data
    const goalsTiming = buildGoalsTimingFromData(goalTimingData, matchInfo.homeTeam, matchInfo.awayTeam);

    // Build context factors
    const contextFactors = buildContextFactors(matchInfo, homeStats, awayStats, h2h);

    // Fetch odds and calculate market intel (don't block on failure)
    let marketIntel: MarketIntel | null = null;
    let odds: OddsData | null = null;
    
    try {
      // Use data layer to fetch odds
      const dataLayer = getDataLayer();
      console.log(`[Match-Preview] Fetching odds for ${matchInfo.homeTeam} vs ${matchInfo.awayTeam}, sport: ${matchInfo.sport}, normalized: ${normalizeSport(matchInfo.sport)}`);
      
      const oddsResult = await dataLayer.getOdds(
        normalizeSport(matchInfo.sport) as 'soccer' | 'basketball' | 'hockey' | 'american_football' | 'baseball' | 'mma' | 'tennis',
        matchInfo.homeTeam,
        matchInfo.awayTeam,
        { 
          markets: ['h2h'],
          sportKey: matchInfo.sport, // Pass original sport key for correct league
        }
      );
      
      console.log(`[Match-Preview] Odds result: success=${oddsResult.success}, dataLength=${oddsResult.data?.length || 0}, error=${oddsResult.error?.message || 'none'}`);
      
      if (oddsResult.success && oddsResult.data && oddsResult.data.length > 0) {
        // Get the first bookmaker's odds
        const firstBookmaker = oddsResult.data[0];
        console.log(`[Match-Preview] First bookmaker: ${firstBookmaker.bookmaker}, hasMoneyline: ${!!firstBookmaker.moneyline}`);
        
        if (firstBookmaker.moneyline) {
          odds = {
            homeOdds: firstBookmaker.moneyline.home,
            awayOdds: firstBookmaker.moneyline.away,
            drawOdds: firstBookmaker.moneyline.draw,
            bookmaker: firstBookmaker.bookmaker,
            lastUpdate: firstBookmaker.lastUpdate?.toISOString(),
          };
          
          // Calculate market intel using universal signals
          const sportConfig = getSportConfig(matchInfo.sport);
          marketIntel = analyzeMarket(
            aiAnalysis.universalSignals,
            odds,
            sportConfig.hasDraw
          );
          
          console.log(`[Match-Preview] Market intel calculated: ${marketIntel.recommendation}`);
          console.log(`[Match-Preview] Odds quota: ${oddsResult.metadata.quotaUsed} used, ${oddsResult.metadata.quotaRemaining} remaining`);
        }
      } else if (!oddsResult.success) {
        console.log(`[Match-Preview] Could not get odds: ${oddsResult.error?.message}`);
      }
    } catch (oddsError) {
      console.error('[Match-Preview] Failed to fetch odds:', oddsError);
      // Continue without odds - not critical
    }

    // Generate TTS audio for the narrative (async, don't block)
    let audioUrl: string | undefined;
    const narrativeText = aiAnalysis.story?.narrative || (aiAnalysis.story as { gameFlow?: string })?.gameFlow;
    if (process.env.ELEVENLABS_API_KEY && narrativeText) {
      try {
        const ttsText = buildTTSScript(
          matchInfo.homeTeam,
          matchInfo.awayTeam,
          aiAnalysis.story.favored as 'home' | 'away' | 'draw',
          aiAnalysis.story.confidence as 'strong' | 'moderate' | 'slight',
          narrativeText
        );
        audioUrl = await generateTTSAudio(ttsText, matchId);
      } catch (error) {
        console.error('TTS generation failed:', error);
        // Continue without audio
      }
    }

    // Get sport config for terminology
    const sportConfig = getSportConfig(matchInfo.sport);
    
    const response = {
      matchInfo: {
        id: matchId,
        homeTeam: matchInfo.homeTeam,
        awayTeam: matchInfo.awayTeam,
        league: matchInfo.league,
        sport: matchInfo.sport,
        hasDraw: sportConfig.hasDraw,
        scoringUnit: sportConfig.scoringUnit,
        kickoff: matchInfo.kickoff,
        venue: venue,
      },
      // Data availability info - helps UI show proper messages
      dataAvailability: {
        source: dataSource,
        hasFormData: hasRealFormData,
        hasH2H: !!(enrichedData.headToHead?.length),
        hasInjuries: !!(injuries.home.length || injuries.away.length),
        message: !hasRealFormData 
          ? `Historical data not available for ${matchInfo.sport.toUpperCase()}. Analysis based on AI estimation.`
          : undefined,
      },
      story: {
        ...aiAnalysis.story,
        audioUrl,
      },
      // Universal Signals for visual display
      universalSignals: aiAnalysis.universalSignals,
      // Include normalized signals for UI (legacy format)
      signals: aiAnalysis.signals,
      viralStats,
      headlines: aiAnalysis.headlines,
      homeAwaySplits,
      goalsTiming: sportConfig.scoringUnit === 'goals' ? goalsTiming : null,
      contextFactors,
      keyPlayerBattle: keyPlayers.home && keyPlayers.away ? {
        homePlayer: {
          name: keyPlayers.home.name,
          position: keyPlayers.home.position,
          photo: keyPlayers.home.photo,
          seasonGoals: keyPlayers.home.goals,
          seasonAssists: keyPlayers.home.assists,
          form: homeFormStr.slice(-5),
          minutesPlayed: keyPlayers.home.minutesPlayed,
          rating: keyPlayers.home.rating,
        },
        awayPlayer: {
          name: keyPlayers.away.name,
          position: keyPlayers.away.position,
          photo: keyPlayers.away.photo,
          seasonGoals: keyPlayers.away.goals,
          seasonAssists: keyPlayers.away.assists,
          form: awayFormStr.slice(-5),
          minutesPlayed: keyPlayers.away.minutesPlayed,
          rating: keyPlayers.away.rating,
        },
        battleType: 'top-scorers' as const,
      } : null,
      referee: referee,
      // Premium Edge Features
      marketIntel: marketIntel,
      odds: odds,
    };

    // ========================================
    // SAVE TO DATABASE FOR STATS COUNTER + PREDICTIONS
    // ========================================
    try {
      const userId = session?.user?.id;
      const userEmail = session?.user?.email;
      console.log(`[Match-Preview] Save check - userId: ${userId}, email: ${userEmail}, session exists: ${!!session}`);
      
      if (userId) {
        const matchRef = `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`;
        const favored = aiAnalysis?.story?.favored || 'draw';
        const confidence = aiAnalysis?.story?.confidence || 'moderate';
        const matchDate = matchInfo.kickoff ? new Date(matchInfo.kickoff) : new Date();
        
        // Save to Analysis table (for history + stats counter)
        await prisma.analysis.create({
          data: {
            userId,
            sport: matchInfo.sport,
            league: matchInfo.league || 'Unknown',
            homeTeam: matchInfo.homeTeam,
            awayTeam: matchInfo.awayTeam,
            matchDate,
            homeWinProb: favored === 'home' ? 0.6 : favored === 'away' ? 0.3 : 0.33,
            drawProb: favored === 'draw' ? 0.5 : 0.25,
            awayWinProb: favored === 'away' ? 0.6 : favored === 'home' ? 0.3 : 0.33,
            riskLevel: confidence === 'strong' ? 'low' : confidence === 'slight' ? 'high' : 'medium',
            bestValueSide: favored,
            fullResponse: response as any,
          },
        });
        console.log(`[Match-Preview] Analysis saved for user ${userId}`);
        
        // Also create PredictionOutcome for tracking accuracy
        // Check if prediction already exists for this match
        const existingPrediction = await prisma.predictionOutcome.findFirst({
          where: {
            matchRef,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });
        
        if (!existingPrediction) {
          const predictedScenario = favored === 'home' 
            ? `${matchInfo.homeTeam} win` 
            : favored === 'away' 
              ? `${matchInfo.awayTeam} win` 
              : 'Draw';
          
          await prisma.predictionOutcome.create({
            data: {
              matchRef,
              league: matchInfo.league || 'Unknown',
              matchDate,
              narrativeAngle: aiAnalysis?.story?.narrative?.substring(0, 500) || `Analysis: ${matchRef}`,
              predictedScenario,
              confidenceLevel: confidence === 'strong' ? 85 : confidence === 'moderate' ? 65 : 45,
              source: 'MATCH_ANALYSIS',
            },
          });
          console.log(`[Match-Preview] Prediction saved: ${matchRef} -> ${predictedScenario}`);
        }
      } else {
        console.log(`[Match-Preview] No userId in session, skipping database save`);
      }
    } catch (saveError) {
      // Don't fail the request if save fails
      console.error('[Match-Preview] Failed to save analysis/prediction:', saveError);
    }

    console.log(`[Match-Preview] Completed in ${Date.now() - startTime}ms`);
    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error(`[Match-Preview] FATAL ERROR after ${Date.now() - startTime}ms:`, errorMessage);
    console.error('[Match-Preview] Stack:', errorStack);
    console.error('[Match-Preview] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Return more details in dev/preview for debugging
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      { 
        error: 'Failed to generate match preview', 
        details: errorMessage,
        ...(isDev && { stack: errorStack, timestamp: new Date().toISOString() })
      },
      { status: 500 }
    );
  }
}

/**
 * Normalize league names for display
 */
function normalizeLeagueName(league: string): string {
  const leagueMap: Record<string, string> = {
    // EPL variations
    'epl': 'Premier League',
    'english premier league': 'Premier League',
    'premier league': 'Premier League',
    'england - premier league': 'Premier League',
    // La Liga
    'la liga': 'La Liga',
    'spain - la liga': 'La Liga',
    'laliga': 'La Liga',
    // Serie A
    'serie a': 'Serie A',
    'italy - serie a': 'Serie A',
    // Bundesliga
    'bundesliga': 'Bundesliga',
    'germany - bundesliga': 'Bundesliga',
    // Ligue 1
    'ligue 1': 'Ligue 1',
    'france - ligue 1': 'Ligue 1',
    // Champions League
    'uefa champions league': 'Champions League',
    'champions league': 'Champions League',
    // Europa League
    'uefa europa league': 'Europa League',
    'europa league': 'Europa League',
  };

  const normalized = league.toLowerCase().trim();
  return leagueMap[normalized] || league;
}

/**
 * Detect sport from league name
 */
function detectSportFromLeague(league: string): string | null {
  const lower = league.toLowerCase();
  
  // Basketball - detect specific leagues
  if (lower.includes('euroleague')) {
    return 'basketball_euroleague';
  }
  if (lower.includes('nba')) {
    return 'basketball_nba';
  }
  if (lower.includes('basketball') || lower.includes('ncaab') || lower.includes('wnba') || 
      lower.includes('nbl') || lower.includes('acb')) {
    return 'basketball';
  }
  
  // American Football
  if (lower.includes('nfl') || lower.includes('ncaaf') || lower.includes('american football')) {
    return 'americanfootball';
  }
  
  // Ice Hockey
  if (lower.includes('nhl') || lower.includes('hockey') || lower.includes('khl')) {
    return 'icehockey';
  }
  
  // Baseball
  if (lower.includes('mlb') || lower.includes('baseball')) {
    return 'baseball';
  }
  
  // Tennis
  if (lower.includes('atp') || lower.includes('wta') || lower.includes('tennis')) {
    return 'tennis';
  }
  
  return null;
}

/**
 * Get sport configuration
 */
function getSportConfig(sport: string) {
  const configs: Record<string, { hasDraw: boolean; scoringUnit: string; matchTerm: string; analystType: string }> = {
    'soccer': { hasDraw: true, scoringUnit: 'goals', matchTerm: 'match', analystType: 'football analyst' },
    'basketball': { hasDraw: false, scoringUnit: 'points', matchTerm: 'game', analystType: 'basketball analyst' },
    'basketball_nba': { hasDraw: false, scoringUnit: 'points', matchTerm: 'game', analystType: 'NBA analyst' },
    'basketball_euroleague': { hasDraw: false, scoringUnit: 'points', matchTerm: 'game', analystType: 'basketball analyst' },
    'americanfootball': { hasDraw: false, scoringUnit: 'points', matchTerm: 'game', analystType: 'NFL analyst' },
    'americanfootball_nfl': { hasDraw: false, scoringUnit: 'points', matchTerm: 'game', analystType: 'NFL analyst' },
    'icehockey': { hasDraw: false, scoringUnit: 'goals', matchTerm: 'game', analystType: 'hockey analyst' },
    'baseball': { hasDraw: false, scoringUnit: 'runs', matchTerm: 'game', analystType: 'baseball analyst' },
    'tennis': { hasDraw: false, scoringUnit: 'sets', matchTerm: 'match', analystType: 'tennis analyst' },
  };
  
  return configs[sport] || configs['soccer'];
}

function parseMatchId(matchId: string) {
  try {
    const decoded = Buffer.from(matchId, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    return {
      homeTeam: parsed.homeTeam,
      awayTeam: parsed.awayTeam,
      league: normalizeLeagueName(parsed.league),
      sport: parsed.sport || detectSportFromLeague(parsed.league) || 'soccer',
      kickoff: parsed.kickoff || new Date().toISOString(),
      venue: parsed.venue || null,
    };
  } catch {
    const parts = matchId.split('_');
    if (parts.length >= 3) {
      const league = normalizeLeagueName(parts[2].replace(/-/g, ' '));
      return {
        homeTeam: parts[0].replace(/-/g, ' '),
        awayTeam: parts[1].replace(/-/g, ' '),
        league,
        sport: detectSportFromLeague(league) || 'soccer',
        kickoff: parts[3] ? new Date(parseInt(parts[3])).toISOString() : new Date().toISOString(),
        venue: null,
      };
    }
    return null;
  }
}

function buildH2HHeadline(homeTeam: string, awayTeam: string, h2h: { totalMeetings: number; homeWins: number; awayWins: number; draws: number }) {
  if (h2h.totalMeetings === 0) return 'First ever meeting';
  
  const dominantTeam = h2h.homeWins > h2h.awayWins ? homeTeam : awayTeam;
  const dominantWins = Math.max(h2h.homeWins, h2h.awayWins);
  
  if (dominantWins >= 5) {
    return `${dominantTeam}: ${dominantWins} wins in last ${h2h.totalMeetings}`;
  }
  if (h2h.draws >= h2h.totalMeetings / 2) {
    return `${h2h.draws} draws in ${h2h.totalMeetings} meetings`;
  }
  return `${h2h.homeWins}-${h2h.draws}-${h2h.awayWins} in ${h2h.totalMeetings} meetings`;
}

function detectStreak(homeForm: string, awayForm: string, homeTeam: string, awayTeam: string) {
  const homeWinStreak = (homeForm.match(/W+$/) || [''])[0].length;
  const awayWinStreak = (awayForm.match(/W+$/) || [''])[0].length;
  const homeUnbeaten = (homeForm.match(/[WD]+$/) || [''])[0].length;
  const awayUnbeaten = (awayForm.match(/[WD]+$/) || [''])[0].length;

  if (homeWinStreak >= 3) return { text: `${homeWinStreak} wins in a row`, team: 'home' as const };
  if (awayWinStreak >= 3) return { text: `${awayWinStreak} wins in a row`, team: 'away' as const };
  if (homeUnbeaten >= 5) return { text: `${homeUnbeaten} unbeaten`, team: 'home' as const };
  if (awayUnbeaten >= 5) return { text: `${awayUnbeaten} unbeaten`, team: 'away' as const };
  
  return null;
}

function buildGoalsTiming(homeGoals: number, awayGoals: number) {
  const distribute = (total: number) => {
    const base = Math.max(1, Math.floor(total / 6));
    return {
      '0-15': base + Math.floor(Math.random() * 2),
      '16-30': base + Math.floor(Math.random() * 2),
      '31-45': base + Math.floor(Math.random() * 3),
      '46-60': base + Math.floor(Math.random() * 2),
      '61-75': base + Math.floor(Math.random() * 3),
      '76-90': base + Math.floor(Math.random() * 4),
    };
  };

  return {
    home: {
      scoring: distribute(homeGoals),
      conceding: distribute(Math.floor(homeGoals * 0.8)),
      insight: homeGoals > 10 ? 'Tend to score late in matches' : null,
    },
    away: {
      scoring: distribute(awayGoals),
      conceding: distribute(Math.floor(awayGoals * 0.8)),
      insight: awayGoals > 10 ? 'Dangerous in second half' : null,
    },
  };
}

function buildContextFactors(
  matchInfo: { homeTeam: string; awayTeam: string; league: string; kickoff: string },
  homeStats: { played: number; wins: number; goalsScored: number },
  awayStats: { played: number; wins: number; goalsScored: number },
  h2h: { totalMeetings: number; homeWins: number; awayWins: number; draws: number }
) {
  const factors = [];

  if (h2h.totalMeetings > 0) {
    const avgGoals = ((homeStats.goalsScored + awayStats.goalsScored) / Math.max(1, homeStats.played + awayStats.played) * 2).toFixed(1);
    factors.push({
      id: 'fixture-goals',
      icon: '⚽',
      label: 'Fixture Average',
      value: `${avgGoals} goals/game`,
      favors: 'neutral',
    });
  }

  factors.push({
    id: 'stakes',
    icon: '🏆',
    label: 'Stakes',
    value: 'League points at stake',
    favors: 'neutral',
    note: 'Both teams motivated',
  });

  factors.push({
    id: 'home-advantage',
    icon: '🏟️',
    label: 'Home Factor',
    value: `${matchInfo.homeTeam} at home`,
    favors: 'home',
    note: 'Home advantage typically worth 0.5 goals',
  });

  factors.push({
    id: 'rest',
    icon: '⏰',
    label: 'Rest Days',
    value: 'Both teams fresh',
    favors: 'neutral',
  });

  return factors;
}

// Format enriched data for AI consumption - the "color" behind the signals
function formatEnrichedContext(data: {
  homeTeam: string;
  awayTeam: string;
  homeStats?: { goalsScored: number; goalsConceded: number; played: number; wins: number; draws: number; losses: number; averageScored?: number; averageConceded?: number };
  awayStats?: { goalsScored: number; goalsConceded: number; played: number; wins: number; draws: number; losses: number; averageScored?: number; averageConceded?: number };
  homeForm?: string;
  awayForm?: string;
  homeFormDetails?: Array<{ result: 'W' | 'L' | 'D'; opponent: string; score: string }> | null;
  awayFormDetails?: Array<{ result: 'W' | 'L' | 'D'; opponent: string; score: string }> | null;
  h2h?: { totalMeetings: number; homeWins: number; awayWins: number; draws: number };
  h2hMatches?: Array<{ homeTeam: string; awayTeam: string; homeScore: number; awayScore: number; date: string }> | null;
  injuries?: { home: Array<{ player: string; reason?: string }>; away: Array<{ player: string; reason?: string }> };
}): string {
  const lines: string[] = [];
  
  // SEASON STATS - use pre-calculated averages from API if available, otherwise calculate
  if (data.homeStats && data.homeStats.played > 0) {
    const hs = data.homeStats;
    // Use API-provided averages if available (more accurate), otherwise calculate
    const ppg = hs.averageScored !== undefined && hs.averageScored > 0 
      ? hs.averageScored.toFixed(1) 
      : (hs.goalsScored / hs.played).toFixed(1);
    const cpg = hs.averageConceded !== undefined && hs.averageConceded > 0 
      ? hs.averageConceded.toFixed(1) 
      : (hs.goalsConceded / hs.played).toFixed(1);
    lines.push(`${data.homeTeam} season (${hs.played} games): ${hs.wins}W-${hs.draws}D-${hs.losses}L (${ppg} scored, ${cpg} conceded per game)`);
  }
  
  if (data.awayStats && data.awayStats.played > 0) {
    const as = data.awayStats;
    // Use API-provided averages if available (more accurate), otherwise calculate
    const ppg = as.averageScored !== undefined && as.averageScored > 0 
      ? as.averageScored.toFixed(1) 
      : (as.goalsScored / as.played).toFixed(1);
    const cpg = as.averageConceded !== undefined && as.averageConceded > 0 
      ? as.averageConceded.toFixed(1) 
      : (as.goalsConceded / as.played).toFixed(1);
    lines.push(`${data.awayTeam} season (${as.played} games): ${as.wins}W-${as.draws}D-${as.losses}L (${ppg} scored, ${cpg} conceded per game)`);
  }
  
  // FORM STRING - last 5 results
  if (data.homeForm) {
    lines.push(`${data.homeTeam} form (last 5): ${data.homeForm}`);
  }
  if (data.awayForm) {
    lines.push(`${data.awayTeam} form (last 5): ${data.awayForm}`);
  }
  
  // Recent Form with actual results (if available)
  if (data.homeFormDetails && data.homeFormDetails.length > 0) {
    const formResults = data.homeFormDetails.slice(0, 5).map(m => 
      `${m.result} ${m.score} vs ${m.opponent}`
    ).join(', ');
    lines.push(`${data.homeTeam} recent matches: ${formResults}`);
  }
  
  if (data.awayFormDetails && data.awayFormDetails.length > 0) {
    const formResults = data.awayFormDetails.slice(0, 5).map(m => 
      `${m.result} ${m.score} vs ${m.opponent}`
    ).join(', ');
    lines.push(`${data.awayTeam} recent matches: ${formResults}`);
  }
  
  // H2H SUMMARY - actual numbers
  if (data.h2h && data.h2h.totalMeetings > 0) {
    lines.push(`H2H record (${data.h2h.totalMeetings} meetings): ${data.homeTeam} ${data.h2h.homeWins}W, Draws ${data.h2h.draws}, ${data.awayTeam} ${data.h2h.awayWins}W`);
  }
  
  // H2H with actual scores (if available)
  if (data.h2hMatches && data.h2hMatches.length > 0) {
    const h2hResults = data.h2hMatches.slice(0, 3).map(m => {
      const date = new Date(m.date);
      const month = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      return `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} (${month})`;
    }).join(' | ');
    lines.push(`Recent H2H: ${h2hResults}`);
  }
  
  // Key absences
  const homeAbsences = data.injuries?.home?.slice(0, 3) || [];
  const awayAbsences = data.injuries?.away?.slice(0, 3) || [];
  
  if (homeAbsences.length > 0) {
    const names = homeAbsences.map(i => i.player).join(', ');
    lines.push(`${data.homeTeam} missing: ${names}`);
  }
  
  if (awayAbsences.length > 0) {
    const names = awayAbsences.map(i => i.player).join(', ');
    lines.push(`${data.awayTeam} missing: ${names}`);
  }
  
  return lines.length > 0 ? lines.join('\n') : 'No detailed match data available.';
}

async function generateAIAnalysis(data: {
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  kickoff: string;
  homeForm: string;
  awayForm: string;
  homeStats: { goalsScored: number; goalsConceded: number; played: number; wins: number; draws: number; losses: number };
  awayStats: { goalsScored: number; goalsConceded: number; played: number; wins: number; draws: number; losses: number };
  h2h: { totalMeetings: number; homeWins: number; awayWins: number; draws: number };
  injuries?: { home: string[]; away: string[] };
  // NEW: Enriched data for richer AI context
  enrichedContext?: {
    homeFormDetails?: Array<{ result: 'W' | 'L' | 'D'; opponent: string; score: string }> | null;
    awayFormDetails?: Array<{ result: 'W' | 'L' | 'D'; opponent: string; score: string }> | null;
    h2hMatches?: Array<{ homeTeam: string; awayTeam: string; homeScore: number; awayScore: number; date: string }> | null;
    injuryDetails?: { home: Array<{ player: string; reason?: string }>; away: Array<{ player: string; reason?: string }> };
  };
}) {
  const sportConfig = getSportConfig(data.sport);
  
  // Build input for Universal Signals Framework
  const signalInput: RawMatchInput = {
    sport: data.sport,
    homeTeam: data.homeTeam,
    awayTeam: data.awayTeam,
    homeForm: data.homeForm,
    awayForm: data.awayForm,
    homeStats: {
      played: data.homeStats.played,
      wins: data.homeStats.wins,
      draws: data.homeStats.draws,
      losses: data.homeStats.losses,
      scored: data.homeStats.goalsScored,
      conceded: data.homeStats.goalsConceded,
    },
    awayStats: {
      played: data.awayStats.played,
      wins: data.awayStats.wins,
      draws: data.awayStats.draws,
      losses: data.awayStats.losses,
      scored: data.awayStats.goalsScored,
      conceded: data.awayStats.goalsConceded,
    },
    h2h: {
      total: data.h2h.totalMeetings,
      homeWins: data.h2h.homeWins,
      awayWins: data.h2h.awayWins,
      draws: data.h2h.draws,
    },
    homeInjuries: data.injuries?.home || [],
    awayInjuries: data.injuries?.away || [],
  };
  
  // Generate Universal Signals (the core of the system)
  const universalSignals = normalizeToUniversalSignals(signalInput);
  
  // For no-draw sports, don't include draw option in prompt
  const favoredOptions = sportConfig.hasDraw ? '"home" | "away" | "draw"' : '"home" | "away"';
  
  // Build enriched context for richer AI content
  const enrichedContextStr = formatEnrichedContext({
    homeTeam: data.homeTeam,
    awayTeam: data.awayTeam,
    homeStats: data.homeStats,
    awayStats: data.awayStats,
    homeForm: data.homeForm,
    awayForm: data.awayForm,
    homeFormDetails: data.enrichedContext?.homeFormDetails,
    awayFormDetails: data.enrichedContext?.awayFormDetails,
    h2h: data.h2h,
    h2hMatches: data.enrichedContext?.h2hMatches,
    injuries: data.enrichedContext?.injuryDetails,
  });
  
  // SportBot AIXBT-style System Prompt with data requirements
  const systemPrompt = `${ANALYSIS_PERSONALITY}

=== MATCH DATA FOR THIS ANALYSIS ===

NORMALIZED SIGNALS (your analytical framework):
${formatSignalsForAI(universalSignals)}

MATCH CONTEXT (cite these numbers in your analysis):
${enrichedContextStr}

=== OUTPUT REQUIREMENTS ===

DATA CITATION RULES:
- EVERY snapshot bullet must include a specific number from the context above
- Reference W-D-L records (e.g., "8W-2D-1L this season")
- Cite scoring rates (e.g., "averaging 2.3 goals per game")
- Include H2H records when available (e.g., "5-2 in last 7 meetings")
- If data is limited, say so directly: "Limited data available"

NEVER:
- Give betting advice or tips
- Make generic claims without data backing
- Use hollow phrases: "capitalize on weaknesses", "clinical finishing", "likely to dominate"
- Say "expected to be fast-paced" without citing scoring rates

ALWAYS:
- Lead with the strongest statistical edge
- Be the analyst who spots what others miss
- Short, punchy observations - no walls of text
- If confidence is low, state WHY clearly`;

  const userPrompt = `MATCH: ${data.homeTeam} vs ${data.awayTeam}
COMPETITION: ${data.league}

SIGNALS:
${getSignalSummary(universalSignals)}

Confidence Level: ${universalSignals.confidence.toUpperCase()} (${universalSignals.clarity_score}% clarity)

Generate JSON:

{
  "analysis": {
    "favored": ${favoredOptions},
    "confidence": "${universalSignals.confidence}",
    "snapshot": [
      "First insight WITH A NUMBER (e.g., '4W-1L form, averaging 2.1 goals/game')",
      "Second insight WITH A NUMBER (e.g., 'Conceding just 0.8/game at home')", 
      "Third insight WITH A NUMBER (e.g., 'H2H: 5-2 in last 7 meetings')",
      "Fourth insight (risk or gap in data)"
    ],
    "gameFlow": "2-3 sentences describing expected game dynamics. Reference scoring rates and defensive records.",
    "riskFactors": ["Key risk with context", "Secondary risk (optional)"]
  },
  "headline": "One analytical line with a stat (e.g., 'Arsenal's 2.4 goals/game meets Chelsea's leaky defense')"
}

RULES:
- EVERY snapshot bullet must contain at least one specific number from the context
- gameFlow must reference actual scoring/conceding rates
- If no detailed stats available, be honest: "Limited data available"
- ${!sportConfig.hasDraw ? 'This sport has NO DRAWS - pick a winner.' : 'Draw is possible.'}`;

  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content');
    
    // Normalize unicode characters
    const normalizedContent = content
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2013/g, '-')
      .replace(/\u2014/g, '--')
      .replace(/\u2026/g, '...');
    
    const result = JSON.parse(normalizedContent);
    
    // Ensure no-draw sports don't return draw
    if (!sportConfig.hasDraw && result.analysis?.favored === 'draw') {
      result.analysis.favored = 'home';
    }
    
    // Build response with Universal Signals
    return {
      story: {
        favored: result.analysis?.favored || 'draw',
        confidence: mapConfidence(result.analysis?.confidence),
        narrative: result.analysis?.gameFlow || '',
        snapshot: result.analysis?.snapshot || [],
        riskFactors: result.analysis?.riskFactors || [],
      },
      headlines: result.headline ? [
        { icon: '📊', text: result.headline, favors: result.analysis?.favored || 'neutral', viral: true }
      ] : [],
      // Universal Signals for UI display
      universalSignals,
      // Legacy format for backwards compatibility
      signals: {
        formLabel: universalSignals.form,
        strengthEdgeLabel: universalSignals.strength_edge,
        strengthEdgeDirection: universalSignals.display?.edge?.direction || 'even',
        tempoLabel: universalSignals.tempo,
        efficiencyLabel: universalSignals.efficiency_edge,
        availabilityLabel: universalSignals.availability_impact,
      },
    };
  } catch (error) {
    console.error('AI generation failed:', error);
    
    // Fallback using Universal Signals
    const favored = universalSignals.display?.edge?.direction === 'even' 
      ? (sportConfig.hasDraw ? 'draw' : 'home')
      : (universalSignals.display?.edge?.direction || 'home');

    return {
      story: {
        favored,
        confidence: mapConfidence(universalSignals.confidence),
        narrative: `${data.homeTeam} hosts ${data.awayTeam} in this ${data.league} fixture.`,
        snapshot: [
          `${universalSignals.form} form heading into this match.`,
          `Strength edge: ${universalSignals.strength_edge}.`,
          `Expected tempo: ${universalSignals.tempo}.`,
          `Availability impact: ${universalSignals.availability_impact}.`,
        ],
        riskFactors: ['Limited data for deeper analysis.'],
      },
      headlines: [
        { icon: '📊', text: `${data.homeTeam} vs ${data.awayTeam}`, favors: 'neutral', viral: false }
      ],
      universalSignals,
      signals: {
        formLabel: universalSignals.form,
        strengthEdgeLabel: universalSignals.strength_edge,
        strengthEdgeDirection: universalSignals.display?.edge?.direction || 'even',
        tempoLabel: universalSignals.tempo,
        efficiencyLabel: universalSignals.efficiency_edge,
        availabilityLabel: universalSignals.availability_impact,
      },
    };
  }
}

/**
 * Map confidence levels between formats
 */
function mapConfidence(confidence: string | undefined): 'strong' | 'moderate' | 'slight' {
  if (confidence === 'high') return 'strong';
  if (confidence === 'low') return 'slight';
  return 'moderate';
}

/**
 * Calculate normalized signals from raw match data
 */
function calculateNormalizedSignals(
  data: {
    homeTeam: string;
    awayTeam: string;
    sport: string;
    homeForm: string;
    awayForm: string;
    homeStats: { goalsScored: number; goalsConceded: number; played: number; wins: number; draws: number; losses: number };
    awayStats: { goalsScored: number; goalsConceded: number; played: number; wins: number; draws: number; losses: number };
    h2h: { totalMeetings: number; homeWins: number; awayWins: number; draws: number };
  },
  sportConfig: { hasDraw: boolean; scoringUnit: string; matchTerm: string; analystType: string }
) {
  // Calculate form ratings
  const calculateFormRating = (form: string): number => {
    if (!form || form.length === 0) return 50;
    let points = 0;
    const weights = [1.5, 1.3, 1.1, 1.0, 0.9];
    for (let i = 0; i < Math.min(form.length, 5); i++) {
      const result = form[i].toUpperCase();
      const weight = weights[i] || 1;
      if (result === 'W') points += 3 * weight;
      else if (result === 'D') points += 1 * weight;
    }
    const maxPossible = weights.slice(0, Math.min(form.length, 5)).reduce((a, b) => a + b, 0) * 3;
    return maxPossible > 0 ? (points / maxPossible) * 100 : 50;
  };

  const homeFormRating = calculateFormRating(data.homeForm);
  const awayFormRating = calculateFormRating(data.awayForm);
  
  const formLabel = (rating: number): string => {
    if (rating >= 65) return 'strong';
    if (rating <= 35) return 'weak';
    return 'neutral';
  };
  
  const homeFormLabel = formLabel(homeFormRating);
  const awayFormLabel = formLabel(awayFormRating);
  
  // Form comparison
  let formComparison: string;
  if (homeFormRating > awayFormRating + 15) {
    formComparison = `${data.homeTeam} in stronger form`;
  } else if (awayFormRating > homeFormRating + 15) {
    formComparison = `${data.awayTeam} in stronger form`;
  } else {
    formComparison = 'Both sides in similar form';
  }
  
  // Strength edge
  const homeWinRate = data.homeStats.played > 0 ? data.homeStats.wins / data.homeStats.played : 0.5;
  const awayWinRate = data.awayStats.played > 0 ? data.awayStats.wins / data.awayStats.played : 0.5;
  const homeGD = data.homeStats.played > 0 ? (data.homeStats.goalsScored - data.homeStats.goalsConceded) / data.homeStats.played : 0;
  const awayGD = data.awayStats.played > 0 ? (data.awayStats.goalsScored - data.awayStats.goalsConceded) / data.awayStats.played : 0;
  const h2hFactor = data.h2h.totalMeetings > 0 ? (data.h2h.homeWins - data.h2h.awayWins) / data.h2h.totalMeetings * 0.1 : 0;
  
  const totalEdge = ((homeWinRate - awayWinRate) + (homeGD - awayGD) * 0.05 + h2hFactor + 0.03) * 100;
  const clampedEdge = Math.max(-20, Math.min(20, totalEdge));
  
  let strengthEdgeDirection: 'home' | 'away' | 'even';
  let strengthEdgeLabel: string;
  if (Math.abs(clampedEdge) < 3) {
    strengthEdgeDirection = 'even';
    strengthEdgeLabel = 'Even';
  } else if (clampedEdge > 0) {
    strengthEdgeDirection = 'home';
    strengthEdgeLabel = `Home +${Math.round(clampedEdge)}%`;
  } else {
    strengthEdgeDirection = 'away';
    strengthEdgeLabel = `Away +${Math.abs(Math.round(clampedEdge))}%`;
  }
  
  // Tempo
  const homeScoring = data.homeStats.played > 0 ? data.homeStats.goalsScored / data.homeStats.played : 0;
  const awayScoring = data.awayStats.played > 0 ? data.awayStats.goalsScored / data.awayStats.played : 0;
  const avgScoring = (homeScoring + awayScoring) / 2;
  
  const tempoThresholds: Record<string, { low: number; high: number }> = {
    'soccer': { low: 1.2, high: 1.8 },
    'basketball': { low: 105, high: 115 },
    'americanfootball': { low: 20, high: 28 },
    'icehockey': { low: 2.5, high: 3.5 },
  };
  
  const sportKey = data.sport.includes('basketball') ? 'basketball' 
    : data.sport.includes('american') || data.sport.includes('nfl') ? 'americanfootball'
    : data.sport.includes('hockey') || data.sport.includes('nhl') ? 'icehockey'
    : 'soccer';
  
  const t = tempoThresholds[sportKey] || tempoThresholds.soccer;
  let tempoLabel: string;
  if (avgScoring < t.low) tempoLabel = 'Low tempo expected';
  else if (avgScoring > t.high) tempoLabel = 'High tempo expected';
  else tempoLabel = 'Medium tempo expected';
  
  // Efficiency
  const homeOffEff = data.homeStats.played > 0 ? data.homeStats.goalsScored / data.homeStats.played : 0;
  const awayOffEff = data.awayStats.played > 0 ? data.awayStats.goalsScored / data.awayStats.played : 0;
  const homeDefEff = data.homeStats.played > 0 ? data.homeStats.goalsConceded / data.homeStats.played : 999;
  const awayDefEff = data.awayStats.played > 0 ? data.awayStats.goalsConceded / data.awayStats.played : 999;
  
  const homeNet = homeOffEff - homeDefEff;
  const awayNet = awayOffEff - awayDefEff;
  const effDiff = homeNet - awayNet;
  
  let efficiencyLabel: string;
  if (Math.abs(effDiff) < 0.2) {
    efficiencyLabel = 'No clear efficiency edge';
  } else if (effDiff > 0) {
    efficiencyLabel = 'Home team more efficient';
  } else {
    efficiencyLabel = 'Away team more efficient';
  }
  
  // Sport label for AI
  const sportLabels: Record<string, string> = {
    'soccer': 'Soccer',
    'basketball': 'Basketball',
    'basketball_nba': 'NBA Basketball',
    'americanfootball': 'American Football',
    'americanfootball_nfl': 'NFL',
    'icehockey': 'Ice Hockey',
    'icehockey_nhl': 'NHL Hockey',
  };
  
  return {
    sportLabel: sportLabels[data.sport] || 'Soccer',
    formLabel: formComparison,
    homeForm: homeFormLabel,
    awayForm: awayFormLabel,
    strengthEdgeDirection,
    strengthEdgeLabel,
    tempoLabel,
    efficiencyLabel,
    availabilityLabel: 'Availability impact: Low', // Default, can be enhanced with injury data
  };
}

/**
 * Build goals timing from real API data
 */
function buildGoalsTimingFromData(
  goalTimingData: { home: { scoring: Record<string, number>; conceding: Record<string, number>; totalGoals: number }; away: { scoring: Record<string, number>; conceding: Record<string, number>; totalGoals: number } } | null,
  homeTeam: string,
  awayTeam: string
) {
  // Return default empty structure if no data (non-soccer sports)
  if (!goalTimingData || !goalTimingData.home || !goalTimingData.away) {
    return {
      home: {
        scoring: {},
        conceding: {},
        insight: null,
      },
      away: {
        scoring: {},
        conceding: {},
        insight: null,
      },
    };
  }

  // Generate insights based on peak scoring times
  const findPeakPeriod = (scoring: Record<string, number>) => {
    let max = 0;
    let peak = '76-90';
    for (const [period, goals] of Object.entries(scoring)) {
      if (goals > max) {
        max = goals;
        peak = period;
      }
    }
    return peak;
  };

  const homePeak = findPeakPeriod(goalTimingData.home.scoring);
  const awayPeak = findPeakPeriod(goalTimingData.away.scoring);

  const periodLabels: Record<string, string> = {
    '0-15': 'early',
    '16-30': 'mid first half',
    '31-45': 'before halftime',
    '46-60': 'after the break',
    '61-75': 'in the final third',
    '76-90': 'late',
  };

  return {
    home: {
      scoring: goalTimingData.home.scoring,
      conceding: goalTimingData.home.conceding,
      insight: goalTimingData.home.totalGoals > 5 
        ? `${homeTeam} tend to score ${periodLabels[homePeak] || 'late'} in matches`
        : null,
    },
    away: {
      scoring: goalTimingData.away.scoring,
      conceding: goalTimingData.away.conceding,
      insight: goalTimingData.away.totalGoals > 5
        ? `${awayTeam} are dangerous ${periodLabels[awayPeak] || 'late'}`
        : null,
    },
  };
}

/**
 * Build TTS script from analysis
 */
function buildTTSScript(
  homeTeam: string,
  awayTeam: string,
  favored: 'home' | 'away' | 'draw',
  confidence: 'strong' | 'moderate' | 'slight',
  narrative: string
): string {
  const favoredTeam = favored === 'home' ? homeTeam : favored === 'away' ? awayTeam : 'a draw';
  const confidenceText = confidence === 'strong' ? 'strongly' : confidence === 'moderate' ? '' : 'slightly';
  
  // Clean narrative for TTS (remove markdown, excessive punctuation)
  const cleanNarrative = narrative
    .replace(/\n+/g, '. ')
    .replace(/[*_#]/g, '')
    .slice(0, 800); // Limit for TTS

  return `Match preview: ${homeTeam} versus ${awayTeam}. Our analysis ${confidenceText} favors ${favoredTeam}. ${cleanNarrative}`;
}

/**
 * Generate TTS audio using ElevenLabs via internal API
 */
async function generateTTSAudio(text: string, matchId: string): Promise<string | undefined> {
  try {
    // Call our TTS API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error('TTS API returned error:', response.status);
      return undefined;
    }

    const result = await response.json();
    
    if (result.success && result.audioBase64) {
      // Return as data URL for immediate playback
      return `data:${result.contentType || 'audio/mpeg'};base64,${result.audioBase64}`;
    }

    return undefined;
  } catch (error) {
    console.error('TTS generation error:', error);
    return undefined;
  }
}
