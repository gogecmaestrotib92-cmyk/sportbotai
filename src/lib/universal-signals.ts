/**
 * Universal Signals Framework
 * 
 * Every sport maps into 5 normalized signals:
 * 1. Form (strong | neutral | weak | trending_up | trending_down)
 * 2. Strength Edge (home +X% | away +X% | even)
 * 3. Tempo (low | medium | high | controlled | fast)
 * 4. Efficiency Edge (home | away | balanced) + aspect
 * 5. Availability Impact (low | medium | high | critical)
 * 
 * The AI NEVER sees raw stats. Only these clean labels + deltas.
 * This creates consistent, confident analysis across ALL sports.
 */

// ============================================
// TYPES
// ============================================

export type SportType = 'soccer' | 'basketball' | 'football' | 'hockey' | 'mma';

export interface UniversalSignals {
  // The 5 core signals - exactly what AI sees
  form: string;                    // "Strong" | "Neutral" | "Weak" | "Trending Up" | "Improving"
  strength_edge: string;           // "Home +6%" | "Away +4%" | "Even"
  tempo: string;                   // "High" | "Medium" | "Low" | "Fast-Paced" | "Controlled"
  efficiency_edge: string;         // "Home offense" | "Away defense" | "Balanced"
  availability_impact: string;     // "Low" | "Medium" | "High" | "Critical"
  
  // For UI display (more detailed)
  display: {
    form: {
      home: 'strong' | 'neutral' | 'weak';
      away: 'strong' | 'neutral' | 'weak';
      trend: 'home_better' | 'away_better' | 'balanced';
      label: string;
    };
    edge: {
      direction: 'home' | 'away' | 'even';
      percentage: number;
      label: string;
    };
    tempo: {
      level: 'low' | 'medium' | 'high';
      label: string;
    };
    efficiency: {
      winner: 'home' | 'away' | 'balanced';
      aspect: 'offense' | 'defense' | 'both' | null;
      label: string;
    };
    availability: {
      level: 'low' | 'medium' | 'high' | 'critical';
      note: string | null;
      label: string;
      homeInjuries?: Array<{ player: string; position?: string; reason?: string; details?: string }>;
      awayInjuries?: Array<{ player: string; position?: string; reason?: string; details?: string }>;
    };
  };
  
  // Derived confidence
  confidence: 'high' | 'medium' | 'low';
  clarity_score: number; // 0-100
}

export interface RawMatchInput {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  
  // Form (last 5 games)
  homeForm: string;      // "WWLDW"
  awayForm: string;
  
  // Core stats
  homeStats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    scored: number;      // Points/Goals scored
    conceded: number;    // Points/Goals conceded
  };
  awayStats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    scored: number;
    conceded: number;
  };
  
  // H2H
  h2h: {
    total: number;
    homeWins: number;
    awayWins: number;
    draws: number;
  };
  
  // Optional: Injuries/Availability
  homeInjuries?: string[];
  awayInjuries?: string[];
  homeKeyOut?: string[];   // Key players definitely out
  awayKeyOut?: string[];
  
  // Rich injury data (when available)
  homeInjuryDetails?: Array<{ player: string; position?: string; reason?: string; details?: string }>;
  awayInjuryDetails?: Array<{ player: string; position?: string; reason?: string; details?: string }>;
}

// ============================================
// SPORT-SPECIFIC CONFIGS
// ============================================

interface SportConfig {
  hasDraw: boolean;
  tempoThresholds: { low: number; high: number };
  homeAdvantage: number;        // Base home advantage %
  efficiencyThreshold: number;  // Min diff to declare edge
  scoringUnit: string;
}

const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  soccer: {
    hasDraw: true,
    tempoThresholds: { low: 1.2, high: 2.0 },  // Goals per game
    homeAdvantage: 0.04,
    efficiencyThreshold: 0.15,
    scoringUnit: 'goals',
  },
  basketball: {
    hasDraw: false,
    tempoThresholds: { low: 100, high: 115 },  // Points per game
    homeAdvantage: 0.03,
    efficiencyThreshold: 3,
    scoringUnit: 'points',
  },
  football: {
    hasDraw: true,
    tempoThresholds: { low: 18, high: 28 },    // Points per game
    homeAdvantage: 0.025,
    efficiencyThreshold: 2,
    scoringUnit: 'points',
  },
  hockey: {
    hasDraw: false,  // NHL has OT/SO
    tempoThresholds: { low: 2.3, high: 3.2 },  // Goals per game
    homeAdvantage: 0.035,
    efficiencyThreshold: 0.2,
    scoringUnit: 'goals',
  },
  mma: {
    hasDraw: true,   // Draws are rare but possible
    tempoThresholds: { low: 1, high: 3 },      // Rounds (1-5)
    homeAdvantage: 0.0,                         // No home advantage in MMA
    efficiencyThreshold: 10,                    // Win rate difference %
    scoringUnit: 'rounds',
  },
};

