/**
 * Live Intel Auto-Post Cron Job
 * 
 * Automatically generates SportBot Agent posts for the Live Intel Feed.
 * Runs every 30 minutes to keep the feed fresh with new content.
 * 
 * UPDATED: Now uses pre-analyzed predictions from database for quality content.
 * Only posts when there's a clear edge (conviction 3+) - no neutral filler!
 * 
 * LAYER COMPLIANCE:
 * - Uses pre-analyzed predictions with real odds/conviction data
 * - LLM receives READ-ONLY values with narrative angle
 * - AIXBT personality injected via sportbot-brain
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { 
  POST_CATEGORIES, 
  buildAgentPostPromptWithAnalysis, 
  sanitizeAgentPost, 
  type PostCategory,
  type ComputedAnalysis,
} from '@/lib/config/sportBotAgent';
import { quickMatchResearch } from '@/lib/perplexity';
import { getTwitterClient, formatForTwitter } from '@/lib/twitter-client';
import { computeNarrativeAngle, getCatchphrase, type NarrativeAngle } from '@/lib/sportbot-brain';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

// Minimum conviction to post (1-5 scale, 3+ = worth posting)
const MIN_CONVICTION_TO_POST = 3;

// Categories to rotate through
const AUTO_POST_CATEGORIES: PostCategory[] = [
  'LINEUP_INTEL',
  'MOMENTUM_SHIFT',
  'FORM_ANALYSIS',
  'MATCH_COMPLEXITY',
  'AI_INSIGHT',
];

// Prediction with edge data from database
interface PredictionWithEdge {
  id: string;
  matchId: string;
  matchName: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  kickoff: Date;
  prediction: string;
  reasoning: string;
  conviction: number; // 1-5 scale
  odds: number | null;
  impliedProb: number | null;
}

// Smart hashtag mapping by sport/league
const HASHTAG_MAP: Record<string, string[]> = {
  // Soccer - EPL
  'soccer_epl': ['PremierLeague', 'EPL', 'FPL'],
  'soccer_england_league1': ['EFL', 'League1'],
  'soccer_england_league2': ['EFL', 'League2'],
  'soccer_england_efl_cup': ['EFLCup', 'CarabaoCup'],
  
  // Soccer - Europe
  'soccer_spain_la_liga': ['LaLiga'],
  'soccer_germany_bundesliga': ['Bundesliga'],
  'soccer_italy_serie_a': ['SerieA'],
  'soccer_france_ligue_one': ['Ligue1'],
  'soccer_uefa_champs_league': ['UCL', 'ChampionsLeague'],
  'soccer_uefa_europa_league': ['UEL', 'EuropaLeague'],
  
  // US Sports
  'basketball_nba': ['NBA', 'NBATwitter'],
  'americanfootball_nfl': ['NFL', 'NFLTwitter'],
  'icehockey_nhl': ['NHL', 'NHLTwitter'],
  'baseball_mlb': ['MLB', 'MLBTwitter'],
  
  // Default
  'default': ['Sports', 'SportsAI'],
};

/**
 * Get smart hashtags for a match based on sport/league
 */
function getSmartHashtags(sportKey: string, homeTeam?: string): string[] {
  // Always include brand hashtag
  const hashtags = ['SportBot'];
  
  // Add sport-specific hashtags
  const sportHashtags = HASHTAG_MAP[sportKey] || HASHTAG_MAP['default'];
  hashtags.push(...sportHashtags);
  
  // For big teams, add team hashtag (drives engagement)
  const bigTeams: Record<string, string> = {
    'manchester united': 'MUFC',
    'manchester city': 'MCFC',
    'liverpool': 'LFC',
    'arsenal': 'AFC',
    'chelsea': 'CFC',
    'tottenham': 'THFC',
    'real madrid': 'RealMadrid',
    'barcelona': 'FCBarcelona',
    'bayern munich': 'FCBayern',
    'lakers': 'LakeShow',
    'celtics': 'Celtics',
    'warriors': 'DubNation',
    'chiefs': 'ChiefsKingdom',
    'cowboys': 'DallasCowboys',
  };
  
  if (homeTeam) {
    const teamLower = homeTeam.toLowerCase();
    for (const [team, hashtag] of Object.entries(bigTeams)) {
      if (teamLower.includes(team)) {
        hashtags.push(hashtag);
        break;
      }
    }
  }
  
  return hashtags;
}

