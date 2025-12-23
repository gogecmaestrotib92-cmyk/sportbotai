/**
 * Data Source Router
 * 
 * Intelligently routes queries to the best data source:
 * - DataLayer: For structured data (stats, rosters, standings, fixtures)
 * - Perplexity: For real-time/news data (injuries, transfers, breaking news)
 * - GPT Only: For opinions, analysis, predictions (no external data needed)
 * 
 * This ensures accurate data by using authoritative APIs when available,
 * falling back to web search only when necessary.
 */

import { DataLayer } from './data-layer';

export type DataSource = 'datalayer' | 'perplexity' | 'gpt_only' | 'hybrid';

export interface RouteResult {
  source: DataSource;
  data?: string;
  error?: string;
  metadata?: {
    playerId?: string;
    teamId?: string;
    sport?: string;
    fromCache?: boolean;
  };
}

export interface RouteOptions {
  sport?: string;
  league?: string;
  season?: string;
}

// Known player name patterns for NBA
// variations: all ways users might refer to the player
// searchName: what we use to search the API (usually last name)
// displayName: the full proper name for display
const NBA_PLAYER_PATTERNS: Record<string, { variations: string[]; searchName: string; displayName: string }> = {
  // Top NBA Stars
  'embiid': { variations: ['embiid', 'joel embiid', 'embiid joel', 'joel', 'the process'], searchName: 'embiid', displayName: 'Joel Embiid' },
  'lebron': { variations: ['lebron', 'lebron james', 'james', 'king james', 'lbj', 'bron'], searchName: 'james', displayName: 'LeBron James' },
  'curry': { variations: ['curry', 'steph curry', 'stephen curry', 'steph', 'chef curry'], searchName: 'curry', displayName: 'Stephen Curry' },
  'durant': { variations: ['durant', 'kevin durant', 'kd', 'easy money sniper'], searchName: 'durant', displayName: 'Kevin Durant' },
  'giannis': { variations: ['giannis', 'antetokounmpo', 'greek freak', 'giannis antetokounmpo'], searchName: 'antetokounmpo', displayName: 'Giannis Antetokounmpo' },
  'jokic': { variations: ['jokic', 'nikola jokic', 'joker', 'nikola', 'big honey'], searchName: 'jokic', displayName: 'Nikola Jokic' },
  'doncic': { variations: ['luka', 'doncic', 'luka doncic', 'luka magic', 'dončić'], searchName: 'doncic', displayName: 'Luka Doncic' },
  'tatum': { variations: ['tatum', 'jayson tatum', 'jayson', 'jt'], searchName: 'tatum', displayName: 'Jayson Tatum' },
  'davis': { variations: ['anthony davis', 'ad', 'davis', 'the brow'], searchName: 'davis', displayName: 'Anthony Davis' },
  'lillard': { variations: ['dame', 'lillard', 'damian lillard', 'dame time', 'damian'], searchName: 'lillard', displayName: 'Damian Lillard' },
  'morant': { variations: ['ja', 'morant', 'ja morant'], searchName: 'morant', displayName: 'Ja Morant' },
  'booker': { variations: ['booker', 'devin booker', 'book', 'devin'], searchName: 'booker', displayName: 'Devin Booker' },
  'brown': { variations: ['jaylen brown', 'jaylen', 'jb'], searchName: 'brown', displayName: 'Jaylen Brown' },
  'edwards': { variations: ['ant', 'anthony edwards', 'edwards', 'ant-man'], searchName: 'edwards', displayName: 'Anthony Edwards' },
  'sga': { variations: ['sga', 'shai', 'gilgeous-alexander', 'shai gilgeous-alexander', 'gilgeous'], searchName: 'gilgeous-alexander', displayName: 'Shai Gilgeous-Alexander' },
  'wembanyama': { variations: ['wemby', 'wembanyama', 'victor wembanyama', 'victor', 'alien'], searchName: 'wembanyama', displayName: 'Victor Wembanyama' },
  'brunson': { variations: ['brunson', 'jalen brunson', 'jalen'], searchName: 'brunson', displayName: 'Jalen Brunson' },
  'harden': { variations: ['harden', 'james harden', 'the beard'], searchName: 'harden', displayName: 'James Harden' },
  'irving': { variations: ['kyrie', 'irving', 'kyrie irving', 'uncle drew'], searchName: 'irving', displayName: 'Kyrie Irving' },
  'george': { variations: ['pg', 'paul george', 'george', 'pg13'], searchName: 'george', displayName: 'Paul George' },
  'mitchell': { variations: ['donovan mitchell', 'mitchell', 'spida', 'donovan'], searchName: 'mitchell', displayName: 'Donovan Mitchell' },
  'fox': { variations: ['fox', 'de\'aaron fox', 'swipa', 'deaaron'], searchName: 'fox', displayName: 'De\'Aaron Fox' },
  'towns': { variations: ['kat', 'towns', 'karl-anthony towns', 'karl anthony'], searchName: 'towns', displayName: 'Karl-Anthony Towns' },
  'butler': { variations: ['jimmy', 'butler', 'jimmy butler', 'jimmy buckets'], searchName: 'butler', displayName: 'Jimmy Butler' },
  'adebayo': { variations: ['bam', 'adebayo', 'bam adebayo'], searchName: 'adebayo', displayName: 'Bam Adebayo' },
  'maxey': { variations: ['maxey', 'tyrese maxey', 'tyrese'], searchName: 'maxey', displayName: 'Tyrese Maxey' },
  'young': { variations: ['trae', 'trae young', 'young', 'ice trae'], searchName: 'young', displayName: 'Trae Young' },
  'ball': { variations: ['lamelo', 'lamelo ball', 'melo'], searchName: 'ball', displayName: 'LaMelo Ball' },
  'westbrook': { variations: ['westbrook', 'russell westbrook', 'russ', 'brodie'], searchName: 'westbrook', displayName: 'Russell Westbrook' },
};

