/**
 * AI Chat API - Combines Perplexity (real-time search) + GPT (reasoning)
 * 
 * Flow:
 * 1. User asks a sports question
 * 2. Detect mode: AGENT (opinionated) vs DATA (strict accuracy)
 * 3. Check knowledge base for similar past answers
 * 4. Perplexity searches for real-time sports data
 * 5. GPT responds with appropriate personality
 * 6. Save successful Q&A to knowledge base for learning
 * 7. Track query in memory system for analytics
 * 
 * Uses SportBot Master Brain for consistent personality across app.
 * Uses SportBot Knowledge for self-learning capabilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getPerplexityClient } from '@/lib/perplexity';
import { detectChatMode, buildSystemPrompt, type BrainMode } from '@/lib/sportbot-brain';
import { trackQuery } from '@/lib/sportbot-memory';
import { saveKnowledge, buildLearnedContext, getTerminologyForSport } from '@/lib/sportbot-knowledge';

// ============================================
// TYPES
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

// ============================================
// OPENAI CLIENT
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// QUERY CATEGORY DETECTION
// ============================================

type QueryCategory = 
  | 'PLAYER'      // Where does player X play? Who is player X?
  | 'ROSTER'      // Who plays for team X?
  | 'FIXTURE'     // When is the next game?
  | 'RESULT'      // What was the score?
  | 'STANDINGS'   // League table
  | 'STATS'       // Player/team statistics
  | 'INJURY'      // Injury updates
  | 'TRANSFER'    // Transfer news
  | 'MANAGER'     // Coach/manager info
  | 'ODDS'        // Betting odds (factual)
  | 'COMPARISON'  // Player/team comparisons
  | 'HISTORY'     // Historical records
  | 'BROADCAST'   // TV/streaming info
  | 'VENUE'       // Stadium info
  | 'PLAYER_PROP' // Player prop questions (over/under on stats)
  | 'BETTING_ADVICE' // Should I bet? (decline with analysis)
  | 'GENERAL';    // Generic sports question

// ============================================
// BETTING/PLAYER PROP DETECTION (multi-language)
// ============================================

/**
 * Detect if query is asking for betting advice or player props
 * Supports multiple languages: English, Serbian/Croatian, Spanish, German, etc.
 */
