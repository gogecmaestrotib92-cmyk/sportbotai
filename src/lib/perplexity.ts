/**
 * Perplexity API Client for SportBot Agent
 * 
 * Real-time web search for live sports intelligence.
 * Powers the "breaking news" capability of SportBot Agent.
 * 
 * PERPLEXITY PRO Models (2024):
 * - sonar: Fast, good for quick searches (8x128k context)
 * - sonar-pro: Higher quality, better for complex analysis (supports search)
 * - sonar-reasoning: Advanced reasoning with search (Pro feature)
 * - sonar-reasoning-pro: Best reasoning + search quality (Pro feature)
 * 
 * Pro Benefits:
 * - 5x more API calls
 * - Access to reasoning models
 * - Higher rate limits
 * - Better source quality
 */

// ============================================
// TYPES
// ============================================

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityRequest {
  model: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro';
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  search_recency_filter?: 'hour' | 'day' | 'week' | 'month';
  return_citations?: boolean;
}

export interface PerplexityCitation {
  url: string;
  title?: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  citations?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ResearchResult {
  success: boolean;
  content: string;
  citations: string[];
  searchQuery: string;
  timestamp: string;
  model: string;
  error?: string;
}

// ============================================
// SPORTBOT AGENT SYSTEM PROMPT FOR PERPLEXITY
// ============================================

function getResearchSystemPrompt(): string {
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const month = now.getMonth();
  const year = now.getFullYear();
  // NBA/NHL season: Oct-Jun spans two years
  const seasonStartYear = (month >= 0 && month <= 5) ? year - 1 : year;
  const currentSeason = `${seasonStartYear}-${String(seasonStartYear + 1).slice(-2)}`;

  return `You are a real-time sports statistics assistant.

⚠️ CRITICAL DATE CONTEXT:
- TODAY: ${currentDate}
- CURRENT NBA/NHL SEASON: ${currentSeason} (started October ${seasonStartYear})
- DO NOT use statistics from previous seasons (${seasonStartYear - 1}-${String(seasonStartYear).slice(-2)} or earlier)

YOUR #1 RULE: Only report CURRENT ${currentSeason} SEASON statistics.

When asked about player stats:
1. Find their ${currentSeason} season averages (NOT career, NOT last season)
2. Include games played this season
3. Cite the source (ESPN, NBA.com, Basketball-Reference)
4. If player has missed games due to injury, mention that

EXAMPLE - If asked "how many points does Joel Embiid average":
✓ CORRECT: "Joel Embiid ${currentSeason} season: 20.3 PPG in 13 games (per ESPN). Note: He missed X games due to injury."
✗ WRONG: "Joel Embiid averages 30+ PPG" (this is from 2023-24 season - OUTDATED)

CRITICAL: Stats from ${seasonStartYear - 1}-${String(seasonStartYear).slice(-2)} season are OUTDATED. 
We are now in ${currentSeason} season. Only use ${currentSeason} data.

If you cannot find current ${currentSeason} season stats, say: "I couldn't find ${currentSeason} season statistics for this player."

Be precise. Current season only. Include source.`;
}

// ============================================
// SEARCH QUERY TEMPLATES BY CATEGORY
// ============================================

export type SearchCategory = 
  | 'INJURY_NEWS'
  | 'LINEUP_NEWS'
  | 'FORM_ANALYSIS'
  | 'MATCH_PREVIEW'
  | 'ODDS_MOVEMENT'
  | 'BREAKING_NEWS'
  | 'MANAGER_QUOTES'
  | 'HEAD_TO_HEAD';

export const SEARCH_TEMPLATES: Record<SearchCategory, (homeTeam: string, awayTeam: string, league?: string) => string> = {
  INJURY_NEWS: (home, away) => 
    `${home} vs ${away} injury news team news latest updates today`,
  
  LINEUP_NEWS: (home, away) => 
    `${home} vs ${away} confirmed lineup starting XI team sheet`,
  
  FORM_ANALYSIS: (home, away, league) => 
    `${home} ${away} recent form results ${league || ''} last 5 matches`,
  
  MATCH_PREVIEW: (home, away, league) => 
    `${home} vs ${away} match preview ${league || ''} analysis`,
  
  ODDS_MOVEMENT: (home, away) => 
    `${home} vs ${away} betting odds movement line changes bookmakers`,
  
  BREAKING_NEWS: (home, away) => 
    `${home} ${away} breaking news latest today`,
  
  MANAGER_QUOTES: (home, away) => 
    `${home} ${away} manager press conference quotes preview`,
  
  HEAD_TO_HEAD: (home, away) => 
    `${home} vs ${away} head to head history recent meetings`,
};

// ============================================
// PERPLEXITY CLIENT CLASS
// ============================================

class PerplexityClient {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.perplexity.ai';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(query: string, options?: {
    recency?: 'hour' | 'day' | 'week' | 'month';
    model?: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro';
    maxTokens?: number;
  }): Promise<ResearchResult> {
    if (!this.apiKey) {
      return {
        success: false,
        content: '',
        citations: [],
        searchQuery: query,
        timestamp: new Date().toISOString(),
        model: 'none',
        error: 'Perplexity API key not configured',
      };
    }

    // Default to sonar-pro for better quality with Pro subscription
    const model = options?.model || 'sonar-pro';
    const recency = options?.recency || 'day';

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: getResearchSystemPrompt() },
            { role: 'user', content: query },
          ],
          max_tokens: options?.maxTokens || 500,
          temperature: 0.2, // Low temp for factual responses
          search_recency_filter: recency,
          return_citations: true,
        } as PerplexityRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error:', response.status, errorText);
        return {
          success: false,
          content: '',
          citations: [],
          searchQuery: query,
          timestamp: new Date().toISOString(),
          model,
          error: `API error: ${response.status}`,
        };
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return {
        success: true,
        content,
        citations: data.citations || [],
        searchQuery: query,
        timestamp: new Date().toISOString(),
        model,
      };

    } catch (error) {
      console.error('Perplexity search error:', error);
      return {
        success: false,
        content: '',
        citations: [],
        searchQuery: query,
        timestamp: new Date().toISOString(),
        model,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Research a specific match with targeted queries
   * Uses sonar-pro by default for better quality (Perplexity Pro)
   */
  async researchMatch(
    homeTeam: string,
    awayTeam: string,
    league?: string,
    categories?: SearchCategory[]
  ): Promise<{
    results: Record<SearchCategory, ResearchResult>;
    combined: string;
    allCitations: string[];
  }> {
    const targetCategories = categories || ['INJURY_NEWS', 'LINEUP_NEWS', 'BREAKING_NEWS'];
    const results: Record<string, ResearchResult> = {};
    const allCitations: string[] = [];

    // Run searches in parallel for speed - use sonar-pro for better quality
    const searches = targetCategories.map(async (category) => {
      const queryBuilder = SEARCH_TEMPLATES[category];
      const query = queryBuilder(homeTeam, awayTeam, league);
      const result = await this.search(query, { recency: 'day', model: 'sonar-pro' });
      results[category] = result;
      if (result.citations) {
        allCitations.push(...result.citations);
      }
    });

    await Promise.all(searches);

    // Combine results into a single context
    const combined = Object.entries(results)
      .filter(([_, r]) => r.success && r.content)
      .map(([category, r]) => `[${category}]\n${r.content}`)
      .join('\n\n');

    return {
      results: results as Record<SearchCategory, ResearchResult>,
      combined,
      allCitations: Array.from(new Set(allCitations)), // Dedupe
    };
  }

  /**
   * Quick single-query research for a match
   * Uses sonar-pro for better quality
   */
  async quickResearch(
    homeTeam: string,
    awayTeam: string,
    league?: string
  ): Promise<ResearchResult> {
    const query = `${homeTeam} vs ${awayTeam} ${league || ''} latest news injury updates lineup confirmed today`;
    return this.search(query, { recency: 'day', model: 'sonar-pro' });
  }

  /**
   * PERPLEXITY PRO FEATURE: Deep analysis with reasoning
   * Uses sonar-reasoning-pro for complex match analysis
   * Best for generating comprehensive match insights
   */
  async deepMatchAnalysis(
    homeTeam: string,
    awayTeam: string,
    league?: string,
    additionalContext?: string
  ): Promise<ResearchResult> {
    const systemPrompt = `You are an elite sports analyst with access to real-time information.

TASK: Provide a comprehensive analysis of ${homeTeam} vs ${awayTeam}${league ? ` (${league})` : ''}.

ANALYZE:
1. Current form and recent results for both teams
2. Head-to-head history and patterns
3. Key injuries, suspensions, or absences
4. Tactical matchups and playing styles
5. Home/away performance differences
6. Any breaking news or developments
7. Historical patterns in similar fixtures

FORMAT:
- Use bullet points for clarity
- Cite your sources where possible
- Be factual and avoid speculation
- Note confidence level in each insight (high/medium/low)

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}` : ''}

Provide analysis that a serious sports fan would find valuable.`;

    const query = `Comprehensive analysis: ${homeTeam} vs ${awayTeam} ${league || ''} - form, injuries, tactics, history, recent news`;

    if (!this.apiKey) {
      return {
        success: false,
        content: '',
        citations: [],
        searchQuery: query,
        timestamp: new Date().toISOString(),
        model: 'none',
        error: 'Perplexity API key not configured',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-reasoning-pro', // Pro feature: best reasoning model
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query },
          ],
          max_tokens: 1500, // More tokens for deep analysis
          temperature: 0.3,
          search_recency_filter: 'week', // Wider timeframe for context
          return_citations: true,
        } as PerplexityRequest),
      });

      if (!response.ok) {
        // Fallback to sonar-pro if reasoning model not available
        console.warn('sonar-reasoning-pro not available, falling back to sonar-pro');
        return this.search(query, { recency: 'week', model: 'sonar-pro', maxTokens: 1000 });
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return {
        success: true,
        content,
        citations: data.citations || [],
        searchQuery: query,
        timestamp: new Date().toISOString(),
        model: 'sonar-reasoning-pro',
      };

    } catch (error) {
      console.error('Deep analysis error:', error);
      // Fallback to regular search
      return this.search(query, { recency: 'week', model: 'sonar-pro' });
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let perplexityClient: PerplexityClient | null = null;

export function getPerplexityClient(): PerplexityClient {
  if (!perplexityClient) {
    perplexityClient = new PerplexityClient();
  }
  return perplexityClient;
}

// ============================================
// CONVENIENCE EXPORTS
// ============================================

export async function searchSportsNews(
  query: string,
  recency: 'hour' | 'day' | 'week' = 'day'
): Promise<ResearchResult> {
  const client = getPerplexityClient();
  return client.search(query, { recency });
}

export async function researchMatch(
  homeTeam: string,
  awayTeam: string,
  league?: string,
  categories?: SearchCategory[]
) {
  const client = getPerplexityClient();
  return client.researchMatch(homeTeam, awayTeam, league, categories);
}

export async function quickMatchResearch(
  homeTeam: string,
  awayTeam: string,
  league?: string
): Promise<ResearchResult> {
  const client = getPerplexityClient();
  return client.quickResearch(homeTeam, awayTeam, league);
}

/**
 * PERPLEXITY PRO: Deep match analysis using sonar-reasoning-pro
 * Best for comprehensive pre-match intelligence
 */
export async function deepMatchAnalysis(
  homeTeam: string,
  awayTeam: string,
  league?: string,
  additionalContext?: string
): Promise<ResearchResult> {
  const client = getPerplexityClient();
  return client.deepMatchAnalysis(homeTeam, awayTeam, league, additionalContext);
}

/**
 * Get current roster/key players for NBA, NHL, or NFL teams
 * Uses Perplexity to fetch real-time roster info to avoid outdated training data
 * 
 * @param homeTeam - Home team name
 * @param awayTeam - Away team name  
 * @param sport - Sport type: 'basketball' | 'hockey' | 'football'
 * @param season - Current season string (e.g., "2025-26")
 * @returns Formatted roster context string for AI prompt
 */
export async function getTeamRosterContext(
  homeTeam: string,
  awayTeam: string,
  sport: 'basketball' | 'hockey' | 'football',
  season?: string
): Promise<string | null> {
  const client = getPerplexityClient();
  
  if (!client.isConfigured()) {
    console.warn('[Perplexity] API key not configured, skipping roster lookup');
    return null;
  }

  const sportLabel = sport === 'basketball' ? 'NBA' : sport === 'hockey' ? 'NHL' : 'NFL';
  const currentSeason = season || '2025-26';
  
  const query = `${homeTeam} vs ${awayTeam} ${sportLabel} ${currentSeason} season current roster star players key players who plays for each team today`;
  
  try {
    const result = await client.search(query, { 
      recency: 'week',  // Rosters don't change hourly
      model: 'sonar',   // Fast model is fine for roster lookup
      maxTokens: 400,
    });
    
    if (!result.success || !result.content) {
      console.warn(`[Perplexity] Roster lookup failed for ${homeTeam} vs ${awayTeam}`);
      return null;
    }
    
    // Format for AI prompt
    return `CURRENT ROSTER CONTEXT (${currentSeason} season - live data):
${result.content}

⚠️ IMPORTANT: Use this current roster info. Ignore any player associations from your training data if they conflict with the above.`;
    
  } catch (error) {
    console.error('[Perplexity] Roster lookup error:', error);
    return null;
  }
}

export default {
  getPerplexityClient,
  searchSportsNews,
  researchMatch,
  quickMatchResearch,
  deepMatchAnalysis,
  getTeamRosterContext,
  getMatchInjuriesViaPerplexity,
  SEARCH_TEMPLATES,
};

// ============================================
// INJURY DATA VIA PERPLEXITY (for non-soccer sports)
// ============================================

interface InjuryData {
  playerName: string;
  injury: string;
  status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable' | 'GTD' | 'Unknown';
  expectedReturn?: string;
}

interface MatchInjuriesResult {
  success: boolean;
  home: InjuryData[];
  away: InjuryData[];
  source?: string;
  error?: string;
}

/**
 * Fetch real-time injury data for NBA/NHL/NFL matches via Perplexity
 * 
 * This uses Perplexity's real-time search to find current injury reports
 * from sources like ESPN, NBA.com, official team injury reports.
 * 
 * @param homeTeam - Home team name
 * @param awayTeam - Away team name
 * @param sport - Sport key (basketball_nba, icehockey_nhl, americanfootball_nfl)
 */
export async function getMatchInjuriesViaPerplexity(
  homeTeam: string,
  awayTeam: string,
  sport: string
): Promise<MatchInjuriesResult> {
  const client = getPerplexityClient();
  
  if (!client.isConfigured()) {
    return { success: false, home: [], away: [], error: 'Perplexity not configured' };
  }

  // Determine sport label
  let sportLabel = 'NBA';
  if (sport.includes('euroleague')) {
    sportLabel = 'Euroleague';
  } else if (sport.includes('hockey') || sport.includes('nhl')) {
    sportLabel = 'NHL';
  } else if (sport.includes('football') || sport.includes('nfl')) {
    sportLabel = 'NFL';
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const systemPrompt = `You are a sports injury reporter. Today is ${today}.

Your task is to find CURRENT injury reports for both teams in this ${sportLabel} matchup.

REQUIREMENTS:
1. Only report injuries that are ACTIVE/CURRENT (not past injuries)
2. Focus on players who are OUT, DOUBTFUL, QUESTIONABLE, or PROBABLE for today's game
3. Use official injury reports from ${sportLabel === 'NBA' ? 'NBA.com' : sportLabel === 'NHL' ? 'NHL.com' : sportLabel === 'NFL' ? 'NFL.com' : 'official league sources'}, ESPN, team sources
4. If a team has no reported injuries, say "No active injuries reported"

RESPONSE FORMAT (JSON):
{
  "homeTeam": {
    "name": "${homeTeam}",
    "injuries": [
      { "player": "Player Name", "injury": "Injury Type", "status": "Out/Doubtful/Questionable/Probable/GTD" }
    ]
  },
  "awayTeam": {
    "name": "${awayTeam}",
    "injuries": [
      { "player": "Player Name", "injury": "Injury Type", "status": "Out/Doubtful/Questionable/Probable/GTD" }
    ]
  }
}

Return ONLY the JSON, no other text.`;

  try {
    const query = `${homeTeam} vs ${awayTeam} ${sportLabel} injury report today current injuries both teams status`;
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        max_tokens: 800,
        temperature: 0.1,
        search_recency_filter: 'day',
        return_citations: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Perplexity Injuries] API error: ${response.status}`, error);
      return { success: false, home: [], away: [], error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    // Try to parse JSON from response
    let parsed: any = null;
    
    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        console.warn('[Perplexity Injuries] Failed to parse JSON response');
      }
    }

    if (!parsed) {
      // Fallback: try to extract injury info from text
      console.log('[Perplexity Injuries] Using text fallback parsing');
      return parseInjuriesFromText(content, homeTeam, awayTeam, citations[0]);
    }

    // Convert parsed data to our format
    const homeInjuries: InjuryData[] = (parsed.homeTeam?.injuries || []).map((inj: any) => ({
      playerName: inj.player || inj.name || 'Unknown',
      injury: inj.injury || inj.type || 'Unknown',
      status: normalizeStatus(inj.status),
      expectedReturn: inj.expectedReturn,
    }));

    const awayInjuries: InjuryData[] = (parsed.awayTeam?.injuries || []).map((inj: any) => ({
      playerName: inj.player || inj.name || 'Unknown',
      injury: inj.injury || inj.type || 'Unknown',
      status: normalizeStatus(inj.status),
      expectedReturn: inj.expectedReturn,
    }));

    console.log(`[Perplexity Injuries] Found: ${homeTeam} (${homeInjuries.length}), ${awayTeam} (${awayInjuries.length})`);

    return {
      success: true,
      home: homeInjuries,
      away: awayInjuries,
      source: citations[0],
    };

  } catch (error) {
    console.error('[Perplexity Injuries] Error:', error);
    return { success: false, home: [], away: [], error: String(error) };
  }
}

