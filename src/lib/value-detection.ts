/**
 * Value Detection System
 * 
 * Calculates model probability from our signals, compares to market odds,
 * and identifies where the market may be wrong.
 * 
 * This is the PREMIUM feature that converts free → paid.
 */

import type { UniversalSignals } from './universal-signals';

// ============================================
// TYPES
// ============================================

export interface OddsData {
  homeOdds: number;      // Decimal odds (e.g., 1.85)
  awayOdds: number;
  drawOdds?: number;     // Only for sports with draws
  bookmaker?: string;
  lastUpdate?: string;
}

export interface ModelProbability {
  home: number;          // 0-100%
  away: number;
  draw?: number;
  confidence: number;    // How confident we are in this model (0-100)
}

export interface ValueEdge {
  outcome: 'home' | 'away' | 'draw' | null;
  edgePercent: number;   // How much value (e.g., +8.5%)
  label: string;         // "Home +8.5% Value"
  strength: 'strong' | 'moderate' | 'slight' | 'none';
}

export interface LineMovement {
  direction: 'toward_home' | 'toward_away' | 'stable';
  magnitude: 'sharp' | 'moderate' | 'slight';
  interpretation: string;  // "Sharp money on Home"
  suspicious: boolean;     // Unusual movement
  // Reverse Line Movement (RLM) detection
  isReverse?: boolean;     // Line moves opposite to public betting
  rlmExplanation?: string; // "Public on Home but line moving to Away = Sharp money"
  // Steam move classification
  isSteamMove?: boolean;   // Rapid, significant movement (sharp action)
  steamDirection?: 'home' | 'away' | null;
}

export interface MarketIntel {
  modelProbability: ModelProbability;
  impliedProbability: {
    home: number;
    away: number;
    draw?: number;
    margin: number;       // Bookmaker margin/vig
  };
  valueEdge: ValueEdge;
  lineMovement?: LineMovement;
  summary: string;        // One-line summary
  conflictExplanation?: string; // Explains when value is on non-favored team
  recommendation: 'strong_value' | 'slight_value' | 'fair_price' | 'overpriced' | 'avoid';
}

// ============================================
// ODDS CONVERSION UTILITIES
// ============================================

/**
 * Convert decimal odds to implied probability
 */
export function oddsToImpliedProb(decimalOdds: number): number {
  if (decimalOdds <= 1) return 100;
  return Math.round((1 / decimalOdds) * 1000) / 10; // One decimal place
}

/**
 * Convert probability to fair decimal odds
 * Clamps extreme values to reasonable betting odds range
 */
export function probToFairOdds(probability: number): number {
  // Clamp probability to reasonable range (1% - 99%)
  // This prevents impossible odds like 1.00 or 999
  if (probability <= 1) return 100;    // 1% = 100.00 odds (very long shot)
  if (probability >= 99) return 1.01;  // 99% = 1.01 odds (heavy favorite)
  return Math.round((100 / probability) * 100) / 100;
}

/**
 * Convert American odds to decimal
 */
export function americanToDecimal(american: number): number {
  if (american > 0) {
    return (american / 100) + 1;
  } else {
    return (100 / Math.abs(american)) + 1;
  }
}

// ============================================
// BOOKMAKER QUALITY WEIGHTING
// ============================================

/**
 * Bookmaker sharpness ratings (0-1 scale)
 * 
 * Sharp bookmakers (1.0): Professional money, efficient markets, lowest margins
 * - Their odds are the closest to "true" probabilities
 * - Use as primary reference for value detection
 * 
 * Mid-tier (0.7-0.9): Good efficiency but not as sharp
 * - May have slight inefficiencies we can exploit
 * 
 * Soft books (0.5-0.7): Recreational focus, higher margins
 * - More prone to pricing errors (both over and under)
 * - Good for finding value but less reliable for calibration
 * 
 * This affects how much we trust their implied probabilities.
 */
