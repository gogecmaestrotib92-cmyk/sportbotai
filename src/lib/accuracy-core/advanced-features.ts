/**
 * Advanced Prediction Features
 * 
 * Implements industry-standard techniques used by professional sports analytics:
 * 1. Situational Factors (rest, travel, schedule spots)
 * 2. Market-Based Calibration (respect sharp bookmaker consensus)
 * 3. Ensemble Probability Blending
 * 4. Historical Accuracy Weighting by Sport/League
 */

import { SportType, RawProbabilities } from './types';

// ============================================
// 1. SITUATIONAL FACTORS
// ============================================

export interface SituationalFactors {
  homeRestDays: number;
  awayRestDays: number;
  homeGamesLast7Days: number;
  awayGamesLast7Days: number;
  isHomeBackToBack: boolean;
  isAwayBackToBack: boolean;
  travelDistance?: number; // In miles/km
  timezone?: number; // Timezone difference for away team
  isRevenge?: boolean; // Playing team that beat them recently
  motivationLevel?: 'high' | 'normal' | 'low'; // Playoff race, nothing to play for, etc.
  isPlayoffs?: boolean;
  isDerby?: boolean; // Local rivalry
  
  // Injury factors (NEW) - optional since not all sources provide this
  homeInjuriesOut?: number; // Players confirmed OUT
  awayInjuriesOut?: number;
  homeInjuriesDoubtful?: number; // Players DOUBTFUL/QUESTIONABLE
  awayInjuriesDoubtful?: number;
  homeKeyPlayerOut?: boolean; // Star player injured
  awayKeyPlayerOut?: boolean;
}

/**
 * Situational Adjustment Factors
 * 
 * Based on research from sports analytics literature:
 * - Back-to-back in NBA: -3% to -8% win probability
 * - Rest advantage (3+ days vs 1): +2% to +4%
 * - Travel fatigue (3000+ miles): -1% to -3%
 * - Revenge game: +1% to +2% (slight motivation boost)
 * 
 * These adjustments compound with existing probability.
 */
export const SITUATIONAL_ADJUSTMENTS: Record<string, Record<string, number>> = {
  basketball: {
    backToBack: -0.06, // -6% for B2B
    backToBackRoad: -0.08, // -8% for road B2B (worse)
    restAdvantage3Plus: 0.03, // +3% for 3+ days rest advantage
    playoffBoost: 0.02, // +2% for home team in playoffs
    revengeGame: 0.015, // +1.5% for revenge
    endOfSeason: -0.02, // -2% if eliminated from playoffs (low motivation)
    // Injury adjustments (per player OUT)
    injuryPerPlayerOut: -0.025, // -2.5% per player confirmed OUT
    injuryPerPlayerDoubtful: -0.01, // -1% per doubtful player
    injuryKeyPlayer: -0.06, // -6% if star player out (additive)
  },
  hockey: {
    backToBack: -0.04, // -4% for B2B (less than NBA)
    backToBackRoad: -0.06, // -6% for road B2B
    restAdvantage3Plus: 0.025, // +2.5% rest advantage
    playoffBoost: 0.03, // +3% (playoff intensity matters more in NHL)
    revengeGame: 0.01, // +1%
    // Injury adjustments (less impactful than NBA due to shorter shifts)
    injuryPerPlayerOut: -0.015, // -1.5% per player OUT
    injuryPerPlayerDoubtful: -0.005, // -0.5% per doubtful
    injuryKeyPlayer: -0.04, // -4% if star out (goalies matter more)
  },
  soccer: {
    backToBack: 0, // Rarely happens in soccer
    restAdvantage3Plus: 0.02, // +2%
    derbyBoost: 0.03, // +3% home boost in derbies (crowd factor)
    cupFatigue: -0.02, // -2% after midweek cup game
    revengeGame: 0.01, // +1%
    // Injury adjustments
    injuryPerPlayerOut: -0.02, // -2% per player OUT
    injuryPerPlayerDoubtful: -0.008, // -0.8% per doubtful
    injuryKeyPlayer: -0.05, // -5% if star player out
  },
  football: {
    shortWeek: -0.04, // -4% for Thursday games (less than a week rest)
    byeWeekAdvantage: 0.03, // +3% coming off bye
    travelFatigue3000Plus: -0.02, // -2% for cross-country travel
    playoffHome: 0.04, // +4% home playoff boost (huge in NFL)
    revengeGame: 0.01, // +1%
    // NFL injury adjustments (QB/star matters a lot)
    injuryPerPlayerOut: -0.01, // -1% per player OUT (large rosters)
    injuryPerPlayerDoubtful: -0.005, // -0.5% per doubtful
    injuryKeyPlayer: -0.08, // -8% if QB/star out (massive in NFL)
  },
};

