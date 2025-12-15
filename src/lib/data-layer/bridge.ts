/**
 * Data Layer Bridge
 * 
 * This module bridges the old sports-api.ts functions with the new DataLayer.
 * Use this for gradual migration - new code should use DataLayer directly.
 */

import { getDataLayer } from './index';
import type { Sport, EnrichedMatchData } from './types';

// Map sport string identifiers to Sport type
const SPORT_MAP: Record<string, Sport> = {
  'soccer': 'soccer',
  'football': 'soccer',
  'soccer_epl': 'soccer',
  'soccer_spain_la_liga': 'soccer',
  'soccer_uefa_champs_league': 'soccer',
  'soccer_germany_bundesliga': 'soccer',
  'soccer_italy_serie_a': 'soccer',
  'soccer_france_ligue_one': 'soccer',
  'basketball': 'basketball',
  'basketball_nba': 'basketball',
  'nba': 'basketball',
  'hockey': 'hockey',
  'icehockey': 'hockey',
  'icehockey_nhl': 'hockey',
  'nhl': 'hockey',
  'americanfootball': 'american_football',
  'american_football': 'american_football',
  'americanfootball_nfl': 'american_football',
  'nfl': 'american_football',
};

/**
 * Convert sport string to normalized Sport type
 */
export function normalizeSport(sport: string): Sport {
  const lower = sport.toLowerCase();
  return SPORT_MAP[lower] || 'soccer';
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
  homeStats: { goalsScored: number; goalsConceded: number; cleanSheets: number; wins: number; losses: number; draws?: number } | null;
  awayStats: { goalsScored: number; goalsConceded: number; cleanSheets: number; wins: number; losses: number; draws?: number } | null;
  dataSource: 'API_SPORTS' | 'CACHE' | 'UNAVAILABLE';
}> {
  console.log(`[Bridge] START: ${homeTeam} vs ${awayTeam} (${sport})`);
  const dataLayer = getDataLayer();
  const normalizedSport = normalizeSport(sport);
  console.log(`[Bridge] Normalized sport: ${normalizedSport}`);
  
  try {
    console.log(`[Bridge] Calling dataLayer.getEnrichedMatchData...`);
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
      } : null,
      
      awayStats: data.awayTeam.stats ? {
        goalsScored: data.awayTeam.stats.scoring?.totalFor || 0,
        goalsConceded: data.awayTeam.stats.scoring?.totalAgainst || 0,
        cleanSheets: 0, // Not tracked in DataLayer yet
        wins: data.awayTeam.stats.record?.wins || 0,
        losses: data.awayTeam.stats.record?.losses || 0,
        draws: data.awayTeam.stats.record?.draws,
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
