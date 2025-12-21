/**
 * API Route: /api/analyze
 * 
 * AI-powered multi-sport match analysis endpoint.
 * Returns analysis strictly following the FINAL JSON schema.
 * 
 * Supports: Soccer, NBA, NFL, NHL, MMA/UFC.
 * 
 * AUTHENTICATION & LIMITS:
 * - Requires authenticated user session
 * - Enforces plan-based usage limits (FREE: 1 trial, PRO: 30/day, PREMIUM: unlimited)
 * 
 * REAL DATA INTEGRATION:
 * - Fetches real team form, H2H, and stats from API-Sports
 * - Real-time intelligence from Perplexity (injuries, lineups, news)
 * - Supports: Soccer, Basketball (NBA), Hockey (NHL), and more
 * 
 * CACHING:
 * - Uses Upstash Redis to cache identical analyses for 1 hour
 * - Reduces OpenAI API costs and improves response time
 * 
 * HISTORY:
 * - Saves each analysis to database for user history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import OpenAI from 'openai';

// Force dynamic rendering (uses cookies/auth)
export const dynamic = 'force-dynamic';
import {
  AnalyzeRequest,
  AnalyzeResponse,
  OddsComparison,
  RiskLevel,
  ValueFlag,
  Trend,
  DataQuality,
  BestValueSide,
  MarketType,
  MarketConfidence,
  FormMatch,
  InjuryContext,
  TeamInjuryContext,
  InjuredPlayer as InjuredPlayerType,
  PlayerImportance,
  AIBriefing,
} from '@/types';
import { getSportConfig, getSportTerminology } from '@/lib/config/sportsConfig';
import {
  buildCoreSystemPrompt,
  buildSportContext,
  SPORT_PROBABILITY_BOUNDS,
  SPORT_KEY_FACTORS,
  VALIDATION_RULES,
  RESPONSIBLE_GAMBLING_MESSAGES,
  SportPromptConfig,
} from '@/lib/config/systemPrompt';
import { canUserAnalyze, incrementAnalysisCount } from '@/lib/auth';
import { 
  getEnrichedMatchDataV2, 
  normalizeSport,
} from '@/lib/data-layer/bridge';
import { isSportSupported, getDataSourceLabel, type MultiSportEnrichedData } from '@/lib/sports-api';
import {
  cacheGet,
  cacheSet,
  CACHE_TTL,
  CACHE_KEYS,
  hashOdds,
} from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { getMatchContext, MatchContext } from '@/lib/match-context';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { generatePreMatchInsights } from '@/lib/utils/preMatchInsights';
import { getPerplexityClient, type ResearchResult } from '@/lib/perplexity';
import * as Sentry from '@sentry/nextjs';

// ============================================
// ACCURACY-CORE PIPELINE INTEGRATION
// Uses computed probabilities instead of LLM guesses
// ============================================
import { 
  runAccuracyPipeline, 
  type PipelineInput, 
  type PipelineResult,
} from '@/lib/accuracy-core';
import { 
  analyzeMarket,
  type OddsData,
  type MarketIntel,
} from '@/lib/value-detection';
import {
  normalizeToUniversalSignals,
  type RawMatchInput,
  type UniversalSignals,
} from '@/lib/universal-signals';
import {
  computeNarrativeAngle,
  SIGNATURE_CATCHPHRASES,
  RECURRING_MOTIFS,
  type NarrativeAngle,
} from '@/lib/sportbot-brain';

// ============================================
// OPENAI CLIENT (LAZY INIT)
// ============================================

let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// ============================================
// COMPUTED PROBABILITIES (Data-2 Layer)
// Uses accuracy-core pipeline + form weighting
// ============================================

interface ComputedProbabilities {
  homeWin: number;
  draw: number | null;
  awayWin: number;
  strengthEdge: {
    direction: 'home' | 'away' | 'even';
    percentage: number;
  };
  marketIntel: MarketIntel | null;
  confidence: 'high' | 'medium' | 'low';
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  narrativeAngle: NarrativeAngle;
}

/**
 * Derive narrative angle from signals for AIXBT personality
 */
function deriveNarrativeAngleFromSignals(signals: UniversalSignals): NarrativeAngle {
  // Volatility: based on clarity score (lower clarity = higher volatility)
  const volatilityScore = signals.clarity_score < 50 ? 80 : 
                          signals.clarity_score < 70 ? 50 : 20;
  
  // Power gap: based on edge percentage
  const edgePct = signals.display.edge.percentage;
  const powerGap = edgePct > 15 ? 50 : edgePct > 8 ? 30 : 10;
  
  // Form weirdness: based on form trends
  const formTrend = signals.display.form.trend;
  const formWeirdness = formTrend === 'balanced' ? 30 : 
                        (signals.display.form.home === 'weak' && signals.display.form.away === 'weak') ? 70 :
                        40;
  
  return computeNarrativeAngle(volatilityScore, powerGap, formWeirdness);
}

/**
 * Map narrative angle to AIXBT catchphrase category
 */
function mapAngleToCategory(angle: NarrativeAngle): keyof typeof SIGNATURE_CATCHPHRASES {
  switch (angle) {
    case 'CHAOS':
      return 'chaos';
    case 'BLOWOUT_POTENTIAL':
      return 'highConviction';
    case 'TRAP_SPOT':
      return 'contrarian';
    case 'CONTROL':
    case 'MIRROR_MATCH':
    default:
      return 'openers';
  }
}

/**
 * Get AIXBT personality catchphrase for the narrative angle
 */
