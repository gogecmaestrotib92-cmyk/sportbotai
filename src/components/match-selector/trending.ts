/**
 * Trending/Hot Matches calculation logic
 * Calculates a "hotScore" for each match based on multiple factors
 * Also includes value-based AI flagging using odds analysis
 */

import { MatchData } from '@/types';

// League importance tiers (higher = more important)
const LEAGUE_IMPORTANCE: Record<string, number> = {
  // Soccer - Top Tier
  'soccer_epl': 10,           // English Premier League
  'soccer_spain_la_liga': 10, // La Liga
  'soccer_germany_bundesliga': 9,
  'soccer_italy_serie_a': 9,
  'soccer_france_ligue_one': 8,
  'soccer_uefa_champs_league': 10, // Champions League
  'soccer_uefa_europa_league': 8,
  'soccer_uefa_europa_conference_league': 6,
  
  // Soccer - Second Tier
  'soccer_england_league1': 5,
  'soccer_england_league2': 4,
  'soccer_england_efl_cup': 6,
  'soccer_fa_cup': 7,
  'soccer_netherlands_eredivisie': 6,
  'soccer_portugal_primeira_liga': 6,
  'soccer_brazil_serie_a': 7,
  'soccer_mexico_ligamx': 6,
  'soccer_usa_mls': 6,
  
  // Basketball
  'basketball_nba': 10,
  'basketball_euroleague': 8,
  
  // American Football
  'americanfootball_nfl': 10,
  'americanfootball_ncaaf': 8,
  
  // Hockey
  'icehockey_nhl': 10,
  
  // Tennis
  'tennis_atp_aus_open': 10,
  'tennis_atp_french_open': 10,
  'tennis_atp_us_open': 10,
  'tennis_atp_wimbledon': 10,
  
  // MMA
  'mma_mixed_martial_arts': 8,
};

// Known rivalry/derby keywords for light-weight detection
const RIVALRY_PAIRS: Array<[string, string]> = [
  // England
  ['manchester united', 'manchester city'],
  ['manchester united', 'liverpool'],
  ['liverpool', 'everton'],
  ['arsenal', 'tottenham'],
  ['chelsea', 'tottenham'],
  ['chelsea', 'arsenal'],
  
  // Spain
  ['barcelona', 'real madrid'],
  ['atletico madrid', 'real madrid'],
  ['sevilla', 'real betis'],
  
  // Italy
  ['inter', 'milan'],
  ['juventus', 'inter'],
  ['roma', 'lazio'],
  
  // Germany
  ['bayern', 'dortmund'],
  
  // NBA
  ['lakers', 'celtics'],
  ['lakers', 'clippers'],
  ['warriors', 'cavaliers'],
  ['nets', 'knicks'],
  
  // NFL
  ['cowboys', 'eagles'],
  ['packers', 'bears'],
  ['49ers', 'seahawks'],
  ['chiefs', 'raiders'],
  ['patriots', 'jets'],
  
  // NHL
  ['rangers', 'islanders'],
  ['bruins', 'canadiens'],
  ['penguins', 'flyers'],
];

export interface TrendingMatch extends MatchData {
  hotScore: number;
  hotFactors: {
    bookmakerScore: number;
    marketScore: number;
    leagueScore: number;
    derbyScore: number;
    proximityScore: number;
  };
}

/**
 * Calculate the hot score for a single match
 */