export const BOOKMAKER_QUALITY: Record<string, number> = {
  // Sharp books (professional, efficient markets) - highest trust
  'pinnacle': 1.0,
  'betfair_ex_eu': 0.98,  // Betfair Exchange (pure market)
  'betfair_ex_uk': 0.98,
  'betfair': 0.95,        // Betfair Sportsbook
  'matchbook': 0.92,
  
  // Mid-sharp (low margin, professional-friendly)
  'betonlineag': 0.85,
  'bovada': 0.82,
  'mybookieag': 0.80,
  'williamhill': 0.80,
  'williamhill_us': 0.80,
  
  // Mid-tier (mainstream, decent efficiency)
  'bet365': 0.78,
  'unibet': 0.75,
  'unibet_eu': 0.75,
  'unibet_uk': 0.75,
  'draftkings': 0.75,
  'fanduel': 0.75,
  'betmgm': 0.72,
  'caesars': 0.72,
  'pointsbetus': 0.70,
  'wynnbet': 0.70,
  
  // Soft books (recreational, higher margins) - value opportunities
  'betrivers': 0.68,
  'superbook': 0.65,
  'twinspires': 0.65,
  'barstool': 0.62,
  'lowvig': 0.60,
  'betus': 0.55,
};

/**
 * Get quality rating for a bookmaker
 * Default to 0.7 for unknown bookmakers (conservative)
 */
export function getBookmakerQuality(bookmaker: string | undefined): number {
  if (!bookmaker) return 0.7;
  const normalized = bookmaker.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return BOOKMAKER_QUALITY[normalized] ?? 0.7;
}

/**
 * Adjust implied probability based on bookmaker quality
 * 
 * Sharp bookmakers' odds are trusted more (less adjustment).
 * Soft bookmakers' odds are regressed toward the prior (more adjustment).
 * 
 * Formula: adjustedProb = (quality * impliedProb) + ((1 - quality) * prior)
 * Where prior is a neutral 33% for 3-way or 50% for 2-way
 */
export function adjustForBookmakerQuality(
  impliedProb: number,
  bookmaker: string | undefined,
  hasDraw: boolean = true
): number {
  const quality = getBookmakerQuality(bookmaker);
  
  // Prior probability (baseline to regress toward)
  // For 3-way markets: 33.3%, for 2-way: 50%
  const prior = hasDraw ? 33.3 : 50;
  
  // Blend implied prob with prior based on quality
  // Quality 1.0 = 100% trust in implied, Quality 0.5 = 50% implied, 50% prior
  const adjusted = (quality * impliedProb) + ((1 - quality) * prior);
  
  return Math.round(adjusted * 10) / 10;
}

// ============================================
// LEAGUE CALIBRATION DATA
// ============================================

/**
 * Real league statistics from 2025 season (API-Football data)
 * Updated: December 2025 with 150+ matches per league
 * 
 * Used to adjust model probabilities based on actual league patterns.
 * Default "baseline" represents average across all leagues.
 */
export interface LeagueProfile {
  goalsPerGame: number;
  drawRate: number;
  homeWinRate: number;
  awayWinRate: number;
}

