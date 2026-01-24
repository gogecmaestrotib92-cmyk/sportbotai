/**
 * SportBotAgent Configuration
 * 
 * AIXBT-style AI sports intelligence agent.
 * Generates observational, analytical content - NEVER betting advice.
 * 
 * Uses the Master Brain personality system for consistency across app.
 * Safe for: Stripe, App Store, Google Play, social sharing
 */

import { 
  POST_PERSONALITY, 
  AGENT_PERSONALITY as MASTER_AGENT_PERSONALITY,
  getCatchphrase,
  SIGNATURE_CATCHPHRASES,
  type ConvictionLevel,
  CONVICTION_LEVELS,
  type NarrativeAngle,
} from '@/lib/sportbot-brain';

// ============================================
// AGENT IDENTITY
// ============================================

export const SPORTBOT_AGENT = {
  name: 'SportBot Agent',
  displayName: 'AI Sports Desk',
  tagline: 'Match Intelligence, Delivered',
  version: '1.0.0',
  personality: 'AIXBT-style confident analyst',
};

// ============================================
// AGENT PERSONALITY (from Master Brain)
// ============================================

export const AGENT_PERSONALITY = MASTER_AGENT_PERSONALITY;

// ============================================
// POST CATEGORIES (SAFE + HIGH VALUE)
// ============================================

export type PostCategory = 
  | 'MARKET_MOVEMENT'
  | 'LINEUP_INTEL'
  | 'MOMENTUM_SHIFT'
  | 'MATCH_COMPLEXITY'
  | 'AI_INSIGHT'
  | 'POST_MATCH'
  | 'VOLATILITY_ALERT'
  | 'FORM_ANALYSIS';

export interface PostCategoryConfig {
  id: PostCategory;
  name: string;
  icon: string;
  description: string;
  promptTemplate: string;
  examplePosts: string[];
}

