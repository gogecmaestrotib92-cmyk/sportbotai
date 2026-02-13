/**
 * Analysis Components Index
 * 
 * Export all analysis page components
 */

export { default as MatchStory } from './MatchStory';
export { default as ViralStatsBar } from './ViralStatsBar';
export { default as MatchHeadlines } from './MatchHeadlines';
export { default as HomeAwaySplits } from './HomeAwaySplits';
export { default as GoalsTiming } from './GoalsTiming';
export { default as ContextFactors } from './ContextFactors';
export { default as ShareCard } from './ShareCard';
export { default as KeyPlayerBattle } from './KeyPlayerBattle';
export { default as RefereeProfile } from './RefereeProfile';

// New Premium Components - V2
export { default as SignalAnalysis } from './SignalAnalysis';
export { default as PremiumMatchHeader } from './PremiumMatchHeader';

// Universal Signals Framework - V3
export { default as UniversalSignalsDisplay, SignalPills } from './UniversalSignalsDisplay';
export * from './VisualSignals';

// Premium Edge Features - Value Detection
export * from './MarketEdge';
export { AIvsMarketHero } from './AIvsMarketHero';

// Pro Section Wrappers
export { ProSection, ProSectionPlaceholder } from './ProSection';

// Two-Layer Blur System
export { RegistrationBlur } from './RegistrationBlur';
export { PremiumBlur } from './PremiumBlur';

// Progressive Disclosure
export { CollapsibleSection } from './CollapsibleSection';

// Interactive Snapshot List
export { default as SnapshotList } from './SnapshotList';

// Predicted Score Display
export { default as PredictedScoreDisplay } from './PredictedScoreDisplay';

// Bookmaker Odds Comparison / Line Shopping
export { default as BookmakerOddsTable } from './BookmakerOddsTable';
export type { BookmakerOddsEntry } from './BookmakerOddsTable';

// Unified analysis block
export { default as WhyThisEdgeExists } from './WhyThisEdgeExists';

// Premium Visual Components (SVG-based)
export {
  RiskGauge,
  StackedProbBar,
  MomentumTimeline,
} from './PremiumVisuals';
