/**
 * Team Name Resolver
 * 
 * Centralized team name resolution with:
 * - Hardcoded mappings (The Odds API → API-Sports)
 * - Fuzzy matching with Levenshtein distance
 * - Caching of successful lookups
 * 
 * This solves the problem where team names from different sources don't match.
 */

// ============================================================================
// LEVENSHTEIN DISTANCE FOR FUZZY MATCHING
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-100)
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  return Math.round((1 - distance / maxLen) * 100);
}

// ============================================================================
// TEAM NAME MAPPINGS (The Odds API → API-Sports format)
// ============================================================================

/**
 * NBA Team Mappings
 * Keys: Various ways teams appear in The Odds API
 * Values: How API-Sports expects them
 */
const NBA_MAPPINGS: Record<string, string> = {
  // Full city + name (The Odds API format)
  'atlanta hawks': 'Atlanta Hawks',
  'boston celtics': 'Boston Celtics',
  'brooklyn nets': 'Brooklyn Nets',
  'charlotte hornets': 'Charlotte Hornets',
  'chicago bulls': 'Chicago Bulls',
  'cleveland cavaliers': 'Cleveland Cavaliers',
  'dallas mavericks': 'Dallas Mavericks',
  'denver nuggets': 'Denver Nuggets',
  'detroit pistons': 'Detroit Pistons',
  'golden state warriors': 'Golden State Warriors',
  'houston rockets': 'Houston Rockets',
  'indiana pacers': 'Indiana Pacers',
  'los angeles clippers': 'Los Angeles Clippers',
  'la clippers': 'Los Angeles Clippers',
  'los angeles lakers': 'Los Angeles Lakers',
  'la lakers': 'Los Angeles Lakers',
  'memphis grizzlies': 'Memphis Grizzlies',
  'miami heat': 'Miami Heat',
  'milwaukee bucks': 'Milwaukee Bucks',
  'minnesota timberwolves': 'Minnesota Timberwolves',
  'new orleans pelicans': 'New Orleans Pelicans',
  'new york knicks': 'New York Knicks',
  'oklahoma city thunder': 'Oklahoma City Thunder',
  'orlando magic': 'Orlando Magic',
  'philadelphia 76ers': 'Philadelphia 76ers',
  'phoenix suns': 'Phoenix Suns',
  'portland trail blazers': 'Portland Trail Blazers',
  'sacramento kings': 'Sacramento Kings',
  'san antonio spurs': 'San Antonio Spurs',
  'toronto raptors': 'Toronto Raptors',
  'utah jazz': 'Utah Jazz',
  'washington wizards': 'Washington Wizards',
  
  // Short names
  'hawks': 'Atlanta Hawks',
  'celtics': 'Boston Celtics',
  'nets': 'Brooklyn Nets',
  'hornets': 'Charlotte Hornets',
  'bulls': 'Chicago Bulls',
  'cavaliers': 'Cleveland Cavaliers',
  'cavs': 'Cleveland Cavaliers',
  'mavericks': 'Dallas Mavericks',
  'mavs': 'Dallas Mavericks',
  'nuggets': 'Denver Nuggets',
  'pistons': 'Detroit Pistons',
  'warriors': 'Golden State Warriors',
  'rockets': 'Houston Rockets',
  'pacers': 'Indiana Pacers',
  'clippers': 'Los Angeles Clippers',
  'lakers': 'Los Angeles Lakers',
  'grizzlies': 'Memphis Grizzlies',
  'heat': 'Miami Heat',
  'bucks': 'Milwaukee Bucks',
  'timberwolves': 'Minnesota Timberwolves',
  'wolves': 'Minnesota Timberwolves',
  'pelicans': 'New Orleans Pelicans',
  'knicks': 'New York Knicks',
  'thunder': 'Oklahoma City Thunder',
  'okc thunder': 'Oklahoma City Thunder',
  'magic': 'Orlando Magic',
  '76ers': 'Philadelphia 76ers',
  'sixers': 'Philadelphia 76ers',
  'suns': 'Phoenix Suns',
  'trail blazers': 'Portland Trail Blazers',
  'blazers': 'Portland Trail Blazers',
  'kings': 'Sacramento Kings',
  'spurs': 'San Antonio Spurs',
  'raptors': 'Toronto Raptors',
  'jazz': 'Utah Jazz',
  'wizards': 'Washington Wizards',
};

