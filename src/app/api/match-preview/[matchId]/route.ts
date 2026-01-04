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
import { authOptions, canUserAnalyze, incrementAnalysisCount } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyConvictionCap } from '@/lib/accuracy-core/types';

// Force dynamic rendering (uses headers/session)
export const dynamic = 'force-dynamic';
import { getMatchInjuries, getMatchGoalTiming, getMatchKeyPlayers, getFixtureReferee, getMatchFixtureInfo } from '@/lib/football-api';
import { getNFLMatchInjuries } from '@/lib/sports-api';
import { normalizeSport } from '@/lib/data-layer/bridge';
import { getUnifiedMatchData, type MatchIdentifier } from '@/lib/unified-match-service';
import { normalizeToUniversalSignals, formatSignalsForAI, getSignalSummary, type RawMatchInput } from '@/lib/universal-signals';
import { analyzeMarket, type MarketIntel, type OddsData } from '@/lib/value-detection';
import { getDataLayer } from '@/lib/data-layer';
import { findMatchingDemo, getRandomFeaturedDemo, type DemoMatch } from '@/lib/demo-matches';
import { cacheGet, cacheSet, CACHE_TTL, CACHE_KEYS } from '@/lib/cache';
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
  console.log(`[Match-Preview] === REQUEST RECEIVED at ${new Date().toISOString()} ===`);
  
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
    
    // ==========================================
    // CHECK IF MATCH IS TOO FAR AWAY (>48 HOURS)
    // Return early with "coming soon" response instead of mock/fallback analysis
    // ==========================================
    if (matchInfo.kickoff) {
      const kickoffDate = new Date(matchInfo.kickoff);
      const now = new Date();
      const hoursUntilKickoff = (kickoffDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilKickoff > 48) {
        const availableDate = new Date(kickoffDate.getTime() - 48 * 60 * 60 * 1000);
        const hoursUntilAvailable = (availableDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const daysUntilAvailable = Math.ceil(hoursUntilAvailable / 24);
        
        console.log(`[Match-Preview] Match too far away: ${hoursUntilKickoff.toFixed(1)}h until kickoff, ${hoursUntilAvailable.toFixed(1)}h until available`);
        
        return NextResponse.json({
          tooFarAway: true,
          hoursUntilKickoff,
          daysUntilKickoff: daysUntilAvailable, // Days until AVAILABLE, not kickoff
          availableDate: availableDate.toISOString(),
          matchInfo: {
            id: matchId,
            homeTeam: matchInfo.homeTeam,
            awayTeam: matchInfo.awayTeam,
            league: matchInfo.league,
            sport: matchInfo.sport,
            kickoff: matchInfo.kickoff,
          },
          message: `Analysis available in ${daysUntilAvailable} day${daysUntilAvailable > 1 ? 's' : ''}`,
          reason: 'Our AI analysis becomes available 48 hours before kickoff when we have the most accurate data (injuries, lineups, latest odds).',
        });
      }
    }

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

    const userId = session.user.id;
    
    // ==========================================
    // CHECK IF USER ALREADY ANALYZED THIS MATCH TODAY
    // If so, return cached analysis without using a credit
    // ==========================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAnalysis = await prisma.analysis.findFirst({
      where: {
        userId,
        homeTeam: matchInfo.homeTeam,
        awayTeam: matchInfo.awayTeam,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    if (existingAnalysis) {
      console.log(`[Match-Preview] User ${session.user.email} already analyzed this match today - checking cache`);
      
      // Build cache key and check for cached response
      const matchDate = matchInfo.kickoff ? new Date(matchInfo.kickoff).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const cacheKey = CACHE_KEYS.matchPreview(matchInfo.homeTeam, matchInfo.awayTeam, matchInfo.sport, matchDate);
      const cachedPreview = await cacheGet<any>(cacheKey);
      
      if (cachedPreview) {
        console.log(`[Match-Preview] Returning cached analysis for repeat view (no credit used)`);
        return NextResponse.json({
          ...cachedPreview,
          creditUsed: false,
          repeatView: true,
        });
      }
      
      // If no cache but analysis exists, try to return the stored analysis
      if (existingAnalysis.fullResponse) {
        console.log(`[Match-Preview] Returning stored analysis from DB for repeat view`);
        return NextResponse.json({
          ...(existingAnalysis.fullResponse as object),
          creditUsed: false,
          repeatView: true,
        });
      }
    }

    // ==========================================
    // CHECK USER USAGE LIMITS
    // ==========================================
    console.log(`[Match-Preview] Checking usage for user ${userId} (${session.user.email})`);
    const usageCheck = await canUserAnalyze(userId);
    console.log(`[Match-Preview] Usage check result:`, JSON.stringify(usageCheck));
    
    if (!usageCheck.allowed) {
      console.log(`[Match-Preview] User ${session.user.email} has exceeded daily limit (${usageCheck.limit})`);
      return NextResponse.json(
        { 
          usageLimitReached: true,
          error: 'Daily analysis limit reached',
          message: usageCheck.plan === 'FREE' 
            ? 'You\'ve used your free daily analysis. Upgrade to Pro for 30 analyses/day!'
            : usageCheck.plan === 'PRO'
            ? 'You\'ve reached your Pro limit (30/day). Upgrade to Premium for unlimited!'
            : 'Daily limit reached. Please try again tomorrow.',
          usage: {
            remaining: usageCheck.remaining,
            limit: usageCheck.limit,
            used: usageCheck.limit - usageCheck.remaining,
          },
          plan: usageCheck.plan,
          matchInfo: matchInfo, // Include match info for display
        },
        { status: 429 }
      );
    }

    // ==========================================
    // FREE USERS: Decrement credit immediately (before cache check)
    // PRO/PREMIUM: Credits only used for NEW (non-cached) analyses
    // ==========================================
    const isFreePlan = usageCheck.plan === 'FREE';
    let creditUsedEarly = false;
    
    if (isFreePlan) {
      // FREE users always use their credit (1 analysis = 1 credit, cached or not)
      await incrementAnalysisCount(userId);
      creditUsedEarly = true;
      console.log(`[Match-Preview] FREE user ${userId} credit used immediately (remaining: 0)`);
    }

    // ==========================================
    // CHECK CACHE FIRST (shared across all users)
    // Skip cache if match starts within 30 minutes (need fresh data)
    // ==========================================
    const matchDate = matchInfo.kickoff ? new Date(matchInfo.kickoff).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const cacheKey = CACHE_KEYS.matchPreview(matchInfo.homeTeam, matchInfo.awayTeam, matchInfo.sport, matchDate);
    
    console.log(`[Match-Preview] Cache key: ${cacheKey}`);
    console.log(`[Match-Preview] Match info: home=${matchInfo.homeTeam}, away=${matchInfo.awayTeam}, sport=${matchInfo.sport}, date=${matchDate}`);
    
    const kickoffTime = matchInfo.kickoff ? new Date(matchInfo.kickoff).getTime() : 0;
    const minutesUntilKickoff = kickoffTime ? (kickoffTime - Date.now()) / 60000 : Infinity;
    // Only skip cache for matches 0-30 min before kickoff (for fresh last-minute data)
    // Live matches (negative minutes) should STILL use cache to show pre-match analysis
    const isLive = minutesUntilKickoff < 0;
    const isAboutToStart = minutesUntilKickoff >= 0 && minutesUntilKickoff < 30;
    const shouldSkipCache = isAboutToStart; // Only skip for matches about to start, NOT for live matches
    
    if (isLive) {
      console.log(`[Match-Preview] Match is LIVE (${Math.abs(Math.round(minutesUntilKickoff))} min into game) - checking cache for pre-match analysis`);
    }
    
    if (!shouldSkipCache) {
      const cachedPreview = await cacheGet<any>(cacheKey);
      if (cachedPreview) {
        console.log(`[Match-Preview] Cache HIT for ${matchInfo.homeTeam} vs ${matchInfo.awayTeam} (${Date.now() - startTime}ms, preAnalyzed: ${cachedPreview.preAnalyzed || false})`);
        
        // Backwards compatibility: transform old cache formats
        let responseData = cachedPreview;
        const sportConfig = getSportConfig(cachedPreview.sport || cachedPreview.matchInfo?.sport || matchInfo.sport);
        
        // Transform old flat format (no matchInfo wrapper)
        if (!cachedPreview.matchInfo && cachedPreview.homeTeam) {
          console.log(`[Match-Preview] Transforming old flat cache format`);
          responseData = {
            matchInfo: {
              id: matchId,
              homeTeam: cachedPreview.homeTeam || matchInfo.homeTeam,
              awayTeam: cachedPreview.awayTeam || matchInfo.awayTeam,
              league: cachedPreview.league || matchInfo.league,
              sport: cachedPreview.sport || matchInfo.sport,
              hasDraw: sportConfig.hasDraw,
              scoringUnit: sportConfig.scoringUnit,
              kickoff: cachedPreview.kickoff || matchInfo.kickoff,
              venue: null,
            },
            dataAvailability: cachedPreview.dataAvailability || {
              source: 'API_SPORTS',
              hasFormData: true,
              hasH2H: true,
              hasInjuries: false,
            },
            story: cachedPreview.story,
            signals: cachedPreview.signals,
            universalSignals: cachedPreview.universalSignals || cachedPreview.signals,
            // Include injuries if available (may be separate from universalSignals in older cache)
            injuries: cachedPreview.injuries || { home: [], away: [] },
            headlines: cachedPreview.headlines,
            probabilities: cachedPreview.probabilities,
            marketIntel: cachedPreview.marketIntel,
            odds: cachedPreview.odds,
            viralStats: cachedPreview.viralStats || null,
            preAnalyzed: cachedPreview.preAnalyzed,
            preAnalyzedAt: cachedPreview.preAnalyzedAt,
          };
        }
        
        // Transform old story format (verdict/narrative/confidence number → favored/narrative/snapshot/riskFactors)
        if (responseData.story && !responseData.story.favored && (responseData.story.verdict || typeof responseData.story.confidence === 'number')) {
          console.log(`[Match-Preview] Transforming old story format to new format`);
          const oldStory = responseData.story;
          const homeTeam = responseData.matchInfo?.homeTeam || matchInfo.homeTeam;
          const awayTeam = responseData.matchInfo?.awayTeam || matchInfo.awayTeam;
          
          // Infer favored from verdict text
          const verdictLower = (oldStory.verdict || '').toLowerCase();
          let favored: 'home' | 'away' | 'draw' = sportConfig.hasDraw ? 'draw' : 'home';
          if (verdictLower.includes(homeTeam.toLowerCase()) || verdictLower.includes('home')) {
            favored = 'home';
          } else if (verdictLower.includes(awayTeam.toLowerCase()) || verdictLower.includes('away')) {
            favored = 'away';
          }
          
          // Map numeric confidence to string
          const numConf = typeof oldStory.confidence === 'number' ? oldStory.confidence : 5;
          const confidence: 'strong' | 'moderate' | 'slight' = numConf >= 7 ? 'strong' : numConf <= 4 ? 'slight' : 'moderate';
          
          responseData.story = {
            favored,
            confidence,
            narrative: oldStory.narrative || oldStory.verdict || '',
            snapshot: oldStory.snapshot || [
              oldStory.verdict || `${homeTeam} vs ${awayTeam}`,
              oldStory.narrative || 'Pre-analyzed match',
            ],
            riskFactors: oldStory.riskFactors || ['Pre-analyzed - limited context'],
          };
        }
        
        // Save Analysis record for cached responses too (so admin dashboard shows accurate counts)
        if (userId && creditUsedEarly) {
          try {
            const favored = responseData.story?.favored || 'draw';
            const confidence = responseData.story?.confidence || 'moderate';
            const matchDateForSave = matchInfo.kickoff ? new Date(matchInfo.kickoff) : new Date();
            
            await prisma.analysis.create({
              data: {
                userId,
                sport: matchInfo.sport,
                league: matchInfo.league || responseData.matchInfo?.league || 'Unknown',
                homeTeam: matchInfo.homeTeam,
                awayTeam: matchInfo.awayTeam,
                matchDate: matchDateForSave,
                homeWinProb: favored === 'home' ? 0.6 : favored === 'away' ? 0.3 : 0.33,
                drawProb: favored === 'draw' ? 0.5 : 0.25,
                awayWinProb: favored === 'away' ? 0.6 : favored === 'home' ? 0.3 : 0.33,
                riskLevel: confidence === 'strong' ? 'low' : confidence === 'slight' ? 'high' : 'medium',
                bestValueSide: favored,
                fullResponse: responseData as any,
              },
            });
            console.log(`[Match-Preview] Analysis saved for user ${userId} (cached response)`);
          } catch (saveError) {
            console.error(`[Match-Preview] Failed to save analysis for cached response:`, saveError);
          }
        }
        
        return NextResponse.json({
          ...responseData,
          fromCache: true,
          creditUsed: creditUsedEarly, // Tell client if credit was used
        }, {
          headers: {
            'Cache-Control': 'private, max-age=1800', // 30 min browser cache
          }
        });
      }
      console.log(`[Match-Preview] Cache MISS for key: ${cacheKey}`);
    } else if (isAboutToStart) {
      console.log(`[Match-Preview] Skipping cache - match starts in ${Math.round(minutesUntilKickoff)} min (about to start, generating fresh)`);
    }

    // Fetch enriched data based on sport type
    let enrichedData;
    let injuries: { home: any[]; away: any[] } = { home: [], away: [] };
    let goalTimingData: any = null;
    let keyPlayers: { home: any; away: any } = { home: null, away: null };
    let referee: any = null;
    let fixtureInfo: { venue: string | null } = { venue: null };

    // Check if this is a soccer match
    const isSoccer = !['basketball', 'basketball_nba', 'basketball_euroleague', 'euroleague', 'nba', 'americanfootball', 'americanfootball_nfl', 'nfl', 'icehockey', 'icehockey_nhl', 'nhl', 'hockey', 'baseball', 'mlb', 'mma', 'ufc']
      .includes(matchInfo.sport.toLowerCase());

    // ALL sports now use Unified Match Service for core data (form, H2H, stats)
    const normalizedSport = normalizeSport(matchInfo.sport);
    console.log(`[Match-Preview] Using UnifiedMatchService for ${matchInfo.sport} (normalized: ${normalizedSport})`);
    
    try {
      const matchId: MatchIdentifier = {
        homeTeam: matchInfo.homeTeam,
        awayTeam: matchInfo.awayTeam,
        sport: matchInfo.sport,
        league: matchInfo.league,
      };
      
      const unifiedData = await getUnifiedMatchData(matchId, { includeOdds: false });
      
      // Map to expected format (DATABASE maps to CACHE for compatibility)
      const mappedDataSource: 'API_SPORTS' | 'CACHE' | 'UNAVAILABLE' = 
        unifiedData.enrichedData.dataSource === 'DATABASE' ? 'CACHE' : unifiedData.enrichedData.dataSource;
      
      enrichedData = {
        sport: matchInfo.sport,
        homeForm: unifiedData.enrichedData.homeForm,
        awayForm: unifiedData.enrichedData.awayForm,
        headToHead: unifiedData.enrichedData.headToHead,
        h2hSummary: unifiedData.enrichedData.h2hSummary ? {
          totalMatches: unifiedData.enrichedData.h2hSummary.totalMatches,
          homeWins: unifiedData.enrichedData.h2hSummary.homeWins,
          awayWins: unifiedData.enrichedData.h2hSummary.awayWins,
          draws: unifiedData.enrichedData.h2hSummary.draws,
        } : null,
        homeStats: unifiedData.enrichedData.homeStats,
        awayStats: unifiedData.enrichedData.awayStats,
        dataSource: mappedDataSource,
      };
      
      console.log(`[Match-Preview] ${matchInfo.sport} data fetched in ${Date.now() - startTime}ms:`, {
        dataSource: enrichedData.dataSource,
        homeFormGames: enrichedData.homeForm?.length || 0,
        awayFormGames: enrichedData.awayForm?.length || 0,
        h2hGames: enrichedData.headToHead?.length || 0,
      });
    } catch (sportError) {
      console.error(`[Match-Preview] Sport API error for ${matchInfo.sport}:`, sportError);
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

    // Soccer-specific: fetch extra data (injuries, goal timing, key players, referee)
    if (isSoccer) {
      console.log(`[Match-Preview] Fetching soccer-specific extras...`);
      try {
        [injuries, goalTimingData, keyPlayers, referee, fixtureInfo] = await Promise.all([
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
        console.log(`[Match-Preview] Soccer extras fetched in ${Date.now() - startTime}ms`);
        console.log(`[Match-Preview] Soccer injuries - Home: ${injuries.home.length}, Away: ${injuries.away.length}`, 
          injuries.home.length > 0 ? JSON.stringify(injuries.home.slice(0, 2)) : 'none');
      } catch (soccerExtrasError) {
        console.error(`[Match-Preview] Soccer extras error (non-fatal):`, soccerExtrasError);
        // Continue with empty extras - core data from DataLayer is more important
      }
    }

    // NFL-specific: fetch injuries
    const isNFL = ['americanfootball', 'americanfootball_nfl', 'nfl', 'ncaaf']
      .includes(matchInfo.sport.toLowerCase());
    
    if (isNFL) {
      console.log(`[Match-Preview] Fetching NFL injuries...`);
      try {
        injuries = await getNFLMatchInjuries(
          matchInfo.homeTeam,
          matchInfo.awayTeam
        );
        console.log(`[Match-Preview] NFL injuries fetched - Home: ${injuries.home.length}, Away: ${injuries.away.length}`);
      } catch (nflError) {
        console.error(`[Match-Preview] NFL injuries error (non-fatal):`, nflError);
      }
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

    console.log(`[Match-Preview] Stats prepared in ${Date.now() - startTime}ms`);

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

    // ========================================
    // PARALLEL EXECUTION: AI + Odds + TTS
    // Run AI analysis and odds fetching in parallel to save ~2 seconds
    // ========================================
    
    // Prepare odds fetch function
    const fetchOddsAsync = async () => {
      try {
        const dataLayer = getDataLayer();
        console.log(`[Match-Preview] Fetching odds for ${matchInfo.homeTeam} vs ${matchInfo.awayTeam}, sport: ${matchInfo.sport}`);
        
        const oddsResult = await dataLayer.getOdds(
          normalizeSport(matchInfo.sport) as 'soccer' | 'basketball' | 'hockey' | 'american_football' | 'baseball' | 'mma' | 'tennis',
          matchInfo.homeTeam,
          matchInfo.awayTeam,
          { 
            markets: ['h2h'],
            sportKey: matchInfo.sport,
          }
        );
        
        if (oddsResult.success && oddsResult.data && oddsResult.data.length > 0) {
          const firstBookmaker = oddsResult.data[0];
          if (firstBookmaker.moneyline) {
            console.log(`[Match-Preview] Odds fetched: home=${firstBookmaker.moneyline.home}, away=${firstBookmaker.moneyline.away}`);
            return {
              homeOdds: firstBookmaker.moneyline.home,
              awayOdds: firstBookmaker.moneyline.away,
              drawOdds: firstBookmaker.moneyline.draw,
              bookmaker: firstBookmaker.bookmaker,
              lastUpdate: firstBookmaker.lastUpdate?.toISOString(),
            } as OddsData;
          }
        }
        console.log(`[Match-Preview] No odds available: ${oddsResult.error?.message || 'no data'}`);
        return null;
      } catch (error) {
        console.error('[Match-Preview] Odds fetch failed:', error);
        return null;
      }
    };

    // Prepare AI analysis function (already has all data)
    const aiAnalysisPromise = generateAIAnalysis({
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
            details: i.details,
            position: i.position,
          })),
          away: injuries.away.map(i => ({
            player: i.player || 'Unknown player',
            reason: i.reason,
            details: i.details,
            position: i.position,
          })),
        },
      },
    });

    // Run AI and Odds in PARALLEL - saves ~1-2 seconds
    const [aiAnalysis, odds] = await Promise.all([
      aiAnalysisPromise,
      fetchOddsAsync(),
    ]);

    console.log(`[Match-Preview] Parallel fetch complete in ${Date.now() - startTime}ms - AI: ${aiAnalysis?.story?.favored || 'unknown'}, Odds: ${odds ? 'yes' : 'no'}`);

    // Try to fetch opening odds from existing prediction for steam/RLM detection
    let previousOdds: OddsData | undefined;
    try {
      const matchRef = `${matchInfo.homeTeam} vs ${matchInfo.awayTeam}`;
      const existingPred = await prisma.prediction.findFirst({
        where: {
          matchName: matchRef,
          openingOdds: { not: null },
        },
        select: { openingOdds: true },
      });
      
      if (existingPred?.openingOdds && odds) {
        // Parse opening odds (stored as decimal, e.g., 2.10)
        const openingDecimal = parseFloat(existingPred.openingOdds.toString());
        if (openingDecimal && openingDecimal !== odds.homeOdds) {
          // Estimate draw/away from home odds change ratio
          const ratio = openingDecimal / odds.homeOdds;
          previousOdds = {
            homeOdds: openingDecimal,
            awayOdds: odds.awayOdds * (1 / ratio),  // Inverse movement
            drawOdds: odds.drawOdds,
          };
          console.log(`[Match-Preview] Using opening odds for steam detection: ${openingDecimal} → ${odds.homeOdds}`);
        }
      }
    } catch (predError) {
      // Non-critical - proceed without steam detection
      console.log('[Match-Preview] Could not fetch opening odds for steam detection');
    }

    // Calculate market intel using AI signals + odds (only if we have both)
    let marketIntel: MarketIntel | null = null;
    if (odds && aiAnalysis?.universalSignals) {
      try {
        const sportConfig = getSportConfig(matchInfo.sport);
        // Pass league for calibration (convert to key format)
        const leagueKey = matchInfo.league?.toLowerCase().replace(/\s+/g, '_') || matchInfo.sport;
        marketIntel = analyzeMarket(
          aiAnalysis.universalSignals,
          odds,
          sportConfig.hasDraw,
          previousOdds,  // Now passing previous odds for steam/RLM detection!
          leagueKey
        );
        console.log(`[Match-Preview] Market intel: ${marketIntel.recommendation}, edge: ${marketIntel.valueEdge?.edgePercent || 0}%${marketIntel.lineMovement?.isSteamMove ? ' [STEAM MOVE DETECTED]' : ''}`);
      } catch (miError) {
        console.error('[Match-Preview] Market intel calculation failed:', miError);
      }
    }

    // TTS: Skip to speed up response - audio can be generated on-demand later
    const audioUrl: string | undefined = undefined;

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
      // Injuries data for expandable availability section
      injuries: {
        home: injuries.home.map(i => ({
          player: i.player,
          position: i.position || 'Unknown',
          reason: i.reason || 'injury',
          details: i.details || 'Out',
        })),
        away: injuries.away.map(i => ({
          player: i.player,
          position: i.position || 'Unknown',
          reason: i.reason || 'injury',
          details: i.details || 'Out',
        })),
      },
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
        
        // Also create Prediction for tracking accuracy
        // Check if prediction already exists for this match
        const existingPrediction = await prisma.prediction.findFirst({
          where: {
            matchName: matchRef,
            source: 'MATCH_ANALYSIS',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });
        
        if (!existingPrediction) {
          const predictedScenario = favored === 'home' 
            ? `Home Win - ${matchInfo.homeTeam}` 
            : favored === 'away' 
              ? `Away Win - ${matchInfo.awayTeam}` 
              : 'Draw';
          
          // Apply sport-specific conviction cap
          const sportKey = matchInfo.sport || 'unknown';
          const rawConviction = confidence === 'strong' ? 8 : confidence === 'moderate' ? 6 : 4;
          const cappedConviction = applyConvictionCap(rawConviction, sportKey);
          
          await prisma.prediction.create({
            data: {
              matchId: matchRef.replace(/\s+/g, '_').toLowerCase(),
              matchName: matchRef,
              sport: sportKey,
              league: matchInfo.league || 'Unknown',
              kickoff: matchDate,
              type: 'MATCH_RESULT',
              prediction: predictedScenario,
              reasoning: aiAnalysis?.story?.narrative?.substring(0, 500) || `Analysis: ${matchRef}`,
              conviction: cappedConviction,
              odds: odds?.homeOdds || null,
              impliedProb: marketIntel?.impliedProbability?.home || null,
              source: 'MATCH_ANALYSIS',
              outcome: 'PENDING',
            },
          });
          console.log(`[Match-Preview] Prediction saved: ${matchRef} -> ${predictedScenario} (conviction: ${rawConviction} -> ${cappedConviction})`);
        }
        
        // ========================================
        // UPDATE MARKET ALERTS WITH REAL AI EDGE
        // ========================================
        // When we have marketIntel from full AI analysis, update OddsSnapshot
        // so Market Alerts shows consistent edge values
        if (marketIntel && odds) {
          try {
            const modelProb = marketIntel.modelProbability;
            const valueEdge = marketIntel.valueEdge;
            
            // Calculate individual edges
            const homeEdge = modelProb.home - (marketIntel.impliedProbability?.home || 0);
            const awayEdge = modelProb.away - (marketIntel.impliedProbability?.away || 0);
            const drawEdge = modelProb.draw && marketIntel.impliedProbability?.draw 
              ? modelProb.draw - marketIntel.impliedProbability.draw 
              : null;
            
            // Determine alert level based on edge
            const bestEdgePercent = valueEdge?.edgePercent || Math.max(homeEdge, awayEdge, drawEdge || 0);
            const alertLevel = bestEdgePercent >= 10 ? 'HIGH' : 
                              bestEdgePercent >= 5 ? 'MEDIUM' : 
                              bestEdgePercent >= 3 ? 'LOW' : null;
            
            // Upsert to OddsSnapshot
            await prisma.oddsSnapshot.upsert({
              where: {
                matchRef_sport_bookmaker: {
                  matchRef,
                  sport: matchInfo.sport,
                  bookmaker: 'consensus',
                },
              },
              create: {
                matchRef,
                sport: matchInfo.sport,
                league: matchInfo.league || 'Unknown',
                homeTeam: matchInfo.homeTeam,
                awayTeam: matchInfo.awayTeam,
                matchDate,
                homeOdds: odds.homeOdds,
                awayOdds: odds.awayOdds,
                drawOdds: odds.drawOdds,
                modelHomeProb: modelProb.home,
                modelAwayProb: modelProb.away,
                modelDrawProb: modelProb.draw,
                homeEdge,
                awayEdge,
                drawEdge,
                hasValueEdge: bestEdgePercent >= 5,
                alertLevel,
                alertNote: valueEdge?.label || null,
              },
              update: {
                // Update with real AI edge values
                modelHomeProb: modelProb.home,
                modelAwayProb: modelProb.away,
                modelDrawProb: modelProb.draw,
                homeEdge,
                awayEdge,
                drawEdge,
                hasValueEdge: bestEdgePercent >= 5,
                alertLevel,
                alertNote: valueEdge?.label || null,
                updatedAt: new Date(),
              },
            });
            console.log(`[Match-Preview] Updated OddsSnapshot with real edge: ${matchRef} -> ${bestEdgePercent.toFixed(1)}%`);
          } catch (oddsUpdateError) {
            console.error('[Match-Preview] Failed to update OddsSnapshot:', oddsUpdateError);
            // Don't fail the request
          }
        }
      } else {
        console.log(`[Match-Preview] No userId in session, skipping database save`);
      }
    } catch (saveError) {
      // Don't fail the request if save fails
      console.error('[Match-Preview] Failed to save analysis/prediction:', saveError);
    }

    // ==========================================
    // CACHE THE RESPONSE (for other users)
    // Don't cache if match is very soon
    // ==========================================
    if (!shouldSkipCache) {
      try {
        await cacheSet(cacheKey, response, CACHE_TTL.MATCH_PREVIEW);
        console.log(`[Match-Preview] Cached for 1 hour: ${cacheKey}`);
      } catch (cacheError) {
        console.error('[Match-Preview] Failed to cache:', cacheError);
      }
    }

    // ==========================================
    // INCREMENT USER'S ANALYSIS COUNT (only for fresh analyses, not cached)
    // Skip if FREE user (they already had credit used earlier)
    // ==========================================
    if (!creditUsedEarly) {
      try {
        await incrementAnalysisCount(userId);
        console.log(`[Match-Preview] Incremented analysis count for user ${session.user.email}`);
      } catch (incrementError) {
        console.error('[Match-Preview] Failed to increment analysis count:', incrementError);
      }
    }

    console.log(`[Match-Preview] Completed in ${Date.now() - startTime}ms`);
    return NextResponse.json({
      ...response,
      creditUsed: creditUsedEarly || !creditUsedEarly, // Always true for fresh analysis
    });
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
    // New leagues
    'eredivisie': 'Eredivisie',
    'netherlands - eredivisie': 'Eredivisie',
    'dutch eredivisie': 'Eredivisie',
    'primeira liga': 'Primeira Liga',
    'portugal - primeira liga': 'Primeira Liga',
    'liga portugal': 'Primeira Liga',
    'jupiler pro league': 'Jupiler Pro League',
    'belgium - first division a': 'Jupiler Pro League',
    'belgian first div': 'Jupiler Pro League',
    'scottish premiership': 'Scottish Premiership',
    'scotland - premiership': 'Scottish Premiership',
    'spfl premiership': 'Scottish Premiership',
    'super lig': 'Super Lig',
    'turkey - super lig': 'Super Lig',
    'turkish super lig': 'Super Lig',
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
  } else {
    lines.push(`${data.homeTeam} injuries: None reported`);
  }
  
  if (awayAbsences.length > 0) {
    const names = awayAbsences.map(i => i.player).join(', ');
    lines.push(`${data.awayTeam} missing: ${names}`);
  } else {
    lines.push(`${data.awayTeam} injuries: None reported`);
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
    injuryDetails?: { home: Array<{ player: string; reason?: string; details?: string; position?: string }>; away: Array<{ player: string; reason?: string; details?: string; position?: string }> };
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
    homeInjuryDetails: data.enrichedContext?.injuryDetails?.home || [],
    awayInjuryDetails: data.enrichedContext?.injuryDetails?.away || [],
  };
  
  console.log(`[Match-Preview] SignalInput injuries - home: ${signalInput.homeInjuryDetails?.length || 0}, away: ${signalInput.awayInjuryDetails?.length || 0}`);
  
  // Generate Universal Signals (the core of the system)
  const universalSignals = normalizeToUniversalSignals(signalInput);
  
  console.log(`[Match-Preview] UniversalSignals availability - homeInjuries: ${universalSignals.display?.availability?.homeInjuries?.length || 0}, awayInjuries: ${universalSignals.display?.availability?.awayInjuries?.length || 0}`);
  
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