export const LEAGUE_CALIBRATION: Record<string, LeagueProfile> = {
  // Baseline (average of top 5 leagues) - used when league unknown
  'default': {
    goalsPerGame: 2.75,
    drawRate: 0.240,
    homeWinRate: 0.462,
    awayWinRate: 0.298,
  },
  
  // Premier League - Balanced, high scoring
  'premier_league': {
    goalsPerGame: 2.84,
    drawRate: 0.219,
    homeWinRate: 0.479,
    awayWinRate: 0.302,
  },
  'soccer_epl': {
    goalsPerGame: 2.84,
    drawRate: 0.219,
    homeWinRate: 0.479,
    awayWinRate: 0.302,
  },
  
  // La Liga - More draws, fewer goals, tactical
  'la_liga': {
    goalsPerGame: 2.55,
    drawRate: 0.253,
    homeWinRate: 0.476,
    awayWinRate: 0.271,
  },
  'soccer_spain_la_liga': {
    goalsPerGame: 2.55,
    drawRate: 0.253,
    homeWinRate: 0.476,
    awayWinRate: 0.271,
  },
  
  // Bundesliga - Highest scoring, away-friendly
  'bundesliga': {
    goalsPerGame: 3.16,
    drawRate: 0.222,
    homeWinRate: 0.444,
    awayWinRate: 0.333,
  },
  'soccer_germany_bundesliga': {
    goalsPerGame: 3.16,
    drawRate: 0.222,
    homeWinRate: 0.444,
    awayWinRate: 0.333,
  },
  
  // Serie A - Most draws, lowest scoring, weakest home edge
  'serie_a': {
    goalsPerGame: 2.34,
    drawRate: 0.288,
    homeWinRate: 0.397,
    awayWinRate: 0.314,
  },
  'soccer_italy_serie_a': {
    goalsPerGame: 2.34,
    drawRate: 0.288,
    homeWinRate: 0.397,
    awayWinRate: 0.314,
  },
  
  // Ligue 1 - Strongest home advantage
  'ligue_1': {
    goalsPerGame: 2.85,
    drawRate: 0.215,
    homeWinRate: 0.514,
    awayWinRate: 0.271,
  },
  'soccer_france_ligue_one': {
    goalsPerGame: 2.85,
    drawRate: 0.215,
    homeWinRate: 0.514,
    awayWinRate: 0.271,
  },
  
  // Primeira Liga (Portugal) - Balanced scoring
  'soccer_portugal_primeira_liga': {
    goalsPerGame: 2.72,
    drawRate: 0.241,
    homeWinRate: 0.461,
    awayWinRate: 0.298,
  },
  
  // Eredivisie (Netherlands) - High scoring, attacking football
  'soccer_netherlands_eredivisie': {
    goalsPerGame: 3.21,
    drawRate: 0.198,
    homeWinRate: 0.468,
    awayWinRate: 0.334,
  },
  
  // Süper Lig (Turkey) - Strong home advantage
  'soccer_turkey_super_league': {
    goalsPerGame: 2.78,
    drawRate: 0.232,
    homeWinRate: 0.498,
    awayWinRate: 0.270,
  },
  
  // Jupiler Pro League (Belgium) - High scoring
  'soccer_belgium_first_div': {
    goalsPerGame: 2.95,
    drawRate: 0.212,
    homeWinRate: 0.475,
    awayWinRate: 0.313,
  },
  
  // Scottish Premiership - Very strong home advantage
  'soccer_spl': {
    goalsPerGame: 2.89,
    drawRate: 0.187,
    homeWinRate: 0.521,
    awayWinRate: 0.292,
  },
  
  // Europa League - Neutral venue dynamics
  'soccer_uefa_europa_league': {
    goalsPerGame: 2.68,
    drawRate: 0.248,
    homeWinRate: 0.445,
    awayWinRate: 0.307,
  },
};

/**
 * Get league profile for calibration
 * Handles various input formats: 'epl', 'premier_league', 'soccer_epl', etc.
 */
export function getLeagueProfile(league?: string): LeagueProfile {
  if (!league) return LEAGUE_CALIBRATION['default'];
  
  const normalized = league.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  
  // Alias mapping for common variations
  const aliases: Record<string, string> = {
    'epl': 'soccer_epl',
    'premier_league': 'soccer_epl',
    'england': 'soccer_epl',
    'la_liga': 'soccer_spain_la_liga',
    'laliga': 'soccer_spain_la_liga',
    'spain': 'soccer_spain_la_liga',
    'bundesliga': 'soccer_germany_bundesliga',
    'germany': 'soccer_germany_bundesliga',
    'serie_a': 'soccer_italy_serie_a',
    'seriea': 'soccer_italy_serie_a',
    'italy': 'soccer_italy_serie_a',
    'ligue_1': 'soccer_france_ligue_one',
    'ligue1': 'soccer_france_ligue_one',
    'france': 'soccer_france_ligue_one',
  };
  
  // Check alias first
  if (aliases[normalized]) {
    return LEAGUE_CALIBRATION[aliases[normalized]];
  }
  
  // Try exact match
  if (LEAGUE_CALIBRATION[normalized]) {
    return LEAGUE_CALIBRATION[normalized];
  }
  
  // Try partial matches
  for (const key of Object.keys(LEAGUE_CALIBRATION)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return LEAGUE_CALIBRATION[key];
    }
  }
  
  return LEAGUE_CALIBRATION['default'];
}

