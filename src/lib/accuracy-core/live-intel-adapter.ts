/**
 * Accuracy Core - Live Intel Adapter
 * 
 * Lightweight adapter for live intel posts and Twitter content.
 * Works with minimal data (match + odds) when full stats aren't available.
 * 
 * KEY: Even with minimal data, we still run through proper Data-1 → Data-2
 * layers for calibrated probabilities and narrative angle detection.
 */

import { 
  PipelineInput, 
  runAccuracyPipeline,
  PipelineResult,
} from './index';
import {
  generateFallbackAnalysis,
  type LLMAnalysisResult,
} from './llm-integration';
import {
  quickMarketProbabilities,
} from './market-probabilities';
import {
  SIGNATURE_CATCHPHRASES,
  RECURRING_MOTIFS,
  computeNarrativeAngle,
  type NarrativeAngle,
} from '@/lib/sportbot-brain';

// ============================================
// MINIMAL INPUT (for live intel with just odds)
// ============================================

export interface MinimalMatchData {
  matchId?: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  kickoff?: string | Date;
  odds?: {
    home: number;
    away: number;
    draw?: number;
    bookmaker?: string;
  };
}

// ============================================
// QUICK ANALYSIS OUTPUT
// ============================================

export interface QuickAnalysisResult {
  // Computed values (from pipeline)
  probabilities: {
    home: number;
    away: number;
    draw?: number;
  };
  edge: {
    value: number;
    outcome: 'home' | 'away' | 'draw' | 'none';
    quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'SUPPRESSED';
  };
  favored: 'home' | 'away' | 'draw' | 'even';
  confidence: 'high' | 'medium' | 'low';
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  
  // Narrative helpers
  narrativeAngle: NarrativeAngle;
  catchphrase: string;
  motif: string;
  signoff: string;
  
  // Market intel
  marketMargin: number;
  impliedProbabilities: {
    home: number;
    away: number;
    draw?: number;
  };
}

// ============================================
// QUICK ANALYSIS (MINIMAL DATA)
// ============================================

/**
 * Run a quick analysis with minimal data
 * Used for live intel posts when full stats aren't available
 * 
 * This still respects Data-1 → Data-2 separation:
 * - Data-1: vig removal, implied probs (market-probabilities.ts)
 * - Data-3: narrative angle (sportbot-brain.ts)
 */
export function runQuickAnalysis(match: MinimalMatchData): QuickAnalysisResult {
  // Default odds if not provided (assume even match)
  const odds = match.odds || { home: 2.0, away: 2.0, draw: 3.4 };
  
  // Step 1: Data-1 - Market probability normalization
  const marketProbs = quickMarketProbabilities(
    odds.home,
    odds.away,
    odds.draw
  );
  
  // Step 2: With minimal data, use conservative quality estimates
  // We don't have form/stats, so data quality is inherently low
  const dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT' = 'LOW';
  
  // Step 3: Volatility from market margin (high margin = more uncertainty)
  let volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
  if (marketProbs.marketMargin > 0.12) {
    volatilityLevel = 'EXTREME';
  } else if (marketProbs.marketMargin > 0.10) {
    volatilityLevel = 'HIGH';
  } else if (marketProbs.marketMargin > 0.06) {
    volatilityLevel = 'MEDIUM';
  }
  
  // Step 4: Determine favored team from market probs
  // CRITICAL: For sports without draws (basketball, NFL, hockey), NEVER return 'even'
  const { home, away, draw } = marketProbs.impliedProbabilitiesNoVig;
  const hasDraw = draw !== undefined && draw > 0;
  let favored: 'home' | 'away' | 'draw' | 'even' = 'even';
  
  if (hasDraw && draw > home && draw > away) {
    favored = 'draw';
  } else if (home > away && home - away > 0.05) {
    favored = 'home';
  } else if (away > home && away - home > 0.05) {
    favored = 'away';
  } else if (!hasDraw) {
    // For non-draw sports with close probabilities, pick the higher side
    favored = home >= away ? 'home' : 'away';
  }
  
  // Step 5: Calculate edge (market vs our estimate)
  // With minimal data, we assume market is efficient (no edge)
  const edge = {
    value: 0,
    outcome: 'none' as const,
    quality: 'LOW' as const,
  };
  
  // Step 6: Confidence based on data quality
  const confidence: 'high' | 'medium' | 'low' = 'low'; // Minimal data = low confidence
  
  // Step 7: Data-3 - Derive narrative angle
  const volatilityScore = volatilityLevel === 'EXTREME' ? 80 :
                          volatilityLevel === 'HIGH' ? 60 :
                          volatilityLevel === 'MEDIUM' ? 40 : 20;
  const powerGap = Math.abs(home - away) * 100;
  const formWeirdness = 30; // Default mid-value without form data
  
  const narrativeAngle = computeNarrativeAngle(volatilityScore, powerGap, formWeirdness);
  
  // Step 8: Select personality elements
  const catchphrase = getCatchphraseForAngle(narrativeAngle);
  const motif = getRandomMotif();
  const signoff = getRandomSignoff();
  
  return {
    probabilities: {
      home,
      away,
      draw,
    },
    edge,
    favored,
    confidence,
    dataQuality,
    volatility: volatilityLevel,
    narrativeAngle,
    catchphrase,
    motif,
    signoff,
    marketMargin: marketProbs.marketMargin,
    impliedProbabilities: marketProbs.impliedProbabilitiesNoVig,
  };
}

