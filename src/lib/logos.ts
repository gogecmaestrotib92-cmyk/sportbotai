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
    'Utah Jazz': 'utah', 'Jazz': 'utah', 'UTA': 'utah',
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
  // Additional La Liga / Segunda Division teams
  'Elche': 'https://crests.football-data.org/285.png',
  'Elche CF': 'https://crests.football-data.org/285.png',
  'Elche Club de Futbol': 'https://crests.football-data.org/285.png',
  'Levante': 'https://crests.football-data.org/88.png',
  'Levante UD': 'https://crests.football-data.org/88.png',
  'Levante Union Deportiva': 'https://crests.football-data.org/88.png',
  'Oviedo': 'https://a.espncdn.com/i/teamlogos/soccer/500/3842.png',
  'Real Oviedo': 'https://a.espncdn.com/i/teamlogos/soccer/500/3842.png',
  'Real Oviedo SAD': 'https://a.espncdn.com/i/teamlogos/soccer/500/3842.png',
  'Cadiz': 'https://crests.football-data.org/264.png',
  'Cadiz CF': 'https://crests.football-data.org/264.png',
  'Cádiz': 'https://crests.football-data.org/264.png',
  'Cádiz CF': 'https://crests.football-data.org/264.png',
  'Granada': 'https://crests.football-data.org/83.png',
  'Granada CF': 'https://crests.football-data.org/83.png',
  'Almeria': 'https://crests.football-data.org/267.png',
  'UD Almeria': 'https://crests.football-data.org/267.png',
  'Almería': 'https://crests.football-data.org/267.png',
  'Tenerife': 'https://crests.football-data.org/261.png',
  'CD Tenerife': 'https://crests.football-data.org/261.png',
  'Sporting Gijon': 'https://crests.football-data.org/91.png',
  'Sporting de Gijon': 'https://crests.football-data.org/91.png',
  'Sporting Gijón': 'https://crests.football-data.org/91.png',
  'Racing Santander': 'https://crests.football-data.org/260.png',
  'Racing': 'https://crests.football-data.org/260.png',
  'Eibar': 'https://crests.football-data.org/278.png',
  'SD Eibar': 'https://crests.football-data.org/278.png',
  'Huesca': 'https://crests.football-data.org/299.png',
  'SD Huesca': 'https://crests.football-data.org/299.png',
  'Zaragoza': 'https://crests.football-data.org/93.png',
  'Real Zaragoza': 'https://crests.football-data.org/93.png',
  
  // ============================================
  // SERIE A (Italy) - All name variations
  // ============================================
  'Juventus': 'https://media.api-sports.io/football/teams/496.png',
  'Juventus FC': 'https://media.api-sports.io/football/teams/496.png',
  'Juventus Turin': 'https://media.api-sports.io/football/teams/496.png',
  'Juve': 'https://media.api-sports.io/football/teams/496.png',
  'Inter': 'https://media.api-sports.io/football/teams/505.png',
  'Inter Milan': 'https://media.api-sports.io/football/teams/505.png',
  'Internazionale': 'https://media.api-sports.io/football/teams/505.png',
  'FC Internazionale Milano': 'https://media.api-sports.io/football/teams/505.png',
  'Internazionale Milano': 'https://media.api-sports.io/football/teams/505.png',
  'Inter Milano': 'https://media.api-sports.io/football/teams/505.png',
  'FC Inter': 'https://media.api-sports.io/football/teams/505.png',
  'AC Milan': 'https://media.api-sports.io/football/teams/489.png',
  'Milan': 'https://media.api-sports.io/football/teams/489.png',
  'AC Milan FC': 'https://media.api-sports.io/football/teams/489.png',
  'AC Milano': 'https://media.api-sports.io/football/teams/489.png',
  'Associazione Calcio Milan': 'https://media.api-sports.io/football/teams/489.png',
  'Rossoneri': 'https://media.api-sports.io/football/teams/489.png',
  'Napoli': 'https://media.api-sports.io/football/teams/492.png',
  'SSC Napoli': 'https://media.api-sports.io/football/teams/492.png',
  'Societa Sportiva Calcio Napoli': 'https://media.api-sports.io/football/teams/492.png',
  'Napoles': 'https://media.api-sports.io/football/teams/492.png',
  'Roma': 'https://media.api-sports.io/football/teams/497.png',
  'AS Roma': 'https://media.api-sports.io/football/teams/497.png',
  'Associazione Sportiva Roma': 'https://media.api-sports.io/football/teams/497.png',
  'AS Rome': 'https://media.api-sports.io/football/teams/497.png',
  'Lazio': 'https://media.api-sports.io/football/teams/487.png',
  'SS Lazio': 'https://media.api-sports.io/football/teams/487.png',
  'Societa Sportiva Lazio': 'https://media.api-sports.io/football/teams/487.png',
  'S.S. Lazio': 'https://media.api-sports.io/football/teams/487.png',
  'Atalanta': 'https://media.api-sports.io/football/teams/499.png',
  'Atalanta BC': 'https://media.api-sports.io/football/teams/499.png',
  'Atalanta Bergamo': 'https://media.api-sports.io/football/teams/499.png',
  'Atalanta Bergamasca Calcio': 'https://media.api-sports.io/football/teams/499.png',
  'Fiorentina': 'https://media.api-sports.io/football/teams/502.png',
  'ACF Fiorentina': 'https://media.api-sports.io/football/teams/502.png',
  'AC Fiorentina': 'https://media.api-sports.io/football/teams/502.png',
  'Viola': 'https://media.api-sports.io/football/teams/502.png',
  'Bologna': 'https://media.api-sports.io/football/teams/500.png',
  'Bologna FC': 'https://media.api-sports.io/football/teams/500.png',
  'Bologna FC 1909': 'https://media.api-sports.io/football/teams/500.png',
  'Torino': 'https://media.api-sports.io/football/teams/503.png',
  'Torino FC': 'https://media.api-sports.io/football/teams/503.png',
  'Turin': 'https://media.api-sports.io/football/teams/503.png',
  'Torino Football Club': 'https://media.api-sports.io/football/teams/503.png',
  'Udinese': 'https://media.api-sports.io/football/teams/494.png',
  'Udinese Calcio': 'https://media.api-sports.io/football/teams/494.png',
  'Genoa': 'https://media.api-sports.io/football/teams/495.png',
  'Genoa CFC': 'https://media.api-sports.io/football/teams/495.png',
  'Genoa Cricket and Football Club': 'https://media.api-sports.io/football/teams/495.png',
  'Genova': 'https://media.api-sports.io/football/teams/495.png',
  'Cagliari': 'https://media.api-sports.io/football/teams/490.png',
  'Cagliari Calcio': 'https://media.api-sports.io/football/teams/490.png',
  'Empoli': 'https://media.api-sports.io/football/teams/511.png',
  'Empoli FC': 'https://media.api-sports.io/football/teams/511.png',
  'Empoli Football Club': 'https://media.api-sports.io/football/teams/511.png',
  'Hellas Verona': 'https://media.api-sports.io/football/teams/504.png',
  'Verona': 'https://media.api-sports.io/football/teams/504.png',
  'Hellas Verona FC': 'https://media.api-sports.io/football/teams/504.png',
  'Sassuolo': 'https://media.api-sports.io/football/teams/488.png',
  'US Sassuolo': 'https://media.api-sports.io/football/teams/488.png',
  'US Sassuolo Calcio': 'https://media.api-sports.io/football/teams/488.png',
  'Lecce': 'https://media.api-sports.io/football/teams/867.png',
  'US Lecce': 'https://media.api-sports.io/football/teams/867.png',
  'Unione Sportiva Lecce': 'https://media.api-sports.io/football/teams/867.png',
  'Monza': 'https://media.api-sports.io/football/teams/1579.png',
  'AC Monza': 'https://media.api-sports.io/football/teams/1579.png',
  'Monza FC': 'https://media.api-sports.io/football/teams/1579.png',
  'AC Monza-Brianza': 'https://media.api-sports.io/football/teams/1579.png',
  'Parma': 'https://media.api-sports.io/football/teams/523.png',
  'Parma Calcio': 'https://media.api-sports.io/football/teams/523.png',
  'Parma Calcio 1913': 'https://media.api-sports.io/football/teams/523.png',
  'Parma FC': 'https://media.api-sports.io/football/teams/523.png',
  'Como': 'https://media.api-sports.io/football/teams/895.png',
  'Como 1907': 'https://media.api-sports.io/football/teams/895.png',
  'Como FC': 'https://media.api-sports.io/football/teams/895.png',
  'Calcio Como': 'https://media.api-sports.io/football/teams/895.png',
  'Venezia': 'https://media.api-sports.io/football/teams/517.png',
  'Venezia FC': 'https://media.api-sports.io/football/teams/517.png',
  'Venice': 'https://media.api-sports.io/football/teams/517.png',
  'Venezia Football Club': 'https://media.api-sports.io/football/teams/517.png',
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
  // Additional Serie B / Italian teams
  'Pisa': 'https://media.api-sports.io/football/teams/515.png',
  'AC Pisa': 'https://media.api-sports.io/football/teams/515.png',
  'Pisa SC': 'https://media.api-sports.io/football/teams/515.png',
  'Pisa Sporting Club': 'https://media.api-sports.io/football/teams/515.png',
  'Brescia': 'https://crests.football-data.org/450.png',
  'Brescia Calcio': 'https://crests.football-data.org/450.png',
  'Bari': 'https://crests.football-data.org/456.png',
  'SSC Bari': 'https://crests.football-data.org/456.png',
  'Palermo': 'https://crests.football-data.org/484.png',
  'US Palermo': 'https://crests.football-data.org/484.png',
  'Reggina': 'https://crests.football-data.org/462.png',
  'Reggina Calcio': 'https://crests.football-data.org/462.png',
  'Catanzaro': 'https://crests.football-data.org/7628.png',
  'US Catanzaro': 'https://crests.football-data.org/7628.png',
  'Modena': 'https://crests.football-data.org/461.png',
  'Modena FC': 'https://crests.football-data.org/461.png',
  'Cosenza': 'https://crests.football-data.org/459.png',
  'Cosenza Calcio': 'https://crests.football-data.org/459.png',
  'SPAL': 'https://crests.football-data.org/490.png',
  'SPAL 2013': 'https://crests.football-data.org/490.png',
  'Sudtirol': 'https://crests.football-data.org/10031.png',
  'FC Sudtirol': 'https://crests.football-data.org/10031.png',
  'Cittadella': 'https://crests.football-data.org/477.png',
  'AS Cittadella': 'https://crests.football-data.org/477.png',
  
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
  // Additional Bundesliga 2 / German teams
  'Hamburger SV': 'https://crests.football-data.org/7.png',
  'Hamburg': 'https://crests.football-data.org/7.png',
  'HSV': 'https://crests.football-data.org/7.png',
  '1. FC Köln': 'https://crests.football-data.org/1.png',
  'FC Köln': 'https://crests.football-data.org/1.png',
  'Köln': 'https://crests.football-data.org/1.png',
  'Koln': 'https://crests.football-data.org/1.png',
  'Cologne': 'https://crests.football-data.org/1.png',
  'FC Cologne': 'https://crests.football-data.org/1.png',
  'Greuther Fürth': 'https://crests.football-data.org/21.png',
  'SpVgg Greuther Fürth': 'https://crests.football-data.org/21.png',
  'Greuther Furth': 'https://crests.football-data.org/21.png',
  'Fürth': 'https://crests.football-data.org/21.png',
  'Furth': 'https://crests.football-data.org/21.png',
  'Hertha Berlin': 'https://crests.football-data.org/9.png',
  'Hertha BSC': 'https://crests.football-data.org/9.png',
  'Hertha': 'https://crests.football-data.org/9.png',
  'Hertha BSC Berlin': 'https://crests.football-data.org/9.png',
  'SSV Ulm 1846': 'https://crests.football-data.org/10044.png',
  'SSV Ulm': 'https://crests.football-data.org/10044.png',
  'Ulm': 'https://crests.football-data.org/10044.png',
  'VfL Osnabrück': 'https://crests.football-data.org/37.png',
  'Osnabrück': 'https://crests.football-data.org/37.png',
  'Osnabrueck': 'https://crests.football-data.org/37.png',
  'Schalke': 'https://crests.football-data.org/6.png',
  'FC Schalke 04': 'https://crests.football-data.org/6.png',
  'Schalke 04': 'https://crests.football-data.org/6.png',
  'S04': 'https://crests.football-data.org/6.png',
  'Fortuna Düsseldorf': 'https://crests.football-data.org/38.png',
  'Düsseldorf': 'https://crests.football-data.org/38.png',
  'Dusseldorf': 'https://crests.football-data.org/38.png',
  'Fortuna Dusseldorf': 'https://crests.football-data.org/38.png',
  'Hannover 96': 'https://crests.football-data.org/8.png',
  'Hannover': 'https://crests.football-data.org/8.png',
  '1. FC Nürnberg': 'https://crests.football-data.org/14.png',
  'Nürnberg': 'https://crests.football-data.org/14.png',
  'Nurnberg': 'https://crests.football-data.org/14.png',
  'Nuremberg': 'https://crests.football-data.org/14.png',
  '1. FC Kaiserslautern': 'https://crests.football-data.org/30.png',
  'Kaiserslautern': 'https://crests.football-data.org/30.png',
  'FCK': 'https://crests.football-data.org/30.png',
  'Karlsruher SC': 'https://crests.football-data.org/24.png',
  'Karlsruhe': 'https://crests.football-data.org/24.png',
  'KSC': 'https://crests.football-data.org/24.png',
  'SV Darmstadt 98': 'https://crests.football-data.org/55.png',
  'Darmstadt': 'https://crests.football-data.org/55.png',
  'SC Paderborn 07': 'https://crests.football-data.org/31.png',
  'Paderborn': 'https://crests.football-data.org/31.png',
  'Eintracht Braunschweig': 'https://crests.football-data.org/35.png',
  'Braunschweig': 'https://crests.football-data.org/35.png',
  'Magdeburg': 'https://crests.football-data.org/39.png',
  '1. FC Magdeburg': 'https://crests.football-data.org/39.png',
  
  // ============================================
  // LIGUE 1 (France)
  // ============================================
  'Paris Saint-Germain': 'https://crests.football-data.org/524.png',
  'PSG': 'https://crests.football-data.org/524.png',
  'Paris SG': 'https://crests.football-data.org/524.png',
  'Paris Saint Germain': 'https://crests.football-data.org/524.png',
  'Paris FC': 'https://media.api-sports.io/football/teams/1063.png',  // Ligue 2 team, NOT PSG
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
  // Additional Ligue 1 / Ligue 2 teams
  'Metz': 'https://crests.football-data.org/545.png',
  'FC Metz': 'https://crests.football-data.org/545.png',
  'Lorient': 'https://crests.football-data.org/525.png',
  'FC Lorient': 'https://crests.football-data.org/525.png',
  'Pau FC': 'https://crests.football-data.org/10054.png',
  'Pau': 'https://crests.football-data.org/10054.png',
  'Amiens': 'https://crests.football-data.org/533.png',
  'Amiens SC': 'https://crests.football-data.org/533.png',
  'Annecy FC': 'https://crests.football-data.org/10055.png',
  'Annecy': 'https://crests.football-data.org/10055.png',
  'FC Annecy': 'https://crests.football-data.org/10055.png',
  'Le Mans FC': 'https://crests.football-data.org/1091.png',
  'Le Mans': 'https://crests.football-data.org/1091.png',
  'Caen': 'https://crests.football-data.org/514.png',
  'SM Caen': 'https://crests.football-data.org/514.png',
  'Stade Malherbe Caen': 'https://crests.football-data.org/514.png',
  'Bordeaux': 'https://crests.football-data.org/526.png',
  'Girondins de Bordeaux': 'https://crests.football-data.org/526.png',
  'FC Girondins de Bordeaux': 'https://crests.football-data.org/526.png',
  'Guingamp': 'https://crests.football-data.org/538.png',
  'EA Guingamp': 'https://crests.football-data.org/538.png',
  'Dijon': 'https://crests.football-data.org/540.png',
  'Dijon FCO': 'https://crests.football-data.org/540.png',
  'Troyes': 'https://crests.football-data.org/531.png',
  'ES Troyes AC': 'https://crests.football-data.org/531.png',
  'Troyes AC': 'https://crests.football-data.org/531.png',
  'Clermont': 'https://crests.football-data.org/541.png',
  'Clermont Foot': 'https://crests.football-data.org/541.png',
  'Clermont Foot 63': 'https://crests.football-data.org/541.png',
  
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
  // UEFA CHAMPIONS LEAGUE / EUROPA LEAGUE TEAMS
  // ============================================
  'FC Copenhagen': 'https://crests.football-data.org/1878.png',
  'Copenhagen': 'https://crests.football-data.org/1878.png',
  'København': 'https://crests.football-data.org/1878.png',
  'FC Kairat': 'https://crests.football-data.org/1878.png',
  'Kairat': 'https://crests.football-data.org/1878.png',
  'Kairat Almaty': 'https://crests.football-data.org/1878.png',
  'Bodø/Glimt': 'https://crests.football-data.org/7462.png',
  'Bodo/Glimt': 'https://crests.football-data.org/7462.png',
  'FK Bodø/Glimt': 'https://crests.football-data.org/7462.png',
  'Bodo Glimt': 'https://crests.football-data.org/7462.png',
  'Galatasaray': 'https://crests.football-data.org/610.png',
  'Galatasaray SK': 'https://crests.football-data.org/610.png',
  'Galatasaray Istanbul': 'https://crests.football-data.org/610.png',
  'Qarabağ FK': 'https://crests.football-data.org/1878.png',
  'Qarabag FK': 'https://crests.football-data.org/1878.png',
  'Qarabag': 'https://crests.football-data.org/1878.png',
  'Qarabağ': 'https://crests.football-data.org/1878.png',
  'Slavia Praha': 'https://crests.football-data.org/1884.png',
  'Slavia Prague': 'https://crests.football-data.org/1884.png',
  'SK Slavia Praha': 'https://crests.football-data.org/1884.png',
  'Slavia': 'https://crests.football-data.org/1884.png',
  'Pafos FC': 'https://crests.football-data.org/1878.png',
  'Pafos': 'https://crests.football-data.org/1878.png',
  'Olympiakos': 'https://crests.football-data.org/1878.png',
  'Olympiacos': 'https://crests.football-data.org/1878.png',
  'Olympiacos Piraeus': 'https://crests.football-data.org/1878.png',
  'Olympiakos Piraeus': 'https://crests.football-data.org/1878.png',
  'Olympiacos FC': 'https://crests.football-data.org/1878.png',
  // Additional CL teams
  'Slovan Bratislava': 'https://media.api-sports.io/football/teams/577.png',
  'SK Slovan Bratislava': 'https://media.api-sports.io/football/teams/577.png',
  'Dinamo Zagreb': 'https://media.api-sports.io/football/teams/620.png',
  'GNK Dinamo Zagreb': 'https://media.api-sports.io/football/teams/620.png',
  'Shakhtar Donetsk': 'https://media.api-sports.io/football/teams/571.png',
  'Shakhtar': 'https://media.api-sports.io/football/teams/571.png',
  'FC Shakhtar Donetsk': 'https://media.api-sports.io/football/teams/571.png',
  'Club Brugge': 'https://media.api-sports.io/football/teams/569.png',
  'Club Brugge KV': 'https://media.api-sports.io/football/teams/569.png',
  'Brugge': 'https://media.api-sports.io/football/teams/569.png',
  'Sturm Graz': 'https://media.api-sports.io/football/teams/2269.png',
  'SK Sturm Graz': 'https://media.api-sports.io/football/teams/2269.png',
  'Red Bull Salzburg': 'https://media.api-sports.io/football/teams/571.png',
  'RB Salzburg': 'https://media.api-sports.io/football/teams/571.png',
  'FC Salzburg': 'https://media.api-sports.io/football/teams/571.png',
  'Salzburg': 'https://media.api-sports.io/football/teams/571.png',
  'Young Boys': 'https://media.api-sports.io/football/teams/1428.png',
  'BSC Young Boys': 'https://media.api-sports.io/football/teams/1428.png',
  'YB Bern': 'https://media.api-sports.io/football/teams/1428.png',
  'Crvena Zvezda Belgrade': 'https://media.api-sports.io/football/teams/574.png',
  'Red Star Belgrade Football': 'https://media.api-sports.io/football/teams/574.png',
  'FK Crvena Zvezda': 'https://media.api-sports.io/football/teams/574.png',
  'Girona Football': 'https://media.api-sports.io/football/teams/547.png',
  
  // ============================================
  // TURKISH SUPER LIG
  // ============================================
  'Fenerbahce': 'https://crests.football-data.org/612.png',
  'Fenerbahçe': 'https://crests.football-data.org/612.png',
  'Fenerbahce SK': 'https://crests.football-data.org/612.png',
  'Besiktas': 'https://crests.football-data.org/611.png',
  'Beşiktaş': 'https://crests.football-data.org/611.png',
  'Besiktas JK': 'https://crests.football-data.org/611.png',
  'Trabzonspor': 'https://crests.football-data.org/616.png',
  'Istanbul Basaksehir': 'https://crests.football-data.org/15005.png',
  'Basaksehir': 'https://crests.football-data.org/15005.png',
  'Kasimpasa SK': 'https://crests.football-data.org/618.png',
  'Kasimpasa': 'https://crests.football-data.org/618.png',
  'Kasımpaşa': 'https://crests.football-data.org/618.png',
  'Genclerbirligi SK': 'https://crests.football-data.org/621.png',
  'Genclerbirligi': 'https://crests.football-data.org/621.png',
  'Gençlerbirliği': 'https://crests.football-data.org/621.png',
  'Antalyaspor': 'https://crests.football-data.org/620.png',
  'Konyaspor': 'https://crests.football-data.org/619.png',
  'Sivasspor': 'https://crests.football-data.org/617.png',
  'Alanyaspor': 'https://crests.football-data.org/6804.png',
  
  // ============================================
  // A-LEAGUE (Australia & New Zealand) - football-data.org
  // ============================================
  'Central Coast Mariners': 'https://crests.football-data.org/7176.png',
  'Central Coast': 'https://crests.football-data.org/7176.png',
  'CCM': 'https://crests.football-data.org/7176.png',
  'Auckland FC': 'https://crests.football-data.org/7176.png',
  'Auckland': 'https://crests.football-data.org/7176.png',
  'Sydney FC': 'https://crests.football-data.org/7173.png',
  'Sydney': 'https://crests.football-data.org/7173.png',
  'Melbourne Victory': 'https://crests.football-data.org/7174.png',
  'Melbourne City': 'https://crests.football-data.org/7869.png',
  'Western Sydney Wanderers': 'https://crests.football-data.org/7175.png',
  'Brisbane Roar': 'https://crests.football-data.org/7171.png',
  'Adelaide United': 'https://crests.football-data.org/7170.png',
  'Perth Glory': 'https://crests.football-data.org/7172.png',
  'Wellington Phoenix': 'https://crests.football-data.org/7177.png',
  'Newcastle Jets': 'https://crests.football-data.org/7179.png',
  'Macarthur FC': 'https://crests.football-data.org/7176.png',
  'Western United': 'https://crests.football-data.org/7176.png',
  
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
  'Inter Miami': 'https://media.api-sports.io/football/teams/9997.png',
  'Inter Miami CF': 'https://media.api-sports.io/football/teams/9997.png',
  'Miami': 'https://media.api-sports.io/football/teams/9997.png',
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
  'Toronto FC': 'https://media.api-sports.io/football/teams/1601.png',
  'Toronto': 'https://media.api-sports.io/football/teams/1601.png',
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
  'Houston Dynamo': 'https://media.api-sports.io/football/teams/1600.png',
  'Houston Dynamo FC': 'https://media.api-sports.io/football/teams/1600.png',
  'Dynamo': 'https://media.api-sports.io/football/teams/1600.png',
  'FC Dallas': 'https://media.api-sports.io/football/teams/1596.png',
  'Dallas': 'https://media.api-sports.io/football/teams/1596.png',
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
  // LIGA MX (Mexico) - using football-data.org IDs
  // ============================================
  'Club America': 'https://crests.football-data.org/6129.png',
  'America': 'https://crests.football-data.org/6129.png',
  'América': 'https://crests.football-data.org/6129.png',
  'Chivas': 'https://crests.football-data.org/6130.png',
  'Guadalajara': 'https://crests.football-data.org/6130.png',
  'CD Guadalajara': 'https://crests.football-data.org/6130.png',
  'Cruz Azul': 'https://crests.football-data.org/6134.png',
  'Monterrey': 'https://crests.football-data.org/6126.png',
  'CF Monterrey': 'https://crests.football-data.org/6126.png',
  'Rayados': 'https://crests.football-data.org/6126.png',
  'Tigres UANL': 'https://crests.football-data.org/6125.png',
  'Tigres': 'https://crests.football-data.org/6125.png',
  'Pumas UNAM': 'https://crests.football-data.org/6132.png',
  'Pumas': 'https://crests.football-data.org/6132.png',
  'Santos Laguna': 'https://crests.football-data.org/6128.png',
  'Santos': 'https://crests.football-data.org/6128.png',
  'Leon': 'https://crests.football-data.org/6133.png',
  'Club Leon': 'https://crests.football-data.org/6133.png',
  'León': 'https://crests.football-data.org/6133.png',
  'Toluca': 'https://crests.football-data.org/6135.png',
  'Deportivo Toluca': 'https://crests.football-data.org/6135.png',
  'Pachuca': 'https://crests.football-data.org/6127.png',
  'CF Pachuca': 'https://crests.football-data.org/6127.png',
  'Tijuana': 'https://crests.football-data.org/6131.png',
  'Club Tijuana': 'https://crests.football-data.org/6131.png',
  'Xolos': 'https://crests.football-data.org/6131.png',
  'Atlas': 'https://crests.football-data.org/6136.png',
  'Atlas FC': 'https://crests.football-data.org/6136.png',
  'Necaxa': 'https://crests.football-data.org/6137.png',
  'Club Necaxa': 'https://crests.football-data.org/6137.png',
  'Puebla': 'https://crests.football-data.org/6138.png',
  'Club Puebla': 'https://crests.football-data.org/6138.png',
  'Queretaro': 'https://crests.football-data.org/6139.png',
  'Querétaro': 'https://crests.football-data.org/6139.png',
  'FC Juarez': 'https://crests.football-data.org/6140.png',
  'Juarez': 'https://crests.football-data.org/6140.png',
  'Juárez': 'https://crests.football-data.org/6140.png',
  'Mazatlan': 'https://crests.football-data.org/6141.png',
  'Mazatlán FC': 'https://crests.football-data.org/6141.png',
};

