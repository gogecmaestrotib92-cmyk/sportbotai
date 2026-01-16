/**
 * Team Alias Mapping
 * 
 * Normalizes team name variations for better fuzzy matching
 * when fetching match results from sports APIs.
 */

// NBA team aliases
const NBA_ALIASES: Record<string, string> = {
    // Short names to full names
    '76ers': 'Philadelphia 76ers',
    'sixers': 'Philadelphia 76ers',
    'lakers': 'Los Angeles Lakers',
    'la lakers': 'Los Angeles Lakers',
    'clippers': 'Los Angeles Clippers',
    'la clippers': 'Los Angeles Clippers',
    'celtics': 'Boston Celtics',
    'nets': 'Brooklyn Nets',
    'knicks': 'New York Knicks',
    'warriors': 'Golden State Warriors',
    'gsw': 'Golden State Warriors',
    'bulls': 'Chicago Bulls',
    'heat': 'Miami Heat',
    'nuggets': 'Denver Nuggets',
    'suns': 'Phoenix Suns',
    'bucks': 'Milwaukee Bucks',
    'mavs': 'Dallas Mavericks',
    'mavericks': 'Dallas Mavericks',
    'rockets': 'Houston Rockets',
    'spurs': 'San Antonio Spurs',
    'jazz': 'Utah Jazz',
    'thunder': 'Oklahoma City Thunder',
    'okc': 'Oklahoma City Thunder',
    'grizzlies': 'Memphis Grizzlies',
    'pelicans': 'New Orleans Pelicans',
    'timberwolves': 'Minnesota Timberwolves',
    'wolves': 'Minnesota Timberwolves',
    'blazers': 'Portland Trail Blazers',
    'trail blazers': 'Portland Trail Blazers',
    'kings': 'Sacramento Kings',
    'magic': 'Orlando Magic',
    'hawks': 'Atlanta Hawks',
    'hornets': 'Charlotte Hornets',
    'pistons': 'Detroit Pistons',
    'pacers': 'Indiana Pacers',
    'cavaliers': 'Cleveland Cavaliers',
    'cavs': 'Cleveland Cavaliers',
    'raptors': 'Toronto Raptors',
    'wizards': 'Washington Wizards',
};

// NFL team aliases
const NFL_ALIASES: Record<string, string> = {
    'chiefs': 'Kansas City Chiefs',
    'bills': 'Buffalo Bills',
    'ravens': 'Baltimore Ravens',
    'bengals': 'Cincinnati Bengals',
    'dolphins': 'Miami Dolphins',
    'patriots': 'New England Patriots',
    'pats': 'New England Patriots',
    'jets': 'New York Jets',
    'ny jets': 'New York Jets',
    'steelers': 'Pittsburgh Steelers',
    'browns': 'Cleveland Browns',
    'titans': 'Tennessee Titans',
    'colts': 'Indianapolis Colts',
    'jaguars': 'Jacksonville Jaguars',
    'jags': 'Jacksonville Jaguars',
    'texans': 'Houston Texans',
    'broncos': 'Denver Broncos',
    'raiders': 'Las Vegas Raiders',
    'lv raiders': 'Las Vegas Raiders',
    'chargers': 'Los Angeles Chargers',
    'la chargers': 'Los Angeles Chargers',
    'eagles': 'Philadelphia Eagles',
    'cowboys': 'Dallas Cowboys',
    'giants': 'New York Giants',
    'ny giants': 'New York Giants',
    'commanders': 'Washington Commanders',
    'lions': 'Detroit Lions',
    'packers': 'Green Bay Packers',
    'vikings': 'Minnesota Vikings',
    'bears': 'Chicago Bears',
    'buccaneers': 'Tampa Bay Buccaneers',
    'bucs': 'Tampa Bay Buccaneers',
    'saints': 'New Orleans Saints',
    'falcons': 'Atlanta Falcons',
    'panthers': 'Carolina Panthers',
    'seahawks': 'Seattle Seahawks',
    '49ers': 'San Francisco 49ers',
    'niners': 'San Francisco 49ers',
    'cardinals': 'Arizona Cardinals',
    'rams': 'Los Angeles Rams',
    'la rams': 'Los Angeles Rams',
};

