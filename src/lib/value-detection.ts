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
 */
export function probToFairOdds(probability: number): number {
  if (probability <= 0) return 999;
  if (probability >= 100) return 1;
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

// ============================================
// MODEL PROBABILITY CALCULATION
// ============================================

/**
 * Calculate model probability from Universal Signals
 * 
 * This is our proprietary model based on:
 * - Strength edge (which now includes form heavily)
 * - Form momentum (additional boost)
 * - Efficiency patterns
 * - Home advantage
 * - Injury impact
 * 
 * CRITICAL: The strength edge now includes 40% form weighting.
 * We apply additional form adjustments here for extreme cases.
 */
export function calculateModelProbability(
  signals: UniversalSignals,
  hasDraw: boolean = true
): ModelProbability {
  // Start with base probabilities
  let homeBase = hasDraw ? 40 : 50;  // Base home probability
  let awayBase = hasDraw ? 30 : 50;  // Base away probability
  let drawBase = hasDraw ? 30 : 0;   // Base draw probability
  
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
  const homeForm = signals.display.form.home;
  const awayForm = signals.display.form.away;
  
  // Strong form = +8, Weak form = -8 (increased from ±5)
  if (homeForm === 'strong') homeBase += 8;
  else if (homeForm === 'weak') homeBase -= 8;
  
  if (awayForm === 'strong') awayBase += 8;
  else if (awayForm === 'weak') awayBase -= 8;
  
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
  
  // 5. Normalize to 100%
  const total = homeBase + awayBase + drawBase;
  const home = Math.max(5, Math.min(90, Math.round((homeBase / total) * 100)));
  const away = Math.max(5, Math.min(90, Math.round((awayBase / total) * 100)));
  const draw = hasDraw ? 100 - home - away : undefined;
  
  // Confidence based on clarity score
  // Cap at 85% - sports are inherently unpredictable, 100% confidence is misleading
  const rawConfidence = signals.clarity_score;
  const confidence = Math.min(85, rawConfidence);
  
  return {
    home,
    away,
    draw,
    confidence,
  };
}

// ============================================
// VALUE DETECTION
// ============================================

/**
 * Detect value by comparing model probability to implied odds
 * 
 * Now includes bookmaker quality weighting:
 * - Sharp bookmakers (Pinnacle, Betfair) = more trusted implied probs
 * - Soft bookmakers = implied probs regressed toward prior
 */
export function detectValue(
  modelProb: ModelProbability,
  odds: OddsData,
  hasDraw: boolean = true
): ValueEdge {
  // Calculate implied probabilities from odds
  const rawImpliedHome = oddsToImpliedProb(odds.homeOdds);
  const rawImpliedAway = oddsToImpliedProb(odds.awayOdds);
  const rawImpliedDraw = odds.drawOdds ? oddsToImpliedProb(odds.drawOdds) : null;
  
  // Adjust for bookmaker quality (sharp books trusted more)
  const impliedHome = adjustForBookmakerQuality(rawImpliedHome, odds.bookmaker, hasDraw);
  const impliedAway = adjustForBookmakerQuality(rawImpliedAway, odds.bookmaker, hasDraw);
  const impliedDraw = rawImpliedDraw 
    ? adjustForBookmakerQuality(rawImpliedDraw, odds.bookmaker, hasDraw)
    : null;
  
  // Calculate edge for each outcome (model - implied = positive means value)
  const homeEdge = modelProb.home - impliedHome;
  const awayEdge = modelProb.away - impliedAway;
  const drawEdge = modelProb.draw && impliedDraw 
    ? modelProb.draw - impliedDraw 
    : -999;
  
  // Find best edge
  let bestOutcome: 'home' | 'away' | 'draw' | null = null;
  let bestEdge = 0;
  
  if (homeEdge > bestEdge && homeEdge > 3) {
    bestEdge = homeEdge;
    bestOutcome = 'home';
  }
  if (awayEdge > bestEdge && awayEdge > 3) {
    bestEdge = awayEdge;
    bestOutcome = 'away';
  }
  if (drawEdge > bestEdge && drawEdge > 3) {
    bestEdge = drawEdge;
    bestOutcome = 'draw';
  }
  
  // Determine strength
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
 */
export function analyzeMarket(
  signals: UniversalSignals,
  odds: OddsData,
  hasDraw: boolean = true,
  previousOdds?: OddsData
): MarketIntel {
  // Calculate model probability
  const modelProb = calculateModelProbability(signals, hasDraw);
  
  // Calculate implied probabilities (raw, before quality adjustment)
  const impliedHome = oddsToImpliedProb(odds.homeOdds);
  const impliedAway = oddsToImpliedProb(odds.awayOdds);
  const impliedDraw = odds.drawOdds ? oddsToImpliedProb(odds.drawOdds) : undefined;
  const margin = calculateMargin(odds.homeOdds, odds.awayOdds, odds.drawOdds);
  
  // Detect value (uses bookmaker quality weighting internally)
  const valueEdge = detectValue(modelProb, odds, hasDraw);
  
  // Analyze line movement if we have previous odds
  let lineMovement: LineMovement | undefined;
  if (previousOdds) {
    const homeDiff = previousOdds.homeOdds - odds.homeOdds;
    const magnitude = Math.abs(homeDiff);
    
    let direction: LineMovement['direction'] = 'stable';
    if (homeDiff > 0.05) direction = 'toward_home';  // Odds shortened = money on home
    else if (homeDiff < -0.05) direction = 'toward_away';
    
    let magLabel: LineMovement['magnitude'] = 'slight';
    if (magnitude > 0.15) magLabel = 'sharp';
    else if (magnitude > 0.08) magLabel = 'moderate';
    
    lineMovement = {
      direction,
      magnitude: magLabel,
      interpretation: direction === 'toward_home' 
        ? 'Money coming for Home' 
        : direction === 'toward_away' 
          ? 'Money coming for Away'
          : 'Line stable',
      suspicious: magnitude > 0.2,
    };
  }
  
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
