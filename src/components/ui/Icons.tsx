/**
 * Premium SVG Icons Library
 * 
 * High-quality SVG icons for SportBot AI.
 * Consistent design language across the app.
 * Use these instead of emojis for a premium feel.
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// ================================
// ANALYTICS & DATA ICONS
// ================================

/** Bar chart icon - for statistics and data */
export const ChartBarIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

/** Line chart with upward trend */
export const TrendingUpIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

/** Analytics dashboard icon */
export const AnalyticsIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3" />
    <path d="M7 14L11 10L15 14L21 8" />
  </svg>
);

// ================================
// AI & BRAIN ICONS
// ================================

/** Brain icon - for AI features */
export const BrainIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

/** Sparkles icon - for AI/magic features */
export const SparklesIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
  </svg>
);

/** Sparkles outline version */
export const SparklesOutlineIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
);

/** Robot/Bot icon */
export const BotIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

// ================================
// SPORTS ICONS
// ================================

/** Lightning bolt - for live/real-time */
export const BoltIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
  </svg>
);

/** Lightning outline */
export const BoltOutlineIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

/** Target/Crosshair - for predictions */
export const TargetIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

/** Trophy icon */
export const TrophyIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

// ================================
// ALERTS & NOTIFICATIONS
// ================================

/** Bell icon - for alerts */
export const BellIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

/** Bell with dot - for new alerts */
export const BellAlertIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    <circle cx="18" cy="4" r="3" fill="currentColor" />
  </svg>
);

/** Megaphone icon - for announcements */
export const MegaphoneIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="m3 11 18-5v12L3 13v-2z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

// ================================
// UI ELEMENTS
// ================================

/** Arrow right */
export const ArrowRightIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/** Chevron right */
export const ChevronRightIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/** Search/magnifying glass */
export const SearchIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

/** Eye icon - for insights/view */
export const EyeIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/** Fire icon - for hot/trending */
export const FireIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
  </svg>
);

/** Star icon */
export const StarIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

/** Shield/security icon */
export const ShieldIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/** Percent icon - for odds/probability */
export const PercentIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

/** Clock icon - for time-sensitive */
export const ClockIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/** Calendar icon */
export const CalendarIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/** Dollar sign - for value/money */
export const DollarIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

/** Check circle - for success/verified */
export const CheckCircleIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/** X circle - for errors/rejected */
export const XCircleIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

/** Info circle */
export const InfoIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

/** Warning triangle */
export const WarningIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

/** Globe icon */
export const GlobeIcon = ({ className = 'w-5 h-5', size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

// ================================
// EXPORT ALL
// ================================

export const Icons = {
  // Analytics
  ChartBar: ChartBarIcon,
  TrendingUp: TrendingUpIcon,
  Analytics: AnalyticsIcon,
  
  // AI
  Brain: BrainIcon,
  Sparkles: SparklesIcon,
  SparklesOutline: SparklesOutlineIcon,
  Bot: BotIcon,
  
  // Sports
  Bolt: BoltIcon,
  BoltOutline: BoltOutlineIcon,
  Target: TargetIcon,
  Trophy: TrophyIcon,
  
  // Alerts
  Bell: BellIcon,
  BellAlert: BellAlertIcon,
  Megaphone: MegaphoneIcon,
  
  // UI
  ArrowRight: ArrowRightIcon,
  ChevronRight: ChevronRightIcon,
  Search: SearchIcon,
  Eye: EyeIcon,
  Fire: FireIcon,
  Star: StarIcon,
  Shield: ShieldIcon,
  Percent: PercentIcon,
  Clock: ClockIcon,
  Calendar: CalendarIcon,
  Dollar: DollarIcon,
  CheckCircle: CheckCircleIcon,
  XCircle: XCircleIcon,
  Info: InfoIcon,
  Warning: WarningIcon,
  Globe: GlobeIcon,
};

export default Icons;