function detectBettingIntent(message: string): { 
  isBettingAdvice: boolean; 
  isPlayerProp: boolean;
  detectedType: 'over' | 'under' | 'points' | 'rebounds' | 'assists' | 'general' | null;
  playerMentioned: string | null;
  confidenceLevel: 'high' | 'medium' | 'low';
} {
  const msg = message.toLowerCase();
  
  // Multi-language betting keywords (EXPANDED)
  const bettingKeywords = {
    // English - comprehensive
    english: [
      // Direct betting questions
      'should i bet', 'should i play', 'should i take', 'is it worth betting',
      'bet on', 'place a bet', 'wager on', 'lock', 'slam', 'max bet',
      'good value', 'worth it', 'smart bet', 'safe bet', 'sure bet',
      'best bet', 'best pick', 'best play', 'top pick', 'top bet',
      'what should i bet', 'what to bet', 'who to bet', 'where to bet',
      'betting tip', 'betting advice', 'betting pick', 'betting recommendation',
      'parlay', 'accumulator', 'acca', 'multi bet', 'combo bet',
      'banker', 'banker bet', 'single bet', 'double bet', 'treble',
      'handicap', 'asian handicap', 'spread', 'point spread', 'line',
      'moneyline', 'money line', 'ml', '1x2', 'draw no bet', 'dnb',
      'both teams to score', 'btts', 'clean sheet', 'correct score',
      'first goalscorer', 'anytime scorer', 'last goalscorer',
      'half time', 'full time', 'ht/ft', 'first half', 'second half',
      'total goals', 'total points', 'total corners', 'total cards',
      'win or draw', 'double chance', 'to qualify', 'to win',
      'will they win', 'will he score', 'gonna win', 'going to win',
      'can they win', 'chance to win', 'likely to win',
      'good odds', 'value odds', 'boosted odds', 'enhanced odds',
      'freebet', 'free bet', 'bonus bet', 'risk free',
      'sure thing', 'guaranteed', 'certain', 'definitely',
      'lock of the day', 'potd', 'pick of the day',
      'units', 'bankroll', 'stake', 'wager', 'risk',
    ],
    // Serbian/Croatian/Bosnian - comprehensive
    serbian: [
      'da igram', 'da li da igram', 'treba li', 'da uplatim', 'da stavim',
      'isplati li se', 'vredi li', 'plus', 'minus', 'kladim se',
      'da li vredi', 'da li da stavim', 'uplatiti', 'kladionica',
      'tiket', 'kvota', 'kvote', 'koeficijent', 'sigurica', 'sigurna igra',
      'dupla šansa', 'kombinacija', 'singl', 'solo', 'sistem',
      'hendikep', 'gol razlika', 'oba tima daju gol', 'gg', 'ng',
      'poluvrije', 'prvo poluvrijeme', 'kraj', 'pobednik', 'pobeda',
      'neriješeno', 'remi', 'domaćin', 'gost', 'kec', 'dvojka', 'iks',
      'više od', 'manje od', 'ukupno golova', 'broj golova',
      'tačan rezultat', 'strijelac', 'daje gol', 'prvi gol',
      'sta da igram', 'šta da igram', 'koji tiket', 'kakav tiket',
      'sigurna opklada', 'dobra opklada', 'isplativa opklada',
    ],
    // Spanish - comprehensive
    spanish: [
      'debo apostar', 'apostar por', 'vale la pena', 'apuesta segura',
      'más de', 'menos de', 'apuesto', 'cuota', 'cuotas', 'momio',
      'handicap', 'hándicap', 'spread', 'línea', 'total',
      'empate', 'victoria', 'ganador', 'perdedor', 'combinada',
      'parlay', 'apuesta simple', 'apuesta múltiple', 'sistema',
      'goles', 'córners', 'tarjetas', 'primer goleador',
      'ambos marcan', 'resultado exacto', 'doble oportunidad',
      'que apostar', 'donde apostar', 'mejor apuesta', 'tip',
    ],
    // German - comprehensive
    german: [
      'soll ich wetten', 'lohnt sich', 'wette auf', 'über', 'unter',
      'quote', 'quoten', 'handicap', 'spread', 'linie',
      'gewinner', 'verlierer', 'unentschieden', 'sieg', 'niederlage',
      'kombiwette', 'einzelwette', 'systemwette', 'tore', 'ecken',
      'beide teams treffen', 'genaues ergebnis', 'torschütze',
      'was wetten', 'worauf wetten', 'beste wette', 'sichere wette',
    ],
    // Italian
    italian: [
      'devo scommettere', 'scommessa', 'quota', 'quote', 'handicap',
      'vincitore', 'pareggio', 'over', 'under', 'goal', 'combo',
      'multipla', 'singola', 'sistema', 'marcatore', 'risultato esatto',
    ],
    // French
    french: [
      'dois-je parier', 'pari', 'cote', 'cotes', 'handicap',
      'vainqueur', 'match nul', 'plus de', 'moins de', 'combiné',
      'simple', 'multiple', 'buteur', 'score exact', 'les deux marquent',
    ],
    // Portuguese
    portuguese: [
      'devo apostar', 'aposta', 'odds', 'cotação', 'handicap',
      'vencedor', 'empate', 'mais de', 'menos de', 'combinada',
      'simples', 'múltipla', 'goleador', 'resultado exato',
    ],
    // Russian
    russian: [
      'ставить', 'ставка', 'коэффициент', 'кэф', 'тотал', 'фора',
      'победа', 'ничья', 'больше', 'меньше', 'экспресс', 'ординар',
    ],
    // Common betting terms (language-agnostic)
    universal: [
      'o/u', 'over under', 'over/under', 'pts o', 'reb o', 'ast o',
      'points over', 'points under', 'rebounds over', 'assists over',
      'player prop', 'prop bet', 'pts+reb', 'pra', 'p+r+a',
      'o2.5', 'u2.5', 'o3.5', 'u3.5', 'o1.5', 'u1.5', // goal lines
      '+1.5', '-1.5', '+2.5', '-2.5', // handicaps
      '1x', 'x2', '12', // double chance notation
      'w1', 'w2', 'x', // win notation
      'ev', '+ev', '-ev', // expected value
      'roi', 'yield', 'clf', 'closing line',
      'sharp', 'square', 'public', 'steam', 'reverse line movement',
    ],
  };
  
  // Player prop stat keywords (expanded)
  const propStats = {
    points: ['points', 'pts', 'poena', 'puntos', 'punkte', 'koseva', 'bodova', 'punti', 'pontos'],
    rebounds: ['rebounds', 'reb', 'rebs', 'skokovi', 'rebotes', 'rebounds', 'rimbalzi', 'rebonds'],
    assists: ['assists', 'ast', 'asistencije', 'asistencias', 'assist', 'passaggi decisivi'],
    threes: ['threes', '3pt', '3s', 'trojke', 'triples', 'dreier', 'triple', 'três pontos'],
    blocks: ['blocks', 'blk', 'blokade', 'tapones', 'blocks', 'stoppate', 'contres'],
    steals: ['steals', 'stl', 'ukradene', 'robos', 'steals', 'palle rubate', 'interceptions'],
    goals: ['goals', 'golova', 'goles', 'tore', 'buts', 'gol', 'goli'],
    shots: ['shots', 'shots on target', 'sot', 'udarci', 'tiros', 'schüsse', 'tirs'],
    corners: ['corners', 'korneri', 'córners', 'ecken', 'coins'],
    cards: ['cards', 'kartoni', 'tarjetas', 'karten', 'cartons', 'yellow', 'red'],
    fantasy: ['fantasy', 'fpts', 'fantasy points', 'dfs', 'draftkings', 'fanduel', 'prizepicks'],
  };
  
  // Check for betting advice intent
  let isBettingAdvice = false;
  let matchedKeywords: string[] = [];
  
  for (const [lang, keywords] of Object.entries(bettingKeywords)) {
    for (const kw of keywords) {
      if (msg.includes(kw)) {
        isBettingAdvice = true;
        matchedKeywords.push(kw);
      }
    }
  }
  
  // Check for player prop patterns
  let isPlayerProp = false;
  let detectedType: 'over' | 'under' | 'points' | 'rebounds' | 'assists' | 'general' | null = null;
  
  // Over/under pattern (expanded)
  if (/plus|over|\+|više|más|über|maggiore|plus de|mais de|больше|o\d|over \d|više od/i.test(msg)) {
    detectedType = 'over';
    isPlayerProp = true;
  } else if (/minus|under|-|manje|menos|unter|meno|moins de|menos de|меньше|u\d|under \d|manje od/i.test(msg)) {
    detectedType = 'under';
    isPlayerProp = true;
  }
  
  // Stat type detection
  for (const [statType, keywords] of Object.entries(propStats)) {
    if (keywords.some(kw => msg.includes(kw))) {
      detectedType = statType as typeof detectedType;
      isPlayerProp = true;
      break;
    }
  }
  
  // Determine confidence level
  let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
  if (matchedKeywords.length >= 3 || (isBettingAdvice && isPlayerProp)) {
    confidenceLevel = 'high';
  } else if (matchedKeywords.length >= 1 || isBettingAdvice || isPlayerProp) {
    confidenceLevel = 'medium';
  }
  
  // Extract player name (look for capitalized words or known player patterns)
  let playerMentioned: string | null = null;
  const playerPatterns = [
    // Common NBA player name patterns
    /jokic|jokić|nikola/i,
    /lebron|james/i,
    /curry|steph/i,
    /doncic|dončić|luka/i,
    /giannis|antetokounmpo/i,
    /embiid|joel/i,
    /durant|kd/i,
    /tatum|jayson/i,
    /harden|james harden/i,
    /morant|ja morant/i,
    /booker|devin/i,
    /lillard|dame/i,
    /edwards|ant|anthony edwards/i,
    /brunson|jalen/i,
    /shai|sga|gilgeous/i,
    /wemby|wembanyama|victor/i,
    // Soccer stars
    /messi|lionel/i,
    /ronaldo|cristiano|cr7/i,
    /mbappe|mbappé|kylian/i,
    /haaland|erling/i,
    /salah|mohamed/i,
    /vinicius|vini jr/i,
    /bellingham|jude/i,
    // Generic pattern: Capitalized FirstName LastName
    /([A-Z][a-z]+\s+[A-Z][a-z]+)/,
  ];
  
  for (const pattern of playerPatterns) {
    const match = message.match(pattern);
    if (match) {
      playerMentioned = match[0];
      break;
    }
  }
  
  return { isBettingAdvice, isPlayerProp, detectedType, playerMentioned, confidenceLevel };
}

