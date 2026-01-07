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
  // Pattern: Team1 vs Team2
  const vsMatch = message.match(/([A-Z][a-zA-Z\s]+?)\s*(?:vs?\.?|x|-|@)\s*([A-Z][a-zA-Z\s]+?)(?:\s|$|\?|,)/i);
  if (vsMatch) {
    return { 
      team1: vsMatch[1].trim().replace(/\s+/g, ' '),
      team2: vsMatch[2].trim().replace(/\s+/g, ' ')
    };
  }
  
  // Single team: "Arsenal match prediction"
  const singleMatch = message.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:match|game|utakmica|meč)/i);
  if (singleMatch) {
    return { team1: singleMatch[1].trim() };
  }
  
  // Look for common team names
  const teamPatterns = [
    // Premier League
    /(Arsenal|Chelsea|Liverpool|Manchester United|Manchester City|Tottenham|Newcastle|Brighton|Aston Villa|West Ham|Fulham|Brentford|Crystal Palace|Everton|Nottingham Forest|Wolves|Bournemouth|Ipswich|Leicester|Southampton)/gi,
    // La Liga
    /(Real Madrid|Barcelona|Atletico Madrid|Sevilla|Real Betis|Villarreal|Athletic Bilbao|Real Sociedad)/gi,
    // Serie A
    /(Juventus|Inter|AC Milan|Roma|Napoli|Lazio|Atalanta|Fiorentina)/gi,
    // Bundesliga
    /(Bayern|Dortmund|Leipzig|Leverkusen|Frankfurt|Wolfsburg)/gi,
  ];
  
  for (const pattern of teamPatterns) {
    const matches = message.match(pattern);
    if (matches && matches.length >= 1) {
      return { 
        team1: matches[0],
        team2: matches.length > 1 ? matches[1] : undefined
      };
    }
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