export function calculateHotScore(match: MatchData): TrendingMatch {
  // 1. Bookmaker count score (0-10 scale, max around 15+ bookmakers)
  const bookmakerCount = match.bookmakers?.length || 0;
  const bookmakerScore = Math.min(bookmakerCount / 1.5, 10);
  
  // 2. Market availability score (based on available odds types)
  // We check what odds data we have available
  let marketScore = 0;
  if (match.odds?.home && match.odds?.away) marketScore += 3; // H2H/Moneyline
  if (match.odds?.draw !== null && match.odds?.draw !== undefined) marketScore += 2; // Draw market (3-way)
  if (match.odds?.over && match.odds?.under) marketScore += 3; // Over/Under
  if (match.odds?.overUnderLine) marketScore += 2; // Has specific O/U line
  marketScore = Math.min(marketScore, 10);
  
  // 3. League importance score
  const leagueScore = LEAGUE_IMPORTANCE[match.sportKey] || 5;
  
  // 4. Derby/rivalry detection
  const derbyScore = detectDerby(match.homeTeam, match.awayTeam) ? 10 : 0;
  
  // 5. Start time proximity score (closer = higher)
  const now = Date.now();
  const matchTime = new Date(match.commenceTime).getTime();
  const hoursUntilMatch = (matchTime - now) / (1000 * 60 * 60);
  
  let proximityScore = 0;
  if (hoursUntilMatch < 0) {
    // Match already started or finished
    proximityScore = 0;
  } else if (hoursUntilMatch <= 3) {
    proximityScore = 10; // Starting very soon
  } else if (hoursUntilMatch <= 12) {
    proximityScore = 8;
  } else if (hoursUntilMatch <= 24) {
    proximityScore = 6;
  } else if (hoursUntilMatch <= 48) {
    proximityScore = 4;
  } else if (hoursUntilMatch <= 72) {
    proximityScore = 2;
  } else {
    proximityScore = 1;
  }
  
  // Calculate weighted hot score
  // hotScore = (bookmakerCount * 0.4) + (marketCount * 0.2) + (leagueImportance * 0.2) + (derbyFactor * 0.1) + (startTimeProximity * 0.1)
  const hotScore = 
    (bookmakerScore * 0.4) +
    (marketScore * 0.2) +
    (leagueScore * 0.2) +
    (derbyScore * 0.1) +
    (proximityScore * 0.1);
  
  return {
    ...match,
    hotScore,
    hotFactors: {
      bookmakerScore,
      marketScore,
      leagueScore,
      derbyScore,
      proximityScore,
    },
  };
}

/**
 * Detect if two teams are known rivals/derby match
 */
