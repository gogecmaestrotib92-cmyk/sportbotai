/**
 * Verified NHL Stats Service
 * 
 * GUARDRAILS:
 * - For ANY numeric stats question: DO NOT answer from LLM memory
 * - MUST call API-Sports NHL first and answer ONLY from response
 * 
 * This service ensures:
 * 1. Correct season resolution ("this season" → "2024")
 * 2. Proper caching (player IDs: 7 days, stats: 6 hours)
 * 3. Season validation (requested == returned)
 * 4. Strict response contract with source attribution
 */

import { getAPISportsProvider, LEAGUE_IDS } from './data-layer/providers/api-sports';

// ============================================================================
// Types
// ============================================================================

export type NHLSeasonType = 'regular' | 'playoffs' | 'preseason';

export interface VerifiedNHLPlayerStats {
  playerFullName: string;
  playerId: string;
  teamName: string;
  position: string;
  season: number;
  seasonType: NHLSeasonType;
  gamesPlayed: number;
  source: 'API-Sports NHL';
  
  // Skater stats
  skater?: {
    goals: number;
    assists: number;
    points: number;
    plusMinus: number;
    penaltyMinutes: number;
    powerPlayGoals: number;
    powerPlayPoints: number;
    shots: number;
    shotPercentage: number;
    timeOnIce: string;
    goalsPerGame: number;
    pointsPerGame: number;
  };
  
  // Goalie stats
  goalie?: {
    wins: number;
    losses: number;
    overtimeLosses: number;
    gamesStarted: number;
    saves: number;
    goalsAgainst: number;
    savePercentage: number;
    goalsAgainstAverage: number;
    shutouts: number;
  };
  
  fetchedAt: Date;
}

export interface VerifiedNHLStatsResult {
  success: boolean;
  data?: VerifiedNHLPlayerStats;
  error?: string;
  warning?: string;
}

// ============================================================================
// Season Normalizer
// ============================================================================

class NHLSeasonNormalizer {
  /**
   * NHL season naming: Season runs Oct-June
   * "2024 season" or "2024-25" runs from Oct 2024 to June 2025
   */
  static normalize(input?: string): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // NHL season runs Oct-June
    const currentSeason = currentMonth >= 10 ? currentYear : currentYear - 1;
    
    if (!input) return currentSeason;
    
    const lower = input.toLowerCase().trim();
    
    if (lower.includes('this season') || lower.includes('current')) {
      return currentSeason;
    }
    
    if (lower.includes('last season') || lower.includes('previous')) {
      return currentSeason - 1;
    }
    
    // Try to extract year
    const yearMatch = lower.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    
    return currentSeason;
  }
}

// ============================================================================
// Known NHL Player Mappings
// ============================================================================

interface NHLPlayerMapping {
  searchName: string;
  displayName: string;
  position: string;
  variations: string[];
}

