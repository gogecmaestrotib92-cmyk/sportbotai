/**
 * Accuracy Core - Main Pipeline
 * 
 * This is the single entry point for all match analysis.
 * It orchestrates all 5 modules in the correct order:
 * 
 * 1. Market Probabilities (vig removal)
 * 2. Prediction Model (sport-specific)
 * 3. Calibration Layer
 * 4. Edge Quality Filter
 * 5. Prediction Logging
 * 6. Advanced Features (situational, ensemble, CLV)
 * 
 * The output is a clean PipelineOutput that the LLM receives READ-ONLY.
 * 
 * ============================================
 * LAYER SEPARATION RULES (READ THIS FIRST)
 * ============================================
 * 
 * Data-0 (Infrastructure): Logging, metrics, backtesting
 *   → prediction-logging.ts
 * 
 * Data-1 (Normalization): ONLY converts, cleans, normalizes, standardizes raw inputs
 *   → market-probabilities.ts (vig removal, implied probs, raw volatility stats, raw quality flags)
 *   → NO modeling, NO edge calculation, NO interpretation allowed here
 * 
 * Data-2 (Modeling): Consumes ONLY normalized Data-1 outputs
 *   → prediction-models.ts (Poisson, Elo)
 *   → calibration.ts (Platt scaling, isotonic regression)
 * 
 * Data-2.5 (Validation/Gating): Interprets model outputs into quality levels
 *   → edge-quality.ts (interprets raw flags → HIGH/MEDIUM/LOW)
 * 
 * Data-3 (LLM): Receives READ-ONLY outputs, generates narrative ONLY
 *   → llm-integration.ts
 * 
 * KEY RULE: "Anything that converts, cleans, normalizes, or standardizes 
 * raw inputs belongs strictly to Data-1. No modeling, no edge, no 
 * interpretation is allowed in that layer."
 * 
 * This separation is why AIXBT-style systems feel "real".
 * ============================================
 */

import {
  SportType,
  ModelInput,
  BookmakerOdds,
  PipelineOutput,
  MarketProbabilities,
  RawProbabilities,
  CalibratedProbabilities,
  EdgeResult,
  DataQuality,
  VolatilityMetrics,
} from './types';

import {
  calculateMarketProbabilities,
  quickMarketProbabilities,
} from './market-probabilities';

import {
  predictMatch,
  getExpectedScores,
} from './prediction-models';

import {
  calibrateProbabilities,
} from './calibration';

import {
  runCompleteQualityCheck,
  assessDataQuality,
  assessVolatility,
} from './edge-quality';

import {
  logPrediction,
} from './prediction-logging';

import {
  SituationalFactors,
  calculateSituationalAdjustment,
  blendEnsemble,
  adjustConvictionForHistory,
  detectTrapGame,
  TrapGameFactors,
  EnsembleInput,
} from './advanced-features';

// ============================================
// PIPELINE CONFIGURATION
// ============================================

export interface PipelineConfig {
  // Whether to log predictions to storage
  logPredictions: boolean;

  // Calibration settings
  calibrationMethod: 'platt' | 'isotonic' | 'hybrid';

  // Quality thresholds
  minDataQualityForEdge: DataQuality['level'];

  // Suppress edge below this value
  minEdgeToShow: number;
}

const DEFAULT_CONFIG: PipelineConfig = {
  logPredictions: true,
  calibrationMethod: 'hybrid',
  minDataQualityForEdge: 'LOW',
  minEdgeToShow: 0.02,
};

// ============================================
// MAIN PIPELINE FUNCTION
// ============================================

export interface PipelineInput {
  // Match identification
  matchId: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;

  // Team statistics
  homeStats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    scored: number;
    conceded: number;
  };
  awayStats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    scored: number;
    conceded: number;
  };

  // Recent form
  homeForm: string;
  awayForm: string;

  // Head-to-head (optional)
  h2h?: {
    total: number;
    homeWins: number;
    awayWins: number;
    draws: number;
  };

  // Odds data
  odds: BookmakerOdds[];

  // Situational factors (optional)
  situational?: Partial<SituationalFactors>;

  // Trap game detection (optional)
  trapFactors?: Partial<TrapGameFactors>;

  // Optional overrides
  config?: Partial<PipelineConfig>;
}

