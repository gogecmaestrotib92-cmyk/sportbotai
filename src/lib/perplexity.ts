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

  return `You are a real-time SPORTS statistics and news assistant.

⚠️ CRITICAL: SPORTS ONLY
- You ONLY search for and report SPORTS information
- NEVER include: politics, elections, general news, weather, stocks, crypto, entertainment, tech
- If a query is not sports-related, respond: "This query is outside my sports-only scope."
- "Breaking news" = SPORTS breaking news (trades, injuries, scores, suspensions, etc.)
- "What's happening" = SPORTS events only

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
// SOCCER ROSTER VALIDATION
// ============================================

// Known players for top Premier League teams (2025-26 season)
// This prevents Perplexity from returning players from other teams
const KNOWN_SOCCER_ROSTERS: Record<string, string[]> = {
  'arsenal': [
    'raya', 'ramsdale', 'saliba', 'gabriel', 'white', 'zinchenko', 'timber', 'kiwior', 'tomiyasu', 'calafiori',
    'rice', 'partey', 'odegaard', 'havertz', 'saka', 'martinelli', 'trossard', 'jesus', 'nketiah', 'nelson',
    'vieira', 'smith rowe', 'jorginho', 'sterling', 'merino', 'mosquera', 'dowman', 'ethan nwaneri', 'lewis-skelly'
  ],
  'liverpool': [
    'alisson', 'kelleher', 'van dijk', 'konate', 'gomez', 'quansah', 'robertson', 'tsimikas', 'alexander-arnold', 'bradley',
    'mac allister', 'gravenberch', 'szoboszlai', 'jones', 'endo', 'bajcetic', 'elliott', 'morton',
    'salah', 'diaz', 'jota', 'gakpo', 'nunez', 'chiesa', 'carvalho'
  ],
  'manchester city': [
    'ederson', 'ortega', 'walker', 'stones', 'dias', 'akanji', 'ake', 'gvardiol', 'lewis', 'josko',
    'rodri', 'kovacic', 'bernardo', 'de bruyne', 'foden', 'grealish', 'doku', 'mcatee', 'savinho',
    'haaland', 'alvarez', 'nunes', 'bobb', 'wright'
  ],
  'manchester united': [
    'onana', 'bayindir', 'maguire', 'martinez', 'varane', 'lindelof', 'shaw', 'dalot', 'malacia', 'evans', 'yoro',
    'casemiro', 'mainoo', 'fernandes', 'mount', 'eriksen', 'mctominay', 'amad', 'antony', 'garnacho',
    'rashford', 'hojlund', 'zirkzee', 'wheatley', 'ugarte'
  ],
  'chelsea': [
    'sanchez', 'petrovic', 'chalobah', 'fofana', 'colwill', 'disasi', 'badiashile', 'cucurella', 'gusto', 'james',
    'caicedo', 'fernandez', 'lavia', 'gallagher', 'chukwuemeka', 'dewsbury-hall', 'palmer', 'madueke', 'mudryk',
    'nkunku', 'jackson', 'neto', 'sancho', 'felix', 'george'
  ],
  'tottenham': [
    'vicario', 'forster', 'romero', 'van de ven', 'dragusin', 'davies', 'udogie', 'porro', 'emerson', 'spence',
    'bissouma', 'bentancur', 'sarr', 'maddison', 'kulusevski', 'johnson', 'bergvall', 'gray',
    'son', 'richarlison', 'solanke', 'moore', 'lankshear', 'werner'
  ],
  'newcastle': [
    'pope', 'dubravka', 'trippier', 'botman', 'schar', 'lascelles', 'krafth', 'livramento', 'hall', 'kelly',
    'tonali', 'guimaraes', 'joelinton', 'longstaff', 'willock', 'miley',
    'isak', 'gordon', 'barnes', 'almiron', 'murphy', 'osula', 'wilson'
  ],
  'aston villa': [
    'martinez', 'olsen', 'carlos', 'torres', 'konsa', 'mings', 'digne', 'cash', 'maatsen', 'nedeljkovic',
    'kamara', 'onana', 'tielemans', 'mcginn', 'ramsey', 'bailey', 'buendia', 'rogers',
    'watkins', 'duran', 'philogene'
  ],
  'real madrid': [
    'courtois', 'lunin', 'militao', 'rudiger', 'alaba', 'carvajal', 'mendy', 'garcia', 'vallejo', 'fran garcia',
    'tchouameni', 'camavinga', 'valverde', 'modric', 'bellingham', 'ceballos', 'guler',
    'vinicius', 'rodrygo', 'mbappe', 'endrick', 'brahim', 'joselu'
  ],
  'barcelona': [
    'ter stegen', 'pena', 'kounde', 'araujo', 'christensen', 'inigo martinez', 'balde', 'cancelo', 'fort', 'cubarsi',
    'pedri', 'gavi', 'de jong', 'fermín', 'casado', 'bernal', 'torre',
    'yamal', 'raphinha', 'lewandowski', 'ferran', 'fati', 'victor', 'pau'
  ],
  'bayern munich': [
    'neuer', 'ulreich', 'upamecano', 'kim', 'dier', 'de ligt', 'davies', 'kimmich', 'guerreiro', 'mazraoui', 'stanisic',
    'goretzka', 'laimer', 'musiala', 'sane', 'gnabry', 'coman', 'muller', 'olise', 'palhinha',
    'kane', 'tel'
  ],
};

// ============================================
// NBA ROSTER VALIDATION
// ============================================

// Known players for NBA teams (2025-26 season) - key players only
const KNOWN_NBA_ROSTERS: Record<string, string[]> = {
  'lakers': [
    'james', 'lebron', 'davis', 'reaves', 'russell', 'hachimura', 'vanderbilt', 'christie', 'vincent', 'wood', 'prince', 'hayes', 'reddish', 'knecht', 'koloko'
  ],
  'celtics': [
    'tatum', 'brown', 'porzingis', 'white', 'holiday', 'horford', 'pritchard', 'hauser', 'kornet', 'tillman', 'walsh', 'banton'
  ],
  'warriors': [
    'curry', 'thompson', 'wiggins', 'green', 'looney', 'kuminga', 'poole', 'payton', 'moody', 'podz', 'jackson', 'santos'
  ],
  'bucks': [
    'antetokounmpo', 'giannis', 'lillard', 'middleton', 'portis', 'lopez', 'beverly', 'connaughton', 'ingles', 'beauchamp', 'livingston'
  ],
  'nuggets': [
    'jokic', 'murray', 'porter', 'gordon', 'caldwell-pope', 'braun', 'watson', 'strawther', 'pickett', 'cancar'
  ],
  'suns': [
    'durant', 'booker', 'beal', 'nurkic', 'allen', 'goodwin', 'okogie', 'eubanks', 'bol', 'warren', 'lee'
  ],
  'mavericks': [
    'doncic', 'luka', 'irving', 'kyrie', 'lively', 'gafford', 'washington', 'hardaway', 'exum', 'kleber', 'hardy', 'green'
  ],
  'clippers': [
    'leonard', 'kawhi', 'george', 'westbrook', 'zubac', 'hyland', 'powell', 'batum', 'mann', 'plumlee', 'boston', 'coffey'
  ],
  'heat': [
    'butler', 'herro', 'adebayo', 'bam', 'lowry', 'robinson', 'strus', 'vincent', 'martin', 'love', 'highsmith', 'jovic'
  ],
  'knicks': [
    'brunson', 'randle', 'anunoby', 'hart', 'robinson', 'divincenzo', 'bridges', 'mcbride', 'toppin', 'grimes', 'sims'
  ],
  '76ers': [
    'embiid', 'maxey', 'george', 'oubre', 'yabusele', 'drummond', 'gordon', 'mccain', 'martin', 'riller'
  ],
  'thunder': [
    'gilgeous-alexander', 'shai', 'holmgren', 'chet', 'williams', 'dort', 'giddey', 'wallace', 'mann', 'muscala'
  ],
  'timberwolves': [
    'edwards', 'gobert', 'randle', 'conley', 'reid', 'mcdaniels', 'dillingham', 'minott', 'alexander-walker'
  ],
  'cavaliers': [
    'mitchell', 'garland', 'mobley', 'allen', 'levert', 'okoro', 'strus', 'niang', 'merrill', 'wade'
  ],
};

// ============================================
// NHL ROSTER VALIDATION
// ============================================

const KNOWN_NHL_ROSTERS: Record<string, string[]> = {
  'maple leafs': [
    'matthews', 'marner', 'nylander', 'tavares', 'rielly', 'mccabe', 'jarnkrok', 'domi', 'bertuzzi', 'kampf', 'woll', 'stolarz'
  ],
  'oilers': [
    'mcdavid', 'draisaitl', 'hyman', 'nugent-hopkins', 'nurse', 'bouchard', 'skinner', 'pickard', 'brown', 'henrique', 'arvidsson'
  ],
  'bruins': [
    'pastrnak', 'marchand', 'zacha', 'coyle', 'lindholm', 'mcavoy', 'carlo', 'swayman', 'ullmark', 'frederic'
  ],
  'avalanche': [
    'mackinnon', 'rantanen', 'makar', 'landeskog', 'nichushkin', 'lehkonen', 'georgiev', 'toews', 'johnson'
  ],
  'panthers': [
    'barkov', 'reinhart', 'tkachuk', 'verhaeghe', 'ekblad', 'bobrovsky', 'lundell', 'forsling', 'rodrigues'
  ],
  'rangers': [
    'panarin', 'zibanejad', 'kreider', 'trocheck', 'lafreniere', 'fox', 'shesterkin', 'lindgren', 'chytil'
  ],
  'hurricanes': [
    'aho', 'svechnikov', 'kotkaniemi', 'staal', 'slavin', 'burns', 'andersen', 'kochetkov', 'jarvis'
  ],
  'golden knights': [
    'eichel', 'stone', 'marchessault', 'barbashev', 'pietrangelo', 'theodore', 'hill', 'thompson', 'howden'
  ],
  'stars': [
    'robertson', 'hintz', 'pavelski', 'benn', 'heiskanen', 'oettinger', 'seguin', 'duchene', 'steel'
  ],
  'lightning': [
    'kucherov', 'stamkos', 'point', 'hedman', 'sergachev', 'vasilevskiy', 'cirelli', 'hagel', 'paul'
  ],
};

// ============================================
// NFL ROSTER VALIDATION
// ============================================

const KNOWN_NFL_ROSTERS: Record<string, string[]> = {
  'chiefs': [
    'mahomes', 'kelce', 'pacheco', 'rice', 'moore', 'worthy', 'jones', 'bolton', 'sneed', 'mcduffie', 'karlaftis'
  ],
  'eagles': [
    'hurts', 'barkley', 'brown', 'smith', 'goedert', 'johnson', 'dickerson', 'hargrave', 'bradberry', 'slay'
  ],
  'bills': [
    'allen', 'josh', 'diggs', 'cook', 'shakir', 'kincaid', 'morse', 'von miller', 'ed oliver', 'milano'
  ],
  '49ers': [
    'purdy', 'mccaffrey', 'aiyuk', 'samuel', 'kittle', 'williams', 'bosa', 'warner', 'greenlaw', 'lenoir'
  ],
  'cowboys': [
    'prescott', 'lamb', 'elliott', 'parsons', 'diggs', 'gilmore', 'smith', 'martin', 'overshown'
  ],
  'dolphins': [
    'tagovailoa', 'tua', 'hill', 'waddle', 'mostert', 'armstead', 'chubb', 'wilkins', 'holland', 'ramsey'
  ],
  'ravens': [
    'jackson', 'lamar', 'henry', 'flowers', 'andrews', 'hamilton', 'humphrey', 'oweh', 'madubuike', 'roquan'
  ],
  'lions': [
    'goff', 'gibbs', 'st brown', 'laporta', 'sewell', 'hutchinson', 'mcneil', 'branch', 'houston'
  ],
  'bengals': [
    'burrow', 'chase', 'higgins', 'mixon', 'boyd', 'hendrickson', 'reader', 'wilson', 'bell'
  ],
  'packers': [
    'love', 'dillon', 'watson', 'doubs', 'kraft', 'walker', 'clark', 'smith', 'alexander'
  ],
  'jets': [
    'rodgers', 'hall', 'wilson', 'lazard', 'allen', 'sauce gardner', 'williams', 'quinnen', 'reed'
  ],
  'patriots': [
    'maye', 'stevenson', 'henry', 'thornton', 'judon', 'barmore', 'dugger', 'jones', 'gonzalez'
  ],
};

/**
 * Generic roster validation function for all sports
 */
function validateRoster(
  injuries: InjuryData[], 
  teamName: string, 
  rosters: Record<string, string[]>,
  sportName: string
): InjuryData[] {
  const normalizedTeam = teamName.toLowerCase();
  
  // Find matching roster
  let roster: string[] | undefined;
  for (const [team, players] of Object.entries(rosters)) {
    if (normalizedTeam.includes(team) || team.includes(normalizedTeam)) {
      roster = players;
      break;
    }
  }
  
  // If no roster found, return all (can't validate)
  if (!roster) {
    console.log(`[Perplexity] No ${sportName} roster found for ${teamName}, skipping validation`);
    return injuries;
  }
  
  // Filter to only include players on the roster
  const validated = injuries.filter(injury => {
    const playerLower = injury.playerName.toLowerCase();
    const nameParts = playerLower.split(' ').filter(p => p.length > 2);
    const lastName = nameParts[nameParts.length - 1];
    
    const isOnRoster = roster!.some(rosterPlayer => {
      const rosterParts = rosterPlayer.split(/[\s-]+/);
      return rosterParts.some(rosterPart => {
        if (rosterPart.length < 3 || lastName.length < 3) return false;
        return rosterPart === lastName || 
               (lastName.length >= 4 && rosterPart.startsWith(lastName.slice(0, 4))) ||
               (rosterPart.length >= 4 && lastName.startsWith(rosterPart.slice(0, 4)));
      });
    });
    
    if (!isOnRoster) {
      console.log(`[Perplexity] Filtering out ${injury.playerName} (${lastName}) - not on ${teamName} ${sportName} roster`);
    }
    
    return isOnRoster;
  });
  
  return validated;
}

/**
 * Validate injury list against known roster
 * Returns only players who are likely on the team
 */
function validateSoccerRoster(injuries: InjuryData[], teamName: string): InjuryData[] {
  const normalizedTeam = teamName.toLowerCase();
  
  // Find matching roster
  let roster: string[] | undefined;
  for (const [team, players] of Object.entries(KNOWN_SOCCER_ROSTERS)) {
    if (normalizedTeam.includes(team) || team.includes(normalizedTeam)) {
      roster = players;
      break;
    }
  }
  
  // If no roster found, return all (can't validate)
  if (!roster) {
    console.log(`[Perplexity] No roster found for ${teamName}, skipping validation`);
    return injuries;
  }
  
  // Filter to only include players on the roster
  const validated = injuries.filter(injury => {
    const playerLower = injury.playerName.toLowerCase();
    const nameParts = playerLower.split(' ').filter(p => p.length > 2); // Ignore short parts like initials
    
    // Check if player's LAST NAME matches any roster entry
    // Last name is more reliable than first name (fewer duplicates)
    const lastName = nameParts[nameParts.length - 1];
    
    const isOnRoster = roster!.some(rosterPlayer => {
      // Exact match on last name or roster entry contains last name
      // But roster entry must be similar length to avoid partial matches
      const rosterParts = rosterPlayer.split(/[\s-]+/);
      
      return rosterParts.some(rosterPart => {
        // Must be at least 4 chars and exact match or very close
        if (rosterPart.length < 4 || lastName.length < 4) return false;
        return rosterPart === lastName || 
               (lastName.length >= 5 && rosterPart.startsWith(lastName.slice(0, 5)));
      });
    });
    
    if (!isOnRoster) {
      console.log(`[Perplexity] Filtering out ${injury.playerName} (${lastName}) - not on ${teamName} roster`);
    }
    
    return isOnRoster;
  });
  
  return validated;
}

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
  sport: string,
  league?: string
): Promise<MatchInjuriesResult> {
  const client = getPerplexityClient();
  
  if (!client.isConfigured()) {
    return { success: false, home: [], away: [], error: 'Perplexity not configured' };
  }

  // Determine sport label and sources
  let sportLabel = 'NBA';
  let sources = 'NBA.com, ESPN';
  
  if (sport.includes('soccer') || sport.includes('epl') || sport.includes('premier') || 
      sport.includes('la_liga') || sport.includes('bundesliga') || sport.includes('serie_a') ||
      sport.includes('ligue') || sport.includes('champions') || sport.includes('europa')) {
    sportLabel = league || 'Premier League';
    sources = 'official club websites, Transfermarkt, ESPN FC, Sky Sports, BBC Sport';
  } else if (sport.includes('euroleague')) {
    sportLabel = 'Euroleague';
    sources = 'Euroleague.net, ESPN';
  } else if (sport.includes('hockey') || sport.includes('nhl')) {
    sportLabel = 'NHL';
    sources = 'NHL.com, ESPN';
  } else if (sport.includes('football') || sport.includes('nfl')) {
    sportLabel = 'NFL';
    sources = 'NFL.com, ESPN';
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isSoccer = sportLabel.includes('League') || sportLabel.includes('Liga') || 
                   sportLabel.includes('Serie') || sportLabel.includes('Bundesliga') ||
                   sportLabel.includes('Champions') || sportLabel.includes('Europa');
  const isNBA = sportLabel === 'NBA';
  const isNHL = sportLabel === 'NHL';
  const isNFL = sportLabel === 'NFL';

  const systemPrompt = `You are a sports injury reporter. Today is ${today}.

