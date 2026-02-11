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
export type { ModelInput }; // Re-export for use in other modules

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const SPORT_CONFIG = {
  soccer: {
    homeAdvantage: 0.25,      // Goals boost for home team
    leagueAvgGoals: 2.5,      // TOTAL goals per game (divided by 2 for per-team)
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
    leagueAvgGoals: 6.2,      // NHL TOTAL goals per game (2024: ~6.2), divided by 2 for per-team
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

  // FIX: Guard against division by zero and zero stats
  // If team has 0 goals scored/conceded, use league average as fallback
  let rawAttack: number;
  let rawDefense: number;

  if (avgScored <= 0) {
    // No goals scored - use slightly below average attack (0.8)
    rawAttack = 0.8;
    console.log(`[calculateTeamStrength] Warning: Zero goals scored, using fallback attack=0.8`);
  } else {
    rawAttack = leagueAvgScored > 0 ? avgScored / leagueAvgScored : 1.0;
  }

  if (avgConceded <= 0) {
    // No goals conceded - either great defense OR no data
    // Be conservative: use league average defense (1.0) not super defense
    rawDefense = 1.0;
    console.log(`[calculateTeamStrength] Warning: Zero goals conceded, using fallback defense=1.0`);
  } else {
    // Raw defense strength (inverted - lower conceded = higher strength)
    rawDefense = leagueAvgConceded > 0 ? leagueAvgConceded / avgConceded : 1.0;
  }

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
 * Sport-aware: uses leagueAvgPoints for basketball/NFL, leagueAvgGoals for soccer/hockey
 * 
 * FIX: Now accepts optional odds data for more accurate soccer predictions
 * when team stats are missing (stats.played === 0).
 */
export function getExpectedScores(
  input: ModelInput,
  odds?: { homeOdds?: number; awayOdds?: number; drawOdds?: number }
): { home: number; away: number } {
  // Normalize sport key for config lookup
  const sportKey = input.sport.includes('hockey') || input.sport.includes('nhl') ? 'hockey' :
                   input.sport.includes('basketball') ? 'basketball' :
                   input.sport.includes('football') && !input.sport.includes('soccer') ? 'football' :
                   'soccer';
  const config = SPORT_CONFIG[sportKey as SportType] || SPORT_CONFIG.soccer;
  
  // FIX: Use includes() to handle 'basketball_nba' and 'americanfootball_nfl'
  const isHockey = input.sport.includes('hockey') || input.sport.includes('nhl');
  const isHighScoringSport = input.sport.includes('basketball') || (input.sport.includes('football') && !input.sport.includes('soccer'));
  const isSoccer = !isHighScoringSport && !isHockey;

  // Check if we have meaningful stats
  const hasHomeStats = input.homeStats.played > 0 && input.homeStats.scored > 0;
  const hasAwayStats = input.awayStats.played > 0 && input.awayStats.scored > 0;
  const hasStats = hasHomeStats && hasAwayStats;

  // For hockey/NHL with missing stats: Use league average + odds adjustment
  if (isHockey && !hasStats) {
    console.log(`[getExpectedScores] Using league average for hockey (no stats)`);
    // NHL averages: ~3.1 goals/game per team, home team slightly higher
    let homeGoals = 3.2;
    let awayGoals = 2.9;
    
    // If we have odds, adjust based on favorite strength
    // This gives more realistic score spreads based on market expectations
    if (odds?.homeOdds && odds?.awayOdds) {
      const homeProb = 1 / odds.homeOdds;
      const awayProb = 1 / odds.awayOdds;
      const total = homeProb + awayProb;
      const normHomeProb = homeProb / total;
      
      // Stronger swing ±0.8 goals based on favorite for meaningful variation
      // normHomeProb: 0.5 = even, 0.6 = home slight fav, 0.7 = home big fav
      const homeAdj = (normHomeProb - 0.5) * 1.6; // ±0.8 for strong favorites
      homeGoals = Math.max(2.4, Math.min(4.2, 3.2 + homeAdj));
      awayGoals = Math.max(2.2, Math.min(3.6, 2.9 - homeAdj * 0.6)); // Away adjusts less
    }
    
    return {
      home: Math.round(homeGoals * 10) / 10,
      away: Math.round(awayGoals * 10) / 10,
    };
  }

  // For NBA with missing stats: Use league average + odds adjustment
  if (input.sport.includes('basketball') && !hasStats) {
    console.log(`[getExpectedScores] Using league average for NBA (no stats)`);
    let homePoints = 114;  // NBA 2024 avg ~226 total
    let awayPoints = 112;
    
    // If we have odds, adjust based on favorite
    if (odds?.homeOdds && odds?.awayOdds) {
      const homeProb = 1 / odds.homeOdds;
      const awayProb = 1 / odds.awayOdds;
      const total = homeProb + awayProb;
      const normHomeProb = homeProb / total;
      
      // Swing ±5 points based on favorite
      const homeAdj = (normHomeProb - 0.5) * 10;
      homePoints = Math.max(105, Math.min(125, 114 + homeAdj));
      awayPoints = Math.max(100, Math.min(120, 112 - homeAdj));
    }
    
    return {
      home: Math.round(homePoints),
      away: Math.round(awayPoints),
    };
  }

  // For NFL with missing stats: Use league average + odds adjustment
  if ((input.sport.includes('football') && !input.sport.includes('soccer')) && !hasStats) {
    console.log(`[getExpectedScores] Using league average for NFL (no stats)`);
    let homePoints = 23;  // NFL 2024 avg ~44-46 total
    let awayPoints = 21;
    
    // If we have odds, adjust based on favorite
    if (odds?.homeOdds && odds?.awayOdds) {
      const homeProb = 1 / odds.homeOdds;
      const awayProb = 1 / odds.awayOdds;
      const total = homeProb + awayProb;
      const normHomeProb = homeProb / total;
      
      // Swing ±3 points based on favorite
      const homeAdj = (normHomeProb - 0.5) * 6;
      homePoints = Math.max(17, Math.min(30, 23 + homeAdj));
      awayPoints = Math.max(14, Math.min(27, 21 - homeAdj));
    }
    
    return {
      home: Math.round(homePoints),
      away: Math.round(awayPoints),
    };
  }

  // For soccer with missing stats: Use odds-based expected goals
  if (isSoccer && !hasStats && odds?.homeOdds && odds?.awayOdds) {
    console.log(`[getExpectedScores] Using odds-based calculation for soccer (no stats)`);

    // Convert odds to implied probabilities
    const homeProb = 1 / odds.homeOdds;
    const awayProb = 1 / odds.awayOdds;
    const drawProb = odds.drawOdds ? 1 / odds.drawOdds : 0.25;
    const total = homeProb + awayProb + drawProb;

    // Normalize probabilities
    const normHomeProb = homeProb / total;
    const normAwayProb = awayProb / total;
    const normDrawProb = drawProb / total;

    // Estimate expected goals based on probabilities
    // Higher win probability = more goals for that team
    // Average soccer match: ~2.5-2.8 total goals
    const avgTotalGoals = 2.65;

    // Strong favorites (>55%) typically score 1.5-2.5 goals
    // Underdogs (<30%) typically score 0.5-1.2 goals
    // Draw-heavy matches have lower totals

    // Scale factor: how many goals for a team given their win probability
    // If home has 60% win prob, they likely score ~1.8-2.0 goals
    // If away has 20% win prob, they likely score ~0.8-1.0 goals
    const homeGoals = avgTotalGoals * (0.3 + normHomeProb * 0.6) * (1 - normDrawProb * 0.3);
    const awayGoals = avgTotalGoals * (0.25 + normAwayProb * 0.5) * (1 - normDrawProb * 0.3);

    // Apply home advantage boost
    const homeAdvantage = 0.15;
    const adjustedHomeGoals = homeGoals * (1 + homeAdvantage);

    // Clamp to realistic soccer ranges
    return {
      home: Math.round(Math.max(0.5, Math.min(3.5, adjustedHomeGoals)) * 10) / 10,
      away: Math.round(Math.max(0.3, Math.min(2.5, awayGoals)) * 10) / 10,
    };
  }

  // Get the appropriate league average based on sport type
  let leagueAvgPerTeam: number;
  if (input.sport.includes('basketball')) {
    // leagueAvgPoints is already PER TEAM (110)
    leagueAvgPerTeam = input.leagueAverageGoals ||
      ('leagueAvgPoints' in config ? (config as typeof SPORT_CONFIG.basketball).leagueAvgPoints : 110);
  } else if (input.sport.includes('football') && !input.sport.includes('soccer')) {
    // leagueAvgPoints is already PER TEAM (22) - American football only
    leagueAvgPerTeam = input.leagueAverageGoals ||
      ('leagueAvgPoints' in config ? (config as typeof SPORT_CONFIG.football).leagueAvgPoints : 22);
  } else if (isHockey) {
    // NHL: leagueAvgGoals is TOTAL per game (6.2), divide by 2 for per-team (3.1)
    const totalGoals = input.leagueAverageGoals ||
      ('leagueAvgGoals' in config ? (config as typeof SPORT_CONFIG.hockey).leagueAvgGoals : 6.2);
    leagueAvgPerTeam = totalGoals / 2;
  } else {
    // Soccer: leagueAvgGoals is TOTAL, divide by 2
    const totalGoals = input.leagueAverageGoals ||
      ('leagueAvgGoals' in config ? (config as typeof SPORT_CONFIG.soccer).leagueAvgGoals : 2.5);
    leagueAvgPerTeam = totalGoals / 2;
  }

  const homeStrength = calculateTeamStrength(input.homeStats, leagueAvgPerTeam, leagueAvgPerTeam);
  const awayStrength = calculateTeamStrength(input.awayStats, leagueAvgPerTeam, leagueAvgPerTeam);

  let homeExpected: number;
  let awayExpected: number;

  if (isHighScoringSport) {
    // For basketball/NFL: Simple strength-based adjustment
    // Attack > 1.0 means team scores above average, Defense > 1.0 means team allows below average
    homeExpected = leagueAvgPerTeam * homeStrength.attack * (2 - awayStrength.defense);
    awayExpected = leagueAvgPerTeam * awayStrength.attack * (2 - homeStrength.defense);

    // Apply home advantage as additive points
    const homeAdv = 'homeAdvantage' in config ? config.homeAdvantage : 3;
    homeExpected += homeAdv;

    // Apply form adjustment (synced with Elo model logic)
    const homeFormFactor = calculateFormStrength(input.homeForm, false);
    const awayFormFactor = calculateFormStrength(input.awayForm, false);
    const formWeight = 'formWeight' in config ? config.formWeight : 0.35;
    homeExpected *= (1 + formWeight * (homeFormFactor - 0.5));
    awayExpected *= (1 + formWeight * (awayFormFactor - 0.5));

    // Clamp to reasonable ranges (NBA: 90-140, NFL: 10-45)
    if (input.sport.includes('basketball')) {
      homeExpected = Math.max(90, Math.min(140, homeExpected));
      awayExpected = Math.max(90, Math.min(140, awayExpected));
    } else {
      homeExpected = Math.max(10, Math.min(45, homeExpected));
      awayExpected = Math.max(10, Math.min(45, awayExpected));
    }
  } else {
    // For soccer/hockey: Poisson-style calculation
    // SYNCED with soccerDixonColesModel / soccerPoissonModel lambda calculation
    homeExpected = homeStrength.attack * (2 - awayStrength.defense) * leagueAvgPerTeam;
    awayExpected = awayStrength.attack * (2 - homeStrength.defense) * leagueAvgPerTeam;

    // Apply home advantage as percentage boost
    const homeAdv = 'homeAdvantage' in config ? config.homeAdvantage : 0.25;
    homeExpected *= (1 + homeAdv);

    // Apply form adjustment (synced with Dixon-Coles/Poisson model)
    const hasDraw = isSoccer || isHockey;
    const homeFormFactor = calculateFormStrength(input.homeForm, hasDraw);
    const awayFormFactor = calculateFormStrength(input.awayForm, hasDraw);
    const formWeight = 'formWeight' in config ? config.formWeight : 0.3;
    homeExpected *= (1 + formWeight * (homeFormFactor - 0.5));
    awayExpected *= (1 + formWeight * (awayFormFactor - 0.5));

    // H2H adjustment (synced with Dixon-Coles/Poisson model)
    if (input.h2h && input.h2h.total >= 3) {
      const h2hHomeWinRate = input.h2h.homeWins / input.h2h.total;
      const h2hAwayWinRate = input.h2h.awayWins / input.h2h.total;
      if (h2hHomeWinRate > 0.6) homeExpected *= 1.05;
      else if (h2hAwayWinRate > 0.6) awayExpected *= 1.05;
    }

    // Clamp to match Dixon-Coles ranges
    if (isSoccer) {
      homeExpected = Math.max(0.3, Math.min(4.0, homeExpected));
      awayExpected = Math.max(0.3, Math.min(4.0, awayExpected));
    }

    // Hockey-specific: Clamp to realistic NHL ranges (2-5 goals typical)
    if (input.sport.includes('hockey') || input.sport.includes('nhl')) {
      homeExpected = Math.max(2.0, Math.min(5.5, homeExpected));
      awayExpected = Math.max(2.0, Math.min(5.0, awayExpected));
    }
  }

  return {
    home: Math.round(homeExpected * 10) / 10,
    away: Math.round(awayExpected * 10) / 10,
  };
}

/**
 * Validate consistency between predicted score and model probabilities.
 * 
 * For soccer: derives implied home win % from predicted score lambdas
 * using the same Poisson grid, then checks divergence from pipeline probabilities.
 * 
 * Returns a warning string if divergence exceeds threshold, null otherwise.
 */
export function validateScoreProbabilityConsistency(
  expectedScores: { home: number; away: number },
  probabilities: { home: number; away: number; draw?: number },
  sport: string,
  threshold: number = 10 // percentage points
): { consistent: boolean; warning: string | null; impliedHomeWin: number; impliedAwayWin: number; impliedDraw: number } {
  const isSoccer = !sport.includes('basketball') && !sport.includes('football') &&
                   !sport.includes('hockey') && !sport.includes('nhl');

  if (isSoccer) {
    // Derive implied probabilities from expected score lambdas via Poisson
    const lambdaHome = expectedScores.home;
    const lambdaAway = expectedScores.away;
    let homeWin = 0, awayWin = 0, draw = 0;

    for (let h = 0; h <= 10; h++) {
      for (let a = 0; a <= 10; a++) {
        const prob = poissonPMF(lambdaHome, h) * poissonPMF(lambdaAway, a);
        if (h > a) homeWin += prob;
        else if (a > h) awayWin += prob;
        else draw += prob;
      }
    }

    const total = homeWin + awayWin + draw;
    const impliedHomeWin = (homeWin / total) * 100;
    const impliedAwayWin = (awayWin / total) * 100;
    const impliedDraw = (draw / total) * 100;

    // Compare with pipeline probabilities (already in percentage)
    const homeDiv = Math.abs(impliedHomeWin - probabilities.home);
    const awayDiv = Math.abs(impliedAwayWin - probabilities.away);
    const maxDiv = Math.max(homeDiv, awayDiv);

    if (maxDiv > threshold) {
      return {
        consistent: false,
        warning: `Score ${expectedScores.home}-${expectedScores.away} implies ${impliedHomeWin.toFixed(1)}%/${impliedDraw.toFixed(1)}%/${impliedAwayWin.toFixed(1)}% but model says ${probabilities.home.toFixed(1)}%/${(probabilities.draw || 0).toFixed(1)}%/${probabilities.away.toFixed(1)}% (divergence: ${maxDiv.toFixed(1)}pp)`,
        impliedHomeWin,
        impliedAwayWin,
        impliedDraw,
      };
    }
    return { consistent: true, warning: null, impliedHomeWin, impliedAwayWin, impliedDraw };
  }

  // For non-soccer: simple score differential consistency
  const scoreDiff = expectedScores.home - expectedScores.away;
  const probDiff = probabilities.home - probabilities.away;
  // Score difference and probability difference should have the same sign
  const signMismatch = (scoreDiff > 0.5 && probDiff < -5) || (scoreDiff < -0.5 && probDiff > 5);

  return {
    consistent: !signMismatch,
    warning: signMismatch
      ? `Score ${expectedScores.home}-${expectedScores.away} (diff ${scoreDiff > 0 ? '+' : ''}${scoreDiff.toFixed(1)}) conflicts with prob diff (${probDiff > 0 ? '+' : ''}${probDiff.toFixed(1)}%)`
      : null,
    impliedHomeWin: probabilities.home,
    impliedAwayWin: probabilities.away,
    impliedDraw: probabilities.draw || 0,
  };
}