// NHL team aliases
const NHL_ALIASES: Record<string, string> = {
    'bruins': 'Boston Bruins',
    'rangers': 'New York Rangers',
    'ny rangers': 'New York Rangers',
    'penguins': 'Pittsburgh Penguins',
    'pens': 'Pittsburgh Penguins',
    'capitals': 'Washington Capitals',
    'caps': 'Washington Capitals',
    'flyers': 'Philadelphia Flyers',
    'devils': 'New Jersey Devils',
    'islanders': 'New York Islanders',
    'isles': 'New York Islanders',
    'canadiens': 'Montreal Canadiens',
    'habs': 'Montreal Canadiens',
    'senators': 'Ottawa Senators',
    'sens': 'Ottawa Senators',
    'maple leafs': 'Toronto Maple Leafs',
    'leafs': 'Toronto Maple Leafs',
    'lightning': 'Tampa Bay Lightning',
    'bolts': 'Tampa Bay Lightning',
    'panthers': 'Florida Panthers',
    'cats': 'Florida Panthers',
    'hurricanes': 'Carolina Hurricanes',
    'canes': 'Carolina Hurricanes',
    'predators': 'Nashville Predators',
    'preds': 'Nashville Predators',
    'blue jackets': 'Columbus Blue Jackets',
    'cbj': 'Columbus Blue Jackets',
    'red wings': 'Detroit Red Wings',
    'wings': 'Detroit Red Wings',
    'blackhawks': 'Chicago Blackhawks',
    'hawks': 'Chicago Blackhawks',
    'wild': 'Minnesota Wild',
    'blues': 'St. Louis Blues',
    'jets': 'Winnipeg Jets',
    'avalanche': 'Colorado Avalanche',
    'avs': 'Colorado Avalanche',
    'stars': 'Dallas Stars',
    'coyotes': 'Arizona Coyotes',
    'yotes': 'Arizona Coyotes',
    'ducks': 'Anaheim Ducks',
    'kings': 'Los Angeles Kings',
    'la kings': 'Los Angeles Kings',
    'sharks': 'San Jose Sharks',
    'kraken': 'Seattle Kraken',
    'golden knights': 'Vegas Golden Knights',
    'vgk': 'Vegas Golden Knights',
    'knights': 'Vegas Golden Knights',
    'flames': 'Calgary Flames',
    'oilers': 'Edmonton Oilers',
    'canucks': 'Vancouver Canucks',
};

// Get alias map by sport
function getAliasMap(sport: string): Record<string, string> {
    const sportLower = sport.toLowerCase();
    if (sportLower.includes('nba') || sportLower.includes('basketball')) {
        return NBA_ALIASES;
    }
    if (sportLower.includes('nfl') || sportLower.includes('americanfootball')) {
        return NFL_ALIASES;
    }
    if (sportLower.includes('nhl') || sportLower.includes('hockey')) {
        return NHL_ALIASES;
    }
    return {};
}

/**
 * Normalize a team name using sport-specific aliases
 * Returns the canonical full team name if an alias is found
 */
export function normalizeTeamName(name: string, sport: string): string {
    const nameLower = name.toLowerCase().trim();
    const aliases = getAliasMap(sport);

    // Check for exact alias match
    if (aliases[nameLower]) {
        return aliases[nameLower];
    }

    // Check if any alias is contained in the name
    for (const [alias, fullName] of Object.entries(aliases)) {
        if (nameLower.includes(alias) && alias.length >= 4) {
            return fullName;
        }
    }

    // Return original name if no alias found
    return name;
}

/**
 * Check if two team names match (with alias normalization)
 */
export function teamsMatch(name1: string, name2: string, sport: string): boolean {
    const n1 = normalizeTeamName(name1, sport).toLowerCase();
    const n2 = normalizeTeamName(name2, sport).toLowerCase();

    // Exact match after normalization
    if (n1 === n2) return true;

    // Fuzzy: one contains the other
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // City match: extract city and compare
    const city1 = n1.split(' ')[0];
    const city2 = n2.split(' ')[0];
    if (city1.length >= 4 && city2.length >= 4 && city1 === city2) return true;

    return false;
}

/**
 * Extract the key identifying part of a team name for matching
 * Useful for API response comparison
 */
export function getTeamMatchKey(name: string, sport: string): string {
    const normalized = normalizeTeamName(name, sport).toLowerCase();
    // Take the last word (usually the team mascot/name)
    const parts = normalized.split(' ');
    return parts[parts.length - 1];
}
