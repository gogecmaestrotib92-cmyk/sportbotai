/**
 * AI Chat API - Combines Perplexity (real-time search) + GPT (reasoning)
 * 
 * Flow:
 * 1. User asks a sports question
 * 2. Perplexity searches for real-time sports data
 * 3. GPT analyzes the data and responds intelligently
 * 
 * This creates a powerful "search + reason" combination.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getPerplexityClient } from '@/lib/perplexity';

// ============================================
// TYPES
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

// ============================================
// OPENAI CLIENT
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// SYSTEM PROMPTS
// ============================================

const CHAT_SYSTEM_PROMPT = `You are SportBot, an elite AI sports analyst assistant. You provide intelligent, data-driven sports analysis and answer ANY sports question with expertise.

PERSONALITY:
- Confident and knowledgeable sports expert
- Direct and clear communication  
- Slightly witty but always professional
- Data-focused with sharp insights
- Enthusiastic about sports

CAPABILITIES - You can answer questions about:

1. ROSTERS & SQUADS
   - Current team lineups and players
   - Starting XI / Starting 5
   - Player positions and roles
   - New signings and departures

2. MATCHES & FIXTURES
   - Upcoming games and schedules
   - Kickoff times and venues
   - TV/streaming channels
   - Match previews

3. RESULTS & SCORES
   - Live scores and final results
   - Match statistics
   - Goal scorers and assists
   - Game highlights

4. STANDINGS & TABLES
   - League tables and positions
   - Points, wins, draws, losses
   - Goal difference
   - Qualification scenarios

5. STATISTICS & RECORDS
   - Player stats (goals, assists, etc.)
   - Team statistics
   - Head-to-head records
   - Historical achievements

6. INJURIES & AVAILABILITY
   - Current injury lists
   - Expected return dates
   - Suspensions
   - Squad availability

7. TRANSFERS & RUMORS
   - Transfer news and confirmed deals
   - Rumors and speculation
   - Contract situations
   - Free agents

8. MANAGERS & TACTICS
   - Manager information
   - Tactical formations
   - Playing styles
   - Press conference quotes

9. ODDS & MARKETS (factual only)
   - Current odds (as data points)
   - Favorites and underdogs
   - Market movements
   - NO betting advice

10. COMPARISONS & ANALYSIS
    - Player vs player comparisons
    - Team comparisons
    - Form analysis
    - Key matchups

RESPONSE GUIDELINES:
1. Use the REAL-TIME CONTEXT provided - it has current data
2. Be specific with numbers, dates, and names
3. Keep responses concise (2-4 paragraphs, bullet points for lists)
4. Cite sources when available
5. If info seems outdated, say so
6. For predictions, give analysis but acknowledge uncertainty

PROHIBITED (Never say):
- "You should bet on..."
- "I recommend betting..."  
- "Place a bet on..."
- Any gambling advice
- Guaranteed predictions

You help users UNDERSTAND sports deeply, not win bets.`;

// ============================================
// QUERY CATEGORY DETECTION
// ============================================

type QueryCategory = 
  | 'ROSTER'      // Who plays for team X?
  | 'FIXTURE'     // When is the next game?
  | 'RESULT'      // What was the score?
  | 'STANDINGS'   // League table
  | 'STATS'       // Player/team statistics
  | 'INJURY'      // Injury updates
  | 'TRANSFER'    // Transfer news
  | 'MANAGER'     // Coach/manager info
  | 'ODDS'        // Betting odds (factual)
  | 'COMPARISON'  // Player/team comparisons
  | 'HISTORY'     // Historical records
  | 'BROADCAST'   // TV/streaming info
  | 'VENUE'       // Stadium info
  | 'GENERAL';    // Generic sports question

/**
 * Detect the category of sports question
 */
