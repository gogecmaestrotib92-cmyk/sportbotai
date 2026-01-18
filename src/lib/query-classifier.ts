/**
 * Smart Query Classifier
 * 
 * Uses GPT-4o-mini with function calling to intelligently classify
 * sports queries into categories and extract entities.
 * 
 * This replaces the regex-based classification with AI-powered intent detection,
 * providing much better accuracy for complex queries.
 * 
 * Benefits:
 * - Better multi-language understanding (classifies meaning, not patterns)
 * - Entity extraction (player names, team names, stat types)
 * - Confidence scoring
 * - Determines data source needs (real-time vs API vs GPT-only)
 */

import OpenAI from 'openai';

// ============================================
// TYPES
// ============================================

export type QueryCategory =
    | 'PLAYER'           // Where does player X play? Who is player X?
    | 'ROSTER'           // Who plays for team X?
    | 'FIXTURE'          // When is the next game?
    | 'RESULT'           // What was the score?
    | 'STANDINGS'        // League table
    | 'STATS'            // Player/team statistics
    | 'INJURY'           // Injury updates
    | 'TRANSFER'         // Transfer news
    | 'MANAGER'          // Coach/manager info
    | 'ODDS'             // Betting odds (factual)
    | 'COMPARISON'       // Player/team comparisons
    | 'HISTORY'          // Historical records
    | 'BROADCAST'        // TV/streaming info
    | 'VENUE'            // Stadium info
    | 'PLAYER_PROP'      // Player prop questions (over/under on stats)
    | 'BETTING_ADVICE'   // Should I bet? (decline with analysis)
    | 'MATCH_ANALYSIS'   // Full match analysis request
    | 'HEAD_TO_HEAD'     // Head to head history
    | 'FORM'             // Recent form analysis
    | 'LINEUP'           // Expected/confirmed lineups
    | 'GENERAL';         // Generic sports question

export type SportKey =
    | 'basketball_nba' | 'basketball_euroleague' | 'basketball_ncaab'
    | 'soccer_epl' | 'soccer_la_liga' | 'soccer_serie_a' | 'soccer_bundesliga'
    | 'soccer_ligue_one' | 'soccer_ucl' | 'soccer_europa' | 'soccer_mls'
    | 'americanfootball_nfl' | 'americanfootball_ncaaf'
    | 'icehockey_nhl'
    | 'baseball_mlb'
    | 'mma_ufc'
    | 'tennis_atp' | 'tennis_wta'
    | 'unknown';

export interface QueryEntities {
    player_names?: string[];
    team_names?: string[];
    stat_type?: string;
    time_context?: 'today' | 'tomorrow' | 'this_week' | 'this_season' | 'last_game' | 'all_time' | 'specific_date';
    match_date?: string;
    league?: string;
    prop_line?: number;
    prop_type?: 'over' | 'under';
}

export interface ClassificationResult {
    category: QueryCategory;
    sport: SportKey;
    confidence: number;
    entities: QueryEntities;
    needs_realtime: boolean;
    needs_api_data: boolean;
    is_betting_related: boolean;
    original_query: string;
    reasoning?: string;
}

// ============================================
// OPENAI CLIENT (lazy init)
// ============================================

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

// ============================================
// CLASSIFICATION CACHE
// ============================================

// Simple in-memory cache to avoid re-classifying identical queries
const classificationCache = new Map<string, { result: ClassificationResult; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedClassification(query: string): ClassificationResult | null {
    const normalizedQuery = query.toLowerCase().trim();
    const cached = classificationCache.get(normalizedQuery);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log('[QueryClassifier] Cache hit for:', normalizedQuery.substring(0, 50));
        return cached.result;
    }

    return null;
}