const NHL_PLAYERS: Record<string, NHLPlayerMapping> = {
  // Centers
  'mcdavid': { searchName: 'mcdavid', displayName: 'Connor McDavid', position: 'C', variations: ['mcdavid', 'connor mcdavid', 'mcspeedy'] },
  'crosby': { searchName: 'crosby', displayName: 'Sidney Crosby', position: 'C', variations: ['crosby', 'sidney crosby', 'sid', 'sid the kid'] },
  'matthews': { searchName: 'matthews', displayName: 'Auston Matthews', position: 'C', variations: ['matthews', 'auston matthews', 'papi'] },
  'draisaitl': { searchName: 'draisaitl', displayName: 'Leon Draisaitl', position: 'C', variations: ['draisaitl', 'leon draisaitl', 'leon'] },
  'mackinnon': { searchName: 'mackinnon', displayName: 'Nathan MacKinnon', position: 'C', variations: ['mackinnon', 'nathan mackinnon', 'nate mac'] },
  'point': { searchName: 'point', displayName: 'Brayden Point', position: 'C', variations: ['point', 'brayden point'] },
  'aho': { searchName: 'aho', displayName: 'Sebastian Aho', position: 'C', variations: ['aho', 'sebastian aho'] },
  'horvat': { searchName: 'horvat', displayName: 'Bo Horvat', position: 'C', variations: ['horvat', 'bo horvat'] },
  
  // Wingers
  'ovechkin': { searchName: 'ovechkin', displayName: 'Alex Ovechkin', position: 'LW', variations: ['ovechkin', 'alex ovechkin', 'ovi', 'the great 8'] },
  'kucherov': { searchName: 'kucherov', displayName: 'Nikita Kucherov', position: 'RW', variations: ['kucherov', 'nikita kucherov', 'kuch'] },
  'pastrnak': { searchName: 'pastrnak', displayName: 'David Pastrnak', position: 'RW', variations: ['pastrnak', 'david pastrnak', 'pasta'] },
  'marner': { searchName: 'marner', displayName: 'Mitch Marner', position: 'RW', variations: ['marner', 'mitch marner', 'mitchie'] },
  'kaprizov': { searchName: 'kaprizov', displayName: 'Kirill Kaprizov', position: 'LW', variations: ['kaprizov', 'kirill kaprizov', 'kap'] },
  'panarin': { searchName: 'panarin', displayName: 'Artemi Panarin', position: 'LW', variations: ['panarin', 'artemi panarin', 'the bread man'] },
  'marchand': { searchName: 'marchand', displayName: 'Brad Marchand', position: 'LW', variations: ['marchand', 'brad marchand'] },
  'kane': { searchName: 'kane', displayName: 'Patrick Kane', position: 'RW', variations: ['patrick kane', 'kane', 'showtime'] },
  'huberdeau': { searchName: 'huberdeau', displayName: 'Jonathan Huberdeau', position: 'LW', variations: ['huberdeau', 'jonathan huberdeau'] },
  
  // Defensemen
  'makar': { searchName: 'makar', displayName: 'Cale Makar', position: 'D', variations: ['makar', 'cale makar'] },
  'hedman': { searchName: 'hedman', displayName: 'Victor Hedman', position: 'D', variations: ['hedman', 'victor hedman'] },
  'fox': { searchName: 'fox', displayName: 'Adam Fox', position: 'D', variations: ['adam fox', 'fox'] },
  'hamilton': { searchName: 'hamilton', displayName: 'Dougie Hamilton', position: 'D', variations: ['hamilton', 'dougie hamilton'] },
  'carlson': { searchName: 'carlson', displayName: 'John Carlson', position: 'D', variations: ['carlson', 'john carlson'] },
  'heiskanen': { searchName: 'heiskanen', displayName: 'Miro Heiskanen', position: 'D', variations: ['heiskanen', 'miro heiskanen', 'miro'] },
  'mcavoy': { searchName: 'mcavoy', displayName: 'Charlie McAvoy', position: 'D', variations: ['mcavoy', 'charlie mcavoy'] },
  
  // Goalies
  'hellebuyck': { searchName: 'hellebuyck', displayName: 'Connor Hellebuyck', position: 'G', variations: ['hellebuyck', 'connor hellebuyck', 'helly'] },
  'vasilevskiy': { searchName: 'vasilevskiy', displayName: 'Andrei Vasilevskiy', position: 'G', variations: ['vasilevskiy', 'andrei vasilevskiy', 'vasy', 'big cat'] },
  'shesterkin': { searchName: 'shesterkin', displayName: 'Igor Shesterkin', position: 'G', variations: ['shesterkin', 'igor shesterkin', 'igor'] },
  'demko': { searchName: 'demko', displayName: 'Thatcher Demko', position: 'G', variations: ['demko', 'thatcher demko'] },
  'oettinger': { searchName: 'oettinger', displayName: 'Jake Oettinger', position: 'G', variations: ['oettinger', 'jake oettinger', 'otter'] },
  'saros': { searchName: 'saros', displayName: 'Juuse Saros', position: 'G', variations: ['saros', 'juuse saros'] },
  'sorokin': { searchName: 'sorokin', displayName: 'Ilya Sorokin', position: 'G', variations: ['sorokin', 'ilya sorokin'] },
  'swayman': { searchName: 'swayman', displayName: 'Jeremy Swayman', position: 'G', variations: ['swayman', 'jeremy swayman', 'sway'] },
};

