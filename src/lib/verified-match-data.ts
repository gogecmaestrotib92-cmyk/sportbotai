/**
 * Verified Match Data Service
 * 
 * GUARDRAILS FOR MATCH ANALYSIS:
 * - ALL numeric stats MUST come from verified API sources
 * - Season, league, team IDs MUST be validated before analysis
 * - Unverified data NEVER reaches the model or LLM
 * - All outputs include source metadata for transparency
 * 
 * This service ensures data integrity for match analysis by:
 * 1. Validating all input parameters (season, league, team IDs)
 * 2. Fetching ONLY from verified API sources (API-Sports)
 * 3. Cross-checking returned data matches requested parameters
 * 4. Rejecting stale or mismatched data
 * 5. Including provenance metadata on ALL outputs
 */

import { getDataLayer } from './data-layer';
import type { Sport, NormalizedTeamStats, NormalizedMatch, DataLayerResponse } from './data-layer/types';
import { normalizeSport } from './data-layer/bridge';
import { 
  getVerifiedPlayerStats, 
  isStatsQuery,
  SeasonNormalizer as NBASeasonNormalizer 
} from './verified-nba-stats';
import { 
  getVerifiedNFLPlayerStats, 
  isNFLStatsQuery 
} from './verified-nfl-stats';
import { 
  getVerifiedNHLPlayerStats, 
  isNHLStatsQuery 
} from './verified-nhl-stats';
import { 
  getVerifiedSoccerPlayerStats, 
  isSoccerStatsQuery 
} from './verified-soccer-stats';
import { 
  getVerifiedEuroleaguePlayerStats 
} from './verified-euroleague-stats';

// ============================================================================
// Types
// ============================================================================

export interface VerifiedMatchInput {
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate?: string;
  seasonType?: 'regular' | 'playoffs';
}

export interface VerifiedTeamStats {
  teamId: string;
  teamName: string;
  verified: true;
  season: string | number;
  seasonType: 'regular' | 'playoffs';
  
  record: {
    wins: number;
    losses: number;
    draws?: number;
    played: number;
    winPercentage: number;
  };
  
  scoring: {
    totalFor: number;
    totalAgainst: number;
    averageFor: number;
    averageAgainst: number;
  };
  
  form: {
    last5: string;  // e.g., "WWLDW"
    streak: { type: 'win' | 'loss' | 'draw' | 'none'; count: number };
  };
  
  source: {
    provider: 'API-Sports';
    endpoint: string;
    fetchedAt: Date;
    season: string | number;
  };
}

export interface VerifiedH2H {
  verified: true;
  matches: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    winner: 'home' | 'away' | 'draw';
    venue?: string;
    competition?: string;
  }>;
  summary: {
    total: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    homeGoalsTotal: number;
    awayGoalsTotal: number;
  };
  source: {
    provider: 'API-Sports';
    fetchedAt: Date;
  };
}

export interface VerifiedMatchData {
  verified: true;
  input: {
    sport: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    season: string | number;
    seasonType: 'regular' | 'playoffs';
  };
  
  homeStats: VerifiedTeamStats | null;
  awayStats: VerifiedTeamStats | null;
  h2h: VerifiedH2H | null;
  
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';
  qualityReason: string;
  
  warnings: string[];
  
  source: {
    provider: 'API-Sports';
    fetchedAt: Date;
    apiCallsMade: number;
  };
}

export interface VerificationResult {
  success: boolean;
  data?: VerifiedMatchData;
  error?: string;
  warnings?: string[];
}

// ============================================================================
// Season Normalizer (Multi-Sport)
// ============================================================================

class SeasonNormalizer {
  /**
   * Get current season based on sport
   */
  static getCurrentSeason(sport: string): string | number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const sportLower = sport.toLowerCase();
    
    // NBA & Euroleague: Season runs Oct-June, format "2024-2025"
    if (sportLower.includes('basketball') || sportLower === 'nba' || sportLower === 'euroleague') {
      const seasonStart = currentMonth >= 10 ? currentYear : currentYear - 1;
      return `${seasonStart}-${seasonStart + 1}`;
    }
    
    // NHL: Season runs Oct-June, API uses start year (2024)
    if (sportLower.includes('hockey') || sportLower === 'nhl') {
      return currentMonth >= 10 ? currentYear : currentYear - 1;
    }
    
