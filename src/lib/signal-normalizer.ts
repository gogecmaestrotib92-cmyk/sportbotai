/**
 * Signal Normalizer - Universal Metric Framework
 * 
 * Converts raw sports data into 5 normalized signals that work across ALL sports:
 * 1. Form (strong | neutral | weak)
 * 2. Strength Edge (home +X% | away +X% | even)
 * 3. Tempo (low | medium | high)
 * 4. Efficiency Edge (home | away | none)
 * 5. Availability Impact (low | medium | high)
 * 
 * The AI never sees raw stats - only these normalized signals.
 * This creates consistent, confident analysis across all sports.
 */

export type Sport = 'soccer' | 'basketball' | 'football' | 'hockey' | 'mma';

export interface NormalizedSignals {
  sport: Sport;
  form: {
    home: 'strong' | 'neutral' | 'weak';
    away: 'strong' | 'neutral' | 'weak';
    comparison: 'home_advantage' | 'away_advantage' | 'balanced';
  };
  strengthEdge: {
    direction: 'home' | 'away' | 'even';
    magnitude: number; // percentage points
    label: string; // e.g., "Home +6%"
  };
  tempo: {
    expected: 'low' | 'medium' | 'high';
    note?: string;
  };
  efficiencyEdge: {
    direction: 'home' | 'away' | 'none';
    aspect?: string; // e.g., "offense", "defense", "goaltending"
  };
  availabilityImpact: {
    level: 'low' | 'medium' | 'high';
    note?: string;
  };
  // Optional market signal
  marketSignal?: 'early_move' | 'late_move' | 'stable' | 'volatile';
}

export interface RawMatchData {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  // Form data
  homeForm: string; // e.g., "WWLDW"
  awayForm: string;
  homeWins: number;
  homeLosses: number;
  homeDraws?: number;
  awayWins: number;
  awayLosses: number;
  awayDraws?: number;
  // Stats
  homeGoalsScored: number;
  homeGoalsConceded: number;
  awayGoalsScored: number;
  awayGoalsConceded: number;
  homePlayed: number;
  awayPlayed: number;
  // H2H
  h2hHomeWins: number;
  h2hAwayWins: number;
  h2hDraws?: number;
  h2hTotal: number;
  // Optional advanced metrics
  homeXG?: number;
  awayXG?: number;
  homePossession?: number;
  awayPossession?: number;
  // Injuries/availability
  homeInjuries?: number;
  awayInjuries?: number;
  homeKeyPlayersOut?: string[];
  awayKeyPlayersOut?: string[];
}

/**
 * Normalize sport string to standard format
 */
export function normalizeSportType(sport: string): Sport {
  const s = sport.toLowerCase();
  if (s.includes('basketball') || s.includes('nba')) return 'basketball';
  if (s.includes('american') || s.includes('nfl')) return 'football';
  if (s.includes('hockey') || s.includes('nhl')) return 'hockey';
  return 'soccer';
}

/**
 * Calculate form rating from W/L/D string
 * Returns a value from 0-100
 */
function calculateFormRating(form: string, hasDraw: boolean): number {
  if (!form || form.length === 0) return 50;
  
  let points = 0;
  const maxPointsPerGame = hasDraw ? 3 : 1;
  
  // Recent games weighted more heavily
  const weights = [1.5, 1.3, 1.1, 1.0, 0.9]; // Most recent first
  
  for (let i = 0; i < Math.min(form.length, 5); i++) {
    const result = form[i].toUpperCase();
    const weight = weights[i] || 1;
    
    if (result === 'W') {
      points += (hasDraw ? 3 : 1) * weight;
    } else if (result === 'D' && hasDraw) {
      points += 1 * weight;
    }
    // L = 0 points
  }
  
  const maxPossible = weights.slice(0, Math.min(form.length, 5)).reduce((a, b) => a + b, 0) * maxPointsPerGame;
  return maxPossible > 0 ? (points / maxPossible) * 100 : 50;
}

/**
 * Convert form rating to label
 */
function formRatingToLabel(rating: number): 'strong' | 'neutral' | 'weak' {
  if (rating >= 65) return 'strong';
  if (rating <= 35) return 'weak';
  return 'neutral';
}

/**
 * Calculate strength edge based on win rates and goal differential
 */
