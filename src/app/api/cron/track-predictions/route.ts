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
import { applyConvictionCap } from '@/lib/accuracy-core/types';
import { normalizeTeamName, teamsMatch } from '@/lib/team-aliases';
import perplexityModule, { getPerplexityClient } from '@/lib/perplexity';

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
async function getMatchResult(homeTeam: string, awayTeam: string, matchDate: Date, league?: string | null, sport?: string | null): Promise<MatchResult | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return null;

  const dateStr = matchDate.toISOString().split('T')[0];
  // Also try the next day in case match crossed midnight or API has different timezone
  const nextDay = new Date(matchDate.getTime() + 24 * 60 * 60 * 1000);
  const nextDayStr = nextDay.toISOString().split('T')[0];

  // Normalize team names using aliases
  const sportKey = sport || 'soccer';
  const normalizedHome = normalizeTeamName(homeTeam, sportKey);
  const normalizedAway = normalizeTeamName(awayTeam, sportKey);
  const searchHome = normalizedHome.toLowerCase();
  const searchAway = normalizedAway.toLowerCase();
  const sportLower = sport?.toLowerCase() || '';
  const leagueLower = league?.toLowerCase() || '';

  // Detect sport from sport field, league, or team names
  const isNBA = sportLower.includes('basketball_nba') || sportLower.includes('basketball') || leagueLower.includes('nba') ||
    ['lakers', 'celtics', 'bulls', 'heat', 'warriors', 'nuggets', 'suns', 'bucks', 'nets', 'knicks', 'clippers', 'mavs', 'mavericks', 'rockets', 'spurs', 'jazz', 'thunder', 'grizzlies', 'pelicans', 'timberwolves', 'blazers', 'kings', 'magic', 'hawks', 'hornets', 'pistons', 'pacers', 'cavaliers', '76ers', 'raptors', 'wizards'].some(t => searchHome.includes(t) || searchAway.includes(t));

  const isEuroLeague = sportLower.includes('euroleague') || leagueLower.includes('euroleague') ||
    ['olympiacos', 'panathinaikos', 'fenerbahce', 'anadolu efes', 'real madrid', 'barcelona', 'maccabi', 'partizan', 'crvena zvezda', 'zalgiris', 'žalgiris', 'virtus', 'baskonia', 'milano', 'asvel', 'bayern munich', 'alba berlin'].some(t => searchHome.includes(t) || searchAway.includes(t));

  const isNHL = sportLower.includes('hockey') || sportLower.includes('icehockey') || leagueLower.includes('nhl') ||
    ['bruins', 'rangers', 'penguins', 'capitals', 'flyers', 'devils', 'islanders', 'canadiens', 'senators', 'maple leafs', 'lightning', 'panthers', 'hurricanes', 'predators', 'blue jackets', 'red wings', 'blackhawks', 'wild', 'blues', 'jets', 'avalanche', 'stars', 'coyotes', 'ducks', 'kings', 'sharks', 'kraken', 'golden knights', 'flames', 'oilers', 'canucks'].some(t => searchHome.includes(t) || searchAway.includes(t));

  const isNFL = sportLower.includes('americanfootball') || sportLower.includes('nfl') || leagueLower.includes('nfl') ||
    ['chiefs', 'bills', 'ravens', 'bengals', 'dolphins', 'patriots', 'jets', 'steelers', 'browns', 'titans', 'colts', 'jaguars', 'texans', 'broncos', 'raiders', 'chargers', 'eagles', 'cowboys', 'giants', 'commanders', 'lions', 'packers', 'vikings', 'bears', 'buccaneers', 'saints', 'falcons', 'panthers', 'seahawks', '49ers', 'cardinals', 'rams'].some(t => searchHome.includes(t) || searchAway.includes(t));

  // Detect specific soccer competitions for league-specific API queries
  const isUCL = sportLower.includes('uefa_champs_league') || leagueLower.includes('champions league') || leagueLower.includes('ucl');
  const isUEL = sportLower.includes('uefa_europa_league') || leagueLower.includes('europa league') || leagueLower.includes('uel');
  const isNCAAF = sportLower.includes('ncaaf') || leagueLower.includes('ncaa') || leagueLower.includes('college football');

  // Try both the match date and next day
  for (const tryDate of [dateStr, nextDayStr]) {
    try {
      // Try EuroLeague API (league 120)
      if (isEuroLeague) {
        const euroResult = await fetchSportResult('basketball', 120, tryDate, searchHome, searchAway, apiKey);
        if (euroResult) return euroResult;
        
        // Fallback: web search for EuroLeague results
        const webResult = await fetchEuroLeagueResultViaWeb(homeTeam, awayTeam, matchDate);
        if (webResult) return webResult;
      }

      // Try NBA API (league 12)
      if (isNBA) {
        const nbaResult = await fetchSportResult('basketball', 12, tryDate, searchHome, searchAway, apiKey);
        if (nbaResult) return nbaResult;
      }

      // Try NHL API
      if (isNHL) {
        const nhlResult = await fetchSportResult('hockey', 57, tryDate, searchHome, searchAway, apiKey);
        if (nhlResult) return nhlResult;
      }

      // Try NFL API
      if (isNFL) {
        const nflResult = await fetchNFLResult(tryDate, searchHome, searchAway, apiKey);
        if (nflResult) return nflResult;
      }

      // Try Football API for soccer (with league-specific queries first)
      if (!isNBA && !isEuroLeague && !isNHL && !isNFL && !isNCAAF) {
        // League IDs for API-Football (v3): UCL=2, UEL=3, Turkey Super=203, Portugal Primeira=94
        const leagueIds: number[] = [];
        if (isUCL) leagueIds.push(2);  // UEFA Champions League
        if (isUEL) leagueIds.push(3);  // UEFA Europa League
        if (sportLower.includes('turkey')) leagueIds.push(203);  // Turkish Super League
        if (sportLower.includes('portugal')) leagueIds.push(94);  // Portuguese Primeira Liga
        
        // Get season year for API-Football (uses start year of season)
        // Jan-Jun uses previous year (e.g., Jan 2026 → 2025 for 2025/26 season)
        // Jul-Dec uses current year (e.g., Sep 2025 → 2025 for 2025/26 season)
        const seasonYear = new Date(tryDate).getMonth() >= 6 
          ? new Date(tryDate).getFullYear() 
          : new Date(tryDate).getFullYear() - 1;
        
        console.log(`[Track-Predictions] Soccer season year for ${tryDate}: ${seasonYear} (2025/26 format)`);
        
        // Try league-specific queries first if we have league IDs
        for (const leagueId of leagueIds) {
          try {
            console.log(`[Track-Predictions] Querying league ${leagueId} for season ${seasonYear}...`);
            const leagueResponse = await fetch(
              `https://v3.football.api-sports.io/fixtures?date=${tryDate}&league=${leagueId}&season=${seasonYear}&status=FT-AET-PEN`,
              {
                headers: {
                  'x-rapidapi-key': apiKey,
                  'x-rapidapi-host': 'v3.football.api-sports.io',
                },
              }
            );

            if (leagueResponse.ok) {
              const leagueData = await leagueResponse.json();
              const leagueFixtures = leagueData.response || [];
              console.log(`[Track-Predictions] Found ${leagueFixtures.length} finished matches for league ${leagueId} on ${tryDate}`);

              for (const fixture of leagueFixtures) {
                const home = fixture.teams?.home?.name?.toLowerCase() || '';
                const away = fixture.teams?.away?.name?.toLowerCase() || '';

                if (teamsMatch(searchHome, home, sportKey) && teamsMatch(searchAway, away, sportKey)) {
                  return {
                    homeTeam: fixture.teams.home.name,
                    awayTeam: fixture.teams.away.name,
                    homeScore: fixture.goals?.home ?? 0,
                    awayScore: fixture.goals?.away ?? 0,
                    completed: true,
                  };
                }
              }
            }
          } catch (leagueError) {
            console.error(`[Track-Predictions] League ${leagueId} query failed:`, leagueError);
          }
        }

        // Fallback: query all finished matches for the date
        const response = await fetch(
          `https://v3.football.api-sports.io/fixtures?date=${tryDate}&status=FT-AET-PEN`,
          {
            headers: {
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': 'v3.football.api-sports.io',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const fixtures = data.response || [];

          // Find matching fixture
          for (const fixture of fixtures) {
            const home = fixture.teams?.home?.name?.toLowerCase() || '';
            const away = fixture.teams?.away?.name?.toLowerCase() || '';

            // Check for match using improved team matching
            if (teamsMatch(searchHome, home, sportKey) && teamsMatch(searchAway, away, sportKey)) {
              return {
                homeTeam: fixture.teams.home.name,
                awayTeam: fixture.teams.away.name,
                homeScore: fixture.goals?.home ?? 0,
                awayScore: fixture.goals?.away ?? 0,
                completed: true,
              };
            }
          }
        }
      }
    } catch (error) {
      console.error(`[Track-Predictions] Failed to get match result for ${tryDate}:`, error);
    }
  }

  return null;
}

/**
 * Calculate the correct season string based on date
 * NBA seasons run October to June: "2024-2025" format
 * NHL seasons use integer year: 2024, 2025
 * NFL seasons use integer year: 2024, 2025
 */
function getSeasonForDate(dateStr: string, sport: 'nba' | 'nhl' | 'nfl' = 'nba'): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  if (sport === 'nfl') {
    // NFL season runs August to February
    // Games in Jan/Feb are the PREVIOUS year's season
    // e.g., Jan 2026 playoffs = 2025 season
    return month <= 2 ? String(year - 1) : String(year);
  }

  if (sport === 'nhl') {
    // NHL API uses integer season (2024, 2025)
    // Season starts in October, ends in June
    return month >= 10 ? String(year) : String(year - 1);
  }

  // NBA: Season spans two years in format "2024-2025"
  // October-December = first year of season
  // January-June = second year of season
  if (month >= 10) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
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

    // EuroLeague (120) uses same season format as NBA
    const seasonType = sport === 'basketball' ? 'nba' : 'nhl';
    const season = getSeasonForDate(dateStr, seasonType);
    console.log(`[Track-Predictions] Fetching ${sport} league ${leagueId} games for ${dateStr}, season ${season}`);

    const response = await fetch(
      `${baseUrl}/games?date=${dateStr}&league=${leagueId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': baseUrl.replace('https://', ''),
        },
      }
    );

    if (!response.ok) {
      console.log(`[Track-Predictions] ${sport} API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const games = data.response || [];

    for (const game of games) {
      const home = game.teams?.home?.name?.toLowerCase() || '';
      const away = game.teams?.away?.name?.toLowerCase() || '';
      const status = game.status?.short || '';

      // Only count finished games
      if (!['FT', 'AOT', 'AP'].includes(status)) continue;

      // Use improved team matching with aliases
      const sportKey = sport === 'basketball' ? 'basketball_nba' : 'icehockey_nhl';
      if (
        teamsMatch(home, searchHome, sportKey) &&
        teamsMatch(away, searchAway, sportKey)
      ) {
        // Hockey API returns scores directly as numbers: { home: 2, away: 3 }
        // Basketball API returns scores as objects: { home: { total: 100, points: 100 }, ... }
        const homeScore = typeof game.scores?.home === 'number'
          ? game.scores.home
          : (game.scores?.home?.total ?? game.scores?.home?.points ?? 0);
        const awayScore = typeof game.scores?.away === 'number'
          ? game.scores.away
          : (game.scores?.away?.total ?? game.scores?.away?.points ?? 0);

        return {
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          homeScore,
          awayScore,
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
 * Fetch EuroLeague result via web search (Perplexity)
 * Fallback when API-Sports doesn't have the data
 */
async function fetchEuroLeagueResultViaWeb(
  homeTeam: string,
  awayTeam: string,
  matchDate: Date
): Promise<MatchResult | null> {
  const client = getPerplexityClient();
  if (!client.isConfigured()) {
    console.log('[Track-Predictions] Perplexity not configured, skipping web search');
    return null;
  }

  try {
    const dateStr = matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const searchQuery = `${homeTeam} vs ${awayTeam} EuroLeague basketball final score result ${dateStr}`;
    
    console.log(`[Track-Predictions] Web search for EuroLeague: ${searchQuery}`);
    
    const result = await client.search(searchQuery, {
      recency: 'week',
      model: 'sonar',
      maxTokens: 200,
    });

    if (!result.success || !result.content) {
      return null;
    }

    // Parse the result using AI to extract score
    const parseResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Extract the final score from this text about a basketball match between "${homeTeam}" and "${awayTeam}".
Return ONLY a JSON object: {"homeScore": number, "awayScore": number, "completed": boolean}
If you cannot find a clear final score, return {"completed": false}
Only return valid JSON, no markdown.`,
        },
        {
          role: 'user',
          content: result.content,
        },
      ],
    });

    const parseResult = parseResponse.choices[0]?.message?.content;
    if (!parseResult) return null;

    try {
      const parsed = JSON.parse(parseResult);
      if (parsed.completed && typeof parsed.homeScore === 'number' && typeof parsed.awayScore === 'number') {
        console.log(`[Track-Predictions] Web search found EuroLeague result: ${homeTeam} ${parsed.homeScore} - ${parsed.awayScore} ${awayTeam}`);
        return {
          homeTeam,
          awayTeam,
          homeScore: parsed.homeScore,
          awayScore: parsed.awayScore,
          completed: true,
        };
      }
    } catch {
      // JSON parse failed
    }

    return null;
  } catch (error) {
    console.error('[Track-Predictions] Web search for EuroLeague failed:', error);
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
    const season = getSeasonForDate(dateStr, 'nfl');
    console.log(`[Track-Predictions] Fetching NFL games for ${dateStr}, season ${season}`);

    const response = await fetch(
      `https://v1.american-football.api-sports.io/games?date=${dateStr}&league=1&season=${season}`,
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
  console.log('[Track-Predictions] Starting cron job...');

  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization');
    const vercelCron = request.headers.get('x-vercel-cron');
    const url = new URL(request.url);
    const secretParam = url.searchParams.get('secret');

    const isVercelCron = vercelCron === '1' || vercelCron === 'true';
    const isAuthorized = !CRON_SECRET || authHeader === `Bearer ${CRON_SECRET}` || secretParam === CRON_SECRET;

    console.log(`[Track-Predictions] Auth check: isVercelCron=${isVercelCron}, isAuthorized=${isAuthorized}`);

    if (!isVercelCron && !isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      newPredictions: 0,
      newAnalysisPredictions: 0,
      updatedOutcomes: 0,
      stuckPredictions: 0,
      voidedPredictions: 0,
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
      const matchName = post.matchRef || `${post.homeTeam} vs ${post.awayTeam}`;

      // Check if ANY prediction already exists for this match (from ANY source)
      const existingPrediction = await prisma.prediction.findFirst({
        where: {
          OR: [
            { matchName: matchName },
            { matchName: { contains: post.homeTeam || '', mode: 'insensitive' } },
          ],
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last week
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingPrediction) {
        // Link the post to existing prediction (even if from PRE_ANALYZE)
        await prisma.agentPost.update({
          where: { id: post.id },
          data: { predictionId: existingPrediction.id },
        });
        console.log(`[Track-Predictions] Linked post to existing ${existingPrediction.source} prediction for ${matchName}`);
        continue;
      }

      // Extract prediction from content
      const prediction = await extractPredictionFromContent(
        post.content,
        matchName
      );

      if (prediction) {
        try {
          // Detect sport from league name
          const leagueLower = (post.league || '').toLowerCase();
          let sport = 'soccer';
          if (leagueLower.includes('nba') || leagueLower.includes('basketball')) {
            sport = 'basketball_nba';
          } else if (leagueLower.includes('nfl') || leagueLower.includes('football')) {
            sport = 'americanfootball_nfl';
          } else if (leagueLower.includes('nhl') || leagueLower.includes('hockey')) {
            sport = 'icehockey_nhl';
          }

          // Try to find a PRE_ANALYZE prediction to get correct kickoff time
          const preAnalyzePred = await prisma.prediction.findFirst({
            where: {
              source: 'PRE_ANALYZE',
              sport: sport,
              kickoff: {
                gte: new Date(), // Future matches
                lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Within next week
              },
              OR: [
                { matchName: { contains: post.homeTeam || '', mode: 'insensitive' } },
                { matchName: { contains: post.awayTeam || '', mode: 'insensitive' } },
              ],
            },
          });

          // Use PRE_ANALYZE kickoff if found, otherwise use 24 hours from now as estimate
          const kickoffTime = preAnalyzePred?.kickoff || new Date(Date.now() + 24 * 60 * 60 * 1000);
          const matchIdToUse = preAnalyzePred?.matchId || matchName.replace(/\s+/g, '_').toLowerCase();

          const newPrediction = await prisma.prediction.create({
            data: {
              matchId: matchIdToUse,
              matchName,
              sport,
              league: post.league || 'Unknown',
              kickoff: kickoffTime,
              type: 'MATCH_RESULT',
              prediction: prediction.predictedScenario,
              reasoning: prediction.narrativeAngle,
              conviction: Math.round(prediction.confidenceLevel), // Already 1-10 scale from LLM
              source: 'AGENT_POST',
              outcome: 'PENDING',
            },
          });

          results.newPredictions++;
          console.log(`[Track-Predictions] Created prediction for ${post.matchRef} (${sport}, kickoff: ${kickoffTime.toISOString()})`);
        } catch (error) {
          console.error(`[Track-Predictions] Error creating prediction:`, error);
          results.errors.push(`Failed to create prediction for ${post.matchRef}: ${error instanceof Error ? error.message : 'Unknown'}`);
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

      // Check if prediction already exists from ANY source (skip to avoid duplicates)
      const existingPrediction = await prisma.prediction.findFirst({
        where: {
          matchName: matchRef,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingPrediction) {
        console.log(`[Track-Predictions] Skipping ${matchRef} - prediction already exists from ${existingPrediction.source}`);
        continue;
      }

      // Convert market edge to prediction
      const prediction = marketEdgeToPrediction(
        analysis.bestValueSide,
        analysis.homeWinProb,
        analysis.drawProb,
        analysis.awayWinProb
      );

      if (prediction) {
        try {
          // Calculate conviction with sport-specific cap
          const sportKey = analysis.sport || 'soccer';
          const rawConviction = Math.round(prediction.confidenceLevel); // Already 1-10 scale from marketEdgeToPrediction
          const cappedConviction = applyConvictionCap(rawConviction, sportKey);

          // Get the probability for the best value side to include in prediction
          const bestValueProb = analysis.bestValueSide === 'HOME' ? analysis.homeWinProb :
            analysis.bestValueSide === 'AWAY' ? analysis.awayWinProb :
            analysis.bestValueSide === 'DRAW' ? analysis.drawProb : null;

          await prisma.prediction.create({
            data: {
              matchId: matchRef.replace(/\s+/g, '_').toLowerCase(),
              matchName: matchRef,
              sport: sportKey,
              league: analysis.league || 'Unknown',
              kickoff: analysis.matchDate || new Date(),
              type: 'MATCH_RESULT',
              prediction: prediction.predictedScenario,
              reasoning: `Market Edge Analysis: ${analysis.bestValueSide} identified as best value`,
              conviction: cappedConviction,
              source: 'MATCH_ANALYSIS',
              outcome: 'PENDING',
              // Include probabilities for AI chat consistency
              homeWin: analysis.homeWinProb,
              awayWin: analysis.awayWinProb,
              draw: analysis.drawProb,
              // Model probability for the selected side
              modelProbability: bestValueProb,
              // Store full response if available
              fullResponse: analysis.fullResponse ? JSON.parse(JSON.stringify(analysis.fullResponse)) : undefined,
            },
          });
          results.newAnalysisPredictions++;
          console.log(`[Track-Predictions] Created analysis prediction for ${matchRef} (conviction: ${rawConviction} -> ${cappedConviction}, modelProb: ${bestValueProb?.toFixed(1)}%)`);
        } catch (error) {
          console.error(`[Track-Predictions] Error creating analysis prediction:`, error);
          results.errors.push(`Failed to create analysis prediction for ${matchRef}: ${error instanceof Error ? error.message : 'Unknown'}`);
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
          lte: new Date(Date.now() - 3 * 60 * 60 * 1000), // Match should have been over for 3+ hours
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last week
        },
      },
      take: 50, // Process up to 50 pending predictions per run
      orderBy: { kickoff: 'asc' },
    });

    console.log(`[Track-Predictions] Found ${pendingPredictions.length} pending predictions`);

    for (const pred of pendingPredictions) {
      // Parse teams from matchName
      const [homeTeam, awayTeam] = pred.matchName.split(' vs ').map(t => t.trim());

      if (!homeTeam || !awayTeam) continue;

      console.log(`[Track-Predictions] Checking: ${pred.matchName} (${pred.sport})`);

      // Get match result (pass sport and league for sport detection)
      const result = await getMatchResult(homeTeam, awayTeam, pred.kickoff, pred.league, pred.sport);

      console.log(`[Track-Predictions] Result for ${pred.matchName}: ${result ? `${result.homeScore}-${result.awayScore}` : 'NOT FOUND'}`);

      if (result && result.completed && pred.prediction) {
        const evaluation = evaluatePrediction(
          pred.prediction,
          result.homeScore,
          result.awayScore
        );

        // Also evaluate value bet if present
        let valueBetOutcome: 'HIT' | 'MISS' | null = null;
        let valueBetProfit: number | null = null;

        if (pred.valueBetSide && pred.valueBetOdds) {
          const actualWinner = result.homeScore > result.awayScore ? 'HOME' :
            result.awayScore > result.homeScore ? 'AWAY' : 'DRAW';
          const valueBetWon = pred.valueBetSide === actualWinner;
          valueBetOutcome = valueBetWon ? 'HIT' : 'MISS';
          // Calculate profit: if won, profit = odds - 1; if lost, profit = -1
          valueBetProfit = valueBetWon ? (pred.valueBetOdds - 1) : -1;
        }

        try {
          await prisma.prediction.update({
            where: { id: pred.id },
            data: {
              actualResult: evaluation.actualResult,
              actualScore: `${result.homeScore}-${result.awayScore}`,
              outcome: evaluation.wasAccurate ? 'HIT' : 'MISS',
              validatedAt: new Date(),
              // Value bet outcome tracking
              ...(valueBetOutcome && { valueBetOutcome }),
              ...(valueBetProfit !== null && { valueBetProfit }),
            },
          });
          results.updatedOutcomes++;
          const valueBetInfo = valueBetOutcome ? ` | Value bet: ${valueBetOutcome} (${valueBetProfit && valueBetProfit > 0 ? '+' : ''}${valueBetProfit?.toFixed(2)} units)` : '';
          console.log(`[Track-Predictions] Updated outcome for ${pred.matchName}: ${evaluation.wasAccurate ? 'HIT' : 'MISS'}${valueBetInfo}`);
        } catch (error) {
          console.error(`[Track-Predictions] Error updating outcome:`, error);
          results.errors.push(`Failed to update outcome for ${pred.matchName}: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }
    }

    // ============================================
    // STEP 4: Flag stuck predictions (PENDING > 24h after kickoff)
    // ============================================
    console.log('[Track-Predictions] Step 4: Checking for stuck predictions...');

    const stuckPredictions = await prisma.prediction.findMany({
      where: {
        outcome: 'PENDING',
        kickoff: {
          lte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h+ ago
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Within last 2 weeks
        },
      },
      select: {
        id: true,
        matchName: true,
        sport: true,
        kickoff: true,
      },
    });

    results.stuckPredictions = stuckPredictions.length;

    if (stuckPredictions.length > 0) {
      console.warn(`[Track-Predictions] ⚠️ ${stuckPredictions.length} STUCK predictions (PENDING > 24h):`);
      for (const pred of stuckPredictions.slice(0, 10)) {
        const hoursAgo = Math.round((Date.now() - new Date(pred.kickoff).getTime()) / (1000 * 60 * 60));
        console.warn(`  - ${pred.matchName} (${pred.sport}) - ${hoursAgo}h ago`);
      }
      if (stuckPredictions.length > 10) {
        console.warn(`  ... and ${stuckPredictions.length - 10} more`);
      }
    }

    // ============================================
    // STEP 5: Mark very old stuck predictions as VOID (7+ days)
    // ============================================
    console.log('[Track-Predictions] Step 5: Voiding old stuck predictions...');

    const veryOldPredictions = await prisma.prediction.findMany({
      where: {
        outcome: 'PENDING',
        kickoff: {
          lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7+ days ago
        },
      },
      select: {
        id: true,
        matchName: true,
        sport: true,
      },
    });

    if (veryOldPredictions.length > 0) {
      const voidedIds = veryOldPredictions.map(p => p.id);
      await prisma.prediction.updateMany({
        where: { id: { in: voidedIds } },
        data: { 
          outcome: 'VOID',
          actualResult: 'Result not available - prediction expired',
          validatedAt: new Date(),
        },
      });
      console.log(`[Track-Predictions] Voided ${veryOldPredictions.length} old stuck predictions (7+ days):`);
      veryOldPredictions.forEach(p => console.log(`  - ${p.matchName} (${p.sport})`));
      results.voidedPredictions = veryOldPredictions.length;
    }

    // ============================================
    // STEP 6: Delete malformed predictions (garbage from chat)
    // ============================================
    console.log('[Track-Predictions] Step 6: Cleaning up malformed predictions...');

    const deletedMalformed = await prisma.prediction.deleteMany({
      where: {
        OR: [
          { matchName: { contains: 'Analyze' } },
          { sport: { contains: 'basketball_basketball' } },
          { sport: { contains: 'soccer_soccer' } },
          // Prediction field should be short (home/away/draw) not a match name
          { prediction: { contains: ' vs ' } },
        ],
      },
    });

    if (deletedMalformed.count > 0) {
      console.log(`[Track-Predictions] Deleted ${deletedMalformed.count} malformed predictions`);
      (results as any).deletedMalformed = deletedMalformed.count;
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
