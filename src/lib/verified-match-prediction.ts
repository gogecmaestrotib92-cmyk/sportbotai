/**
 * Verified Match Prediction Service
 * 
 * Provides our own pre-match analysis for upcoming games:
 * - Only for matches within 48 hours
 * - Uses predictions stored in our database
 * - Overrides Perplexity for prediction queries
 * 
 * Detects queries like:
 * - "Who will win Arsenal vs Chelsea?"
 * - "Prediction for Liverpool game"
 * - "What's your analysis for Man City match?"
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// City to Team Name Mapping (normalize city names to team names for DB lookup)
// ============================================================================

const CITY_TO_TEAM: Record<string, string> = {
  // NBA
  'los angeles': 'Lakers', // Could also be Clippers - will match either
  'boston': 'Celtics',
  'golden state': 'Warriors',
  'miami': 'Heat',
  'milwaukee': 'Bucks',
  'brooklyn': 'Nets',
  'new york': 'Knicks', // Could also be Nets
  'phoenix': 'Suns',
  'denver': 'Nuggets',
  'dallas': 'Mavericks',
  'memphis': 'Grizzlies',
  'minnesota': 'Timberwolves',
  'cleveland': 'Cavaliers',
  'chicago': 'Bulls',
  'atlanta': 'Hawks',
  'toronto': 'Raptors',
  'indiana': 'Pacers',
  'orlando': 'Magic',
  'charlotte': 'Hornets',
  'washington': 'Wizards',
  'detroit': 'Pistons',
  'oklahoma city': 'Thunder',
  'portland': 'Trail Blazers',
  'utah': 'Jazz',
  'sacramento': 'Kings',
  'san antonio': 'Spurs',
  'new orleans': 'Pelicans',
  'houston': 'Rockets',
  // NFL additions
  'kansas city': 'Chiefs',
  'philadelphia': 'Eagles',
  'buffalo': 'Bills',
  'baltimore': 'Ravens',
  'cincinnati': 'Bengals',
  'san francisco': '49ers',
  'seattle': 'Seahawks',
  'green bay': 'Packers',
  'pittsburgh': 'Steelers',
  'las vegas': 'Raiders',
  'tennessee': 'Titans',
  'jacksonville': 'Jaguars',
  'indianapolis': 'Colts',
  'tampa bay': 'Buccaneers',
  'carolina': 'Panthers',
  'arizona': 'Cardinals',
  // NHL additions
  'montreal': 'Canadiens',
  'edmonton': 'Oilers',
  'calgary': 'Flames',
  'vancouver': 'Canucks',
  'winnipeg': 'Jets',
  'ottawa': 'Senators',
  'florida': 'Panthers',
  'colorado': 'Avalanche',
  'vegas': 'Golden Knights',
  'st louis': 'Blues',
  'nashville': 'Predators',
  'new jersey': 'Devils',
};

/**
 * Normalize city name to team name for DB lookup
 */
function normalizeTeamName(name: string): string {
  const lower = name.toLowerCase().trim();
  return CITY_TO_TEAM[lower] || name; // Return team name or original if not found
}

// ============================================================================
// Types
// ============================================================================

export interface MatchPrediction {
  id: string;
  matchName: string;
  kickoff: Date;
  sport: string;
  league: string;
  prediction: string;
  reasoning: string;
  conviction: number;
  odds?: number | null;
  outcome: string | null;
  actualResult: string | null;
  // Using actual schema fields
  modelProbability?: number | null;
  selection?: string | null;
  marketType?: string | null;
  edgeValue?: number | null;
  valueBetOdds?: number | null;
  valueBetEdge?: number | null;
}

export interface MatchPredictionResult {
  success: boolean;
  data: MatchPrediction | null;
  isUpcoming: boolean; // true if within 48h
  hoursUntilKickoff: number;
  error?: string;
}

// ============================================================================
// Detection
// ============================================================================

/**
 * Check if query is asking for match prediction/analysis
 * NOT to be confused with OUR_PREDICTION category which asks about past predictions
 * 
 * Now more lenient: "Team A vs Team B" alone is enough to trigger lookup
 * (Query Intelligence already classified it as MATCH_PREDICTION)
 */
