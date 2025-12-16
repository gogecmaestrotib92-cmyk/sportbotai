/**
 * The Odds API Service
 * 
 * Centralizovana integracija sa The Odds API za dohvatanje:
 * - Dostupnih sportova i liga
 * - Trenutnih kvota sa više bookmakera
 * - Nadolazećih događaja
 * 
 * API Dokumentacija: https://the-odds-api.com/liveapi/guides/v4/
 */

// ===========================================
// TIPOVI
// ===========================================

export interface OddsSport {
  key: string;           // npr. "soccer_epl", "basketball_nba"
  group: string;         // npr. "Soccer", "Basketball"
  title: string;         // npr. "EPL", "NBA"
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsBookmaker[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}

export interface OddsMarket {
  key: string;           // "h2h", "spreads", "totals"
  last_update?: string;
  outcomes: OddsOutcome[];
}

export interface OddsOutcome {
  name: string;
  price: number;         // Decimalni format kvote
  point?: number;        // Za spreads/totals
  description?: string;  // Za player props
}

export interface OddsApiResponse<T> {
  data: T;
  requestsRemaining: number;
  requestsUsed: number;
}

// Grupisani sportovi za UI
export interface SportGroup {
  group: string;
  sports: OddsSport[];
}

// ===========================================
// API KLIJENT
// ===========================================

const API_BASE_URL = 'https://api.the-odds-api.com/v4';

/**
 * Dohvata listu svih dostupnih sportova
 * BESPLATNO - ne troši kvotu!
 */
export async function getSports(apiKey: string): Promise<OddsApiResponse<OddsSport[]>> {
  const response = await fetch(
    `${API_BASE_URL}/sports?apiKey=${apiKey}`,
    { next: { revalidate: 3600 } } // Cache 1 sat
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch sports: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    data,
    requestsRemaining: parseInt(response.headers.get('x-requests-remaining') || '0'),
    requestsUsed: parseInt(response.headers.get('x-requests-used') || '0'),
  };
}

/**
 * Dohvata kvote za određeni sport
 * TROŠI KVOTU: 1 po regionu po marketu
 */
export async function getOdds(
  apiKey: string,
  sportKey: string,
  options: {
    regions?: string[];    // ["eu", "uk", "us"]
    markets?: string[];    // ["h2h", "spreads", "totals"]
    oddsFormat?: 'decimal' | 'american';
    bookmakers?: string[]; // Specifični bookmakeri
  } = {}
): Promise<OddsApiResponse<OddsEvent[]>> {
  const {
    regions = ['eu'],
    markets = ['h2h'],
    oddsFormat = 'decimal',
    bookmakers,
  } = options;

  const params = new URLSearchParams({
    apiKey,
    regions: regions.join(','),
    markets: markets.join(','),
    oddsFormat,
  });

  if (bookmakers && bookmakers.length > 0) {
    params.set('bookmakers', bookmakers.join(','));
  }

  const response = await fetch(
    `${API_BASE_URL}/sports/${sportKey}/odds?${params}`,
    { next: { revalidate: 300 } } // Cache 5 minuta
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch odds: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    data,
    requestsRemaining: parseInt(response.headers.get('x-requests-remaining') || '0'),
    requestsUsed: parseInt(response.headers.get('x-requests-used') || '0'),
  };
}

/**
 * Dohvata listu događaja bez kvota
 * BESPLATNO - ne troši kvotu!
 */
export async function getEvents(
  apiKey: string,
  sportKey: string
): Promise<OddsApiResponse<OddsEvent[]>> {
  const response = await fetch(
    `${API_BASE_URL}/sports/${sportKey}/events?apiKey=${apiKey}`,
    { next: { revalidate: 300 } }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
  }

  const data = await response.json();

  return {
    data,
    requestsRemaining: parseInt(response.headers.get('x-requests-remaining') || '0'),
    requestsUsed: parseInt(response.headers.get('x-requests-used') || '0'),
  };
}

/**
 * Dohvata kvote za specifičan događaj sa svim dostupnim marketima
 * TROŠI KVOTU: 1 po regionu po marketu
 */
export async function getEventOdds(
  apiKey: string,
  sportKey: string,
  eventId: string,
  options: {
    regions?: string[];
    markets?: string[];
    oddsFormat?: 'decimal' | 'american';
  } = {}
): Promise<OddsApiResponse<OddsEvent>> {
  const {
    regions = ['eu'],
    markets = ['h2h'],
    oddsFormat = 'decimal',
  } = options;

  const params = new URLSearchParams({
    apiKey,
    regions: regions.join(','),
    markets: markets.join(','),
    oddsFormat,
  });

  const response = await fetch(
    `${API_BASE_URL}/sports/${sportKey}/events/${eventId}/odds?${params}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch event odds: ${response.status}`);
  }

  const data = await response.json();

