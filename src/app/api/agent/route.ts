/**
 * SportBot Agent Posts API
 * 
 * Generates AIXBT-style sports intelligence posts with REAL-TIME DATA.
 * Uses Unified Match Service for consistent data across all components.
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
  buildAgentPostPromptWithAnalysis, 
  sanitizeAgentPost,
  type PostCategory,
  type ComputedAnalysis,
} from '@/lib/config/sportBotAgent';
import { 
  getPerplexityClient, 
  quickMatchResearch,
  type SearchCategory,
  type ResearchResult 
} from '@/lib/perplexity';
import { runQuickAnalysis, type MinimalMatchData } from '@/lib/accuracy-core/live-intel-adapter';
import { 
  getQuickAnalysis,
  type MatchIdentifier,
  type OddsInfo,
} from '@/lib/unified-match-service';
import { prisma } from '@/lib/prisma';

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
    // STEP 1: Get analysis via Unified Match Service
    // ============================================
    const matchIdentifier: MatchIdentifier = {
      homeTeam: matchContext.homeTeam,
      awayTeam: matchContext.awayTeam,
      sport: matchContext.sport,
      league: matchContext.league,
      kickoff: matchContext.kickoff,
    };
    
    const odds: OddsInfo | undefined = matchContext.odds ? {
      home: matchContext.odds.home || 2.0,
      away: matchContext.odds.away || 2.0,
      draw: matchContext.odds.draw,
    } : undefined;
    
    // Try unified service first for consistent data
    const unifiedAnalysis = odds ? await getQuickAnalysis(matchIdentifier, odds) : null;
    
    // PRIORITY 2: Try Prediction table for pipeline-computed probabilities
    // This ensures agent posts use the same Poisson/Elo data as daily-picks and chat
    let dbPrediction: { homeWin: number; awayWin: number; draw: number | null; edgeValue: number | null; conviction: number | null } | null = null;
    if (!unifiedAnalysis) {
      try {
        const homeKeyword = matchContext.homeTeam.split(' ')[0];
        const awayKeyword = matchContext.awayTeam.split(' ')[0];
        
        const prediction = await prisma.prediction.findFirst({
          where: {
            AND: [
              { matchName: { contains: homeKeyword, mode: 'insensitive' } },
              { matchName: { contains: awayKeyword, mode: 'insensitive' } },
            ],
            kickoff: { gte: new Date(new Date().getTime() - 48 * 60 * 60 * 1000) },
            homeWin: { not: null },
            awayWin: { not: null },
          },
          select: { homeWin: true, awayWin: true, draw: true, edgeValue: true, conviction: true },
          orderBy: { kickoff: 'asc' },
        });
        
        if (prediction?.homeWin && prediction?.awayWin) {
          dbPrediction = prediction as { homeWin: number; awayWin: number; draw: number | null; edgeValue: number | null; conviction: number | null };
          console.log(`[SportBot Agent] Using Prediction table data: H=${dbPrediction.homeWin}% A=${dbPrediction.awayWin}% edge=${dbPrediction.edgeValue}%`);
        }
      } catch (dbError) {
        console.warn('[SportBot Agent] Prediction table lookup failed:', dbError);
      }
    }
    
    // Fallback to quick analysis (vig-only) if no better source available
    // Convert odds to match MinimalMatchData interface (draw can't be null)
    const safeOdds = odds ? {
      home: odds.home,
      away: odds.away,
      draw: odds.draw ?? undefined,
    } : undefined;
    
    const analysisInput: MinimalMatchData = {
      homeTeam: matchContext.homeTeam,
      awayTeam: matchContext.awayTeam,
      league: matchContext.league,
      sport: matchContext.sport,
      kickoff: matchContext.kickoff,
      odds: safeOdds,
    };
    
    const quickAnalysis = runQuickAnalysis(analysisInput);
    console.log(`[SportBot Agent] Analysis: ${quickAnalysis.narrativeAngle}, favored: ${quickAnalysis.favored}`);
    
    // Merge probabilities: unified > DB prediction > quick analysis (vig-only)
    const mergedProbabilities = unifiedAnalysis ? {
      home: unifiedAnalysis.probabilities.home,
      away: unifiedAnalysis.probabilities.away,
      draw: unifiedAnalysis.probabilities.draw || quickAnalysis.probabilities.draw,
    } : dbPrediction ? {
      home: dbPrediction.homeWin,
      away: dbPrediction.awayWin,
      draw: dbPrediction.draw || quickAnalysis.probabilities.draw,
    } : quickAnalysis.probabilities;
    
    // ============================================
    // STEP 2: Real-time research via Perplexity
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
    // STEP 3: Build computed analysis for Data-3 layer
    // ============================================
    // Convert unified service numeric confidence to string format
    const unifiedConfidenceStr: 'high' | 'medium' | 'low' | undefined = 
      unifiedAnalysis?.confidence !== undefined
        ? (unifiedAnalysis.confidence >= 0.7 ? 'high' : unifiedAnalysis.confidence >= 0.4 ? 'medium' : 'low')
        : undefined;
    
    // DB prediction confidence from conviction score (1-10)
    const dbConfidenceStr: 'high' | 'medium' | 'low' | undefined = 
      dbPrediction?.conviction !== undefined && dbPrediction.conviction !== null
        ? (dbPrediction.conviction >= 7 ? 'high' : dbPrediction.conviction >= 4 ? 'medium' : 'low')
        : undefined;
    
    const computedAnalysis: ComputedAnalysis = {
      probabilities: mergedProbabilities,
      favored: unifiedAnalysis?.favored || quickAnalysis.favored,
      confidence: unifiedConfidenceStr || dbConfidenceStr || quickAnalysis.confidence,
      dataQuality: unifiedAnalysis?.dataQuality || (dbPrediction ? 'MEDIUM' : quickAnalysis.dataQuality),
      volatility: quickAnalysis.volatility,
      narrativeAngle: unifiedAnalysis?.narrativeAngle || quickAnalysis.narrativeAngle,
      catchphrase: quickAnalysis.catchphrase,
      motif: quickAnalysis.motif,
    };
    
    // Build context with real-time data
    const contextString = `
Match: ${matchContext.homeTeam} vs ${matchContext.awayTeam}
League: ${matchContext.league}
Sport: ${matchContext.sport}
${matchContext.kickoff ? `Kickoff: ${matchContext.kickoff}` : ''}
${trigger ? `Trigger: ${trigger}` : ''}
${realTimeContext}
    `.trim();

    // Build prompt with accuracy-core computed analysis
    const prompt = buildAgentPostPromptWithAnalysis(
      category,
      contextString,
      computedAnalysis,
      matchContext.homeTeam,
      matchContext.awayTeam,
      additionalContext
    );

    // ============================================
    // STEP 4: Generate post via OpenAI (Data-3 layer)
    // ============================================
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 180,
      temperature: 0.7, // Slightly creative for AIXBT personality
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

    // Build response with pipeline-derived confidence
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
      confidence: mapPipelineConfidence(quickAnalysis.confidence, usedRealTimeData),
      realTimeData: usedRealTimeData,
      citations: citations.length > 0 ? citations.slice(0, 3) : undefined,
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
// GET - Get Feed Posts from Database
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

  try {
    // Import prisma for database access
    const { prisma } = await import('@/lib/prisma');
    
    // Build query filters
    const where: { sport?: string } = {};
    if (sport) {
      where.sport = sport;
    }
    
    // Fetch real posts from database
    const dbPosts = await prisma.agentPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    // Map database posts to API response format
    const posts: AgentPost[] = dbPosts.map(post => {
      const categoryInfo = POST_CATEGORIES[post.category as PostCategory] || POST_CATEGORIES.AI_INSIGHT;
      return {
        id: post.id,
        category: post.category as PostCategory,
        categoryName: categoryInfo.name,
        categoryIcon: categoryInfo.icon,
        content: post.content,
        matchRef: post.matchRef || `${post.homeTeam || 'Team A'} vs ${post.awayTeam || 'Team B'}`,
        sport: post.sport || 'Soccer',
        league: post.league || 'Unknown League',
        timestamp: post.createdAt.toISOString(),
        confidence: post.confidence && post.confidence >= 7 ? 'HIGH' : 
                   post.confidence && post.confidence >= 4 ? 'MEDIUM' : 'LOW',
        realTimeData: post.realTimeData || false,
        citations: post.citations as string[] || [],
      };
    });
    
    // If no posts exist yet, return empty array (no more fake posts)
    return NextResponse.json({
      success: true,
      posts,
      meta: {
        total: posts.length,
        limit,
        sport: sport || 'all',
        realTimeEnabled: perplexityEnabled,
        source: 'database',
      },
    });
    
  } catch (error) {
    console.error('[Agent API] Error fetching posts:', error);
    
    // Return empty posts on error instead of fake data
    return NextResponse.json({
      success: true,
      posts: [],
      meta: {
        total: 0,
        limit,
        sport: sport || 'all',
        realTimeEnabled: perplexityEnabled,
        error: 'Database unavailable',
      },
    });
  }
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

/**
 * Map pipeline confidence to API confidence level
 * Uses accuracy-core derived confidence with real-time data boost
 */
function mapPipelineConfidence(
  pipelineConfidence: 'high' | 'medium' | 'low',
  hasRealTimeData: boolean
): 'LOW' | 'MEDIUM' | 'HIGH' {
  // Real-time data can boost confidence by one level
  if (hasRealTimeData) {
    if (pipelineConfidence === 'low') return 'MEDIUM';
    return 'HIGH'; // medium or high with real data → HIGH
  }
  
  // Map pipeline confidence directly
  return pipelineConfidence.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH';
}

// Legacy function kept for backward compatibility
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
