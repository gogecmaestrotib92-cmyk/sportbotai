// Blog system types

export interface BlogGenerationConfig {
  keyword: string;
  keywordId?: string;
  forceRegenerate?: boolean;
}

export interface ResearchResult {
  facts: string[];
  statistics: string[];
  recentNews: string[];
  sources: string[];
  relatedTopics: string[];
}

export interface OutlineSection {
  heading: string;
  subheadings: string[];
  keyPoints: string[];
}

export interface BlogOutline {
  title: string;
  metaDescription: string;
  sections: OutlineSection[];
  estimatedWordCount: number;
}

export interface GeneratedContent {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML content
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  tags: string[];
  category: string;
}

export interface ImageGenerationResult {
  url: string;
  alt: string;
  prompt: string;
}

export interface BlogGenerationResult {
  success: boolean;
  postId?: string;
  slug?: string;
  error?: string;
  cost?: number;
  duration?: number;
}

export interface GenerationStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

// Seed keywords for sports analytics (optimized for SportBot AI use case)
// Goal: Attract users searching for sports analysis tools, AI predictions, match insights
// Total: 120+ keywords across different categories
export const SEED_KEYWORDS = [
  // ============================================
  // AI & TECHNOLOGY (High Intent - Product Focused)
  // ============================================
  "best AI sports analysis tools 2025",
  "how AI predicts football match outcomes",
  "machine learning sports predictions explained",
  "automated sports analytics platforms",
  "AI powered match analysis software",
  "sports prediction AI apps 2025",
  "ChatGPT for sports betting analysis",
  "AI football prediction accuracy rates",
  "artificial intelligence sports betting",
  "neural network sports predictions",
  "deep learning football analysis",
  "AI sports analytics startups 2025",
  "GPT-4 sports predictions accuracy",
  "computer vision in sports analysis",
  "predictive modeling for sports",
  
  // ============================================
  // MATCH ANALYSIS & PREVIEWS (Core SEO)
  // ============================================
  "how to analyze football matches like a pro",
  "soccer match prediction factors",
  "NBA game analysis techniques",
  "pre match analysis checklist football",
  "what to look for before betting on a match",
  "reading team lineups for predictions",
  "team form analysis for predictions",
  "head to head statistics importance sports",
  "match preview analysis guide",
  "how to predict football scores accurately",
  "analyzing underdog chances in football",
  "key stats for match predictions",
  "tactical analysis football betting",
  "formation analysis impact predictions",
  "momentum shifts in football matches",
  
  // ============================================
  // PROBABILITY & STATISTICS (Educational)
  // ============================================
  "understanding probability in sports outcomes",
  "how bookmakers calculate odds explained",
  "implied probability vs true probability",
  "expected value sports analysis guide",
  "statistical models for sports predictions",
  "Poisson distribution football predictions",
  "xG expected goals explained betting",
  "how to calculate true odds from bookmaker odds",
  "standard deviation in sports betting",
  "regression analysis sports predictions",
  "correlation vs causation sports betting",
  "sample size importance betting analysis",
  "confidence intervals sports predictions",
  "Monte Carlo simulations sports betting",
  "Bayesian probability sports analysis",
  
  // ============================================
  // VALUE & BETTING STRATEGY (High Intent)
  // ============================================
  "value betting detection methods",
  "risk assessment in sports predictions",
  "Kelly criterion sports betting calculator",
  "finding value bets guide 2025",
  "how to identify value in odds",
  "closing line value explained",
  "what is EV in sports betting",
  "positive expected value betting",
  "arbitrage betting explained",
  "hedging strategies sports betting",
  "line movement analysis betting",
  "sharp money indicators sports",
  "how bookmakers move lines",
  "steam moves betting explained",
  "reverse line movement betting",
  
  // ============================================
  // PREMIER LEAGUE & EUROPEAN FOOTBALL
  // ============================================
  "Premier League match analysis guide",
  "Champions League prediction factors",
  "La Liga betting analysis tips",
  "Serie A match prediction guide",
  "Bundesliga football analysis",
  "Ligue 1 predictions analysis",
  "Premier League form table analysis",
  "top 6 Premier League predictions",
  "relegation battle predictions Premier League",
  "Champions League knockout predictions",
  "Europa League betting analysis",
  "derby match predictions Premier League",
  "Boxing Day Premier League tips",
  "Manchester United vs Liverpool analysis",
  "Arsenal vs Tottenham predictions",
  
  // ============================================
  // AMERICAN SPORTS (NBA, NFL, NHL)
  // ============================================
  "NFL game analysis statistics",
  "NBA player performance metrics",
  "Super Bowl prediction factors",
  "March Madness bracket analysis AI",
  "NBA playoffs predictions analysis",
  "NFL spread betting analysis",
  "NBA over under predictions",
  "NHL hockey predictions analysis",
  "NFL quarterback rating predictions",
  "NBA back to back game analysis",
  "NFL weather impact predictions",
  "NBA home court advantage stats",
  "NFL divisional round predictions",
  "NBA MVP predictions analysis",
  "NHL Stanley Cup predictions",
  
  // ============================================
  // UFC & COMBAT SPORTS
  // ============================================
  "UFC fight prediction factors",
  "MMA fight prediction statistics",
  "how to analyze UFC fights",
  "UFC odds analysis guide",
  "reach advantage UFC predictions",
  "UFC knockout percentage analysis",
  "wrestling advantage MMA betting",
  "UFC weight class analysis",
  "UFC title fight predictions",
  "boxing betting analysis guide",
  
  // ============================================
  // RESPONSIBLE GAMBLING & PSYCHOLOGY
  // ============================================
  "sports betting vs sports analysis difference",
  "responsible approach to sports analytics",
  "common sports betting mistakes to avoid",
  "bankroll management for sports betting",
  "how to stop losing at sports betting",
  "sports betting psychology explained",
  "emotional control sports betting",
  "tilt in sports betting explained",
  "setting betting limits guide",
  "signs of problem gambling",
  "gambling addiction resources",
  "how to bet responsibly",
  
  // ============================================
  // BEGINNER GUIDES (Traffic Building)
  // ============================================
  "sports betting for beginners 2025",
  "understanding betting odds for dummies",
  "how do sports odds work",
  "what does spread mean betting",
  "moneyline vs spread explained",
  "over under betting explained",
  "parlay betting explained simply",
  "what are prop bets",
  "live betting vs pre match",
  "cash out betting explained",
  "first time sports betting tips",
  "how to read betting lines",
  
  // ============================================
  // COMPARISONS & TOOLS (Decision Stage)
  // ============================================
  "best football prediction sites 2025",
  "free vs paid sports prediction tools",
  "sports analytics software comparison",
  "how accurate are prediction algorithms",
  "betting odds comparison tools guide",
  "best sports analytics apps 2025",
  "tipster vs AI predictions comparison",
  "paid picks vs AI analysis",
  "sports data providers comparison",
  "best live stats apps football",
  
  // ============================================
  // TRENDING & SEASONAL
  // ============================================
  "World Cup 2026 predictions analysis",
  "Euro 2028 qualifying predictions",
  "Christmas Premier League predictions",
  "how to analyze derbies and rivalries",
  "transfer window impact predictions",
  "international break football analysis",
  "cup competitions betting analysis",
  "end of season predictions football",
  "title race predictions Premier League",
  "golden boot predictions analysis",
  
  // ============================================
  // LONG-TAIL HIGH-INTENT
  // ============================================
  "how to predict football match results accurately",
  "best way to analyze upcoming matches",
  "understanding home advantage statistics",
  "what data do professional analysts use",
  "building sports prediction strategy",
  "how sharps analyze matches differently",
  "professional sports betting strategies",
  "is it possible to beat the bookmakers",
  "why do most bettors lose money",
  "how to build a betting model",
  "data sources for sports analysis",
  "sports API for predictions",
  
  // ============================================
  // NICHE SPORTS (Low Competition)
  // ============================================
  "cricket match prediction analysis",
  "rugby union betting analysis guide",
  "ice hockey NHL prediction factors",
  "golf tournament prediction methods",
  "esports betting analysis guide",
  "tennis match outcome predictors",
  "darts betting analysis tips",
  "snooker prediction methods",
  "volleyball betting analysis",
  "handball predictions guide",
];

// Blog categories (Match Previews excluded - they go to /news)
export const BLOG_CATEGORIES = [
  "Betting Fundamentals",
  "Sports Analysis",
  "Statistics & Data",
  "Risk Management",
  "Market Insights",
  "Educational Guides",
  "Tools & Resources",
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number];