Your task is to find CURRENT injury reports for both teams in this ${sportLabel} matchup.

⚠️ CRITICAL TEAM VERIFICATION:
- ${homeTeam} is the HOME team - ONLY include players who are CURRENTLY on ${homeTeam}'s roster
- ${awayTeam} is the AWAY team - ONLY include players who are CURRENTLY on ${awayTeam}'s roster
- DO NOT include players from other teams even if mentioned in preview articles
- If you're unsure if a player belongs to the team, DO NOT include them

REQUIREMENTS:
1. Only report injuries that are ACTIVE/CURRENT (not past injuries that players have recovered from)
2. Focus on players who are OUT, DOUBTFUL, or QUESTIONABLE for the upcoming match
3. Use official sources: ${sources}
4. If a team has no reported injuries, return an empty injuries array
5. VERIFY each player actually plays for the team you're listing them under${isSoccer ? '\n6. For soccer: also include suspended players (red cards, accumulated yellows)' : ''}

RESPONSE FORMAT (JSON only, no other text):
{
  "homeTeam": {
    "name": "${homeTeam}",
    "injuries": [
      { "player": "Player Name", "injury": "Injury Type (e.g., Hamstring, ACL, Suspended)", "status": "Out/Doubtful/Questionable" }
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
    const homeInjuriesRaw: InjuryData[] = (parsed.homeTeam?.injuries || []).map((inj: any) => ({
      playerName: inj.player || inj.name || 'Unknown',
      injury: inj.injury || inj.type || 'Unknown',
      status: normalizeStatus(inj.status),
      expectedReturn: inj.expectedReturn,
    }));

    const awayInjuriesRaw: InjuryData[] = (parsed.awayTeam?.injuries || []).map((inj: any) => ({
      playerName: inj.player || inj.name || 'Unknown',
      injury: inj.injury || inj.type || 'Unknown',
      status: normalizeStatus(inj.status),
      expectedReturn: inj.expectedReturn,
    }));

    // Validate injuries against known rosters based on sport
    let homeInjuries = homeInjuriesRaw;
    let awayInjuries = awayInjuriesRaw;
    
    if (isSoccer) {
      homeInjuries = validateSoccerRoster(homeInjuriesRaw, homeTeam);
      awayInjuries = validateSoccerRoster(awayInjuriesRaw, awayTeam);
    } else if (isNBA) {
      homeInjuries = validateRoster(homeInjuriesRaw, homeTeam, KNOWN_NBA_ROSTERS, 'NBA');
      awayInjuries = validateRoster(awayInjuriesRaw, awayTeam, KNOWN_NBA_ROSTERS, 'NBA');
    } else if (isNHL) {
      homeInjuries = validateRoster(homeInjuriesRaw, homeTeam, KNOWN_NHL_ROSTERS, 'NHL');
      awayInjuries = validateRoster(awayInjuriesRaw, awayTeam, KNOWN_NHL_ROSTERS, 'NHL');
    } else if (isNFL) {
      homeInjuries = validateRoster(homeInjuriesRaw, homeTeam, KNOWN_NFL_ROSTERS, 'NFL');
      awayInjuries = validateRoster(awayInjuriesRaw, awayTeam, KNOWN_NFL_ROSTERS, 'NFL');
    }

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