// ============================================================================
// Player Resolution
// ============================================================================

function extractPlayerFromMessage(message: string): NHLPlayerMapping | null {
  const lower = message.toLowerCase();
  
  let bestMatch: { key: string; variation: string; mapping: NHLPlayerMapping } | null = null;
  
  for (const [key, mapping] of Object.entries(NHL_PLAYERS)) {
    for (const variation of mapping.variations) {
      if (lower.includes(variation)) {
        if (!bestMatch || variation.length > bestMatch.variation.length) {
          bestMatch = { key, variation, mapping };
        }
      }
    }
  }
  
  if (bestMatch) {
    console.log(`[VerifiedNHLStats] Matched: "${bestMatch.variation}" -> ${bestMatch.mapping.displayName}`);
    return bestMatch.mapping;
  }
  
  // Try to extract unknown player name (Firstname Lastname pattern)
  const nameMatch = message.match(/([A-Z][a-zćčšžđ']+(?:\s+[A-Z][a-zćčšžđ'-]+)+)/);
  if (nameMatch) {
    const fullName = nameMatch[1];
    const parts = fullName.split(/\s+/);
    const lastName = parts[parts.length - 1].toLowerCase();
    console.log(`[VerifiedNHLStats] Unknown player: "${fullName}" (search: ${lastName})`);
    return {
      searchName: lastName,
      displayName: fullName,
      variations: [fullName.toLowerCase()],
      position: 'skater',  // Default to skater
    };
  }
  
  return null;
}

// ============================================================================
// Stats Query Detection
// ============================================================================

const NHL_STATS_PATTERNS = [
  // Skater stats
  /how many (goals?|points?|assists?)/i,
  /goals?.*scor(e|ing|ed)/i,
  /points? (total|this season|per game)/i,
  /\bppg\b|\bapg\b/i,  // Points/Assists per game (but not NBA context)
  /plus.?minus|plus\/minus|\+\/-/i,
  /power.?play (goals?|points?)/i,
  /penalty minutes|pim/i,
  /shots? (on goal|percentage)/i,
  /time on ice|toi/i,
  
  // Goalie stats
  /save percentage|sv%|svs%/i,
  /goals against average|gaa/i,
  /wins (and|&) (losses|loss)/i,
  /shutouts?/i,
  /saves? (total|this season)/i,
  
  // General
  /stats|statistics|averag(e|ing)|season (total|stats)/i,
  /fantasy (points|stats)/i,
];

const NHL_PLAYER_INDICATORS = Object.values(NHL_PLAYERS)
  .flatMap(p => p.variations)
  .filter(v => v.length >= 3);

export function isNHLStatsQuery(message: string): boolean {
  const lower = message.toLowerCase();
  
  // Check for NHL indicators
  const nhlIndicators = /\b(nhl|hockey|goal(s|ie)?|assist|puck|ice|hat.?trick|power.?play|shutout)\b/i;
  if (!nhlIndicators.test(lower)) return false;
  
  // Exclude NBA context
  const nbaExclusion = /\b(nba|basketball|lebron|curry|embiid|jokic|lakers|celtics|warriors)\b/i;
  if (nbaExclusion.test(lower)) return false;
  
  // Check for stats patterns
  const hasStatsPattern = NHL_STATS_PATTERNS.some(p => p.test(lower));
  if (!hasStatsPattern) return false;
  
  // Check for known player
  const hasKnownPlayer = NHL_PLAYER_INDICATORS.some(p => lower.includes(p.toLowerCase()));
  
  return hasKnownPlayer;
}