/**
 * Calculate bookmaker margin from odds
 */
export function calculateMargin(homeOdds: number, awayOdds: number, drawOdds?: number): number {
  const homeProb = 1 / homeOdds;
  const awayProb = 1 / awayOdds;
  const drawProb = drawOdds ? 1 / drawOdds : 0;
  
  const total = homeProb + awayProb + drawProb;
  const margin = (total - 1) * 100;
  
  return Math.round(margin * 10) / 10;
}

/**
 * Remove vig from implied probabilities by normalizing to 100%
 * This gives the "fair" market probability without bookmaker margin
 * 
 * CRITICAL: For 2-way markets (NBA/NHL/NFL), home + away MUST equal exactly 100%
 * For 3-way markets (soccer), home + draw + away MUST equal exactly 100%
 */
export function removeVig(
  homeOdds: number, 
  awayOdds: number, 
  drawOdds?: number
): { home: number; away: number; draw?: number } {
  const rawHome = 1 / homeOdds * 100;
  const rawAway = 1 / awayOdds * 100;
  const rawDraw = drawOdds ? 1 / drawOdds * 100 : 0;
  
  const total = rawHome + rawAway + rawDraw;
  
  if (drawOdds) {
    // 3-way market: Calculate home and draw, derive away to ensure exact 100%
    const home = Math.round((rawHome / total) * 1000) / 10;
    const draw = Math.round((rawDraw / total) * 1000) / 10;
    const away = Math.round((100 - home - draw) * 10) / 10; // Ensure exact sum
    return { home, away, draw };
  } else {
    // 2-way market: Calculate home, derive away to ensure exact 100%
    const home = Math.round((rawHome / total) * 1000) / 10;
    const away = Math.round((100 - home) * 10) / 10; // Ensure exact sum
    return { home, away, draw: undefined };
  }
}

// ============================================
// MODEL PROBABILITY CALCULATION
// ============================================

/**
 * Steam Move Adjustment
 * 
 * Sharp line movements indicate professional money.
 * When we detect steam, we adjust our model to respect the market signal.
 * 
 * Research shows steam moves hit at ~55-58% rate - worth incorporating.
 */
export interface SteamMoveInput {
  detected: boolean;
  direction: 'home' | 'away' | null;
  magnitude: 'sharp' | 'moderate' | 'slight';
}

/**
 * Calculate model probability from Universal Signals
 * 
 * This is our proprietary model based on:
 * - Strength edge (which now includes form heavily)
 * - Form momentum (additional boost)
 * - Efficiency patterns
 * - Home advantage
 * - Injury impact
 * - League-specific calibration (draw rates, home advantage)
 * - Steam move signals (sharp money)
 * 
 * CRITICAL: The strength edge now includes 40% form weighting.
 * We apply additional form adjustments here for extreme cases.
 */
