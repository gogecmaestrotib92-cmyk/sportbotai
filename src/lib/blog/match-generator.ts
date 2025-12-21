// Match Blog Generator
// Creates pre-match preview and post-match recap blog posts for upcoming matches

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { researchTopic } from './research';
import { put } from '@vercel/blob';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use gpt-4.1-nano for faster and cheaper generation
const AI_MODEL = 'gpt-4.1-nano';

// ============================================
// TYPES
// ============================================

export interface MatchInfo {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  sportKey: string;
  league: string;
  commenceTime: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  leagueLogo?: string;
  odds?: {
    home: number;
    draw?: number | null;
    away: number;
  };
}

export interface MatchPreviewResult {
  success: boolean;
  postId?: string;
  slug?: string;
  error?: string;
  cost?: number;
  duration?: number;
}

export interface MatchRecapResult {
  success: boolean;
  postId?: string;
  error?: string;
  updated?: boolean;
}

interface SEOKeywords {
  primary: string;
  secondary: string[];
  longTail: string[];
}

interface GeneratedMatchContent {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  tags: string[];
  category: string;
}

// ============================================
// FEATURED IMAGE GENERATION (Team Logos)
// ============================================

async function generateMatchFeaturedImage(
  match: MatchInfo,
  title: string
): Promise<{ url: string; alt: string }> {
  // If we have team logos, create a composite image using canvas-style approach
  // For now, we'll use a smart placeholder with team names that looks professional
  
  const homeLogoUrl = match.homeTeamLogo || '';
  const awayLogoUrl = match.awayTeamLogo || '';
  const leagueLogoUrl = match.leagueLogo || '';
  
  // Create an OG-style image URL with team info
  // This uses a dynamic image generation service pattern
  const matchDate = new Date(match.commenceTime);
  const dateStr = matchDate.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  });
  
  // If we have logos, upload a generated HTML image to blob storage
  if (homeLogoUrl && awayLogoUrl) {
    try {
      // Generate SVG-based image with team logos
      const svgContent = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0f172a"/>
              <stop offset="50%" style="stop-color:#1e293b"/>
              <stop offset="100%" style="stop-color:#0f172a"/>
            </linearGradient>
            <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#10b981"/>
              <stop offset="100%" style="stop-color:#059669"/>
            </linearGradient>
          </defs>
          
          <!-- Background -->
          <rect width="1200" height="630" fill="url(#bg)"/>
          
          <!-- Accent line -->
          <rect x="0" y="610" width="1200" height="20" fill="url(#accent)"/>
          
          <!-- League badge at top -->
          <text x="600" y="80" text-anchor="middle" fill="#94a3b8" font-family="system-ui" font-size="24" font-weight="500">${match.league}</text>
          
          <!-- VS Section -->
          <text x="600" y="340" text-anchor="middle" fill="#475569" font-family="system-ui" font-size="48" font-weight="bold">VS</text>
          
          <!-- Home Team -->
          <text x="250" y="280" text-anchor="middle" fill="#ffffff" font-family="system-ui" font-size="36" font-weight="bold">${match.homeTeam.substring(0, 15)}</text>
          <text x="250" y="320" text-anchor="middle" fill="#10b981" font-family="system-ui" font-size="20">HOME</text>
          
          <!-- Away Team -->
          <text x="950" y="280" text-anchor="middle" fill="#ffffff" font-family="system-ui" font-size="36" font-weight="bold">${match.awayTeam.substring(0, 15)}</text>
          <text x="950" y="320" text-anchor="middle" fill="#ef4444" font-family="system-ui" font-size="20">AWAY</text>
          
          <!-- Match Date -->
          <text x="600" y="450" text-anchor="middle" fill="#64748b" font-family="system-ui" font-size="28">${dateStr}</text>
          
          <!-- SportBot AI Branding -->
          <text x="600" y="550" text-anchor="middle" fill="#10b981" font-family="system-ui" font-size="22" font-weight="600">SportBot AI Analysis</text>
          <text x="600" y="580" text-anchor="middle" fill="#475569" font-family="system-ui" font-size="16">AI-Powered Match Preview</text>
        </svg>
      `;
      
      // Upload SVG to blob storage
      const blob = await put(
        `blog/match-previews/${match.matchId}.svg`,
        svgContent,
        {
          access: 'public',
          contentType: 'image/svg+xml',
        }
      );
      
      return {
        url: blob.url,
        alt: `${match.homeTeam} vs ${match.awayTeam} - ${match.league} Match Preview`,
      };
    } catch (error) {
      console.warn('[Match Image] SVG generation failed:', error);
    }
  }
  
  // Fallback: Use a placeholder with match info
  const placeholderText = encodeURIComponent(`${match.homeTeam} vs ${match.awayTeam}`);
  const placeholderSubtext = encodeURIComponent(`${match.league} | ${dateStr}`);
  
  return {
    url: `https://placehold.co/1200x630/1e293b/10b981?text=${placeholderText}%0A${placeholderSubtext}`,
    alt: `${match.homeTeam} vs ${match.awayTeam} - Match Preview`,
  };
}