export const POST_CATEGORIES: Record<PostCategory, PostCategoryConfig> = {
  MARKET_MOVEMENT: {
    id: 'MARKET_MOVEMENT',
    name: 'Market Movement',
    icon: '📊',
    description: 'Unusual odds movement or market uncertainty',
    promptTemplate: `Unusual line movement. Point out what moved and what it might mean.`,
    examplePosts: [
      'Line moved 12% in an hour. Someone knows something. Or thinks they do. 👀',
      'Sharp money hitting one side hard. Public loading the other. Classic.',
      'Market can\'t make up its mind. Moved twice in opposite directions. Volatility brewing.',
    ],
  },

  LINEUP_INTEL: {
    id: 'LINEUP_INTEL',
    name: 'Lineup Intelligence',
    icon: '📋',
    description: 'Lineup changes, injuries, tactical shifts',
    promptTemplate: `Key lineup news. What changed and why it matters.`,
    examplePosts: [
      'Star player out. Market adjusted 8%. Should have been 12%. Gap.',
      'Full strength for the first time in 6 weeks. Line hasn\'t caught up.',
      'Rotation heavy. Manager clearly saving legs for the bigger match.',
    ],
  },

  MOMENTUM_SHIFT: {
    id: 'MOMENTUM_SHIFT',
    name: 'Momentum & Form',
    icon: '📈',
    description: 'Form changes, momentum swings, trend breaks',
    promptTemplate: `Form trend worth noting. Recent results pattern.`,
    examplePosts: [
      '7-2-1 in the last 10. Form says one thing. Reputation says another. Market picked reputation.',
      'Unbeaten run looks good until you check the opponents. Schedule strength matters.',
      '5 clean sheets in 6. Defense was the problem. Now it\'s the foundation.',
    ],
  },

  MATCH_COMPLEXITY: {
    id: 'MATCH_COMPLEXITY',
    name: 'Match Complexity',
    icon: '🎯',
    description: 'High-complexity or unpredictable match alerts',
    promptTemplate: `This match is genuinely hard to call. Explain why.`,
    examplePosts: [
      'Model shrugs. Too many variables. Anyone claiming confidence is guessing.',
      'On paper: coin flip. In context: chaos. Variance heaven.',
      'Both teams trending opposite directions. Something has to give. No idea what.',
    ],
  },

  AI_INSIGHT: {
    id: 'AI_INSIGHT',
    name: 'AI Insight',
    icon: '🧠',
    description: 'Interesting patterns, anomalies, curiosities',
    promptTemplate: `Interesting pattern or stat. Make it punchy.`,
    examplePosts: [
      '17-4 at home. 6-12 on the road. Same team, different animal. Location matters here.',
      'Outperforming xG by 31%. Math says regression. Eye test says elite finishing. Pick one.',
      '0-7 as underdogs this year. Market keeps pricing them wrong. Pattern recognition.',
    ],
  },

  POST_MATCH: {
    id: 'POST_MATCH',
    name: 'Post-Match Analysis',
    icon: '📝',
    description: 'Model learnings and outcome analysis',
    promptTemplate: `Generate a post-match learning observation. Focus on:
- What the model expected vs what happened
- Key moment that shifted the outcome
- Learning for future similar fixtures
Builds trust through transparency.`,
    examplePosts: [
      'Model expected a balanced contest. Early red card shifted momentum beyond historical norms.',
      'Predicted high-scoring affair delivered. Both defenses as porous as anticipated.',
      'Upset materialized. Form indicators flagged it. Market didn\'t listen.',
    ],
  },

  VOLATILITY_ALERT: {
    id: 'VOLATILITY_ALERT',
    name: 'Volatility Alert',
    icon: '⚡',
    description: 'High volatility or uncertainty spikes',
    promptTemplate: `Generate a volatility alert. Focus on:
- What's causing elevated uncertainty
- Multiple unstable factors converging
- Why predictions are harder than usual
Analytical observation only.`,
    examplePosts: [
      'Volatility spike detected. Injury news + weather + form uncertainty = chaos cocktail.',
      'Model confidence dropped 15 points in the last hour. Something shifted.',
      'If you wanted certainty, this isn\'t the fixture for it.',
    ],
  },

  FORM_ANALYSIS: {
    id: 'FORM_ANALYSIS',
    name: 'Form Analysis',
    icon: '📉',
    description: 'Deep form observations and trends',
    promptTemplate: `Generate a form analysis post. Focus on:
- Recent performance trajectory
- Underlying metrics vs results
- Sustainability of current form
Pure sports analytics.`,
    examplePosts: [
      'Surface-level form looks solid. Dig deeper and the cracks appear.',
      'Results improving but process metrics declining. Correction incoming?',
      'The winning streak continues. The underlying numbers remain skeptical.',
    ],
  },
};

// ============================================
// TRIGGER CONDITIONS
// ============================================

export interface TriggerCondition {
  type: 'VOLATILITY_SPIKE' | 'CONFIDENCE_CHANGE' | 'INJURY_IMPACT' | 'MARKET_MOVEMENT' | 'FORM_SHIFT' | 'MATCH_START' | 'MATCH_END';
  threshold?: number;
  description: string;
}

export const TRIGGER_CONDITIONS: TriggerCondition[] = [
  { type: 'VOLATILITY_SPIKE', threshold: 15, description: 'Volatility increased by 15+ points' },
  { type: 'CONFIDENCE_CHANGE', threshold: 10, description: 'Model confidence shifted by 10+ points' },
  { type: 'INJURY_IMPACT', threshold: 5, description: 'Key player injury affects team rating by 5+' },
  { type: 'MARKET_MOVEMENT', threshold: 0.15, description: 'Odds moved by 15%+ in either direction' },
  { type: 'FORM_SHIFT', description: 'Team form trend changed direction' },
  { type: 'MATCH_START', description: 'Match kickoff approaching (1 hour)' },
  { type: 'MATCH_END', description: 'Match completed, results available' },
];

// ============================================
// POST GENERATION PROMPT
// ============================================