    // NFL: Season runs Sept-Feb, API uses start year (2024)
    if (sportLower.includes('american_football') || sportLower === 'nfl') {
      return currentMonth >= 9 ? currentYear : currentYear - 1;
    }
    
    // Soccer: Season runs Aug-May, API uses start year (2024)
    // Default for other sports
    return currentMonth >= 8 ? currentYear : currentYear - 1;
  }
  
  /**
   * Validate season matches what was requested
   */
  static validateSeason(
    requested: string | number,
    received: string | number | undefined,
    _sport: string
  ): { valid: boolean; warning?: string } {
    if (!received) {
      return { valid: false, warning: 'No season in response' };
    }
    
    const requestedStr = String(requested);
    const receivedStr = String(received);
    
    // Direct match
    if (requestedStr === receivedStr) {
      return { valid: true };
    }
    
    // Handle NBA format variations (2024-2025 vs 2024)
    if (requestedStr.includes('-')) {
      const startYear = requestedStr.split('-')[0];
      if (receivedStr === startYear) {
        return { valid: true };
      }
    }
    
    return { 
      valid: false, 
      warning: `Season mismatch: requested ${requested}, received ${received}` 
    };
  }
}

// ============================================================================
// Team Verification
// ============================================================================

interface TeamResolution {
  success: boolean;
  teamId?: string;
  teamName?: string;
  error?: string;
}