/**
 * Detect the category of sports question
 */
function detectQueryCategory(message: string): QueryCategory {
  // FIRST: Check for betting advice / player props (highest priority)
  const bettingIntent = detectBettingIntent(message);
  if (bettingIntent.isBettingAdvice) {
    return 'BETTING_ADVICE';
  }
  if (bettingIntent.isPlayerProp) {
    return 'PLAYER_PROP';
  }
  // Roster/Squad
  if (/who (plays|is|are)|roster|squad|lineup|starting|player|team sheet|formation/i.test(message)) {
    return 'ROSTER';
  }
  
  // Fixture/Schedule
  if (/when (is|does|do|are)|next (game|match|fixture)|schedule|kickoff|what time|upcoming/i.test(message)) {
    return 'FIXTURE';
  }
  
  // Results/Scores
  if (/score|result|won|lost|beat|draw|final score|how did|did .* win/i.test(message)) {
    return 'RESULT';
  }
  
  // Standings/Table
  if (/standings|table|position|rank|points|top of|bottom of|league table/i.test(message)) {
    return 'STANDINGS';
  }
  
  // Statistics
  if (/stats|statistics|goals|assists|top scorer|most|average|record|career/i.test(message)) {
    return 'STATS';
  }
  
  // Injuries
  if (/injur|fit|available|out|miss|suspend|ban|ruled out|doubtful/i.test(message)) {
    return 'INJURY';
  }
  
  // Transfers
  if (/transfer|sign|signing|rumor|buy|sell|loan|contract|free agent|deal/i.test(message)) {
    return 'TRANSFER';
  }
  
  // Manager/Coach
  if (/manager|coach|boss|head coach|said|press conference|tactic|formation/i.test(message)) {
    return 'MANAGER';
  }
  
  // Odds/Markets
  if (/odds|favorite|underdog|market|price|over under|spread|moneyline/i.test(message)) {
    return 'ODDS';
  }
  
  // Comparisons
  if (/vs|versus|compare|better|who is better|difference between/i.test(message)) {
    return 'COMPARISON';
  }
  
  // History/Records
  if (/history|all.time|record|ever|most .* in history|champion|trophy|won the/i.test(message)) {
    return 'HISTORY';
  }
  
  // Broadcast/TV
  if (/watch|channel|tv|stream|broadcast|where .* watch|how .* watch/i.test(message)) {
    return 'BROADCAST';
  }
  
  // Player/Athlete lookup patterns:
  // - "where does X play", "who is X", "tell me about X"
  // - "X player", "X career", "X biography"
  // - Questions with proper nouns (capitalized names)
  if (
    /where (does|do|did|is) \w+ \w* ?play|which team (does|is)|what team (does|is)/i.test(message) ||
    /who is [A-Z][a-z]+/i.test(message) ||
    /tell me about [A-Z][a-z]+/i.test(message) ||
    /(biography|career|born|nationality|height|age) of/i.test(message) ||
    /[A-Z][a-z]+ [A-Z][a-z]+ (player|athlete|footballer|basketball|tennis)/i.test(message)
  ) {
    // Make sure it's not asking about a team's home ground
    if (!/stadium|arena|venue|home ground|capacity/i.test(message)) {
      return 'PLAYER';
    }
  }
  
  // Venue/Stadium - only if explicitly asking about stadium
  if (/stadium|venue|arena|capacity|home ground|where .* (team|club) play/i.test(message)) {
    return 'VENUE';
  }
  
  return 'GENERAL';
}

