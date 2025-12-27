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
  'dubs': 'Golden State Warriors',
  'rockets': 'Houston Rockets',
  'pacers': 'Indiana Pacers',
  'clippers': 'Los Angeles Clippers',
  'lakers': 'Los Angeles Lakers',
  'grizzlies': 'Memphis Grizzlies',
  'grizz': 'Memphis Grizzlies',
  'heat': 'Miami Heat',
  'bucks': 'Milwaukee Bucks',
  'timberwolves': 'Minnesota Timberwolves',
  'wolves': 'Minnesota Timberwolves',
  't-wolves': 'Minnesota Timberwolves',
  'pelicans': 'New Orleans Pelicans',
  'pels': 'New Orleans Pelicans',
  'knicks': 'New York Knicks',
  'thunder': 'Oklahoma City Thunder',
  'okc': 'Oklahoma City Thunder',
  'okc thunder': 'Oklahoma City Thunder',
  'magic': 'Orlando Magic',
  '76ers': 'Philadelphia 76ers',
  'sixers': 'Philadelphia 76ers',
  'philly': 'Philadelphia 76ers',
  'suns': 'Phoenix Suns',
  'trail blazers': 'Portland Trail Blazers',
  'blazers': 'Portland Trail Blazers',
  'kings': 'Sacramento Kings',
  'spurs': 'San Antonio Spurs',
  'raptors': 'Toronto Raptors',
  'jazz': 'Utah Jazz',
  'wizards': 'Washington Wizards',
  'wiz': 'Washington Wizards',
};

/**
 * Euroleague Basketball Team Mappings
 */
const EUROLEAGUE_MAPPINGS: Record<string, string> = {
  // Turkish teams
  'fenerbahce': 'Fenerbahce',
  'fenerbahce beko': 'Fenerbahce',
  'fenerbahce beko istanbul': 'Fenerbahce',
  'anadolu efes': 'Anadolu Efes',
  'anadolu efes istanbul': 'Anadolu Efes',
  'efes': 'Anadolu Efes',
  
  // Spanish teams
  'real madrid': 'Real Madrid',
  'real madrid baloncesto': 'Real Madrid',
  'barcelona': 'Barcelona',
  'fc barcelona': 'Barcelona',
  'barca': 'Barcelona',
  'baskonia': 'Baskonia',
  'saski baskonia': 'Baskonia',
  'td systems baskonia': 'Baskonia',
  'gran canaria': 'Gran Canaria',
  'dreamland gran canaria': 'Gran Canaria',
  'unicaja': 'Unicaja',
  'unicaja malaga': 'Unicaja',
  
  // Greek teams
  'olympiacos': 'Olympiacos',
  'olympiacos piraeus': 'Olympiacos',
  'panathinaikos': 'Panathinaikos',
  'panathinaikos athens': 'Panathinaikos',
  'pao': 'Panathinaikos',
  
  // Italian teams
  'olimpia milano': 'Olimpia Milano',
  'ea7 emporio armani milano': 'Olimpia Milano',
  'armani milano': 'Olimpia Milano',
  'ax armani exchange milano': 'Olimpia Milano',
  'milano': 'Olimpia Milano',
  'virtus bologna': 'Virtus Bologna',
  'virtus segafredo bologna': 'Virtus Bologna',
  
  // French teams
  'asvel': 'ASVEL',
  'ldlc asvel': 'ASVEL',
  'asvel villeurbanne': 'ASVEL',
  'lyon-villeurbanne': 'ASVEL',
  'paris basketball': 'Paris Basketball',
  'paris': 'Paris Basketball',
  'monaco': 'Monaco',
  'as monaco': 'Monaco',
  
  // German teams
  'bayern munich': 'Bayern Munich',
  'fc bayern munich': 'Bayern Munich',
  'bayern munchen': 'Bayern Munich',
  'alba berlin': 'Alba Berlin',
  'alba': 'Alba Berlin',
  
  // Lithuanian teams
  'zalgiris': 'Zalgiris',
  'zalgiris kaunas': 'Zalgiris',
  
  // Israeli teams
  'maccabi tel aviv': 'Maccabi Tel Aviv',
  'maccabi': 'Maccabi Tel Aviv',
  
  // Serbian teams
  'partizan': 'Partizan',
  'partizan mozzart bet belgrade': 'Partizan',
  'partizan belgrade': 'Partizan',
  'crvena zvezda': 'Crvena Zvezda',
  'red star': 'Crvena Zvezda',
  'red star belgrade': 'Crvena Zvezda',
  
  // Other teams
  'olympia milano': 'Olimpia Milano',
};