/**
 * Calculate total situational adjustment
 * Returns probability adjustment factor (e.g., 0.05 = +5% to home team)
 */
export function calculateSituationalAdjustment(
  sport: SportType,
  factors: SituationalFactors
): { homeAdjust: number; awayAdjust: number; reasons: string[] } {
  const adjustments = SITUATIONAL_ADJUSTMENTS[sport] || SITUATIONAL_ADJUSTMENTS.soccer;
  
  let homeAdjust = 0;
  let awayAdjust = 0;
  const reasons: string[] = [];
  
  // Back-to-back adjustments
  if (factors.isHomeBackToBack) {
    homeAdjust += adjustments.backToBack;
    reasons.push(`${sport === 'basketball' ? 'NBA' : sport.toUpperCase()} home team on B2B (-${Math.abs(adjustments.backToBack * 100).toFixed(0)}%)`);
  }
  if (factors.isAwayBackToBack) {
    const roadB2B = adjustments.backToBackRoad || adjustments.backToBack;
    awayAdjust += roadB2B;
    reasons.push(`Away team on road B2B (-${Math.abs(roadB2B * 100).toFixed(0)}%)`);
  }
  
  // Rest advantage
  const restDiff = factors.homeRestDays - factors.awayRestDays;
  if (restDiff >= 3 && adjustments.restAdvantage3Plus) {
    homeAdjust += adjustments.restAdvantage3Plus;
    reasons.push(`Home has ${restDiff}+ day rest advantage (+${(adjustments.restAdvantage3Plus * 100).toFixed(0)}%)`);
  } else if (restDiff <= -3 && adjustments.restAdvantage3Plus) {
    awayAdjust += adjustments.restAdvantage3Plus;
    reasons.push(`Away has ${Math.abs(restDiff)}+ day rest advantage`);
  }
  
  // Schedule density
  if (factors.homeGamesLast7Days >= 4) {
    homeAdjust -= 0.02; // -2% for heavy schedule
    reasons.push('Home team on heavy schedule (4+ games in 7 days)');
  }
  if (factors.awayGamesLast7Days >= 4) {
    awayAdjust -= 0.02;
    reasons.push('Away team on heavy schedule (4+ games in 7 days)');
  }
  
  // Playoff boost
  if (factors.isPlayoffs && adjustments.playoffHome) {
    homeAdjust += adjustments.playoffHome;
    reasons.push('Playoff home court advantage');
  }
  
  // Derby/rivalry boost
  if (factors.isDerby && adjustments.derbyBoost) {
    homeAdjust += adjustments.derbyBoost;
    reasons.push('Derby match - elevated home support');
  }
  
  // Revenge game
  if (factors.isRevenge && adjustments.revengeGame) {
    // Apply to the team seeking revenge
    reasons.push('Revenge narrative may boost motivation');
  }
  
  // Motivation level
  if (factors.motivationLevel === 'low') {
    if (adjustments.endOfSeason) {
      // Apply negative adjustment to team with low motivation
      reasons.push('Low motivation detected (eliminated/nothing to play for)');
    }
  }
  
  // ========================================
  // INJURY ADJUSTMENTS (NEW)
  // ========================================
  const injuryPerOut = adjustments.injuryPerPlayerOut || -0.02;
  const injuryPerDoubtful = adjustments.injuryPerPlayerDoubtful || -0.01;
  const injuryKeyPlayer = adjustments.injuryKeyPlayer || -0.05;
  
  // Home team injuries
  const homeOutCount = factors.homeInjuriesOut || 0;
  const homeDoubtfulCount = factors.homeInjuriesDoubtful || 0;
  if (homeOutCount > 0) {
    const outAdjust = homeOutCount * injuryPerOut;
    homeAdjust += outAdjust;
    reasons.push(`Home has ${homeOutCount} player(s) OUT (${(outAdjust * 100).toFixed(1)}%)`);
  }
  if (homeDoubtfulCount > 0) {
    const doubtAdjust = homeDoubtfulCount * injuryPerDoubtful;
    homeAdjust += doubtAdjust;
    reasons.push(`Home has ${homeDoubtfulCount} doubtful/questionable`);
  }
  if (factors.homeKeyPlayerOut) {
    homeAdjust += injuryKeyPlayer;
    reasons.push(`Home key player OUT (${(injuryKeyPlayer * 100).toFixed(0)}%)`);
  }
  
  // Away team injuries
  const awayOutCount = factors.awayInjuriesOut || 0;
  const awayDoubtfulCount = factors.awayInjuriesDoubtful || 0;
  if (awayOutCount > 0) {
    const outAdjust = awayOutCount * injuryPerOut;
    awayAdjust += outAdjust;
    reasons.push(`Away has ${awayOutCount} player(s) OUT (${(outAdjust * 100).toFixed(1)}%)`);
  }
  if (awayDoubtfulCount > 0) {
    const doubtAdjust = awayDoubtfulCount * injuryPerDoubtful;
    awayAdjust += doubtAdjust;
    reasons.push(`Away has ${awayDoubtfulCount} doubtful/questionable`);
  }
  if (factors.awayKeyPlayerOut) {
    awayAdjust += injuryKeyPlayer;
    reasons.push(`Away key player OUT (${(injuryKeyPlayer * 100).toFixed(0)}%)`);
  }
  
  return { homeAdjust, awayAdjust, reasons };
}