/**
 * Get high-conviction predictions from the database
 * Only returns matches with clear edges worth posting about
 */
async function getHighConvictionPredictions(): Promise<PredictionWithEdge[]> {
  // Get upcoming predictions with conviction >= MIN_CONVICTION_TO_POST
  const predictions = await prisma.prediction.findMany({
    where: {
      outcome: 'PENDING',
      kickoff: {
        gte: new Date(), // Only future matches
        lte: new Date(Date.now() + 48 * 60 * 60 * 1000), // Within 48 hours
      },
      conviction: {
        gte: MIN_CONVICTION_TO_POST, // Only high-conviction (3+)
      },
    },
    orderBy: [
      { conviction: 'desc' }, // Highest conviction first
      { kickoff: 'asc' }, // Then by soonest kickoff
    ],
    take: 20, // Get top 20 high-conviction matches
  });

  // Check which ones we've already posted about recently (last 6 hours)
  const recentPosts = await prisma.agentPost.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 6 * 60 * 60 * 1000), // Last 6 hours
      },
    },
    select: {
      matchRef: true,
    },
  });

  const recentMatchRefs = new Set(recentPosts.map(p => p.matchRef));

  // Parse team names and filter out recently posted matches
  const parseTeams = (matchName: string) => {
    const parts = matchName.split(' vs ');
    return {
      homeTeam: parts[0]?.trim() || matchName,
      awayTeam: parts[1]?.trim() || '',
    };
  };

  const filtered = predictions
    .map(p => {
      const { homeTeam, awayTeam } = parseTeams(p.matchName);
      return {
        id: p.id,
        matchId: p.matchId,
        matchName: p.matchName,
        homeTeam,
        awayTeam,
        league: p.league,
        sport: p.sport,
        kickoff: p.kickoff,
        prediction: p.prediction,
        reasoning: p.reasoning,
        conviction: p.conviction,
        odds: p.odds,
        impliedProb: p.impliedProb,
      };
    })
    .filter(p => !recentMatchRefs.has(`${p.homeTeam} vs ${p.awayTeam}`));

  console.log(`[Live-Intel-Cron] Found ${predictions.length} high-conviction predictions, ${filtered.length} not posted recently`);
  
  return filtered;
}

/**
 * Derive narrative angle from conviction and prediction
 */
function deriveNarrativeAngle(prediction: PredictionWithEdge): NarrativeAngle {
  // High conviction (4-5) = clear edge
  if (prediction.conviction >= 4) {
    // Check if it's a blowout or control narrative
    if (prediction.prediction.toLowerCase().includes('win') || 
        prediction.prediction.toLowerCase().includes('cover')) {
      return 'BLOWOUT_POTENTIAL';
    }
    return 'CONTROL';
  }
  
  // Medium-high conviction (3) = potential trap or interesting angle
  if (prediction.conviction === 3) {
    // Look for contrarian plays
    if (prediction.reasoning.toLowerCase().includes('market') ||
        prediction.reasoning.toLowerCase().includes('value') ||
        prediction.reasoning.toLowerCase().includes('underdog')) {
      return 'TRAP_SPOT';
    }
    return 'CONTROL';
  }
  
  // Shouldn't reach here due to MIN_CONVICTION filter, but fallback
  return 'MIRROR_MATCH';
}

/**
 * Map NarrativeAngle to catchphrase category
 */
function getCatchphraseCategory(angle: NarrativeAngle): 'openers' | 'highConviction' | 'contrarian' | 'chaos' | 'postMatch' | 'signoffs' {
  switch (angle) {
    case 'CHAOS':
      return 'chaos';
    case 'BLOWOUT_POTENTIAL':
    case 'CONTROL':
      return 'highConviction';
    case 'TRAP_SPOT':
      return 'contrarian';
    case 'MIRROR_MATCH':
      return 'openers';
    default:
      return 'openers';
  }
}

/**
 * Generate a post from a high-conviction prediction
 * Uses real prediction data for quality content
 */