/**
 * EuroCup Basketball Team Mappings
 * Many teams overlap with EuroLeague
 */
const EUROCUP_MAPPINGS: Record<string, string> = {
  ...EUROLEAGUE_MAPPINGS,
  // Additional EuroCup teams
  'valencia basket': 'Valencia Basket',
  'valencia': 'Valencia Basket',
  'joventut badalona': 'Joventut Badalona',
  'joventut': 'Joventut Badalona',
  'cedevita olimpija': 'Cedevita Olimpija',
  'trento': 'Trento',
  'dolomiti energia trento': 'Trento',
  'paris basketball': 'Paris Basketball',
  'paris': 'Paris Basketball',
  'bourg': 'Bourg-en-Bresse',
  'jl bourg': 'Bourg-en-Bresse',
  'gran canaria': 'Gran Canaria',
  'hapoel jerusalem': 'Hapoel Jerusalem',
  'jerusalem': 'Hapoel Jerusalem',
  'besiktas': 'Besiktas',
  'london lions': 'London Lions',
  'lions': 'London Lions',
};

/**
 * ACB Spain Basketball Team Mappings
 */
const ACB_SPAIN_MAPPINGS: Record<string, string> = {
  'real madrid': 'Real Madrid',
  'real madrid baloncesto': 'Real Madrid',
  'barcelona': 'Barcelona',
  'fc barcelona': 'Barcelona',
  'baskonia': 'Baskonia',
  'saski baskonia': 'Baskonia',
  'td systems baskonia': 'Baskonia',
  'gran canaria': 'Gran Canaria',
  'dreamland gran canaria': 'Gran Canaria',
  'unicaja': 'Unicaja',
  'unicaja malaga': 'Unicaja',
  'valencia basket': 'Valencia Basket',
  'valencia': 'Valencia Basket',
  'joventut badalona': 'Joventut Badalona',
  'joventut': 'Joventut Badalona',
  'la penya': 'Joventut Badalona',
  'manresa': 'BAXI Manresa',
  'baxi manresa': 'BAXI Manresa',
  'tenerife': 'Tenerife',
  'lenovo tenerife': 'Tenerife',
  'obradoiro': 'Obradoiro',
  'monbus obradoiro': 'Obradoiro',
  'bilbao basket': 'Bilbao Basket',
  'bilbao': 'Bilbao Basket',
  'zaragoza': 'Zaragoza',
  'casademont zaragoza': 'Zaragoza',
  'murcia': 'UCAM Murcia',
  'ucam murcia': 'UCAM Murcia',
  'breogan': 'Breogan',
  'rio breogan': 'Breogan',
  'girona': 'Girona',
  'basquet girona': 'Girona',
};

/**
 * Lega Basket Italy Team Mappings
 */
const ITALY_LEGA_MAPPINGS: Record<string, string> = {
  'olimpia milano': 'Olimpia Milano',
  'ea7 emporio armani milano': 'Olimpia Milano',
  'armani milano': 'Olimpia Milano',
  'ax armani exchange milano': 'Olimpia Milano',
  'milano': 'Olimpia Milano',
  'virtus bologna': 'Virtus Bologna',
  'virtus segafredo bologna': 'Virtus Bologna',
  'bologna': 'Virtus Bologna',
  'trento': 'Trento',
  'dolomiti energia trento': 'Trento',
  'brescia': 'Brescia',
  'germani brescia': 'Brescia',
  'venezia': 'Venezia',
  'reyer venezia': 'Venezia',
  'umana reyer venezia': 'Venezia',
  'varese': 'Varese',
  'openjobmetis varese': 'Varese',
  'sassari': 'Sassari',
  'dinamo sassari': 'Sassari',
  'banco di sardegna sassari': 'Sassari',
  'tortona': 'Tortona',
  'bertram tortona': 'Tortona',
  'napoli': 'Napoli Basket',
  'napoli basket': 'Napoli Basket',
  'reggio emilia': 'Reggio Emilia',
  'unahotels reggio emilia': 'Reggio Emilia',
  'pesaro': 'Pesaro',
  'vuelle pesaro': 'Pesaro',
  'carpegna prosciutto pesaro': 'Pesaro',
  'treviso': 'Treviso',
  'nutribullet treviso': 'Treviso',
  'trieste': 'Trieste',
  'allianz trieste': 'Trieste',
  'scafati': 'Scafati',
  'givova scafati': 'Scafati',
  'pistoia': 'Pistoia',
  'estra pistoia': 'Pistoia',
  'cremona': 'Cremona',
  'vanoli cremona': 'Cremona',
};

