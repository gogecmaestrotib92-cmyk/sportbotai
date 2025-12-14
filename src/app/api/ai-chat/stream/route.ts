/**
 * AI Chat API - STREAMING VERSION
 * 
 * Same logic as the main ai-chat endpoint but streams the response
 * for a more responsive UX.
 * 
 * Features:
 * - Response streaming (SSE)
 * - Query caching (category-based TTL)
 * - Multi-language support
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getPerplexityClient } from '@/lib/perplexity';
import { detectChatMode, buildSystemPrompt, type BrainMode } from '@/lib/sportbot-brain';
import { trackQuery } from '@/lib/sportbot-memory';
import { saveKnowledge, buildLearnedContext, getTerminologyForSport } from '@/lib/sportbot-knowledge';
import { cacheGet, cacheSet, CACHE_KEYS, hashChatQuery, getChatTTL } from '@/lib/cache';

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
// HELPER FUNCTIONS (simplified from main route)
// ============================================

/**
 * Detect if message is non-English and translate for better search results
 */
async function translateToEnglish(message: string): Promise<{
  originalLanguage: string;
  englishQuery: string;
  needsTranslation: boolean;
}> {
  const hasNonAscii = /[^\x00-\x7F]/.test(message);
  const hasCyrillic = /[\u0400-\u04FF]/.test(message);
  const hasCommonNonEnglish = /\b(je|da|li|sta|šta|što|kako|koliko|gdje|gde|kada|zašto|porque|qué|cómo|cuándo|dónde|wie|was|wann|wo|warum|où|quand|pourquoi|comment|combien)\b/i.test(message);
  
  if (!hasNonAscii && !hasCyrillic && !hasCommonNonEnglish) {
    return { originalLanguage: 'en', englishQuery: message, needsTranslation: false };
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Translate to English. Keep player/team names intact. Return ONLY the translation.`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 200,
      temperature: 0.1,
    });
    
    const englishQuery = response.choices[0]?.message?.content?.trim() || message;
    
    let originalLanguage = 'unknown';
    if (hasCyrillic || /\b(je|da|li|koliko|postigao|utakmic)\b/i.test(message)) {
      originalLanguage = 'sr';
    } else if (/\b(porque|qué|cómo|goles)\b/i.test(message)) {
      originalLanguage = 'es';
    } else if (/\b(wie|was|wann|wo|spiel)\b/i.test(message)) {
      originalLanguage = 'de';
    } else if (/\b(où|quand|pourquoi|match)\b/i.test(message)) {
      originalLanguage = 'fr';
    }
    
    return { originalLanguage, englishQuery, needsTranslation: true };
  } catch {
    return { originalLanguage: 'unknown', englishQuery: message, needsTranslation: false };
  }
}

type QueryCategory = 'PLAYER' | 'ROSTER' | 'FIXTURE' | 'RESULT' | 'STANDINGS' | 'STATS' | 
  'INJURY' | 'TRANSFER' | 'MANAGER' | 'ODDS' | 'COMPARISON' | 'HISTORY' | 'BROADCAST' | 
  'VENUE' | 'PLAYER_PROP' | 'BETTING_ADVICE' | 'GENERAL';

function detectQueryCategory(message: string): QueryCategory {
  const msg = message.toLowerCase();
  
  // Betting patterns
  if (/should i bet|over|under|plus|minus|prop|parlay|odds|spread|line/i.test(msg)) {
    if (/player|points|rebounds|assists|pts|reb|ast/i.test(msg)) {
      return 'PLAYER_PROP';
    }
    return 'BETTING_ADVICE';
  }
  
  if (/who (plays|is|are)|roster|squad|lineup/i.test(msg)) return 'ROSTER';
  if (/when (is|does)|next (game|match)|schedule/i.test(msg)) return 'FIXTURE';
  if (/score|result|won|lost|beat/i.test(msg)) return 'RESULT';
  if (/standings|table|position|rank/i.test(msg)) return 'STANDINGS';
  if (/stats|statistics|goals|assists|points|average/i.test(msg)) return 'STATS';
  if (/injur|fit|available|out|miss/i.test(msg)) return 'INJURY';
  if (/transfer|sign|rumor|buy|sell/i.test(msg)) return 'TRANSFER';
  if (/manager|coach|boss|press conference/i.test(msg)) return 'MANAGER';
  if (/odds|favorite|underdog|market/i.test(msg)) return 'ODDS';
  if (/vs|versus|compare|better/i.test(msg)) return 'COMPARISON';
  if (/history|all.time|record|ever/i.test(msg)) return 'HISTORY';
  if (/watch|channel|tv|stream/i.test(msg)) return 'BROADCAST';
  if (/stadium|venue|arena/i.test(msg)) return 'VENUE';
  if (/where (does|is).*play|who is/i.test(msg)) return 'PLAYER';
  
  return 'GENERAL';
}

function needsSearch(message: string): boolean {
  // Static knowledge that GPT knows
  const gptOnlyPatterns = [
    /what (is|are) (offside|a foul|the rules|handball)/i,
    /rules of (football|soccer|basketball)/i,
    /how many players/i,
    /^(hello|hi|hey|thanks|thank you|bye|ok)[\s!?.]*$/i,
    /^(who are you|what can you do|help)[\s!?.]*$/i,
  ];
  
  for (const pattern of gptOnlyPatterns) {
    if (pattern.test(message)) return false;
  }
  
  return true;
}

function detectSport(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (/football|soccer|premier league|la liga|serie a|bundesliga|champions league/i.test(lower)) return 'football';
  if (/basketball|nba|euroleague|lakers|celtics|warriors/i.test(lower)) return 'basketball';
  if (/tennis|atp|wta|wimbledon|nadal|djokovic/i.test(lower)) return 'tennis';
  if (/nfl|american football|quarterback|touchdown|super bowl/i.test(lower)) return 'american_football';
  return undefined;
}

// ============================================
// SMART FOLLOW-UP SUGGESTIONS
// ============================================

/**
 * Generate contextual follow-up suggestions based on the query and response
 */
function generateFollowUps(
  message: string, 
  category: QueryCategory, 
  sport: string | undefined
): string[] {
  const suggestions: string[] = [];
  
  // Extract team/player names from message
  const nameMatch = message.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  const extractedName = nameMatch ? nameMatch[1] : null;
  
  // Category-specific follow-ups
  switch (category) {
    case 'STANDINGS':
      suggestions.push(
        'Who is the top scorer this season?',
        'Which team has the best form?',
        'Any relegation battles to watch?'
      );
      break;
      
    case 'ROSTER':
      if (extractedName) {
        suggestions.push(
          `What formation does ${extractedName} play?`,
          `Any injury updates for ${extractedName}?`,
          `When do ${extractedName} play next?`
        );
      }
      break;
      
    case 'STATS':
      if (extractedName) {
        suggestions.push(
          `How does ${extractedName} compare to other players?`,
          `What's ${extractedName}'s recent form?`,
          `Career highlights of ${extractedName}?`
        );
      }
      break;
      
    case 'PLAYER':
      if (extractedName) {
        suggestions.push(
          `${extractedName} stats this season?`,
          `${extractedName} career history?`,
          `Latest news about ${extractedName}?`
        );
      }
      break;
      
    case 'FIXTURE':
      suggestions.push(
        'What are the key matchups this week?',
        'Where can I watch the game?',
        'Any injury concerns for the match?'
      );
      break;
      
    case 'RESULT':
      suggestions.push(
        'Who were the best performers?',
        'How does this affect the standings?',
        'What are the upcoming fixtures?'
      );
      break;
      
    case 'INJURY':
      suggestions.push(
        'When is the expected return?',
        'Who will replace them?',
        'How does this affect the team?'
      );
      break;
      
    case 'TRANSFER':
      suggestions.push(
        'What\'s the fee?',
        'Where are they moving to?',
        'Any other transfer rumors?'
      );
      break;
      
    case 'BETTING_ADVICE':
    case 'PLAYER_PROP':
      if (extractedName) {
        suggestions.push(
          `${extractedName} recent form breakdown`,
          `Head-to-head stats for this matchup`,
          `${extractedName} home vs away splits`
        );
      }
      break;
      
    default:
      // Sport-specific defaults
      if (sport === 'football') {
        suggestions.push(
          'Premier League standings?',
          'Champions League fixtures?',
          'Top scorers this season?'
        );
      } else if (sport === 'basketball') {
        suggestions.push(
          'NBA standings?',
          'Who\'s leading in scoring?',
          'Tonight\'s NBA games?'
        );
      }
  }
  
  // Return max 3 suggestions
  return suggestions.slice(0, 3);
}

// ============================================
// CACHED RESPONSE TYPE
// ============================================

interface CachedChatResponse {
  response: string;
  citations: string[];
  usedRealTimeSearch: boolean;
  brainMode: string;
  cachedAt: number;
}

// ============================================
// STREAMING POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI chat is not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check cache first (only for queries without conversation history)
    const queryHash = hashChatQuery(message);
    const cacheKey = CACHE_KEYS.chat(queryHash);
    const queryCategory = detectQueryCategory(message);
    const detectedSport = detectSport(message);
    
    if (history.length === 0) {
      const cached = await cacheGet<CachedChatResponse>(cacheKey);
      if (cached) {
        console.log(`[AI-Chat-Stream] Cache HIT for: "${message.slice(0, 50)}..."`);
        
        // Generate follow-up suggestions
        const followUps = generateFollowUps(message, queryCategory, detectedSport);
        
        // Return cached response as a streaming-like response
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller) {
            // Send metadata
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'metadata',
              citations: cached.citations,
              usedRealTimeSearch: cached.usedRealTimeSearch,
              brainMode: cached.brainMode,
              fromCache: true,
              followUps,
            })}\n\n`));
            
            // Send content all at once (cached)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              content: cached.response,
            })}\n\n`));
            
            // Send done
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          },
        });
        
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
    }

    // Step 0: Translate if needed
    const translation = await translateToEnglish(message);
    const searchMessage = translation.englishQuery;
    const originalLanguage = translation.originalLanguage;
    
    let perplexityContext = '';
    let citations: string[] = [];
    const shouldSearch = needsSearch(searchMessage);
    // queryCategory already defined above for caching

    // Step 1: Perplexity search if needed
    if (shouldSearch) {
      const perplexity = getPerplexityClient();
      
      if (perplexity.isConfigured()) {
        console.log('[AI-Chat-Stream] Fetching real-time context...');
        
        const searchResult = await perplexity.search(searchMessage, {
          recency: 'week',
          model: 'sonar-pro',
          maxTokens: 1000,
        });

        if (searchResult.success && searchResult.content) {
          perplexityContext = searchResult.content;
          citations = searchResult.citations || [];
        }
      }
    }

    // Step 2: Build system prompt
    const brainMode: BrainMode = 
      (queryCategory === 'BETTING_ADVICE' || queryCategory === 'PLAYER_PROP') 
        ? 'betting' 
        : detectChatMode(message);
    
    let systemPrompt = buildSystemPrompt(brainMode, {
      hasRealTimeData: !!perplexityContext,
    });

    // Add learned context (using detectedSport defined earlier)
    try {
      const learnedContext = await buildLearnedContext(message, detectedSport);
      const sportTerminology = detectedSport ? getTerminologyForSport(detectedSport) : [];
      
      if (learnedContext) systemPrompt += `\n\n${learnedContext}`;
      if (sportTerminology.length > 0) {
        systemPrompt += `\n\nSPORT TERMINOLOGY: ${sportTerminology.slice(0, 10).join(', ')}`;
      }
    } catch { /* ignore */ }
    
    // Add language instruction
    if (translation.needsTranslation && originalLanguage !== 'en') {
      const langNames: Record<string, string> = {
        'sr': 'Serbian/Croatian', 'es': 'Spanish', 'de': 'German', 'fr': 'French', 'unknown': 'the user\'s language'
      };
      systemPrompt += `\n\nIMPORTANT: Respond in ${langNames[originalLanguage] || langNames['unknown']}, not English.`;
    }

    // Build messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add history
    for (const msg of history.slice(-10)) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Add user message with context
    let userContent = message;
    if (perplexityContext) {
      userContent = `USER QUESTION: ${message}\n\nREAL-TIME DATA:\n${perplexityContext}\n\nUse the real-time data to answer. Be sharp and specific.`;
    }
    messages.push({ role: 'user', content: userContent });

    // Step 3: Create streaming response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 800,
      temperature: 0.7,
      stream: true,
    });

    // Create ReadableStream for SSE
    const encoder = new TextEncoder();
    let fullResponse = '';
    
    // Generate follow-up suggestions
    const followUps = generateFollowUps(message, queryCategory, detectedSport);
    
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send metadata first
          const metadata = {
            type: 'metadata',
            citations,
            usedRealTimeSearch: !!perplexityContext,
            brainMode,
            followUps,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));

          // Stream the response
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
            }
          }

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();

          // Track query and save knowledge (async)
          trackQuery({
            query: message,
            category: queryCategory,
            brainMode,
            sport: detectSport(message),
            usedRealTimeSearch: !!perplexityContext,
            responseLength: fullResponse.length,
            hadCitations: citations.length > 0,
          }).catch(() => {});

          saveKnowledge({
            question: message,
            answer: fullResponse,
            sport: detectSport(message),
            category: queryCategory,
            hadRealTimeData: !!perplexityContext,
            citations,
          }).catch(() => {});

          // Cache the response (only for queries without history context)
          if (history.length === 0 && fullResponse.length > 50) {
            const cacheTTL = getChatTTL(queryCategory);
            cacheSet<CachedChatResponse>(cacheKey, {
              response: fullResponse,
              citations,
              usedRealTimeSearch: !!perplexityContext,
              brainMode,
              cachedAt: Date.now(),
            }, cacheTTL).catch(() => {});
            console.log(`[AI-Chat-Stream] Cached response (TTL: ${cacheTTL}s)`);
          }

        } catch (error) {
          console.error('[AI-Chat-Stream] Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[AI-Chat-Stream] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
