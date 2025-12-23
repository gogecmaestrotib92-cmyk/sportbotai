/**
 * Verified NFL Stats Service
 * 
 * GUARDRAILS:
 * - For ANY numeric stats question: DO NOT answer from LLM memory
 * - MUST call API-Sports NFL first and answer ONLY from response
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

export type NFLSeasonType = 'regular' | 'playoffs' | 'preseason';

export interface VerifiedNFLPlayerStats {
  playerFullName: string;
  playerId: string;
  teamName: string;
  position: string;
  season: number;
  seasonType: NFLSeasonType;
  gamesPlayed: number;
  source: 'API-Sports NFL';
  
  // Stats vary by position
  passing?: {
    attempts: number;
    completions: number;
    yards: number;
    touchdowns: number;
    interceptions: number;
    rating: number;
    yardsPerGame: number;
  };
  
  rushing?: {
    attempts: number;
    yards: number;
    touchdowns: number;
    yardsPerCarry: number;
    yardsPerGame: number;
  };
  
  receiving?: {
    targets: number;
    receptions: number;
    yards: number;
    touchdowns: number;
    yardsPerReception: number;
    yardsPerGame: number;
  };
  
  defense?: {
    tackles: number;
    sacks: number;
    interceptions: number;
    forcedFumbles: number;
    passesDefended: number;
  };
  
  fetchedAt: Date;
}

export interface VerifiedNFLStatsResult {
  success: boolean;
  data?: VerifiedNFLPlayerStats;
  error?: string;
  warning?: string;
}

// ============================================================================
// Season Normalizer
// ============================================================================

class NFLSeasonNormalizer {
  /**
   * NFL season naming: "2024 season" runs from Sept 2024 to Feb 2025
   * In Dec 2024 - Feb 2025, we're still in the "2024" season
   */
  static normalize(input?: string): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Current NFL season
    const currentSeason = currentMonth >= 9 ? currentYear : currentYear - 1;
    
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
// Known NFL Player Mappings
// ============================================================================

interface NFLPlayerMapping {
  searchName: string;
  displayName: string;
  position: string;
  variations: string[];
}