export function buildAgentPostPrompt(
  category: PostCategory,
  matchContext: string,
  additionalContext?: string,
  options?: {
    conviction?: ConvictionLevel;
    includeOpener?: boolean;
    includeSignoff?: boolean;
    forceContrarian?: boolean;
    receipts?: string; // Past correct calls for credibility
  }
): string {
  const config = POST_CATEGORIES[category];
  const conviction = options?.conviction || 3;
  const convictionInfo = CONVICTION_LEVELS[conviction];
  
  // Build optional sections
  let openerInstruction = '';
  let signoffInstruction = '';
  let contrarianInstruction = '';
  let receiptsSection = '';
  
  if (options?.includeOpener) {
    const openers = SIGNATURE_CATCHPHRASES.openers;
    openerInstruction = `\nOPTIONAL OPENER (pick one or similar):\n${openers.map(o => `- "${o}"`).join('\n')}`;
  }
  
  if (options?.includeSignoff) {
    const signoffs = SIGNATURE_CATCHPHRASES.signoffs;
    signoffInstruction = `\nEND WITH (pick one):\n${signoffs.map(s => `- "${s}"`).join('\n')}`;
  }
  
  if (options?.forceContrarian) {
    const contrarian = SIGNATURE_CATCHPHRASES.contrarian;
    contrarianInstruction = `\nCONTRARIAN MODE ACTIVE - Challenge the popular narrative:\n${contrarian.map(c => `- "${c}"`).join('\n')}`;
  }
  
  if (options?.receipts) {
    receiptsSection = `\nTRACK RECORD CONTEXT (use sparingly for credibility):\n${options.receipts}`;
  }
  
  return `${POST_PERSONALITY}

TASK: Generate a SportBot Agent post for category: ${config.name}

CONVICTION LEVEL: ${convictionInfo.display} (${convictionInfo.descriptor})
${conviction >= 4 ? 'HIGH CONVICTION - Be bold and direct. The data is clear.' : ''}
${conviction <= 2 ? 'LOW CONVICTION - Acknowledge uncertainty. The signals are mixed.' : ''}

CATEGORY GUIDELINES:
${config.promptTemplate}

EXAMPLE POSTS FOR THIS CATEGORY:
${config.examplePosts.map(p => `- "${p}"`).join('\n')}
${openerInstruction}
${contrarianInstruction}
${signoffInstruction}
${receiptsSection}

MATCH CONTEXT:
${matchContext}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}` : ''}

RULES:
1. Keep it to 1-3 sentences MAX
2. Lead with the insight
3. Sound confident and sharp (but match conviction level)
4. NO betting advice, recommendations, or implied actions
5. Pure observation and analysis
6. No emojis in main text. No markdown formatting.
7. If high conviction (4-5), be quotable and memorable
8. If contrarian mode, directly challenge the popular take
9. NEVER PICK WINNERS - Don't say "X to win" or "take X"
10. SHOW THE EDGE - Point out where market differs from reality
11. NUMBERS + ATTITUDE - Use percentages, but wrap them in confident personality

STYLE: Confident. Sarcastic. Elegant.
BAD: "Liverpool to win at 2.01"
BAD: "Model shows 12.5% edge on Liverpool" (dry, boring)
GOOD: "Market sleeping on Liverpool's form. 7 clean sheets in 9. Structure says 65%, books say 50%. That's not a rounding error."
GOOD: "13% gap. Either we're missing something, or they are."

Return ONLY the post text. No quotes, no formatting, no explanation.`;
}

/**
 * Build a thread prompt for multi-part analysis
 */
export function buildThreadPrompt(
  title: string,
  dataPoints: string[],
  conviction: ConvictionLevel
): string {
  const convictionInfo = CONVICTION_LEVELS[conviction];
  
  return `${POST_PERSONALITY}

TASK: Generate a SportBot analysis thread (4-5 parts)

TITLE: ${title}
CONVICTION: ${convictionInfo.display}

DATA POINTS TO COVER:
${dataPoints.map((dp, i) => `${i + 1}. ${dp}`).join('\n')}

THREAD STRUCTURE:
Part 1: 🧵 Hook - One punchy sentence that grabs attention
Part 2: 📊 Data Point 1 - Sharp observation with numbers
Part 3: 📊 Data Point 2 - Another key stat or pattern
Part 4: 💡 Insight - Connect the dots, show the EDGE (where market differs from reality)
Part 5: ${convictionInfo.emoji} Conclusion - Bold takeaway about what the gap means