// ============================================
// CORE CALCULATION FUNCTIONS
// ============================================

/**
 * Detect sport type from string
 */
export function detectSport(sport: string): SportType {
  const s = sport.toLowerCase();
  if (s.includes('mma') || s.includes('ufc') || s.includes('mixed_martial') || s.includes('bellator') || s.includes('pfl')) return 'mma';
  if (s.includes('basketball') || s.includes('nba') || s.includes('euroleague')) return 'basketball';
  if (s.includes('american') || s.includes('nfl') || s.includes('ncaa')) return 'football';
  if (s.includes('hockey') || s.includes('nhl') || s.includes('khl')) return 'hockey';
  return 'soccer';
}

/**
 * Calculate weighted form rating (recent games weighted more)
 */
function calculateFormRating(form: string, hasDraw: boolean): number {
  if (!form || form.length === 0) return 50;
  
  const weights = [1.5, 1.3, 1.1, 1.0, 0.9]; // Most recent = highest weight
  const maxPointsPerGame = hasDraw ? 3 : 1;
  
  let points = 0;
  let maxPossible = 0;
  
  for (let i = 0; i < Math.min(form.length, 5); i++) {
    const result = form[i].toUpperCase();
    const weight = weights[i] || 1;
    maxPossible += maxPointsPerGame * weight;
    
    if (result === 'W') {
      points += maxPointsPerGame * weight;
    } else if (result === 'D' && hasDraw) {
      points += 1 * weight;
    }
  }
  
  return maxPossible > 0 ? (points / maxPossible) * 100 : 50;
}

/**
 * Convert form rating to clean label
 */
function formRatingToLabel(rating: number): 'strong' | 'neutral' | 'weak' {
  if (rating >= 60) return 'strong';
  if (rating <= 40) return 'weak';
  return 'neutral';
}

/**
 * Calculate form trend (comparing first half vs second half of form string)
 */
function calculateFormTrend(form: string): 'improving' | 'declining' | 'stable' {
  if (!form || form.length < 4) return 'stable';
  
  const recent = form.slice(0, 2);
  const older = form.slice(2, 4);
  
  const recentScore = recent.split('').reduce((acc, r) => acc + (r === 'W' ? 2 : r === 'D' ? 1 : 0), 0);
  const olderScore = older.split('').reduce((acc, r) => acc + (r === 'W' ? 2 : r === 'D' ? 1 : 0), 0);
  
  if (recentScore > olderScore + 1) return 'improving';
  if (olderScore > recentScore + 1) return 'declining';
  return 'stable';
}

/**
 * Calculate strength edge percentage
 * 
 * CRITICAL: This now includes recent form as a major factor.
 * Form is weighted heavily because WWWWW vs LDLWD should massively
 * favor the team in better form, regardless of season stats.
 */
function calculateStrengthEdge(
  input: RawMatchInput,
  config: SportConfig
): { direction: 'home' | 'away' | 'even'; percentage: number } {
  const { homeStats, awayStats, h2h, homeForm, awayForm } = input;
  
  // 1. FORM DIFFERENTIAL (NEW - weighted heavily: 40% of edge)
  // WWWWW = 100, LDLWD ≈ 30, so diff could be 70 points
  const homeFormRating = calculateFormRating(homeForm, config.hasDraw);
  const awayFormRating = calculateFormRating(awayForm, config.hasDraw);
  const formDiff = (homeFormRating - awayFormRating) / 100; // -1 to 1
  const formFactor = formDiff * 0.4; // 40% weight for form
  
  // 2. Win rate differential (20% of edge)
  const homeWinRate = homeStats.played > 0 ? homeStats.wins / homeStats.played : 0.5;
  const awayWinRate = awayStats.played > 0 ? awayStats.wins / awayStats.played : 0.5;
  const winRateDiff = (homeWinRate - awayWinRate) * 0.2;
  
  // 3. Scoring differential per game (15% of edge)
  const homeGD = homeStats.played > 0 
    ? (homeStats.scored - homeStats.conceded) / homeStats.played 
    : 0;
  const awayGD = awayStats.played > 0 
    ? (awayStats.scored - awayStats.conceded) / awayStats.played 
    : 0;
  const gdDiff = (homeGD - awayGD) * 0.015; // Scale down scoring diff
  
  // 4. H2H factor (10% of edge)
  const h2hFactor = h2h.total >= 3
    ? (h2h.homeWins - h2h.awayWins) / h2h.total * 0.10
    : 0;
  
  // 5. Home advantage (15% of edge) - already in config
  const homeAdvFactor = config.homeAdvantage;
  
  // Combine factors (form is now the biggest factor)
  const rawEdge = (formFactor + winRateDiff + gdDiff + h2hFactor + homeAdvFactor) * 100;
  const clampedEdge = Math.max(-20, Math.min(20, rawEdge)); // Increased max edge for form
  
  if (Math.abs(clampedEdge) < 2) {
    return { direction: 'even', percentage: 0 };
  }
  
  return {
    direction: clampedEdge > 0 ? 'home' : 'away',
    percentage: Math.round(Math.abs(clampedEdge)),
  };
}

