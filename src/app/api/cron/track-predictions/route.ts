/**
 * Prediction Tracker Cron Job
 * 
 * Tracks predictions from TWO sources:
 * 1. Agent Posts - AI-generated match insights with predictions
 * 2. Match Analysis - User-requested analysis with market edge predictions
 * 
 * Also checks finished matches and updates prediction outcomes.
 * 
 * Runs every 2 hours to:
 * 1. Extract predictions from recent agent posts that haven't been tracked
 * 2. Extract predictions from match analyses (market edge feature)
 * 3. Check match results for pending predictions and update outcomes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

export const maxDuration = 120;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

// Source types for predictions
type PredictionSource = 'AGENT_POST' | 'MATCH_ANALYSIS';

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  completed: boolean;
}

/**
 * Extract prediction details from agent post content using AI
 */
async function extractPredictionFromContent(content: string, matchRef: string): Promise<{
  predictedScenario: string;
  confidenceLevel: number;
  narrativeAngle: string;
} | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a sports prediction extractor. Analyze the content and extract any prediction made.
Return a JSON object with:
- predictedScenario: The predicted outcome/scenario (e.g., "Home win", "Over 2.5 goals", "BTTS", "Draw", "Away win", etc.)
- confidenceLevel: 1-10 based on how confident the post seems
- narrativeAngle: The key reasoning/angle behind the prediction

