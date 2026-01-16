/**
 * Accuracy Core - Module 3: Probability Calibration Layer
 * 
 * Transforms raw model probabilities into calibrated probabilities.
 * Uses Platt scaling and isotonic regression based on historical data.
 * 
 * Calibration ensures that when the model says 60%, it wins ~60% of the time.
 */

import { RawProbabilities, CalibratedProbabilities } from './types';

// ============================================
// CALIBRATION PARAMETERS (Pre-trained)
// ============================================

/**
 * Pre-trained Platt scaling parameters
 * These should be updated periodically based on backtesting results
 * 
 * Sigmoid: P_calibrated = 1 / (1 + exp(A * P_raw + B))
 */
interface PlattParams {
  A: number;
  B: number;
}

const PLATT_PARAMS: Record<string, PlattParams> = {
  'soccer:home': { A: -1.2, B: 0.1 },    // Slight home overconfidence
  'soccer:away': { A: -1.1, B: 0.05 },
  'soccer:draw': { A: -1.0, B: 0.0 },
  'basketball:home': { A: -1.15, B: 0.08 },
  'basketball:away': { A: -1.15, B: 0.08 },
  'football:home': { A: -1.1, B: 0.05 },
  'football:away': { A: -1.1, B: 0.05 },
  'hockey:home': { A: -1.12, B: 0.06 },
  'hockey:away': { A: -1.12, B: 0.06 },
  'default': { A: -1.0, B: 0.0 },        // No adjustment
};

/**
 * Pre-trained isotonic regression lookup table
 * Maps raw probability ranges to calibrated probabilities
 * Format: [rawMin, rawMax, calibratedValue]
 */
interface IsotonicPoint {
  rawMin: number;
  rawMax: number;
  calibrated: number;
}

const ISOTONIC_TABLE: Record<string, IsotonicPoint[]> = {
  'soccer': [
    { rawMin: 0.00, rawMax: 0.15, calibrated: 0.12 },
    { rawMin: 0.15, rawMax: 0.25, calibrated: 0.20 },
    { rawMin: 0.25, rawMax: 0.35, calibrated: 0.30 },
    { rawMin: 0.35, rawMax: 0.45, calibrated: 0.40 },
    { rawMin: 0.45, rawMax: 0.55, calibrated: 0.50 },
    { rawMin: 0.55, rawMax: 0.65, calibrated: 0.60 },
    { rawMin: 0.65, rawMax: 0.75, calibrated: 0.68 },
    { rawMin: 0.75, rawMax: 0.85, calibrated: 0.76 },
    { rawMin: 0.85, rawMax: 1.00, calibrated: 0.84 },
  ],
  'basketball': [
    { rawMin: 0.00, rawMax: 0.20, calibrated: 0.18 },
    { rawMin: 0.20, rawMax: 0.35, calibrated: 0.30 },
    { rawMin: 0.35, rawMax: 0.50, calibrated: 0.45 },
    { rawMin: 0.50, rawMax: 0.65, calibrated: 0.58 },
    { rawMin: 0.65, rawMax: 0.80, calibrated: 0.72 },
    { rawMin: 0.80, rawMax: 1.00, calibrated: 0.85 },
  ],
  'default': [
    { rawMin: 0.00, rawMax: 0.50, calibrated: 0.45 },
    { rawMin: 0.50, rawMax: 1.00, calibrated: 0.55 },
  ],
};

// ============================================
// PLATT SCALING
// ============================================

/**
 * Apply Platt scaling to a single probability
 */
function plattScale(rawProb: number, params: PlattParams): number {
  // Platt scaling: sigmoid of linear transform
  // P_cal = 1 / (1 + exp(A * log(P/(1-P)) + B))

  // Clamp to avoid log(0) or log(infinity)
  const p = Math.max(0.001, Math.min(0.999, rawProb));
  const logOdds = Math.log(p / (1 - p));
  const scaled = 1 / (1 + Math.exp(params.A * logOdds + params.B));

  return Math.max(0.01, Math.min(0.99, scaled));
}

/**
 * Apply Platt scaling to all outcomes
 */
