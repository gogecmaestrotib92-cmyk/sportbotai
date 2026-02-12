/**
 * Types for SportBot AI application
 * 
 * Centralized TypeScript types used throughout the application.
 * 
 * NOTE: This is an educational match analysis tool, NOT betting advice.
 * We show probability comparisons, not recommendations.
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
/** @deprecated Use 'difference' numbers instead of categorical flags */
export type ValueFlag = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type Trend = 'RISING' | 'FALLING' | 'STABLE' | 'UNKNOWN';
export type DataQuality = 'LOW' | 'MEDIUM' | 'HIGH';
export type SourceType = 'MANUAL' | 'API';
export type MarketType = '1X2' | 'OVER_UNDER' | 'BTTS' | 'NONE';
/** @deprecated Removed - we don't recommend sides */
export type BestValueSide = 'HOME' | 'DRAW' | 'AWAY' | 'NONE';
export type MarketConfidence = 1 | 2 | 3 | 4 | 5;
export type InjuryType = 'injury' | 'suspension' | 'doubtful';
export type PlayerImportance = 'KEY' | 'STARTER' | 'ROTATION' | 'BACKUP';

// ============================================
// INJURY IMPACT TYPES
// ============================================

/**
 * Individual injured/suspended player
 */
export interface InjuredPlayer {
  name: string;
  position: string;
  reason: string;
  type: InjuryType;
  importance?: PlayerImportance;  // AI-estimated importance
  impactScore?: number;           // 1-10 impact on team performance
}

/**
 * Injury context for a team
 */
export interface TeamInjuryContext {
  players: InjuredPlayer[];
  totalImpactScore: number;       // Combined impact 0-100
  keyAbsences: number;            // Count of KEY/STARTER players out
  summary: string;                // Brief impact summary
}

/**
 * Full injury context for the match
 */
export interface InjuryContext {
  homeTeam: TeamInjuryContext | null;
  awayTeam: TeamInjuryContext | null;
  overallImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impactSummary: string;          // How injuries affect the match
  advantageShift?: 'HOME' | 'AWAY' | 'NEUTRAL';  // Who benefits from absences
}

// ============================================
// ANALYZER REQUEST TYPES
// ============================================

/**
 * Input data for match analysis
 */
export interface AnalyzeRequest {
  matchData: {
    sport: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    matchDate?: string;
    sourceType: SourceType;
    odds: {
      home: number;
      draw?: number | null;
      away: number;
    };
  };
  userPick?: string;
  userStake?: number;
}

// ============================================
// ANALYZER RESPONSE TYPES (FINAL SCHEMA)
// ============================================

/**
 * Match information section
 */
export interface MatchInfo {
  sport: string;
  leagueName: string;
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  sourceType: SourceType;
  dataQuality: DataQuality;
}

/**
 * Probability estimates
 */
export interface Probabilities {
  homeWin: number | null;
  draw: number | null;
  awayWin: number | null;
  over: number | null;
  under: number | null;
}

/**
 * Single outcome probability comparison
 * Shows AI estimate vs market-implied probability
 */
export interface ProbabilityComparison {
  aiEstimate: number | null;
  marketImplied: number | null;
  /** Difference (AI - Market). Positive = AI higher, Negative = Market higher */
  difference: number | null;
}

/**
 * Odds comparison section (neutral, educational)
 * Replaces the old "ValueAnalysis" - no recommendations, just data
 */
export interface OddsComparison {
  /** How market odds translate to probabilities */
  marketImplied: {
    homeWin: number | null;
    draw: number | null;
    awayWin: number | null;
    bookmakerMargin: number | null;  // The "vig" or overround
  };
  /** AI probability estimates for comparison */
  aiEstimate: {
    homeWin: number | null;
    draw: number | null;
    awayWin: number | null;
  };
  /** Side-by-side comparison */
  comparison: {
    homeWin: ProbabilityComparison;
    draw: ProbabilityComparison;
    awayWin: ProbabilityComparison;
  };
  /** Largest absolute difference between AI and market */
  largestDifference: {
    outcome: 'HOME' | 'DRAW' | 'AWAY' | 'NONE';
    difference: number;
  };
  /** Educational explanation of what the numbers mean */
  explanationShort: string;
  explanationDetailed: string;
}

