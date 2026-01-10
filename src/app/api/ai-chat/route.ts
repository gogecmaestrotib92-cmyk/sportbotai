/**
 * AI Chat API - Combines Perplexity (real-time search) + GPT (reasoning)
 * 
 * Flow:
 * 1. User asks a sports question (any language)
 * 2. Detect language and translate to English for search (if needed)
 * 3. Detect mode: AGENT (opinionated) vs DATA (strict accuracy)
 * 4. Check knowledge base for similar past answers
 * 5. Perplexity searches for real-time sports data (in English)
 * 6. GPT responds with appropriate personality (in user's original language)
 * 7. Save successful Q&A to knowledge base for learning
 * 8. Track query in memory system for analytics
 * 
 * Uses SportBot Master Brain for consistent personality across app.
 * Uses SportBot Knowledge for self-learning capabilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { getPerplexityClient } from '@/lib/perplexity';
import { detectChatMode, buildSystemPrompt, type BrainMode, calculateDataConfidence, type DataConfidence } from '@/lib/sportbot-brain';
import { trackQuery } from '@/lib/sportbot-memory';
import { saveKnowledge, buildLearnedContext, getTerminologyForSport } from '@/lib/sportbot-knowledge';
import { routeQuery as routeToDataSource } from '@/lib/data-router';
import { 
  getVerifiedPlayerStats, 
  getVerifiedTeamStats, 
  isStatsQuery, 
  formatVerifiedPlayerStats,
  formatVerifiedTeamStats,
  SeasonNormalizer 
} from '@/lib/verified-nba-stats';
import { authOptions, canUserChat, incrementChatCount, CHAT_LIMITS } from '@/lib/auth';

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
// LANGUAGE DETECTION & TRANSLATION
// ============================================

/**
 * Detect if message is non-English and translate for better search results
 * Returns the original language code and English translation
 */