/**
 * SMART ROUTING: Decide if query needs Perplexity (real-time) or GPT-only
 * 
 * DEFAULT: SEARCH EVERYTHING (safer - ensures fresh data)
 * 
 * Only skip search for:
 *   - Rules/definitions ("what is offside")
 *   - Simple greetings ("hello", "thanks")
 *   - Pure opinions with no factual component
 */

// Keywords that indicate GPT can answer alone (static knowledge ONLY)
const GPT_ONLY_PATTERNS = [
  // Rules & definitions (never change)
  /what (is|are) (offside|a foul|the rules|handball)/i,
  /rules of (football|soccer|basketball|tennis)/i,
  /how many players/i,
  /explain .*(rule|offside|foul)/i,
  
  // Simple greetings (no search needed)
  /^(hello|hi|hey|thanks|thank you|bye|ok|okay)[\s!?.]*$/i,
  /^(who are you|what can you do|help me?)[\s!?.]*$/i,
  
  // Pure hypotheticals with no real lookup
  /^what if .* (never|didn't|hadn't)/i,
  /^imagine if/i,
];

/**
 * Smart detection: Does this query need real-time data?
 * DEFAULT: YES - search unless clearly static
 */
function needsRealTimeSearch(message: string): boolean {
  const lower = message.toLowerCase().trim();
  
  // Check if it's a static/greeting question that doesn't need search
  for (const pattern of GPT_ONLY_PATTERNS) {
    if (pattern.test(message)) {
      console.log(`[Router] GPT-only pattern match - skipping search`);
      return false;
    }
  }
  
  // Check for explicit search requests
  if (/check|look up|search|find|wikipedia|google|tell me about/i.test(lower)) {
    console.log('[Router] Explicit search request detected');
    return true;
  }
  
  // Check for proper nouns (capitalized words that aren't sentence starters)
  // This catches player names like "Goran Huskic"
  const hasProperNoun = /\s[A-Z][a-z]{2,}/.test(message) || /^[A-Z][a-z]+\s+[A-Z]/.test(message);
  if (hasProperNoun) {
    console.log('[Router] Proper noun detected (likely player/team name) - searching');
    return true;
  }
  
  // Check for non-English sports queries (common patterns)
  // Serbian/Croatian: gde, ko, koji, kada
  // Spanish: donde, quien, cual, cuando
  // German: wo, wer, welche, wann
  // French: où, qui, quel, quand
  if (/\b(gde|ko je|koji|kada|donde|quien|cual|cuando|wo spielt|wer ist|où|qui est|quel)\b/i.test(lower)) {
    console.log('[Router] Non-English query detected - searching');
    return true;
  }
  
  // If message contains any word that looks like a name (2+ capitalized words)
  const capitalizedWords = message.match(/\b[A-Z][a-z]+\b/g) || [];
  if (capitalizedWords.length >= 2) {
    console.log('[Router] Multiple capitalized words (likely names) - searching');
    return true;
  }
  
  // If it's a question (any language), default to searching
  if (/\?$/.test(message.trim()) || lower.length > 15) {
    console.log('[Router] Question detected - defaulting to search');
    return true;
  }
  
  // Very short messages without question marks - probably greetings
  if (lower.length < 15 && !/\?/.test(message)) {
    console.log('[Router] Short non-question - skipping search');
    return false;
  }
  
  // DEFAULT: Search to be safe
  console.log('[Router] Defaulting to real-time search');
  return true;
}