// ============================================
// SEO KEYWORD GENERATION
// ============================================

async function generateSEOKeywords(match: MatchInfo): Promise<SEOKeywords> {
  const matchDate = new Date(match.commenceTime);
  const dateStr = matchDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  const prompt = `Generate SEO keywords for a sports match preview article.

MATCH DETAILS:
- ${match.homeTeam} vs ${match.awayTeam}
- Sport: ${match.sport}
- League: ${match.league}
- Date: ${dateStr}

Generate keywords that sports fans would search for when looking for match previews, predictions, and analysis.

Return JSON:
{
  "primary": "main focus keyword (e.g., 'Team A vs Team B prediction')",
  "secondary": ["3-5 secondary keywords"],
  "longTail": ["3-5 long-tail keywords for better ranking"]
}

Focus on:
- Match preview keywords
- Prediction/analysis keywords  
- Team-specific search terms
- League-specific terms
- Date-specific terms (if applicable)`;

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No keywords generated');
    
    return JSON.parse(content) as SEOKeywords;
  } catch (error) {
    // Fallback keywords
    return {
      primary: `${match.homeTeam} vs ${match.awayTeam} prediction`,
      secondary: [
        `${match.homeTeam} ${match.awayTeam} preview`,
        `${match.league} match analysis`,
        `${match.sport} predictions`,
      ],
      longTail: [
        `${match.homeTeam} vs ${match.awayTeam} betting tips`,
        `${match.league} ${match.homeTeam} form analysis`,
      ],
    };
  }
}

// ============================================
// MATCH RESEARCH (Team Form, H2H, etc.)
// ============================================

interface MatchResearch {
  homeTeamInfo: string[];
  awayTeamInfo: string[];
  headToHead: string[];
  recentNews: string[];
  keyPlayers: string[];
  predictions: string[];
}

interface MatchAnalysisData {
  probabilities: {
    homeWin: number;
    draw: number | null;
    awayWin: number;
  };
  recommendation: string;
  confidenceLevel: string;
  keyFactors: string[];
  riskLevel: string;
  valueAssessment: string;
  homeForm: { wins: number; draws: number; losses: number; trend: string };
  awayForm: { wins: number; draws: number; losses: number; trend: string };
  headToHead: { homeWins: number; draws: number; awayWins: number; summary: string };
  injuries: { home: string[]; away: string[] };
  narrative: string;
  marketInsights: string[];
}