/**
 * @deprecated Kelly calculations removed - this is betting advice
 * Kept for backward compatibility with old components
 */
export interface KellyResult {
  fullKelly: number;
  halfKelly: number;
  quarterKelly: number;
  edge: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * @deprecated Use OddsComparison instead - kept for backward compatibility
 */
export interface ValueAnalysis {
  impliedProbabilities: {
    homeWin: number | null;
    draw: number | null;
    awayWin: number | null;
  };
  aiProbabilities: {
    homeWin: number | null;
    draw: number | null;
    awayWin: number | null;
  };
  /** @deprecated Don't show categorical flags - show numbers */
  valueFlags: {
    homeWin: ValueFlag;
    draw: ValueFlag;
    awayWin: ValueFlag;
  };
  /** @deprecated Don't recommend sides */
  bestValueSide: BestValueSide;
  /** @deprecated Removed - this is betting advice. Always null in new responses */
  kellyStake?: KellyResult | null;
  /** Neutral comparison comment */
  valueCommentShort: string;
  valueCommentDetailed: string;
}

// ============================================
// PRE-MATCH INSIGHTS (Viral Stats)
// ============================================

/**
 * Auto-generated headline fact about the match
 * Designed to be screenshot-worthy and shareable
 */
export interface MatchHeadline {
  icon: string;              // Emoji for visual impact
  text: string;              // The headline text
  category: 'streak' | 'h2h' | 'form' | 'goals' | 'defense' | 'timing' | 'absence' | 'venue' | 'motivation';
  impactLevel: 'low' | 'medium' | 'high';  // How significant is this fact
  team?: 'home' | 'away' | 'both';         // Which team it relates to
}

/**
 * Streak information for a team
 */
export interface TeamStreak {
  type: 'win' | 'loss' | 'draw' | 'unbeaten' | 'winless' | 'scored' | 'cleanSheet' | 'conceded' | 'btts' | 'over25';
  count: number;
  context: 'all' | 'home' | 'away' | 'h2h';  // In what context
  description: string;       // Human-readable description
  isActive: boolean;         // Is this streak currently ongoing
}

/**
 * Goals timing pattern - when a team typically scores
 */
export interface GoalsTimingPattern {
  '0-15': number;    // Percentage of goals in each 15-min block
  '16-30': number;
  '31-45': number;
  '46-60': number;
  '61-75': number;
  '76-90': number;
  totalGoals: number;
  insight?: string;  // e.g., "Late goal specialists - 46% after 60'"
}

/**
 * Home vs Away performance split
 */
export interface VenueSplit {
  home: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    cleanSheets: number;
    avgGoals: number;
  };
  away: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    cleanSheets: number;
    avgGoals: number;
  };
  insight?: string;  // e.g., "Much stronger at home"
}

/**
 * H2H specific insights beyond basic stats
 */
export interface H2HInsights {
  avgGoalsPerMatch: number;
  bttsPercentage: number;    // Both teams to score %
  over25Percentage: number;  // Over 2.5 goals %
  lastWinner?: 'home' | 'away' | 'draw';
  dominantTeam?: 'home' | 'away' | 'even';
  recentTrend?: string;      // e.g., "Away team won last 3 meetings"
}

/**
 * Complete enhanced pre-match insights
 */
export interface PreMatchInsights {
  /** Auto-generated shareable headlines (3-6 facts) */
  headlines: MatchHeadline[];
  
  /** Notable streaks for both teams */
  streaks: {
    home: TeamStreak[];
    away: TeamStreak[];
  };
  
  /** When each team typically scores */
  goalsPattern: {
    home: GoalsTimingPattern | null;
    away: GoalsTimingPattern | null;
  };
  
  /** Home/Away performance splits */
  venueSplits: {
    home: VenueSplit | null;
    away: VenueSplit | null;
  };
  
  /** Enhanced H2H insights */
  h2hInsights: H2HInsights | null;
  
  /** Key absences summary (most important missing players) */
  keyAbsences: {
    home: Array<{ name: string; position: string; importance: PlayerImportance }>;
    away: Array<{ name: string; position: string; importance: PlayerImportance }>;
    impactStatement?: string;  // e.g., "Both teams missing key strikers"
  };
  
  /** Motivation factors */
  motivation: {
    home: string | null;  // e.g., "Fighting relegation", "Nothing to play for"
    away: string | null;
    insight?: string;
  };
  