function getAIXBTCatchphrase(angle: NarrativeAngle): string {
  const category = mapAngleToCategory(angle);
  const phrases = SIGNATURE_CATCHPHRASES[category];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Get AIXBT recurring motif
 */
function getAIXBTMotif(): string {
  const motifs = RECURRING_MOTIFS;
  return motifs[Math.floor(Math.random() * motifs.length)];
}

/**
 * Get angle-specific writing guidance
 */
function getAngleGuidance(angle: NarrativeAngle): string {
  switch (angle) {
    case 'CHAOS':
      return 'Embrace the chaos. Mock the unpredictability. Sound amused by the madness.';
    case 'BLOWOUT_POTENTIAL':
      return 'Be confident but not arrogant. The data is clear. Express mild boredom at the predictability.';
    case 'TRAP_SPOT':
      return 'Warning tone. Highlight the hidden dangers. Sound like you\'ve seen this movie before.';
    case 'MIRROR_MATCH':
      return 'The story matters more than pure stats here. This is evenly matched - focus on small edges.';
    case 'CONTROL':
    default:
      return 'Controlled, analytical, slight superiority. The numbers speak. You interpret.';
  }
}

/**
 * Compute probabilities using Data-2 layer (mathematical models)
 * This replaces LLM probability guessing with computed values
 * 
 * Uses normalizeToUniversalSignals() to build proper signals,
 * then analyzeMarket() to get computed probabilities with form weighting.
 */
function computeProbabilities(
  enrichedData: MultiSportEnrichedData | null,
  odds: { home: number; away: number; draw?: number | null },
  sport: string,
  homeTeam: string,
  awayTeam: string
): ComputedProbabilities | null {
  // Need minimum data to compute
  if (!enrichedData?.homeStats || !enrichedData?.awayStats) {
    console.log('[Pipeline] Insufficient stats data for computed probabilities');
    return null;
  }
  
  if (!odds.home || !odds.away) {
    console.log('[Pipeline] Insufficient odds data for computed probabilities');
    return null;
  }

  // Extract form string from form matches
  const extractFormString = (matches: FormMatch[] | null | undefined): string => {
    if (!matches?.length) return '';
    return matches.slice(0, 5).map(m => m.result).join('');
  };

  const homeForm = extractFormString(enrichedData.homeForm);
  const awayForm = extractFormString(enrichedData.awayForm);
  
  console.log('[Pipeline] Form data:', { homeForm, awayForm });

  // Calculate derived stats from TeamStats
  const homeStats = enrichedData.homeStats;
  const awayStats = enrichedData.awayStats;
  
  // Derive wins/losses from form if not available
  const countWins = (form: string) => (form.match(/W/g) || []).length;
  const countLosses = (form: string) => (form.match(/L/g) || []).length;
  const countDraws = (form: string) => (form.match(/D/g) || []).length;

  // Build RawMatchInput for universal signals
  const rawInput: RawMatchInput = {
    sport,
    homeTeam,
    awayTeam,
    homeForm,
    awayForm,
    homeStats: {
      played: homeStats.wins !== undefined && homeStats.losses !== undefined 
        ? (homeStats.wins + homeStats.losses) 
        : homeForm.length || 5,
      wins: homeStats.wins ?? countWins(homeForm),
      draws: 0, // Not always available
      losses: homeStats.losses ?? countLosses(homeForm),
      scored: homeStats.goalsScored,
      conceded: homeStats.goalsConceded,
    },
    awayStats: {
      played: awayStats.wins !== undefined && awayStats.losses !== undefined 
        ? (awayStats.wins + awayStats.losses) 
        : awayForm.length || 5,
      wins: awayStats.wins ?? countWins(awayForm),
      draws: 0, // Not always available
      losses: awayStats.losses ?? countLosses(awayForm),
      scored: awayStats.goalsScored,
      conceded: awayStats.goalsConceded,
    },
    h2h: {
      total: enrichedData.headToHead?.length || 0,
      homeWins: enrichedData.headToHead?.filter(m => m.homeScore > m.awayScore).length || 0,
      awayWins: enrichedData.headToHead?.filter(m => m.awayScore > m.homeScore).length || 0,
      draws: enrichedData.headToHead?.filter(m => m.homeScore === m.awayScore).length || 0,
    },
  };

  // Compute universal signals (this applies 40% form weighting)
  let signals: UniversalSignals;
  try {
    signals = normalizeToUniversalSignals(rawInput);
    console.log('[Pipeline] Universal signals computed:', {
      form: signals.form,
      strengthEdge: signals.strength_edge,
      confidence: signals.confidence,
    });
  } catch (error) {
    console.error('[Pipeline] Failed to compute universal signals:', error);
    return null;
  }

  // Detect sport type for draw handling
  const hasDraw = sport.toLowerCase().includes('soccer') || 
                  sport.toLowerCase() === 'football' ||
                  sport.toLowerCase().includes('football');

  // Build odds data for market analysis (convert null to undefined)
  const oddsData: OddsData = {
    homeOdds: odds.home,
    awayOdds: odds.away,
    drawOdds: hasDraw && odds.draw ? odds.draw : undefined,
  };

  // Run market analysis (uses signals with form weighting)
  let marketIntel: MarketIntel | null = null;
  try {
    marketIntel = analyzeMarket(signals, oddsData, hasDraw);
    console.log('[Pipeline] Market intel:', {
      modelProb: marketIntel.modelProbability,
      valueEdge: marketIntel.valueEdge,
      recommendation: marketIntel.recommendation,
    });
  } catch (error) {
    console.error('[Pipeline] Failed to analyze market:', error);
    return null;
  }

  // Extract computed probabilities
  const homeProb = marketIntel.modelProbability.home;
  const awayProb = marketIntel.modelProbability.away;
  const drawProb = hasDraw ? marketIntel.modelProbability.draw || null : null;

  // Extract strength edge from signals
  const strengthEdge = {
    direction: signals.display.edge.direction,
    percentage: signals.display.edge.percentage,
  };

  // Determine data quality
  const hasFormData = homeForm.length > 0 && awayForm.length > 0;
  const hasH2H = (enrichedData.headToHead?.length || 0) > 0;
  const dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' = 
    hasFormData && hasH2H ? 'HIGH' :
    hasFormData ? 'MEDIUM' : 'LOW';

  // Derive AIXBT narrative angle from signals
  const narrativeAngle = deriveNarrativeAngleFromSignals(signals);

  console.log('[Pipeline] Computed probabilities:', { 
    homeProb, drawProb, awayProb, 
    dataQuality, 
    confidence: signals.confidence,
    edge: strengthEdge,
    narrativeAngle,
  });

  return {
    homeWin: homeProb,
    draw: drawProb,
    awayWin: awayProb,
    strengthEdge,
    marketIntel,
    confidence: signals.confidence,
    dataQuality,
    narrativeAngle,
  };
}

// ============================================
// SPORT-AWARE SYSTEM PROMPT BUILDER
// ============================================

/**
 * Build enhanced system prompt tailored to the specific sport
 * Uses the centralized SportBot AI identity and sport-specific configuration
 */
function buildSystemPrompt(sport: string, sportKey?: string): string {
  const config = getSportConfig(sportKey || sport);
  const terminology = getSportTerminology(sportKey || sport);
  
  const sportName = config?.displayName || sport || 'Sports';
  const sportLower = sportName.toLowerCase();
  
  // Get sport-specific probability bounds and key factors
  const probabilityBounds = SPORT_PROBABILITY_BOUNDS[sportLower] || SPORT_PROBABILITY_BOUNDS.soccer;
  const keyFactors = SPORT_KEY_FACTORS[sportLower] || SPORT_KEY_FACTORS.soccer;
  
  // Build the sport context configuration
  const sportPromptConfig: SportPromptConfig = {
    sportName,
    matchTerm: terminology.matchTerm,
    participantTerm: terminology.participantTerm,
    scoringUnit: terminology.scoringUnit,
    hasDraw: terminology.hasDraw,
    typicalProbabilityRanges: probabilityBounds,
    keyAnalysisFactors: keyFactors,
  };

  // Combine core SportBot AI identity with sport-specific context
  const corePrompt = buildCoreSystemPrompt();
  const sportContext = buildSportContext(sportPromptConfig);

  return `${corePrompt}

${sportContext}

PROBABILITY DIFFERENCE INTERPRETATION (for educational context only):
- Small: <${VALIDATION_RULES.differenceThresholds.SMALL}% difference (AI and market closely aligned)
- Moderate: ${VALIDATION_RULES.differenceThresholds.SMALL}%-${VALIDATION_RULES.differenceThresholds.MODERATE}% difference (some disagreement)
- Large: >${VALIDATION_RULES.differenceThresholds.LARGE}% difference (notable difference - investigate why)

IMPORTANT: Do NOT use words like "value", "edge", "recommended", or "bet on". 
Show differences neutrally and let users draw their own conclusions.

PROBABILITY VALIDATION:
- All outcomes must sum to 100% (±${VALIDATION_RULES.probabilitySumTolerance}% rounding tolerance)
- Upset probability for heavy favorites: max ${VALIDATION_RULES.maxUpsetForHeavyFavorite}%
- Close matches minimum upset probability: ${VALIDATION_RULES.minUpsetForCloseMatch}%

EDUCATIONAL DISCLAIMER:
Core message to include: "${RESPONSIBLE_GAMBLING_MESSAGES.core}"

=== TONE INSTRUCTIONS FOR TEXT FIELDS ===

You MUST write all text fields in the AIXBT analyst personality:
- Confident, slightly sarcastic, sharp and clever
- Short, punchy sentences (no fluff)
- Use phrases like: "Predictably...", "Classic behavior...", "As if on schedule...", "Because why make it simple?"
- Sound like an elite analyst who's seen it all and isn't easily impressed
- Be witty about chaos, inconsistency, and unpredictability
- NO emojis. NO betting advice. NO hype.

SPECIFIC FIELD TONE REQUIREMENTS:
- "explanationShort": One punchy sarcastic sentence about market vs AI difference
- "explanationDetailed": 2-3 sharp sentences, can mock the chaos or predictability
- "riskExplanation": Confident assessment, sarcastic if high risk ("Chaos reigns, naturally")
- "uncertaintyFactors": List what makes this unpredictable, with slight sarcasm
- "keyFormFactors": Short punchy observations ("Defense went on vacation", "Scoring dried up predictably")
- "upsetComment": Witty take on underdog chances ("The math says no. The chaos gods say maybe.")
- "stylesSummary": Sharp tactical breakdown, no fluff
- "matchNarrative": Tell the story with attitude - what's really happening here
- "expertConclusionOneLiner": Your sharpest, most memorable one-liner verdict
- "headline": Grab attention - confident, clever, memorable
- "keyPoints": 3 punchy insights, each a sharp observation
- "verdict": The killer line - confident, quotable, analyst swagger

You must return ONLY valid JSON, no commentary, no markdown, no prose.

=== REQUIRED JSON SCHEMA ===

{
  "success": true,
  "matchInfo": {
    "sport": "<string>",
    "leagueName": "<string>",
    "matchDate": "<string ISO 8601>",
    "homeTeam": "<string>",
    "awayTeam": "<string>",
    "sourceType": "MANUAL" | "API",
    "dataQuality": "LOW" | "MEDIUM" | "HIGH"
  },
  "probabilities": {
    "homeWin": <number 0-100 | null>,
    "draw": <number 0-100 | null>,
    "awayWin": <number 0-100 | null>,
    "over": <number 0-100 | null>,
    "under": <number 0-100 | null>
  },
  "oddsComparison": {
    "marketImplied": {
      "homeWin": <number 0-100 | null>,
      "draw": <number 0-100 | null>,
      "awayWin": <number 0-100 | null>,
      "bookmakerMargin": <number percentage | null>
    },
    "aiEstimate": {
      "homeWin": <number 0-100 | null>,
      "draw": <number 0-100 | null>,
      "awayWin": <number 0-100 | null>
    },
    "comparison": {
      "homeWin": { "aiEstimate": <number>, "marketImplied": <number>, "difference": <number> },
      "draw": { "aiEstimate": <number>, "marketImplied": <number>, "difference": <number> },
      "awayWin": { "aiEstimate": <number>, "marketImplied": <number>, "difference": <number> }
    },
    "largestDifference": {
      "outcome": "HOME" | "DRAW" | "AWAY" | "NONE",
      "difference": <number absolute difference>
    },
    "explanationShort": "<string - neutral explanation of AI vs market difference>",
    "explanationDetailed": "<string - educational context about what differences mean>"
  },
  "riskAnalysis": {
    "overallRiskLevel": "LOW" | "MEDIUM" | "HIGH",
    "riskExplanation": "<string - focus on uncertainty factors, NOT betting risk>",
    "uncertaintyFactors": "<string - what makes this match hard to predict>",
    "psychologyBias": {
      "name": "<string>",
      "description": "<string>"
    }
  },
  "momentumAndForm": {
    "homeMomentumScore": <number 1-10 | null>,
    "awayMomentumScore": <number 1-10 | null>,
    "homeTrend": "RISING" | "FALLING" | "STABLE" | "UNKNOWN",
    "awayTrend": "RISING" | "FALLING" | "STABLE" | "UNKNOWN",
    "keyFormFactors": ["<string>", ...]
  },
  "marketStability": {
    "markets": {
      "main_1x2": {
        "stability": "LOW" | "MEDIUM" | "HIGH",
        "confidence": <1-5>,
        "comment": "<string>"
      },
      "over_under": {
        "stability": "LOW" | "MEDIUM" | "HIGH",
        "confidence": <1-5>,
        "comment": "<string>"
      },
      "btts": {
        "stability": "LOW" | "MEDIUM" | "HIGH",
        "confidence": <1-5>,
        "comment": "<string>"
      }
    },
    "safestMarketType": "1X2" | "OVER_UNDER" | "BTTS" | "NONE",
    "safestMarketExplanation": "<string>"
  },
  "upsetPotential": {
    "upsetProbability": <number 0-100>,
    "upsetComment": "<string>"
  },
  "tacticalAnalysis": {
    "stylesSummary": "<string>",
    "matchNarrative": "<string>",
    "keyMatchFactors": ["<string>", ...],
    "expertConclusionOneLiner": "<string>"
  },
  "userContext": {
    "userPick": "<string>",
    "userStake": <number>,
    "pickComment": "<string>"
  },
  "responsibleGambling": {
    "coreNote": "<string>",
    "tailoredNote": "<string>"
  },
  "briefing": {
    "headline": "<string 2-3 sentences summarizing the match>",
    "keyPoints": ["<string key insight 1>", "<string key insight 2>", "<string key insight 3>"],
    "verdict": "<string one-liner expert verdict>",
    "confidenceRating": <1-5>
  },
  "meta": {
    "modelVersion": "1.0.0",
    "analysisGeneratedAt": "<string ISO 8601>",
    "warnings": ["<string>", ...]
  }
}`;
}

// ============================================
// USER PROMPT BUILDER (MULTI-SPORT AWARE)
// ============================================

function buildUserPrompt(
  matchData: AnalyzeRequest['matchData'],
  userPick?: string,
  userStake?: number
): string {
  const matchDataJson = JSON.stringify(matchData, null, 2);
  
  // Get sport-specific terminology
  const terminology = getSportTerminology(matchData.sport);
  const matchTerm = terminology.matchTerm;
  const scoringUnit = terminology.scoringUnit;
  const hasDraw = terminology.hasDraw;
  
  return `Analyze the following ${matchData.sport} ${matchTerm} and return a complete JSON analysis.

=== MATCH DATA ===
${matchDataJson}

=== USER CONTEXT ===
User's Pick: ${userPick || 'None provided'}
User's Stake: ${userStake !== undefined ? userStake : 0}

=== SPORT-SPECIFIC NOTES ===
- Sport: ${matchData.sport}
- Scoring unit: ${scoringUnit}
- Draw outcome possible: ${hasDraw ? 'Yes' : 'No (set draw probability to null)'}

=== CRITICAL: WRITE WITH AIXBT ANALYST PERSONALITY ===
You are an elite, confident analyst with attitude. Write ALL text fields with:
- Sharp, punchy sentences (kill the fluff)
- Subtle sarcasm when highlighting chaos or inconsistency
- Confident swagger - you've analyzed thousands of matches
- Phrases like: "Predictably...", "Classic...", "As expected...", "Because why not?"
- Mock unpredictability: "If consistency is a virtue, neither team has heard of it"
- NO emojis, NO hype, NO betting advice

Examples of good AIXBT tone:
- BAD: "The home team has been performing well recently"
- GOOD: "Home form has been unusually competent. Naturally, that probably won't last."

- BAD: "This match is difficult to predict"  
- GOOD: "Predictability? Not today. Both sides seem committed to chaos."

- BAD: "The away team might cause an upset"
- GOOD: "The underdog narrative writes itself. Whether reality cooperates is another matter."

=== INSTRUCTIONS ===
1. Fill every field of the JSON schema.
2. If data is missing, mark quality as LOW, add warnings, and still produce a full analysis.
3. If something is critically missing (e.g. no teams), set success=false and fill the "error" field.
4. Use realistic ${matchData.sport} logic and statistical reasoning appropriate for this sport.
5. NEVER exceed the JSON schema boundaries.
6. NEVER recommend a bet.
7. Calculate implied probabilities from odds using: impliedProb = (1 / decimalOdds) * 100
8. Use "modelVersion": "1.0.0" and set "analysisGeneratedAt" to current ISO timestamp.
${!hasDraw ? '9. Since this sport typically has no draws, set draw probability to null and draw valueFlag to "NONE".' : ''}

Return ONLY the JSON object defined in the schema. No other text.`;
}

// ============================================
// MAIN POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // ========================================
    // INTERNAL API KEY CHECK (for blog generator, cron jobs)
    // ========================================
    const internalKey = request.headers.get('X-Internal-Key');
    const expectedKey = process.env.INTERNAL_API_SECRET || 'sportbot-internal-blog-generator-2024';
    const isInternalCall = internalKey && internalKey === expectedKey;
    
    // ========================================
    // RATE LIMITING CHECK (skip for internal calls)
    // ========================================
    if (!isInternalCall) {
      const clientIp = getClientIp(request);
      const rateLimit = await checkRateLimit('analyze', clientIp);
      
      if (!rateLimit.success) {
        return rateLimitResponse(rateLimit.reset);
      }
    }

    // ========================================
    // AUTHENTICATION CHECK (skip for internal calls)
    // ========================================
    let userId: string;
    
    if (isInternalCall) {
      // Internal calls use a system user ID
      userId = 'system-blog-generator';
      console.log('[Analyze] Internal API call from blog generator');
    } else {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token || !token.id) {
        return NextResponse.json(
          createErrorResponse('Authentication required. Please sign in to use the analyzer.'),
          { status: 401 }
        );
      }
      
      userId = token.id as string;
    }

    // ========================================
    // PARSE AND VALIDATE REQUEST FIRST
    // (So we can show limited preview if no credits)
    // ========================================
    const body = await request.json();
    
    // Check for forceRefresh flag (bypasses cache for testing)
    const forceRefresh = body.forceRefresh === true;
    if (forceRefresh) {
      console.log('[Cache] Force refresh requested - will bypass cache');
    }
    
    // Normalize request to standard format
    const normalizedRequest = normalizeRequest(body);
    
    // Validate minimum required fields
    const validation = validateRequest(normalizedRequest);
    if (!validation.valid) {
      return NextResponse.json(
        createErrorResponse(validation.error!),
        { status: 400 }
      );
    }

    // ========================================
    // CHECK IF MATCH IS TOO FAR AWAY (>48 HOURS)
    // ========================================
    if (normalizedRequest.matchData.matchDate) {
      const matchDate = new Date(normalizedRequest.matchData.matchDate);
      const now = new Date();
      const hoursUntilKickoff = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilKickoff > 48) {
        const daysUntilKickoff = Math.ceil(hoursUntilKickoff / 24);
        const availableDate = new Date(matchDate.getTime() - 48 * 60 * 60 * 1000);
        
        console.log(`[Analyze] Match too far away: ${hoursUntilKickoff.toFixed(1)}h (${daysUntilKickoff} days)`);
        
        return NextResponse.json({
          success: false,
          tooFarAway: true,
          hoursUntilKickoff,
          daysUntilKickoff,
          availableDate: availableDate.toISOString(),
          matchInfo: {
            homeTeam: normalizedRequest.matchData.homeTeam,
            awayTeam: normalizedRequest.matchData.awayTeam,
            league: normalizedRequest.matchData.league,
            sport: normalizedRequest.matchData.sport,
            matchDate: normalizedRequest.matchData.matchDate,
          },
          message: `Analysis available ${daysUntilKickoff} day${daysUntilKickoff > 1 ? 's' : ''} before kickoff`,
          reason: 'Our AI analysis becomes available 48 hours before kickoff when we have the most accurate data (injuries, lineups, latest odds).',
        });
      }
    }

    // ========================================
    // USAGE LIMIT CHECK (skip for internal calls)
    // ========================================
    let usageCheck: { allowed: boolean; plan: string; limit: number; remaining: number };
    
    if (isInternalCall) {
      // Internal calls have unlimited usage
      usageCheck = { allowed: true, plan: 'INTERNAL', limit: -1, remaining: -1 };
    } else {
      usageCheck = await canUserAnalyze(userId);
    }
    
    if (!usageCheck.allowed) {
      // If limit is -1 (error checking), return error
      if (usageCheck.limit === -1) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unable to check usage limits. Please try again.',
            usageInfo: {
              plan: usageCheck.plan,
              used: 0,
              limit: 0,
              remaining: 0,
            }
          },
          { status: 500 }
        );
      }
      
      // Return LIMITED PREVIEW with basic info + upgrade CTA
      // This shows the match info but hides the AI analysis
      console.log(`[Usage] User ${userId} has no credits remaining, returning limited preview`);
      
      const limitedResponse = generateLimitedPreview(normalizedRequest, {
        plan: usageCheck.plan,
        limit: usageCheck.limit,
        remaining: 0,
      });
      
      return NextResponse.json(limitedResponse, { status: 200 });
    }

    // ========================================
    // FREE USERS: Decrement credit immediately
    // PRO/PREMIUM: Credits only used for NEW (non-cached) analyses
    // ========================================
    const isFreePlan = usageCheck.plan === 'FREE';
    let creditUsedEarly = false;
    
    if (isFreePlan) {
      // FREE users always use their credit (1 analysis = 1 credit, cached or not)
      await incrementAnalysisCount(userId);
      creditUsedEarly = true;
      console.log(`[Usage] FREE user ${userId} credit used immediately (remaining: 0)`);
    }

    // Check for OpenAI API key
    const openai = getOpenAIClient();
    if (!openai) {
      console.warn('OPENAI_API_KEY not configured, using fallback analysis');
      // Still count this as an analysis (if not already counted for FREE users)
      if (!creditUsedEarly) {
        await incrementAnalysisCount(userId);
      }
      const response = generateFallbackAnalysis(normalizedRequest);
      return NextResponse.json({
        ...response,
        usageInfo: {
          plan: usageCheck.plan,
          remaining: creditUsedEarly ? 0 : usageCheck.remaining - 1,
          limit: usageCheck.limit,
        }
      });
    }

    // ========================================
    // FETCH REAL DATA (multi-sport support)
    // ========================================
    let enrichedData: MultiSportEnrichedData | null = null;
    const sportInput = normalizedRequest.matchData.sport;
    
    if (isSportSupported(sportInput)) {
      try {
        const dataSource = getDataSourceLabel(sportInput);
        const normalizedSport = normalizeSport(sportInput);
        console.log(`[${dataSource}] Fetching real data via DataLayer for ${sportInput} (normalized: ${normalizedSport})...`);
        console.log(`[${dataSource}] Teams: "${normalizedRequest.matchData.homeTeam}" vs "${normalizedRequest.matchData.awayTeam}"`);
        
        enrichedData = await getEnrichedMatchDataV2(
          normalizedRequest.matchData.homeTeam,
          normalizedRequest.matchData.awayTeam,
          normalizedSport,
          normalizedRequest.matchData.league
        );
        
        // Log what data we got back
        console.log(`[${dataSource}] Data received:`, {
          hasHomeForm: !!enrichedData.homeForm,
          homeFormLength: enrichedData.homeForm?.length || 0,
          hasAwayForm: !!enrichedData.awayForm,
          awayFormLength: enrichedData.awayForm?.length || 0,
          hasH2H: !!enrichedData.headToHead,
          h2hLength: enrichedData.headToHead?.length || 0,
          hasHomeStats: !!enrichedData.homeStats,
          hasAwayStats: !!enrichedData.awayStats,
          dataSource: enrichedData.dataSource,
        });
        
        // Log first form match for verification
        if (enrichedData.homeForm && enrichedData.homeForm.length > 0) {
          console.log(`[${dataSource}] Home form sample:`, enrichedData.homeForm[0]);
        }
        
        if (enrichedData.homeForm || enrichedData.awayForm) {
          console.log(`[${dataSource}] Real data retrieved successfully`);
        } else {
          console.log(`[${dataSource}] No data found for these teams`);
        }
      } catch (formError) {
        console.error('[API-Sports] Error fetching data:', formError);
        // Continue without enriched data - not critical
      }
    } else {
      console.log(`[API-Sports] Sport not supported for real data: ${sportInput}`);
    }

    // ========================================
    // FETCH MATCH CONTEXT (Injuries, Weather)
    // ========================================
    let matchContext: MatchContext | null = null;
    
    // Only fetch for soccer matches where we have team IDs
    if (sportInput.toLowerCase().includes('soccer') || 
        sportInput.toLowerCase().includes('football') ||
        sportInput.toLowerCase().includes('premier') ||
        sportInput.toLowerCase().includes('la_liga') ||
        sportInput.toLowerCase().includes('serie_a') ||
        sportInput.toLowerCase().includes('bundesliga') ||
        sportInput.toLowerCase().includes('ligue_1')) {
      try {
        console.log('[MatchContext] Fetching injuries and weather data...');
        matchContext = await getMatchContext(
          normalizedRequest.matchData.homeTeam,
          normalizedRequest.matchData.awayTeam,
          sportInput
        );
        console.log('[MatchContext] Context data received:', {
          homeInjuries: matchContext.homeInjuries?.length || 0,
          awayInjuries: matchContext.awayInjuries?.length || 0,
          hasWeather: !!matchContext.weather,
          hasVenue: !!matchContext.venue,
        });
      } catch (contextError) {
        console.error('[MatchContext] Error fetching context:', contextError);
        // Continue without context data - not critical
      }
    }

    // ========================================
    // FETCH REAL-TIME INTELLIGENCE (Perplexity)
    // ========================================
    let realTimeIntel: ResearchResult | null = null;
    
    const perplexity = getPerplexityClient();
    if (perplexity.isConfigured()) {
      try {
        console.log('[Perplexity] Fetching real-time intelligence...');
        realTimeIntel = await perplexity.quickResearch(
          normalizedRequest.matchData.homeTeam,
          normalizedRequest.matchData.awayTeam,
          normalizedRequest.matchData.league
        );
        
        if (realTimeIntel.success) {
          console.log('[Perplexity] Real-time intel retrieved:', {
            contentLength: realTimeIntel.content.length,
            citations: realTimeIntel.citations.length,
          });
        } else {
          console.log('[Perplexity] No intel available:', realTimeIntel.error);
        }
      } catch (perplexityError) {
        console.warn('[Perplexity] Research failed, continuing without:', perplexityError);
        // Continue without real-time intel - not critical
      }
    } else {
      console.log('[Perplexity] Not configured, skipping real-time intel');
    }

    // ========================================
    // CHECK CACHE FOR EXISTING ANALYSIS
    // ========================================
    const oddsHash = hashOdds(normalizedRequest.matchData.odds || {});
    const cacheKey = CACHE_KEYS.analysis(
      normalizedRequest.matchData.homeTeam,
      normalizedRequest.matchData.awayTeam,
      sportInput,
      oddsHash
    );
    
    let analysis: AnalyzeResponse;
    const cachedAnalysis = await cacheGet<AnalyzeResponse>(cacheKey);
    
    // Check if we have fresh form data that should override cache
    const hasNewFormData = enrichedData && (
      (enrichedData.homeForm && enrichedData.homeForm.length > 0) ||
      (enrichedData.awayForm && enrichedData.awayForm.length > 0) ||
      (enrichedData.headToHead && enrichedData.headToHead.length > 0)
    );
    
    // Check if cached analysis is missing form data
    const cachedMissingFormData = cachedAnalysis && (
      !cachedAnalysis.momentumAndForm?.homeForm?.length &&
      !cachedAnalysis.momentumAndForm?.awayForm?.length
    );
    
    // Force refresh if we have real-time intel (it's time-sensitive)
    const hasRealTimeIntel = realTimeIntel?.success && realTimeIntel?.content;
    
    // Skip cache if forceRefresh is set (for testing new features)
    if (cachedAnalysis && (!cachedMissingFormData || !hasNewFormData) && !hasRealTimeIntel && !forceRefresh) {
      console.log('[Cache] Using cached analysis');
      console.log('[Cache] Cached form data status:', {
        hasHomeForm: !!cachedAnalysis.momentumAndForm?.homeForm?.length,
        hasAwayForm: !!cachedAnalysis.momentumAndForm?.awayForm?.length,
        hasH2H: !!cachedAnalysis.momentumAndForm?.headToHead?.length,
      });
      
      analysis = cachedAnalysis;
      // Update with fresh enriched data if available
      if (enrichedData) {
        // Determine appropriate data source based on sport
        const sportLower = normalizedRequest.matchData.sport?.toLowerCase() || 'soccer';
        const dataSource = (enrichedData.homeForm?.length || enrichedData.awayForm?.length) 
          ? (sportLower === 'soccer' || sportLower === 'football' ? 'API_FOOTBALL' : 'API_SPORTS')
          : analysis.momentumAndForm.formDataSource;
        
        analysis = {
          ...analysis,
          momentumAndForm: {
            ...analysis.momentumAndForm,
            homeForm: enrichedData.homeForm || analysis.momentumAndForm.homeForm,
            awayForm: enrichedData.awayForm || analysis.momentumAndForm.awayForm,
            headToHead: enrichedData.headToHead || analysis.momentumAndForm.headToHead,
            h2hSummary: enrichedData.h2hSummary || analysis.momentumAndForm.h2hSummary,
            homeStats: enrichedData.homeStats || analysis.momentumAndForm.homeStats,
            awayStats: enrichedData.awayStats || analysis.momentumAndForm.awayStats,
            formDataSource: dataSource,
          },
        };
      }
    } else {
      // Either no cache or cache is missing form data that we now have
      if (cachedMissingFormData && hasNewFormData) {
        console.log('[Cache] Cache exists but missing form data - regenerating with new data');
      }
      if (hasRealTimeIntel) {
        console.log('[Cache] Fresh analysis with real-time intel');
      }
      
      // ========================================
      // COMPUTE PROBABILITIES (Data-2 Layer)
      // Uses mathematical models instead of LLM guessing
      // ========================================
      const computedProbs = computeProbabilities(
        enrichedData,
        normalizedRequest.matchData.odds || { home: 0, away: 0 },
        normalizedRequest.matchData.sport || 'soccer',
        normalizedRequest.matchData.homeTeam,
        normalizedRequest.matchData.awayTeam
      );
      
      if (computedProbs) {
        console.log('[Pipeline] Computed probabilities ready:', {
          home: computedProbs.homeWin,
          draw: computedProbs.draw,
          away: computedProbs.awayWin,
          edge: computedProbs.strengthEdge,
          confidence: computedProbs.confidence,
        });
      } else {
        console.log('[Pipeline] No computed probabilities (insufficient data), LLM will estimate');
      }
      
      // Call OpenAI API with sport-aware prompt, enriched data, match context, real-time intel, and computed probabilities
      console.log('[OpenAI] Generating fresh analysis...');
      analysis = await callOpenAI(openai, normalizedRequest, enrichedData, matchContext, realTimeIntel, computedProbs);
      
      // Cache the analysis for future requests (shorter TTL if real-time intel used)
      const cacheTTL = hasRealTimeIntel ? 1800 : CACHE_TTL.ANALYSIS; // 30 min if real-time, else 1 hour
      await cacheSet(cacheKey, analysis, cacheTTL);
      console.log(`[Cache] Analysis cached for ${hasRealTimeIntel ? '30 min (real-time)' : '1 hour'}`);
      
      // ========================================
      // INCREMENT USAGE COUNT (only for NEW analyses, not cached)
      // Skip if FREE user (they already had credit used earlier)
      // ========================================
      if (!creditUsedEarly) {
        await incrementAnalysisCount(userId);
        console.log('[Usage] Incremented analysis count for new analysis');
      }
    }

    // ========================================
    // SAVE TO ANALYSIS HISTORY
    // ========================================
    try {
      await prisma.analysis.create({
        data: {
          userId,
          sport: sportInput,
          league: normalizedRequest.matchData.league,
          homeTeam: normalizedRequest.matchData.homeTeam,
          awayTeam: normalizedRequest.matchData.awayTeam,
          matchDate: normalizedRequest.matchData.matchDate 
            ? new Date(normalizedRequest.matchData.matchDate) 
            : null,
          userPick: normalizedRequest.userPick || null,
          userStake: normalizedRequest.userStake || null,
          homeWinProb: analysis.probabilities.homeWin,
          drawProb: analysis.probabilities.draw,
          awayWinProb: analysis.probabilities.awayWin,
          riskLevel: analysis.riskAnalysis.overallRiskLevel,
          bestValueSide: analysis.valueAnalysis.bestValueSide,
          fullResponse: analysis as any,
        },
      });
      console.log('[History] Analysis saved to user history');
    } catch (historyError) {
      // Don't fail the request if history save fails
      console.error('[History] Failed to save analysis:', historyError);
    }

    // ========================================
    // SAVE PREDICTION FOR TRACKING
    // ========================================
    try {
      // Determine the best value prediction (what the AI recommends)
      const bestValue = analysis.valueAnalysis.bestValueSide;
      let predictionText = 'No clear value';
      let conviction = 50;
      
      if (bestValue && bestValue !== 'NONE') {
        // Map best value side to prediction text
        const bestValueMap: Record<string, string> = {
          'HOME': `${normalizedRequest.matchData.homeTeam} to win`,
          'AWAY': `${normalizedRequest.matchData.awayTeam} to win`,
          'DRAW': 'Draw',
          'OVER': 'Over goals',
          'UNDER': 'Under goals',
          'BTTS_YES': 'Both teams to score',
          'BTTS_NO': 'Clean sheet likely',
        };
        predictionText = bestValueMap[bestValue] || bestValue;
        
        // Calculate conviction from probabilities
        const probs = analysis.probabilities;
        const homeProb = probs.homeWin ?? 0;
        const awayProb = probs.awayWin ?? 0;
        const drawProb = probs.draw ?? 0;
        const maxProb = Math.max(homeProb, awayProb, drawProb);
        conviction = Math.min(95, Math.round(maxProb));
      }
      
      // Build match ID from teams and date
      const matchDate = normalizedRequest.matchData.matchDate 
        ? new Date(normalizedRequest.matchData.matchDate) 
        : new Date();
      const matchId = `${normalizedRequest.matchData.homeTeam}_${normalizedRequest.matchData.awayTeam}_${matchDate.toISOString().split('T')[0]}`.toLowerCase().replace(/\s+/g, '_');
      
      // Build reasoning from value analysis comment
      const reasoning = analysis.valueAnalysis.valueCommentShort || 
        `AI analysis of ${normalizedRequest.matchData.homeTeam} vs ${normalizedRequest.matchData.awayTeam}`;
      
      // Get implied probability for the prediction
      let impliedProb: number | null = null;
      if (bestValue === 'HOME') impliedProb = analysis.probabilities.homeWin;
      else if (bestValue === 'AWAY') impliedProb = analysis.probabilities.awayWin;
      else if (bestValue === 'DRAW') impliedProb = analysis.probabilities.draw;

      await prisma.prediction.create({
        data: {
          matchId,
          matchName: `${normalizedRequest.matchData.homeTeam} vs ${normalizedRequest.matchData.awayTeam}`,
          sport: sportInput,
          league: normalizedRequest.matchData.league,
          kickoff: matchDate,
          type: 'MATCH_RESULT',
          prediction: predictionText,
          reasoning,
          conviction,
          odds: null,
          impliedProb,
          outcome: 'PENDING',
        },
      });
      console.log('[Prediction] Prediction saved for tracking:', predictionText);
    } catch (predictionError) {
      // Don't fail the request if prediction save fails
      console.error('[Prediction] Failed to save prediction:', predictionError);
    }

    // Log final response data
    console.log('[Response] Final momentum/form data:', {
      hasHomeForm: !!analysis.momentumAndForm.homeForm,
      homeFormLength: analysis.momentumAndForm.homeForm?.length || 0,
      hasAwayForm: !!analysis.momentumAndForm.awayForm,
      awayFormLength: analysis.momentumAndForm.awayForm?.length || 0,
      hasH2H: !!analysis.momentumAndForm.headToHead,
      h2hLength: analysis.momentumAndForm.headToHead?.length || 0,
      formDataSource: analysis.momentumAndForm.formDataSource,
    });

    // Build injury context for response
    const injuryContext = buildInjuryContext(matchContext);
    if (injuryContext) {
      console.log('[Response] Injury context:', {
        overallImpact: injuryContext.overallImpact,
        homeAbsences: injuryContext.homeTeam?.players.length || 0,
        awayAbsences: injuryContext.awayTeam?.players.length || 0,
        advantageShift: injuryContext.advantageShift,
      });
    }

    // Generate pre-match insights (viral stats)
    const preMatchInsights = generatePreMatchInsights({
      homeTeam: normalizedRequest.matchData.homeTeam,
      awayTeam: normalizedRequest.matchData.awayTeam,
      homeForm: analysis.momentumAndForm.homeForm || [],
      awayForm: analysis.momentumAndForm.awayForm || [],
      h2h: analysis.momentumAndForm.headToHead || [],
      injuryContext: injuryContext,
      homeMomentumScore: analysis.momentumAndForm.homeMomentumScore,
      awayMomentumScore: analysis.momentumAndForm.awayMomentumScore,
    });
    
    console.log('[Response] Pre-match insights generated:', {
      headlines: preMatchInsights.headlines?.length || 0,
      homeStreaks: preMatchInsights.streaks?.home?.length || 0,
      awayStreaks: preMatchInsights.streaks?.away?.length || 0,
    });

    // Add usage info, injury context, and pre-match insights to response
    // For FREE users, credit was already used at the start (remaining = 0)
    // For PRO/PREMIUM, decrement from remaining if this was a new analysis
    const finalRemaining = creditUsedEarly 
      ? 0  // FREE user already used their credit
      : usageCheck.remaining - 1;  // PRO/PREMIUM - deduct 1 for new analysis
    
    return NextResponse.json({
      ...analysis,
      injuryContext: injuryContext || undefined,
      preMatchInsights,
      usageInfo: {
        plan: usageCheck.plan,
        remaining: Math.max(0, finalRemaining),
        limit: usageCheck.limit,
      }
    });

  } catch (error) {
    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: { api: 'analyze' },
      extra: { endpoint: '/api/analyze' },
    });
    
    console.error('Error in /api/analyze:', error);
    
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', error.message);
      return NextResponse.json(
        createErrorResponse(`AI service error: ${error.message}`),
        { status: 502 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
// ============================================
// REQUEST NORMALIZATION
// ============================================

function normalizeRequest(body: any): AnalyzeRequest {
  // Check if it's the new format with matchData
  if (body.matchData) {
    return {
      matchData: {
        sport: body.matchData.sport || 'Soccer',
        league: body.matchData.league || 'Unknown League',
        homeTeam: body.matchData.homeTeam || '',
        awayTeam: body.matchData.awayTeam || '',
        matchDate: body.matchData.matchDate,
        sourceType: body.matchData.sourceType || 'MANUAL',
        odds: {
          home: body.matchData.odds?.home || 0,
          draw: body.matchData.odds?.draw ?? null,
          away: body.matchData.odds?.away || 0,
        },
      },
      userPick: body.userPick,
      userStake: body.userStake,
    };
  }

  // Convert legacy format
  return {
    matchData: {
      sport: body.sport || 'Soccer',
      league: body.league || 'Unknown League',
      homeTeam: body.teamA || body.homeTeam || '',
      awayTeam: body.teamB || body.awayTeam || '',
      sourceType: 'MANUAL',
      odds: {
        home: body.odds?.home || 0,
        draw: body.odds?.draw ?? null,
        away: body.odds?.away || 0,
      },
    },
    userPick: body.userPrediction || body.userPick,
    userStake: body.stake || body.userStake,
  };
}

// ============================================
// VALIDATION
// ============================================

function validateRequest(req: AnalyzeRequest): { valid: boolean; error?: string } {
  if (!req.matchData) {
    return { valid: false, error: 'matchData is required' };
  }
  if (!req.matchData.homeTeam || !req.matchData.awayTeam) {
    return { valid: false, error: 'homeTeam and awayTeam are required' };
  }
  if (!req.matchData.odds || req.matchData.odds.home <= 0 || req.matchData.odds.away <= 0) {
    return { valid: false, error: 'Valid odds (home and away > 0) are required' };
  }
  return { valid: true };
}

// ============================================
// OPENAI API CALL (MULTI-SPORT AWARE)
// ============================================

/**
 * Format form data for the AI prompt
 */
function formatFormDataForPrompt(enrichedData: MultiSportEnrichedData): string {
  if (!enrichedData.homeForm && !enrichedData.awayForm) {
    return '';
  }

  const dataSource = enrichedData.dataSource || 'API-Sports';
  let formSection = `\n=== REAL FORM DATA (from ${dataSource}) ===\n`;
  
  if (enrichedData.homeForm && enrichedData.homeForm.length > 0) {
    formSection += `\nHome Team Recent Form:\n`;
    enrichedData.homeForm.forEach((match, idx) => {
      const venue = match.home ? 'H' : 'A';
      formSection += `  ${idx + 1}. vs ${match.opponent || 'Unknown'} (${venue}): ${match.result} (${match.score || 'N/A'}) - ${match.date || 'N/A'}\n`;
    });
  }

  if (enrichedData.awayForm && enrichedData.awayForm.length > 0) {
    formSection += `\nAway Team Recent Form:\n`;
    enrichedData.awayForm.forEach((match, idx) => {
      const venue = match.home ? 'H' : 'A';
      formSection += `  ${idx + 1}. vs ${match.opponent || 'Unknown'} (${venue}): ${match.result} (${match.score || 'N/A'}) - ${match.date || 'N/A'}\n`;
    });
  }

  if (enrichedData.headToHead && enrichedData.headToHead.length > 0) {
    formSection += `\nHead-to-Head Recent Matches:\n`;
    enrichedData.headToHead.forEach((match, idx) => {
      formSection += `  ${idx + 1}. ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} (${match.date})\n`;
    });
  }

  formSection += '\nUse this real data to inform your momentum/form analysis.\n';
  
  return formSection;
}

/**
 * Format match context (injuries, weather) for the AI prompt
 */
function formatMatchContextForPrompt(context: MatchContext | null): string {
  if (!context) return '';
  
  let contextSection = '';
  
  // Add injury information
  if ((context.homeInjuries && context.homeInjuries.length > 0) || 
      (context.awayInjuries && context.awayInjuries.length > 0)) {
    contextSection += '\n=== INJURIES & SUSPENSIONS (from API-Football) ===\n';
    
    if (context.homeInjuries && context.homeInjuries.length > 0) {
      contextSection += '\nHome Team Absences:\n';
      context.homeInjuries.forEach((injury, idx) => {
        contextSection += `  ${idx + 1}. ${injury.name} - ${injury.type} (${injury.reason})\n`;
      });
    }
    
    if (context.awayInjuries && context.awayInjuries.length > 0) {
      contextSection += '\nAway Team Absences:\n';
      context.awayInjuries.forEach((injury, idx) => {
        contextSection += `  ${idx + 1}. ${injury.name} - ${injury.type} (${injury.reason})\n`;
      });
    }
    
    contextSection += '\nFactor these absences into your probability analysis - key player injuries can significantly impact match outcomes.\n';
  }
  
  // Add weather information
  if (context.weather) {
    contextSection += '\n=== MATCH DAY WEATHER ===\n';
    contextSection += `  Conditions: ${context.weather.description}\n`;
    contextSection += `  Temperature: ${context.weather.temperature}°C\n`;
    contextSection += `  Wind: ${context.weather.windSpeed} m/s\n`;
    contextSection += `  Humidity: ${context.weather.humidity}%\n`;
    
    // Add weather impact note for extreme conditions
    if (context.weather.windSpeed > 10) {
      contextSection += '  ⚠️ High winds may affect long balls and aerial play.\n';
    }
    if (context.weather.temperature < 5 || context.weather.temperature > 30) {
      contextSection += '  ⚠️ Extreme temperature may affect player stamina and performance.\n';
    }
    if (context.weather.description.toLowerCase().includes('rain') || 
        context.weather.description.toLowerCase().includes('snow')) {
      contextSection += '  ⚠️ Wet/slippery conditions may increase unpredictability.\n';
    }
  }
  
  // Add venue information
  if (context.venue) {
    contextSection += '\n=== VENUE INFO ===\n';
    contextSection += `  Stadium: ${context.venue.name}\n`;
    contextSection += `  City: ${context.venue.city}\n`;
    if (context.venue.capacity) {
      contextSection += `  Capacity: ${context.venue.capacity.toLocaleString()}\n`;
    }
  }
  
  return contextSection;
}

/**
 * Build injury impact context from match context data
 * Estimates player importance and impact on team performance
 */
function buildInjuryContext(matchContext: MatchContext | null): InjuryContext | null {
  if (!matchContext) return null;
  
  const hasHomeInjuries = matchContext.homeInjuries && matchContext.homeInjuries.length > 0;
  const hasAwayInjuries = matchContext.awayInjuries && matchContext.awayInjuries.length > 0;
  
  if (!hasHomeInjuries && !hasAwayInjuries) return null;
  
  // Helper to estimate player importance based on position
  const estimateImportance = (position: string): PlayerImportance => {
    const pos = position.toLowerCase();
    // Goalkeepers and key positions
    if (pos.includes('goalkeeper') || pos.includes('gk')) return 'KEY';
    // Strikers and attacking mids
    if (pos.includes('forward') || pos.includes('striker') || pos.includes('attacker')) return 'KEY';
    // Defenders and midfielders
    if (pos.includes('defender') || pos.includes('midfielder')) return 'STARTER';
    return 'ROTATION';
  };
  
  // Helper to calculate impact score based on position and type
  const calculateImpactScore = (player: { position: string; type: string }): number => {
    const importance = estimateImportance(player.position);
    let baseScore = importance === 'KEY' ? 8 : importance === 'STARTER' ? 5 : 2;
    // Injuries tend to keep players out longer than suspensions
    if (player.type === 'injury') baseScore += 1;
    return Math.min(10, baseScore);
  };
  
  // Build home team injury context
  let homeContext: TeamInjuryContext | null = null;
  if (hasHomeInjuries && matchContext.homeInjuries) {
    const players: InjuredPlayerType[] = matchContext.homeInjuries.map(p => ({
      name: p.name,
      position: p.position,
      reason: p.reason,
      type: p.type as InjuredPlayerType['type'],
      importance: estimateImportance(p.position),
      impactScore: calculateImpactScore(p),
    }));
    
    const keyAbsences = players.filter(p => p.importance === 'KEY' || p.importance === 'STARTER').length;
    const totalImpactScore = Math.min(100, players.reduce((sum, p) => sum + (p.impactScore || 0), 0) * 3);
    
    homeContext = {
      players,
      totalImpactScore,
      keyAbsences,
      summary: keyAbsences > 0 
        ? `${keyAbsences} key player${keyAbsences > 1 ? 's' : ''} unavailable`
        : `${players.length} player${players.length > 1 ? 's' : ''} out (rotation)`,
    };
  }
  
  // Build away team injury context
  let awayContext: TeamInjuryContext | null = null;
  if (hasAwayInjuries && matchContext.awayInjuries) {
    const players: InjuredPlayerType[] = matchContext.awayInjuries.map(p => ({
      name: p.name,
      position: p.position,
      reason: p.reason,
      type: p.type as InjuredPlayerType['type'],
      importance: estimateImportance(p.position),
      impactScore: calculateImpactScore(p),
    }));
    
    const keyAbsences = players.filter(p => p.importance === 'KEY' || p.importance === 'STARTER').length;
    const totalImpactScore = Math.min(100, players.reduce((sum, p) => sum + (p.impactScore || 0), 0) * 3);
    
    awayContext = {
      players,
      totalImpactScore,
      keyAbsences,
      summary: keyAbsences > 0 
        ? `${keyAbsences} key player${keyAbsences > 1 ? 's' : ''} unavailable`
        : `${players.length} player${players.length > 1 ? 's' : ''} out (rotation)`,
    };
  }
  
  // Calculate overall impact
  const homeImpact = homeContext?.totalImpactScore || 0;
  const awayImpact = awayContext?.totalImpactScore || 0;
  const maxImpact = Math.max(homeImpact, awayImpact);
  
  let overallImpact: InjuryContext['overallImpact'] = 'NONE';
  if (maxImpact >= 80) overallImpact = 'CRITICAL';
  else if (maxImpact >= 50) overallImpact = 'HIGH';
  else if (maxImpact >= 25) overallImpact = 'MEDIUM';
  else if (maxImpact > 0) overallImpact = 'LOW';
  
  // Determine advantage shift
  let advantageShift: InjuryContext['advantageShift'] = 'NEUTRAL';
  const impactDiff = Math.abs(homeImpact - awayImpact);
  if (impactDiff >= 20) {
    advantageShift = homeImpact > awayImpact ? 'AWAY' : 'HOME';
  }
  
  // Build impact summary
  let impactSummary = '';
  if (overallImpact === 'CRITICAL') {
    impactSummary = 'Significant absences could heavily influence the outcome.';
  } else if (overallImpact === 'HIGH') {
    impactSummary = 'Multiple key players missing may affect team performance.';
  } else if (overallImpact === 'MEDIUM') {
    impactSummary = 'Some notable absences to consider in the analysis.';
  } else if (overallImpact === 'LOW') {
    impactSummary = 'Minor squad concerns, unlikely to significantly impact result.';
  }
  
  if (advantageShift !== 'NEUTRAL') {
    impactSummary += ` ${advantageShift === 'HOME' ? 'Home' : 'Away'} team benefits from opponent absences.`;
  }
  
  return {
    homeTeam: homeContext,
    awayTeam: awayContext,
    overallImpact,
    impactSummary,
    advantageShift,
  };
}

/**
 * Format real-time intelligence from Perplexity for the prompt
 */
function formatRealTimeIntelForPrompt(intel: ResearchResult): string {
  if (!intel.success || !intel.content) {
    return '';
  }

  return `

=== REAL-TIME INTELLIGENCE (LIVE DATA - ${intel.timestamp}) ===
The following is LIVE information from web search. Use this to inform your analysis.
This data is fresh and should take precedence over any cached or historical assumptions.

${intel.content}

${intel.citations.length > 0 ? `Sources: ${intel.citations.slice(0, 3).join(', ')}` : ''}

IMPORTANT: Incorporate this live intelligence into your analysis. If there are injury updates, lineup changes, or breaking news, factor them into your probability estimates and risk assessment.
`;
}

async function callOpenAI(
  openai: OpenAI,
  request: AnalyzeRequest,
  enrichedData?: MultiSportEnrichedData | null,
  matchContext?: MatchContext | null,
  realTimeIntel?: ResearchResult | null,
  computedProbs?: ComputedProbabilities | null
): Promise<AnalyzeResponse> {
  // Build base user prompt
  let userPrompt = buildUserPrompt(
    request.matchData,
    request.userPick,
    request.userStake
  );

  // Append real form data if available
  if (enrichedData) {
    const formDataSection = formatFormDataForPrompt(enrichedData);
    if (formDataSection) {
      userPrompt += formDataSection;
    }
  }
  
  // Append match context (injuries, weather) if available
  if (matchContext) {
    const contextSection = formatMatchContextForPrompt(matchContext);
    if (contextSection) {
      userPrompt += contextSection;
    }
  }

  // Append real-time intelligence from Perplexity
  if (realTimeIntel?.success && realTimeIntel?.content) {
    const intelSection = formatRealTimeIntelForPrompt(realTimeIntel);
    if (intelSection) {
      userPrompt += intelSection;
      console.log('[OpenAI] Added real-time intel to prompt');
    }
  }

  // CRITICAL: Inject computed probabilities and AIXBT personality as READ-ONLY values
  // This ensures LLM uses our mathematically computed probabilities
  // instead of guessing its own
  if (computedProbs) {
    const catchphrase = getAIXBTCatchphrase(computedProbs.narrativeAngle);
    const motif = getAIXBTMotif();
    
    userPrompt += `

=== PRE-COMPUTED PROBABILITIES (READ-ONLY - USE THESE EXACT VALUES) ===
The following probabilities have been computed using mathematical models
including form analysis (40% weight), win rates, goal difference, H2H, 
and market odds. YOU MUST USE THESE EXACT VALUES in your response.

HOME WIN: ${computedProbs.homeWin}%
${computedProbs.draw !== null ? `DRAW: ${computedProbs.draw}%` : 'DRAW: null (sport has no draws)'}
AWAY WIN: ${computedProbs.awayWin}%

STRENGTH EDGE: ${computedProbs.strengthEdge.direction === 'even' ? 'Even match' : `${computedProbs.strengthEdge.direction.toUpperCase()} +${computedProbs.strengthEdge.percentage}%`}
DATA QUALITY: ${computedProbs.dataQuality}
CONFIDENCE: ${computedProbs.confidence}
${computedProbs.marketIntel ? `VALUE ANALYSIS: ${computedProbs.marketIntel.summary}` : ''}

IMPORTANT: Copy these exact probability values to your probabilities object.
Do NOT recalculate or adjust them. They are based on comprehensive data analysis.

=== AIXBT PERSONALITY INJECTION ===
NARRATIVE ANGLE: ${computedProbs.narrativeAngle}
SIGNATURE CATCHPHRASE TO USE: "${catchphrase}"
RECURRING MOTIF: "${motif}"

Write your analysis in this specific narrative angle:
${getAngleGuidance(computedProbs.narrativeAngle)}

Include the catchphrase naturally in your headline or verdict. Work the motif into your narrative.
`;
    console.log('[OpenAI] Injected computed probabilities and AIXBT personality:', {
      home: computedProbs.homeWin,
      draw: computedProbs.draw,
      away: computedProbs.awayWin,
      edge: computedProbs.strengthEdge,
      narrativeAngle: computedProbs.narrativeAngle,
      catchphrase,
    });
  }

  // Build sport-aware system prompt
  const sportAwareSystemPrompt = buildSystemPrompt(
    request.matchData.sport,
    (request.matchData as any).sportKey // Optional sportKey for more precise config lookup
  );

  // Use GPT-4o for best prediction accuracy
  // GPT-4o is significantly better at sports reasoning and probability calibration
  const model = 'gpt-4o';
  
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: sportAwareSystemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2, // Lower temp for more consistent, reliable analysis
    max_tokens: 4000, // Increased for comprehensive analysis with briefing
    response_format: { type: 'json_object' },
    // Increase reliability
    top_p: 0.9,
  });

  const content = completion.choices[0]?.message?.content || '';
  
  try {
    const parsed = JSON.parse(content);
    return validateAndSanitizeResponse(parsed, request, enrichedData, computedProbs);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    return generateFallbackAnalysis(request, enrichedData);
  }
}