CRITICAL - INJURIES RULE:
- ONLY mention injuries/absences that are explicitly listed in the MATCH CONTEXT above
- If context says "injuries: None reported" → do NOT mention injuries in riskFactors or snapshot
- Do NOT invent injury information based on your general knowledge
- riskFactors should focus on form trends, market odds, H2H patterns - NOT imagined absences

NEVER:
- Give betting advice or tips
- Make generic claims without data backing
- Use hollow phrases: "capitalize on weaknesses", "clinical finishing", "likely to dominate"
- Say "expected to be fast-paced" without citing scoring rates
- Mention injuries that aren't in the provided data

ALWAYS:
- Lead with the strongest statistical edge
- Be the analyst who spots what others miss
- Short, punchy observations - no walls of text
- If confidence is low, state WHY clearly

CRITICAL - HOME/AWAY RULES:
- The FIRST team listed is ALWAYS the HOME team playing AT HOME
- The SECOND team listed is ALWAYS the AWAY team playing ON THE ROAD
- When signals show "Home +X%" → that refers to the FIRST team listed
- When signals show "Away +X%" → that refers to the SECOND team listed
- NEVER say an away team has "home advantage" - they are playing AWAY`;

  // Determine which team has the computed edge for AI alignment
  const edgeDirection = universalSignals.display?.edge?.direction || 'even';
  const edgeTeam = edgeDirection === 'home' ? data.homeTeam : edgeDirection === 'away' ? data.awayTeam : 'Neither';
  const edgePercentage = universalSignals.display?.edge?.percentage || 0;

  const userPrompt = `${data.homeTeam} (HOME) vs ${data.awayTeam} (AWAY) | ${data.league}

