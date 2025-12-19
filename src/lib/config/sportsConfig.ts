/**
 * Sports Configuration
 * 
 * Centralized configuration for all supported sports.
 * This makes it easy to add new sports by just updating this config.
 */

// ============================================
// TYPES
// ============================================

export interface SportConfig {
  /** Internal identifier (e.g., "nba", "nfl") */
  id: string;
  
  /** The Odds API sport key (e.g., "basketball_nba") */
  oddsApiSportKey: string;
  
  /** Human-readable name (e.g., "NBA") */
  displayName: string;
  
  /** Sport category (e.g., "Basketball") */
  category: string;
  
  /** Whether the sport has a draw outcome */
  hasDraw: boolean;
  
  /** Whether to use goals (soccer) or points (basketball/football) */
  scoringUnit: 'goals' | 'points' | 'games' | 'sets' | 'runs' | 'rounds';
  
  /** Term for a match (e.g., "match", "game", "bout") */
  matchTerm: string;
  
  /** Term for participants (e.g., "team", "player", "fighter") */
  participantTerm: string;
  
  /** Icon emoji for UI */
  icon: string;
  
  /** Data source: 'odds-api', 'football-api', or 'api-sports' */
  dataSource: 'odds-api' | 'football-api' | 'api-sports';
  
  /** Priority for sorting (lower = higher priority) */
  priority: number;
  
  /** Whether this sport has full data layer support (stats, H2H, form, etc.) */
  enabled: boolean;
}

// ============================================
// SPORTS CONFIGURATION MAP
// ============================================