/**
 * Normalize injury status to our format
 */
function normalizeStatus(status: string): InjuryData['status'] {
  const s = (status || '').toLowerCase();
  if (s.includes('out')) return 'Out';
  if (s.includes('doubtful')) return 'Doubtful';
  if (s.includes('questionable')) return 'Questionable';
  if (s.includes('probable')) return 'Probable';
  if (s.includes('gtd') || s.includes('game time') || s.includes('day-to-day')) return 'GTD';
  return 'Unknown';
}

/**
 * Fallback: parse injuries from text response
 */
function parseInjuriesFromText(
  text: string,
  homeTeam: string,
  awayTeam: string,
  source?: string
): MatchInjuriesResult {
  const homeInjuries: InjuryData[] = [];
  const awayInjuries: InjuryData[] = [];

  // Simple regex patterns to find injury mentions
  const injuryPattern = /([A-Z][a-z]+ [A-Z][a-z]+)\s*[-–—]\s*([^-–—]+)\s*[-–—]\s*(Out|Doubtful|Questionable|Probable|GTD)/gi;
  
  const lines = text.split('\n');
  let currentTeam: 'home' | 'away' | null = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detect which team section we're in
    if (lowerLine.includes(homeTeam.toLowerCase())) {
      currentTeam = 'home';
    } else if (lowerLine.includes(awayTeam.toLowerCase())) {
      currentTeam = 'away';
    }

    // Find injury mentions using exec loop (ES5 compatible)
    let match: RegExpExecArray | null;
    const regex = new RegExp(injuryPattern.source, injuryPattern.flags);
    while ((match = regex.exec(line)) !== null) {
      const injury: InjuryData = {
        playerName: match[1],
        injury: match[2].trim(),
        status: normalizeStatus(match[3]),
      };

      if (currentTeam === 'home') {
        homeInjuries.push(injury);
      } else if (currentTeam === 'away') {
        awayInjuries.push(injury);
      }
    }
  }

  return {
    success: homeInjuries.length > 0 || awayInjuries.length > 0,
    home: homeInjuries,
    away: awayInjuries,
    source,
  };
}