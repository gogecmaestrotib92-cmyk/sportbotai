/**
 * API Route: /api/suggested-prompts
 * 
 * Returns dynamic suggested prompts for AI Desk:
 * - 1 personalized prompt based on user's favorite teams (if any)
 * - 1 prompt based on today's actual match
 * - Remaining prompts rotate based on trending topics
 * 
 * Cached for 15 minutes (generic prompts) + personalized prompts per user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { theOddsClient } from '@/lib/theOdds';
import { getPerplexityClient } from '@/lib/perplexity';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ============================================
// CACHE
// ============================================

interface CachedPrompts {
  prompts: string[];
  timestamp: number;
}

let promptsCache: CachedPrompts | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes (refresh more often for dynamic content)

// ============================================
// STATIC FALLBACK PROMPTS (rotating pool)
// ============================================

const STATIC_PROMPTS = {
  // General knowledge (always relevant)
  general: [
    "Who is the starting goalkeeper for Real Madrid?",
    "What's the latest injury news for Arsenal?",
    "When do Liverpool play next in the Premier League?",
    "Who's top of the Serie A table?",
    "How many goals has Haaland scored this season?",
    "What are the current NBA standings?",
    "Who leads the NFL in passing yards?",
  ],
  // Seasonal/timely (December/January)
  seasonal: [
    "Any transfer rumors for the January window?",
    "Who leads the MVP race in the NBA?",
    "Which teams are in the Champions League knockouts?",
    "Who's on a hot streak in the NHL right now?",
    "What's the latest on the NFL playoff picture?",
    "Who are the top scorers in La Liga this season?",
  ],
  // Breaking news style
  news: [
    "Any major injuries reported today?",
    "What matches are happening this weekend?",
    "Latest manager news in the Premier League",
    "Who scored hat-tricks this week?",
    "What did Guardiola say in his latest press conference?",
  ],
};

// ============================================
// HELPERS
// ============================================

/**
 * Get upcoming matches (next 24 hours)
 */
async function getUpcomingMatchPrompts(): Promise<string[]> {
  try {
    if (!theOddsClient.isConfigured()) {
      console.log('[Suggested Prompts] Odds API not configured');
      return [];
    }

    // Priority sports to check
    const prioritySports = [
      'soccer_epl',
      'soccer_spain_la_liga', 
      'soccer_germany_bundesliga',
      'soccer_italy_serie_a',
      'basketball_nba',
      'americanfootball_nfl',
      'icehockey_nhl',
      'soccer_uefa_champs_league',
    ];

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const prompts: string[] = [];

    // Check each sport for upcoming events
    for (const sportKey of prioritySports) {
      if (prompts.length >= 1) break; // Get only 1 match prompt as example
      
      try {
        const { data: events } = await theOddsClient.getEvents(sportKey);
        
        // Filter to upcoming matches (next 24 hours, not started yet)
        const upcomingMatches = events.filter(event => {
          const matchDate = new Date(event.commence_time);
          return matchDate > now && matchDate < next24Hours;
        });

        if (upcomingMatches.length > 0) {
          // Sort by kickoff time (soonest first)
          upcomingMatches.sort((a, b) => 
            new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
          );
          
          // Take the first upcoming match from this sport
          const match = upcomingMatches[0];
          const prompt = `Analyze ${match.home_team} vs ${match.away_team}`;
          prompts.push(prompt);
          console.log(`[Suggested Prompts] Upcoming match: ${prompt}`);
        }
      } catch (err) {
        console.error(`[Suggested Prompts] Error fetching ${sportKey}:`, err);
        continue;
      }
    }

    if (prompts.length === 0) {
      console.log('[Suggested Prompts] No upcoming matches found');
    }
    
    return prompts;
  } catch (error) {
    console.error('[Suggested Prompts] Error getting upcoming matches:', error);
    return [];
  }
}

/**
 * Get trending sports topics from Perplexity - generates dynamic, real-time questions
 */
async function getTrendingTopics(): Promise<string[]> {
  try {
    const perplexity = getPerplexityClient();
    
    if (!perplexity.isConfigured()) {
      console.log('[Suggested Prompts] Perplexity not configured, using static prompts');
      return [];
    }

    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const result = await perplexity.search(
      `Generate 5 specific sports questions a fan might ask today (${today}). 
      
      Mix these categories:
      1. Recent injury news (who got injured this week?)
      2. Current standings/form (who's top of the league? who's on a winning streak?)
      3. Upcoming fixtures (what big games are this weekend?)
      4. Transfer rumors (January window news)
      5. Player stats (who's the top scorer? who has most assists?)
      
      Format: Return ONLY 5 short questions, one per line. No numbering. No explanations.
      Example format:
      What's the latest on Salah's contract situation?
      Who leads the Premier League golden boot race?
      Is Bellingham injured for the next match?`,
      { recency: 'day', maxTokens: 400 }
    );

    if (!result.success || !result.content) {
      console.log('[Suggested Prompts] Perplexity returned no content');
      return [];
    }

    // Parse the response - each line should be a question
    const questions = result.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Must be a question (ends with ?) or be substantial
        return line.length > 15 && line.length < 100 && !line.startsWith('#');
      })
      .map(line => {
        // Clean up any numbering or bullets
        return line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*•]\s*/, '').trim();
      })
      .filter(line => line.length > 10)
      .slice(0, 5);

    console.log('[Suggested Prompts] Got dynamic questions from Perplexity:', questions);
    return questions;
  } catch (error) {
    console.error('[Suggested Prompts] Error getting trending topics:', error);
    return [];
  }
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get personalized prompts based on user's favorite teams
 */