function setCachedClassification(query: string, result: ClassificationResult): void {
    const normalizedQuery = query.toLowerCase().trim();
    classificationCache.set(normalizedQuery, { result, timestamp: Date.now() });

    // Cleanup old entries if cache gets too large
    if (classificationCache.size > 500) {
        const now = Date.now();
        const keysToDelete: string[] = [];
        classificationCache.forEach((value, key) => {
            if (now - value.timestamp > CACHE_TTL_MS) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => classificationCache.delete(key));
    }
}

// ============================================
// FUNCTION CALLING SCHEMA
// ============================================

const CLASSIFY_FUNCTION = {
    name: 'classify_sports_query',
    description: 'Classify a sports query into category, sport, and extract entities',
    parameters: {
        type: 'object' as const,
        properties: {
            category: {
                type: 'string',
                enum: [
                    'PLAYER', 'ROSTER', 'FIXTURE', 'RESULT', 'STANDINGS', 'STATS',
                    'INJURY', 'TRANSFER', 'MANAGER', 'ODDS', 'COMPARISON', 'HISTORY',
                    'BROADCAST', 'VENUE', 'PLAYER_PROP', 'BETTING_ADVICE', 'MATCH_ANALYSIS',
                    'HEAD_TO_HEAD', 'FORM', 'LINEUP', 'GENERAL'
                ],
                description: 'The primary category of the query'
            },
            sport: {
                type: 'string',
                enum: [
                    'basketball_nba', 'basketball_euroleague', 'basketball_ncaab',
                    'soccer_epl', 'soccer_la_liga', 'soccer_serie_a', 'soccer_bundesliga',
                    'soccer_ligue_one', 'soccer_ucl', 'soccer_europa', 'soccer_mls',
                    'americanfootball_nfl', 'americanfootball_ncaaf',
                    'icehockey_nhl', 'baseball_mlb', 'mma_ufc',
                    'tennis_atp', 'tennis_wta', 'unknown'
                ],
                description: 'The sport/league being asked about'
            },
            confidence: {
                type: 'number',
                description: 'Confidence score from 0.0 to 1.0'
            },
            entities: {
                type: 'object',
                properties: {
                    player_names: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Player names mentioned (full names preferred)'
                    },
                    team_names: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Team names mentioned'
                    },
                    stat_type: {
                        type: 'string',
                        description: 'Type of stat asked about (points, goals, rebounds, assists, etc.)'
                    },
                    time_context: {
                        type: 'string',
                        enum: ['today', 'tomorrow', 'this_week', 'this_season', 'last_game', 'all_time', 'specific_date'],
                        description: 'Time context of the query'
                    },
                    match_date: {
                        type: 'string',
                        description: 'Specific date mentioned if any (ISO format)'
                    },
                    league: {
                        type: 'string',
                        description: 'Specific league mentioned'
                    },
                    prop_line: {
                        type: 'number',
                        description: 'The prop line number if this is a player prop query (e.g., 25.5 for over 25.5 points)'
                    },
                    prop_type: {
                        type: 'string',
                        enum: ['over', 'under'],
                        description: 'Over or under for prop bets'
                    }
                }
            },
            needs_realtime: {
                type: 'boolean',
                description: 'Whether this query needs real-time/live data (injuries, breaking news, live scores)'
            },
            needs_api_data: {
                type: 'boolean',
                description: 'Whether this query needs structured API data (stats, standings, fixtures)'
            },
            is_betting_related: {
                type: 'boolean',
                description: 'Whether this query is related to betting/gambling'
            },
            reasoning: {
                type: 'string',
                description: 'Brief explanation of the classification'
            }
        },
        required: ['category', 'sport', 'confidence', 'needs_realtime', 'needs_api_data', 'is_betting_related']
    }
};

// ============================================
// SYSTEM PROMPT FOR CLASSIFIER
// ============================================

