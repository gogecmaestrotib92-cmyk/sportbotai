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

  return `You are a real-time sports data assistant. Your job is to find and report EXACT, VERIFIED data.

TODAY'S DATE: ${currentDate}
CURRENT NBA/NHL/FOOTBALL SEASON: ${currentSeason}

CRITICAL RULES:
1. ONLY report data you find from sources - NEVER guess or estimate
2. Include EXACT numbers (averages, totals, per-game stats)
3. Always cite which source the data comes from
4. If you cannot find specific data, say "No data found" - do NOT make up numbers

FOR PLAYER STATS QUERIES:
- Report current season statistics with EXACT numbers
- Include: PPG/Goals, Assists, Games Played, Minutes
- Specify the season (e.g., "2025-26 NBA season")
- Name the source (e.g., "per Basketball-Reference", "per ESPN")

FOR MATCH/TEAM QUERIES:
- Confirmed team news and lineups
- Injury updates and returns  
- Recent form and results
- Breaking news affecting the match

OUTPUT FORMAT:
- Lead with the EXACT data requested
- Include source name for verification
- If multiple sources disagree, show both
- If no reliable data found, clearly state that

EXAMPLES OF GOOD RESPONSES:
✓ "Joel Embiid: 24.3 PPG, 7.8 RPG in 12 games (2025-26 season, per ESPN)"
✓ "Luka Dončić: 28.1 PPG, 8.3 APG, 7.9 RPG (2025-26 season, per Basketball-Reference)"
✓ "No current season statistics found for this player"

EXAMPLES OF BAD RESPONSES:
✗ "He averages around 25 points" (no source, vague)
✗ "He's one of the top scorers" (no exact number)
✗ Making up numbers when data isn't found

Be precise. Include sources. Never invent data.`;
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
  SEARCH_TEMPLATES,
};