export function isMatchPredictionQuery(message: string): boolean {
  const lower = message.toLowerCase();
  
  // EXCLUDE schedule queries - "when do they play" is NOT a prediction query
  const isScheduleQuery = /\bwhen\b.*\b(play|playing|game|match|face|next)\b/i.test(lower) ||
    /\bnext (game|match|fixture|opponent)\b/i.test(lower) ||
    /\b(schedule|fixture|calendar)\b/i.test(lower) ||
    /\bwhat time\b/i.test(lower);
  
  if (isScheduleQuery) {
    return false;
  }
  
  // EXCLUDE injury/status queries - "is X injured" is NOT a prediction query
  const isInjuryQuery = /\b(injur(y|ed|ies)?|hurt|status|health|available|fit|recovery)\b/i.test(lower);
  if (isInjuryQuery) {
    return false;
  }
  
  // EXCLUDE stats queries - "Jokic stats" is NOT a prediction query
  const isStatsQuery = /\b(stats|statistics|average|scoring|points|assists|rebounds)\b/i.test(lower);
  if (isStatsQuery) {
    return false;
  }
  
  // Check for explicit "vs" pattern - this is a match query
  const hasVsPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s*(?:vs?\.?|x|@)\s*[A-Z][a-z]+/i.test(message);
  
  // Check for two team names side by side (common shorthand: "Man City Arsenal", "Barcelona Real Madrid")
  const hasTwoTeamsPattern = /\b(man\s*(city|utd|united)|liverpool|chelsea|arsenal|tottenham|newcastle|brighton|barcelona|barca|real\s*madrid|bayern|dortmund|juventus|juve|inter|milan|psg|lakers|warriors|celtics|heat|bucks|nets|knicks|nuggets|mavericks|mavs|chiefs|eagles|bills|cowboys)\b.*\b(man\s*(city|utd|united)|liverpool|chelsea|arsenal|tottenham|newcastle|brighton|barcelona|barca|real\s*madrid|bayern|dortmund|juventus|juve|inter|milan|psg|lakers|warriors|celtics|heat|bucks|nets|knicks|nuggets|mavericks|mavs|chiefs|eagles|bills|cowboys)\b/i.test(message);
  
  // If we have "Team vs Team" or two team names, it's likely a match prediction query
  if (hasVsPattern || hasTwoTeamsPattern) {
    // But exclude if it's clearly asking for past results, not prediction
    const isPastResultQuery = /\b(score|result|who won|final|how did|yesterday|last night|last game)\b/i.test(lower);
    if (!isPastResultQuery) {
      return true;
    }
  }
  
  // Also check for match context with prediction keywords
  const hasMatchContext = hasVsPattern ||
    /\b(match|game|fixture|utakmica|meč)\b/i.test(lower);
  
  if (!hasMatchContext) return false;
  
  // Must ask for prediction/analysis
  const predictionPatterns = [
    // English
    /who\s+will\s+win/i,
    /who\s*('s|is)\s+gonna\s+win/i,
    /who.*favorite/i,
    /prediction\s+for/i,
    /predict.*match/i,
    /match\s+prediction/i,
    /what.*think.*will\s+(win|happen)/i,
    /\banalysis\b/i,  // Simplified - any "analysis" mention
    /\bpre.?game\b/i,
    /\bpre.?match\b/i,
    /\bwin\s+probability\b/i,
    /\bexpected\s+(winner|result|outcome)\b/i,
    /\btips?\b/i,
    /\bpicks?\b/i,
    // Portuguese
    /quem\s+vai\s+ganhar/i,
    /previs[aã]o\s+(para|do)/i,
    /an[aá]lise\s+(do|da|para)/i,
    // Serbian/Croatian
    /ko\s+[cć]e\s+(pobediti|pobjedit|dobiti)/i,
    /prognoz[ae]\s+(za|utakmic)/i,
    /analiz[ae]\s+(za|utakmic)/i,
    /šta\s+misli[šs]/i,
    // Spanish
    /quien\s+va\s+a\s+ganar/i,
    /predicci[oó]n\s+para/i,
  ];
  
  return predictionPatterns.some(pattern => pattern.test(lower));
}

/**
 * Extract team names from message for match lookup
 */
function extractTeamNamesFromMessage(message: string): { team1: string; team2?: string } | null {
  // Pattern: Team1 vs/against/facing Team2
  const vsMatch = message.match(/([A-Z][a-zA-Z\s]+?)\s*(?:vs?\.?|versus|against|facing|plays?|playing|x|-|@)\s*([A-Z][a-zA-Z\s]+?)(?:\s|$|\?|,|today|tonight|tomorrow|will|who|can)/i);
  if (vsMatch) {
    // Clean up team names
    let team1 = vsMatch[1].trim().replace(/\s+/g, ' ')
      .replace(/^(will|can|should|today|tonight)\s+/i, '')
      .replace(/\s+(win|today|match|game)$/i, '');
    let team2 = vsMatch[2].trim().replace(/\s+/g, ' ')
      .replace(/\s+(today|tonight|tomorrow|will|who|can|should|win|match|game).*$/i, '');
    
    if (team1.length >= 2 && team2.length >= 2) {
      return { team1, team2 };
    }
  }
  
  // Pattern: "win against Team" / "beat Team"
  const againstMatch = message.match(/\b(?:win|beat|defeat)\s+(?:against\s+)?([A-Z][a-zA-Z\s]+?)(?:\s|$|\?|,|today|tonight)/i);
  if (againstMatch) {
    const team2 = againstMatch[1].trim().replace(/\s+(today|tonight|tomorrow)$/i, '');
    // Find team1 before the verb
    const beforeMatch = message.match(/([A-Z][a-zA-Z]+)\s+(?:win|beat|defeat)/i);
    if (beforeMatch && team2.length >= 2) {
      return { team1: beforeMatch[1].trim(), team2 };
    }
  }
  
  // Single team: "Arsenal match prediction"
  const singleMatch = message.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:match|game|utakmica|meč)/i);
  if (singleMatch) {
    return { team1: singleMatch[1].trim() };
  }
  
  // Look for common team names AND city names
  const teamPatterns = [
    // Premier League
    /(Arsenal|Chelsea|Liverpool|Manchester United|Manchester City|Man United|Man City|Tottenham|Spurs|Newcastle|Brighton|Aston Villa|West Ham|Fulham|Brentford|Crystal Palace|Everton|Nottingham Forest|Wolves|Bournemouth|Ipswich|Leicester|Southampton)/gi,
    // La Liga
    /(Real Madrid|Barcelona|Atletico Madrid|Sevilla|Real Betis|Villarreal|Athletic Bilbao|Real Sociedad|Valencia|Celta Vigo|Getafe|Osasuna|Mallorca|Rayo Vallecano|Las Palmas)/gi,
    // Serie A (EXPANDED)
    /(Juventus|Inter|AC Milan|Roma|Napoli|Lazio|Atalanta|Fiorentina|Sassuolo|Bologna|Torino|Udinese|Monza|Empoli|Verona|Lecce|Cagliari|Genoa|Parma|Venezia|Como)/gi,
    // Bundesliga
    /(Bayern|Bayern Munich|Dortmund|Borussia Dortmund|Leipzig|RB Leipzig|Leverkusen|Bayer Leverkusen|Frankfurt|Eintracht|Wolfsburg|Stuttgart|Union Berlin|Freiburg|Mainz|Hoffenheim|Werder Bremen|Augsburg|Bochum|Heidenheim|Darmstadt)/gi,
    // Ligue 1
    /(PSG|Paris Saint.?Germain|Marseille|Lyon|Monaco|Lille|Nice|Lens|Rennes|Strasbourg|Nantes|Toulouse|Montpellier|Reims|Brest)/gi,
    // NBA (with city names!)
    /(Lakers|Celtics|Warriors|Bulls|Heat|Nets|Knicks|76ers|Sixers|Bucks|Nuggets|Suns|Mavericks|Mavs|Clippers|Rockets|Spurs|Thunder|Grizzlies|Kings|Pelicans|Jazz|Trail Blazers|Blazers|Timberwolves|Wolves|Hornets|Hawks|Magic|Pistons|Pacers|Wizards|Cavaliers|Cavs|Raptors|Los Angeles|Boston|Golden State|Miami|Milwaukee|Brooklyn|New York|Phoenix|Denver|Dallas|Memphis|Minnesota|Cleveland|Chicago|Atlanta|Toronto|Indiana|Orlando|Charlotte|Washington|Detroit|Oklahoma City|Portland|Utah|Sacramento|San Antonio|New Orleans|Houston)/gi,
    // NFL (with city names!)
    /(Chiefs|Eagles|Bills|49ers|Niners|Cowboys|Ravens|Lions|Dolphins|Bengals|Chargers|Broncos|Jets|Patriots|Giants|Raiders|Saints|Packers|Steelers|Seahawks|Commanders|Falcons|Buccaneers|Bucs|Cardinals|Rams|Bears|Vikings|Browns|Texans|Colts|Jaguars|Jags|Titans|Panthers|Kansas City|Philadelphia|Buffalo|Dallas|Miami|Baltimore|Cincinnati|San Francisco|Detroit|Seattle|Green Bay|Minnesota|Pittsburgh|Los Angeles|Denver|Las Vegas|Washington|New York|New England|Tennessee|Jacksonville|Indianapolis|Houston|Cleveland|Chicago|New Orleans|Tampa Bay|Atlanta|Carolina|Arizona)/gi,
    // NHL (with city names!)
    /(Maple Leafs|Canadiens|Bruins|Rangers|Penguins|Blackhawks|Red Wings|Flyers|Devils|Islanders|Oilers|Flames|Canucks|Avalanche|Blues|Stars|Lightning|Panthers|Capitals|Kings|Ducks|Sharks|Kraken|Knights|Wild|Jets|Sabres|Hurricanes|Senators|Blue Jackets|Predators|Coyotes|Toronto|Montreal|Boston|New York|Pittsburgh|Chicago|Detroit|Edmonton|Calgary|Vancouver|Winnipeg|Ottawa|Tampa Bay|Florida|Colorado|Vegas|Seattle|Dallas|St Louis|Minnesota|Nashville|Carolina|New Jersey)/gi,
  ];
  
  const foundTeams: string[] = [];
  for (const pattern of teamPatterns) {
    const matches = message.match(pattern);
    if (matches) {
      for (const m of matches) {
        if (!foundTeams.some(t => t.toLowerCase() === m.toLowerCase())) {
          foundTeams.push(m);
        }
      }
    }
  }
  
  if (foundTeams.length >= 2) {
    // Normalize city names to team names for DB lookup
    return { 
      team1: normalizeTeamName(foundTeams[0]), 
      team2: normalizeTeamName(foundTeams[1]) 
    };
  } else if (foundTeams.length === 1) {
    return { team1: normalizeTeamName(foundTeams[0]) };
  }
  
  return null;
}

