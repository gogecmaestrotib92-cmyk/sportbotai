/**
 * Types for BetSense AI application
 * 
 * Centralized TypeScript types used throughout the application.
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ValueFlag = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type Trend = 'RISING' | 'FALLING' | 'STABLE' | 'UNKNOWN';
export type DataQuality = 'LOW' | 'MEDIUM' | 'HIGH';
export type SourceType = 'MANUAL' | 'API';
export type MarketType = '1X2' | 'OVER_UNDER' | 'BTTS' | 'NONE';
export type BestValueSide = 'HOME' | 'DRAW' | 'AWAY' | 'NONE';
export type MarketConfidence = 1 | 2 | 3 | 4 | 5;

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
 * Kelly Criterion calculation result
 */
export interface KellyResult {
  fullKelly: number;       // Full Kelly stake as % of bankroll
  halfKelly: number;       // Half Kelly (conservative)
  quarterKelly: number;    // Quarter Kelly (very conservative)
  edge: number;            // Expected edge in percentage
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';  // Confidence in the edge estimate
}

/**
 * Value analysis section
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
  valueFlags: {
    homeWin: ValueFlag;
    draw: ValueFlag;
    awayWin: ValueFlag;
  };
  bestValueSide: BestValueSide;
  kellyStake: KellyResult | null;  // Kelly calculation for best value side
  valueCommentShort: string;
  valueCommentDetailed: string;
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
 * Momentum and form section
 */
export interface MomentumAndForm {
  homeMomentumScore: number | null;
  awayMomentumScore: number | null;
  homeTrend: Trend;
  awayTrend: Trend;
  keyFormFactors: string[];
  // Real form data (when available from API-Football)
  homeForm?: FormMatch[];
  awayForm?: FormMatch[];
  formDataSource?: 'API_FOOTBALL' | 'AI_ESTIMATE' | 'UNAVAILABLE';
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
 * Complete analysis response (FINAL SCHEMA)
 */
export interface AnalyzeResponse {
  success: boolean;
  matchInfo: MatchInfo;
  probabilities: Probabilities;
  valueAnalysis: ValueAnalysis;
  riskAnalysis: RiskAnalysis;
  momentumAndForm: MomentumAndForm;
  marketStability: MarketStability;
  upsetPotential: UpsetPotential;
  tacticalAnalysis: TacticalAnalysis;
  userContext: UserContext;
  responsibleGambling: ResponsibleGambling;
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