// ============================================
// PROBABILITY NORMALIZATION
// ============================================

interface ProbabilitySet {
  homeWin: number | null;
  draw: number | null;
  awayWin: number | null;
  over: number | null;
  under: number | null;
}

interface ThreeWayProbabilitySet {
  homeWin: number | null;
  draw: number | null;
  awayWin: number | null;
}

/**
 * Normalize 3-way probabilities (home/draw/away) to ensure they sum to 100%
 */
function normalizeThreeWayProbabilities(probs: ThreeWayProbabilitySet): ThreeWayProbabilitySet {
  const { homeWin, draw, awayWin } = probs;
  
  // Calculate sum of outcomes
  const mainSum = (homeWin || 0) + (draw || 0) + (awayWin || 0);
  
  // If sum is way off (more than 5% deviation), normalize
  if (mainSum > 0 && Math.abs(mainSum - 100) > 5) {
    const factor = 100 / mainSum;
    return {
      homeWin: homeWin !== null ? Math.round(homeWin * factor * 10) / 10 : null,
      draw: draw !== null ? Math.round(draw * factor * 10) / 10 : null,
      awayWin: awayWin !== null ? Math.round(awayWin * factor * 10) / 10 : null,
    };
  }
  
  // Minor adjustment (within 5%) - adjust the largest value to fix rounding
  if (mainSum > 0 && Math.abs(mainSum - 100) > 0.1) {
    const diff = 100 - mainSum;
    if (homeWin !== null && (draw === null || homeWin >= (draw || 0)) && (awayWin === null || homeWin >= (awayWin || 0))) {
      return { ...probs, homeWin: Math.round((homeWin + diff) * 10) / 10 };
    } else if (awayWin !== null && (draw === null || awayWin >= (draw || 0))) {
      return { ...probs, awayWin: Math.round((awayWin + diff) * 10) / 10 };
    } else if (draw !== null) {
      return { ...probs, draw: Math.round((draw + diff) * 10) / 10 };
    }
  }
  
  return probs;
}