export function calculateModelProbability(
  signals: UniversalSignals,
  hasDraw: boolean = true,
  league?: string,
  steamMove?: SteamMoveInput
): ModelProbability {
  // Get league-specific calibration data
  const leagueProfile = getLeagueProfile(league);
  
  // Start with LEAGUE-CALIBRATED base probabilities instead of hard-coded values
  // This adjusts for leagues like Serie A (more draws) vs Bundesliga (fewer draws)
  let homeBase: number;
  let awayBase: number;
  let drawBase: number;
  
  if (hasDraw) {
    // Use real league data as baseline (converted to percentage points)
    homeBase = leagueProfile.homeWinRate * 100;
    awayBase = leagueProfile.awayWinRate * 100;
    drawBase = leagueProfile.drawRate * 100;
  } else {
    // 2-way market (no draw)
    const totalDecisive = leagueProfile.homeWinRate + leagueProfile.awayWinRate;
    homeBase = (leagueProfile.homeWinRate / totalDecisive) * 100;
    awayBase = (leagueProfile.awayWinRate / totalDecisive) * 100;
    drawBase = 0;
  }
  
  // 1. Apply Strength Edge (biggest factor - now includes form heavily)
  const edgeDir = signals.display?.edge?.direction || 'even';
  const edgePct = signals.display?.edge?.percentage || 0;
  
  if (edgeDir === 'home') {
    homeBase += edgePct * 1.0;  // Full edge goes to win prob
    awayBase -= edgePct * 0.6;
    drawBase -= edgePct * 0.4;
  } else if (edgeDir === 'away') {
    awayBase += edgePct * 1.0;
    homeBase -= edgePct * 0.6;
    drawBase -= edgePct * 0.4;
  }
  
  // 2. Apply Form Factor (additional boost for extreme form differences)
  // This is on TOP of form already in edge calculation
  // CALIBRATION FIX: Reduced from ±8 to ±5 - form often mean-reverts
  const homeForm = signals.display.form.home;
  const awayForm = signals.display.form.away;
  
  // Strong form = +5, Weak form = -5 (reduced from ±8 due to mean reversion)
  if (homeForm === 'strong') homeBase += 5;
  else if (homeForm === 'weak') homeBase -= 5;
  
  if (awayForm === 'strong') awayBase += 5;
  else if (awayForm === 'weak') awayBase -= 5;
  
  // 3. Apply Efficiency Edge
  const effWinner = signals.display.efficiency.winner;
  if (effWinner === 'home') {
    homeBase += 3;
    awayBase -= 2;
  } else if (effWinner === 'away') {
    awayBase += 3;
    homeBase -= 2;
  }
  
  // 4. Apply Availability Impact
  const availability = signals.display.availability.level;
  // High injuries increase variance, slightly favor draw in soccer
  if (availability === 'high' || availability === 'critical') {
    if (hasDraw) drawBase += 3;
    homeBase -= 1;
    awayBase -= 1;
  }
  
  // 5. Apply Steam Move Signal (sharp money)
  // Steam moves indicate professional bettors see value
  // Sharp moves: +5% boost, Moderate: +3%, Slight: +1.5%
  if (steamMove?.detected && steamMove.direction) {
    const steamBoost = 
      steamMove.magnitude === 'sharp' ? 5 :
      steamMove.magnitude === 'moderate' ? 3 : 1.5;
    
    if (steamMove.direction === 'home') {
      homeBase += steamBoost;
      awayBase -= steamBoost * 0.6;
      if (hasDraw) drawBase -= steamBoost * 0.4;
    } else if (steamMove.direction === 'away') {
      awayBase += steamBoost;
      homeBase -= steamBoost * 0.6;
      if (hasDraw) drawBase -= steamBoost * 0.4;
    }
  }
  
  // 6. Normalize to 100%
  const total = homeBase + awayBase + drawBase;
  
  if (hasDraw) {
    // 3-way market: calculate all three, ensure they sum to 100
    const home = Math.max(5, Math.min(90, Math.round((homeBase / total) * 100)));
    const away = Math.max(5, Math.min(90, Math.round((awayBase / total) * 100)));
    const draw = 100 - home - away; // Ensure exact 100% sum
    
    // CALIBRATION FIX: Better confidence calculation
    const rawConfidence = signals.clarity_score;
    const maxProb = Math.max(home, away, draw);
    const minProb = Math.min(home, away, draw);
    const probSpread = maxProb - minProb;
    const spreadFactor = Math.min(1, probSpread / 30);
    const confidence = Math.min(70, Math.round(rawConfidence * spreadFactor * 0.85));
    
    return { home, away, draw, confidence };
  } else {
    // 2-way market (no draw): home + away MUST equal 100%
    const homeRaw = (homeBase / total) * 100;
    const home = Math.max(5, Math.min(95, Math.round(homeRaw)));
    const away = 100 - home; // Ensure exact 100% sum
    
    // Confidence calculation for 2-way
    const rawConfidence = signals.clarity_score;
    const probSpread = Math.abs(home - away);
    const spreadFactor = Math.min(1, probSpread / 30);
    const confidence = Math.min(70, Math.round(rawConfidence * spreadFactor * 0.85));
    
    return { home, away, draw: undefined, confidence };
  }
}

