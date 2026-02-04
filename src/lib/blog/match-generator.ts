// Match Blog Generator
// Creates pre-match preview and post-match recap blog posts for upcoming matches
// 
// Uses Unified Match Service for consistent data across all app components

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { getTeamLogo, getLeagueLogo } from '@/lib/logos';
import { getMatchRostersV2, normalizeSport } from '@/lib/data-layer/bridge';
import type { Sport } from '@/lib/data-layer/types';
import {
  getUnifiedMatchData,
  type UnifiedMatchData,
  type ComputedAnalysis,
} from '@/lib/unified-match-service';
import { translateBlogPost } from '@/lib/translate';
import { getMatchInjuries, getMatchKeyPlayers } from '@/lib/football-api';
import { getMatchInjuriesViaPerplexity } from '@/lib/perplexity';

// Lazy initialization to avoid issues with module loading before env vars are set
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

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
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Match Image] ❌ Image generation failed for', match.homeTeam, 'vs', match.awayTeam);
    console.error('[Match Image] Error details:', errorMsg);
    if (error instanceof Error && error.stack) {
      console.error('[Match Image] Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }

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
    const response = await getOpenAI().chat.completions.create({
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

/**
 * Result from fetching match analysis, includes data quality for gating
 */
interface MatchAnalysisResult {
  analysis: MatchAnalysisData | null;
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  hasRealData: boolean; // True if we have actual form/H2H data (not just AI estimation)
}

/**
 * Fetch injuries for a match using hybrid approach
 * - Perplexity for US sports (NBA, NFL, NHL, NCAA) - real-time web search
 * - API-Sports for soccer - structured data
 */
async function fetchMatchInjuries(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  league?: string
): Promise<{ home: string[]; away: string[] }> {
  try {
    const sportLower = sport.toLowerCase();
    const isUSASport = sportLower.includes('basketball') ||
      sportLower.includes('nba') ||
      sportLower.includes('football') ||
      sportLower.includes('nfl') ||
      sportLower.includes('hockey') ||
      sportLower.includes('nhl') ||
      sportLower.includes('ncaa');

    // US Sports: Use Perplexity (real-time web search)
    if (isUSASport) {
      console.log(`[Blog Generator] Fetching injuries via Perplexity for ${homeTeam} vs ${awayTeam}`);
      const result = await getMatchInjuriesViaPerplexity(homeTeam, awayTeam, sport, league);

      if (result.success && (result.home.length > 0 || result.away.length > 0)) {
        console.log(`[Blog Generator] Perplexity injuries: home=${result.home.length}, away=${result.away.length}`);
        return {
          home: result.home.slice(0, 5).map(i => `${i.playerName} (${i.injury} - ${i.status})`),
          away: result.away.slice(0, 5).map(i => `${i.playerName} (${i.injury} - ${i.status})`),
        };
      }
      return { home: [], away: [] };
    }

    // Soccer: Use API-Sports
    console.log(`[Blog Generator] Fetching injuries via API-Sports for ${homeTeam} vs ${awayTeam}`);
    const injuries = await getMatchInjuries(homeTeam, awayTeam, league);

    if (injuries && (injuries.home.length > 0 || injuries.away.length > 0)) {
      console.log(`[Blog Generator] API-Sports injuries: home=${injuries.home.length}, away=${injuries.away.length}`);
      return {
        home: injuries.home.slice(0, 5).map((i: any) => `${i.playerName || i.player?.name || 'Unknown'} (${i.type || i.reason || 'injured'})`),
        away: injuries.away.slice(0, 5).map((i: any) => `${i.playerName || i.player?.name || 'Unknown'} (${i.type || i.reason || 'injured'})`),
      };
    }

    return { home: [], away: [] };
  } catch (error) {
    console.warn(`[Blog Generator] Failed to fetch injuries for ${homeTeam} vs ${awayTeam}:`, error);
    return { home: [], away: [] };
  }
}

/**
 * Fetch match analysis using the Unified Match Service
 * 
 * This ensures blogs use the same data pipeline as:
 * - Pre-analyzer cron
 * - AI Chat analysis
 * - Agent posts
 * - News/Match previews
 * 
 * Returns both analysis data AND quality info for gating blog generation
 */
async function fetchMatchAnalysis(match: MatchInfo): Promise<MatchAnalysisResult> {
  try {
    console.log(`[Match Analysis] Fetching via Unified Match Service: ${match.homeTeam} vs ${match.awayTeam}`);

    // Fetch unified data and injuries in parallel
    const [unifiedData, injuries] = await Promise.all([
      getUnifiedMatchData(
        {
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          sport: match.sportKey || match.sport,
          league: match.league,
          kickoff: match.commenceTime,
        },
        {
          odds: match.odds ? {
            home: match.odds.home,
            away: match.odds.away,
            draw: match.odds.draw,
          } : undefined,
          includeOdds: !!match.odds,
        }
      ),
      fetchMatchInjuries(match.homeTeam, match.awayTeam, match.sportKey || match.sport, match.league),
    ]);

    // Check if we have real data (form or H2H)
    const hasHomeForm = (unifiedData.enrichedData.homeForm?.length || 0) > 0;
    const hasAwayForm = (unifiedData.enrichedData.awayForm?.length || 0) > 0;
    const hasH2H = (unifiedData.enrichedData.headToHead?.length || 0) > 0;
    const hasRealData = hasHomeForm && hasAwayForm;

    // Determine data quality
    const dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT' =
      hasHomeForm && hasAwayForm && hasH2H ? 'HIGH' :
        hasHomeForm && hasAwayForm ? 'MEDIUM' :
          hasHomeForm || hasAwayForm ? 'LOW' : 'INSUFFICIENT';

    console.log(`[Match Analysis] Data quality: ${dataQuality} (homeForm: ${hasHomeForm}, awayForm: ${hasAwayForm}, h2h: ${hasH2H})`);
    console.log(`[Match Analysis] Injuries: home=${injuries.home.length}, away=${injuries.away.length}`);

    // Convert unified data to MatchAnalysisData format, including injuries
    const analysis = convertUnifiedToAnalysisData(unifiedData, match, injuries);

    return {
      analysis,
      dataQuality,
      hasRealData,
    };
  } catch (error) {
    console.error('[Match Analysis] Failed to fetch via Unified Service:', error);
    return {
      analysis: null,
      dataQuality: 'INSUFFICIENT',
      hasRealData: false,
    };
  }
}

/**
 * Convert UnifiedMatchData to MatchAnalysisData format
 * This maintains backwards compatibility with existing blog templates
 */
function convertUnifiedToAnalysisData(
  unified: UnifiedMatchData,
  match: MatchInfo,
  injuries: { home: string[]; away: string[] } = { home: [], away: [] }
): MatchAnalysisData | null {
  const { enrichedData, analysis } = unified;

  // If no analysis available, compute basic probabilities from odds
  let probabilities = {
    homeWin: 33.33,
    draw: 33.33 as number | null,
    awayWin: 33.33,
  };

  let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let recommendation = '';

  if (analysis) {
    probabilities = {
      homeWin: analysis.probabilities.home,
      draw: analysis.probabilities.draw,
      awayWin: analysis.probabilities.away,
    };

    confidenceLevel = analysis.dataQuality === 'HIGH' ? 'HIGH' :
      analysis.dataQuality === 'MEDIUM' ? 'MEDIUM' : 'LOW';

    // Build recommendation from favored outcome
    if (analysis.favored === 'home') {
      recommendation = `${match.homeTeam} Win (${analysis.edge.percentage.toFixed(1)}% edge)`;
    } else if (analysis.favored === 'away') {
      recommendation = `${match.awayTeam} Win (${analysis.edge.percentage.toFixed(1)}% edge)`;
    } else if (analysis.favored === 'draw') {
      recommendation = 'Draw';
    } else {
      recommendation = 'Close match - no clear favorite';
    }
  } else if (unified.odds) {
    // Fallback: compute from odds only
    const homeImplied = 1 / unified.odds.home;
    const awayImplied = 1 / unified.odds.away;
    const drawImplied = unified.odds.draw ? 1 / unified.odds.draw : 0;
    const total = homeImplied + awayImplied + drawImplied;

    probabilities = {
      homeWin: (homeImplied / total) * 100,
      draw: drawImplied > 0 ? (drawImplied / total) * 100 : null,
      awayWin: (awayImplied / total) * 100,
    };
    confidenceLevel = 'LOW';
    recommendation = 'Analysis based on market odds';
  }

  // Extract form data
  const homeFormMatches = enrichedData.homeForm || [];
  const awayFormMatches = enrichedData.awayForm || [];

  const homeWins = homeFormMatches.filter(m => m.result === 'W').length;
  const homeDraws = homeFormMatches.filter(m => m.result === 'D').length;
  const homeLosses = homeFormMatches.filter(m => m.result === 'L').length;

  const awayWins = awayFormMatches.filter(m => m.result === 'W').length;
  const awayDraws = awayFormMatches.filter(m => m.result === 'D').length;
  const awayLosses = awayFormMatches.filter(m => m.result === 'L').length;

  // Calculate trends
  const calculateTrend = (form: typeof homeFormMatches): 'improving' | 'declining' | 'stable' => {
    if (form.length < 3) return 'stable';
    const recentWins = form.slice(0, 3).filter(m => m.result === 'W').length;
    const olderWins = form.slice(3, 6).filter(m => m.result === 'W').length;
    if (recentWins > olderWins) return 'improving';
    if (recentWins < olderWins) return 'declining';
    return 'stable';
  };

  // Extract H2H data
  const h2hMatches = enrichedData.headToHead || [];
  const h2hHomeWins = h2hMatches.filter(m => m.homeScore > m.awayScore).length;
  const h2hDraws = h2hMatches.filter(m => m.homeScore === m.awayScore).length;
  const h2hAwayWins = h2hMatches.filter(m => m.awayScore > m.homeScore).length;

  // Build narrative from analysis
  let narrative = '';
  if (analysis) {
    const narrativeType = analysis.narrativeAngle;
    if (narrativeType === 'TRAP_SPOT') {
      narrative = `This match presents an interesting underdog scenario with ${analysis.favored === 'away' ? match.awayTeam : match.homeTeam} potentially undervalued.`;
    } else if (narrativeType === 'BLOWOUT_POTENTIAL') {
      narrative = `The numbers favor ${analysis.favored === 'home' ? match.homeTeam : match.awayTeam} in this statistical mismatch.`;
    } else if (narrativeType === 'CHAOS') {
      narrative = `Recent form strongly influences this matchup between ${match.homeTeam} and ${match.awayTeam}.`;
    } else if (narrativeType === 'MIRROR_MATCH') {
      narrative = `${match.homeTeam} faces ${match.awayTeam} in what promises to be a closely contested fixture.`;
    } else {
      narrative = `${match.homeTeam} faces ${match.awayTeam} in what promises to be a competitive fixture.`;
    }
  }

  // Build key factors from edge and quality
  const keyFactors: string[] = [];
  if (analysis) {
    if (analysis.edge.percentage >= 5) {
      keyFactors.push(`Value edge: ${analysis.edge.percentage.toFixed(1)}% ${analysis.edge.direction}`);
    }
    if (enrichedData.homeForm?.length && enrichedData.awayForm?.length) {
      const homeFormStr = homeFormMatches.slice(0, 5).map(m => m.result).join('');
      const awayFormStr = awayFormMatches.slice(0, 5).map(m => m.result).join('');
      keyFactors.push(`Form: ${match.homeTeam} (${homeFormStr}) vs ${match.awayTeam} (${awayFormStr})`);
    }
    if (h2hMatches.length > 0) {
      keyFactors.push(`H2H: ${h2hHomeWins}-${h2hDraws}-${h2hAwayWins} in last ${h2hMatches.length} meetings`);
    }
  }

  return {
    probabilities,
    recommendation,
    confidenceLevel,
    keyFactors,
    riskLevel: analysis?.dataQuality === 'LOW' ? 'HIGH' :
      analysis?.dataQuality === 'MEDIUM' ? 'MEDIUM' : 'LOW',
    valueAssessment: analysis ?
      `${analysis.edge.percentage >= 5 ? 'Value detected' : 'Fair odds'} (${analysis.edge.quality} confidence)` : '',
    homeForm: {
      wins: homeWins,
      draws: homeDraws,
      losses: homeLosses,
      trend: calculateTrend(homeFormMatches),
    },
    awayForm: {
      wins: awayWins,
      draws: awayDraws,
      losses: awayLosses,
      trend: calculateTrend(awayFormMatches),
    },
    headToHead: {
      homeWins: h2hHomeWins,
      draws: h2hDraws,
      awayWins: h2hAwayWins,
      summary: h2hMatches.length > 0 ?
        `${match.homeTeam} has won ${h2hHomeWins} of the last ${h2hMatches.length} meetings` :
        'No recent head-to-head data available',
    },
    injuries: {
      home: injuries.home,
      away: injuries.away,
    },
    narrative,
    marketInsights: analysis?.marketIntel ? [
      `Model probability: ${analysis.probabilities.home.toFixed(1)}% home, ${analysis.probabilities.away.toFixed(1)}% away`,
      analysis.edge.percentage >= 3 ? `Edge detected: ${analysis.edge.percentage.toFixed(1)}%` : 'Fair market pricing',
    ] : [],
  };
}

// NOTE: fetchEnrichedDataFallback has been removed - unified service handles all fallbacks

async function researchMatch(match: MatchInfo): Promise<MatchResearch> {
  // Determine sport type for roster lookup using DataLayer
  const rosterSport: Sport | null =
    match.sportKey?.includes('basketball') || match.league?.includes('NBA') ? 'basketball'
      : match.sportKey?.includes('hockey') || match.league?.includes('NHL') ? 'hockey'
        : match.sportKey?.includes('americanfootball') || match.league?.includes('NFL') ? 'american_football'
          : null;

  // Determine if this is a soccer match
  const isSoccer = !rosterSport && (
    match.sportKey?.includes('soccer') ||
    match.league?.toLowerCase().includes('serie a') ||
    match.league?.toLowerCase().includes('la liga') ||
    match.league?.toLowerCase().includes('bundesliga') ||
    match.league?.toLowerCase().includes('premier league') ||
    match.league?.toLowerCase().includes('ligue 1') ||
    !match.sportKey?.includes('basketball') &&
    !match.sportKey?.includes('hockey') &&
    !match.sportKey?.includes('nfl')
  );

  // Fetch roster context from DataLayer - this is the ONLY source for player data
  // No more Perplexity dependency - all data comes from DataLayer
  let rosterContext: string | null = null;
  const keyPlayers: string[] = [];

  if (rosterSport) {
    try {
      rosterContext = await getMatchRostersV2(match.homeTeam, match.awayTeam, rosterSport);
      if (rosterContext) {
        console.log(`[Match Research] Got roster context from DataLayer for ${match.homeTeam} vs ${match.awayTeam}`);
      }
    } catch (rosterError) {
      console.warn('[Match Research] DataLayer roster lookup failed:', rosterError);
    }
  } else if (isSoccer) {
    // For soccer: fetch key players from Football API
    try {
      console.log(`[Match Research] Fetching key players for soccer match: ${match.homeTeam} vs ${match.awayTeam}`);
      const players = await getMatchKeyPlayers(match.homeTeam, match.awayTeam, match.league);

      if (players.home || players.away) {
        // Format players for the AI prompt
        if (players.home) {
          keyPlayers.push(`${match.homeTeam}: ${players.home.name} (${players.home.position || 'Forward'}) - ${players.home.goals || 0} goals, ${players.home.assists || 0} assists`);
        }
        if (players.away) {
          keyPlayers.push(`${match.awayTeam}: ${players.away.name} (${players.away.position || 'Forward'}) - ${players.away.goals || 0} goals, ${players.away.assists || 0} assists`);
        }
        console.log(`[Match Research] Got ${keyPlayers.length} key players for ${match.homeTeam} vs ${match.awayTeam}`);
      }
    } catch (playerError) {
      console.warn('[Match Research] Failed to fetch key players:', playerError);
    }
  }

  // Return structured data - all other context comes from AI analysis via DataLayer
  // homeTeamInfo, awayTeamInfo, headToHead etc. are populated by fetchMatchAnalysis()
  return {
    homeTeamInfo: [],
    awayTeamInfo: [],
    headToHead: [],
    recentNews: [],
    keyPlayers,
    predictions: [],
    rosterContext,
  };
}

// ============================================
// GENERATE PRE-MATCH PREVIEW CONTENT
// ============================================

// Check if sport has draws (soccer, hockey do; basketball, football don't)
function sportHasDraws(sport: string): boolean {
  const noDrawSports = ['basketball', 'nba', 'ncaab', 'americanfootball', 'nfl', 'ncaaf'];
  return !noDrawSports.some(s => sport.toLowerCase().includes(s));
}

// Get sport-specific metrics text
function getSportMetrics(sport: string): string {
  const sportLower = sport.toLowerCase();
  if (sportLower.includes('basketball') || sportLower.includes('nba')) {
    return 'points per game, field goal percentage, rebounds, assists, and defensive efficiency';
  }
  if (sportLower.includes('football') || sportLower.includes('nfl')) {
    return 'yards per play, third-down conversion rate, turnover differential, and red zone efficiency';
  }
  if (sportLower.includes('hockey') || sportLower.includes('nhl')) {
    return 'goals per game, power play percentage, penalty kill rate, and save percentage';
  }
  // Default: soccer
  return 'xG, defensive pressure, set-piece efficiency, and possession stats';
}

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

  // Check if this sport has draws
  const hasDraws = sportHasDraws(match.sport);

  // Build rich analysis section if we have AI analysis data
  const analysisSection = analysis ? `
=== SPORTBOT AI ANALYSIS DATA (USE THIS!) ===

PROBABILITY ESTIMATES (from our AI model):
- ${match.homeTeam} Win: ${(analysis.probabilities.homeWin * 100).toFixed(1)}%
${hasDraws && analysis.probabilities.draw !== null ? `- Draw: ${(analysis.probabilities.draw * 100).toFixed(1)}%` : ''}
- ${match.awayTeam} Win: ${(analysis.probabilities.awayWin * 100).toFixed(1)}%

CONFIDENCE LEVEL: ${analysis.confidenceLevel}
RISK ASSESSMENT: ${analysis.riskLevel}

KEY FACTORS IDENTIFIED:
${analysis.keyFactors.map(f => `• ${f}`).join('\n')}

VALUE ASSESSMENT: ${analysis.valueAssessment}

${match.homeTeam.toUpperCase()} FORM (Last 5):
- Record: ${analysis.homeForm.wins}W ${hasDraws ? `${analysis.homeForm.draws}D ` : ''}${analysis.homeForm.losses}L
- Trend: ${analysis.homeForm.trend}

${match.awayTeam.toUpperCase()} FORM (Last 5):
- Record: ${analysis.awayForm.wins}W ${hasDraws ? `${analysis.awayForm.draws}D ` : ''}${analysis.awayForm.losses}L  
- Trend: ${analysis.awayForm.trend}

${(analysis.headToHead.homeWins > 0 || analysis.headToHead.awayWins > 0) ? `HEAD TO HEAD RECORD:
- ${match.homeTeam} Wins: ${analysis.headToHead.homeWins}
${hasDraws ? `- Draws: ${analysis.headToHead.draws}` : ''}
- ${match.awayTeam} Wins: ${analysis.headToHead.awayWins}
- Summary: ${analysis.headToHead.summary}` : `HEAD TO HEAD RECORD:
- No recent head-to-head data available for these teams
- Focus analysis on current form and team stats`}

INJURY CONCERNS:
- ${match.homeTeam}: ${analysis.injuries.home.length > 0 ? analysis.injuries.home.join(', ') : 'No major injuries reported'}
- ${match.awayTeam}: ${analysis.injuries.away.length > 0 ? analysis.injuries.away.join(', ') : 'No major injuries reported'}

AI NARRATIVE: ${analysis.narrative}

MARKET INSIGHTS:
${analysis.marketInsights.map(m => `• ${m}`).join('\n')}
` : '';

  // Sport-specific metrics for the CTA box
  const sportMetrics = getSportMetrics(match.sport);

  // Form table template - no Draws column for NBA/NFL
  const formTableTemplate = hasDraws ? `
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
</table>` : `
<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #1e293b; border-radius: 8px; overflow: hidden;">
  <thead>
    <tr style="background: #334155;">
      <th style="padding: 12px; text-align: left; color: #fff;">Team</th>
      <th style="padding: 12px; text-align: center; color: #10b981;">W</th>
      <th style="padding: 12px; text-align: center; color: #ef4444;">L</th>
      <th style="padding: 12px; text-align: left; color: #fff;">Form</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #334155;">
      <td style="padding: 12px; color: #fff;">${match.homeTeam}</td>
      <td style="padding: 12px; text-align: center; color: #10b981;">[WINS]</td>
      <td style="padding: 12px; text-align: center; color: #ef4444;">[LOSSES]</td>
      <td style="padding: 12px;"><span style="color: #10b981;">●</span><span style="color: #10b981;">●</span><span style="color: #ef4444;">●</span><span style="color: #10b981;">●</span><span style="color: #10b981;">●</span></td>
    </tr>
    <tr>
      <td style="padding: 12px; color: #fff;">${match.awayTeam}</td>
      <td style="padding: 12px; text-align: center; color: #10b981;">[WINS]</td>
      <td style="padding: 12px; text-align: center; color: #ef4444;">[LOSSES]</td>
      <td style="padding: 12px;"><span style="color: #10b981;">●</span><span style="color: #ef4444;">●</span><span style="color: #10b981;">●</span><span style="color: #10b981;">●</span><span style="color: #10b981;">●</span></td>
    </tr>
  </tbody>
</table>`;

  // H2H box template - no Draws for NBA/NFL
  const h2hBoxTemplate = hasDraws ? `
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
</div>` : `
<div style="background: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0;">
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; text-align: center;">
    <div style="background: #10b981/20; padding: 16px; border-radius: 8px;">
      <p style="font-size: 32px; font-weight: bold; color: #10b981;">[HOME_WINS]</p>
      <p style="color: #94a3b8; font-size: 14px;">${match.homeTeam} Wins</p>
    </div>
    <div style="background: #ef4444/20; padding: 16px; border-radius: 8px;">
      <p style="font-size: 32px; font-weight: bold; color: #ef4444;">[AWAY_WINS]</p>
      <p style="color: #94a3b8; font-size: 14px;">${match.awayTeam} Wins</p>
    </div>
  </div>
</div>`;

  // Prediction box template - no Draw for NBA/NFL
  const predictionBoxTemplate = hasDraws ? `
<div style="background: linear-gradient(135deg, #10b981/10 0%, #0f172a 100%); border: 2px solid #10b981/30; border-radius: 12px; padding: 24px; margin: 24px 0;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
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
</div>` : `
<div style="background: linear-gradient(135deg, #10b981/10 0%, #0f172a 100%); border: 2px solid #10b981/30; border-radius: 12px; padding: 24px; margin: 24px 0;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
    <h3 style="color: #10b981; font-size: 18px; font-weight: bold; margin: 0;">SportBot AI Prediction</h3>
  </div>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; text-align: center; margin-bottom: 16px;">
    <div style="background: #1e293b; padding: 16px; border-radius: 8px;">
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">${match.homeTeam}</p>
      <p style="font-size: 24px; font-weight: bold; color: #fff;">[HOME_%]%</p>
    </div>
    <div style="background: #1e293b; padding: 16px; border-radius: 8px;">
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">${match.awayTeam}</p>
      <p style="font-size: 24px; font-weight: bold; color: #fff;">[AWAY_%]%</p>
    </div>
  </div>
  <p style="color: #94a3b8; font-size: 14px; text-align: center;">Based on historical data, current form, and AI analysis. For educational purposes only.</p>
</div>`;

  const prompt = `Write a comprehensive match preview blog post for SportBot AI.

MATCH DETAILS:
- ${match.homeTeam} vs ${match.awayTeam}
- Sport: ${match.sport}
- League: ${match.league}
- Date: ${dateStr}
- Time: ${timeStr}
${hasDraws ? '' : '- NOTE: This sport has NO DRAWS - do not mention draws anywhere!'}
${oddsSection}
${analysisSection}

SEO KEYWORDS TO INCLUDE NATURALLY (IMPORTANT FOR RANKING):
Primary: "${keywords.primary}" (use in title, first paragraph, and 3-4 times throughout)
Secondary: ${keywords.secondary.join(', ')} (use each 1-2 times)
Long-tail: ${keywords.longTail.join(', ')} (use naturally where relevant)

=== HIGH-VALUE SEO TERMS (from NeuronWriter - use naturally throughout) ===
• "prediction" / "predictions" - use 4-15+ times naturally
• "AI" / "ai-powered" - use 4-10+ times naturally
• "match" - use 4-15+ times naturally (easy for match previews)
• "football" / "soccer" - use where relevant to the sport
• "tips" / "tip" - use 1-8+ times (e.g., "betting tips", "prediction tips")
• "accuracy" / "data-driven" - use 1-3 times each
• Include league names: Bundesliga, La Liga, Ligue 1, Premier League, Serie A when relevant
DO NOT keyword-stuff - these must flow naturally in context!

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
    <div><p style="color: #94a3b8; font-size: 12px; margin: 0; display: flex; align-items: center; justify-content: center; gap: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> Date</p><p style="color: #fff; font-weight: 500; margin: 4px 0 0 0;">${dateStr.split(',')[0]}, ${dateStr.split(',')[1]}</p></div>
    <div><p style="color: #94a3b8; font-size: 12px; margin: 0; display: flex; align-items: center; justify-content: center; gap: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Kick-off</p><p style="color: #fff; font-weight: 500; margin: 4px 0 0 0;">${timeStr}</p></div>
    <div><p style="color: #94a3b8; font-size: 12px; margin: 0; display: flex; align-items: center; justify-content: center; gap: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg> Competition</p><p style="color: #fff; font-weight: 500; margin: 4px 0 0 0;">${match.league}</p></div>
  </div>
</div>

2. FORM COMPARISON TABLE (in form analysis section):
${formTableTemplate}

3. HEAD-TO-HEAD BOX (in H2H section):
${(analysis?.headToHead?.homeWins || 0) > 0 || (analysis?.headToHead?.awayWins || 0) > 0
      ? h2hBoxTemplate
      : `<!-- No H2H data available - write a brief paragraph noting that these teams rarely face each other or historical data is limited. Do NOT include the H2H visual box with zeros. -->`}

4. PREDICTION BOX (in prediction section):
${predictionBoxTemplate}

5. KEY PLAYERS BOXES (in key players section):
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0;">
  <div style="background: #1e293b; border-radius: 8px; padding: 16px; border-left: 4px solid #10b981;">
    <h4 style="color: #10b981; margin: 0 0 12px 0;">${match.homeTeam} Key Players</h4>
    <ul style="list-style: none; padding: 0; margin: 0;">
      <li style="color: #fff; padding: 8px 0; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> [Player 1] - [Position/Role]</li>
      <li style="color: #fff; padding: 8px 0; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> [Player 2] - [Position/Role]</li>
      <li style="color: #fff; padding: 8px 0; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> [Player 3] - [Position/Role]</li>
    </ul>
  </div>
  <div style="background: #1e293b; border-radius: 8px; padding: 16px; border-left: 4px solid #ef4444;">
    <h4 style="color: #ef4444; margin: 0 0 12px 0;">${match.awayTeam} Key Players</h4>
    <ul style="list-style: none; padding: 0; margin: 0;">
      <li style="color: #fff; padding: 8px 0; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> [Player 1] - [Position/Role]</li>
      <li style="color: #fff; padding: 8px 0; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> [Player 2] - [Position/Role]</li>
      <li style="color: #fff; padding: 8px 0; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> [Player 3] - [Position/Role]</li>
    </ul>
  </div>
</div>

6. CTA BOX - INLINE (use after Form Analysis section):
<div style="background: linear-gradient(135deg, #10b981/20 0%, #0ea5e9/20 100%); border: 1px solid #10b981/50; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
  <p style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 8px 0; display: flex; align-items: center; justify-content: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg> Want Real-Time AI Analysis?</p>
  <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">Get live probability updates, injury alerts, and deeper insights with SportBot AI</p>
  <a href="/register" style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Get Started Free →</a>
</div>

7. CTA BOX - AFTER H2H SECTION:
<div style="background: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #0ea5e9;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
    <p style="color: #fff; font-size: 16px; font-weight: 600; margin: 0;">Unlock Advanced Stats</p>
  </div>
  <p style="color: #fff; font-size: 14px; margin: 0 0 16px 0;">Our AI analyzes 50+ data points including ${sportMetrics}.</p>
  <a href="/pricing" style="color: #0ea5e9; text-decoration: none; font-weight: 500;">See Pro Features →</a>
</div>

8. CTA BOX - AFTER TACTICAL ANALYSIS:
<div style="background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 24px; margin: 24px 0; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
  <div style="flex: 1; min-width: 200px;">
    <p style="color: #fff; font-size: 18px; font-weight: 600; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg> Get Match-Specific Insights</p>
    <p style="color: #fff; font-size: 14px; margin: 0;">Ask our AI any question about any match - lineups, injuries, or tactical matchups.</p>
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
  <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0 0 20px 0; max-width: 500px; margin-left: auto; margin-right: auto;">Join thousands of sports fans using AI-powered insights to understand matches better.</p>
  <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
    <a href="/register" style="display: inline-block; background: #fff; color: #10b981; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start Free Trial</a>
    <a href="/pricing" style="display: inline-block; background: transparent; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; border: 2px solid #fff;">View Plans</a>
  </div>
</div>

11. SPORTBOT EDGE METHODOLOGY BOX (NEW - adds word density + E-E-A-T):
<div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin: 24px 0;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
    <span style="font-size: 24px;">🔬</span>
    <h3 style="color: #fff; font-size: 18px; font-weight: bold; margin: 0;">How We Calculate Our Prediction</h3>
  </div>
  <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
    Our AI-powered prediction model analyzes multiple data layers to generate probability estimates:
  </p>
  <ul style="list-style: none; padding: 0; margin: 0;">
    <li style="color: #fff; padding: 10px 0; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 12px;">
      <span style="background: #10b981/20; padding: 6px 10px; border-radius: 6px; font-size: 12px; color: #10b981;">Step 1</span>
      <span>Historical form analysis (last 5-10 matches, weighted by recency)</span>
    </li>
    <li style="color: #fff; padding: 10px 0; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 12px;">
      <span style="background: #0ea5e9/20; padding: 6px 10px; border-radius: 6px; font-size: 12px; color: #0ea5e9;">Step 2</span>
      <span>Head-to-head record analysis with venue weighting</span>
    </li>
    <li style="color: #fff; padding: 10px 0; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 12px;">
      <span style="background: #f59e0b/20; padding: 6px 10px; border-radius: 6px; font-size: 12px; color: #f59e0b;">Step 3</span>
      <span>Market odds comparison & vig removal for fair probabilities</span>
    </li>
    <li style="color: #fff; padding: 10px 0; display: flex; align-items: center; gap: 12px;">
      <span style="background: #ef4444/20; padding: 6px 10px; border-radius: 6px; font-size: 12px; color: #ef4444;">Step 4</span>
      <span>Edge calculation: Model probability minus market implied probability</span>
    </li>
  </ul>
  <p style="color: #64748b; font-size: 12px; margin-top: 16px; font-style: italic;">
    A positive edge suggests our model sees more value than the market. However, betting always involves risk.
  </p>
</div>

12. BETTING MARKET ANGLE BOX (NEW - adds word density):
<div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
    <h3 style="color: #f59e0b; font-size: 16px; font-weight: bold; margin: 0;">Market Insight</h3>
  </div>
  <p style="color: #fff; font-size: 15px; line-height: 1.6; margin: 0;">
    [Write 2-3 sentences about what the betting market is pricing in and whether there's disagreement with our model. Mention the implied probability from odds vs our model's estimate. Example: "The market has ${match.homeTeam} at X% implied probability, but our model sees them at Y% - a Z% edge worth noting."]
  </p>
</div>

13. TACTICAL MATCHUP GRID (NEW - adds word density):
<div style="background: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0;">
  <h3 style="color: #fff; font-size: 16px; font-weight: bold; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path><path d="M13 19l6-6"></path><path d="M16 16l4 4"></path><path d="M19 21l2-2"></path><path d="M14.5 6.5L21 3v3L9.5 17.5"></path><path d="M5 14l4 4"></path><path d="M7 17l-3 3"></path></svg> Key Tactical Matchups</h3>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
    <div style="background: #0f172a; padding: 16px; border-radius: 8px;">
      <p style="color: #10b981; font-size: 12px; margin: 0 0 4px 0;">Advantage: ${match.homeTeam}</p>
      <p style="color: #fff; font-size: 14px; margin: 0;">[Describe one tactical advantage]</p>
    </div>
    <div style="background: #0f172a; padding: 16px; border-radius: 8px;">
      <p style="color: #ef4444; font-size: 12px; margin: 0 0 4px 0;">Advantage: ${match.awayTeam}</p>
      <p style="color: #fff; font-size: 14px; margin: 0;">[Describe one tactical advantage]</p>
    </div>
  </div>
</div>

=== END HTML ELEMENTS ===

═══════════════════════════════════════════════════════════════
✍️ NATURAL, CONVERSATIONAL TONE (CRITICAL)
═══════════════════════════════════════════════════════════════

Write as if speaking to a friend who asked about this match:
✔ Use contractions naturally (it's, don't, you're, we've, that's)
✔ Address the reader directly ("you", "your", "we")
✔ Include rhetorical questions ("So what does this mean for Sunday's clash?")
✔ Vary sentence length — mix short punchy ones with longer explanations
✔ Add emotional nuance — excitement, caution, curiosity
✔ Use transitions like "Here's the thing...", "Now, let's talk about..."
✔ Include asides and parentheticals (like this one)

DO NOT sound like a lecture or match report template. Sound like a conversation.

═══════════════════════════════════════════════════════════════
🚫 BANNED AI PHRASES (INSTANT QUALITY PENALTY)
═══════════════════════════════════════════════════════════════

NEVER use these robotic AI-sounding phrases:
❌ "In today's digital landscape..."
❌ "It's important to note that..."
❌ "Cutting-edge" / "State-of-the-art"
❌ "Seamless" / "Seamlessly"
❌ "Delve into" / "Delving deeper"
❌ "At the end of the day..."
❌ "Robust" / "Robust solutions"
❌ "Leverage" (as a verb)
❌ "Elevate your..."
❌ "Navigate the complexities"
❌ "In conclusion..." (at the start of conclusion)
❌ "Furthermore..." / "Moreover..." (overused)
❌ "A myriad of..."
❌ "It goes without saying..."
❌ "Needless to say..."
❌ "This clash promises..." / "This fixture promises..."
❌ "The stage is set..."
❌ "All eyes will be on..."
❌ "A tantalizing prospect"

Instead, use direct, specific language that sounds like a real person wrote it.

═══════════════════════════════════════════════════════════════
💡 ORIGINAL INSIGHT & REAL EXAMPLES (E-E-A-T)
═══════════════════════════════════════════════════════════════

Add genuine value through:
✔ Specific context ("When these sides met in October, the 2-1 scoreline didn't tell the whole story...")
✔ Actual statistics with meaning ("City's 2.3 xG at home dwarfs their 1.4 on the road")
✔ Reasoning and WHY explanations, not just WHAT happened
✔ Personal-sounding insights ("One thing worth watching is...")
✔ Acknowledge limitations ("Form's tricky to read here because...")
✔ Specific player matchups ("If Salah gets isolated against their right-back...")

DO NOT: Write filler content or repeat generic facts everyone knows.

═══════════════════════════════════════════════════════════════
🔄 BREAK AI PATTERNS (CRITICAL FOR QUALITY)
═══════════════════════════════════════════════════════════════

AI writing has predictable patterns. Break them:

✔ Vary paragraph lengths (some 2 sentences, some 5-6)
✔ Start sentences differently (not all "The", "This", "It")
✔ Mix sentence structures (questions, statements, exclamations)
✔ Include occasional one-sentence paragraphs for emphasis
✔ Use fragments intentionally for effect ("Big ask.")
✔ Vary transitions — don't repeat the same ones
✔ Add personality touches ("Here's where it gets interesting...")
✔ Each preview should have a UNIQUE angle/narrative hook

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
   - Tactical Analysis (use TACTICAL MATCHUP GRID #13, add CTA BOX #8 after)
   - Betting Market Perspective (use BETTING MARKET ANGLE BOX #12) - NEW
   - SportBot AI Prediction (use PREDICTION BOX with actual percentages)
   - How We Calculate This (use SPORTBOT EDGE METHODOLOGY BOX #11) - NEW
   - Value Assessment
   - Responsible Gambling Notice (MANDATORY)
   - (add CTA BOX #10 at the very end)
4. Target 2200-2800 words for competitive SEO (INCREASED from 1800-2200)
5. Use HTML formatting (h2, h3, p, ul, li, strong, em) PLUS the styled boxes above
6. Include 2-3 internal links to related blog posts naturally within content
   - IMPORTANT: Use SHORT anchor text (2-3 words max), NOT full titles
   - Example: "our <a href="/blog/liverpool-analysis">Liverpool analysis</a> showed..."
   - Example: "similar to the <a href="/blog/epl-predictions">EPL predictions</a> we covered..."
   - BAD: "<a href="/blog/some-slug">Liverpool vs Manchester United Match Preview and Prediction 2025</a>"
   - GOOD: "<a href="/blog/some-slug">Liverpool preview</a>" or "<a href="/blog/some-slug">our analysis</a>"
7. Replace all [PLACEHOLDER] values with actual data from the analysis
8. MANDATORY: Include AT LEAST 5 CTA/INSIGHT BOXES throughout the article:
   - CTA BOX #6: After Form Analysis section
   - CTA BOX #7: After Head-to-Head section
   - CTA BOX #8: After Tactical Analysis section  
   - CTA BOX #9: Sprinkle 1-2 mini CTAs within paragraphs
   - CTA BOX #10: As the final element before the article ends
   - EDGE METHODOLOGY BOX #11: In "How We Calculate This" section
   - BETTING MARKET ANGLE BOX #12: In "Betting Market Perspective" section
   - TACTICAL MATCHUP GRID #13: In "Tactical Analysis" section

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

  const response = await getOpenAI().chat.completions.create({
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

  const response = await getOpenAI().chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || '';
}

// ============================================
// NEWS CONTENT GENERATION
// ============================================

/**
 * Strip betting/promotional content from blog content for Google News
 * Removes: AI predictions, signup CTAs, betting language
 * Keeps: Match analysis, internal links to /matches, /blog, /news
 */
function stripPromotionalContent(content: string): string {
  let result = content;

  // Remove the entire "SportBot AI Prediction" section (heading + following prediction box)
  result = result.replace(/<h2[^>]*>\s*SportBot AI Prediction\s*<\/h2>/gi, '');

  // Remove prediction boxes - specifically the ones with "🎯" emoji and prediction content
  result = result.replace(
    /<div[^>]*style="[^"]*#10b981[^"]*"[^>]*>\s*<div[^>]*>\s*<span[^>]*>🎯<\/span>[\s\S]*?<\/div>\s*<\/div>/gi,
    ''
  );

  // Remove CTA boxes with class="cta-box" where link is at the end: <div class="cta-box">...<a>...</a></div>
  result = result.replace(
    /<div[^>]*class="cta-box"[^>]*>(?:(?!<div)[\s\S])*?<a[^>]*>[^<]*<\/a>\s*<\/div>/gi,
    ''
  );

  // Remove CTA boxes with class="cta-box" where link is inside p: <div class="cta-box">...<a>...</a>...</p></div>
  result = result.replace(
    /<div[^>]*class="cta-box"[^>]*>(?:(?!<div)[\s\S])*?<\/p>\s*<\/div>/gi,
    ''
  );

  // Remove promotional phrases that appear inline
  result = result.replace(/🤖\s*Want Real-Time AI Analysis\?/gi, '');
  result = result.replace(/🤖\s*Want Deep Insights\?/gi, '');
  result = result.replace(/Ready for Deeper Analysis\?/gi, '');
  result = result.replace(/Unlock Advanced Stats/gi, '');
  result = result.replace(/Get live probability updates[^<]*/gi, '');

  // Remove standalone promotional links
  result = result.replace(/<a[^>]*href="\/(?:register|pricing|login)"[^>]*>[^<]*<\/a>/gi, '');

  // Remove "Pro tip" paragraphs
  result = result.replace(/<p[^>]*>\s*(?:<[^>]+>)*\s*Pro tip[^<]*(?:<[^>]+>)*\s*<\/p>/gi, '');

  // Remove standalone promotional text
  result = result.replace(/Try SportBot AI free|Get Started Free|Start Your Free|Join now|Subscribe today|See Pro Features/gi, '');

  // Remove probability percentages shown in prediction boxes like "55%", "Win: 55%"
  result = result.replace(/\b(win|probability|chance):\s*\d+%/gi, '');
  result = result.replace(/\b\d+(\.\d+)?%\s*(probability|chance|win)/gi, '');

  // Replace betting language with neutral terms
  result = result.replace(/best bet|betting value|value bet/gi, 'key factor');
  result = result.replace(/\bstake\b|\bwager\b/gi, 'consideration');
  result = result.replace(/gamblers?|bettors?/gi, 'fans');
  result = result.replace(/betting tips|betting preview/gi, 'match analysis');

  // Clean up empty paragraphs that may have just had promotional text
  result = result.replace(/<p[^>]*>\s*<\/p>/gi, '');

  // Clean up empty divs
  for (let i = 0; i < 3; i++) {
    result = result.replace(/<div[^>]*>\s*<\/div>/gi, '');
  }

  return result;
}

/**
 * Generate news-style headline from blog title
 * Creates varied, engaging headlines for Google News
 */
function generateNewsTitle(
  blogTitle: string,
  homeTeam: string,
  awayTeam: string,
  league?: string,
  matchDate?: Date
): string {
  // Get day of week
  const dayName = matchDate
    ? matchDate.toLocaleDateString('en-US', { weekday: 'long' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Pick a random template style
  const templateStyle = Math.floor(Math.random() * 10);

  // Varied headline templates
  const templates: string[] = [
    // Action-focused
    `${homeTeam} Host ${awayTeam} in ${dayName}'s ${league || ''} Showdown`.trim(),
    `${awayTeam} Travel to Face ${homeTeam} in Crucial ${league || ''} Clash`,
    `${homeTeam} Look to Extend Form Against Visiting ${awayTeam}`,
    `${awayTeam} Eye Road Victory as They Face ${homeTeam}`,

    // Stakes-focused
    `High Stakes as ${homeTeam} Welcome ${awayTeam} to Town`,
    `${homeTeam} vs ${awayTeam}: What's at Stake This ${dayName}`,
    `Crucial Points on the Line as ${homeTeam} Meet ${awayTeam}`,
    `${dayName} Spotlight: ${homeTeam} Take On ${awayTeam}`,

    // Narrative-focused  
    `Can ${awayTeam} Upset ${homeTeam} on the Road?`,
    `${homeTeam} Aim to Bounce Back Against ${awayTeam}`,
    `${awayTeam} Put Unbeaten Run to Test at ${homeTeam}`,
    `Form Guide Favors ${homeTeam} Ahead of ${awayTeam} Visit`,

    // Time-focused
    `${dayName} ${league || 'Action'}: ${homeTeam} vs ${awayTeam} Preview`,
    `This ${dayName}: ${homeTeam} Set to Battle ${awayTeam}`,
    `${league || 'Sports'} ${dayName}: ${homeTeam} Welcome ${awayTeam}`,

    // Question style
    `${homeTeam} or ${awayTeam}: Who Will Prevail This ${dayName}?`,
    `Will ${homeTeam} Continue Home Dominance vs ${awayTeam}?`,

    // Analysis style
    `Inside the Matchup: ${homeTeam} vs ${awayTeam} Breakdown`,
    `Key Factors in ${homeTeam}'s Clash with ${awayTeam}`,
    `What to Watch: ${homeTeam} Against ${awayTeam}`,
  ];

  let newsTitle = templates[templateStyle % templates.length];

  // Clean up any double spaces or trailing league text
  newsTitle = newsTitle.replace(/\s+/g, ' ').trim();

  // Ensure it doesn't exceed reasonable length
  if (newsTitle.length > 90) {
    // Fall back to simpler format
    newsTitle = `${homeTeam} vs ${awayTeam}: ${dayName}'s ${league || ''} Clash`.trim();
  }

  if (newsTitle.length > 90) {
    newsTitle = `${homeTeam} Face ${awayTeam} in ${league || dayName} Clash`;
  }

  return newsTitle;
}

/**
 * Transform blog content into news-friendly content
 * Fast, synchronous transformation - no AI call needed
 */
function transformToNewsContent(
  blogContent: string,
  homeTeam: string,
  awayTeam: string,
  league: string
): string {
  // Start with stripped content
  const newsContent = stripPromotionalContent(blogContent);

  // Add news-style end box (editorial, not promotional)
  const newsEndBox = `
<div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center; border: 1px solid #334155;">
  <div style="font-size: 32px; margin-bottom: 12px;">⚡</div>
  <h3 style="color: #f1f5f9; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
    More ${league} Coverage
  </h3>
  <p style="color: #94a3b8; font-size: 15px; margin: 0 0 20px 0; max-width: 400px; margin-left: auto; margin-right: auto;">
    Follow all ${league} matches with live updates and expert analysis.
  </p>
  <a href="/matches" style="display: inline-block; background: #10b981; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
    View All Matches →
  </a>
</div>`;

  // Don't strip/replace - just use the first few sections of the blog content for news
  // Take content up to and including tactical analysis (exclude betting predictions)
  const sections = newsContent.split(/<h2[^>]*>/i);

  // Keep all analytical sections, exclude betting-focused ones:
  // Include: Match Overview, Home Form, Away Form, Form Comparison, H2H, Key Players, Tactical Matchup
  // Exclude: SportBot AI Prediction, Value Assessment, Responsible Gambling Notice
  let newsArticle = '';
  const maxSections = 9; // All analysis sections including tactical matchup

  for (let i = 0; i < Math.min(sections.length, maxSections); i++) {
    if (i === 0) {
      // First part is before first <h2>
      newsArticle = sections[i];
    } else {
      newsArticle += '<h2>' + sections[i];
    }
  }

  // Clean up any trailing incomplete HTML
  newsArticle = newsArticle.replace(/<h2[^>]*>[^<]*$/, '');

  // Add the news end box
  if (!newsArticle.includes('More ' + league + ' Coverage')) {
    newsArticle += newsEndBox;
  }

  return newsArticle;
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
    const analysisResult = await fetchMatchAnalysis(match);
    const { analysis, dataQuality, hasRealData } = analysisResult;

    // DATA QUALITY GATE: Only generate blogs when we have real match data
    // This prevents generating content with AI estimation only (no form/H2H)
    if (!hasRealData) {
      console.log(`[Match Preview] ⚠️ SKIPPING - Insufficient data quality: ${dataQuality}`);
      console.log(`[Match Preview] Team resolution likely failed for one or both teams in API-Sports`);
      return {
        success: false,
        error: `Insufficient match data (quality: ${dataQuality}). Requires form data for both teams.`,
        duration: Date.now() - startTime,
      };
    }

    if (analysis) {
      totalCost += 0.02; // Analysis API cost
      console.log(`[Match Preview] AI analysis data received (quality: ${dataQuality})`);
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

    // Step 6: Generate News Content (same post, different view)
    console.log('[Match Preview] Step 6/7: Generating news content...');
    const matchDate = match.commenceTime ? new Date(match.commenceTime) : undefined;
    const newsTitle = generateNewsTitle(content.title, match.homeTeam, match.awayTeam, match.league, matchDate);
    let newsContent = transformToNewsContent(
      processedContent,
      match.homeTeam,
      match.awayTeam,
      match.league
    );

    // VALIDATION: Ensure newsContent has proper structure
    const newsH2Count = (newsContent.match(/<h2/gi) || []).length;
    const contentH2Count = (processedContent.match(/<h2/gi) || []).length;

    if (newsH2Count === 0 && contentH2Count > 0) {
      console.warn('[Match Preview] ⚠️ newsContent has no H2 sections! Regenerating...');
      // Try regenerating from full content
      newsContent = transformToNewsContent(
        content.content, // Use original content, not processed
        match.homeTeam,
        match.awayTeam,
        match.league
      );
      const retryH2Count = (newsContent.match(/<h2/gi) || []).length;
      console.log(`[Match Preview] Retry newsContent H2 count: ${retryH2Count}`);
    }

    // Final validation - minimum length check
    if (newsContent.length < 3000) {
      console.warn(`[Match Preview] ⚠️ newsContent too short: ${newsContent.length} chars (expected 5000+)`);
    }

    console.log(`[Match Preview] News title: ${newsTitle} (${newsContent.length} chars, ${newsH2Count} H2s)`);

    // Step 7: Save to database (Blog + News in ONE record)
    console.log('[Match Preview] Step 7/7: Saving to database...');

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
        // NEWS CONTENT - same record, no double generation!
        newsTitle,
        newsContent,
      },
    });

    // Step 8: Automatically translate to Serbian
    console.log('[Match Preview] Step 8: Translating to Serbian...');
    try {
      const translations = await translateBlogPost({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        newsTitle: post.newsTitle,
        newsContent: post.newsContent,
        postType: post.postType,
      });

      // Update post with Serbian translations
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          titleSr: translations.titleSr,
          excerptSr: translations.excerptSr,
          contentSr: translations.contentSr,
          metaTitleSr: translations.metaTitleSr,
          metaDescriptionSr: translations.metaDescriptionSr,
          newsTitleSr: translations.newsTitleSr,
          newsContentSr: translations.newsContentSr,
        },
      });

      console.log('[Match Preview] ✅ Serbian translation complete!');
    } catch (translationError) {
      console.error('[Match Preview] ⚠️ Translation failed (post still created):', translationError);
    }

    const duration = Date.now() - startTime;
    console.log(`[Match Preview] ✅ Complete! Post ID: ${post.id}, Duration: ${duration}ms`);
    console.log(`[Match Preview] 📰 News also ready at: /news/${post.slug}`);

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
<h2><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>Post-Match Analysis</h2>
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
  'soccer_portugal_primeira_liga', // Primeira Liga
  'soccer_netherlands_eredivisie', // Eredivisie
  'soccer_turkey_super_league', // Süper Lig
  'soccer_belgium_first_div', // Jupiler Pro League
  'soccer_spl',           // Scottish Premiership
  'soccer_uefa_champs_league', // Champions League
  'soccer_uefa_europa_league', // Europa League
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

      // IMPORTANT: includeOdds=true fetches actual odds from bookmakers (uses quota)
      const url = `${baseUrl}/api/match-data?sportKey=${sport}&includeOdds=true`;
      console.log(`[Batch Preview] 🏟️ Fetching ${sport} with odds...`);

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