/**
 * Normalize full probabilities including over/under to ensure 1X2 sums to 100%
 */
function normalizeProbabilities(probs: ProbabilitySet): ProbabilitySet {
  const normalized = normalizeThreeWayProbabilities({
    homeWin: probs.homeWin,
    draw: probs.draw,
    awayWin: probs.awayWin,
  });
  
  return {
    ...normalized,
    over: probs.over,
    under: probs.under,
  };
}

// ============================================
// ODDS COMPARISON BUILDER (Neutral, Educational)
// ============================================

/**
 * Build neutral odds comparison data
 * Shows AI vs Market probabilities without recommendations
 */
function buildOddsComparison(raw: any, request: AnalyzeRequest): OddsComparison {
  // Get AI estimates from response
  const aiHome = raw.probabilities?.homeWin ?? raw.oddsComparison?.aiEstimate?.homeWin ?? null;
  const aiDraw = raw.probabilities?.draw ?? raw.oddsComparison?.aiEstimate?.draw ?? null;
  const aiAway = raw.probabilities?.awayWin ?? raw.oddsComparison?.aiEstimate?.awayWin ?? null;
  
  // Calculate market-implied from odds
  const odds = request.matchData.odds;
  const impliedHome = odds.home > 0 ? (1 / odds.home) * 100 : null;
  const impliedDraw = odds.draw && odds.draw > 0 ? (1 / odds.draw) * 100 : null;
  const impliedAway = odds.away > 0 ? (1 / odds.away) * 100 : null;
  
  // Calculate bookmaker margin (overround)
  const totalImplied = (impliedHome || 0) + (impliedDraw || 0) + (impliedAway || 0);
  const bookmakerMargin = totalImplied > 0 ? totalImplied - 100 : null;
  
  // Normalize market implied to ~100%
  const normFactor = totalImplied > 0 ? 100 / totalImplied : 1;
  const normHome = impliedHome ? Math.round(impliedHome * normFactor * 10) / 10 : null;
  const normDraw = impliedDraw ? Math.round(impliedDraw * normFactor * 10) / 10 : null;
  const normAway = impliedAway ? Math.round(impliedAway * normFactor * 10) / 10 : null;
  
  // Calculate differences (AI - Market)
  const diffHome = aiHome !== null && normHome !== null ? Math.round((aiHome - normHome) * 10) / 10 : null;
  const diffDraw = aiDraw !== null && normDraw !== null ? Math.round((aiDraw - normDraw) * 10) / 10 : null;
  const diffAway = aiAway !== null && normAway !== null ? Math.round((aiAway - normAway) * 10) / 10 : null;
  
  // Find largest absolute difference
  type LargestDiff = { outcome: 'HOME' | 'DRAW' | 'AWAY' | 'NONE'; difference: number };
  let largest: LargestDiff = { outcome: 'NONE', difference: 0 };
  
  if (diffHome !== null && Math.abs(diffHome) > Math.abs(largest.difference)) {
    largest = { outcome: 'HOME', difference: diffHome };
  }
  if (diffDraw !== null && Math.abs(diffDraw) > Math.abs(largest.difference)) {
    largest = { outcome: 'DRAW', difference: diffDraw };
  }
  if (diffAway !== null && Math.abs(diffAway) > Math.abs(largest.difference)) {
    largest = { outcome: 'AWAY', difference: diffAway };
  }
  
  return {
    marketImplied: {
      homeWin: normHome,
      draw: normDraw,
      awayWin: normAway,
      bookmakerMargin: bookmakerMargin ? Math.round(bookmakerMargin * 10) / 10 : null,
    },
    aiEstimate: {
      homeWin: aiHome,
      draw: aiDraw,
      awayWin: aiAway,
    },
    comparison: {
      homeWin: { aiEstimate: aiHome, marketImplied: normHome, difference: diffHome },
      draw: { aiEstimate: aiDraw, marketImplied: normDraw, difference: diffDraw },
      awayWin: { aiEstimate: aiAway, marketImplied: normAway, difference: diffAway },
    },
    largestDifference: largest,
    explanationShort: raw.oddsComparison?.explanationShort ?? buildExplanationShort(largest),
    explanationDetailed: raw.oddsComparison?.explanationDetailed ?? buildExplanationDetailed(largest, bookmakerMargin),
  };
}