/**
 * BBL Germany Basketball Team Mappings
 */
const GERMANY_BBL_MAPPINGS: Record<string, string> = {
  'bayern munich': 'Bayern Munich',
  'fc bayern munich': 'Bayern Munich',
  'fc bayern munchen': 'Bayern Munich',
  'fc bayern munich basketball': 'Bayern Munich',
  'alba berlin': 'ALBA Berlin',
  'alba': 'ALBA Berlin',
  'berlin': 'ALBA Berlin',
  'bamberg': 'Bamberg',
  'brose bamberg': 'Bamberg',
  'frankfurt': 'Frankfurt',
  'fraport skyliners': 'Frankfurt',
  'skyliners frankfurt': 'Frankfurt',
  'ulm': 'Ulm',
  'ratiopharm ulm': 'Ulm',
  'bonn': 'Bonn',
  'telekom baskets bonn': 'Bonn',
  'baskets bonn': 'Bonn',
  'ludwigsburg': 'Ludwigsburg',
  'mhp riesen ludwigsburg': 'Ludwigsburg',
  'oldenburg': 'Oldenburg',
  'ewe baskets oldenburg': 'Oldenburg',
  'baskets oldenburg': 'Oldenburg',
  'gottingen': 'Gottingen',
  'bk gottingen': 'Gottingen',
  'brose': 'Bamberg',
  'hamburg': 'Hamburg',
  'hamburg towers': 'Hamburg',
  'towers': 'Hamburg',
  'chemnitz': 'Chemnitz',
  'niners chemnitz': 'Chemnitz',
  'wurzburg': 'Wurzburg',
  's.oliver wurzburg': 'Wurzburg',
  'braunschweig': 'Braunschweig',
  'lowen braunschweig': 'Braunschweig',
  'vechta': 'Vechta',
  'rasta vechta': 'Vechta',
  'giessen': 'Giessen',
  'giessen 46ers': 'Giessen',
  'heidelberg': 'Heidelberg',
  'mlp academics heidelberg': 'Heidelberg',
  'rostock': 'Rostock',
  'rostock seawolves': 'Rostock',
};

/**
 * Pro A France Basketball Team Mappings
 */
const FRANCE_PRO_A_MAPPINGS: Record<string, string> = {
  'asvel': 'ASVEL',
  'ldlc asvel': 'ASVEL',
  'asvel villeurbanne': 'ASVEL',
  'lyon-villeurbanne': 'ASVEL',
  'villeurbanne': 'ASVEL',
  'paris basketball': 'Paris Basketball',
  'paris': 'Paris Basketball',
  'monaco': 'Monaco',
  'as monaco': 'Monaco',
  'strasbourg': 'Strasbourg',
  'sig strasbourg': 'Strasbourg',
  'le mans': 'Le Mans',
  'le mans sarthe': 'Le Mans',
  'msb': 'Le Mans',
  'limoges': 'Limoges',
  'limoges csp': 'Limoges',
  'csp limoges': 'Limoges',
  'dijon': 'Dijon',
  'jda dijon': 'Dijon',
  'boulogne-levallois': 'Boulogne-Levallois',
  'metropolitans 92': 'Boulogne-Levallois',
  'levallois': 'Boulogne-Levallois',
  'bourg': 'Bourg-en-Bresse',
  'jl bourg': 'Bourg-en-Bresse',
  'bourg-en-bresse': 'Bourg-en-Bresse',
  'cholet': 'Cholet',
  'cholet basket': 'Cholet',
  'pau-lacq-orthez': 'Pau-Lacq-Orthez',
  'elan bearnais': 'Pau-Lacq-Orthez',
  'pau': 'Pau-Lacq-Orthez',
  'nancy': 'Nancy',
  'sluc nancy': 'Nancy',
  'roanne': 'Roanne',
  'roanne basket': 'Roanne',
  'gravelines': 'Gravelines-Dunkerque',
  'bcm gravelines': 'Gravelines-Dunkerque',
  'nanterre': 'Nanterre',
  'nanterre 92': 'Nanterre',
  'orleans': 'Orleans',
  'orleans loiret': 'Orleans',
  'antibes': 'Antibes',
  'olympique antibes': 'Antibes',
  'chalon': 'Chalon-sur-Saone',
  'elan chalon': 'Chalon-sur-Saone',
};