/**
 * European Basketball team logo mappings (Euroleague, EuroCup, etc.)
 * Using ESPN CDN for reliable logos
 */
const BASKETBALL_TEAM_LOGOS: Record<string, string> = {
  // ============================================
  // EUROLEAGUE TEAMS (using api-sports.io basketball CDN)
  // ============================================
  'Real Madrid Baloncesto': 'https://media.api-sports.io/basketball/teams/119.png',
  'Real Madrid Basketball': 'https://media.api-sports.io/basketball/teams/119.png',
  'Real Madrid': 'https://media.api-sports.io/basketball/teams/119.png',
  'FC Barcelona Basket': 'https://media.api-sports.io/basketball/teams/120.png',
  'FC Barcelona Basketball': 'https://media.api-sports.io/basketball/teams/120.png',
  'FC Barcelona': 'https://media.api-sports.io/basketball/teams/120.png',
  'FC Barcelona Bàsquet': 'https://media.api-sports.io/basketball/teams/120.png',
  'Barcelona Basket': 'https://media.api-sports.io/basketball/teams/120.png',
  'Barcelona Basketball': 'https://media.api-sports.io/basketball/teams/120.png',
  'Barcelona': 'https://media.api-sports.io/basketball/teams/120.png',
  'Olympiacos': 'https://media.api-sports.io/basketball/teams/135.png',
  'Olympiacos BC': 'https://media.api-sports.io/basketball/teams/135.png',
  'Olympiacos Piraeus': 'https://media.api-sports.io/basketball/teams/135.png',
  'Olympiakos': 'https://media.api-sports.io/basketball/teams/135.png',
  'Olympiakos BC': 'https://media.api-sports.io/basketball/teams/135.png',
  'Panathinaikos': 'https://media.api-sports.io/basketball/teams/121.png',
  'Panathinaikos BC': 'https://media.api-sports.io/basketball/teams/121.png',
  'Panathinaikos Athens': 'https://media.api-sports.io/basketball/teams/121.png',
  'Panathinaikos AKTOR Athens': 'https://media.api-sports.io/basketball/teams/121.png',
  'Fenerbahce': 'https://media.api-sports.io/basketball/teams/122.png',
  'Fenerbahce SK': 'https://media.api-sports.io/basketball/teams/122.png',
  'Fenerbahce Basketball': 'https://media.api-sports.io/basketball/teams/122.png',
  'Fenerbahce Beko': 'https://media.api-sports.io/basketball/teams/122.png',
  'Fenerbahce Beko Istanbul': 'https://media.api-sports.io/basketball/teams/122.png',
  'Fenerbahçe': 'https://media.api-sports.io/basketball/teams/122.png',
  'Fenerbahçe SK': 'https://media.api-sports.io/basketball/teams/122.png',
  'Anadolu Efes': 'https://media.api-sports.io/basketball/teams/123.png',
  'Anadolu Efes Istanbul': 'https://media.api-sports.io/basketball/teams/123.png',
  'Efes Istanbul': 'https://media.api-sports.io/basketball/teams/123.png',
  'Efes': 'https://media.api-sports.io/basketball/teams/123.png',
  'CSKA Moscow': 'https://media.api-sports.io/basketball/teams/130.png',
  'CSKA': 'https://media.api-sports.io/basketball/teams/130.png',
  'Maccabi Tel Aviv': 'https://media.api-sports.io/basketball/teams/124.png',
  'Maccabi': 'https://media.api-sports.io/basketball/teams/124.png',
  'Maccabi Playtika Tel Aviv': 'https://media.api-sports.io/basketball/teams/124.png',
  'Bayern Munich Basketball': 'https://media.api-sports.io/basketball/teams/117.png',
  'Bayern München Basketball': 'https://media.api-sports.io/basketball/teams/117.png',
  'FC Bayern Munich': 'https://media.api-sports.io/basketball/teams/117.png',
  'FC Bayern München': 'https://media.api-sports.io/basketball/teams/117.png',
  'FC Bayern Basketball': 'https://media.api-sports.io/basketball/teams/117.png',
  'Bayern Munich': 'https://media.api-sports.io/basketball/teams/117.png',
  'Bayern München': 'https://media.api-sports.io/basketball/teams/117.png',
  'Alba Berlin': 'https://media.api-sports.io/basketball/teams/116.png',
  'ALBA Berlin': 'https://media.api-sports.io/basketball/teams/116.png',
  'Zalgiris Kaunas': 'https://media.api-sports.io/basketball/teams/141.png',
  'Zalgiris': 'https://media.api-sports.io/basketball/teams/141.png',
  'Žalgiris Kaunas': 'https://media.api-sports.io/basketball/teams/141.png',
  'Žalgiris': 'https://media.api-sports.io/basketball/teams/141.png',
  'Virtus Bologna': 'https://media.api-sports.io/basketball/teams/125.png',
  'Virtus Segafredo Bologna': 'https://media.api-sports.io/basketball/teams/125.png',
  'Segafredo Virtus Bologna': 'https://media.api-sports.io/basketball/teams/125.png',
  'AS Monaco Basketball': 'https://media.api-sports.io/basketball/teams/137.png',
  'AS Monaco': 'https://media.api-sports.io/basketball/teams/137.png',
  'Monaco Basketball': 'https://media.api-sports.io/basketball/teams/137.png',
  'AS Monaco Basket': 'https://media.api-sports.io/basketball/teams/137.png',
  'Monaco Basket': 'https://media.api-sports.io/basketball/teams/137.png',
  'Monaco': 'https://media.api-sports.io/basketball/teams/137.png',
  'Partizan Belgrade': 'https://media.api-sports.io/basketball/teams/139.png',
  'Partizan': 'https://media.api-sports.io/basketball/teams/139.png',
  'Partizan Mozzart Bet Belgrade': 'https://media.api-sports.io/basketball/teams/139.png',
  'KK Partizan': 'https://media.api-sports.io/basketball/teams/139.png',
  'Crvena Zvezda': 'https://media.api-sports.io/basketball/teams/138.png',
  'Crvena Zvezda Meridianbet Belgrade': 'https://media.api-sports.io/basketball/teams/138.png',
  'Red Star Belgrade': 'https://media.api-sports.io/basketball/teams/138.png',
  'KK Crvena Zvezda': 'https://media.api-sports.io/basketball/teams/138.png',
  'KK Crvena zvezda': 'https://media.api-sports.io/basketball/teams/138.png',
  'Baskonia': 'https://media.api-sports.io/basketball/teams/118.png',
  'Saski Baskonia': 'https://media.api-sports.io/basketball/teams/118.png',
  'Baskonia Vitoria-Gasteiz': 'https://media.api-sports.io/basketball/teams/118.png',
  'Cazoo Baskonia Vitoria-Gasteiz': 'https://media.api-sports.io/basketball/teams/118.png',
  'Olimpia Milano': 'https://media.api-sports.io/basketball/teams/127.png',
  'Pallacanestro Olimpia Milano': 'https://media.api-sports.io/basketball/teams/127.png',
  'Pallacanestro Olimpia': 'https://media.api-sports.io/basketball/teams/127.png',
  'EA7 Emporio Armani Milano': 'https://media.api-sports.io/basketball/teams/127.png',
  'EA7 Olimpia Milano': 'https://media.api-sports.io/basketball/teams/127.png',
  'AX Armani Exchange Milano': 'https://media.api-sports.io/basketball/teams/127.png',
  'Armani Milano': 'https://media.api-sports.io/basketball/teams/127.png',
  'Milano': 'https://media.api-sports.io/basketball/teams/127.png',
  'Valencia Basket': 'https://media.api-sports.io/basketball/teams/131.png',
  'Valencia BC': 'https://media.api-sports.io/basketball/teams/131.png',
  'Valencia': 'https://media.api-sports.io/basketball/teams/131.png',
  'LDLC ASVEL': 'https://media.api-sports.io/basketball/teams/134.png',
  'LDLC ASVEL Villeurbanne': 'https://media.api-sports.io/basketball/teams/134.png',
  'ASVEL': 'https://media.api-sports.io/basketball/teams/134.png',
  'ASVEL Lyon-Villeurbanne': 'https://media.api-sports.io/basketball/teams/134.png',
  'ASVEL Lyon Villeurbanne': 'https://media.api-sports.io/basketball/teams/134.png',
  'Paris Basketball': 'https://media.api-sports.io/basketball/teams/2188.png',
  'Paris BC': 'https://media.api-sports.io/basketball/teams/2188.png',
  'Joventut Badalona': 'https://media.api-sports.io/basketball/teams/119.png',
  'Joventut': 'https://media.api-sports.io/basketball/teams/119.png',
  'CB Gran Canaria': 'https://media.api-sports.io/basketball/teams/126.png',
  'Gran Canaria': 'https://media.api-sports.io/basketball/teams/126.png',
  'Dreamland Gran Canaria': 'https://media.api-sports.io/basketball/teams/126.png',
  'Unicaja': 'https://media.api-sports.io/basketball/teams/133.png',
  'Unicaja Malaga': 'https://media.api-sports.io/basketball/teams/133.png',
  
  // ============================================
  // ADDITIONAL EUROLEAGUE TEAMS (exact API names)
  // ============================================
  'Dubai Basketball': 'https://media.api-sports.io/basketball/teams/6792.png',
  'Dubai BC': 'https://media.api-sports.io/basketball/teams/6792.png',
  'Dubai': 'https://media.api-sports.io/basketball/teams/6792.png',
  'Hapoel Tel Aviv': 'https://media.api-sports.io/basketball/teams/3395.png',
  'Hapoel Shlomo Tel Aviv': 'https://media.api-sports.io/basketball/teams/3395.png',
  'Hapoel': 'https://media.api-sports.io/basketball/teams/3395.png',
  
  // ============================================
  // ACB SPAIN BASKETBALL TEAMS
  // ============================================
  'BAXI Manresa': 'https://media.api-sports.io/basketball/teams/133.png',
  'Manresa': 'https://media.api-sports.io/basketball/teams/133.png',
  'Lenovo Tenerife': 'https://media.api-sports.io/basketball/teams/134.png',
  'Tenerife': 'https://media.api-sports.io/basketball/teams/134.png',
  'Obradoiro CAB': 'https://media.api-sports.io/basketball/teams/135.png',
  'Monbus Obradoiro': 'https://media.api-sports.io/basketball/teams/135.png',
  'Obradoiro': 'https://media.api-sports.io/basketball/teams/135.png',
  'Bilbao Basket': 'https://media.api-sports.io/basketball/teams/136.png',
  'Casademont Zaragoza': 'https://media.api-sports.io/basketball/teams/137.png',
  'Zaragoza': 'https://media.api-sports.io/basketball/teams/137.png',
  'UCAM Murcia': 'https://media.api-sports.io/basketball/teams/138.png',
  'Murcia': 'https://media.api-sports.io/basketball/teams/138.png',
  'Rio Breogan': 'https://media.api-sports.io/basketball/teams/3461.png',
  'Breogan': 'https://media.api-sports.io/basketball/teams/3461.png',
  'Basquet Girona': 'https://media.api-sports.io/basketball/teams/7862.png',
  'Girona': 'https://media.api-sports.io/basketball/teams/7862.png',
  
  // ============================================
  // LEGA BASKET ITALY TEAMS
  // ============================================
  'Germani Brescia': 'https://media.api-sports.io/basketball/teams/140.png',
  'Brescia': 'https://media.api-sports.io/basketball/teams/140.png',
  'Pallacanestro Brescia': 'https://media.api-sports.io/basketball/teams/140.png',
  'Umana Reyer Venezia': 'https://media.api-sports.io/basketball/teams/141.png',
  'Reyer Venezia': 'https://media.api-sports.io/basketball/teams/141.png',
  'Venezia': 'https://media.api-sports.io/basketball/teams/141.png',
  'Openjobmetis Varese': 'https://media.api-sports.io/basketball/teams/142.png',
  'Varese': 'https://media.api-sports.io/basketball/teams/142.png',
  'Pallacanestro Varese': 'https://media.api-sports.io/basketball/teams/142.png',
  'Banco di Sardegna Sassari': 'https://media.api-sports.io/basketball/teams/143.png',
  'Dinamo Sassari': 'https://media.api-sports.io/basketball/teams/143.png',
  'Sassari': 'https://media.api-sports.io/basketball/teams/143.png',
  'Dolomiti Energia Trento': 'https://media.api-sports.io/basketball/teams/144.png',
  'Trento': 'https://media.api-sports.io/basketball/teams/144.png',
  'Aquila Basket Trento': 'https://media.api-sports.io/basketball/teams/144.png',
  'Bertram Derthona Tortona': 'https://media.api-sports.io/basketball/teams/7863.png',
  'Tortona': 'https://media.api-sports.io/basketball/teams/7863.png',
  'Derthona Tortona': 'https://media.api-sports.io/basketball/teams/7863.png',
  'Napoli Basket': 'https://media.api-sports.io/basketball/teams/145.png',
  'GeVi Napoli': 'https://media.api-sports.io/basketball/teams/145.png',
  'UNAHOTELS Reggio Emilia': 'https://media.api-sports.io/basketball/teams/146.png',
  'Reggio Emilia': 'https://media.api-sports.io/basketball/teams/146.png',
  'Pallacanestro Reggiana': 'https://media.api-sports.io/basketball/teams/146.png',
  'Carpegna Prosciutto Pesaro': 'https://media.api-sports.io/basketball/teams/147.png',
  'VL Pesaro': 'https://media.api-sports.io/basketball/teams/147.png',
  'Pesaro': 'https://media.api-sports.io/basketball/teams/147.png',
  'NutriBullet Treviso': 'https://media.api-sports.io/basketball/teams/148.png',
  'Treviso Basket': 'https://media.api-sports.io/basketball/teams/148.png',
  'Treviso': 'https://media.api-sports.io/basketball/teams/148.png',
  'Allianz Pallacanestro Trieste': 'https://media.api-sports.io/basketball/teams/149.png',
  'Trieste': 'https://media.api-sports.io/basketball/teams/149.png',
  'Pallacanestro Trieste': 'https://media.api-sports.io/basketball/teams/149.png',
  'Givova Scafati': 'https://media.api-sports.io/basketball/teams/7864.png',
  'Scafati': 'https://media.api-sports.io/basketball/teams/7864.png',
  'Estra Pistoia': 'https://media.api-sports.io/basketball/teams/150.png',
  'Pistoia': 'https://media.api-sports.io/basketball/teams/150.png',
  'Pistoia Basket': 'https://media.api-sports.io/basketball/teams/150.png',
  'Vanoli Cremona': 'https://media.api-sports.io/basketball/teams/151.png',
  'Cremona': 'https://media.api-sports.io/basketball/teams/151.png',
  
  // ============================================
  // BBL GERMANY BASKETBALL TEAMS
  // ============================================
  'Brose Bamberg': 'https://media.api-sports.io/basketball/teams/152.png',
  'Bamberg': 'https://media.api-sports.io/basketball/teams/152.png',
  'Fraport Skyliners Frankfurt': 'https://media.api-sports.io/basketball/teams/153.png',
  'Skyliners Frankfurt': 'https://media.api-sports.io/basketball/teams/153.png',
  'Frankfurt': 'https://media.api-sports.io/basketball/teams/153.png',
  'ratiopharm Ulm': 'https://media.api-sports.io/basketball/teams/154.png',
  'Ulm': 'https://media.api-sports.io/basketball/teams/154.png',
  'Telekom Baskets Bonn': 'https://media.api-sports.io/basketball/teams/155.png',
  'Baskets Bonn': 'https://media.api-sports.io/basketball/teams/155.png',
  'Bonn': 'https://media.api-sports.io/basketball/teams/155.png',
  'MHP RIESEN Ludwigsburg': 'https://media.api-sports.io/basketball/teams/156.png',
  'Ludwigsburg': 'https://media.api-sports.io/basketball/teams/156.png',
  'Riesen Ludwigsburg': 'https://media.api-sports.io/basketball/teams/156.png',
  'EWE Baskets Oldenburg': 'https://media.api-sports.io/basketball/teams/157.png',
  'Baskets Oldenburg': 'https://media.api-sports.io/basketball/teams/157.png',
  'Oldenburg': 'https://media.api-sports.io/basketball/teams/157.png',
  'BG Gottingen': 'https://media.api-sports.io/basketball/teams/158.png',
  'Gottingen': 'https://media.api-sports.io/basketball/teams/158.png',
  'Hamburg Towers': 'https://media.api-sports.io/basketball/teams/159.png',
  'Hamburg': 'https://media.api-sports.io/basketball/teams/159.png',
  'Towers Hamburg': 'https://media.api-sports.io/basketball/teams/159.png',
  'NINERS Chemnitz': 'https://media.api-sports.io/basketball/teams/160.png',
  'Chemnitz': 'https://media.api-sports.io/basketball/teams/160.png',
  's.Oliver Wurzburg': 'https://media.api-sports.io/basketball/teams/161.png',
  'Wurzburg': 'https://media.api-sports.io/basketball/teams/161.png',
  'Lowen Braunschweig': 'https://media.api-sports.io/basketball/teams/162.png',
  'Braunschweig': 'https://media.api-sports.io/basketball/teams/162.png',
  'Basketball Lowen Braunschweig': 'https://media.api-sports.io/basketball/teams/162.png',
  'RASTA Vechta': 'https://media.api-sports.io/basketball/teams/163.png',
  'Vechta': 'https://media.api-sports.io/basketball/teams/163.png',
  'Giessen 46ers': 'https://media.api-sports.io/basketball/teams/164.png',
  'Giessen': 'https://media.api-sports.io/basketball/teams/164.png',
  'MLP Academics Heidelberg': 'https://media.api-sports.io/basketball/teams/7865.png',
  'Heidelberg': 'https://media.api-sports.io/basketball/teams/7865.png',
  'Rostock Seawolves': 'https://media.api-sports.io/basketball/teams/7866.png',
  'Rostock': 'https://media.api-sports.io/basketball/teams/7866.png',
  
  // ============================================
  // PRO A FRANCE BASKETBALL TEAMS
  // ============================================
  'SIG Strasbourg': 'https://media.api-sports.io/basketball/teams/165.png',
  'Strasbourg': 'https://media.api-sports.io/basketball/teams/165.png',
  'Le Mans Sarthe Basket': 'https://media.api-sports.io/basketball/teams/166.png',
  'MSB Le Mans': 'https://media.api-sports.io/basketball/teams/166.png',
  'Le Mans': 'https://media.api-sports.io/basketball/teams/166.png',
  'Limoges CSP': 'https://media.api-sports.io/basketball/teams/167.png',
  'CSP Limoges': 'https://media.api-sports.io/basketball/teams/167.png',
  'Limoges': 'https://media.api-sports.io/basketball/teams/167.png',
  'JDA Dijon Basket': 'https://media.api-sports.io/basketball/teams/168.png',
  'JDA Dijon': 'https://media.api-sports.io/basketball/teams/168.png',
  'Dijon': 'https://media.api-sports.io/basketball/teams/168.png',
  'Metropolitans 92': 'https://media.api-sports.io/basketball/teams/169.png',
  'Boulogne-Levallois': 'https://media.api-sports.io/basketball/teams/169.png',
  'Levallois': 'https://media.api-sports.io/basketball/teams/169.png',
  'JL Bourg Basket': 'https://media.api-sports.io/basketball/teams/170.png',
  'JL Bourg': 'https://media.api-sports.io/basketball/teams/170.png',
  'Bourg-en-Bresse': 'https://media.api-sports.io/basketball/teams/170.png',
  'Cholet Basket': 'https://media.api-sports.io/basketball/teams/171.png',
  'Cholet': 'https://media.api-sports.io/basketball/teams/171.png',
  'Elan Bearnais Pau-Lacq-Orthez': 'https://media.api-sports.io/basketball/teams/172.png',
  'Elan Bearnais': 'https://media.api-sports.io/basketball/teams/172.png',
  'Pau-Lacq-Orthez': 'https://media.api-sports.io/basketball/teams/172.png',
  'Pau': 'https://media.api-sports.io/basketball/teams/172.png',
  'SLUC Nancy Basket': 'https://media.api-sports.io/basketball/teams/173.png',
  'SLUC Nancy': 'https://media.api-sports.io/basketball/teams/173.png',
  'Nancy': 'https://media.api-sports.io/basketball/teams/173.png',
  'Roanne Basket': 'https://media.api-sports.io/basketball/teams/174.png',
  'Roanne': 'https://media.api-sports.io/basketball/teams/174.png',
  'BCM Gravelines-Dunkerque': 'https://media.api-sports.io/basketball/teams/175.png',
  'Gravelines-Dunkerque': 'https://media.api-sports.io/basketball/teams/175.png',
  'Gravelines': 'https://media.api-sports.io/basketball/teams/175.png',
  'Nanterre 92': 'https://media.api-sports.io/basketball/teams/176.png',
  'Nanterre': 'https://media.api-sports.io/basketball/teams/176.png',
  'Orleans Loiret Basket': 'https://media.api-sports.io/basketball/teams/177.png',
  'Orleans': 'https://media.api-sports.io/basketball/teams/177.png',
  'Elan Chalon': 'https://media.api-sports.io/basketball/teams/178.png',
  'Chalon-sur-Saone': 'https://media.api-sports.io/basketball/teams/178.png',
  'Chalon': 'https://media.api-sports.io/basketball/teams/178.png',
  
  // ============================================
  // BSL TURKEY BASKETBALL TEAMS
  // ============================================
  'Galatasaray Nef': 'https://media.api-sports.io/basketball/teams/179.png',
  'Galatasaray': 'https://media.api-sports.io/basketball/teams/179.png',
  'Galatasaray Istanbul': 'https://media.api-sports.io/basketball/teams/179.png',
  'Besiktas Icrypex': 'https://media.api-sports.io/basketball/teams/180.png',
  'Besiktas': 'https://media.api-sports.io/basketball/teams/180.png',
  'Besiktas Istanbul': 'https://media.api-sports.io/basketball/teams/180.png',
  'Turk Telekom': 'https://media.api-sports.io/basketball/teams/181.png',
  'Turk Telekom Ankara': 'https://media.api-sports.io/basketball/teams/181.png',
  'Ankara': 'https://media.api-sports.io/basketball/teams/181.png',
  'Darussafaka': 'https://media.api-sports.io/basketball/teams/182.png',
  'Darussafaka Istanbul': 'https://media.api-sports.io/basketball/teams/182.png',
  'Bahcesehir College': 'https://media.api-sports.io/basketball/teams/183.png',
  'Bahcesehir': 'https://media.api-sports.io/basketball/teams/183.png',
  'Frutti Extra Bursaspor': 'https://media.api-sports.io/basketball/teams/184.png',
  'Bursaspor': 'https://media.api-sports.io/basketball/teams/184.png',
  'Ittifak Holding Konyaspor': 'https://media.api-sports.io/basketball/teams/185.png',
  'Konyaspor': 'https://media.api-sports.io/basketball/teams/185.png',
  'Pinar Karsiyaka': 'https://media.api-sports.io/basketball/teams/186.png',
  'Karsiyaka': 'https://media.api-sports.io/basketball/teams/186.png',
  'Tofas': 'https://media.api-sports.io/basketball/teams/187.png',
  'Tofas Bursa': 'https://media.api-sports.io/basketball/teams/187.png',
  'Yukatel Merkezefendi': 'https://media.api-sports.io/basketball/teams/188.png',
  'Merkezefendi': 'https://media.api-sports.io/basketball/teams/188.png',
  'Afyon Belediye': 'https://media.api-sports.io/basketball/teams/189.png',
  'Aliaga Petkim': 'https://media.api-sports.io/basketball/teams/190.png',
  'Petkimspor': 'https://media.api-sports.io/basketball/teams/190.png',
  
  // ============================================
  // VTB UNITED LEAGUE (RUSSIA) BASKETBALL TEAMS
  // ============================================
  'Lokomotiv Kuban': 'https://media.api-sports.io/basketball/teams/191.png',
  'Lokomotiv Kuban Krasnodar': 'https://media.api-sports.io/basketball/teams/191.png',
  'Lokomotiv': 'https://media.api-sports.io/basketball/teams/191.png',
  'UNICS Kazan': 'https://media.api-sports.io/basketball/teams/192.png',
  'UNICS': 'https://media.api-sports.io/basketball/teams/192.png',
  'Kazan': 'https://media.api-sports.io/basketball/teams/192.png',
  'Zenit St Petersburg': 'https://media.api-sports.io/basketball/teams/193.png',
  'Zenit Saint Petersburg': 'https://media.api-sports.io/basketball/teams/193.png',
  'Zenit': 'https://media.api-sports.io/basketball/teams/193.png',
  'Khimki': 'https://media.api-sports.io/basketball/teams/194.png',
  'BC Khimki': 'https://media.api-sports.io/basketball/teams/194.png',
  'Khimki Moscow Region': 'https://media.api-sports.io/basketball/teams/194.png',
  'Nizhny Novgorod': 'https://media.api-sports.io/basketball/teams/195.png',
  'BC Nizhny Novgorod': 'https://media.api-sports.io/basketball/teams/195.png',
  'Parma Perm': 'https://media.api-sports.io/basketball/teams/196.png',
  'Parma': 'https://media.api-sports.io/basketball/teams/196.png',
  'BC Astana': 'https://media.api-sports.io/basketball/teams/197.png',
  'Astana': 'https://media.api-sports.io/basketball/teams/197.png',
  'Tsmoki-Minsk': 'https://media.api-sports.io/basketball/teams/198.png',
  'Tsmoki Minsk': 'https://media.api-sports.io/basketball/teams/198.png',
  'Minsk': 'https://media.api-sports.io/basketball/teams/198.png',
  'Kalev/Cramo': 'https://media.api-sports.io/basketball/teams/199.png',
  'Kalev Cramo': 'https://media.api-sports.io/basketball/teams/199.png',
  'Kalev': 'https://media.api-sports.io/basketball/teams/199.png',
  'Enisey Krasnoyarsk': 'https://media.api-sports.io/basketball/teams/200.png',
  'Enisey': 'https://media.api-sports.io/basketball/teams/200.png',
  'Krasnoyarsk': 'https://media.api-sports.io/basketball/teams/200.png',
  'Avtodor Saratov': 'https://media.api-sports.io/basketball/teams/201.png',
  'Avtodor': 'https://media.api-sports.io/basketball/teams/201.png',
  'Saratov': 'https://media.api-sports.io/basketball/teams/201.png',
  'MBA Moscow': 'https://media.api-sports.io/basketball/teams/202.png',
  'MBA': 'https://media.api-sports.io/basketball/teams/202.png',
  'BC Samara': 'https://media.api-sports.io/basketball/teams/203.png',
  'Samara': 'https://media.api-sports.io/basketball/teams/203.png',
  'Novosibirsk': 'https://media.api-sports.io/basketball/teams/204.png',
  'BC Novosibirsk': 'https://media.api-sports.io/basketball/teams/204.png',
  
  // ============================================
  // EUROCUP BASKETBALL TEAMS (additional)
  // ============================================
  'Cedevita Olimpija Ljubljana': 'https://media.api-sports.io/basketball/teams/205.png',
  'Cedevita Olimpija': 'https://media.api-sports.io/basketball/teams/205.png',
  'Olimpija Ljubljana': 'https://media.api-sports.io/basketball/teams/205.png',
  'Hapoel Jerusalem': 'https://media.api-sports.io/basketball/teams/206.png',
  'Jerusalem': 'https://media.api-sports.io/basketball/teams/206.png',
  'London Lions': 'https://media.api-sports.io/basketball/teams/207.png',
  'Lions': 'https://media.api-sports.io/basketball/teams/207.png',
};