function buildExplanationShort(largest: { outcome: string; difference: number }): string {
  if (Math.abs(largest.difference) < 3) {
    return 'AI and market estimates are closely aligned.';
  }
  const direction = largest.difference > 0 ? 'higher' : 'lower';
  return `AI estimates ${largest.outcome} ${Math.abs(largest.difference).toFixed(1)}% ${direction} than market odds suggest.`;
}

function buildExplanationDetailed(largest: { outcome: string; difference: number }, margin: number | null): string {
  let explanation = 'This shows how our probability estimates compare to what bookmaker odds imply. ';
  
  if (margin !== null && margin > 5) {
    explanation += `Note: Bookmaker margin is ${margin.toFixed(1)}%, meaning odds are adjusted in their favor. `;
  }
  
  if (Math.abs(largest.difference) < 3) {
    explanation += 'The estimates are similar, suggesting market pricing aligns with our analysis.';
  } else if (Math.abs(largest.difference) < 6) {
    explanation += 'There is a moderate difference - this could reflect different information or modeling approaches.';
  } else {
    explanation += 'There is a notable difference - consider what factors might explain this gap.';
  }
  
  explanation += ' Remember: probability estimates are not predictions, and past analysis does not guarantee future accuracy.';
  
  return explanation;
}

// ============================================
// RESPONSE VALIDATION & SANITIZATION
// ============================================

