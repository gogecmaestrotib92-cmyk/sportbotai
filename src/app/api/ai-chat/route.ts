/**
 * AI Chat API - Combines Perplexity (real-time search) + GPT (reasoning)
 * 
 * Flow:
 * 1. User asks a sports question
 * 2. Detect mode: AGENT (opinionated) vs DATA (strict accuracy)
 * 3. Perplexity searches for real-time sports data
 * 4. GPT responds with appropriate personality
 * 5. Track query in memory system for learning
 * 
 * Uses SportBot Master Brain for consistent personality across app.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getPerplexityClient } from '@/lib/perplexity';
import { detectChatMode, buildSystemPrompt, type BrainMode } from '@/lib/sportbot-brain';
import { trackQuery } from '@/lib/sportbot-memory';

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
// QUERY CATEGORY DETECTION
// ============================================

type QueryCategory = 
  | 'PLAYER'      // Where does player X play? Who is player X?
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
  
  // Player lookup - "where does X play", "who is X", "X player"
  // Detect: proper noun + play/team, or asking about a person
  if (/where (does|do|did|is) \w+ \w* ?play|which team (does|is)|what team (does|is)|who is [A-Z]/i.test(message)) {
    // Make sure it's not asking about a team's home ground
    if (!/stadium|arena|venue|home ground|capacity/i.test(message)) {
      return 'PLAYER';
    }
  }
  
  // Venue/Stadium - only if explicitly asking about stadium
  if (/stadium|venue|arena|capacity|home ground|where .* (team|club) play/i.test(message)) {
    return 'VENUE';
  }
  
  return 'GENERAL';
}

/**
 * SMART ROUTING: Decide if query needs Perplexity (real-time) or GPT-only
 * 
 * PERPLEXITY (sonar-pro) - Use when:
 *   ✓ Current data needed (today's scores, live standings, recent news)
 *   ✓ Specific team/player info (rosters, injuries, transfers)
 *   ✓ Time-sensitive questions (fixtures, odds, form)
 *   ✓ Breaking news / rumors
 *   ✓ Factual lookups that change frequently
 * 
 * GPT-ONLY - Use when:
 *   ✓ Static knowledge (rules, history pre-2023, sport explanations)
 *   ✓ Opinion / analysis questions (who's better, predictions)
 *   ✓ Hypothetical scenarios ("what if Messi...")
 *   ✓ General sports knowledge that doesn't change
 *   ✓ Simple greetings / chitchat
 */

// Time-sensitive keywords that REQUIRE real-time search
const REALTIME_KEYWORDS = [
  // Current state
  'today', 'tonight', 'now', 'current', 'currently', 'right now', 'latest', 'recent',
  'this week', 'this season', 'this month', '2024', '2025', 'december',
  
  // Player lookups (where does X play, who is X)
  'where does', 'where do', 'where is', 'which team', 'what team', 'plays for',
  'who is', 'play for', 'signed for', 'joined',
  
  // Roster/Team composition (changes frequently)
  'roster', 'squad', 'lineup', 'starting', 'team sheet', 'formation',
  'who plays for', 'who is on', 'players on',
  
  // Time-sensitive data
  'injury', 'injured', 'fit', 'available', 'ruled out', 'doubtful', 'suspended',
  'transfer', 'signing', 'signed', 'deal', 'rumor', 'linked',
  'standings', 'table', 'position', 'points', 'rank',
  'score', 'result', 'won', 'lost', 'beat', 'draw',
  'next match', 'next game', 'upcoming', 'fixture', 'when is', 'when does',
  'odds', 'favorite', 'underdog', 'price', 'market',
  
  // News-related
  'news', 'update', 'said', 'announced', 'confirmed', 'report', 'according',
  'press conference', 'interview', 'quote',
  
  // Stat lookups that need current data
  'top scorer', 'leading', 'most goals', 'most assists', 'golden boot',
  'form', 'streak', 'unbeaten', 'winless',
];

// Keywords that indicate GPT can answer alone (static knowledge)
const GPT_ONLY_KEYWORDS = [
  // Rules & definitions
  'what is offside', 'what are the rules', 'rules of', 'how many players',
  'what is a foul', 'explain', 'definition', 'meaning of',
  'how does .* work', 'what counts as', 'when is it',
  
  // Historical (pre-2023, won't change)
  'all.time', 'history of', 'when was .* invented', 'originated',
  'first ever', 'record for', 'most .* ever', 'greatest of all time',
  'hall of fame', 'legend', 'retired',
  
  // Opinion / Analysis (GPT reasoning)
  'who is better', 'who would win', 'compare', 'vs',
  'should i', 'do you think', 'your opinion', 'what do you think',
  'predict', 'will .* win', 'chances of',
  
  // Hypothetical
  'what if', 'imagine', 'hypothetically', 'would it be possible',
  
  // General chat
  'hello', 'hi', 'hey', 'thanks', 'thank you', 'bye', 'help',
  'who are you', 'what can you do',
];

