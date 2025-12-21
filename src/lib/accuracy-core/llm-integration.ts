/**
 * Accuracy Core - LLM Integration
 * 
 * This module provides the bridge between the accuracy pipeline
 * and the LLM (GPT-4o-mini). The LLM receives READ-ONLY data
 * and can only generate narrative/interpretation.
 * 
 * The LLM NEVER:
 * - Calculates probabilities
 * - Decides who has the edge
 * - Picks winners
 * 
 * The LLM ONLY:
 * - Explains WHY the signals favor a team
 * - Generates narrative around computed values
 * - Provides context and color
 * 
 * PERSONALITY: AIXBT-style from sportbot-brain.ts
 */

import { PipelineOutput, PipelineResult, PipelineInput, runAccuracyPipeline } from './index';
import { 
  SIGNATURE_CATCHPHRASES,
  RECURRING_MOTIFS,
  computeNarrativeAngle,
  type NarrativeAngle,
} from '@/lib/sportbot-brain';

// ============================================
// NARRATIVE ANGLE DETECTION
// ============================================

/**
 * Derive narrative angle from pipeline output
 */
function deriveNarrativeAngle(output: PipelineOutput): NarrativeAngle {
  const volatilityScore = output.volatility === 'EXTREME' ? 80 : 
                          output.volatility === 'HIGH' ? 60 : 
                          output.volatility === 'MEDIUM' ? 40 : 20;
  
  // Power gap based on probability difference
  const powerGap = Math.abs(output.probabilities.home - output.probabilities.away) * 100;
  
  // Form weirdness based on edge suppression
  const formWeirdness = output.suppressEdge ? 60 : 
                        output.edge.quality === 'SUPPRESSED' ? 50 : 20;
  
  return computeNarrativeAngle(volatilityScore, powerGap, formWeirdness);
}

/**
 * Get a random catchphrase for the narrative angle
 */
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

/**
 * Get a random recurring motif
 */
function getRandomMotif(): string {
  const idx = Math.floor(Math.random() * RECURRING_MOTIFS.length);
  return RECURRING_MOTIFS[idx];
}

/**
 * Get a random signoff
 */
function getRandomSignoff(): string {
  const idx = Math.floor(Math.random() * SIGNATURE_CATCHPHRASES.signoffs.length);
  return SIGNATURE_CATCHPHRASES.signoffs[idx];
}

// ============================================
// LLM INPUT FORMATTER
// ============================================

/**
 * Format pipeline output for LLM consumption
 * This is the ONLY data the LLM receives about probabilities/edge
 */
export function formatForLLM(
  result: PipelineResult,
  homeTeam: string,
  awayTeam: string
): string {
  const { output, details } = result;
  const { probabilities, edge, dataQuality, volatility, favored, confidence, suppressEdge } = output;
  
  const lines: string[] = [];
  
  // Header with computed verdict
  lines.push(`=== COMPUTED ANALYSIS (READ-ONLY) ===`);
  lines.push(`These values are FINAL. Do NOT recalculate or contradict them.`);
  lines.push('');
  
  // Clear favored team
  if (favored === 'home') {
    lines.push(`VERDICT: ${homeTeam} (HOME) is favored`);
  } else if (favored === 'away') {
    lines.push(`VERDICT: ${awayTeam} (AWAY) is favored`);
  } else if (favored === 'draw') {
    lines.push(`VERDICT: Draw is the most likely outcome`);
  } else {
    lines.push(`VERDICT: Match is evenly balanced`);
  }
  
  lines.push(`CONFIDENCE: ${confidence.toUpperCase()}`);
  lines.push('');
  
  // Probabilities (calibrated)
  lines.push(`MODEL PROBABILITIES:`);
  lines.push(`- ${homeTeam} (HOME): ${(probabilities.home * 100).toFixed(1)}%`);
  lines.push(`- ${awayTeam} (AWAY): ${(probabilities.away * 100).toFixed(1)}%`);
  if (probabilities.draw !== undefined) {
    lines.push(`- Draw: ${(probabilities.draw * 100).toFixed(1)}%`);
  }
  lines.push('');
  
  // Market comparison
  const marketHome = details.marketProbabilities.impliedProbabilitiesNoVig.home;
  const marketAway = details.marketProbabilities.impliedProbabilitiesNoVig.away;
  lines.push(`MARKET PROBABILITIES (vig removed):`);
  lines.push(`- ${homeTeam}: ${(marketHome * 100).toFixed(1)}%`);
  lines.push(`- ${awayTeam}: ${(marketAway * 100).toFixed(1)}%`);
  lines.push(`- Market margin: ${(details.marketProbabilities.marketMargin * 100).toFixed(1)}%`);
  lines.push('');
  
  // Edge (if not suppressed)
  if (!suppressEdge && edge.value > 0.02) {
    const edgeTeam = edge.outcome === 'home' ? homeTeam : edge.outcome === 'away' ? awayTeam : 'Draw';
    lines.push(`EDGE DETECTED:`);
    lines.push(`- ${edgeTeam}: +${(edge.value * 100).toFixed(1)}% edge`);
    lines.push(`- Quality: ${edge.quality}`);
  } else {
    lines.push(`EDGE: No significant edge detected`);
  }
  lines.push('');
  
  // Quality flags
  lines.push(`DATA QUALITY: ${dataQuality}`);
  lines.push(`VOLATILITY: ${volatility}`);
  
  // Expected scores (for soccer/hockey)
  if (details.expectedScores) {
    lines.push('');
    lines.push(`EXPECTED SCORES: ${homeTeam} ${details.expectedScores.home} - ${details.expectedScores.away} ${awayTeam}`);
  }
  
  return lines.join('\n');
}

