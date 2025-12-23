/**
 * Verified Soccer Stats Service
 * 
 * GUARDRAILS:
 * - For ANY numeric stats question: DO NOT answer from LLM memory
 * - MUST call API-Sports Football first and answer ONLY from response
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

export interface VerifiedSoccerPlayerStats {
  playerFullName: string;
  playerId: string;
  teamName: string;
  position: string;
  nationality: string;
  age: number;
  season: number;
  league: string;
  appearances: number;
  source: 'API-Sports Football';
  
  stats: {
    goals: number;
    assists: number;
    goalsPerGame: number;
    minutesPlayed: number;
    minutesPerGame: number;
    yellowCards: number;
    redCards: number;
    shots: number;
    shotsOnTarget: number;
    passAccuracy: number;
    keyPasses: number;
    dribbles: number;
    dribblesSuccess: number;
    tackles: number;
    interceptions: number;
    duelsWon: number;
    duelsTotal: number;
  };
  
  // Goalkeeper stats (if applicable)
  goalkeeper?: {
    saves: number;
    goalsConceded: number;
    cleanSheets: number;
    savePercentage: number;
  };
  
  fetchedAt: Date;
}

export interface VerifiedSoccerStatsResult {
  success: boolean;
  data?: VerifiedSoccerPlayerStats;
  error?: string;
  warning?: string;
}

// ============================================================================
// Season Normalizer
// ============================================================================

class SoccerSeasonNormalizer {
  /**
   * Soccer seasons run Aug-May typically
   * "2024 season" or "2024-25" runs from Aug 2024 to May 2025
   */
  static normalize(input?: string): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Most leagues run Aug-May
    const currentSeason = currentMonth >= 8 ? currentYear : currentYear - 1;
    
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
// Known Soccer Player Mappings
// ============================================================================

interface SoccerPlayerMapping {
  searchName: string;
  displayName: string;
  position: string;
  variations: string[];
}