export interface PipelineResult {
  // Main output for LLM consumption
  output: PipelineOutput;

  // Detailed breakdowns (for debugging/UI)
  details: {
    marketProbabilities: MarketProbabilities;
    rawProbabilities: RawProbabilities;
    calibratedProbabilities: CalibratedProbabilities;
    edge: EdgeResult;
    dataQuality: DataQuality;
    volatility: VolatilityMetrics;
    expectedScores: { home: number; away: number };
  };

  // Prediction ID if logged
  predictionId?: string;
}

/**
 * Run the complete accuracy pipeline
 * 
 * This is the ONLY function that should be called from API routes.
 * The output.output is what gets passed to the LLM - nothing else.
 */
export async function runAccuracyPipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  const config = { ...DEFAULT_CONFIG, ...input.config };

  // Detect sport type
  const sportType = detectSportType(input.sport);
  const hasDraw = sportType === 'soccer' || sportType === 'football';

  // ========================================
  // STEP 1: Market Probabilities
  // ========================================
  const marketProbabilities = calculateMarketProbabilities(
    input.odds,
    hasDraw,
    {
      vigRemovalMethod: 'proportional',
      consensusMethod: 'median',
    }
  );

  // ========================================
  // STEP 2: Model Prediction
  // ========================================
  const modelInput: ModelInput = {
    sport: sportType,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    league: input.league,
    homeStats: input.homeStats,
    awayStats: input.awayStats,
    homeForm: input.homeForm,
    awayForm: input.awayForm,
    h2h: input.h2h,
  };

  const rawProbabilities = predictMatch(modelInput);
  const expectedScores = getExpectedScores(modelInput);

  // ========================================
  // STEP 2.5: Situational Adjustments (NEW)
  // ========================================
  let situationalAdjust = { homeAdjust: 0, awayAdjust: 0, reasons: [] as string[] };

  if (input.situational) {
    const situationalInput: SituationalFactors = {
      homeRestDays: input.situational.homeRestDays ?? 3,
      awayRestDays: input.situational.awayRestDays ?? 3,
      homeGamesLast7Days: input.situational.homeGamesLast7Days ?? 2,
      awayGamesLast7Days: input.situational.awayGamesLast7Days ?? 2,
      isHomeBackToBack: input.situational.isHomeBackToBack ?? false,
      isAwayBackToBack: input.situational.isAwayBackToBack ?? false,
      travelDistance: input.situational.travelDistance,
      isPlayoffs: input.situational.isPlayoffs,
      isDerby: input.situational.isDerby,
      isRevenge: input.situational.isRevenge,
      motivationLevel: input.situational.motivationLevel,
    };
    situationalAdjust = calculateSituationalAdjustment(sportType, situationalInput);
  }

  // ========================================
  // STEP 2.6: Trap Game Detection (NEW)
  // ========================================
  let trapGameInfo = { isTrap: false, trapType: null as string | null, warning: null as string | null, convictionAdjust: 0 };

  if (input.trapFactors) {
    const trapInput: TrapGameFactors = {
      isHeavyFavorite: input.trapFactors.isHeavyFavorite ?? false,
      hadEmotionalWinLast: input.trapFactors.hadEmotionalWinLast ?? false,
      hasLookaheadGame: input.trapFactors.hasLookaheadGame ?? false,
      opponentQuality: input.trapFactors.opponentQuality ?? 'average',
      trendDirection: input.trapFactors.trendDirection ?? 'fair',
    };
    trapGameInfo = detectTrapGame(trapInput);
  }

  // ========================================
  // STEP 2.7: Ensemble Blending (NEW)
  // ========================================
  // Apply situational adjustments to raw probabilities
  let adjustedRaw = { ...rawProbabilities };
  if (situationalAdjust.homeAdjust !== 0 || situationalAdjust.awayAdjust !== 0) {
    const homeAdj = adjustedRaw.home + situationalAdjust.homeAdjust - situationalAdjust.awayAdjust;
    const awayAdj = adjustedRaw.away - situationalAdjust.homeAdjust + situationalAdjust.awayAdjust;

    // Renormalize
    const total = homeAdj + awayAdj + (adjustedRaw.draw || 0);
    adjustedRaw = {
      ...adjustedRaw,
      home: Math.max(0.05, Math.min(0.95, homeAdj / total)),
      away: Math.max(0.05, Math.min(0.95, awayAdj / total)),
      draw: adjustedRaw.draw ? adjustedRaw.draw / total : undefined,
    };
  }

  // Blend with market consensus
  const ensembleInput: EnsembleInput = {
    ourModel: adjustedRaw,
    marketImplied: {
      home: marketProbabilities.impliedProbabilitiesNoVig.home,
      away: marketProbabilities.impliedProbabilitiesNoVig.away,
      draw: marketProbabilities.impliedProbabilitiesNoVig.draw,
      method: 'market',
    },
  };
  const blendedProbabilities = blendEnsemble(sportType, ensembleInput);

  // ========================================
  // STEP 3: Calibration
  // ========================================
  const dataQuality = assessDataQuality(modelInput, marketProbabilities.bookmakerCount);

  // Use blended probabilities for calibration
  const calibratedProbabilities = calibrateProbabilities(
    blendedProbabilities, // Changed from rawProbabilities
    sportType,
    {
      method: config.calibrationMethod,
      includeConfidenceIntervals: true,
      dataQualityScore: dataQuality.score,
    }
  );

  // ========================================
  // STEP 4: Edge Quality
  // ========================================
  const volatility = assessVolatility(input.odds, input.homeForm, input.awayForm);

  const qualityCheck = runCompleteQualityCheck({
    calibratedProbs: calibratedProbabilities,
    marketProbs: marketProbabilities,
    modelInput,
    odds: input.odds,
  });

  const edge = qualityCheck.edge;

  // Note: trapGameInfo.convictionAdjust is applied in the LLM layer, not here

  // ========================================
  // STEP 5: Build LLM Output
  // ========================================
  const output = buildPipelineOutput(
    calibratedProbabilities,
    edge,
    dataQuality,
    volatility,
    marketProbabilities,
    config,
    hasDraw,
    situationalAdjust.reasons,
    trapGameInfo.warning
  );

  // ========================================
  // STEP 6: Log Prediction (optional)
  // ========================================
  let predictionId: string | undefined;

  if (config.logPredictions) {
    try {
      const record = await logPrediction({
        matchId: input.matchId,
        sport: sportType,
        league: input.league,
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        kickoff: input.kickoff,
        rawProbabilities: adjustedRaw, // Log situational-adjusted raw
        calibratedProbabilities,
        marketProbabilities,
        edge,
        dataQuality,
        volatility,
      });
      predictionId = record.id;
    } catch (error) {
      console.error('Failed to log prediction:', error);
    }
  }

  return {
    output,
    details: {
      marketProbabilities,
      rawProbabilities,
      calibratedProbabilities,
      edge,
      dataQuality,
      volatility,
      expectedScores,
    },
    predictionId,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Detect sport type from string
 */
function detectSportType(sport: string): SportType {
  const s = sport.toLowerCase();
  if (s.includes('basketball') || s.includes('nba') || s.includes('euroleague')) return 'basketball';
  if (s.includes('american') || s.includes('nfl') || s.includes('ncaa football')) return 'football';
  if (s.includes('hockey') || s.includes('nhl') || s.includes('khl')) return 'hockey';
  return 'soccer';
}

/**
 * Build the final output that the LLM receives
 */
function buildPipelineOutput(
  calibrated: CalibratedProbabilities,
  edge: EdgeResult,
  dataQuality: DataQuality,
  volatility: VolatilityMetrics,
  market: MarketProbabilities,
  config: PipelineConfig,
  hasDraw: boolean,
  situationalReasons: string[] = [],
  trapWarning: string | null = null
): PipelineOutput {
  // Determine favored outcome
  // CRITICAL: For sports without draws (basketball, NFL, hockey), NEVER return 'even'
  // Always pick the side with higher probability
  let favored: 'home' | 'away' | 'draw' | 'even';
  const probDiff = Math.abs(calibrated.home - calibrated.away);

  if (probDiff < 0.05 && hasDraw) {
    // Only allow 'even' for sports WITH draws (soccer) when probabilities are close
    favored = 'even';
  } else if (calibrated.home >= calibrated.away && calibrated.home >= (calibrated.draw || 0)) {
    // Home favored (use >= to ensure we always pick a side for non-draw sports)
    favored = 'home';
  } else if (calibrated.away > calibrated.home && calibrated.away >= (calibrated.draw || 0)) {
    favored = 'away';
  } else if (hasDraw && (calibrated.draw || 0) > calibrated.home && (calibrated.draw || 0) > calibrated.away) {
    favored = 'draw';
  } else {
    // Fallback: pick the side with higher probability (for non-draw sports)
    favored = calibrated.home >= calibrated.away ? 'home' : 'away';
  }

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low';
  const maxProb = Math.max(calibrated.home, calibrated.away, calibrated.draw || 0);

  if (maxProb >= 0.60 && dataQuality.level === 'HIGH') {
    confidence = 'high';
  } else if (maxProb >= 0.50 && dataQuality.level !== 'LOW') {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Check suppression conditions
  const suppressReasons: string[] = [];
  let suppressEdge = false;

  if (edge.primaryEdge.quality === 'SUPPRESSED') {
    suppressEdge = true;
    suppressReasons.push(...edge.reasons);
  }

  if (edge.primaryEdge.value < config.minEdgeToShow) {
    suppressEdge = true;
    suppressReasons.push('Edge below minimum threshold');
  }

  const qualityLevels: DataQuality['level'][] = ['INSUFFICIENT', 'LOW', 'MEDIUM', 'HIGH'];
  const minQualityIdx = qualityLevels.indexOf(config.minDataQualityForEdge);
  const actualQualityIdx = qualityLevels.indexOf(dataQuality.level);

  if (actualQualityIdx < minQualityIdx) {
    suppressEdge = true;
    suppressReasons.push('Data quality below threshold');
  }

  // Add trap game warning if present
  if (trapWarning) {
    suppressReasons.push(trapWarning);
  }

  return {
    probabilities: calibrated,
    edge: {
      value: edge.primaryEdge.value,
      quality: edge.primaryEdge.quality,
      outcome: edge.primaryEdge.outcome,
    },
    dataQuality: dataQuality.level,
    volatility: volatility.level,
    favored,
    confidence,
    suppressEdge,
    suppressReasons,
    marketMargin: market.marketMargin,
    bookmakerCount: market.bookmakerCount,
    situationalFactors: situationalReasons.length > 0 ? situationalReasons : undefined,
  };
}

// ============================================
// SIMPLIFIED ENTRY POINTS
// ============================================

/**
 * Quick analysis with minimal input
 * For cases where full pipeline input isn't available
 */
export async function quickAnalysis(params: {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  homeForm?: string;
  awayForm?: string;
}): Promise<PipelineOutput> {
  // Build minimal input
  const input: PipelineInput = {
    matchId: `quick_${Date.now()}`,
    sport: params.sport,
    league: 'Unknown',
    homeTeam: params.homeTeam,
    awayTeam: params.awayTeam,
    kickoff: new Date(),
    homeStats: { played: 5, wins: 2, draws: 1, losses: 2, scored: 6, conceded: 6 },
    awayStats: { played: 5, wins: 2, draws: 1, losses: 2, scored: 6, conceded: 6 },
    homeForm: params.homeForm || 'WLDWL',
    awayForm: params.awayForm || 'LWDLW',
    odds: [{
      bookmaker: 'quick',
      homeOdds: params.homeOdds,
      awayOdds: params.awayOdds,
      drawOdds: params.drawOdds,
    }],
    config: { logPredictions: false },
  };

  const result = await runAccuracyPipeline(input);
  return result.output;
}

/**
 * Get market probabilities only (no model prediction)
 */
export function getMarketOnly(
  homeOdds: number,
  awayOdds: number,
  drawOdds?: number
): MarketProbabilities {
  return quickMarketProbabilities(homeOdds, awayOdds, drawOdds);
}

// ============================================
// RE-EXPORTS
// ============================================

export * from './types';
export * from './market-probabilities';
export * from './prediction-models';
export * from './calibration';
export * from './edge-quality';
export * from './prediction-logging';
export * from './llm-integration';
export * from './api-adapter';
export * from './advanced-features';
export * from './accuracy-metrics';
