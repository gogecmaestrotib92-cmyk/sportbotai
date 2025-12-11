/**
 * Team & League Logo Utilities
 * 
 * Provides logo URLs for teams and leagues using multiple sources:
 * 1. ESPN public CDN (most reliable for major leagues)
 * 2. Transfermarkt CDN for soccer teams (official logos)
 * 3. Generated fallback avatars
 * 
 * Usage:
 * - getTeamLogo(teamName, sport, league) -> URL
 * - getLeagueLogo(leagueName, sport) -> URL
 */

// ============================================
// LOGO SOURCES & MAPPINGS
// ============================================

/**
 * ESPN Team ID mappings for major sports
 * ESPN URLs: https://a.espncdn.com/i/teamlogos/{sport}/500/{id}.png
 */
const ESPN_TEAM_IDS: Record<string, Record<string, string>> = {
  // NFL Teams (all variations)
  nfl: {
    'Arizona Cardinals': 'ari', 'Cardinals': 'ari', 'ARI': 'ari',
    'Atlanta Falcons': 'atl', 'Falcons': 'atl', 'ATL': 'atl',
    'Baltimore Ravens': 'bal', 'Ravens': 'bal', 'BAL': 'bal',
    'Buffalo Bills': 'buf', 'Bills': 'buf', 'BUF': 'buf',
    'Carolina Panthers': 'car', 'Panthers': 'car', 'CAR': 'car',
    'Chicago Bears': 'chi', 'Bears': 'chi', 'CHI': 'chi',
    'Cincinnati Bengals': 'cin', 'Bengals': 'cin', 'CIN': 'cin',
    'Cleveland Browns': 'cle', 'Browns': 'cle', 'CLE': 'cle',
    'Dallas Cowboys': 'dal', 'Cowboys': 'dal', 'DAL': 'dal',
    'Denver Broncos': 'den', 'Broncos': 'den', 'DEN': 'den',
    'Detroit Lions': 'det', 'Lions': 'det', 'DET': 'det',
    'Green Bay Packers': 'gb', 'Packers': 'gb', 'GB': 'gb', 'Green Bay': 'gb',
    'Houston Texans': 'hou', 'Texans': 'hou', 'HOU': 'hou',
    'Indianapolis Colts': 'ind', 'Colts': 'ind', 'IND': 'ind',
    'Jacksonville Jaguars': 'jax', 'Jaguars': 'jax', 'JAX': 'jax', 'JAC': 'jax',
    'Kansas City Chiefs': 'kc', 'Chiefs': 'kc', 'KC': 'kc', 'Kansas City': 'kc',
    'Las Vegas Raiders': 'lv', 'Raiders': 'lv', 'LV': 'lv', 'Oakland Raiders': 'lv',
    'Los Angeles Chargers': 'lac', 'Chargers': 'lac', 'LAC': 'lac', 'LA Chargers': 'lac',
    'Los Angeles Rams': 'lar', 'Rams': 'lar', 'LAR': 'lar', 'LA Rams': 'lar',
    'Miami Dolphins': 'mia', 'Dolphins': 'mia', 'MIA': 'mia',
    'Minnesota Vikings': 'min', 'Vikings': 'min', 'MIN': 'min',
    'New England Patriots': 'ne', 'Patriots': 'ne', 'NE': 'ne', 'New England': 'ne',
    'New Orleans Saints': 'no', 'Saints': 'no', 'NO': 'no', 'New Orleans': 'no',
    'New York Giants': 'nyg', 'Giants': 'nyg', 'NYG': 'nyg', 'NY Giants': 'nyg',
    'New York Jets': 'nyj', 'Jets': 'nyj', 'NYJ': 'nyj', 'NY Jets': 'nyj',
    'Philadelphia Eagles': 'phi', 'Eagles': 'phi', 'PHI': 'phi',
    'Pittsburgh Steelers': 'pit', 'Steelers': 'pit', 'PIT': 'pit',
    'San Francisco 49ers': 'sf', '49ers': 'sf', 'SF': 'sf', 'San Francisco': 'sf', 'Niners': 'sf',
    'Seattle Seahawks': 'sea', 'Seahawks': 'sea', 'SEA': 'sea',
    'Tampa Bay Buccaneers': 'tb', 'Buccaneers': 'tb', 'TB': 'tb', 'Bucs': 'tb', 'Tampa Bay': 'tb',
    'Tennessee Titans': 'ten', 'Titans': 'ten', 'TEN': 'ten',
    'Washington Commanders': 'wsh', 'Commanders': 'wsh', 'WSH': 'wsh', 'WAS': 'wsh', 'Washington': 'wsh',
  },
  // NBA Teams (all variations)
  nba: {
    'Atlanta Hawks': 'atl', 'Hawks': 'atl', 'ATL': 'atl',
    'Boston Celtics': 'bos', 'Celtics': 'bos', 'BOS': 'bos',
    'Brooklyn Nets': 'bkn', 'Nets': 'bkn', 'BKN': 'bkn', 'BRK': 'bkn',
    'Charlotte Hornets': 'cha', 'Hornets': 'cha', 'CHA': 'cha',
    'Chicago Bulls': 'chi', 'Bulls': 'chi', 'CHI': 'chi',
    'Cleveland Cavaliers': 'cle', 'Cavaliers': 'cle', 'Cavs': 'cle', 'CLE': 'cle',
    'Dallas Mavericks': 'dal', 'Mavericks': 'dal', 'Mavs': 'dal', 'DAL': 'dal',
    'Denver Nuggets': 'den', 'Nuggets': 'den', 'DEN': 'den',
    'Detroit Pistons': 'det', 'Pistons': 'det', 'DET': 'det',
    'Golden State Warriors': 'gs', 'Warriors': 'gs', 'GSW': 'gs', 'GS': 'gs', 'Golden State': 'gs',
    'Houston Rockets': 'hou', 'Rockets': 'hou', 'HOU': 'hou',
    'Indiana Pacers': 'ind', 'Pacers': 'ind', 'IND': 'ind',
    'LA Clippers': 'lac', 'Los Angeles Clippers': 'lac', 'Clippers': 'lac', 'LAC': 'lac',
    'LA Lakers': 'lal', 'Los Angeles Lakers': 'lal', 'Lakers': 'lal', 'LAL': 'lal',
    'Memphis Grizzlies': 'mem', 'Grizzlies': 'mem', 'MEM': 'mem',
    'Miami Heat': 'mia', 'Heat': 'mia', 'MIA': 'mia',
    'Milwaukee Bucks': 'mil', 'Bucks': 'mil', 'MIL': 'mil',
    'Minnesota Timberwolves': 'min', 'Timberwolves': 'min', 'Wolves': 'min', 'MIN': 'min',
    'New Orleans Pelicans': 'no', 'Pelicans': 'no', 'NOP': 'no', 'NO': 'no', 'New Orleans': 'no',
    'New York Knicks': 'ny', 'Knicks': 'ny', 'NYK': 'ny', 'NY': 'ny',
    'Oklahoma City Thunder': 'okc', 'Thunder': 'okc', 'OKC': 'okc',
    'Orlando Magic': 'orl', 'Magic': 'orl', 'ORL': 'orl',
    'Philadelphia 76ers': 'phi', '76ers': 'phi', 'Sixers': 'phi', 'PHI': 'phi',
    'Phoenix Suns': 'phx', 'Suns': 'phx', 'PHX': 'phx', 'PHO': 'phx',
    'Portland Trail Blazers': 'por', 'Trail Blazers': 'por', 'Blazers': 'por', 'POR': 'por',
    'Sacramento Kings': 'sac', 'Kings': 'sac', 'SAC': 'sac',
    'San Antonio Spurs': 'sa', 'Spurs': 'sa', 'SAS': 'sa', 'SA': 'sa', 'San Antonio': 'sa',
    'Toronto Raptors': 'tor', 'Raptors': 'tor', 'TOR': 'tor',
    'Utah Jazz': 'uta', 'Jazz': 'uta', 'UTA': 'uta',
    'Washington Wizards': 'wsh', 'Wizards': 'wsh', 'WSH': 'wsh', 'WAS': 'wsh',
  },
  // NHL Teams (all variations)
  nhl: {
    'Anaheim Ducks': 'ana', 'Ducks': 'ana', 'ANA': 'ana',
    'Arizona Coyotes': 'ari', 'Coyotes': 'ari', 'ARI': 'ari', 'Utah Hockey Club': 'uta',
    'Boston Bruins': 'bos', 'Bruins': 'bos', 'BOS': 'bos',
    'Buffalo Sabres': 'buf', 'Sabres': 'buf', 'BUF': 'buf',
    'Calgary Flames': 'cgy', 'Flames': 'cgy', 'CGY': 'cgy',
    'Carolina Hurricanes': 'car', 'Hurricanes': 'car', 'CAR': 'car', 'Canes': 'car',
    'Chicago Blackhawks': 'chi', 'Blackhawks': 'chi', 'CHI': 'chi', 'Hawks': 'chi',
    'Colorado Avalanche': 'col', 'Avalanche': 'col', 'COL': 'col', 'Avs': 'col',
    'Columbus Blue Jackets': 'cbj', 'Blue Jackets': 'cbj', 'CBJ': 'cbj',
    'Dallas Stars': 'dal', 'Stars': 'dal', 'DAL': 'dal',
    'Detroit Red Wings': 'det', 'Red Wings': 'det', 'DET': 'det', 'Wings': 'det',
    'Edmonton Oilers': 'edm', 'Oilers': 'edm', 'EDM': 'edm',
    'Florida Panthers': 'fla', 'Panthers': 'fla', 'FLA': 'fla',
    'Los Angeles Kings': 'la', 'Kings': 'la', 'LAK': 'la', 'LA Kings': 'la',
    'Minnesota Wild': 'min', 'Wild': 'min', 'MIN': 'min',
    'Montreal Canadiens': 'mtl', 'Canadiens': 'mtl', 'MTL': 'mtl', 'Habs': 'mtl',
    'Nashville Predators': 'nsh', 'Predators': 'nsh', 'NSH': 'nsh', 'Preds': 'nsh',
    'New Jersey Devils': 'nj', 'Devils': 'nj', 'NJD': 'nj', 'NJ': 'nj',
    'New York Islanders': 'nyi', 'Islanders': 'nyi', 'NYI': 'nyi',
    'New York Rangers': 'nyr', 'Rangers': 'nyr', 'NYR': 'nyr',
    'Ottawa Senators': 'ott', 'Senators': 'ott', 'OTT': 'ott', 'Sens': 'ott',
    'Philadelphia Flyers': 'phi', 'Flyers': 'phi', 'PHI': 'phi',
    'Pittsburgh Penguins': 'pit', 'Penguins': 'pit', 'PIT': 'pit', 'Pens': 'pit',
    'San Jose Sharks': 'sj', 'Sharks': 'sj', 'SJS': 'sj', 'SJ': 'sj',
    'Seattle Kraken': 'sea', 'Kraken': 'sea', 'SEA': 'sea',
    'St. Louis Blues': 'stl', 'Blues': 'stl', 'STL': 'stl', 'St Louis Blues': 'stl',
    'Tampa Bay Lightning': 'tb', 'Lightning': 'tb', 'TBL': 'tb', 'TB': 'tb', 'Tampa Bay': 'tb',
    'Toronto Maple Leafs': 'tor', 'Maple Leafs': 'tor', 'TOR': 'tor', 'Leafs': 'tor',
    'Vancouver Canucks': 'van', 'Canucks': 'van', 'VAN': 'van',
    'Vegas Golden Knights': 'vgk', 'Golden Knights': 'vgk', 'VGK': 'vgk', 'Vegas': 'vgk',
    'Washington Capitals': 'wsh', 'Capitals': 'wsh', 'WSH': 'wsh', 'Caps': 'wsh',
    'Winnipeg Jets': 'wpg', 'Jets': 'wpg', 'WPG': 'wpg',
  },
  // MLB Teams (all variations)
  mlb: {
    'Arizona Diamondbacks': 'ari', 'Diamondbacks': 'ari', 'D-backs': 'ari', 'ARI': 'ari',
    'Atlanta Braves': 'atl', 'Braves': 'atl', 'ATL': 'atl',
    'Baltimore Orioles': 'bal', 'Orioles': 'bal', 'BAL': 'bal', 'O\'s': 'bal',
    'Boston Red Sox': 'bos', 'Red Sox': 'bos', 'BOS': 'bos', 'Sox': 'bos',
    'Chicago Cubs': 'chc', 'Cubs': 'chc', 'CHC': 'chc',
    'Chicago White Sox': 'chw', 'White Sox': 'chw', 'CHW': 'chw', 'CWS': 'chw',
    'Cincinnati Reds': 'cin', 'Reds': 'cin', 'CIN': 'cin',
    'Cleveland Guardians': 'cle', 'Guardians': 'cle', 'CLE': 'cle', 'Indians': 'cle',
    'Colorado Rockies': 'col', 'Rockies': 'col', 'COL': 'col',
    'Detroit Tigers': 'det', 'Tigers': 'det', 'DET': 'det',
    'Houston Astros': 'hou', 'Astros': 'hou', 'HOU': 'hou',
    'Kansas City Royals': 'kc', 'Royals': 'kc', 'KC': 'kc', 'Kansas City': 'kc',
    'Los Angeles Angels': 'laa', 'Angels': 'laa', 'LAA': 'laa', 'LA Angels': 'laa',
    'Los Angeles Dodgers': 'lad', 'Dodgers': 'lad', 'LAD': 'lad', 'LA Dodgers': 'lad',
    'Miami Marlins': 'mia', 'Marlins': 'mia', 'MIA': 'mia',
    'Milwaukee Brewers': 'mil', 'Brewers': 'mil', 'MIL': 'mil',
    'Minnesota Twins': 'min', 'Twins': 'min', 'MIN': 'min',
    'New York Mets': 'nym', 'Mets': 'nym', 'NYM': 'nym', 'NY Mets': 'nym',
    'New York Yankees': 'nyy', 'Yankees': 'nyy', 'NYY': 'nyy', 'NY Yankees': 'nyy',
    'Oakland Athletics': 'oak', 'Athletics': 'oak', 'A\'s': 'oak', 'OAK': 'oak',
    'Philadelphia Phillies': 'phi', 'Phillies': 'phi', 'PHI': 'phi',
    'Pittsburgh Pirates': 'pit', 'Pirates': 'pit', 'PIT': 'pit',
    'San Diego Padres': 'sd', 'Padres': 'sd', 'SD': 'sd', 'San Diego': 'sd',
    'San Francisco Giants': 'sf', 'Giants': 'sf', 'SF': 'sf', 'San Francisco': 'sf',
    'Seattle Mariners': 'sea', 'Mariners': 'sea', 'SEA': 'sea',
    'St. Louis Cardinals': 'stl', 'Cardinals': 'stl', 'STL': 'stl', 'St Louis Cardinals': 'stl',
    'Tampa Bay Rays': 'tb', 'Rays': 'tb', 'TB': 'tb', 'Tampa Bay': 'tb',
    'Texas Rangers': 'tex', 'Rangers': 'tex', 'TEX': 'tex',
    'Toronto Blue Jays': 'tor', 'Blue Jays': 'tor', 'TOR': 'tor', 'Jays': 'tor',
    'Washington Nationals': 'wsh', 'Nationals': 'wsh', 'WSH': 'wsh', 'Nats': 'wsh',
  },
};