/**
 * NHL Team Mappings
 */
const NHL_MAPPINGS: Record<string, string> = {
  // Full names
  'anaheim ducks': 'Anaheim Ducks',
  'arizona coyotes': 'Arizona Coyotes',
  'boston bruins': 'Boston Bruins',
  'buffalo sabres': 'Buffalo Sabres',
  'calgary flames': 'Calgary Flames',
  'carolina hurricanes': 'Carolina Hurricanes',
  'chicago blackhawks': 'Chicago Blackhawks',
  'colorado avalanche': 'Colorado Avalanche',
  'columbus blue jackets': 'Columbus Blue Jackets',
  'dallas stars': 'Dallas Stars',
  'detroit red wings': 'Detroit Red Wings',
  'edmonton oilers': 'Edmonton Oilers',
  'florida panthers': 'Florida Panthers',
  'los angeles kings': 'Los Angeles Kings',
  'la kings': 'Los Angeles Kings',
  'minnesota wild': 'Minnesota Wild',
  'montreal canadiens': 'Montreal Canadiens',
  'nashville predators': 'Nashville Predators',
  'new jersey devils': 'New Jersey Devils',
  'new york islanders': 'New York Islanders',
  'ny islanders': 'New York Islanders',
  'new york rangers': 'New York Rangers',
  'ny rangers': 'New York Rangers',
  'ottawa senators': 'Ottawa Senators',
  'philadelphia flyers': 'Philadelphia Flyers',
  'pittsburgh penguins': 'Pittsburgh Penguins',
  'san jose sharks': 'San Jose Sharks',
  'seattle kraken': 'Seattle Kraken',
  'st. louis blues': 'St. Louis Blues',
  'st louis blues': 'St. Louis Blues',
  'tampa bay lightning': 'Tampa Bay Lightning',
  'toronto maple leafs': 'Toronto Maple Leafs',
  'utah hockey club': 'Utah Hockey Club',
  'vancouver canucks': 'Vancouver Canucks',
  'vegas golden knights': 'Vegas Golden Knights',
  'washington capitals': 'Washington Capitals',
  'winnipeg jets': 'Winnipeg Jets',
  
  // Short names
  'ducks': 'Anaheim Ducks',
  'coyotes': 'Arizona Coyotes',
  'bruins': 'Boston Bruins',
  'sabres': 'Buffalo Sabres',
  'flames': 'Calgary Flames',
  'hurricanes': 'Carolina Hurricanes',
  'canes': 'Carolina Hurricanes',
  'blackhawks': 'Chicago Blackhawks',
  'hawks': 'Chicago Blackhawks',
  'avalanche': 'Colorado Avalanche',
  'avs': 'Colorado Avalanche',
  'blue jackets': 'Columbus Blue Jackets',
  'jackets': 'Columbus Blue Jackets',
  'stars': 'Dallas Stars',
  'red wings': 'Detroit Red Wings',
  'wings': 'Detroit Red Wings',
  'oilers': 'Edmonton Oilers',
  'panthers': 'Florida Panthers',
  'kings': 'Los Angeles Kings',
  'wild': 'Minnesota Wild',
  'canadiens': 'Montreal Canadiens',
  'habs': 'Montreal Canadiens',
  'predators': 'Nashville Predators',
  'preds': 'Nashville Predators',
  'devils': 'New Jersey Devils',
  'islanders': 'New York Islanders',
  'rangers': 'New York Rangers',
  'senators': 'Ottawa Senators',
  'sens': 'Ottawa Senators',
  'flyers': 'Philadelphia Flyers',
  'penguins': 'Pittsburgh Penguins',
  'pens': 'Pittsburgh Penguins',
  'sharks': 'San Jose Sharks',
  'kraken': 'Seattle Kraken',
  'blues': 'St. Louis Blues',
  'lightning': 'Tampa Bay Lightning',
  'bolts': 'Tampa Bay Lightning',
  'maple leafs': 'Toronto Maple Leafs',
  'leafs': 'Toronto Maple Leafs',
  'canucks': 'Vancouver Canucks',
  'golden knights': 'Vegas Golden Knights',
  'knights': 'Vegas Golden Knights',
  'capitals': 'Washington Capitals',
  'caps': 'Washington Capitals',
  'jets': 'Winnipeg Jets',
};

