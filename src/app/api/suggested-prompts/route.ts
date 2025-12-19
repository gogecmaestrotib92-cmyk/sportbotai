/**
 * API Route: /api/suggested-prompts
 * 
 * Returns dynamic suggested prompts for AI Desk:
 * - 1 prompt based on today's actual match
 * - Remaining prompts rotate based on trending topics
 * 
 * Cached for 1 hour to reduce API calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { theOddsClient } from '@/lib/theOdds';
import { getPerplexityClient } from '@/lib/perplexity';

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
 * Get trending sports topics from Perplexity
 */
async function getTrendingTopics(): Promise<string[]> {
  try {
    const perplexity = getPerplexityClient();
    
    if (!perplexity.isConfigured()) {
      console.log('[Suggested Prompts] Perplexity not configured, using static prompts');
      return [];
    }

    const today = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const result = await perplexity.search(
      `What are the top 5 trending sports stories today ${today}? Focus on: injuries, transfers, big matches, player performances. List just the topics briefly.`,
      { recency: 'day', maxTokens: 500 }
    );

    if (!result.success || !result.content) {
      return [];
    }

    // Parse the response into question prompts
    const topics = result.content
      .split('\n')
      .filter(line => line.trim().length > 10)
      .slice(0, 5)
      .map(topic => {
        // Convert topic to a question
        const cleaned = topic.replace(/^\d+\.\s*/, '').replace(/[-*•]\s*/, '').trim();
        
        // If it mentions a player injury
        if (/injur|out|miss/i.test(cleaned)) {
          const playerMatch = cleaned.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
          if (playerMatch) {
            return `What's the latest on ${playerMatch[1]}'s injury?`;
          }
        }
        
        // If it mentions a match/game
        if (/vs\.?|versus|against|beat|defeated/i.test(cleaned)) {
          return `Tell me about ${cleaned}`;
        }
        
        // If it mentions a transfer
        if (/transfer|sign|deal|move/i.test(cleaned)) {
          return `Latest news on ${cleaned}`;
        }
        
        // Generic question
        return `What's happening with ${cleaned}?`;
      });

    console.log('[Suggested Prompts] Trending topics:', topics);
    return topics;
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
 * Build the final prompts list
 * Structure: 1 match analysis + diverse sports questions
 */
async function buildPrompts(): Promise<string[]> {
  const prompts: string[] = [];

  // 1. Get ONE upcoming match prompt (shows users we can analyze matches)
  const upcomingMatches = await getUpcomingMatchPrompts();
  if (upcomingMatches.length > 0) {
    prompts.push(upcomingMatches[0]); // Only add the first one
  }
  console.log(`[Suggested Prompts] Got ${upcomingMatches.length > 0 ? 1 : 0} match prompt`);

  // 2. Try to get trending topics from Perplexity (diverse sports news)
  const trending = await getTrendingTopics();
  console.log(`[Suggested Prompts] Got ${trending.length} trending topics`);
  
  // 3. Add trending topics (up to 2)
  const usableTrending = trending.slice(0, 2);
  prompts.push(...usableTrending);

  // 4. Fill remaining with rotating static prompts
  // Mix from different categories
  const allStatic = [
    ...shuffleArray(STATIC_PROMPTS.general).slice(0, 3),
    ...shuffleArray(STATIC_PROMPTS.seasonal).slice(0, 2),
    ...shuffleArray(STATIC_PROMPTS.news).slice(0, 2),
  ];
  
  const shuffledStatic = shuffleArray(allStatic);
  
  // Add unique static prompts
  for (const prompt of shuffledStatic) {
    if (prompts.length >= 10) break;
    if (!prompts.includes(prompt)) {
      prompts.push(prompt);
    }
  }

  // If still need more, add any remaining general prompts
  if (prompts.length < 10) {
    for (const prompt of STATIC_PROMPTS.general) {
      if (prompts.length >= 10) break;
      if (!prompts.includes(prompt)) {
        prompts.push(prompt);
      }
    }
  }

  console.log(`[Suggested Prompts] Final prompts (${prompts.length}):`, prompts.slice(0, 4));
  return prompts.slice(0, 10);
}

// ============================================
// GET HANDLER
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const now = Date.now();
    if (promptsCache && (now - promptsCache.timestamp) < CACHE_TTL) {
      console.log('[Suggested Prompts] Returning cached prompts');
      return NextResponse.json({
        prompts: promptsCache.prompts,
        cached: true,
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

    return NextResponse.json({
      prompts,
      cached: false,
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