/**
 * Major soccer league team logo mappings
 * Using football-data.org CDN for official logos
 */
const SOCCER_TEAM_LOGOS: Record<string, string> = {
  // ============================================
  // PREMIER LEAGUE (England)
  // ============================================
  'Arsenal': 'https://crests.football-data.org/57.png',
  'Arsenal FC': 'https://crests.football-data.org/57.png',
  'Aston Villa': 'https://crests.football-data.org/58.png',
  'Aston Villa FC': 'https://crests.football-data.org/58.png',
  'Bournemouth': 'https://crests.football-data.org/1044.png',
  'AFC Bournemouth': 'https://crests.football-data.org/1044.png',
  'Brentford': 'https://crests.football-data.org/402.png',
  'Brentford FC': 'https://crests.football-data.org/402.png',
  'Brighton': 'https://crests.football-data.org/397.png',
  'Brighton & Hove Albion': 'https://crests.football-data.org/397.png',
  'Brighton and Hove Albion': 'https://crests.football-data.org/397.png',
  'Brighton Hove Albion': 'https://crests.football-data.org/397.png',
  'Chelsea': 'https://crests.football-data.org/61.png',
  'Chelsea FC': 'https://crests.football-data.org/61.png',
  'Crystal Palace': 'https://crests.football-data.org/354.png',
  'Crystal Palace FC': 'https://crests.football-data.org/354.png',
  'Everton': 'https://crests.football-data.org/62.png',
  'Everton FC': 'https://crests.football-data.org/62.png',
  'Fulham': 'https://crests.football-data.org/63.png',
  'Fulham FC': 'https://crests.football-data.org/63.png',
  'Ipswich': 'https://crests.football-data.org/349.png',
  'Ipswich Town': 'https://crests.football-data.org/349.png',
  'Ipswich Town FC': 'https://crests.football-data.org/349.png',
  'Leicester': 'https://crests.football-data.org/338.png',
  'Leicester City': 'https://crests.football-data.org/338.png',
  'Leicester City FC': 'https://crests.football-data.org/338.png',
  'Liverpool': 'https://crests.football-data.org/64.png',
  'Liverpool FC': 'https://crests.football-data.org/64.png',
  'Manchester City': 'https://crests.football-data.org/65.png',
  'Man City': 'https://crests.football-data.org/65.png',
  'Manchester City FC': 'https://crests.football-data.org/65.png',
  'Manchester United': 'https://crests.football-data.org/66.png',
  'Man United': 'https://crests.football-data.org/66.png',
  'Man Utd': 'https://crests.football-data.org/66.png',
  'Manchester United FC': 'https://crests.football-data.org/66.png',
  'Newcastle': 'https://crests.football-data.org/67.png',
  'Newcastle United': 'https://crests.football-data.org/67.png',
  'Newcastle United FC': 'https://crests.football-data.org/67.png',
  'Nottingham Forest': 'https://crests.football-data.org/351.png',
  "Nott'm Forest": 'https://crests.football-data.org/351.png',
  'Nottingham Forest FC': 'https://crests.football-data.org/351.png',
  'Southampton': 'https://crests.football-data.org/340.png',
  'Southampton FC': 'https://crests.football-data.org/340.png',
  'Tottenham': 'https://crests.football-data.org/73.png',
  'Tottenham Hotspur': 'https://crests.football-data.org/73.png',
  'Tottenham Hotspur FC': 'https://crests.football-data.org/73.png',
  'Spurs': 'https://crests.football-data.org/73.png',
  'West Ham': 'https://crests.football-data.org/563.png',
  'West Ham United': 'https://crests.football-data.org/563.png',
  'West Ham United FC': 'https://crests.football-data.org/563.png',
  'Wolves': 'https://crests.football-data.org/76.png',
  'Wolverhampton': 'https://crests.football-data.org/76.png',
  'Wolverhampton Wanderers': 'https://crests.football-data.org/76.png',
  'Wolverhampton Wanderers FC': 'https://crests.football-data.org/76.png',
  
  // ============================================
  // LA LIGA (Spain) - All name variations
  // ============================================
  'Real Madrid': 'https://crests.football-data.org/86.png',
  'Real Madrid CF': 'https://crests.football-data.org/86.png',
  'R. Madrid': 'https://crests.football-data.org/86.png',
  'Madrid': 'https://crests.football-data.org/86.png',
  'Barcelona': 'https://crests.football-data.org/81.png',
  'FC Barcelona': 'https://crests.football-data.org/81.png',
  'Barca': 'https://crests.football-data.org/81.png',
  'Barça': 'https://crests.football-data.org/81.png',
  'FCB': 'https://crests.football-data.org/81.png',
  'Atletico Madrid': 'https://crests.football-data.org/78.png',
  'Atlético Madrid': 'https://crests.football-data.org/78.png',
  'Atletico de Madrid': 'https://crests.football-data.org/78.png',
  'Atlético de Madrid': 'https://crests.football-data.org/78.png',
  'Atletico': 'https://crests.football-data.org/78.png',
  'Atleti': 'https://crests.football-data.org/78.png',
  'Atl. Madrid': 'https://crests.football-data.org/78.png',
  'Atl Madrid': 'https://crests.football-data.org/78.png',
  'Club Atletico de Madrid': 'https://crests.football-data.org/78.png',
  'Sevilla': 'https://crests.football-data.org/559.png',
  'Sevilla FC': 'https://crests.football-data.org/559.png',
  'Sevilla Futbol Club': 'https://crests.football-data.org/559.png',
  'Real Sociedad': 'https://crests.football-data.org/92.png',
  'Real Sociedad de Futbol': 'https://crests.football-data.org/92.png',
  'Sociedad': 'https://crests.football-data.org/92.png',
  'La Real': 'https://crests.football-data.org/92.png',
  'Real Betis': 'https://crests.football-data.org/90.png',
  'Real Betis Balompie': 'https://crests.football-data.org/90.png',
  'Betis': 'https://crests.football-data.org/90.png',
  'R. Betis': 'https://crests.football-data.org/90.png',
  'Villarreal': 'https://crests.football-data.org/94.png',
  'Villarreal CF': 'https://crests.football-data.org/94.png',
  'Villarreal Club de Futbol': 'https://crests.football-data.org/94.png',
  'Yellow Submarine': 'https://crests.football-data.org/94.png',
  'Athletic Bilbao': 'https://crests.football-data.org/77.png',
  'Athletic Club': 'https://crests.football-data.org/77.png',
  'Athletic': 'https://crests.football-data.org/77.png',
  'Bilbao': 'https://crests.football-data.org/77.png',
  'Ath Bilbao': 'https://crests.football-data.org/77.png',
  'Ath. Bilbao': 'https://crests.football-data.org/77.png',
  'Athletic Club de Bilbao': 'https://crests.football-data.org/77.png',
  'Valencia': 'https://crests.football-data.org/95.png',
  'Valencia CF': 'https://crests.football-data.org/95.png',
  'Valencia Club de Futbol': 'https://crests.football-data.org/95.png',
  'VCF': 'https://crests.football-data.org/95.png',
  'Celta Vigo': 'https://crests.football-data.org/558.png',
  'RC Celta': 'https://crests.football-data.org/558.png',
  'RC Celta de Vigo': 'https://crests.football-data.org/558.png',
  'Celta': 'https://crests.football-data.org/558.png',
  'Celta de Vigo': 'https://crests.football-data.org/558.png',
  'Getafe': 'https://crests.football-data.org/82.png',
  'Getafe CF': 'https://crests.football-data.org/82.png',
  'Getafe Club de Futbol': 'https://crests.football-data.org/82.png',
  'Espanyol': 'https://crests.football-data.org/80.png',
  'RCD Espanyol': 'https://crests.football-data.org/80.png',
  'RCD Espanyol de Barcelona': 'https://crests.football-data.org/80.png',
  'Espanyol Barcelona': 'https://crests.football-data.org/80.png',
  'Rayo Vallecano': 'https://crests.football-data.org/87.png',
  'Rayo': 'https://crests.football-data.org/87.png',
  'Rayo Vallecano de Madrid': 'https://crests.football-data.org/87.png',
  'Vallecano': 'https://crests.football-data.org/87.png',
  'Osasuna': 'https://crests.football-data.org/79.png',
  'CA Osasuna': 'https://crests.football-data.org/79.png',
  'Club Atletico Osasuna': 'https://crests.football-data.org/79.png',
  'Mallorca': 'https://crests.football-data.org/89.png',
  'RCD Mallorca': 'https://crests.football-data.org/89.png',
  'Real Club Deportivo Mallorca': 'https://crests.football-data.org/89.png',
  'Las Palmas': 'https://crests.football-data.org/275.png',
  'UD Las Palmas': 'https://crests.football-data.org/275.png',
  'Union Deportiva Las Palmas': 'https://crests.football-data.org/275.png',
  'Alaves': 'https://crests.football-data.org/263.png',
  'Deportivo Alaves': 'https://crests.football-data.org/263.png',
  'Alavés': 'https://crests.football-data.org/263.png',
  'CD Alaves': 'https://crests.football-data.org/263.png',
  'Girona': 'https://crests.football-data.org/298.png',
  'Girona FC': 'https://crests.football-data.org/298.png',
  'Girona Futbol Club': 'https://crests.football-data.org/298.png',
  'Leganes': 'https://crests.football-data.org/745.png',
  'CD Leganes': 'https://crests.football-data.org/745.png',
  'Leganés': 'https://crests.football-data.org/745.png',
  'Club Deportivo Leganes': 'https://crests.football-data.org/745.png',
  'Valladolid': 'https://crests.football-data.org/250.png',
  'Real Valladolid': 'https://crests.football-data.org/250.png',
  'Real Valladolid CF': 'https://crests.football-data.org/250.png',
  'R. Valladolid': 'https://crests.football-data.org/250.png',
  
  // ============================================
  // SERIE A (Italy) - All name variations
  // ============================================
  'Juventus': 'https://crests.football-data.org/109.png',
  'Juventus FC': 'https://crests.football-data.org/109.png',
  'Juventus Turin': 'https://crests.football-data.org/109.png',
  'Juve': 'https://crests.football-data.org/109.png',
  'Inter': 'https://crests.football-data.org/108.png',
  'Inter Milan': 'https://crests.football-data.org/108.png',
  'Internazionale': 'https://crests.football-data.org/108.png',
  'FC Internazionale Milano': 'https://crests.football-data.org/108.png',
  'Internazionale Milano': 'https://crests.football-data.org/108.png',
  'Inter Milano': 'https://crests.football-data.org/108.png',
  'FC Inter': 'https://crests.football-data.org/108.png',
  'AC Milan': 'https://crests.football-data.org/98.png',
  'Milan': 'https://crests.football-data.org/98.png',
  'AC Milan FC': 'https://crests.football-data.org/98.png',
  'AC Milano': 'https://crests.football-data.org/98.png',
  'Associazione Calcio Milan': 'https://crests.football-data.org/98.png',
  'Rossoneri': 'https://crests.football-data.org/98.png',
  'Napoli': 'https://crests.football-data.org/113.png',
  'SSC Napoli': 'https://crests.football-data.org/113.png',
  'Societa Sportiva Calcio Napoli': 'https://crests.football-data.org/113.png',
  'Napoles': 'https://crests.football-data.org/113.png',
  'Roma': 'https://crests.football-data.org/100.png',
  'AS Roma': 'https://crests.football-data.org/100.png',
  'Associazione Sportiva Roma': 'https://crests.football-data.org/100.png',
  'AS Rome': 'https://crests.football-data.org/100.png',
  'Lazio': 'https://crests.football-data.org/110.png',
  'SS Lazio': 'https://crests.football-data.org/110.png',
  'Societa Sportiva Lazio': 'https://crests.football-data.org/110.png',
  'S.S. Lazio': 'https://crests.football-data.org/110.png',
  'Atalanta': 'https://crests.football-data.org/102.png',
  'Atalanta BC': 'https://crests.football-data.org/102.png',
  'Atalanta Bergamo': 'https://crests.football-data.org/102.png',
  'Atalanta Bergamasca Calcio': 'https://crests.football-data.org/102.png',
  'Fiorentina': 'https://crests.football-data.org/99.png',
  'ACF Fiorentina': 'https://crests.football-data.org/99.png',
  'AC Fiorentina': 'https://crests.football-data.org/99.png',
  'Viola': 'https://crests.football-data.org/99.png',
  'Bologna': 'https://crests.football-data.org/103.png',
  'Bologna FC': 'https://crests.football-data.org/103.png',
  'Bologna FC 1909': 'https://crests.football-data.org/103.png',
  'Torino': 'https://crests.football-data.org/586.png',
  'Torino FC': 'https://crests.football-data.org/586.png',
  'Turin': 'https://crests.football-data.org/586.png',
  'Torino Football Club': 'https://crests.football-data.org/586.png',
  'Udinese': 'https://crests.football-data.org/115.png',
  'Udinese Calcio': 'https://crests.football-data.org/115.png',
  'Genoa': 'https://crests.football-data.org/107.png',
  'Genoa CFC': 'https://crests.football-data.org/107.png',
  'Genoa Cricket and Football Club': 'https://crests.football-data.org/107.png',
  'Genova': 'https://crests.football-data.org/107.png',
  'Cagliari': 'https://crests.football-data.org/104.png',
  'Cagliari Calcio': 'https://crests.football-data.org/104.png',
  'Empoli': 'https://crests.football-data.org/445.png',
  'Empoli FC': 'https://crests.football-data.org/445.png',
  'Empoli Football Club': 'https://crests.football-data.org/445.png',
  'Hellas Verona': 'https://crests.football-data.org/450.png',
  'Verona': 'https://crests.football-data.org/450.png',
  'Hellas Verona FC': 'https://crests.football-data.org/450.png',
  'Sassuolo': 'https://crests.football-data.org/471.png',
  'US Sassuolo': 'https://crests.football-data.org/471.png',
  'US Sassuolo Calcio': 'https://crests.football-data.org/471.png',
  'Lecce': 'https://crests.football-data.org/282.png',
  'US Lecce': 'https://crests.football-data.org/282.png',
  'Unione Sportiva Lecce': 'https://crests.football-data.org/282.png',
  'Monza': 'https://crests.football-data.org/5911.png',
  'AC Monza': 'https://crests.football-data.org/5911.png',
  'Monza FC': 'https://crests.football-data.org/5911.png',
  'AC Monza-Brianza': 'https://crests.football-data.org/5911.png',
  'Parma': 'https://crests.football-data.org/112.png',
  'Parma Calcio': 'https://crests.football-data.org/112.png',
  'Parma Calcio 1913': 'https://crests.football-data.org/112.png',
  'Parma FC': 'https://crests.football-data.org/112.png',
  'Como': 'https://crests.football-data.org/1106.png',
  'Como 1907': 'https://crests.football-data.org/1106.png',
  'Como FC': 'https://crests.football-data.org/1106.png',
  'Calcio Como': 'https://crests.football-data.org/1106.png',
  'Venezia': 'https://crests.football-data.org/454.png',
  'Venezia FC': 'https://crests.football-data.org/454.png',
  'Venice': 'https://crests.football-data.org/454.png',
  'Venezia Football Club': 'https://crests.football-data.org/454.png',
  'Sampdoria': 'https://crests.football-data.org/584.png',
  'UC Sampdoria': 'https://crests.football-data.org/584.png',
  'Unione Calcio Sampdoria': 'https://crests.football-data.org/584.png',
  'Samp': 'https://crests.football-data.org/584.png',
  'Spezia': 'https://crests.football-data.org/488.png',
  'Spezia Calcio': 'https://crests.football-data.org/488.png',
  'La Spezia': 'https://crests.football-data.org/488.png',
  'Salernitana': 'https://crests.football-data.org/455.png',
  'US Salernitana': 'https://crests.football-data.org/455.png',
  'US Salernitana 1919': 'https://crests.football-data.org/455.png',
  'Frosinone': 'https://crests.football-data.org/470.png',
  'Frosinone Calcio': 'https://crests.football-data.org/470.png',
  'Cremonese': 'https://crests.football-data.org/472.png',
  'US Cremonese': 'https://crests.football-data.org/472.png',
  
  // ============================================
  // BUNDESLIGA (Germany)
  // ============================================
  'Bayern Munich': 'https://crests.football-data.org/5.png',
  'Bayern': 'https://crests.football-data.org/5.png',
  'FC Bayern München': 'https://crests.football-data.org/5.png',
  'Bayern Munchen': 'https://crests.football-data.org/5.png',
  'FC Bayern Munich': 'https://crests.football-data.org/5.png',
  'Borussia Dortmund': 'https://crests.football-data.org/4.png',
  'Dortmund': 'https://crests.football-data.org/4.png',
  'BVB': 'https://crests.football-data.org/4.png',
  'RB Leipzig': 'https://crests.football-data.org/721.png',
  'Leipzig': 'https://crests.football-data.org/721.png',
  'Bayer Leverkusen': 'https://crests.football-data.org/3.png',
  'Leverkusen': 'https://crests.football-data.org/3.png',
  'Bayer 04 Leverkusen': 'https://crests.football-data.org/3.png',
  'Eintracht Frankfurt': 'https://crests.football-data.org/19.png',
  'Frankfurt': 'https://crests.football-data.org/19.png',
  'Wolfsburg': 'https://crests.football-data.org/11.png',
  'VfL Wolfsburg': 'https://crests.football-data.org/11.png',
  'Borussia Monchengladbach': 'https://crests.football-data.org/18.png',
  'Monchengladbach': 'https://crests.football-data.org/18.png',
  'Gladbach': 'https://crests.football-data.org/18.png',
  'VfB Stuttgart': 'https://crests.football-data.org/10.png',
  'Stuttgart': 'https://crests.football-data.org/10.png',
  'SC Freiburg': 'https://crests.football-data.org/17.png',
  'Freiburg': 'https://crests.football-data.org/17.png',
  'Werder Bremen': 'https://crests.football-data.org/12.png',
  'Bremen': 'https://crests.football-data.org/12.png',
  'TSG Hoffenheim': 'https://crests.football-data.org/2.png',
  'Hoffenheim': 'https://crests.football-data.org/2.png',
  '1. FC Union Berlin': 'https://crests.football-data.org/28.png',
  'Union Berlin': 'https://crests.football-data.org/28.png',
  'FC Augsburg': 'https://crests.football-data.org/16.png',
  'Augsburg': 'https://crests.football-data.org/16.png',
  '1. FSV Mainz 05': 'https://crests.football-data.org/15.png',
  'Mainz': 'https://crests.football-data.org/15.png',
  'Mainz 05': 'https://crests.football-data.org/15.png',
  'VfL Bochum': 'https://crests.football-data.org/36.png',
  'Bochum': 'https://crests.football-data.org/36.png',
  'FC Heidenheim': 'https://crests.football-data.org/44.png',
  'Heidenheim': 'https://crests.football-data.org/44.png',
  'FC St. Pauli': 'https://crests.football-data.org/20.png',
  'St. Pauli': 'https://crests.football-data.org/20.png',
  'Holstein Kiel': 'https://crests.football-data.org/720.png',
  'Kiel': 'https://crests.football-data.org/720.png',
  
  // ============================================
  // LIGUE 1 (France)
  // ============================================
  'Paris Saint-Germain': 'https://crests.football-data.org/524.png',
  'PSG': 'https://crests.football-data.org/524.png',
  'Paris SG': 'https://crests.football-data.org/524.png',
  'Paris Saint Germain': 'https://crests.football-data.org/524.png',
  'Marseille': 'https://crests.football-data.org/516.png',
  'Olympique Marseille': 'https://crests.football-data.org/516.png',
  'Olympique de Marseille': 'https://crests.football-data.org/516.png',
  'OM': 'https://crests.football-data.org/516.png',
  'Lyon': 'https://crests.football-data.org/523.png',
  'Olympique Lyon': 'https://crests.football-data.org/523.png',
  'Olympique Lyonnais': 'https://crests.football-data.org/523.png',
  'OL': 'https://crests.football-data.org/523.png',
  'Monaco': 'https://crests.football-data.org/548.png',
  'AS Monaco': 'https://crests.football-data.org/548.png',
  'Lille': 'https://crests.football-data.org/521.png',
  'LOSC Lille': 'https://crests.football-data.org/521.png',
  'LOSC': 'https://crests.football-data.org/521.png',
  'Nice': 'https://crests.football-data.org/522.png',
  'OGC Nice': 'https://crests.football-data.org/522.png',
  'Lens': 'https://crests.football-data.org/546.png',
  'RC Lens': 'https://crests.football-data.org/546.png',
  'Rennes': 'https://crests.football-data.org/529.png',
  'Stade Rennais': 'https://crests.football-data.org/529.png',
  'Stade Rennais FC': 'https://crests.football-data.org/529.png',
  'Strasbourg': 'https://crests.football-data.org/576.png',
  'RC Strasbourg': 'https://crests.football-data.org/576.png',
  'RC Strasbourg Alsace': 'https://crests.football-data.org/576.png',
  'Toulouse': 'https://crests.football-data.org/511.png',
  'Toulouse FC': 'https://crests.football-data.org/511.png',
  'Montpellier': 'https://crests.football-data.org/518.png',
  'Montpellier HSC': 'https://crests.football-data.org/518.png',
  'Nantes': 'https://crests.football-data.org/543.png',
  'FC Nantes': 'https://crests.football-data.org/543.png',
  'Reims': 'https://crests.football-data.org/547.png',
  'Stade de Reims': 'https://crests.football-data.org/547.png',
  'Brest': 'https://crests.football-data.org/512.png',
  'Stade Brestois': 'https://crests.football-data.org/512.png',
  'Stade Brestois 29': 'https://crests.football-data.org/512.png',
  'Le Havre': 'https://crests.football-data.org/514.png',
  'Le Havre AC': 'https://crests.football-data.org/514.png',
  'Auxerre': 'https://crests.football-data.org/519.png',
  'AJ Auxerre': 'https://crests.football-data.org/519.png',
  'Angers': 'https://crests.football-data.org/532.png',
  'Angers SCO': 'https://crests.football-data.org/532.png',
  'Saint-Etienne': 'https://crests.football-data.org/527.png',
  'AS Saint-Etienne': 'https://crests.football-data.org/527.png',
  'St Etienne': 'https://crests.football-data.org/527.png',
  
  // ============================================
  // EREDIVISIE (Netherlands)
  // ============================================
  'Ajax': 'https://crests.football-data.org/678.png',
  'AFC Ajax': 'https://crests.football-data.org/678.png',
  'PSV': 'https://crests.football-data.org/674.png',
  'PSV Eindhoven': 'https://crests.football-data.org/674.png',
  'Feyenoord': 'https://crests.football-data.org/675.png',
  'Feyenoord Rotterdam': 'https://crests.football-data.org/675.png',
  'AZ': 'https://crests.football-data.org/682.png',
  'AZ Alkmaar': 'https://crests.football-data.org/682.png',
  'FC Twente': 'https://crests.football-data.org/666.png',
  'Twente': 'https://crests.football-data.org/666.png',
  'FC Utrecht': 'https://crests.football-data.org/676.png',
  'Utrecht': 'https://crests.football-data.org/676.png',
  
  // ============================================
  // PRIMEIRA LIGA (Portugal)
  // ============================================
  'Benfica': 'https://crests.football-data.org/1903.png',
  'SL Benfica': 'https://crests.football-data.org/1903.png',
  'Porto': 'https://crests.football-data.org/503.png',
  'FC Porto': 'https://crests.football-data.org/503.png',
  'Sporting': 'https://crests.football-data.org/498.png',
  'Sporting CP': 'https://crests.football-data.org/498.png',
  'Sporting Lisbon': 'https://crests.football-data.org/498.png',
  'Braga': 'https://crests.football-data.org/5613.png',
  'SC Braga': 'https://crests.football-data.org/5613.png',
  
  // ============================================
  // SCOTTISH PREMIERSHIP
  // ============================================
  'Celtic': 'https://crests.football-data.org/732.png',
  'Celtic FC': 'https://crests.football-data.org/732.png',
  'Rangers': 'https://crests.football-data.org/739.png',
  'Rangers FC': 'https://crests.football-data.org/739.png',
  'Hearts': 'https://crests.football-data.org/735.png',
  'Heart of Midlothian': 'https://crests.football-data.org/735.png',
  'Aberdeen': 'https://crests.football-data.org/727.png',
  'Aberdeen FC': 'https://crests.football-data.org/727.png',
  'Hibernian': 'https://crests.football-data.org/733.png',
  'Hibernian FC': 'https://crests.football-data.org/733.png',
  
  // ============================================
  // CHAMPIONSHIP & OTHER ENGLISH
  // ============================================
  'Leeds': 'https://crests.football-data.org/341.png',
  'Leeds United': 'https://crests.football-data.org/341.png',
  'Burnley': 'https://crests.football-data.org/328.png',
  'Burnley FC': 'https://crests.football-data.org/328.png',
  'Sheffield United': 'https://crests.football-data.org/356.png',
  'Sheffield Utd': 'https://crests.football-data.org/356.png',
  'Luton': 'https://crests.football-data.org/389.png',
  'Luton Town': 'https://crests.football-data.org/389.png',
  'Middlesbrough': 'https://crests.football-data.org/343.png',
  'Norwich': 'https://crests.football-data.org/68.png',
  'Norwich City': 'https://crests.football-data.org/68.png',
  'West Brom': 'https://crests.football-data.org/74.png',
  'West Bromwich Albion': 'https://crests.football-data.org/74.png',
  'Sunderland': 'https://crests.football-data.org/71.png',
  'Sunderland AFC': 'https://crests.football-data.org/71.png',
  'Watford': 'https://crests.football-data.org/346.png',
  'Watford FC': 'https://crests.football-data.org/346.png',
  'Stoke': 'https://crests.football-data.org/70.png',
  'Stoke City': 'https://crests.football-data.org/70.png',
  'Swansea': 'https://crests.football-data.org/72.png',
  'Swansea City': 'https://crests.football-data.org/72.png',
  'Bristol City': 'https://crests.football-data.org/387.png',
  'Hull': 'https://crests.football-data.org/322.png',
  'Hull City': 'https://crests.football-data.org/322.png',
  'Coventry': 'https://crests.football-data.org/1076.png',
  'Coventry City': 'https://crests.football-data.org/1076.png',
  'QPR': 'https://crests.football-data.org/69.png',
  'Queens Park Rangers': 'https://crests.football-data.org/69.png',
  'Blackburn': 'https://crests.football-data.org/59.png',
  'Blackburn Rovers': 'https://crests.football-data.org/59.png',
  'Preston': 'https://crests.football-data.org/1081.png',
  'Preston North End': 'https://crests.football-data.org/1081.png',
  'Sheffield Wednesday': 'https://crests.football-data.org/345.png',
  'Sheffield Wed': 'https://crests.football-data.org/345.png',
  'Millwall': 'https://crests.football-data.org/384.png',
  'Millwall FC': 'https://crests.football-data.org/384.png',
  'Cardiff': 'https://crests.football-data.org/715.png',
  'Cardiff City': 'https://crests.football-data.org/715.png',
  'Plymouth': 'https://crests.football-data.org/1138.png',
  'Plymouth Argyle': 'https://crests.football-data.org/1138.png',
  'Derby': 'https://crests.football-data.org/342.png',
  'Derby County': 'https://crests.football-data.org/342.png',
  'Portsmouth': 'https://crests.football-data.org/345.png',
  'Portsmouth FC': 'https://crests.football-data.org/345.png',
  'Oxford': 'https://crests.football-data.org/1082.png',
  'Oxford United': 'https://crests.football-data.org/1082.png',
  
  // ============================================
  // MLS (USA & Canada) - ESPN CDN
  // ============================================
  'LA Galaxy': 'https://a.espncdn.com/i/teamlogos/soccer/500/9825.png',
  'Los Angeles Galaxy': 'https://a.espncdn.com/i/teamlogos/soccer/500/9825.png',
  'Galaxy': 'https://a.espncdn.com/i/teamlogos/soccer/500/9825.png',
  'LAFC': 'https://a.espncdn.com/i/teamlogos/soccer/500/14026.png',
  'Los Angeles FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/14026.png',
  'Los Angeles Football Club': 'https://a.espncdn.com/i/teamlogos/soccer/500/14026.png',
  'Inter Miami': 'https://a.espncdn.com/i/teamlogos/soccer/500/14880.png',
  'Inter Miami CF': 'https://a.espncdn.com/i/teamlogos/soccer/500/14880.png',
  'Miami': 'https://a.espncdn.com/i/teamlogos/soccer/500/14880.png',
  'Atlanta United': 'https://a.espncdn.com/i/teamlogos/soccer/500/9883.png',
  'Atlanta United FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9883.png',
  'Seattle Sounders': 'https://a.espncdn.com/i/teamlogos/soccer/500/9830.png',
  'Seattle Sounders FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9830.png',
  'Sounders': 'https://a.espncdn.com/i/teamlogos/soccer/500/9830.png',
  'New York Red Bulls': 'https://a.espncdn.com/i/teamlogos/soccer/500/9829.png',
  'NY Red Bulls': 'https://a.espncdn.com/i/teamlogos/soccer/500/9829.png',
  'Red Bulls': 'https://a.espncdn.com/i/teamlogos/soccer/500/9829.png',
  'NYCFC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9881.png',
  'New York City FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9881.png',
  'NYC FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9881.png',
  'Toronto FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9834.png',
  'Toronto': 'https://a.espncdn.com/i/teamlogos/soccer/500/9834.png',
  'Columbus Crew': 'https://a.espncdn.com/i/teamlogos/soccer/500/9823.png',
  'Crew': 'https://a.espncdn.com/i/teamlogos/soccer/500/9823.png',
  'Philadelphia Union': 'https://a.espncdn.com/i/teamlogos/soccer/500/9824.png',
  'Philly Union': 'https://a.espncdn.com/i/teamlogos/soccer/500/9824.png',
  'Portland Timbers': 'https://a.espncdn.com/i/teamlogos/soccer/500/9828.png',
  'Timbers': 'https://a.espncdn.com/i/teamlogos/soccer/500/9828.png',
  'FC Cincinnati': 'https://a.espncdn.com/i/teamlogos/soccer/500/12410.png',
  'Cincinnati': 'https://a.espncdn.com/i/teamlogos/soccer/500/12410.png',
  'Orlando City': 'https://a.espncdn.com/i/teamlogos/soccer/500/9882.png',
  'Orlando City SC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9882.png',
  'Austin FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/15181.png',
  'Nashville SC': 'https://a.espncdn.com/i/teamlogos/soccer/500/14917.png',
  'Nashville': 'https://a.espncdn.com/i/teamlogos/soccer/500/14917.png',
  'Houston Dynamo': 'https://a.espncdn.com/i/teamlogos/soccer/500/9822.png',
  'Houston Dynamo FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9822.png',
  'Dynamo': 'https://a.espncdn.com/i/teamlogos/soccer/500/9822.png',
  'FC Dallas': 'https://a.espncdn.com/i/teamlogos/soccer/500/9821.png',
  'Dallas': 'https://a.espncdn.com/i/teamlogos/soccer/500/9821.png',
  'Minnesota United': 'https://a.espncdn.com/i/teamlogos/soccer/500/11141.png',
  'Minnesota United FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/11141.png',
  'DC United': 'https://a.espncdn.com/i/teamlogos/soccer/500/9819.png',
  'D.C. United': 'https://a.espncdn.com/i/teamlogos/soccer/500/9819.png',
  'Real Salt Lake': 'https://a.espncdn.com/i/teamlogos/soccer/500/9826.png',
  'RSL': 'https://a.espncdn.com/i/teamlogos/soccer/500/9826.png',
  'Colorado Rapids': 'https://a.espncdn.com/i/teamlogos/soccer/500/9817.png',
  'Rapids': 'https://a.espncdn.com/i/teamlogos/soccer/500/9817.png',
  'Vancouver Whitecaps': 'https://a.espncdn.com/i/teamlogos/soccer/500/9835.png',
  'Vancouver Whitecaps FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9835.png',
  'Whitecaps': 'https://a.espncdn.com/i/teamlogos/soccer/500/9835.png',
  'Sporting Kansas City': 'https://a.espncdn.com/i/teamlogos/soccer/500/9827.png',
  'Sporting KC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9827.png',
  'SKC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9827.png',
  'Chicago Fire': 'https://a.espncdn.com/i/teamlogos/soccer/500/9816.png',
  'Chicago Fire FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9816.png',
  'New England Revolution': 'https://a.espncdn.com/i/teamlogos/soccer/500/9820.png',
  'New England Revs': 'https://a.espncdn.com/i/teamlogos/soccer/500/9820.png',
  'Revs': 'https://a.espncdn.com/i/teamlogos/soccer/500/9820.png',
  'San Jose Earthquakes': 'https://a.espncdn.com/i/teamlogos/soccer/500/9831.png',
  'Earthquakes': 'https://a.espncdn.com/i/teamlogos/soccer/500/9831.png',
  'Charlotte FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/15294.png',
  'St. Louis City': 'https://a.espncdn.com/i/teamlogos/soccer/500/16209.png',
  'St. Louis City SC': 'https://a.espncdn.com/i/teamlogos/soccer/500/16209.png',
  'CF Montreal': 'https://a.espncdn.com/i/teamlogos/soccer/500/9833.png',
  'Montreal Impact': 'https://a.espncdn.com/i/teamlogos/soccer/500/9833.png',
  
  // ============================================
  // LIGA MX (Mexico)
  // ============================================
  'Club America': 'https://a.espncdn.com/i/teamlogos/soccer/500/9907.png',
  'America': 'https://a.espncdn.com/i/teamlogos/soccer/500/9907.png',
  'América': 'https://a.espncdn.com/i/teamlogos/soccer/500/9907.png',
  'Chivas': 'https://a.espncdn.com/i/teamlogos/soccer/500/9911.png',
  'Guadalajara': 'https://a.espncdn.com/i/teamlogos/soccer/500/9911.png',
  'CD Guadalajara': 'https://a.espncdn.com/i/teamlogos/soccer/500/9911.png',
  'Cruz Azul': 'https://a.espncdn.com/i/teamlogos/soccer/500/9912.png',
  'Monterrey': 'https://a.espncdn.com/i/teamlogos/soccer/500/9920.png',
  'CF Monterrey': 'https://a.espncdn.com/i/teamlogos/soccer/500/9920.png',
  'Rayados': 'https://a.espncdn.com/i/teamlogos/soccer/500/9920.png',
  'Tigres UANL': 'https://a.espncdn.com/i/teamlogos/soccer/500/9926.png',
  'Tigres': 'https://a.espncdn.com/i/teamlogos/soccer/500/9926.png',
  'Pumas UNAM': 'https://a.espncdn.com/i/teamlogos/soccer/500/9924.png',
  'Pumas': 'https://a.espncdn.com/i/teamlogos/soccer/500/9924.png',
  'Santos Laguna': 'https://a.espncdn.com/i/teamlogos/soccer/500/9925.png',
  'Santos': 'https://a.espncdn.com/i/teamlogos/soccer/500/9925.png',
  'Leon': 'https://a.espncdn.com/i/teamlogos/soccer/500/9917.png',
  'Club Leon': 'https://a.espncdn.com/i/teamlogos/soccer/500/9917.png',
  'León': 'https://a.espncdn.com/i/teamlogos/soccer/500/9917.png',
  'Toluca': 'https://a.espncdn.com/i/teamlogos/soccer/500/9927.png',
  'Deportivo Toluca': 'https://a.espncdn.com/i/teamlogos/soccer/500/9927.png',
  'Pachuca': 'https://a.espncdn.com/i/teamlogos/soccer/500/9921.png',
  'CF Pachuca': 'https://a.espncdn.com/i/teamlogos/soccer/500/9921.png',
  'Tijuana': 'https://a.espncdn.com/i/teamlogos/soccer/500/9806.png',
  'Club Tijuana': 'https://a.espncdn.com/i/teamlogos/soccer/500/9806.png',
  'Xolos': 'https://a.espncdn.com/i/teamlogos/soccer/500/9806.png',
  'Atlas': 'https://a.espncdn.com/i/teamlogos/soccer/500/9908.png',
  'Atlas FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/9908.png',
  'Necaxa': 'https://a.espncdn.com/i/teamlogos/soccer/500/9905.png',
  'Club Necaxa': 'https://a.espncdn.com/i/teamlogos/soccer/500/9905.png',
  'Puebla': 'https://a.espncdn.com/i/teamlogos/soccer/500/9923.png',
  'Club Puebla': 'https://a.espncdn.com/i/teamlogos/soccer/500/9923.png',
  'Queretaro': 'https://a.espncdn.com/i/teamlogos/soccer/500/9902.png',
  'Querétaro': 'https://a.espncdn.com/i/teamlogos/soccer/500/9902.png',
  'FC Juarez': 'https://a.espncdn.com/i/teamlogos/soccer/500/9900.png',
  'Juarez': 'https://a.espncdn.com/i/teamlogos/soccer/500/9900.png',
  'Juárez': 'https://a.espncdn.com/i/teamlogos/soccer/500/9900.png',
  'Mazatlan': 'https://a.espncdn.com/i/teamlogos/soccer/500/18035.png',
  'Mazatlán FC': 'https://a.espncdn.com/i/teamlogos/soccer/500/18035.png',
};