⚠️ VENUE: ${data.homeTeam} is playing at HOME. ${data.awayTeam} is the AWAY team traveling.

COMPUTED SIGNALS: ${getSignalSummary(universalSignals)}
COMPUTED EDGE: ${edgeTeam} ${edgePercentage > 0 ? `+${edgePercentage}%` : '(even)'}
CLARITY: ${universalSignals.clarity_score}% | CONFIDENCE: ${universalSignals.confidence.toUpperCase()}

Be AIXBT. Sharp takes. Back them with numbers. Find the edge.

IMPORTANT: Your analysis MUST align with the computed signals above.
- If COMPUTED EDGE shows "${data.homeTeam}" → your snapshot should favor ${data.homeTeam} (unless you have strong contrarian data)
- If COMPUTED EDGE shows "${data.awayTeam}" → your snapshot should favor ${data.awayTeam}
- If edge is "even" or small (<3%) → acknowledge uncertainty

JSON:
{
  "analysis": {
    "favored": ${favoredOptions},
    "confidence": "${universalSignals.confidence}",
    "snapshot": [
      "THE EDGE: [team name] because [stat]. Not close.",
      "MARKET MISS: [what odds undervalue - use correct home/away context]. The data screams [X].",
      "THE PATTERN: [H2H/streak]. This isn't random.",
      "THE RISK: [caveat]. Don't ignore this."
    ],
    "gameFlow": "Sharp take on how this unfolds. Cite the numbers. Remember: ${data.homeTeam} is at HOME.",
    "riskFactors": ["Primary risk", "Secondary if relevant"]
  },
  "headline": "One punchy line with a stat. Make it quotable."
}

