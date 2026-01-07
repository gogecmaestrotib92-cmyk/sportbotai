/**
 * AI Chat API - STREAMING VERSION
 * 
 * Same logic as the main ai-chat endpoint but streams the response
 * for a more responsive UX.
 * 
 * Features:
 * - Response streaming (SSE)
 * - Query caching (category-based TTL)
 * - Multi-language support
 * - Tier-based rate limiting
 * - Favorite team context
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPerplexityClient } from '@/lib/perplexity';
import { detectChatMode, buildSystemPrompt, type BrainMode } from '@/lib/sportbot-brain';
import { trackQuery, getCachedAnswer, shouldSkipCache } from '@/lib/sportbot-memory';
import { saveKnowledge, buildLearnedContext, getTerminologyForSport } from '@/lib/sportbot-knowledge';
import { cacheGet, cacheSet, CACHE_KEYS, hashChatQuery, getChatTTL } from '@/lib/cache';
import { checkChatRateLimit, getClientIp, CHAT_RATE_LIMITS } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';
import { normalizeSport } from '@/lib/data-layer/bridge';
import { getUnifiedMatchData, type MatchIdentifier } from '@/lib/unified-match-service';
// Verified stats imports for all sports
import { isStatsQuery, getVerifiedPlayerStats, formatVerifiedPlayerStats } from '@/lib/verified-nba-stats';
import { isNFLStatsQuery, getVerifiedNFLPlayerStats, formatVerifiedNFLPlayerStats } from '@/lib/verified-nfl-stats';
import { isNHLStatsQuery, getVerifiedNHLPlayerStats, formatVerifiedNHLPlayerStats } from '@/lib/verified-nhl-stats';
import { isSoccerStatsQuery, getVerifiedSoccerPlayerStats, formatVerifiedSoccerPlayerStats } from '@/lib/verified-soccer-stats';
import { isEuroleagueStatsQuery, getVerifiedEuroleaguePlayerStats, formatVerifiedEuroleaguePlayerStats } from '@/lib/verified-euroleague-stats';
// Team match statistics (shots, corners per game, etc.)
import { isTeamMatchStatsQuery, getVerifiedTeamMatchStats, getOpponentAnalysis, formatTeamMatchStatsContext } from '@/lib/verified-team-match-stats';

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
// HELPER FUNCTIONS (simplified from main route)
// ============================================

/**
 * Strip markdown formatting from AI responses
 * Removes bold (**text**), headers (##), and other markdown syntax
 */
function stripMarkdown(text: string): string {
  return text
    // Remove bold/italic markers: **text** or __text__ or *text* or _text_
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove headers: ## text or ### text
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bullet points that look like markdown lists
    .replace(/^\s*[-*]\s+/gm, '• ')
    // Clean up any double spaces
    .replace(/  +/g, ' ')
    .trim();
}

/**
 * Detect if message is non-English and translate for better search results
 */