/**
 * Detect sport from message
 */
function detectSport(message: string): string | undefined {
  const lower = message.toLowerCase();
  
  // Football/Soccer
  if (/football|soccer|premier league|la liga|serie a|bundesliga|ligue 1|champions league|europa|fc |united|city|real madrid|barcelona|bayern|goal|striker|midfielder/i.test(lower)) {
    return 'football';
  }
  
  // Basketball
  if (/basketball|nba|euroleague|lakers|celtics|warriors|nets|point guard|center|forward|dunk|three.?pointer/i.test(lower)) {
    return 'basketball';
  }
  
  // Tennis
  if (/tennis|atp|wta|grand slam|wimbledon|us open|french open|australian open|nadal|djokovic|federer|serve|backhand/i.test(lower)) {
    return 'tennis';
  }
  
  // MMA/UFC
  if (/mma|ufc|bellator|knockout|submission|fighter|octagon|weight class|pound.for.pound/i.test(lower)) {
    return 'mma';
  }
  
  // American Football
  if (/nfl|american football|quarterback|touchdown|super bowl|chiefs|eagles|cowboys|patriots/i.test(lower)) {
    return 'american_football';
  }
  
  // Baseball
  if (/baseball|mlb|yankees|dodgers|red sox|home run|pitcher|batting/i.test(lower)) {
    return 'baseball';
  }
  
  // Hockey
  if (/hockey|nhl|ice hockey|puck|goalie|rangers|bruins|maple leafs/i.test(lower)) {
    return 'hockey';
  }
  
  return undefined;
}