function calculateStrengthEdge(data: RawMatchData): { direction: 'home' | 'away' | 'even'; magnitude: number } {
  // Home win rate
  const homeWinRate = data.homePlayed > 0 ? data.homeWins / data.homePlayed : 0.5;
  // Away win rate
  const awayWinRate = data.awayPlayed > 0 ? data.awayWins / data.awayPlayed : 0.5;
  
  // Goal differential per game
  const homeGD = data.homePlayed > 0 
    ? (data.homeGoalsScored - data.homeGoalsConceded) / data.homePlayed 
    : 0;
  const awayGD = data.awayPlayed > 0 
    ? (data.awayGoalsScored - data.awayGoalsConceded) / data.awayPlayed 
    : 0;
  
  // H2H factor (if available)
  const h2hFactor = data.h2hTotal > 0
    ? (data.h2hHomeWins - data.h2hAwayWins) / data.h2hTotal * 0.1
    : 0;
  
  // Home advantage baseline (varies by sport)
  const homeAdvantage = 0.03; // 3% base home advantage
  
  // Combined edge calculation
  const winRateDiff = (homeWinRate - awayWinRate);
  const gdDiff = (homeGD - awayGD) * 0.05; // Scale goal diff contribution
  
  const totalEdge = (winRateDiff + gdDiff + h2hFactor + homeAdvantage) * 100;
  
  // Clamp to reasonable range
  const clampedEdge = Math.max(-20, Math.min(20, totalEdge));
  
  if (Math.abs(clampedEdge) < 3) {
    return { direction: 'even', magnitude: 0 };
  }
  
  return {
    direction: clampedEdge > 0 ? 'home' : 'away',
    magnitude: Math.abs(Math.round(clampedEdge))
  };
}

/**
 * Calculate expected tempo based on scoring rates
 */
function calculateTempo(data: RawMatchData, sport: Sport): 'low' | 'medium' | 'high' {
  // Average goals/points per game for each team
  const homeScoring = data.homePlayed > 0 ? data.homeGoalsScored / data.homePlayed : 0;
  const awayScoring = data.awayPlayed > 0 ? data.awayGoalsScored / data.awayPlayed : 0;
  const avgScoring = (homeScoring + awayScoring) / 2;
  
  // Sport-specific thresholds
  const thresholds = {
    soccer: { low: 1.2, high: 1.8 },      // goals per game
    basketball: { low: 105, high: 115 },   // points per game
    football: { low: 20, high: 28 },       // points per game
    hockey: { low: 2.5, high: 3.5 },       // goals per game
    mma: { low: 1, high: 3 },              // rounds (fights typically end in 1-5 rounds)
  };
  
  const t = thresholds[sport];
  
  if (avgScoring < t.low) return 'low';
  if (avgScoring > t.high) return 'high';
  return 'medium';
}

/**
 * Calculate efficiency edge
 */
function calculateEfficiencyEdge(data: RawMatchData): { direction: 'home' | 'away' | 'none'; aspect?: string } {
  // Offensive efficiency (scoring rate)
  const homeOffEff = data.homePlayed > 0 ? data.homeGoalsScored / data.homePlayed : 0;
  const awayOffEff = data.awayPlayed > 0 ? data.awayGoalsScored / data.awayPlayed : 0;
  
  // Defensive efficiency (conceding rate - lower is better)
  const homeDefEff = data.homePlayed > 0 ? data.homeGoalsConceded / data.homePlayed : 999;
  const awayDefEff = data.awayPlayed > 0 ? data.awayGoalsConceded / data.awayPlayed : 999;
  
  // Net efficiency
  const homeNet = homeOffEff - homeDefEff;
  const awayNet = awayOffEff - awayDefEff;
  
  const diff = homeNet - awayNet;
  
  if (Math.abs(diff) < 0.2) {
    return { direction: 'none' };
  }
  
  // Determine if edge is offensive or defensive
  const offDiff = homeOffEff - awayOffEff;
  const defDiff = awayDefEff - homeDefEff; // Reversed because lower is better
  
  let aspect: string | undefined;
  if (Math.abs(offDiff) > Math.abs(defDiff)) {
    aspect = 'offense';
  } else {
    aspect = 'defense';
  }
  
  return {
    direction: diff > 0 ? 'home' : 'away',
    aspect
  };
}

/**
 * Calculate availability impact based on injuries/absences
 */