/**
 * Calculate expected tempo
 */
function calculateTempo(
  input: RawMatchInput,
  config: SportConfig
): 'low' | 'medium' | 'high' {
  const { homeStats, awayStats } = input;
  
  // Average scoring rate
  const homeAvg = homeStats.played > 0 ? homeStats.scored / homeStats.played : 0;
  const awayAvg = awayStats.played > 0 ? awayStats.scored / awayStats.played : 0;
  
  // Combined conceding (both teams being open/tight defensively affects tempo)
  const homeConceding = homeStats.played > 0 ? homeStats.conceded / homeStats.played : 0;
  const awayConceding = awayStats.played > 0 ? awayStats.conceded / awayStats.played : 0;
  
  // Expected match scoring = average of all offensive and defensive tendencies
  const expectedScoring = (homeAvg + awayAvg + homeConceding + awayConceding) / 4;
  
  const { low, high } = config.tempoThresholds;
  
  if (expectedScoring < low) return 'low';
  if (expectedScoring > high) return 'high';
  return 'medium';
}

/**
 * Calculate efficiency edge
 */
function calculateEfficiencyEdge(
  input: RawMatchInput,
  config: SportConfig
): { winner: 'home' | 'away' | 'balanced'; aspect: 'offense' | 'defense' | 'both' | null } {
  const { homeStats, awayStats } = input;
  
  // Offensive efficiency (scoring per game)
  const homeOff = homeStats.played > 0 ? homeStats.scored / homeStats.played : 0;
  const awayOff = awayStats.played > 0 ? awayStats.scored / awayStats.played : 0;
  
  // Defensive efficiency (conceding per game - lower is better)
  const homeDef = homeStats.played > 0 ? homeStats.conceded / homeStats.played : 999;
  const awayDef = awayStats.played > 0 ? awayStats.conceded / awayStats.played : 999;
  
  const offEdge = homeOff - awayOff;
  const defEdge = awayDef - homeDef; // Reversed: higher means home is better
  
  const totalEdge = offEdge + defEdge;
  
  if (Math.abs(totalEdge) < config.efficiencyThreshold) {
    return { winner: 'balanced', aspect: null };
  }
  
  // Determine primary aspect
  let aspect: 'offense' | 'defense' | 'both';
  if (Math.abs(offEdge) > Math.abs(defEdge) * 1.5) {
    aspect = 'offense';
  } else if (Math.abs(defEdge) > Math.abs(offEdge) * 1.5) {
    aspect = 'defense';
  } else {
    aspect = 'both';
  }
  
  return {
    winner: totalEdge > 0 ? 'home' : 'away',
    aspect,
  };
}

/**
 * Calculate availability impact
 */
function calculateAvailabilityImpact(
  input: RawMatchInput
): { level: 'low' | 'medium' | 'high' | 'critical'; note: string | null } {
  const homeKeyOut = input.homeKeyOut || [];
  const awayKeyOut = input.awayKeyOut || [];
  const homeInjuries = input.homeInjuries || [];
  const awayInjuries = input.awayInjuries || [];
  
  const totalKeyOut = homeKeyOut.length + awayKeyOut.length;
  const totalInjuries = homeInjuries.length + awayInjuries.length;
  
  // Critical: Multiple key players out
  if (totalKeyOut >= 3) {
    return { level: 'critical', note: 'Multiple key absences' };
  }
  
  // High: Key player out or many injuries
  if (totalKeyOut >= 1 || totalInjuries >= 5) {
    const keyPlayer = homeKeyOut[0] || awayKeyOut[0];
    return { 
      level: 'high', 
      note: keyPlayer ? `${keyPlayer} out` : 'Significant absences',
    };
  }
  
  // Medium: Some injuries
  if (totalInjuries >= 2) {
    return { level: 'medium', note: null };
  }
  
  return { level: 'low', note: null };
}

/**
 * Calculate confidence based on signal clarity
 */
function calculateConfidence(
  formClarity: boolean,
  edgeClarity: boolean,
  efficiencyClarity: boolean,
  availabilityStable: boolean
): { confidence: 'high' | 'medium' | 'low'; clarityScore: number } {
  let score = 0;
  
  if (formClarity) score += 25;
  if (edgeClarity) score += 30;
  if (efficiencyClarity) score += 25;
  if (availabilityStable) score += 20;
  
  return {
    confidence: score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low',
    clarityScore: score,
  };
}