/**
 * League logo mappings - using official/reliable CDN sources
 * Mapped by sport_key from The Odds API and common display names
 */
const LEAGUE_LOGOS: Record<string, string> = {
  // ============================================
  // US SPORTS (ESPN CDN - official)
  // ============================================
  
  // NFL - All variations
  'NFL': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  'americanfootball_nfl': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  'NFL Regular Season': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  'NFL Preseason': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  'NFL Playoffs': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  'Super Bowl': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  
  // NCAA Football - All variations
  'NCAA Football': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'NCAAF': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'americanfootball_ncaaf': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'College Football': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'CFB': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  
  // CFL - Canadian Football
  'CFL': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/37/Canadian_Football_League_logo.svg/200px-Canadian_Football_League_logo.svg.png',
  'Canadian Football League': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/37/Canadian_Football_League_logo.svg/200px-Canadian_Football_League_logo.svg.png',
  'americanfootball_cfl': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/37/Canadian_Football_League_logo.svg/200px-Canadian_Football_League_logo.svg.png',
  
  // NBA - All variations
  'NBA': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'basketball_nba': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'NBA Regular Season': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'NBA Playoffs': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'NBA Finals': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  
  // WNBA
  'WNBA': 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
  'basketball_wnba': 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
  
  // NCAA Basketball - All variations
  'NCAA Basketball': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'NCAAB': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'basketball_ncaab': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'College Basketball': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'March Madness': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  
  // NHL - All variations
  'NHL': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'icehockey_nhl': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'NHL Regular Season': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'NHL Playoffs': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'Stanley Cup': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  
  // MLB - All variations
  'MLB': 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
  'baseball_mlb': 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
  'MLB Regular Season': 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
  'MLB Playoffs': 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
  'World Series': 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
  
  // MLS - All variations
  'MLS': 'https://a.espncdn.com/i/teamlogos/leagues/500/mls.png',
  'soccer_usa_mls': 'https://a.espncdn.com/i/teamlogos/leagues/500/mls.png',
  'Major League Soccer': 'https://a.espncdn.com/i/teamlogos/leagues/500/mls.png',
  
  // ============================================
  // SOCCER/FOOTBALL (football-data.org CDN - official)
  // ============================================
  
  // Premier League - All variations (Odds API format)
  'Premier League': 'https://crests.football-data.org/PL.png',
  'EPL': 'https://crests.football-data.org/PL.png',
  'English Premier League': 'https://crests.football-data.org/PL.png',
  'soccer_epl': 'https://crests.football-data.org/PL.png',
  'soccer_england_premier_league': 'https://crests.football-data.org/PL.png',
  'England - Premier League': 'https://crests.football-data.org/PL.png',
  
  // La Liga - All variations
  'La Liga': 'https://crests.football-data.org/PD.png',
  'LaLiga': 'https://crests.football-data.org/PD.png',
  'soccer_spain_la_liga': 'https://crests.football-data.org/PD.png',
  'Spain - La Liga': 'https://crests.football-data.org/PD.png',
  'La Liga Santander': 'https://crests.football-data.org/PD.png',
  
  // Serie A - All variations
  'Serie A': 'https://crests.football-data.org/SA.png',
  'soccer_italy_serie_a': 'https://crests.football-data.org/SA.png',
  'Italy - Serie A': 'https://crests.football-data.org/SA.png',
  'Serie A TIM': 'https://crests.football-data.org/SA.png',
  
  // Bundesliga - All variations
  'Bundesliga': 'https://crests.football-data.org/BL1.png',
  'soccer_germany_bundesliga': 'https://crests.football-data.org/BL1.png',
  'Germany - Bundesliga': 'https://crests.football-data.org/BL1.png',
  '2. Bundesliga': 'https://crests.football-data.org/BL2.png',
  'Bundesliga 2': 'https://crests.football-data.org/BL2.png',
  'soccer_germany_bundesliga2': 'https://crests.football-data.org/BL2.png',
  
  // Ligue 1 - All variations
  'Ligue 1': 'https://crests.football-data.org/FL1.png',
  'soccer_france_ligue_one': 'https://crests.football-data.org/FL1.png',
  'France - Ligue 1': 'https://crests.football-data.org/FL1.png',
  'Ligue 1 Uber Eats': 'https://crests.football-data.org/FL1.png',
  
  // Eredivisie - Netherlands
  'Eredivisie': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Eredivisie_logo_%282024%29.svg/200px-Eredivisie_logo_%282024%29.svg.png',
  'soccer_netherlands_eredivisie': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Eredivisie_logo_%282024%29.svg/200px-Eredivisie_logo_%282024%29.svg.png',
  'Netherlands - Eredivisie': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Eredivisie_logo_%282024%29.svg/200px-Eredivisie_logo_%282024%29.svg.png',
  
  // Primeira Liga - Portugal
  'Primeira Liga': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Liga_Portugal_logo.png/200px-Liga_Portugal_logo.png',
  'Liga Portugal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Liga_Portugal_logo.png/200px-Liga_Portugal_logo.png',
  'soccer_portugal_primeira_liga': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Liga_Portugal_logo.png/200px-Liga_Portugal_logo.png',
  'Portugal - Primeira Liga': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Liga_Portugal_logo.png/200px-Liga_Portugal_logo.png',
  
  // Scottish Premiership
  'Scottish Premiership': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Scottish_Premiership_logo.svg/200px-Scottish_Premiership_logo.svg.png',
  'SPFL': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Scottish_Premiership_logo.svg/200px-Scottish_Premiership_logo.svg.png',
  'Scotland - Premiership': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Scottish_Premiership_logo.svg/200px-Scottish_Premiership_logo.svg.png',
  
  // Belgian Pro League
  'Belgian Pro League': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Belgian_Pro_League_logo.svg/200px-Belgian_Pro_League_logo.svg.png',
  'Jupiler Pro League': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Belgian_Pro_League_logo.svg/200px-Belgian_Pro_League_logo.svg.png',
  'Belgium - First Division A': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Belgian_Pro_League_logo.svg/200px-Belgian_Pro_League_logo.svg.png',
  
  // Turkish Super Lig
  'Super Lig': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/38/S%C3%BCper_Lig_logo.svg/200px-S%C3%BCper_Lig_logo.svg.png',
  'Süper Lig': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/38/S%C3%BCper_Lig_logo.svg/200px-S%C3%BCper_Lig_logo.svg.png',
  'Turkey - Super Lig': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/38/S%C3%BCper_Lig_logo.svg/200px-S%C3%BCper_Lig_logo.svg.png',
  
  // Liga MX - Mexico
  'Liga MX': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Liga_MX_logo.svg/200px-Liga_MX_logo.svg.png',
  'soccer_mexico_ligamx': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Liga_MX_logo.svg/200px-Liga_MX_logo.svg.png',
  'Mexico - Liga MX': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Liga_MX_logo.svg/200px-Liga_MX_logo.svg.png',
  
  // A-League - Australia
  'A-League': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/A-League_Men_logo.svg/200px-A-League_Men_logo.svg.png',
  'A-League Men': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/A-League_Men_logo.svg/200px-A-League_Men_logo.svg.png',
  'soccer_australia_aleague': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/A-League_Men_logo.svg/200px-A-League_Men_logo.svg.png',
  'Australia - A-League': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/A-League_Men_logo.svg/200px-A-League_Men_logo.svg.png',
  
  // J1 League - Japan
  'J1 League': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0b/J1_League_logo.svg/200px-J1_League_logo.svg.png',
  'J-League': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0b/J1_League_logo.svg/200px-J1_League_logo.svg.png',
  'Japan - J League': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0b/J1_League_logo.svg/200px-J1_League_logo.svg.png',
  
  // K League - South Korea
  'K League 1': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/K_League_1_logo.svg/200px-K_League_1_logo.svg.png',
  'Korea - K League 1': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/K_League_1_logo.svg/200px-K_League_1_logo.svg.png',
  
  // Brasileirao - Brazil
  'Brasileirao': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/42/Campeonato_Brasileiro_S%C3%A9rie_A_logo.png/200px-Campeonato_Brasileiro_S%C3%A9rie_A_logo.png',
  'Serie A Brazil': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/42/Campeonato_Brasileiro_S%C3%A9rie_A_logo.png/200px-Campeonato_Brasileiro_S%C3%A9rie_A_logo.png',
  'Brazil - Serie A': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/42/Campeonato_Brasileiro_S%C3%A9rie_A_logo.png/200px-Campeonato_Brasileiro_S%C3%A9rie_A_logo.png',
  
  // Argentina
  'Liga Profesional': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Liga_Profesional_de_F%C3%BAtbol_%28Argentina%29_-_logo.svg/200px-Liga_Profesional_de_F%C3%BAtbol_%28Argentina%29_-_logo.svg.png',
  'Argentina - Liga Profesional': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Liga_Profesional_de_F%C3%BAtbol_%28Argentina%29_-_logo.svg/200px-Liga_Profesional_de_F%C3%BAtbol_%28Argentina%29_-_logo.svg.png',
  
  // UEFA Champions League - All variations
  'Champions League': 'https://crests.football-data.org/CL.png',
  'UEFA Champions League': 'https://crests.football-data.org/CL.png',
  'soccer_uefa_champs_league': 'https://crests.football-data.org/CL.png',
  'UEFA CL': 'https://crests.football-data.org/CL.png',
  
  // UEFA Europa League - All variations
  'Europa League': 'https://crests.football-data.org/EL.png',
  'UEFA Europa League': 'https://crests.football-data.org/EL.png',
  'soccer_uefa_europa_league': 'https://crests.football-data.org/EL.png',
  'UEFA EL': 'https://crests.football-data.org/EL.png',
  
  // UEFA Europa Conference League
  'Conference League': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/UEFA_Europa_Conference_League_logo.svg/200px-UEFA_Europa_Conference_League_logo.svg.png',
  'UEFA Conference League': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/UEFA_Europa_Conference_League_logo.svg/200px-UEFA_Europa_Conference_League_logo.svg.png',
  'UEFA Europa Conference League': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/UEFA_Europa_Conference_League_logo.svg/200px-UEFA_Europa_Conference_League_logo.svg.png',
  
  // English Cups
  'FA Cup': 'https://crests.football-data.org/FAC.png',
  'EFL Cup': 'https://crests.football-data.org/ELC.png',
  'Carabao Cup': 'https://crests.football-data.org/ELC.png',
  'League Cup': 'https://crests.football-data.org/ELC.png',
  'Championship': 'https://crests.football-data.org/ELC.png',
  'EFL Championship': 'https://crests.football-data.org/ELC.png',
  'England - Championship': 'https://crests.football-data.org/ELC.png',
  'England - EFL Cup': 'https://crests.football-data.org/ELC.png',
  'England - FA Cup': 'https://crests.football-data.org/FAC.png',
  
  // Copa del Rey - Spain
  'Copa del Rey': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/Copa_del_Rey_logo.svg/200px-Copa_del_Rey_logo.svg.png',
  'Spain - Copa del Rey': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/Copa_del_Rey_logo.svg/200px-Copa_del_Rey_logo.svg.png',
  
  // DFB Pokal - Germany
  'DFB Pokal': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/DFB-Pokal_logo.svg/200px-DFB-Pokal_logo.svg.png',
  'Germany - DFB Pokal': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/DFB-Pokal_logo.svg/200px-DFB-Pokal_logo.svg.png',
  
  // Coppa Italia
  'Coppa Italia': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Coppa_Italia_logo.svg/200px-Coppa_Italia_logo.svg.png',
  'Italy - Coppa Italia': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Coppa_Italia_logo.svg/200px-Coppa_Italia_logo.svg.png',
  
  // Coupe de France
  'Coupe de France': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Coupe_de_France_logo.svg/200px-Coupe_de_France_logo.svg.png',
  'France - Coupe de France': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Coupe_de_France_logo.svg/200px-Coupe_de_France_logo.svg.png',
  
  // International
  'FIFA World Cup': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/FIFA_logo.svg/200px-FIFA_logo.svg.png',
  'World Cup': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/FIFA_logo.svg/200px-FIFA_logo.svg.png',
  'Euro 2024': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/43/UEFA_Euro_2024_logo.svg/200px-UEFA_Euro_2024_logo.svg.png',
  'UEFA Euro': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/43/UEFA_Euro_2024_logo.svg/200px-UEFA_Euro_2024_logo.svg.png',
  'International Friendlies': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/FIFA_logo.svg/200px-FIFA_logo.svg.png',
  
  // ============================================
  // BASKETBALL - EUROPE
  // ============================================
  
  // EuroLeague
  'EuroLeague': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Euroleague_Basketball_logo.svg/200px-Euroleague_Basketball_logo.svg.png',
  'Euroleague': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Euroleague_Basketball_logo.svg/200px-Euroleague_Basketball_logo.svg.png',
  'basketball_euroleague': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Euroleague_Basketball_logo.svg/200px-Euroleague_Basketball_logo.svg.png',
  
  // ============================================
  // TENNIS (Grand Slams)
  // ============================================
  
  'ATP': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3f/ATP_Tour_logo.svg/200px-ATP_Tour_logo.svg.png',
  'WTA': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/WTA_logo_2010.svg/200px-WTA_logo_2010.svg.png',
  'Australian Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Australian_Open_Logo_2017.svg/200px-Australian_Open_Logo_2017.svg.png',
  'ATP Australian Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Australian_Open_Logo_2017.svg/200px-Australian_Open_Logo_2017.svg.png',
  'tennis_atp_aus_open': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Australian_Open_Logo_2017.svg/200px-Australian_Open_Logo_2017.svg.png',
  'French Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Logo_Roland-Garros.svg/200px-Logo_Roland-Garros.svg.png',
  'Roland Garros': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Logo_Roland-Garros.svg/200px-Logo_Roland-Garros.svg.png',
  'ATP French Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Logo_Roland-Garros.svg/200px-Logo_Roland-Garros.svg.png',
  'tennis_atp_french_open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Logo_Roland-Garros.svg/200px-Logo_Roland-Garros.svg.png',
  'Wimbledon': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Wimbledon.svg/200px-Wimbledon.svg.png',
  'ATP Wimbledon': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Wimbledon.svg/200px-Wimbledon.svg.png',
  'tennis_atp_wimbledon': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Wimbledon.svg/200px-Wimbledon.svg.png',
  'US Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/US_Open_%28tennis%29_logo.svg/200px-US_Open_%28tennis%29_logo.svg.png',
  'ATP US Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/US_Open_%28tennis%29_logo.svg/200px-US_Open_%28tennis%29_logo.svg.png',
  'tennis_atp_us_open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/US_Open_%28tennis%29_logo.svg/200px-US_Open_%28tennis%29_logo.svg.png',
  
  // ============================================
  // MMA/UFC
  // ============================================
  
  'UFC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UFC_Logo.svg/200px-UFC_Logo.svg.png',
  'MMA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UFC_Logo.svg/200px-UFC_Logo.svg.png',
  'UFC/MMA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UFC_Logo.svg/200px-UFC_Logo.svg.png',
  'mma_mixed_martial_arts': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UFC_Logo.svg/200px-UFC_Logo.svg.png',
  
  // ============================================
  // GOLF
  // ============================================
  
  'PGA': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/PGA_Tour_logo.svg/200px-PGA_Tour_logo.svg.png',
  'PGA Tour': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/PGA_Tour_logo.svg/200px-PGA_Tour_logo.svg.png',
  'golf_pga': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/PGA_Tour_logo.svg/200px-PGA_Tour_logo.svg.png',
  'Masters': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/Masters_Tournament_logo.svg/200px-Masters_Tournament_logo.svg.png',
  'The Masters': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/Masters_Tournament_logo.svg/200px-Masters_Tournament_logo.svg.png',
  
  // ============================================
  // RUGBY
  // ============================================
  
  'Six Nations': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Six_Nations_Championship_logo.svg/200px-Six_Nations_Championship_logo.svg.png',
  'rugby_union_six_nations': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Six_Nations_Championship_logo.svg/200px-Six_Nations_Championship_logo.svg.png',
  
  // ============================================
  // CRICKET
  // ============================================
  
  'IPL': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Official_Logo.svg/200px-Indian_Premier_League_Official_Logo.svg.png',
  'Indian Premier League': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Official_Logo.svg/200px-Indian_Premier_League_Official_Logo.svg.png',
  'cricket_ipl': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Official_Logo.svg/200px-Indian_Premier_League_Official_Logo.svg.png',
  
  // ============================================
  // AUSTRALIAN RULES
  // ============================================
  
  'AFL': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ad/AFL_logo.svg/200px-AFL_logo.svg.png',
  'aussierules_afl': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ad/AFL_logo.svg/200px-AFL_logo.svg.png',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Normalize sport name to lowercase key
 */
function normalizeSport(sport: string): string {
  const sportLower = sport.toLowerCase();
  
  // Soccer/Football - comprehensive matching for all leagues
  if (sportLower.includes('soccer')) return 'soccer';
  if (sportLower.includes('football') && !sportLower.includes('american')) return 'soccer';
  if (sportLower.includes('epl') || sportLower.includes('premier')) return 'soccer';
  if (sportLower.includes('la_liga') || sportLower.includes('laliga') || sportLower.includes('spain')) return 'soccer';
  if (sportLower.includes('serie_a') || sportLower.includes('italy')) return 'soccer';
  if (sportLower.includes('bundesliga') || sportLower.includes('germany')) return 'soccer';
  if (sportLower.includes('ligue') || sportLower.includes('france')) return 'soccer';
  if (sportLower.includes('champs_league') || sportLower.includes('europa') || sportLower.includes('uefa')) return 'soccer';
  if (sportLower.includes('eredivisie') || sportLower.includes('netherlands')) return 'soccer';
  if (sportLower.includes('primeira') || sportLower.includes('portugal')) return 'soccer';
  if (sportLower.includes('mls') || sportLower.includes('liga_mx') || sportLower.includes('mexico')) return 'soccer';
  if (sportLower.includes('a_league') || sportLower.includes('australia')) return 'soccer';
  if (sportLower.includes('j_league') || sportLower.includes('japan')) return 'soccer';
  if (sportLower.includes('brazil') || sportLower.includes('argentina')) return 'soccer';
  if (sportLower.includes('scottish') || sportLower.includes('championship') || sportLower.includes('fa_cup')) return 'soccer';
  if (sportLower.includes('turkey') || sportLower.includes('belgium') || sportLower.includes('swiss')) return 'soccer';
  
  // Basketball
  if (sportLower.includes('basketball') || sportLower === 'nba' || sportLower.includes('euroleague')) return 'nba';
  if (sportLower.includes('ncaab')) return 'nba';
  
  // Hockey
  if (sportLower.includes('hockey') || sportLower === 'nhl' || sportLower.includes('icehockey')) return 'nhl';
  
  // American Football
  if (sportLower.includes('american') || sportLower === 'nfl' || sportLower.includes('ncaaf')) return 'nfl';
  
  // Baseball
  if (sportLower.includes('baseball') || sportLower === 'mlb') return 'mlb';
  
  // MMA/UFC
  if (sportLower.includes('mma') || sportLower.includes('ufc')) return 'mma';
  
  // Tennis
  if (sportLower.includes('tennis') || sportLower.includes('atp') || sportLower.includes('wta')) return 'tennis';
  
  // Golf
  if (sportLower.includes('golf') || sportLower.includes('pga')) return 'golf';
  
  return sportLower;
}

/**
 * Generate a consistent color from team name
 */
function getTeamColor(teamName: string): string {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 45%)`;
}

/**
 * Get team initials (up to 3 chars)
 */
function getTeamInitials(teamName: string): string {
  const words = teamName.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

/**
 * Generate SVG data URL for fallback avatar
 */
function generateFallbackLogo(name: string, type: 'team' | 'league' = 'team'): string {
  const initials = getTeamInitials(name);
  const color = getTeamColor(name);
  const bgColor = type === 'league' ? '#1a1a2e' : color;
  const textColor = type === 'league' ? color : '#ffffff';
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="12" fill="${bgColor}"/>
      <text x="50" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get team logo URL
 * 
 * @param teamName - Full team name (e.g., "Los Angeles Lakers")
 * @param sport - Sport type (e.g., "nba", "soccer", "nfl")
 * @param league - Optional league name for more specific matching
 * @returns Logo URL (ESPN, API-Sports, or fallback SVG)
 */
export function getTeamLogo(teamName: string, sport: string, league?: string): string {
  const normalizedSport = normalizeSport(sport);
  const cleanName = teamName.trim();
  
  // Try ESPN for US sports (NBA, NFL, NHL, MLB)
  if (['nba', 'nfl', 'nhl', 'mlb'].includes(normalizedSport)) {
    const espnIds = ESPN_TEAM_IDS[normalizedSport];
    if (espnIds) {
      // Try exact match first
      if (espnIds[cleanName]) {
        return `https://a.espncdn.com/i/teamlogos/${normalizedSport}/500/${espnIds[cleanName]}.png`;
      }
      // Try case-insensitive exact match
      const exactKey = Object.keys(espnIds).find(key => 
        key.toLowerCase() === cleanName.toLowerCase()
      );
      if (exactKey) {
        return `https://a.espncdn.com/i/teamlogos/${normalizedSport}/500/${espnIds[exactKey]}.png`;
      }
      // Try partial match - team name contains key or key contains team name
      const partialKey = Object.keys(espnIds).find(key => 
        key.toLowerCase().includes(cleanName.toLowerCase()) ||
        cleanName.toLowerCase().includes(key.toLowerCase())
      );
      if (partialKey) {
        return `https://a.espncdn.com/i/teamlogos/${normalizedSport}/500/${espnIds[partialKey]}.png`;
      }
      // Try matching just the main part (e.g., "Lakers" from "Los Angeles Lakers")
      const teamWords = cleanName.split(/\s+/);
      for (const word of teamWords) {
        if (word.length >= 4) { // Skip short words like "FC", "LA", etc.
          const wordMatch = Object.keys(espnIds).find(key =>
            key.toLowerCase().includes(word.toLowerCase())
          );
          if (wordMatch) {
            return `https://a.espncdn.com/i/teamlogos/${normalizedSport}/500/${espnIds[wordMatch]}.png`;
          }
        }
      }
    }
  }
  
  // Try football-data.org for soccer (official logos, no auth required)
  if (normalizedSport === 'soccer') {
    // Try exact match
    if (SOCCER_TEAM_LOGOS[cleanName]) {
      return SOCCER_TEAM_LOGOS[cleanName];
    }
    // Try case-insensitive exact match
    const exactKey = Object.keys(SOCCER_TEAM_LOGOS).find(key => 
      key.toLowerCase() === cleanName.toLowerCase()
    );
    if (exactKey) {
      return SOCCER_TEAM_LOGOS[exactKey];
    }
    // Try partial match
    const partialKey = Object.keys(SOCCER_TEAM_LOGOS).find(key => 
      key.toLowerCase().includes(cleanName.toLowerCase()) ||
      cleanName.toLowerCase().includes(key.toLowerCase())
    );
    if (partialKey) {
      return SOCCER_TEAM_LOGOS[partialKey];
    }
    // Try matching individual words (e.g., "Arsenal" from "Arsenal FC")
    const teamWords = cleanName.split(/\s+/);
    for (const word of teamWords) {
      if (word.length >= 4 && word.toLowerCase() !== 'city' && word.toLowerCase() !== 'united') {
        const wordMatch = Object.keys(SOCCER_TEAM_LOGOS).find(key =>
          key.toLowerCase() === word.toLowerCase() ||
          key.toLowerCase().startsWith(word.toLowerCase())
        );
        if (wordMatch) {
          return SOCCER_TEAM_LOGOS[wordMatch];
        }
      }
    }
  }
  
  // Fallback to generated avatar
  return generateFallbackLogo(cleanName, 'team');
}