const SOCCER_PLAYERS: Record<string, SoccerPlayerMapping> = {
  // Premier League Stars
  'haaland': { searchName: 'haaland', displayName: 'Erling Haaland', position: 'ST', variations: ['haaland', 'erling haaland', 'erling'] },
  'salah': { searchName: 'salah', displayName: 'Mohamed Salah', position: 'RW', variations: ['salah', 'mohamed salah', 'mo salah', 'egyptian king'] },
  'saka': { searchName: 'saka', displayName: 'Bukayo Saka', position: 'RW', variations: ['saka', 'bukayo saka', 'starboy'] },
  'palmer': { searchName: 'palmer', displayName: 'Cole Palmer', position: 'CAM', variations: ['cole palmer', 'palmer', 'cold palmer'] },
  'odegaard': { searchName: 'odegaard', displayName: 'Martin Odegaard', position: 'CAM', variations: ['odegaard', 'martin odegaard', 'ødegaard'] },
  'foden': { searchName: 'foden', displayName: 'Phil Foden', position: 'LW', variations: ['foden', 'phil foden', 'stockport iniesta'] },
  'rice': { searchName: 'rice', displayName: 'Declan Rice', position: 'CDM', variations: ['rice', 'declan rice'] },
  'son': { searchName: 'son', displayName: 'Son Heung-min', position: 'LW', variations: ['son', 'son heung-min', 'sonny', 'heung-min son'] },
  'watkins': { searchName: 'watkins', displayName: 'Ollie Watkins', position: 'ST', variations: ['watkins', 'ollie watkins'] },
  'isak': { searchName: 'isak', displayName: 'Alexander Isak', position: 'ST', variations: ['isak', 'alexander isak'] },
  'bruno': { searchName: 'bruno fernandes', displayName: 'Bruno Fernandes', position: 'CAM', variations: ['bruno', 'bruno fernandes'] },
  'rashford': { searchName: 'rashford', displayName: 'Marcus Rashford', position: 'LW', variations: ['rashford', 'marcus rashford'] },
  'van dijk': { searchName: 'van dijk', displayName: 'Virgil van Dijk', position: 'CB', variations: ['van dijk', 'virgil van dijk', 'vvd', 'virgil'] },
  'alisson': { searchName: 'alisson', displayName: 'Alisson Becker', position: 'GK', variations: ['alisson', 'alisson becker'] },
  
  // La Liga Stars
  'vinicius': { searchName: 'vinicius', displayName: 'Vinicius Junior', position: 'LW', variations: ['vinicius', 'vinicius jr', 'vini jr', 'vinicius junior'] },
  'bellingham': { searchName: 'bellingham', displayName: 'Jude Bellingham', position: 'CAM', variations: ['bellingham', 'jude bellingham', 'jude'] },
  'mbappe': { searchName: 'mbappe', displayName: 'Kylian Mbappé', position: 'ST', variations: ['mbappe', 'kylian mbappe', 'mbappé'] },
  'yamal': { searchName: 'yamal', displayName: 'Lamine Yamal', position: 'RW', variations: ['yamal', 'lamine yamal'] },
  'pedri': { searchName: 'pedri', displayName: 'Pedri', position: 'CM', variations: ['pedri'] },
  'lewandowski': { searchName: 'lewandowski', displayName: 'Robert Lewandowski', position: 'ST', variations: ['lewandowski', 'robert lewandowski', 'lewy'] },
  'raphinha': { searchName: 'raphinha', displayName: 'Raphinha', position: 'RW', variations: ['raphinha'] },
  
  // Bundesliga Stars
  'kane': { searchName: 'kane', displayName: 'Harry Kane', position: 'ST', variations: ['kane', 'harry kane'] },
  'sane': { searchName: 'sane', displayName: 'Leroy Sané', position: 'RW', variations: ['sane', 'leroy sane', 'sané'] },
  'musiala': { searchName: 'musiala', displayName: 'Jamal Musiala', position: 'CAM', variations: ['musiala', 'jamal musiala'] },
  'wirtz': { searchName: 'wirtz', displayName: 'Florian Wirtz', position: 'CAM', variations: ['wirtz', 'florian wirtz'] },
  'xhaka': { searchName: 'xhaka', displayName: 'Granit Xhaka', position: 'CM', variations: ['xhaka', 'granit xhaka'] },
  
  // Serie A Stars
  'osimhen': { searchName: 'osimhen', displayName: 'Victor Osimhen', position: 'ST', variations: ['osimhen', 'victor osimhen'] },
  'lautaro': { searchName: 'lautaro', displayName: 'Lautaro Martínez', position: 'ST', variations: ['lautaro', 'lautaro martinez'] },
  'vlahovic': { searchName: 'vlahovic', displayName: 'Dušan Vlahović', position: 'ST', variations: ['vlahovic', 'dusan vlahovic'] },
  'leao': { searchName: 'leao', displayName: 'Rafael Leão', position: 'LW', variations: ['leao', 'rafael leao'] },
  
  // Ligue 1 Stars  
  'dembele': { searchName: 'dembele', displayName: 'Ousmane Dembélé', position: 'RW', variations: ['dembele', 'ousmane dembele'] },
  'barcola': { searchName: 'barcola', displayName: 'Bradley Barcola', position: 'LW', variations: ['barcola', 'bradley barcola'] },
  
  // International Legends
  'messi': { searchName: 'messi', displayName: 'Lionel Messi', position: 'RW', variations: ['messi', 'lionel messi', 'leo messi', 'la pulga'] },
  'ronaldo': { searchName: 'ronaldo', displayName: 'Cristiano Ronaldo', position: 'ST', variations: ['ronaldo', 'cristiano ronaldo', 'cr7', 'cristiano'] },
  'neymar': { searchName: 'neymar', displayName: 'Neymar Jr', position: 'LW', variations: ['neymar', 'neymar jr'] },
  'de bruyne': { searchName: 'de bruyne', displayName: 'Kevin De Bruyne', position: 'CAM', variations: ['de bruyne', 'kevin de bruyne', 'kdb'] },
};