export function applyPlattScaling(
  raw: RawProbabilities,
  sport: string
): CalibratedProbabilities {
  const homeParams = PLATT_PARAMS[`${sport}:home`] || PLATT_PARAMS.default;
  const awayParams = PLATT_PARAMS[`${sport}:away`] || PLATT_PARAMS.default;
  const drawParams = PLATT_PARAMS[`${sport}:draw`] || PLATT_PARAMS.default;

  let calHome = plattScale(raw.home, homeParams);
  let calAway = plattScale(raw.away, awayParams);
  let calDraw = raw.draw !== undefined ? plattScale(raw.draw, drawParams) : undefined;

  // Normalize to sum to 1
  const total = calHome + calAway + (calDraw || 0);
  calHome /= total;
  calAway /= total;
  if (calDraw !== undefined) calDraw /= total;

  return {
    home: calHome,
    away: calAway,
    draw: calDraw,
    calibrationMethod: 'platt',
  };
}

// ============================================
// ISOTONIC REGRESSION
// ============================================

/**
 * Look up calibrated value from isotonic table
 */
function isotonicLookup(rawProb: number, table: IsotonicPoint[]): number {
  for (const point of table) {
    if (rawProb >= point.rawMin && rawProb < point.rawMax) {
      // Linear interpolation within the bucket
      const bucketWidth = point.rawMax - point.rawMin;
      const position = (rawProb - point.rawMin) / bucketWidth;

      // Find next bucket for interpolation
      const nextIndex = table.indexOf(point) + 1;
      if (nextIndex < table.length) {
        const nextCal = table[nextIndex].calibrated;
        return point.calibrated + position * (nextCal - point.calibrated);
      }
      return point.calibrated;
    }
  }
  return rawProb; // Fallback
}

/**
 * Apply isotonic regression calibration
 */
export function applyIsotonicCalibration(
  raw: RawProbabilities,
  sport: string
): CalibratedProbabilities {
  const table = ISOTONIC_TABLE[sport] || ISOTONIC_TABLE.default;

  let calHome = isotonicLookup(raw.home, table);
  let calAway = isotonicLookup(raw.away, table);
  let calDraw = raw.draw !== undefined ? isotonicLookup(raw.draw, table) : undefined;

  // Normalize
  const total = calHome + calAway + (calDraw || 0);
  calHome /= total;
  calAway /= total;
  if (calDraw !== undefined) calDraw /= total;

  return {
    home: calHome,
    away: calAway,
    draw: calDraw,
    calibrationMethod: 'isotonic',
  };
}

// ============================================
// HYBRID CALIBRATION (RECOMMENDED)
// ============================================

/**
 * Hybrid approach: Average of Platt and Isotonic
 * More robust than either alone
 */
export function applyHybridCalibration(
  raw: RawProbabilities,
  sport: string
): CalibratedProbabilities {
  const platt = applyPlattScaling(raw, sport);
  const isotonic = applyIsotonicCalibration(raw, sport);

  const calHome = (platt.home + isotonic.home) / 2;
  const calAway = (platt.away + isotonic.away) / 2;
  const calDraw = platt.draw !== undefined && isotonic.draw !== undefined
    ? (platt.draw + isotonic.draw) / 2
    : undefined;

  // Final normalization
  const total = calHome + calAway + (calDraw || 0);

  return {
    home: calHome / total,
    away: calAway / total,
    draw: calDraw !== undefined ? calDraw / total : undefined,
    calibrationMethod: 'platt', // Primary method
  };
}

// ============================================
// CONFIDENCE INTERVALS
// ============================================

/**
 * Calculate confidence intervals based on data quality
 * Lower quality = wider intervals
 */
export function calculateConfidenceIntervals(
  calibrated: CalibratedProbabilities,
  dataQualityScore: number // 0-100
): CalibratedProbabilities {
  // Base uncertainty ranges from 5% (perfect data) to 20% (poor data)
  const baseUncertainty = 0.05 + (0.15 * (1 - dataQualityScore / 100));

  const makeInterval = (p: number): [number, number] => {
    const low = Math.max(0.01, p - baseUncertainty);
    const high = Math.min(0.99, p + baseUncertainty);
    return [low, high];
  };

  return {
    ...calibrated,
    confidenceInterval: {
      home: makeInterval(calibrated.home),
      away: makeInterval(calibrated.away),
      draw: calibrated.draw !== undefined ? makeInterval(calibrated.draw) : undefined,
    },
  };
}

// ============================================
// MAIN CALIBRATION FUNCTION
// ============================================