const CLASSIFIER_SYSTEM_PROMPT = `You are a sports query classifier. Your ONLY job is to analyze user questions about sports and output structured classification.

CLASSIFICATION RULES:

1. CATEGORY DETECTION:
   - STATS: Questions about player/team statistics, averages, totals, performance numbers
   - PLAYER_PROP: Specific over/under questions on player stats (e.g., "Jokic over 25.5 points")
   - BETTING_ADVICE: "Should I bet?", "Is this a good bet?", "Which team to bet on?"
   - MATCH_ANALYSIS: Match predictions/previews - "Analyze X vs Y", "X vs Y prediction", "What do you think about [team1] vs [team2]", any query asking for match analysis, preview, or prediction between two TEAMS
   - INJURY: Injury status, updates, who's out, availability
   - FIXTURE: When is the game, what time, schedule
   - RESULT: Final scores, who won, match results
   - STANDINGS: League table, rankings, positions
   - ROSTER: Who plays for a team, squad list
   - HEAD_TO_HEAD: Historical matchups between teams
   - FORM: Recent form, winning/losing streaks
   - LINEUP: Starting lineups, expected XI
   - TRANSFER: Transfer news, rumors, signings
   - COMPARISON: ONLY for PLAYER comparisons like "who is better, LeBron or Jordan?", "compare Messi and Ronaldo". This is NOT for team vs team match analysis!
   - GENERAL: Anything else sports-related

CRITICAL DISTINCTION:
- "analyze Lakers vs Celtics" = MATCH_ANALYSIS (team vs team match prediction)
- "who is better, LeBron or Curry?" = COMPARISON (player vs player comparison)
- If the query mentions "analyze", "prediction", "preview", or asks about an upcoming/recent MATCH between two TEAMS, use MATCH_ANALYSIS, NOT COMPARISON.

2. SPORT DETECTION:
   - Look for team names, player names, league mentions
   - NBA teams/players → basketball_nba
   - EPL teams (Arsenal, Liverpool, etc.) → soccer_epl
   - La Liga teams (Real Madrid, Barcelona) → soccer_la_liga
   - Serie A teams (Roma, Juventus, Inter) → soccer_serie_a
   - NFL teams/players → americanfootball_nfl
   - Default to 'unknown' if unclear

3. ENTITY EXTRACTION:
   - Always extract player names with full names when possible
   - Extract team names
   - Identify stat types (points, goals, rebounds, assists, etc.)
   - Note the time context

4. DATA NEEDS:
   - needs_realtime = true for: injuries, breaking news, live scores, today's games
   - needs_api_data = true for: stats, standings, fixtures, rosters, historical data
   - Both can be true for complex queries

5. BETTING DETECTION:
   - is_betting_related = true if query mentions: bet, betting, odds, over/under, prop, wager, parlay, should I, worth it, value, lock, pick

IMPORTANT: Always extract entities even if the query is in another language. Translate names to English when possible.`;

// ============================================
// MAIN CLASSIFICATION FUNCTION
// ============================================

/**
 * Classify a sports query using GPT-4o-mini with function calling.
 * Returns structured classification with category, sport, entities, and data needs.
 */
export async function classifyQuery(query: string): Promise<ClassificationResult> {
    // Check cache first
    const cached = getCachedClassification(query);
    if (cached) {
        return cached;
    }

    console.log('[QueryClassifier] Classifying:', query.substring(0, 100));

    try {
        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-4o-mini', // Fast and cheap for classification
            messages: [
                { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
                { role: 'user', content: query }
            ],
            tools: [{
                type: 'function',
                function: CLASSIFY_FUNCTION
            }],
            tool_choice: { type: 'function', function: { name: 'classify_sports_query' } },
            temperature: 0.1, // Low temperature for consistent classification
            max_tokens: 500,
        });

        const toolCall = response.choices[0]?.message?.tool_calls?.[0] as any;

        if (!toolCall || toolCall.function?.name !== 'classify_sports_query') {
            console.error('[QueryClassifier] No function call in response');
            return getDefaultClassification(query);
        }

        const args = JSON.parse(toolCall.function.arguments);

        const result: ClassificationResult = {
            category: args.category || 'GENERAL',
            sport: args.sport || 'unknown',
            confidence: args.confidence || 0.5,
            entities: args.entities || {},
            needs_realtime: args.needs_realtime ?? false,
            needs_api_data: args.needs_api_data ?? false,
            is_betting_related: args.is_betting_related ?? false,
            original_query: query,
            reasoning: args.reasoning,
        };

        console.log('[QueryClassifier] Result:', {
            category: result.category,
            sport: result.sport,
            confidence: result.confidence,
            entities: result.entities,
            needs_realtime: result.needs_realtime,
            needs_api_data: result.needs_api_data,
        });

        // Cache the result
        setCachedClassification(query, result);

        return result;

    } catch (error) {
        console.error('[QueryClassifier] Error:', error);
        return getDefaultClassification(query);
    }
}

/**
 * Fallback classification when GPT fails
 */
