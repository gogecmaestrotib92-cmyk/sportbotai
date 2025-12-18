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
 * - Form momentum
 * - Strength edge calculation
 * - Efficiency patterns
 * - Home advantage
 * - Injury impact
 */
export function calculateModelProbability(
  signals: UniversalSignals,
  hasDraw: boolean = true
): ModelProbability {
  // Start with base probabilities
  let homeBase = hasDraw ? 40 : 50;  // Base home probability
  let awayBase = hasDraw ? 30 : 50;  // Base away probability
  let drawBase = hasDraw ? 30 : 0;   // Base draw probability
  
  // 1. Apply Strength Edge (biggest factor) - with null safety
  const edgeDir = signals.display?.edge?.direction || 'even';
  const edgePct = signals.display?.edge?.percentage || 50;
  
  if (edgeDir === 'home') {
    homeBase += edgePct * 0.8;  // 80% of edge goes to win prob
    awayBase -= edgePct * 0.5;
    drawBase -= edgePct * 0.3;
  } else if (edgeDir === 'away') {
    awayBase += edgePct * 0.8;
    homeBase -= edgePct * 0.5;
    drawBase -= edgePct * 0.3;
  }
  
  // 2. Apply Form Factor
  const homeForm = signals.display.form.home;
  const awayForm = signals.display.form.away;
  
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
 */
export function detectValue(
  modelProb: ModelProbability,
  odds: OddsData
): ValueEdge {
  // Calculate implied probabilities from odds
  const impliedHome = oddsToImpliedProb(odds.homeOdds);
  const impliedAway = oddsToImpliedProb(odds.awayOdds);
  const impliedDraw = odds.drawOdds ? oddsToImpliedProb(odds.drawOdds) : null;
  
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
  
  // Calculate implied probabilities
  const impliedHome = oddsToImpliedProb(odds.homeOdds);
  const impliedAway = oddsToImpliedProb(odds.awayOdds);
  const impliedDraw = odds.drawOdds ? oddsToImpliedProb(odds.drawOdds) : undefined;
  const margin = calculateMargin(odds.homeOdds, odds.awayOdds, odds.drawOdds);
  
  // Detect value
  const valueEdge = detectValue(modelProb, odds);
  
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