export interface CalibrationOptions {
  method?: 'platt' | 'isotonic' | 'hybrid';
  includeConfidenceIntervals?: boolean;
  dataQualityScore?: number;
}

/**
 * Main calibration entry point
 * Takes raw model probabilities and returns calibrated probabilities
 */
export function calibrateProbabilities(
  raw: RawProbabilities,
  sport: string,
  options: CalibrationOptions = {}
): CalibratedProbabilities {
  const {
    method = 'hybrid',
    includeConfidenceIntervals = true,
    dataQualityScore = 75,
  } = options;

  let calibrated: CalibratedProbabilities;

  switch (method) {
    case 'platt':
      calibrated = applyPlattScaling(raw, sport);
      break;
    case 'isotonic':
      calibrated = applyIsotonicCalibration(raw, sport);
      break;
    case 'hybrid':
    default:
      calibrated = applyHybridCalibration(raw, sport);
  }

  if (includeConfidenceIntervals) {
    calibrated = calculateConfidenceIntervals(calibrated, dataQualityScore);
  }

  return calibrated;
}

// ============================================
// NOTE: Calibration METRICS (Brier, LogLoss, ECE) are in prediction-logging.ts
// This follows layer separation: calibration.ts = Data-2 (modeling)
// Metrics belong in Data-0 (infrastructure/evaluation)
// ============================================

// ============================================
// ONLINE CALIBRATION UPDATE
// ============================================

/**
 * Simple online calibration parameter update
 * Call this with new results to improve calibration over time
 */
export interface CalibrationUpdate {
  sport: string;
  outcome: 'home' | 'away' | 'draw';
  predictedProb: number;
  actualWin: boolean;
}

// In-memory tracking for online updates
const calibrationHistory: CalibrationUpdate[] = [];

/**
 * Record a prediction result for calibration improvement
 */
export function recordCalibrationResult(update: CalibrationUpdate): void {
  calibrationHistory.push(update);

  // Keep last 1000 predictions per sport
  const sportHistory = calibrationHistory.filter(h => h.sport === update.sport);
  if (sportHistory.length > 1000) {
    const toRemove = sportHistory[0];
    const index = calibrationHistory.indexOf(toRemove);
    if (index > -1) calibrationHistory.splice(index, 1);
  }
}

/**
 * Get current calibration quality metrics
 * NOTE: Inline implementation to avoid circular deps with prediction-logging.ts
 */
export function getCalibrationQuality(sport: string): {
  brierScore: number;
  ece: number;
  sampleSize: number;
} {
  const sportHistory = calibrationHistory.filter(h => h.sport === sport);

  if (sportHistory.length < 20) {
    return { brierScore: 0, ece: 0, sampleSize: sportHistory.length };
  }

  const predictions = sportHistory.map(h => ({
    predicted: h.predictedProb,
    actual: h.actualWin ? 1 as const : 0 as const,
  }));

  // Inline Brier score calculation
  const brierScore = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + Math.pow(p.predicted - p.actual, 2), 0) / predictions.length
    : 0;

  // Inline ECE calculation (simplified - 10 buckets)
  const numBuckets = 10;
  const bucketSize = 1 / numBuckets;
  let weightedError = 0;

  for (let i = 0; i < numBuckets; i++) {
    const rangeMin = i * bucketSize;
    const rangeMax = (i + 1) * bucketSize;
    const inBucket = predictions.filter(p => p.predicted >= rangeMin && p.predicted < rangeMax);

    if (inBucket.length > 0) {
      const wins = inBucket.filter(p => p.actual === 1).length;
      const expectedWinRate = (rangeMin + rangeMax) / 2;
      const actualWinRate = wins / inBucket.length;
      const calibrationError = Math.abs(expectedWinRate - actualWinRate);
      weightedError += (inBucket.length / predictions.length) * calibrationError;
    }
  }

  return {
    brierScore,
    ece: weightedError,
    sampleSize: sportHistory.length,
  };
}

// ============================================
// LEARNED CALIBRATION PARAMETERS
// ============================================

interface LearnedParams {
  A: number;
  B: number;
  timestamp: number;
  sampleSize: number;
  brierScore: number;
}

// Cache for learned params (per sport:outcome)
const learnedParamsCache: Map<string, LearnedParams> = new Map();
const LEARN_MIN_SAMPLES = 100;
const LEARN_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Learn optimal Platt scaling parameters from prediction history
 * Uses simple gradient descent to minimize Brier score
 */