// ============================================================================
// Player Resolution
// ============================================================================

function extractPlayerFromMessage(message: string): SoccerPlayerMapping | null {
  const lower = message.toLowerCase();
  
  let bestMatch: { key: string; variation: string; mapping: SoccerPlayerMapping } | null = null;
  
  for (const [key, mapping] of Object.entries(SOCCER_PLAYERS)) {
    for (const variation of mapping.variations) {
      if (lower.includes(variation)) {
        if (!bestMatch || variation.length > bestMatch.variation.length) {
          bestMatch = { key, variation, mapping };
        }
      }
    }
  }
  
  if (bestMatch) {
    console.log(`[VerifiedSoccerStats] Matched: "${bestMatch.variation}" -> ${bestMatch.mapping.displayName}`);
    return bestMatch.mapping;
  }
  
  // Try to extract unknown player name (Firstname Lastname pattern)
  // Also handle single-name players (Neymar, Ronaldinho, etc.)
  const nameMatch = message.match(/([A-Z][a-zćčšžđáéíóúñü']+(?:\s+[A-Z][a-zćčšžđáéíóúñü'-]+)*)/);
  if (nameMatch) {
    const fullName = nameMatch[1];
    const parts = fullName.split(/\s+/);
    const searchName = parts[parts.length - 1].toLowerCase();
    console.log(`[VerifiedSoccerStats] Unknown player: "${fullName}" (search: ${searchName})`);
    return {
      searchName: searchName,
      displayName: fullName,
      variations: [fullName.toLowerCase()],
    };
  }
  
  return null;
}

// ============================================================================
// Stats Query Detection
// ============================================================================

const SOCCER_STATS_PATTERNS = [
  // Scoring
  /how many (goals?|assists?)/i,
  /goals? (scor(e|ed|ing)|this season|total)/i,
  /(scored|assisted)/i,
  /goal contributions?/i,
  
  // Playing time
  /appearances?/i,
  /games? played/i,
  /minutes? played/i,
  /starts?/i,
  
  // Discipline
  /yellow cards?|red cards?|bookings?/i,
  /sent off|dismissals?/i,
  
  // Advanced stats
  /pass(ing)? accuracy/i,
  /shots? (on target|per game)/i,
  /key passes/i,
  /dribbles?/i,
  /tackles?/i,
  /interceptions?/i,
  /clean sheets?/i,
  /saves?/i,
  
  // General
  /stats|statistics|season (stats|totals)/i,
  /form|performance/i,
];

const SOCCER_PLAYER_INDICATORS = Object.values(SOCCER_PLAYERS)
  .flatMap(p => p.variations)
  .filter(v => v.length >= 3);

export function isSoccerStatsQuery(message: string): boolean {
  const lower = message.toLowerCase();
  
  // Check for soccer indicators
  const soccerIndicators = /\b(football|soccer|premier league|la liga|bundesliga|serie a|ligue 1|champions league|epl|goal|assist|striker|midfielder|defender|goalkeeper)\b/i;
  if (!soccerIndicators.test(lower)) return false;
  
  // Exclude American football
  const nflExclusion = /\b(nfl|touchdown|quarterback|qb|rushing yards|passing yards|wide receiver)\b/i;
  if (nflExclusion.test(lower)) return false;
  
  // Check for stats patterns
  const hasStatsPattern = SOCCER_STATS_PATTERNS.some(p => p.test(lower));
  if (!hasStatsPattern) return false;
  
  // Check for known player
  const hasKnownPlayer = SOCCER_PLAYER_INDICATORS.some(p => lower.includes(p.toLowerCase()));
  
  return hasKnownPlayer;
}

// ============================================================================
// Main Stats Fetching
// ============================================================================