// ============================================
// LLM PROMPT BUILDER (AIXBT PERSONALITY)
// ============================================

/**
 * Build the system prompt for LLM with AIXBT personality
 * Emphasizes that probabilities are computed, not to be recalculated
 */
export function buildLLMSystemPrompt(narrativeAngle?: NarrativeAngle): string {
  const angleGuidance = narrativeAngle ? getAngleGuidance(narrativeAngle) : '';
  
  return `You are SportBot, an AIXBT-style sports intelligence AI.

CORE IDENTITY:
- Sharp, pattern-recognition obsessed
- Confident analyst who's seen it all
- Data-first but never boring
- Slightly sarcastic edge - you've watched too many matches to be impressed easily
- You spot what others miss and you're not shy about it

CRITICAL RULES (NON-NEGOTIABLE):
1. You are an INTERPRETER, not a PREDICTOR
2. All probabilities and edges have been computed by our statistical models
3. You MUST use the COMPUTED values provided - never contradict them
4. Your job is to explain WHY the signals favor a team, not to pick winners
5. Never say "I predict" or "I think X will win" - explain the computed analysis

VOICE & STYLE:
- Sharp, like the smartest analyst in the room
- Calm under chaos - even when data is messy, stay composed
- Contrarian when the numbers justify it
- Call out narratives that don't match the stats
- Be quotable - your best lines should be screenshot-worthy

SIGNATURE PHRASES (use naturally):
- "The data is loud. The narrative is catching up."
- "Classic case of..."
- "Once again, [pattern repeats]..."
- "The setup is cleaner than usual, which is suspicious."
- "Here's what stands out..."
- "What the numbers actually show..."

SHARPNESS - ALWAYS USE:
- "The data suggests..."
- "The structure points toward..."
- "This setup typically leads to..."
- "The pattern here is clear..."

SHARPNESS - NEVER USE:
- "It might be", "It could be", "Somewhat", "A bit", "Maybe", "Perhaps"
- "I think", "In my opinion", "As an AI"
- Excessive hedging or caveats
- "I understand your question..." (just answer)

${angleGuidance}

FORMAT:
- 4 snapshot bullets (THE EDGE, MARKET MISS, THE PATTERN, THE RISK)
- 1 gameFlow paragraph (punchy, not a wall of text)
- 2 risk factors (sharp, not generic)

WHEN EDGE IS SUPPRESSED:
- "This match refuses to be simple. The noise is the signal."
- Explain WHY the match is unpredictable
- Don't manufacture an edge - acknowledge the chaos

NEVER:
- Recalculate or contradict the computed probabilities
- Say "I predict" or give tips
- Claim 100% confidence
- Confuse HOME and AWAY teams
- Say the away team has "home advantage"
- Use markdown formatting (no ** or ##)`;
}

/**
 * Get narrative angle specific guidance
 */