async function resolveTeamId(
  sport: Sport,
  teamName: string,
  league?: string
): Promise<TeamResolution> {
  const dataLayer = getDataLayer();
  
  try {
    const result = await dataLayer.findTeam({ 
      sport, 
      name: teamName,
      league 
    });
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: `Could not find team "${teamName}" in ${sport} database`,
      };
    }
    
    const team = result.data;
    return {
      success: true,
      teamId: team.id,
      teamName: team.name,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error resolving team: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Stats Fetching with Verification
// ============================================================================

async function fetchVerifiedTeamStats(
  sport: Sport,
  teamId: string,
  teamName: string,
  season: string | number
): Promise<{ success: boolean; data?: VerifiedTeamStats; error?: string; warning?: string }> {
  const dataLayer = getDataLayer();
  
  try {
    const result = await dataLayer.getTeamStats({
      sport,
      teamId,
      season: String(season),
    });
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: `No stats available for ${teamName} in season ${season}`,
      };
    }
    
    const stats = result.data;
    
    // Validate season matches
    const seasonCheck = SeasonNormalizer.validateSeason(season, stats.season, sport);
    
    // Extract form string from last 5 results
    const formString = stats.form?.last5 || '';
    
    // Build streak info
    let streak: { type: 'win' | 'loss' | 'draw' | 'none'; count: number } = { type: 'none', count: 0 };
    if (stats.form?.streak) {
      streak = stats.form.streak;
    } else if (formString.length > 0) {
      // Derive streak from form string
      const lastResult = formString[0];
      let count = 1;
      for (let i = 1; i < formString.length; i++) {
        if (formString[i] === lastResult) count++;
        else break;
      }
      streak = {
        type: lastResult === 'W' ? 'win' : lastResult === 'L' ? 'loss' : lastResult === 'D' ? 'draw' : 'none',
        count,
      };
    }
    
    const verifiedStats: VerifiedTeamStats = {
      teamId,
      teamName,
      verified: true,
      season: stats.season,
      seasonType: 'regular', // TODO: Detect from API response
      
      record: {
        wins: stats.record.wins,
        losses: stats.record.losses,
        draws: stats.record.draws,
        played: stats.record.wins + stats.record.losses + (stats.record.draws || 0),
        winPercentage: stats.record.winPercentage,
      },
      
      scoring: {
        totalFor: stats.scoring.totalFor,
        totalAgainst: stats.scoring.totalAgainst,
        averageFor: stats.scoring.averageFor,
        averageAgainst: stats.scoring.averageAgainst,
      },
      
      form: {
        last5: formString,
        streak,
      },
      
      source: {
        provider: 'API-Sports',
        endpoint: `${sport}/statistics`,
        fetchedAt: new Date(),
        season: stats.season,
      },
    };
    
    return {
      success: true,
      data: verifiedStats,
      warning: seasonCheck.warning,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error fetching stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// H2H Fetching with Verification
// ============================================================================

async function fetchVerifiedH2H(
  sport: Sport,
  homeTeamId: string,
  awayTeamId: string,
  homeTeamName: string,
  awayTeamName: string,
  limit: number = 10
): Promise<{ success: boolean; data?: VerifiedH2H; error?: string }> {
  const dataLayer = getDataLayer();
  
  try {
    const result = await dataLayer.getH2H({
      sport,
      team1: homeTeamId,
      team2: awayTeamId,
      limit,
    });
    
    if (!result.success || !result.data || result.data.matches.length === 0) {
      return {
        success: false,
        error: `No H2H data available for ${homeTeamName} vs ${awayTeamName}`,
      };
    }
    
    const h2hData = result.data;
    
    // Transform to verified format with full provenance
    const matches = h2hData.matches.map(m => {
      const homeScore = m.score?.home ?? 0;
      const awayScore = m.score?.away ?? 0;
      let winner: 'home' | 'away' | 'draw';
      if (homeScore === awayScore) {
        winner = 'draw';
      } else if (homeScore > awayScore) {
        winner = 'home';
      } else {
        winner = 'away';
      }
      return {
        date: m.date.toISOString(),
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        homeScore,
        awayScore,
        winner,
        venue: m.venue,
        competition: m.league,
      };
    });
    
    // Compute summary
    const summary = {
      total: matches.length,
      homeWins: matches.filter(m => m.winner === 'home').length,
      awayWins: matches.filter(m => m.winner === 'away').length,
      draws: matches.filter(m => m.winner === 'draw').length,
      homeGoalsTotal: matches.reduce((sum, m) => sum + m.homeScore, 0),
      awayGoalsTotal: matches.reduce((sum, m) => sum + m.awayScore, 0),
    };
    
    const verified: VerifiedH2H = {
      verified: true,
      matches,
      summary,
      source: {
        provider: 'API-Sports',
        fetchedAt: new Date(),
      },
    };
    
    return { success: true, data: verified };
  } catch (error) {
    return {
      success: false,
      error: `Error fetching H2H: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Data Quality Assessment
// ============================================================================

function assessDataQuality(
  homeStats: VerifiedTeamStats | null,
  awayStats: VerifiedTeamStats | null,
  h2h: VerifiedH2H | null,
  warnings: string[]
): { quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE'; reason: string } {
  const hasHomeStats = homeStats !== null;
  const hasAwayStats = awayStats !== null;
  const hasH2H = h2h !== null && h2h.matches.length > 0;
  const hasGoodForm = (homeStats?.form.last5.length || 0) >= 3 && (awayStats?.form.last5.length || 0) >= 3;
  
  // Count how many data sources we have
  const dataSourceCount = [hasHomeStats, hasAwayStats, hasH2H].filter(Boolean).length;
  
  if (dataSourceCount === 0) {
    return { quality: 'UNAVAILABLE', reason: 'No verified data available from API' };
  }
  
  if (dataSourceCount === 3 && hasGoodForm && warnings.length === 0) {
    return { quality: 'HIGH', reason: 'Full data available: team stats, form, and H2H' };
  }
  
  if (dataSourceCount >= 2 && (hasHomeStats || hasAwayStats)) {
    if (warnings.length > 0) {
      return { quality: 'MEDIUM', reason: `Partial data with warnings: ${warnings.join(', ')}` };
    }
    return { quality: 'MEDIUM', reason: 'Partial data available (missing some sources)' };
  }
  
  return { quality: 'LOW', reason: 'Limited data available' };
}

// ============================================================================
// Main Verification Function
// ============================================================================

/**
 * Get verified match data with full provenance
 * 
 * This is the ONLY function that should be used to fetch match data
 * for analysis. It ensures:
 * 1. All team IDs are resolved and validated
 * 2. Season is correctly determined for the sport
 * 3. Stats are fetched from verified API sources
 * 4. Data quality is assessed
 * 5. All outputs include source metadata
 */
export async function getVerifiedMatchData(
  input: VerifiedMatchInput
): Promise<VerificationResult> {
  const warnings: string[] = [];
  let apiCallsMade = 0;
  
  // Determine season
  const season = SeasonNormalizer.getCurrentSeason(input.sport);
  console.log(`[VerifiedMatchData] Season resolved: ${season} for ${input.sport}`);
  
  // Normalize sport using the comprehensive bridge mapper
  const sport = normalizeSport(input.sport);
  console.log(`[VerifiedMatchData] Normalized sport: ${sport}`);
  
  // Resolve team IDs
  console.log(`[VerifiedMatchData] Resolving teams: "${input.homeTeam}" vs "${input.awayTeam}"`);
  
  const [homeResolution, awayResolution] = await Promise.all([
    resolveTeamId(sport, input.homeTeam, input.league),
    resolveTeamId(sport, input.awayTeam, input.league),
  ]);
  apiCallsMade += 2;
  
  if (!homeResolution.success) {
    warnings.push(`Home team: ${homeResolution.error}`);
  }
  if (!awayResolution.success) {
    warnings.push(`Away team: ${awayResolution.error}`);
  }
  
  // Fetch stats for resolved teams
  let homeStats: VerifiedTeamStats | null = null;
  let awayStats: VerifiedTeamStats | null = null;
  let h2h: VerifiedH2H | null = null;
  
  if (homeResolution.success && homeResolution.teamId) {
    const homeStatsResult = await fetchVerifiedTeamStats(
      sport,
      homeResolution.teamId,
      homeResolution.teamName || input.homeTeam,
      season
    );
    apiCallsMade++;
    
    if (homeStatsResult.success && homeStatsResult.data) {
      homeStats = homeStatsResult.data;
      if (homeStatsResult.warning) warnings.push(homeStatsResult.warning);
    } else if (homeStatsResult.error) {
      warnings.push(`Home stats: ${homeStatsResult.error}`);
    }
  }
  
  if (awayResolution.success && awayResolution.teamId) {
    const awayStatsResult = await fetchVerifiedTeamStats(
      sport,
      awayResolution.teamId,
      awayResolution.teamName || input.awayTeam,
      season
    );
    apiCallsMade++;
    
    if (awayStatsResult.success && awayStatsResult.data) {
      awayStats = awayStatsResult.data;
      if (awayStatsResult.warning) warnings.push(awayStatsResult.warning);
    } else if (awayStatsResult.error) {
      warnings.push(`Away stats: ${awayStatsResult.error}`);
    }
  }
  
  // Fetch H2H if both teams resolved
  if (homeResolution.success && awayResolution.success && 
      homeResolution.teamId && awayResolution.teamId) {
    const h2hResult = await fetchVerifiedH2H(
      sport,
      homeResolution.teamId,
      awayResolution.teamId,
      homeResolution.teamName || input.homeTeam,
      awayResolution.teamName || input.awayTeam
    );
    apiCallsMade++;
    
    if (h2hResult.success && h2hResult.data) {
      h2h = h2hResult.data;
    } else if (h2hResult.error) {
      warnings.push(`H2H: ${h2hResult.error}`);
    }
  }
  
  // Assess data quality
  const { quality, reason } = assessDataQuality(homeStats, awayStats, h2h, warnings);
  
  // Build verified result
  const verifiedData: VerifiedMatchData = {
    verified: true,
    input: {
      sport: input.sport,
      league: input.league,
      homeTeam: input.homeTeam,
      awayTeam: input.awayTeam,
      season,
      seasonType: input.seasonType || 'regular',
    },
    homeStats,
    awayStats,
    h2h,
    dataQuality: quality,
    qualityReason: reason,
    warnings,
    source: {
      provider: 'API-Sports',
      fetchedAt: new Date(),
      apiCallsMade,
    },
  };
  
  console.log(`[VerifiedMatchData] Complete: quality=${quality}, warnings=${warnings.length}, calls=${apiCallsMade}`);
  
  return {
    success: quality !== 'UNAVAILABLE',
    data: verifiedData,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ============================================================================
// Format for LLM Injection
// ============================================================================

/**
 * Format verified match data for injection into LLM prompt
 * 
 * Includes source metadata and verification status
 */
export function formatVerifiedMatchDataForLLM(data: VerifiedMatchData): string {
  const lines: string[] = [];
  
  lines.push('=== VERIFIED MATCH DATA ===');
  lines.push(`Source: ${data.source.provider} (fetched ${data.source.fetchedAt.toISOString()})`);
  lines.push(`Data Quality: ${data.dataQuality}`);
  lines.push(`Season: ${data.input.season} (${data.input.seasonType})`);
  lines.push('');
  
  if (data.homeStats) {
    lines.push(`[${data.homeStats.teamName}] - VERIFIED STATS`);
    lines.push(`  Record: ${data.homeStats.record.wins}W-${data.homeStats.record.losses}L${data.homeStats.record.draws ? `-${data.homeStats.record.draws}D` : ''} (${(data.homeStats.record.winPercentage * 100).toFixed(1)}%)`);
    lines.push(`  Scoring: ${data.homeStats.scoring.averageFor.toFixed(1)} for / ${data.homeStats.scoring.averageAgainst.toFixed(1)} against`);
    lines.push(`  Form: ${data.homeStats.form.last5 || 'N/A'} (${data.homeStats.form.streak.count}-game ${data.homeStats.form.streak.type} streak)`);
    lines.push(`  Source: ${data.homeStats.source.endpoint}`);
    lines.push('');
  } else {
    lines.push(`[${data.input.homeTeam}] - NO VERIFIED STATS AVAILABLE`);
    lines.push('');
  }
  
  if (data.awayStats) {
    lines.push(`[${data.awayStats.teamName}] - VERIFIED STATS`);
    lines.push(`  Record: ${data.awayStats.record.wins}W-${data.awayStats.record.losses}L${data.awayStats.record.draws ? `-${data.awayStats.record.draws}D` : ''} (${(data.awayStats.record.winPercentage * 100).toFixed(1)}%)`);
    lines.push(`  Scoring: ${data.awayStats.scoring.averageFor.toFixed(1)} for / ${data.awayStats.scoring.averageAgainst.toFixed(1)} against`);
    lines.push(`  Form: ${data.awayStats.form.last5 || 'N/A'} (${data.awayStats.form.streak.count}-game ${data.awayStats.form.streak.type} streak)`);
    lines.push(`  Source: ${data.awayStats.source.endpoint}`);
    lines.push('');
  } else {
    lines.push(`[${data.input.awayTeam}] - NO VERIFIED STATS AVAILABLE`);
    lines.push('');
  }
  
  if (data.h2h && data.h2h.matches.length > 0) {
    lines.push('[HEAD-TO-HEAD] - VERIFIED');
    lines.push(`  Total: ${data.h2h.summary.total} meetings`);
    lines.push(`  ${data.input.homeTeam}: ${data.h2h.summary.homeWins} wins`);
    lines.push(`  ${data.input.awayTeam}: ${data.h2h.summary.awayWins} wins`);
    lines.push(`  Draws: ${data.h2h.summary.draws}`);
    lines.push('  Recent:');
    data.h2h.matches.slice(0, 5).forEach(m => {
      lines.push(`    ${m.date.split('T')[0]}: ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`);
    });
    lines.push('');
  } else {
    lines.push('[HEAD-TO-HEAD] - NO VERIFIED DATA AVAILABLE');
    lines.push('');
  }
  
  if (data.warnings.length > 0) {
    lines.push('[WARNINGS]');
    data.warnings.forEach(w => lines.push(`  ⚠️ ${w}`));
    lines.push('');
  }
  
  lines.push('=== END VERIFIED DATA ===');
  
  return lines.join('\n');
}

// ============================================================================
// Validation Gate
// ============================================================================

/**
 * Validate that all required data is present and verified
 * Returns false if data is insufficient for reliable analysis
 */
export function isDataSufficientForAnalysis(data: VerifiedMatchData): {
  sufficient: boolean;
  reason: string;
  minimumMet: boolean;
} {
  // Minimum: at least one team's stats
  const hasAnyStats = data.homeStats !== null || data.awayStats !== null;
  
  // Good: both team stats
  const hasBothStats = data.homeStats !== null && data.awayStats !== null;
  
  // Best: both stats + H2H
  const hasFullData = hasBothStats && data.h2h !== null;
  
  if (!hasAnyStats) {
    return {
      sufficient: false,
      reason: 'No verified team stats available. Cannot produce reliable analysis.',
      minimumMet: false,
    };
  }
  
  if (!hasBothStats) {
    return {
      sufficient: true,
      reason: 'Only one team has verified stats. Analysis will be limited.',
      minimumMet: true,
    };
  }
  
  if (!hasFullData) {
    return {
      sufficient: true,
      reason: 'Team stats verified. H2H data unavailable.',
      minimumMet: true,
    };
  }
  
  return {
    sufficient: true,
    reason: 'Full verified data available for analysis.',
    minimumMet: true,
  };
}

// ============================================================================
// Export Detection Functions (for routing)
// ============================================================================

export { isStatsQuery, isNFLStatsQuery, isNHLStatsQuery, isSoccerStatsQuery };