/**
 * Get league logo URL
 * 
 * @param leagueName - League name (e.g., "Premier League", "NBA")
 * @param sport - Sport type for better matching
 * @returns Logo URL or fallback SVG
 */
export function getLeagueLogo(leagueName: string, sport?: string): string {
  // Try exact match
  if (LEAGUE_LOGOS[leagueName]) {
    return LEAGUE_LOGOS[leagueName];
  }
  
  // Try partial match
  const leagueKey = Object.keys(LEAGUE_LOGOS).find(key => 
    key.toLowerCase().includes(leagueName.toLowerCase()) ||
    leagueName.toLowerCase().includes(key.toLowerCase())
  );
  if (leagueKey) {
    return LEAGUE_LOGOS[leagueKey];
  }
  
  // Check sport for default league logo
  const normalizedSport = sport ? normalizeSport(sport) : '';
  if (normalizedSport === 'nba') return LEAGUE_LOGOS['NBA'];
  if (normalizedSport === 'nfl') return LEAGUE_LOGOS['NFL'];
  if (normalizedSport === 'nhl') return LEAGUE_LOGOS['NHL'];
  
  // Fallback
  return generateFallbackLogo(leagueName, 'league');
}

/**
 * Logo component props helper
 * Returns props object ready for Next.js Image or img tag
 */
export function getLogoProps(
  name: string, 
  type: 'team' | 'league',
  sport: string,
  league?: string
): { src: string; alt: string; fallback: string } {
  const src = type === 'team' 
    ? getTeamLogo(name, sport, league)
    : getLeagueLogo(name, sport);
  
  return {
    src,
    alt: `${name} logo`,
    fallback: generateFallbackLogo(name, type),
  };
}
