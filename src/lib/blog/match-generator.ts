// Match Blog Generator
// Creates pre-match preview and post-match recap blog posts for upcoming matches

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { getTeamLogo, getLeagueLogo } from '@/lib/logos';
import { getMultiSportEnrichedData } from '@/lib/sports-api';
import { getMatchRostersV2, normalizeSport } from '@/lib/data-layer/bridge';
import type { Sport } from '@/lib/data-layer/types';

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
// PLACEHOLDER REPLACEMENT
// ============================================

/**
 * Replace placeholder values in generated content with actual data
 */
function replacePlaceholders(
  content: string,
  match: MatchInfo,
  analysis: {
    probabilities: { homeWin: number; draw: number | null; awayWin: number };
    homeForm: { wins: number; draws: number; losses: number };
    awayForm: { wins: number; draws: number; losses: number };
    headToHead: { homeWins: number; draws: number; awayWins: number };
  } | null
): string {
  let result = content;
  
  if (analysis) {
    // Replace probability placeholders
    const homeWinPct = (analysis.probabilities.homeWin * 100).toFixed(1);
    const awayWinPct = (analysis.probabilities.awayWin * 100).toFixed(1);
    const drawPct = analysis.probabilities.draw !== null 
      ? (analysis.probabilities.draw * 100).toFixed(1) 
      : 'N/A';
    
    // Replace common placeholder patterns
    result = result
      // [HOME_%]% style
      .replace(/\[HOME_%\]%?/gi, `${homeWinPct}%`)
      .replace(/\[AWAY_%\]%?/gi, `${awayWinPct}%`)
      .replace(/\[DRAW_%\]%?/gi, `${drawPct}%`)
      // [HOME_WINS] style for H2H
      .replace(/\[HOME_WINS\]/gi, String(analysis.headToHead.homeWins))
      .replace(/\[AWAY_WINS\]/gi, String(analysis.headToHead.awayWins))
      .replace(/\[H2H_DRAWS\]/gi, String(analysis.headToHead.draws))
      // Form records
      .replace(/\[HOME_FORM_WINS\]/gi, String(analysis.homeForm.wins))
      .replace(/\[HOME_FORM_DRAWS\]/gi, String(analysis.homeForm.draws))
      .replace(/\[HOME_FORM_LOSSES\]/gi, String(analysis.homeForm.losses))
      .replace(/\[AWAY_FORM_WINS\]/gi, String(analysis.awayForm.wins))
      .replace(/\[AWAY_FORM_DRAWS\]/gi, String(analysis.awayForm.draws))
      .replace(/\[AWAY_FORM_LOSSES\]/gi, String(analysis.awayForm.losses));
  }
  
  // Replace team name placeholders
  result = result
    .replace(/\[HOME_TEAM\]/gi, match.homeTeam)
    .replace(/\[AWAY_TEAM\]/gi, match.awayTeam);
  
  return result;
}

// ============================================
// FEATURED IMAGE GENERATION (Team Logos)
// ============================================