export async function learnPlattParams(sport: string): Promise<{
  learned: boolean;
  params: PlattParams;
  improvement: number;
  sampleSize: number;
}> {
  const cacheKey = sport.toLowerCase();

  // Check cache first
  const cached = learnedParamsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < LEARN_CACHE_TTL_MS) {
    return {
      learned: true,
      params: { A: cached.A, B: cached.B },
      improvement: 0,
      sampleSize: cached.sampleSize,
    };
  }

  // Get history from in-memory storage
  const sportHistory = calibrationHistory.filter(h => h.sport.toLowerCase().includes(cacheKey));

  if (sportHistory.length < LEARN_MIN_SAMPLES) {
    // Not enough data, return default
    const defaultParams = PLATT_PARAMS[`${sport}:home`] || PLATT_PARAMS['default'];
    return {
      learned: false,
      params: defaultParams,
      improvement: 0,
      sampleSize: sportHistory.length,
    };
  }

  // Current default params
  const defaultParams = PLATT_PARAMS[`${sport}:home`] || PLATT_PARAMS['default'];
  let A = defaultParams.A;
  let B = defaultParams.B;

  // Prepare data
  const data = sportHistory.map(h => ({
    rawProb: h.predictedProb,
    actual: h.actualWin ? 1 : 0,
  }));

  // Calculate Brier score for a set of params
  const calcBrier = (paramA: number, paramB: number): number => {
    let brier = 0;
    for (const d of data) {
      const p = Math.max(0.001, Math.min(0.999, d.rawProb));
      const logOdds = Math.log(p / (1 - p));
      const calibrated = 1 / (1 + Math.exp(paramA * logOdds + paramB));
      brier += Math.pow(calibrated - d.actual, 2);
    }
    return brier / data.length;
  };

  // Calculate baseline Brier
  const baselineBrier = calcBrier(A, B);

  // Simple gradient descent
  const learningRate = 0.01;
  const iterations = 100;
  const delta = 0.001;

  for (let i = 0; i < iterations; i++) {
    // Numerical gradient for A
    const brierA1 = calcBrier(A + delta, B);
    const brierA2 = calcBrier(A - delta, B);
    const gradA = (brierA1 - brierA2) / (2 * delta);

    // Numerical gradient for B
    const brierB1 = calcBrier(A, B + delta);
    const brierB2 = calcBrier(A, B - delta);
    const gradB = (brierB1 - brierB2) / (2 * delta);

    // Update params
    A = A - learningRate * gradA;
    B = B - learningRate * gradB;

    // Constrain to reasonable ranges
    A = Math.max(-3, Math.min(0, A));
    B = Math.max(-1, Math.min(1, B));
  }

  const learnedBrier = calcBrier(A, B);
  const improvement = ((baselineBrier - learnedBrier) / baselineBrier) * 100;

  // Only use learned params if they improve by at least 1%
  if (improvement >= 1) {
    console.log(`[Calibration] Learned params for ${sport}: A=${A.toFixed(3)}, B=${B.toFixed(3)} (+${improvement.toFixed(1)}% improvement)`);

    // Cache the learned params
    learnedParamsCache.set(cacheKey, {
      A,
      B,
      timestamp: Date.now(),
      sampleSize: sportHistory.length,
      brierScore: learnedBrier,
    });

    return {
      learned: true,
      params: { A, B },
      improvement,
      sampleSize: sportHistory.length,
    };
  }

  // No significant improvement, use defaults
  return {
    learned: false,
    params: defaultParams,
    improvement,
    sampleSize: sportHistory.length,
  };
}

/**
 * Get calibration params (learned if available, else default)
 */
export function getCalibrationParams(sport: string, outcome: 'home' | 'away' | 'draw'): PlattParams {
  const cacheKey = sport.toLowerCase();
  const cached = learnedParamsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < LEARN_CACHE_TTL_MS) {
    return { A: cached.A, B: cached.B };
  }

  return PLATT_PARAMS[`${sport}:${outcome}`] || PLATT_PARAMS['default'];
}

/**
 * Force recalculation of learned params
 */
export function invalidateLearnedParams(sport?: string): void {
  if (sport) {
    learnedParamsCache.delete(sport.toLowerCase());
  } else {
    learnedParamsCache.clear();
  }
}
