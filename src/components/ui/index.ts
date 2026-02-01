/**
 * UI Components Barrel Export
 * 
 * Clean, reusable UI components.
 * Dark theme, accent color #2AF6A0, professional SaaS feel.
 */

export { default as TeamLogo } from './TeamLogo';
export { default as LeagueLogo } from './LeagueLogo';

// Loading states
export {
  AnalysisResultSkeleton,
  MatchCardSkeleton,
  TrendingSectionSkeleton,
  LoadingButton,
  ProgressIndicator,
  PulseDot,
  PageTransition,
  ContentPlaceholder,
} from './LoadingStates';

// Skeleton primitives
export { Skeleton, SkeletonText, SkeletonCard, SkeletonMatchCard } from './Skeleton';

// Toast notifications
export { ToastProvider, useToast, SimpleToast } from './Toast';

// Scroll to top
export { ScrollToTop } from './ScrollToTop';

// Premium SVG Icons
export * from './Icons';

// Staggered animations
export { StaggeredList, StaggeredItem, StaggeredGrid, useStaggeredAnimation } from './StaggeredAnimation';

// Success animations
export { SuccessCheckmark, SuccessToast, SuccessBadge, SuccessParticles } from './SuccessAnimation';

// Empty states & errors
export {
  EmptyState,
  NoMatchesFound,
  NoAnalysisHistory,
  NoFavorites,
  SearchNoResults,
  FeatureComingSoon,
  OfflineState,
  ErrorState,
  InlineError,
  MaintenanceState,
} from './EmptyStates';

// Value Badges
export { default as ValueBadge, LiveBadge, StatBadge, ConfidenceBadge, HotBadge } from './ValueBadge';

// Stats Cards
export { default as StatsCard, StatsRow, MiniStats, ProgressStatsCard } from './StatsCard';

// Match List
export { default as MatchListItem, MatchList } from './MatchListItem';

// Section Headers
export { default as SectionHeader, SectionDivider, PageTitle, MiniHeader } from './SectionHeader';

// Animated Counter
export { default as AnimatedCounter, StatCounter, MiniCounter, HeroCounter } from './AnimatedCounter';

// Feature Cards
export { default as FeatureCard, MiniFeature, FeatureGrid, LargeFeatureCard, ComparisonCard } from './FeatureCard';

// Tabs
export { default as Tabs, TabPanel, TabsContainer, ToggleGroup } from './Tabs';

// Data Tables
export { default as DataTable, StatsTable, ComparisonTable, MiniStatsList } from './DataTable';

// Tooltips
export { Tooltip, InfoTooltip } from './Tooltip';