// ============================================================================
// Database Functions
// ============================================================================

/**
 * Find upcoming prediction for a match (within 48 hours)
 */
export async function getUpcomingMatchPrediction(message: string): Promise<MatchPredictionResult> {
  const teams = extractTeamNamesFromMessage(message);
  
  if (!teams) {
    return { 
      success: false, 
      data: null, 
      isUpcoming: false,
      hoursUntilKickoff: 0,
      error: 'Could not identify teams from query' 
    };
  }

  console.log(`[Match-Prediction] Looking for prediction: ${teams.team1} ${teams.team2 ? 'vs ' + teams.team2 : ''}`);

  const now = new Date();
  const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  try {
    // Build search conditions
    const searchTerms = [teams.team1];
    if (teams.team2) searchTerms.push(teams.team2);

    // Search for predictions matching team names and within 48h
    const predictions = await prisma.prediction.findMany({
      where: {
        AND: [
          // Match must be upcoming (kickoff in future but within 48h)
          {
            kickoff: {
              gte: now,
              lte: next48h,
            },
          },
          // Match name must contain at least one team
          {
            OR: searchTerms.map(term => ({
              matchName: { contains: term, mode: 'insensitive' as const }
            })),
          },
        ],
      },
      orderBy: { kickoff: 'asc' },
      take: 1,
    });

    if (predictions.length === 0) {
      // Check if there's a match but not within 48h
      const futurePredictions = await prisma.prediction.findMany({
        where: {
          kickoff: { gte: now },
          OR: searchTerms.map(term => ({
            matchName: { contains: term, mode: 'insensitive' as const }
          })),
        },
        orderBy: { kickoff: 'asc' },
        take: 1,
      });

      if (futurePredictions.length > 0) {
        const hoursUntil = Math.round((futurePredictions[0].kickoff.getTime() - now.getTime()) / (1000 * 60 * 60));
        return {
          success: false,
          data: null,
          isUpcoming: false,
          hoursUntilKickoff: hoursUntil,
          error: `Match found but kickoff is in ${hoursUntil} hours (analysis available closer to kickoff)`,
        };
      }

      return {
        success: false,
        data: null,
        isUpcoming: false,
        hoursUntilKickoff: 0,
        error: 'No prediction found for this match',
      };
    }

    const pred = predictions[0];
    const hoursUntilKickoff = Math.round((pred.kickoff.getTime() - now.getTime()) / (1000 * 60 * 60));

    console.log(`[Match-Prediction] ✅ Found prediction for ${pred.matchName}, kickoff in ${hoursUntilKickoff}h`);

    return {
      success: true,
      data: {
        id: pred.id,
        matchName: pred.matchName,
        kickoff: pred.kickoff,
        sport: pred.sport,
        league: pred.league,
        prediction: pred.prediction,
        reasoning: pred.reasoning,
        conviction: pred.conviction,
        odds: pred.odds,
        outcome: pred.outcome,
        actualResult: pred.actualResult,
        modelProbability: pred.modelProbability,
        selection: pred.selection,
        marketType: pred.marketType,
        edgeValue: pred.edgeValue,
        valueBetOdds: pred.valueBetOdds,
        valueBetEdge: pred.valueBetEdge,
      },
      isUpcoming: true,
      hoursUntilKickoff,
    };
  } catch (error) {
    console.error('[Match-Prediction] Database error:', error);
    return {
      success: false,
      data: null,
      isUpcoming: false,
      hoursUntilKickoff: 0,
      error: 'Database error',
    };
  }
}

