/**
 * Accuracy Core - Probability Scale Validation
 * 
 * Utility to detect and prevent probability scale mismatches.
 * 
 * The codebase has two probability scales:
 * - Decimal (0-1): Used by pipeline internals (calibration, edge calculation)
 * - Percentage (0-100): Used by DB storage, UI display, LLM prompts
 * 
 * This module provides runtime assertions to catch scale mismatches
 * before they produce wrong results (e.g., "4910%" or "0.5%" edges).
 */

export type ProbScale = 'decimal' | 'percentage';

/**
 * Detect the probable scale of a probability value.
 * Values > 1 are assumed to be percentage scale.
 * Values 0-1 are assumed to be decimal scale.
 */
export function detectProbScale(value: number): ProbScale {
  if (value > 1) return 'percentage';
  return 'decimal';
}

/**
 * Assert that probabilities are in the expected scale.
 * Throws a warning (not error) if mismatch detected.
 * 
 * @param probs - Object with probability values
 * @param expectedScale - The scale these values should be in
 * @param context - Description of where this check is happening
 * @returns true if valid, false if scale mismatch detected
 */
export function assertProbScale(
  probs: { home: number; away: number; draw?: number | null },
  expectedScale: ProbScale,
  context: string
): boolean {
  const values = [probs.home, probs.away];
  if (probs.draw != null) values.push(probs.draw);
  
  for (const val of values) {
    if (val === 0) continue; // 0 is ambiguous, skip
    
    const detected = detectProbScale(val);
    
    if (detected !== expectedScale) {
      console.warn(
        `[ProbValidation] ⚠️ Scale mismatch in ${context}: ` +
        `expected ${expectedScale} but got value ${val} (looks like ${detected}). ` +
        `Probs: H=${probs.home} A=${probs.away} D=${probs.draw ?? 'N/A'}`
      );
      return false;
    }
  }
  
  return true;
}

/**
 * Normalize probabilities to a target scale.
 * 
 * @param probs - Probability values (auto-detected scale)
 * @param targetScale - The desired output scale
 */
export function normalizeProbScale(
  probs: { home: number; away: number; draw?: number | null },
  targetScale: ProbScale
): { home: number; away: number; draw?: number | null } {
  const currentScale = detectProbScale(probs.home || probs.away);
  
  if (currentScale === targetScale) return probs;
  
  if (currentScale === 'decimal' && targetScale === 'percentage') {
    return {
      home: Math.round(probs.home * 1000) / 10,
      away: Math.round(probs.away * 1000) / 10,
      draw: probs.draw != null ? Math.round(probs.draw * 1000) / 10 : probs.draw,
    };
  }
  
  if (currentScale === 'percentage' && targetScale === 'decimal') {
    return {
      home: probs.home / 100,
      away: probs.away / 100,
      draw: probs.draw != null ? probs.draw / 100 : probs.draw,
    };
  }
  
  return probs;
}

/**
 * Validate that probabilities sum to approximately 100% (percentage scale)
 * or 1.0 (decimal scale).
 */
export function validateProbSum(
  probs: { home: number; away: number; draw?: number | null },
  scale: ProbScale,
  context: string,
  tolerance: number = 5 // percentage points or 0.05 for decimal
): boolean {
  const sum = probs.home + probs.away + (probs.draw ?? 0);
  const expectedSum = scale === 'percentage' ? 100 : 1.0;
  const adjustedTolerance = scale === 'percentage' ? tolerance : tolerance / 100;
  
  if (Math.abs(sum - expectedSum) > adjustedTolerance) {
    console.warn(
      `[ProbValidation] ⚠️ Sum mismatch in ${context}: ` +
      `expected ~${expectedSum} but got ${sum.toFixed(2)} ` +
      `(H=${probs.home} A=${probs.away} D=${probs.draw ?? 'N/A'})`
    );
    return false;
  }
  
  return true;
}

/**
 * Compute edges consistently across all entry points.
 * Edge = model probability - market fair probability (vig-removed).
 * 
 * This is the SINGLE source of truth for edge calculation.
 * All entry points should use this instead of inline subtraction.
 * 
 * @param modelProbs - Model probabilities (any scale, auto-detected)
 * @param marketFairProbs - Vig-removed market probabilities (same scale as model)
 * @returns Edges in the same scale as inputs
 */
export function computeEdges(
  modelProbs: { home: number; away: number; draw?: number | null },
  marketFairProbs: { home: number; away: number; draw?: number | null },
): { homeEdge: number; awayEdge: number; drawEdge: number | null; bestEdge: { outcome: 'home' | 'away' | 'draw'; value: number } } {
  const homeEdge = Math.round((modelProbs.home - marketFairProbs.home) * 10) / 10;
  const awayEdge = Math.round((modelProbs.away - marketFairProbs.away) * 10) / 10;
  const drawEdge = (modelProbs.draw != null && marketFairProbs.draw != null)
    ? Math.round((modelProbs.draw - marketFairProbs.draw) * 10) / 10
    : null;
  
  // Determine best edge
  type EdgeEntry = { outcome: 'home' | 'away' | 'draw'; value: number };
  const edges: EdgeEntry[] = [
    { outcome: 'home', value: homeEdge },
    { outcome: 'away', value: awayEdge },
  ];
  if (drawEdge !== null) {
    edges.push({ outcome: 'draw', value: drawEdge });
  }
  
  const bestEdge = edges.reduce((best, curr) => 
    curr.value > best.value ? curr : best
  , edges[0]);
  
  return { homeEdge, awayEdge, drawEdge, bestEdge };
}