async function fetchMatchAnalysis(match: MatchInfo): Promise<MatchAnalysisData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Build analyze request
    const analyzePayload = {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      sport: match.sport,
      sportKey: match.sportKey,
      league: match.league,
      matchDate: match.commenceTime,
      oddsHome: match.odds?.home || 0,
      oddsDraw: match.odds?.draw || null,
      oddsAway: match.odds?.away || 0,
      // Skip auth for internal calls (blog generator runs as system)
    };

    console.log(`[Match Analysis] Fetching analysis for ${match.homeTeam} vs ${match.awayTeam}`);
    
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use internal API key for blog generator
        'X-Internal-Key': process.env.CRON_SECRET || '',
      },
      body: JSON.stringify(analyzePayload),
    });

    if (!response.ok) {
      console.warn(`[Match Analysis] API returned ${response.status}, falling back to basic research`);
      return null;
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      console.warn('[Match Analysis] No analysis data returned');
      return null;
    }

    const analysis = data.data;
    
    // Extract structured data from analysis response
    return {
      probabilities: {
        homeWin: analysis.probabilityEstimates?.homeWin || 0,
        draw: analysis.probabilityEstimates?.draw ?? null,
        awayWin: analysis.probabilityEstimates?.awayWin || 0,
      },
      recommendation: analysis.recommendation || '',
      confidenceLevel: analysis.meta?.confidenceLevel || 'MEDIUM',
      keyFactors: analysis.keyFactors?.map((f: { factor: string; impact: string }) => 
        `${f.factor}: ${f.impact}`
      ) || [],
      riskLevel: analysis.riskAssessment?.level || 'MEDIUM',
      valueAssessment: analysis.valueAssessment?.summary || '',
      homeForm: {
        wins: analysis.homeTeamForm?.wins || 0,
        draws: analysis.homeTeamForm?.draws || 0,
        losses: analysis.homeTeamForm?.losses || 0,
        trend: analysis.homeTeamForm?.trend || 'stable',
      },
      awayForm: {
        wins: analysis.awayTeamForm?.wins || 0,
        draws: analysis.awayTeamForm?.draws || 0,
        losses: analysis.awayTeamForm?.losses || 0,
        trend: analysis.awayTeamForm?.trend || 'stable',
      },
      headToHead: {
        homeWins: analysis.headToHead?.homeWins || 0,
        draws: analysis.headToHead?.draws || 0,
        awayWins: analysis.headToHead?.awayWins || 0,
        summary: analysis.headToHead?.summary || '',
      },
      injuries: {
        home: analysis.injuries?.home?.map((i: { name: string }) => i.name) || [],
        away: analysis.injuries?.away?.map((i: { name: string }) => i.name) || [],
      },
      narrative: analysis.narrative || analysis.summary || '',
      marketInsights: analysis.marketInsights?.map((m: { insight: string }) => m.insight) || [],
    };
  } catch (error) {
    console.error('[Match Analysis] Failed to fetch analysis:', error);
    return null;
  }
}

async function researchMatch(match: MatchInfo): Promise<MatchResearch> {
  const searchQuery = `${match.homeTeam} vs ${match.awayTeam} ${match.league} match preview analysis recent form head to head injuries team news`;
  
  try {
    const research = await researchTopic(searchQuery);
    
    // Parse research into structured data
    return {
      homeTeamInfo: research.facts.filter(f => 
        f.toLowerCase().includes(match.homeTeam.toLowerCase())
      ).slice(0, 3),
      awayTeamInfo: research.facts.filter(f => 
        f.toLowerCase().includes(match.awayTeam.toLowerCase())
      ).slice(0, 3),
      headToHead: research.statistics.slice(0, 3),
      recentNews: research.recentNews.slice(0, 3),
      keyPlayers: research.facts.filter(f => 
        f.toLowerCase().includes('player') || 
        f.toLowerCase().includes('scorer') ||
        f.toLowerCase().includes('injury')
      ).slice(0, 4),
      predictions: research.facts.filter(f =>
        f.toLowerCase().includes('predict') ||
        f.toLowerCase().includes('expect') ||
        f.toLowerCase().includes('likely')
      ).slice(0, 3),
    };
  } catch (error) {
    console.warn('[Match Research] Perplexity research failed, using minimal data');
    return {
      homeTeamInfo: [],
      awayTeamInfo: [],
      headToHead: [],
      recentNews: [],
      keyPlayers: [],
      predictions: [],
    };
  }
}

// ============================================
// GENERATE PRE-MATCH PREVIEW CONTENT
// ============================================

