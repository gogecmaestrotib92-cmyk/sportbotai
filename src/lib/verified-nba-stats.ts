/**
 * Verified NBA Stats Service
 * 
 * GUARDRAILS:
 * - For ANY numeric stats question: DO NOT answer from LLM memory
 * - MUST call API-Sports NBA first and answer ONLY from response
 * 
 * This service ensures:
 * 1. Correct season resolution ("this season" → "2024-2025")
 * 2. Proper caching (player IDs: 7 days, stats: 6 hours)
 * 3. Season validation (requested == returned)
 * 4. Strict response contract with source attribution
 */

import { DataLayer } from './data-layer';
import { NormalizedPlayerStats, NormalizedPlayer, NormalizedTeamStats } from './data-layer/types';

// ============================================================================
// Types
// ============================================================================

export type SeasonType = 'regular' | 'playoffs' | 'preseason';

export interface VerifiedStatsRequest {
  playerName?: string;
  teamName?: string;
  season?: string;  // "this season", "2024-2025", "last season", etc.
  seasonType?: SeasonType;
}

export interface VerifiedPlayerStats {
  playerFullName: string;
  playerId: string;
  teamName: string;
  season: string;           // e.g., "2024-2025"
  seasonType: SeasonType;
  gamesPlayed: number;
  source: 'API-Sports NBA';
  
  stats: {
    pointsPerGame: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    stealsPerGame: number;
    blocksPerGame: number;
    minutesPerGame: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
  };
  
  fetchedAt: Date;
}

export interface VerifiedTeamStats {
  teamFullName: string;
  teamId: string;
  season: string;
  seasonType: SeasonType;
  gamesPlayed: number;
  source: 'API-Sports NBA';
  
  stats: {
    wins: number;
    losses: number;
    winPercentage: number;
    pointsPerGame: number;
    pointsAllowedPerGame: number;
    pointDifferential: number;
  };
  
  form?: string;
  fetchedAt: Date;
}

export interface VerifiedStatsResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
}

// ============================================================================
// Season Normalizer
// ============================================================================

