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

// Team name mappings from ESPN format to our normalized format
const ESPN_TO_NORMALIZED_TEAM: Record<string, string> = {
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
    'los angeles clippers': 'clippers',
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

    // Normalize the team name for matching
    const normalizedQuery = teamName.toLowerCase().trim();

    // Find matching team
    const teamData = data.injuries.find(team => {
        const teamNameLower = team.displayName.toLowerCase();
        const shortName = ESPN_TO_NORMALIZED_TEAM[teamNameLower] || teamNameLower;

        return (
            teamNameLower.includes(normalizedQuery) ||
            normalizedQuery.includes(shortName) ||
            normalizedQuery.includes(teamNameLower.split(' ').pop() || '') // Match just "Nuggets", "Lakers", etc.
        );
    });

    if (!teamData || !teamData.injuries) {
        console.log(`[ESPN Injuries] No injury data found for team: ${teamName}`);
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