// ============================================
// 2. ENSEMBLE MODEL BLENDING
// ============================================

export interface EnsembleInput {
  ourModel: RawProbabilities;
  marketImplied: RawProbabilities;
  eloModel?: RawProbabilities;
  poissonModel?: RawProbabilities;
}

/**
 * Ensemble Weights by Sport
 * 
 * Different models have different strengths:
 * - Market implied is usually most accurate (aggregate wisdom)
 * - Our model may have situational edge
 * - Elo works well for skill-based sports
 * - Poisson works well for low-scoring sports
 * 
 * We blend based on historical calibration.
 */
export const ENSEMBLE_WEIGHTS: Record<SportType, Record<string, number>> = {
  soccer: {
    ourModel: 0.35,
    market: 0.50, // Market is king in soccer
    poisson: 0.15, // Poisson adds value in low-scoring
  },
  basketball: {
    ourModel: 0.40,
    market: 0.45,
    elo: 0.15, // Elo useful for skill-based
  },
  football: {
    ourModel: 0.45, // We have edge in NFL
    market: 0.40,
    elo: 0.15,
  },
  hockey: {
    ourModel: 0.30, // Model unreliable
    market: 0.55, // Trust market more
    poisson: 0.15,
  },
};

/**
 * Blend probabilities from multiple models
 * Returns weighted average probabilities
 */
export function blendEnsemble(
  sport: SportType,
  input: EnsembleInput
): RawProbabilities {
  const weights = ENSEMBLE_WEIGHTS[sport] || ENSEMBLE_WEIGHTS.soccer;
  
  let homeBlend = 0;
  let awayBlend = 0;
  let drawBlend = 0;
  let totalWeight = 0;
  
  // Our model
  if (input.ourModel) {
    homeBlend += input.ourModel.home * weights.ourModel;
    awayBlend += input.ourModel.away * weights.ourModel;
    drawBlend += (input.ourModel.draw || 0) * weights.ourModel;
    totalWeight += weights.ourModel;
  }
  
  // Market implied
  if (input.marketImplied) {
    homeBlend += input.marketImplied.home * weights.market;
    awayBlend += input.marketImplied.away * weights.market;
    drawBlend += (input.marketImplied.draw || 0) * weights.market;
    totalWeight += weights.market;
  }
  
  // Elo model (if available)
  if (input.eloModel && weights.elo) {
    homeBlend += input.eloModel.home * weights.elo;
    awayBlend += input.eloModel.away * weights.elo;
    drawBlend += (input.eloModel.draw || 0) * weights.elo;
    totalWeight += weights.elo;
  }
  
  // Poisson model (if available)
  if (input.poissonModel && weights.poisson) {
    homeBlend += input.poissonModel.home * weights.poisson;
    awayBlend += input.poissonModel.away * weights.poisson;
    drawBlend += (input.poissonModel.draw || 0) * weights.poisson;
    totalWeight += weights.poisson;
  }
  
  // Normalize
  if (totalWeight === 0) totalWeight = 1;
  
  return {
    home: homeBlend / totalWeight,
    away: awayBlend / totalWeight,
    draw: drawBlend > 0 ? drawBlend / totalWeight : undefined,
    method: 'ensemble',
  };
}

