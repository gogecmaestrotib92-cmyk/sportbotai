/**
 * SportBot Agent Posts API
 * 
 * Generates AIXBT-style sports intelligence posts with REAL-TIME DATA.
 * Powered by Perplexity for live web search + OpenAI for generation.
 * Safe, observational, analytical content - never betting advice.
 * 
 * POST /api/agent - Generate a new agent post (with live research)
 * GET /api/agent - Get recent agent posts
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { 
  POST_CATEGORIES, 
  buildAgentPostPrompt, 
  sanitizeAgentPost,
  type PostCategory 
} from '@/lib/config/sportBotAgent';
import { 
  getPerplexityClient, 
  quickMatchResearch,
  type SearchCategory,
  type ResearchResult 
} from '@/lib/perplexity';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Map post categories to Perplexity search categories
const CATEGORY_SEARCH_MAP: Record<PostCategory, SearchCategory[]> = {
  MARKET_MOVEMENT: ['ODDS_MOVEMENT', 'BREAKING_NEWS'],
  LINEUP_INTEL: ['LINEUP_NEWS', 'INJURY_NEWS'],
  MOMENTUM_SHIFT: ['FORM_ANALYSIS', 'BREAKING_NEWS'],
  MATCH_COMPLEXITY: ['HEAD_TO_HEAD', 'FORM_ANALYSIS'],
  AI_INSIGHT: ['MATCH_PREVIEW', 'FORM_ANALYSIS'],
  POST_MATCH: ['BREAKING_NEWS'],
  VOLATILITY_ALERT: ['BREAKING_NEWS', 'INJURY_NEWS', 'LINEUP_NEWS'],
  FORM_ANALYSIS: ['FORM_ANALYSIS', 'BREAKING_NEWS'],
};

// ============================================
// TYPES
// ============================================

interface GeneratePostRequest {
  category: PostCategory;
  matchContext: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    kickoff?: string;
    odds?: {
      home?: number;
      draw?: number;
      away?: number;
    };
  };
  additionalContext?: string;
  trigger?: string;
  useRealTimeData?: boolean; // Enable Perplexity research
}

interface AgentPost {
  id: string;
  category: PostCategory;
  categoryName: string;
  categoryIcon: string;
  content: string;
  matchRef: string;
  sport: string;
  league: string;
  timestamp: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  realTimeData?: boolean; // Flag if real data was used
  citations?: string[]; // Sources from Perplexity
}

// ============================================
// POST - Generate Agent Post
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePostRequest = await request.json();
    const { category, matchContext, additionalContext, trigger, useRealTimeData = true } = body;

    // Validate category
    if (!POST_CATEGORIES[category]) {
      return NextResponse.json(
        { error: 'Invalid category', validCategories: Object.keys(POST_CATEGORIES) },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 1: Real-time research via Perplexity
    // ============================================
    let realTimeContext = '';
    let citations: string[] = [];
    let usedRealTimeData = false;

    const perplexity = getPerplexityClient();
    
    if (useRealTimeData && perplexity.isConfigured()) {
      console.log(`[SportBot Agent] Researching ${matchContext.homeTeam} vs ${matchContext.awayTeam}...`);
      
      try {
        // Quick research for the match
        const research = await quickMatchResearch(
          matchContext.homeTeam,
          matchContext.awayTeam,
          matchContext.league
        );

        if (research.success && research.content) {
          realTimeContext = `\n\n[LIVE INTELLIGENCE - ${new Date().toISOString()}]\n${research.content}`;
          citations = research.citations;
          usedRealTimeData = true;
          console.log(`[SportBot Agent] Got ${citations.length} citations from live research`);
        } else {
          console.log('[SportBot Agent] No live data available, proceeding without');
        }
      } catch (researchError) {
        console.warn('[SportBot Agent] Research failed, continuing without:', researchError);
      }
    }

    // ============================================
    // STEP 2: Build context with real-time data
    // ============================================
    const contextString = `
Match: ${matchContext.homeTeam} vs ${matchContext.awayTeam}
League: ${matchContext.league}
Sport: ${matchContext.sport}
${matchContext.kickoff ? `Kickoff: ${matchContext.kickoff}` : ''}
${matchContext.odds ? `Odds: Home ${matchContext.odds.home} | Draw ${matchContext.odds.draw} | Away ${matchContext.odds.away}` : ''}
${trigger ? `Trigger: ${trigger}` : ''}
${realTimeContext}
    `.trim();

    // Calculate conviction level based on data quality
    const convictionLevel = usedRealTimeData ? 4 : 3; // Higher conviction with real data

    // Build prompt with conviction scoring
    const prompt = buildAgentPostPrompt(category, contextString, additionalContext, {
      conviction: convictionLevel as 1 | 2 | 3 | 4 | 5,
      includeOpener: category === 'AI_INSIGHT' || category === 'VOLATILITY_ALERT',
      forceContrarian: category === 'FORM_ANALYSIS' && Math.random() > 0.7, // 30% chance contrarian
    });

    // ============================================
    // STEP 3: Generate post via OpenAI
    // ============================================
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 180, // Slightly more for real-time data posts
      temperature: 0.8, // Slightly creative for personality
    });

    const generatedContent = completion.choices[0]?.message?.content?.trim() || '';

    // Safety check
    const safetyResult = sanitizeAgentPost(generatedContent);
    
    if (!safetyResult.safe) {
      console.warn('Agent post flagged for prohibited terms:', safetyResult.flaggedTerms);
      return NextResponse.json(
        { error: 'Generated content failed safety check', flaggedTerms: safetyResult.flaggedTerms },
        { status: 422 }
      );
    }

    // Build response
    const categoryConfig = POST_CATEGORIES[category];
    const post: AgentPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      categoryName: categoryConfig.name,
      categoryIcon: categoryConfig.icon,
      content: safetyResult.post,
      matchRef: `${matchContext.homeTeam} vs ${matchContext.awayTeam}`,
      sport: matchContext.sport,
      league: matchContext.league,
      timestamp: new Date().toISOString(),
      confidence: determineConfidence(category, additionalContext, usedRealTimeData),
      realTimeData: usedRealTimeData,
      citations: citations.length > 0 ? citations.slice(0, 3) : undefined, // Max 3 citations
    };

    return NextResponse.json({ success: true, post });

  } catch (error) {
    console.error('Agent post generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate agent post' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Get Feed Posts
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  const limit = parseInt(searchParams.get('limit') || '10');
  const action = searchParams.get('action'); // 'research' for live research mode

  // Check if this is a research request
  if (action === 'research') {
    return handleResearchRequest(searchParams);
  }

  // Check Perplexity status
  const perplexity = getPerplexityClient();
  const perplexityEnabled = perplexity.isConfigured();

  // Example posts showing the feed capability
  const examplePosts: AgentPost[] = [
    {
      id: 'post_example_1',
      category: 'MARKET_MOVEMENT',
      categoryName: 'Market Movement',
      categoryIcon: '📊',
      content: 'Sharp movement detected on the early Premier League fixture. Market uncertainty elevated after late team news.',
      matchRef: 'Chelsea vs Everton',
      sport: 'Soccer',
      league: 'Premier League',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      confidence: 'MEDIUM',
    },
    {
      id: 'post_example_2',
      category: 'MOMENTUM_SHIFT',
      categoryName: 'Momentum & Form',
      categoryIcon: '📈',
      content: 'Three consecutive wins have flipped sentiment. The question is whether the underlying metrics support the hype. Spoiler: barely.',
      matchRef: 'Brentford vs Newcastle',
      sport: 'Soccer',
      league: 'Premier League',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      confidence: 'HIGH',
    },
    {
      id: 'post_example_3',
      category: 'MATCH_COMPLEXITY',
      categoryName: 'Match Complexity',
      categoryIcon: '🎯',
      content: 'High-complexity alert. Both sides showing inconsistent form, similar power ratings, and a history of chaotic encounters. Predictability? Not today.',
      matchRef: 'Crystal Palace vs Brighton',
      sport: 'Soccer',
      league: 'Premier League',
      timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
      confidence: 'LOW',
    },
    {
      id: 'post_example_4',
      category: 'LINEUP_INTEL',
      categoryName: 'Lineup Intelligence',
      categoryIcon: '📋',
      content: 'Key midfielder confirmed out. Model volatility adjusted upward. Classic mid-week rotation chaos.',
      matchRef: 'Man City vs Man United',
      sport: 'Soccer',
      league: 'Premier League',
      timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
      confidence: 'HIGH',
    },
    {
      id: 'post_example_5',
      category: 'AI_INSIGHT',
      categoryName: 'AI Insight',
      categoryIcon: '🧠',
      content: 'Interesting pattern: late-season fixtures in this matchup have historically produced 40% more goals than the league average. Make of that what you will.',
      matchRef: 'Liverpool vs Tottenham',
      sport: 'Soccer',
      league: 'Premier League',
      timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
      confidence: 'MEDIUM',
    },
  ];

  // Filter by sport if provided
  const filteredPosts = sport 
    ? examplePosts.filter(p => p.sport.toLowerCase() === sport.toLowerCase())
    : examplePosts;

  return NextResponse.json({
    success: true,
    posts: filteredPosts.slice(0, limit),
    meta: {
      total: filteredPosts.length,
      limit,
      sport: sport || 'all',
      realTimeEnabled: perplexityEnabled,
    },
  });
}

// ============================================
// RESEARCH HANDLER - Live data lookup
// ============================================

async function handleResearchRequest(searchParams: URLSearchParams) {
  const homeTeam = searchParams.get('home');
  const awayTeam = searchParams.get('away');
  const league = searchParams.get('league') || undefined;

  if (!homeTeam || !awayTeam) {
    return NextResponse.json(
      { error: 'Missing required params: home, away' },
      { status: 400 }
    );
  }

  const perplexity = getPerplexityClient();
  
  if (!perplexity.isConfigured()) {
    return NextResponse.json({
      success: false,
      error: 'Real-time research not configured',
      hint: 'Add PERPLEXITY_API_KEY to environment variables',
    }, { status: 503 });
  }

  try {
    const research = await quickMatchResearch(homeTeam, awayTeam, league);
    
    return NextResponse.json({
      success: research.success,
      match: `${homeTeam} vs ${awayTeam}`,
      league: league || 'Unknown',
      research: {
        content: research.content,
        citations: research.citations,
        searchQuery: research.searchQuery,
        timestamp: research.timestamp,
      },
      error: research.error,
    });

  } catch (error) {
    console.error('Research request failed:', error);
    return NextResponse.json(
      { error: 'Research failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// ============================================
// HELPERS
// ============================================

function determineConfidence(category: PostCategory, context?: string, hasRealTimeData?: boolean): 'LOW' | 'MEDIUM' | 'HIGH' {
  // Real-time data boosts confidence
  if (hasRealTimeData) {
    const highConfidenceCategories: PostCategory[] = ['LINEUP_INTEL', 'POST_MATCH', 'MARKET_MOVEMENT'];
    if (highConfidenceCategories.includes(category)) return 'HIGH';
    return 'MEDIUM'; // At least medium if we have real data
  }
  
  // Higher confidence for certain categories
  const highConfidenceCategories: PostCategory[] = ['LINEUP_INTEL', 'POST_MATCH'];
  const lowConfidenceCategories: PostCategory[] = ['MATCH_COMPLEXITY', 'VOLATILITY_ALERT'];
  
  if (highConfidenceCategories.includes(category)) return 'HIGH';
  if (lowConfidenceCategories.includes(category)) return 'LOW';
  
  // Check context for uncertainty signals
  if (context?.toLowerCase().includes('uncertain') || context?.toLowerCase().includes('volatile')) {
    return 'LOW';
  }
  
  return 'MEDIUM';
}