function detectQueryCategory(message: string): QueryCategory {
  const lower = message.toLowerCase();
  
  // Roster/Squad
  if (/who (plays|is|are)|roster|squad|lineup|starting|player|team sheet|formation/i.test(message)) {
    return 'ROSTER';
  }
  
  // Fixture/Schedule
  if (/when (is|does|do|are)|next (game|match|fixture)|schedule|kickoff|what time|upcoming/i.test(message)) {
    return 'FIXTURE';
  }
  
  // Results/Scores
  if (/score|result|won|lost|beat|draw|final score|how did|did .* win/i.test(message)) {
    return 'RESULT';
  }
  
  // Standings/Table
  if (/standings|table|position|rank|points|top of|bottom of|league table/i.test(message)) {
    return 'STANDINGS';
  }
  
  // Statistics
  if (/stats|statistics|goals|assists|top scorer|most|average|record|career/i.test(message)) {
    return 'STATS';
  }
  
  // Injuries
  if (/injur|fit|available|out|miss|suspend|ban|ruled out|doubtful/i.test(message)) {
    return 'INJURY';
  }
  
  // Transfers
  if (/transfer|sign|signing|rumor|buy|sell|loan|contract|free agent|deal/i.test(message)) {
    return 'TRANSFER';
  }
  
  // Manager/Coach
  if (/manager|coach|boss|head coach|said|press conference|tactic|formation/i.test(message)) {
    return 'MANAGER';
  }
  
  // Odds/Markets
  if (/odds|favorite|underdog|market|price|over under|spread|moneyline/i.test(message)) {
    return 'ODDS';
  }
  
  // Comparisons
  if (/vs|versus|compare|better|who is better|difference between/i.test(message)) {
    return 'COMPARISON';
  }
  
  // History/Records
  if (/history|all.time|record|ever|most .* in history|champion|trophy|won the/i.test(message)) {
    return 'HISTORY';
  }
  
  // Broadcast/TV
  if (/watch|channel|tv|stream|broadcast|where .* watch|how .* watch/i.test(message)) {
    return 'BROADCAST';
  }
  
  // Venue/Stadium
  if (/stadium|venue|arena|capacity|where .* play|home ground/i.test(message)) {
    return 'VENUE';
  }
  
  return 'GENERAL';
}

/**
 * Detect if the query needs real-time search
 * Default to TRUE for most sports questions to ensure fresh data
 * Only skip for very generic knowledge questions
 */
function needsRealTimeSearch(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Questions that DON'T need real-time search (general knowledge)
  const noSearchKeywords = [
    'what is offside',
    'what are the rules',
    'how many players',
    'what is a foul',
    'explain the rules',
    'definition of',
    'how does .* work',
    'history of the sport',
    'when was .* invented',
  ];
  
  // If it's a general knowledge question, skip search
  if (noSearchKeywords.some(keyword => {
    if (keyword.includes('.*')) {
      return new RegExp(keyword).test(lowerMessage);
    }
    return lowerMessage.includes(keyword);
  })) {
    return false;
  }
  
  // Everything else gets real-time search
  return true;
}

/**
 * Build optimized search query based on question category
 */