/**
 * BSL Turkey Basketball Team Mappings
 */
const TURKEY_BSL_MAPPINGS: Record<string, string> = {
  'fenerbahce': 'Fenerbahce',
  'fenerbahce beko': 'Fenerbahce',
  'fenerbahce beko istanbul': 'Fenerbahce',
  'anadolu efes': 'Anadolu Efes',
  'anadolu efes istanbul': 'Anadolu Efes',
  'efes': 'Anadolu Efes',
  'galatasaray': 'Galatasaray',
  'galatasaray nef': 'Galatasaray',
  'besiktas': 'Besiktas',
  'besiktas icrypex': 'Besiktas',
  'turk telekom': 'Turk Telekom',
  'turk telekom ankara': 'Turk Telekom',
  'ankara': 'Turk Telekom',
  'darussafaka': 'Darussafaka',
  'bahcesehir': 'Bahcesehir',
  'bahcesehir college': 'Bahcesehir',
  'bursaspor': 'Bursaspor',
  'frutti extra bursaspor': 'Bursaspor',
  'konyaspor': 'Konyaspor',
  'ittifak holding konyaspor': 'Konyaspor',
  'pinar karsiyaka': 'Pinar Karsiyaka',
  'karsiyaka': 'Pinar Karsiyaka',
  'tofas': 'Tofas',
  'tofas bursa': 'Tofas',
  'manisa': 'Manisa',
  'yukatel merkezefendi': 'Yukatel Merkezefendi',
  'merkezefendi': 'Yukatel Merkezefendi',
  'afyon belediye': 'Afyon Belediye',
  'afyon': 'Afyon Belediye',
  'aliaga petkim': 'Aliaga Petkim',
  'petkimspor': 'Aliaga Petkim',
};

/**
 * VTB United League (Russia) Basketball Team Mappings
 */
