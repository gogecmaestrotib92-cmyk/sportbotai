/**
 * Match Validation Cron Job
 * 
 * Runs every 30 minutes to check for finished matches and validate predictions.
 * Posts "Called it ✅" or "Missed this one 📉" tweets.
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/match-validation",
 *     "schedule": "0,30 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTwitterClient, formatForTwitter } from '@/lib/twitter-client';
import { prisma } from '@/lib/prisma';
import { CallOutcome, CallType } from '@prisma/client';

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

// API endpoints for match results
const FOOTBALL_API_URL = 'https://v3.football.api-sports.io';
const BASKETBALL_API_URL = 'https://v1.basketball.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY || '';

interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: string;
  winner?: 'home' | 'away' | 'draw';
}

/**
 * Fetch match result from API
 */
async function getMatchResult(matchId: string, sport: string): Promise<MatchResult | null> {
  try {
    const baseUrl = sport === 'basketball' ? BASKETBALL_API_URL : FOOTBALL_API_URL;
    const endpoint = sport === 'basketball' ? '/games' : '/fixtures';
    
    const response = await fetch(`${baseUrl}${endpoint}?id=${matchId}`, {
      headers: { 'x-apisports-key': API_KEY },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const match = data.response?.[0];
    
    if (!match) return null;
    
    if (sport === 'basketball') {
      const homeScore = match.scores?.home?.total || 0;
      const awayScore = match.scores?.away?.total || 0;
      return {
        matchId,
        homeScore,
        awayScore,
        status: match.status?.short || '',
        winner: homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw',
      };
    } else {
      const homeScore = match.goals?.home ?? 0;
      const awayScore = match.goals?.away ?? 0;
      return {
        matchId,
        homeScore,
        awayScore,
        status: match.fixture?.status?.short || '',
        winner: homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw',
      };
    }
  } catch (error) {
    console.error(`[Validation] Failed to fetch result for ${matchId}:`, error);
    return null;
  }
}

/**
 * Determine if prediction was correct
 */
function validatePrediction(
  prediction: { type: CallType; prediction: string },
  result: MatchResult
): { outcome: CallOutcome; reason: string } {
  const pred = prediction.prediction.toLowerCase();
  const { homeScore, awayScore, winner } = result;
  const totalGoals = homeScore + awayScore;
  
  switch (prediction.type) {
    case 'MATCH_RESULT':
      if (pred.includes('home') || pred.includes('win')) {
        return winner === 'home' 
          ? { outcome: 'HIT', reason: 'Home team won as predicted' }
          : { outcome: 'MISS', reason: `Predicted home win, got ${winner}` };
      }
      if (pred.includes('away')) {
        return winner === 'away'
          ? { outcome: 'HIT', reason: 'Away team won as predicted' }
          : { outcome: 'MISS', reason: `Predicted away win, got ${winner}` };
      }
      if (pred.includes('draw')) {
        return winner === 'draw'
          ? { outcome: 'HIT', reason: 'Draw as predicted' }
          : { outcome: 'MISS', reason: `Predicted draw, got ${winner} win` };
      }
      break;
      
    case 'OVER_UNDER':
      const overMatch = pred.match(/over\s*(\d+\.?\d*)/i);
      const underMatch = pred.match(/under\s*(\d+\.?\d*)/i);
      
      if (overMatch) {
        const line = parseFloat(overMatch[1]);
        if (totalGoals > line) return { outcome: 'HIT', reason: `Over ${line} hit (${totalGoals} total)` };
        if (totalGoals < line) return { outcome: 'MISS', reason: `Over ${line} missed (${totalGoals} total)` };
        return { outcome: 'PUSH', reason: `Landed exactly on ${line}` };
      }
      if (underMatch) {
        const line = parseFloat(underMatch[1]);
        if (totalGoals < line) return { outcome: 'HIT', reason: `Under ${line} hit (${totalGoals} total)` };
        if (totalGoals > line) return { outcome: 'MISS', reason: `Under ${line} missed (${totalGoals} total)` };
        return { outcome: 'PUSH', reason: `Landed exactly on ${line}` };
      }
      break;
      
    case 'BTTS':
      const bothScored = homeScore > 0 && awayScore > 0;
      if (pred.includes('yes') || pred.includes('btts')) {
        return bothScored
          ? { outcome: 'HIT', reason: 'BTTS Yes hit' }
          : { outcome: 'MISS', reason: 'BTTS Yes missed' };
      }
      if (pred.includes('no')) {
        return !bothScored
          ? { outcome: 'HIT', reason: 'BTTS No hit' }
          : { outcome: 'MISS', reason: 'BTTS No missed' };
      }
      break;
      
    case 'CLEAN_SHEET':
      if (pred.includes('home')) {
        return awayScore === 0
          ? { outcome: 'HIT', reason: 'Home clean sheet hit' }
          : { outcome: 'MISS', reason: 'Home clean sheet missed' };
      }
      if (pred.includes('away')) {
        return homeScore === 0
          ? { outcome: 'HIT', reason: 'Away clean sheet hit' }
          : { outcome: 'MISS', reason: 'Away clean sheet missed' };
      }
      break;
      
    case 'DOUBLE_CHANCE':
      if (pred.includes('1x') || pred.includes('home or draw')) {
        return winner !== 'away'
          ? { outcome: 'HIT', reason: 'Home or Draw hit' }
          : { outcome: 'MISS', reason: 'Home or Draw missed' };
      }
      if (pred.includes('x2') || pred.includes('away or draw')) {
        return winner !== 'home'
          ? { outcome: 'HIT', reason: 'Away or Draw hit' }
          : { outcome: 'MISS', reason: 'Away or Draw missed' };
      }
      if (pred.includes('12') || pred.includes('home or away')) {
        return winner !== 'draw'
          ? { outcome: 'HIT', reason: 'Home or Away hit' }
          : { outcome: 'MISS', reason: 'Home or Away missed (draw)' };
      }
      break;
  }
  
  // Default: can't auto-validate
  return { outcome: 'PENDING', reason: 'Could not auto-validate' };
}

/**
 * Generate validation tweet
 */
function generateValidationTweet(
  prediction: {
    matchName: string;
    prediction: string;
    conviction: number;
  },
  outcome: CallOutcome,
  actualResult: string
): string {
  const conviction = '🔥'.repeat(prediction.conviction);
  
  if (outcome === 'HIT') {
    const phrases = [
      'Called it ✅',
      'The data doesn\'t lie ✅',
      'Pattern recognized ✅',
      'Numbers delivered ✅',
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    return formatForTwitter(
      `${phrase}\n\n${prediction.matchName}\n📊 Prediction: ${prediction.prediction}\n⚽ Result: ${actualResult}\n\nConviction: ${conviction}`,
      { hashtags: ['SportBot', 'CalledIt'] }
    );
  } else if (outcome === 'MISS') {
    const phrases = [
      'Missed this one 📉',
      'The data had other plans 📉',
      'Variance strikes 📉',
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    return formatForTwitter(
      `${phrase}\n\n${prediction.matchName}\n📊 Prediction: ${prediction.prediction}\n⚽ Result: ${actualResult}\n\nTransparency > ego. On to the next.`,
      { hashtags: ['SportBot', 'Accountability'] }
    );
  } else {
    return formatForTwitter(
      `Push 🤝\n\n${prediction.matchName}\nLanded exactly on the line.\n\nNo winner, no loser.`,
      { hashtags: ['SportBot'] }
    );
  }
}

export async function GET(request: NextRequest) {
  // Verify authorization - allow Vercel cron OR manual Bearer token
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const isAuthorized = authHeader === `Bearer ${CRON_SECRET}`;
  
  if (CRON_SECRET && !isVercelCron && !isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[Cron] Starting match validation...');
  
  try {
    // Get pending predictions where match should be finished
    // (kickoff was more than 2 hours ago for football, 3 hours for basketball)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const pendingPredictions = await prisma.prediction.findMany({
      where: {
        outcome: 'PENDING',
        kickoff: { lt: twoHoursAgo },
      },
      orderBy: { kickoff: 'asc' },
      take: 20, // Process in batches
    });
    
    console.log(`[Cron] Found ${pendingPredictions.length} predictions to validate`);
    
    const results = {
      processed: 0,
      hits: 0,
      misses: 0,
      pushes: 0,
      errors: 0,
      tweeted: 0,
    };
    
    const twitter = getTwitterClient();
    
    for (const prediction of pendingPredictions) {
      try {
        // Fetch match result
        const result = await getMatchResult(prediction.matchId, prediction.sport);
        
        if (!result) {
          console.log(`[Cron] No result for ${prediction.matchId}`);
          continue;
        }
        
        // Check if match is actually finished
        const finishedStatuses = ['FT', 'AET', 'PEN', 'AOT'];
        if (!finishedStatuses.includes(result.status)) {
          console.log(`[Cron] Match ${prediction.matchId} not finished: ${result.status}`);
          continue;
        }
        
        // Validate the prediction
        const validation = validatePrediction(
          { type: prediction.type, prediction: prediction.prediction },
          result
        );
        
        if (validation.outcome === 'PENDING') {
          console.log(`[Cron] Could not auto-validate ${prediction.id}`);
          continue;
        }
        
        const actualResult = `${result.homeScore}-${result.awayScore}`;
        
        // Evaluate value bet if present
        let valueBetOutcome: 'HIT' | 'MISS' | null = null;
        let valueBetProfit: number | null = null;
        
        if (prediction.valueBetSide && prediction.valueBetOdds) {
          const actualWinner = result.winner === 'home' ? 'HOME' : result.winner === 'away' ? 'AWAY' : 'DRAW';
          const valueBetWon = prediction.valueBetSide === actualWinner;
          valueBetOutcome = valueBetWon ? 'HIT' : 'MISS';
          valueBetProfit = valueBetWon ? (prediction.valueBetOdds - 1) : -1;
          console.log(`[Cron] Value bet: ${prediction.valueBetSide} @ ${prediction.valueBetOdds.toFixed(2)} -> ${valueBetOutcome}`);
        }
        
        // Update prediction in database
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            outcome: validation.outcome,
            actualResult,
            validatedAt: new Date(),
            ...(valueBetOutcome && { valueBetOutcome }),
            ...(valueBetProfit !== null && { valueBetProfit }),
          },
        });
        
        results.processed++;
        if (validation.outcome === 'HIT') results.hits++;
        if (validation.outcome === 'MISS') results.misses++;
        if (validation.outcome === 'PUSH') results.pushes++;
        
        // Post validation tweet (only for HIT/MISS, skip PUSHes)
        if (twitter.isConfigured() && validation.outcome !== 'PUSH') {
          const tweetContent = generateValidationTweet(
            {
              matchName: prediction.matchName,
              prediction: prediction.prediction,
              conviction: prediction.conviction,
            },
            validation.outcome,
            actualResult
          );
          
          const tweetResult = await twitter.postTweet(tweetContent);
          
          if (tweetResult.success && tweetResult.tweet) {
            await prisma.prediction.update({
              where: { id: prediction.id },
              data: { validationTweetId: tweetResult.tweet.id },
            });
            
            await prisma.twitterPost.create({
              data: {
                tweetId: tweetResult.tweet.id,
                content: tweetContent,
                category: 'CALL_VALIDATION',
              },
            });
            
            results.tweeted++;
          }
        }
        
        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        console.error(`[Cron] Error validating ${prediction.id}:`, err);
        results.errors++;
      }
    }
    
    // Update daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.dailyStats.upsert({
      where: { date: today },
      create: {
        date: today,
        hits: results.hits,
        misses: results.misses,
        pushes: results.pushes,
        totalPredictions: results.processed,
        hitRate: results.processed > 0 
          ? (results.hits / (results.hits + results.misses)) * 100 
          : 0,
      },
      update: {
        hits: { increment: results.hits },
        misses: { increment: results.misses },
        pushes: { increment: results.pushes },
        totalPredictions: { increment: results.processed },
      },
    });
    
    console.log('[Cron] Match validation complete:', results);
    
    return NextResponse.json({
      success: true,
      ...results,
    });
    
  } catch (error) {
    console.error('[Cron] Match validation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
