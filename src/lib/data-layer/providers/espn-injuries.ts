/**
 * ESPN Hidden API - Injury Provider
 * 
 * Uses ESPN's public (but unofficial) API to fetch NBA injury data.
 * No API key required - just fetch the JSON endpoint.
 */

import { NormalizedInjury } from '../types';

// ESPN API endpoints for injuries
const ESPN_INJURY_URLS = {
    nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries',
    nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/injuries',
    nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries',
} as const;

// ============================================================================
// TEAM NAME MAPPINGS
// ============================================================================
// Maps from The Odds API team names -> ESPN team names
// The Odds API uses full names ("Los Angeles Clippers")
// ESPN sometimes uses abbreviations ("LA Clippers")
// Also handles accent differences (Montréal vs Montreal)

// NBA: The Odds API -> ESPN display name mapping
const ODDS_TO_ESPN_NBA: Record<string, string> = {
    'los angeles clippers': 'la clippers',  // Key difference!
    'los angeles lakers': 'los angeles lakers',  // ESPN uses full name for Lakers
    // All other teams match exactly (Odds API = ESPN)
};

// NHL: The Odds API -> ESPN display name mapping  
const ODDS_TO_ESPN_NHL: Record<string, string> = {
    'montréal canadiens': 'montreal canadiens',  // Accent difference
    'montreal canadiens': 'montreal canadiens',
    'st louis blues': 'st. louis blues',  // Period difference
    'st. louis blues': 'st. louis blues',
    // Arizona Coyotes relocated to Utah - might need mapping
    'utah hockey club': 'utah mammoth',  // If Odds API uses different name
};

// NFL: Generally consistent naming, but adding for safety
const ODDS_TO_ESPN_NFL: Record<string, string> = {
    // Add any NFL mismatches here if found
};

// Unified lookup function
function normalizeTeamNameForESPN(teamName: string, sport: 'nba' | 'nhl' | 'nfl'): string {
    const normalized = teamName.toLowerCase().trim();
    
    // Check sport-specific mappings
    const sportMap = sport === 'nba' ? ODDS_TO_ESPN_NBA 
                   : sport === 'nhl' ? ODDS_TO_ESPN_NHL 
                   : ODDS_TO_ESPN_NFL;
    
    return sportMap[normalized] || normalized;
}