async function getPersonalizedPrompts(userId: string): Promise<string[]> {
  try {
    const favorites = await prisma.favoriteTeam.findMany({
      where: { userId },
      select: { teamName: true, sport: true },
      take: 3,
    });

    if (favorites.length === 0) return [];

    const prompts: string[] = [];
    const questions = [
      (team: string) => `How is ${team} performing this season?`,
      (team: string) => `What's the latest news on ${team}?`,
      (team: string) => `When does ${team} play next?`,
      (team: string) => `Any injury updates for ${team}?`,
      (team: string) => `How's ${team}'s form lately?`,
    ];

    // Pick a random question style for the first favorite team
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    prompts.push(randomQuestion(favorites[0].teamName));

    return prompts;
  } catch (error) {
    console.error('[Suggested Prompts] Error getting personalized prompts:', error);
    return [];
  }
}

/**
 * Build the final prompts list
 * Structure: 1 match analysis + 5 dynamic sports questions from Perplexity
 * Only fall back to static if Perplexity fails
 */
async function buildPrompts(): Promise<string[]> {
  const prompts: string[] = [];

  // 1. Get ONE upcoming match prompt (shows users we can analyze matches)
  const upcomingMatches = await getUpcomingMatchPrompts();
  if (upcomingMatches.length > 0) {
    prompts.push(upcomingMatches[0]); // Only add the first one
  } else {
    // Fallback match prompt if no live matches
    prompts.push("Analyze Real Madrid vs Barcelona");
  }
  console.log(`[Suggested Prompts] Match prompt: ${prompts[0]}`);

  // 2. Get dynamic questions from Perplexity (priority - these are real-time)
  const dynamicQuestions = await getTrendingTopics();
  console.log(`[Suggested Prompts] Got ${dynamicQuestions.length} dynamic questions from Perplexity`);
  
  // 3. Add ALL dynamic questions (up to 5) - these are the real-time prompts
  if (dynamicQuestions.length > 0) {
    prompts.push(...dynamicQuestions.slice(0, 5));
  }

  // 4. ONLY if we don't have enough dynamic questions, fill with static
  if (prompts.length < 6) {
    console.log(`[Suggested Prompts] Only ${prompts.length} prompts, filling with static fallbacks`);
    
    const allStatic = shuffleArray([
      ...STATIC_PROMPTS.general,
      ...STATIC_PROMPTS.seasonal,
      ...STATIC_PROMPTS.news,
    ]);
    
    for (const prompt of allStatic) {
      if (prompts.length >= 6) break;
      if (!prompts.includes(prompt)) {
        prompts.push(prompt);
      }
    }
  }

  console.log(`[Suggested Prompts] Final prompts (${prompts.length}):`, prompts);
  return prompts.slice(0, 6); // Return 6 prompts max
}

// ============================================
// GET HANDLER
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in for personalized prompts
    let personalizedPrompts: string[] = [];
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        personalizedPrompts = await getPersonalizedPrompts(session.user.id);
        console.log(`[Suggested Prompts] Got ${personalizedPrompts.length} personalized prompts`);
      }
    } catch (err) {
      console.log('[Suggested Prompts] Could not get session for personalization');
    }

    // Check cache for generic prompts
    const now = Date.now();
    if (promptsCache && (now - promptsCache.timestamp) < CACHE_TTL) {
      console.log('[Suggested Prompts] Returning cached prompts');
      
      // Combine personalized + cached generic prompts
      const combinedPrompts = personalizedPrompts.length > 0
        ? [...personalizedPrompts, ...promptsCache.prompts.slice(0, 5)]
        : promptsCache.prompts;
      
      return NextResponse.json({
        prompts: combinedPrompts,
        cached: true,
        personalized: personalizedPrompts.length > 0,
        cacheAge: Math.round((now - promptsCache.timestamp) / 1000),
      });
    }

    // Build fresh prompts
    console.log('[Suggested Prompts] Building fresh prompts...');
    const prompts = await buildPrompts();

    // Update cache
    promptsCache = {
      prompts,
      timestamp: now,
    };

    // Combine personalized + generic prompts
    const combinedPrompts = personalizedPrompts.length > 0
      ? [...personalizedPrompts, ...prompts.slice(0, 5)]
      : prompts;

    return NextResponse.json({
      prompts: combinedPrompts,
      cached: false,
      personalized: personalizedPrompts.length > 0,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Suggested Prompts] Error:', error);
    
    // Return static fallback on error
    const fallback = shuffleArray([
      "Analyze Real Madrid vs Barcelona",
      ...STATIC_PROMPTS.general.slice(0, 5),
      ...STATIC_PROMPTS.seasonal.slice(0, 4),
    ]).slice(0, 10);

    return NextResponse.json({
      prompts: fallback,
      cached: false,
      fallback: true,
    });
  }
}