RULES:
- Each part should be 1-2 sentences MAX
- Make it feel like a real analyst breaking down a story
- No betting advice - NEVER say "X to win" or pick a winner
- Show where market and reality diverge (the edge)
- End with a memorable line about the gap, not about who wins

Return as JSON array: ["Part 1 text", "Part 2 text", ...]`;
}

// ============================================
// SAFETY FILTERS
// ============================================

export const PROHIBITED_TERMS = [
  // Betting advice language
  'bet on', 'bet the', 'take the', 'take this',
  'best value', 'good value', 'value bet', 'value play',
  'lock', 'lock of', 'strong pick', 'pick of',
  'recommended', 'recommend', 'should bet', 'should take',
  'stake', 'wager', 'parlay', 'accumulator',
  'high roi', 'roi', 'profit', 'bankroll',
  'units', 'unit play', 'max bet',
  'guaranteed', 'sure thing', 'can\'t lose',
  'free money', 'easy money', 'printing money',
  // Winner-picking language (tipster style)
  'to win', 'will win', 'gonna win', 'going to win',
  'my pick', 'the pick', 'i like', 'i\'m taking',
  'back them', 'backing', 'play the', 'take them',
];

/**
 * Ensure content ends with a complete sentence.
 * If truncated mid-sentence (ends with "..."), trim to last complete sentence.
 */
export function ensureCompleteSentence(text: string): string {
  if (!text) return text;
  
  let cleaned = text.trim();
  
  // Check if truncated (ends with "..." or incomplete sentence indicators)
  const isTruncated = 
    cleaned.endsWith('...') ||
    cleaned.endsWith('..') ||
    cleaned.endsWith('—') ||
    cleaned.endsWith('-') ||
    // Ends with a word but no punctuation
    (/[a-zA-Z0-9]$/.test(cleaned) && !/[.!?]$/.test(cleaned));
  
  if (!isTruncated) return cleaned;
  
  // Remove trailing ellipsis or dash
  cleaned = cleaned.replace(/\.{2,}$/, '').replace(/[—-]$/, '').trim();
  
  // Find the last complete sentence (ends with . ! or ?)
  const sentenceEndings = ['.', '!', '?'];
  let lastSentenceEnd = -1;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    if (sentenceEndings.includes(cleaned[i])) {
      // Make sure it's not a decimal point (e.g., "2.5")
      if (cleaned[i] === '.' && i > 0 && i < cleaned.length - 1) {
        const before = cleaned[i - 1];
        const after = cleaned[i + 1];
        if (/\d/.test(before) && /\d/.test(after)) {
          continue; // This is a decimal, keep looking
        }
      }
      lastSentenceEnd = i;
      break;
    }
  }
  
  // If we found a complete sentence, trim to that
  if (lastSentenceEnd > 0) {
    return cleaned.slice(0, lastSentenceEnd + 1).trim();
  }
  
  // Fallback: if no complete sentence found but text is substantial, add period
  if (cleaned.length > 20 && /[a-zA-Z]$/.test(cleaned)) {
    return cleaned + '.';
  }
  
  return cleaned;
}

export function sanitizeAgentPost(post: string): { safe: boolean; post: string; flaggedTerms: string[] } {
  // First ensure the post ends with a complete sentence
  const cleanedPost = ensureCompleteSentence(post);
  
  const lowerPost = cleanedPost.toLowerCase();
  const flaggedTerms: string[] = [];
  
  for (const term of PROHIBITED_TERMS) {
    if (lowerPost.includes(term)) {
      flaggedTerms.push(term);
    }
  }
  
  return {
    safe: flaggedTerms.length === 0,
    post: flaggedTerms.length === 0 ? cleanedPost : '',
    flaggedTerms,
  };
}

// ============================================
// COMPUTED ANALYSIS PROMPT BUILDER
// ============================================

export interface ComputedAnalysis {
  probabilities: {
    home: number;
    away: number;
    draw?: number;
  };
  favored: 'home' | 'away' | 'draw' | 'even';
  confidence: 'high' | 'medium' | 'low';
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  narrativeAngle: NarrativeAngle;
  catchphrase: string;
  motif: string;
}

/**
 * Build agent post prompt with computed analysis from accuracy-core
 * This ensures LLM gets READ-ONLY computed values and proper narrative angle
 */
export function buildAgentPostPromptWithAnalysis(
  category: PostCategory,
  matchContext: string,
  analysis: ComputedAnalysis,
  homeTeam: string,
  awayTeam: string,
  additionalContext?: string
): string {
  const config = POST_CATEGORIES[category];
  
  // Map confidence to conviction level
  const conviction: ConvictionLevel = 
    analysis.confidence === 'high' ? 4 :
    analysis.confidence === 'low' ? 2 : 3;
  
  const convictionInfo = CONVICTION_LEVELS[conviction];
  
  return `${POST_PERSONALITY}