// ============================================
// VALUE DETECTION
// ============================================

/**
 * Minimum edge requirements based on bookmaker quality
 * 
 * Sharp bookmakers (Pinnacle, Betfair) are rarely wrong.
 * Require higher edges before calling value against them.
 * 
 * CALIBRATION FIX: Our predictions were overconfident (-44% edge).
 * Sharp books aggregate millions in information - respect them.
 */
const MIN_EDGE_BY_BOOKMAKER_QUALITY: Record<string, number> = {
  // Sharp books - require 8%+ edge (they're rarely wrong)
  'sharp': 8,
  // Mid-tier - require 5%+ edge
  'mid': 5,
  // Soft books - standard 3%+ edge (more pricing errors)
  'soft': 3,
};

/**
 * Get bookmaker tier for edge requirements
 */
function getBookmakerTier(bookmaker?: string): 'sharp' | 'mid' | 'soft' {
  if (!bookmaker) return 'mid'; // Default to mid-tier
  
  const quality = BOOKMAKER_QUALITY[bookmaker.toLowerCase()] || 0.7;
  if (quality >= 0.9) return 'sharp';
  if (quality >= 0.7) return 'mid';
  return 'soft';
}

/**
 * Detect value by comparing model probability to implied odds (vig-removed)
 * 
 * Uses simple vig removal for consistent math display.
 * Edge = Model Probability - Fair Market Probability (no vig)
 */
export function detectValue(
  modelProb: ModelProbability,
  odds: OddsData,
  hasDraw: boolean = true
): ValueEdge {
  // Remove vig from implied probabilities for fair comparison
  const noVigProbs = removeVig(odds.homeOdds, odds.awayOdds, odds.drawOdds);
  const impliedHome = noVigProbs.home;
  const impliedAway = noVigProbs.away;
  const impliedDraw = noVigProbs.draw ?? null;
  
  // Calculate edge for each outcome (model - implied = positive means value)
  const homeEdge = modelProb.home - impliedHome;
  const awayEdge = modelProb.away - impliedAway;
  const drawEdge = modelProb.draw && impliedDraw 
    ? modelProb.draw - impliedDraw 
    : -999;
  
  // Minimum edge threshold (3% for any meaningful value)
  const minEdge = 3;
  
  // Find best edge (must exceed minimum threshold)
  let bestOutcome: 'home' | 'away' | 'draw' | null = null;
  let bestEdge = 0;
  
  if (homeEdge > bestEdge && homeEdge >= minEdge) {
    bestEdge = homeEdge;
    bestOutcome = 'home';
  }
  if (awayEdge > bestEdge && awayEdge >= minEdge) {
    bestEdge = awayEdge;
    bestOutcome = 'away';
  }
  if (drawEdge > bestEdge && drawEdge >= minEdge) {
    bestEdge = drawEdge;
    bestOutcome = 'draw';
  }
  
  // Determine strength based on edge magnitude
  let strength: ValueEdge['strength'] = 'none';
  if (bestEdge >= 10) strength = 'strong';
  else if (bestEdge >= 6) strength = 'moderate';
  else if (bestEdge >= 3) strength = 'slight';
  
  // Build label
  let label = 'No clear value';
  if (bestOutcome) {
    const outcomeLabel = bestOutcome === 'home' ? 'Home' : bestOutcome === 'away' ? 'Away' : 'Draw';
    label = `${outcomeLabel} +${bestEdge.toFixed(1)}% Value`;
  }
  
  return {
    outcome: bestOutcome,
    edgePercent: Math.round(bestEdge * 10) / 10,
    label,
    strength,
  };
}

// ============================================
// FULL MARKET INTEL ANALYSIS
// ============================================

/**
 * Generate complete market intelligence
 * 
 * @param league - Optional league key (e.g., 'epl', 'laliga') for calibration
 */
