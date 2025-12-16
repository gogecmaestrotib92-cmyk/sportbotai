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
export const SEED_KEYWORDS = [
  // Product-aligned: AI & Tools (high intent)
  "best AI sports analysis tools 2025",
  "how AI predicts football match outcomes",
  "machine learning sports predictions explained",
  "automated sports analytics platforms",
  "AI powered match analysis software",
  "sports prediction AI apps 2025",
  "ChatGPT for sports betting analysis",
  "AI football prediction accuracy rates",
  
  // Sports Analysis (core value proposition)
  "how to analyze football matches like a pro",
  "soccer match prediction factors",
  "NBA game analysis techniques",
  "tennis match outcome predictors",
  "head to head statistics importance sports",
  "team form analysis for predictions",
  "pre match analysis checklist football",
  "what to look for before betting on a match",
  "reading team lineups for predictions",
  
  // Probability & Statistics (educational)
  "understanding probability in sports outcomes",
  "how bookmakers calculate odds explained",
  "implied probability vs true probability",
  "expected value sports analysis guide",
  "statistical models for sports predictions",
  "Poisson distribution football predictions",
  "xG expected goals explained betting",
  "how to calculate true odds from bookmaker odds",
  
  // Specific Features (what SportBot offers)
  "real time sports data analysis",
  "value betting detection methods",
  "risk assessment in sports predictions",
  "Kelly criterion sports betting calculator",
  "momentum analysis in football matches",
  "live match analysis tools",
  "injury impact on match predictions",
  "finding value bets guide 2025",
  
  // Sport-specific deep dives
  "Premier League match analysis guide",
  "Champions League prediction factors",
  "NFL game analysis statistics",
  "NBA player performance metrics",
  "how weather affects soccer matches",
  "La Liga betting analysis tips",
  "Serie A match prediction guide",
  "Bundesliga football analysis",
  "EuroLeague basketball predictions",
  "UFC fight prediction factors",
  
  // Educational & Responsible
  "sports betting vs sports analysis difference",
  "data driven sports predictions beginners",
  "why most sports predictions fail",
  "responsible approach to sports analytics",
  "free sports analysis tools comparison",
  "common sports betting mistakes to avoid",
  "bankroll management for sports betting",
  "how to stop losing at sports betting",
  "sports betting psychology explained",
  
  // Long-tail high-intent
  "how to predict football match results accurately",
  "best way to analyze upcoming matches",
  "understanding home advantage statistics",
  "what data do professional analysts use",
  "building sports prediction strategy",
  "how sharps analyze matches differently",
  "professional sports betting strategies",
  "is it possible to beat the bookmakers",
  
  // Trending & Seasonal (2025)
  "World Cup 2026 predictions analysis",
  "Euro 2028 qualifying predictions",
  "Super Bowl prediction factors",
  "March Madness bracket analysis AI",
  "Christmas Premier League predictions",
  "how to analyze derbies and rivalries",
  
  // Comparison & Tools
  "best football prediction sites 2025",
  "free vs paid sports prediction tools",
  "sports analytics software comparison",
  "how accurate are prediction algorithms",
  "betting odds comparison tools guide",
  
  // Niche Sports
  "cricket match prediction analysis",
  "rugby union betting analysis guide",
  "ice hockey NHL prediction factors",
  "golf tournament prediction methods",
  "esports betting analysis guide",
  "MMA fight prediction statistics",
];

// Blog categories
export const BLOG_CATEGORIES = [
  "Betting Fundamentals",
  "Sports Analysis",
  "Statistics & Data",
  "Risk Management",
  "Market Insights",
  "Educational Guides",
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number];