function extractSearchQuery(message: string): { query: string; category: QueryCategory; recency: 'hour' | 'day' | 'week' | 'month' } {
  const category = detectQueryCategory(message);
  
  // Clean up the message for search
  let query = message
    .replace(/\?/g, '')
    .replace(/please|can you|could you|tell me|what do you think|i want to know/gi, '')
    .trim();
  
  // Category-specific query optimization
  let recency: 'hour' | 'day' | 'week' | 'month' = 'day';
  
  switch (category) {
    case 'ROSTER':
      query += ' 2024-2025 season current roster squad players';
      recency = 'week';
      break;
      
    case 'FIXTURE':
      query += ' upcoming fixture schedule next match kickoff time December 2024';
      recency = 'day';
      break;
      
    case 'RESULT':
      query += ' final score result match report';
      recency = 'day';
      break;
      
    case 'STANDINGS':
      query += ' 2024-2025 league table standings points';
      recency = 'day';
      break;
      
    case 'STATS':
      query += ' 2024-2025 season statistics stats goals assists';
      recency = 'week';
      break;
      
    case 'INJURY':
      query += ' injury update news team news fitness December 2024';
      recency = 'day';
      break;
      
    case 'TRANSFER':
      query += ' transfer news rumors latest December 2024';
      recency = 'day';
      break;
      
    case 'MANAGER':
      query += ' manager coach press conference tactics news';
      recency = 'day';
      break;
      
    case 'ODDS':
      query += ' betting odds market prices bookmakers';
      recency = 'day';
      break;
      
    case 'COMPARISON':
      query += ' comparison stats 2024-2025 head to head';
      recency = 'week';
      break;
      
    case 'HISTORY':
      query += ' history record all time statistics';
      recency = 'month';
      break;
      
    case 'BROADCAST':
      query += ' TV channel stream where to watch broadcast';
      recency = 'day';
      break;
      
    case 'VENUE':
      query += ' stadium venue arena ground';
      recency = 'month';
      break;
      
    case 'GENERAL':
    default:
      query += ' latest news December 2024';
      recency = 'day';
      break;
  }
  
  return { query, category, recency };
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI chat is not configured' },
        { status: 503 }
      );
    }

    let perplexityContext = '';
    let citations: string[] = [];

    // Step 1: Use Perplexity for real-time search if needed
    if (needsRealTimeSearch(message)) {
      const perplexity = getPerplexityClient();
      
      if (perplexity.isConfigured()) {
        console.log('[AI-Chat] Fetching real-time context from Perplexity...');
        
        // Extract optimized search query with category detection
        const { query: searchQuery, category, recency } = extractSearchQuery(message);
        
        console.log(`[AI-Chat] Category: ${category} | Recency: ${recency}`);
        console.log(`[AI-Chat] Search query: "${searchQuery}"`);
        
        // Use higher token limit for detailed queries like rosters or comparisons
        const needsMoreTokens = ['ROSTER', 'COMPARISON', 'STANDINGS', 'STATS'].includes(category);
        
        const searchResult = await perplexity.search(searchQuery, {
          recency,
          model: 'sonar-pro',
          maxTokens: needsMoreTokens ? 1500 : 1000,
        });

        if (searchResult.success && searchResult.content) {
          perplexityContext = searchResult.content;
          citations = searchResult.citations || [];
          console.log('[AI-Chat] Perplexity context retrieved:', perplexityContext.slice(0, 200) + '...');
          console.log('[AI-Chat] Citations received:', JSON.stringify(citations));
        } else {
          console.log('[AI-Chat] No Perplexity results:', searchResult.error);
        }
      }
    }

    // Step 2: Build messages for GPT
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
    ];

    // Add conversation history (last 10 messages to stay within context)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message with Perplexity context
    let userContent = message;
    if (perplexityContext) {
      userContent = `USER QUESTION: ${message}

REAL-TIME SPORTS DATA (from web search, use this for your answer):
${perplexityContext}

Please answer the user's question using the real-time data above. Cite sources if relevant.`;
    }

    messages.push({ role: 'user', content: userContent });

    // Step 3: Get GPT response
    console.log('[AI-Chat] Sending to GPT...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log('[AI-Chat] Response generated successfully');

    return NextResponse.json({
      success: true,
      response,
      citations,
      usedRealTimeSearch: !!perplexityContext,
      model: 'gpt-4o-mini + sonar-pro',
    });

  } catch (error) {
    console.error('[AI-Chat] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Health check
// ============================================

export async function GET() {
  const perplexity = getPerplexityClient();
  
  return NextResponse.json({
    status: 'ok',
    capabilities: {
      gpt: !!process.env.OPENAI_API_KEY,
      perplexity: perplexity.isConfigured(),
      model: 'gpt-4o-mini + sonar-pro',
    },
    description: 'AI Chat API combining Perplexity (real-time search) + GPT (reasoning)',
  });
}