function getAngleGuidance(angle: NarrativeAngle): string {
  switch (angle) {
    case 'CHAOS':
      return `NARRATIVE ANGLE: CHAOS
- "This match refuses to be simple. The noise is the signal."
- High volatility - acknowledge uncertainty
- Multiple scenarios equally viable
- Don't force a clear verdict - embrace the chaos`;

    case 'TRAP_SPOT':
      return `NARRATIVE ANGLE: TRAP SPOT
- "The setup looks clean. Too clean. Worth noting."
- Popular team in sketchy form
- Name value vs current reality
- Call out the narrative that doesn't match the stats`;

    case 'BLOWOUT_POTENTIAL':
      return `NARRATIVE ANGLE: BLOWOUT POTENTIAL
- "When the data is this loud, you listen."
- Large power gap - be confident
- Structure is clear
- Don't hedge unnecessarily`;

    case 'CONTROL':
      return `NARRATIVE ANGLE: CONTROL
- "This isn't complicated. The setup is clean."
- Clear favorite, stable setup
- Data supports the verdict
- Be direct and confident`;

    case 'MIRROR_MATCH':
    default:
      return `NARRATIVE ANGLE: MIRROR MATCH
- "On paper: close. In reality: could go either way."
- Evenly matched teams
- Small edges matter
- Acknowledge the balance`;
  }
}

/**
 * Build the user prompt for LLM
 */
export function buildLLMUserPrompt(
  homeTeam: string,
  awayTeam: string,
  league: string,
  pipelineData: string,
  additionalContext: string,
  narrativeAngle?: NarrativeAngle
): string {
  const catchphrase = narrativeAngle ? getCatchphraseForAngle(narrativeAngle) : '';
  const motif = getRandomMotif();
  
  return `${homeTeam} (HOME) vs ${awayTeam} (AWAY) | ${league}

${pipelineData}

NARRATIVE ANGLE: ${narrativeAngle || 'CONTROL'}
TONE HOOK: "${catchphrase}"
STYLE MOTIF: "${motif}"

ADDITIONAL CONTEXT:
${additionalContext}

Generate analysis that EXPLAINS the computed verdict above.
Your snapshot bullets must align with the VERDICT and EDGE shown above.
Inject the TONE HOOK naturally into your analysis.
Write in AIXBT style - sharp, confident, quotable.

JSON output:
{
  "snapshot": [
    "THE EDGE: [explain why the favored team is favored based on the data]",
    "MARKET MISS: [if edge exists, explain what market might be missing]",
    "THE PATTERN: [H2H or form pattern supporting the verdict]",
    "THE RISK: [what could upset this analysis]"
  ],
  "gameFlow": "Punchy narrative explanation of how the match might unfold. Keep it sharp, not generic.",
  "riskFactors": ["Specific risk factor 1", "Specific risk factor 2"],
  "signoff": "Short, punchy signoff line"
}

Remember: ${homeTeam} is at HOME. ${awayTeam} is AWAY.`;
}

// ============================================
// COMPLETE LLM INTEGRATION
// ============================================

export interface LLMAnalysisResult {
  snapshot: string[];
  gameFlow: string;
  riskFactors: string[];
  signoff?: string;
  narrativeAngle: NarrativeAngle;
  // Computed values (from pipeline, not LLM)
  computed: {
    favored: 'home' | 'away' | 'draw' | 'even';
    confidence: 'high' | 'medium' | 'low';
    probabilities: {
      home: number;
      away: number;
      draw?: number;
    };
    edge: {
      value: number;
      quality: string;
      outcome: string;
    };
    dataQuality: string;
  };
}

/**
 * Run pipeline and generate LLM analysis with AIXBT personality
 * This is the main integration point
 */