// Team name mappings from ESPN format to our normalized format (nicknames)
// Used for fuzzy matching when exact match fails
const ESPN_TO_NORMALIZED_TEAM: Record<string, string> = {
    // NBA
    'atlanta hawks': 'hawks',
    'boston celtics': 'celtics',
    'brooklyn nets': 'nets',
    'charlotte hornets': 'hornets',
    'chicago bulls': 'bulls',
    'cleveland cavaliers': 'cavaliers',
    'dallas mavericks': 'mavericks',
    'denver nuggets': 'nuggets',
    'detroit pistons': 'pistons',
    'golden state warriors': 'warriors',
    'houston rockets': 'rockets',
    'indiana pacers': 'pacers',
    'la clippers': 'clippers',
    'los angeles clippers': 'clippers',
    'la lakers': 'lakers',
    'los angeles lakers': 'lakers',
    'memphis grizzlies': 'grizzlies',
    'miami heat': 'heat',
    'milwaukee bucks': 'bucks',
    'minnesota timberwolves': 'timberwolves',
    'new orleans pelicans': 'pelicans',
    'new york knicks': 'knicks',
    'oklahoma city thunder': 'thunder',
    'orlando magic': 'magic',
    'philadelphia 76ers': '76ers',
    'phoenix suns': 'suns',
    'portland trail blazers': 'trail blazers',
    'sacramento kings': 'kings',
    'san antonio spurs': 'spurs',
    'toronto raptors': 'raptors',
    'utah jazz': 'jazz',
    'washington wizards': 'wizards',
    
    // NHL
    'anaheim ducks': 'ducks',
    'boston bruins': 'bruins',
    'buffalo sabres': 'sabres',
    'calgary flames': 'flames',
    'carolina hurricanes': 'hurricanes',
    'chicago blackhawks': 'blackhawks',
    'colorado avalanche': 'avalanche',
    'columbus blue jackets': 'blue jackets',
    'dallas stars': 'stars',
    'detroit red wings': 'red wings',
    'edmonton oilers': 'oilers',
    'florida panthers': 'panthers',
    'los angeles kings': 'kings',
    'minnesota wild': 'wild',
    'montreal canadiens': 'canadiens',
    'montréal canadiens': 'canadiens',
    'nashville predators': 'predators',
    'new jersey devils': 'devils',
    'new york islanders': 'islanders',
    'new york rangers': 'rangers',
    'ottawa senators': 'senators',
    'philadelphia flyers': 'flyers',
    'pittsburgh penguins': 'penguins',
    'san jose sharks': 'sharks',
    'seattle kraken': 'kraken',
    'st. louis blues': 'blues',
    'st louis blues': 'blues',
    'tampa bay lightning': 'lightning',
    'toronto maple leafs': 'maple leafs',
    'utah mammoth': 'mammoth',
    'utah hockey club': 'mammoth',
    'vancouver canucks': 'canucks',
    'vegas golden knights': 'golden knights',
    'washington capitals': 'capitals',
    'winnipeg jets': 'jets',
    
    // NFL
    'arizona cardinals': 'cardinals',
    'atlanta falcons': 'falcons',
    'baltimore ravens': 'ravens',
    'buffalo bills': 'bills',
    'carolina panthers': 'panthers',
    'chicago bears': 'bears',
    'cincinnati bengals': 'bengals',
    'cleveland browns': 'browns',
    'dallas cowboys': 'cowboys',
    'denver broncos': 'broncos',
    'detroit lions': 'lions',
    'green bay packers': 'packers',
    'houston texans': 'texans',
    'indianapolis colts': 'colts',
    'jacksonville jaguars': 'jaguars',
    'kansas city chiefs': 'chiefs',
    'las vegas raiders': 'raiders',
    'los angeles chargers': 'chargers',
    'los angeles rams': 'rams',
    'miami dolphins': 'dolphins',
    'minnesota vikings': 'vikings',
    'new england patriots': 'patriots',
    'new orleans saints': 'saints',
    'new york giants': 'giants',
    'new york jets': 'jets',
    'philadelphia eagles': 'eagles',
    'pittsburgh steelers': 'steelers',
    'san francisco 49ers': '49ers',
    'seattle seahawks': 'seahawks',
    'tampa bay buccaneers': 'buccaneers',
    'tennessee titans': 'titans',
    'washington commanders': 'commanders',
};

interface ESPNInjuryResponse {
    timestamp: string;
    status: string;
    season: {
        year: number;
        type: number;
        name: string;
    };
    injuries: ESPNTeamInjuries[];
}

interface ESPNTeamInjuries {
    id: string;
    displayName: string;
    injuries: ESPNInjury[];
}

interface ESPNInjury {
    id: string;
    longComment: string;
    shortComment: string;
    status: string;
    date: string;
    athlete: {
        firstName: string;
        lastName: string;
        displayName: string;
        shortName: string;
        position?: {
            abbreviation: string;
            displayName: string;
        };
        headshot?: {
            href: string;
        };
    };
    type: {
        id: string;
        name: string;
        description: string;
        abbreviation: string;
    };
    details?: {
        fantasyStatus?: {
            description: string;
            abbreviation: string;
        };
        type?: string;
        location?: string;
        detail?: string;
        side?: string;
        returnDate?: string;
    };
}

// Cache for injury data (TTL: 30 minutes)
let cachedInjuries: {
    nba: { data: ESPNInjuryResponse | null; timestamp: number };
    nhl: { data: ESPNInjuryResponse | null; timestamp: number };
    nfl: { data: ESPNInjuryResponse | null; timestamp: number };
} = {
    nba: { data: null, timestamp: 0 },
    nhl: { data: null, timestamp: 0 },
    nfl: { data: null, timestamp: 0 },
};

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch all NBA injuries from ESPN
 */