// ============================================
// FULL ANALYSIS (WITH STATS)
// ============================================

/**
 * Run full pipeline analysis when stats are available
 * Returns both pipeline result and narrative elements
 */
export async function runFullAnalysis(input: PipelineInput): Promise<{
  pipeline: PipelineResult;
  narrativeAngle: NarrativeAngle;
  catchphrase: string;
  motif: string;
  signoff: string;
}> {
  // Run the complete pipeline
  const pipeline = await runAccuracyPipeline(input);
  
  // Derive narrative angle from pipeline output
  const volatilityScore = pipeline.output.volatility === 'EXTREME' ? 80 :
                          pipeline.output.volatility === 'HIGH' ? 60 :
                          pipeline.output.volatility === 'MEDIUM' ? 40 : 20;
  const powerGap = Math.abs(
    pipeline.output.probabilities.home - pipeline.output.probabilities.away
  ) * 100;
  const formWeirdness = pipeline.output.suppressEdge ? 60 :
                        pipeline.output.edge.quality === 'SUPPRESSED' ? 50 : 20;
  
  const narrativeAngle = computeNarrativeAngle(volatilityScore, powerGap, formWeirdness);
  
  return {
    pipeline,
    narrativeAngle,
    catchphrase: getCatchphraseForAngle(narrativeAngle),
    motif: getRandomMotif(),
    signoff: getRandomSignoff(),
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCatchphraseForAngle(angle: NarrativeAngle): string {
  switch (angle) {
    case 'CHAOS':
      const chaosIdx = Math.floor(Math.random() * SIGNATURE_CATCHPHRASES.chaos.length);
      return SIGNATURE_CATCHPHRASES.chaos[chaosIdx];
    case 'TRAP_SPOT':
      const contrarianIdx = Math.floor(Math.random() * SIGNATURE_CATCHPHRASES.contrarian.length);
      return SIGNATURE_CATCHPHRASES.contrarian[contrarianIdx];
    case 'BLOWOUT_POTENTIAL':
    case 'CONTROL':
      const highIdx = Math.floor(Math.random() * SIGNATURE_CATCHPHRASES.highConviction.length);
      return SIGNATURE_CATCHPHRASES.highConviction[highIdx];
    case 'MIRROR_MATCH':
    default:
      const openerIdx = Math.floor(Math.random() * SIGNATURE_CATCHPHRASES.openers.length);
      return SIGNATURE_CATCHPHRASES.openers[openerIdx];
  }
}

function getRandomMotif(): string {
  const idx = Math.floor(Math.random() * RECURRING_MOTIFS.length);
  return RECURRING_MOTIFS[idx];
}

function getRandomSignoff(): string {
  const idx = Math.floor(Math.random() * SIGNATURE_CATCHPHRASES.signoffs.length);
  return SIGNATURE_CATCHPHRASES.signoffs[idx];
}

// ============================================
// POST CONTENT HELPERS
// ============================================

/**
 * Format analysis result into a prompt context for agent posts
 */
export function formatAnalysisForPost(
  result: QuickAnalysisResult,
  homeTeam: string,
  awayTeam: string
): string {
  const lines: string[] = [];
  
  lines.push(`=== COMPUTED ANALYSIS (from accuracy-core) ===`);
  lines.push(`These values are final. Do not contradict them.`);
  lines.push('');
  
  // Favored team
  if (result.favored === 'home') {
    lines.push(`VERDICT: ${homeTeam} is the market favorite`);
  } else if (result.favored === 'away') {
    lines.push(`VERDICT: ${awayTeam} is the market favorite`);
  } else if (result.favored === 'draw') {
    lines.push(`VERDICT: Draw is most likely outcome`);
  } else {
    lines.push(`VERDICT: Match is evenly balanced`);
  }
  
  // Probabilities
  lines.push('');
  lines.push(`MARKET PROBABILITIES (vig removed):`);
  lines.push(`- ${homeTeam}: ${(result.probabilities.home * 100).toFixed(1)}%`);
  lines.push(`- ${awayTeam}: ${(result.probabilities.away * 100).toFixed(1)}%`);
  if (result.probabilities.draw !== undefined) {
    lines.push(`- Draw: ${(result.probabilities.draw * 100).toFixed(1)}%`);
  }
  
  // Data quality warning
  lines.push('');
  lines.push(`DATA QUALITY: ${result.dataQuality}`);
  lines.push(`VOLATILITY: ${result.volatility}`);
  lines.push(`CONFIDENCE: ${result.confidence.toUpperCase()}`);
  
  // Narrative guidance
  lines.push('');
  lines.push(`NARRATIVE ANGLE: ${result.narrativeAngle}`);
  lines.push(`TONE HOOK: "${result.catchphrase}"`);
  lines.push(`STYLE MOTIF: "${result.motif}"`);
  
  return lines.join('\n');
}

/**
 * Get angle-specific post guidance
 */
export function getPostGuidance(angle: NarrativeAngle): string {
  switch (angle) {
    case 'CHAOS':
      return 'High uncertainty - acknowledge the chaos, don\'t force a verdict';
    case 'TRAP_SPOT':
      return 'Popular narrative may be wrong - be contrarian with evidence';
    case 'BLOWOUT_POTENTIAL':
      return 'Large gap - be confident but not reckless';
    case 'CONTROL':
      return 'Clear setup - be direct and sharp';
    case 'MIRROR_MATCH':
    default:
      return 'Close contest - acknowledge the balance';
  }
}