/**
 * Format match prediction for AI context
 */
export function formatMatchPredictionContext(result: MatchPredictionResult): string {
  if (!result.success || !result.data) {
    if (result.error?.includes('hours')) {
      return `⏳ MATCH NOT YET AVAILABLE FOR ANALYSIS: ${result.error}`;
    }
    return '';
  }

  const pred = result.data;
  const kickoffDate = pred.kickoff.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let context = `=== SPORTBOT PRE-MATCH ANALYSIS ===\n`;
  context += `Match: ${pred.matchName}\n`;
  context += `Kickoff: ${kickoffDate} (in ${result.hoursUntilKickoff} hours)\n`;
  context += `Competition: ${pred.league}\n\n`;

  context += `📊 OUR PREDICTION: ${pred.prediction}\n`;
  context += `Conviction: ${pred.conviction}/10\n`;
  if (pred.selection) context += `Selection: ${pred.selection}\n`;
  if (pred.marketType) context += `Market: ${pred.marketType}\n`;
  context += '\n';

  context += `📝 REASONING:\n${pred.reasoning}\n\n`;

  // Model probability and edge if available
  if (pred.modelProbability) {
    context += `📈 MODEL ANALYSIS:\n`;
    context += `- Model Probability: ${pred.modelProbability.toFixed(1)}%\n`;
    if (pred.edgeValue) {
      const edgeSign = pred.edgeValue > 0 ? '+' : '';
      context += `- Edge vs Market: ${edgeSign}${pred.edgeValue.toFixed(1)}%\n`;
    }
    context += '\n';
  }

  // Value bet if available (edge > 0)
  if (pred.edgeValue && pred.edgeValue > 0) {
    context += `💰 VALUE BET DETECTED:\n`;
    context += `Edge: +${pred.edgeValue.toFixed(1)}%\n`;
    if (pred.valueBetOdds) context += `Odds: ${pred.valueBetOdds}\n`;
    context += '\n';
  }

  context += `⚠️ DISCLAIMER: This is an analytical estimate, not a guarantee. Always gamble responsibly.\n`;
  context += `SOURCE: SportBot AI Analysis (pre-match)\n`;

  return context;
}