// ============================================
// 3. HISTORICAL ACCURACY WEIGHTING
// ============================================

/**
 * Historical accuracy rates by sport/league
 * Updated based on actual SportBot performance
 * 
 * Used to calibrate conviction levels and expected hit rates.
 */
export const HISTORICAL_ACCURACY: Record<string, number> = {
  // Sports
  'americanfootball_nfl': 0.727, // 72.7% - Excellent
  'soccer_spl': 0.889, // 88.9% - Small sample
  'basketball_euroleague': 0.667, // 66.7%
  'soccer_portugal_primeira_liga': 0.571, // 57.1%
  'basketball_nba': 0.486, // 48.6%
  'soccer': 0.488, // 48.8%
  'soccer_italy_serie_a': 0.400, // 40.0%
  'soccer_epl': 0.394, // 39.4%
  'icehockey_nhl': 0.194, // 19.4% - Terrible (now fixed)
  
  // Default
  'default': 0.450,
};

/**
 * Get expected accuracy for a sport/league
 * Used to calibrate confidence and set realistic expectations
 */
export function getHistoricalAccuracy(sport: string): number {
  const normalized = sport.toLowerCase().replace(/\s+/g, '_');
  return HISTORICAL_ACCURACY[normalized] || HISTORICAL_ACCURACY['default'];
}

/**
 * Adjust conviction based on historical accuracy
 * If our model is bad at a sport, reduce conviction even if signals are strong
 */
export function adjustConvictionForHistory(
  rawConviction: number,
  sport: string
): number {
  const accuracy = getHistoricalAccuracy(sport);
  
  // If accuracy is below 50%, reduce conviction significantly
  if (accuracy < 0.45) {
    return Math.max(1, Math.round(rawConviction * 0.6)); // 40% reduction
  } else if (accuracy < 0.50) {
    return Math.max(1, Math.round(rawConviction * 0.8)); // 20% reduction
  } else if (accuracy > 0.65) {
    return Math.min(10, Math.round(rawConviction * 1.1)); // 10% boost
  }
  
  return rawConviction;
}

// ============================================
// 4. VALUE THRESHOLD BY BOOKMAKER QUALITY
// ============================================

/**
 * Minimum edge required to declare "value" based on bookmaker sharpness
 * 
 * Sharp books: Need bigger edge (they're rarely wrong)
 * Soft books: Smaller edge acceptable (more pricing errors)
 */
export const MIN_VALUE_EDGE_BY_QUALITY: Record<string, number> = {
  sharp: 8.0,    // Pinnacle, Betfair: 8%+ edge required
  midSharp: 6.0, // BetOnline, Bovada: 6%+ edge
  midTier: 4.0,  // Bet365, DraftKings: 4%+ edge
  soft: 3.0,     // Recreational books: 3%+ edge
  unknown: 5.0,  // Default
};

/**
 * Get minimum edge threshold for declaring value
 */
export function getMinValueEdge(bookmakerQuality: number): number {
  if (bookmakerQuality >= 0.95) return MIN_VALUE_EDGE_BY_QUALITY.sharp;
  if (bookmakerQuality >= 0.80) return MIN_VALUE_EDGE_BY_QUALITY.midSharp;
  if (bookmakerQuality >= 0.70) return MIN_VALUE_EDGE_BY_QUALITY.midTier;
  if (bookmakerQuality >= 0.50) return MIN_VALUE_EDGE_BY_QUALITY.soft;
  return MIN_VALUE_EDGE_BY_QUALITY.unknown;
}

