/**
 * AI Chat API - Combines Perplexity (real-time search) + GPT (reasoning)
 * 
 * Flow:
 * 1. User asks a sports question
 * 2. Detect mode: AGENT (opinionated) vs DATA (strict accuracy)
 * 3. Check knowledge base for similar past answers
 * 4. Perplexity searches for real-time sports data
 * 5. GPT responds with appropriate personality
 * 6. Save successful Q&A to knowledge base for learning
 * 7. Track query in memory system for analytics
 * 
 * Uses SportBot Master Brain for consistent personality across app.
 * Uses SportBot Knowledge for self-learning capabilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getPerplexityClient } from '@/lib/perplexity';
import { detectChatMode, buildSystemPrompt, type BrainMode } from '@/lib/sportbot-brain';
import { trackQuery } from '@/lib/sportbot-memory';
import { saveKnowledge, buildLearnedContext, getTerminologyForSport } from '@/lib/sportbot-knowledge';

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
  
  // Player/Athlete lookup patterns:
  // - "where does X play", "who is X", "tell me about X"
  // - "X player", "X career", "X biography"
  // - Questions with proper nouns (capitalized names)
  if (
    /where (does|do|did|is) \w+ \w* ?play|which team (does|is)|what team (does|is)/i.test(message) ||
    /who is [A-Z][a-z]+/i.test(message) ||
    /tell me about [A-Z][a-z]+/i.test(message) ||
    /(biography|career|born|nationality|height|age) of/i.test(message) ||
    /[A-Z][a-z]+ [A-Z][a-z]+ (player|athlete|footballer|basketball|tennis)/i.test(message)
  ) {
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
 * DEFAULT: SEARCH EVERYTHING (safer - ensures fresh data)
 * 
 * Only skip search for:
 *   - Rules/definitions ("what is offside")
 *   - Simple greetings ("hello", "thanks")
 *   - Pure opinions with no factual component
 */

// Keywords that indicate GPT can answer alone (static knowledge ONLY)
const GPT_ONLY_PATTERNS = [
  // Rules & definitions (never change)
  /what (is|are) (offside|a foul|the rules|handball)/i,
  /rules of (football|soccer|basketball|tennis)/i,
  /how many players/i,
  /explain .*(rule|offside|foul)/i,
  
  // Simple greetings (no search needed)
  /^(hello|hi|hey|thanks|thank you|bye|ok|okay)[\s!?.]*$/i,
  /^(who are you|what can you do|help me?)[\s!?.]*$/i,
  
  // Pure hypotheticals with no real lookup
  /^what if .* (never|didn't|hadn't)/i,
  /^imagine if/i,
];

/**
 * Smart detection: Does this query need real-time data?
 * DEFAULT: YES - search unless clearly static
 */
function needsRealTimeSearch(message: string): boolean {
  const lower = message.toLowerCase().trim();
  
  // Check if it's a static/greeting question that doesn't need search
  for (const pattern of GPT_ONLY_PATTERNS) {
    if (pattern.test(message)) {
      console.log(`[Router] GPT-only pattern match - skipping search`);
      return false;
    }
  }
  
  // Check for explicit search requests
  if (/check|look up|search|find|wikipedia|google|tell me about/i.test(lower)) {
    console.log('[Router] Explicit search request detected');
    return true;
  }
  
  // Check for proper nouns (capitalized words that aren't sentence starters)
  // This catches player names like "Goran Huskic"
  const hasProperNoun = /\s[A-Z][a-z]{2,}/.test(message) || /^[A-Z][a-z]+\s+[A-Z]/.test(message);
  if (hasProperNoun) {
    console.log('[Router] Proper noun detected (likely player/team name) - searching');
    return true;
  }
  
  // Check for non-English sports queries (common patterns)
  // Serbian/Croatian: gde, ko, koji, kada
  // Spanish: donde, quien, cual, cuando
  // German: wo, wer, welche, wann
  // French: où, qui, quel, quand
  if (/\b(gde|ko je|koji|kada|donde|quien|cual|cuando|wo spielt|wer ist|où|qui est|quel)\b/i.test(lower)) {
    console.log('[Router] Non-English query detected - searching');
    return true;
  }
  
  // If message contains any word that looks like a name (2+ capitalized words)
  const capitalizedWords = message.match(/\b[A-Z][a-z]+\b/g) || [];
  if (capitalizedWords.length >= 2) {
    console.log('[Router] Multiple capitalized words (likely names) - searching');
    return true;
  }
  
  // If it's a question (any language), default to searching
  if (/\?$/.test(message.trim()) || lower.length > 15) {
    console.log('[Router] Question detected - defaulting to search');
    return true;
  }
  
  // Very short messages without question marks - probably greetings
  if (lower.length < 15 && !/\?/.test(message)) {
    console.log('[Router] Short non-question - skipping search');
    return false;
  }
  
  // DEFAULT: Search to be safe
  console.log('[Router] Defaulting to real-time search');
  return true;
}