async function fetchESPNInjuries(sport: 'nba' | 'nhl' | 'nfl'): Promise<ESPNInjuryResponse | null> {
    const now = Date.now();
    const cached = cachedInjuries[sport];

    // Return cached data if still valid
    if (cached.data && (now - cached.timestamp) < CACHE_TTL) {
        console.log(`[ESPN Injuries] Using cached ${sport.toUpperCase()} injury data`);
        return cached.data;
    }

    try {
        console.log(`[ESPN Injuries] Fetching fresh ${sport.toUpperCase()} injury data from ESPN...`);
        const response = await fetch(ESPN_INJURY_URLS[sport], {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SportBotAI/1.0)',
            },
            // Cache for 5 minutes at HTTP level
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            console.error(`[ESPN Injuries] Failed to fetch ${sport}: ${response.status}`);
            return null;
        }

        const data: ESPNInjuryResponse = await response.json();

        // Update cache
        cachedInjuries[sport] = { data, timestamp: now };
        console.log(`[ESPN Injuries] Fetched ${data.injuries.length} teams with injury data`);

        return data;
    } catch (error) {
        console.error('[ESPN Injuries] Error fetching ESPN injuries:', error);
        return null;
    }
}

/**
 * Get injuries for a specific team
 */
export async function getESPNInjuriesForTeam(
    teamName: string,
    sport: 'nba' | 'nhl' | 'nfl' = 'nba'
): Promise<NormalizedInjury[]> {
    const data = await fetchESPNInjuries(sport);

    if (!data || !data.injuries) {
        return [];
    }

    // Step 1: Normalize the team name using sport-specific mapping
    // This handles "Los Angeles Clippers" -> "la clippers" for ESPN matching
    const normalizedQuery = normalizeTeamNameForESPN(teamName, sport);
    
    // Step 2: Extract nickname as fallback (last word)
    const queryNickname = normalizedQuery.split(' ').pop() || normalizedQuery;
    
    // Step 3: Also get nickname from original query for matching
    const originalNickname = teamName.toLowerCase().trim().split(' ').pop() || '';

    // Find matching team
    const teamData = data.injuries.find(team => {
        const teamNameLower = team.displayName.toLowerCase();
        const shortName = ESPN_TO_NORMALIZED_TEAM[teamNameLower] || teamNameLower;
        // Extract ESPN's team nickname
        const espnNickname = teamNameLower.split(' ').pop() || teamNameLower;

        return (
            // Direct match after normalization (handles LA Clippers)
            teamNameLower === normalizedQuery ||
            // Direct match with original query
            teamNameLower === teamName.toLowerCase().trim() ||
            // ESPN name contains our normalized query
            teamNameLower.includes(normalizedQuery) ||
            // Our query contains ESPN's short name
            normalizedQuery.includes(shortName) ||
            // Match by nickname (most reliable for "LA Clippers" vs "Los Angeles Clippers")
            espnNickname === queryNickname ||
            espnNickname === originalNickname ||
            // Our query contains ESPN's nickname
            normalizedQuery.includes(espnNickname)
        );
    });

    if (!teamData || !teamData.injuries) {
        console.log(`[ESPN Injuries] No injury data found for team: ${teamName} (searched with nickname: ${queryNickname})`);
        return [];
    }

    console.log(`[ESPN Injuries] Found ${teamData.injuries.length} injuries for ${teamData.displayName}`);

    // Transform to normalized format
    return teamData.injuries.map(injury => transformESPNInjury(injury, teamData.displayName));
}

/**
 * Get all injuries (for caching/admin purposes)
 */
export async function getAllESPNInjuries(
    sport: 'nba' | 'nhl' | 'nfl' = 'nba'
): Promise<Map<string, NormalizedInjury[]>> {
    const data = await fetchESPNInjuries(sport);
    const result = new Map<string, NormalizedInjury[]>();

    if (!data || !data.injuries) {
        return result;
    }

    for (const team of data.injuries) {
        const normalizedTeamName = ESPN_TO_NORMALIZED_TEAM[team.displayName.toLowerCase()] ||
            team.displayName.toLowerCase().split(' ').pop() || team.displayName;

        const injuries = team.injuries.map(injury =>
            transformESPNInjury(injury, team.displayName)
        );

        result.set(normalizedTeamName, injuries);
    }

    return result;
}

/**
 * Transform ESPN injury format to our normalized format
 */
function transformESPNInjury(
    injury: ESPNInjury,
    teamName: string,
    sport: 'basketball' | 'hockey' | 'american_football' = 'basketball'
): NormalizedInjury {
    return {
        playerId: injury.id || `espn_${injury.athlete.displayName.replace(/\s/g, '_')}`,
        playerName: injury.athlete.displayName,
        teamId: teamName.toLowerCase().replace(/\s/g, '_'),
        teamName: teamName,
        sport: sport,
        type: injury.details?.type || extractInjuryType(injury.shortComment),
        status: mapESPNStatus(injury.status),
        description: injury.shortComment,
        expectedReturn: injury.details?.returnDate ? new Date(injury.details.returnDate) : undefined,
        provider: 'manual' as const, // ESPN is unofficial
        fetchedAt: new Date(),
    };
}