/**
 * NFL Team Mappings
 */
const NFL_MAPPINGS: Record<string, string> = {
  // Full names
  'arizona cardinals': 'Arizona Cardinals',
  'atlanta falcons': 'Atlanta Falcons',
  'baltimore ravens': 'Baltimore Ravens',
  'buffalo bills': 'Buffalo Bills',
  'carolina panthers': 'Carolina Panthers',
  'chicago bears': 'Chicago Bears',
  'cincinnati bengals': 'Cincinnati Bengals',
  'cleveland browns': 'Cleveland Browns',
  'dallas cowboys': 'Dallas Cowboys',
  'denver broncos': 'Denver Broncos',
  'detroit lions': 'Detroit Lions',
  'green bay packers': 'Green Bay Packers',
  'houston texans': 'Houston Texans',
  'indianapolis colts': 'Indianapolis Colts',
  'jacksonville jaguars': 'Jacksonville Jaguars',
  'kansas city chiefs': 'Kansas City Chiefs',
  'las vegas raiders': 'Las Vegas Raiders',
  'los angeles chargers': 'Los Angeles Chargers',
  'la chargers': 'Los Angeles Chargers',
  'los angeles rams': 'Los Angeles Rams',
  'la rams': 'Los Angeles Rams',
  'miami dolphins': 'Miami Dolphins',
  'minnesota vikings': 'Minnesota Vikings',
  'new england patriots': 'New England Patriots',
  'new orleans saints': 'New Orleans Saints',
  'new york giants': 'New York Giants',
  'ny giants': 'New York Giants',
  'new york jets': 'New York Jets',
  'ny jets': 'New York Jets',
  'philadelphia eagles': 'Philadelphia Eagles',
  'pittsburgh steelers': 'Pittsburgh Steelers',
  'san francisco 49ers': 'San Francisco 49ers',
  'seattle seahawks': 'Seattle Seahawks',
  'tampa bay buccaneers': 'Tampa Bay Buccaneers',
  'tennessee titans': 'Tennessee Titans',
  'washington commanders': 'Washington Commanders',
  
  // Short names
  'cardinals': 'Arizona Cardinals',
  'falcons': 'Atlanta Falcons',
  'ravens': 'Baltimore Ravens',
  'bills': 'Buffalo Bills',
  'panthers': 'Carolina Panthers',
  'bears': 'Chicago Bears',
  'bengals': 'Cincinnati Bengals',
  'browns': 'Cleveland Browns',
  'cowboys': 'Dallas Cowboys',
  'broncos': 'Denver Broncos',
  'lions': 'Detroit Lions',
  'packers': 'Green Bay Packers',
  'texans': 'Houston Texans',
  'colts': 'Indianapolis Colts',
  'jaguars': 'Jacksonville Jaguars',
  'jags': 'Jacksonville Jaguars',
  'chiefs': 'Kansas City Chiefs',
  'raiders': 'Las Vegas Raiders',
  'chargers': 'Los Angeles Chargers',
  'rams': 'Los Angeles Rams',
  'dolphins': 'Miami Dolphins',
  'vikings': 'Minnesota Vikings',
  'patriots': 'New England Patriots',
  'pats': 'New England Patriots',
  'saints': 'New Orleans Saints',
  'giants': 'New York Giants',
  'jets': 'New York Jets',
  'eagles': 'Philadelphia Eagles',
  'steelers': 'Pittsburgh Steelers',
  '49ers': 'San Francisco 49ers',
  'niners': 'San Francisco 49ers',
  'seahawks': 'Seattle Seahawks',
  'buccaneers': 'Tampa Bay Buccaneers',
  'bucs': 'Tampa Bay Buccaneers',
  'titans': 'Tennessee Titans',
  'commanders': 'Washington Commanders',
  'commies': 'Washington Commanders',
};

/**
 * Soccer/Football Team Mappings (Major Leagues)
 */
