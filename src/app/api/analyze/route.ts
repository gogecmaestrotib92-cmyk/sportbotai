/**
 * API Route: /api/analyze
 * 
 * AI-powered multi-sport match analysis endpoint.
 * Returns analysis strictly following the FINAL JSON schema.
 * 
 * Supports: Soccer, NBA, NFL, Tennis, NHL, MMA, MLB, and more.
 * 
 * AUTHENTICATION & LIMITS:
 * - Requires authenticated user session
 * - Enforces plan-based usage limits (FREE: 3/day, PRO: 30/day, PREMIUM: unlimited)
 * 
 * REAL DATA INTEGRATION:
 * - Fetches real team form from API-Football when available (soccer)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import OpenAI from 'openai';
import {
  AnalyzeRequest,
  AnalyzeResponse,
  RiskLevel,
  ValueFlag,
  Trend,
  DataQuality,
  BestValueSide,
  MarketType,
  MarketConfidence,
  FormMatch,
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
import { getEnrichedMatchData, EnrichedMatchData } from '@/lib/football-api';

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
// SPORT-AWARE SYSTEM PROMPT BUILDER
// ============================================

/**
 * Build enhanced system prompt tailored to the specific sport
 * Uses the centralized BetSense AI identity and sport-specific configuration
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

  // Combine core BetSense AI identity with sport-specific context
  const corePrompt = buildCoreSystemPrompt();
  const sportContext = buildSportContext(sportPromptConfig);

  return `${corePrompt}

${sportContext}

VALUE FLAG THRESHOLDS (based on AI vs Implied probability difference):
- NONE: <${VALIDATION_RULES.valueFlagThresholds.NONE}% difference
- LOW: ${VALIDATION_RULES.valueFlagThresholds.NONE}%-${VALIDATION_RULES.valueFlagThresholds.LOW}% difference
- MEDIUM: ${VALIDATION_RULES.valueFlagThresholds.LOW}%-${VALIDATION_RULES.valueFlagThresholds.MEDIUM}% difference
- HIGH: >${VALIDATION_RULES.valueFlagThresholds.HIGH}% difference

PROBABILITY VALIDATION:
- All outcomes must sum to 100% (±${VALIDATION_RULES.probabilitySumTolerance}% rounding tolerance)
- Upset probability for heavy favorites: max ${VALIDATION_RULES.maxUpsetForHeavyFavorite}%
- Close matches minimum upset probability: ${VALIDATION_RULES.minUpsetForCloseMatch}%

RESPONSIBLE GAMBLING:
Core message to include: "${RESPONSIBLE_GAMBLING_MESSAGES.core}"

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
  "valueAnalysis": {
    "impliedProbabilities": {
      "homeWin": <number 0-100 | null>,
      "draw": <number 0-100 | null>,
      "awayWin": <number 0-100 | null>
    },
    "aiProbabilities": {
      "homeWin": <number 0-100 | null>,
      "draw": <number 0-100 | null>,
      "awayWin": <number 0-100 | null>
    },
    "valueFlags": {
      "homeWin": "NONE" | "LOW" | "MEDIUM" | "HIGH",
      "draw": "NONE" | "LOW" | "MEDIUM" | "HIGH",
      "awayWin": "NONE" | "LOW" | "MEDIUM" | "HIGH"
    },
    "bestValueSide": "HOME" | "DRAW" | "AWAY" | "NONE",
    "kellyStake": {
      "fullKelly": <number percentage>,
      "halfKelly": <number percentage>,
      "quarterKelly": <number percentage>,
      "edge": <number percentage>,
      "confidence": "LOW" | "MEDIUM" | "HIGH"
    } | null,
    "valueCommentShort": "<string>",
    "valueCommentDetailed": "<string>"
  },
  "riskAnalysis": {
    "overallRiskLevel": "LOW" | "MEDIUM" | "HIGH",
    "riskExplanation": "<string>",
    "bankrollImpact": "<string>",
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
    // AUTHENTICATION CHECK
    // ========================================
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

    const userId = token.id as string;

    // ========================================
    // USAGE LIMIT CHECK
    // ========================================
    const usageCheck = await canUserAnalyze(userId);
    
    if (!usageCheck.allowed) {
      const limitMessage = usageCheck.limit === -1 
        ? 'Unable to check usage limits. Please try again.'
        : `Daily limit reached (${usageCheck.limit} analyses). Upgrade your plan for more analyses.`;
      
      return NextResponse.json(
        {
          success: false,
          error: limitMessage,
          usageInfo: {
            plan: usageCheck.plan,
            used: usageCheck.limit - usageCheck.remaining,
            limit: usageCheck.limit,
            remaining: 0,
          }
        },
        { status: 429 }
      );
    }

    // ========================================
    // PARSE AND VALIDATE REQUEST
    // ========================================
    const body = await request.json();
    
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

    // Check for OpenAI API key
    const openai = getOpenAIClient();
    if (!openai) {
      console.warn('OPENAI_API_KEY not configured, using fallback analysis');
      // Still count this as an analysis
      await incrementAnalysisCount(userId);
      const response = generateFallbackAnalysis(normalizedRequest);
      return NextResponse.json({
        ...response,
        usageInfo: {
          plan: usageCheck.plan,
          remaining: usageCheck.remaining - 1,
          limit: usageCheck.limit,
        }
      });
    }

    // ========================================
    // FETCH REAL FORM DATA (for soccer only)
    // ========================================
    let enrichedData: EnrichedMatchData | null = null;
    
    if (isSoccerSport(normalizedRequest.matchData.sport)) {
      try {
        console.log('[API-Football] Fetching real form data for soccer match...');
        enrichedData = await getEnrichedMatchData(
          normalizedRequest.matchData.homeTeam,
          normalizedRequest.matchData.awayTeam,
          normalizedRequest.matchData.league
        );
        
        if (enrichedData.homeForm || enrichedData.awayForm) {
          console.log('[API-Football] Real form data retrieved successfully');
        } else {
          console.log('[API-Football] No form data found for these teams');
        }
      } catch (formError) {
        console.error('[API-Football] Error fetching form data:', formError);
        // Continue without form data - not critical
      }
    }

    // Call OpenAI API with sport-aware prompt and enriched data
    const analysis = await callOpenAI(openai, normalizedRequest, enrichedData);
    
    // ========================================
    // INCREMENT USAGE COUNT (only on success)
    // ========================================
    await incrementAnalysisCount(userId);

    // Add usage info to response
    return NextResponse.json({
      ...analysis,
      usageInfo: {
        plan: usageCheck.plan,
        remaining: usageCheck.remaining - 1,
        limit: usageCheck.limit,
      }
    });

  } catch (error) {
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
 * Check if the sport is soccer (API-Football supports soccer/football only)
 */