// ============================================
// 5. CLV-BASED MODEL CALIBRATION
// ============================================

/**
 * CLV (Closing Line Value) is the gold standard for prediction validation
 * 
 * If you consistently beat the closing line, you have real edge.
 * If you don't, your "edge" is likely noise.
 * 
 * This function adjusts model confidence based on historical CLV.
 */
export interface CLVMetrics {
  avgCLV: number; // Average CLV percentage
  clvPositiveRate: number; // % of bets with positive CLV
  sampleSize: number;
}

export function shouldTrustModel(clvMetrics: CLVMetrics): {
  trustLevel: 'high' | 'medium' | 'low' | 'insufficient';
  reason: string;
  convictionMultiplier: number;
} {
  // Not enough data
  if (clvMetrics.sampleSize < 50) {
    return {
      trustLevel: 'insufficient',
      reason: `Only ${clvMetrics.sampleSize} samples - need 50+ for reliable CLV analysis`,
      convictionMultiplier: 0.8,
    };
  }
  
  // Excellent CLV (sharp money behavior)
  if (clvMetrics.avgCLV >= 3 && clvMetrics.clvPositiveRate >= 0.55) {
    return {
      trustLevel: 'high',
      reason: `Strong +${clvMetrics.avgCLV.toFixed(1)}% average CLV, ${(clvMetrics.clvPositiveRate * 100).toFixed(0)}% positive rate`,
      convictionMultiplier: 1.15,
    };
  }
  
  // Positive CLV (have some edge)
  if (clvMetrics.avgCLV >= 1 && clvMetrics.clvPositiveRate >= 0.50) {
    return {
      trustLevel: 'medium',
      reason: `Positive +${clvMetrics.avgCLV.toFixed(1)}% CLV suggests some edge`,
      convictionMultiplier: 1.0,
    };
  }
  
  // Negative CLV (market beating us)
  if (clvMetrics.avgCLV < 0) {
    return {
      trustLevel: 'low',
      reason: `Negative ${clvMetrics.avgCLV.toFixed(1)}% CLV - market is smarter`,
      convictionMultiplier: 0.7,
    };
  }
  
  return {
    trustLevel: 'medium',
    reason: 'CLV metrics inconclusive',
    convictionMultiplier: 0.9,
  };
}

// ============================================
// 6. TRAP GAME DETECTION
// ============================================

/**
 * Trap games are situations where public perception doesn't match reality:
 * - Big favorite coming off emotional win
 * - Team facing much weaker opponent after tough schedule
 * - Lookahead spot (big game next week)
 * - Letdown after big upset win
 */
export interface TrapGameFactors {
  isHeavyFavorite: boolean; // Odds < 1.30
  hadEmotionalWinLast: boolean; // Beat rival, big comeback
  hasLookaheadGame: boolean; // Big game coming up
  opponentQuality: 'elite' | 'good' | 'average' | 'weak';
  trendDirection: 'overvalued' | 'undervalued' | 'fair';
}

export function detectTrapGame(factors: TrapGameFactors): {
  isTrap: boolean;
  trapType: 'letdown' | 'lookahead' | 'overconfidence' | null;
  warning: string | null;
  convictionAdjust: number;
} {
  // Letdown spot
  if (factors.isHeavyFavorite && factors.hadEmotionalWinLast && factors.opponentQuality === 'weak') {
    return {
      isTrap: true,
      trapType: 'letdown',
      warning: 'Letdown spot detected: Heavy favorite after emotional win vs weak opponent',
      convictionAdjust: -2,
    };
  }
  
  // Lookahead
  if (factors.hasLookaheadGame && factors.opponentQuality !== 'elite') {
    return {
      isTrap: true,
      trapType: 'lookahead',
      warning: 'Lookahead spot: Big game coming up, may overlook current opponent',
      convictionAdjust: -1,
    };
  }
  
  // Public overconfidence
  if (factors.trendDirection === 'overvalued' && factors.isHeavyFavorite) {
    return {
      isTrap: true,
      trapType: 'overconfidence',
      warning: 'Market may be overvaluing favorite based on reputation',
      convictionAdjust: -1,
    };
  }
  
  return {
    isTrap: false,
    trapType: null,
    warning: null,
    convictionAdjust: 0,
  };
}