function calculateAvailabilityImpact(data: RawMatchData): { level: 'low' | 'medium' | 'high'; note?: string } {
  const totalInjuries = (data.homeInjuries || 0) + (data.awayInjuries || 0);
  const keyPlayersOut = [
    ...(data.homeKeyPlayersOut || []),
    ...(data.awayKeyPlayersOut || [])
  ];
  
  // Check for key players
  if (keyPlayersOut.length >= 2) {
    return { 
      level: 'high', 
      note: `Key absences on ${data.homeKeyPlayersOut?.length ? 'both sides' : 'one side'}` 
    };
  }
  
  if (keyPlayersOut.length === 1 || totalInjuries >= 4) {
    return { 
      level: 'medium',
      note: keyPlayersOut[0] ? `${keyPlayersOut[0]} unavailable` : undefined
    };
  }
  
  return { level: 'low' };
}

/**
 * Main normalization function - converts raw data to universal signals
 */
export function normalizeMatchSignals(data: RawMatchData): NormalizedSignals {
  const sport = normalizeSportType(data.sport);
  const hasDraw = sport === 'soccer' || sport === 'hockey';
  
  // Calculate form
  const homeFormRating = calculateFormRating(data.homeForm, hasDraw);
  const awayFormRating = calculateFormRating(data.awayForm, hasDraw);
  const homeFormLabel = formRatingToLabel(homeFormRating);
  const awayFormLabel = formRatingToLabel(awayFormRating);
  
  // Form comparison
  let formComparison: 'home_advantage' | 'away_advantage' | 'balanced';
  if (homeFormRating > awayFormRating + 15) {
    formComparison = 'home_advantage';
  } else if (awayFormRating > homeFormRating + 15) {
    formComparison = 'away_advantage';
  } else {
    formComparison = 'balanced';
  }
  
  // Strength edge
  const strengthEdge = calculateStrengthEdge(data);
  
  // Tempo
  const tempo = calculateTempo(data, sport);
  
  // Efficiency
  const efficiency = calculateEfficiencyEdge(data);
  
  // Availability
  const availability = calculateAvailabilityImpact(data);
  
  return {
    sport,
    form: {
      home: homeFormLabel,
      away: awayFormLabel,
      comparison: formComparison,
    },
    strengthEdge: {
      direction: strengthEdge.direction,
      magnitude: strengthEdge.magnitude,
      label: strengthEdge.direction === 'even' 
        ? 'Even' 
        : `${strengthEdge.direction === 'home' ? 'Home' : 'Away'} +${strengthEdge.magnitude}%`,
    },
    tempo: {
      expected: tempo,
    },
    efficiencyEdge: {
      direction: efficiency.direction,
      aspect: efficiency.aspect,
    },
    availabilityImpact: {
      level: availability.level,
      note: availability.note,
    },
  };
}

/**
 * Format signals for AI consumption
 * This is the exact format the SportBotAgent receives
 */
export function formatSignalsForAI(signals: NormalizedSignals): string {
  return `Sport: ${signals.sport}

Match Context:
- form: ${signals.form.home} (home) vs ${signals.form.away} (away) — ${signals.form.comparison.replace('_', ' ')}
- strength_edge: ${signals.strengthEdge.label}
- tempo: ${signals.tempo.expected}${signals.tempo.note ? ` (${signals.tempo.note})` : ''}
- efficiency_edge: ${signals.efficiencyEdge.direction}${signals.efficiencyEdge.aspect ? ` (${signals.efficiencyEdge.aspect})` : ''}
- availability_impact: ${signals.availabilityImpact.level}${signals.availabilityImpact.note ? ` — ${signals.availabilityImpact.note}` : ''}`;
}

/**
 * Generate a confidence level based on signal clarity
 */
export function calculateConfidence(signals: NormalizedSignals): 'high' | 'medium' | 'low' {
  let clarity = 0;
  
  // Clear form advantage
  if (signals.form.comparison !== 'balanced') clarity++;
  
  // Clear strength edge
  if (signals.strengthEdge.magnitude >= 5) clarity++;
  
  // Efficiency edge exists
  if (signals.efficiencyEdge.direction !== 'none') clarity++;
  
  // Low availability impact (less uncertainty)
  if (signals.availabilityImpact.level === 'low') clarity++;
  
  if (clarity >= 3) return 'high';
  if (clarity >= 2) return 'medium';
  return 'low';
}
