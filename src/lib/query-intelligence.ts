/**
 * Query Intelligence System
 * 
 * Smart query understanding that goes beyond regex matching.
 * Uses LLM for ambiguous queries, caches classifications.
 * 
 * Key insight: Better classification = better data fetching = better answers
 */

import OpenAI from 'openai';
import { cacheGet, cacheSet } from '@/lib/cache';
import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export type QueryIntent = 
  | 'PLAYER_STATS'      // Stats for a specific player
  | 'TEAM_STATS'        // Team-level statistics
  | 'MATCH_PREDICTION'  // Who will win / analysis of upcoming match
  | 'MATCH_RESULT'      // Score/result of past match
  | 'STANDINGS'         // League table / rankings
  | 'LINEUP'            // Starting XI / roster for match
  | 'INJURY_NEWS'       // Injury updates
  | 'TRANSFER_NEWS'     // Transfer rumors/news
  | 'HEAD_TO_HEAD'      // Historical matchup comparison
  | 'FORM_CHECK'        // Recent form / how team is doing
  | 'BETTING_ANALYSIS'  // Odds/value/betting-related
  | 'SCHEDULE'          // When is next game
  | 'GENERAL_INFO'      // General questions (rules, who is X, etc.)
  | 'OUR_ANALYSIS'      // Asking about SportBot's prediction
  | 'UNCLEAR';          // Ambiguous - needs clarification

export type TimeFrame = 
  | 'LIVE'              // Right now / today
  | 'RECENT'            // Last few games / this week
  | 'SEASON'            // Current season
  | 'CAREER'            // All-time / career
  | 'HISTORICAL'        // Past seasons
  | 'UPCOMING';         // Future games

export type EntityType = 'PLAYER' | 'TEAM' | 'MATCH' | 'LEAGUE' | 'UNKNOWN';

export interface ExtractedEntity {
  type: EntityType;
  name: string;
  confidence: number;  // 0-1
  sport?: string;
  league?: string;
}

export interface QueryUnderstanding {
  originalQuery: string;
  intent: QueryIntent;
  intentConfidence: number;  // 0-1
  timeFrame: TimeFrame;
  entities: ExtractedEntity[];
  sport?: string;
  needsRealTimeData: boolean;
  needsVerifiedStats: boolean;
  needsOurPrediction: boolean;
  suggestedDataSources: string[];
  // For ambiguous queries
  isAmbiguous: boolean;
  alternativeIntents?: QueryIntent[];
  clarifyingQuestion?: string;
  // For learning/tracking
  patternMatched?: string;   // Which regex pattern matched (if any)
  usedLLM?: boolean;         // True if LLM was used for classification
}

// ============================================
// ENTITY EXTRACTION (Rule-based + smart)
// ============================================

// Known teams by sport for quick matching
const TEAM_PATTERNS: Record<string, RegExp> = {
  nba: /\b(lakers|celtics|warriors|heat|bucks|nets|knicks|76ers|sixers|clippers|suns|nuggets|mavericks?|mavs|grizzlies|timberwolves|wolves|cavaliers?|cavs|bulls|hawks|raptors|pacers|magic|hornets|wizards|pistons|thunder|trail ?blazers|blazers|jazz|kings|spurs|pelicans|rockets)\b/i,
  nhl: /\b(maple leafs|leafs|canadiens|habs|bruins|rangers|penguins|pens|blackhawks|hawks|red wings|oilers|flames|canucks|jets|senators|sens|lightning|bolts|panthers|avalanche|avs|golden knights|knights|kraken|stars|blues|wild|predators|preds|hurricanes|canes|devils)\b/i,
  nfl: /\b(chiefs|eagles|bills|cowboys|dolphins|ravens|bengals|49ers|niners|lions|seahawks|packers|vikings|steelers|chargers|broncos|raiders|commanders|giants|jets|patriots|pats|titans|jaguars|jags|colts|texans|browns|bears|saints|buccaneers|bucs|falcons|panthers|cardinals|cards|rams)\b/i,
  soccer: /\b(manchester united|man united|man utd|mufc|liverpool|arsenal|chelsea|man city|manchester city|tottenham|spurs|newcastle|west ham|aston villa|brighton|real madrid|barcelona|barca|atletico|bayern|dortmund|psg|juventus|juve|inter|milan|napoli|sunderland|leeds|leicester|everton|wolves|fulham|bournemouth|brentford|crystal palace|nottingham forest)\b/i,
  euroleague: /\b(real madrid|barcelona|fenerbahce|olympiacos|panathinaikos|maccabi|cska|efes|milan|bayern|partizan|virtus|monaco|zalgiris|baskonia|valencia)\b/i,
};

const PLAYER_INDICATORS = /\b(player|striker|midfielder|defender|goalkeeper|forward|center|guard|quarterback|qb|receiver|running back|rb|goalie|winger)\b/i;

// ============================================
// ENTITY EXPANSION (enrich short queries)
// ============================================

/**
 * Well-known player shortnames mapped to full context
 * 
 * NOTE: This is a SUBSET for quick query expansion. 
 * The full player databases are in:
 * - verified-nba-stats.ts (NBA_PLAYERS - 28+ players)
 * - verified-soccer-stats.ts (SOCCER_PLAYERS - 40+ players)  
 * - verified-nfl-stats.ts (NFL_PLAYERS)
 * - verified-nhl-stats.ts (NHL_PLAYERS)
 * - verified-euroleague-stats.ts (EUROLEAGUE_PLAYERS)
 * 
 * Those files handle the actual stats lookup. This expansion just helps
 * with search quality for Perplexity queries.
 */
