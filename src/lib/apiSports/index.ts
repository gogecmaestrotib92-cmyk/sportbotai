/**
 * API-Sports Unified Client
 * 
 * Exports all sport-specific clients and provides unified access
 * to Basketball, NFL, and Hockey APIs using the same API key.
 */

// Re-export everything from each client
export * from './basketballClient';
export * from './nflClient';
export * from './hockeyClient';

// Import for internal use in this file
import {
  BASKETBALL_LEAGUES,
  getCurrentBasketballSeason,
  searchBasketballTeam,
} from './basketballClient';

import {
  NFL_LEAGUES,
  getCurrentNFLSeason,
  searchNFLTeam,
} from './nflClient';

import {
  HOCKEY_LEAGUES,
  getCurrentHockeySeason,
  searchHockeyTeam,
} from './hockeyClient';

// ============================================
// UNIFIED SPORT DETECTION
// ============================================

export type SupportedSportAPI = 'football' | 'basketball' | 'nfl' | 'hockey' | 'odds-api';

/**
 * Detect which API to use based on sport key
 */
export function detectSportAPI(sportKey: string): SupportedSportAPI {
  const key = sportKey.toLowerCase();
  
  // Basketball
  if (key.includes('basketball') || key.includes('nba') || key.includes('euroleague')) {
    return 'basketball';
  }
  
  // American Football
  if (key.includes('americanfootball') || key.includes('nfl') || key.includes('ncaaf') || key === 'american_football') {
    return 'nfl';
  }
  
  // Hockey
  if (key.includes('hockey') || key.includes('nhl') || key.includes('icehockey')) {
    return 'hockey';
  }
  
  // Soccer/Football
  if (key.includes('soccer') || key.includes('football') || key.includes('epl') || key.includes('la_liga') || key.includes('bundesliga') || key.includes('serie_a')) {
    return 'football';
  }
  
  // Default to odds-api for other sports (tennis, mma, etc.)
  return 'odds-api';
}

/**
 * Map sport key to league ID for the respective API
 */
export function getLeagueIdForSport(sportKey: string): { api: SupportedSportAPI; leagueId: number; season: string | number } | null {
  const key = sportKey.toLowerCase();
  
  // NBA
  if (key.includes('nba') || key === 'basketball_nba') {
    return { api: 'basketball', leagueId: BASKETBALL_LEAGUES.NBA, season: getCurrentBasketballSeason() };
  }
  
  // EuroLeague
  if (key.includes('euroleague')) {
    return { api: 'basketball', leagueId: BASKETBALL_LEAGUES.EUROLEAGUE, season: getCurrentBasketballSeason() };
  }
  
  // NFL
  if (key.includes('nfl') || key === 'americanfootball_nfl') {
    return { api: 'nfl', leagueId: NFL_LEAGUES.NFL, season: getCurrentNFLSeason() };
  }
  
  // NCAA Football
  if (key.includes('ncaaf') || key === 'americanfootball_ncaaf') {
    return { api: 'nfl', leagueId: NFL_LEAGUES.NCAA, season: getCurrentNFLSeason() };
  }
  
  // NHL
  if (key.includes('nhl') || key === 'icehockey_nhl') {
    return { api: 'hockey', leagueId: HOCKEY_LEAGUES.NHL, season: getCurrentHockeySeason() };
  }
  
  // KHL
  if (key.includes('khl')) {
    return { api: 'hockey', leagueId: HOCKEY_LEAGUES.KHL, season: getCurrentHockeySeason() };
  }
  
  return null;
}

// ============================================
// UNIFIED TEAM SEARCH
// ============================================

export interface UnifiedTeam {
  id: number;
  name: string;
  logo: string;
  sport: SupportedSportAPI;
}

/**
 * Search for a team across the appropriate sport API
 */
export async function searchTeamByName(
  teamName: string,
  sportKey: string
): Promise<UnifiedTeam | null> {
  const sportAPI = detectSportAPI(sportKey);
  const leagueInfo = getLeagueIdForSport(sportKey);
  
  try {
    switch (sportAPI) {
      case 'basketball': {
        const teams = await searchBasketballTeam(teamName, leagueInfo?.leagueId);
        if (teams.length > 0) {
          return { ...teams[0], sport: 'basketball' };
        }
        break;
      }
      case 'nfl': {
        const teams = await searchNFLTeam(teamName, leagueInfo?.leagueId);
        if (teams.length > 0) {
          return { ...teams[0], sport: 'nfl' };
        }
        break;
      }
      case 'hockey': {
        const teams = await searchHockeyTeam(teamName, leagueInfo?.leagueId);
        if (teams.length > 0) {
          return { ...teams[0], sport: 'hockey' };
        }
        break;
      }
    }
  } catch (error) {
    console.error(`Error searching for team ${teamName}:`, error);
  }
  
  return null;
}