// ============================================
// MAIN EXPORT: NORMALIZE MATCH SIGNALS
// ============================================

/**
 * Main function: Convert raw match data to Universal Signals
 * 
 * This is the ONLY function other parts of the app should use.
 */
export function normalizeToUniversalSignals(input: RawMatchInput): UniversalSignals {
  const sportType = detectSport(input.sport);
  const config = SPORT_CONFIGS[sportType];
  
  // Calculate each signal
  const homeFormRating = calculateFormRating(input.homeForm, config.hasDraw);
  const awayFormRating = calculateFormRating(input.awayForm, config.hasDraw);
  const homeFormLabel = formRatingToLabel(homeFormRating);
  const awayFormLabel = formRatingToLabel(awayFormRating);
  const formTrend = homeFormRating > awayFormRating + 10 ? 'home_better' 
    : awayFormRating > homeFormRating + 10 ? 'away_better' 
    : 'balanced';
  
  const edge = calculateStrengthEdge(input, config);
  const tempo = calculateTempo(input, config);
  const efficiency = calculateEfficiencyEdge(input, config);
  const availability = calculateAvailabilityImpact(input);
  
  // Build clean labels for AI
  const formLabel = formTrend === 'home_better' 
    ? `${input.homeTeam} stronger`
    : formTrend === 'away_better'
    ? `${input.awayTeam} stronger`
    : 'Balanced';
  
  const edgeLabel = edge.direction === 'even' 
    ? 'Even'
    : `${edge.direction === 'home' ? 'Home' : 'Away'} +${edge.percentage}%`;
  
  const tempoLabel = tempo === 'high' ? 'Fast-Paced' 
    : tempo === 'low' ? 'Controlled' 
    : 'Medium';
  
  const efficiencyLabel = efficiency.winner === 'balanced'
    ? 'Balanced'
    : `${efficiency.winner === 'home' ? 'Home' : 'Away'}${efficiency.aspect ? ` ${efficiency.aspect}` : ''}`;
  
  const availabilityLabel = availability.level === 'low' ? 'Low'
    : availability.level === 'medium' ? 'Medium'
    : availability.level === 'high' ? 'High'
    : 'Critical';
  
  // Calculate confidence
  const { confidence, clarityScore } = calculateConfidence(
    formTrend !== 'balanced',
    edge.percentage >= 4,
    efficiency.winner !== 'balanced',
    availability.level === 'low' || availability.level === 'medium'
  );
  
  return {
    // Clean JSON for AI (exactly what prompt sees)
    form: formLabel,
    strength_edge: edgeLabel,
    tempo: tempoLabel,
    efficiency_edge: efficiencyLabel,
    availability_impact: availabilityLabel,
    
    // Detailed display data for UI
    display: {
      form: {
        home: homeFormLabel,
        away: awayFormLabel,
        trend: formTrend,
        label: formLabel,
      },
      edge: {
        direction: edge.direction,
        percentage: edge.percentage,
        label: edgeLabel,
      },
      tempo: {
        level: tempo,
        label: tempoLabel,
      },
      efficiency: {
        winner: efficiency.winner,
        aspect: efficiency.aspect,
        label: efficiencyLabel,
      },
      availability: {
        level: availability.level,
        note: availability.note,
        label: availability.note ? `${availabilityLabel} – ${availability.note}` : availabilityLabel,
        homeInjuries: input.homeInjuryDetails || (input.homeInjuries?.map(p => ({ player: p })) ?? []),
        awayInjuries: input.awayInjuryDetails || (input.awayInjuries?.map(p => ({ player: p })) ?? []),
      },
    },
    
    confidence,
    clarity_score: clarityScore,
  };
}

// ============================================
// AI FORMAT HELPER
// ============================================

/**
 * Format signals as clean JSON for AI consumption
 * This is EXACTLY what the SportBotAgent sees - nothing more
 */
export function formatSignalsForAI(signals: UniversalSignals): string {
  return JSON.stringify({
    form: signals.form,
    strength_edge: signals.strength_edge,
    tempo: signals.tempo,
    efficiency_edge: signals.efficiency_edge,
    availability_impact: signals.availability_impact,
  }, null, 2);
}

/**
 * One-line signal summary for quick context
 */
export function getSignalSummary(signals: UniversalSignals): string {
  return `Form: ${signals.form} | Edge: ${signals.strength_edge} | Tempo: ${signals.tempo} | Efficiency: ${signals.efficiency_edge} | Availability: ${signals.availability_impact}`;
}