  /** Quick shareable stats */
  quickStats: {
    fixtureGoalsAvg: number | null;        // Avg goals in this fixture historically
    combinedFormGoalsAvg: number | null;   // Avg goals from both teams' recent form
    cleanSheetProbability: number | null;  // Based on recent defensive form
    bttsLikelihood: 'low' | 'medium' | 'high' | null;
  };
}

/**
 * Risk analysis section
 */
export interface RiskAnalysis {
  overallRiskLevel: RiskLevel;
  riskExplanation: string;
  bankrollImpact: string;
  psychologyBias: {
    name: string;
    description: string;
  };
}

/**
 * Individual match result for form display
 */
export interface FormMatch {
  result: 'W' | 'D' | 'L';
  score?: string;
  opponent?: string;
  date?: string;
  home?: boolean;
}

/**
 * Head-to-head match record
 */
export interface HeadToHeadMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

/**
 * Team statistics from API-Sports
 * Field names are sport-agnostic but can represent:
 * - Soccer: goals scored/conceded
 * - Basketball: points scored/allowed
 * - Hockey: goals scored/allowed
 * - NFL: points scored/allowed
 * - MMA: wins/losses
 */
export interface TeamStats {
  // Generic scoring stats (points/goals/wins depending on sport)
  goalsScored: number;      // Points for (basketball), Goals (soccer/hockey), Wins (MMA)
  goalsConceded: number;    // Points against, Goals against, Losses (MMA)
  cleanSheets: number;      // Shutouts (hockey), Finishes (MMA), Clean sheets (soccer)
  avgGoalsScored?: number;  // PPG (basketball), Avg goals (soccer), Win % (MMA)
  avgGoalsConceded?: number;
  // Sport-specific stats (optional)
  wins?: number;
  losses?: number;
  winPercentage?: number;
  pointsPerGame?: number;
  pointsAllowedPerGame?: number;
}

/**
 * Momentum and form section
 */
export interface MomentumAndForm {
  homeMomentumScore: number | null;
  awayMomentumScore: number | null;
  homeTrend: Trend;
  awayTrend: Trend;
  keyFormFactors: string[];
  // Real form data (when available from API-Sports)
  homeForm?: FormMatch[];
  awayForm?: FormMatch[];
  formDataSource?: 'API_FOOTBALL' | 'API_SPORTS' | 'AI_ESTIMATE' | 'UNAVAILABLE';
  // Head-to-head data
  headToHead?: HeadToHeadMatch[];
  h2hSummary?: {
    totalMatches: number;
    homeWins: number;
    awayWins: number;
    draws: number;
  };
  // Team statistics
  homeStats?: TeamStats;
  awayStats?: TeamStats;
}

/**
 * Market stability for a single market
 */
export interface MarketStabilityItem {
  stability: RiskLevel;
  confidence: MarketConfidence;
  comment: string;
}

/**
 * Market stability section
 */
export interface MarketStability {
  markets: {
    main_1x2: MarketStabilityItem;
    over_under: MarketStabilityItem;
    btts: MarketStabilityItem;
  };
  safestMarketType: MarketType;
  safestMarketExplanation: string;
}

/**
 * Upset potential section
 */
export interface UpsetPotential {
  upsetProbability: number;
  upsetComment: string;
}

/**
 * Tactical analysis section
 */
export interface TacticalAnalysis {
  stylesSummary: string;
  matchNarrative: string;
  keyMatchFactors: string[];
  expertConclusionOneLiner: string;
}

/**
 * User context section
 */
export interface UserContext {
  userPick: string;
  userStake: number;
  pickComment: string;
}

/**
 * Responsible gambling section
 */
export interface ResponsibleGambling {
  coreNote: string;
  tailoredNote: string;
}

/**
 * Meta information section
 */
export interface AnalysisMeta {
  modelVersion: string;
  analysisGeneratedAt: string;
  warnings: string[];
  /** Data sources used in analysis with verification status */
  dataSources?: {
    teamStats?: {
      provider: string;
      verified: boolean;
      fetchedAt?: string;
    };
    h2h?: {
      provider: string;
      verified: boolean;
      fetchedAt?: string;
    };
    realTimeIntel?: {
      provider: string;
      verified: boolean;
      fetchedAt?: string;
    };
    probabilities?: {
      source: 'computed' | 'llm_estimate';
      confidence: 'high' | 'medium' | 'low';
    };
  };
}

