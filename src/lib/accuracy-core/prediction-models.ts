/**
 * Accuracy Core - Module 2: Baseline Prediction Models
 * 
 * Deterministic, explainable prediction models per sport.
 * These output raw probabilities - no AI, no LLM.
 * 
 * Soccer: Poisson / Dixon-Coles style
 * Basketball: Elo-based with adjustments
 * Football (American): Elo with home field adjustment
 * Hockey: Poisson-based (similar to soccer)
 */

import { ModelInput, RawProbabilities, TeamStrength, SportType } from './types';

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const SPORT_CONFIG = {
  soccer: {
    homeAdvantage: 0.25,      // Goals boost for home team
    leagueAvgGoals: 2.5,      // Default league average goals per game
    maxGoals: 10,             // Max goals to calculate in Poisson
    formWeight: 0.3,          // Weight of recent form vs season stats
    h2hWeight: 0.1,           // Weight of H2H history
  },
  basketball: {
    homeAdvantage: 3.5,       // Points boost for home team
    leagueAvgPoints: 110,     // Default average points per team
    eloK: 20,                 // Elo K-factor
    formWeight: 0.4,          // Higher form weight (more games)
  },
  football: {
    homeAdvantage: 2.5,       // Points boost for home team
    leagueAvgPoints: 22,      // Default average points per team
    eloK: 25,                 // Elo K-factor
    formWeight: 0.35,
  },
  hockey: {
    homeAdvantage: 0.15,      // Goals boost (smaller than soccer)
    leagueAvgGoals: 2.8,      // Default average goals per team
    maxGoals: 10,
    formWeight: 0.35,
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Poisson probability mass function
 * P(X = k) = (λ^k * e^-λ) / k!
 */
function poissonPMF(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Factorial with memoization
 */
const factorialCache: Record<number, number> = { 0: 1, 1: 1 };
function factorial(n: number): number {
  if (n < 0) return 1;
  if (factorialCache[n]) return factorialCache[n];
  factorialCache[n] = n * factorial(n - 1);
  return factorialCache[n];
}

/**
 * Regression to Mean Factor
 * 
 * Small sample sizes are noisy - regress extreme values toward the mean.
 * Formula: weight = sampleSize / (sampleSize + regressionConstant)
 * 
 * Example with constant=5:
 * - 5 games: weight = 5/(5+5) = 0.50 (50% toward mean)
 * - 10 games: weight = 10/(10+5) = 0.67 (33% toward mean)
 * - 20 games: weight = 20/(20+5) = 0.80 (20% toward mean)
 * 
 * This prevents overconfidence on small samples (hot/cold streaks often mean-revert).
 */
function regressionToMean(
  observedValue: number,
  meanValue: number,
  sampleSize: number,
  regressionConstant: number = 5
): number {
  const weight = sampleSize / (sampleSize + regressionConstant);
  return weight * observedValue + (1 - weight) * meanValue;
}

/**
 * Calculate form points from form string
 * W=3, D=1, L=0 (weighted by recency)
 * NOW WITH REGRESSION TO MEAN
 */
function calculateFormStrength(form: string, hasDraw: boolean = true): number {
  if (!form || form.length === 0) return 0.5; // Neutral
  
  const weights = [1.5, 1.3, 1.1, 1.0, 0.9]; // Most recent first
  const maxPoints = hasDraw ? 3 : 1;
  
  let points = 0;
  let maxPossible = 0;
  
  for (let i = 0; i < Math.min(form.length, 5); i++) {
    const result = form[i].toUpperCase();
    const weight = weights[i] || 1;
    maxPossible += maxPoints * weight;
    
    if (result === 'W') {
      points += maxPoints * weight;
    } else if (result === 'D' && hasDraw) {
      points += 1 * weight;
    }
  }
  
  const rawFormStrength = maxPossible > 0 ? points / maxPossible : 0.5;
  
  // Apply regression to mean based on sample size
  // Average form = 0.5, regress more with fewer games
  const regressedFormStrength = regressionToMean(
    rawFormStrength,
    0.5, // Mean form strength
    form.length,
    3 // Regression constant for form (more aggressive since form is noisy)
  );
  
  return regressedFormStrength;
}

/**
 * Calculate team strength ratings from stats
 * NOW WITH REGRESSION TO MEAN for small sample sizes
 */
function calculateTeamStrength(
  stats: ModelInput['homeStats'],
  leagueAvgScored: number,
  leagueAvgConceded: number
): TeamStrength {
  if (stats.played === 0) {
    return { attack: 1.0, defense: 1.0, overall: 1.0 };
  }
  
  const avgScored = stats.scored / stats.played;
  const avgConceded = stats.conceded / stats.played;
  
  // Raw attack strength relative to league average
  const rawAttack = leagueAvgScored > 0 ? avgScored / leagueAvgScored : 1.0;
  
  // Raw defense strength (inverted - lower conceded = higher strength)
  const rawDefense = leagueAvgConceded > 0 ? leagueAvgConceded / avgConceded : 1.0;
  
  // Apply regression to mean based on games played
  // Mean attack/defense = 1.0 (league average)
  const attack = regressionToMean(rawAttack, 1.0, stats.played, 10);
  const defense = regressionToMean(rawDefense, 1.0, stats.played, 10);
  
  // Clamp to reasonable ranges
  const clampedAttack = Math.max(0.5, Math.min(2.0, attack));
  const clampedDefense = Math.max(0.5, Math.min(2.0, defense));
  
  return {
    attack: clampedAttack,
    defense: clampedDefense,
    overall: (clampedAttack + clampedDefense) / 2,
  };
}

// ============================================
// SOCCER MODEL (Poisson-based)
// ============================================

/**
 * Poisson model for soccer match outcome probabilities
 * Based on team attack/defense strengths and home advantage
 */
export function soccerPoissonModel(input: ModelInput): RawProbabilities {
  const config = SPORT_CONFIG.soccer;
  const leagueAvg = input.leagueAverageGoals || config.leagueAvgGoals;
  const avgPerTeam = leagueAvg / 2;
  
  // Calculate team strengths
  const homeStrength = calculateTeamStrength(input.homeStats, avgPerTeam, avgPerTeam);
  const awayStrength = calculateTeamStrength(input.awayStats, avgPerTeam, avgPerTeam);
  
  // Expected goals
  // Home = homeAttack * awayDefenseWeakness * leagueAvg * homeAdvantage
  // Away = awayAttack * homeDefenseWeakness * leagueAvg
  const homeDefenseWeakness = 2 - homeStrength.defense; // Invert for "concedes"
  const awayDefenseWeakness = 2 - awayStrength.defense;
  
  let homeExpectedGoals = homeStrength.attack * awayDefenseWeakness * avgPerTeam;
  let awayExpectedGoals = awayStrength.attack * homeDefenseWeakness * avgPerTeam;
  
  // Apply home advantage
  homeExpectedGoals *= (1 + config.homeAdvantage);
  
  // Adjust for form
  const homeFormFactor = calculateFormStrength(input.homeForm, true);
  const awayFormFactor = calculateFormStrength(input.awayForm, true);
  
  homeExpectedGoals *= (1 + config.formWeight * (homeFormFactor - 0.5));
  awayExpectedGoals *= (1 + config.formWeight * (awayFormFactor - 0.5));
  
  // H2H adjustment (if available)
  if (input.h2h && input.h2h.total >= 3) {
    const h2hHomeWinRate = input.h2h.homeWins / input.h2h.total;
    const h2hAwayWinRate = input.h2h.awayWins / input.h2h.total;
    
    // Small adjustment based on H2H dominance
    if (h2hHomeWinRate > 0.6) {
      homeExpectedGoals *= 1.05;
    } else if (h2hAwayWinRate > 0.6) {
      awayExpectedGoals *= 1.05;
    }
  }
  
  // Clamp expected goals to reasonable range
  homeExpectedGoals = Math.max(0.3, Math.min(4.0, homeExpectedGoals));
  awayExpectedGoals = Math.max(0.3, Math.min(4.0, awayExpectedGoals));
  
  // Calculate outcome probabilities using Poisson distribution
  let homeWin = 0;
  let awayWin = 0;
  let draw = 0;
  
  for (let h = 0; h <= config.maxGoals; h++) {
    for (let a = 0; a <= config.maxGoals; a++) {
      const prob = poissonPMF(homeExpectedGoals, h) * poissonPMF(awayExpectedGoals, a);
      
      if (h > a) homeWin += prob;
      else if (a > h) awayWin += prob;
      else draw += prob;
    }
  }
  
  // Normalize (should already sum to ~1)
  const total = homeWin + awayWin + draw;
  
  return {
    home: homeWin / total,
    away: awayWin / total,
    draw: draw / total,
    method: 'poisson',
  };
}

/**
 * Dixon-Coles adjustment for Poisson model
 * Corrects for low-scoring games correlation
 */
export function soccerDixonColesModel(input: ModelInput): RawProbabilities {
  // Start with basic Poisson
  const poisson = soccerPoissonModel(input);
  
  // Dixon-Coles rho parameter for correlation adjustment
  // Typical values range from -0.1 to 0.1
  const rho = -0.05;
  
  // Calculate expected goals (reuse logic)
  const config = SPORT_CONFIG.soccer;
  const leagueAvg = input.leagueAverageGoals || config.leagueAvgGoals;
  const avgPerTeam = leagueAvg / 2;
  
  const homeStrength = calculateTeamStrength(input.homeStats, avgPerTeam, avgPerTeam);
  const awayStrength = calculateTeamStrength(input.awayStats, avgPerTeam, avgPerTeam);
  
  let lambdaHome = homeStrength.attack * (2 - awayStrength.defense) * avgPerTeam * (1 + config.homeAdvantage);
  let lambdaAway = awayStrength.attack * (2 - homeStrength.defense) * avgPerTeam;
  
  // Apply form adjustment
  const homeFormFactor = calculateFormStrength(input.homeForm, true);
  const awayFormFactor = calculateFormStrength(input.awayForm, true);
  lambdaHome *= (1 + config.formWeight * (homeFormFactor - 0.5));
  lambdaAway *= (1 + config.formWeight * (awayFormFactor - 0.5));
  
  lambdaHome = Math.max(0.3, Math.min(4.0, lambdaHome));
  lambdaAway = Math.max(0.3, Math.min(4.0, lambdaAway));
  
  // Dixon-Coles tau function for 0-0, 1-0, 0-1, 1-1 adjustments
  function tau(x: number, y: number, lambda: number, mu: number, rho: number): number {
    if (x === 0 && y === 0) {
      return 1 - lambda * mu * rho;
    } else if (x === 0 && y === 1) {
      return 1 + lambda * rho;
    } else if (x === 1 && y === 0) {
      return 1 + mu * rho;
    } else if (x === 1 && y === 1) {
      return 1 - rho;
    }
    return 1;
  }
  
  // Recalculate with Dixon-Coles adjustment
  let homeWin = 0;
  let awayWin = 0;
  let draw = 0;
  
  for (let h = 0; h <= config.maxGoals; h++) {
    for (let a = 0; a <= config.maxGoals; a++) {
      const baseProb = poissonPMF(lambdaHome, h) * poissonPMF(lambdaAway, a);
      const adjustment = tau(h, a, lambdaHome, lambdaAway, rho);
      const prob = baseProb * adjustment;
      
      if (h > a) homeWin += prob;
      else if (a > h) awayWin += prob;
      else draw += prob;
    }
  }
  
  const total = homeWin + awayWin + draw;
  
  return {
    home: homeWin / total,
    away: awayWin / total,
    draw: draw / total,
    method: 'dixon-coles',
  };
}

// ============================================
// BASKETBALL MODEL (Elo-based)
// ============================================

/**
 * Elo-based model for basketball
 * Uses point differential and recent form
 */
export function basketballEloModel(input: ModelInput): RawProbabilities {
  const config = SPORT_CONFIG.basketball;
  
  // Calculate Elo-like ratings from point differential
  const homePointDiff = input.homeStats.played > 0
    ? (input.homeStats.scored - input.homeStats.conceded) / input.homeStats.played
    : 0;
  const awayPointDiff = input.awayStats.played > 0
    ? (input.awayStats.scored - input.awayStats.conceded) / input.awayStats.played
    : 0;
  
  // Base Elo = 1500 + pointDiff * scaling factor
  const eloScale = 25; // Points of rating per point differential
  let homeElo = 1500 + homePointDiff * eloScale;
  let awayElo = 1500 + awayPointDiff * eloScale;
  
  // Form adjustment
  const homeFormFactor = calculateFormStrength(input.homeForm, false);
  const awayFormFactor = calculateFormStrength(input.awayForm, false);
  
  // Form translates to ~50 Elo points swing
  homeElo += (homeFormFactor - 0.5) * 100 * config.formWeight;
  awayElo += (awayFormFactor - 0.5) * 100 * config.formWeight;
  
  // Home court advantage (in Elo points)
  homeElo += config.homeAdvantage * eloScale;
  
  // H2H adjustment
  if (input.h2h && input.h2h.total >= 3) {
    const h2hHomeWinRate = input.h2h.homeWins / input.h2h.total;
    if (h2hHomeWinRate > 0.6) {
      homeElo += 25;
    } else if (h2hHomeWinRate < 0.4) {
      awayElo += 25;
    }
  }
  
  // Elo expected score formula
  const eloDiff = homeElo - awayElo;
  const homeWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
  const awayWinProb = 1 - homeWinProb;
  
  return {
    home: homeWinProb,
    away: awayWinProb,
    // No draw in basketball
    method: 'elo',
  };
}

// ============================================
// AMERICAN FOOTBALL MODEL (Elo-based)
// ============================================

/**
 * Elo-based model for American football
 * Similar to basketball but with different parameters
 */
export function footballEloModel(input: ModelInput): RawProbabilities {
  const config = SPORT_CONFIG.football;
  
  // Point differential
  const homePointDiff = input.homeStats.played > 0
    ? (input.homeStats.scored - input.homeStats.conceded) / input.homeStats.played
    : 0;
  const awayPointDiff = input.awayStats.played > 0
    ? (input.awayStats.scored - input.awayStats.conceded) / input.awayStats.played
    : 0;
  
  const eloScale = 15;
  let homeElo = 1500 + homePointDiff * eloScale;
  let awayElo = 1500 + awayPointDiff * eloScale;
  
  // Form adjustment
  const homeFormFactor = calculateFormStrength(input.homeForm, false);
  const awayFormFactor = calculateFormStrength(input.awayForm, false);
  
  homeElo += (homeFormFactor - 0.5) * 100 * config.formWeight;
  awayElo += (awayFormFactor - 0.5) * 100 * config.formWeight;
  
  // Home field advantage
  homeElo += config.homeAdvantage * eloScale;
  
  // Calculate probabilities
  const eloDiff = homeElo - awayElo;
  const homeWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
  
  // NFL games can tie (rare) - about 0.3% historically
  const drawProb = 0.003;
  const adjustedHomeWin = homeWinProb * (1 - drawProb);
  const adjustedAwayWin = (1 - homeWinProb) * (1 - drawProb);
  
  return {
    home: adjustedHomeWin,
    away: adjustedAwayWin,
    draw: drawProb,
    method: 'elo',
  };
}

// ============================================
// HOCKEY MODEL (Simplified Elo-based)
// ============================================

/**
 * Elo-based model for hockey
 * 
 * CRITICAL FIX: Previous Poisson model had 19.4% accuracy (worse than random!)
 * NHL has high parity, OT/SO randomness, and goaltender variance.
 * 
 * New approach:
 * - Use Elo-style model (works for NFL at 72.7%)
 * - Reduce home advantage (NHL home edge is ~52-53%, not much)
 * - Heavy regression to mean (high parity league)
 * - Conservative probability spread (avoid overconfidence)
 */
export function hockeyPoissonModel(input: ModelInput): RawProbabilities {
  const config = SPORT_CONFIG.hockey;
  
  // NHL has very high parity - most teams are close in skill
  // Use goal differential as primary strength indicator
  const homeGoalDiff = input.homeStats.played > 0
    ? (input.homeStats.scored - input.homeStats.conceded) / input.homeStats.played
    : 0;
  const awayGoalDiff = input.awayStats.played > 0
    ? (input.awayStats.scored - input.awayStats.conceded) / input.awayStats.played
    : 0;
  
  // NHL goal differentials typically range from -1.0 to +1.0
  // Convert to Elo-style rating (baseline 1500)
  const eloScale = 100; // 1 goal/game diff = 100 Elo points
  let homeElo = 1500 + homeGoalDiff * eloScale;
  let awayElo = 1500 + awayGoalDiff * eloScale;
  
  // HEAVY regression to mean for NHL (high parity)
  // Regress toward 1500 based on games played
  const homeWeight = Math.min(0.7, input.homeStats.played / 40); // Max 70% weight at 40 games
  const awayWeight = Math.min(0.7, input.awayStats.played / 40);
  homeElo = homeWeight * homeElo + (1 - homeWeight) * 1500;
  awayElo = awayWeight * awayElo + (1 - awayWeight) * 1500;
  
  // Form adjustment (reduced weight - hockey is streaky but regresses)
  const homeFormFactor = calculateFormStrength(input.homeForm, false);
  const awayFormFactor = calculateFormStrength(input.awayForm, false);
  
  // Only 20% form weight (reduced from 35%)
  homeElo += (homeFormFactor - 0.5) * 50 * 0.20;
  awayElo += (awayFormFactor - 0.5) * 50 * 0.20;
  
  // Home ice advantage (minimal in NHL - about 52-53%)
  // Convert to Elo: 52% win rate = ~14 Elo points
  homeElo += 15;
  
  // Calculate win probability using Elo formula
  const eloDiff = homeElo - awayElo;
  const rawHomeWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
  
  // CONSERVATIVE CLAMPING for NHL (high variance sport)
  // Don't allow probabilities above 65% or below 35%
  // This reflects the reality that NHL games are unpredictable
  const homeWinProb = Math.max(0.35, Math.min(0.65, rawHomeWinProb));
  const awayWinProb = 1 - homeWinProb;
  
  return {
    home: homeWinProb,
    away: awayWinProb,
    // No draw in NHL (OT/SO decides)
    method: 'elo-conservative',
  };
}

// ============================================
// MAIN MODEL DISPATCHER
// ============================================

/**
 * Get the appropriate model for a sport
 */
export function getModelForSport(sport: SportType): (input: ModelInput) => RawProbabilities {
  switch (sport) {
    case 'soccer':
      return soccerDixonColesModel; // Use Dixon-Coles as default for soccer
    case 'basketball':
      return basketballEloModel;
    case 'football':
      return footballEloModel;
    case 'hockey':
      return hockeyPoissonModel;
    default:
      return soccerPoissonModel; // Default fallback
  }
}

/**
 * Main prediction function
 * Runs the appropriate model and returns raw probabilities
 */
export function predictMatch(input: ModelInput): RawProbabilities {
  const model = getModelForSport(input.sport as SportType);
  return model(input);
}

/**
 * Get expected scores for display
 */
export function getExpectedScores(input: ModelInput): { home: number; away: number } {
  const config = SPORT_CONFIG[input.sport as SportType] || SPORT_CONFIG.soccer;
  const leagueAvg = input.leagueAverageGoals || 
    ('leagueAvgGoals' in config ? (config as typeof SPORT_CONFIG.soccer).leagueAvgGoals : 2.5);
  const avgPerTeam = leagueAvg / 2;
  
  const homeStrength = calculateTeamStrength(input.homeStats, avgPerTeam, avgPerTeam);
  const awayStrength = calculateTeamStrength(input.awayStats, avgPerTeam, avgPerTeam);
  
  const baseHomeExpected = homeStrength.attack * (2 - awayStrength.defense) * avgPerTeam;
  const awayExpected = awayStrength.attack * (2 - homeStrength.defense) * avgPerTeam;
  
  // Apply home advantage
  const homeAdv = 'homeAdvantage' in config ? config.homeAdvantage : 0.25;
  const homeExpected = baseHomeExpected * (1 + homeAdv);
  
  return {
    home: Math.round(homeExpected * 10) / 10,
    away: Math.round(awayExpected * 10) / 10,
  };
}