function detectDerby(homeTeam: string, awayTeam: string): boolean {
  const home = homeTeam.toLowerCase();
  const away = awayTeam.toLowerCase();
  
  for (const [team1, team2] of RIVALRY_PAIRS) {
    const homeMatches = home.includes(team1) || home.includes(team2);
    const awayMatches = away.includes(team1) || away.includes(team2);
    
    // Both teams must match different parts of the rivalry
    if (homeMatches && awayMatches) {
      const homeIsTeam1 = home.includes(team1);
      const awayIsTeam1 = away.includes(team1);
      // Ensure they're not both matching the same team name
      if (homeIsTeam1 !== awayIsTeam1) {
        return true;
      }
    }
  }
  
  // Additional check: same city derby (teams with same city prefix)
  const homeWords = home.split(' ');
  const awayWords = away.split(' ');
  if (homeWords.length > 1 && awayWords.length > 1) {
    // Check if first word (often city name) matches
    if (homeWords[0] === awayWords[0] && homeWords[0].length > 3) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get trending matches from a list of matches
 * Returns top N matches sorted by hot score
 */
export function getTrendingMatches(
  matches: MatchData[],
  limit: number = 8
): TrendingMatch[] {
  // Filter out matches that have already started
  const now = Date.now();
  const upcomingMatches = matches.filter(m => 
    new Date(m.commenceTime).getTime() > now
  );
  
  // Calculate hot scores for all matches
  const scoredMatches = upcomingMatches.map(calculateHotScore);
  
  // Sort by hot score descending
  scoredMatches.sort((a, b) => b.hotScore - a.hotScore);
  
  // Return top N
  return scoredMatches.slice(0, limit);
}

/**
 * Get trending matches for a specific sport category
 */
export function getTrendingMatchesByCategory(
  matches: MatchData[],
  sportKeys: string[],
  limit: number = 8
): TrendingMatch[] {
  const categoryMatches = matches.filter(m => sportKeys.includes(m.sportKey));
  return getTrendingMatches(categoryMatches, limit);
}
// ============================================
// VALUE-BASED AI FLAGGING
// ============================================

export interface ValueFlaggedMatch extends MatchData {
  valueScore: number;           // Overall value score (higher = more interesting)
  valueBet: {
    outcome: 'home' | 'draw' | 'away' | null;
    edgePercent: number;        // e.g., +7.2%
    strength: 'strong' | 'moderate' | 'slight' | 'none';
    label: string;              // "Away +7.2% edge"
  };
  marketAnomaly: {
    oddsSpread: number;         // Max bookmaker disagreement
    hasDisagreement: boolean;   // Bookmakers disagree significantly
    skewedMarket: boolean;      // Market heavily favors one side
  };
  aiReason: string;             // Human-readable reason for flagging
}

/**
 * Remove vig from odds to get fair probabilities
 */
function removeVigFromOdds(homeOdds: number, awayOdds: number, drawOdds?: number | null): {
  home: number;
  away: number;
  draw?: number;
} {
  // Convert odds to raw implied probs
  const rawHome = 1 / homeOdds;
  const rawAway = 1 / awayOdds;
  const rawDraw = drawOdds ? 1 / drawOdds : 0;
  
  const total = rawHome + rawAway + rawDraw;
  
  // Normalize to 100%
  return {
    home: (rawHome / total) * 100,
    away: (rawAway / total) * 100,
    draw: rawDraw > 0 ? (rawDraw / total) * 100 : undefined,
  };
}

/**
 * Calculate quick model probability based on market consensus
 * Uses bookmaker disagreement and odds patterns as signals
 */
function calculateQuickModelProb(match: MatchData): {
  home: number;
  away: number;
  draw?: number;
  confidence: number;
} {
  const bookmakers = match.bookmakers || [];
  
  if (bookmakers.length === 0) {
    // Fallback to average odds
    const fairProb = removeVigFromOdds(
      match.averageOdds.home,
      match.averageOdds.away,
      match.averageOdds.draw
    );
    return { ...fairProb, confidence: 30 };
  }
  
  // Get all home/away/draw odds
  const homeOdds = bookmakers.map(b => b.home);
  const awayOdds = bookmakers.map(b => b.away);
  const drawOdds = bookmakers.filter(b => b.draw !== null).map(b => b.draw as number);
  
  // Use median odds (more robust than mean)
  const median = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  
  const medianHome = median(homeOdds);
  const medianAway = median(awayOdds);
  const medianDraw = drawOdds.length > 0 ? median(drawOdds) : null;
  
  // Calculate fair probs from median odds
  const fairProb = removeVigFromOdds(medianHome, medianAway, medianDraw);
  
  // Confidence based on bookmaker count and consensus
  const spreadHome = Math.max(...homeOdds) - Math.min(...homeOdds);
  const spreadAway = Math.max(...awayOdds) - Math.min(...awayOdds);
  const avgSpread = (spreadHome + spreadAway) / 2;
  
  // High consensus (low spread) = high confidence
  let confidence = 70;
  if (avgSpread < 0.1) confidence = 90;
  else if (avgSpread < 0.2) confidence = 80;
  else if (avgSpread < 0.4) confidence = 70;
  else if (avgSpread < 0.6) confidence = 60;
  else confidence = 50;
  
  // Boost confidence with more bookmakers
  if (bookmakers.length >= 10) confidence = Math.min(confidence + 10, 95);
  
  return { ...fairProb, confidence };
}

/**
 * Detect value opportunities in a match
 * Compares sharp bookmaker odds vs soft bookmaker odds
 */
function detectMatchValue(match: MatchData): ValueFlaggedMatch['valueBet'] {
  const bookmakers = match.bookmakers || [];
  
  // Known sharp bookmakers (lower margins, move first)
  const sharpBooks = ['pinnacle', 'betfair', 'sbobet', 'matchbook', 'betdaq'];
  const softBooks = ['bet365', 'william hill', 'ladbrokes', 'betway', 'unibet', 'paddy power'];
  
  // Separate sharp vs soft bookmaker odds
  const sharpOdds = bookmakers.filter(b => 
    sharpBooks.some(s => b.name.toLowerCase().includes(s))
  );
  const softOdds = bookmakers.filter(b => 
    softBooks.some(s => b.name.toLowerCase().includes(s))
  );
  
  // If we have both sharp and soft odds, use the difference
  // Sharp odds are considered "true probability", soft odds have extra margin
  if (sharpOdds.length > 0 && softOdds.length > 0) {
    const sharpProbs = removeVigFromOdds(
      sharpOdds[0].home,
      sharpOdds[0].away,
      sharpOdds[0].draw
    );
    
    // Average soft book probs
    const avgSoftHome = softOdds.reduce((a, b) => a + b.home, 0) / softOdds.length;
    const avgSoftAway = softOdds.reduce((a, b) => a + b.away, 0) / softOdds.length;
    const avgSoftDraw = softOdds[0].draw !== null 
      ? softOdds.reduce((a, b) => a + (b.draw || 0), 0) / softOdds.length 
      : null;
    
    const softProbs = removeVigFromOdds(avgSoftHome, avgSoftAway, avgSoftDraw);
    
    // Edge = sharp prob - soft prob (if sharp thinks it's more likely, soft is underpricing)
    const homeEdge = sharpProbs.home - softProbs.home;
    const awayEdge = sharpProbs.away - softProbs.away;
    const drawEdge = sharpProbs.draw && softProbs.draw 
      ? sharpProbs.draw - softProbs.draw 
      : -999;
    
    // Find best edge
    const edges = [
      { outcome: 'home' as const, edge: homeEdge },
      { outcome: 'away' as const, edge: awayEdge },
      { outcome: 'draw' as const, edge: drawEdge },
    ];
    
    const best = edges.reduce((a, b) => b.edge > a.edge ? b : a);
    
    if (best.edge >= 3) {
      return {
        outcome: best.outcome,
        edgePercent: Math.round(best.edge * 10) / 10,
        strength: best.edge >= 8 ? 'strong' : best.edge >= 5 ? 'moderate' : 'slight',
        label: `${best.outcome === 'home' ? 'Home' : best.outcome === 'away' ? 'Away' : 'Draw'} +${best.edge.toFixed(1)}% edge`,
      };
    }
  }
  
  // Fallback: Check for bookmaker disagreement (odds spread)
  if (bookmakers.length >= 3) {
    const homeOdds = bookmakers.map(b => b.home);
    const awayOdds = bookmakers.map(b => b.away);
    
    const homeSpread = Math.max(...homeOdds) - Math.min(...homeOdds);
    const awaySpread = Math.max(...awayOdds) - Math.min(...awayOdds);
    
    // Large spread = bookmakers disagree = potential value
    if (homeSpread > 0.3 || awaySpread > 0.3) {
      // Value is on the side with more spread (uncertainty)
      if (homeSpread > awaySpread) {
        const edge = homeSpread * 5; // Rough heuristic
        return {
          outcome: 'home',
          edgePercent: Math.round(edge * 10) / 10,
          strength: edge >= 5 ? 'moderate' : 'slight',
          label: `Home odds variance: ${homeSpread.toFixed(2)}`,
        };
      } else {
        const edge = awaySpread * 5;
        return {
          outcome: 'away',
          edgePercent: Math.round(edge * 10) / 10,
          strength: edge >= 5 ? 'moderate' : 'slight',
          label: `Away odds variance: ${awaySpread.toFixed(2)}`,
        };
      }
    }
  }
  
  return { outcome: null, edgePercent: 0, strength: 'none', label: 'No edge detected' };
}

/**
 * Analyze market anomalies
 */
function analyzeMarketAnomaly(match: MatchData): ValueFlaggedMatch['marketAnomaly'] {
  const bookmakers = match.bookmakers || [];
  
  if (bookmakers.length < 2) {
    return { oddsSpread: 0, hasDisagreement: false, skewedMarket: false };
  }
  
  const homeOdds = bookmakers.map(b => b.home);
  const awayOdds = bookmakers.map(b => b.away);
  
  const homeSpread = Math.max(...homeOdds) - Math.min(...homeOdds);
  const awaySpread = Math.max(...awayOdds) - Math.min(...awayOdds);
  const maxSpread = Math.max(homeSpread, awaySpread);
  
  // Check if market is heavily skewed (lopsided favorite)
  const avgHome = match.averageOdds.home;
  const avgAway = match.averageOdds.away;
  const skewedMarket = avgHome < 1.25 || avgAway < 1.25; // Very heavy favorite
  
  return {
    oddsSpread: Math.round(maxSpread * 100) / 100,
    hasDisagreement: maxSpread > 0.25,
    skewedMarket,
  };
}

/**
 * Calculate overall value score for sorting
 */
function calculateValueScore(
  valueBet: ValueFlaggedMatch['valueBet'],
  marketAnomaly: ValueFlaggedMatch['marketAnomaly'],
  bookmakerCount: number
): number {
  let score = 0;
  
  // Value edge is primary factor
  if (valueBet.strength === 'strong') score += 40;
  else if (valueBet.strength === 'moderate') score += 25;
  else if (valueBet.strength === 'slight') score += 15;
  
  // Edge magnitude
  score += Math.min(valueBet.edgePercent * 2, 20);
  
  // Market disagreement bonus
  if (marketAnomaly.hasDisagreement) score += 10;
  
  // Bookmaker coverage bonus (more data = more reliable)
  score += Math.min(bookmakerCount, 10);
  
  return score;
}

/**
 * Generate AI reason for flagging
 */
function generateAIReason(
  valueBet: ValueFlaggedMatch['valueBet'],
  marketAnomaly: ValueFlaggedMatch['marketAnomaly']
): string {
  if (valueBet.strength === 'strong') {
    return `Strong edge: ${valueBet.label}`;
  }
  if (valueBet.strength === 'moderate') {
    return `Moderate edge on ${valueBet.outcome}`;
  }
  if (marketAnomaly.hasDisagreement) {
    return `Bookmaker disagreement detected`;
  }
  if (valueBet.strength === 'slight') {
    return `Slight value opportunity`;
  }
  return 'Market analysis flagged';
}

/**
 * Get matches flagged by AI value detection
 * Returns matches where we detect potential value or market anomalies
 */
export function getValueFlaggedMatches(
  matches: MatchData[],
  limit: number = 10
): ValueFlaggedMatch[] {
  // Filter out matches that have already started
  const now = Date.now();
  const upcomingMatches = matches.filter(m => 
    new Date(m.commenceTime).getTime() > now
  );
  
  // Analyze each match for value
  const flaggedMatches: ValueFlaggedMatch[] = upcomingMatches.map(match => {
    const valueBet = detectMatchValue(match);
    const marketAnomaly = analyzeMarketAnomaly(match);
    const bookmakerCount = match.bookmakers?.length || 0;
    const valueScore = calculateValueScore(valueBet, marketAnomaly, bookmakerCount);
    const aiReason = generateAIReason(valueBet, marketAnomaly);
    
    return {
      ...match,
      valueScore,
      valueBet,
      marketAnomaly,
      aiReason,
    };
  });
  
  // Filter to only include matches with some value signal
  const withValue = flaggedMatches.filter(m => 
    m.valueBet.strength !== 'none' || m.marketAnomaly.hasDisagreement
  );
  
  // Sort by value score descending
  withValue.sort((a, b) => b.valueScore - a.valueScore);
  
  // Return top N
  return withValue.slice(0, limit);
}

/**
 * Get value context line for display
 */
export function getValueContextLine(match: ValueFlaggedMatch): string {
  if (match.valueBet.strength === 'strong') {
    return `🎯 ${match.valueBet.label}`;
  }
  if (match.valueBet.strength === 'moderate') {
    return `📊 ${match.valueBet.label}`;
  }
  if (match.marketAnomaly.hasDisagreement) {
    return `⚡ Odds spread: ${match.marketAnomaly.oddsSpread.toFixed(2)}`;
  }
  if (match.valueBet.strength === 'slight') {
    return `📈 ${match.valueBet.label}`;
  }
  return match.aiReason;
}