async function generatePreviewContent(
  match: MatchInfo,
  keywords: SEOKeywords,
  research: MatchResearch,
  analysis: MatchAnalysisData | null
): Promise<GeneratedMatchContent> {
  const matchDate = new Date(match.commenceTime);
  const dateStr = matchDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const timeStr = matchDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Get existing blog posts for internal linking
  const existingPosts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, title: true },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  const internalLinksInfo = existingPosts.length > 0
    ? `\n\nEXISTING BLOG POSTS FOR INTERNAL LINKING (use 2-3 relevant ones):
${existingPosts.map(p => `- "/blog/${p.slug}" - ${p.title}`).join('\n')}`
    : '';

  const oddsSection = match.odds ? `
BETTING ODDS (for context, DO NOT give betting advice):
- ${match.homeTeam} to win: ${match.odds.home}
${match.odds.draw ? `- Draw: ${match.odds.draw}` : ''}
- ${match.awayTeam} to win: ${match.odds.away}
` : '';

  // Build rich analysis section if we have AI analysis data
  const analysisSection = analysis ? `
=== SPORTBOT AI ANALYSIS DATA (USE THIS!) ===

PROBABILITY ESTIMATES (from our AI model):
- ${match.homeTeam} Win: ${(analysis.probabilities.homeWin * 100).toFixed(1)}%
${analysis.probabilities.draw !== null ? `- Draw: ${(analysis.probabilities.draw * 100).toFixed(1)}%` : ''}
- ${match.awayTeam} Win: ${(analysis.probabilities.awayWin * 100).toFixed(1)}%

CONFIDENCE LEVEL: ${analysis.confidenceLevel}
RISK ASSESSMENT: ${analysis.riskLevel}

KEY FACTORS IDENTIFIED:
${analysis.keyFactors.map(f => `• ${f}`).join('\n')}

VALUE ASSESSMENT: ${analysis.valueAssessment}

${match.homeTeam.toUpperCase()} FORM (Last 5):
- Record: ${analysis.homeForm.wins}W ${analysis.homeForm.draws}D ${analysis.homeForm.losses}L
- Trend: ${analysis.homeForm.trend}

${match.awayTeam.toUpperCase()} FORM (Last 5):
- Record: ${analysis.awayForm.wins}W ${analysis.awayForm.draws}D ${analysis.awayForm.losses}L  
- Trend: ${analysis.awayForm.trend}

HEAD TO HEAD RECORD:
- ${match.homeTeam} Wins: ${analysis.headToHead.homeWins}
- Draws: ${analysis.headToHead.draws}
- ${match.awayTeam} Wins: ${analysis.headToHead.awayWins}
- Summary: ${analysis.headToHead.summary}

INJURY CONCERNS:
- ${match.homeTeam}: ${analysis.injuries.home.length > 0 ? analysis.injuries.home.join(', ') : 'No major injuries reported'}
- ${match.awayTeam}: ${analysis.injuries.away.length > 0 ? analysis.injuries.away.join(', ') : 'No major injuries reported'}

AI NARRATIVE: ${analysis.narrative}

MARKET INSIGHTS:
${analysis.marketInsights.map(m => `• ${m}`).join('\n')}
` : '';

  const prompt = `Write a comprehensive match preview blog post for SportBot AI.

MATCH DETAILS:
- ${match.homeTeam} vs ${match.awayTeam}
- Sport: ${match.sport}
- League: ${match.league}
- Date: ${dateStr}
- Time: ${timeStr}
${oddsSection}
${analysisSection}

SEO KEYWORDS TO INCLUDE NATURALLY (IMPORTANT FOR RANKING):
Primary: "${keywords.primary}" (use in title, first paragraph, and 3-4 times throughout)
Secondary: ${keywords.secondary.join(', ')} (use each 1-2 times)
Long-tail: ${keywords.longTail.join(', ')} (use naturally where relevant)

RESEARCH DATA:
Home Team Info: ${JSON.stringify(research.homeTeamInfo)}
Away Team Info: ${JSON.stringify(research.awayTeamInfo)}
Head to Head: ${JSON.stringify(research.headToHead)}
Recent News: ${JSON.stringify(research.recentNews)}
Key Players: ${JSON.stringify(research.keyPlayers)}
${internalLinksInfo}

REQUIREMENTS:
1. SEO-optimized title including team names AND the word "prediction" or "preview" (50-60 chars)
2. Engaging intro paragraph with match context, include primary keyword
3. Sections to include (use H2 headings):
   - Match Overview (when, where, stakes)
   - ${match.homeTeam} Form Analysis (use form data above if available)
   - ${match.awayTeam} Form Analysis (use form data above if available)
   - Head-to-Head Record (use H2H data above if available)
   - Key Players to Watch (use injury data above if available)
   - Tactical Analysis
   - SportBot AI Prediction (use probability data above if available, present as "our AI analysis suggests...")
   - Value Assessment (discuss if odds represent good value based on analysis)
   - Responsible Gambling Notice (MANDATORY - full paragraph about betting responsibly)
4. Target 1800-2200 words for better SEO
5. Use HTML formatting (h2, h3, p, ul, li, strong, em)
6. Include 2-3 internal links to related blog posts naturally within content
7. End with a compelling conclusion summarizing the key points

CRITICAL RULES:
- This is EDUCATIONAL ANALYSIS, not betting tips
- Use phrases like "our AI estimates", "probability suggests", "data indicates", "the numbers show"
- NEVER guarantee outcomes or encourage gambling
- Present probabilities as estimates, not certainties
- Include responsible gambling disclaimer with link to responsible-gambling resources
- Naturally weave in the SEO keywords without keyword stuffing

Return JSON:
{
  "title": "SEO title with team names + prediction/preview (50-60 chars)",
  "slug": "url-friendly-slug-with-keywords",
  "excerpt": "Compelling 150-160 char excerpt including primary keyword",
  "content": "Full HTML content with all sections",
  "metaTitle": "SEO meta title (50-60 chars)",
  "metaDescription": "Meta description (150-160 chars) with primary keyword",
  "focusKeyword": "${keywords.primary}",
  "tags": ["relevant", "tags", "minimum 5"],
  "category": "Match Previews"
}`;

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 4500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content generated');

  return JSON.parse(content) as GeneratedMatchContent;
}