function validateAndSanitizeResponse(
  raw: any,
  request: AnalyzeRequest,
  enrichedData?: MultiSportEnrichedData | null,
  computedProbs?: ComputedProbabilities | null
): AnalyzeResponse {
  const now = new Date().toISOString();
  const sport = request.matchData.sport?.toLowerCase() || 'soccer';
  
  // Check if we have real API data
  const hasRealFormData = !!(enrichedData?.homeForm || enrichedData?.awayForm);
  const hasRealStats = !!(enrichedData?.homeStats || enrichedData?.awayStats);
  const hasH2H = !!(enrichedData?.headToHead && enrichedData.headToHead.length > 0);
  const hasRealData = hasRealFormData || hasRealStats || hasH2H;
  
  // Determine form data source based on sport and data availability
  let formDataSource: string;
  if (hasRealData) {
    // Use sport-appropriate data source label
    if (sport === 'soccer' || sport === 'football') {
      formDataSource = 'API_FOOTBALL';
    } else {
      formDataSource = 'API_SPORTS';
    }
  } else {
    formDataSource = 'AI_ESTIMATE';
  }
  
  // Determine data quality - prefer pipeline-computed value
  let dataQuality: DataQuality;
  if (computedProbs) {
    dataQuality = computedProbs.dataQuality;
  } else if (hasRealFormData && hasRealStats) {
    dataQuality = 'HIGH';
  } else if (hasRealFormData || hasRealStats || hasH2H) {
    dataQuality = 'MEDIUM';
  } else {
    // Fall back to AI response or default
    dataQuality = validateDataQuality(raw.matchInfo?.dataQuality);
  }
  
  // USE COMPUTED PROBABILITIES if available (Data-2 layer overrides LLM guesses)
  const finalProbabilities = computedProbs ? {
    homeWin: computedProbs.homeWin,
    draw: computedProbs.draw,
    awayWin: computedProbs.awayWin,
    over: clampNullable(raw.probabilities?.over, 0, 100),
    under: clampNullable(raw.probabilities?.under, 0, 100),
  } : normalizeProbabilities({
    homeWin: clampNullable(raw.probabilities?.homeWin, 0, 100),
    draw: clampNullable(raw.probabilities?.draw, 0, 100),
    awayWin: clampNullable(raw.probabilities?.awayWin, 0, 100),
    over: clampNullable(raw.probabilities?.over, 0, 100),
    under: clampNullable(raw.probabilities?.under, 0, 100),
  });

  // Log when pipeline probabilities are used
  if (computedProbs) {
    console.log('[Pipeline] Using computed probabilities instead of LLM output:', {
      computed: { home: computedProbs.homeWin, draw: computedProbs.draw, away: computedProbs.awayWin },
      llmRaw: { home: raw.probabilities?.homeWin, draw: raw.probabilities?.draw, away: raw.probabilities?.awayWin },
    });
  }
  
  return {
    success: raw.success ?? true,
    
    matchInfo: {
      sport: raw.matchInfo?.sport ?? request.matchData.sport ?? 'Soccer',
      leagueName: raw.matchInfo?.leagueName ?? request.matchData.league ?? 'Unknown',
      matchDate: raw.matchInfo?.matchDate ?? request.matchData.matchDate ?? now,
      homeTeam: raw.matchInfo?.homeTeam ?? request.matchData.homeTeam,
      awayTeam: raw.matchInfo?.awayTeam ?? request.matchData.awayTeam,
      sourceType: validateSourceType(raw.matchInfo?.sourceType ?? request.matchData.sourceType),
      dataQuality: dataQuality,
    },
    
    // Use pipeline-computed probabilities when available
    probabilities: finalProbabilities,
    
    // NEW: Neutral odds comparison (educational, not recommendations)
    oddsComparison: buildOddsComparison(raw, request),
    
    // DEPRECATED: Keep for backward compatibility but don't generate new Kelly/value data
    valueAnalysis: {
      impliedProbabilities: {
        homeWin: clampNullable(raw.oddsComparison?.marketImplied?.homeWin ?? raw.valueAnalysis?.impliedProbabilities?.homeWin, 0, 100),
        draw: clampNullable(raw.oddsComparison?.marketImplied?.draw ?? raw.valueAnalysis?.impliedProbabilities?.draw, 0, 100),
        awayWin: clampNullable(raw.oddsComparison?.marketImplied?.awayWin ?? raw.valueAnalysis?.impliedProbabilities?.awayWin, 0, 100),
      },
      aiProbabilities: computedProbs ? {
        homeWin: computedProbs.homeWin,
        draw: computedProbs.draw,
        awayWin: computedProbs.awayWin,
      } : normalizeThreeWayProbabilities({
        homeWin: clampNullable(raw.oddsComparison?.aiEstimate?.homeWin ?? raw.probabilities?.homeWin, 0, 100),
        draw: clampNullable(raw.oddsComparison?.aiEstimate?.draw ?? raw.probabilities?.draw, 0, 100),
        awayWin: clampNullable(raw.oddsComparison?.aiEstimate?.awayWin ?? raw.probabilities?.awayWin, 0, 100),
      }),
      // DEPRECATED: Show NONE for all - don't categorize
      valueFlags: {
        homeWin: 'NONE' as ValueFlag,
        draw: 'NONE' as ValueFlag,
        awayWin: 'NONE' as ValueFlag,
      },
      // DEPRECATED: Don't recommend sides
      bestValueSide: 'NONE' as BestValueSide,
      // REMOVED: No Kelly stake - this is betting advice
      kellyStake: undefined,
      valueCommentShort: raw.oddsComparison?.explanationShort ?? 'See probability comparison above.',
      valueCommentDetailed: raw.oddsComparison?.explanationDetailed ?? 'Compare AI estimates with market-implied probabilities to form your own view.',
    },
    
    riskAnalysis: {
      overallRiskLevel: validateRiskLevel(raw.riskAnalysis?.overallRiskLevel),
      riskExplanation: raw.riskAnalysis?.riskExplanation ?? 'Uncertainty assessment not available.',
      bankrollImpact: raw.riskAnalysis?.uncertaintyFactors ?? raw.riskAnalysis?.bankrollImpact ?? 'Consider all factors before forming a view.',
      psychologyBias: {
        name: raw.riskAnalysis?.psychologyBias?.name ?? 'Confirmation Bias',
        description: raw.riskAnalysis?.psychologyBias?.description ?? 'Be aware of cognitive biases when interpreting match data.',
      },
    },
    
    momentumAndForm: {
      homeMomentumScore: clampNullable(raw.momentumAndForm?.homeMomentumScore, 1, 10),
      awayMomentumScore: clampNullable(raw.momentumAndForm?.awayMomentumScore, 1, 10),
      homeTrend: validateTrend(raw.momentumAndForm?.homeTrend),
      awayTrend: validateTrend(raw.momentumAndForm?.awayTrend),
      keyFormFactors: Array.isArray(raw.momentumAndForm?.keyFormFactors) 
        ? raw.momentumAndForm.keyFormFactors 
        : ['Form data not available'],
      // Real form data from API (if available)
      homeForm: enrichedData?.homeForm ?? undefined,
      awayForm: enrichedData?.awayForm ?? undefined,
      formDataSource: formDataSource as 'API_FOOTBALL' | 'API_SPORTS' | 'AI_ESTIMATE' | 'UNAVAILABLE',
      // Head-to-head data
      headToHead: enrichedData?.headToHead ?? undefined,
      h2hSummary: enrichedData?.h2hSummary ?? undefined,
      // Team statistics
      homeStats: enrichedData?.homeStats ?? undefined,
      awayStats: enrichedData?.awayStats ?? undefined,
    },
    
    marketStability: {
      markets: {
        main_1x2: validateMarketStabilityItem(raw.marketStability?.markets?.main_1x2),
        over_under: validateMarketStabilityItem(raw.marketStability?.markets?.over_under),
        btts: validateMarketStabilityItem(raw.marketStability?.markets?.btts),
      },
      safestMarketType: validateMarketType(raw.marketStability?.safestMarketType),
      safestMarketExplanation: raw.marketStability?.safestMarketExplanation ?? 'Market stability analysis not available.',
    },
    
    upsetPotential: {
      upsetProbability: clamp(raw.upsetPotential?.upsetProbability ?? 25, 0, 100),
      upsetComment: raw.upsetPotential?.upsetComment ?? 'Upset potential assessment not available.',
    },
    
    tacticalAnalysis: {
      stylesSummary: raw.tacticalAnalysis?.stylesSummary ?? 'Playing style analysis not available.',
      matchNarrative: raw.tacticalAnalysis?.matchNarrative ?? 'Match narrative not available.',
      keyMatchFactors: Array.isArray(raw.tacticalAnalysis?.keyMatchFactors)
        ? raw.tacticalAnalysis.keyMatchFactors
        : ['Key factors not available'],
      expertConclusionOneLiner: raw.tacticalAnalysis?.expertConclusionOneLiner ?? 'A match with uncertain outcome.',
    },
    
    userContext: {
      userPick: request.userPick ?? '',
      userStake: request.userStake ?? 0,
      pickComment: raw.userContext?.pickComment ?? 'No specific commentary on your selection.',
    },
    
    responsibleGambling: {
      coreNote: raw.responsibleGambling?.coreNote ?? 
        'This analysis is for educational purposes only. It does not constitute betting advice and no outcome is guaranteed.',
      tailoredNote: raw.responsibleGambling?.tailoredNote ?? 
        'Always bet responsibly and only with money you can afford to lose.',
    },
    
    // 60-Second AI Briefing (for quick consumption and sharing)
    briefing: raw.briefing ? {
      headline: raw.briefing.headline ?? `${request.matchData.homeTeam} vs ${request.matchData.awayTeam} analysis ready.`,
      keyPoints: Array.isArray(raw.briefing.keyPoints) && raw.briefing.keyPoints.length > 0
        ? raw.briefing.keyPoints.slice(0, 5) // Max 5 key points
        : ['Analysis complete', 'Check detailed sections for more', 'Consider all factors'],
      verdict: raw.briefing.verdict ?? raw.tacticalAnalysis?.expertConclusionOneLiner ?? 'See detailed analysis.',
      confidenceRating: clamp(raw.briefing.confidenceRating ?? 3, 1, 5) as 1 | 2 | 3 | 4 | 5,
    } : generateDefaultBriefing(raw, request),
    
    meta: {
      modelVersion: '1.0.0',
      analysisGeneratedAt: now,
      warnings: Array.isArray(raw.meta?.warnings) ? raw.meta.warnings : [],
    },
    
    error: raw.error,
  };
}