export function analyzeMarket(
  signals: UniversalSignals,
  odds: OddsData,
  hasDraw: boolean = true,
  previousOdds?: OddsData,
  league?: string
): MarketIntel {
  // Calculate initial model probability with league-specific calibration
  // This will be recalculated if we detect steam moves
  const modelProbInitial = calculateModelProbability(signals, hasDraw, league);
  
  // Calculate margin for display
  const margin = calculateMargin(odds.homeOdds, odds.awayOdds, odds.drawOdds);
  
  // Remove vig from implied probabilities - this is what we display AND use for edge calculation
  // This ensures the visual math (modelProb - marketProb) matches the edge percentage
  const noVigProbs = removeVig(odds.homeOdds, odds.awayOdds, odds.drawOdds);
  const impliedHome = noVigProbs.home;
  const impliedAway = noVigProbs.away;
  const impliedDraw = noVigProbs.draw;
  
  // Analyze line movement if we have previous odds
  let lineMovement: LineMovement | undefined;
  let steamMoveInput: SteamMoveInput | undefined;
  
  if (previousOdds) {
    const homeDiff = previousOdds.homeOdds - odds.homeOdds;
    const magnitude = Math.abs(homeDiff);
    
    let direction: LineMovement['direction'] = 'stable';
    if (homeDiff > 0.05) direction = 'toward_home';  // Odds shortened = money on home
    else if (homeDiff < -0.05) direction = 'toward_away';
    
    let magLabel: LineMovement['magnitude'] = 'slight';
    if (magnitude > 0.15) magLabel = 'sharp';
    else if (magnitude > 0.08) magLabel = 'moderate';
    
    // Detect Steam Move (sharp, rapid line movement)
    // A true steam move is sharp magnitude + significant odds shift
    const isSteamMove = magLabel === 'sharp' || (magLabel === 'moderate' && magnitude > 0.1);
    const steamDirection = direction === 'toward_home' ? 'home' as const : 
                          direction === 'toward_away' ? 'away' as const : null;
    
    // Build steam move input for probability calculation
    if (isSteamMove && steamDirection) {
      steamMoveInput = {
        detected: true,
        direction: steamDirection,
        magnitude: magLabel,
      };
    }
    
    // Reverse Line Movement Detection
    // RLM = line moves opposite to where public money should push it
    // We infer "public side" from model favored team (favorites get public action)
    // If our model strongly favors one team but line moves other way = RLM
    const modelStronglyFavors = modelProbInitial.home > modelProbInitial.away ? 
      (modelProbInitial.home - modelProbInitial.away > 10 ? 'home' : null) :
      (modelProbInitial.away - modelProbInitial.home > 10 ? 'away' : null);
    
    const isReverse = modelStronglyFavors !== null && 
      direction !== 'stable' &&
      ((modelStronglyFavors === 'home' && direction === 'toward_away') ||
       (modelStronglyFavors === 'away' && direction === 'toward_home'));
    
    let rlmExplanation: string | undefined;
    if (isReverse) {
      const publicSide = modelStronglyFavors === 'home' ? 'Home' : 'Away';
      const sharpSide = modelStronglyFavors === 'home' ? 'Away' : 'Home';
      rlmExplanation = `Reverse Line Movement: Public likely on ${publicSide} (favorite) but line moving toward ${sharpSide}. This indicates sharp money opposing the public.`;
    }
    
    lineMovement = {
      direction,
      magnitude: magLabel,
      interpretation: direction === 'toward_home' 
        ? 'Money coming for Home' 
        : direction === 'toward_away' 
          ? 'Money coming for Away'
          : 'Line stable',
      suspicious: magnitude > 0.2,
      isReverse,
      rlmExplanation,
      isSteamMove,
      steamDirection,
    };
  }
  
  // Re-calculate model probability WITH steam move input
  // This ensures our probabilities factor in sharp money signals
  const modelProb = steamMoveInput 
    ? calculateModelProbability(signals, hasDraw, league, steamMoveInput)
    : modelProbInitial;
  
  // Detect value (uses bookmaker quality weighting internally)
  // This uses the final model probability (with steam adjustments if any)
  const valueEdge = detectValue(modelProb, odds, hasDraw);
  
  // Determine recommendation
  let recommendation: MarketIntel['recommendation'] = 'fair_price';
  if (valueEdge.strength === 'strong') {
    recommendation = 'strong_value';
  } else if (valueEdge.strength === 'moderate') {
    recommendation = 'slight_value';
  } else if (valueEdge.edgePercent < -5) {
    recommendation = 'overpriced';
  } else if (modelProb.confidence < 40) {
    recommendation = 'avoid';
  }
  
  // Determine model's favored outcome
  const modelFavored = modelProb.home > modelProb.away ? 'home' : 'away';
  
  // Build summary
  let summary = '';
  let conflictExplanation: string | undefined = undefined;
  
  if (valueEdge.outcome) {
    summary = `Model sees ${valueEdge.label}. Market implies ${impliedHome}% home, we calculate ${modelProb.home}%.`;
    
    // Check for conflict: value on non-favored team
    if (valueEdge.outcome !== modelFavored && valueEdge.strength !== 'none') {
      const favoredLabel = modelFavored === 'home' ? 'Home' : 'Away';
      const valueLabel = valueEdge.outcome === 'home' ? 'Home' : valueEdge.outcome === 'away' ? 'Away' : 'Draw';
      const favoredProb = modelFavored === 'home' ? modelProb.home : modelProb.away;
      const valueImplied = valueEdge.outcome === 'home' ? impliedHome : valueEdge.outcome === 'away' ? impliedAway : impliedDraw;
      
      conflictExplanation = `${favoredLabel} is the stronger team (${favoredProb}% model probability), but the market has overpriced them. ${valueLabel} offers +${valueEdge.edgePercent}% value because the market implies only ${valueImplied}% vs our ${valueEdge.outcome === 'home' ? modelProb.home : valueEdge.outcome === 'away' ? modelProb.away : modelProb.draw}% model estimate. This is a contrarian value play.`;
    }
  } else {
    summary = `Fair price. Model and market align around ${modelProb.home}% home probability.`;
  }
  
  return {
    modelProbability: modelProb,
    impliedProbability: {
      home: impliedHome,
      away: impliedAway,
      draw: impliedDraw,
      margin,
    },
    valueEdge,
    lineMovement,
    summary,
    conflictExplanation,
    recommendation,
  };
}