/**
 * Map ESPN status to our normalized status
 */
function mapESPNStatus(espnStatus: string): 'out' | 'doubtful' | 'questionable' | 'probable' | 'day-to-day' {
    const status = espnStatus?.toLowerCase() || '';

    if (status === 'out') return 'out';
    if (status === 'doubtful') return 'doubtful';
    if (status === 'questionable') return 'questionable';
    if (status === 'probable') return 'probable';

    // Default to day-to-day for any other status
    return 'day-to-day';
}

/**
 * Extract injury type from description if not in details
 */
function extractInjuryType(description: string): string {
    const types = [
        'ACL', 'MCL', 'Achilles', 'hamstring', 'ankle', 'knee', 'groin',
        'concussion', 'shoulder', 'back', 'hip', 'calf', 'quad', 'foot',
        'wrist', 'elbow', 'finger', 'illness', 'rest', 'personal'
    ];

    const lowerDesc = description.toLowerCase();
    for (const type of types) {
        if (lowerDesc.includes(type.toLowerCase())) {
            return type;
        }
    }

    return 'Unspecified';
}



/**
 * Check if ESPN injury data is available
 */
export function isESPNInjuriesAvailable(): boolean {
    return true; // Always available - no API key needed
}

/**
 * Clear the injury cache (useful for testing/debugging)
 */
export function clearESPNInjuryCache(): void {
    cachedInjuries = {
        nba: { data: null, timestamp: 0 },
        nhl: { data: null, timestamp: 0 },
        nfl: { data: null, timestamp: 0 },
    };
    console.log('[ESPN Injuries] Cache cleared');
}

// ============================================
// ESPN HEAD-TO-HEAD (H2H) DATA
// ============================================

const ESPN_SCHEDULE_URLS = {
    nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
    nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
    nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
} as const;

interface ESPNH2HMatch {
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    venue?: string;
    winner: 'home' | 'away' | 'draw';
}

interface ESPNH2HResult {
    success: boolean;
    matches: ESPNH2HMatch[];
    summary: {
        totalMatches: number;
        team1Wins: number;
        team2Wins: number;
        draws: number;
    };
    error?: string;
}

// Cache for team ID lookups
const teamIdCache: Record<string, Record<string, string>> = {
    nba: {},
    nhl: {},
    nfl: {},
};

/**
 * Get ESPN team ID by searching team name
 */
async function getESPNTeamId(teamName: string, sport: 'nba' | 'nhl' | 'nfl'): Promise<string | null> {
    const cacheKey = teamName.toLowerCase();
    if (teamIdCache[sport][cacheKey]) {
        return teamIdCache[sport][cacheKey];
    }

    try {
        const url = ESPN_SCHEDULE_URLS[sport];
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];

        // Search for team by name (fuzzy match)
        const searchTerms = teamName.toLowerCase().split(/\s+/);
        for (const t of teams) {
            const team = t.team;
            const displayName = team.displayName?.toLowerCase() || '';
            const shortName = team.shortDisplayName?.toLowerCase() || '';
            const location = team.location?.toLowerCase() || '';
            const nickname = team.nickname?.toLowerCase() || '';

            // Check if any search term matches
            const matches = searchTerms.some(term =>
                displayName.includes(term) ||
                shortName.includes(term) ||
                location.includes(term) ||
                nickname.includes(term)
            );

            if (matches) {
                teamIdCache[sport][cacheKey] = team.id;
                return team.id;
            }
        }

        return null;
    } catch (error) {
        console.error(`[ESPN H2H] Failed to get team ID for ${teamName}:`, error);
        return null;
    }
}

/**
 * Get head-to-head history between two teams using ESPN API
 * Fetches multiple seasons to get comprehensive H2H data
 */