const SOCCER_MAPPINGS: Record<string, string> = {
  // Premier League
  'arsenal': 'Arsenal',
  'arsenal fc': 'Arsenal',
  'aston villa': 'Aston Villa',
  'afc bournemouth': 'Bournemouth',
  'bournemouth': 'Bournemouth',
  'brentford': 'Brentford',
  'brentford fc': 'Brentford',
  'brighton': 'Brighton',
  'brighton and hove albion': 'Brighton',
  'brighton & hove albion': 'Brighton',
  'chelsea': 'Chelsea',
  'chelsea fc': 'Chelsea',
  'crystal palace': 'Crystal Palace',
  'everton': 'Everton',
  'everton fc': 'Everton',
  'fulham': 'Fulham',
  'fulham fc': 'Fulham',
  'ipswich': 'Ipswich',
  'ipswich town': 'Ipswich',
  'leicester': 'Leicester',
  'leicester city': 'Leicester',
  'liverpool': 'Liverpool',
  'liverpool fc': 'Liverpool',
  'man city': 'Manchester City',
  'manchester city': 'Manchester City',
  'man utd': 'Manchester United',
  'man united': 'Manchester United',
  'manchester united': 'Manchester United',
  'manchester utd': 'Manchester United',
  'newcastle': 'Newcastle',
  'newcastle united': 'Newcastle',
  'nottingham forest': 'Nottingham Forest',
  "nott'm forest": 'Nottingham Forest',
  'southampton': 'Southampton',
  'southampton fc': 'Southampton',
  'tottenham': 'Tottenham',
  'tottenham hotspur': 'Tottenham',
  'spurs': 'Tottenham',
  'west ham': 'West Ham',
  'west ham united': 'West Ham',
  'wolves': 'Wolves',
  'wolverhampton': 'Wolves',
  'wolverhampton wanderers': 'Wolves',
  
  // La Liga
  'athletic bilbao': 'Athletic Club',
  'athletic club': 'Athletic Club',
  'atletico madrid': 'Atletico Madrid',
  'atlético madrid': 'Atletico Madrid',
  'barcelona': 'Barcelona',
  'fc barcelona': 'Barcelona',
  'real betis': 'Real Betis',
  'betis': 'Real Betis',
  'celta vigo': 'Celta Vigo',
  'getafe': 'Getafe',
  'getafe cf': 'Getafe',
  'girona': 'Girona',
  'girona fc': 'Girona',
  'las palmas': 'Las Palmas',
  'ud las palmas': 'Las Palmas',
  'leganes': 'Leganes',
  'cd leganes': 'Leganes',
  'mallorca': 'Mallorca',
  'rcd mallorca': 'Mallorca',
  'osasuna': 'Osasuna',
  'ca osasuna': 'Osasuna',
  'rayo vallecano': 'Rayo Vallecano',
  'real madrid': 'Real Madrid',
  'real sociedad': 'Real Sociedad',
  'sevilla': 'Sevilla',
  'sevilla fc': 'Sevilla',
  'valencia': 'Valencia',
  'valencia cf': 'Valencia',
  'valladolid': 'Valladolid',
  'real valladolid': 'Valladolid',
  'villarreal': 'Villarreal',
  'villarreal cf': 'Villarreal',
  'espanyol': 'Espanyol',
  'rcd espanyol': 'Espanyol',
  'alaves': 'Alaves',
  'deportivo alaves': 'Alaves',
  
  // Serie A
  'ac milan': 'AC Milan',
  'milan': 'AC Milan',
  'atalanta': 'Atalanta',
  'bologna': 'Bologna',
  'bologna fc': 'Bologna',
  'cagliari': 'Cagliari',
  'como': 'Como',
  'como 1907': 'Como',
  'empoli': 'Empoli',
  'fiorentina': 'Fiorentina',
  'acf fiorentina': 'Fiorentina',
  'genoa': 'Genoa',
  'genoa cfc': 'Genoa',
  'hellas verona': 'Hellas Verona',
  'verona': 'Hellas Verona',
  'inter': 'Inter Milan',
  'inter milan': 'Inter Milan',
  'internazionale': 'Inter Milan',
  'juventus': 'Juventus',
  'juve': 'Juventus',
  'lazio': 'Lazio',
  'ss lazio': 'Lazio',
  'lecce': 'Lecce',
  'us lecce': 'Lecce',
  'monza': 'Monza',
  'ac monza': 'Monza',
  'napoli': 'Napoli',
  'ssc napoli': 'Napoli',
  'parma': 'Parma',
  'parma calcio': 'Parma',
  'roma': 'AS Roma',
  'as roma': 'AS Roma',
  'torino': 'Torino',
  'torino fc': 'Torino',
  'udinese': 'Udinese',
  'venezia': 'Venezia',
  'venezia fc': 'Venezia',
  
  // Bundesliga
  'bayern': 'Bayern Munich',
  'bayern munich': 'Bayern Munich',
  'fc bayern munich': 'Bayern Munich',
  'bayern munchen': 'Bayern Munich',
  'bayer leverkusen': 'Bayer Leverkusen',
  'leverkusen': 'Bayer Leverkusen',
  'borussia dortmund': 'Borussia Dortmund',
  'dortmund': 'Borussia Dortmund',
  'bvb': 'Borussia Dortmund',
  'rb leipzig': 'RB Leipzig',
  'leipzig': 'RB Leipzig',
  'eintracht frankfurt': 'Eintracht Frankfurt',
  'frankfurt': 'Eintracht Frankfurt',
  'vfb stuttgart': 'VfB Stuttgart',
  'stuttgart': 'VfB Stuttgart',
  'werder bremen': 'Werder Bremen',
  'bremen': 'Werder Bremen',
  'hoffenheim': 'Hoffenheim',
  'tsg hoffenheim': 'Hoffenheim',
  'union berlin': 'Union Berlin',
  'fc union berlin': 'Union Berlin',
  'sc freiburg': 'SC Freiburg',
  'freiburg': 'SC Freiburg',
  'borussia monchengladbach': 'Borussia Monchengladbach',
  'gladbach': 'Borussia Monchengladbach',
  'monchengladbach': 'Borussia Monchengladbach',
  'wolfsburg': 'Wolfsburg',
  'vfl wolfsburg': 'Wolfsburg',
  'mainz': 'Mainz 05',
  'mainz 05': 'Mainz 05',
  'augsburg': 'Augsburg',
  'fc augsburg': 'Augsburg',
  'heidenheim': 'Heidenheim',
  'fc heidenheim': 'Heidenheim',
  'bochum': 'Bochum',
  'vfl bochum': 'Bochum',
  'st pauli': 'St. Pauli',
  'fc st pauli': 'St. Pauli',
  'holstein kiel': 'Holstein Kiel',
  'kiel': 'Holstein Kiel',
  
  // Ligue 1
  'paris saint-germain': 'Paris Saint Germain',
  'paris saint germain': 'Paris Saint Germain',
  'psg': 'Paris Saint Germain',
  'marseille': 'Marseille',
  'olympique marseille': 'Marseille',
  'om': 'Marseille',
  'lyon': 'Lyon',
  'olympique lyon': 'Lyon',
  'olympique lyonnais': 'Lyon',
  'monaco': 'Monaco',
  'as monaco': 'Monaco',
  'lille': 'Lille',
  'losc lille': 'Lille',
  'nice': 'Nice',
  'ogc nice': 'Nice',
  'lens': 'Lens',
  'rc lens': 'Lens',
  'rennes': 'Rennes',
  'stade rennais': 'Rennes',
  'brest': 'Brest',
  'stade brestois': 'Brest',
  'reims': 'Reims',
  'stade de reims': 'Reims',
  'toulouse': 'Toulouse',
  'toulouse fc': 'Toulouse',
  'strasbourg': 'Strasbourg',
  'rc strasbourg': 'Strasbourg',
  'montpellier': 'Montpellier',
  'montpellier hsc': 'Montpellier',
  'nantes': 'Nantes',
  'fc nantes': 'Nantes',
  'auxerre': 'Auxerre',
  'aj auxerre': 'Auxerre',
  'angers': 'Angers',
  'angers sco': 'Angers',
  'le havre': 'Le Havre',
  'le havre ac': 'Le Havre',
  'saint-etienne': 'Saint-Etienne',
  'saint etienne': 'Saint-Etienne',
  'as saint-etienne': 'Saint-Etienne',
};

