/**
 * MMA API Client (API-Sports)
 * 
 * Full UFC/MMA data from API-Sports MMA API
 * Base URL: https://v1.mma.api-sports.io/
 * 
 * Uses same API key as football API (API_FOOTBALL_KEY)
 */

const API_KEY = process.env.API_FOOTBALL_KEY || '';
const MMA_API_URL = 'https://v1.mma.api-sports.io';

// ============================================
// TYPES
// ============================================

export interface MMAFighter {
  id: number;
  name: string;
  nickname: string | null;
  category: string;
  team: {
    id: number;
    name: string;
  } | null;
  nationality: string | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  reach: string | null;
  image: string | null;
}

export interface MMAFighterRecord {
  fighter: {
    id: number;
    name: string;
  };
  record: {
    total: {
      win: number;
      loss: number;
      draw: number;
      nc: number; // No contest
    };
    ko: {
      win: number;
      loss: number;
    };
    sub: {
      win: number;
      loss: number;
    };
    dec: {
      win: number;
      loss: number;
    };
  };
}

export interface MMAFight {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  category: string;
  slug: string;
  status: {
    long: string;
    short: string; // NS, IN, PF, LIVE, EOR, FT, WO, CANC, PST
  };
  fighters: {
    first: MMAFighter;
    second: MMAFighter;
  };
  results: {
    first: number | null;
    second: number | null;
  } | null;
}

export interface MMAFightResult {
  fight: {
    id: number;
  };
  winner: {
    id: number;
    name: string;
  } | null;
  method: string | null; // KO/TKO, SUB, DEC, etc.
  round: number | null;
  time: string | null;
}

export interface MMAFightStats {
  fight: {
    id: number;
  };
  fighter: {
    id: number;
    name: string;
  };
  statistics: {
    strikes: {
      total: number | null;
      landed: number | null;
      accuracy: string | null;
    };
    significant_strikes: {
      total: number | null;
      landed: number | null;
      accuracy: string | null;
    };
    takedowns: {
      total: number | null;
      landed: number | null;
      accuracy: string | null;
    };
    submission_attempts: number | null;
    knockdowns: number | null;
    reversals: number | null;
    control_time: string | null;
  };
}

export interface MMAOdds {
  fight: {
    id: number;
  };
  bookmakers: Array<{
    id: number;
    name: string;
    bets: Array<{
      id: number;
      name: string;
      values: Array<{
        value: string;
        odd: string;
      }>;
    }>;
  }>;
}

export interface MMACategory {
  name: string;
}

// ============================================
// API RESPONSE WRAPPER
// ============================================

interface MMAApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[] | Record<string, string>;
  results: number;
  response: T;
}

// ============================================
// API CLIENT FUNCTIONS
// ============================================

/**
 * Make a request to the MMA API
 */
async function mmaApiRequest<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T | null> {
  if (!API_KEY) {
    console.error('[MMA API] No API key configured');
    return null;
  }

  const url = new URL(`${MMA_API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`[MMA API] Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: MMAApiResponse<T> = await response.json();
    
    if (data.errors && (Array.isArray(data.errors) ? data.errors.length > 0 : Object.keys(data.errors).length > 0)) {
      console.error('[MMA API] API returned errors:', data.errors);
      return null;
    }

    return data.response;
  } catch (error) {
    console.error('[MMA API] Request failed:', error);
    return null;
  }
}

// ============================================
// FIGHTERS
// ============================================

/**
 * Search for fighters by various criteria
 */
export async function getMMAFighters(params: {
  id?: number;
  team?: number;
  name?: string;
  category?: string;
  search?: string;
}): Promise<MMAFighter[] | null> {
  return mmaApiRequest<MMAFighter[]>('/fighters', params);
}

/**
 * Get a fighter's career record (W/L/KO/SUB stats)
 */
export async function getMMAFighterRecord(fighterId: number): Promise<MMAFighterRecord | null> {
  const response = await mmaApiRequest<MMAFighterRecord[]>('/fighters/records', { id: fighterId });
  return response?.[0] || null;
}

/**
 * Search fighter by name (convenience function)
 */