/**
 * Smart detection: Does this query need real-time data?
 */
function needsRealTimeSearch(message: string): boolean {
  const lower = message.toLowerCase();
  
  // First check: Is this clearly a GPT-only question?
  for (const keyword of GPT_ONLY_KEYWORDS) {
    if (keyword.includes('.*')) {
      if (new RegExp(keyword, 'i').test(lower)) {
        console.log(`[Router] GPT-only match: "${keyword}"`);
        return false;
      }
    } else if (lower.includes(keyword)) {
      console.log(`[Router] GPT-only match: "${keyword}"`);
      return false;
    }
  }
  
  // Second check: Does it contain real-time keywords?
  for (const keyword of REALTIME_KEYWORDS) {
    if (lower.includes(keyword)) {
      console.log(`[Router] Real-time match: "${keyword}"`);
      return true;
    }
  }
  
  // Third check: Does it mention a specific team/player? (likely needs current data)
  const hasTeamOrPlayer = /\b(fc|bc|ac|united|city|real|atletico|juventus|barcelona|bayern|arsenal|chelsea|liverpool|tottenham|lakers|celtics|warriors|chiefs|eagles|cowboys|yankees|dodgers|messi|ronaldo|lebron|curry|mahomes|haaland|mbappe|salah)\b/i.test(message);
  
  if (hasTeamOrPlayer) {
    console.log('[Router] Team/player detected - using real-time search');
    return true;
  }
  
  // Fourth check: Is it a specific question (who, what, when, where)?
  const isSpecificQuestion = /^(who|what|when|where|how many|how much|which)\b/i.test(message);
  
  if (isSpecificQuestion && message.length > 20) {
    console.log('[Router] Specific question - using real-time search');
    return true;
  }
  
  // Default: Short/vague queries can use GPT alone
  console.log('[Router] No strong signals - defaulting to GPT-only');
  return false;
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
    case 'PLAYER':
      // For player lookups, search for their current team/profile
      query += ' player profile current team club 2024 2025 career wikipedia';
      recency = 'week';
      break;
      
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
    const shouldSearch = needsRealTimeSearch(message);
    
    // Detect category for all queries (for tracking)
    const queryCategory = detectQueryCategory(message);

    // Step 1: Use Perplexity for real-time search if needed
    if (shouldSearch) {
      const perplexity = getPerplexityClient();
      
      if (perplexity.isConfigured()) {
        console.log('[AI-Chat] Fetching real-time context from Perplexity...');
        
        // Extract optimized search query with category detection
        const { query: searchQuery, category, recency } = extractSearchQuery(message);
        
        console.log(`[AI-Chat] Category: ${category} | Recency: ${recency}`);
        console.log(`[AI-Chat] Search query: "${searchQuery}"`);
        
        // Use higher token limit for detailed queries like rosters or comparisons
        const needsMoreTokens = ['PLAYER', 'ROSTER', 'COMPARISON', 'STANDINGS', 'STATS'].includes(category);
        
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

    // Step 2: Detect brain mode and build system prompt
    const brainMode: BrainMode = detectChatMode(message);
    const systemPrompt = buildSystemPrompt(brainMode, {
      hasRealTimeData: !!perplexityContext,
    });
    
    console.log('[AI-Chat] Brain mode:', brainMode);
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
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

    // Track query in memory system (async, don't block response)
    trackQuery({
      query: message,
      category: queryCategory,
      brainMode,
      usedRealTimeSearch: !!perplexityContext,
      responseLength: response.length,
      hadCitations: citations.length > 0,
    }).catch(err => console.error('[AI-Chat] Memory tracking failed:', err));

    return NextResponse.json({
      success: true,
      response,
      citations,
      usedRealTimeSearch: !!perplexityContext,
      routingDecision: shouldSearch ? 'perplexity+gpt' : 'gpt-only',
      model: shouldSearch ? 'gpt-4o-mini + sonar-pro' : 'gpt-4o-mini',
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
