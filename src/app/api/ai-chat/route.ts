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

const CHAT_SYSTEM_PROMPT = `You are SportBot, an AI sports analyst assistant. You provide intelligent, data-driven sports analysis and answer questions about matches, teams, players, and sports news.

PERSONALITY:
- Confident and knowledgeable
- Direct and clear communication
- Slightly witty but always professional
- Data-focused with sharp insights

GUIDELINES:
1. Use the real-time context provided to give accurate, current information
2. If asked about specific matches, teams, or players, reference the latest data
3. Be helpful and informative
4. Acknowledge when information might be outdated or uncertain
5. NEVER give betting advice, tips, or tell users to bet
6. You can discuss odds factually (as data points) but never recommend bets
7. Focus on analysis, insights, and understanding - not predictions

RESPONSE STYLE:
- Keep responses concise but informative (2-4 paragraphs max)
- Use bullet points for clarity when listing facts
- Cite sources when relevant (from the provided context)
- If no relevant real-time data was found, acknowledge it and give general insights

PROHIBITED:
- "You should bet on..."
- "I recommend betting..."
- "Place a bet on..."
- Any gambling advice or encouragement
- Guaranteed predictions

You help users UNDERSTAND sports, not win bets.`;

// ============================================
// HELPER FUNCTIONS
// ============================================

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
    'explain',
    'definition of',
    'how does',
    'history of',
  ];
  
  // If it's a general knowledge question, skip search
  if (noSearchKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return false;
  }
  
  // Keywords that DEFINITELY need real-time search
  const realTimeKeywords = [
    // Time-based
    'today', 'tonight', 'tomorrow', 'this week', 'weekend', 'now', 'current', 'currently',
    'right now', 'at the moment', 'this season', '2024', '2025',
    // News & updates
    'latest', 'recent', 'news', 'update', 'injured', 'injury', 'injuries',
    'lineup', 'starting', 'confirmed', 'rumor', 'transfer', 'signed', 'signing',
    // Form & performance
    'form', 'streak', 'odds', 'price', 'market', 'standings', 'table', 'position',
    // Matches
    'vs', 'versus', 'match', 'game', 'play', 'playing', 'fixture',
    'who will', 'what time', 'when is', 'where is',
    'score', 'result', 'won', 'lost', 'draw', 'beat',
    // Leagues
    'premier league', 'la liga', 'champions league', 'europa league', 'euroleague',
    'nba', 'nfl', 'nhl', 'mlb', 'acb', 'eurocup',
    // People
    'manager', 'coach', 'press conference', 'said', 'player', 'players',
    // Teams/Rosters
    'roster', 'squad', 'team', 'lineup', 'center', 'forward', 'guard', 'goalkeeper',
    'defender', 'midfielder', 'striker', 'bench', 'captain',
    // Specific teams (common queries)
    'barcelona', 'real madrid', 'lakers', 'celtics', 'manchester', 'liverpool',
    'bayern', 'psg', 'juventus', 'arsenal', 'chelsea', 'tottenham',
  ];
  
  // If any real-time keyword found, search
  if (realTimeKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return true;
  }
  
  // Default: If it mentions a team name or looks like a sports question, search
  // This catches questions like "who plays for X" even without explicit keywords
  const sportsPatterns = [
    /who (is|are|plays|play)/i,
    /what (is|are) .*(team|club|squad)/i,
    /tell me about/i,
    /(fc|cf|bc|ac) /i,  // Football/Basketball club prefixes
  ];
  
  if (sportsPatterns.some(pattern => pattern.test(message))) {
    return true;
  }
  
  // Default to searching for safety (better to have fresh data)
  return true;
}

/**
 * Extract search query from user message
 * Optimize for getting current/recent information
 */
function extractSearchQuery(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Clean up the message for search
  let query = message
    .replace(/\?/g, '')
    .replace(/please|can you|could you|tell me|what do you think/gi, '')
    .trim();
  
  // Detect query type and add appropriate context
  const isRosterQuery = /roster|squad|player|center|forward|guard|lineup|team|who plays/i.test(message);
  const isMatchQuery = /vs|versus|match|game|fixture|play against/i.test(message);
  const isStandingsQuery = /standings|table|position|rank/i.test(message);
  const isInjuryQuery = /injur|injured|fit|available|out|miss/i.test(message);
  
  // Add current year/season for roster and standings queries
  if (isRosterQuery) {
    query += ' 2024-2025 season roster squad current';
  } else if (isStandingsQuery) {
    query += ' 2024-2025 current standings';
  } else if (isInjuryQuery) {
    query += ' injury news update today December 2024';
  } else if (isMatchQuery) {
    query += ' preview latest news';
  } else if (!lowerMessage.includes('news') && !lowerMessage.includes('today')) {
    // Generic: add recency context
    query += ' latest news December 2024';
  }
  
  return query;
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
        
        const searchQuery = extractSearchQuery(message);
        
        // Use wider recency window for roster/standings queries
        const isStructuralQuery = /roster|squad|player|standings|table|team/i.test(message);
        const recency = isStructuralQuery ? 'week' : 'day';
        
        console.log(`[AI-Chat] Search query: "${searchQuery}" (recency: ${recency})`);
        
        const searchResult = await perplexity.search(searchQuery, {
          recency,
          model: 'sonar-pro',
          maxTokens: 1000, // More tokens for detailed roster info
        });

        if (searchResult.success && searchResult.content) {
          perplexityContext = searchResult.content;
          citations = searchResult.citations || [];
          console.log('[AI-Chat] Perplexity context retrieved:', perplexityContext.slice(0, 200) + '...');
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