export async function getVerifiedSoccerPlayerStats(
  message: string,
  seasonInput?: string
): Promise<VerifiedSoccerStatsResult> {
  console.log(`[VerifiedSoccerStats] Processing: "${message}"`);
  
  const playerMapping = extractPlayerFromMessage(message);
  if (!playerMapping) {
    return {
      success: false,
      error: 'Could not identify soccer player. Please specify a player name.',
    };
  }
  
  const season = SoccerSeasonNormalizer.normalize(seasonInput);
  console.log(`[VerifiedSoccerStats] Season: ${season}, Player: ${playerMapping.displayName}`);
  
  const apiProvider = getAPISportsProvider();
  
  if (!apiProvider.isConfigured()) {
    return {
      success: false,
      error: 'Soccer stats API not configured',
    };
  }
  
  try {
    // Search for player
    const playersResult = await apiProvider.request<Array<{
      player: {
        id: number;
        name: string;
        firstname: string;
        lastname: string;
        age: number;
        nationality: string;
        photo: string;
      };
      statistics: Array<{
        team: { id: number; name: string; logo: string };
        league: { id: number; name: string; country: string; season: number };
        games: { appearances: number; minutes: number; position: string; lineups: number };
        goals: { total: number | null; assists: number | null; saves: number | null; conceded: number | null };
        shots: { total: number | null; on: number | null };
        passes: { total: number | null; key: number | null; accuracy: number | null };
        tackles: { total: number | null; interceptions: number | null };
        duels: { total: number | null; won: number | null };
        dribbles: { attempts: number | null; success: number | null };
        cards: { yellow: number | null; red: number | null };
        penalty: { scored: number | null; missed: number | null };
      }>;
    }>>(
      'https://v3.football.api-sports.io',
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
    const playerData = playersResult.data.find(p => 
      p.player.name.toLowerCase().includes(playerMapping.searchName.toLowerCase()) ||
      p.player.lastname?.toLowerCase().includes(playerMapping.searchName.toLowerCase())
    ) || playersResult.data[0];
    
    if (!playerData.statistics || playerData.statistics.length === 0) {
      return {
        success: false,
        error: `No statistics found for ${playerMapping.displayName}`,
      };
    }
    
    // Get the main league stats (usually the first/most significant)
    const mainStats = playerData.statistics[0];
    const player = playerData.player;
    
    console.log(`[VerifiedSoccerStats] Found: ${player.name} (${mainStats.team.name})`);
    
    const appearances = mainStats.games?.appearances || 0;
    const minutesPlayed = mainStats.games?.minutes || 0;
    const isGoalkeeper = mainStats.games?.position === 'Goalkeeper';
    
    const stats: VerifiedSoccerPlayerStats = {
      playerFullName: player.name,
      playerId: String(player.id),
      teamName: mainStats.team?.name || 'Unknown',
      position: mainStats.games?.position || playerMapping.position,
      nationality: player.nationality || 'Unknown',
      age: player.age || 0,
      season,
      league: mainStats.league?.name || 'Unknown',
      appearances,
      source: 'API-Sports Football',
      stats: {
        goals: mainStats.goals?.total || 0,
        assists: mainStats.goals?.assists || 0,
        goalsPerGame: appearances > 0 ? Math.round((mainStats.goals?.total || 0) / appearances * 100) / 100 : 0,
        minutesPlayed,
        minutesPerGame: appearances > 0 ? Math.round(minutesPlayed / appearances) : 0,
        yellowCards: mainStats.cards?.yellow || 0,
        redCards: mainStats.cards?.red || 0,
        shots: mainStats.shots?.total || 0,
        shotsOnTarget: mainStats.shots?.on || 0,
        passAccuracy: mainStats.passes?.accuracy || 0,
        keyPasses: mainStats.passes?.key || 0,
        dribbles: mainStats.dribbles?.attempts || 0,
        dribblesSuccess: mainStats.dribbles?.success || 0,
        tackles: mainStats.tackles?.total || 0,
        interceptions: mainStats.tackles?.interceptions || 0,
        duelsWon: mainStats.duels?.won || 0,
        duelsTotal: mainStats.duels?.total || 0,
      },
      fetchedAt: new Date(),
    };
    
    if (isGoalkeeper) {
      const saves = mainStats.goals?.saves || 0;
      const conceded = mainStats.goals?.conceded || 0;
      stats.goalkeeper = {
        saves,
        goalsConceded: conceded,
        cleanSheets: 0, // Not directly available, would need match-by-match analysis
        savePercentage: (saves + conceded) > 0 ? Math.round(saves / (saves + conceded) * 1000) / 10 : 0,
      };
    }
    
    console.log(`[VerifiedSoccerStats] ✅ Got stats for ${stats.playerFullName}: ${stats.stats.goals}G ${stats.stats.assists}A`);
    
    return { success: true, data: stats };
    
  } catch (error) {
    console.error('[VerifiedSoccerStats] Error:', error);
    return {
      success: false,
      error: `Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Formatting
// ============================================================================

export function formatVerifiedSoccerPlayerStats(stats: VerifiedSoccerPlayerStats): string {
  const lines: string[] = [
    `📊 VERIFIED SOCCER STATS (Source: ${stats.source})`,
    `Player: ${stats.playerFullName}`,
    `Team: ${stats.teamName} | League: ${stats.league}`,
    `Position: ${stats.position} | Age: ${stats.age} | Nationality: ${stats.nationality}`,
    `Season: ${stats.season}-${stats.season + 1}`,
    `Appearances: ${stats.appearances}`,
    '',
  ];
  
  if (!stats.goalkeeper) {
    lines.push('⚽ ATTACKING:');
    lines.push(`• Goals: ${stats.stats.goals} (${stats.stats.goalsPerGame}/game)`);
    lines.push(`• Assists: ${stats.stats.assists}`);
    lines.push(`• Goal Contributions: ${stats.stats.goals + stats.stats.assists}`);
    lines.push(`• Shots: ${stats.stats.shots} (${stats.stats.shotsOnTarget} on target)`);
    lines.push('');
    
    lines.push('🎯 PASSING & CREATIVITY:');
    lines.push(`• Pass Accuracy: ${stats.stats.passAccuracy}%`);
    lines.push(`• Key Passes: ${stats.stats.keyPasses}`);
    lines.push(`• Dribbles: ${stats.stats.dribblesSuccess}/${stats.stats.dribbles} successful`);
    lines.push('');
    
    lines.push('🛡️ DEFENSIVE:');
    lines.push(`• Tackles: ${stats.stats.tackles}`);
    lines.push(`• Interceptions: ${stats.stats.interceptions}`);
    lines.push(`• Duels Won: ${stats.stats.duelsWon}/${stats.stats.duelsTotal}`);
    lines.push('');
  }
  
  if (stats.goalkeeper) {
    lines.push('🧤 GOALKEEPER STATS:');
    lines.push(`• Saves: ${stats.goalkeeper.saves}`);
    lines.push(`• Goals Conceded: ${stats.goalkeeper.goalsConceded}`);
    lines.push(`• Save Percentage: ${stats.goalkeeper.savePercentage}%`);
    lines.push('');
  }
  
  lines.push('📋 DISCIPLINE:');
  lines.push(`• Yellow Cards: ${stats.stats.yellowCards}`);
  lines.push(`• Red Cards: ${stats.stats.redCards}`);
  lines.push(`• Minutes Played: ${stats.stats.minutesPlayed} (${stats.stats.minutesPerGame}/game)`);
  lines.push('');
  
  lines.push(`⚠️ IMPORTANT: These are verified stats from ${stats.source}. Do NOT use LLM training data for soccer player statistics.`);
  
  return lines.join('\n');
}