/**
 * Usage information returned with analysis
 */
export interface UsageInfo {
  plan: string;
  remaining: number;
  limit: number;
}

/**
 * 60-Second AI Briefing
 * Quick, shareable summary of the analysis
 */
export interface AIBriefing {
  /** 2-3 sentence headline summary */
  headline: string;
  /** Key insight bullets (3-5 points) */
  keyPoints: string[];
  /** One-liner verdict */
  verdict: string;
  /** Confidence rating 1-5 */
  confidenceRating: 1 | 2 | 3 | 4 | 5;
}

/**
 * Complete analysis response (FINAL SCHEMA)
 * 
 * NOTE: This is educational match intelligence, not betting advice.
 */
export interface AnalyzeResponse {
  success: boolean;
  matchInfo: MatchInfo;
  probabilities: Probabilities;
  /** @deprecated Use oddsComparison instead */
  valueAnalysis: ValueAnalysis;
  /** NEW: Neutral probability comparison (AI vs Market) */
  oddsComparison?: OddsComparison;
  riskAnalysis: RiskAnalysis;
  momentumAndForm: MomentumAndForm;
  marketStability: MarketStability;
  upsetPotential: UpsetPotential;
  tacticalAnalysis: TacticalAnalysis;
  userContext: UserContext;
  responsibleGambling: ResponsibleGambling;
  /** 60-second AI briefing for quick consumption */
  briefing?: AIBriefing;
  injuryContext?: InjuryContext;   // Injury impact analysis
  /** NEW: Enhanced pre-match insights (viral stats) */
  preMatchInsights?: PreMatchInsights;
  meta: AnalysisMeta;
  error?: string;
  usageInfo?: UsageInfo;
}

// ============================================
// MATCH DATA TYPES
// ============================================

/**
 * Processed match data for analysis
 */
export interface MatchData {
  matchId: string;
  sport: string;
  sportKey: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  sourceType: SourceType;
  odds: {
    home: number;
    draw: number | null;
    away: number;
    overUnderLine?: number;
    over?: number;
    under?: number;
  };
  bookmakers: {
    name: string;
    home: number;
    draw: number | null;
    away: number;
  }[];
  averageOdds: {
    home: number;
    draw: number | null;
    away: number;
  };
  impliedProbabilities: {
    home: number;
    draw: number | null;
    away: number;
  };
}

/**
 * Response from match data endpoint
 */
export interface MatchDataResponse {
  success: boolean;
  data?: MatchData;
  events?: MatchData[];
  error?: string;
  requestsRemaining?: number;
}

// ============================================
// STRIPE TYPES
// ============================================

/**
 * Request for creating Stripe checkout session
 */
export interface CreateCheckoutSessionRequest {
  priceId: string;
  planName: string;
}

/**
 * Response from Stripe checkout session
 */
export interface CreateCheckoutSessionResponse {
  url: string;
}

// ============================================
// PRICING TYPES
// ============================================

/**
 * Pricing plan
 */
export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  priceId: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}

// ============================================
// TEAM PROFILE TYPES
// ============================================

export interface TeamProfileData {
  team: {
    id: number;
    name: string;
    logo: string;
    country: string;
    founded: number | null;
    venue: {
      name: string;
      city: string;
      capacity: number;
    } | null;
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
    season: number;
  } | null;
  standing: {
    position: number;
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    form: string;
  } | null;
  stats: {
    form: string;
    formArray: ('W' | 'D' | 'L')[];
    goalsScored: number;
    goalsConceded: number;
    cleanSheets: number;
    failedToScore: number;
    avgGoalsScored: number;
    avgGoalsConceded: number;
    homeRecord: { played: number; wins: number; draws: number; losses: number };
    awayRecord: { played: number; wins: number; draws: number; losses: number };
    biggestWin: string | null;
    biggestLoss: string | null;
  } | null;
  recentMatches: {
    date: string;
    opponent: string;
    opponentLogo: string;
    score: string;
    result: 'W' | 'D' | 'L';
    home: boolean;
    competition: string;
  }[];
  upcomingMatches: {
    date: string;
    opponent: string;
    opponentLogo: string;
    home: boolean;
    competition: string;
  }[];
}