SNAPSHOT VIBE:
- First bullet: State your pick (should align with COMPUTED EDGE: ${edgeTeam}). Give the stat that matters.
- Second bullet: What's the market sleeping on? If home edge, talk about ${data.homeTeam}'s home form. If away edge, talk about ${data.awayTeam}'s away form.
- Third bullet: Pattern recognition. H2H, streaks, momentum. Numbers.
- Fourth bullet: What could wreck this thesis? Be honest.

NO GENERIC TAKES. "Clinical finishing" = banned. "Capitalize on weaknesses" = banned.
NEVER say "${data.awayTeam} has home advantage" - they are AWAY.
If you can't find an edge, say "No clear edge here."
${!sportConfig.hasDraw ? 'NO DRAWS in this sport. Pick a winner.' : 'Draw is valid if form + H2H support it.'}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.3, // Lower for more consistent analytical output
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
    
    // Fallback using Universal Signals with meaningful snapshot
    const favored = universalSignals.display?.edge?.direction === 'even' 
      ? (sportConfig.hasDraw ? 'draw' : 'home')
      : (universalSignals.display?.edge?.direction || 'home');
    
    const favoredTeam = favored === 'home' ? data.homeTeam : favored === 'away' ? data.awayTeam : 'Neither';
    const edgePercentage = universalSignals.display?.edge?.percentage || 50;

    return {
      story: {
        favored,
        confidence: mapConfidence(universalSignals.confidence),
        narrative: `${data.homeTeam} hosts ${data.awayTeam} in this ${data.league} fixture.`,
        snapshot: [
          `Edge favors ${favoredTeam}: ${edgePercentage}% strength based on form & stats`,
          `Form analysis: ${universalSignals.form}`,
          `${data.homeTeam} record: ${data.homeStats.wins}W-${data.homeStats.draws}D-${data.homeStats.losses}L`,
          `${universalSignals.confidence} confidence (${universalSignals.clarity_score || 50}% clarity)`,
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