/**
 * Determine the best data source for a query
 */
export function determineDataSource(
  message: string,
  category: string
): DataSource {
  const lower = message.toLowerCase();
  
  // Categories that should use DataLayer (structured API data)
  const dataLayerCategories = ['STATS', 'ROSTER', 'STANDINGS', 'FIXTURE'];
  
  // Categories that should use Perplexity (real-time web search)
  const perplexityCategories = ['INJURY', 'TRANSFER', 'NEWS', 'MANAGER'];
  
  // Categories that don't need external data
  const gptOnlyCategories = ['OPINION', 'PREDICTION', 'COMPARISON'];
  
  // Hybrid: needs both API data and web search
  const hybridCategories = ['MATCH_PREVIEW', 'PLAYER'];
  
  if (dataLayerCategories.includes(category)) {
    // Check if we have API support for this specific query
    const sport = detectSport(message);
    if (sport && ['basketball', 'hockey', 'american_football', 'football'].includes(sport)) {
      return 'datalayer';
    }
    // Fall back to Perplexity for unsupported sports
    return 'perplexity';
  }
  
  if (perplexityCategories.includes(category)) {
    return 'perplexity';
  }
  
  if (gptOnlyCategories.includes(category)) {
    return 'gpt_only';
  }
  
  if (hybridCategories.includes(category)) {
    return 'hybrid';
  }
  
  // Default: use Perplexity for unknown categories
  return 'perplexity';
}

/**
 * Detect sport from message
 */
function detectSport(message: string): string | undefined {
  const lower = message.toLowerCase();
  
  if (/basketball|nba|euroleague|lakers|celtics|warriors|nets|76ers|sixers|bucks|heat|knicks|bulls|suns|mavericks|nuggets|ppg|rebounds|assists|embiid|lebron|curry|giannis|jokic|dončić|doncic|tatum|durant/i.test(lower)) {
    return 'basketball';
  }
  
  if (/\bnfl\b|chiefs|eagles|cowboys|patriots|bills|dolphins|ravens|49ers|bengals|lions|packers|mahomes|allen|burrow|hurts|herbert|touchdown|quarterback/i.test(lower)) {
    return 'american_football';
  }
  
  if (/\bnhl\b|hockey|rangers|bruins|maple leafs|canadiens|oilers|avalanche|lightning|panthers|penguins|capitals|mcdavid|crosby|ovechkin/i.test(lower)) {
    return 'hockey';
  }
  
  if (/premier league|la liga|serie a|bundesliga|champions league|soccer|manchester|liverpool|arsenal|chelsea|barcelona|real madrid|bayern|psg|haaland|mbappe|salah/i.test(lower)) {
    return 'football';
  }
  
  return undefined;
}

/**
 * Extract player name from message
 * Returns the searchName (usually last name) for API lookup
 */
function extractPlayerName(message: string): { searchName: string; displayName: string } | undefined {
  const lower = message.toLowerCase();
  
  // Check known players - match longest variation first for accuracy
  let bestMatch: { key: string; variation: string; info: { searchName: string; displayName: string } } | null = null;
  
  for (const [key, info] of Object.entries(NBA_PLAYER_PATTERNS)) {
    for (const variation of info.variations) {
      if (lower.includes(variation)) {
        // Prefer longer matches (more specific)
        if (!bestMatch || variation.length > bestMatch.variation.length) {
          bestMatch = { key, variation, info };
        }
      }
    }
  }
  
  if (bestMatch) {
    console.log(`[Router] Matched player: "${bestMatch.variation}" -> ${bestMatch.info.displayName} (search: ${bestMatch.info.searchName})`);
    return { searchName: bestMatch.info.searchName, displayName: bestMatch.info.displayName };
  }
  
  // Try to extract name pattern (for unknown players)
  const nameMatch = message.match(/([A-Z][a-zćčšžđ]+(?:\s+[A-Z][a-zćčšžđ]+)+)/);
  if (nameMatch) {
    const fullName = nameMatch[1];
    const parts = fullName.split(' ');
    const lastName = parts[parts.length - 1].toLowerCase();
    console.log(`[Router] Extracted unknown player: "${fullName}" (search: ${lastName})`);
    return { searchName: lastName, displayName: fullName };
  }
  
  return undefined;
}