const PLAYER_EXPANSIONS: Record<string, { fullName: string; team: string; sport: string; league: string }> = {
  // =====================
  // NBA (28+ players)
  // =====================
  'lebron': { fullName: 'LeBron James', team: 'Los Angeles Lakers', sport: 'basketball', league: 'NBA' },
  'bron': { fullName: 'LeBron James', team: 'Los Angeles Lakers', sport: 'basketball', league: 'NBA' },
  'king james': { fullName: 'LeBron James', team: 'Los Angeles Lakers', sport: 'basketball', league: 'NBA' },
  'curry': { fullName: 'Stephen Curry', team: 'Golden State Warriors', sport: 'basketball', league: 'NBA' },
  'steph': { fullName: 'Stephen Curry', team: 'Golden State Warriors', sport: 'basketball', league: 'NBA' },
  'chef curry': { fullName: 'Stephen Curry', team: 'Golden State Warriors', sport: 'basketball', league: 'NBA' },
  'giannis': { fullName: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', sport: 'basketball', league: 'NBA' },
  'greek freak': { fullName: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', sport: 'basketball', league: 'NBA' },
  'jokic': { fullName: 'Nikola Jokić', team: 'Denver Nuggets', sport: 'basketball', league: 'NBA' },
  'joker': { fullName: 'Nikola Jokić', team: 'Denver Nuggets', sport: 'basketball', league: 'NBA' },
  'luka': { fullName: 'Luka Dončić', team: 'Dallas Mavericks', sport: 'basketball', league: 'NBA' },
  'doncic': { fullName: 'Luka Dončić', team: 'Dallas Mavericks', sport: 'basketball', league: 'NBA' },
  'tatum': { fullName: 'Jayson Tatum', team: 'Boston Celtics', sport: 'basketball', league: 'NBA' },
  'embiid': { fullName: 'Joel Embiid', team: 'Philadelphia 76ers', sport: 'basketball', league: 'NBA' },
  'durant': { fullName: 'Kevin Durant', team: 'Phoenix Suns', sport: 'basketball', league: 'NBA' },
  'kd': { fullName: 'Kevin Durant', team: 'Phoenix Suns', sport: 'basketball', league: 'NBA' },
  'ant': { fullName: 'Anthony Edwards', team: 'Minnesota Timberwolves', sport: 'basketball', league: 'NBA' },
  'edwards': { fullName: 'Anthony Edwards', team: 'Minnesota Timberwolves', sport: 'basketball', league: 'NBA' },
  'sga': { fullName: 'Shai Gilgeous-Alexander', team: 'Oklahoma City Thunder', sport: 'basketball', league: 'NBA' },
  'shai': { fullName: 'Shai Gilgeous-Alexander', team: 'Oklahoma City Thunder', sport: 'basketball', league: 'NBA' },
  'wemby': { fullName: 'Victor Wembanyama', team: 'San Antonio Spurs', sport: 'basketball', league: 'NBA' },
  'wembanyama': { fullName: 'Victor Wembanyama', team: 'San Antonio Spurs', sport: 'basketball', league: 'NBA' },
  'dame': { fullName: 'Damian Lillard', team: 'Milwaukee Bucks', sport: 'basketball', league: 'NBA' },
  'lillard': { fullName: 'Damian Lillard', team: 'Milwaukee Bucks', sport: 'basketball', league: 'NBA' },
  'booker': { fullName: 'Devin Booker', team: 'Phoenix Suns', sport: 'basketball', league: 'NBA' },
  'ja': { fullName: 'Ja Morant', team: 'Memphis Grizzlies', sport: 'basketball', league: 'NBA' },
  'morant': { fullName: 'Ja Morant', team: 'Memphis Grizzlies', sport: 'basketball', league: 'NBA' },
  'brunson': { fullName: 'Jalen Brunson', team: 'New York Knicks', sport: 'basketball', league: 'NBA' },
  'harden': { fullName: 'James Harden', team: 'LA Clippers', sport: 'basketball', league: 'NBA' },
  'kyrie': { fullName: 'Kyrie Irving', team: 'Dallas Mavericks', sport: 'basketball', league: 'NBA' },
  'irving': { fullName: 'Kyrie Irving', team: 'Dallas Mavericks', sport: 'basketball', league: 'NBA' },
  'jimmy': { fullName: 'Jimmy Butler', team: 'Miami Heat', sport: 'basketball', league: 'NBA' },
  'butler': { fullName: 'Jimmy Butler', team: 'Miami Heat', sport: 'basketball', league: 'NBA' },
  'kat': { fullName: 'Karl-Anthony Towns', team: 'New York Knicks', sport: 'basketball', league: 'NBA' },
  'towns': { fullName: 'Karl-Anthony Towns', team: 'New York Knicks', sport: 'basketball', league: 'NBA' },
  'trae': { fullName: 'Trae Young', team: 'Atlanta Hawks', sport: 'basketball', league: 'NBA' },
  'lamelo': { fullName: 'LaMelo Ball', team: 'Charlotte Hornets', sport: 'basketball', league: 'NBA' },
  'fox': { fullName: 'De\'Aaron Fox', team: 'Sacramento Kings', sport: 'basketball', league: 'NBA' },
  'maxey': { fullName: 'Tyrese Maxey', team: 'Philadelphia 76ers', sport: 'basketball', league: 'NBA' },
  'bam': { fullName: 'Bam Adebayo', team: 'Miami Heat', sport: 'basketball', league: 'NBA' },
  'westbrook': { fullName: 'Russell Westbrook', team: 'Denver Nuggets', sport: 'basketball', league: 'NBA' },
  
  // =====================
  // SOCCER (40+ players)
  // =====================
  // Premier League
  'haaland': { fullName: 'Erling Haaland', team: 'Manchester City', sport: 'soccer', league: 'Premier League' },
  'salah': { fullName: 'Mohamed Salah', team: 'Liverpool', sport: 'soccer', league: 'Premier League' },
  'mo salah': { fullName: 'Mohamed Salah', team: 'Liverpool', sport: 'soccer', league: 'Premier League' },
  'saka': { fullName: 'Bukayo Saka', team: 'Arsenal', sport: 'soccer', league: 'Premier League' },
  'palmer': { fullName: 'Cole Palmer', team: 'Chelsea', sport: 'soccer', league: 'Premier League' },
  'foden': { fullName: 'Phil Foden', team: 'Manchester City', sport: 'soccer', league: 'Premier League' },
  'odegaard': { fullName: 'Martin Odegaard', team: 'Arsenal', sport: 'soccer', league: 'Premier League' },
  'rice': { fullName: 'Declan Rice', team: 'Arsenal', sport: 'soccer', league: 'Premier League' },
  'son': { fullName: 'Son Heung-min', team: 'Tottenham', sport: 'soccer', league: 'Premier League' },
  'sonny': { fullName: 'Son Heung-min', team: 'Tottenham', sport: 'soccer', league: 'Premier League' },
  'watkins': { fullName: 'Ollie Watkins', team: 'Aston Villa', sport: 'soccer', league: 'Premier League' },
  'isak': { fullName: 'Alexander Isak', team: 'Newcastle', sport: 'soccer', league: 'Premier League' },
  'bruno': { fullName: 'Bruno Fernandes', team: 'Manchester United', sport: 'soccer', league: 'Premier League' },
  'rashford': { fullName: 'Marcus Rashford', team: 'Manchester United', sport: 'soccer', league: 'Premier League' },
  'van dijk': { fullName: 'Virgil van Dijk', team: 'Liverpool', sport: 'soccer', league: 'Premier League' },
  'vvd': { fullName: 'Virgil van Dijk', team: 'Liverpool', sport: 'soccer', league: 'Premier League' },
  // La Liga
  'vinicius': { fullName: 'Vinícius Júnior', team: 'Real Madrid', sport: 'soccer', league: 'La Liga' },
  'vini': { fullName: 'Vinícius Júnior', team: 'Real Madrid', sport: 'soccer', league: 'La Liga' },
  'vini jr': { fullName: 'Vinícius Júnior', team: 'Real Madrid', sport: 'soccer', league: 'La Liga' },
  'bellingham': { fullName: 'Jude Bellingham', team: 'Real Madrid', sport: 'soccer', league: 'La Liga' },
  'jude': { fullName: 'Jude Bellingham', team: 'Real Madrid', sport: 'soccer', league: 'La Liga' },
  'mbappe': { fullName: 'Kylian Mbappé', team: 'Real Madrid', sport: 'soccer', league: 'La Liga' },
  'yamal': { fullName: 'Lamine Yamal', team: 'Barcelona', sport: 'soccer', league: 'La Liga' },
  'pedri': { fullName: 'Pedri', team: 'Barcelona', sport: 'soccer', league: 'La Liga' },
  'lewandowski': { fullName: 'Robert Lewandowski', team: 'Barcelona', sport: 'soccer', league: 'La Liga' },
  'lewy': { fullName: 'Robert Lewandowski', team: 'Barcelona', sport: 'soccer', league: 'La Liga' },
  'raphinha': { fullName: 'Raphinha', team: 'Barcelona', sport: 'soccer', league: 'La Liga' },
  // Bundesliga
  'kane': { fullName: 'Harry Kane', team: 'Bayern Munich', sport: 'soccer', league: 'Bundesliga' },
  'musiala': { fullName: 'Jamal Musiala', team: 'Bayern Munich', sport: 'soccer', league: 'Bundesliga' },
  'wirtz': { fullName: 'Florian Wirtz', team: 'Bayer Leverkusen', sport: 'soccer', league: 'Bundesliga' },
  'sane': { fullName: 'Leroy Sané', team: 'Bayern Munich', sport: 'soccer', league: 'Bundesliga' },
  // Serie A
  'osimhen': { fullName: 'Victor Osimhen', team: 'Galatasaray', sport: 'soccer', league: 'Super Lig' },
  'lautaro': { fullName: 'Lautaro Martínez', team: 'Inter Milan', sport: 'soccer', league: 'Serie A' },
  'vlahovic': { fullName: 'Dušan Vlahović', team: 'Juventus', sport: 'soccer', league: 'Serie A' },
  'leao': { fullName: 'Rafael Leão', team: 'AC Milan', sport: 'soccer', league: 'Serie A' },
  // Ligue 1 / PSG
  'dembele': { fullName: 'Ousmane Dembélé', team: 'PSG', sport: 'soccer', league: 'Ligue 1' },
  'barcola': { fullName: 'Bradley Barcola', team: 'PSG', sport: 'soccer', league: 'Ligue 1' },
  // Legends / Other
  'messi': { fullName: 'Lionel Messi', team: 'Inter Miami', sport: 'soccer', league: 'MLS' },
  'leo': { fullName: 'Lionel Messi', team: 'Inter Miami', sport: 'soccer', league: 'MLS' },
  'ronaldo': { fullName: 'Cristiano Ronaldo', team: 'Al-Nassr', sport: 'soccer', league: 'Saudi Pro League' },
  'cr7': { fullName: 'Cristiano Ronaldo', team: 'Al-Nassr', sport: 'soccer', league: 'Saudi Pro League' },
  'neymar': { fullName: 'Neymar Jr', team: 'Santos', sport: 'soccer', league: 'Brasileirão' },
  'de bruyne': { fullName: 'Kevin De Bruyne', team: 'Manchester City', sport: 'soccer', league: 'Premier League' },
  'kdb': { fullName: 'Kevin De Bruyne', team: 'Manchester City', sport: 'soccer', league: 'Premier League' },
  
  // =====================
  // NFL (20+ players)
  // =====================
  'mahomes': { fullName: 'Patrick Mahomes', team: 'Kansas City Chiefs', sport: 'american_football', league: 'NFL' },
  'burrow': { fullName: 'Joe Burrow', team: 'Cincinnati Bengals', sport: 'american_football', league: 'NFL' },
  'allen': { fullName: 'Josh Allen', team: 'Buffalo Bills', sport: 'american_football', league: 'NFL' },
  'lamar': { fullName: 'Lamar Jackson', team: 'Baltimore Ravens', sport: 'american_football', league: 'NFL' },
  'kelce': { fullName: 'Travis Kelce', team: 'Kansas City Chiefs', sport: 'american_football', league: 'NFL' },
  'hill': { fullName: 'Tyreek Hill', team: 'Miami Dolphins', sport: 'american_football', league: 'NFL' },
  'tyreek': { fullName: 'Tyreek Hill', team: 'Miami Dolphins', sport: 'american_football', league: 'NFL' },
  'diggs': { fullName: 'Stefon Diggs', team: 'Houston Texans', sport: 'american_football', league: 'NFL' },
  'jefferson': { fullName: 'Justin Jefferson', team: 'Minnesota Vikings', sport: 'american_football', league: 'NFL' },
  'chase': { fullName: 'Ja\'Marr Chase', team: 'Cincinnati Bengals', sport: 'american_football', league: 'NFL' },
  'hurts': { fullName: 'Jalen Hurts', team: 'Philadelphia Eagles', sport: 'american_football', league: 'NFL' },
  'waddle': { fullName: 'Jaylen Waddle', team: 'Miami Dolphins', sport: 'american_football', league: 'NFL' },
  'henry': { fullName: 'Derrick Henry', team: 'Baltimore Ravens', sport: 'american_football', league: 'NFL' },
  'mccaffrey': { fullName: 'Christian McCaffrey', team: 'San Francisco 49ers', sport: 'american_football', league: 'NFL' },
  'cmc': { fullName: 'Christian McCaffrey', team: 'San Francisco 49ers', sport: 'american_football', league: 'NFL' },
  'bosa': { fullName: 'Nick Bosa', team: 'San Francisco 49ers', sport: 'american_football', league: 'NFL' },
  'micah': { fullName: 'Micah Parsons', team: 'Dallas Cowboys', sport: 'american_football', league: 'NFL' },
  'parsons': { fullName: 'Micah Parsons', team: 'Dallas Cowboys', sport: 'american_football', league: 'NFL' },
  'stroud': { fullName: 'C.J. Stroud', team: 'Houston Texans', sport: 'american_football', league: 'NFL' },
  'purdy': { fullName: 'Brock Purdy', team: 'San Francisco 49ers', sport: 'american_football', league: 'NFL' },
  
  // =====================
  // NHL (15+ players)
  // =====================
  'mcdavid': { fullName: 'Connor McDavid', team: 'Edmonton Oilers', sport: 'hockey', league: 'NHL' },
  'connor': { fullName: 'Connor McDavid', team: 'Edmonton Oilers', sport: 'hockey', league: 'NHL' },
  'ovechkin': { fullName: 'Alex Ovechkin', team: 'Washington Capitals', sport: 'hockey', league: 'NHL' },
  'ovi': { fullName: 'Alex Ovechkin', team: 'Washington Capitals', sport: 'hockey', league: 'NHL' },
  'crosby': { fullName: 'Sidney Crosby', team: 'Pittsburgh Penguins', sport: 'hockey', league: 'NHL' },
  'sid': { fullName: 'Sidney Crosby', team: 'Pittsburgh Penguins', sport: 'hockey', league: 'NHL' },
  'matthews': { fullName: 'Auston Matthews', team: 'Toronto Maple Leafs', sport: 'hockey', league: 'NHL' },
  'draisaitl': { fullName: 'Leon Draisaitl', team: 'Edmonton Oilers', sport: 'hockey', league: 'NHL' },
  'leon': { fullName: 'Leon Draisaitl', team: 'Edmonton Oilers', sport: 'hockey', league: 'NHL' },
  'makar': { fullName: 'Cale Makar', team: 'Colorado Avalanche', sport: 'hockey', league: 'NHL' },
  'mackinnon': { fullName: 'Nathan MacKinnon', team: 'Colorado Avalanche', sport: 'hockey', league: 'NHL' },
  'kucherov': { fullName: 'Nikita Kucherov', team: 'Tampa Bay Lightning', sport: 'hockey', league: 'NHL' },
  'panarin': { fullName: 'Artemi Panarin', team: 'New York Rangers', sport: 'hockey', league: 'NHL' },
  'hughes': { fullName: 'Jack Hughes', team: 'New Jersey Devils', sport: 'hockey', league: 'NHL' },
  'bedard': { fullName: 'Connor Bedard', team: 'Chicago Blackhawks', sport: 'hockey', league: 'NHL' },
  
  // =====================
  // EUROLEAGUE (10+ players)
  // =====================
  'sloukas': { fullName: 'Kostas Sloukas', team: 'Panathinaikos', sport: 'euroleague', league: 'EuroLeague' },
  'nunn': { fullName: 'Kendrick Nunn', team: 'Panathinaikos', sport: 'euroleague', league: 'EuroLeague' },
  'hezonja': { fullName: 'Mario Hezonja', team: 'Real Madrid', sport: 'euroleague', league: 'EuroLeague' },
  'campazzo': { fullName: 'Facundo Campazzo', team: 'Real Madrid', sport: 'euroleague', league: 'EuroLeague' },
  'tavares': { fullName: 'Walter Tavares', team: 'Real Madrid', sport: 'euroleague', league: 'EuroLeague' },
  'vesely': { fullName: 'Jan Vesely', team: 'Fenerbahce', sport: 'euroleague', league: 'EuroLeague' },
  'mirotic': { fullName: 'Nikola Mirotic', team: 'Barcelona', sport: 'euroleague', league: 'EuroLeague' },
  'vezenkov': { fullName: 'Sandro Vezenkov', team: 'Olympiacos', sport: 'euroleague', league: 'EuroLeague' },
  'fournier': { fullName: 'Evan Fournier', team: 'Olympiacos', sport: 'euroleague', league: 'EuroLeague' },
  'canaan': { fullName: 'Isaiah Canaan', team: 'Monaco', sport: 'euroleague', league: 'EuroLeague' },
};

/**
 * Expand a short query with additional context
 * "LeBron stats" → "LeBron James Los Angeles Lakers NBA stats 2025-26 season"
 */
export function expandQuery(query: string): { 
  expandedQuery: string; 
  playerContext?: { fullName: string; team: string; sport: string; league: string };
} {
  const lower = query.toLowerCase();
  
  // Look for player shortnames
  for (const [shortName, context] of Object.entries(PLAYER_EXPANSIONS)) {
    if (lower.includes(shortName)) {
      // Don't expand if full name is already present
      if (lower.includes(context.fullName.toLowerCase())) {
        continue;
      }
      
      // Build expanded query
      let expanded = query.replace(
        new RegExp(`\\b${shortName}\\b`, 'gi'),
        context.fullName
      );
      
      // Add team/league context if not present
      if (!lower.includes(context.team.toLowerCase()) && !lower.includes(context.league.toLowerCase())) {
        expanded += ` ${context.team} ${context.league}`;
      }
      
      // Add season context if asking about stats
      if (/\b(stats|average|ppg|scoring|points|goals|assists)\b/i.test(lower)) {
        expanded += ' 2025-26 season';
      }
      
      console.log(`[QueryIntelligence] Expanded: "${query}" → "${expanded}"`);
      return { expandedQuery: expanded.trim(), playerContext: context };
    }
  }
  
  return { expandedQuery: query };
}

/**
 * Extract entities from query using pattern matching
 */
function extractEntities(query: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const lowerQuery = query.toLowerCase();
  
  // Check for team matches by sport
  for (const [sport, pattern] of Object.entries(TEAM_PATTERNS)) {
    const match = lowerQuery.match(pattern);
    if (match) {
      entities.push({
        type: 'TEAM',
        name: match[0],
        confidence: 0.9,
        sport,
      });
    }
  }
  
  // Check for "X vs Y" pattern (match)
  const vsMatch = query.match(/([A-Z][a-zA-Z\s]+?)\s+(?:vs?\.?|versus|@)\s+([A-Z][a-zA-Z\s]+)/i);
  if (vsMatch) {
    entities.push({
      type: 'MATCH',
      name: `${vsMatch[1].trim()} vs ${vsMatch[2].trim()}`,
      confidence: 0.95,
    });
  }
  
  // Check for player name patterns (Capitalized First Last)
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  let nameMatch;
  while ((nameMatch = namePattern.exec(query)) !== null) {
    const name = nameMatch[1];
    // Skip if it's a known team name
    const isTeam = Object.values(TEAM_PATTERNS).some(p => p.test(name));
    if (!isTeam && !entities.some(e => e.name.toLowerCase() === name.toLowerCase())) {
      // Check if context suggests it's a player
      const hasPlayerIndicator = PLAYER_INDICATORS.test(query);
      entities.push({
        type: hasPlayerIndicator ? 'PLAYER' : 'UNKNOWN',
        name,
        confidence: hasPlayerIndicator ? 0.8 : 0.5,
      });
    }
  }
  
  return entities;
}

/**
 * Detect sport from query
 */
function detectSport(query: string): string | undefined {
  const lower = query.toLowerCase();
  
  if (/\b(nba|basketball|lakers|celtics|warriors|lebron|curry|giannis|jokic|doncic)\b/i.test(lower)) return 'basketball';
  if (/\b(nfl|football|quarterback|touchdown|chiefs|eagles|superbowl|mahomes)\b/i.test(lower)) return 'american_football';
  if (/\b(nhl|hockey|stanley cup|maple leafs|bruins|oilers|mcdavid)\b/i.test(lower)) return 'hockey';
  if (/\b(premier league|la liga|serie a|bundesliga|champions league|soccer|football|goal|striker|midfielder)\b/i.test(lower)) return 'soccer';
  if (/\b(euroleague|eurobasket)\b/i.test(lower)) return 'euroleague';
  if (/\b(mlb|baseball|yankees|dodgers|home run)\b/i.test(lower)) return 'baseball';
  
  return undefined;
}

/**
 * Detect time frame from query
 */
function detectTimeFrame(query: string): TimeFrame {
  const lower = query.toLowerCase();
  
  if (/\b(live|right now|currently|at the moment|today|tonight)\b/.test(lower)) return 'LIVE';
  if (/\b(last \d+|recent|lately|this week|past (few|couple))\b/.test(lower)) return 'RECENT';
  if (/\b(this season|season average|season stats|2025-26|2025|current season)\b/.test(lower)) return 'SEASON';
  if (/\b(career|all-?time|lifetime|ever)\b/.test(lower)) return 'CAREER';
  if (/\b(last (season|year)|20\d{2}|historical|back in)\b/.test(lower)) return 'HISTORICAL';
  if (/\b(next|upcoming|tomorrow|will|going to|prediction|who wins)\b/.test(lower)) return 'UPCOMING';
  
  return 'SEASON'; // Default to current season
}

// ============================================
// SMART SHORT QUERY HANDLING
// ============================================

/**
 * Detect if query is a short/minimal match query like "Roma Sassuolo" or "Lakers vs Celtics"
 * Users often type just team names expecting prediction
 */
function isShortMatchQuery(query: string): { isMatch: boolean; teams: string[] } {
  const lower = query.toLowerCase().trim();
  
  // Pattern: "Team1 Team2" or "Team1 vs Team2" or "Team1 - Team2"
  // Very short queries (1-5 words) with 2 team-like words
  const words = lower.split(/\s+/);
  
  // If it's short (1-6 words) and contains vs/versus/-, it's definitely a match query
  if (words.length <= 6 && /\b(vs\.?|versus|v\.?|at|@)\b|[-–—]/.test(lower)) {
    // Extract team names (everything before and after the separator)
    const parts = lower.split(/\s*(?:vs\.?|versus|v\.?|at|@|[-–—])\s*/i);
    if (parts.length === 2) {
      return { 
        isMatch: true, 
        teams: parts.map(t => t.trim()).filter(t => t.length > 0) 
      };
    }
  }
  
  // Very short query (2-4 words) with no other keywords - likely just team names
  if (words.length >= 2 && words.length <= 4) {
    // Check if most words look like team names (capitalized, known patterns)
    const noQuestionWords = !/(who|what|when|where|why|how|will|can|should|is|are|do|does)/i.test(lower);
    const noStatsWords = !/(stats|points|goals|assists|average|score|result|form)/i.test(lower);
    
    if (noQuestionWords && noStatsWords) {
      // Try to find 2 team names
      const allTeamPatterns = Object.values(TEAM_PATTERNS);
      const foundTeams: string[] = [];
      
      for (const pattern of allTeamPatterns) {
        const match = lower.match(pattern);
        if (match) {
          foundTeams.push(match[0]);
        }
      }
      
      // Also check Serie A teams (not in main patterns yet)
      const serieATeams = /\b(roma|as roma|lazio|napoli|juventus|juve|inter|ac milan|milan|atalanta|fiorentina|torino|bologna|sassuolo|udinese|cagliari|verona|monza|empoli|lecce|genoa|parma|como|venezia)\b/gi;
      let serieAMatch;
      while ((serieAMatch = serieATeams.exec(lower)) !== null) {
        if (!foundTeams.some(t => t.toLowerCase() === serieAMatch![0].toLowerCase())) {
          foundTeams.push(serieAMatch[0]);
        }
      }
      
      if (foundTeams.length >= 2) {
        return { isMatch: true, teams: foundTeams.slice(0, 2) };
      }
    }
  }
  
  return { isMatch: false, teams: [] };
}

/**
 * Infer intent from context when patterns don't match
 * This is the "smart" part - understanding user intent from minimal input
 */
function inferIntentFromContext(query: string, entities: ExtractedEntity[]): QueryIntent | null {
  const lower = query.toLowerCase();
  
  // Count entity types
  const teamCount = entities.filter(e => e.type === 'TEAM').length;
  const playerCount = entities.filter(e => e.type === 'PLAYER').length;
  
  // Two teams mentioned → likely asking about a match (prediction, h2h, or result)
  if (teamCount >= 2) {
    // Check for past tense → result
    if (/\b(won|beat|defeated|lost|drew|played)\b/.test(lower)) {
      return 'MATCH_RESULT';
    }
    // Default: upcoming match prediction
    return 'MATCH_PREDICTION';
  }
  
  // One team + future indicators → prediction or schedule
  if (teamCount === 1) {
    if (/\b(next|when|schedule|play)\b/.test(lower)) {
      return 'SCHEDULE';
    }
    // Just a team name alone could be form check
    if (entities.length === 1) {
      return 'FORM_CHECK';
    }
  }
  
  // Player mentioned → stats
  if (playerCount >= 1) {
    return 'PLAYER_STATS';
  }
  
  return null;
}

// ============================================
// INTENT CLASSIFICATION (Smart rules + LLM fallback)
// ============================================

interface IntentPattern {
  intent: QueryIntent;
  patterns: RegExp[];
  priority: number;  // Higher = check first
}

const INTENT_PATTERNS: IntentPattern[] = [
  // High priority - very specific patterns
  {
    intent: 'OUR_ANALYSIS',
    patterns: [
      /\b(your|sportbot('s)?|our)\s+(analysis|prediction|pick|call|take)\b/i,
      /what (did|do) you (think|predict|say)/i,
      /\bhow did (you|sportbot) (do|perform)\b/i,
    ],
    priority: 100,
  },
  {
    intent: 'MATCH_PREDICTION',
    patterns: [
      /who (will|is going to|gonna) win/i,
      /\b(predict|prediction|preview)\b.*\b(match|game)\b/i,
      /\b(match|game)\b.*\b(predict|prediction|preview)\b/i,
      /\bwinner\s+(of|between)\b/i,
      /\banalysis\s+(of|for)\s+.+\s+(vs?\.?|versus)\s+/i,
    ],
    priority: 90,
  },
  {
    intent: 'BETTING_ANALYSIS',
    patterns: [
      /\b(should i bet|betting|over.?under|spread|line|odds|value bet|edge)\b/i,
      /\b(moneyline|money line|parlay|prop bet)\b/i,
      /\b(points|goals|assists)\s+(over|under)\s+\d/i,
    ],
    priority: 85,
  },
  {
    intent: 'PLAYER_STATS',
    patterns: [
      /\bhow many (points|goals|assists|rebounds|touchdowns)/i,
      /\b(stats|statistics|numbers|average|averaging)\b.*\b(player|for)\b/i,
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b.*\b(stats|average|scoring|points|goals)\b/i,
      /\b(ppg|rpg|apg|gpg)\b/i,  // Per-game stats abbreviations
    ],
    priority: 80,
  },
  {
    intent: 'TEAM_STATS',
    patterns: [
      /\b(team|club)\s+(stats|statistics|record)\b/i,
      /\bhow (is|are)\s+.+\s+(doing|performing|playing)\b/i,
      /\b(shots|xg|possession|clean sheets)\b.*\b(per game|average)\b/i,
      /\b(form|streak|run)\b/i,
      /\b(wins|losses|draws|record)\b/i,
    ],
    priority: 75,
  },
  {
    intent: 'STANDINGS',
    patterns: [
      /\b(standings|table|ranking|position|place)\b/i,
      /\bwho('s| is) (first|top|leading|winning)\b/i,
      /\b(league|conference|division)\s+(leader|standings)\b/i,
    ],
    priority: 70,
  },
  {
    intent: 'MATCH_RESULT',
    patterns: [
      /\bwho won\b/i,
      /\b(score|result|final)\b.*\b(game|match)\b/i,
      /\b(game|match)\b.*\b(score|result)\b/i,
      /\bhow did .+ (do|play|perform)\b.*\b(against|vs)\b/i,
    ],
    priority: 65,
  },
  {
    intent: 'LINEUP',
    patterns: [
      /\b(lineup|starting|xi|roster|who('s| is) playing)\b/i,
      /\b(start|bench|substitute)\b/i,
    ],
    priority: 60,
  },
  {
    intent: 'INJURY_NEWS',
    patterns: [
      /\b(injur|hurt|out|miss|sideline|available|fit|healthy)\b/i,
      /\bwill .+ play\b/i,
      /\b(doubt|questionable|probable|ruled out)\b/i,
    ],
    priority: 55,
  },
  {
    intent: 'FORM_CHECK',
    patterns: [
      /\bhow('s| is| are) .+ (doing|going|looking)\b/i,
      /\b(form|momentum|streak|run)\b/i,
      /\blast \d+ (games|matches)\b/i,
    ],
    priority: 50,
  },
  {
    intent: 'HEAD_TO_HEAD',
    patterns: [
      /\bhead.to.head|h2h\b/i,
      /\bhistory (between|of) .+ (and|vs)\b/i,
      /\bhow (do|does) .+ (do|fare) against\b/i,
    ],
    priority: 45,
  },
  {
    intent: 'SCHEDULE',
    patterns: [
      /\bwhen (is|does|do|are)\b.*\b(play|game|match)\b/i,
      /\bnext (game|match|fixture)\b/i,
      /\bschedule|fixture\b/i,
    ],
    priority: 40,
  },
  {
    intent: 'TRANSFER_NEWS',
    patterns: [
      /\b(transfer|sign|signing|rumor|linked|interest)\b/i,
      /\b(buy|sell|move|join)\b/i,
    ],
    priority: 35,
  },
  {
    intent: 'GENERAL_INFO',
    patterns: [
      /\bwho is\b/i,
      /\bwhat (is|are) (the )?(rules|offside|foul)\b/i,
      /\btell me about\b/i,
    ],
    priority: 30,
  },
];

/**
 * Classify intent using pattern matching
 * Returns intent, confidence, alternatives, and matched pattern (for learning)
 */
function classifyIntentByPatterns(query: string): { 
  intent: QueryIntent; 
  confidence: number; 
  alternatives: QueryIntent[];
  matchedPattern?: string;
} {
  const matches: { intent: QueryIntent; priority: number; pattern: string }[] = [];
  
  for (const { intent, patterns, priority } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        matches.push({ intent, priority, pattern: pattern.toString() });
        break; // Only count each intent once
      }
    }
  }
  
  if (matches.length === 0) {
    return { intent: 'UNCLEAR', confidence: 0.3, alternatives: [] };
  }
  
  // Sort by priority
  matches.sort((a, b) => b.priority - a.priority);
  
  const topMatch = matches[0];
  const alternatives = matches.slice(1, 3).map(m => m.intent);
  
  // Confidence based on priority gap
  let confidence = 0.7;
  if (matches.length > 1) {
    const gap = topMatch.priority - matches[1].priority;
    confidence = gap > 20 ? 0.9 : gap > 10 ? 0.75 : 0.6;
  } else {
    confidence = 0.85; // Single clear match
  }
  
  return { 
    intent: topMatch.intent, 
    confidence, 
    alternatives,
    matchedPattern: topMatch.pattern,
  };
}

// ============================================
// LLM CLASSIFICATION (for ambiguous queries)
// ============================================

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CLASSIFICATION_PROMPT = `You are a sports query classifier. Analyze the user's question and return JSON.

INTENTS:
- PLAYER_STATS: Asking for player statistics (points, goals, assists, averages)
- TEAM_STATS: Asking about team performance, form, shots, xG, clean sheets
- MATCH_PREDICTION: Asking who will win an upcoming match
- MATCH_RESULT: Asking about score/result of a past match
- STANDINGS: Asking about league table/rankings
- LINEUP: Asking about starting XI or roster
- INJURY_NEWS: Asking about player availability/injuries
- FORM_CHECK: Asking how a team/player is doing recently
- HEAD_TO_HEAD: Asking about historical matchups between teams
- BETTING_ANALYSIS: Asking about odds, betting advice, over/under
- SCHEDULE: Asking when a game is
- GENERAL_INFO: General questions (rules, who is X, etc.)
- OUR_ANALYSIS: Asking specifically about SportBot's prediction
- UNCLEAR: Cannot determine intent

Return ONLY valid JSON:
{
  "intent": "INTENT_NAME",
  "confidence": 0.0-1.0,
  "entities": [{"type": "TEAM|PLAYER|MATCH", "name": "..."}],
  "timeFrame": "LIVE|RECENT|SEASON|CAREER|HISTORICAL|UPCOMING",
  "reasoning": "brief explanation"
}`;

/**
 * Use LLM to classify ambiguous queries
 */
async function classifyWithLLM(query: string): Promise<{
  intent: QueryIntent;
  confidence: number;
  entities: ExtractedEntity[];
  timeFrame: TimeFrame;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: CLASSIFICATION_PROMPT },
        { role: 'user', content: query },
      ],
      max_tokens: 200,
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    
    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    return {
      intent: result.intent as QueryIntent || 'UNCLEAR',
      confidence: result.confidence || 0.5,
      entities: (result.entities || []).map((e: { type: string; name: string }) => ({
        type: e.type as EntityType,
        name: e.name,
        confidence: 0.8,
      })),
      timeFrame: result.timeFrame as TimeFrame || 'SEASON',
    };
  } catch (error) {
    console.error('[QueryIntelligence] LLM classification failed:', error);
    return {
      intent: 'UNCLEAR',
      confidence: 0.3,
      entities: [],
      timeFrame: 'SEASON',
    };
  }
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Understand a query fully - intent, entities, time frame, data needs
 * 
 * SMART FEATURES:
 * 1. Short query detection ("Roma Sassuolo" → match prediction)
 * 2. Context inference (2 teams → match, 1 player → stats)
 * 3. Pattern matching (regex)
 * 4. LLM fallback for ambiguous queries
 */
export async function understandQuery(query: string): Promise<QueryUnderstanding> {
  const startTime = Date.now();
  
  // Check cache first
  const cacheKey = `query-intel:${crypto.createHash('md5').update(query.toLowerCase()).digest('hex').slice(0, 16)}`;
  const cached = await cacheGet<QueryUnderstanding>(cacheKey);
  if (cached) {
    console.log(`[QueryIntelligence] Cache hit (${Date.now() - startTime}ms)`);
    return cached;
  }
  
  // Extract entities
  const entities = extractEntities(query);
  const sport = detectSport(query);
  let timeFrame = detectTimeFrame(query);
  
  // SMART FEATURE 1: Check for short match query first
  const shortMatchCheck = isShortMatchQuery(query);
  if (shortMatchCheck.isMatch) {
    console.log(`[QueryIntelligence] Short match query detected: ${shortMatchCheck.teams.join(' vs ')}`);
    
    // Create team entities if not already extracted
    const teamEntities: ExtractedEntity[] = shortMatchCheck.teams.map(team => ({
      type: 'TEAM' as EntityType,
      name: team.charAt(0).toUpperCase() + team.slice(1), // Capitalize
      confidence: 0.9,
      sport: sport,
    }));
    
    // Merge with existing entities (avoid duplicates)
    for (const te of teamEntities) {
      if (!entities.some(e => e.name.toLowerCase() === te.name.toLowerCase())) {
        entities.push(te);
      }
    }
    
    // This is definitely a match prediction
    const understanding: QueryUnderstanding = {
      originalQuery: query,
      intent: 'MATCH_PREDICTION',
      intentConfidence: 0.95,
      timeFrame: 'UPCOMING',
      entities,
      sport,
      needsRealTimeData: false,
      needsVerifiedStats: false,
      needsOurPrediction: true,
      suggestedDataSources: ['predictions-db', 'analyze-api'],
      isAmbiguous: false,
      patternMatched: 'SHORT_MATCH_QUERY',
      usedLLM: false,
    };
    
    await cacheSet(cacheKey, understanding, 3600);
    console.log(`[QueryIntelligence] ✅ Classified as MATCH_PREDICTION (short query) in ${Date.now() - startTime}ms`);
    return understanding;
  }
  
  // Try pattern-based classification first (fast)
  const patternResult = classifyIntentByPatterns(query);
  
  let intent = patternResult.intent;
  let intentConfidence = patternResult.confidence;
  let alternativeIntents = patternResult.alternatives;
  let isAmbiguous = false;
  let patternMatched: string | undefined = patternResult.matchedPattern;
  let usedLLM = false;
  
  // SMART FEATURE 2: If patterns didn't match well, try context inference
  if (intent === 'UNCLEAR' || intentConfidence < 0.6) {
    const inferredIntent = inferIntentFromContext(query, entities);
    if (inferredIntent) {
      console.log(`[QueryIntelligence] Inferred intent from context: ${inferredIntent}`);
      intent = inferredIntent;
      intentConfidence = 0.75; // Context inference is fairly reliable
      patternMatched = 'CONTEXT_INFERENCE';
      
      // Adjust timeframe for match predictions
      if (inferredIntent === 'MATCH_PREDICTION') {
        timeFrame = 'UPCOMING';
      }
    }
  }
  
  // If still low confidence or UNCLEAR, use LLM
  if (intentConfidence < 0.6 || intent === 'UNCLEAR') {
    console.log(`[QueryIntelligence] Low confidence (${intentConfidence}), using LLM...`);
    usedLLM = true;
    const llmResult = await classifyWithLLM(query);
    
    intent = llmResult.intent;
    intentConfidence = llmResult.confidence;
    patternMatched = undefined; // LLM classified, no pattern
    
    // Merge LLM entities with pattern entities
    for (const llmEntity of llmResult.entities) {
      if (!entities.some(e => e.name.toLowerCase() === llmEntity.name.toLowerCase())) {
        entities.push(llmEntity);
      }
    }
    
    isAmbiguous = intentConfidence < 0.6;
  }
  
  // Clean up entities - remove garbage like "Will Roma" which should just be "Roma"
  const cleanedEntities = entities.map(e => {
    // Remove common question words from entity names
    let cleanName = e.name
      .replace(/^(Will|Can|Should|Does|Do|Is|Are|What|Who|How|When|Where|Why)\s+/i, '')
      .replace(/\s+(win|beat|defeat|play|playing|against|vs|today|tonight|match|game)$/i, '')
      .trim();
    return { ...e, name: cleanName };
  }).filter(e => e.name.length >= 2); // Remove empty/tiny entities
  
  // Deduplicate after cleanup
  const deduplicatedEntities: ExtractedEntity[] = [];
  for (const entity of cleanedEntities) {
    if (!deduplicatedEntities.some(e => e.name.toLowerCase() === entity.name.toLowerCase())) {
      deduplicatedEntities.push(entity);
    }
  }
  
  // Determine data needs based on intent
  const needsRealTimeData = ['INJURY_NEWS', 'TRANSFER_NEWS', 'MATCH_RESULT', 'LINEUP'].includes(intent) || timeFrame === 'LIVE';
  const needsVerifiedStats = ['PLAYER_STATS', 'TEAM_STATS', 'STANDINGS', 'FORM_CHECK', 'HEAD_TO_HEAD'].includes(intent);
  const needsOurPrediction = intent === 'OUR_ANALYSIS' || intent === 'MATCH_PREDICTION';
  
  // Suggest data sources
  const suggestedDataSources: string[] = [];
  if (needsVerifiedStats) suggestedDataSources.push('verified-stats', 'data-layer');
  if (needsOurPrediction) suggestedDataSources.push('predictions-db');
  if (intent === 'STANDINGS') suggestedDataSources.push('standings-api');
  if (intent === 'LINEUP') suggestedDataSources.push('lineup-api');
  if (needsRealTimeData && !needsVerifiedStats) suggestedDataSources.push('perplexity');
  
  const understanding: QueryUnderstanding = {
    originalQuery: query,
    intent,
    intentConfidence,
    timeFrame,
    entities: deduplicatedEntities,
    sport,
    needsRealTimeData,
    needsVerifiedStats,
    needsOurPrediction,
    suggestedDataSources,
    isAmbiguous,
    alternativeIntents: alternativeIntents.length > 0 ? alternativeIntents : undefined,
    clarifyingQuestion: isAmbiguous ? generateClarifyingQuestion(query, intent, alternativeIntents) : undefined,
    // Learning/tracking fields
    patternMatched,
    usedLLM,
  };
  
  // Cache for 5 minutes
  await cacheSet(cacheKey, understanding, 300);
  
  console.log(`[QueryIntelligence] Understood in ${Date.now() - startTime}ms:`, {
    intent,
    confidence: intentConfidence,
    entities: deduplicatedEntities.map(e => e.name),
    sport,
    dataNeeds: suggestedDataSources,
    usedLLM,
  });
  
  return understanding;
}

/**
 * Generate a clarifying question for ambiguous queries
 */
function generateClarifyingQuestion(query: string, intent: QueryIntent, alternatives: QueryIntent[]): string {
  const intentQuestions: Record<string, string> = {
    'PLAYER_STATS': 'their statistics',
    'TEAM_STATS': 'team performance',
    'MATCH_PREDICTION': 'who will win',
    'INJURY_NEWS': 'injury/availability status',
    'FORM_CHECK': 'recent form',
  };
  
  if (alternatives.length > 0) {
    const options = [intent, ...alternatives]
      .map(i => intentQuestions[i])
      .filter(Boolean)
      .slice(0, 3);
    
    if (options.length > 1) {
      return `Are you asking about ${options.slice(0, -1).join(', ')} or ${options[options.length - 1]}?`;
    }
  }
  
  return 'Could you be more specific about what you\'d like to know?';
}

/**
 * Legacy QueryCategory type for backward compatibility
 */
export type QueryCategory = 'PLAYER' | 'ROSTER' | 'FIXTURE' | 'RESULT' | 'STANDINGS' | 'STATS' | 
  'INJURY' | 'TRANSFER' | 'MANAGER' | 'ODDS' | 'COMPARISON' | 'HISTORY' | 'BROADCAST' | 
  'VENUE' | 'PLAYER_PROP' | 'BETTING_ADVICE' | 'OUR_PREDICTION' | 'GENERAL';

/**
 * Map QueryIntent to legacy QueryCategory for backward compatibility
 */
export function mapIntentToCategory(intent: QueryIntent): QueryCategory {
  const mapping: Record<QueryIntent, QueryCategory> = {
    'PLAYER_STATS': 'STATS',
    'TEAM_STATS': 'STATS',
    'MATCH_PREDICTION': 'OUR_PREDICTION',
    'MATCH_RESULT': 'RESULT',
    'STANDINGS': 'STANDINGS',
    'LINEUP': 'ROSTER',
    'INJURY_NEWS': 'INJURY',
    'TRANSFER_NEWS': 'TRANSFER',
    'HEAD_TO_HEAD': 'COMPARISON',
    'FORM_CHECK': 'STATS',
    'BETTING_ANALYSIS': 'BETTING_ADVICE',
    'SCHEDULE': 'FIXTURE',
    'GENERAL_INFO': 'GENERAL',
    'OUR_ANALYSIS': 'OUR_PREDICTION',
    'UNCLEAR': 'GENERAL',
  };
  
  return mapping[intent] || 'GENERAL';
}