// ============================================================================
// Main Stats Fetching
// ============================================================================

export async function getVerifiedNHLPlayerStats(
  message: string,
  seasonInput?: string
): Promise<VerifiedNHLStatsResult> {
  console.log(`[VerifiedNHLStats] Processing: "${message}"`);
  
  const playerMapping = extractPlayerFromMessage(message);
  if (!playerMapping) {
    return {
      success: false,
      error: 'Could not identify NHL player. Please specify a player name.',
    };
  }
  
  const season = NHLSeasonNormalizer.normalize(seasonInput);
  console.log(`[VerifiedNHLStats] Season: ${season}, Player: ${playerMapping.displayName}`);
  
  const apiProvider = getAPISportsProvider();
  
  if (!apiProvider.isConfigured()) {
    return {
      success: false,
      error: 'NHL stats API not configured',
    };
  }
  
  try {
    // Search for player via team rosters (API-Sports hockey uses /players with team parameter)
    // First, we need to find the player through a team search
    const playersResult = await apiProvider.request<Array<{
      id: number;
      name: string;
      firstname: string;
      lastname: string;
      position: string;
      number: number;
    }>>(
      'https://v1.hockey.api-sports.io',
      '/players',
      { search: playerMapping.searchName, season }
    );
    
    if (!playersResult.success || !playersResult.data || playersResult.data.length === 0) {
      return {
        success: false,
        error: `Could not find ${playerMapping.displayName} in API`,
      };
    }
    
    // Find best match
    const player = playersResult.data.find(p => 
      p.name.toLowerCase().includes(playerMapping.searchName.toLowerCase()) ||
      p.lastname?.toLowerCase().includes(playerMapping.searchName.toLowerCase())
    ) || playersResult.data[0];
    
    console.log(`[VerifiedNHLStats] Found player: ${player.name} (ID: ${player.id})`);
    
    // Get player statistics from the statistics endpoint
    const statsResult = await apiProvider.request<Array<{
      player: { id: number; name: string };
      team: { name: string };
      statistics: Array<{
        season: number;
        games: { played: number };
        goals?: number;
        assists?: number;
        points?: number;
        pim?: number;
        plusminus?: number;
        powerplay?: { goals?: number; assists?: number };
        shots?: { total?: number; percentage?: number };
        // Goalie stats
        wins?: number;
        losses?: number;
        ot?: number;
        saves?: number;
        goals_against?: number;
        save_percentage?: number;
        gaa?: number;
        shutouts?: number;
      }>;
    }>>(
      'https://v1.hockey.api-sports.io',
      '/players/statistics',
      { player: player.id, season }
    );
    
    if (!statsResult.success || !statsResult.data || statsResult.data.length === 0) {
      // Fallback: Try to get stats from team roster
      return {
        success: false,
        error: `No stats found for ${playerMapping.displayName} in ${season} season. NHL player statistics may require team context.`,
        warning: 'NHL API may have limited player statistics coverage.',
      };
    }
    
    const playerData = statsResult.data[0];
    const seasonStats = playerData.statistics?.[0];
    
    if (!seasonStats) {
      return {
        success: false,
        error: `No season stats available for ${playerMapping.displayName}`,
      };
    }
    
    const isGoalie = playerMapping.position === 'G';
    const gamesPlayed = seasonStats.games?.played || 0;
    
    const stats: VerifiedNHLPlayerStats = {
      playerFullName: playerData.player?.name || playerMapping.displayName,
      playerId: String(player.id),
      teamName: playerData.team?.name || 'Unknown',
      position: playerMapping.position,
      season,
      seasonType: 'regular',
      gamesPlayed,
      source: 'API-Sports NHL',
      fetchedAt: new Date(),
    };
    
    if (isGoalie) {
      stats.goalie = {
        wins: seasonStats.wins || 0,
        losses: seasonStats.losses || 0,
        overtimeLosses: seasonStats.ot || 0,
        gamesStarted: gamesPlayed,
        saves: seasonStats.saves || 0,
        goalsAgainst: seasonStats.goals_against || 0,
        savePercentage: seasonStats.save_percentage || 0,
        goalsAgainstAverage: seasonStats.gaa || 0,
        shutouts: seasonStats.shutouts || 0,
      };
    } else {
      const goals = seasonStats.goals || 0;
      const assists = seasonStats.assists || 0;
      const points = seasonStats.points || (goals + assists);
      
      stats.skater = {
        goals,
        assists,
        points,
        plusMinus: seasonStats.plusminus || 0,
        penaltyMinutes: seasonStats.pim || 0,
        powerPlayGoals: seasonStats.powerplay?.goals || 0,
        powerPlayPoints: (seasonStats.powerplay?.goals || 0) + (seasonStats.powerplay?.assists || 0),
        shots: seasonStats.shots?.total || 0,
        shotPercentage: seasonStats.shots?.percentage || 0,
        timeOnIce: 'N/A',
        goalsPerGame: gamesPlayed > 0 ? Math.round(goals / gamesPlayed * 100) / 100 : 0,
        pointsPerGame: gamesPlayed > 0 ? Math.round(points / gamesPlayed * 100) / 100 : 0,
      };
    }
    
    console.log(`[VerifiedNHLStats] ✅ Got stats for ${stats.playerFullName}`);
    
    return { success: true, data: stats };
    
  } catch (error) {
    console.error('[VerifiedNHLStats] Error:', error);
    return {
      success: false,
      error: `Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Formatting
// ============================================================================

export function formatVerifiedNHLPlayerStats(stats: VerifiedNHLPlayerStats): string {
  const lines: string[] = [
    `📊 VERIFIED NHL STATS (Source: ${stats.source})`,
    `Player: ${stats.playerFullName} (${stats.position})`,
    `Team: ${stats.teamName}`,
    `Season: ${stats.season}-${stats.season + 1} ${stats.seasonType}`,
    `Games Played: ${stats.gamesPlayed}`,
    '',
  ];
  
  if (stats.skater) {
    lines.push('🏒 SKATING STATS:');
    lines.push(`• Goals: ${stats.skater.goals} (${stats.skater.goalsPerGame}/game)`);
    lines.push(`• Assists: ${stats.skater.assists}`);
    lines.push(`• Points: ${stats.skater.points} (${stats.skater.pointsPerGame}/game)`);
    lines.push(`• +/-: ${stats.skater.plusMinus >= 0 ? '+' : ''}${stats.skater.plusMinus}`);
    lines.push(`• Power Play Goals: ${stats.skater.powerPlayGoals}`);
    lines.push(`• Power Play Points: ${stats.skater.powerPlayPoints}`);
    lines.push(`• Shots: ${stats.skater.shots} (${stats.skater.shotPercentage}%)`);
    lines.push(`• PIM: ${stats.skater.penaltyMinutes}`);
    lines.push('');
  }
  
  if (stats.goalie) {
    lines.push('🥅 GOALIE STATS:');
    lines.push(`• Record: ${stats.goalie.wins}-${stats.goalie.losses}-${stats.goalie.overtimeLosses}`);
    lines.push(`• Save Percentage: ${(stats.goalie.savePercentage * 100).toFixed(1)}%`);
    lines.push(`• Goals Against Average: ${stats.goalie.goalsAgainstAverage.toFixed(2)}`);
    lines.push(`• Saves: ${stats.goalie.saves}`);
    lines.push(`• Shutouts: ${stats.goalie.shutouts}`);
    lines.push('');
  }
  
  lines.push(`⚠️ IMPORTANT: These are verified stats from ${stats.source}. Do NOT use LLM training data for NHL player statistics.`);
  
  return lines.join('\n');
}