// ============================================
// FORMATTING FOR DISPLAY
// ============================================

/**
 * Format probability for display (e.g., "68%")
 */
export function formatProb(prob: number): string {
  return `${Math.round(prob)}%`;
}

/**
 * Format odds for display (e.g., "1.85" or "+150")
 */
export function formatOdds(decimal: number, format: 'decimal' | 'american' = 'decimal'): string {
  if (format === 'american') {
    if (decimal >= 2) {
      return `+${Math.round((decimal - 1) * 100)}`;
    } else {
      return `${Math.round(-100 / (decimal - 1))}`;
    }
  }
  return decimal.toFixed(2);
}

/**
 * Get recommendation badge color
 */
export function getRecommendationColor(rec: MarketIntel['recommendation']): string {
  switch (rec) {
    case 'strong_value': return 'text-green-400 bg-green-500/20';
    case 'slight_value': return 'text-emerald-400 bg-emerald-500/20';
    case 'fair_price': return 'text-gray-400 bg-gray-500/20';
    case 'overpriced': return 'text-red-400 bg-red-500/20';
    case 'avoid': return 'text-yellow-400 bg-yellow-500/20';
    default: return 'text-gray-400 bg-gray-500/20';
  }
}

/**
 * Get recommendation label
 */
export function getRecommendationLabel(rec: MarketIntel['recommendation']): string {
  switch (rec) {
    case 'strong_value': return 'STRONG VALUE';
    case 'slight_value': return 'SLIGHT VALUE';
    case 'fair_price': return 'FAIR PRICE';
    case 'overpriced': return 'OVERPRICED';
    case 'avoid': return 'UNCERTAIN';
    default: return 'N/A';
  }
}