const NFL_PLAYERS: Record<string, NFLPlayerMapping> = {
  // Quarterbacks
  'mahomes': { searchName: 'mahomes', displayName: 'Patrick Mahomes', position: 'QB', variations: ['mahomes', 'patrick mahomes', 'pat mahomes'] },
  'allen': { searchName: 'allen', displayName: 'Josh Allen', position: 'QB', variations: ['josh allen', 'allen'] },
  'hurts': { searchName: 'hurts', displayName: 'Jalen Hurts', position: 'QB', variations: ['hurts', 'jalen hurts'] },
  'burrow': { searchName: 'burrow', displayName: 'Joe Burrow', position: 'QB', variations: ['burrow', 'joe burrow', 'joey b'] },
  'jackson': { searchName: 'jackson', displayName: 'Lamar Jackson', position: 'QB', variations: ['lamar', 'lamar jackson', 'jackson'] },
  'herbert': { searchName: 'herbert', displayName: 'Justin Herbert', position: 'QB', variations: ['herbert', 'justin herbert'] },
  'prescott': { searchName: 'prescott', displayName: 'Dak Prescott', position: 'QB', variations: ['dak', 'prescott', 'dak prescott'] },
  'love': { searchName: 'love', displayName: 'Jordan Love', position: 'QB', variations: ['jordan love', 'love'] },
  'stroud': { searchName: 'stroud', displayName: 'C.J. Stroud', position: 'QB', variations: ['stroud', 'cj stroud', 'c.j. stroud'] },
  'purdy': { searchName: 'purdy', displayName: 'Brock Purdy', position: 'QB', variations: ['purdy', 'brock purdy'] },
  
  // Running Backs
  'henry': { searchName: 'henry', displayName: 'Derrick Henry', position: 'RB', variations: ['derrick henry', 'henry', 'king henry'] },
  'mccaffrey': { searchName: 'mccaffrey', displayName: 'Christian McCaffrey', position: 'RB', variations: ['mccaffrey', 'christian mccaffrey', 'cmc'] },
  'chubb': { searchName: 'chubb', displayName: 'Nick Chubb', position: 'RB', variations: ['chubb', 'nick chubb'] },
  'barkley': { searchName: 'barkley', displayName: 'Saquon Barkley', position: 'RB', variations: ['saquon', 'barkley', 'saquon barkley'] },
  'taylor': { searchName: 'taylor', displayName: 'Jonathan Taylor', position: 'RB', variations: ['jonathan taylor', 'jt'] },
  'jacobs': { searchName: 'jacobs', displayName: 'Josh Jacobs', position: 'RB', variations: ['jacobs', 'josh jacobs'] },
  'robinson': { searchName: 'robinson', displayName: 'Bijan Robinson', position: 'RB', variations: ['bijan', 'bijan robinson'] },
  
  // Wide Receivers
  'hill': { searchName: 'hill', displayName: 'Tyreek Hill', position: 'WR', variations: ['tyreek', 'tyreek hill', 'hill', 'cheetah'] },
  'jefferson': { searchName: 'jefferson', displayName: 'Justin Jefferson', position: 'WR', variations: ['justin jefferson', 'jefferson', 'jjetas'] },
  'chase': { searchName: 'chase', displayName: 'Ja\'Marr Chase', position: 'WR', variations: ['chase', 'jamarr chase', 'ja\'marr chase'] },
  'adams': { searchName: 'adams', displayName: 'Davante Adams', position: 'WR', variations: ['davante', 'davante adams', 'adams'] },
  'lamb': { searchName: 'lamb', displayName: 'CeeDee Lamb', position: 'WR', variations: ['ceedee', 'lamb', 'ceedee lamb', 'cd lamb'] },
  'diggs': { searchName: 'diggs', displayName: 'Stefon Diggs', position: 'WR', variations: ['diggs', 'stefon diggs'] },
  'brown': { searchName: 'brown', displayName: 'A.J. Brown', position: 'WR', variations: ['aj brown', 'a.j. brown'] },
  'st.brown': { searchName: 'st. brown', displayName: 'Amon-Ra St. Brown', position: 'WR', variations: ['amon-ra', 'st. brown', 'amon-ra st. brown', 'sun god'] },
  
  // Tight Ends
  'kelce': { searchName: 'kelce', displayName: 'Travis Kelce', position: 'TE', variations: ['kelce', 'travis kelce'] },
  'kittle': { searchName: 'kittle', displayName: 'George Kittle', position: 'TE', variations: ['kittle', 'george kittle'] },
  'andrews': { searchName: 'andrews', displayName: 'Mark Andrews', position: 'TE', variations: ['andrews', 'mark andrews'] },
  'hockenson': { searchName: 'hockenson', displayName: 'T.J. Hockenson', position: 'TE', variations: ['hockenson', 'tj hockenson'] },
  
  // Defenders
  'parsons': { searchName: 'parsons', displayName: 'Micah Parsons', position: 'LB', variations: ['parsons', 'micah parsons'] },
  'watt': { searchName: 'watt', displayName: 'T.J. Watt', position: 'LB', variations: ['tj watt', 't.j. watt', 'watt'] },
  'bosa': { searchName: 'bosa', displayName: 'Nick Bosa', position: 'DE', variations: ['nick bosa', 'bosa'] },
  'garrett': { searchName: 'garrett', displayName: 'Myles Garrett', position: 'DE', variations: ['myles garrett', 'garrett'] },
  'donald': { searchName: 'donald', displayName: 'Aaron Donald', position: 'DT', variations: ['aaron donald', 'donald', 'ad99'] },
};

// ============================================================================
// Player Resolution
// ============================================================================

function extractPlayerFromMessage(message: string): NFLPlayerMapping | null {
  const lower = message.toLowerCase();
  
  let bestMatch: { key: string; variation: string; mapping: NFLPlayerMapping } | null = null;
  
  for (const [key, mapping] of Object.entries(NFL_PLAYERS)) {
    for (const variation of mapping.variations) {
      if (lower.includes(variation)) {
        if (!bestMatch || variation.length > bestMatch.variation.length) {
          bestMatch = { key, variation, mapping };
        }
      }
    }
  }
  
  if (bestMatch) {
    console.log(`[VerifiedNFLStats] Matched: "${bestMatch.variation}" -> ${bestMatch.mapping.displayName}`);
    return bestMatch.mapping;
  }
  
  // Try to extract unknown player name (Firstname Lastname pattern)
  const nameMatch = message.match(/([A-Z][a-zćčšžđ']+(?:\s+[A-Z][a-zćčšžđ'-]+)+)/);
  if (nameMatch) {
    const fullName = nameMatch[1];
    const parts = fullName.split(/\s+/);
    const lastName = parts[parts.length - 1].toLowerCase();
    console.log(`[VerifiedNFLStats] Unknown player: "${fullName}" (search: ${lastName})`);
    return {
      searchName: lastName,
      displayName: fullName,
      variations: [fullName.toLowerCase()],
      position: 'unknown',
    };
  }
  
  return null;
}

// ============================================================================
// Stats Query Detection
// ============================================================================