/**
 * League logo mappings - using official/reliable CDN sources
 * Mapped by sport_key from The Odds API and common display names
 * 
 * LOGO SOURCES (in order of reliability):
 * 1. ESPN CDN: https://a.espncdn.com/i/teamlogos/leagues/500/{league}.png
 * 2. football-data.org: https://crests.football-data.org/{code}.png
 * 3. API-Sports: https://media.api-sports.io/football/leagues/{id}.png
 */
const LEAGUE_LOGOS: Record<string, string> = {
  // ============================================
  // US SPORTS (ESPN CDN - most reliable)
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
  
  // CFL - Canadian Football (use API-Sports)
  'CFL': 'https://media.api-sports.io/american-football/leagues/1.png',
  'Canadian Football League': 'https://media.api-sports.io/american-football/leagues/1.png',
  'americanfootball_cfl': 'https://media.api-sports.io/american-football/leagues/1.png',
  
  // NBA - All variations
  'NBA': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'basketball_nba': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'NBA Regular Season': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'NBA Playoffs': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'NBA Finals': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  
  // WNBA
  'WNBA': 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
  'basketball_wnba': 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
  
  // EuroLeague Basketball
  'EuroLeague': 'https://media.api-sports.io/basketball/leagues/120.png',
  'basketball_euroleague': 'https://media.api-sports.io/basketball/leagues/120.png',
  'Euroleague': 'https://media.api-sports.io/basketball/leagues/120.png',
  'Turkish Airlines EuroLeague': 'https://media.api-sports.io/basketball/leagues/120.png',
  
  // EuroCup Basketball
  'EuroCup': 'https://media.api-sports.io/basketball/leagues/202.png',
  'basketball_eurocup': 'https://media.api-sports.io/basketball/leagues/202.png',
  'Eurocup': 'https://media.api-sports.io/basketball/leagues/202.png',
  '7DAYS EuroCup': 'https://media.api-sports.io/basketball/leagues/202.png',
  
  // ACB Spain
  'ACB': 'https://media.api-sports.io/basketball/leagues/117.png',
  'ACB Spain': 'https://media.api-sports.io/basketball/leagues/117.png',
  'basketball_acb_spain': 'https://media.api-sports.io/basketball/leagues/117.png',
  'basketball_spain_liga_acb': 'https://media.api-sports.io/basketball/leagues/117.png',
  'Liga ACB': 'https://media.api-sports.io/basketball/leagues/117.png',
  'Liga Endesa': 'https://media.api-sports.io/basketball/leagues/117.png',
  
  // Lega Basket Italy
  'Lega Basket': 'https://media.api-sports.io/basketball/leagues/90.png',
  'Lega Basket Italy': 'https://media.api-sports.io/basketball/leagues/90.png',
  'basketball_italy_lega': 'https://media.api-sports.io/basketball/leagues/90.png',
  'basketball_italy_lega_basket': 'https://media.api-sports.io/basketball/leagues/90.png',
  'Serie A Basketball': 'https://media.api-sports.io/basketball/leagues/90.png',
  'LBA': 'https://media.api-sports.io/basketball/leagues/90.png',
  
  // BBL Germany
  'BBL': 'https://media.api-sports.io/basketball/leagues/72.png',
  'BBL Germany': 'https://media.api-sports.io/basketball/leagues/72.png',
  'basketball_germany_bbl': 'https://media.api-sports.io/basketball/leagues/72.png',
  'basketball_germany_bundesliga': 'https://media.api-sports.io/basketball/leagues/72.png',
  'Basketball Bundesliga': 'https://media.api-sports.io/basketball/leagues/72.png',
  'easyCredit BBL': 'https://media.api-sports.io/basketball/leagues/72.png',
  
  // Pro A France
  'Pro A': 'https://media.api-sports.io/basketball/leagues/62.png',
  'Pro A France': 'https://media.api-sports.io/basketball/leagues/62.png',
  'basketball_france_pro_a': 'https://media.api-sports.io/basketball/leagues/62.png',
  'Betclic Elite': 'https://media.api-sports.io/basketball/leagues/62.png',
  'LNB Pro A': 'https://media.api-sports.io/basketball/leagues/62.png',
  
  // BSL Turkey
  'BSL': 'https://media.api-sports.io/basketball/leagues/79.png',
  'BSL Turkey': 'https://media.api-sports.io/basketball/leagues/79.png',
  'basketball_turkey_bsl': 'https://media.api-sports.io/basketball/leagues/79.png',
  'basketball_turkey_super_league': 'https://media.api-sports.io/basketball/leagues/79.png',
  'Turkish Basketball Super League': 'https://media.api-sports.io/basketball/leagues/79.png',
  'Basketbol Süper Ligi': 'https://media.api-sports.io/basketball/leagues/79.png',
  
  // VTB United League (Russia)
  'VTB': 'https://media.api-sports.io/basketball/leagues/10.png',
  'VTB United League': 'https://media.api-sports.io/basketball/leagues/10.png',
  'basketball_russia_vtb': 'https://media.api-sports.io/basketball/leagues/10.png',
  'basketball_vtb_united_league': 'https://media.api-sports.io/basketball/leagues/10.png',
  'VTB League': 'https://media.api-sports.io/basketball/leagues/10.png',
  
  // NHL - All variations
  'NHL': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'icehockey_nhl': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'NHL Regular Season': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'NHL Playoffs': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'Stanley Cup': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'NHL Championship Winner': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  
  // AHL - American Hockey League (API-Sports)
  'AHL': 'https://media.api-sports.io/hockey/leagues/58.png',
  'American Hockey League': 'https://media.api-sports.io/hockey/leagues/58.png',
  'icehockey_ahl': 'https://media.api-sports.io/hockey/leagues/58.png',
  
  // SHL - Swedish Hockey League
  'SHL': 'https://media.api-sports.io/hockey/leagues/24.png',
  'Swedish Hockey League': 'https://media.api-sports.io/hockey/leagues/24.png',
  'icehockey_sweden_hockey_league': 'https://media.api-sports.io/hockey/leagues/24.png',
  
  // HockeyAllsvenskan - Swedish second division
  'HockeyAllsvenskan': 'https://media.api-sports.io/hockey/leagues/25.png',
  'Hockey Allsvenskan': 'https://media.api-sports.io/hockey/leagues/25.png',
  'icehockey_sweden_allsvenskan': 'https://media.api-sports.io/hockey/leagues/25.png',
  
  // Liiga - Finnish Hockey League
  'Liiga': 'https://media.api-sports.io/hockey/leagues/3.png',
  'Finnish Liiga': 'https://media.api-sports.io/hockey/leagues/3.png',
  'icehockey_liiga': 'https://media.api-sports.io/hockey/leagues/3.png',
  
  // KHL - Kontinental Hockey League
  'KHL': 'https://media.api-sports.io/hockey/leagues/35.png',
  'Kontinental Hockey League': 'https://media.api-sports.io/hockey/leagues/35.png',
  'icehockey_khl': 'https://media.api-sports.io/hockey/leagues/35.png',
  
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
  // SOCCER/FOOTBALL (using Wikipedia Commons for reliable logos)
  // ============================================
  
  // Premier League - All variations (using api-sports.io - league 39)
  'Premier League': 'https://media.api-sports.io/football/leagues/39.png',
  'EPL': 'https://media.api-sports.io/football/leagues/39.png',
  'English Premier League': 'https://media.api-sports.io/football/leagues/39.png',
  'soccer_epl': 'https://media.api-sports.io/football/leagues/39.png',
  'soccer_england_premier_league': 'https://media.api-sports.io/football/leagues/39.png',
  'England - Premier League': 'https://media.api-sports.io/football/leagues/39.png',
  
  // La Liga - All variations
  'La Liga': 'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_2023_Horizontal_Logo.svg',
  'LaLiga': 'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_2023_Horizontal_Logo.svg',
  'La Liga - Spain': 'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_2023_Horizontal_Logo.svg',
  'soccer_spain_la_liga': 'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_2023_Horizontal_Logo.svg',
  'Spain - La Liga': 'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_2023_Horizontal_Logo.svg',
  'La Liga Santander': 'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_2023_Horizontal_Logo.svg',
  'La Liga EA Sports': 'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_2023_Horizontal_Logo.svg',
  'La Liga 2 - Spain': 'https://upload.wikimedia.org/wikipedia/commons/9/92/LaLiga_Hypermotion_2023_Horizontal_Logo.svg',
  'soccer_spain_segunda_division': 'https://upload.wikimedia.org/wikipedia/commons/9/92/LaLiga_Hypermotion_2023_Horizontal_Logo.svg',
  
  // Serie A - All variations (using fifplay high quality PNG)
  'Serie A': 'https://www.fifplay.com/img/public/serie-a-logo.png',
  'Serie A - Italy': 'https://www.fifplay.com/img/public/serie-a-logo.png',
  'soccer_italy_serie_a': 'https://www.fifplay.com/img/public/serie-a-logo.png',
  'Italy - Serie A': 'https://www.fifplay.com/img/public/serie-a-logo.png',
  'Serie A TIM': 'https://www.fifplay.com/img/public/serie-a-logo.png',
  'Italy Serie A': 'https://www.fifplay.com/img/public/serie-a-logo.png',
  'Serie B - Italy': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Serie_B_Logo_2022.svg',
  'soccer_italy_serie_b': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Serie_B_Logo_2022.svg',
  
  // Bundesliga - All variations
  'Bundesliga': 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
  'Bundesliga - Germany': 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
  'soccer_germany_bundesliga': 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
  'Germany - Bundesliga': 'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
  '2. Bundesliga': 'https://upload.wikimedia.org/wikipedia/en/4/4c/2._Bundesliga_logo_%282017%29.svg',
  'Bundesliga 2': 'https://upload.wikimedia.org/wikipedia/en/4/4c/2._Bundesliga_logo_%282017%29.svg',
  'Bundesliga 2 - Germany': 'https://upload.wikimedia.org/wikipedia/en/4/4c/2._Bundesliga_logo_%282017%29.svg',
  'soccer_germany_bundesliga2': 'https://upload.wikimedia.org/wikipedia/en/4/4c/2._Bundesliga_logo_%282017%29.svg',
  
  // 3. Liga - Germany
  '3. Liga': 'https://upload.wikimedia.org/wikipedia/en/6/66/3._Liga_logo.svg',
  '3. Liga - Germany': 'https://upload.wikimedia.org/wikipedia/en/6/66/3._Liga_logo.svg',
  'Germany - 3. Liga': 'https://upload.wikimedia.org/wikipedia/en/6/66/3._Liga_logo.svg',
  'soccer_germany_liga3': 'https://upload.wikimedia.org/wikipedia/en/6/66/3._Liga_logo.svg',
  
  // Ligue 1 - All variations (using Wikipedia Commons)
  'Ligue 1': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Ligue1_logo.png',
  'Ligue 1 - France': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Ligue1_logo.png',
  'soccer_france_ligue_one': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Ligue1_logo.png',
  'France - Ligue 1': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Ligue1_logo.png',
  'Ligue 1 Uber Eats': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Ligue1_logo.png',
  'France Ligue 1': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Ligue1_logo.png',
  
  // Ligue 2 - France
  'Ligue 2': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Ligue2_logo.png',
  'Ligue 2 - France': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Ligue2_logo.png',
  'France - Ligue 2': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Ligue2_logo.png',
  'soccer_france_ligue_two': 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Ligue2_logo.png',
  
  // Eredivisie - Netherlands
  'Eredivisie': 'https://media.api-sports.io/football/leagues/88.png',
  'Dutch Eredivisie': 'https://media.api-sports.io/football/leagues/88.png',
  'soccer_netherlands_eredivisie': 'https://media.api-sports.io/football/leagues/88.png',
  'Netherlands - Eredivisie': 'https://media.api-sports.io/football/leagues/88.png',
  
  // Primeira Liga - Portugal
  'Primeira Liga': 'https://media.api-sports.io/football/leagues/94.png',
  'Primeira Liga - Portugal': 'https://media.api-sports.io/football/leagues/94.png',
  'Liga Portugal': 'https://media.api-sports.io/football/leagues/94.png',
  'soccer_portugal_primeira_liga': 'https://media.api-sports.io/football/leagues/94.png',
  'Portugal - Primeira Liga': 'https://media.api-sports.io/football/leagues/94.png',
  
  // Scottish Premiership
  'Scottish Premiership': 'https://media.api-sports.io/football/leagues/179.png',
  'Premiership - Scotland': 'https://media.api-sports.io/football/leagues/179.png',
  'SPFL': 'https://media.api-sports.io/football/leagues/179.png',
  'Scotland - Premiership': 'https://media.api-sports.io/football/leagues/179.png',
  'soccer_spl': 'https://media.api-sports.io/football/leagues/179.png',
  
  // Belgian Pro League
  'Belgian Pro League': 'https://media.api-sports.io/football/leagues/144.png',
  'Belgium First Div': 'https://media.api-sports.io/football/leagues/144.png',
  'Jupiler Pro League': 'https://media.api-sports.io/football/leagues/144.png',
  'Belgium - First Division A': 'https://media.api-sports.io/football/leagues/144.png',
  'soccer_belgium_first_div': 'https://media.api-sports.io/football/leagues/144.png',
  
  // Turkish Super Lig
  'Super Lig': 'https://media.api-sports.io/football/leagues/203.png',
  'Süper Lig': 'https://media.api-sports.io/football/leagues/203.png',
  'Turkey - Super Lig': 'https://media.api-sports.io/football/leagues/203.png',
  'Turkey Super League': 'https://media.api-sports.io/football/leagues/203.png',
  'Turkish Super League': 'https://media.api-sports.io/football/leagues/203.png',
  'soccer_turkey_super_league': 'https://media.api-sports.io/football/leagues/203.png',
  
  // Liga MX - Mexico
  'Liga MX': 'https://media.api-sports.io/football/leagues/262.png',
  'soccer_mexico_ligamx': 'https://media.api-sports.io/football/leagues/262.png',
  'Mexico - Liga MX': 'https://media.api-sports.io/football/leagues/262.png',
  
  // A-League - Australia
  'A-League': 'https://media.api-sports.io/football/leagues/188.png',
  'A-League Men': 'https://media.api-sports.io/football/leagues/188.png',
  'soccer_australia_aleague': 'https://media.api-sports.io/football/leagues/188.png',
  'Australia - A-League': 'https://media.api-sports.io/football/leagues/188.png',
  
  // J1 League - Japan
  'J1 League': 'https://media.api-sports.io/football/leagues/98.png',
  'J-League': 'https://media.api-sports.io/football/leagues/98.png',
  'Japan - J League': 'https://media.api-sports.io/football/leagues/98.png',
  
  // K League - South Korea
  'K League 1': 'https://media.api-sports.io/football/leagues/292.png',
  'Korea - K League 1': 'https://media.api-sports.io/football/leagues/292.png',
  
  // Brasileirao - Brazil
  'Brasileirao': 'https://media.api-sports.io/football/leagues/71.png',
  'Brasileirão': 'https://media.api-sports.io/football/leagues/71.png',
  'soccer_brazil_campeonato': 'https://media.api-sports.io/football/leagues/71.png',
  'Serie A Brazil': 'https://media.api-sports.io/football/leagues/71.png',
  'Brazil - Serie A': 'https://media.api-sports.io/football/leagues/71.png',
  
  // Argentina
  'Liga Profesional': 'https://media.api-sports.io/football/leagues/128.png',
  'Primera División - Argentina': 'https://media.api-sports.io/football/leagues/128.png',
  'Argentina - Liga Profesional': 'https://media.api-sports.io/football/leagues/128.png',
  'soccer_argentina_primera_division': 'https://media.api-sports.io/football/leagues/128.png',
  
  // English Lower Leagues
  'Championship': 'https://media.api-sports.io/football/leagues/40.png',
  'EFL Championship': 'https://media.api-sports.io/football/leagues/40.png',
  'soccer_efl_champ': 'https://media.api-sports.io/football/leagues/40.png',
  'England - Championship': 'https://media.api-sports.io/football/leagues/40.png',
  'League One': 'https://media.api-sports.io/football/leagues/41.png',
  'League 1': 'https://media.api-sports.io/football/leagues/41.png',
  'EFL League 1': 'https://media.api-sports.io/football/leagues/41.png',
  'soccer_england_league1': 'https://media.api-sports.io/football/leagues/41.png',
  'League Two': 'https://media.api-sports.io/football/leagues/42.png',
  'League 2': 'https://media.api-sports.io/football/leagues/42.png',
  'EFL League 2': 'https://media.api-sports.io/football/leagues/42.png',
  'soccer_england_league2': 'https://media.api-sports.io/football/leagues/42.png',
  'EFL Cup': 'https://media.api-sports.io/football/leagues/46.png',
  'Carabao Cup': 'https://media.api-sports.io/football/leagues/46.png',
  'soccer_england_efl_cup': 'https://media.api-sports.io/football/leagues/46.png',
  'FA Cup': 'https://media.api-sports.io/football/leagues/45.png',
  'soccer_fa_cup': 'https://media.api-sports.io/football/leagues/45.png',
  
  // Denmark
  'Denmark Superliga': 'https://media.api-sports.io/football/leagues/120.png',
  'Danish Superliga': 'https://media.api-sports.io/football/leagues/120.png',
  'soccer_denmark_superliga': 'https://media.api-sports.io/football/leagues/120.png',
  
  // Poland
  'Ekstraklasa': 'https://media.api-sports.io/football/leagues/106.png',
  'Ekstraklasa - Poland': 'https://media.api-sports.io/football/leagues/106.png',
  'soccer_poland_ekstraklasa': 'https://media.api-sports.io/football/leagues/106.png',
  
  // Switzerland
  'Swiss Super League': 'https://media.api-sports.io/football/leagues/207.png',
  'Swiss Superleague': 'https://media.api-sports.io/football/leagues/207.png',
  'soccer_switzerland_superleague': 'https://media.api-sports.io/football/leagues/207.png',
  
  // Austria
  'Austrian Bundesliga': 'https://media.api-sports.io/football/leagues/218.png',
  'Austrian Football Bundesliga': 'https://media.api-sports.io/football/leagues/218.png',
  'soccer_austria_bundesliga': 'https://media.api-sports.io/football/leagues/218.png',
  
  // Greece
  'Super League Greece': 'https://media.api-sports.io/football/leagues/197.png',
  'Super League - Greece': 'https://media.api-sports.io/football/leagues/197.png',
  'soccer_greece_super_league': 'https://media.api-sports.io/football/leagues/197.png',
  
  // UEFA Competitions (using Wikipedia Commons for reliable logos)
  'Champions League': 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
  'UEFA Champions League': 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
  'soccer_uefa_champs_league': 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
  'UCL': 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
  'UEFA CL': 'https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg',
  'Europa League': 'https://upload.wikimedia.org/wikipedia/en/0/03/Europa_League.svg',
  'UEFA Europa League': 'https://upload.wikimedia.org/wikipedia/en/0/03/Europa_League.svg',
  'soccer_uefa_europa_league': 'https://upload.wikimedia.org/wikipedia/en/0/03/Europa_League.svg',
  'UEFA EL': 'https://upload.wikimedia.org/wikipedia/en/0/03/Europa_League.svg',
  'Conference League': 'https://upload.wikimedia.org/wikipedia/en/5/5b/UEFA_Europa_Conference_League_Logo.svg',
  'UEFA Conference League': 'https://upload.wikimedia.org/wikipedia/en/5/5b/UEFA_Europa_Conference_League_Logo.svg',
  'UEFA Europa Conference League': 'https://upload.wikimedia.org/wikipedia/en/5/5b/UEFA_Europa_Conference_League_Logo.svg',
  'soccer_uefa_europa_conference_league': 'https://upload.wikimedia.org/wikipedia/en/5/5b/UEFA_Europa_Conference_League_Logo.svg',
  
  // World Cup / International
  'FIFA World Cup': 'https://media.api-sports.io/football/leagues/1.png',
  'World Cup': 'https://media.api-sports.io/football/leagues/1.png',
  'soccer_fifa_world_cup': 'https://media.api-sports.io/football/leagues/1.png',
  'Euro': 'https://media.api-sports.io/football/leagues/4.png',
  'UEFA Euro': 'https://media.api-sports.io/football/leagues/4.png',
  'European Championship': 'https://media.api-sports.io/football/leagues/4.png',
  'Copa America': 'https://media.api-sports.io/football/leagues/9.png',
  'Africa Cup of Nations': 'https://media.api-sports.io/football/leagues/6.png',
  'AFCON': 'https://media.api-sports.io/football/leagues/6.png',
  'soccer_africa_cup_of_nations': 'https://media.api-sports.io/football/leagues/6.png',
  
  // ============================================
  // BASKETBALL - EUROPE / AUSTRALIA (use generated fallbacks - external APIs unreliable)
  // ============================================
  
  // Note: These leagues will use generated letter-based logos since external APIs are unreliable
  
  // ============================================
  // TENNIS (ESPN-style icons)
  // ============================================
  
  'ATP': 'https://a.espncdn.com/i/teamlogos/leagues/500/atp.png',
  'WTA': 'https://a.espncdn.com/i/teamlogos/leagues/500/wta.png',
  'Australian Open': 'https://a.espncdn.com/i/teamlogos/leagues/500/aus-open.png',
  'ATP Australian Open': 'https://a.espncdn.com/i/teamlogos/leagues/500/aus-open.png',
  'tennis_atp_aus_open': 'https://a.espncdn.com/i/teamlogos/leagues/500/aus-open.png',
  'French Open': 'https://a.espncdn.com/i/teamlogos/leagues/500/french-open.png',
  'Roland Garros': 'https://a.espncdn.com/i/teamlogos/leagues/500/french-open.png',
  'ATP French Open': 'https://a.espncdn.com/i/teamlogos/leagues/500/french-open.png',
  'tennis_atp_french_open': 'https://a.espncdn.com/i/teamlogos/leagues/500/french-open.png',
  'Wimbledon': 'https://a.espncdn.com/i/teamlogos/leagues/500/wimbledon.png',
  'ATP Wimbledon': 'https://a.espncdn.com/i/teamlogos/leagues/500/wimbledon.png',
  'tennis_atp_wimbledon': 'https://a.espncdn.com/i/teamlogos/leagues/500/wimbledon.png',
  'US Open': 'https://a.espncdn.com/i/teamlogos/leagues/500/us-open.png',
  'ATP US Open': 'https://a.espncdn.com/i/teamlogos/leagues/500/us-open.png',
  'tennis_atp_us_open': 'https://a.espncdn.com/i/teamlogos/leagues/500/us-open.png',
  
  // ============================================
  // MMA/UFC/BOXING
  // ============================================
  
  'UFC': 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png',
  'MMA': 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png',
  'UFC/MMA': 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png',
  'mma_mixed_martial_arts': 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png',
  
  // Boxing
  'Boxing': 'https://a.espncdn.com/i/teamlogos/leagues/500/boxing.png',
  'boxing_boxing': 'https://a.espncdn.com/i/teamlogos/leagues/500/boxing.png',
  
  // ============================================
  // GOLF
  // ============================================
  
  'PGA': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'PGA Tour': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'golf_pga': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'Masters': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'The Masters': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'Masters Tournament Winner': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'PGA Championship Winner': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'The Open Winner': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'US Open Winner': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'golf_masters_tournament_winner': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'golf_pga_championship_winner': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'golf_the_open_championship_winner': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  'golf_us_open_winner': 'https://a.espncdn.com/i/teamlogos/leagues/500/pga.png',
  
  // ============================================
  // CRICKET
  // ============================================
  
  'IPL': 'https://media.api-sports.io/cricket/leagues/1.png',
  'Indian Premier League': 'https://media.api-sports.io/cricket/leagues/1.png',
  'cricket_ipl': 'https://media.api-sports.io/cricket/leagues/1.png',
  'Big Bash': 'https://media.api-sports.io/cricket/leagues/2.png',
  'Big Bash League': 'https://media.api-sports.io/cricket/leagues/2.png',
  'cricket_big_bash': 'https://media.api-sports.io/cricket/leagues/2.png',
  'International Twenty20': 'https://media.api-sports.io/cricket/leagues/3.png',
  'cricket_international_t20': 'https://media.api-sports.io/cricket/leagues/3.png',
  'Test Matches': 'https://media.api-sports.io/cricket/leagues/4.png',
  'cricket_test_match': 'https://media.api-sports.io/cricket/leagues/4.png',
  
  // ============================================
  // RUGBY
  // ============================================
  
  'NRL': 'https://media.api-sports.io/rugby/leagues/5.png',
  'National Rugby League': 'https://media.api-sports.io/rugby/leagues/5.png',
  'rugbyleague_nrl': 'https://media.api-sports.io/rugby/leagues/5.png',
  'State of Origin': 'https://media.api-sports.io/rugby/leagues/5.png',
  'rugbyleague_nrl_state_of_origin': 'https://media.api-sports.io/rugby/leagues/5.png',
  'Six Nations': 'https://media.api-sports.io/rugby/leagues/6.png',
  'rugby_union_six_nations': 'https://media.api-sports.io/rugby/leagues/6.png',
  'rugbyunion_six_nations': 'https://media.api-sports.io/rugby/leagues/6.png',
  
  // ============================================
  // HANDBALL
  // ============================================
  
  'Handball-Bundesliga': 'https://media.api-sports.io/handball/leagues/35.png',
  'German HBL': 'https://media.api-sports.io/handball/leagues/35.png',
  'handball_germany_bundesliga': 'https://media.api-sports.io/handball/leagues/35.png',
  
  // ============================================
  // AUSTRALIAN RULES
  // ============================================
  
  'AFL': 'https://a.espncdn.com/i/teamlogos/leagues/500/afl.png',
  'aussierules_afl': 'https://a.espncdn.com/i/teamlogos/leagues/500/afl.png',
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
  // Handle both API keys (with underscores) and display names (with spaces)
  if (sportLower.includes('soccer')) return 'soccer';
  if (sportLower.includes('football') && !sportLower.includes('american')) return 'soccer';
  if (sportLower.includes('epl') || sportLower.includes('premier')) return 'soccer';
  if (sportLower.includes('la liga') || sportLower.includes('la_liga') || sportLower.includes('laliga')) return 'soccer';
  if (sportLower.includes('spain') || sportLower.includes('spanish')) return 'soccer';
  if (sportLower.includes('serie a') || sportLower.includes('serie_a') || sportLower.includes('italy') || sportLower.includes('italian')) return 'soccer';
  if (sportLower.includes('bundesliga') || sportLower.includes('germany') || sportLower.includes('german')) return 'soccer';
  if (sportLower.includes('ligue 1') || sportLower.includes('ligue_1') || sportLower.includes('ligue') || sportLower.includes('france') || sportLower.includes('french')) return 'soccer';
  if (sportLower.includes('champs') || sportLower.includes('champions') || sportLower.includes('europa') || sportLower.includes('uefa')) return 'soccer';
  if (sportLower.includes('eredivisie') || sportLower.includes('netherlands') || sportLower.includes('dutch')) return 'soccer';
  if (sportLower.includes('primeira') || sportLower.includes('portugal') || sportLower.includes('portuguese')) return 'soccer';
  if (sportLower.includes('mls') || sportLower.includes('liga mx') || sportLower.includes('liga_mx') || sportLower.includes('mexico') || sportLower.includes('mexican')) return 'soccer';
  if (sportLower.includes('a-league') || sportLower.includes('a_league') || sportLower.includes('australia')) return 'soccer';
  if (sportLower.includes('j league') || sportLower.includes('j_league') || sportLower.includes('j-league') || sportLower.includes('japan')) return 'soccer';
  if (sportLower.includes('brazil') || sportLower.includes('brasileiro') || sportLower.includes('argentina')) return 'soccer';
  if (sportLower.includes('scottish') || sportLower.includes('championship') || sportLower.includes('fa cup') || sportLower.includes('fa_cup')) return 'soccer';
  if (sportLower.includes('turkey') || sportLower.includes('turkish') || sportLower.includes('belgium') || sportLower.includes('belgian') || sportLower.includes('swiss')) return 'soccer';
  if (sportLower.includes('copa') || sportLower.includes('cup') || sportLower.includes('league cup')) return 'soccer';
  
  // Basketball
  if (sportLower.includes('basketball') || sportLower === 'nba' || sportLower.includes('euroleague')) return 'nba';
  
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
  const cleanName = teamName.trim();
  const sportLower = sport.toLowerCase();
  
  // ============================================
  // BASKETBALL: Handle NBA vs European leagues separately
  // ============================================
  const isEuropeanBasketball = sportLower.includes('euroleague') || 
    sportLower.includes('eurocup') ||
    sportLower.includes('acb') || 
    sportLower.includes('lega') ||
    sportLower.includes('bbl') || 
    sportLower.includes('bsl') ||
    sportLower.includes('vtb') ||
    (league && (
      league.toLowerCase().includes('euroleague') ||
      league.toLowerCase().includes('eurocup') ||
      league.toLowerCase().includes('acb') ||
      league.toLowerCase().includes('lega')
    ));
  
  const isNBA = sportLower.includes('nba') || sportLower === 'basketball_nba' ||
    (league && league.toLowerCase() === 'nba');
  
  // For European basketball, check BASKETBALL_TEAM_LOGOS FIRST (before ESPN NBA)
  if (isEuropeanBasketball && !isNBA) {
    // Try exact match
    if (BASKETBALL_TEAM_LOGOS[cleanName]) {
      return BASKETBALL_TEAM_LOGOS[cleanName];
    }
    // Try case-insensitive exact match
    const exactKey = Object.keys(BASKETBALL_TEAM_LOGOS).find(key => 
      key.toLowerCase() === cleanName.toLowerCase()
    );
    if (exactKey) {
      return BASKETBALL_TEAM_LOGOS[exactKey];
    }
    // Try partial match
    const partialKey = Object.keys(BASKETBALL_TEAM_LOGOS).find(key => 
      key.toLowerCase().includes(cleanName.toLowerCase()) ||
      cleanName.toLowerCase().includes(key.toLowerCase())
    );
    if (partialKey) {
      return BASKETBALL_TEAM_LOGOS[partialKey];
    }
    // For European basketball, return fallback directly - DON'T check ESPN NBA
    return generateFallbackLogo(cleanName, 'team');
  }
  
  // For NBA specifically, use ESPN NBA logos
  if (isNBA || sportLower.includes('nba')) {
    const espnIds = ESPN_TEAM_IDS['nba'];
    if (espnIds) {
      // Try exact match first
      if (espnIds[cleanName]) {
        return `https://a.espncdn.com/i/teamlogos/nba/500/${espnIds[cleanName]}.png`;
      }
      // Try case-insensitive exact match
      const exactKey = Object.keys(espnIds).find(key => 
        key.toLowerCase() === cleanName.toLowerCase()
      );
      if (exactKey) {
        return `https://a.espncdn.com/i/teamlogos/nba/500/${espnIds[exactKey]}.png`;
      }
      // Try partial match - team name contains key or key contains team name
      const partialKey = Object.keys(espnIds).find(key => 
        key.toLowerCase().includes(cleanName.toLowerCase()) ||
        cleanName.toLowerCase().includes(key.toLowerCase())
      );
      if (partialKey) {
        return `https://a.espncdn.com/i/teamlogos/nba/500/${espnIds[partialKey]}.png`;
      }
      // Try matching just the main part (e.g., "Lakers" from "Los Angeles Lakers")
      const teamWords = cleanName.split(/\s+/);
      for (const word of teamWords) {
        if (word.length >= 4) { // Skip short words like "FC", "LA", etc.
          const wordMatch = Object.keys(espnIds).find(key =>
            key.toLowerCase().includes(word.toLowerCase())
          );
          if (wordMatch) {
            return `https://a.espncdn.com/i/teamlogos/nba/500/${espnIds[wordMatch]}.png`;
          }
        }
      }
    }
    // Fallback for NBA
    return generateFallbackLogo(cleanName, 'team');
  }
  
  const normalizedSport = normalizeSport(sport);
  
  // Try ESPN for other US sports (NFL, NHL, MLB)
  if (['nfl', 'nhl', 'mlb'].includes(normalizedSport)) {
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