async function translateToEnglish(message: string): Promise<{
  originalLanguage: string;
  englishQuery: string;
  needsTranslation: boolean;
}> {
  // Quick check for non-ASCII characters or common non-English patterns
  const hasNonAscii = /[^\x00-\x7F]/.test(message);
  const hasCyrillic = /[\u0400-\u04FF]/.test(message);
  const hasChinese = /[\u4E00-\u9FFF]/.test(message);
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(message);
  const hasKorean = /[\uAC00-\uD7AF]/.test(message);
  const hasArabic = /[\u0600-\u06FF]/.test(message);
  // Note: removed 'was', 'wo', 'match' as they are also common English words
  const hasCommonNonEnglish = /\b(je|da|li|sta|šta|što|kako|koliko|gdje|gde|kada|zašto|porque|qué|cómo|cuándo|dónde|wie|wann|warum|où|quand|pourquoi|comment|combien)\b/i.test(message);
  
  // If message appears to be English, skip translation
  if (!hasNonAscii && !hasCyrillic && !hasChinese && !hasJapanese && !hasKorean && !hasArabic && !hasCommonNonEnglish) {
    return {
      originalLanguage: 'en',
      englishQuery: message,
      needsTranslation: false
    };
  }
  
  try {
    // Use GPT for quick translation
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a translator. Translate the following sports-related query to English. 
Keep player names, team names, and sports terms intact (don't translate proper nouns).
Return ONLY the English translation, nothing else.
If the message is already in English, return it unchanged.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 200,
      temperature: 0.1, // Low temperature for consistent translation
    });
    
    const englishQuery = response.choices[0]?.message?.content?.trim() || message;
    
    // Detect original language
    let originalLanguage = 'unknown';
    if (hasChinese) {
      originalLanguage = 'zh'; // Chinese
    } else if (hasJapanese) {
      originalLanguage = 'ja'; // Japanese
    } else if (hasKorean) {
      originalLanguage = 'ko'; // Korean
    } else if (hasArabic) {
      originalLanguage = 'ar'; // Arabic
    } else if (hasCyrillic || /\b(je|da|li|koliko|postigao|utakmic|košev|poena)\b/i.test(message)) {
      originalLanguage = 'sr'; // Serbian/Croatian
    } else if (/\b(porque|qué|cómo|cuándo|dónde|goles|partido)\b/i.test(message)) {
      originalLanguage = 'es'; // Spanish
    } else if (/\b(wie|wann|warum|spiel|spielen|mannschaft|gegen|tore)\b/i.test(message)) {
      originalLanguage = 'de'; // German
    } else if (/\b(où|quand|pourquoi|comment|combien|joueur|équipe|buts)\b/i.test(message)) {
      originalLanguage = 'fr'; // French
    } else if (/\b(partita|squadra|gol|giocatore|quando|come|perché)\b/i.test(message)) {
      originalLanguage = 'it'; // Italian
    } else if (/\b(jogo|gols|jogador|quando|como|porque|equipe)\b/i.test(message)) {
      originalLanguage = 'pt'; // Portuguese
    } else if (/\b(матч|игра|гол|команда|когда|как|почему)\b/i.test(message)) {
      originalLanguage = 'ru'; // Russian
    }
    
    console.log(`[AI-Chat] Translated from ${originalLanguage}: "${message}" -> "${englishQuery}"`);
    
    return {
      originalLanguage,
      englishQuery,
      needsTranslation: true
    };
  } catch (error) {
    console.error('[AI-Chat] Translation error:', error);
    return {
      originalLanguage: 'unknown',
      englishQuery: message,
      needsTranslation: false
    };
  }
}

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
  | 'MATCH_ANALYSIS' // Full match analysis request (triggers /api/analyze)
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
  const matchedKeywords: string[] = [];
  
  for (const keywords of Object.values(bettingKeywords)) {
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

// ============================================
// MATCH ANALYSIS DETECTION
// ============================================

/**
 * Detect if the user is requesting a full match analysis
 * Patterns: "analyze X vs Y", "breakdown of X vs Y", "what do you think about X vs Y"
 * Returns parsed match info if detected
 */
function detectMatchAnalysisRequest(message: string): {
  isMatchAnalysis: boolean;
  homeTeam: string | null;
  awayTeam: string | null;
  sport: string | null;
} {
  const msg = message.toLowerCase();
  
  // Analysis trigger phrases (multi-language)
  const analysisPatterns = [
    // English
    /(?:analyze|analyse|analysis|breakdown|preview|assess|evaluate)\s+(?:the\s+)?(?:match\s+)?(.+?)\s+(?:vs\.?|versus|v\.?)\s+(.+?)(?:\s+(?:match|game|tonight|today|tomorrow))?$/i,
    /(?:what do you think|thoughts on|your take on|give me a breakdown|break down)\s+(?:about\s+)?(?:the\s+)?(.+?)\s+(?:vs\.?|versus|v\.?)\s+(.+?)(?:\s+(?:match|game))?$/i,
    /(?:can you analyze|could you analyze|please analyze|i want analysis)\s+(.+?)\s+(?:vs\.?|versus|v\.?)\s+(.+)/i,
    /(.+?)\s+(?:vs\.?|versus|v\.?)\s+(.+?)\s+(?:analysis|breakdown|preview|prediction)/i,
    
    // Better generic "X vs Y" pattern - stops at common trailing words
    /(?:^|today|tonight|tomorrow|match|game|about)\s*([A-Za-z][A-Za-z\s]+?)\s+(?:vs\.?|versus|v\.?|VS)\s+([A-Za-z][A-Za-z\s]+?)(?:\s+(?:will|who|match|game|today|tonight|tomorrow|\?|$))/i,
    
    // Simple team1 VS team2 (all caps VS is common)
    /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+VS\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b/,
    
    // Serbian/Croatian
    /(?:analiziraj|analiza|analizu|pregledaj)\s+(?:utakmicu?\s+)?(.+?)\s+(?:vs\.?|protiv|v\.?|-)\s+(.+)/i,
    /(?:šta misliš|sta mislis|mišljenje|tvoje mišljenje)\s+(?:o\s+)?(.+?)\s+(?:vs\.?|protiv|v\.?|-)\s+(.+)/i,
    
    // Spanish
    /(?:analiza|analizar|dame análisis)\s+(?:del?\s+)?(?:partido\s+)?(.+?)\s+(?:vs\.?|contra|v\.?)\s+(.+)/i,
    
    // German
    /(?:analysiere|analyse)\s+(?:das\s+)?(?:spiel\s+)?(.+?)\s+(?:vs\.?|gegen|v\.?)\s+(.+)/i,
  ];
  
  // Check for analysis patterns
  for (const pattern of analysisPatterns) {
    const match = message.match(pattern);
    if (match && match[1] && match[2]) {
      // Clean up team names (remove extra words from start and end)
      let homeTeam = match[1].trim()
        .replace(/^(the|match|game|today|tonight|tomorrow|about)\s+/i, '')
        .replace(/\s+(match|game|tonight|today|tomorrow)?$/i, '')
        .trim();
      let awayTeam = match[2].trim()
        .replace(/^(the)\s+/i, '')
        .replace(/\s+(match|game|tonight|today|tomorrow|will|who|win|\?)+.*$/i, '')
        .trim();
      
      // Must have reasonable team names (2+ chars each)
      if (homeTeam.length >= 2 && awayTeam.length >= 2) {
        // Detect sport from team names or message
        const sport = detectSportFromTeams(homeTeam, awayTeam, message);
        
        return {
          isMatchAnalysis: true,
          homeTeam,
          awayTeam,
          sport,
        };
      }
    }
  }
  
  return { isMatchAnalysis: false, homeTeam: null, awayTeam: null, sport: null };
}

/**
 * Detect sport from team names or context
 */
function detectSportFromTeams(homeTeam: string, awayTeam: string, message: string): string {
  const combined = `${homeTeam} ${awayTeam} ${message}`.toLowerCase();
  
  // ==========================================
  // BASKETBALL
  // ==========================================
  
  // NBA teams
  const nbaTeams = /\b(lakers|celtics|warriors|bulls|heat|nets|knicks|76ers|sixers|bucks|nuggets|suns|mavs|mavericks|clippers|rockets|spurs|thunder|grizzlies|kings|pelicans|jazz|blazers|trail blazers|timberwolves|wolves|hornets|hawks|magic|pistons|pacers|wizards|cavaliers|cavs|raptors)\b/i;
  if (nbaTeams.test(combined) || /\bnba\b|basketball/i.test(message)) {
    return 'basketball_nba';
  }
  
  // EuroLeague basketball
  const euroLeagueTeams = /\b(real madrid basket|barcelona basket|olympiacos|panathinaikos|fenerbahce|anadolu efes|cska moscow|maccabi tel aviv|zalgiris|baskonia|virtus bologna|partizan|red star|monaco basket|olympia milano|bayern munich basket)\b/i;
  if (euroLeagueTeams.test(combined) || /euroleague|eurocup/i.test(message)) {
    return 'basketball_euroleague';
  }
  
  // NCAA Basketball
  if (/ncaa|college basketball|march madness|duke blue devils|tar heels|wildcats|jayhawks|spartans|wolverines|hoosiers/i.test(combined)) {
    return 'basketball_ncaab';
  }
  
  // ==========================================
  // AMERICAN FOOTBALL
  // ==========================================
  
  // NFL teams
  const nflTeams = /\b(chiefs|eagles|bills|49ers|niners|cowboys|ravens|lions|dolphins|bengals|chargers|broncos|jets|patriots|giants|raiders|saints|packers|steelers|seahawks|commanders|falcons|buccaneers|bucs|cardinals|rams|bears|vikings|browns|texans|colts|jaguars|jags|titans|panthers)\b/i;
  if (nflTeams.test(combined) || /\bnfl\b|super bowl|american football/i.test(message)) {
    return 'americanfootball_nfl';
  }
  
  // NCAA Football
  if (/ncaaf|college football|cfb|alabama crimson|ohio state buckeyes|georgia bulldogs|clemson tigers|michigan wolverines/i.test(combined)) {
    return 'americanfootball_ncaaf';
  }
  
  // ==========================================
  // ICE HOCKEY
  // ==========================================
  
  // NHL teams
  const nhlTeams = /\b(bruins|rangers|maple leafs|leafs|canadiens|habs|blackhawks|penguins|flyers|red wings|oilers|flames|canucks|avalanche|lightning|panthers|stars|blues|wild|kraken|golden knights|knights|ducks|sharks|kings|senators|sabres|devils|islanders|hurricanes|predators|jets|coyotes|blue jackets)\b/i;
  if (nhlTeams.test(combined) || /\bnhl\b|hockey/i.test(message)) {
    return 'icehockey_nhl';
  }
  
  // ==========================================
  // MMA / UFC
  // ==========================================
  if (/\bufc\b|\bmma\b|fight night|bellator|pfl|one championship/i.test(message)) {
    return 'mma_mixed_martial_arts';
  }
  
  // ==========================================
  // BASEBALL
  // ==========================================
  const mlbTeams = /\b(yankees|red sox|dodgers|giants|cubs|white sox|astros|braves|mets|phillies|cardinals|brewers|padres|mariners|guardians|twins|tigers|royals|orioles|blue jays|rays|athletics|a's|angels|rockies|diamondbacks|marlins|nationals|reds|pirates)\b/i;
  if (mlbTeams.test(combined) || /\bmlb\b|baseball|world series/i.test(message)) {
    return 'baseball_mlb';
  }
  
  // ==========================================
  // TENNIS
  // ==========================================
  if (/tennis|wimbledon|us open tennis|french open|australian open|atp|wta|grand slam/i.test(message)) {
    return 'tennis_atp_us_open'; // Default tennis
  }
  
  // ==========================================
  // SOCCER - SPECIFIC LEAGUES (check before generic)
  // ==========================================
  
  // Champions League / Europa League
  if (/champions league|ucl|europa league|uel|conference league/i.test(message)) {
    return 'soccer_uefa_champs_league';
  }
  
  // Serie A (Italian) teams
  const serieATeams = /\b(roma|lazio|napoli|juventus|juve|inter milan|inter|ac milan|milan|atalanta|fiorentina|bologna|torino|genoa|sassuolo|udinese|verona|hellas verona|lecce|empoli|cagliari|monza|parma|sampdoria|salernitana|spezia|cremonese|frosinone|como|venezia)\b/i;
  if (serieATeams.test(combined) || /serie a|calcio|italian league/i.test(message)) {
    return 'soccer_italy_serie_a';
  }
  
  // La Liga (Spanish) teams
  const laLigaTeams = /\b(real madrid|barcelona|barca|atletico madrid|atletico|sevilla|valencia|villarreal|betis|real betis|real sociedad|athletic bilbao|athletic club|getafe|osasuna|celta vigo|celta|mallorca|rayo vallecano|rayo|almeria|cadiz|las palmas|girona|alaves|leganes)\b/i;
  if (laLigaTeams.test(combined) || /la liga|spanish league|primera division/i.test(message)) {
    return 'soccer_spain_la_liga';
  }
  
  // Bundesliga (German) teams
  const bundesligaTeams = /\b(bayern munich|bayern|borussia dortmund|dortmund|bvb|bayer leverkusen|leverkusen|rb leipzig|leipzig|eintracht frankfurt|frankfurt|wolfsburg|borussia monchengladbach|gladbach|freiburg|hoffenheim|mainz|augsburg|koln|cologne|stuttgart|union berlin|hertha berlin|hertha|bochum|werder bremen|bremen|schalke|darmstadt|heidenheim|st pauli)\b/i;
  if (bundesligaTeams.test(combined) || /bundesliga|german league/i.test(message)) {
    return 'soccer_germany_bundesliga';
  }
  
  // Ligue 1 (French) teams
  const ligue1Teams = /\b(psg|paris saint-germain|paris|marseille|om|lyon|olympique lyon|monaco|lille|losc|nice|lens|rennes|strasbourg|nantes|montpellier|toulouse|reims|brest|lorient|clermont|metz|le havre|auxerre|angers)\b/i;
  if (ligue1Teams.test(combined) || /ligue 1|french league/i.test(message)) {
    return 'soccer_france_ligue_one';
  }
  
  // Premier League (English) teams
  const eplTeams = /\b(arsenal|chelsea|liverpool|manchester united|man utd|man united|manchester city|man city|tottenham|spurs|newcastle|newcastle united|west ham|aston villa|villa|brighton|crystal palace|palace|fulham|brentford|everton|nottingham forest|forest|bournemouth|wolves|wolverhampton|burnley|sheffield united|sheffield|luton|luton town|ipswich|leicester)\b/i;
  if (eplTeams.test(combined) || /premier league|epl|english premier/i.test(message)) {
    return 'soccer_epl';
  }
  
  // Primeira Liga (Portuguese) teams
  const primeiraTeams = /\b(benfica|porto|sporting cp|sporting lisbon|braga|vitoria guimaraes|boavista|famalicao|rio ave|gil vicente|santa clara|arouca|estoril|casa pia|vizela|portimonense|maritimo|chaves)\b/i;
  if (primeiraTeams.test(combined) || /primeira liga|portuguese league/i.test(message)) {
    return 'soccer_portugal_primeira_liga';
  }
  
  // Eredivisie (Dutch) teams
  const eredivisieTeams = /\b(ajax|psv|psv eindhoven|feyenoord|az alkmaar|az|twente|utrecht|vitesse|heerenveen|groningen|sparta rotterdam|nec|rkc waalwijk|go ahead eagles|fortuna sittard|volendam|excelsior|cambuur|emmen)\b/i;
  if (eredivisieTeams.test(combined) || /eredivisie|dutch league/i.test(message)) {
    return 'soccer_netherlands_eredivisie';
  }
  
  // Turkish Super Lig
  const turkishTeams = /\b(galatasaray|fenerbahce|besiktas|trabzonspor|basaksehir|konyaspor|antalyaspor|sivasspor|alanyaspor|kasimpasa|gaziantep|hatayspor|kayserispor|adana demirspor|giresunspor|rizespor|samsunspor|pendikspor)\b/i;
  if (turkishTeams.test(combined) || /super lig|turkish league/i.test(message)) {
    return 'soccer_turkey_super_league';
  }
  
  // Belgian First Division
  const belgianTeams = /\b(club brugge|anderlecht|genk|standard liege|gent|antwerp|union saint-gilloise|union sg|cercle brugge|mechelen|oostende|charleroi|westerlo|oud-heverlee leuven|kortrijk|sint-truiden|eupen)\b/i;
  if (belgianTeams.test(combined) || /belgian league|jupiler/i.test(message)) {
    return 'soccer_belgium_first_div';
  }
  
  // Scottish Premiership
  const scottishTeams = /\b(celtic|rangers|aberdeen|hearts|hibernian|hibs|dundee united|dundee|motherwell|st johnstone|kilmarnock|ross county|livingston|st mirren)\b/i;
  if (scottishTeams.test(combined) || /scottish premiership|scottish league|spfl/i.test(message)) {
    return 'soccer_spl';
  }
  
  // MLS (USA)
  const mlsTeams = /\b(la galaxy|lafc|inter miami|atlanta united|seattle sounders|portland timbers|new york red bulls|nycfc|new york city|orlando city|austin fc|nashville sc|fc cincinnati|columbus crew|toronto fc|cf montreal|dc united|chicago fire|colorado rapids|minnesota united|sporting kc|houston dynamo|real salt lake|san jose earthquakes|vancouver whitecaps|new england revolution|philadelphia union|charlotte fc|st louis city)\b/i;
  if (mlsTeams.test(combined) || /\bmls\b|major league soccer/i.test(message)) {
    return 'soccer_usa_mls';
  }
  
  // Liga MX (Mexico)
  const ligaMxTeams = /\b(club america|america|guadalajara|chivas|cruz azul|tigres|monterrey|pumas|toluca|santos laguna|leon|pachuca|necaxa|atlas|queretaro|puebla|mazatlan|tijuana|juarez)\b/i;
  if (ligaMxTeams.test(combined) || /liga mx|mexican league/i.test(message)) {
    return 'soccer_mexico_ligamx';
  }
  
  // Brazilian Serie A
  const brazilTeams = /\b(flamengo|palmeiras|corinthians|sao paulo|santos|fluminense|botafogo|atletico mineiro|gremio|internacional|cruzeiro|vasco|bahia|fortaleza|athletico paranaense|ceara|coritiba|goias|cuiaba|america mineiro)\b/i;
  if (brazilTeams.test(combined) || /brasileirao|brazilian league/i.test(message)) {
    return 'soccer_brazil_serie_a';
  }
  
  // Argentine Primera Division
  const argentinaTeams = /\b(boca juniors|boca|river plate|river|racing club|racing|independiente|san lorenzo|huracan|velez sarsfield|velez|estudiantes|lanus|defensa y justicia|talleres|godoy cruz|union|colon|central cordoba|newell's|rosario central|banfield|argentinos juniors)\b/i;
  if (argentinaTeams.test(combined) || /argentine league|primera division argentina/i.test(message)) {
    return 'soccer_argentina_primera_division';
  }
  
  // ==========================================
  // GENERIC SOCCER FALLBACK
  // ==========================================
  const soccerIndicators = /\bfc\b|\bunited\b|\bcity\b|sporting|real\b/i;
  if (soccerIndicators.test(combined) || /soccer|football|futbol|fussball/i.test(message)) {
    return 'soccer_epl'; // Default to EPL if can't determine specific league
  }
  
  // Default to soccer (most common globally)
  return 'soccer_epl';
}

/**
 * Call the match-preview API and format response for chat
 * This uses real data from our data layer instead of hardcoded values
 */
async function performMatchAnalysis(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  request: NextRequest
): Promise<{ success: boolean; response: string; error?: string }> {
  try {
    // Generate a match ID using proper slug format
    // Format: home-team-vs-away-team-sport-date
    const slugify = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    const getSportCode = (sportKey: string) => {
      const parts = sportKey.split('_');
      return parts.length >= 2 ? parts.slice(1).join('-') : sportKey;
    };
    
    const homeSlug = slugify(homeTeam);
    const awaySlug = slugify(awayTeam);
    const sportCode = getSportCode(sport);
    const today = new Date().toISOString().split('T')[0];
    
    // Proper format: roma-vs-sassuolo-italy-serie-a-2026-01-10
    const matchId = `${homeSlug}-vs-${awaySlug}-${sportCode}-${today}`;
    
    // Get the host from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    // Forward all headers for authentication (including cookies)
    const cookies = request.headers.get('cookie') || '';
    const authHeader = request.headers.get('authorization') || '';
    
    console.log(`[AI-Chat] Calling match-preview API for: ${homeTeam} vs ${awayTeam}`);
    console.log(`[AI-Chat] Generated matchId: ${matchId}`);
    console.log(`[AI-Chat] Cookies present: ${cookies.length > 0}`);
    
    // Try match-preview first for real data
    const previewResponse = await fetch(`${baseUrl}/api/match-preview/${encodeURIComponent(matchId)}`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'Authorization': authHeader,
      },
    });
    
    if (previewResponse.ok) {
      const previewData = await previewResponse.json();
      
      // Check if this is a demo/random match instead of the real match we asked for
      // If isDemo is true and the teams don't match, skip this response
      if (previewData.isDemo) {
        console.log(`[AI-Chat] Match-preview returned a demo, falling back to analyze API`);
      } else {
        // Format the rich preview data for chat
        const formattedResponse = formatMatchPreviewForChat(previewData, homeTeam, awayTeam);
        
        return {
          success: true,
          response: formattedResponse,
        };
      }
    } else {
      console.log(`[AI-Chat] Match-preview failed (${previewResponse.status}), falling back to analyze API`);
    }
    
    // Fallback to analyze API with default odds
    const analyzeRequest = {
      matchData: {
        sport: sport,
        league: 'Auto-detected',
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        matchDate: new Date().toISOString(),
        sourceType: 'chat',
        odds: {
          home: 2.0,  // Default even odds
          draw: sport.includes('soccer') ? 3.5 : null,
          away: 2.0,
        },
      },
    };
    
    // Call the analyze API
    const analyzeResponse = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify(analyzeRequest),
    });
    
    if (!analyzeResponse.ok) {
      const errorData = await analyzeResponse.json().catch(() => ({}));
      
      // Check for usage limit
      if (analyzeResponse.status === 403) {
        return {
          success: false,
          response: `⚠️ **Analysis Limit Reached**\n\nYou've used your daily analysis quota. To get full match analysis for **${homeTeam} vs ${awayTeam}**, please upgrade your plan or wait until tomorrow.\n\n👉 [View Pricing](/pricing)`,
        };
      }
      
      // Check for auth required
      if (analyzeResponse.status === 401) {
        return {
          success: false,
          response: `🔐 **Sign In Required**\n\nTo get AI-powered match analysis for **${homeTeam} vs ${awayTeam}**, please sign in to your account.\n\n👉 [Sign In](/login) or [Create Account](/register)`,
        };
      }
      
      return {
        success: false,
        error: errorData.error || 'Analysis failed',
        response: `Sorry, I couldn't analyze **${homeTeam} vs ${awayTeam}** right now. Please try using the [Match Analyzer](/analyzer) directly.`,
      };
    }
    
    const analysisData = await analyzeResponse.json();
    
    // Format the analysis for chat display
    const formattedResponse = formatAnalysisForChat(analysisData, homeTeam, awayTeam);
    
    return {
      success: true,
      response: formattedResponse,
    };
  } catch (error) {
    console.error('[AI-Chat] Match analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: `Sorry, I couldn't analyze **${homeTeam} vs ${awayTeam}** right now. Please try using the [Match Analyzer](/analyzer) directly.`,
    };
  }
}

/**
 * Format match-preview data for chat display
 */
function formatMatchPreviewForChat(data: any, homeTeam: string, awayTeam: string): string {
  let response = `## 🔮 ${homeTeam} vs ${awayTeam}\n\n`;
  
  // Story/Narrative
  if (data.story?.narrative) {
    response += `${data.story.narrative}\n\n`;
  }
  
  // Prediction
  if (data.story?.favored) {
    const favored = data.story.favored;
    const confidence = data.story.confidence;
    const team = favored === 'home' ? homeTeam : favored === 'away' ? awayTeam : 'Draw';
    const emoji = confidence === 'strong' ? '💪' : confidence === 'moderate' ? '📊' : '🤔';
    response += `### ${emoji} Prediction: **${team}** (${confidence} confidence)\n\n`;
  }
  
  // Market Edge
  if (data.marketIntel?.valueEdge) {
    const edge = data.marketIntel.valueEdge;
    if (edge.hasValue) {
      response += `### 💰 Value Detected\n`;
      response += `- **${edge.side}** @ ${edge.odds?.toFixed(2)} (${edge.edgePercent?.toFixed(1)}% edge)\n\n`;
    }
  }
  
  // Form Data
  if (data.momentumAndForm?.homeForm?.length > 0 || data.momentumAndForm?.awayForm?.length > 0) {
    response += `### 📈 Recent Form\n`;
    if (data.momentumAndForm.homeForm?.length > 0) {
      const homeFormStr = data.momentumAndForm.homeForm.slice(0, 5).map((m: any) => 
        m.result === 'W' ? '✅' : m.result === 'L' ? '❌' : '➖'
      ).join('');
      response += `- **${homeTeam}**: ${homeFormStr}\n`;
    }
    if (data.momentumAndForm.awayForm?.length > 0) {
      const awayFormStr = data.momentumAndForm.awayForm.slice(0, 5).map((m: any) => 
        m.result === 'W' ? '✅' : m.result === 'L' ? '❌' : '➖'
      ).join('');
      response += `- **${awayTeam}**: ${awayFormStr}\n`;
    }
    response += '\n';
  }
  
  // Key Factors
  if (data.universalSignals?.length > 0) {
    response += `### 🔑 Key Factors\n`;
    const topSignals = data.universalSignals.slice(0, 3);
    for (const signal of topSignals) {
      const emoji = signal.favors === 'home' ? '🏠' : signal.favors === 'away' ? '✈️' : '⚖️';
      response += `${emoji} **${signal.name}**: ${signal.insight || signal.description}\n`;
    }
    response += '\n';
  }
  
  // Injuries
  if (data.injuries?.home?.length > 0 || data.injuries?.away?.length > 0) {
    response += `### 🏥 Injury News\n`;
    if (data.injuries.home?.length > 0) {
      response += `- **${homeTeam}**: ${data.injuries.home.slice(0, 3).map((i: any) => i.player).join(', ')}\n`;
    }
    if (data.injuries.away?.length > 0) {
      response += `- **${awayTeam}**: ${data.injuries.away.slice(0, 3).map((i: any) => i.player).join(', ')}\n`;
    }
    response += '\n';
  }
  
  // Disclaimer
  response += `---\n⚠️ *This is educational analysis, not betting advice. Always gamble responsibly.*`;
  
  return response;
}

/**
 * Format the analysis response for chat display
 */
function formatAnalysisForChat(analysis: any, homeTeam: string, awayTeam: string): string {
  const { matchInfo, probabilities, valueSummary, keyFactors, briefing, responsibleGamblingNote } = analysis;
  
  let response = `## 🎯 Match Analysis: ${homeTeam} vs ${awayTeam}\n\n`;
  
  // AI Briefing (the main insight)
  if (briefing?.narrative) {
    response += `### 💡 Key Insight\n${briefing.narrative}\n\n`;
  }
  
  // Probabilities
  if (probabilities) {
    response += `### 📊 AI Probability Estimates\n`;
    if (probabilities.homeWin) {
      response += `- **${homeTeam}** win: ${Math.round(probabilities.homeWin * 100)}%\n`;
    }
    if (probabilities.draw !== null && probabilities.draw !== undefined) {
      response += `- **Draw**: ${Math.round(probabilities.draw * 100)}%\n`;
    }
    if (probabilities.awayWin) {
      response += `- **${awayTeam}** win: ${Math.round(probabilities.awayWin * 100)}%\n`;
    }
    response += '\n';
  }
  
  // Value Summary
  if (valueSummary?.bestValue) {
    const edge = valueSummary.estimatedEdge ? ` (${valueSummary.estimatedEdge > 0 ? '+' : ''}${(valueSummary.estimatedEdge * 100).toFixed(1)}% edge)` : '';
    response += `### 💎 Value Indication\n`;
    response += `Best value: **${valueSummary.bestValue}**${edge}\n`;
    response += `Confidence: ${valueSummary.confidence || 'Medium'}\n\n`;
  }
  
  // Key Factors (top 3)
  if (keyFactors && keyFactors.length > 0) {
    response += `### 🔑 Key Factors\n`;
    const topFactors = keyFactors.slice(0, 3);
    for (const factor of topFactors) {
      const emoji = factor.favors === 'home' ? '🏠' : factor.favors === 'away' ? '✈️' : '⚖️';
      response += `${emoji} **${factor.factor}**: ${factor.insight}\n`;
    }
    response += '\n';
  }
  
  // Risk Level
  if (valueSummary?.riskLevel) {
    const riskEmoji = valueSummary.riskLevel === 'LOW' ? '🟢' : valueSummary.riskLevel === 'MEDIUM' ? '🟡' : '🔴';
    response += `**Risk Level**: ${riskEmoji} ${valueSummary.riskLevel}\n\n`;
  }
  
  // Disclaimer
  response += `---\n⚠️ *${responsibleGamblingNote || 'This is educational analysis, not betting advice. Always gamble responsibly.'}*`;
  
  return response;
}

/**
 * Detect the category of sports question
 */
function detectQueryCategory(message: string): QueryCategory {
  // FIRST: Check for match analysis request (highest priority)
  const analysisIntent = detectMatchAnalysisRequest(message);
  if (analysisIntent.isMatchAnalysis) {
    return 'MATCH_ANALYSIS';
  }
  
  // Check for betting advice / player props
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
  
  // Statistics - THIS MUST COME BEFORE PLAYER to catch "player + stats" queries
  // Including current season questions about player performance
  // Supports multiple languages and sports
  if (/stats|statistics|goals|assists|top scorer|most|average|record|career/i.test(message) ||
      // Serbian/Croatian - football
      /koliko (golova|asistencija|utakmica)|golova je postigao/i.test(message) ||
      // Serbian/Croatian - basketball  
      /koliko (koseva|poena|skokova|asistencija)|postigao (koseva|poena)|ubacio|trojki/i.test(message) ||
      // Serbian/Croatian - last game queries
      /posledn(joj|ja|ju|ji|je|eg|oj|em) (utakmic|meč)|sinoć|jučer|juče/i.test(message) ||
      // English - last game queries
      /how many (goals|points|rebounds|assists)|scored (this|last)|last (game|match)/i.test(message) ||
      /points (did|in)|rebounds (did|in)|assists (did|in)/i.test(message) ||
      // Season queries
      /goals this season|season stats|sezon|this season|current season|2024|2025/i.test(message) ||
      // NBA specific
      /ppg|rpg|apg|per game|game average|season average/i.test(message)) {
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

// ============================================
// INTELLIGENT ROUTING DECISION ENGINE
// ============================================

/**
 * Data sources and their characteristics:
 * 
 * GPT-ONLY (no search):
 *   - Rules, definitions, explanations
 *   - General sports knowledge (tactics, formations)
 *   - Historical facts that are well-established
 *   - Greetings and meta questions
 *   Cost: $0.001, Latency: 500ms
 * 
 * WIKIPEDIA (via Perplexity site:wikipedia):
 *   - Player biographies (birth date, nationality, career history)
 *   - Team history, founding dates
 *   - All-time records and achievements
 *   - Trophy counts, historical stats
 *   Cost: $0.003, Latency: 1.5s
 * 
 * PERPLEXITY REAL-TIME (full web search):
 *   - Current season stats (goals, assists, form)
 *   - Today's match results
 *   - Injury updates, lineup news
 *   - Transfer rumors and confirmed deals
 *   - Current standings
 *   - Breaking news
 *   Cost: $0.005, Latency: 2s
 */

type DataSource = 'GPT_ONLY' | 'WIKIPEDIA' | 'REALTIME' | 'HYBRID';

interface RoutingDecision {
  source: DataSource;
  searchQuery?: string;
  recency?: 'hour' | 'day' | 'week' | 'month';
  confidence: number; // 0-100
  reason: string;
}

// Time-sensitive keywords that ALWAYS need real-time data
const REALTIME_TRIGGERS = {
  // Current season/form (changes weekly) - includes Serbian/Croatian
  currentSeason: /this season|current season|sez[oó]n|2024.?2025|2025.?2026|form|recent|últim|dernièr|letzte|koliko (golova|asistencija)|how many goals|goals (this|scored)|postig(ao|la)/i,
  
  // Live/Today (changes hourly)  
  liveData: /today|tonight|now|live|score|result|playing|won|lost|beat|sinoć|večeras|hoy|heute|aujourd/i,
  
  // Breaking news (changes daily)
  breakingNews: /news|update|breaking|announced|confirmed|sign|transfer|injur|out|miss|ruled out|povred/i,
  
  // Current status questions - includes Serbian
  currentStatus: /where (does|is|do)|gde igra|gdje igra|koji klub|za koga igra|plays for|current (team|club)|juega en|spielt für/i,
  
  // Standings/table (changes weekly)
  standings: /standing|table|position|rank|top of|lead|tabela|clasificación|classement|tabelle/i,
  
  // Lineup/Squad
  lineup: /lineup|squad|roster|starting|bench|XI|postava|alineación|aufstellung/i,
};

// Static knowledge that GPT can answer without search
const GPT_SUFFICIENT = {
  // Rules never change
  rules: /what (is|are) (offside|a foul|the rules|handball|penalty|free kick|corner|goal kick)/i,
  rulesOf: /rules of|pravila|reglas|règles|regeln/i,
  howMany: /how many (players|substitut|minutes|halves|quarters|periods|sets)/i,
  explain: /explain .*(rule|offside|foul|tactic|formation|strategy)/i,
  
  // Tactical knowledge
  tactics: /what is (a )?(4-4-2|4-3-3|3-5-2|false.?9|pressing|counter|possession|parking|tiki.?taka)/i,
  formations: /best formation|how to (play|defend|attack)|tactical|strategically/i,
  
  // Historical facts (well-established)
  allTime: /all.time (record|top|best|most|greatest)|in history|ever (score|won|play)|of all time/i,
  trophies: /how many (trophies|titles|cups|championships) (has|did|have)/i,
  
  // Greetings & meta
  greetings: /^(hello|hi|hey|thanks|thank you|bye|ok|okay|good|great|nice|cool)[\s!?.]*$/i,
  meta: /^(who are you|what can you do|help|how does this work)[\s!?.]*$/i,
  
  // Hypotheticals
  hypothetical: /^(what if|imagine|suppose|hypothetically)/i,
};

// Wikipedia is best for biographical/historical data
const WIKIPEDIA_PREFERRED = {
  // Player biography
  biography: /(who is|tell me about|biography|born|nationality|height|age|career) .* (player|footballer|athlete)/i,
  playerBio: /when was .* born|where was .* born|how old is|nationality of/i,
  
  // Team history
  teamHistory: /(founded|history|origin|when was .* (formed|founded|created))/i,
  
  // All-time records (stable data)
  records: /(record|most goals in|all.time|career (goals|assists|appearances)|total (goals|trophies))/i,
  
  // Trophy/achievement counts (relatively stable)
  achievements: /how many (champions league|world cup|ballon d'or|mvp)|won the/i,
};

/**
 * INTELLIGENT ROUTER - Decides optimal data source
 */
function routeQuery(message: string, category: QueryCategory): RoutingDecision {
  const lower = message.toLowerCase();
  
  // 1. Check GPT-ONLY patterns (highest priority for cost savings)
  for (const [key, pattern] of Object.entries(GPT_SUFFICIENT)) {
    if (pattern.test(message)) {
      return {
        source: 'GPT_ONLY',
        confidence: 95,
        reason: `Static knowledge: ${key}`
      };
    }
  }
  
  // 2. Check REALTIME triggers (highest priority for accuracy)
  for (const [key, pattern] of Object.entries(REALTIME_TRIGGERS)) {
    if (pattern.test(message)) {
      const recency = key === 'liveData' ? 'hour' : 
                      key === 'breakingNews' ? 'day' : 'week';
      return {
        source: 'REALTIME',
        recency,
        confidence: 90,
        reason: `Real-time needed: ${key}`
      };
    }
  }
  
  // 3. Check WIKIPEDIA preference
  for (const [key, pattern] of Object.entries(WIKIPEDIA_PREFERRED)) {
    if (pattern.test(message)) {
      // BUT if also asking about current season, use REALTIME
      if (REALTIME_TRIGGERS.currentSeason.test(message)) {
        return {
          source: 'REALTIME',
          recency: 'week',
          confidence: 85,
          reason: `Biography + current season = real-time`
        };
      }
      return {
        source: 'WIKIPEDIA',
        recency: 'month',
        confidence: 85,
        reason: `Historical/biographical: ${key}`
      };
    }
  }
  
  // 4. Category-based routing
  const categoryRoutes: Record<QueryCategory, RoutingDecision> = {
    PLAYER: {
      source: 'HYBRID', // Wikipedia for bio, real-time for current team
      recency: 'week',
      confidence: 75,
      reason: 'Player query - check if current status or biography'
    },
    ROSTER: {
      source: 'REALTIME',
      recency: 'week',
      confidence: 90,
      reason: 'Rosters change frequently'
    },
    FIXTURE: {
      source: 'REALTIME',
      recency: 'day',
      confidence: 95,
      reason: 'Fixtures are time-sensitive'
    },
    RESULT: {
      source: 'REALTIME',
      recency: 'hour',
      confidence: 95,
      reason: 'Results need real-time data'
    },
    STANDINGS: {
      source: 'REALTIME',
      recency: 'day',
      confidence: 90,
      reason: 'Standings change after each match'
    },
    STATS: {
      source: 'REALTIME',
      recency: 'week',
      confidence: 90,
      reason: 'Current season stats need real-time'
    },
    INJURY: {
      source: 'REALTIME',
      recency: 'day',
      confidence: 95,
      reason: 'Injury status changes daily'
    },
    TRANSFER: {
      source: 'REALTIME',
      recency: 'day',
      confidence: 90,
      reason: 'Transfer news is time-sensitive'
    },
    MANAGER: {
      source: 'REALTIME',
      recency: 'week',
      confidence: 80,
      reason: 'Manager changes are newsworthy'
    },
    ODDS: {
      source: 'REALTIME',
      recency: 'hour',
      confidence: 90,
      reason: 'Odds change frequently'
    },
    COMPARISON: {
      source: 'HYBRID',
      recency: 'week',
      confidence: 75,
      reason: 'Comparisons need both historical and current data'
    },
    HISTORY: {
      source: 'WIKIPEDIA',
      recency: 'month',
      confidence: 85,
      reason: 'Historical data is stable'
    },
    BROADCAST: {
      source: 'REALTIME',
      recency: 'day',
      confidence: 85,
      reason: 'Broadcast info is match-specific'
    },
    VENUE: {
      source: 'WIKIPEDIA',
      recency: 'month',
      confidence: 90,
      reason: 'Stadium info is stable'
    },
    PLAYER_PROP: {
      source: 'REALTIME',
      recency: 'day',
      confidence: 95,
      reason: 'Player props need current stats'
    },
    BETTING_ADVICE: {
      source: 'REALTIME',
      recency: 'day',
      confidence: 85,
      reason: 'Need current form for analysis'
    },
    MATCH_ANALYSIS: {
      source: 'REALTIME',
      recency: 'day',
      confidence: 95,
      reason: 'Match analysis requires current form and odds data'
    },
    GENERAL: {
      source: 'REALTIME', // Default to searching for safety
      recency: 'week',
      confidence: 60,
      reason: 'Unknown query type - search to be safe'
    }
  };
  
  return categoryRoutes[category] || categoryRoutes.GENERAL;
}

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
 * OPTIMIZED ROUTING - Uses intelligent router for decision
 * Returns detailed routing information
 */
function getOptimalRoute(message: string): RoutingDecision & { shouldSearch: boolean } {
  const category = detectQueryCategory(message);
  const route = routeQuery(message, category);
  
  console.log(`[Router] Category: ${category}, Source: ${route.source}, Confidence: ${route.confidence}%, Reason: ${route.reason}`);
  
  return {
    ...route,
    shouldSearch: route.source !== 'GPT_ONLY'
  };
}

/**
 * Smart detection: Does this query need real-time data?
 * Uses the intelligent routing engine
 */
function needsRealTimeSearch(message: string): boolean {
  const route = getOptimalRoute(message);
  return route.shouldSearch;
}

/**
 * Build optimized search query based on routing decision
 */
/**
 * Get current season string based on sport and current date
 * NBA/NHL: Oct-Jun = year-year+1 (e.g., 2025-26 for Oct 2025 - Jun 2026)
 * Football (Soccer): Aug-May = year-year+1 (e.g., 2025-26)
 * NFL: Sep-Feb = year-year+1
 */
function getCurrentSeasonForSport(sport: string): string {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  
  // For most sports, season spans two calendar years
  // If we're in the first half (Jan-Jun), we're in the previous year's season
  // If we're in the second half (Jul-Dec), we're in the current year's season
  
  let seasonStartYear: number;
  
  if (sport === 'basketball' || sport === 'nba') {
    // NBA: Oct-Jun. If Jan-Jun, season started previous year
    seasonStartYear = (month >= 0 && month <= 5) ? year - 1 : year;
  } else if (sport === 'hockey' || sport === 'nhl') {
    // NHL: Oct-Jun. If Jan-Jun, season started previous year
    seasonStartYear = (month >= 0 && month <= 5) ? year - 1 : year;
  } else if (sport === 'american_football' || sport === 'nfl') {
    // NFL: Sep-Feb. If Jan-Feb, season started previous year
    seasonStartYear = (month >= 0 && month <= 1) ? year - 1 : year;
  } else {
    // Football/Soccer: Aug-May. If Jan-May, season started previous year
    seasonStartYear = (month >= 0 && month <= 4) ? year - 1 : year;
  }
  
  const seasonEndYear = (seasonStartYear + 1) % 100; // Get last 2 digits
  return `${seasonStartYear}-${seasonEndYear.toString().padStart(2, '0')}`;
}

function buildOptimizedSearchQuery(message: string, route: RoutingDecision): string {
  const query = message
    .replace(/\?/g, '')
    .replace(/please|can you|could you|tell me|what do you think|i want to know/gi, '')
    .trim();
  
  // Detect sport for season context
  const sport = detectSport(message) || 'football';
  const currentSeason = getCurrentSeasonForSport(sport);
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Extract player/team name for better search - ROBUST extraction
  // Try multiple patterns, case-insensitive
  const namePatterns = [
    // Serbian/Croatian: "gde igra [NAME]", "koliko [NAME]"
    /(?:gde|gdje|ko|tko|koliko)\s+(?:igra|je|ima)?\s*([a-zA-ZćčšžđĆČŠŽĐñüéáíóú]+\s+[a-zA-ZćčšžđĆČŠŽĐñüéáíóú]+)/i,
    // "where does [NAME] play", "who is [NAME]"
    /(?:where|who|what|how many)\s+(?:does|is|did|has)\s+([a-zA-Z]+\s+[a-zA-Z]+)/i,
    // Two consecutive capitalized words
    /([A-Z][a-zćčšžđñü]+\s+[A-Z][a-zćčšžđñü]+)/,
    // Two consecutive words after common sports verbs
    /(?:plays?|scored?|assist|goals?)\s+(?:for|by|of)?\s*([a-zA-Z]+\s+[a-zA-Z]+)/i,
    // Generic: two words that look like names (2-15 chars each)
    /\b([a-zA-ZćčšžđĆČŠŽĐñüéáíóú]{2,15}\s+[a-zA-ZćčšžđĆČŠŽĐñüéáíóú]{3,20})\b/i,
  ];
  
  let extractedName: string | null = null;
  for (const pattern of namePatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      // Skip common non-name words
      const candidate = match[1].trim();
      const skipWords = /^(the |how |what |who |where |this |that |team |player |goals |season )/i;
      if (!skipWords.test(candidate) && candidate.split(' ').length >= 2) {
        // Capitalize the name properly
        extractedName = candidate
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        break;
      }
    }
  }
  
  // Sport-specific stat keywords (what to search for, not site names)
  const sportStatTerms: Record<string, string> = {
    basketball: 'PPG RPG APG points rebounds assists',
    nba: 'PPG RPG APG points rebounds assists',
    football: 'goals assists appearances matches',
    soccer: 'goals assists appearances matches',
    hockey: 'goals assists points games',
    nhl: 'goals assists points games',
    american_football: 'passing yards touchdowns rushing',
    nfl: 'passing yards touchdowns rushing',
    tennis: 'wins losses ranking titles',
    mma: 'wins losses knockouts submissions record',
    ufc: 'wins losses knockouts submissions record',
    baseball: 'batting average home runs RBI ERA',
    mlb: 'batting average home runs RBI ERA',
    f1: 'wins podiums points championship',
    golf: 'wins ranking earnings',
    cricket: 'runs wickets average',
  };
  
  const statTerms = sportStatTerms[sport] || 'stats statistics';
  
  switch (route.source) {
    case 'GPT_ONLY':
      return ''; // No search needed
      
    case 'WIKIPEDIA':
      if (extractedName) {
        return `"${extractedName}" site:wikipedia.org athlete career biography`;
      }
      return `${query} site:wikipedia.org`;
      
    case 'REALTIME':
      if (extractedName) {
        // For current status queries (where does X play)
        if (REALTIME_TRIGGERS.currentStatus.test(message)) {
          return `"${extractedName}" ${currentSeason} current team club`;
        }
        // For stats queries (how many goals/points, season stats)
        if (REALTIME_TRIGGERS.currentSeason.test(message)) {
          return `"${extractedName}" ${currentSeason} season ${statTerms}`;
        }
        // For injury queries
        if (REALTIME_TRIGGERS.breakingNews.test(message)) {
          return `"${extractedName}" injury update ${currentMonth}`;
        }
        // Default: current season stats
        return `"${extractedName}" ${currentSeason} season ${statTerms}`;
      }
      // Default real-time enhancement
      return `${query} ${route.recency === 'hour' ? 'today' : route.recency === 'day' ? currentMonth : currentSeason}`;
      
    case 'HYBRID':
      if (extractedName) {
        return `"${extractedName}" ${currentSeason} ${statTerms} career`;
      }
      return `${query} ${currentSeason}`;
      
    default:
      return query;
  }
}

/**
 * Detect sport from message
 */
function detectSport(message: string): string | undefined {
  const lower = message.toLowerCase();
  
  // Basketball / NBA
  if (/basketball|nba|euroleague|lakers|celtics|warriors|nets|76ers|sixers|bucks|heat|knicks|bulls|suns|mavericks|nuggets|clippers|spurs|rockets|point guard|shooting guard|small forward|power forward|center|dunk|three.?pointer|ppg|rebounds|assists|embiid|lebron|curry|giannis|jokic|dončić|doncic|tatum|durant/i.test(lower)) {
    return 'basketball';
  }
  
  // American Football / NFL
  if (/nfl|american football|quarterback|touchdown|super bowl|chiefs|eagles|cowboys|patriots|bills|dolphins|ravens|49ers|bengals|lions|packers|yards|rushing|passing|sack|interception|mahomes|allen|burrow|hurts|herbert/i.test(lower)) {
    return 'american_football';
  }
  
  // Ice Hockey / NHL
  if (/hockey|nhl|ice hockey|puck|goalie|goaltender|rangers|bruins|maple leafs|canadiens|oilers|avalanche|lightning|panthers|penguins|capitals|power play|hat trick|mcdavid|crosby|ovechkin|draisaitl|mackinnon/i.test(lower)) {
    return 'hockey';
  }
  
  // Football/Soccer (check after American sports to avoid false positives)
  if (/soccer|premier league|la liga|serie a|bundesliga|ligue 1|champions league|europa league|epl|fc barcelona|real madrid|manchester|liverpool|arsenal|chelsea|bayern|psg|juventus|inter milan|ac milan|borussia|atletico|tottenham|goal|striker|midfielder|defender|haaland|mbappe|mbappé|vinicius|bellingham|salah|de bruyne|rodri/i.test(lower)) {
    return 'football';
  }
  
  // Tennis
  if (/tennis|atp|wta|grand slam|wimbledon|us open|french open|roland garros|australian open|nadal|djokovic|federer|alcaraz|sinner|swiatek|sabalenka|gauff|medvedev|zverev|serve|backhand|forehand|ace|break point/i.test(lower)) {
    return 'tennis';
  }
  
  // MMA/UFC
  if (/mma|ufc|bellator|pfl|one championship|knockout|submission|fighter|octagon|weight class|pound.for.pound|heavyweight|lightweight|welterweight|featherweight|bantamweight|jones|adesanya|pereira|makhachev|volkanovski|o'malley|chimaev/i.test(lower)) {
    return 'mma';
  }
  
  // Boxing
  if (/boxing|boxer|heavyweight champion|world title fight|canelo|fury|usyk|joshua|crawford|spence|haney|davis|knockdown|tko|uppercut|jab/i.test(lower)) {
    return 'boxing';
  }
  
  // Baseball / MLB
  if (/baseball|mlb|yankees|dodgers|red sox|mets|cubs|cardinals|braves|astros|phillies|padres|home run|pitcher|batting average|era|strikeout|rbi|ohtani|judge|trout|betts|acuña|soto/i.test(lower)) {
    return 'baseball';
  }
  
  // Formula 1 / Motorsport
  if (/formula.?1|f1|grand prix|verstappen|hamilton|leclerc|norris|russell|sainz|perez|alonso|red bull racing|ferrari|mercedes|mclaren|pit stop|pole position|fastest lap|drs|nascar|indycar/i.test(lower)) {
    return 'f1';
  }
  
  // Golf
  if (/golf|pga|lpga|masters|us open golf|british open|pga championship|ryder cup|scottie scheffler|rory mcilroy|jon rahm|brooks koepka|birdie|eagle|bogey|fairway|green/i.test(lower)) {
    return 'golf';
  }
  
  // Cricket
  if (/cricket|ipl|test match|odi|t20|ashes|world cup cricket|kohli|sharma|babar|root|stokes|williamson|wicket|bowler|batsman|innings|century/i.test(lower)) {
    return 'cricket';
  }
  
  // Rugby
  if (/rugby|six nations|rugby world cup|all blacks|springboks|wallabies|england rugby|try|scrum|lineout|ruck/i.test(lower)) {
    return 'rugby';
  }
  
  // Esports
  if (/esports|e-sports|csgo|cs2|counter.?strike|valorant|league of legends|lol|dota|overwatch|call of duty|fortnite|hltv|liquipedia|major tournament/i.test(lower)) {
    return 'esports';
  }
  
  // Cycling
  if (/cycling|tour de france|giro|vuelta|pogačar|pogacar|vingegaard|evenepoel|van aert|wout|peloton|stage race/i.test(lower)) {
    return 'cycling';
  }
  
  // Generic "football" without other context - default to soccer (more global)
  if (/\bfootball\b/i.test(lower) && !/american|nfl|super bowl|touchdown|quarterback/i.test(lower)) {
    return 'football';
  }
  
  return undefined;
}

/**
 * Detect specific league from message
 */
function detectLeague(message: string): string | undefined {
  const lower = message.toLowerCase();
  
  // Basketball leagues
  if (/\bnba\b|lakers|celtics|warriors|nets|76ers|sixers|bucks|heat|knicks|bulls|suns|mavericks|nuggets|clippers|spurs|rockets|embiid|lebron|curry|giannis|jokic|dončić|doncic|tatum|durant/i.test(lower)) {
    return 'nba';
  }
  if (/euroleague|eurobasket|partizan|crvena zvezda|olympiacos|panathinaikos|fenerbahce|real madrid basket|barcelona basket|anadolu efes|maccabi/i.test(lower)) {
    return 'euroleague';
  }
  if (/ncaa basketball|college basketball|march madness|duke basketball|kentucky basketball|kansas basketball/i.test(lower)) {
    return 'ncaa_basketball';
  }
  
  // Football/Soccer leagues
  if (/premier league|epl|manchester (united|city)|liverpool|arsenal|chelsea|tottenham|newcastle|west ham|aston villa|brighton/i.test(lower)) {
    return 'premier_league';
  }
  if (/la liga|real madrid|barcelona|atletico madrid|sevilla|villarreal|real sociedad|athletic bilbao/i.test(lower) && !/basket/i.test(lower)) {
    return 'la_liga';
  }
  if (/serie a|juventus|inter milan|ac milan|napoli|roma|lazio|atalanta|fiorentina/i.test(lower)) {
    return 'serie_a';
  }
  if (/bundesliga|bayern munich|borussia dortmund|rb leipzig|bayer leverkusen|frankfurt/i.test(lower)) {
    return 'bundesliga';
  }
  if (/ligue 1|psg|paris saint.germain|marseille|lyon|monaco|lille/i.test(lower)) {
    return 'ligue_1';
  }
  if (/champions league|ucl|europa league|conference league/i.test(lower)) {
    return 'champions_league';
  }
  if (/mls|inter miami|lafc|la galaxy|atlanta united|seattle sounders/i.test(lower)) {
    return 'mls';
  }
  
  // American Football
  if (/\bnfl\b|chiefs|eagles|cowboys|patriots|bills|dolphins|ravens|49ers|bengals|lions|packers|jets|giants|raiders|broncos|chargers|steelers|saints|buccaneers|seahawks|vikings|commanders|bears|panthers|falcons|cardinals|titans|colts|jaguars|texans|browns|mahomes|allen|burrow|hurts|herbert/i.test(lower)) {
    return 'nfl';
  }
  if (/college football|cfb|ncaa football|alabama football|ohio state football|georgia football|michigan football/i.test(lower)) {
    return 'ncaa_football';
  }
  
  // Hockey
  if (/\bnhl\b|rangers|bruins|maple leafs|canadiens|oilers|avalanche|lightning|panthers|penguins|capitals|flyers|devils|islanders|hurricanes|wild|jets|blues|predators|stars|flames|canucks|kraken|golden knights|blackhawks|red wings|senators|ducks|kings|sharks|coyotes|mcdavid|crosby|ovechkin|draisaitl|mackinnon/i.test(lower)) {
    return 'nhl';
  }
  if (/khl|kontinental hockey|ska|cska moscow|ak bars|metallurg/i.test(lower)) {
    return 'khl';
  }
  
  // Baseball
  if (/\bmlb\b|yankees|dodgers|mets|phillies|braves|astros|red sox|cubs|cardinals|giants|padres|rangers|mariners|guardians|orioles|rays|blue jays|twins|brewers|diamondbacks|rockies|marlins|reds|pirates|nationals|royals|tigers|white sox|angels|athletics/i.test(lower)) {
    return 'mlb';
  }
  
  // Tennis
  if (/atp|wta|grand slam|wimbledon|us open tennis|french open|roland garros|australian open/i.test(lower)) {
    return 'tennis';
  }
  
  // MMA/UFC
  if (/\bufc\b|bellator|pfl|one championship/i.test(lower)) {
    return 'ufc';
  }
  
  // F1
  if (/formula.?1|\bf1\b|red bull racing|ferrari f1|mercedes f1|mclaren f1/i.test(lower)) {
    return 'f1';
  }
  
  // Cricket
  if (/\bipl\b|indian premier league|mumbai indians|chennai super kings|royal challengers|kolkata knight|delhi capitals|rajasthan royals|sunrisers/i.test(lower)) {
    return 'ipl';
  }
  if (/test cricket|ashes|test match|county cricket/i.test(lower)) {
    return 'test_cricket';
  }
  
  return undefined;
}

/**
 * Get authoritative sources for a league
 */
function getLeagueSources(league: string | undefined, sport: string): string | undefined {
  const sourcesMap: Record<string, string> = {
    // Basketball
    nba: 'site:espn.com OR site:nba.com OR site:basketball-reference.com',
    euroleague: 'site:euroleaguebasketball.net OR site:eurohoops.net OR site:basketnews.com',
    ncaa_basketball: 'site:espn.com OR site:sports-reference.com/cbb',
    
    // Football/Soccer
    premier_league: 'site:premierleague.com OR site:transfermarkt.com OR site:fbref.com',
    la_liga: 'site:laliga.com OR site:transfermarkt.com OR site:fbref.com',
    serie_a: 'site:legaseriea.it OR site:transfermarkt.com OR site:fbref.com',
    bundesliga: 'site:bundesliga.com OR site:transfermarkt.com OR site:fbref.com',
    ligue_1: 'site:ligue1.com OR site:transfermarkt.com OR site:fbref.com',
    champions_league: 'site:uefa.com OR site:transfermarkt.com OR site:fbref.com',
    mls: 'site:mlssoccer.com OR site:transfermarkt.com',
    
    // American Football
    nfl: 'site:espn.com OR site:nfl.com OR site:pro-football-reference.com',
    ncaa_football: 'site:espn.com OR site:sports-reference.com/cfb',
    
    // Hockey
    nhl: 'site:espn.com OR site:nhl.com OR site:hockey-reference.com',
    khl: 'site:khl.ru OR site:eliteprospects.com',
    
    // Baseball
    mlb: 'site:espn.com OR site:mlb.com OR site:baseball-reference.com',
    
    // Tennis
    tennis: 'site:atptour.com OR site:wtatennis.com OR site:tennisabstract.com',
    
    // MMA
    ufc: 'site:ufc.com OR site:espn.com/mma OR site:sherdog.com',
    
    // F1
    f1: 'site:formula1.com OR site:motorsport.com OR site:espn.com/f1',
    
    // Cricket
    ipl: 'site:iplt20.com OR site:espncricinfo.com OR site:cricbuzz.com',
    test_cricket: 'site:espncricinfo.com OR site:cricbuzz.com',
  };
  
  // If we detected a specific league, use that
  if (league && sourcesMap[league]) {
    return sourcesMap[league];
  }
  
  // Fallback to sport-level sources
  const sportSourcesMap: Record<string, string> = {
    basketball: 'site:espn.com OR site:basketball-reference.com',
    football: 'site:transfermarkt.com OR site:fbref.com',
    soccer: 'site:transfermarkt.com OR site:fbref.com',
    american_football: 'site:espn.com OR site:pro-football-reference.com',
    hockey: 'site:espn.com OR site:hockey-reference.com',
    baseball: 'site:espn.com OR site:baseball-reference.com',
    tennis: 'site:atptour.com OR site:wtatennis.com',
    mma: 'site:ufc.com OR site:espn.com/mma',
    f1: 'site:formula1.com OR site:motorsport.com',
    golf: 'site:pgatour.com OR site:espn.com/golf',
    cricket: 'site:espncricinfo.com OR site:cricbuzz.com',
  };
  
  return sportSourcesMap[sport];
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
  // Get current date/season dynamically
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentSeason = getCurrentSeasonForSport(detectSport(message) || 'football');
  
  let recency: 'hour' | 'day' | 'week' | 'month' = 'day';
  
  switch (category) {
    case 'PLAYER':
      // For player lookups - check if asking about current team/status or biography
      const playerNameMatch = query.match(/([A-Z][a-zćčšžđ]+(?:\s+[A-Z][a-zćčšžđ]+)+)|(\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b)/i);
      const asksCurrentTeam = /where (does|do|is)|gde igra|koji klub|current team|current club|plays for|koje igra/i.test(query);
      
      if (playerNameMatch) {
        const playerName = playerNameMatch[0];
        if (asksCurrentTeam) {
          // Asking about current team
          query = `"${playerName}" ${currentSeason} current team club`;
          recency = 'week';
        } else {
          // General biography question - Wikipedia is fine
          query = `"${playerName}" site:wikipedia.org athlete career biography`;
          recency = 'month';
        }
      } else {
        query += ` ${currentSeason} current team`;
        recency = 'week';
      }
      break;
      
    case 'ROSTER':
      query += ` ${currentSeason} current roster squad players`;
      recency = 'week';
      break;
      
    case 'FIXTURE':
      query += ` upcoming match schedule ${currentMonth}`;
      recency = 'day';
      break;
      
    case 'RESULT':
      query += ' final score result';
      recency = 'day';
      break;
      
    case 'STANDINGS':
      query += ` ${currentSeason} league table standings`;
      recency = 'day';
      break;
      
    case 'STATS':
      // Get sport-specific season
      const statsSport = detectSport(query) || 'football';
      const statsSeason = getCurrentSeasonForSport(statsSport);
      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      // Extract player name if mentioned
      const statsPlayerMatch = query.match(/([A-Z][a-zćčšžđ]+(?:\s+[A-Z][a-zćčšžđ]+)+)|Filip\s+\w+|(\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b)/i);
      
      // Check if asking about last game specifically (not season averages)
      const isLastGameQuery = /last (game|match)|posledn(joj|ja|ju|ji|je|eg|oj|em) (utakmic|meč)|recent game|yesterday|sinoć|jučer|juče|latest (game|match)|most recent|previous (game|match)/i.test(query);
      
      if (statsPlayerMatch) {
        const playerName = statsPlayerMatch[0];
        if (isLastGameQuery) {
          // Asking about last game specifically - search for game log/box score
          query = `${playerName} last game box score stats points rebounds assists ${today}`;
        } else {
          // Season averages - VERY explicit about current stats
          query = `${playerName} current ${statsSeason} season stats as of ${today}`;
        }
      } else {
        if (isLastGameQuery) {
          query += ` last game box score stats ${today}`;
        } else {
          query += ` ${statsSeason} season stats as of ${today}`;
        }
      }
      // Use hour recency to get the freshest data
      recency = 'hour';
      break;
      
    case 'INJURY':
      query += ` injury update ${currentMonth}`;
      recency = 'day';
      break;
      
    case 'TRANSFER':
      query += ` transfer news ${currentMonth}`;
      recency = 'day';
      break;
      
    case 'MANAGER':
      query += ' manager coach press conference';
      recency = 'day';
      break;
      
    case 'ODDS':
      query += ' betting odds';
      recency = 'day';
      break;
      
    case 'COMPARISON':
      query += ` comparison stats ${currentSeason}`;
      recency = 'week';
      break;
      
    case 'HISTORY':
      query += ' history record all time';
      recency = 'month';
      break;
      
    case 'BROADCAST':
      query += ' TV channel stream where to watch';
      recency = 'day';
      break;
      
    case 'VENUE':
      query += ' stadium venue arena';
      recency = 'month';
      break;
      
    case 'PLAYER_PROP':
      // For player prop questions - get current stats and recent performance
      const propIntent = detectBettingIntent(message);
      if (propIntent.playerMentioned) {
        query = `"${propIntent.playerMentioned}" ${currentSeason} season stats averages recent form`;
      } else {
        query += ` ${currentSeason} player stats averages`;
      }
      recency = 'day';
      break;
      
    case 'BETTING_ADVICE':
      // For betting questions - still get stats but we'll reframe the response
      const bettingIntent = detectBettingIntent(message);
      if (bettingIntent.playerMentioned) {
        query = `"${bettingIntent.playerMentioned}" ${currentSeason} season stats recent form injury`;
      } else {
        query += ` ${currentSeason} recent form stats`;
      }
      recency = 'day';
      break;
      
    case 'GENERAL':
    default:
      query += ` ${currentMonth}`;
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

    // Check authentication and credits
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          requiresAuth: true,
          message: 'Please sign in to use AI Chat'
        },
        { status: 401 }
      );
    }

    // Check chat credits
    const creditCheck = await canUserChat(session.user.id);
    
    if (!creditCheck.allowed) {
      const limit = CHAT_LIMITS[creditCheck.plan as keyof typeof CHAT_LIMITS];
      
      if (limit === 0) {
        // FREE users have no chat access
        return NextResponse.json(
          { 
            error: 'Chat not available on free plan',
            requiresUpgrade: true,
            message: 'Upgrade to Pro to access AI Chat with 50 questions per month'
          },
          { status: 403 }
        );
      }
      
      // PRO users out of credits
      return NextResponse.json(
        { 
          error: 'Chat credits exhausted',
          requiresUpgrade: true,
          remaining: 0,
          limit: creditCheck.limit,
          message: `You've used all ${creditCheck.limit} chat questions this billing period. Upgrade to Premium for unlimited access.`
        },
        { status: 403 }
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI chat is not configured' },
        { status: 503 }
      );
    }

    // Step 0: Translate non-English queries to English for better search
    const translation = await translateToEnglish(message);
    const searchMessage = translation.englishQuery; // Use English for search
    const originalLanguage = translation.originalLanguage;
    
    if (translation.needsTranslation) {
      console.log(`[AI-Chat] Original (${originalLanguage}): "${message}"`);
      console.log(`[AI-Chat] English for search: "${searchMessage}"`);
    }

    let perplexityContext = '';
    let citations: string[] = [];
    let dataLayerContext = '';
    
    // Use intelligent routing engine (with English query for better detection)
    const route = getOptimalRoute(searchMessage);
    const shouldSearch = route.shouldSearch;
    
    // Detect category for all queries (for tracking) - use English for better accuracy
    const queryCategory = detectQueryCategory(searchMessage);

    // SPECIAL HANDLING: Match Analysis Request
    // If user asks "Analyze X vs Y", call the /api/analyze endpoint
    if (queryCategory === 'MATCH_ANALYSIS') {
      const analysisIntent = detectMatchAnalysisRequest(searchMessage);
      
      if (analysisIntent.isMatchAnalysis && analysisIntent.homeTeam && analysisIntent.awayTeam) {
        console.log(`[AI-Chat] Match analysis requested: ${analysisIntent.homeTeam} vs ${analysisIntent.awayTeam}`);
        console.log(`[AI-Chat] Detected sport: ${analysisIntent.sport}`);
        console.log(`[AI-Chat] User's language: ${originalLanguage}`);
        
        const analysisResult = await performMatchAnalysis(
          analysisIntent.homeTeam,
          analysisIntent.awayTeam,
          analysisIntent.sport || 'soccer_epl',
          request
        );
        
        // Translate response back to user's language if needed
        let finalResponse = analysisResult.response;
        if (translation.needsTranslation && originalLanguage !== 'en') {
          console.log(`[AI-Chat] Translating match analysis back to ${originalLanguage}...`);
          try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const languageNames: Record<string, string> = {
              sr: 'Serbian', es: 'Spanish', de: 'German', fr: 'French',
              zh: 'Chinese (Simplified)', ja: 'Japanese', ko: 'Korean',
              ar: 'Arabic', it: 'Italian', pt: 'Portuguese', ru: 'Russian'
            };
            const targetLanguage = languageNames[originalLanguage] || originalLanguage;
            
            const translationResponse = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `You are a professional sports translator. Translate the following match analysis to ${targetLanguage}. Preserve ALL formatting (markdown, emojis, bullet points). Keep team names, player names, and technical betting terms in their original form. Make it sound natural in ${targetLanguage}.`
                },
                {
                  role: 'user',
                  content: finalResponse
                }
              ],
              temperature: 0.3,
              max_tokens: 2000
            });
            
            finalResponse = translationResponse.choices[0]?.message?.content || finalResponse;
            console.log(`[AI-Chat] ✅ Translated match analysis to ${originalLanguage}`);
          } catch (translationError) {
            console.error('[AI-Chat] Translation failed, returning English:', translationError);
            // Keep English response if translation fails
          }
        }
        
        // Increment chat credits for match analysis via chat
        await incrementChatCount(session.user.id);
        const updatedCredits = await canUserChat(session.user.id);
        
        return NextResponse.json({
          success: true,
          response: finalResponse,
          citations: [],
          usedRealTimeSearch: false,
          routingDecision: 'match-analysis',
          model: 'analyze-api',
          isMatchAnalysis: true,
          credits: {
            remaining: updatedCredits.remaining,
            limit: updatedCredits.limit,
          },
        });
      }
    }

    // Step 0: Try DataLayer first for stats/roster queries
    // This gives us accurate API data instead of web search
    // GUARDRAIL: For ANY numeric stats question, we MUST use API data, NOT LLM memory
    
    // Check if this is a verified stats query (NBA player/team stats)
    if (isStatsQuery(searchMessage)) {
      console.log('[AI-Chat] Detected stats query - using Verified NBA Stats service');
      console.log('[AI-Chat] API_FOOTBALL_KEY configured:', !!process.env.API_FOOTBALL_KEY);
      
      // Extract season from message (handles "this season", "2024-25", etc.)
      const seasonMatch = searchMessage.match(/(?:this|current|last|previous|\d{4}[-/]\d{2,4})\s*season/i);
      const seasonInput = seasonMatch ? seasonMatch[0] : undefined;
      
      // Try player stats first, then team stats
      const playerResult = await getVerifiedPlayerStats(searchMessage, seasonInput);
      
      if (playerResult.success && playerResult.data) {
        const stats = playerResult.data;
        dataLayerContext = formatVerifiedPlayerStats(stats);
        console.log(`[AI-Chat] ✅ Verified player stats: ${stats.playerFullName} - ${stats.stats.pointsPerGame} PPG (${stats.gamesPlayed} games)`);
      } else {
        console.log(`[AI-Chat] ⚠️ Verified stats failed: ${playerResult.error}`);
        // Try team stats
        const teamResult = await getVerifiedTeamStats(searchMessage, seasonInput);
        
        if (teamResult.success && teamResult.data) {
          const stats = teamResult.data;
          dataLayerContext = formatVerifiedTeamStats(stats);
          console.log(`[AI-Chat] ✅ Verified team stats: ${stats.teamFullName} - ${stats.stats.pointsPerGame} PPG`);
        } else {
          console.log(`[AI-Chat] ⚠️ Could not get verified stats: ${playerResult.error || teamResult.error}`);
        }
      }
    }
    
    // Fallback to original data router if verified stats didn't work
    if (!dataLayerContext) {
      const dataRoute = await routeToDataSource(searchMessage, queryCategory);
      console.log(`[AI-Chat] Data Router: source=${dataRoute.source}, hasData=${!!dataRoute.data}`);
      
      if (dataRoute.source === 'datalayer' && dataRoute.data) {
        // We have accurate API data - use it instead of Perplexity
        dataLayerContext = dataRoute.data;
        console.log(`[AI-Chat] Using DataLayer context: ${dataLayerContext.slice(0, 200)}...`);
      }
    }

    // Step 1: Use Perplexity for real-time search if needed
    // Skip Perplexity if we already have DataLayer context for stats
    if (shouldSearch && !dataLayerContext) {
      const perplexity = getPerplexityClient();
      
      if (perplexity.isConfigured()) {
        console.log('[AI-Chat] Fetching real-time context from Perplexity...');
        console.log(`[AI-Chat] Route decision: ${route.source} (${route.confidence}% confidence)`);
        console.log(`[AI-Chat] Reason: ${route.reason}`);
        
        // Build optimized search query using English translation
        const searchQuery = buildOptimizedSearchQuery(searchMessage, route);
        const recency = route.recency || 'week';
        
        console.log(`[AI-Chat] Category: ${queryCategory} | Source: ${route.source} | Recency: ${recency}`);
        console.log(`[AI-Chat] Optimized search query: "${searchQuery}"`);
        
        // Use higher token limit for detailed queries
        const needsMoreTokens = ['PLAYER', 'ROSTER', 'COMPARISON', 'STANDINGS', 'STATS', 'HYBRID'].includes(queryCategory) ||
                                route.source === 'HYBRID';
        
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
    } else {
      console.log(`[AI-Chat] Skipping search - GPT-only (${route.reason})`);
    }

    // Step 2: Detect brain mode and build system prompt
    // Use betting mode for betting/prop questions, otherwise auto-detect
    let brainMode: BrainMode;
    if (queryCategory === 'BETTING_ADVICE' || queryCategory === 'PLAYER_PROP') {
      brainMode = 'betting';
    } else {
      brainMode = detectChatMode(message);
    }
    
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
    
    // Calculate data confidence for the response
    const dataConfidence: DataConfidence = calculateDataConfidence({
      hasPerplexityData: !!perplexityContext,
      queryCategory: brainMode,
    });
    
    console.log(`[AI-Chat] Data Confidence: ${dataConfidence.level} (${dataConfidence.score}/100)`);
    
    const systemPrompt = buildSystemPrompt(brainMode, {
      hasRealTimeData: !!perplexityContext,
      dataConfidence,
    });
    
    // Enhance system prompt with learned knowledge
    let enhancedSystemPrompt = systemPrompt;
    if (learnedContext) {
      enhancedSystemPrompt += `\n\n${learnedContext}`;
    }
    if (sportTerminology.length > 0) {
      enhancedSystemPrompt += `\n\nSPORT TERMINOLOGY TO USE: ${sportTerminology.slice(0, 10).join(', ')}`;
    }
    
    // Add language instruction if user wrote in non-English
    if (translation.needsTranslation && originalLanguage !== 'en') {
      const languageNames: Record<string, string> = {
        'zh': 'Chinese (Simplified)',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'sr': 'Serbian/Croatian',
        'es': 'Spanish', 
        'de': 'German',
        'fr': 'French',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'unknown': 'the same language as the user'
      };
      const langName = languageNames[originalLanguage] || languageNames['unknown'];
      enhancedSystemPrompt += `\n\nIMPORTANT: The user wrote in ${langName}. RESPOND IN ${langName.toUpperCase()}, not English. Match the user's language exactly.`;
    }
    
    console.log('[AI-Chat] Brain mode:', brainMode);
    if (translation.needsTranslation) {
      console.log(`[AI-Chat] Response language: ${originalLanguage}`);
    }
    
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
    
    // Special handling for betting/player prop questions - AIXBT sharp style
    if (queryCategory === 'BETTING_ADVICE' || queryCategory === 'PLAYER_PROP') {
      const bettingIntent = detectBettingIntent(message);
      const propType = bettingIntent.detectedType;
      const player = bettingIntent.playerMentioned;
      
      // Build concise, sharp context prompt
      let analysisContext = '';
      if (bettingIntent.isPlayerProp && player) {
        analysisContext = `ANALYSIS TARGET: ${player} - ${propType || 'performance'} prop
DIRECTION: ${propType === 'over' ? 'Over line' : propType === 'under' ? 'Under line' : 'General assessment'}`;
      } else {
        analysisContext = `ANALYSIS TYPE: Match/outcome betting question
CONFIDENCE: Detected with ${bettingIntent.confidenceLevel} confidence`;
      }
      
      userContent = `${message}

${analysisContext}

${perplexityContext ? `LIVE DATA:\n${perplexityContext}` : ''}

YOUR RESPONSE STYLE:
- Lead with DATA immediately - numbers, averages, trends
- Be SHARP and SPECIFIC - no fluff, no preamble
- End with YOUR honest assessment (supports/mixed/concerning)
- Put disclaimer AT THE END: "⚠️ Analysis only, not betting advice."
- Sound like a sharp analyst, not a bot reading a script
- No walls of text - punchy paragraphs
- If the data is clear, say so confidently
- If the data is mixed, own that too

CRITICAL FOR LESSER-KNOWN PLAYERS:
- If this is NOT a superstar (lower leagues, second division, obscure teams):
- ONLY use stats from the LIVE DATA above - do NOT invent numbers
- If LIVE DATA has no stats for this player, say "I couldn't find reliable stats"
- Never guess averages or make up performance data
- Better to admit limited data than give wrong info

DO NOT:
- Start with "I understand you're asking about..." or disclaimers
- Put disclaimers at the beginning or middle - ONLY at the end
- Say "bet on this" or "I recommend"
- Invent stats for players not in your LIVE DATA
- Be wishy-washy when the data is actually clear`;
    } else if (dataLayerContext) {
      // DataLayer has accurate API data for this query - use it with high confidence
      userContent = `USER QUESTION: ${message}

═══════════════════════════════════════════════════
✅ VERIFIED DATA FROM OFFICIAL API (100% ACCURATE):
═══════════════════════════════════════════════════
${dataLayerContext}
═══════════════════════════════════════════════════

This data is from our official sports data API - it is AUTHORITATIVE and ACCURATE.
Use EXACTLY these numbers in your response. Do not modify or round them.

RESPONSE FORMAT:
- Lead with the stats directly: "This season, [Player] is averaging..."
- Include all relevant stats from the data
- Be concise and factual
- If asked about something not in the data, say you don't have that specific info`;
    } else if (perplexityContext) {
      // For STATS and PLAYER queries, be extra strict about using only real-time data
      if (queryCategory === 'STATS' || queryCategory === 'PLAYER') {
        userContent = `USER QUESTION: ${message}

🚨 CRITICAL WARNING: You are being asked about CURRENT SEASON statistics.
Your training data is from 2023 or earlier - IT IS OUTDATED AND WRONG.
You MUST use ONLY the real-time data below.

═══════════════════════════════════════════════════
VERIFIED REAL-TIME DATA (from web search just now):
═══════════════════════════════════════════════════
${perplexityContext}
═══════════════════════════════════════════════════

ABSOLUTE RULES - NO EXCEPTIONS:
1. Use ONLY the exact numbers shown in the REAL-TIME DATA above
2. If it says "24.3 PPG" then say "24.3 PPG" - do NOT change it
3. If the data doesn't include a specific stat, say "I couldn't find that specific stat"
4. NEVER use numbers from your training data - they are WRONG for current season
5. If no stats are in the real-time data, say "I couldn't find current season statistics for this player"

RESPONSE FORMAT:
- Lead with: "This season, [Player] is averaging [EXACT NUMBER FROM DATA ABOVE]..."
- Include the source if mentioned in the data
- Be brief and factual

FORBIDDEN:
- Making up numbers
- Using "around", "approximately", "typically" for stats
- Citing your training data for current stats
- Saying different numbers than what's in the real-time data`;
      } else {
        userContent = `USER QUESTION: ${message}

REAL-TIME SPORTS DATA (from web search, use this for your answer):
${perplexityContext}

IMPORTANT: Use ONLY the real-time data above for current season stats and recent information. Your training data may be outdated. If the data doesn't have what the user needs, acknowledge that and share what you do have.

Please answer the user's question using the real-time data above. Cite sources if relevant.`;
      }
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
    const usedDataLayer = !!dataLayerContext;
    const usedPerplexity = !!perplexityContext;
    
    trackQuery({
      query: message,
      category: queryCategory,
      brainMode,
      sport: detectSport(message),
      usedRealTimeSearch: usedPerplexity || usedDataLayer,
      responseLength: response.length,
      hadCitations: citations.length > 0,
      userId: session.user.id,
    }).catch(err => console.error('[AI-Chat] Memory tracking failed:', err));

    // Save to knowledge base for learning (async, don't block response)
    // Only save substantial answers with real-time data
    saveKnowledge({
      question: message,
      answer: response,
      sport: detectSport(message),
      category: queryCategory,
      hadRealTimeData: usedPerplexity || usedDataLayer,
      citations,
    }).catch(err => console.error('[AI-Chat] Knowledge save failed:', err));

    // Increment chat credits (after successful response)
    await incrementChatCount(session.user.id);

    // Determine routing decision for response metadata
    let routingDecision = 'gpt-only';
    let model = 'gpt-4o-mini';
    if (usedDataLayer) {
      routingDecision = 'datalayer+gpt';
      model = 'gpt-4o-mini + api-sports';
    } else if (usedPerplexity) {
      routingDecision = 'perplexity+gpt';
      model = 'gpt-4o-mini + sonar-pro';
    }

    // Get updated credits for response
    const updatedCredits = await canUserChat(session.user.id);

    return NextResponse.json({
      success: true,
      response,
      citations,
      usedRealTimeSearch: usedPerplexity || usedDataLayer,
      usedDataLayer,
      routingDecision,
      model,
      credits: {
        remaining: updatedCredits.remaining,
        limit: updatedCredits.limit,
      },
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