const RUSSIA_VTB_MAPPINGS: Record<string, string> = {
  'cska moscow': 'CSKA Moscow',
  'cska': 'CSKA Moscow',
  'lokomotiv kuban': 'Lokomotiv Kuban',
  'lokomotiv': 'Lokomotiv Kuban',
  'unics kazan': 'UNICS Kazan',
  'unics': 'UNICS Kazan',
  'kazan': 'UNICS Kazan',
  'zenit': 'Zenit Saint Petersburg',
  'zenit st petersburg': 'Zenit Saint Petersburg',
  'zenit saint petersburg': 'Zenit Saint Petersburg',
  'khimki': 'Khimki',
  'khimki moscow': 'Khimki',
  'nizhny novgorod': 'Nizhny Novgorod',
  'parma': 'Parma',
  'parma perm': 'Parma',
  'astana': 'Astana',
  'bc astana': 'Astana',
  'minsk': 'Tsmoki-Minsk',
  'tsmoki-minsk': 'Tsmoki-Minsk',
  'tsmoki': 'Tsmoki-Minsk',
  'kalev': 'Kalev',
  'kalev/cramo': 'Kalev',
  'kalev cramo': 'Kalev',
  'enisey': 'Enisey',
  'enisey krasnoyarsk': 'Enisey',
  'krasnoyarsk': 'Enisey',
  'avtodor': 'Avtodor',
  'avtodor saratov': 'Avtodor',
  'saratov': 'Avtodor',
  'mb': 'MBA Moscow',
  'mba': 'MBA Moscow',
  'mba moscow': 'MBA Moscow',
  'samara': 'Samara',
  'bc samara': 'Samara',
  'novosibirsk': 'Novosibirsk',
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
  'elche': 'Elche',
  'elche cf': 'Elche',
  
  // La Liga 2 (Segunda División)
  'racing santander': 'Racing Santander',
  'racing de santander': 'Racing Santander',
  'sporting gijon': 'Sporting Gijon',
  'real sporting': 'Sporting Gijon',
  'real oviedo': 'Real Oviedo',
  'oviedo': 'Real Oviedo',
  'tenerife': 'CD Tenerife',
  'cd tenerife': 'CD Tenerife',
  'cartagena': 'FC Cartagena',
  'fc cartagena': 'FC Cartagena',
  'albacete': 'Albacete',
  'albacete balompie': 'Albacete',
  'eibar': 'SD Eibar',
  'sd eibar': 'SD Eibar',
  'huesca': 'SD Huesca',
  'sd huesca': 'SD Huesca',
  'real zaragoza': 'Real Zaragoza',
  'zaragoza': 'Real Zaragoza',
  'burgos': 'Burgos CF',
  'burgos cf': 'Burgos CF',
  'racing ferrol': 'Racing Ferrol',
  'eldense': 'CD Eldense',
  'cd eldense': 'CD Eldense',
  'mirandes': 'CD Mirandes',
  'cd mirandes': 'CD Mirandes',
  'castellon': 'CD Castellon',
  'cd castellon': 'CD Castellon',
  'levante': 'Levante',
  'levante ud': 'Levante',
  'cadiz': 'Cadiz',
  'cadiz cf': 'Cadiz',
  'almeria': 'Almeria',
  'ud almeria': 'Almeria',
  'granada': 'Granada',
  'granada cf': 'Granada',
  
  // English Championship
  'watford': 'Watford',
  'watford fc': 'Watford',
  'norwich': 'Norwich City',
  'norwich city': 'Norwich City',
  'west brom': 'West Bromwich Albion',
  'west bromwich': 'West Bromwich Albion',
  'west bromwich albion': 'West Bromwich Albion',
  'bristol city': 'Bristol City',
  'hull city': 'Hull City',
  'hull': 'Hull City',
  'coventry': 'Coventry City',
  'coventry city': 'Coventry City',
  'swansea': 'Swansea City',
  'swansea city': 'Swansea City',
  'middlesbrough': 'Middlesbrough',
  'boro': 'Middlesbrough',
  'blackburn': 'Blackburn Rovers',
  'blackburn rovers': 'Blackburn Rovers',
  'stoke': 'Stoke City',
  'stoke city': 'Stoke City',
  'derby': 'Derby County',
  'derby county': 'Derby County',
  'preston': 'Preston North End',
  'preston north end': 'Preston North End',
  'millwall': 'Millwall',
  'millwall fc': 'Millwall',
  'qpr': 'Queens Park Rangers',
  'queens park rangers': 'Queens Park Rangers',
  'plymouth': 'Plymouth Argyle',
  'plymouth argyle': 'Plymouth Argyle',
  'sheffield wednesday': 'Sheffield Wednesday',
  'sheffield wed': 'Sheffield Wednesday',
  'cardiff': 'Cardiff City',
  'cardiff city': 'Cardiff City',
  'oxford united': 'Oxford United',
  'oxford': 'Oxford United',
  'portsmouth': 'Portsmouth',
  'portsmouth fc': 'Portsmouth',
  'burnley': 'Burnley',
  'burnley fc': 'Burnley',
  'sunderland': 'Sunderland',
  'sunderland afc': 'Sunderland',
  'leeds': 'Leeds United',
  'leeds united': 'Leeds United',
  'sheffield united': 'Sheffield United',
  'sheffield utd': 'Sheffield United',
  'luton': 'Luton Town',
  'luton town': 'Luton Town',
  
  // Champions League / Europa League - European clubs
  'celtic': 'Celtic',
  'celtic fc': 'Celtic',
  'rangers': 'Rangers',
  'rangers fc': 'Rangers',
  'club brugge': 'Club Brugge',
  'club bruges': 'Club Brugge',
  'young boys': 'BSC Young Boys',
  'bsc young boys': 'BSC Young Boys',
  'dinamo zagreb': 'Dinamo Zagreb',
  'gnk dinamo zagreb': 'Dinamo Zagreb',
  'shakhtar': 'Shakhtar Donetsk',
  'shakhtar donetsk': 'Shakhtar Donetsk',
  'slavia prague': 'Slavia Praha',
  'slavia praha': 'Slavia Praha',
  'sparta prague': 'Sparta Praha',
  'sparta praha': 'Sparta Praha',
  'sturm graz': 'SK Sturm Graz',
  'sk sturm graz': 'SK Sturm Graz',
  'salzburg': 'RB Salzburg',
  'red bull salzburg': 'RB Salzburg',
  'rb salzburg': 'RB Salzburg',
  'feyenoord': 'Feyenoord',
  'feyenoord rotterdam': 'Feyenoord',
  'psv': 'PSV Eindhoven',
  'psv eindhoven': 'PSV Eindhoven',
  'ajax': 'Ajax',
  'afc ajax': 'Ajax',
  'ajax amsterdam': 'Ajax',
  'benfica': 'SL Benfica',
  'sl benfica': 'SL Benfica',
  'sporting cp': 'Sporting CP',
  'sporting lisbon': 'Sporting CP',
  'sporting lisboa': 'Sporting CP',
  'porto': 'FC Porto',
  'fc porto': 'FC Porto',
  'galatasaray': 'Galatasaray',
  'galatasaray sk': 'Galatasaray',
  'besiktas': 'Besiktas',
  'besiktas jk': 'Besiktas',
  'fenerbahce': 'Fenerbahce',
  'fenerbahce sk': 'Fenerbahce',
  'braga': 'SC Braga',
  'sc braga': 'SC Braga',
  'anderlecht': 'Anderlecht',
  'rsc anderlecht': 'Anderlecht',
  'gent': 'KAA Gent',
  'kaa gent': 'KAA Gent',
  'standard liege': 'Standard Liege',
  'standard': 'Standard Liege',
  'az': 'AZ Alkmaar',
  'az alkmaar': 'AZ Alkmaar',
  'twente': 'FC Twente',
  'fc twente': 'FC Twente',
  'copenhagen': 'FC Copenhagen',
  'fc copenhagen': 'FC Copenhagen',
  'kobenhavn': 'FC Copenhagen',
  'fc kobenhavn': 'FC Copenhagen',
  'midtjylland': 'FC Midtjylland',
  'fc midtjylland': 'FC Midtjylland',
  'red star': 'Red Star Belgrade',
  'red star belgrade': 'Red Star Belgrade',
  'crvena zvezda': 'Red Star Belgrade',
  'olympiacos': 'Olympiacos',
  'olympiakos': 'Olympiacos',
  'paok': 'PAOK',
  'paok thessaloniki': 'PAOK',
  'panathinaikos': 'Panathinaikos',
  'aris': 'Aris Thessaloniki',
  'aris thessaloniki': 'Aris Thessaloniki',
  
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

type Sport = 'soccer' | 'basketball' | 'basketball_euroleague' | 'basketball_eurocup' | 'basketball_acb_spain' | 'basketball_italy_lega' | 'basketball_germany_bbl' | 'basketball_france_pro_a' | 'basketball_turkey_bsl' | 'basketball_russia_vtb' | 'hockey' | 'american_football';

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
  basketball_euroleague: Object.values(EUROLEAGUE_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
  basketball_eurocup: Object.values(EUROCUP_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
  basketball_acb_spain: Object.values(ACB_SPAIN_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
  basketball_italy_lega: Object.values(ITALY_LEGA_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
  basketball_germany_bbl: Object.values(GERMANY_BBL_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
  basketball_france_pro_a: Object.values(FRANCE_PRO_A_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
  basketball_turkey_bsl: Object.values(TURKEY_BSL_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
  basketball_russia_vtb: Object.values(RUSSIA_VTB_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i),
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
    case 'basketball_euroleague': return EUROLEAGUE_MAPPINGS;
    case 'basketball_eurocup': return EUROCUP_MAPPINGS;
    case 'basketball_acb_spain': return ACB_SPAIN_MAPPINGS;
    case 'basketball_italy_lega': return ITALY_LEGA_MAPPINGS;
    case 'basketball_germany_bbl': return GERMANY_BBL_MAPPINGS;
    case 'basketball_france_pro_a': return FRANCE_PRO_A_MAPPINGS;
    case 'basketball_turkey_bsl': return TURKEY_BSL_MAPPINGS;
    case 'basketball_russia_vtb': return RUSSIA_VTB_MAPPINGS;
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
  
  // Add without common prefixes/suffixes (FC, CF, AFC, SC, SV, etc.)
  const withoutPrefix = teamName.replace(/\s*(fc|cf|afc|sc|sv|fk|bk|if)\s*/gi, ' ').trim();
  if (withoutPrefix !== teamName) variations.add(withoutPrefix);
  
  // Also try replacing hyphens with spaces (e.g., "Zulte-Waregem" → "Zulte Waregem")
  const withSpaces = teamName.replace(/-/g, ' ');
  if (withSpaces !== teamName) variations.add(withSpaces);
  
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