MATCH: ${homeTeam} vs ${awayTeam}
CATEGORY: ${config.name}

=== THE DATA (use this) ===
${analysis.favored === 'home' ? `Favored: ${homeTeam}` :
  analysis.favored === 'away' ? `Favored: ${awayTeam}` :
  `Even matchup`}
${homeTeam}: ${(analysis.probabilities.home * 100).toFixed(0)}%
${awayTeam}: ${(analysis.probabilities.away * 100).toFixed(0)}%
${analysis.probabilities.draw !== undefined ? `Draw: ${(analysis.probabilities.draw * 100).toFixed(0)}%` : ''}
Volatility: ${analysis.volatility}
Conviction: ${convictionInfo.display}

=== NARRATIVE: ${analysis.narrativeAngle} ===
${analysis.narrativeAngle === 'CHAOS' ? 'High variance. Acknowledge the chaos.' :
  analysis.narrativeAngle === 'TRAP_SPOT' ? 'Popular pick might be wrong. Be contrarian.' :
  analysis.narrativeAngle === 'BLOWOUT_POTENTIAL' ? 'Big gap. Be confident.' :
  analysis.narrativeAngle === 'CONTROL' ? 'Clean read. Be direct.' :
  'Close matchup. Acknowledge it.'}

${additionalContext ? `CONTEXT: ${additionalContext}` : ''}

EXAMPLES FOR ${config.name.toUpperCase()}:
${config.examplePosts.map(p => `"${p}"`).join('\n')}

REMEMBER:
- 1-3 sentences MAX
- Sound human, not robotic
- Lead with the spicy part
- Use the data above but make it interesting
- NO betting advice, just observations
- Occasional emoji OK (👀 📊 🔥) but don't overdo it

Write ONE punchy post. No quotes around it. If nothing interesting, return: NO_POST`;
}

/**
 * Get angle-specific guidance for posts
 */
function getAngleGuidanceForPost(angle: NarrativeAngle): string {
  switch (angle) {
    case 'CHAOS':
      return `HIGH CHAOS - Acknowledge uncertainty naturally.
This match is genuinely unpredictable. Don't force a clear narrative.
Express the volatility in your own words - be creative about how you convey uncertainty.`;
    case 'TRAP_SPOT':
      return `TRAP SPOT - The popular narrative may be wrong here.
Challenge the market with evidence. Something doesn't add up.
Find your own way to express the disconnect between perception and reality.`;
    case 'BLOWOUT_POTENTIAL':
      return `BLOWOUT POTENTIAL - Large gap between these teams.
Be confident - the data supports conviction here.
Express strength naturally without using cliché phrases.`;
    case 'CONTROL':
      return `CONTROL - Clear favorite, stable setup.
Be direct. The read is clean.
Vary how you express confidence - don't start with the same phrase every time.`;
    case 'MIRROR_MATCH':
    default:
      return `MIRROR MATCH - Evenly balanced contest.
Acknowledge the balance honestly. This is genuinely close.
Find interesting ways to describe a tight matchup.`;
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  SPORTBOT_AGENT,
  AGENT_PERSONALITY,
  POST_CATEGORIES,
  TRIGGER_CONDITIONS,
  buildAgentPostPrompt,
  buildAgentPostPromptWithAnalysis,
  buildThreadPrompt,
  sanitizeAgentPost,
  ensureCompleteSentence,
  PROHIBITED_TERMS,
};