// ============================================
// VALIDATION HELPERS
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampNullable(value: any, min: number, max: number): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return clamp(num, min, max);
}

function validateRiskLevel(level: any): RiskLevel {
  const valid: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
  const normalized = String(level).toUpperCase();
  return valid.includes(normalized as RiskLevel) ? (normalized as RiskLevel) : 'MEDIUM';
}

function validateValueFlag(flag: any): ValueFlag {
  const valid: ValueFlag[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];
  const normalized = String(flag).toUpperCase();
  return valid.includes(normalized as ValueFlag) ? (normalized as ValueFlag) : 'NONE';
}

function validateTrend(trend: any): Trend {
  const valid: Trend[] = ['RISING', 'FALLING', 'STABLE', 'UNKNOWN'];
  const normalized = String(trend).toUpperCase();
  return valid.includes(normalized as Trend) ? (normalized as Trend) : 'UNKNOWN';
}

function validateDataQuality(quality: any): DataQuality {
  const valid: DataQuality[] = ['LOW', 'MEDIUM', 'HIGH'];
  const normalized = String(quality).toUpperCase();
  return valid.includes(normalized as DataQuality) ? (normalized as DataQuality) : 'MEDIUM';
}

function validateSourceType(source: any): 'MANUAL' | 'API' {
  return source === 'API' ? 'API' : 'MANUAL';
}

function validateBestValueSide(side: any): BestValueSide {
  const valid: BestValueSide[] = ['HOME', 'DRAW', 'AWAY', 'NONE'];
  const normalized = String(side).toUpperCase();
  return valid.includes(normalized as BestValueSide) ? (normalized as BestValueSide) : 'NONE';
}

function validateMarketType(type: any): MarketType {
  const valid: MarketType[] = ['1X2', 'OVER_UNDER', 'BTTS', 'NONE'];
  const normalized = String(type).toUpperCase();
  return valid.includes(normalized as MarketType) ? (normalized as MarketType) : 'NONE';
}

function validateMarketStabilityItem(item: any): { stability: RiskLevel; confidence: MarketConfidence; comment: string } {
  return {
    stability: validateRiskLevel(item?.stability),
    confidence: clamp(item?.confidence ?? 3, 1, 5) as MarketConfidence,
    comment: item?.comment ?? 'Market analysis not available.',
  };
}

// ============================================
// GENERATE DEFAULT BRIEFING (when AI doesn't provide one)
// ============================================

function generateDefaultBriefing(raw: any, request: AnalyzeRequest): AIBriefing {
  const homeTeam = request.matchData.homeTeam;
  const awayTeam = request.matchData.awayTeam;
  const homeWin = raw.probabilities?.homeWin || 0;
  const awayWin = raw.probabilities?.awayWin || 0;
  const riskLevel = raw.riskAnalysis?.overallRiskLevel || 'MEDIUM';
  const bestValue = raw.valueAnalysis?.bestValueSide || 'NONE';
  
  // Determine favorite
  const favorite = homeWin > awayWin ? homeTeam : awayTeam;
  const favoriteProb = Math.max(homeWin, awayWin);
  const isClose = Math.abs(homeWin - awayWin) < 15;
  
  // Build headline
  let headline = '';
  if (isClose) {
    headline = `Evenly matched contest between ${homeTeam} and ${awayTeam}. `;
  } else {
    headline = `${favorite} enters as favorite with ${favoriteProb}% win probability. `;
  }
  headline += riskLevel === 'HIGH' 
    ? 'High uncertainty factors present.' 
    : riskLevel === 'LOW' 
      ? 'Relatively predictable match profile.'
      : 'Standard risk levels detected.';
  
  // Build key points from analysis
  const keyPoints: string[] = [];
  
  // Add probability insight
  keyPoints.push(`${homeTeam} ${homeWin}% vs ${awayTeam} ${awayWin}%`);
  
  // Add form insight if available
  if (raw.momentumAndForm?.keyFormFactors?.length > 0) {
    keyPoints.push(raw.momentumAndForm.keyFormFactors[0]);
  }
  
  // Add value insight
  if (bestValue !== 'NONE') {
    keyPoints.push(`Best value detected: ${bestValue}`);
  } else {
    keyPoints.push('No significant value edges identified');
  }
  
  // Add risk insight
  keyPoints.push(`Risk level: ${riskLevel}`);
  
  // Ensure at least 3 points
  while (keyPoints.length < 3) {
    keyPoints.push('See detailed analysis for more insights');
  }
  
  // Calculate confidence rating based on data quality and risk
  let confidenceRating: 1 | 2 | 3 | 4 | 5 = 3;
  const dataQuality = raw.matchInfo?.dataQuality || 'MEDIUM';
  if (dataQuality === 'HIGH' && riskLevel === 'LOW') confidenceRating = 5;
  else if (dataQuality === 'HIGH') confidenceRating = 4;
  else if (dataQuality === 'MEDIUM' && riskLevel !== 'HIGH') confidenceRating = 3;
  else if (riskLevel === 'HIGH') confidenceRating = 2;
  else confidenceRating = 3;
  
  return {
    headline,
    keyPoints: keyPoints.slice(0, 5),
    verdict: raw.tacticalAnalysis?.expertConclusionOneLiner || `${favorite} slight edge, proceed with caution.`,
    confidenceRating,
  };
}

// ============================================
// LIMITED PREVIEW RESPONSE (No credits remaining)
// ============================================

/**
 * Generate a limited preview for users who have exhausted their free credits.
 * Shows basic match info with a clear upgrade CTA.
 */