function isSoccerSport(sport: string): boolean {
  const soccerTerms = ['soccer', 'football', 'soccer_', 'futbol'];
  const sportLower = sport.toLowerCase();
  return soccerTerms.some(term => sportLower.includes(term));
}

/**
 * Format form data for the AI prompt
 */
function formatFormDataForPrompt(enrichedData: EnrichedMatchData): string {
  if (!enrichedData.homeForm && !enrichedData.awayForm) {
    return '';
  }

  let formSection = '\n=== REAL FORM DATA (from API-Football) ===\n';
  
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

async function callOpenAI(
  openai: OpenAI,
  request: AnalyzeRequest,
  enrichedData?: EnrichedMatchData | null
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

  // Build sport-aware system prompt
  const sportAwareSystemPrompt = buildSystemPrompt(
    request.matchData.sport,
    (request.matchData as any).sportKey // Optional sportKey for more precise config lookup
  );

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sportAwareSystemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '';
  
  try {
    const parsed = JSON.parse(content);
    return validateAndSanitizeResponse(parsed, request, enrichedData);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    return generateFallbackAnalysis(request, enrichedData);
  }
}

// ============================================
// RESPONSE VALIDATION & SANITIZATION
// ============================================

function validateAndSanitizeResponse(
  raw: any,
  request: AnalyzeRequest,
  enrichedData?: EnrichedMatchData | null
): AnalyzeResponse {
  const now = new Date().toISOString();
  
  // Determine form data source
  const formDataSource = enrichedData?.homeForm || enrichedData?.awayForm 
    ? 'API_FOOTBALL' 
    : 'AI_ESTIMATE';
  
  return {
    success: raw.success ?? true,
    
    matchInfo: {
      sport: raw.matchInfo?.sport ?? request.matchData.sport ?? 'Soccer',
      leagueName: raw.matchInfo?.leagueName ?? request.matchData.league ?? 'Unknown',
      matchDate: raw.matchInfo?.matchDate ?? request.matchData.matchDate ?? now,
      homeTeam: raw.matchInfo?.homeTeam ?? request.matchData.homeTeam,
      awayTeam: raw.matchInfo?.awayTeam ?? request.matchData.awayTeam,
      sourceType: validateSourceType(raw.matchInfo?.sourceType ?? request.matchData.sourceType),
      dataQuality: validateDataQuality(raw.matchInfo?.dataQuality),
    },
    
    probabilities: {
      homeWin: clampNullable(raw.probabilities?.homeWin, 0, 100),
      draw: clampNullable(raw.probabilities?.draw, 0, 100),
      awayWin: clampNullable(raw.probabilities?.awayWin, 0, 100),
      over: clampNullable(raw.probabilities?.over, 0, 100),
      under: clampNullable(raw.probabilities?.under, 0, 100),
    },
    
    valueAnalysis: {
      impliedProbabilities: {
        homeWin: clampNullable(raw.valueAnalysis?.impliedProbabilities?.homeWin, 0, 100),
        draw: clampNullable(raw.valueAnalysis?.impliedProbabilities?.draw, 0, 100),
        awayWin: clampNullable(raw.valueAnalysis?.impliedProbabilities?.awayWin, 0, 100),
      },
      aiProbabilities: {
        homeWin: clampNullable(raw.valueAnalysis?.aiProbabilities?.homeWin ?? raw.probabilities?.homeWin, 0, 100),
        draw: clampNullable(raw.valueAnalysis?.aiProbabilities?.draw ?? raw.probabilities?.draw, 0, 100),
        awayWin: clampNullable(raw.valueAnalysis?.aiProbabilities?.awayWin ?? raw.probabilities?.awayWin, 0, 100),
      },
      valueFlags: {
        homeWin: validateValueFlag(raw.valueAnalysis?.valueFlags?.homeWin),
        draw: validateValueFlag(raw.valueAnalysis?.valueFlags?.draw),
        awayWin: validateValueFlag(raw.valueAnalysis?.valueFlags?.awayWin),
      },
      bestValueSide: validateBestValueSide(raw.valueAnalysis?.bestValueSide),
      kellyStake: raw.valueAnalysis?.kellyStake ?? null,
      valueCommentShort: raw.valueAnalysis?.valueCommentShort ?? 'No value assessment available.',
      valueCommentDetailed: raw.valueAnalysis?.valueCommentDetailed ?? 'Detailed analysis not available.',
    },
    
    riskAnalysis: {
      overallRiskLevel: validateRiskLevel(raw.riskAnalysis?.overallRiskLevel),
      riskExplanation: raw.riskAnalysis?.riskExplanation ?? 'Risk assessment not available.',
      bankrollImpact: raw.riskAnalysis?.bankrollImpact ?? 'Consider your bankroll limits.',
      psychologyBias: {
        name: raw.riskAnalysis?.psychologyBias?.name ?? 'General Caution',
        description: raw.riskAnalysis?.psychologyBias?.description ?? 'Be aware of cognitive biases when analyzing matches.',
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
      // Real form data from API-Football (if available)
      homeForm: enrichedData?.homeForm ?? undefined,
      awayForm: enrichedData?.awayForm ?? undefined,
      formDataSource: formDataSource as 'API_FOOTBALL' | 'AI_ESTIMATE' | 'UNAVAILABLE',
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
  enrichedData?: EnrichedMatchData | null
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
      // Real form data from API-Football (if available)
      homeForm: enrichedData?.homeForm ?? undefined,
      awayForm: enrichedData?.awayForm ?? undefined,
      formDataSource: formDataSource as 'API_FOOTBALL' | 'AI_ESTIMATE' | 'UNAVAILABLE',
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