export const SPORTS_CONFIG: Record<string, SportConfig> = {
  // ====================
  // FOOTBALL/SOCCER (uses dedicated football API)
  // ====================
  'soccer': {
    id: 'soccer',
    oddsApiSportKey: 'soccer',
    displayName: 'Soccer',
    category: 'Soccer',
    hasDraw: true,
    scoringUnit: 'goals',
    matchTerm: 'match',
    participantTerm: 'team',
    icon: '⚽',
    dataSource: 'football-api',
    priority: 1,
    enabled: true,
  },
  
  // Soccer leagues via Odds API (for markets comparison)
  'soccer_epl': {
    id: 'soccer_epl',
    oddsApiSportKey: 'soccer_epl',
    displayName: 'Premier League',
    category: 'Soccer',
    hasDraw: true,
    scoringUnit: 'goals',
    matchTerm: 'match',
    participantTerm: 'team',
    icon: '⚽',
    dataSource: 'odds-api',
    priority: 2,
    enabled: true,
  },
  'soccer_spain_la_liga': {
    id: 'soccer_spain_la_liga',
    oddsApiSportKey: 'soccer_spain_la_liga',
    displayName: 'La Liga',
    category: 'Soccer',
    hasDraw: true,
    scoringUnit: 'goals',
    matchTerm: 'match',
    participantTerm: 'team',
    icon: '⚽',
    dataSource: 'odds-api',
    priority: 3,
    enabled: true,
  },
  'soccer_germany_bundesliga': {
    id: 'soccer_germany_bundesliga',
    oddsApiSportKey: 'soccer_germany_bundesliga',
    displayName: 'Bundesliga',
    category: 'Soccer',
    hasDraw: true,
    scoringUnit: 'goals',
    matchTerm: 'match',
    participantTerm: 'team',
    icon: '⚽',
    dataSource: 'odds-api',
    priority: 4,
    enabled: true,
  },
  'soccer_italy_serie_a': {
    id: 'soccer_italy_serie_a',
    oddsApiSportKey: 'soccer_italy_serie_a',
    displayName: 'Serie A',
    category: 'Soccer',
    hasDraw: true,
    scoringUnit: 'goals',
    matchTerm: 'match',
    participantTerm: 'team',
    icon: '⚽',
    dataSource: 'odds-api',
    priority: 5,
    enabled: true,
  },
  'soccer_france_ligue_one': {
    id: 'soccer_france_ligue_one',
    oddsApiSportKey: 'soccer_france_ligue_one',
    displayName: 'Ligue 1',
    category: 'Soccer',
    hasDraw: true,
    scoringUnit: 'goals',
    matchTerm: 'match',
    participantTerm: 'team',
    icon: '⚽',
    dataSource: 'odds-api',
    priority: 6,
    enabled: true,
  },
  'soccer_uefa_champs_league': {
    id: 'soccer_uefa_champs_league',
    oddsApiSportKey: 'soccer_uefa_champs_league',
    displayName: 'UEFA Champions League',
    category: 'Soccer',
    hasDraw: true,
    scoringUnit: 'goals',
    matchTerm: 'match',
    participantTerm: 'team',
    icon: '⚽',
    dataSource: 'odds-api',
    priority: 7,
    enabled: true,
  },
  
  // ====================
  // BASKETBALL
  // ====================
  'basketball_nba': {
    id: 'basketball_nba',
    oddsApiSportKey: 'basketball_nba',
    displayName: 'NBA',
    category: 'Basketball',
    hasDraw: false,
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏀',
    dataSource: 'odds-api',
    priority: 10,
    enabled: true,
  },
  'basketball_euroleague': {
    id: 'basketball_euroleague',
    oddsApiSportKey: 'basketball_euroleague',
    displayName: 'EuroLeague',
    category: 'Basketball',
    hasDraw: false,
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏀',
    dataSource: 'odds-api',
    priority: 11,
    enabled: false, // No data layer support yet
  },
  'basketball_eurocup': {
    id: 'basketball_eurocup',
    oddsApiSportKey: 'basketball_eurocup',
    displayName: 'EuroCup',
    category: 'Basketball',
    hasDraw: false,
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏀',
    dataSource: 'api-sports',
    priority: 12,
    enabled: false, // No data layer support yet
  },
  'basketball_acb_spain': {
    id: 'basketball_acb_spain',
    oddsApiSportKey: 'basketball_spain_liga_acb',
    displayName: 'ACB Spain',
    category: 'Basketball',
    hasDraw: false,
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏀',
    enabled: false, // No data layer support yet
    dataSource: 'api-sports',
    priority: 13,
  },
  'basketball_italy_lega': {
    id: 'basketball_italy_lega',
    oddsApiSportKey: 'basketball_italy_lega_basket',
    displayName: 'Lega Basket Italy',
    category: 'Basketball',
    hasDraw: false,
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏀',
    dataSource: 'api-sports',
    priority: 14,
    enabled: false, // No data layer support yet
  },
  'basketball_germany_bbl': {
    id: 'basketball_germany_bbl',
    oddsApiSportKey: 'basketball_germany_bundesliga',
    displayName: 'BBL Germany',
    category: 'Basketball',
    hasDraw: false,
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏀',
    dataSource: 'api-sports',
    priority: 15,
    enabled: false, // No data layer support yet
  },
  'basketball_france_pro_a': {
    id: 'basketball_france_pro_a',
    oddsApiSportKey: 'basketball_france_pro_a',
    displayName: 'Pro A France',
    category: 'Basketball',
    hasDraw: false,
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏀',
    dataSource: 'api-sports',
    priority: 16,
    enabled: false, // No data layer support yet
  },
  'basketball_turkey_bsl': {
    id: 'basketball_turkey_bsl',
    oddsApiSportKey: 'basketball_turkey_super_league',
    displayName: 'BSL Turkey',
    category: 'Basketball',
    hasDraw: false,
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏀',
    dataSource: 'api-sports',
    priority: 17,
    enabled: false, // No data layer support yet
  },
  'basketball_russia_vtb': {
    id: 'basketball_russia_vtb',
    oddsApiSportKey: 'basketball_vtb_united_league',
    displayName: 'VTB United League',
    category: 'Basketball',
    hasDraw: false,
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏀',
    dataSource: 'api-sports',
    priority: 18,
    enabled: false, // No data layer support yet
  },
  
  // ====================
  // AMERICAN FOOTBALL
  // ====================
  'americanfootball_nfl': {
    id: 'americanfootball_nfl',
    oddsApiSportKey: 'americanfootball_nfl',
    displayName: 'NFL',
    category: 'American Football',
    hasDraw: false, // Rare in NFL
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏈',
    dataSource: 'odds-api',
    priority: 20,
    enabled: true,
  },
  'americanfootball_ncaaf': {
    id: 'americanfootball_ncaaf',
    oddsApiSportKey: 'americanfootball_ncaaf',
    displayName: 'NCAA Football',
    category: 'American Football',
    hasDraw: false,
    scoringUnit: 'points',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏈',
    dataSource: 'odds-api',
    priority: 21,
    enabled: false, // No data layer support yet
  },
  
  // ====================
  // TENNIS
  // ====================
  'tennis_atp_aus_open': {
    id: 'tennis_atp_aus_open',
    oddsApiSportKey: 'tennis_atp_aus_open',
    displayName: 'ATP Australian Open',
    category: 'Tennis',
    hasDraw: false,
    scoringUnit: 'sets',
    matchTerm: 'match',
    participantTerm: 'player',
    icon: '🎾',
    dataSource: 'odds-api',
    priority: 30,
    enabled: false, // No data layer support yet
  },
  'tennis_atp_french_open': {
    id: 'tennis_atp_french_open',
    oddsApiSportKey: 'tennis_atp_french_open',
    displayName: 'ATP French Open',
    category: 'Tennis',
    hasDraw: false,
    scoringUnit: 'sets',
    matchTerm: 'match',
    participantTerm: 'player',
    icon: '🎾',
    dataSource: 'odds-api',
    priority: 31,
    enabled: false, // No data layer support yet
  },
  'tennis_atp_wimbledon': {
    id: 'tennis_atp_wimbledon',
    oddsApiSportKey: 'tennis_atp_wimbledon',
    displayName: 'ATP Wimbledon',
    category: 'Tennis',
    hasDraw: false,
    scoringUnit: 'sets',
    matchTerm: 'match',
    participantTerm: 'player',
    icon: '🎾',
    dataSource: 'odds-api',
    priority: 32,
    enabled: false, // No data layer support yet
  },
  'tennis_atp_us_open': {
    id: 'tennis_atp_us_open',
    oddsApiSportKey: 'tennis_atp_us_open',
    displayName: 'ATP US Open',
    category: 'Tennis',
    hasDraw: false,
    scoringUnit: 'sets',
    matchTerm: 'match',
    participantTerm: 'player',
    icon: '🎾',
    dataSource: 'odds-api',
    priority: 33,
    enabled: false, // No data layer support yet
  },
  
  // ====================
  // ICE HOCKEY
  // ====================
  'icehockey_nhl': {
    id: 'icehockey_nhl',
    oddsApiSportKey: 'icehockey_nhl',
    displayName: 'NHL',
    category: 'Ice Hockey',
    hasDraw: true, // Regulation can end in tie
    scoringUnit: 'goals',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '🏒',
    dataSource: 'odds-api',
    priority: 40,
    enabled: true,
  },
  
  // ====================
  // MMA / BOXING
  // ====================
  'mma_mixed_martial_arts': {
    id: 'mma_mixed_martial_arts',
    oddsApiSportKey: 'mma_mixed_martial_arts',
    displayName: 'UFC / MMA',
    category: 'Combat Sports',
    hasDraw: true, // Draws are possible
    scoringUnit: 'rounds',
    matchTerm: 'bout',
    participantTerm: 'fighter',
    icon: '🥊',
    dataSource: 'odds-api',
    priority: 50,
    enabled: false, // No data layer support yet
  },
  
  // ====================
  // BASEBALL
  // ====================
  'baseball_mlb': {
    id: 'baseball_mlb',
    oddsApiSportKey: 'baseball_mlb',
    displayName: 'MLB',
    category: 'Baseball',
    hasDraw: false,
    scoringUnit: 'runs',
    matchTerm: 'game',
    participantTerm: 'team',
    icon: '⚾',
    dataSource: 'odds-api',
    priority: 60,
    enabled: false, // No data layer support yet
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get sport config by internal ID or Odds API sport key
 * Also handles generic sport names like "Basketball" by matching category
 */
export function getSportConfig(idOrKey: string): SportConfig | null {
  if (!idOrKey) return null;
  
  // Try direct lookup by ID
  if (SPORTS_CONFIG[idOrKey]) {
    return SPORTS_CONFIG[idOrKey];
  }
  
  // Try lookup by Odds API sport key
  const foundByKey = Object.values(SPORTS_CONFIG).find(
    config => config.oddsApiSportKey === idOrKey
  );
  if (foundByKey) return foundByKey;
  
  // Try lookup by category name (e.g., "Basketball" -> basketball_nba)
  const normalizedInput = idOrKey.toLowerCase().trim();
  const foundByCategory = Object.values(SPORTS_CONFIG).find(
    config => config.category.toLowerCase() === normalizedInput
  );
  if (foundByCategory) return foundByCategory;
  
  // Try partial match on category or display name
  const foundByPartial = Object.values(SPORTS_CONFIG).find(
    config => 
      config.category.toLowerCase().includes(normalizedInput) ||
      config.displayName.toLowerCase().includes(normalizedInput) ||
      normalizedInput.includes(config.category.toLowerCase())
  );
  
  return foundByPartial || null;
}

/**
 * Get all sports configs as array, sorted by priority
 */
export function getAllSportsConfigs(): SportConfig[] {
  return Object.values(SPORTS_CONFIG).sort((a, b) => a.priority - b.priority);
}

/**
 * Get only enabled sports (those with full data layer support)
 */
export function getEnabledSportsConfigs(): SportConfig[] {
  return getAllSportsConfigs().filter(config => config.enabled);
}

/**
 * Get enabled sports grouped by category (only shows categories with enabled sports)
 */
export function getEnabledSportsGroupedByCategory(): Record<string, SportConfig[]> {
  const grouped: Record<string, SportConfig[]> = {};
  
  for (const config of getEnabledSportsConfigs()) {
    if (!grouped[config.category]) {
      grouped[config.category] = [];
    }
    grouped[config.category].push(config);
  }
  
  return grouped;
}

/**
 * Get sports grouped by category
 */
export function getSportsGroupedByCategory(): Record<string, SportConfig[]> {
  const grouped: Record<string, SportConfig[]> = {};
  
  for (const config of getAllSportsConfigs()) {
    if (!grouped[config.category]) {
      grouped[config.category] = [];
    }
    grouped[config.category].push(config);
  }
  
  return grouped;
}

/**
 * Get sports that use The Odds API
 */
export function getOddsApiSports(): SportConfig[] {
  return getAllSportsConfigs().filter(config => config.dataSource === 'odds-api');
}

/**
 * Get sports that use dedicated football API
 */
export function getFootballApiSports(): SportConfig[] {
  return getAllSportsConfigs().filter(config => config.dataSource === 'football-api');
}

/**
 * Check if sport uses The Odds API
 */
export function isOddsApiSport(idOrKey: string): boolean {
  const config = getSportConfig(idOrKey);
  return config?.dataSource === 'odds-api';
}

/**
 * Get display-friendly sport categories for frontend selector
 */
export function getSportCategories(): { id: string; name: string; icon: string }[] {
  const categories = new Map<string, { id: string; name: string; icon: string }>();
  
  for (const config of getAllSportsConfigs()) {
    if (!categories.has(config.category)) {
      categories.set(config.category, {
        id: config.category.toLowerCase().replace(/\s+/g, '-'),
        name: config.category,
        icon: config.icon,
      });
    }
  }
  
  return Array.from(categories.values());
}

/**
 * Get sport terminology for AI prompts
 */
export function getSportTerminology(sportId: string): {
  matchTerm: string;
  participantTerm: string;
  scoringUnit: string;
  hasDraw: boolean;
} {
  const config = getSportConfig(sportId);
  
  if (!config) {
    // Default to soccer terminology
    return {
      matchTerm: 'match',
      participantTerm: 'team',
      scoringUnit: 'goals',
      hasDraw: true,
    };
  }
  
  return {
    matchTerm: config.matchTerm,
    participantTerm: config.participantTerm,
    scoringUnit: config.scoringUnit,
    hasDraw: config.hasDraw,
  };
}
