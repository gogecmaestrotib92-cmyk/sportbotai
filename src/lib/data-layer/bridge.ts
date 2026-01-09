/**
 * Data Layer Bridge
 * 
 * This module bridges the old sports-api.ts functions with the new DataLayer.
 * Use this for gradual migration - new code should use DataLayer directly.
 */

import { getDataLayer } from './index';
import type { Sport, EnrichedMatchData } from './types';

// Map sport string identifiers to Sport type
// COMPREHENSIVE: All The Odds API sport keys + common variations
const SPORT_MAP: Record<string, Sport> = {
  // Soccer / Football
  'soccer': 'soccer',
  'football': 'soccer',
  'soccer_epl': 'soccer',
  'soccer_england_league1': 'soccer',
  'soccer_england_league2': 'soccer',
  'soccer_england_efl_cup': 'soccer',
  'soccer_fa_cup': 'soccer',
  'soccer_spain_la_liga': 'soccer',
  'soccer_spain_segunda_division': 'soccer',
  'soccer_uefa_champs_league': 'soccer',
  'soccer_uefa_europa_league': 'soccer',
  'soccer_uefa_europa_conference_league': 'soccer',
  'soccer_uefa_nations_league': 'soccer',
  'soccer_germany_bundesliga': 'soccer',
  'soccer_germany_bundesliga2': 'soccer',
  'soccer_italy_serie_a': 'soccer',
  'soccer_italy_serie_b': 'soccer',
  'soccer_france_ligue_one': 'soccer',
  'soccer_france_ligue_two': 'soccer',
  'soccer_netherlands_eredivisie': 'soccer',
  'soccer_portugal_primeira_liga': 'soccer',
  'soccer_belgium_first_div': 'soccer',
  'soccer_turkey_super_league': 'soccer',
  'soccer_brazil_serie_a': 'soccer',
  'soccer_argentina_primera_division': 'soccer',
  'soccer_mexico_ligamx': 'soccer',
  'soccer_usa_mls': 'soccer',
  'soccer_scotland_premiership': 'soccer',
  'soccer_spl': 'soccer',  // Scottish Premiership (Odds API key)
  'soccer_conmebol_copa_libertadores': 'soccer',
  'soccer_fifa_world_cup': 'soccer',
  'soccer_epl_championship': 'soccer',
  
  // Basketball
  'basketball': 'basketball',
  'basketball_nba': 'basketball',
  'basketball_ncaab': 'basketball',
  'basketball_euroleague': 'basketball',
  'basketball_eurocup': 'basketball',
  'basketball_spain_acb': 'basketball',
  'basketball_germany_bbl': 'basketball',
  'euroleague': 'basketball',
  'nba': 'basketball',
  'ncaab': 'basketball',
  
  // Ice Hockey
  'hockey': 'hockey',
  'icehockey': 'hockey',
  'icehockey_nhl': 'hockey',
  'icehockey_sweden_hockey_league': 'hockey',
  'icehockey_finland_liiga': 'hockey',
  'icehockey_germany_del': 'hockey',
  'nhl': 'hockey',
  
  // American Football
  'americanfootball': 'american_football',
  'american_football': 'american_football',
  'americanfootball_nfl': 'american_football',
  'americanfootball_ncaaf': 'american_football',
  'americanfootball_nfl_super_bowl_winner': 'american_football',
  'nfl': 'american_football',
  'ncaaf': 'american_football',
  
  // MMA / UFC
  'mma': 'mma',
  'mma_mixed_martial_arts': 'mma',
  'ufc': 'mma',
  'bellator': 'mma',
  'pfl': 'mma',
  
  // Baseball
  'baseball': 'baseball',
  'baseball_mlb': 'baseball',
  'baseball_mlb_world_series_winner': 'baseball',
  'baseball_ncaa': 'baseball',
  'baseball_kbo': 'baseball',
  'baseball_npb': 'baseball',
  'mlb': 'baseball',
  
  // Tennis
  'tennis': 'tennis',
  'tennis_atp_aus_open': 'tennis',
  'tennis_atp_french_open': 'tennis',
  'tennis_atp_wimbledon': 'tennis',
  'tennis_atp_us_open': 'tennis',
  'tennis_wta_aus_open': 'tennis',
  'tennis_wta_french_open': 'tennis',
  'tennis_wta_wimbledon': 'tennis',
  'tennis_wta_us_open': 'tennis',
};

/**
 * Convert sport string to normalized Sport type
 */
export function normalizeSport(sport: string): Sport {
  const lower = sport.toLowerCase();
  return SPORT_MAP[lower] || 'soccer';
}

/**
 * Detect if sport is Euroleague
 */
function isEuroleague(sport: string): boolean {
  const lower = sport.toLowerCase();
  return lower.includes('euroleague') || lower === 'basketball_euroleague';
}

/**
 * Get enriched match data using the new DataLayer
 * This is a drop-in replacement for getMultiSportEnrichedData
 */
