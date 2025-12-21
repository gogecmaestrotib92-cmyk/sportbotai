/**
 * Live Intel Auto-Post Cron Job
 * 
 * Automatically generates SportBot Agent posts for the Live Intel Feed.
 * Runs every 30 minutes to keep the feed fresh with new content.
 * 
 * LAYER COMPLIANCE:
 * - Uses accuracy-core pipeline for computed probabilities
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
import { runQuickAnalysis, type MinimalMatchData } from '@/lib/accuracy-core/live-intel-adapter';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

// Categories to rotate through
const AUTO_POST_CATEGORIES: PostCategory[] = [
  'LINEUP_INTEL',
  'MOMENTUM_SHIFT',
  'FORM_ANALYSIS',
  'MATCH_COMPLEXITY',
  'AI_INSIGHT',
];

interface UpcomingMatch {
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  kickoff: string;
  // Odds for accuracy-core pipeline
  odds?: {
    home: number;
    away: number;
    draw?: number;
  };
}

// Sports to fetch matches from
const SPORTS_TO_FETCH = [
  'soccer_epl',
  'soccer_spain_la_liga', 
  'basketball_nba',
  'americanfootball_nfl',
  'icehockey_nhl',
];

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
 * Get upcoming matches from the events API
 */
async function getUpcomingMatches(): Promise<UpcomingMatch[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  
  const matches: UpcomingMatch[] = [];
  
  // Fetch from multiple sports in parallel
  const fetchPromises = SPORTS_TO_FETCH.map(async (sportKey) => {
    try {
      const response = await fetch(`${baseUrl}/api/events/${sportKey}`, {
        headers: { 'Cache-Control': 'no-cache' },
        next: { revalidate: 0 },
      });
      
      if (response.ok) {
        const data = await response.json();
        const events = data.events || [];
        
        // Take first 3 upcoming matches from each sport
        for (const event of events.slice(0, 3)) {
          if (event.home_team && event.away_team) {
            matches.push({
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              league: event.sport_title || sportKey,
              sport: sportKey,
              kickoff: event.commence_time || new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      console.error(`[Live-Intel-Cron] Failed to fetch ${sportKey}:`, error);
    }
  });
  
  await Promise.all(fetchPromises);
  
  console.log(`[Live-Intel-Cron] Fetched ${matches.length} matches from ${SPORTS_TO_FETCH.length} sports`);
  return matches;
}

/**
 * Generate a single agent post with real-time research
 */
async function generatePost(match: UpcomingMatch, category: PostCategory): Promise<{
  content: string;
  confidence: number;
  realTimeData: boolean;
  citations: string[];
} | null> {
  try {
    // Step 1: Run accuracy-core quick analysis
    // This gives us calibrated probabilities and narrative angle
    const analysisInput: MinimalMatchData = {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      sport: match.sport,
      kickoff: match.kickoff,
      odds: match.odds, // Will use defaults if not provided
    };
    
    const quickAnalysis = runQuickAnalysis(analysisInput);
    console.log(`[Live-Intel-Cron] Quick analysis: ${quickAnalysis.narrativeAngle}, favored: ${quickAnalysis.favored}`);
    
    // Step 2: Get real-time research from Perplexity
    let researchContext = '';
    let citations: string[] = [];
    let realTimeData = false;
    
    try {
      const research = await quickMatchResearch(
        match.homeTeam,
        match.awayTeam,
        match.league
      );
      
      if (research.success && research.content) {
        researchContext = `\n\n[LIVE INTELLIGENCE]\n${research.content}`;
        citations = research.citations || [];
        realTimeData = true;
      }
    } catch (researchError) {
      console.log('[Live-Intel-Cron] Research unavailable, continuing without');
    }
    
    // Step 3: Build computed analysis for prompt
    const computedAnalysis: ComputedAnalysis = {
      probabilities: quickAnalysis.probabilities,
      favored: quickAnalysis.favored,
      confidence: quickAnalysis.confidence,
      dataQuality: quickAnalysis.dataQuality,
      volatility: quickAnalysis.volatility,
      narrativeAngle: quickAnalysis.narrativeAngle,
      catchphrase: quickAnalysis.catchphrase,
      motif: quickAnalysis.motif,
    };
    
    // Step 4: Build prompt with computed analysis (Data-3 layer)
    const matchContext = `${match.homeTeam} vs ${match.awayTeam} | ${match.league} | ${match.sport}`;
    const prompt = buildAgentPostPromptWithAnalysis(
      category,
      matchContext,
      computedAnalysis,
      match.homeTeam,
      match.awayTeam,
      researchContext
    );
    
    // Step 5: Generate with OpenAI (LLM only interprets, never computes)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7, // Slightly higher for personality
    });
    
    const rawContent = completion.choices[0]?.message?.content?.trim();
    if (!rawContent) return null;
    
    // Check for NO_POST response (AI indicates nothing interesting to post)
    if (rawContent === 'NO_POST' || rawContent.includes('NO_POST')) {
      console.log('[Live-Intel-Cron] AI returned NO_POST - skipping');
      return null;
    }
    
    const sanitized = sanitizeAgentPost(rawContent);
    const content = sanitized.safe ? sanitized.post : rawContent;
    
    // Step 6: Map pipeline confidence to 1-10 scale
    let confidence = 5; // Default
    if (quickAnalysis.confidence === 'high' && realTimeData) {
      confidence = 8;
    } else if (quickAnalysis.confidence === 'high') {
      confidence = 7;
    } else if (quickAnalysis.confidence === 'medium' && realTimeData) {
      confidence = 6;
    } else if (quickAnalysis.confidence === 'low') {
      confidence = 4;
    }
    
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
  
  console.log('[Live-Intel-Cron] Starting auto-post generation...');
  
  try {
    // Get upcoming matches
    const matches = await getUpcomingMatches();
    
    if (matches.length === 0) {
      console.log('[Live-Intel-Cron] No upcoming matches found');
      return NextResponse.json({
        success: true,
        message: 'No upcoming matches to post about',
        postsGenerated: 0,
      });
    }
    
    console.log(`[Live-Intel-Cron] Found ${matches.length} matches`);
    
    // Pick a random match and category
    const randomMatch = matches[Math.floor(Math.random() * matches.length)];
    const randomCategory = AUTO_POST_CATEGORIES[Math.floor(Math.random() * AUTO_POST_CATEGORIES.length)];
    
    console.log(`[Live-Intel-Cron] Generating ${randomCategory} for ${randomMatch.homeTeam} vs ${randomMatch.awayTeam}`);
    
    // Generate the post
    const postResult = await generatePost(randomMatch, randomCategory);
    
    if (!postResult) {
      console.log('[Live-Intel-Cron] Failed to generate post');
      return NextResponse.json({
        success: false,
        error: 'Post generation failed',
      }, { status: 500 });
    }
    
    // Save to database
    const post = await prisma.agentPost.create({
      data: {
        category: randomCategory,
        content: postResult.content,
        matchRef: `${randomMatch.homeTeam} vs ${randomMatch.awayTeam}`,
        homeTeam: randomMatch.homeTeam,
        awayTeam: randomMatch.awayTeam,
        sport: randomMatch.sport,
        league: randomMatch.league,
        confidence: postResult.confidence,
        realTimeData: postResult.realTimeData,
        citations: postResult.citations,
      },
    });
    
    console.log(`[Live-Intel-Cron] Created post ${post.id} in ${Date.now() - startTime}ms`);
    
    // Post to Twitter directly (not via internal HTTP call which can fail on Vercel)
    let twitterResult = null;
    try {
      const twitter = getTwitterClient();
      if (twitter.isConfigured()) {
        const hashtags = getSmartHashtags(randomMatch.sport, randomMatch.homeTeam);
        const formattedContent = formatForTwitter(postResult.content, { hashtags });
        
        console.log('[Live-Intel-Cron] Posting to Twitter...');
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
    
    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        category: randomCategory,
        match: `${randomMatch.homeTeam} vs ${randomMatch.awayTeam}`,
        confidence: postResult.confidence,
        realTimeData: postResult.realTimeData,
      },
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