// ============================================
// GENERATE POST-MATCH RECAP CONTENT
// ============================================

async function generateRecapContent(
  match: MatchInfo,
  finalScore: string,
  existingPost: { title: string; content: string } | null
): Promise<string> {
  const prompt = `Write a post-match analysis recap for SportBot AI.

MATCH RESULT:
- ${match.homeTeam} vs ${match.awayTeam}
- Final Score: ${finalScore}
- Sport: ${match.sport}
- League: ${match.league}

${existingPost ? `
ORIGINAL PREVIEW (for context on our pre-match analysis):
Title: ${existingPost.title}
` : ''}

Write a compelling post-match analysis section (500-800 words) covering:
1. Match Summary - What happened
2. Key Moments - Goals, turning points, standout performances
3. Tactical Review - What worked and what didn't
4. Player Ratings Highlights - Who impressed
5. What This Means - League implications, next fixtures
6. Our AI Analysis Review - How accurate was our pre-match analysis

Use HTML formatting (h2, h3, p, ul, strong).
Be factual and analytical, NOT promotional.

Return the HTML content ONLY (no JSON wrapper).`;

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || '';
}

// ============================================
// MAIN: GENERATE MATCH PREVIEW
// ============================================

export async function generateMatchPreview(match: MatchInfo): Promise<MatchPreviewResult> {
  const startTime = Date.now();
  let totalCost = 0;

  try {
    console.log(`[Match Preview] Starting for: ${match.homeTeam} vs ${match.awayTeam}`);

    // Check if post already exists for this match
    const existingPost = await prisma.blogPost.findFirst({
      where: { matchId: match.matchId },
    });

    if (existingPost) {
      return {
        success: false,
        error: `Post already exists for match ${match.matchId}`,
        postId: existingPost.id,
        slug: existingPost.slug,
      };
    }

    // Step 1: Generate SEO keywords
    console.log('[Match Preview] Step 1/6: Generating SEO keywords...');
    const keywords = await generateSEOKeywords(match);
    totalCost += 0.005;

    // Step 2: Research match via Perplexity
    console.log('[Match Preview] Step 2/6: Researching match...');
    const research = await researchMatch(match);
    totalCost += 0.002;

    // Step 3: Fetch AI analysis from /api/analyze
    console.log('[Match Preview] Step 3/6: Fetching AI analysis...');
    const analysis = await fetchMatchAnalysis(match);
    if (analysis) {
      totalCost += 0.02; // Analysis API cost
      console.log('[Match Preview] AI analysis data received successfully');
    } else {
      console.log('[Match Preview] No AI analysis available, using research only');
    }

    // Step 4: Generate content with all data
    console.log('[Match Preview] Step 4/6: Generating content...');
    const content = await generatePreviewContent(match, keywords, research, analysis);
    totalCost += 0.03;

    // Step 5: Generate featured image with team logos
    console.log('[Match Preview] Step 5/6: Generating image...');
    let featuredImage: string;
    let imageAlt: string;
    
    try {
      const imageResult = await generateMatchFeaturedImage(match, content.title);
      featuredImage = imageResult.url;
      imageAlt = imageResult.alt;
    } catch {
      console.warn('[Match Preview] Image generation failed, using placeholder');
      const placeholderText = encodeURIComponent(`${match.homeTeam} vs ${match.awayTeam}`);
      featuredImage = `https://placehold.co/1200x630/1e293b/10b981?text=${placeholderText}`;
      imageAlt = `${match.homeTeam} vs ${match.awayTeam} - Match Preview`;
    }

    // Step 6: Save to database
    console.log('[Match Preview] Step 6/6: Saving to database...');
    
    // Ensure unique slug
    let slug = content.slug;
    const existingSlug = await prisma.blogPost.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        title: content.title,
        slug,
        excerpt: content.excerpt,
        content: content.content,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        focusKeyword: content.focusKeyword,
        featuredImage,
        imageAlt,
        category: content.category,
        tags: content.tags,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        aiModel: `${AI_MODEL} + perplexity-sonar`,
        generationCost: totalCost,
        // Match-specific fields
        matchId: match.matchId,
        matchDate: new Date(match.commenceTime),
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        sport: match.sport,
        league: match.league,
        postType: 'MATCH_PREVIEW',
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[Match Preview] ✅ Complete! Post ID: ${post.id}, Duration: ${duration}ms`);

    return {
      success: true,
      postId: post.id,
      slug: post.slug,
      cost: totalCost,
      duration,
    };

  } catch (error) {
    console.error('[Match Preview] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cost: totalCost,
      duration: Date.now() - startTime,
    };
  }
}

// ============================================
// MAIN: UPDATE WITH POST-MATCH RECAP
// ============================================

export async function updateWithMatchRecap(
  matchId: string,
  finalScore: string,
  matchResult?: {
    homeGoals?: number;
    awayGoals?: number;
    winner?: 'home' | 'away' | 'draw';
  }
): Promise<MatchRecapResult> {
  try {
    console.log(`[Match Recap] Updating match ${matchId} with score: ${finalScore}`);

    // Find existing post
    const existingPost = await prisma.blogPost.findFirst({
      where: { matchId },
    });

    if (!existingPost) {
      return {
        success: false,
        error: `No preview post found for match ${matchId}`,
      };
    }

    // Check if already updated
    if (existingPost.postMatchUpdatedAt) {
      return {
        success: false,
        error: 'Post already has post-match content',
        postId: existingPost.id,
      };
    }

    // Generate recap content
    console.log('[Match Recap] Generating post-match analysis...');
    const recapContent = await generateRecapContent(
      {
        matchId,
        homeTeam: existingPost.homeTeam || 'Home Team',
        awayTeam: existingPost.awayTeam || 'Away Team',
        sport: existingPost.sport || 'Sport',
        sportKey: '',
        league: existingPost.league || 'League',
        commenceTime: existingPost.matchDate?.toISOString() || new Date().toISOString(),
      },
      finalScore,
      { title: existingPost.title, content: existingPost.content }
    );

    // Update post
    const updatedPost = await prisma.blogPost.update({
      where: { id: existingPost.id },
      data: {
        postMatchContent: recapContent,
        postMatchUpdatedAt: new Date(),
        finalScore,
        postType: 'MATCH_COMBINED',
        // Update title to indicate it includes recap
        title: existingPost.title.includes('Result') 
          ? existingPost.title 
          : `${existingPost.title} | Result: ${finalScore}`,
        // Append recap to main content
        content: `${existingPost.content}
        
<hr class="my-12 border-divider" />

<section id="post-match-analysis">
<h2>📊 Post-Match Analysis</h2>
<p class="text-lg text-gray-400 mb-6"><strong>Final Score: ${finalScore}</strong></p>
${recapContent}
</section>`,
      },
    });

    console.log(`[Match Recap] ✅ Updated post ${updatedPost.id}`);

    return {
      success: true,
      postId: updatedPost.id,
      updated: true,
    };

  } catch (error) {
    console.error('[Match Recap] ❌ Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// BATCH: GENERATE PREVIEWS FOR ALL UPCOMING MATCHES
// ============================================

export async function generatePreviewsForUpcomingMatches(
  sportKey?: string,
  limit: number = 10
): Promise<{
  total: number;
  generated: number;
  skipped: number;
  failed: number;
  results: MatchPreviewResult[];
}> {
  const results: MatchPreviewResult[] = [];
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Fetch upcoming matches from our API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = sportKey 
      ? `${baseUrl}/api/match-data?sportKey=${sportKey}`
      : `${baseUrl}/api/match-data?sportKey=soccer_epl`; // Default to EPL

    const response = await fetch(url);
    const data = await response.json();

    if (!data.success || !data.events) {
      throw new Error('Failed to fetch matches');
    }

    const matches = data.events.slice(0, limit);

    for (const match of matches) {
      // Check if post already exists
      const existing = await prisma.blogPost.findFirst({
        where: { matchId: match.matchId },
      });

      if (existing) {
        skipped++;
        results.push({
          success: false,
          error: 'Already exists',
          postId: existing.id,
          slug: existing.slug,
        });
        continue;
      }

      // Generate preview
      const result = await generateMatchPreview({
        matchId: match.matchId,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        sport: match.sport,
        sportKey: match.sportKey,
        league: match.league,
        commenceTime: match.commenceTime,
        odds: match.averageOdds,
      });

      results.push(result);
      if (result.success) {
        generated++;
      } else {
        failed++;
      }

      // Rate limiting - wait between generations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return {
      total: matches.length,
      generated,
      skipped,
      failed,
      results,
    };

  } catch (error) {
    console.error('[Batch Preview] Error:', error);
    return {
      total: 0,
      generated,
      skipped,
      failed: failed + 1,
      results,
    };
  }
}

// ============================================
// GET MATCHES NEEDING RECAP
// ============================================

export async function getMatchesNeedingRecap(): Promise<{
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: Date;
  slug: string;
}[]> {
  const now = new Date();
  
  // Find match previews where:
  // 1. Match date has passed
  // 2. No post-match content yet
  const posts = await prisma.blogPost.findMany({
    where: {
      postType: 'MATCH_PREVIEW',
      matchDate: {
        lt: now,
      },
      postMatchUpdatedAt: null,
    },
    select: {
      id: true,
      matchId: true,
      homeTeam: true,
      awayTeam: true,
      matchDate: true,
      slug: true,
    },
    orderBy: { matchDate: 'desc' },
    take: 50,
  });

  return posts.filter(p => p.matchId && p.matchDate) as {
    id: string;
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    matchDate: Date;
    slug: string;
  }[];
}