// ============================================================================
// TEAM RESOLVER CLASS
// ============================================================================

type Sport = 'soccer' | 'basketball' | 'hockey' | 'american_football';

/**
 * Cache for successful team lookups
 * Key: `${sport}:${normalizedName}` → Value: resolved name
 */
const resolvedCache = new Map<string, string>();

/**
 * All teams for each sport (for fuzzy matching)
 */
const ALL_TEAMS: Record<Sport, string[]> = {
  basketball: Object.values(NBA_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
  hockey: Object.values(NHL_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
  american_football: Object.values(NFL_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
  soccer: Object.values(SOCCER_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
};

/**
 * Get the mapping table for a sport
 */
function getMappings(sport: Sport): Record<string, string> {
  switch (sport) {
    case 'basketball': return NBA_MAPPINGS;
    case 'hockey': return NHL_MAPPINGS;
    case 'american_football': return NFL_MAPPINGS;
    case 'soccer': return SOCCER_MAPPINGS;
    default: return {};
  }
}

/**
 * Resolve a team name to the API-Sports format
 * 
 * @param teamName - The team name to resolve (from any source)
 * @param sport - The sport
 * @returns The resolved team name, or the original if no match found
 */
export function resolveTeamName(teamName: string, sport: Sport): string {
  const cacheKey = `${sport}:${teamName.toLowerCase()}`;
  
  // Check cache first
  if (resolvedCache.has(cacheKey)) {
    return resolvedCache.get(cacheKey)!;
  }
  
  const normalized = teamName.toLowerCase().trim();
  const mappings = getMappings(sport);
  
  // 1. Try exact mapping lookup
  if (mappings[normalized]) {
    const resolved = mappings[normalized];
    resolvedCache.set(cacheKey, resolved);
    console.log(`[TeamResolver] Exact match: "${teamName}" → "${resolved}"`);
    return resolved;
  }
  
  // 2. Try partial match in mappings
  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      resolvedCache.set(cacheKey, value);
      console.log(`[TeamResolver] Partial match: "${teamName}" → "${value}" (via ${key})`);
      return value;
    }
  }
  
  // 3. Try fuzzy matching against all known teams
  const allTeams = ALL_TEAMS[sport] || [];
  let bestMatch = '';
  let bestScore = 0;
  
  for (const team of allTeams) {
    const score = similarity(normalized, team.toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      bestMatch = team;
    }
  }
  
  // Accept fuzzy match if similarity >= 70%
  if (bestScore >= 70 && bestMatch) {
    resolvedCache.set(cacheKey, bestMatch);
    console.log(`[TeamResolver] Fuzzy match: "${teamName}" → "${bestMatch}" (${bestScore}% similar)`);
    return bestMatch;
  }
  
  // 4. No match - return original (cleaned up)
  const cleaned = teamName.trim();
  console.log(`[TeamResolver] No match found for "${teamName}" in ${sport}, using original`);
  resolvedCache.set(cacheKey, cleaned);
  return cleaned;
}

/**
 * Get search variations for a team name
 * Returns multiple names to try when searching
 */
export function getSearchVariations(teamName: string, sport: Sport): string[] {
  const resolved = resolveTeamName(teamName, sport);
  const variations = new Set<string>();
  
  // Add resolved name
  variations.add(resolved);
  
  // Add original
  variations.add(teamName);
  
  // Add without common prefixes/suffixes
  const withoutFC = teamName.replace(/\s*(fc|cf|afc|sc)\s*/gi, ' ').trim();
  if (withoutFC !== teamName) variations.add(withoutFC);
  
  // Add just the main word (e.g., "Manchester United" → "United", "Manchester")
  const words = resolved.split(' ');
  if (words.length > 1) {
    variations.add(words[words.length - 1]); // Last word
    variations.add(words[0]); // First word
  }
  
  return Array.from(variations);
}

/**
 * Check if two team names likely refer to the same team
 */
export function isSameTeam(name1: string, name2: string, sport: Sport): boolean {
  const resolved1 = resolveTeamName(name1, sport);
  const resolved2 = resolveTeamName(name2, sport);
  
  if (resolved1.toLowerCase() === resolved2.toLowerCase()) {
    return true;
  }
  
  // Check similarity
  const sim = similarity(resolved1.toLowerCase(), resolved2.toLowerCase());
  return sim >= 80;
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  resolvedCache.clear();
}

/**
 * Get cache stats (for debugging)
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: resolvedCache.size,
    entries: Array.from(resolvedCache.keys()),
  };
}