async function translateToEnglish(message: string): Promise<{
  originalLanguage: string;
  englishQuery: string;
  needsTranslation: boolean;
}> {
  const hasNonAscii = /[^\x00-\x7F]/.test(message);
  const hasCyrillic = /[\u0400-\u04FF]/.test(message);
  // Note: removed 'was', 'wo', 'match' as they are also common English words
  const hasCommonNonEnglish = /\b(je|da|li|sta|šta|što|kako|koliko|gdje|gde|kada|zašto|porque|qué|cómo|cuándo|dónde|wie|wann|warum|où|quand|pourquoi|comment|combien)\b/i.test(message);
  
  if (!hasNonAscii && !hasCyrillic && !hasCommonNonEnglish) {
    return { originalLanguage: 'en', englishQuery: message, needsTranslation: false };
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Translate to English. Keep player/team names intact. Return ONLY the translation.`
        },
        { role: 'user', content: message }
      ],
      max_tokens: 200,
      temperature: 0.1,
    });
    
    const englishQuery = response.choices[0]?.message?.content?.trim() || message;
    
    let originalLanguage = 'unknown';
    if (hasCyrillic || /\b(je|da|li|koliko|postigao|utakmic)\b/i.test(message)) {
      originalLanguage = 'sr';
    } else if (/\b(como|foi|sua|jogo|partida|entre|análise|você|quando|onde|quem)\b/i.test(message)) {
      // Portuguese detection - check before Spanish as they share some words
      originalLanguage = 'pt';
    } else if (/\b(porque|qué|cómo|goles|cuántos|partido|jugador)\b/i.test(message)) {
      originalLanguage = 'es';
    } else if (/\b(wie|wann|warum|spiel|spielen|mannschaft|gegen)\b/i.test(message)) {
      // Note: removed "was" and "wo" as they conflict with English words
      originalLanguage = 'de';
    } else if (/\b(où|quand|pourquoi|combien|joueur|équipe)\b/i.test(message)) {
      // Note: removed "match" as it's also English
      originalLanguage = 'fr';
    }
    
    return { originalLanguage, englishQuery, needsTranslation: true };
  } catch {
    return { originalLanguage: 'unknown', englishQuery: message, needsTranslation: false };
  }
}

type QueryCategory = 'PLAYER' | 'ROSTER' | 'FIXTURE' | 'RESULT' | 'STANDINGS' | 'STATS' | 
  'INJURY' | 'TRANSFER' | 'MANAGER' | 'ODDS' | 'COMPARISON' | 'HISTORY' | 'BROADCAST' | 
  'VENUE' | 'PLAYER_PROP' | 'BETTING_ADVICE' | 'OUR_PREDICTION' | 'GENERAL';

function detectQueryCategory(message: string): QueryCategory {
  const msg = message.toLowerCase();
  
  // Check if asking about OUR prediction/analysis first
  if (/\b(your|sua|vaš[ae]?|sportbot|our)\b.*\b(analysis|prediction|previsão|prognos|analiz|call|tip)\b/i.test(msg) ||
      /\b(how did you|como foi|kako si|what did you predict|šta si predvideo)\b/i.test(msg) ||
      /\b(your pre.?match|your pre.?game|nossa análise)\b/i.test(msg)) {
    return 'OUR_PREDICTION';
  }
  
  // Betting patterns
  if (/should i bet|over|under|plus|minus|prop|parlay|odds|spread|line/i.test(msg)) {
    if (/player|points|rebounds|assists|pts|reb|ast/i.test(msg)) {
      return 'PLAYER_PROP';
    }
    return 'BETTING_ADVICE';
  }
  
  if (/who (plays|is|are)|roster|squad|lineup/i.test(msg)) return 'ROSTER';
  if (/when (is|does)|next (game|match)|schedule/i.test(msg)) return 'FIXTURE';
  if (/score|result|won|lost|beat/i.test(msg)) return 'RESULT';
  if (/standings|table|position|rank/i.test(msg)) return 'STANDINGS';
  if (/stats|statistics|goals|assists|points|average/i.test(msg)) return 'STATS';
  if (/injur|fit|available|out|miss/i.test(msg)) return 'INJURY';
  if (/transfer|sign|rumor|buy|sell/i.test(msg)) return 'TRANSFER';
  if (/manager|coach|boss|press conference/i.test(msg)) return 'MANAGER';
  if (/odds|favorite|underdog|market/i.test(msg)) return 'ODDS';
  if (/vs|versus|compare|better/i.test(msg)) return 'COMPARISON';
  if (/history|all.time|record|ever/i.test(msg)) return 'HISTORY';
  if (/watch|channel|tv|stream/i.test(msg)) return 'BROADCAST';
  if (/stadium|venue|arena/i.test(msg)) return 'VENUE';
  if (/where (does|is).*play|who is/i.test(msg)) return 'PLAYER';
  
  return 'GENERAL';
}

function needsSearch(message: string): boolean {
  // Static knowledge that GPT knows well - no need for real-time search
  const gptOnlyPatterns = [
    // Rules and basic knowledge
    /what (is|are) (offside|a foul|the rules|handball)/i,
    /rules of (football|soccer|basketball)/i,
    /how many players/i,
    
    // Greetings and meta
    /^(hello|hi|hey|thanks|thank you|bye|ok)[\s!?.]*$/i,
    /^(who are you|what can you do|help)[\s!?.]*$/i,
    
    // Player biography & team affiliation (stable data, 10-11 month seasons)
    // "where does X play", "which team does X play for", "who is X"
    /where does .+ play/i,
    /which (team|club) does .+ play/i,
    /what (team|club) does .+ play/i,
    /who (is|plays for) .+ (player|goalkeeper|striker|midfielder|defender)/i,
    /^who is [A-Z][a-z]+ [A-Z][a-z]+\??$/i,  // "Who is Erling Haaland?"
    /tell me about .+ (player|career|biography)/i,
    /(biography|bio|profile) of/i,
    /what position does .+ play/i,
    /what nationality is/i,
    /how old is .+ (player)?/i,
    /when was .+ born/i,
    /where was .+ born/i,
    /how tall is/i,
    /what number does .+ wear/i,
    
    // Historical facts (won't change)
    /who won .+ (in|back in) \d{4}/i,
    /who won the \d{4}/i,
    /(world cup|champions league|euro) winner(s)? (in )?\d{4}/i,
    /all.?time .+ (scorer|record|leader)/i,
    /most .+ in history/i,
  ];
  
  for (const pattern of gptOnlyPatterns) {
    if (pattern.test(message)) {
      console.log('[AI-Chat] Skipping search - GPT can handle:', message.slice(0, 50));
      return false;
    }
  }
  
  return true;
}

function detectSport(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (/football|soccer|premier league|la liga|serie a|bundesliga|champions league/i.test(lower)) return 'football';
  if (/basketball|nba|euroleague|lakers|celtics|warriors/i.test(lower)) return 'basketball';
  if (/hockey|nhl|bruins|rangers|oilers|maple leafs|penguins|lightning|avalanche/i.test(lower)) return 'hockey';
  if (/tennis|atp|wta|wimbledon|nadal|djokovic/i.test(lower)) return 'tennis';
  if (/nfl|american football|quarterback|touchdown|super bowl/i.test(lower)) return 'american_football';
  return undefined;
}

/**
 * Check if query is asking for standings/table data
 */
function isStandingsQuery(message: string): boolean {
  return /standings|table|position|rank|leading|who('s| is) (first|top|leading)|conference|division|league.*leader/i.test(message);
}

/**
 * Detect which league standings are being asked about
 */
function detectStandingsLeague(message: string): { sport: string; league: number; season: string; leagueName: string } | null {
  const lower = message.toLowerCase();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // NHL - season runs Oct-June
  if (/nhl|hockey|bruins|rangers|oilers|maple leafs|penguins|lightning|avalanche|panthers|canucks|jets|flames|senators|devils|hurricanes|islanders|kings|ducks|sharks|kraken|wild|stars|blues|predators|blackhawks|red wings|sabres|flyers|capitals|blue jackets/i.test(lower)) {
    const season = month >= 9 ? year : year - 1;
    return { sport: 'hockey', league: 57, season: String(season), leagueName: 'NHL' };
  }
  
  // NBA - season runs Oct-June
  if (/nba|basketball|lakers|celtics|warriors|heat|bucks|nets|knicks|76ers|sixers|clippers|suns|nuggets|mavericks|grizzlies|timberwolves|cavaliers|bulls|hawks|raptors|pacers|magic|hornets|wizards|pistons|thunder|trail blazers|jazz|kings|spurs|pelicans|rockets/i.test(lower)) {
    const season = month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    return { sport: 'basketball', league: 12, season, leagueName: 'NBA' };
  }
  
  // NFL - season runs Sep-Feb
  if (/nfl|american football|chiefs|eagles|bills|cowboys|dolphins|ravens|bengals|49ers|lions|seahawks|packers|vikings|steelers|chargers|broncos|raiders|commanders|giants|jets|patriots|titans|jaguars|colts|texans|browns|bears|saints|buccaneers|falcons|panthers|cardinals|rams/i.test(lower)) {
    const season = month >= 8 ? year : year - 1;
    return { sport: 'nfl', league: 1, season: String(season), leagueName: 'NFL' };
  }
  
  // Premier League
  if (/premier league|epl|english|arsenal|chelsea|liverpool|man(chester)? (city|united)|tottenham|newcastle|west ham|aston villa|brighton|fulham|bournemouth|wolves|crystal palace|nottingham|brentford|everton|luton|burnley|sheffield/i.test(lower)) {
    const season = month >= 7 ? year : year - 1;
    return { sport: 'soccer', league: 39, season: String(season), leagueName: 'Premier League' };
  }
  
  // La Liga
  if (/la liga|spanish|real madrid|barcelona|atletico|sevilla|villarreal|sociedad|betis|athletic bilbao|valencia|osasuna|girona|getafe|celta|mallorca|rayo|cadiz|almeria|granada|las palmas/i.test(lower)) {
    const season = month >= 7 ? year : year - 1;
    return { sport: 'soccer', league: 140, season: String(season), leagueName: 'La Liga' };
  }
  
  // Serie A
  if (/serie a|italian|juventus|inter|milan|napoli|roma|lazio|atalanta|fiorentina|bologna|torino|monza|udinese|sassuolo|empoli|verona|cagliari|lecce|genoa|salernitana|frosinone/i.test(lower)) {
    const season = month >= 7 ? year : year - 1;
    return { sport: 'soccer', league: 135, season: String(season), leagueName: 'Serie A' };
  }
  
  // Bundesliga
  if (/bundesliga|german|bayern|dortmund|leverkusen|leipzig|frankfurt|wolfsburg|freiburg|hoffenheim|mainz|union berlin|koln|werder|gladbach|stuttgart|augsburg|bochum|heidenheim|darmstadt/i.test(lower)) {
    const season = month >= 7 ? year : year - 1;
    return { sport: 'soccer', league: 78, season: String(season), leagueName: 'Bundesliga' };
  }
  
  // Ligue 1
  if (/ligue 1|french|psg|paris saint.germain|marseille|monaco|lyon|lille|nice|lens|rennes|toulouse|montpellier|reims|strasbourg|nantes|lorient|metz|clermont|brest|le havre/i.test(lower)) {
    const season = month >= 7 ? year : year - 1;
    return { sport: 'soccer', league: 61, season: String(season), leagueName: 'Ligue 1' };
  }
  
  return null;
}

/**
 * Fetch standings from our API and format for context
 */
async function fetchStandingsContext(message: string): Promise<{ context: string; leagueName: string } | null> {
  const leagueInfo = detectStandingsLeague(message);
  if (!leagueInfo) {
    console.log('[AI-Chat-Stream] Could not detect league for standings query');
    return null;
  }
  
  console.log(`[AI-Chat-Stream] Fetching ${leagueInfo.leagueName} standings (season ${leagueInfo.season})...`);
  
  try {
    // Call our internal standings API
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const url = new URL('/api/standings', baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
    url.searchParams.set('sport', leagueInfo.sport);
    url.searchParams.set('league', String(leagueInfo.league));
    url.searchParams.set('season', leagueInfo.season);
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('[AI-Chat-Stream] Standings API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    if (!data.success || !data.data?.standings) {
      console.error('[AI-Chat-Stream] Standings API returned no data');
      return null;
    }
    
    const standings = data.data.standings;
    const league = data.data.league;
    
    // Format standings into context string
    let context = `=== VERIFIED ${league.name.toUpperCase()} STANDINGS (${league.season} Season) ===\n`;
    context += `Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\n`;
    
    // For basketball/hockey/NFL, show wins-losses instead of points
    const isPointsBased = leagueInfo.sport === 'soccer';
    
    if (isPointsBased) {
      context += 'Pos | Team | P | W | D | L | GD | Pts\n';
      context += '-'.repeat(50) + '\n';
    } else {
      context += 'Pos | Team | W | L | Streak\n';
      context += '-'.repeat(40) + '\n';
    }
    
    // Show top standings (or all for NHL/NBA with divisions)
    const maxToShow = 32; // Show all teams for major leagues
    for (const team of standings.slice(0, maxToShow)) {
      if (isPointsBased) {
        context += `${team.position}. ${team.teamName} | ${team.played} | ${team.won} | ${team.drawn} | ${team.lost} | ${team.goalDiff > 0 ? '+' : ''}${team.goalDiff} | ${team.points}\n`;
      } else {
        const streak = team.form ? team.form.slice(0, 5) : 'N/A';
        context += `${team.position}. ${team.teamName} | ${team.won}-${team.lost} | ${streak}\n`;
      }
    }
    
    if (standings.length > maxToShow) {
      context += `\n... and ${standings.length - maxToShow} more teams`;
    }
    
    console.log(`[AI-Chat-Stream] ✅ Got ${standings.length} teams for ${leagueInfo.leagueName}`);
    return { context, leagueName: leagueInfo.leagueName };
  } catch (error) {
    console.error('[AI-Chat-Stream] Error fetching standings:', error);
    return null;
  }
}

// ============================================
// DATA LAYER INTEGRATION
// ============================================

/**
 * Check if query needs structured stats from DataLayer
 */
function needsDataLayerStats(message: string, category: QueryCategory): boolean {
  // Categories that benefit from DataLayer stats
  const statCategories: QueryCategory[] = ['STATS', 'COMPARISON', 'BETTING_ADVICE', 'PLAYER_PROP', 'RESULT', 'STANDINGS'];
  if (statCategories.includes(category)) return true;
  
  // Patterns that suggest form/H2H needs
  const statsPatterns = [
    /form|streak|recent (games|matches|results)/i,
    /head.to.head|h2h|vs|versus/i,
    /win.?loss|record|standing/i,
    /(how|what).*(doing|performing|playing)/i,
    /compare|better|worse/i,
    /over|under|points|goals|score/i,
    /last \d+ (games|matches)/i,
  ];
  
  return statsPatterns.some(p => p.test(message));
}

/**
 * Fetch SportBot's past prediction for a specific match
 */
async function fetchOurPrediction(message: string): Promise<string> {
  try {
    // Extract team names and date from the message
    const teams = extractTeamNames(message);
    
    // Try to extract date from message
    const datePatterns = [
      /(\d{1,2})[\s/.-](?:de\s+)?(\w+)[\s/.-](\d{4})/i,  // "01 de janeiro de 2026" or "01/01/2026"
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i,  // "January 1, 2026"
      /(\d{4})[\s/.-](\d{1,2})[\s/.-](\d{1,2})/i,  // "2026-01-01"
    ];
    
    let targetDate: Date | null = null;
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        // Try to parse the date
        const dateStr = match[0];
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
          break;
        }
      }
    }
    
    if (!teams.homeTeam && !teams.awayTeam) {
      return '';  // Can't identify the match
    }
    
    // Search for predictions matching the teams
    const searchTerms = [teams.homeTeam, teams.awayTeam].filter(Boolean);
    
    // Build OR conditions for fuzzy matching
    const predictions = await prisma.prediction.findMany({
      where: {
        OR: searchTerms.map(term => ({
          matchName: { contains: term, mode: 'insensitive' }
        })),
        ...(targetDate ? {
          kickoff: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lte: new Date(targetDate.setHours(23, 59, 59, 999)),
          }
        } : {}),
      },
      orderBy: { kickoff: 'desc' },
      take: 5,
    });
    
    if (predictions.length === 0) {
      return `⚠️ NO PREDICTION FOUND: SportBot does not have a stored analysis for this match. Say: "I don't have a pre-match analysis stored for that game."`;
    }
    
    // Format predictions for context
    let context = '=== SPORTBOT\'S PAST PREDICTIONS ===\n';
    for (const pred of predictions) {
      const outcomeEmoji = pred.outcome === 'HIT' ? '✅' : pred.outcome === 'MISS' ? '❌' : '⏳';
      context += `\nMatch: ${pred.matchName}`;
      context += `\nDate: ${pred.kickoff.toLocaleDateString()}`;
      context += `\nOur Prediction: ${pred.prediction}`;
      context += `\nReasoning: ${pred.reasoning}`;
      context += `\nConviction: ${pred.conviction}/10`;
      context += `\nOutcome: ${outcomeEmoji} ${pred.outcome}`;
      if (pred.actualResult) {
        context += `\nActual Result: ${pred.actualResult}`;
      }
      context += '\n---';
    }
    
    return context;
  } catch (error) {
    console.error('[AI-Chat] Error fetching our prediction:', error);
    return '';
  }
}

/**
 * Extract team names from message for DataLayer lookup
 */
function extractTeamNames(message: string): { homeTeam?: string; awayTeam?: string } {
  // Common team patterns
  const vsPattern = /([A-Z][a-zA-Z\s]+?)\s+(?:vs?\.?|versus|@)\s+([A-Z][a-zA-Z\s]+)/i;
  const match = message.match(vsPattern);
  
  if (match) {
    return {
      homeTeam: match[1].trim(),
      awayTeam: match[2].trim(),
    };
  }
  
  // NBA team names
  const nbaTeams = [
    'Lakers', 'Celtics', 'Warriors', 'Heat', 'Bucks', 'Nets', 'Knicks', '76ers', 'Sixers',
    'Clippers', 'Suns', 'Nuggets', 'Mavericks', 'Mavs', 'Grizzlies', 'Timberwolves', 'Wolves',
    'Cavaliers', 'Cavs', 'Bulls', 'Hawks', 'Raptors', 'Pacers', 'Magic', 'Hornets', 'Wizards',
    'Pistons', 'Thunder', 'Trail Blazers', 'Blazers', 'Jazz', 'Kings', 'Spurs', 'Pelicans', 'Rockets'
  ];
  
  // NHL teams
  const nhlTeams = [
    'Maple Leafs', 'Canadiens', 'Bruins', 'Rangers', 'Penguins', 'Blackhawks', 'Red Wings',
    'Oilers', 'Flames', 'Canucks', 'Jets', 'Senators', 'Lightning', 'Panthers', 'Avalanche',
    'Golden Knights', 'Kraken', 'Stars', 'Blues', 'Wild', 'Predators', 'Hurricanes', 'Devils'
  ];
  
  // NFL teams
  const nflTeams = [
    'Chiefs', 'Eagles', 'Bills', 'Cowboys', 'Dolphins', 'Ravens', 'Bengals', '49ers', 'Niners',
    'Lions', 'Seahawks', 'Packers', 'Vikings', 'Steelers', 'Chargers', 'Broncos', 'Raiders',
    'Commanders', 'Giants', 'Jets', 'Patriots', 'Titans', 'Jaguars', 'Colts', 'Texans',
    'Browns', 'Bears', 'Saints', 'Buccaneers', 'Bucs', 'Falcons', 'Panthers', 'Cardinals', 'Rams'
  ];
  
  // Soccer teams (common)
  const soccerTeams = [
    'Manchester United', 'Man United', 'Man Utd', 'Liverpool', 'Arsenal', 'Chelsea', 'Man City',
    'Manchester City', 'Tottenham', 'Spurs', 'Newcastle', 'West Ham', 'Aston Villa', 'Brighton',
    'Real Madrid', 'Barcelona', 'Barca', 'Atletico Madrid', 'Bayern Munich', 'Bayern', 'Dortmund',
    'PSG', 'Paris Saint-Germain', 'Juventus', 'Juve', 'Inter Milan', 'AC Milan', 'Napoli'
  ];
  
  const allTeams = [...nbaTeams, ...nhlTeams, ...nflTeams, ...soccerTeams];
  const foundTeams: string[] = [];
  
  for (const team of allTeams) {
    if (new RegExp(`\\b${team}\\b`, 'i').test(message)) {
      foundTeams.push(team);
    }
  }
  
  if (foundTeams.length >= 2) {
    return { homeTeam: foundTeams[0], awayTeam: foundTeams[1] };
  } else if (foundTeams.length === 1) {
    return { homeTeam: foundTeams[0] };
  }
  
  return {};
}

/**
 * Fetch stats from DataLayer and format for chat context
 */
async function fetchDataLayerContext(
  teams: { homeTeam?: string; awayTeam?: string },
  sport: string | undefined
): Promise<string> {
  if (!teams.homeTeam || !sport) return '';
  
  try {
    const sportKey = sport === 'football' ? 'soccer' : 
                     sport === 'american_football' ? 'american_football' :
                     sport;
    
    // If we have two teams, get matchup data via Unified Service
    if (teams.awayTeam) {
      const matchId: MatchIdentifier = {
        homeTeam: teams.homeTeam,
        awayTeam: teams.awayTeam,
        sport: sportKey,
      };
      
      const unifiedData = await getUnifiedMatchData(matchId, { includeOdds: false });
      const data = unifiedData.enrichedData;
      
      if (data.dataSource === 'UNAVAILABLE') return '';
      
      let context = '\\n\\n=== STRUCTURED STATS (DataLayer) ===\\n';
      
      // Home team form
      if (data.homeForm && data.homeForm.length > 0) {
        context += `\\n${teams.homeTeam} Recent Form: `;
        context += data.homeForm.slice(0, 5).map(m => m.result).join('');
        context += ` (${data.homeForm.filter(m => m.result === 'W').length}W-${data.homeForm.filter(m => m.result === 'L').length}L last ${data.homeForm.length})`;
      }
      
      // Away team form
      if (data.awayForm && data.awayForm.length > 0) {
        context += `\\n${teams.awayTeam} Recent Form: `;
        context += data.awayForm.slice(0, 5).map(m => m.result).join('');
        context += ` (${data.awayForm.filter(m => m.result === 'W').length}W-${data.awayForm.filter(m => m.result === 'L').length}L last ${data.awayForm.length})`;
      }
      
      // Season stats
      if (data.homeStats) {
        context += `\\n${teams.homeTeam} Season: ${data.homeStats.wins}W-${data.homeStats.losses}L`;
        if (data.homeStats.draws) context += `-${data.homeStats.draws}D`;
        context += ` | Scored: ${data.homeStats.goalsScored}, Conceded: ${data.homeStats.goalsConceded}`;
      }
      
      if (data.awayStats) {
        context += `\\n${teams.awayTeam} Season: ${data.awayStats.wins}W-${data.awayStats.losses}L`;
        if (data.awayStats.draws) context += `-${data.awayStats.draws}D`;
        context += ` | Scored: ${data.awayStats.goalsScored}, Conceded: ${data.awayStats.goalsConceded}`;
      }
      
      // H2H summary
      if (data.h2hSummary && data.h2hSummary.totalMatches > 0) {
        context += `\\nHead-to-Head (${data.h2hSummary.totalMatches} games): `;
        context += `${teams.homeTeam} ${data.h2hSummary.homeWins}W - ${data.h2hSummary.draws}D - ${data.h2hSummary.awayWins}W ${teams.awayTeam}`;
      }
      
      context += '\\n';
      return context;
    }
    
    // Single team - just get their form/stats (would need a different endpoint)
    return '';
    
  } catch (error) {
    console.error('[AI-Chat] DataLayer fetch error:', error);
    return '';
  }
}

// ============================================
// SMART FOLLOW-UP SUGGESTIONS
// ============================================

/**
 * Extract entities from text - teams, players, leagues, topics
 */
function extractEntities(text: string): { 
  teams: string[]; 
  players: string[]; 
  leagues: string[];
  topics: string[];
} {
  const teams: string[] = [];
  const players: string[] = [];
  const leagues: string[] = [];
  const topics: string[] = [];
  
  // Known teams (major leagues)
  const knownTeams: Record<string, string[]> = {
    soccer: ['Manchester United', 'Man United', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City', 'Man City', 'Tottenham', 'Spurs', 'Newcastle', 'West Ham', 'Aston Villa', 'Brighton', 'Real Madrid', 'Barcelona', 'Barca', 'Atletico Madrid', 'Bayern Munich', 'Bayern', 'Dortmund', 'Borussia Dortmund', 'PSG', 'Paris Saint-Germain', 'Juventus', 'Juve', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma', 'Lazio'],
    basketball: ['Lakers', 'Celtics', 'Warriors', 'Heat', 'Bucks', 'Nets', 'Knicks', '76ers', 'Sixers', 'Clippers', 'Suns', 'Nuggets', 'Mavericks', 'Mavs', 'Grizzlies', 'Timberwolves', 'Cavaliers', 'Bulls', 'Hawks', 'Raptors', 'Pelicans', 'Thunder', 'Kings', 'Spurs'],
    nfl: ['Chiefs', 'Eagles', 'Bills', 'Cowboys', 'Dolphins', 'Ravens', 'Bengals', '49ers', 'Niners', 'Lions', 'Seahawks', 'Packers', 'Vikings', 'Steelers', 'Chargers', 'Broncos', 'Raiders', 'Patriots', 'Titans', 'Texans', 'Browns', 'Bears', 'Saints', 'Buccaneers', 'Falcons', 'Cardinals', 'Rams'],
  };
  
  // Known leagues
  const knownLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'UCL', 'Europa League', 'NBA', 'NFL', 'NHL', 'MLS', 'EuroLeague'];
  
  // Known players (sample - expand as needed)
  const knownPlayers = ['Haaland', 'Salah', 'Mbappe', 'Mbappé', 'Messi', 'Ronaldo', 'Kane', 'Bellingham', 'Vinicius', 'Saka', 'Palmer', 'LeBron', 'Curry', 'Durant', 'Giannis', 'Luka', 'Jokic', 'Tatum', 'Edwards', 'Mahomes', 'Hurts', 'Allen', 'Burrow', 'Lamar'];
  
  const lowerText = text.toLowerCase();
  
  // Find teams
  for (const sportTeams of Object.values(knownTeams)) {
    for (const team of sportTeams) {
      if (lowerText.includes(team.toLowerCase())) {
        teams.push(team);
      }
    }
  }
  
  // Find leagues
  for (const league of knownLeagues) {
    if (lowerText.includes(league.toLowerCase())) {
      leagues.push(league);
    }
  }
  
  // Find players
  for (const player of knownPlayers) {
    if (lowerText.includes(player.toLowerCase())) {
      players.push(player);
    }
  }
  
  // Extract topics from the conversation
  const topicPatterns = [
    { pattern: /injur|hurt|out|miss|sidelined/i, topic: 'injuries' },
    { pattern: /transfer|sign|buy|sell|rumor/i, topic: 'transfers' },
    { pattern: /form|streak|win|los|recent/i, topic: 'form' },
    { pattern: /goal|scor|point|stat/i, topic: 'stats' },
    { pattern: /lineup|squad|roster|team sheet/i, topic: 'lineup' },
    { pattern: /predict|odds|bet|value/i, topic: 'predictions' },
    { pattern: /stand|table|position|rank/i, topic: 'standings' },
    { pattern: /next|upcoming|fixture|schedule/i, topic: 'fixtures' },
    { pattern: /head.to.head|h2h|history|vs/i, topic: 'h2h' },
  ];
  
  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(text)) {
      topics.push(topic);
    }
  }
  
  return {
    teams: Array.from(new Set(teams)).slice(0, 3),
    players: Array.from(new Set(players)).slice(0, 2),
    leagues: Array.from(new Set(leagues)).slice(0, 2),
    topics: Array.from(new Set(topics)).slice(0, 3),
  };
}

/**
 * Generate AI-powered contextual follow-ups based on the conversation
 */
async function generateSmartFollowUps(
  question: string,
  answer: string,
  category: QueryCategory,
  sport: string | undefined
): Promise<string[]> {
  try {
    // Extract entities from both Q&A
    const qEntities = extractEntities(question);
    const aEntities = extractEntities(answer);
    
    // Merge entities, prioritizing from question
    const teams = Array.from(new Set([...qEntities.teams, ...aEntities.teams])).slice(0, 3);
    const players = Array.from(new Set([...qEntities.players, ...aEntities.players])).slice(0, 2);
    const leagues = Array.from(new Set([...qEntities.leagues, ...aEntities.leagues])).slice(0, 2);
    const topics = Array.from(new Set([...qEntities.topics, ...aEntities.topics])).slice(0, 3);
    
    // Build context summary for GPT
    const contextParts: string[] = [];
    if (teams.length > 0) contextParts.push(`Teams: ${teams.join(', ')}`);
    if (players.length > 0) contextParts.push(`Players: ${players.join(', ')}`);
    if (leagues.length > 0) contextParts.push(`Leagues: ${leagues.join(', ')}`);
    if (topics.length > 0) contextParts.push(`Topics: ${topics.join(', ')}`);
    
    // Use GPT to generate smart follow-ups
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Generate 3 natural follow-up questions based on this sports conversation. 
Rules:
- Questions must be DIRECTLY related to the entities and topics discussed
- Use specific team/player names from the conversation
- Each question should explore a different angle (stats, news, predictions, comparisons, etc.)
- Questions should feel like what a curious fan would naturally ask next
- Keep questions short (under 10 words ideally)
- No generic questions - be specific to the conversation
- Return ONLY a JSON array of 3 strings, nothing else

Example good follow-ups for "Liverpool vs Arsenal":
["Liverpool's injury list for this match?", "Head to head record last 5 games?", "Who's the top scorer between these two?"]

Example bad follow-ups (too generic):
["What teams are playing?", "Tell me more", "Any other news?"]`
        },
        {
          role: 'user',
          content: `Question: "${question}"
Answer summary: "${answer.slice(0, 500)}..."
${contextParts.length > 0 ? `Context: ${contextParts.join(' | ')}` : ''}
Category: ${category}
${sport ? `Sport: ${sport}` : ''}

Generate 3 specific follow-up questions:`
        }
      ],
      max_tokens: 150,
      temperature: 0.8,
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    // Parse JSON array from response
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3).map(q => String(q).replace(/^\d+\.\s*/, '').trim());
      }
    } catch {
      // If JSON parse fails, try to extract questions manually
      const lines = content.split('\n').filter(l => l.trim());
      const questions = lines
        .map(l => l.replace(/^[\d\-\*\.]+\s*/, '').replace(/^["']|["']$/g, '').trim())
        .filter(l => l.length > 10 && l.includes('?'));
      if (questions.length > 0) {
        return questions.slice(0, 3);
      }
    }
    
    // Fallback to rule-based if GPT fails
    return generateFallbackFollowUps(teams, players, topics, category, sport);
    
  } catch (error) {
    console.error('[AI-Chat] Follow-up generation error:', error);
    return generateFallbackFollowUps([], [], [], category, sport);
  }
}

/**
 * Fallback rule-based follow-ups when GPT fails
 */
function generateFallbackFollowUps(
  teams: string[],
  players: string[],
  topics: string[],
  category: QueryCategory,
  sport: string | undefined
): string[] {
  const suggestions: string[] = [];
  const team = teams[0];
  const player = players[0];
  
  if (team && teams[1]) {
    suggestions.push(
      `${team} vs ${teams[1]} head to head?`,
      `Key injuries for ${team}?`,
      `Who's favored in this match?`
    );
  } else if (team) {
    suggestions.push(
      `${team} recent form?`,
      `${team} next fixture?`,
      `${team} top performers?`
    );
  } else if (player) {
    suggestions.push(
      `${player} stats this season?`,
      `${player} recent performances?`,
      `${player} injury status?`
    );
  } else {
    // Sport-specific defaults
    if (sport === 'football' || sport === 'soccer') {
      suggestions.push('Premier League standings?', 'Champions League results?', 'Top scorers this week?');
    } else if (sport === 'basketball') {
      suggestions.push('NBA standings?', 'Top performers tonight?', 'Injury updates?');
    } else {
      suggestions.push('Latest sports news?', 'Today\'s top matches?', 'Any breaking news?');
    }
  }
  
  return suggestions.slice(0, 3);
}

/**
 * Quick follow-ups for initial metadata (before response is ready)
 * These will be replaced by smart follow-ups after response completes
 */
function generateQuickFollowUps(
  message: string, 
  category: QueryCategory, 
  sport: string | undefined
): string[] {
  const { teams, players } = extractEntities(message);
  const team = teams[0];
  const player = players[0];
  
  if (team) {
    return [
      `${team} recent form?`,
      `${team} injury news?`,
      `${team} next match?`
    ];
  } else if (player) {
    return [
      `${player} season stats?`,
      `${player} recent form?`,
      `${player} latest news?`
    ];
  }
  
  // Category-based defaults
  switch (category) {
    case 'STANDINGS':
      return ['Title race update?', 'Relegation battle?', 'Form table?'];
    case 'FIXTURE':
      return ['Biggest match this week?', 'TV schedule?', 'Team news?'];
    case 'INJURY':
      return ['Expected return dates?', 'Squad impact?', 'Replacement options?'];
    case 'TRANSFER':
      return ['Latest rumors?', 'Deal likelihood?', 'Fee expectations?'];
    default:
      if (sport === 'basketball') {
        return ['NBA standings?', 'Top scorers?', 'Tonight\'s games?'];
      }
      return ['Latest headlines?', 'Top matches today?', 'Any breaking news?'];
  }
}

// ============================================
// CACHED RESPONSE TYPE
// ============================================

interface CachedChatResponse {
  response: string;
  citations: string[];
  usedRealTimeSearch: boolean;
  brainMode: string;
  cachedAt: number;
}

// ============================================
// STREAMING POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI chat is not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ==========================================
    // TIER-BASED RATE LIMITING
    // ==========================================
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userPlan = session?.user?.plan || null;
    const identifier = userId || getClientIp(request);
    
    const rateLimit = await checkChatRateLimit(identifier, userPlan);
    
    if (!rateLimit.success) {
      const limits = CHAT_RATE_LIMITS[rateLimit.tier as keyof typeof CHAT_RATE_LIMITS];
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: `You've reached your daily limit of ${limits.requests} messages. ${
          !userPlan || userPlan === 'FREE' 
            ? 'Upgrade to Pro for 50/day or Premium for unlimited.' 
            : userPlan === 'PRO'
            ? 'Upgrade to Premium for unlimited messages.'
            : ''
        }`,
        remaining: 0,
        limit: limits.requests,
        retryAfter,
        tier: rateLimit.tier,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limits.requests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.reset),
        }
      });
    }

    // ==========================================
    // FETCH USER'S FAVORITE TEAMS FOR CONTEXT
    // ==========================================
    let favoriteTeamsContext = '';
    let favoriteTeamsList: string[] = [];
    if (userId) {
      try {
        const favorites = await prisma.favoriteTeam.findMany({
          where: { userId },
          select: { teamName: true, sport: true, league: true },
          take: 5,
        });
        
        if (favorites.length > 0) {
          favoriteTeamsList = favorites.map(f => f.teamName);
          const teamsList = favorites.map(f => 
            `${f.teamName} (${f.sport}${f.league ? `, ${f.league}` : ''})`
          ).join(', ');
          favoriteTeamsContext = `USER'S FAVORITE TEAMS: ${teamsList}. 
PROACTIVE BEHAVIOR: If the user asks a general question (like "what's happening today" or "any good matches"), 
proactively mention any matches or news about their favorite teams FIRST before other content.
If their favorite team has a match today/tonight, lead with that information.`;
        }
      } catch (err) {
        console.log('[AI-Chat-Stream] Could not fetch favorites:', err);
      }
    }

    // Check cache first (only for queries without conversation history)
    const queryHash = hashChatQuery(message);
    const cacheKey = CACHE_KEYS.chat(queryHash);
    const queryCategory = detectQueryCategory(message);
    const detectedSport = detectSport(message);
    
    // Skip cache for player stats queries to ensure verified stats are used
    // This covers NBA, NFL, NHL, and Soccer player stats
    const statsKeywords = /\b(average|averaging|ppg|rpg|apg|points|rebounds|assists|stats|statistics|goals|assists|touchdowns|yards|passing|rushing|receiving|saves|shutouts)\b/i;
    const playerKeywords = /\b(player|embiid|jokic|lebron|curry|durant|wembanyama|tatum|doncic|giannis|morant|mahomes|allen|burrow|jackson|henry|mccaffrey|hill|jefferson|chase|kelce|mcdavid|crosby|matthews|draisaitl|ovechkin|haaland|salah|mbappe|bellingham|kane|ronaldo|messi)\b/i;
    const isPlayerStatsQuery = statsKeywords.test(message) && playerKeywords.test(message);
    
    // Also skip cache for time-sensitive queries (live scores, today's games, etc.)
    const isTimeSensitive = shouldSkipCache(message);
    
    if (history.length === 0 && !isPlayerStatsQuery && !isTimeSensitive) {
      const cached = await cacheGet<CachedChatResponse>(cacheKey);
      if (cached) {
        console.log(`[AI-Chat-Stream] Cache HIT for: "${message.slice(0, 50)}..."`);
        
        // Generate follow-up suggestions based on cached response
        const followUps = generateQuickFollowUps(message, queryCategory, detectedSport);
        
        // Return cached response as a streaming-like response
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller) {
            // Send metadata
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'metadata',
              citations: cached.citations,
              usedRealTimeSearch: cached.usedRealTimeSearch,
              brainMode: cached.brainMode,
              fromCache: true,
              followUps,
            })}\n\n`));
            
            // Send content all at once (cached)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              content: cached.response,
            })}\n\n`));
            
            // Send done
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          },
        });
        
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
      
      // Check database cache (longer-term storage)
      const dbCached = await getCachedAnswer(message);
      if (dbCached) {
        console.log(`[AI-Chat-Stream] DB Cache HIT for: "${message.slice(0, 50)}..."`);
        
        const followUps = generateQuickFollowUps(message, queryCategory, detectedSport);
        
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'metadata',
              citations: dbCached.citations || [],
              usedRealTimeSearch: dbCached.usedRealTimeSearch,
              brainMode: dbCached.brainMode,
              fromCache: true,
              fromDbCache: true,
              followUps,
            })}\n\n`));
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              content: dbCached.answer,
            })}\n\n`));
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          },
        });
        
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
    }

    // Step 0: Translate if needed
    const translation = await translateToEnglish(message);
    const searchMessage = translation.englishQuery;
    const originalLanguage = translation.originalLanguage;
    
    let perplexityContext = '';
    let citations: string[] = [];
    const shouldSearch = needsSearch(searchMessage);
    // queryCategory already defined above for caching

    // Create streaming response early so we can send status updates
    const encoder = new TextEncoder();
    let fullResponse = '';
    let streamController: ReadableStreamDefaultController | null = null;
    
    // Helper to send status updates
    const sendStatus = (status: string) => {
      if (streamController) {
        streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status })}\n\n`));
      }
    };
    
    const readable = new ReadableStream({
      async start(controller) {
        streamController = controller;
        
        try {
          // Step 1: Perplexity search if needed
          if (shouldSearch) {
            const perplexity = getPerplexityClient();
            
            if (perplexity.isConfigured()) {
              // Send category-specific status message
              const statusMessages: Record<string, string> = {
                'STATS': '🔍 Searching 2025-26 season statistics...',
                'PLAYER_PROP': '📊 Fetching current player averages...',
                'STANDINGS': '📋 Loading latest standings...',
                'RESULT': '🏆 Checking recent results...',
                'INJURY': '🏥 Checking injury reports...',
                'TRANSFER': '📰 Searching transfer news...',
                'FIXTURE': '📅 Looking up fixtures...',
                'ROSTER': '👥 Loading current roster...',
                'PLAYER': '🔎 Searching player info...',
                'BETTING_ADVICE': '📈 Gathering performance data...',
              };
              const statusMsg = statusMessages[queryCategory] || 'Searching real-time data...';
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: statusMsg })}\n\n`));
              console.log('[AI-Chat-Stream] Fetching real-time context...');
              
              // Detect query types that need different recency windows
              const isLastGameQuery = /last (game|match|night)|yesterday|most recent|tonight|scored last|played last/i.test(searchMessage);
              const isInjuryQuery = /injur|injured|injury|is .+ (out|hurt|playing|available)|status|health/i.test(searchMessage);
              
              // Add current date to search for recency context
              const today = new Date();
              const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              
              // For injury queries, ask for CURRENT STATUS (not just news)
              // This helps find ongoing injuries that aren't in recent news
              let enhancedSearch = searchMessage;
              if (isLastGameQuery) {
                enhancedSearch = `${searchMessage} (as of ${dateStr}, get the most recent game data only)`;
              } else if (isInjuryQuery) {
                // Extract player name if present for better search
                const playerMatch = searchMessage.match(/(?:is\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:still\s+)?(?:injured|hurt|out|playing)/i);
                const playerName = playerMatch ? playerMatch[1] : '';
                enhancedSearch = `${playerName || searchMessage} current injury status ${dateStr} - is player injured, out, or available to play? Check official injury reports and team news.`;
              }
              
              // Determine recency filter:
              // - Last game queries: 'day' (very recent)
              // - Injury queries: 'month' (injuries can last weeks without new articles)
              // - Default: 'week'
              const recencyFilter = isLastGameQuery ? 'day' : isInjuryQuery ? 'month' : 'week';
              
              const searchResult = await perplexity.search(enhancedSearch, {
                recency: recencyFilter,
                model: 'sonar-pro',
                maxTokens: 1000,
              });

              if (searchResult.success && searchResult.content) {
                perplexityContext = searchResult.content;
                citations = searchResult.citations || [];
                // Send found status for stats queries
                if (queryCategory === 'STATS') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '✅ Found current stats, analyzing...' })}\n\n`));
                }
                if (queryCategory === 'INJURY') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '✅ Found injury info, analyzing...' })}\n\n`));
                }
              } else {
                // Search returned nothing - log it and signal to AI to be cautious
                console.log('[AI-Chat-Stream] ⚠️ Perplexity search returned no data for:', searchMessage.slice(0, 50));
                if (queryCategory === 'INJURY') {
                  // For injury queries with no data, add explicit warning
                  perplexityContext = '⚠️ REAL-TIME SEARCH RETURNED NO INJURY DATA. Do not assume the player is healthy. Say you could not verify their current injury status.';
                } else if (queryCategory === 'STATS') {
                  perplexityContext = '⚠️ REAL-TIME SEARCH RETURNED NO STATS. Do not invent statistics. Say you could not find verified current stats.';
                }
              }
            }
          }

          // Step 1.4: Fetch our past predictions if user asks about them
          let ourPredictionContext = '';
          if (queryCategory === 'OUR_PREDICTION') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '📊 Looking up our prediction...' })}\n\n`));
            ourPredictionContext = await fetchOurPrediction(searchMessage);
            if (ourPredictionContext) {
              console.log('[AI-Chat-Stream] Found our past prediction');
            }
          }

          // Step 1.5: DataLayer stats if needed (form, H2H, season stats)
          let dataLayerContext = '';
          if (needsDataLayerStats(searchMessage, queryCategory)) {
            const teams = extractTeamNames(searchMessage);
            if (teams.homeTeam) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: 'Fetching team stats...' })}\n\n`));
              console.log('[AI-Chat-Stream] Fetching DataLayer stats for:', teams);
              dataLayerContext = await fetchDataLayerContext(teams, detectedSport);
              if (dataLayerContext) {
                console.log('[AI-Chat-Stream] DataLayer context added');
              }
            }
          }

          // Step 1.6: Verified Player Stats for ALL SPORTS (bypasses Perplexity for accurate stats)
          let verifiedPlayerStatsContext = '';
          const isAnyStatsQuery = isStatsQuery(searchMessage) || isNFLStatsQuery(searchMessage) || isNHLStatsQuery(searchMessage) || isSoccerStatsQuery(searchMessage) || isEuroleagueStatsQuery(searchMessage);
          
          if (isAnyStatsQuery) {
            console.log('[AI-Chat-Stream] Stats query detected, determining sport...');
            console.log(`[AI-Chat-Stream] API_FOOTBALL_KEY configured: ${!!process.env.API_FOOTBALL_KEY}`);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '🔍 Fetching verified player stats...' })}\n\n`));
            
            // Try each sport in order of likelihood based on query
            // DISABLED: Euroleague stats - API data unreliable for team assignments
            // TODO: Re-enable when we have reliable Euroleague data source
            if (isEuroleagueStatsQuery(searchMessage)) {
              // Euroleague stats DISABLED - unreliable team/player data
              console.log('[AI-Chat-Stream] ⚠️ Euroleague stats disabled - data quality issues');
              // Let Perplexity handle Euroleague queries instead
            } else if (isStatsQuery(searchMessage)) {
              // NBA stats
              const verifiedStatsResult = await getVerifiedPlayerStats(searchMessage);
              if (verifiedStatsResult.success && verifiedStatsResult.data) {
                const stats = verifiedStatsResult.data;
                verifiedPlayerStatsContext = formatVerifiedPlayerStats(stats);
                console.log(`[AI-Chat-Stream] ✅ NBA stats: ${stats.playerFullName} - ${stats.stats.pointsPerGame} PPG`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found NBA stats for ${stats.playerFullName}` })}\n\n`));
              }
            } else if (isNFLStatsQuery(searchMessage)) {
              // NFL stats
              const verifiedStatsResult = await getVerifiedNFLPlayerStats(searchMessage);
              if (verifiedStatsResult.success && verifiedStatsResult.data) {
                const stats = verifiedStatsResult.data;
                verifiedPlayerStatsContext = formatVerifiedNFLPlayerStats(stats);
                console.log(`[AI-Chat-Stream] ✅ NFL stats: ${stats.playerFullName}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found NFL stats for ${stats.playerFullName}` })}\n\n`));
              }
            } else if (isNHLStatsQuery(searchMessage)) {
              // NHL stats
              const verifiedStatsResult = await getVerifiedNHLPlayerStats(searchMessage);
              if (verifiedStatsResult.success && verifiedStatsResult.data) {
                const stats = verifiedStatsResult.data;
                verifiedPlayerStatsContext = formatVerifiedNHLPlayerStats(stats);
                console.log(`[AI-Chat-Stream] ✅ NHL stats: ${stats.playerFullName}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found NHL stats for ${stats.playerFullName}` })}\n\n`));
              }
            } else if (isSoccerStatsQuery(searchMessage)) {
              // Soccer stats
              const verifiedStatsResult = await getVerifiedSoccerPlayerStats(searchMessage);
              if (verifiedStatsResult.success && verifiedStatsResult.data) {
                const stats = verifiedStatsResult.data;
                verifiedPlayerStatsContext = formatVerifiedSoccerPlayerStats(stats);
                console.log(`[AI-Chat-Stream] ✅ Soccer stats: ${stats.playerFullName} - ${stats.stats.goals}G ${stats.stats.assists}A`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found soccer stats for ${stats.playerFullName}` })}\n\n`));
              }
            }
            
            // If we got verified stats, override Perplexity context to prevent wrong data
            if (verifiedPlayerStatsContext) {
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get verified player stats, falling back to Perplexity');
            }
          }

          // Step 1.7: Verified Standings for standings queries (bypasses Perplexity for accurate data)
          let verifiedStandingsContext = '';
          if (isStandingsQuery(searchMessage)) {
            console.log('[AI-Chat-Stream] Standings query detected, fetching from API...');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '📊 Fetching verified standings...' })}\n\n`));
            
            const standingsResult = await fetchStandingsContext(searchMessage);
            if (standingsResult) {
              verifiedStandingsContext = standingsResult.context;
              console.log(`[AI-Chat-Stream] ✅ Got ${standingsResult.leagueName} standings`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Loaded ${standingsResult.leagueName} standings` })}\n\n`));
              
              // Override Perplexity context to prevent outdated data
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get verified standings, falling back to Perplexity');
            }
          }

          // Step 1.8: Verified Team Match Statistics (shots, corners per game analysis)
          let verifiedTeamMatchStatsContext = '';
          if (isTeamMatchStatsQuery(searchMessage)) {
            console.log('[AI-Chat-Stream] Team match stats query detected...');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '📊 Analyzing match statistics...' })}\n\n`));
            
            const matchStatsResult = await getVerifiedTeamMatchStats(searchMessage);
            if (matchStatsResult.success && matchStatsResult.data) {
              // Also get opponent analysis for comparison queries
              const opponentAnalysis = await getOpponentAnalysis(searchMessage);
              verifiedTeamMatchStatsContext = formatTeamMatchStatsContext(matchStatsResult, opponentAnalysis);
              
              console.log(`[AI-Chat-Stream] ✅ Got ${matchStatsResult.data.fixtures.length} matches for ${matchStatsResult.data.team.name}`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Analyzed ${matchStatsResult.data.fixtures.length} matches` })}\n\n`));
              
              // Override Perplexity context to use verified data
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get team match stats:', matchStatsResult.error);
            }
          }

          // Send status: generating
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: 'Generating response...' })}\n\n`));

          // Step 2: Build system prompt
          const brainMode: BrainMode = 
            (queryCategory === 'BETTING_ADVICE' || queryCategory === 'PLAYER_PROP') 
              ? 'betting' 
              : detectChatMode(message);
          
          let systemPrompt = buildSystemPrompt(brainMode, {
            hasRealTimeData: !!perplexityContext,
          });
          
          // Enhance system prompt when DataLayer stats are available
          if (dataLayerContext) {
            systemPrompt += `\n\nYou have access to VERIFIED STRUCTURED DATA including team form, head-to-head records, and season statistics. Prioritize this data for factual claims about records and stats.`;
          }

          // Add learned context (using detectedSport defined earlier)
          try {
            const learnedContext = await buildLearnedContext(message, detectedSport);
            const sportTerminology = detectedSport ? getTerminologyForSport(detectedSport) : [];
            
            if (learnedContext) systemPrompt += `\n\n${learnedContext}`;
            if (sportTerminology.length > 0) {
              systemPrompt += `\n\nSPORT TERMINOLOGY: ${sportTerminology.slice(0, 10).join(', ')}`;
            }
          } catch { /* ignore */ }

          // Add favorite teams context for personalized responses
          if (favoriteTeamsContext) {
            systemPrompt += `\n\n${favoriteTeamsContext}`;
          }
          
          // Add language instruction
          if (translation.needsTranslation && originalLanguage !== 'en') {
            const langNames: Record<string, string> = {
              'sr': 'Serbian/Croatian', 'es': 'Spanish', 'de': 'German', 'fr': 'French', 'pt': 'Portuguese', 'unknown': 'the user\'s language'
            };
            systemPrompt += `\n\nIMPORTANT: Respond in ${langNames[originalLanguage] || langNames['unknown']}, not English.`;
          }

          // Build messages
          const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
          ];

          // Add history
          for (const msg of history.slice(-10)) {
            messages.push({ role: msg.role, content: msg.content });
          }

          // Add user message with context
          let userContent = message;
          const hasContext = perplexityContext || dataLayerContext || verifiedPlayerStatsContext || ourPredictionContext || verifiedStandingsContext || verifiedTeamMatchStatsContext;
          
          if (hasContext) {
            // For team match statistics queries (shots, corners per game)
            if (verifiedTeamMatchStatsContext) {
              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: The user is asking about MATCH STATISTICS. Use ONLY the verified data below.

${verifiedTeamMatchStatsContext}

STRICT RULES:
1. ONLY use the match-by-match statistics provided above - they are VERIFIED from API-Sports
2. When comparing to averages, use the exact numbers provided
3. Format your response with clear match-by-match details if asked
4. Include dates and scores for context
5. If asked about opponent patterns, analyze how opponents performed compared to their norms

RESPONSE FORMAT:
- Answer the specific question directly first
- Use bullet points for match-by-match breakdowns
- Include the opponent name, date, and specific stats
- Summarize any patterns you notice
- Mention this is verified data from official match statistics`;
            // For OUR_PREDICTION queries, use our stored analysis
            } else if (queryCategory === 'OUR_PREDICTION' && ourPredictionContext) {
              userContent = `USER QUESTION: ${message}

The user is asking about SportBot's past prediction/analysis. Here is what we found:

${ourPredictionContext}

INSTRUCTIONS:
1. If we found a prediction, summarize it naturally: what we predicted, our reasoning, and the outcome
2. If outcome is HIT ✅, acknowledge we got it right
3. If outcome is MISS ❌, acknowledge we got it wrong and what actually happened
4. If outcome is PENDING ⏳, note that the match hasn't been played yet or result not updated
5. If no prediction was found (⚠️ NO PREDICTION FOUND), say: "I don't have a stored analysis for that specific match"
6. DO NOT make up an analysis if we don't have one`;
            } else if (queryCategory === 'STANDINGS' && verifiedStandingsContext) {
              // Prioritize verified standings data
              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: The user is asking about CURRENT STANDINGS. Your training data is OUTDATED.

${verifiedStandingsContext}

STRICT RULES:
1. ONLY use the standings data provided above - it is VERIFIED and CURRENT
2. DO NOT use any standings from your training data (it's outdated)
3. When mentioning positions, be specific: "Team X is currently in 1st place with a 25-10 record"
4. Include relevant stats like wins, losses, win streak if asked
5. For conference/division questions, group teams appropriately

RESPONSE FORMAT:
- Be conversational but accurate
- Lead with the most relevant information for what was asked
- If they asked about a specific team, focus on that team's position first
- Include comparison to rivals or nearby teams if relevant`;
            } else if (queryCategory === 'STATS') {
              // Prioritize verified player stats over Perplexity
              const statsData = verifiedPlayerStatsContext || perplexityContext || 'No real-time data available';
              
              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: The user is asking about CURRENT SEASON STATISTICS. Your training data is OUTDATED.

REAL-TIME DATA (December 2025 - USE ONLY THIS):
${statsData}
${dataLayerContext ? `\nSTRUCTURED STATS:\n${dataLayerContext}` : ''}

STRICT RULES:
1. ONLY use the numbers from the REAL-TIME DATA above
2. DO NOT use any statistics from your training data (it's from 2023 or earlier)
3. If the real-time data doesn't have the exact stat requested, say "Based on the available data..." and give what you have
4. NEVER guess or estimate numbers - only report what's in the real-time data
5. Lead with the current stats, then add context

RESPONSE FORMAT:
- Start with the CURRENT SEASON stat: "In the 2025-26 season, [Player] is averaging..."
- Then add recent performance context
- Keep it factual and concise`;
            } else {
              userContent = `USER QUESTION: ${message}`;
            
              if (dataLayerContext) {
                userContent += `\n\nSTRUCTURED STATS (verified data):\n${dataLayerContext}`;
              }
            
              if (perplexityContext) {
                userContent += `\n\nREAL-TIME NEWS & INFO:\n${perplexityContext}`;
              }
            
              userContent += '\n\nIMPORTANT: Use ONLY the data provided above for current season stats. Your training data may be outdated. Be sharp and specific.';
            }
          }
          messages.push({ role: 'user', content: userContent });

          // Step 3: Create streaming response
          const stream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 800,
            temperature: 0.7,
            stream: true,
          });
          
          // Generate quick follow-ups initially (will be replaced by smart ones after response)
          const quickFollowUps = generateQuickFollowUps(message, queryCategory, detectedSport);
          
          // Send metadata
          const metadata = {
            type: 'metadata',
            citations,
            usedRealTimeSearch: !!perplexityContext,
            usedDataLayer: !!dataLayerContext,
            brainMode,
            followUps: quickFollowUps,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));

          // Stream the response
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
            }
          }

          // Generate smart follow-ups based on the full conversation (async but wait for it)
          let smartFollowUps: string[] = quickFollowUps;
          try {
            smartFollowUps = await generateSmartFollowUps(message, fullResponse, queryCategory, detectedSport);
          } catch (err) {
            console.error('[AI-Chat] Smart follow-up generation failed:', err);
          }
          
          // Send updated follow-ups
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'followUps', followUps: smartFollowUps })}\n\n`));

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();

          // Track query with answer for caching (async)
          trackQuery({
            query: message,
            answer: fullResponse,  // Save the answer for future cache hits
            category: queryCategory,
            brainMode,
            sport: detectSport(message),
            usedRealTimeSearch: !!perplexityContext,
            responseLength: fullResponse.length,
            hadCitations: citations.length > 0,
            citations,  // Save citations for reuse
            userId,     // Track who submitted the query
          }).catch(() => {});

          saveKnowledge({
            question: message,
            answer: fullResponse,
            sport: detectSport(message),
            category: queryCategory,
            hadRealTimeData: !!perplexityContext,
            citations,
          }).catch(() => {});

          // Cache the response (only for queries without history context)
          if (history.length === 0 && fullResponse.length > 50) {
            const cacheTTL = getChatTTL(queryCategory);
            cacheSet<CachedChatResponse>(cacheKey, {
              response: fullResponse,
              citations,
              usedRealTimeSearch: !!perplexityContext,
              brainMode,
              cachedAt: Date.now(),
            }, cacheTTL).catch(() => {});
            console.log(`[AI-Chat-Stream] Cached response (TTL: ${cacheTTL}s)`);
          }

        } catch (error) {
          console.error('[AI-Chat-Stream] Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[AI-Chat-Stream] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