function getDefaultClassification(query: string): ClassificationResult {
    const lower = query.toLowerCase();

    // Simple keyword-based fallback
    let category: QueryCategory = 'GENERAL';
    let sport: SportKey = 'unknown';
    let needs_realtime = false;
    let needs_api_data = false;
    let is_betting_related = false;

    // Category detection
    if (/stats?|average|ppg|points|goals|assists|rebounds/i.test(lower)) {
        category = 'STATS';
        needs_api_data = true;
    } else if (/injur|hurt|out|sidelined|questionable|doubtful/i.test(lower)) {
        category = 'INJURY';
        needs_realtime = true;
    } else if (/vs\.?|versus|against|match|analyze|analysis|preview/i.test(lower)) {
        category = 'MATCH_ANALYSIS';
        needs_api_data = true;
        needs_realtime = true;
    } else if (/over|under|prop|o\/u|\+\d|\-\d/i.test(lower)) {
        category = 'PLAYER_PROP';
        needs_api_data = true;
        is_betting_related = true;
    } else if (/bet|wager|odds|should i|worth it|value/i.test(lower)) {
        category = 'BETTING_ADVICE';
        is_betting_related = true;
    } else if (/standings?|table|rank|position/i.test(lower)) {
        category = 'STANDINGS';
        needs_api_data = true;
    } else if (/when|schedule|fixture|next game|kick off/i.test(lower)) {
        category = 'FIXTURE';
        needs_api_data = true;
    } else if (/score|result|won|lost|beat/i.test(lower)) {
        category = 'RESULT';
        needs_api_data = true;
    }

    // Sport detection
    if (/nba|basketball|lakers|celtics|warriors|76ers|jokic|lebron|curry/i.test(lower)) {
        sport = 'basketball_nba';
    } else if (/nfl|chiefs|eagles|cowboys|patriots|mahomes|touchdown/i.test(lower)) {
        sport = 'americanfootball_nfl';
    } else if (/premier league|epl|arsenal|chelsea|liverpool|manchester/i.test(lower)) {
        sport = 'soccer_epl';
    } else if (/la liga|barcelona|real madrid|atletico/i.test(lower)) {
        sport = 'soccer_la_liga';
    } else if (/serie a|roma|juventus|inter|milan|napoli/i.test(lower)) {
        sport = 'soccer_serie_a';
    } else if (/bundesliga|bayern|dortmund|leverkusen/i.test(lower)) {
        sport = 'soccer_bundesliga';
    }

    return {
        category,
        sport,
        confidence: 0.3,
        entities: {},
        needs_realtime,
        needs_api_data,
        is_betting_related,
        original_query: query,
        reasoning: 'Fallback classification (GPT unavailable)',
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a classification indicates we need real-time data from Perplexity
 */
export function needsPerplexity(classification: ClassificationResult): boolean {
    return classification.needs_realtime ||
        ['INJURY', 'TRANSFER', 'LINEUP', 'BROADCAST'].includes(classification.category);
}

/**
 * Check if a classification indicates we need structured API data
 */
export function needsDataLayer(classification: ClassificationResult): boolean {
    return classification.needs_api_data ||
        ['STATS', 'STANDINGS', 'FIXTURE', 'ROSTER', 'RESULT'].includes(classification.category);
}

/**
 * Check if this is a betting-related query that needs special handling
 */
export function isBettingQuery(classification: ClassificationResult): boolean {
    return classification.is_betting_related ||
        ['BETTING_ADVICE', 'PLAYER_PROP', 'ODDS'].includes(classification.category);
}

/**
 * Get a human-readable category label
 */
export function getCategoryLabel(category: QueryCategory): string {
    const labels: Record<QueryCategory, string> = {
        PLAYER: 'Player Info',
        ROSTER: 'Team Roster',
        FIXTURE: 'Fixtures & Schedule',
        RESULT: 'Match Results',
        STANDINGS: 'Standings',
        STATS: 'Statistics',
        INJURY: 'Injury Updates',
        TRANSFER: 'Transfer News',
        MANAGER: 'Manager/Coach',
        ODDS: 'Odds',
        COMPARISON: 'Comparison',
        HISTORY: 'Historical Data',
        BROADCAST: 'Broadcast Info',
        VENUE: 'Venue Info',
        PLAYER_PROP: 'Player Props',
        BETTING_ADVICE: 'Betting Analysis',
        MATCH_ANALYSIS: 'Match Analysis',
        HEAD_TO_HEAD: 'Head to Head',
        FORM: 'Form Analysis',
        LINEUP: 'Lineups',
        GENERAL: 'General',
    };
    return labels[category] || category;
}

/**
 * Clear the classification cache (useful for testing)
 */
export function clearClassificationCache(): void {
    classificationCache.clear();
    console.log('[QueryClassifier] Cache cleared');
}