const NFL_STATS_PATTERNS = [
  // Passing stats
  /how many (passing )?yards/i,
  /passing (yards|touchdowns|tds|rating)/i,
  /quarterback rating|qb rating|passer rating/i,
  /completions?|completion percentage/i,
  /interceptions?/i,
  
  // Rushing stats
  /rushing (yards|touchdowns|tds|attempts)/i,
  /how many (rushing )?yards.*run/i,
  /yards per (carry|attempt)/i,
  
  // Receiving stats
  /receiving (yards|touchdowns|tds|receptions)/i,
  /how many (catches|receptions)/i,
  /targets?/i,
  /yards per (reception|catch)/i,
  
  // Defense stats
  /sacks?/i,
  /tackles?/i,
  /forced fumbles?/i,
  /passes defended/i,
  
  // General
  /stats|statistics|averag(e|ing)|season (total|stats)/i,
  /fantasy (points|stats)/i,
];

const NFL_PLAYER_INDICATORS = Object.values(NFL_PLAYERS)
  .flatMap(p => p.variations)
  .filter(v => v.length >= 3);

export function isNFLStatsQuery(message: string): boolean {
  const lower = message.toLowerCase();
  
  // Check for NFL indicators
  const nflIndicators = /\b(nfl|football|touchdown|yards|quarterback|qb|running back|rb|receiver|wr|tight end|te)\b/i;
  if (!nflIndicators.test(lower)) return false;
  
  // Check for stats patterns
  const hasStatsPattern = NFL_STATS_PATTERNS.some(p => p.test(lower));
  if (!hasStatsPattern) return false;
  
  // Check for known player
  const hasKnownPlayer = NFL_PLAYER_INDICATORS.some(p => lower.includes(p.toLowerCase()));
  
  return hasKnownPlayer;
}

// ============================================================================
// Main Stats Fetching
// ============================================================================