/**
 * Fetch image as base64 data URI for embedding in SVG
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    // Skip data URIs (fallback logos)
    if (url.startsWith('data:')) {
      return url;
    }
    
    const response = await fetch(url, { 
      headers: { 'Accept': 'image/*' },
      signal: AbortSignal.timeout(5000) // 5s timeout
    });
    
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn('[Match Image] Failed to fetch logo:', url, error);
    return null;
  }
}

async function generateMatchFeaturedImage(
  match: MatchInfo,
  title: string
): Promise<{ url: string; alt: string }> {
  const matchDate = new Date(match.commenceTime);
  const dateStr = matchDate.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  });
  
  // Truncate team names for SVG display (max 18 chars)
  const homeTeamDisplay = match.homeTeam.length > 18 
    ? match.homeTeam.substring(0, 16) + '...' 
    : match.homeTeam;
  const awayTeamDisplay = match.awayTeam.length > 18 
    ? match.awayTeam.substring(0, 16) + '...' 
    : match.awayTeam;
  
  // Escape special characters for SVG
  const escapeXml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Get team logo URLs from our logos library
  const homeLogoUrl = getTeamLogo(match.homeTeam, match.sport, match.league);
  const awayLogoUrl = getTeamLogo(match.awayTeam, match.sport, match.league);
  const leagueLogoUrl = getLeagueLogo(match.league, match.sport);
  
  console.log('[Match Image] Fetching logos:', { homeLogoUrl, awayLogoUrl, leagueLogoUrl });

  try {
    // Fetch logos as base64 in parallel (with fallbacks)
    const [homeLogoData, awayLogoData, leagueLogoData] = await Promise.all([
      fetchImageAsBase64(homeLogoUrl),
      fetchImageAsBase64(awayLogoUrl),
      fetchImageAsBase64(leagueLogoUrl),
    ]);
    
    // Build logo elements for SVG
    const homeLogoElement = homeLogoData 
      ? `<image x="200" y="260" width="150" height="150" href="${homeLogoData}" preserveAspectRatio="xMidYMid meet"/>`
      : `<circle cx="275" cy="335" r="60" fill="#334155"/>
         <text x="275" y="350" text-anchor="middle" fill="#10b981" font-family="Arial, sans-serif" font-size="36" font-weight="700">${escapeXml(match.homeTeam.substring(0, 2).toUpperCase())}</text>`;
    
    const awayLogoElement = awayLogoData
      ? `<image x="850" y="260" width="150" height="150" href="${awayLogoData}" preserveAspectRatio="xMidYMid meet"/>`
      : `<circle cx="925" cy="335" r="60" fill="#334155"/>
         <text x="925" y="350" text-anchor="middle" fill="#ef4444" font-family="Arial, sans-serif" font-size="36" font-weight="700">${escapeXml(match.awayTeam.substring(0, 2).toUpperCase())}</text>`;
    
    const leagueLogoElement = leagueLogoData && !leagueLogoData.startsWith('data:image/svg')
      ? `<image x="565" y="35" width="70" height="70" href="${leagueLogoData}" preserveAspectRatio="xMidYMid meet"/>`
      : '';

    // Generate professional SVG-based OG image with team logos
    const svgContent = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
    </filter>
    <clipPath id="logoClip">
      <circle r="60"/>
    </clipPath>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Subtle pattern -->
  <g opacity="0.05">
    <circle cx="100" cy="100" r="200" fill="#10b981"/>
    <circle cx="1100" cy="530" r="200" fill="#10b981"/>
  </g>
  
  <!-- Accent line at bottom -->
  <rect x="0" y="610" width="1200" height="20" fill="url(#accent)"/>
  
  <!-- League badge at top -->
  ${leagueLogoElement || `<rect x="400" y="40" width="400" height="50" rx="25" fill="#1e293b" stroke="#334155" stroke-width="1"/>`}
  <text x="600" y="${leagueLogoElement ? '130' : '73'}" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="18" font-weight="500">${escapeXml(match.league)}</text>
  
  <!-- Home Team Section -->
  <rect x="50" y="170" width="450" height="300" rx="16" fill="#1e293b" filter="url(#shadow)"/>
  <rect x="50" y="170" width="450" height="50" rx="16" fill="#10b981"/>
  <rect x="50" y="204" width="450" height="16" fill="#1e293b"/>
  <text x="275" y="203" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="18" font-weight="600">HOME</text>
  
  <!-- Home Team Logo -->
  ${homeLogoElement}
  
  <!-- Home Team Name -->
  <text x="275" y="450" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="26" font-weight="700">${escapeXml(homeTeamDisplay)}</text>
  
  <!-- VS Circle -->
  <circle cx="600" cy="320" r="55" fill="#334155" stroke="#475569" stroke-width="2"/>
  <text x="600" y="337" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="36" font-weight="700">VS</text>
  
  <!-- Away Team Section -->
  <rect x="700" y="170" width="450" height="300" rx="16" fill="#1e293b" filter="url(#shadow)"/>
  <rect x="700" y="170" width="450" height="50" rx="16" fill="#ef4444"/>
  <rect x="700" y="204" width="450" height="16" fill="#1e293b"/>
  <text x="925" y="203" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="18" font-weight="600">AWAY</text>
  
  <!-- Away Team Logo -->
  ${awayLogoElement}
  
  <!-- Away Team Name -->
  <text x="925" y="450" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="26" font-weight="700">${escapeXml(awayTeamDisplay)}</text>
  
  <!-- Match Date -->
  <rect x="450" y="500" width="300" height="45" rx="22" fill="#334155"/>
  <text x="600" y="530" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="20" font-weight="500">${escapeXml(dateStr)}</text>
  
  <!-- SportBot AI Branding -->
  <text x="600" y="575" text-anchor="middle" fill="#10b981" font-family="Arial, sans-serif" font-size="20" font-weight="600">SportBot AI</text>
  <text x="600" y="598" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="12">AI-Powered Match Preview &amp; Prediction</text>
</svg>`;
    
    // Upload SVG to Vercel Blob storage
    // Note: Twitter/X doesn't support SVG, so blog page falls back to /api/og for social sharing
    const timestamp = Date.now();
    const blob = await put(
      `blog/match-previews/${match.matchId}-${timestamp}.svg`,
      svgContent,
      {
        access: 'public',
        contentType: 'image/svg+xml',
      }
    );
    
    console.log('[Match Image] Generated SVG:', blob.url);
    
    return {
      url: blob.url,
      alt: `${match.homeTeam} vs ${match.awayTeam} - ${match.league} Match Preview`,
    };
  } catch (error) {
    console.warn('[Match Image] Image generation failed:', error);
    
    // Fallback: Use a placeholder with match info
    const placeholderText = encodeURIComponent(`${match.homeTeam} vs ${match.awayTeam}`);
    const placeholderSubtext = encodeURIComponent(`${match.league} | ${dateStr}`);
    
    return {
      url: `https://placehold.co/1200x630/1e293b/10b981?text=${placeholderText}%0A${placeholderSubtext}`,
      alt: `${match.homeTeam} vs ${match.awayTeam} - Match Preview`,
    };
  }
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
  rosterContext?: string | null; // Real-time roster info for NBA/NHL/NFL
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

// Internal API secret for blog generator (server-side only)
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || 'sportbot-internal-blog-generator-2024';

/**
 * Normalize team name for matching (handles variations like "FC St. Pauli" vs "St. Pauli")
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^fc\s+/i, '')
    .replace(/\s+fc$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchMatchAnalysis(match: MatchInfo): Promise<MatchAnalysisData | null> {
  try {
    // First, check if we have a cached prediction from pre-analyze
    // Try by matchId first (exact match)
    let existingPrediction = await prisma.prediction.findFirst({
      where: {
        matchId: match.matchId,
        outcome: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    // If not found by matchId, try by matchName (more stable)
    if (!existingPrediction) {
      const matchName = `${match.homeTeam} vs ${match.awayTeam}`;
      existingPrediction = await prisma.prediction.findFirst({
        where: {
          matchName: matchName,
          outcome: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // Also try with normalized team names for partial matches
      if (!existingPrediction) {
        const homeNorm = normalizeTeamName(match.homeTeam);
        const awayNorm = normalizeTeamName(match.awayTeam);
        
        existingPrediction = await prisma.prediction.findFirst({
          where: {
            outcome: 'PENDING',
            OR: [
              { matchName: { contains: homeNorm, mode: 'insensitive' } },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });
        
        // Verify it's actually the right match (both teams present)
        if (existingPrediction) {
          const predMatchName = existingPrediction.matchName.toLowerCase();
          if (!predMatchName.includes(homeNorm) || !predMatchName.includes(awayNorm)) {
            existingPrediction = null; // False match, ignore
          }
        }
      }
    }

    // Always call the analyze API to get full data (form, H2H, injuries, trends, etc.)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.sportbotai.com');
    
    // Build analyze request using the expected format
    const analyzePayload = {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      sport: match.sport,
      sportKey: match.sportKey,
      league: match.league,
      matchDate: match.commenceTime,
      odds: {
        home: match.odds?.home || 0,
        draw: match.odds?.draw ?? null,
        away: match.odds?.away || 0,
      },
    };

    console.log(`[Match Analysis] Fetching full analysis for ${match.homeTeam} vs ${match.awayTeam}${existingPrediction ? ' (has cached prediction for probabilities)' : ''}`);
    
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use internal API key for blog generator (bypasses auth)
        'X-Internal-Key': INTERNAL_API_SECRET,
      },
      body: JSON.stringify(analyzePayload),
    });

    if (!response.ok) {
      console.warn(`[Match Analysis] API returned ${response.status}, falling back to enriched data only`);
      
      // Fall back to enriched data if API call fails and we have a prediction
      if (existingPrediction) {
        return await fetchEnrichedDataFallback(match, existingPrediction);
      }
      return null;
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      console.warn('[Match Analysis] No analysis data returned');
      if (existingPrediction) {
        return await fetchEnrichedDataFallback(match, existingPrediction);
      }
      return null;
    }

    const analysis = data.data;
    
    // If we have a cached prediction, use its probabilities (they've already been computed)
    let probabilities = {
      homeWin: analysis.probabilityEstimates?.homeWin || 0,
      draw: analysis.probabilityEstimates?.draw ?? null,
      awayWin: analysis.probabilityEstimates?.awayWin || 0,
    };
    
    let recommendation = analysis.recommendation || '';
    let confidenceLevel = analysis.meta?.confidenceLevel || 'MEDIUM';
    
    if (existingPrediction) {
      console.log(`[Match Analysis] Using cached prediction probabilities for ${match.homeTeam} vs ${match.awayTeam}`);
      
      // Parse prediction to determine probabilities from cached prediction
      const isHomeWin = existingPrediction.prediction.includes('Home Win');
      const isAwayWin = existingPrediction.prediction.includes('Away Win');
      const isDraw = existingPrediction.prediction.includes('Draw');
      
      // Calculate estimated probabilities based on conviction
      const baseProb = 33.33;
      const convictionBoost = existingPrediction.conviction * 3;
      
      let homeProb = baseProb;
      let drawProb = baseProb;
      let awayProb = baseProb;
      
      if (isHomeWin) {
        homeProb = Math.min(75, baseProb + convictionBoost);
        drawProb = (100 - homeProb) * 0.35;
        awayProb = 100 - homeProb - drawProb;
      } else if (isAwayWin) {
        awayProb = Math.min(75, baseProb + convictionBoost);
        drawProb = (100 - awayProb) * 0.35;
        homeProb = 100 - awayProb - drawProb;
      } else if (isDraw) {
        drawProb = Math.min(45, baseProb + convictionBoost);
        homeProb = (100 - drawProb) / 2;
        awayProb = (100 - drawProb) / 2;
      }
      
      probabilities = {
        homeWin: homeProb,
        draw: drawProb,
        awayWin: awayProb,
      };
      
      recommendation = existingPrediction.prediction;
      confidenceLevel = existingPrediction.conviction >= 4 ? 'HIGH' : existingPrediction.conviction >= 3 ? 'MEDIUM' : 'LOW';
    }
    
    // Extract structured data from analysis response
    return {
      probabilities,
      recommendation,
      confidenceLevel,
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
      narrative: existingPrediction?.reasoning || analysis.narrative || analysis.summary || '',
      marketInsights: analysis.marketInsights?.map((m: { insight: string }) => m.insight) || [],
    };
  } catch (error) {
    console.error('[Match Analysis] Failed to fetch analysis:', error);
    return null;
  }
}

// Fallback function when API call fails but we have a cached prediction
async function fetchEnrichedDataFallback(match: MatchInfo, prediction: {
  prediction: string;
  conviction: number;
  reasoning: string;
  odds: number | null;
  impliedProb: number | null;
}): Promise<MatchAnalysisData | null> {
  console.log(`[Match Analysis] Using enriched data fallback for ${match.homeTeam} vs ${match.awayTeam}`);
  
  // Fetch enriched data (form + H2H) separately
  let enrichedData = null;
  try {
    enrichedData = await getMultiSportEnrichedData(
      match.homeTeam,
      match.awayTeam,
      match.sport,
      match.league
    );
    console.log(`[Match Analysis] Enriched data fetched: H2H=${enrichedData.headToHead?.length || 0}, homeForm=${enrichedData.homeForm?.length || 0}`);
  } catch (error) {
    console.warn('[Match Analysis] Failed to fetch enriched data:', error);
  }
  
  // Parse prediction to determine probabilities
  const isHomeWin = prediction.prediction.includes('Home Win');
  const isAwayWin = prediction.prediction.includes('Away Win');
  const isDraw = prediction.prediction.includes('Draw');
  
  const baseProb = 33.33;
  const convictionBoost = prediction.conviction * 3;
  
  let homeProb = baseProb;
  let drawProb = baseProb;
  let awayProb = baseProb;
  
  if (isHomeWin) {
    homeProb = Math.min(75, baseProb + convictionBoost);
    drawProb = (100 - homeProb) * 0.35;
    awayProb = 100 - homeProb - drawProb;
  } else if (isAwayWin) {
    awayProb = Math.min(75, baseProb + convictionBoost);
    drawProb = (100 - awayProb) * 0.35;
    homeProb = 100 - awayProb - drawProb;
  } else if (isDraw) {
    drawProb = Math.min(45, baseProb + convictionBoost);
    homeProb = (100 - drawProb) / 2;
    awayProb = (100 - drawProb) / 2;
  }
  
  // Calculate H2H from enriched data if available
  const h2hMatches = enrichedData?.headToHead || [];
  const h2hHomeWins = h2hMatches.filter(m => m.homeScore > m.awayScore).length;
  const h2hAwayWins = h2hMatches.filter(m => m.awayScore > m.homeScore).length;
  const h2hDraws = h2hMatches.filter(m => m.homeScore === m.awayScore).length;
  
  // Extract form from enriched data
  const homeForm = enrichedData?.homeForm || [];
  const awayForm = enrichedData?.awayForm || [];
  
  // Calculate trend from form
  const calculateTrend = (form: typeof homeForm): 'improving' | 'declining' | 'stable' => {
    if (form.length < 3) return 'stable';
    const recentWins = form.slice(0, 3).filter(m => m.result === 'W').length;
    const olderWins = form.slice(3, 6).filter(m => m.result === 'W').length;
    if (recentWins > olderWins) return 'improving';
    if (recentWins < olderWins) return 'declining';
    return 'stable';
  };
  
  return {
    probabilities: {
      homeWin: homeProb,
      draw: drawProb,
      awayWin: awayProb,
    },
    recommendation: prediction.prediction,
    confidenceLevel: prediction.conviction >= 4 ? 'HIGH' : prediction.conviction >= 3 ? 'MEDIUM' : 'LOW',
    keyFactors: [prediction.reasoning],
    riskLevel: prediction.conviction <= 2 ? 'HIGH' : prediction.conviction <= 3 ? 'MEDIUM' : 'LOW',
    valueAssessment: prediction.odds 
      ? `Odds of ${prediction.odds.toFixed(2)} offer potential value based on our analysis.`
      : 'Value assessment pending odds data.',
    homeForm: { 
      wins: homeForm.filter(m => m.result === 'W').length, 
      draws: homeForm.filter(m => m.result === 'D').length, 
      losses: homeForm.filter(m => m.result === 'L').length, 
      trend: calculateTrend(homeForm),
    },
    awayForm: { 
      wins: awayForm.filter(m => m.result === 'W').length, 
      draws: awayForm.filter(m => m.result === 'D').length, 
      losses: awayForm.filter(m => m.result === 'L').length, 
      trend: calculateTrend(awayForm),
    },
    headToHead: { 
      homeWins: h2hHomeWins, 
      draws: h2hDraws, 
      awayWins: h2hAwayWins, 
      summary: h2hMatches.length > 0 
        ? `Last ${h2hMatches.length} meetings: ${h2hHomeWins} home wins, ${h2hDraws} draws, ${h2hAwayWins} away wins`
        : 'No historical data available' 
    },
    injuries: { home: [], away: [] },
    narrative: prediction.reasoning,
    marketInsights: prediction.odds 
      ? [`Current odds: ${prediction.odds.toFixed(2)}`, `Implied probability: ${(prediction.impliedProb || 0).toFixed(1)}%`]
      : [],
  };
}

async function researchMatch(match: MatchInfo): Promise<MatchResearch> {
  // Determine sport type for roster lookup using DataLayer
  const rosterSport: Sport | null = 
    match.sportKey?.includes('basketball') || match.league?.includes('NBA') ? 'basketball'
    : match.sportKey?.includes('hockey') || match.league?.includes('NHL') ? 'hockey'
    : match.sportKey?.includes('americanfootball') || match.league?.includes('NFL') ? 'american_football'
    : null;
  
  // Fetch roster context from DataLayer - this is the ONLY source for player data
  // No more Perplexity dependency - all data comes from DataLayer
  let rosterContext: string | null = null;
  if (rosterSport) {
    try {
      rosterContext = await getMatchRostersV2(match.homeTeam, match.awayTeam, rosterSport);
      if (rosterContext) {
        console.log(`[Match Research] Got roster context from DataLayer for ${match.homeTeam} vs ${match.awayTeam}`);
      }
    } catch (rosterError) {
      console.warn('[Match Research] DataLayer roster lookup failed:', rosterError);
    }
  }
  
  // Return structured data - all other context comes from AI analysis via DataLayer
  // homeTeamInfo, awayTeamInfo, headToHead etc. are populated by fetchMatchAnalysis()
  return {
    homeTeamInfo: [],
    awayTeamInfo: [],
    headToHead: [],
    recentNews: [],
    keyPlayers: [],
    predictions: [],
    rosterContext,
  };
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
${research.rosterContext ? `
=== CURRENT ROSTER INFORMATION (2025-26 SEASON - USE THIS!) ===
${research.rosterContext}

⚠️ CRITICAL: Use ONLY the player names from the roster context above. Do NOT mention players who may have been traded or are no longer on these teams. Your training data may be outdated.
` : ''}${internalLinksInfo}

=== CRITICAL: USE THESE HTML ELEMENTS FOR BETTER FORMATTING ===

1. MATCH INFO BOX (at the start, after intro):
<div class="match-info-box" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #334155;">
  <div class="match-teams" style="display: flex; flex-direction: row; justify-content: space-around; align-items: center; text-align: center; gap: 16px; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 120px;">
      <p style="font-size: 22px; font-weight: bold; color: #fff; margin: 0;">${match.homeTeam}</p>
      <p style="color: #10b981; font-size: 14px; margin: 4px 0 0 0;">HOME</p>
    </div>
    <div style="font-size: 24px; color: #64748b; font-weight: 300;">VS</div>
    <div style="flex: 1; min-width: 120px;">
      <p style="font-size: 22px; font-weight: bold; color: #fff; margin: 0;">${match.awayTeam}</p>
      <p style="color: #ef4444; font-size: 14px; margin: 4px 0 0 0;">AWAY</p>
    </div>
  </div>
  <div class="match-details" style="border-top: 1px solid #334155; margin-top: 16px; padding-top: 16px; display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; text-align: center;">
    <div><p style="color: #94a3b8; font-size: 12px; margin: 0;">📅 Date</p><p style="color: #fff; font-weight: 500; margin: 4px 0 0 0;">${dateStr.split(',')[0]}, ${dateStr.split(',')[1]}</p></div>
    <div><p style="color: #94a3b8; font-size: 12px; margin: 0;">⏰ Kick-off</p><p style="color: #fff; font-weight: 500; margin: 4px 0 0 0;">${timeStr}</p></div>
    <div><p style="color: #94a3b8; font-size: 12px; margin: 0;">🏆 Competition</p><p style="color: #fff; font-weight: 500; margin: 4px 0 0 0;">${match.league}</p></div>
  </div>
</div>

2. FORM COMPARISON TABLE (in form analysis section):
<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #1e293b; border-radius: 8px; overflow: hidden;">
  <thead>
    <tr style="background: #334155;">
      <th style="padding: 12px; text-align: left; color: #fff;">Team</th>
      <th style="padding: 12px; text-align: center; color: #10b981;">W</th>
      <th style="padding: 12px; text-align: center; color: #fbbf24;">D</th>
      <th style="padding: 12px; text-align: center; color: #ef4444;">L</th>
      <th style="padding: 12px; text-align: left; color: #fff;">Form</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #334155;">
      <td style="padding: 12px; color: #fff;">${match.homeTeam}</td>
      <td style="padding: 12px; text-align: center; color: #10b981;">[WINS]</td>
      <td style="padding: 12px; text-align: center; color: #fbbf24;">[DRAWS]</td>
      <td style="padding: 12px; text-align: center; color: #ef4444;">[LOSSES]</td>
      <td style="padding: 12px;"><span style="color: #10b981;">●</span><span style="color: #10b981;">●</span><span style="color: #fbbf24;">●</span><span style="color: #ef4444;">●</span><span style="color: #10b981;">●</span></td>
    </tr>
    <tr>
      <td style="padding: 12px; color: #fff;">${match.awayTeam}</td>
      <td style="padding: 12px; text-align: center; color: #10b981;">[WINS]</td>
      <td style="padding: 12px; text-align: center; color: #fbbf24;">[DRAWS]</td>
      <td style="padding: 12px; text-align: center; color: #ef4444;">[LOSSES]</td>
      <td style="padding: 12px;"><span style="color: #10b981;">●</span><span style="color: #ef4444;">●</span><span style="color: #10b981;">●</span><span style="color: #10b981;">●</span><span style="color: #fbbf24;">●</span></td>
    </tr>
  </tbody>
</table>

3. HEAD-TO-HEAD BOX (in H2H section):
<div style="background: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0;">
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
    <div style="background: #10b981/20; padding: 16px; border-radius: 8px;">
      <p style="font-size: 32px; font-weight: bold; color: #10b981;">[HOME_WINS]</p>
      <p style="color: #94a3b8; font-size: 14px;">${match.homeTeam} Wins</p>
    </div>
    <div style="background: #64748b/20; padding: 16px; border-radius: 8px;">
      <p style="font-size: 32px; font-weight: bold; color: #64748b;">[DRAWS]</p>
      <p style="color: #94a3b8; font-size: 14px;">Draws</p>
    </div>
    <div style="background: #ef4444/20; padding: 16px; border-radius: 8px;">
      <p style="font-size: 32px; font-weight: bold; color: #ef4444;">[AWAY_WINS]</p>
      <p style="color: #94a3b8; font-size: 14px;">${match.awayTeam} Wins</p>
    </div>
  </div>
</div>

4. PREDICTION BOX (in prediction section):
<div style="background: linear-gradient(135deg, #10b981/10 0%, #0f172a 100%); border: 2px solid #10b981/30; border-radius: 12px; padding: 24px; margin: 24px 0;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
    <span style="font-size: 24px;">🎯</span>
    <h3 style="color: #10b981; font-size: 18px; font-weight: bold; margin: 0;">SportBot AI Prediction</h3>
  </div>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center; margin-bottom: 16px;">
    <div style="background: #1e293b; padding: 16px; border-radius: 8px;">
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">${match.homeTeam}</p>
      <p style="font-size: 24px; font-weight: bold; color: #fff;">[HOME_%]%</p>
    </div>
    <div style="background: #1e293b; padding: 16px; border-radius: 8px;">
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">Draw</p>
      <p style="font-size: 24px; font-weight: bold; color: #fff;">[DRAW_%]%</p>
    </div>
    <div style="background: #1e293b; padding: 16px; border-radius: 8px;">
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">${match.awayTeam}</p>
      <p style="font-size: 24px; font-weight: bold; color: #fff;">[AWAY_%]%</p>
    </div>
  </div>
  <p style="color: #94a3b8; font-size: 14px; text-align: center;">Based on historical data, current form, and AI analysis. For educational purposes only.</p>
</div>

5. KEY PLAYERS BOXES (in key players section):
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0;">
  <div style="background: #1e293b; border-radius: 8px; padding: 16px; border-left: 4px solid #10b981;">
    <h4 style="color: #10b981; margin: 0 0 12px 0;">${match.homeTeam} Key Players</h4>
    <ul style="list-style: none; padding: 0; margin: 0;">
      <li style="color: #fff; padding: 8px 0; border-bottom: 1px solid #334155;">⭐ [Player 1] - [Position/Role]</li>
      <li style="color: #fff; padding: 8px 0; border-bottom: 1px solid #334155;">⭐ [Player 2] - [Position/Role]</li>
      <li style="color: #fff; padding: 8px 0;">⭐ [Player 3] - [Position/Role]</li>
    </ul>
  </div>
  <div style="background: #1e293b; border-radius: 8px; padding: 16px; border-left: 4px solid #ef4444;">
    <h4 style="color: #ef4444; margin: 0 0 12px 0;">${match.awayTeam} Key Players</h4>
    <ul style="list-style: none; padding: 0; margin: 0;">
      <li style="color: #fff; padding: 8px 0; border-bottom: 1px solid #334155;">⭐ [Player 1] - [Position/Role]</li>
      <li style="color: #fff; padding: 8px 0; border-bottom: 1px solid #334155;">⭐ [Player 2] - [Position/Role]</li>
      <li style="color: #fff; padding: 8px 0;">⭐ [Player 3] - [Position/Role]</li>
    </ul>
  </div>
</div>

6. CTA BOX - INLINE (use after Form Analysis section):
<div style="background: linear-gradient(135deg, #10b981/20 0%, #0ea5e9/20 100%); border: 1px solid #10b981/50; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
  <p style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">🤖 Want Real-Time AI Analysis?</p>
  <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">Get live probability updates, injury alerts, and deeper insights with SportBot AI</p>
  <a href="/register" style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Get Started Free →</a>
</div>

7. CTA BOX - AFTER H2H SECTION:
<div style="background: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #0ea5e9;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
    <span style="font-size: 24px;">📊</span>
    <p style="color: #fff; font-size: 16px; font-weight: 600; margin: 0;">Unlock Advanced Stats</p>
  </div>
  <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">Our AI analyzes 50+ data points including xG, defensive pressure, set-piece efficiency, and more.</p>
  <a href="/pricing" style="color: #0ea5e9; text-decoration: none; font-weight: 500;">See Pro Features →</a>
</div>

8. CTA BOX - AFTER TACTICAL ANALYSIS:
<div style="background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 24px; margin: 24px 0; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
  <div style="flex: 1; min-width: 200px;">
    <p style="color: #fff; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">🎯 Get Match-Specific Insights</p>
    <p style="color: #94a3b8; font-size: 14px; margin: 0;">Ask our AI any question about any match - lineups, injuries, or tactical matchups.</p>
  </div>
  <a href="/register" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; white-space: nowrap;">Try SportBot AI Free →</a>
</div>

9. CTA BOX - MINI (sprinkle 1-2 throughout):
<p style="background: #10b981/10; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #94a3b8;">
  💡 <strong style="color: #10b981;">Pro tip:</strong> <a href="/matches" style="color: #10b981; text-decoration: none;">Browse all matches</a> with real-time probability updates as kickoff approaches.
</p>

10. CTA BOX - END OF ARTICLE:
<div style="background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%); border-radius: 16px; padding: 32px; margin: 32px 0; text-align: center;">
  <h3 style="color: #fff; font-size: 24px; font-weight: bold; margin: 0 0 12px 0;">Ready for Deeper Analysis?</h3>
  <p style="color: #fff/90; font-size: 16px; margin: 0 0 20px 0; max-width: 500px; margin-left: auto; margin-right: auto;">Join thousands of sports fans using AI-powered insights to understand matches better.</p>
  <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
    <a href="/register" style="display: inline-block; background: #fff; color: #10b981; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start Free Trial</a>
    <a href="/pricing" style="display: inline-block; background: transparent; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; border: 2px solid #fff;">View Plans</a>
  </div>
</div>

=== END HTML ELEMENTS ===

REQUIREMENTS:
1. SEO-optimized title including team names AND the word "prediction" or "preview" (50-60 chars)
2. Engaging intro paragraph with match context, include primary keyword
3. Sections to include (use H2 headings):
   - Match Overview (use the MATCH INFO BOX above after intro paragraph)
   - ${match.homeTeam} Form Analysis (add CTA BOX #6 after this section)
   - ${match.awayTeam} Form Analysis
   - Form Comparison (use FORM COMPARISON TABLE)
   - Head-to-Head Record (use HEAD-TO-HEAD BOX, add CTA BOX #7 after)
   - Key Players to Watch (use KEY PLAYERS BOXES)
   - Tactical Analysis (add CTA BOX #8 after this section)
   - SportBot AI Prediction (use PREDICTION BOX with actual percentages)
   - Value Assessment
   - Responsible Gambling Notice (MANDATORY)
   - (add CTA BOX #10 at the very end)
4. Target 1800-2200 words for better SEO
5. Use HTML formatting (h2, h3, p, ul, li, strong, em) PLUS the styled boxes above
6. Include 2-3 internal links to related blog posts naturally within content
   - IMPORTANT: Use SHORT anchor text (2-3 words max), NOT full titles
   - Example: "our <a href="/blog/liverpool-analysis">Liverpool analysis</a> showed..."
   - Example: "similar to the <a href="/blog/epl-predictions">EPL predictions</a> we covered..."
   - BAD: "<a href="/blog/some-slug">Liverpool vs Manchester United Match Preview and Prediction 2025</a>"
   - GOOD: "<a href="/blog/some-slug">Liverpool preview</a>" or "<a href="/blog/some-slug">our analysis</a>"
7. Replace all [PLACEHOLDER] values with actual data from the analysis
8. MANDATORY: Include AT LEAST 4 CTA BOXES throughout the article:
   - CTA BOX #6: After Form Analysis section
   - CTA BOX #7: After Head-to-Head section
   - CTA BOX #8: After Tactical Analysis section  
   - CTA BOX #9: Sprinkle 1-2 mini CTAs within paragraphs
   - CTA BOX #10: As the final element before the article ends

CRITICAL RULES:
- This is EDUCATIONAL ANALYSIS, not betting tips
- Use phrases like "our AI estimates", "probability suggests", "data indicates", "the numbers show"
- NEVER guarantee outcomes or encourage gambling
- Present probabilities as estimates, not certainties
- Include responsible gambling disclaimer with link to /responsible-gambling
- Naturally weave in the SEO keywords without keyword stuffing
- MUST use the styled HTML boxes provided above for visual appeal
- MUST include ALL CTA BOXES as specified - these are essential for user conversion
- CTAs should feel natural, not spammy - they offer genuine value (deeper analysis)

Return JSON:
{
  "title": "SEO title with team names + prediction/preview (50-60 chars)",
  "slug": "url-friendly-slug-with-keywords",
  "excerpt": "Compelling 150-160 char excerpt including primary keyword",
  "content": "Full HTML content with all sections AND styled boxes",
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
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content generated');

  // Try to parse JSON, with fallback for truncated responses
  try {
    return JSON.parse(content) as GeneratedMatchContent;
  } catch (parseError) {
    console.error('[Match Preview] JSON parse error, attempting to fix truncated response');
    
    // Try to fix common truncation issues
    let fixedContent = content;
    
    // If it ends mid-string, try to close it
    if (!fixedContent.endsWith('}')) {
      // Find last complete property
      const lastQuoteIndex = fixedContent.lastIndexOf('"');
      if (lastQuoteIndex > 0) {
        // Check if we're in the middle of a value
        const afterLastQuote = fixedContent.substring(lastQuoteIndex + 1);
        if (!afterLastQuote.includes('}')) {
          // We're truncated, try to close the JSON
          fixedContent = fixedContent.substring(0, lastQuoteIndex + 1) + '}';
        }
      }
    }
    
    try {
      return JSON.parse(fixedContent) as GeneratedMatchContent;
    } catch {
      // If still failing, throw original error with context
      console.error('[Match Preview] Content length:', content.length);
      console.error('[Match Preview] Content end:', content.substring(content.length - 200));
      throw new Error(`Failed to parse generated content: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  }
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

    // Step 4.5: Replace any remaining placeholders with actual data
    const processedContent = replacePlaceholders(content.content, match, analysis);
    const processedExcerpt = replacePlaceholders(content.excerpt, match, analysis);

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
        excerpt: processedExcerpt,
        content: processedContent,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        focusKeyword: content.focusKeyword,
        featuredImage,
        imageAlt,
        category: content.category || 'Match Previews',
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

// All sports/leagues to generate blog posts for
const ALL_BLOG_SPORTS = [
  'soccer_epl',           // Premier League
  'soccer_spain_la_liga', // La Liga
  'soccer_germany_bundesliga', // Bundesliga
  'soccer_italy_serie_a', // Serie A
  'soccer_france_ligue_one', // Ligue 1
  'soccer_uefa_champs_league', // Champions League
  'basketball_nba',       // NBA
  'americanfootball_nfl', // NFL
  'icehockey_nhl',        // NHL
];

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
  let totalChecked = 0;

  // If specific sport requested, use that; otherwise cycle through all sports
  const sportsToProcess = sportKey ? [sportKey] : ALL_BLOG_SPORTS;
  
  console.log(`[Batch Preview] Starting batch generation - sports: ${sportsToProcess.length}, limit: ${limit} NEW posts`);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.sportbotai.com');

    // Only generate previews for matches within 48 hours (when we have good data)
    const now = new Date();
    const maxFutureTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
    console.log(`[Batch Preview] Only processing matches between now and ${maxFutureTime.toISOString()}`);

    // Process each sport until we hit the limit
    for (const sport of sportsToProcess) {
      if (generated >= limit) {
        console.log(`[Batch Preview] Reached limit of ${limit} new posts, stopping`);
        break;
      }

      const url = `${baseUrl}/api/match-data?sportKey=${sport}`;
      console.log(`[Batch Preview] 🏟️ Fetching ${sport}...`);
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success || !data.events) {
        console.log(`[Batch Preview] ⚠️ No matches for ${sport}, skipping`);
        continue;
      }

      // Filter to only matches within 48 hours
      const allMatches = data.events.filter((m: { commenceTime: string }) => {
        const matchTime = new Date(m.commenceTime);
        return matchTime >= now && matchTime <= maxFutureTime;
      });
      console.log(`[Batch Preview] Found ${allMatches.length} matches within 48h in ${sport} (${data.events.length} total)`);

      for (let i = 0; i < allMatches.length; i++) {
        // Stop if we've generated enough new posts
        if (generated >= limit) {
          break;
        }

        const match = allMatches[i];
        totalChecked++;

        // Check if post already exists
        const existing = await prisma.blogPost.findFirst({
          where: { matchId: match.matchId },
        });

        if (existing) {
          skipped++;
          continue; // Don't log every skip to reduce noise
        }

        // Generate preview
        console.log(`[Batch Preview] 🔄 Generating (${generated + 1}/${limit}): ${match.homeTeam} vs ${match.awayTeam} [${sport}]`);
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
          console.log(`[Batch Preview] ✅ Generated: ${match.homeTeam} vs ${match.awayTeam} → ${result.slug}`);
          generated++;
        } else {
          console.log(`[Batch Preview] ❌ Failed: ${match.homeTeam} vs ${match.awayTeam} - ${result.error}`);
          failed++;
        }

        // Rate limiting - wait between generations
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`[Batch Preview] Complete: ${generated} generated, ${skipped} skipped, ${failed} failed (checked ${totalChecked} matches across ${sportsToProcess.length} sports)`);
    return {
      total: totalChecked,
      generated,
      skipped,
      failed,
      results,
    };

  } catch (error) {
    console.error('[Batch Preview] Error:', error);
    return {
      total: totalChecked,
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