function generateLimitedPreview(
  request: AnalyzeRequest,
  usageInfo: { plan: string; limit: number; remaining: number }
): AnalyzeResponse & { limitedPreview: true; upgradeRequired: true } {
  const now = new Date().toISOString();
  const { matchData } = request;

  // Calculate implied probabilities from odds (this is public info)
  const homeOdds = matchData.odds.home || 2;
  const drawOdds = matchData.odds.draw || null;
  const awayOdds = matchData.odds.away || 2;

  const impliedHome = Math.round((1 / homeOdds) * 100);
  const impliedDraw = drawOdds ? Math.round((1 / drawOdds) * 100) : null;
  const impliedAway = Math.round((1 / awayOdds) * 100);

  // Determine favorite based on odds
  const favorite = homeOdds < awayOdds ? matchData.homeTeam : matchData.awayTeam;
  const underdog = homeOdds < awayOdds ? matchData.awayTeam : matchData.homeTeam;

  return {
    success: true,
    limitedPreview: true,
    upgradeRequired: true,
    matchInfo: {
      sport: matchData.sport,
      leagueName: matchData.league,
      matchDate: matchData.matchDate || now,
      homeTeam: matchData.homeTeam,
      awayTeam: matchData.awayTeam,
      sourceType: matchData.sourceType || 'MANUAL',
      dataQuality: 'LOW',
    },
    probabilities: {
      homeWin: null,  // Hidden - requires upgrade
      draw: null,
      awayWin: null,
      over: null,
      under: null,
    },
    valueAnalysis: {
      impliedProbabilities: { 
        homeWin: impliedHome, 
        draw: impliedDraw, 
        awayWin: impliedAway 
      },
      aiProbabilities: { homeWin: null, draw: null, awayWin: null }, // Hidden
      valueFlags: { homeWin: 'NONE', draw: 'NONE', awayWin: 'NONE' },
      bestValueSide: 'NONE',
      kellyStake: null,
      valueCommentShort: '🔒 Upgrade to Pro for full AI analysis',
      valueCommentDetailed: `You've used your free analysis for today. Upgrade to Pro for unlimited access to AI probability estimates, form analysis, and tactical insights.`,
    },
    riskAnalysis: {
      overallRiskLevel: 'MEDIUM',
      riskExplanation: '🔒 Risk analysis available with Pro plan',
      bankrollImpact: 'Upgrade for detailed bankroll recommendations.',
      psychologyBias: { name: 'N/A', description: 'Upgrade to unlock.' },
    },
    momentumAndForm: {
      homeMomentumScore: null,
      awayMomentumScore: null,
      homeTrend: 'UNKNOWN',
      awayTrend: 'UNKNOWN',
      keyFormFactors: ['🔒 Form analysis available with Pro plan'],
    },
    marketStability: {
      markets: {
        main_1x2: { stability: 'MEDIUM', confidence: 1, comment: '🔒 Upgrade for insights' },
        over_under: { stability: 'MEDIUM', confidence: 1, comment: '🔒 Upgrade for insights' },
        btts: { stability: 'MEDIUM', confidence: 1, comment: '🔒 Upgrade for insights' },
      },
      safestMarketType: 'NONE',
      safestMarketExplanation: '🔒 Market analysis requires Pro plan',
    },
    upsetPotential: {
      upsetProbability: 0,
      upsetComment: '🔒 Upset analysis available with Pro plan',
    },
    tacticalAnalysis: {
      stylesSummary: `${matchData.homeTeam} vs ${matchData.awayTeam} - Basic preview`,
      matchNarrative: `Based on the odds, ${favorite} is favored over ${underdog}. Upgrade to Pro for full tactical analysis, form data, head-to-head stats, and AI insights.`,
      keyMatchFactors: [
        `⚽ ${matchData.homeTeam} vs ${matchData.awayTeam}`,
        `📊 Implied favorite: ${favorite}`,
        '🔒 Unlock full analysis with Pro',
      ],
      expertConclusionOneLiner: '🔒 Expert verdict available with Pro plan',
    },
    userContext: {
      userPick: request.userPick || '',
      userStake: request.userStake || 0,
      pickComment: 'Upgrade for personalized pick analysis.',
    },
    responsibleGambling: {
      coreNote: 'This preview is for educational purposes only.',
      tailoredNote: 'Remember: gambling involves risk. Always bet responsibly.',
    },
    briefing: {
      headline: `${matchData.homeTeam} vs ${matchData.awayTeam} - Upgrade for full analysis`,
      keyPoints: [
        `Market favorite: ${favorite}`,
        `Implied probabilities: ${impliedHome}% / ${impliedDraw || '-'}% / ${impliedAway}%`,
        '🔒 Full AI analysis requires Pro plan',
      ],
      verdict: '🔒 Upgrade to Pro for AI verdict',
      confidenceRating: 1,
    },
    meta: {
      modelVersion: '1.0.0',
      analysisGeneratedAt: now,
      warnings: [
        'This is a limited preview. Upgrade to Pro for full analysis.',
        'AI probability estimates and form data require Pro subscription.',
      ],
    },
    usageInfo: {
      plan: usageInfo.plan,
      remaining: 0,
      limit: usageInfo.limit,
    },
  };
}

// ============================================
// ERROR RESPONSE
// ============================================

function createErrorResponse(error: string): AnalyzeResponse {
  const now = new Date().toISOString();
  
  return {
    success: false,
    matchInfo: {
      sport: 'Unknown',
      leagueName: 'Unknown',
      matchDate: now,
      homeTeam: 'Unknown',
      awayTeam: 'Unknown',
      sourceType: 'MANUAL',
      dataQuality: 'LOW',
    },
    probabilities: {
      homeWin: null,
      draw: null,
      awayWin: null,
      over: null,
      under: null,
    },
    valueAnalysis: {
      impliedProbabilities: { homeWin: null, draw: null, awayWin: null },
      aiProbabilities: { homeWin: null, draw: null, awayWin: null },
      valueFlags: { homeWin: 'NONE', draw: 'NONE', awayWin: 'NONE' },
      bestValueSide: 'NONE',
      kellyStake: null,
      valueCommentShort: 'Analysis unavailable.',
      valueCommentDetailed: 'Analysis unavailable.',
    },
    riskAnalysis: {
      overallRiskLevel: 'HIGH',
      riskExplanation: 'Unable to assess risk due to error.',
      bankrollImpact: 'Exercise caution.',
      psychologyBias: { name: 'N/A', description: 'N/A' },
    },
    momentumAndForm: {
      homeMomentumScore: null,
      awayMomentumScore: null,
      homeTrend: 'UNKNOWN',
      awayTrend: 'UNKNOWN',
      keyFormFactors: [],
    },
    marketStability: {
      markets: {
        main_1x2: { stability: 'LOW', confidence: 1, comment: 'N/A' },
        over_under: { stability: 'LOW', confidence: 1, comment: 'N/A' },
        btts: { stability: 'LOW', confidence: 1, comment: 'N/A' },
      },
      safestMarketType: 'NONE',
      safestMarketExplanation: 'N/A',
    },
    upsetPotential: {
      upsetProbability: 0,
      upsetComment: 'N/A',
    },
    tacticalAnalysis: {
      stylesSummary: 'N/A',
      matchNarrative: 'N/A',
      keyMatchFactors: [],
      expertConclusionOneLiner: 'Analysis unavailable.',
    },
    userContext: {
      userPick: '',
      userStake: 0,
      pickComment: 'N/A',
    },
    responsibleGambling: {
      coreNote: 'This analysis is for educational purposes only.',
      tailoredNote: 'Always bet responsibly.',
    },
    meta: {
      modelVersion: '1.0.0',
      analysisGeneratedAt: now,
      warnings: ['Analysis failed due to an error.'],
    },
    error,
  };
}

// ============================================
// FALLBACK ANALYSIS (NO OPENAI)
// ============================================

function generateFallbackAnalysis(
  request: AnalyzeRequest,
  enrichedData?: MultiSportEnrichedData | null
): AnalyzeResponse {
  const now = new Date().toISOString();
  const { matchData, userPick, userStake } = request;

  // Calculate implied probabilities from odds
  const homeOdds = matchData.odds.home || 2;
  const drawOdds = matchData.odds.draw || 3.5;
  const awayOdds = matchData.odds.away || 2;

  const impliedHome = (1 / homeOdds) * 100;
  const impliedDraw = drawOdds ? (1 / drawOdds) * 100 : null;
  const impliedAway = (1 / awayOdds) * 100;

  // Normalize to ~100%
  const total = impliedHome + (impliedDraw || 0) + impliedAway;
  const margin = total - 100;

  const homeWin = Math.round(impliedHome * (100 / total));
  const draw = impliedDraw ? Math.round(impliedDraw * (100 / total)) : null;
  const awayWin = Math.round(impliedAway * (100 / total));

  // Determine risk level
  let riskLevel: RiskLevel = 'MEDIUM';
  const maxOdds = Math.max(homeOdds, awayOdds);
  if (maxOdds > 3.5) riskLevel = 'HIGH';
  else if (maxOdds < 1.8) riskLevel = 'LOW';

  // Determine favorite and underdog
  const homeFavorite = homeOdds < awayOdds;
  const upsetProb = homeFavorite ? awayWin : homeWin;
  
  // Determine form data source
  const hasRealFormData = enrichedData?.homeForm || enrichedData?.awayForm;
  const formDataSource = hasRealFormData ? 'API_FOOTBALL' : 'UNAVAILABLE';

  return {
    success: true,
    
    matchInfo: {
      sport: matchData.sport || 'Soccer',
      leagueName: matchData.league || 'Unknown League',
      matchDate: matchData.matchDate || now,
      homeTeam: matchData.homeTeam,
      awayTeam: matchData.awayTeam,
      sourceType: matchData.sourceType || 'MANUAL',
      dataQuality: 'LOW',
    },
    
    probabilities: {
      homeWin,
      draw,
      awayWin,
      over: null,
      under: null,
    },
    
    valueAnalysis: {
      impliedProbabilities: {
        homeWin: Math.round(impliedHome * 100) / 100,
        draw: impliedDraw ? Math.round(impliedDraw * 100) / 100 : null,
        awayWin: Math.round(impliedAway * 100) / 100,
      },
      aiProbabilities: {
        homeWin,
        draw,
        awayWin,
      },
      valueFlags: {
        homeWin: 'NONE',
        draw: 'NONE',
        awayWin: 'NONE',
      },
      bestValueSide: 'NONE',
      kellyStake: null,
      valueCommentShort: `Analysis based on odds only. Bookmaker margin: ${margin.toFixed(1)}%.`,
      valueCommentDetailed: 'This is a fallback analysis based solely on provided odds. For detailed AI analysis, ensure the OpenAI API key is configured.',
    },
    
    riskAnalysis: {
      overallRiskLevel: riskLevel,
      riskExplanation: `Risk level determined by odds spread. Maximum odds: ${maxOdds.toFixed(2)}.`,
      bankrollImpact: 'Without detailed analysis, consider reducing stake size.',
      psychologyBias: {
        name: 'Insufficient Data Bias',
        description: 'Be cautious when making decisions with limited information.',
      },
    },
    
    momentumAndForm: {
      homeMomentumScore: null,
      awayMomentumScore: null,
      homeTrend: 'UNKNOWN',
      awayTrend: 'UNKNOWN',
      keyFormFactors: ['Form data not available in fallback mode'],
      // Real form data from API (if available)
      homeForm: enrichedData?.homeForm ?? undefined,
      awayForm: enrichedData?.awayForm ?? undefined,
      formDataSource: formDataSource as 'API_FOOTBALL' | 'API_SPORTS' | 'AI_ESTIMATE' | 'UNAVAILABLE',
      // Head-to-head data
      headToHead: enrichedData?.headToHead ?? undefined,
      h2hSummary: enrichedData?.h2hSummary ?? undefined,
      // Team statistics
      homeStats: enrichedData?.homeStats ?? undefined,
      awayStats: enrichedData?.awayStats ?? undefined,
    },
    
    marketStability: {
      markets: {
        main_1x2: { stability: 'MEDIUM', confidence: 2, comment: 'Basic odds-based assessment' },
        over_under: { stability: 'LOW', confidence: 1, comment: 'No over/under analysis available' },
        btts: { stability: 'LOW', confidence: 1, comment: 'No BTTS analysis available' },
      },
      safestMarketType: 'NONE',
      safestMarketExplanation: 'Insufficient data to recommend a specific market.',
    },
    
    upsetPotential: {
      upsetProbability: upsetProb || 30,
      upsetComment: `Based on odds, the underdog has approximately ${upsetProb}% chance of winning.`,
    },
    
    tacticalAnalysis: {
      stylesSummary: 'Tactical analysis requires AI processing.',
      matchNarrative: `${matchData.homeTeam} vs ${matchData.awayTeam} - detailed narrative unavailable in fallback mode.`,
      keyMatchFactors: ['Odds-based analysis only', 'No form or tactical data available'],
      expertConclusionOneLiner: 'A match requiring further analysis for confident assessment.',
    },
    
    userContext: {
      userPick: userPick ?? '',
      userStake: userStake ?? 0,
      pickComment: userPick 
        ? 'Your selection has been noted. Consider the limited analysis available.'
        : 'No selection provided.',
    },
    
    responsibleGambling: {
      coreNote: 'This analysis is for educational purposes only. It does not constitute betting advice and no outcome is guaranteed.',
      tailoredNote: userStake 
        ? `With a €${userStake} stake, ensure this is within your entertainment budget.`
        : 'Always bet responsibly and only with money you can afford to lose.',
    },
    
    // Fallback briefing
    briefing: {
      headline: `${matchData.homeTeam} vs ${matchData.awayTeam} - Odds-based analysis. AI analysis temporarily unavailable.`,
      keyPoints: [
        `Home: ${homeWin}% | Away: ${awayWin}%${draw ? ` | Draw: ${draw}%` : ''}`,
        `Bookmaker margin: ${margin.toFixed(1)}%`,
        'Limited data - exercise caution',
      ],
      verdict: 'Fallback analysis - consider waiting for full AI processing.',
      confidenceRating: 2,
    },
    
    meta: {
      modelVersion: '1.0.0',
      analysisGeneratedAt: now,
      warnings: [
        'AI analysis unavailable - using fallback odds-based calculation',
        'Limited data quality - exercise additional caution',
      ],
    },
  };
}