export async function getEnrichedMatchDataV2(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  league?: string
): Promise<{
  sport: string;
  homeForm: Array<{ result: 'W' | 'L' | 'D'; opponent: string; score: string; date: string }> | null;
  awayForm: Array<{ result: 'W' | 'L' | 'D'; opponent: string; score: string; date: string }> | null;
  headToHead: Array<{ homeTeam: string; awayTeam: string; homeScore: number; awayScore: number; date: string }> | null;
  h2hSummary: { totalMatches: number; homeWins: number; awayWins: number; draws: number } | null;
  homeStats: { goalsScored: number; goalsConceded: number; cleanSheets: number; wins: number; losses: number; draws?: number; played?: number; averageScored?: number; averageConceded?: number } | null;
  awayStats: { goalsScored: number; goalsConceded: number; cleanSheets: number; wins: number; losses: number; draws?: number; played?: number; averageScored?: number; averageConceded?: number } | null;
  dataSource: 'API_SPORTS' | 'CACHE' | 'UNAVAILABLE';
}> {
  console.log(`[Bridge] START: ${homeTeam} vs ${awayTeam} (${sport})`);
  const dataLayer = getDataLayer();
  const normalizedSport = normalizeSport(sport);
  console.log(`[Bridge] Normalized sport: ${normalizedSport}`);
  
  // Configure basketball league if needed
  if (normalizedSport === 'basketball') {
    if (isEuroleague(sport)) {
      dataLayer.setBasketballLeague('euroleague');
      console.log(`[Bridge] Set basketball league to Euroleague`);
    } else {
      dataLayer.setBasketballLeague('nba');
      console.log(`[Bridge] Set basketball league to NBA`);
    }
  }
  
  try {
    console.log(`[Bridge] Calling dataLayer.getEnrichedMatchData with league: ${league || 'auto-detect'}...`);
    const result = await dataLayer.getEnrichedMatchData(
      normalizedSport,
      homeTeam,
      awayTeam,
      {
        includeStats: true,
        includeRecentGames: true,
        includeH2H: true,
        includeInjuries: false, // Not used in old format
        recentGamesLimit: 5,
        h2hLimit: 10,
        league, // Pass league to help resolve teams in less popular leagues
      }
    );
    
    console.log(`[Bridge] Result received:`, { success: result.success, hasData: !!result.data });
    
    if (!result.success || !result.data) {
      console.log(`[Bridge] Failed to fetch data for ${homeTeam} vs ${awayTeam}:`, result.error);
      return createEmptyResponse(sport);
    }
    
    const data = result.data;
    console.log(`[Bridge] Transforming data...`);
    console.log(`[Bridge] Home team:`, data.homeTeam?.team?.name);
    console.log(`[Bridge] Away team:`, data.awayTeam?.team?.name);
    console.log(`[Bridge] Home recent games:`, data.homeTeam?.recentGames?.games?.length || 0);
    console.log(`[Bridge] Away recent games:`, data.awayTeam?.recentGames?.games?.length || 0);
    console.log(`[Bridge] H2H present:`, !!data.h2h, 'matches:', data.h2h?.matches?.length, 'summary:', data.h2h?.summary);
    
    // Helper to safely convert date to ISO string
    const toISOString = (date: Date | string | undefined): string => {
      if (!date) return new Date().toISOString();
      if (typeof date === 'string') return date;
      return date.toISOString();
    };
    
    // Transform to old format for backward compatibility
    const transformed = {
      sport: normalizedSport,
      
      homeForm: data.homeTeam.recentGames?.games.map(game => {
        const isHome = game.homeTeam.externalId === data.homeTeam.team.externalId;
        const teamScore = isHome ? game.score?.home : game.score?.away;
        const oppScore = isHome ? game.score?.away : game.score?.home;
        const opponent = isHome ? game.awayTeam.name : game.homeTeam.name;
        
        let result: 'W' | 'L' | 'D' = 'D';
        if (teamScore !== undefined && oppScore !== undefined) {
          if (teamScore > oppScore) result = 'W';
          else if (teamScore < oppScore) result = 'L';
        }
        
        return {
          result,
          opponent,
          score: `${teamScore || 0}-${oppScore || 0}`,
          date: toISOString(game.date),
          home: isHome,
        };
      }) || null,
      
      awayForm: data.awayTeam.recentGames?.games.map(game => {
        const isHome = game.homeTeam.externalId === data.awayTeam.team.externalId;
        const teamScore = isHome ? game.score?.home : game.score?.away;
        const oppScore = isHome ? game.score?.away : game.score?.home;
        const opponent = isHome ? game.awayTeam.name : game.homeTeam.name;
        
        let result: 'W' | 'L' | 'D' = 'D';
        if (teamScore !== undefined && oppScore !== undefined) {
          if (teamScore > oppScore) result = 'W';
          else if (teamScore < oppScore) result = 'L';
        }
        
        return {
          result,
          opponent,
          score: `${teamScore || 0}-${oppScore || 0}`,
          date: toISOString(game.date),
          home: isHome,
        };
      }) || null,
      
      headToHead: data.h2h?.matches.map(match => ({
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        homeScore: match.score?.home || 0,
        awayScore: match.score?.away || 0,
        date: toISOString(match.date),
      })) || null,
      
      h2hSummary: data.h2h ? {
        totalMatches: data.h2h.summary.totalGames,
        homeWins: data.h2h.summary.team1Wins,
        awayWins: data.h2h.summary.team2Wins,
        draws: data.h2h.summary.draws,
      } : null,
      
      homeStats: data.homeTeam.stats ? {
        goalsScored: data.homeTeam.stats.scoring?.totalFor || 0,
        goalsConceded: data.homeTeam.stats.scoring?.totalAgainst || 0,
        cleanSheets: 0, // Not tracked in DataLayer yet
        wins: data.homeTeam.stats.record?.wins || 0,
        losses: data.homeTeam.stats.record?.losses || 0,
        draws: data.homeTeam.stats.record?.draws,
        played: (data.homeTeam.stats.record?.wins || 0) + (data.homeTeam.stats.record?.losses || 0) + (data.homeTeam.stats.record?.draws || 0),
        averageScored: data.homeTeam.stats.scoring?.averageFor || 0,
        averageConceded: data.homeTeam.stats.scoring?.averageAgainst || 0,
      } : null,
      
      awayStats: data.awayTeam.stats ? {
        goalsScored: data.awayTeam.stats.scoring?.totalFor || 0,
        goalsConceded: data.awayTeam.stats.scoring?.totalAgainst || 0,
        cleanSheets: 0, // Not tracked in DataLayer yet
        wins: data.awayTeam.stats.record?.wins || 0,
        losses: data.awayTeam.stats.record?.losses || 0,
        draws: data.awayTeam.stats.record?.draws,
        played: (data.awayTeam.stats.record?.wins || 0) + (data.awayTeam.stats.record?.losses || 0) + (data.awayTeam.stats.record?.draws || 0),
        averageScored: data.awayTeam.stats.scoring?.averageFor || 0,
        averageConceded: data.awayTeam.stats.scoring?.averageAgainst || 0,
      } : null,
      
      dataSource: 'API_SPORTS' as const,
    };
    
    console.log(`[Bridge] SUCCESS: Returning data for ${homeTeam} vs ${awayTeam}`);
    return transformed;
    
  } catch (error) {
    console.error(`[Bridge] ERROR for ${homeTeam} vs ${awayTeam} (${sport}):`, error);
    console.error(`[DataLayer Bridge] Stack:`, error instanceof Error ? error.stack : 'No stack');
    return createEmptyResponse(sport);
  }
}