/**
 * Build optimized search query based on question category
 */
function extractSearchQuery(message: string): { query: string; category: QueryCategory; recency: 'hour' | 'day' | 'week' | 'month' } {
  const category = detectQueryCategory(message);
  
  // Clean up the message for search
  let query = message
    .replace(/\?/g, '')
    .replace(/please|can you|could you|tell me|what do you think|i want to know/gi, '')
    .trim();
  
  // Category-specific query optimization
  let recency: 'hour' | 'day' | 'week' | 'month' = 'day';
  
  switch (category) {
    case 'PLAYER':
      // For player lookups - be very specific to avoid confusion
      // Extract the player name and search for their Wikipedia page directly
      const playerNameMatch = query.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)|(\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b)/i);
      if (playerNameMatch) {
        const playerName = playerNameMatch[0];
        // Search Wikipedia specifically for this player
        query = `"${playerName}" site:wikipedia.org footballer OR basketball player OR athlete career club team nationality born`;
      } else {
        query += ' site:wikipedia.org player profile career team nationality born';
      }
      recency = 'month'; // Wikipedia pages don't change hourly
      break;
      
    case 'ROSTER':
      query += ' 2024-2025 season current roster squad players';
      recency = 'week';
      break;
      
    case 'FIXTURE':
      query += ' upcoming fixture schedule next match kickoff time December 2024';
      recency = 'day';
      break;
      
    case 'RESULT':
      query += ' final score result match report';
      recency = 'day';
      break;
      
    case 'STANDINGS':
      query += ' 2024-2025 league table standings points';
      recency = 'day';
      break;
      
    case 'STATS':
      query += ' 2024-2025 season statistics stats goals assists';
      recency = 'week';
      break;
      
    case 'INJURY':
      query += ' injury update news team news fitness December 2024';
      recency = 'day';
      break;
      
    case 'TRANSFER':
      query += ' transfer news rumors latest December 2024';
      recency = 'day';
      break;
      
    case 'MANAGER':
      query += ' manager coach press conference tactics news';
      recency = 'day';
      break;
      
    case 'ODDS':
      query += ' betting odds market prices bookmakers';
      recency = 'day';
      break;
      
    case 'COMPARISON':
      query += ' comparison stats 2024-2025 head to head';
      recency = 'week';
      break;
      
    case 'HISTORY':
      query += ' history record all time statistics';
      recency = 'month';
      break;
      
    case 'BROADCAST':
      query += ' TV channel stream where to watch broadcast';
      recency = 'day';
      break;
      
    case 'VENUE':
      query += ' stadium venue arena ground';
      recency = 'month';
      break;
      
    case 'PLAYER_PROP':
      // For player prop questions - get current stats and recent performance
      const propIntent = detectBettingIntent(message);
      if (propIntent.playerMentioned) {
        query = `${propIntent.playerMentioned} 2024-2025 season stats averages points rebounds assists per game recent form last 5 games`;
      } else {
        query += ' 2024-2025 season player stats averages performance';
      }
      recency = 'day';
      break;
      
    case 'BETTING_ADVICE':
      // For betting questions - still get stats but we'll reframe the response
      const bettingIntent = detectBettingIntent(message);
      if (bettingIntent.playerMentioned) {
        query = `${bettingIntent.playerMentioned} 2024-2025 season stats averages points rebounds assists performance recent form injury status`;
      } else {
        query += ' 2024-2025 recent performance stats form';
      }
      recency = 'day';
      break;
      
    case 'GENERAL':
    default:
      query += ' latest news December 2024';
      recency = 'day';
      break;
  }
  
  return { query, category, recency };
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI chat is not configured' },
        { status: 503 }
      );
    }

    let perplexityContext = '';
    let citations: string[] = [];
    const shouldSearch = needsRealTimeSearch(message);
    
    // Detect category for all queries (for tracking)
    const queryCategory = detectQueryCategory(message);

    // Step 1: Use Perplexity for real-time search if needed
    if (shouldSearch) {
      const perplexity = getPerplexityClient();
      
      if (perplexity.isConfigured()) {
        console.log('[AI-Chat] Fetching real-time context from Perplexity...');
        
        // Extract optimized search query with category detection
        const { query: searchQuery, category, recency } = extractSearchQuery(message);
        
        console.log(`[AI-Chat] Category: ${category} | Recency: ${recency}`);
        console.log(`[AI-Chat] Search query: "${searchQuery}"`);
        
        // Use higher token limit for detailed queries like rosters or comparisons
        const needsMoreTokens = ['PLAYER', 'ROSTER', 'COMPARISON', 'STANDINGS', 'STATS'].includes(category);
        
        const searchResult = await perplexity.search(searchQuery, {
          recency,
          model: 'sonar-pro',
          maxTokens: needsMoreTokens ? 1500 : 1000,
        });

        if (searchResult.success && searchResult.content) {
          perplexityContext = searchResult.content;
          citations = searchResult.citations || [];
          console.log('[AI-Chat] Perplexity context retrieved:', perplexityContext.slice(0, 200) + '...');
          console.log('[AI-Chat] Citations received:', JSON.stringify(citations));
        } else {
          console.log('[AI-Chat] No Perplexity results:', searchResult.error);
        }
      }
    }

    // Step 2: Detect brain mode and build system prompt
    const brainMode: BrainMode = detectChatMode(message);
    
    // Step 2.5: Get learned context from knowledge base
    let learnedContext = '';
    let sportTerminology: string[] = [];
    try {
      const { query: searchQuery, category } = extractSearchQuery(message);
      const detectedSport = detectSport(message);
      
      // Get past similar answers for context
      learnedContext = await buildLearnedContext(message, detectedSport);
      
      // Get sport terminology
      if (detectedSport) {
        sportTerminology = getTerminologyForSport(detectedSport);
      }
      
      console.log('[AI-Chat] Learned context:', learnedContext ? 'Found' : 'None');
      console.log('[AI-Chat] Sport detected:', detectedSport || 'Unknown');
    } catch (err) {
      console.error('[AI-Chat] Knowledge lookup failed:', err);
    }
    
    const systemPrompt = buildSystemPrompt(brainMode, {
      hasRealTimeData: !!perplexityContext,
    });
    
    // Enhance system prompt with learned knowledge
    let enhancedSystemPrompt = systemPrompt;
    if (learnedContext) {
      enhancedSystemPrompt += `\n\n${learnedContext}`;
    }
    if (sportTerminology.length > 0) {
      enhancedSystemPrompt += `\n\nSPORT TERMINOLOGY TO USE: ${sportTerminology.slice(0, 10).join(', ')}`;
    }
    
    console.log('[AI-Chat] Brain mode:', brainMode);
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: enhancedSystemPrompt },
    ];

    // Add conversation history (last 10 messages to stay within context)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message with Perplexity context
    let userContent = message;
    
    // Special handling for betting/player prop questions
    if (queryCategory === 'BETTING_ADVICE' || queryCategory === 'PLAYER_PROP') {
      const bettingIntent = detectBettingIntent(message);
      const propType = bettingIntent.detectedType;
      const player = bettingIntent.playerMentioned;
      
      // Build context-aware prompt
      let propContext = '';
      if (bettingIntent.isPlayerProp && player) {
        propContext = `\n\nUSER IS ASKING ABOUT: ${player}'s ${propType || 'stats'} (over/under prop)`;
        if (propType === 'over') {
          propContext += `\nThey want to know if ${player} will EXCEED their line.`;
        } else if (propType === 'under') {
          propContext += `\nThey want to know if ${player} will go UNDER their line.`;
        }
      } else if (bettingIntent.isBettingAdvice) {
        propContext = `\n\nUSER IS ASKING FOR BETTING ADVICE/TIPS`;
        propContext += `\nDetected betting intent with ${bettingIntent.confidenceLevel} confidence.`;
      }
      
      userContent = `USER QUESTION: ${message}
${propContext}

⚠️ CRITICAL RESPONSE REQUIREMENTS:

1. START with acknowledging you understand this is a betting-related question

2. ALWAYS include this disclaimer early in your response (adapt to context):
   "⚠️ This is my analytical assessment only, NOT betting advice. I cannot tell you what to bet on. Always gamble responsibly and only with money you can afford to lose."

3. Provide STATISTICAL ANALYSIS:
   - Current averages and recent form
   - Matchup factors (opponent defense, pace, etc.)
   - Injury/availability status
   - Recent trends (last 5-10 games)
   - Any relevant context (home/away splits, rest days, etc.)

4. Be OBJECTIVE and DATA-DRIVEN:
   - Present the facts neutrally
   - Mention both favorable AND concerning factors
   - Don't be one-sided

5. END with a balanced conclusion like:
   "Based on the data, [the metrics support/raise concerns about/are mixed regarding] this scenario. This is purely analytical - the final decision is always yours."

6. NEVER say:
   - "Bet on this"
   - "This is a lock"
   - "You should definitely play this"
   - "I recommend betting"
   - "This is a sure thing"

${perplexityContext ? `REAL-TIME SPORTS DATA:\n${perplexityContext}` : ''}

Remember: You are an analyst providing data, NOT a tipster giving betting advice.`;
    } else if (perplexityContext) {
      userContent = `USER QUESTION: ${message}

REAL-TIME SPORTS DATA (from web search, use this for your answer):
${perplexityContext}

Please answer the user's question using the real-time data above. Cite sources if relevant.`;
    }

    messages.push({ role: 'user', content: userContent });

    // Step 3: Get GPT response
    console.log('[AI-Chat] Sending to GPT...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log('[AI-Chat] Response generated successfully');

    // Track query in memory system (async, don't block response)
    trackQuery({
      query: message,
      category: queryCategory,
      brainMode,
      sport: detectSport(message),
      usedRealTimeSearch: !!perplexityContext,
      responseLength: response.length,
      hadCitations: citations.length > 0,
    }).catch(err => console.error('[AI-Chat] Memory tracking failed:', err));

    // Save to knowledge base for learning (async, don't block response)
    // Only save substantial answers with real-time data
    saveKnowledge({
      question: message,
      answer: response,
      sport: detectSport(message),
      category: queryCategory,
      hadRealTimeData: !!perplexityContext,
      citations,
    }).catch(err => console.error('[AI-Chat] Knowledge save failed:', err));

    return NextResponse.json({
      success: true,
      response,
      citations,
      usedRealTimeSearch: !!perplexityContext,
      routingDecision: shouldSearch ? 'perplexity+gpt' : 'gpt-only',
      model: shouldSearch ? 'gpt-4o-mini + sonar-pro' : 'gpt-4o-mini',
    });

  } catch (error) {
    console.error('[AI-Chat] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Health check
// ============================================

export async function GET() {
  const perplexity = getPerplexityClient();
  
  return NextResponse.json({
    status: 'ok',
    capabilities: {
      gpt: !!process.env.OPENAI_API_KEY,
      perplexity: perplexity.isConfigured(),
      model: 'gpt-4o-mini + sonar-pro',
    },
    description: 'AI Chat API combining Perplexity (real-time search) + GPT (reasoning)',
  });
}
