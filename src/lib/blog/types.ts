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

// Seed keywords for sports betting analytics
export const SEED_KEYWORDS = [
  // Core betting concepts
  "what is value betting in sports",
  "how to calculate implied probability from odds",
  "understanding betting odds formats decimal fractional american",
  "bankroll management strategies for sports betting",
  "what is expected value EV in betting",
  
  // Sport-specific analysis
  "football match analysis techniques",
  "how to analyze basketball games for betting",
  "tennis betting strategies and statistics",
  "factors affecting football match outcomes",
  "home advantage in football statistics",
  
  // Data and statistics
  "using statistics for sports predictions",
  "xG expected goals explained football",
  "advanced basketball statistics for betting",
  "how weather affects football matches",
  "player performance metrics betting analysis",
  
  // Risk and psychology
  "responsible gambling tips and strategies",
  "cognitive biases in sports betting",
  "how to avoid emotional betting decisions",
  "understanding variance in sports betting",
  "setting betting limits and boundaries",
  
  // Market analysis
  "how bookmakers set odds",
  "understanding betting line movement",
  "what is sharp money in sports betting",
  "identifying value in betting markets",
  "closing line value importance",
  
  // Educational
  "beginner guide to sports analytics",
  "how AI is used in sports predictions",
  "data sources for sports betting research",
  "building a sports betting model",
  "probability vs odds conversion guide",
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