/**
 * Route a stats query to the appropriate data source
 */
export async function routeStatsQuery(
  message: string,
  options: RouteOptions = {}
): Promise<RouteResult> {
  const dataLayer = new DataLayer({ enableCaching: true });
  const sport = options.sport || detectSport(message) || 'basketball';
  const playerInfo = extractPlayerName(message);
  
  if (!playerInfo) {
    // No player detected, use Perplexity
    return {
      source: 'perplexity',
      error: 'Could not extract player name from query',
    };
  }
  
  console.log(`[Router] Stats query for "${playerInfo.displayName}" (search: ${playerInfo.searchName}) in ${sport}`);
  
  // Only basketball is currently supported for player stats
  if (sport !== 'basketball') {
    return {
      source: 'perplexity',
      metadata: { sport },
    };
  }
  
  try {
    // Search for player using the searchName
    const searchResult = await dataLayer.searchPlayer('basketball', playerInfo.searchName);
    
    if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
      console.log(`[Router] Player "${playerInfo.displayName}" not found in API, falling back to Perplexity`);
      return {
        source: 'perplexity',
        metadata: { sport },
      };
    }
    
    // Get the first matching player
    const player = searchResult.data[0];
    console.log(`[Router] Found player: ${player.name} (ID: ${player.id})`);
    
    // Get player stats
    const statsResult = await dataLayer.getPlayerStats('basketball', player.id, options.season);
    
    if (!statsResult.success || !statsResult.data) {
      console.log(`[Router] Stats not found for ${player.name}, falling back to Perplexity`);
      return {
        source: 'perplexity',
        metadata: { sport, playerId: player.id },
      };
    }
    
    const stats = statsResult.data;
    
    // Format stats for GPT consumption
    const formattedStats = `
=== PLAYER STATS FROM API (AUTHORITATIVE) ===
Player: ${player.name}
Season: ${stats.season}
Games Played: ${stats.games.played}
Minutes Per Game: ${stats.games.minutes || 'N/A'}

SCORING:
- Points Per Game: ${stats.scoring.points}
- Assists Per Game: ${stats.scoring.assists}
- Field Goal %: ${stats.scoring.fieldGoals?.percentage || 'N/A'}%
- 3-Point %: ${stats.scoring.threePointers?.percentage || 'N/A'}%
- Free Throw %: ${stats.scoring.freeThrows?.percentage || 'N/A'}%

DEFENSE:
- Rebounds Per Game: ${stats.defense?.rebounds || 'N/A'}
- Steals Per Game: ${stats.defense?.steals || 'N/A'}
- Blocks Per Game: ${stats.defense?.blocks || 'N/A'}

⚠️ These stats are from the official API. Use ONLY these numbers in your response.
=== END STATS ===
`.trim();
    
    return {
      source: 'datalayer',
      data: formattedStats,
      metadata: {
        playerId: player.id,
        teamId: stats.teamId,
        sport,
      },
    };
  } catch (error) {
    console.error('[Router] Error fetching from DataLayer:', error);
    return {
      source: 'perplexity',
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { sport },
    };
  }
}

/**
 * Route any query to the appropriate data source
 */
export async function routeQuery(
  message: string,
  category: string,
  options: RouteOptions = {}
): Promise<RouteResult> {
  const source = determineDataSource(message, category);
  
  console.log(`[Router] Query category: ${category}, source: ${source}`);
  
  switch (source) {
    case 'datalayer':
      if (category === 'STATS') {
        return routeStatsQuery(message, options);
      }
      // TODO: Add other DataLayer routes (roster, standings, etc.)
      return { source: 'perplexity' };
      
    case 'perplexity':
      return { source: 'perplexity' };
      
    case 'gpt_only':
      return { source: 'gpt_only' };
      
    case 'hybrid':
      // For hybrid, try DataLayer first, then supplement with Perplexity
      if (category === 'STATS') {
        const result = await routeStatsQuery(message, options);
        if (result.source === 'datalayer' && result.data) {
          return result;
        }
      }
      return { source: 'perplexity' };
      
    default:
      return { source: 'perplexity' };
  }
}

/**
 * Check if a query should use DataLayer for reliable stats
 */
export function shouldUseDataLayer(message: string, category: string): boolean {
  const source = determineDataSource(message, category);
  return source === 'datalayer' || source === 'hybrid';
}
