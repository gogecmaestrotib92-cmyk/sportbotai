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
    promptTemplate: `Generate a short market movement observation. Focus on:
- What moved and by how much (conceptually)
- Possible reasons (lineup, news, sharp action)
- What it means for match uncertainty
Never recommend action. Just observe.`,
    examplePosts: [
      'Unusual odds movement detected in today\'s Serie A fixture. Market uncertainty increased after lineup confirmation.',
      'Sharp movement across multiple books. Someone knows something, or thinks they do.',
      'Market settling into a clear favorite narrative. The question is whether reality agrees.',
    ],
  },

  LINEUP_INTEL: {
    id: 'LINEUP_INTEL',
    name: 'Lineup Intelligence',
    icon: '📋',
    description: 'Lineup changes, injuries, tactical shifts',
    promptTemplate: `Generate a lineup intelligence post. Focus on:
- Key player availability/absence
- Impact on team dynamics
- Model volatility adjustment
Pure analytics, not advice.`,
    examplePosts: [
      'Late lineup change removed a key defensive anchor. Model volatility increased accordingly.',
      'Starting XI confirms the aggressive approach. High-risk, high-reward territory.',
      'Rotation heavy. Manager clearly prioritizing the midweek fixture.',
    ],
  },

  MOMENTUM_SHIFT: {
    id: 'MOMENTUM_SHIFT',
    name: 'Momentum & Form',
    icon: '📈',
    description: 'Form changes, momentum swings, trend breaks',
    promptTemplate: `Generate a momentum/form observation. Focus on:
- Recent results pattern
- Trend direction (rising/falling/volatile)
- Historical context for this team
Sports analysis only.`,
    examplePosts: [
      'Team momentum flipped sharply after three consecutive away wins. Long-term form remains unstable.',
      'Five-match unbeaten run masks underlying xG concerns. Sustainability questionable.',
      'Form says yes. History says proceed with caution.',
    ],
  },

  MATCH_COMPLEXITY: {
    id: 'MATCH_COMPLEXITY',
    name: 'Match Complexity',
    icon: '🎯',
    description: 'High-complexity or unpredictable match alerts',
    promptTemplate: `Generate a match complexity alert. Focus on:
- Why this match is hard to predict
- Conflicting signals or balanced metrics
- Elevated uncertainty factors
Great for analysts seeking interesting fixtures.`,
    examplePosts: [
      'High-complexity match detected: similar power ratings, inconsistent form, elevated volatility.',
      'Model confidence unusually low. Too many variables in flux.',
      'On paper, straightforward. In reality, chaos waiting to happen.',
    ],
  },

  AI_INSIGHT: {
    id: 'AI_INSIGHT',
    name: 'AI Insight',
    icon: '🧠',
    description: 'Interesting patterns, anomalies, curiosities',
    promptTemplate: `Generate an AI insight/curiosity post. Focus on:
- Interesting statistical pattern
- Historical anomaly or trend
- Something worth noting for analysts
Educational and engaging.`,
    examplePosts: [
      'Interesting note: teams with similar profiles have produced lower-than-expected scoring recently.',
      'Pattern recognition: home underdogs in this league outperforming models this season.',
      'The data suggests one thing. The narrative suggests another. Classic.',
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
Part 4: 💡 Insight - Connect the dots, what does it mean?
Part 5: ${convictionInfo.emoji} Conclusion - Bold takeaway

RULES:
- Each part should be 1-2 sentences MAX
- Make it feel like a real analyst breaking down a story
- No betting advice
- End with a memorable line

Return as JSON array: ["Part 1 text", "Part 2 text", ...]`;
}

// ============================================
// SAFETY FILTERS
// ============================================

export const PROHIBITED_TERMS = [
  'bet on', 'bet the', 'take the', 'take this',
  'best value', 'good value', 'value bet', 'value play',
  'lock', 'lock of', 'strong pick', 'pick of',
  'recommended', 'recommend', 'should bet', 'should take',
  'stake', 'wager', 'parlay', 'accumulator',
  'high roi', 'roi', 'profit', 'bankroll',
  'units', 'unit play', 'max bet',
  'guaranteed', 'sure thing', 'can\'t lose',
  'free money', 'easy money', 'printing money',
];

export function sanitizeAgentPost(post: string): { safe: boolean; post: string; flaggedTerms: string[] } {
  const lowerPost = post.toLowerCase();
  const flaggedTerms: string[] = [];
  
  for (const term of PROHIBITED_TERMS) {
    if (lowerPost.includes(term)) {
      flaggedTerms.push(term);
    }
  }
  
  return {
    safe: flaggedTerms.length === 0,
    post: flaggedTerms.length === 0 ? post : '',
    flaggedTerms,
  };
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
  buildThreadPrompt,
  sanitizeAgentPost,
  PROHIBITED_TERMS,
};