export class SeasonNormalizer {
  /**
   * Get current NBA season in YYYY-YYYY format
   * NBA season runs Oct-June, so Dec 2024 = 2024-2025 season
   */
  static getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    
    // If before October, we're in the previous year's season
    // Oct 2024 - June 2025 = "2024-2025"
    if (month < 10) {
      return `${year - 1}-${year}`;
    }
    return `${year}-${year + 1}`;
  }
  
  /**
   * Convert user input to explicit season key
   * @param input - "this season", "2024-2025", "last season", "2024", etc.
   * @returns Normalized season in "YYYY-YYYY" format
   */
  static normalize(input?: string): string {
    if (!input) {
      return this.getCurrentSeason();
    }
    
    const lower = input.toLowerCase().trim();
    
    // Handle relative seasons
    if (lower === 'this season' || lower === 'current season' || lower === 'current') {
      return this.getCurrentSeason();
    }
    
    if (lower === 'last season' || lower === 'previous season') {
      const current = this.getCurrentSeason();
      const [startYear] = current.split('-').map(Number);
      return `${startYear - 1}-${startYear}`;
    }
    
    // Handle "YYYY-YYYY" format (already normalized)
    const fullMatch = input.match(/^(\d{4})-(\d{4})$/);
    if (fullMatch) {
      return input;
    }
    
    // Handle "YYYY-YY" format (e.g., "2024-25")
    const shortMatch = input.match(/^(\d{4})-(\d{2})$/);
    if (shortMatch) {
      const startYear = parseInt(shortMatch[1]);
      const endYearShort = parseInt(shortMatch[2]);
      const century = Math.floor(startYear / 100) * 100;
      return `${startYear}-${century + endYearShort}`;
    }
    
    // Handle single year (e.g., "2024" -> "2024-2025")
    const yearMatch = input.match(/^(\d{4})$/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      return `${year}-${year + 1}`;
    }
    
    // Default to current season
    console.warn(`[SeasonNormalizer] Could not parse season: "${input}", using current`);
    return this.getCurrentSeason();
  }
  
  /**
   * Convert to API-Sports format
   * API-Sports NBA uses "YYYY-YYYY" format
   */
  static toAPIFormat(season: string): string {
    // Already in correct format
    return season;
  }
  
  /**
   * Get display-friendly season string
   */
  static toDisplay(season: string): string {
    // Convert "2024-2025" to "2024-25"
    const match = season.match(/^(\d{4})-(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2].slice(2)}`;
    }
    return season;
  }
}

// ============================================================================
// Player Cache (7 day TTL)
// ============================================================================

interface CachedPlayer {
  player: NormalizedPlayer;
  cachedAt: Date;
}

const playerCache = new Map<string, CachedPlayer>();
const PLAYER_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCachedPlayer(searchName: string): NormalizedPlayer | null {
  const cached = playerCache.get(searchName.toLowerCase());
  if (!cached) return null;
  
  const age = Date.now() - cached.cachedAt.getTime();
  if (age > PLAYER_CACHE_TTL_MS) {
    playerCache.delete(searchName.toLowerCase());
    return null;
  }
  
  console.log(`[VerifiedStats] Player cache hit: ${cached.player.name}`);
  return cached.player;
}

function cachePlayer(searchName: string, player: NormalizedPlayer): void {
  playerCache.set(searchName.toLowerCase(), {
    player,
    cachedAt: new Date(),
  });
}

// ============================================================================
// Stats Cache (6 hour TTL)
// ============================================================================

interface CachedStats<T> {
  data: T;
  season: string;
  cachedAt: Date;
}

const statsCache = new Map<string, CachedStats<VerifiedPlayerStats | VerifiedTeamStats>>();
const STATS_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getStatsCacheKey(type: 'player' | 'team', id: string, season: string): string {
  return `${type}:${id}:${season}`;
}

function getCachedStats<T>(key: string): T | null {
  const cached = statsCache.get(key);
  if (!cached) return null;
  
  const age = Date.now() - cached.cachedAt.getTime();
  if (age > STATS_CACHE_TTL_MS) {
    statsCache.delete(key);
    return null;
  }
  
  console.log(`[VerifiedStats] Stats cache hit: ${key}`);
  return cached.data as T;
}

function cacheStats<T extends VerifiedPlayerStats | VerifiedTeamStats>(key: string, data: T, season: string): void {
  statsCache.set(key, {
    data,
    season,
    cachedAt: new Date(),
  });
}

// ============================================================================
// Known Player Mappings
// ============================================================================

interface PlayerMapping {
  searchName: string;      // What we search API with (usually last name)
  displayName: string;     // Full display name
  variations: string[];    // All ways users might refer to this player
}

const NBA_PLAYERS: Record<string, PlayerMapping> = {
  // Top NBA Stars
  'embiid': { searchName: 'embiid', displayName: 'Joel Embiid', variations: ['embiid', 'joel embiid', 'embiid joel', 'joel', 'the process'] },
  'lebron': { searchName: 'james', displayName: 'LeBron James', variations: ['lebron', 'lebron james', 'james', 'king james', 'lbj', 'bron'] },
  'curry': { searchName: 'curry', displayName: 'Stephen Curry', variations: ['curry', 'steph curry', 'stephen curry', 'steph', 'chef curry'] },
  'durant': { searchName: 'durant', displayName: 'Kevin Durant', variations: ['durant', 'kevin durant', 'kd', 'easy money sniper'] },
  'giannis': { searchName: 'antetokounmpo', displayName: 'Giannis Antetokounmpo', variations: ['giannis', 'antetokounmpo', 'greek freak', 'giannis antetokounmpo'] },
  'jokic': { searchName: 'jokic', displayName: 'Nikola Jokic', variations: ['jokic', 'nikola jokic', 'joker', 'nikola', 'big honey'] },
  'doncic': { searchName: 'doncic', displayName: 'Luka Doncic', variations: ['luka', 'doncic', 'luka doncic', 'luka magic', 'dončić'] },
  'tatum': { searchName: 'tatum', displayName: 'Jayson Tatum', variations: ['tatum', 'jayson tatum', 'jayson', 'jt'] },
  'davis': { searchName: 'davis', displayName: 'Anthony Davis', variations: ['anthony davis', 'ad', 'davis', 'the brow'] },
  'lillard': { searchName: 'lillard', displayName: 'Damian Lillard', variations: ['dame', 'lillard', 'damian lillard', 'dame time', 'damian'] },
  'morant': { searchName: 'morant', displayName: 'Ja Morant', variations: ['ja', 'morant', 'ja morant'] },
  'booker': { searchName: 'booker', displayName: 'Devin Booker', variations: ['booker', 'devin booker', 'book', 'devin'] },
  'brown': { searchName: 'brown', displayName: 'Jaylen Brown', variations: ['jaylen brown', 'jaylen', 'jb'] },
  'edwards': { searchName: 'edwards', displayName: 'Anthony Edwards', variations: ['ant', 'anthony edwards', 'edwards', 'ant-man'] },
  'sga': { searchName: 'gilgeous-alexander', displayName: 'Shai Gilgeous-Alexander', variations: ['sga', 'shai', 'gilgeous-alexander', 'shai gilgeous-alexander', 'gilgeous'] },
  'wembanyama': { searchName: 'wembanyama', displayName: 'Victor Wembanyama', variations: ['wemby', 'wembanyama', 'victor wembanyama', 'victor', 'alien'] },
  'brunson': { searchName: 'brunson', displayName: 'Jalen Brunson', variations: ['brunson', 'jalen brunson', 'jalen'] },
  'harden': { searchName: 'harden', displayName: 'James Harden', variations: ['harden', 'james harden', 'the beard'] },
  'irving': { searchName: 'irving', displayName: 'Kyrie Irving', variations: ['kyrie', 'irving', 'kyrie irving', 'uncle drew'] },
  'george': { searchName: 'george', displayName: 'Paul George', variations: ['pg', 'paul george', 'george', 'pg13'] },
  'mitchell': { searchName: 'mitchell', displayName: 'Donovan Mitchell', variations: ['donovan mitchell', 'mitchell', 'spida', 'donovan'] },
  'fox': { searchName: 'fox', displayName: 'De\'Aaron Fox', variations: ['fox', 'de\'aaron fox', 'swipa', 'deaaron'] },
  'towns': { searchName: 'towns', displayName: 'Karl-Anthony Towns', variations: ['kat', 'towns', 'karl-anthony towns', 'karl anthony'] },
  'butler': { searchName: 'butler', displayName: 'Jimmy Butler', variations: ['jimmy', 'butler', 'jimmy butler', 'jimmy buckets'] },
  'adebayo': { searchName: 'adebayo', displayName: 'Bam Adebayo', variations: ['bam', 'adebayo', 'bam adebayo'] },
  'maxey': { searchName: 'maxey', displayName: 'Tyrese Maxey', variations: ['maxey', 'tyrese maxey', 'tyrese'] },
  'young': { searchName: 'young', displayName: 'Trae Young', variations: ['trae', 'trae young', 'young', 'ice trae'] },
  'ball': { searchName: 'ball', displayName: 'LaMelo Ball', variations: ['lamelo', 'lamelo ball', 'melo'] },
  'westbrook': { searchName: 'westbrook', displayName: 'Russell Westbrook', variations: ['westbrook', 'russell westbrook', 'russ', 'brodie'] },
};

// ============================================================================
// Player Resolution
// ============================================================================

/**
 * Extract player info from user message
 */
function extractPlayerFromMessage(message: string): PlayerMapping | null {
  const lower = message.toLowerCase();
  
  // Match longest variation first for accuracy
  let bestMatch: { key: string; variation: string; mapping: PlayerMapping } | null = null;
  
  for (const [key, mapping] of Object.entries(NBA_PLAYERS)) {
    for (const variation of mapping.variations) {
      if (lower.includes(variation)) {
        if (!bestMatch || variation.length > bestMatch.variation.length) {
          bestMatch = { key, variation, mapping };
        }
      }
    }
  }
  
  if (bestMatch) {
    console.log(`[VerifiedStats] Matched: "${bestMatch.variation}" -> ${bestMatch.mapping.displayName}`);
    return bestMatch.mapping;
  }
  
  // Try to extract unknown player name (Firstname Lastname pattern)
  const nameMatch = message.match(/([A-Z][a-zćčšžđ']+(?:\s+[A-Z][a-zćčšžđ'-]+)+)/);
  if (nameMatch) {
    const fullName = nameMatch[1];
    const parts = fullName.split(/\s+/);
    const lastName = parts[parts.length - 1].toLowerCase();
    console.log(`[VerifiedStats] Unknown player: "${fullName}" (search: ${lastName})`);
    return {
      searchName: lastName,
      displayName: fullName,
      variations: [fullName.toLowerCase()],
    };
  }
  
  return null;
}

/**
 * Extract team name from user message
 */
function extractTeamFromMessage(message: string): string | null {
  const lower = message.toLowerCase();
  
  const teamPatterns: Record<string, string[]> = {
    'Boston Celtics': ['celtics', 'boston'],
    'Los Angeles Lakers': ['lakers', 'la lakers'],
    'Golden State Warriors': ['warriors', 'golden state', 'gsw'],
    'Milwaukee Bucks': ['bucks', 'milwaukee'],
    'Philadelphia 76ers': ['76ers', 'sixers', 'philadelphia', 'philly'],
    'Denver Nuggets': ['nuggets', 'denver'],
    'Phoenix Suns': ['suns', 'phoenix'],
    'Dallas Mavericks': ['mavericks', 'mavs', 'dallas'],
    'Miami Heat': ['heat', 'miami'],
    'Brooklyn Nets': ['nets', 'brooklyn'],
    'New York Knicks': ['knicks', 'new york', 'nyc'],
    'Cleveland Cavaliers': ['cavaliers', 'cavs', 'cleveland'],
    'Oklahoma City Thunder': ['thunder', 'okc', 'oklahoma'],
    'Minnesota Timberwolves': ['timberwolves', 'wolves', 'minnesota'],
    'Sacramento Kings': ['kings', 'sacramento'],
    'New Orleans Pelicans': ['pelicans', 'new orleans'],
    'Memphis Grizzlies': ['grizzlies', 'memphis'],
    'Los Angeles Clippers': ['clippers', 'la clippers'],
    'Chicago Bulls': ['bulls', 'chicago'],
    'Atlanta Hawks': ['hawks', 'atlanta'],
    'Toronto Raptors': ['raptors', 'toronto'],
    'Houston Rockets': ['rockets', 'houston'],
    'Indiana Pacers': ['pacers', 'indiana'],
    'Orlando Magic': ['magic', 'orlando'],
    'Charlotte Hornets': ['hornets', 'charlotte'],
    'Detroit Pistons': ['pistons', 'detroit'],
    'Washington Wizards': ['wizards', 'washington'],
    'Portland Trail Blazers': ['blazers', 'trail blazers', 'portland'],
    'Utah Jazz': ['jazz', 'utah'],
    'San Antonio Spurs': ['spurs', 'san antonio'],
  };
  
  for (const [fullName, patterns] of Object.entries(teamPatterns)) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        return fullName;
      }
    }
  }
  
  return null;
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Resolve player name to player ID
 * Uses cache (7 day TTL)
 */
async function resolvePlayer(
  dataLayer: DataLayer,
  playerMapping: PlayerMapping,
  season: string
): Promise<VerifiedStatsResult<NormalizedPlayer>> {
  // Check cache first
  const cached = getCachedPlayer(playerMapping.searchName);
  if (cached) {
    return { success: true, data: cached };
  }
  
  // Search via DataLayer
  const result = await dataLayer.searchPlayer('basketball', playerMapping.searchName, season);
  
  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      error: `Could not find player "${playerMapping.displayName}" in API-Sports NBA database`,
    };
  }
  
  const player = result.data[0];
  
  // Cache the result
  cachePlayer(playerMapping.searchName, player);
  
  return { success: true, data: player };
}

/**
 * Fetch player season averages
 * Uses cache (6 hour TTL)
 */
async function fetchPlayerSeasonAverages(
  dataLayer: DataLayer,
  playerId: string,
  playerName: string,
  season: string,
  seasonType: SeasonType = 'regular'
): Promise<VerifiedStatsResult<VerifiedPlayerStats>> {
  const cacheKey = getStatsCacheKey('player', playerId, season);
  
  // Check cache first
  const cached = getCachedStats<VerifiedPlayerStats>(cacheKey);
  if (cached) {
    // Validate season matches
    if (cached.season === season) {
      return { success: true, data: cached };
    }
  }
  
  // Fetch from API
  const result = await dataLayer.getPlayerStats('basketball', playerId, season);
  
  if (!result.success || !result.data) {
    return {
      success: false,
      error: `Could not fetch stats for player ID ${playerId} in season ${season}`,
    };
  }
  
  const rawStats = result.data;
  
  // Validate returned season matches requested
  if (rawStats.season !== season) {
    console.warn(`[VerifiedStats] Season mismatch: requested ${season}, got ${rawStats.season}`);
    
    // Try alternate format
    const altSeason = season.includes('-') ? season.split('-')[0] : `${season}-${parseInt(season) + 1}`;
    const retryResult = await dataLayer.getPlayerStats('basketball', playerId, altSeason);
    
    if (!retryResult.success || !retryResult.data || retryResult.data.season !== season) {
      return {
        success: false,
        error: `Season mismatch: requested ${season} but API returned ${rawStats.season}`,
        warning: 'Stats may be from a different season',
      };
    }
  }
  
  // Transform to verified format
  const verifiedStats: VerifiedPlayerStats = {
    playerFullName: playerName,
    playerId,
    teamName: rawStats.teamId || 'Unknown',
    season: rawStats.season,
    seasonType,
    gamesPlayed: rawStats.games.played,
    source: 'API-Sports NBA',
    
    stats: {
      pointsPerGame: rawStats.scoring.points || 0,
      reboundsPerGame: rawStats.defense?.rebounds || 0,
      assistsPerGame: rawStats.scoring.assists || 0,
      stealsPerGame: rawStats.defense?.steals || 0,
      blocksPerGame: rawStats.defense?.blocks || 0,
      minutesPerGame: rawStats.games.minutes || 0,
      fieldGoalPercentage: rawStats.scoring.fieldGoals?.percentage || 0,
      threePointPercentage: rawStats.scoring.threePointers?.percentage || 0,
      freeThrowPercentage: rawStats.scoring.freeThrows?.percentage || 0,
    },
    
    fetchedAt: new Date(),
  };
  
  // Cache the result
  cacheStats(cacheKey, verifiedStats, season);
  
  return { success: true, data: verifiedStats };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get verified player stats
 * 
 * GUARDRAIL: This function MUST be called for any numeric stats question.
 * LLM should NOT answer from memory.
 */
export async function getVerifiedPlayerStats(
  message: string,
  seasonInput?: string,
  seasonType: SeasonType = 'regular'
): Promise<VerifiedStatsResult<VerifiedPlayerStats>> {
  console.log(`[VerifiedStats] Processing player stats query: "${message}"`);
  
  // 1. Extract player from message
  const playerMapping = extractPlayerFromMessage(message);
  if (!playerMapping) {
    return {
      success: false,
      error: 'Could not identify player in query. Please specify a player name.',
    };
  }
  
  // 2. Normalize season
  const season = SeasonNormalizer.normalize(seasonInput);
  console.log(`[VerifiedStats] Season resolved: "${seasonInput || 'this season'}" -> ${season}`);
  
  // 3. Initialize DataLayer
  const dataLayer = new DataLayer({ enableCaching: true });
  
  // 4. Resolve player ID (cached 7 days)
  const playerResult = await resolvePlayer(dataLayer, playerMapping, season);
  if (!playerResult.success || !playerResult.data) {
    return {
      success: false,
      error: playerResult.error || 'Failed to resolve player',
    };
  }
  
  const player = playerResult.data;
  console.log(`[VerifiedStats] Resolved: ${playerMapping.displayName} -> ID ${player.id}`);
  
  // 5. Fetch season averages (cached 6 hours)
  const statsResult = await fetchPlayerSeasonAverages(
    dataLayer,
    player.id,
    playerMapping.displayName,
    season,
    seasonType
  );
  
  if (!statsResult.success || !statsResult.data) {
    return {
      success: false,
      error: statsResult.error || 'Failed to fetch player stats',
      warning: statsResult.warning,
    };
  }
  
  return {
    success: true,
    data: statsResult.data,
  };
}

/**
 * Get verified team stats
 */
export async function getVerifiedTeamStats(
  message: string,
  seasonInput?: string,
  seasonType: SeasonType = 'regular'
): Promise<VerifiedStatsResult<VerifiedTeamStats>> {
  console.log(`[VerifiedStats] Processing team stats query: "${message}"`);
  
  // 1. Extract team from message
  const teamName = extractTeamFromMessage(message);
  if (!teamName) {
    return {
      success: false,
      error: 'Could not identify team in query. Please specify a team name.',
    };
  }
  
  // 2. Normalize season
  const season = SeasonNormalizer.normalize(seasonInput);
  console.log(`[VerifiedStats] Season resolved: "${seasonInput || 'this season'}" -> ${season}`);
  
  // 3. Initialize DataLayer
  const dataLayer = new DataLayer({ enableCaching: true });
  
  // 4. First find the team to get team ID
  const teamResult = await dataLayer.findTeam({ 
    sport: 'basketball', 
    name: teamName,
    league: 'NBA'
  });
  
  if (!teamResult.success || !teamResult.data) {
    return {
      success: false,
      error: `Could not find team "${teamName}" in API-Sports NBA database`,
    };
  }
  
  const team = teamResult.data;
  console.log(`[VerifiedStats] Found team: ${team.name} (ID: ${team.id})`);
  
  // 5. Get team stats
  const result = await dataLayer.getTeamStats({
    sport: 'basketball',
    teamId: team.id,
    season,
  });
  
  if (!result.success || !result.data) {
    return {
      success: false,
      error: `Could not fetch stats for ${teamName} in season ${season}`,
    };
  }
  
  const rawStats = result.data;
  
  // 5. Transform to verified format
  const verifiedStats: VerifiedTeamStats = {
    teamFullName: teamName,
    teamId: rawStats.teamId,
    season: rawStats.season,
    seasonType,
    gamesPlayed: rawStats.record.wins + rawStats.record.losses,
    source: 'API-Sports NBA',
    
    stats: {
      wins: rawStats.record.wins,
      losses: rawStats.record.losses,
      winPercentage: rawStats.record.winPercentage,
      pointsPerGame: rawStats.scoring.averageFor,
      pointsAllowedPerGame: rawStats.scoring.averageAgainst,
      pointDifferential: rawStats.scoring.averageFor - rawStats.scoring.averageAgainst,
    },
    
    form: rawStats.form?.last5,
    fetchedAt: new Date(),
  };
  
  return {
    success: true,
    data: verifiedStats,
  };
}

/**
 * Detect if a message is a stats query that requires verified data
 */
export function isStatsQuery(message: string): boolean {
  const lower = message.toLowerCase();
  
  // Stats-related keywords
  const statsKeywords = [
    'average', 'averaging', 'avg', 'ppg', 'rpg', 'apg', 'spg', 'bpg',
    'points per game', 'rebounds per game', 'assists per game',
    'points', 'rebounds', 'assists', 'steals', 'blocks',
    'field goal', 'three point', '3 point', 'free throw',
    'shooting', 'percentage', 'stats', 'statistics',
    'how many', 'what is', 'what are',
    'season', 'this season', 'per game',
  ];
  
  const hasStatsKeyword = statsKeywords.some(kw => lower.includes(kw));
  const hasPlayerOrTeam = extractPlayerFromMessage(message) !== null || extractTeamFromMessage(message) !== null;
  
  return hasStatsKeyword && hasPlayerOrTeam;
}

/**
 * Format verified stats for response
 * Returns a structured string that can be used in LLM responses
 */
export function formatVerifiedPlayerStats(stats: VerifiedPlayerStats): string {
  return `
📊 **VERIFIED NBA STATS** (Source: ${stats.source})

**Player:** ${stats.playerFullName}
**Season:** ${SeasonNormalizer.toDisplay(stats.season)} (${stats.seasonType})
**Games Played:** ${stats.gamesPlayed}

**Per-Game Averages:**
• Points: **${stats.stats.pointsPerGame.toFixed(1)}**
• Rebounds: **${stats.stats.reboundsPerGame.toFixed(1)}**
• Assists: **${stats.stats.assistsPerGame.toFixed(1)}**
• Steals: ${stats.stats.stealsPerGame.toFixed(1)}
• Blocks: ${stats.stats.blocksPerGame.toFixed(1)}
• Minutes: ${stats.stats.minutesPerGame.toFixed(1)}

**Shooting:**
• FG%: ${stats.stats.fieldGoalPercentage.toFixed(1)}%
• 3P%: ${stats.stats.threePointPercentage.toFixed(1)}%
• FT%: ${stats.stats.freeThrowPercentage.toFixed(1)}%

_Data fetched: ${stats.fetchedAt.toISOString()}_
`.trim();
}

export function formatVerifiedTeamStats(stats: VerifiedTeamStats): string {
  return `
📊 **VERIFIED NBA STATS** (Source: ${stats.source})

**Team:** ${stats.teamFullName}
**Season:** ${SeasonNormalizer.toDisplay(stats.season)} (${stats.seasonType})
**Games Played:** ${stats.gamesPlayed}

**Record:** ${stats.stats.wins}-${stats.stats.losses} (${(stats.stats.winPercentage * 100).toFixed(1)}%)

**Per-Game Averages:**
• Points For: **${stats.stats.pointsPerGame.toFixed(1)}**
• Points Against: ${stats.stats.pointsAllowedPerGame.toFixed(1)}
• Point Differential: ${stats.stats.pointDifferential > 0 ? '+' : ''}${stats.stats.pointDifferential.toFixed(1)}

${stats.form ? `**Last 5 Games:** ${stats.form}` : ''}

_Data fetched: ${stats.fetchedAt.toISOString()}_
`.trim();
}