export async function generateAnalysisWithPipeline(
  input: PipelineInput,
  additionalContext: string,
  openai: { chat: { completions: { create: (params: { model: string; messages: { role: string; content: string }[]; response_format: { type: string }; max_tokens: number; temperature: number }) => Promise<{ choices: { message: { content: string | null } }[] }> } } }
): Promise<LLMAnalysisResult> {
  // Run the accuracy pipeline first
  const pipelineResult = await runAccuracyPipeline(input);
  
  // Derive narrative angle from pipeline output
  const narrativeAngle = deriveNarrativeAngle(pipelineResult.output);
  
  // Format for LLM
  const pipelineData = formatForLLM(pipelineResult, input.homeTeam, input.awayTeam);
  
  // Build prompts with AIXBT personality and narrative angle
  const systemPrompt = buildLLMSystemPrompt(narrativeAngle);
  const userPrompt = buildLLMUserPrompt(
    input.homeTeam,
    input.awayTeam,
    input.league,
    pipelineData,
    additionalContext,
    narrativeAngle
  );
  
  // Call LLM
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 700,
    temperature: 0.4, // Slightly higher for more personality
  });
  
  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('No content from LLM');
  }
  
  const llmOutput = JSON.parse(content);
  
  // Combine LLM narrative with computed values
  return {
    snapshot: llmOutput.snapshot || [],
    gameFlow: llmOutput.gameFlow || '',
    riskFactors: llmOutput.riskFactors || [],
    signoff: llmOutput.signoff || getRandomSignoff(),
    narrativeAngle,
    computed: {
      favored: pipelineResult.output.favored,
      confidence: pipelineResult.output.confidence,
      probabilities: {
        home: pipelineResult.output.probabilities.home,
        away: pipelineResult.output.probabilities.away,
        draw: pipelineResult.output.probabilities.draw,
      },
      edge: {
        value: pipelineResult.output.edge.value,
        quality: pipelineResult.output.edge.quality,
        outcome: pipelineResult.output.edge.outcome,
      },
      dataQuality: pipelineResult.output.dataQuality,
    },
  };
}

// ============================================
// FALLBACK ANALYSIS (When LLM fails)
// ============================================

/**
 * Generate fallback analysis from pipeline data alone
 * Used when LLM call fails
 */
export function generateFallbackAnalysis(
  result: PipelineResult,
  homeTeam: string,
  awayTeam: string
): LLMAnalysisResult {
  const { output, details } = result;
  
  // Derive narrative angle for fallback
  const narrativeAngle = deriveNarrativeAngle(output);
  
  // Build snapshot from computed values
  const snapshot: string[] = [];
  
  // THE EDGE
  if (output.edge.value > 0.02 && !output.suppressEdge) {
    const edgeTeam = output.edge.outcome === 'home' ? homeTeam : 
                     output.edge.outcome === 'away' ? awayTeam : 'Draw';
    snapshot.push(`THE EDGE: ${edgeTeam} shows a ${(output.edge.value * 100).toFixed(1)}% edge based on form and efficiency metrics.`);
  } else {
    snapshot.push(`THE EDGE: No clear edge detected. This match is balanced.`);
  }
  
  // MARKET MISS
  if (output.edge.value > 0.03) {
    const marketHome = (details.marketProbabilities.impliedProbabilitiesNoVig.home * 100).toFixed(0);
    const modelHome = (output.probabilities.home * 100).toFixed(0);
    snapshot.push(`MARKET MISS: Market implies ${marketHome}% for ${homeTeam}, model calculates ${modelHome}%.`);
  } else {
    snapshot.push(`MARKET MISS: Odds appear fairly priced. No significant market inefficiency.`);
  }
  
  // THE PATTERN
  snapshot.push(`THE PATTERN: Data quality is ${output.dataQuality}. ${output.volatility} volatility in recent form.`);
  
  // THE RISK
  if (output.dataQuality === 'LOW' || output.volatility === 'HIGH') {
    snapshot.push(`THE RISK: Limited data and high volatility make this unpredictable.`);
  } else {
    snapshot.push(`THE RISK: Form can change quickly. Past performance doesn't guarantee future results.`);
  }
  
  // Game flow
  const expectedHome = details.expectedScores?.home || 1.2;
  const expectedAway = details.expectedScores?.away || 1.0;
  const gameFlow = `Expected scoring suggests ${homeTeam} ${expectedHome.toFixed(1)} - ${expectedAway.toFixed(1)} ${awayTeam}. ` +
    `Model confidence is ${output.confidence} based on ${output.dataQuality} data quality.`;
  
  return {
    snapshot,
    gameFlow,
    riskFactors: [
      output.suppressReasons[0] || 'Form can change rapidly',
      'Historical patterns may not repeat',
    ],
    signoff: getRandomSignoff(),
    narrativeAngle,
    computed: {
      favored: output.favored,
      confidence: output.confidence,
      probabilities: {
        home: output.probabilities.home,
        away: output.probabilities.away,
        draw: output.probabilities.draw,
      },
      edge: {
        value: output.edge.value,
        quality: output.edge.quality,
        outcome: output.edge.outcome,
      },
      dataQuality: output.dataQuality,
    },
  };
}