function createEmptyResponse(sport: string): {
  sport: string;
  homeForm: null;
  awayForm: null;
  headToHead: null;
  h2hSummary: null;
  homeStats: null;
  awayStats: null;
  dataSource: 'UNAVAILABLE';
} {
  return {
    sport,
    homeForm: null,
    awayForm: null,
    headToHead: null,
    h2hSummary: null,
    homeStats: null,
    awayStats: null,
    dataSource: 'UNAVAILABLE',
  };
}

/**
 * Type guard to check if DataLayer is available for a sport
 */
export function isDataLayerAvailable(sport: string): boolean {
  const dataLayer = getDataLayer();
  const normalizedSport = normalizeSport(sport);
  return dataLayer.isSportAvailable(normalizedSport);
}

/**
 * Get full enriched data using DataLayer (new format)
 * Use this for new code that doesn't need backward compatibility
 */
export async function getFullEnrichedData(
  homeTeam: string,
  awayTeam: string,
  sport: Sport
): Promise<EnrichedMatchData | null> {
  const dataLayer = getDataLayer();
  
  const result = await dataLayer.getEnrichedMatchData(
    sport,
    homeTeam,
    awayTeam,
    {
      includeStats: true,
      includeRecentGames: true,
      includeH2H: true,
      includeInjuries: true,
      recentGamesLimit: 5,
      h2hLimit: 10,
    }
  );
  
  return result.success ? result.data || null : null;
}

/**
 * Get team rosters for a match using the DataLayer
 * Returns formatted string for AI consumption
 */
export async function getMatchRostersV2(
  homeTeam: string,
  awayTeam: string,
  sport: Sport
): Promise<string | null> {
  const dataLayer = getDataLayer();
  
  // First, find the team IDs
  const [homeTeamResult, awayTeamResult] = await Promise.all([
    dataLayer.findTeam({ sport, name: homeTeam }),
    dataLayer.findTeam({ sport, name: awayTeam }),
  ]);
  
  if (!homeTeamResult.success || !awayTeamResult.success) {
    console.warn(`[Bridge] Could not find teams: ${homeTeam}, ${awayTeam}`);
    return null;
  }
  
  const homeTeamId = homeTeamResult.data?.id;
  const awayTeamId = awayTeamResult.data?.id;
  
  if (!homeTeamId || !awayTeamId) {
    return null;
  }
  
  // Get rosters using the DataLayer
  return dataLayer.getMatchRosters(sport, homeTeamId, awayTeamId);
}