async function generatePostFromPrediction(prediction: PredictionWithEdge, category: PostCategory): Promise<{
  content: string;
  confidence: number;
  realTimeData: boolean;
  citations: string[];
} | null> {
  try {
    console.log(`[Live-Intel-Cron] Generating post for ${prediction.matchName} (conviction: ${prediction.conviction})`);
    
    // Step 1: Derive narrative angle from prediction data
    const narrativeAngle = deriveNarrativeAngle(prediction);
    
    // Step 2: Get real-time research from Perplexity for extra context
    let researchContext = '';
    let citations: string[] = [];
    let realTimeData = false;
    
    try {
      const research = await quickMatchResearch(
        prediction.homeTeam,
        prediction.awayTeam,
        prediction.league
      );
      
      if (research.success && research.content) {
        researchContext = `\n\n[LIVE INTELLIGENCE]\n${research.content}`;
        citations = research.citations || [];
        realTimeData = true;
      }
    } catch (researchError) {
      console.log('[Live-Intel-Cron] Research unavailable, using prediction data only');
    }
    
    // Step 3: Build computed analysis from REAL prediction data
    const impliedProb = prediction.impliedProb || 0.5;
    const computedAnalysis: ComputedAnalysis = {
      probabilities: {
        home: prediction.prediction.toLowerCase().includes('home') ? impliedProb : (1 - impliedProb) / 2,
        away: prediction.prediction.toLowerCase().includes('away') ? impliedProb : (1 - impliedProb) / 2,
        draw: prediction.sport.includes('soccer') ? (1 - impliedProb) / 2 : undefined,
      },
      favored: prediction.prediction.toLowerCase().includes('home') ? 'home' : 
               prediction.prediction.toLowerCase().includes('away') ? 'away' : 
               prediction.prediction.toLowerCase().includes('draw') ? 'draw' : 'home',
      confidence: prediction.conviction >= 4 ? 'high' : prediction.conviction >= 3 ? 'medium' : 'low',
      dataQuality: 'HIGH', // Pre-analyzed predictions have full data
      volatility: prediction.conviction >= 4 ? 'LOW' : 'MEDIUM',
      narrativeAngle,
      catchphrase: getCatchphrase(getCatchphraseCategory(narrativeAngle)),
      motif: prediction.reasoning.substring(0, 50) + '...', // Use actual reasoning as motif
    };
    
    // Step 4: Build prompt with computed analysis
    const matchContext = `${prediction.homeTeam} vs ${prediction.awayTeam} | ${prediction.league} | ${prediction.sport}`;
    
    // Include the actual prediction reasoning for better content
    const predictionContext = `
[PRE-ANALYZED PREDICTION]
Call: ${prediction.prediction}
Conviction: ${prediction.conviction}/5
Reasoning: ${prediction.reasoning}
${prediction.odds ? `Odds: ${prediction.odds.toFixed(2)}` : ''}
`;
    
    const prompt = buildAgentPostPromptWithAnalysis(
      category,
      matchContext,
      computedAnalysis,
      prediction.homeTeam,
      prediction.awayTeam,
      predictionContext + researchContext
    );
    
    // Step 5: Generate with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    });
    
    const rawContent = completion.choices[0]?.message?.content?.trim();
    if (!rawContent) return null;
    
    // Check for NO_POST response
    if (rawContent === 'NO_POST' || rawContent.includes('NO_POST')) {
      console.log('[Live-Intel-Cron] AI returned NO_POST - skipping');
      return null;
    }
    
    const sanitized = sanitizeAgentPost(rawContent);
    const content = sanitized.safe ? sanitized.post : rawContent;
    
    // Confidence directly from conviction (already validated as 3+)
    const confidence = prediction.conviction >= 5 ? 9 :
                      prediction.conviction >= 4 ? 8 :
                      prediction.conviction >= 3 ? 7 : 6;
    
    return { content, confidence, realTimeData, citations };
  } catch (error) {
    console.error('[Live-Intel-Cron] Post generation failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const authHeader = request.headers.get('authorization');
  
  // Vercel crons are authenticated automatically - they only run from Vercel's infrastructure
  // Check for either: Bearer token (manual/internal calls) OR Vercel cron header (automatic cron)
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const isAuthorized = authHeader === `Bearer ${CRON_SECRET}`;
  
  // In production, require either Vercel cron header or valid auth token
  if (CRON_SECRET && !isVercelCron && !isAuthorized) {
    console.log('[Live-Intel-Cron] Unauthorized attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[Live-Intel-Cron] Starting auto-post generation (using pre-analyzed predictions)...');
  
  try {
    // Get high-conviction predictions from database
    const predictions = await getHighConvictionPredictions();
    
    if (predictions.length === 0) {
      console.log('[Live-Intel-Cron] No high-conviction predictions available');
      return NextResponse.json({
        success: true,
        message: 'No high-conviction predictions to post about (all matches either low-conviction or already posted)',
        postsGenerated: 0,
        reason: 'No matches with conviction >= 3 found, or all have been posted recently',
      });
    }
    
    console.log(`[Live-Intel-Cron] Found ${predictions.length} high-conviction predictions`);
    
    // Pick a random high-conviction prediction and category
    const selectedPrediction = predictions[Math.floor(Math.random() * predictions.length)];
    const randomCategory = AUTO_POST_CATEGORIES[Math.floor(Math.random() * AUTO_POST_CATEGORIES.length)];
    
    console.log(`[Live-Intel-Cron] Selected: ${selectedPrediction.matchName} (conviction: ${selectedPrediction.conviction}/5)`);
    console.log(`[Live-Intel-Cron] Category: ${randomCategory}`);
    
    // Generate the post using real prediction data
    const postResult = await generatePostFromPrediction(selectedPrediction, randomCategory);
    
    if (!postResult) {
      console.log('[Live-Intel-Cron] Failed to generate post');
      return NextResponse.json({
        success: false,
        error: 'Post generation failed or AI returned NO_POST',
      }, { status: 500 });
    }
    
    // Save to database
    const post = await prisma.agentPost.create({
      data: {
        category: randomCategory,
        content: postResult.content,
        matchRef: `${selectedPrediction.homeTeam} vs ${selectedPrediction.awayTeam}`,
        homeTeam: selectedPrediction.homeTeam,
        awayTeam: selectedPrediction.awayTeam,
        sport: selectedPrediction.sport,
        league: selectedPrediction.league,
        confidence: postResult.confidence,
        realTimeData: postResult.realTimeData,
        citations: postResult.citations,
      },
    });
    
    console.log(`[Live-Intel-Cron] Created post ${post.id} (confidence: ${postResult.confidence}/10) in ${Date.now() - startTime}ms`);
    
    // Post to Twitter only every 4th post AND only for high-confidence posts (7+)
    const totalPosts = await prisma.agentPost.count();
    const isHighConfidence = postResult.confidence >= 7;
    const shouldPostToTwitter = (totalPosts % 4 === 0) && isHighConfidence;
    
    let twitterResult = null;
    if (shouldPostToTwitter) {
      try {
        const twitter = getTwitterClient();
        if (twitter.isConfigured()) {
          const hashtags = getSmartHashtags(selectedPrediction.sport, selectedPrediction.homeTeam);
          const formattedContent = formatForTwitter(postResult.content, { hashtags });
          
          console.log(`[Live-Intel-Cron] Posting to Twitter (post #${totalPosts}, high confidence ${postResult.confidence}/10)...`);
          twitterResult = await twitter.postTweet(formattedContent);
          
          if (twitterResult.success) {
            console.log(`[Live-Intel-Cron] ✅ Posted to Twitter: ${twitterResult.tweet?.id}`);
            
            // Save to database
            await prisma.twitterPost.create({
              data: {
                tweetId: twitterResult.tweet?.id || '',
                content: formattedContent,
                category: 'LIVE_INTEL',
              },
            });
          } else {
            console.error('[Live-Intel-Cron] ❌ Twitter post failed:', twitterResult.error);
          }
        } else {
          console.log('[Live-Intel-Cron] Twitter not configured, skipping');
        }
      } catch (twitterError) {
        console.error('[Live-Intel-Cron] Twitter error:', twitterError);
      }
    } else {
      const reason = !isHighConfidence 
        ? `confidence ${postResult.confidence}/10 below threshold (7+)`
        : `post #${totalPosts} - only every 4th`;
      console.log(`[Live-Intel-Cron] Skipping Twitter: ${reason}`);
    }
    
    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        category: randomCategory,
        match: `${selectedPrediction.homeTeam} vs ${selectedPrediction.awayTeam}`,
        conviction: selectedPrediction.conviction,
        confidence: postResult.confidence,
        realTimeData: postResult.realTimeData,
        postedToTwitter: twitterResult?.success || false,
      },
      source: 'pre-analyzed-predictions',
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    console.error('[Live-Intel-Cron] Error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