  return {
    data,
    requestsRemaining: parseInt(response.headers.get('x-requests-remaining') || '0'),
    requestsUsed: parseInt(response.headers.get('x-requests-used') || '0'),
  };
}

// ===========================================
// HELPER FUNKCIJE
// ===========================================

/**
 * Grupiše sportove po kategorijama za lakši prikaz u UI
 */
export function groupSportsByCategory(sports: OddsSport[]): SportGroup[] {
  const groups: Record<string, OddsSport[]> = {};

  for (const sport of sports) {
    if (!sport.active) continue;
    
    if (!groups[sport.group]) {
      groups[sport.group] = [];
    }
    groups[sport.group].push(sport);
  }

  // Sortiraj grupe i sportove unutar grupa
  return Object.entries(groups)
    .map(([group, sports]) => ({
      group,
      sports: sports.sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

/**
 * Izračunava prosečnu kvotu sa svih bookmakera
 */
export function calculateAverageOdds(event: OddsEvent): {
  home: number;
  draw: number | null;
  away: number;
} {
  if (!event.bookmakers || event.bookmakers.length === 0) {
    return { home: 0, draw: null, away: 0 };
  }

  let homeSum = 0;
  let drawSum = 0;
  let awaySum = 0;
  let homeCount = 0;
  let drawCount = 0;
  let awayCount = 0;

  for (const bookmaker of event.bookmakers) {
    const h2h = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2h) continue;

    for (const outcome of h2h.outcomes) {
      if (outcome.name === event.home_team) {
        homeSum += outcome.price;
        homeCount++;
      } else if (outcome.name === event.away_team) {
        awaySum += outcome.price;
        awayCount++;
      } else if (outcome.name === 'Draw') {
        drawSum += outcome.price;
        drawCount++;
      }
    }
  }

  return {
    home: homeCount > 0 ? Math.round((homeSum / homeCount) * 100) / 100 : 0,
    draw: drawCount > 0 ? Math.round((drawSum / drawCount) * 100) / 100 : null,
    away: awayCount > 0 ? Math.round((awaySum / awayCount) * 100) / 100 : 0,
  };
}

/**
 * Izračunava implied probability iz decimalne kvote
 */
export function oddsToImpliedProbability(odds: number): number {
  if (odds <= 0) return 0;
  return Math.round((1 / odds) * 10000) / 100; // zaokruži na 2 decimale
}

/**
 * Pronalazi najbolju kvotu među svim bookmakerima
 */
export function findBestOdds(
  event: OddsEvent,
  outcome: 'home' | 'draw' | 'away'
): { bookmaker: string; odds: number } | null {
  if (!event.bookmakers || event.bookmakers.length === 0) {
    return null;
  }

  let best: { bookmaker: string; odds: number } | null = null;
  const targetName = outcome === 'home' 
    ? event.home_team 
    : outcome === 'away' 
      ? event.away_team 
      : 'Draw';

  for (const bookmaker of event.bookmakers) {
    const h2h = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2h) continue;

    const targetOutcome = h2h.outcomes.find(o => o.name === targetName);
    if (targetOutcome && (!best || targetOutcome.price > best.odds)) {
      best = { bookmaker: bookmaker.title, odds: targetOutcome.price };
    }
  }

  return best;
}

/**
 * Lista popularnih evropskih bookmakera za region "eu"
 */
export const EU_BOOKMAKERS = [
  'betfair_ex_eu',
  'pinnacle',
  'sport888',
  'betclic',
  'betsson',
  'unibet_eu',
  'nordicbet',
  'betway',
  'marathonbet',
  '1xbet',
];

/**
 * Mapiranje sport key-eva na user-friendly nazive
 */
export const POPULAR_SPORTS: Record<string, string> = {
  // Soccer/Football
  'soccer_epl': 'Premier League (England)',
  'soccer_spain_la_liga': 'La Liga (Spain)',
  'soccer_germany_bundesliga': 'Bundesliga (Germany)',
  'soccer_italy_serie_a': 'Serie A (Italy)',
  'soccer_france_ligue_one': 'Ligue 1 (France)',
  'soccer_uefa_champs_league': 'UEFA Champions League',
  'soccer_uefa_europa_league': 'UEFA Europa League',
  
  // Basketball
  'basketball_nba': 'NBA',
  'basketball_euroleague': 'EuroLeague',
  
  // Tennis
  'tennis_atp_aus_open': 'ATP Australian Open',
  'tennis_atp_french_open': 'ATP French Open',
  'tennis_atp_wimbledon': 'ATP Wimbledon',
  'tennis_atp_us_open': 'ATP US Open',
  
  // Ice Hockey
  'icehockey_nhl': 'NHL',
  
  // American Football
  'americanfootball_nfl': 'NFL',
  'americanfootball_ncaaf': 'NCAA Football',
  
  // MMA
  'mma_mixed_martial_arts': 'UFC/MMA',
};