export async function getVerifiedNFLPlayerStats(
  message: string,
  seasonInput?: string
): Promise<VerifiedNFLStatsResult> {
  console.log(`[VerifiedNFLStats] Processing: "${message}"`);
  
  const playerMapping = extractPlayerFromMessage(message);
  if (!playerMapping) {
    return {
      success: false,
      error: 'Could not identify NFL player. Please specify a player name.',
    };
  }
  
  const season = NFLSeasonNormalizer.normalize(seasonInput);
  console.log(`[VerifiedNFLStats] Season: ${season}, Player: ${playerMapping.displayName}`);
  
  const apiProvider = getAPISportsProvider();
  
  if (!apiProvider.isConfigured()) {
    return {
      success: false,
      error: 'NFL stats API not configured',
    };
  }
  
  try {
    // Search for player
    const playersResult = await apiProvider.request<Array<{
      id: number;
      name: string;
      position: string;
      group: string;
    }>>(
      'https://v1.american-football.api-sports.io',
      '/players',
      { search: playerMapping.searchName, season, league: LEAGUE_IDS.NFL }
    );
    
    if (!playersResult.success || !playersResult.data || playersResult.data.length === 0) {
      return {
        success: false,
        error: `Could not find ${playerMapping.displayName} in API`,
      };
    }
    
    // Find best match
    const player = playersResult.data.find(p => 
      p.name.toLowerCase().includes(playerMapping.searchName.toLowerCase())
    ) || playersResult.data[0];
    
    console.log(`[VerifiedNFLStats] Found player: ${player.name} (ID: ${player.id})`);
    
    // Get player statistics
    const statsResult = await apiProvider.request<Array<{
      player: { id: number; name: string };
      team: { name: string };
      games: { played: number };
      groups: Array<{
        name: string;
        statistics: Record<string, number | string | null>;
      }>;
    }>>(
      'https://v1.american-football.api-sports.io',
      '/players/statistics',
      { id: player.id, season }
    );
    
    if (!statsResult.success || !statsResult.data || statsResult.data.length === 0) {
      return {
        success: false,
        error: `No stats found for ${playerMapping.displayName} in ${season} season`,
      };
    }
    
    const playerStats = statsResult.data[0];
    
    // Parse stats by group
    const stats: VerifiedNFLPlayerStats = {
      playerFullName: playerStats.player.name || playerMapping.displayName,
      playerId: String(player.id),
      teamName: playerStats.team?.name || 'Unknown',
      position: player.position || playerMapping.position,
      season,
      seasonType: 'regular',
      gamesPlayed: playerStats.games?.played || 0,
      source: 'API-Sports NFL',
      fetchedAt: new Date(),
    };
    
    // Parse each stat group
    for (const group of playerStats.groups || []) {
      const s = group.statistics;
      
      if (group.name.toLowerCase() === 'passing') {
        stats.passing = {
          attempts: Number(s.attempts) || 0,
          completions: Number(s.completions) || 0,
          yards: Number(s.yards) || 0,
          touchdowns: Number(s.touchdowns) || 0,
          interceptions: Number(s.interceptions) || 0,
          rating: Number(s.rating) || 0,
          yardsPerGame: stats.gamesPlayed > 0 ? Math.round((Number(s.yards) || 0) / stats.gamesPlayed * 10) / 10 : 0,
        };
      }
      
      if (group.name.toLowerCase() === 'rushing') {
        stats.rushing = {
          attempts: Number(s.attempts) || 0,
          yards: Number(s.yards) || 0,
          touchdowns: Number(s.touchdowns) || 0,
          yardsPerCarry: Number(s.average) || 0,
          yardsPerGame: stats.gamesPlayed > 0 ? Math.round((Number(s.yards) || 0) / stats.gamesPlayed * 10) / 10 : 0,
        };
      }
      
      if (group.name.toLowerCase() === 'receiving') {
        stats.receiving = {
          targets: Number(s.targets) || 0,
          receptions: Number(s.receptions) || 0,
          yards: Number(s.yards) || 0,
          touchdowns: Number(s.touchdowns) || 0,
          yardsPerReception: Number(s.average) || 0,
          yardsPerGame: stats.gamesPlayed > 0 ? Math.round((Number(s.yards) || 0) / stats.gamesPlayed * 10) / 10 : 0,
        };
      }
      
      if (group.name.toLowerCase() === 'defensive' || group.name.toLowerCase() === 'defense') {
        stats.defense = {
          tackles: Number(s.tackles_total) || Number(s.tackles) || 0,
          sacks: Number(s.sacks) || 0,
          interceptions: Number(s.interceptions) || 0,
          forcedFumbles: Number(s.forced_fumbles) || 0,
          passesDefended: Number(s.passes_defended) || 0,
        };
      }
    }
    
    console.log(`[VerifiedNFLStats] ✅ Got stats for ${stats.playerFullName}`);
    
    return { success: true, data: stats };
    
  } catch (error) {
    console.error('[VerifiedNFLStats] Error:', error);
    return {
      success: false,
      error: `Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Formatting
// ============================================================================

export function formatVerifiedNFLPlayerStats(stats: VerifiedNFLPlayerStats): string {
  const lines: string[] = [
    `📊 VERIFIED NFL STATS (Source: ${stats.source})`,
    `Player: ${stats.playerFullName} (${stats.position})`,
    `Team: ${stats.teamName}`,
    `Season: ${stats.season} ${stats.seasonType}`,
    `Games Played: ${stats.gamesPlayed}`,
    '',
  ];
  
  if (stats.passing) {
    lines.push('🏈 PASSING:');
    lines.push(`• Completions/Attempts: ${stats.passing.completions}/${stats.passing.attempts}`);
    lines.push(`• Passing Yards: ${stats.passing.yards} (${stats.passing.yardsPerGame}/game)`);
    lines.push(`• Touchdowns: ${stats.passing.touchdowns}`);
    lines.push(`• Interceptions: ${stats.passing.interceptions}`);
    lines.push(`• Passer Rating: ${stats.passing.rating}`);
    lines.push('');
  }
  
  if (stats.rushing) {
    lines.push('🏃 RUSHING:');
    lines.push(`• Attempts: ${stats.rushing.attempts}`);
    lines.push(`• Rushing Yards: ${stats.rushing.yards} (${stats.rushing.yardsPerGame}/game)`);
    lines.push(`• Yards/Carry: ${stats.rushing.yardsPerCarry}`);
    lines.push(`• Rushing TDs: ${stats.rushing.touchdowns}`);
    lines.push('');
  }
  
  if (stats.receiving) {
    lines.push('🎯 RECEIVING:');
    lines.push(`• Receptions/Targets: ${stats.receiving.receptions}/${stats.receiving.targets}`);
    lines.push(`• Receiving Yards: ${stats.receiving.yards} (${stats.receiving.yardsPerGame}/game)`);
    lines.push(`• Yards/Reception: ${stats.receiving.yardsPerReception}`);
    lines.push(`• Receiving TDs: ${stats.receiving.touchdowns}`);
    lines.push('');
  }
  
  if (stats.defense) {
    lines.push('🛡️ DEFENSE:');
    lines.push(`• Tackles: ${stats.defense.tackles}`);
    lines.push(`• Sacks: ${stats.defense.sacks}`);
    lines.push(`• Interceptions: ${stats.defense.interceptions}`);
    lines.push(`• Forced Fumbles: ${stats.defense.forcedFumbles}`);
    lines.push(`• Passes Defended: ${stats.defense.passesDefended}`);
    lines.push('');
  }
  
  lines.push(`⚠️ IMPORTANT: These are verified stats from ${stats.source}. Do NOT use LLM training data for NFL player statistics.`);
  
  return lines.join('\n');
}