export async function getESPNH2H(
    team1Name: string,
    team2Name: string,
    sport: 'nba' | 'nhl' | 'nfl',
    seasons: number = 3 // How many seasons to look back
): Promise<ESPNH2HResult> {
    console.log(`[ESPN H2H] Fetching ${team1Name} vs ${team2Name} (${sport})`);

    try {
        // Get team IDs
        const [team1Id, team2Id] = await Promise.all([
            getESPNTeamId(team1Name, sport),
            getESPNTeamId(team2Name, sport),
        ]);

        if (!team1Id || !team2Id) {
            console.log(`[ESPN H2H] Could not find team IDs: ${team1Name}=${team1Id}, ${team2Name}=${team2Id}`);
            return {
                success: false,
                matches: [],
                summary: { totalMatches: 0, team1Wins: 0, team2Wins: 0, draws: 0 },
                error: `Could not find team: ${!team1Id ? team1Name : team2Name}`,
            };
        }

        console.log(`[ESPN H2H] Team IDs: ${team1Name}=${team1Id}, ${team2Name}=${team2Id}`);

        // Get current year and fetch multiple seasons
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // Determine current season based on sport calendars
        // ESPN uses the season START year (e.g., 2025-26 season = "2025" in ESPN)
        let startSeason: number;
        if (sport === 'nfl') {
            // NFL: Sept-Feb, uses start year. Jan 2026 = 2025 season
            startSeason = currentMonth <= 6 ? currentYear - 1 : currentYear;
        } else if (sport === 'nhl' || sport === 'nba') {
            // NHL/NBA: Oct-June, uses start year. Jan 2026 = 2025 season  
            startSeason = currentMonth <= 6 ? currentYear - 1 : currentYear;
        } else {
            startSeason = currentYear;
        }

        // Fetch schedules for multiple seasons in parallel
        const seasonYears = Array.from({ length: seasons }, (_, i) => startSeason - i);
        const schedulePromises = seasonYears.map(async (season) => {
            try {
                const url = `${ESPN_SCHEDULE_URLS[sport]}/${team1Id}/schedule?season=${season}`;
                const response = await fetch(url);
                if (!response.ok) return [];

                const data = await response.json();
                return data.events || [];
            } catch {
                return [];
            }
        });

        const allSeasonEvents = await Promise.all(schedulePromises);
        const allEvents = allSeasonEvents.flat();

        // Filter for games against team2 that are completed
        const h2hMatches: ESPNH2HMatch[] = [];

        for (const event of allEvents) {
            const competition = event.competitions?.[0];
            if (!competition) continue;

            const competitors = competition.competitors || [];
            const isVsTeam2 = competitors.some((c: any) => c.team?.id === team2Id);
            const isCompleted = competition.status?.type?.name === 'STATUS_FINAL';

            if (isVsTeam2 && isCompleted) {
                const homeComp = competitors.find((c: any) => c.homeAway === 'home');
                const awayComp = competitors.find((c: any) => c.homeAway === 'away');

                if (homeComp && awayComp) {
                    const homeScore = parseInt(homeComp.score?.displayValue || '0');
                    const awayScore = parseInt(awayComp.score?.displayValue || '0');

                    h2hMatches.push({
                        date: event.date,
                        homeTeam: homeComp.team?.displayName || 'Unknown',
                        awayTeam: awayComp.team?.displayName || 'Unknown',
                        homeScore,
                        awayScore,
                        venue: competition.venue?.fullName,
                        winner: homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw',
                    });
                }
            }
        }

        // Sort by date descending (most recent first)
        h2hMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate summary
        let team1Wins = 0, team2Wins = 0, draws = 0;
        for (const match of h2hMatches) {
            const team1IsHome = match.homeTeam.toLowerCase().includes(team1Name.toLowerCase().split(/\s+/)[0].toLowerCase());
            if (match.winner === 'draw') {
                draws++;
            } else if ((team1IsHome && match.winner === 'home') || (!team1IsHome && match.winner === 'away')) {
                team1Wins++;
            } else {
                team2Wins++;
            }
        }

        console.log(`[ESPN H2H] Found ${h2hMatches.length} matches: ${team1Wins}-${draws}-${team2Wins}`);

        return {
            success: true,
            matches: h2hMatches,
            summary: {
                totalMatches: h2hMatches.length,
                team1Wins,
                team2Wins,
                draws,
            },
        };
    } catch (error) {
        console.error(`[ESPN H2H] Error:`, error);
        return {
            success: false,
            matches: [],
            summary: { totalMatches: 0, team1Wins: 0, team2Wins: 0, draws: 0 },
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