/**
 * Detect sport from message
 */
function detectSport(message: string): string | undefined {
  const lower = message.toLowerCase();
  
  // Football/Soccer
  if (/football|soccer|premier league|la liga|serie a|bundesliga|ligue 1|champions league|europa|fc |united|city|real madrid|barcelona|bayern|goal|striker|midfielder/i.test(lower)) {
    return 'football';
  }
  
  // Basketball
  if (/basketball|nba|euroleague|lakers|celtics|warriors|nets|point guard|center|forward|dunk|three.?pointer/i.test(lower)) {
    return 'basketball';
  }
  
  // Tennis
  if (/tennis|atp|wta|grand slam|wimbledon|us open|french open|australian open|nadal|djokovic|federer|serve|backhand/i.test(lower)) {
    return 'tennis';
  }
  
  // MMA/UFC
  if (/mma|ufc|bellator|knockout|submission|fighter|octagon|weight class|pound.for.pound/i.test(lower)) {
    return 'mma';
  }
  
  // American Football
  if (/nfl|american football|quarterback|touchdown|super bowl|chiefs|eagles|cowboys|patriots/i.test(lower)) {
    return 'american_football';
  }
  
  // Baseball
  if (/baseball|mlb|yankees|dodgers|red sox|home run|pitcher|batting/i.test(lower)) {
    return 'baseball';
  }
  
  // Hockey
  if (/hockey|nhl|ice hockey|puck|goalie|rangers|bruins|maple leafs/i.test(lower)) {
    return 'hockey';
  }
  
  return undefined;
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
      // For player lookups, include Wikipedia for obscure players
      // Famous players will get plenty of real-time results anyway
      query += ' player profile current team club 2024 2025 career wikipedia biography nationality';
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
    
    // Step 2.5: Get learned context from knowledge base
    let learnedContext = '';
    let sportTerminology: string[] = [];
    try {
      const { query: searchQuery, category } = extractSearchQuery(message);
      const detectedSport = detectSport(message);
      
      // Get past similar answers for context
      learnedContext = await buildLearnedContext(message, detectedSport);
      
      // Get sport terminology
      if (detectedSport) {
        sportTerminology = getTerminologyForSport(detectedSport);
      }
      
      console.log('[AI-Chat] Learned context:', learnedContext ? 'Found' : 'None');
      console.log('[AI-Chat] Sport detected:', detectedSport || 'Unknown');
    } catch (err) {
      console.error('[AI-Chat] Knowledge lookup failed:', err);
    }
    
    const systemPrompt = buildSystemPrompt(brainMode, {
      hasRealTimeData: !!perplexityContext,
    });
    
    // Enhance system prompt with learned knowledge
    let enhancedSystemPrompt = systemPrompt;
    if (learnedContext) {
      enhancedSystemPrompt += `\n\n${learnedContext}`;
    }
    if (sportTerminology.length > 0) {
      enhancedSystemPrompt += `\n\nSPORT TERMINOLOGY TO USE: ${sportTerminology.slice(0, 10).join(', ')}`;
    }
    
    console.log('[AI-Chat] Brain mode:', brainMode);
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: enhancedSystemPrompt },
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
      sport: detectSport(message),
      usedRealTimeSearch: !!perplexityContext,
      responseLength: response.length,
      hadCitations: citations.length > 0,
    }).catch(err => console.error('[AI-Chat] Memory tracking failed:', err));

    // Save to knowledge base for learning (async, don't block response)
    // Only save substantial answers with real-time data
    saveKnowledge({
      question: message,
      answer: response,
      sport: detectSport(message),
      category: queryCategory,
      hadRealTimeData: !!perplexityContext,
      citations,
    }).catch(err => console.error('[AI-Chat] Knowledge save failed:', err));

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