export async function searchMMAFighter(name: string): Promise<MMAFighter | null> {
  const fighters = await getMMAFighters({ search: name });
  if (!fighters || fighters.length === 0) return null;
  
  // Try exact match first
  const exactMatch = fighters.find(f => 
    f.name.toLowerCase() === name.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  
  // Return first partial match
  return fighters[0];
}

// ============================================
// FIGHTS
// ============================================

/**
 * Get fights by various criteria
 */
export async function getMMAFights(params: {
  id?: number;
  date?: string; // YYYY-MM-DD
  season?: number;
  fighter?: number;
  category?: string;
  timezone?: string;
}): Promise<MMAFight[] | null> {
  return mmaApiRequest<MMAFight[]>('/fights', params);
}

/**
 * Get fight results
 */
export async function getMMAFightResults(params: {
  id?: number;
  ids?: string; // Multiple IDs separated by dash (e.g., "865-878-879")
  date?: string;
}): Promise<MMAFightResult[] | null> {
  return mmaApiRequest<MMAFightResult[]>('/fights/results', params);
}

/**
 * Get fighter statistics for a fight
 */
export async function getMMAFightStatistics(params: {
  id?: number;
  ids?: string;
  date?: string;
}): Promise<MMAFightStats[] | null> {
  return mmaApiRequest<MMAFightStats[]>('/fights/statistics/fighters', params);
}

// ============================================
// ODDS
// ============================================

/**
 * Get odds for fights
 */
export async function getMMAOdds(params: {
  fight?: number;
  date?: string;
  bookmaker?: number;
  bet?: number;
}): Promise<MMAOdds[] | null> {
  return mmaApiRequest<MMAOdds[]>('/odds', params);
}

/**
 * Get available bet types for MMA
 */
export async function getMMABetTypes(): Promise<Array<{ id: number; name: string }> | null> {
  return mmaApiRequest<Array<{ id: number; name: string }>>('/odds/bets');
}

/**
 * Get available bookmakers for MMA odds
 */
export async function getMMABookmakers(): Promise<Array<{ id: number; name: string }> | null> {
  return mmaApiRequest<Array<{ id: number; name: string }>>('/odds/bookmakers');
}

// ============================================
// CATEGORIES & SEASONS
// ============================================

/**
 * Get all weight categories
 */
export async function getMMACategories(): Promise<string[] | null> {
  return mmaApiRequest<string[]>('/categories');
}

/**
 * Get all available seasons
 */
export async function getMMASeasons(): Promise<number[] | null> {
  return mmaApiRequest<number[]>('/seasons');
}

/**
 * Get current MMA season (year)
 */
export function getCurrentMMASeason(): number {
  return new Date().getFullYear();
}

// ============================================
// TEAMS (Camps/Gyms)
// ============================================

/**
 * Get MMA teams (camps/gyms)
 */
export async function getMMATeams(params?: {
  id?: number;
  search?: string;
}): Promise<Array<{ id: number; name: string; logo: string | null }> | null> {
  return mmaApiRequest<Array<{ id: number; name: string; logo: string | null }>>('/teams', params || {});
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate fighter stats summary for analysis
 */
export function calculateFighterStats(record: MMAFighterRecord | null): {
  winRate: number;
  finishRate: number;
  koRate: number;
  subRate: number;
  totalFights: number;
} | null {
  if (!record) return null;

  const total = record.record.total;
  const totalFights = total.win + total.loss + total.draw + total.nc;
  
  if (totalFights === 0) {
    return { winRate: 0, finishRate: 0, koRate: 0, subRate: 0, totalFights: 0 };
  }

  const wins = total.win;
  const winRate = (wins / totalFights) * 100;
  
  const koWins = record.record.ko.win;
  const subWins = record.record.sub.win;
  const finishWins = koWins + subWins;
  
  const finishRate = wins > 0 ? (finishWins / wins) * 100 : 0;
  const koRate = wins > 0 ? (koWins / wins) * 100 : 0;
  const subRate = wins > 0 ? (subWins / wins) * 100 : 0;

  return {
    winRate: Math.round(winRate * 10) / 10,
    finishRate: Math.round(finishRate * 10) / 10,
    koRate: Math.round(koRate * 10) / 10,
    subRate: Math.round(subRate * 10) / 10,
    totalFights,
  };
}

/**
 * Format fight status for display
 */
export function formatFightStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'NS': 'Not Started',
    'IN': 'Intros',
    'PF': 'Pre-Fight',
    'LIVE': 'In Progress',
    'EOR': 'End of Round',
    'FT': 'Finished',
    'WO': 'Walkout',
    'CANC': 'Cancelled',
    'PST': 'Postponed',
  };
  return statusMap[status] || status;
}

/**
 * Weight class categories
 */
export const MMA_WEIGHT_CLASSES = [
  'Strawweight',        // W 115 lbs
  'Flyweight',          // 125 lbs
  'Bantamweight',       // 135 lbs
  'Featherweight',      // 145 lbs
  'Lightweight',        // 155 lbs
  'Welterweight',       // 170 lbs
  'Middleweight',       // 185 lbs
  'Light Heavyweight',  // 205 lbs
  'Heavyweight',        // 265 lbs
  "Women's Strawweight",
  "Women's Flyweight",
  "Women's Bantamweight",
  "Women's Featherweight",
  'Catch Weight',
  'Open Weight',
] as const;

export type MMAWeightClass = typeof MMA_WEIGHT_CLASSES[number];