If no clear prediction is made, return null.
Only return valid JSON, no markdown.`,
        },
        {
          role: 'user',
          content: `Match: ${matchRef}\n\nContent:\n${content}`,
        },
      ],
    });

    const result = response.choices[0]?.message?.content;
    if (!result || result === 'null') return null;

    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  } catch (error) {
    console.error('[Track-Predictions] AI extraction failed:', error);
    return null;
  }
}

/**
 * Convert market edge (bestValueSide) to prediction scenario
 */
function marketEdgeToPrediction(
  bestValueSide: string | null,
  homeWinProb: number | null,
  drawProb: number | null,
  awayWinProb: number | null
): { predictedScenario: string; confidenceLevel: number } | null {
  if (!bestValueSide || bestValueSide === 'NONE') return null;

  // Calculate confidence based on probability difference
  const probs = { HOME: homeWinProb, DRAW: drawProb, AWAY: awayWinProb };
  const predictedProb = probs[bestValueSide as keyof typeof probs] || 0;
  
  // Convert probability to confidence (1-10 scale)
  const confidence = Math.min(10, Math.max(1, Math.round((predictedProb || 50) / 10)));

  const scenarioMap: Record<string, string> = {
    HOME: 'Home Win',
    AWAY: 'Away Win',
    DRAW: 'Draw',
  };

  return {
    predictedScenario: scenarioMap[bestValueSide] || bestValueSide,
    confidenceLevel: confidence,
  };
}

/**
 * Get match result from multiple sports APIs
 */
async function getMatchResult(homeTeam: string, awayTeam: string, matchDate: Date, league?: string | null): Promise<MatchResult | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return null;
  
  const dateStr = matchDate.toISOString().split('T')[0];
  const searchHome = homeTeam.toLowerCase();
  const searchAway = awayTeam.toLowerCase();
  
  // Detect sport from league or team names
  const isNBA = league?.toLowerCase().includes('nba') || 
    ['lakers', 'celtics', 'bulls', 'heat', 'warriors', 'nuggets', 'suns', 'bucks', 'nets', 'knicks', 'clippers', 'mavs', 'mavericks', 'rockets', 'spurs', 'jazz', 'thunder', 'grizzlies', 'pelicans', 'timberwolves', 'blazers', 'kings', 'magic', 'hawks', 'hornets', 'pistons', 'pacers', 'cavaliers', '76ers', 'raptors', 'wizards'].some(t => searchHome.includes(t) || searchAway.includes(t));
  
  const isNHL = league?.toLowerCase().includes('nhl') || 
    ['bruins', 'rangers', 'penguins', 'capitals', 'flyers', 'devils', 'islanders', 'canadiens', 'senators', 'maple leafs', 'lightning', 'panthers', 'hurricanes', 'predators', 'blue jackets', 'red wings', 'blackhawks', 'wild', 'blues', 'jets', 'avalanche', 'stars', 'coyotes', 'ducks', 'kings', 'sharks', 'kraken', 'golden knights', 'flames', 'oilers', 'canucks'].some(t => searchHome.includes(t) || searchAway.includes(t));

  const isNFL = league?.toLowerCase().includes('nfl') || 
    ['chiefs', 'bills', 'ravens', 'bengals', 'dolphins', 'patriots', 'jets', 'steelers', 'browns', 'titans', 'colts', 'jaguars', 'texans', 'broncos', 'raiders', 'chargers', 'eagles', 'cowboys', 'giants', 'commanders', 'lions', 'packers', 'vikings', 'bears', 'buccaneers', 'saints', 'falcons', 'panthers', 'seahawks', '49ers', 'cardinals', 'rams'].some(t => searchHome.includes(t) || searchAway.includes(t));

  try {
    // Try NBA API
    if (isNBA) {
      const nbaResult = await fetchSportResult('basketball', 12, dateStr, searchHome, searchAway, apiKey);
      if (nbaResult) return nbaResult;
    }
    
    // Try NHL API
    if (isNHL) {
      const nhlResult = await fetchSportResult('hockey', 57, dateStr, searchHome, searchAway, apiKey);
      if (nhlResult) return nhlResult;
    }
    
    // Try NFL API
    if (isNFL) {
      const nflResult = await fetchNFLResult(dateStr, searchHome, searchAway, apiKey);
      if (nflResult) return nflResult;
    }
    
    // Try Football API (default)
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${dateStr}&status=FT`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const fixtures = data.response || [];

    // Find matching fixture
    for (const fixture of fixtures) {
      const home = fixture.teams?.home?.name?.toLowerCase() || '';
      const away = fixture.teams?.away?.name?.toLowerCase() || '';

      // Check for match (fuzzy matching)
      if (
        (home.includes(searchHome) || searchHome.includes(home)) &&
        (away.includes(searchAway) || searchAway.includes(away))
      ) {
        return {
          homeTeam: fixture.teams.home.name,
          awayTeam: fixture.teams.away.name,
          homeScore: fixture.goals?.home ?? 0,
          awayScore: fixture.goals?.away ?? 0,
          completed: true,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[Track-Predictions] Failed to get match result:', error);
    return null;
  }
}

/**
 * Fetch result from API-Sports for a specific sport
 */
async function fetchSportResult(
  sport: 'basketball' | 'hockey',
  leagueId: number,
  dateStr: string,
  searchHome: string,
  searchAway: string,
  apiKey: string
): Promise<MatchResult | null> {
  try {
    const baseUrl = sport === 'basketball' 
      ? 'https://v1.basketball.api-sports.io' 
      : 'https://v1.hockey.api-sports.io';
    
    const response = await fetch(
      `${baseUrl}/games?date=${dateStr}&league=${leagueId}&season=2024-2025`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': baseUrl.replace('https://', ''),
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const games = data.response || [];

    for (const game of games) {
      const home = game.teams?.home?.name?.toLowerCase() || '';
      const away = game.teams?.away?.name?.toLowerCase() || '';
      const status = game.status?.short || '';

      // Only count finished games
      if (!['FT', 'AOT', 'AP'].includes(status)) continue;

      if (
        (home.includes(searchHome) || searchHome.includes(home)) &&
        (away.includes(searchAway) || searchAway.includes(away))
      ) {
        return {
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          homeScore: game.scores?.home?.total ?? game.scores?.home?.points ?? 0,
          awayScore: game.scores?.away?.total ?? game.scores?.away?.points ?? 0,
          completed: true,
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`[Track-Predictions] Failed to fetch ${sport} result:`, error);
    return null;
  }
}

/**
 * Fetch NFL result from API-Sports American Football API
 */
async function fetchNFLResult(
  dateStr: string,
  searchHome: string,
  searchAway: string,
  apiKey: string
): Promise<MatchResult | null> {
  try {
    const response = await fetch(
      `https://v1.american-football.api-sports.io/games?date=${dateStr}&league=1&season=2024`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'v1.american-football.api-sports.io',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const games = data.response || [];

    for (const game of games) {
      const home = game.teams?.home?.name?.toLowerCase() || '';
      const away = game.teams?.away?.name?.toLowerCase() || '';
      const status = game.game?.status?.short || '';

      // Only count finished games
      if (!['FT', 'AOT', 'AP', 'POST'].includes(status)) continue;

      if (
        (home.includes(searchHome) || searchHome.includes(home)) &&
        (away.includes(searchAway) || searchAway.includes(away))
      ) {
        return {
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          homeScore: game.scores?.home?.total ?? 0,
          awayScore: game.scores?.away?.total ?? 0,
          completed: true,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[Track-Predictions] Failed to fetch NFL result:', error);
    return null;
  }
}

/**
 * Evaluate if prediction was accurate
 */
function evaluatePrediction(
  predictedScenario: string,
  homeScore: number,
  awayScore: number
): { wasAccurate: boolean; actualResult: string } {
  const predicted = predictedScenario.toLowerCase();
  const totalGoals = homeScore + awayScore;
  const actualResult = homeScore > awayScore ? 'Home Win' : awayScore > homeScore ? 'Away Win' : 'Draw';

  // Check various prediction types
  if (predicted.includes('home win') || predicted.includes('home victory')) {
    return { wasAccurate: homeScore > awayScore, actualResult };
  }
  if (predicted.includes('away win') || predicted.includes('away victory')) {
    return { wasAccurate: awayScore > homeScore, actualResult };
  }
  if (predicted.includes('draw')) {
    return { wasAccurate: homeScore === awayScore, actualResult };
  }
  if (predicted.includes('over 2.5') || predicted.includes('over2.5')) {
    return { wasAccurate: totalGoals > 2.5, actualResult: `${totalGoals} goals` };
  }
  if (predicted.includes('under 2.5') || predicted.includes('under2.5')) {
    return { wasAccurate: totalGoals < 2.5, actualResult: `${totalGoals} goals` };
  }
  if (predicted.includes('over 1.5') || predicted.includes('over1.5')) {
    return { wasAccurate: totalGoals > 1.5, actualResult: `${totalGoals} goals` };
  }
  if (predicted.includes('btts') || predicted.includes('both teams to score')) {
    return { wasAccurate: homeScore > 0 && awayScore > 0, actualResult: `${homeScore}-${awayScore}` };
  }

  // Default: can't evaluate
  return { wasAccurate: false, actualResult };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization');
    const vercelCron = request.headers.get('x-vercel-cron');
    const isVercelCron = vercelCron === '1' || vercelCron === 'true';
    const isAuthorized = !CRON_SECRET || authHeader === `Bearer ${CRON_SECRET}`;

    if (!isVercelCron && !isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      newPredictions: 0,
      newAnalysisPredictions: 0,
      updatedOutcomes: 0,
      errors: [] as string[],
    };

    // ============================================
    // STEP 1: Extract predictions from recent agent posts
    // ============================================
    console.log('[Track-Predictions] Step 1: Extracting predictions from agent posts...');

    // Get agent posts from last 48 hours that might have predictions
    const recentPosts = await prisma.agentPost.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
        matchRef: { not: null },
        homeTeam: { not: null },
        awayTeam: { not: null },
        category: {
          in: ['FORM_ANALYSIS', 'MOMENTUM_SHIFT', 'AI_INSIGHT', 'MATCH_COMPLEXITY'],
        },
        predictionId: null, // Not yet linked to a prediction
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[Track-Predictions] Found ${recentPosts.length} recent posts to check`);

    for (const post of recentPosts) {
      // Check if prediction already exists for this match
      const existingPrediction = await prisma.prediction.findFirst({
        where: {
          matchName: post.matchRef || '',
          source: 'AGENT_POST',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last week
          },
        },
      });

      if (existingPrediction) {
        // Link the post to existing prediction
        await prisma.agentPost.update({
          where: { id: post.id },
          data: { predictionId: existingPrediction.id },
        });
        continue;
      }

      // Extract prediction from content
      const prediction = await extractPredictionFromContent(
        post.content,
        post.matchRef || `${post.homeTeam} vs ${post.awayTeam}`
      );

      if (prediction) {
        try {
          const matchName = post.matchRef || `${post.homeTeam} vs ${post.awayTeam}`;
          const newPrediction = await prisma.prediction.create({
            data: {
              matchId: matchName.replace(/\s+/g, '_').toLowerCase(),
              matchName,
              sport: 'soccer', // Default, can be improved
              league: post.league || 'Unknown',
              kickoff: new Date(), // Will be updated when we get actual match time
              type: 'MATCH_RESULT',
              prediction: prediction.predictedScenario,
              reasoning: prediction.narrativeAngle,
              conviction: Math.round(prediction.confidenceLevel / 10), // Convert 0-100 to 1-10
              source: 'AGENT_POST',
              outcome: 'PENDING',
            },
          });
          
          // Link the agent post to the prediction
          await prisma.agentPost.update({
            where: { id: post.id },
            data: { predictionId: newPrediction.id },
          });
          
          results.newPredictions++;
          console.log(`[Track-Predictions] Created prediction for ${post.matchRef}`);
        } catch (error) {
          results.errors.push(`Failed to create prediction for ${post.matchRef}`);
        }
      }
    }

    // ============================================
    // STEP 2: Extract predictions from match analyses (Market Edge)
    // ============================================
    console.log('[Track-Predictions] Step 2: Extracting predictions from match analyses...');

    // Get recent analyses with market edge predictions
    const recentAnalyses = await prisma.analysis.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000), // Last 48 hours
        },
        bestValueSide: {
          not: null,
          notIn: ['NONE', ''],
        },
        matchDate: {
          not: null,
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Match is upcoming (within last 24h or future)
        },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[Track-Predictions] Found ${recentAnalyses.length} analyses with market edge`);

    for (const analysis of recentAnalyses) {
      const matchRef = `${analysis.homeTeam} vs ${analysis.awayTeam}`;
      
      // Check if prediction already exists (skip - match-preview already creates it)
      const existingPrediction = await prisma.prediction.findFirst({
        where: {
          matchName: matchRef,
          source: 'MATCH_ANALYSIS',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingPrediction) continue;

      // Convert market edge to prediction
      const prediction = marketEdgeToPrediction(
        analysis.bestValueSide,
        analysis.homeWinProb,
        analysis.drawProb,
        analysis.awayWinProb
      );

      if (prediction) {
        try {
          await prisma.prediction.create({
            data: {
              matchId: matchRef.replace(/\s+/g, '_').toLowerCase(),
              matchName: matchRef,
              sport: analysis.sport || 'soccer',
              league: analysis.league || 'Unknown',
              kickoff: analysis.matchDate || new Date(),
              type: 'MATCH_RESULT',
              prediction: prediction.predictedScenario,
              reasoning: `Market Edge Analysis: ${analysis.bestValueSide} identified as best value`,
              conviction: Math.round(prediction.confidenceLevel / 10),
              source: 'MATCH_ANALYSIS',
              outcome: 'PENDING',
            },
          });
          results.newAnalysisPredictions++;
          console.log(`[Track-Predictions] Created analysis prediction for ${matchRef}`);
        } catch (error) {
          results.errors.push(`Failed to create analysis prediction for ${matchRef}`);
        }
      }
    }

    // ============================================
    // STEP 3: Check outcomes for pending predictions
    // ============================================
    console.log('[Track-Predictions] Step 3: Checking outcomes for pending predictions...');

    // Get predictions without outcomes from past matches
    const pendingPredictions = await prisma.prediction.findMany({
      where: {
        outcome: 'PENDING',
        kickoff: {
          lte: new Date(), // Match should have started
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last week
        },
      },
      take: 20,
      orderBy: { kickoff: 'asc' },
    });

    console.log(`[Track-Predictions] Found ${pendingPredictions.length} pending predictions`);

    for (const pred of pendingPredictions) {
      // Parse teams from matchName
      const [homeTeam, awayTeam] = pred.matchName.split(' vs ').map(t => t.trim());
      
      if (!homeTeam || !awayTeam) continue;

      // Get match result (pass league for sport detection)
      const result = await getMatchResult(homeTeam, awayTeam, pred.kickoff, pred.league);

      if (result && result.completed && pred.prediction) {
        const evaluation = evaluatePrediction(
          pred.prediction,
          result.homeScore,
          result.awayScore
        );

        try {
          await prisma.prediction.update({
            where: { id: pred.id },
            data: {
              actualResult: evaluation.actualResult,
              actualScore: `${result.homeScore}-${result.awayScore}`,
              outcome: evaluation.wasAccurate ? 'HIT' : 'MISS',
              validatedAt: new Date(),
            },
          });
          results.updatedOutcomes++;
          console.log(`[Track-Predictions] Updated outcome for ${pred.matchName}: ${evaluation.wasAccurate ? 'HIT' : 'MISS'}`);
        } catch (error) {
          results.errors.push(`Failed to update outcome for ${pred.matchName}`);
        }
      }
    }

    console.log(`[Track-Predictions] Completed in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      ...results,
      duration: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[Track-Predictions] Error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
