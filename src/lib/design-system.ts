/**
 * SportBot Design System - Unified Color Palette
 * 
 * RULE: Only 4 semantic colors + neutrals across the entire app.
 * This creates instant visual recognition and strong brand identity.
 * 
 * Usage: Import and use these classes consistently across all components.
 */

// ============================================
// SEMANTIC COLOR TOKENS
// ============================================

/**
 * PRIMARY (Emerald) - Value, Edge, Positive Outcomes
 * Use for: Value detected, positive edge, winning, "go" signals
 */
export const colors = {
  // Value/Edge - The money color
  value: {
    text: 'text-emerald-400',
    textStrong: 'text-emerald-300',
    textMuted: 'text-emerald-400/70',
    bg: 'bg-emerald-500/15',
    bgStrong: 'bg-emerald-500/25',
    border: 'border-emerald-400/30',
    borderStrong: 'border-emerald-400/50',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]',
  },

  // Premium (Violet) - PRO features, locked content
  premium: {
    text: 'text-violet-400',
    textStrong: 'text-violet-300',
    textMuted: 'text-violet-400/60',
    bg: 'bg-violet-500/15',
    bgStrong: 'bg-violet-500/25',
    border: 'border-violet-400/25',
    borderStrong: 'border-violet-400/40',
  },

  // Caution (Amber) - Warnings, risk, referee cards
  caution: {
    text: 'text-amber-400',
    textStrong: 'text-amber-300',
    textMuted: 'text-amber-400/70',
    bg: 'bg-amber-500/15',
    bgStrong: 'bg-amber-500/25',
    border: 'border-amber-400/30',
  },

  // Negative (Rose) - Overpriced, injuries, danger
  negative: {
    text: 'text-rose-400',
    textStrong: 'text-rose-300',
    textMuted: 'text-rose-400/60',
    bg: 'bg-rose-500/15',
    bgStrong: 'bg-rose-500/25',
    border: 'border-rose-400/30',
  },

  // Neutral (Zinc) - Default, muted, secondary
  neutral: {
    text: 'text-zinc-400',
    textStrong: 'text-zinc-300',
    textMuted: 'text-zinc-500',
    textDim: 'text-zinc-600',
    bg: 'bg-zinc-800/50',
    bgStrong: 'bg-zinc-700/50',
    border: 'border-zinc-700/50',
    borderStrong: 'border-zinc-600/50',
  },
} as const;

// ============================================
// EDGE STYLING (Intensity via opacity, not hue)
// ============================================

/**
 * All edges use emerald (value color), differentiated by intensity
 */
export function getEdgeStyle(edgePercent: number, isBestValue: boolean = false) {
  const isStrong = edgePercent >= 8;
  const isModerate = edgePercent >= 5;
  const isSmall = edgePercent >= 3;
  const hasEdge = isSmall;

  if (!hasEdge) {
    return {
      tier: 'none' as const,
      text: colors.neutral.text,
      bg: colors.neutral.bg,
      border: colors.neutral.border,
      barColor: 'bg-zinc-500',
      label: 'Fair price',
      badge: '',
    };
  }

  // All edges use emerald, intensity varies
  const intensity = isStrong ? 1 : isModerate ? 0.8 : 0.6;
  
  return {
    tier: isStrong ? 'strong' as const : isModerate ? 'moderate' as const : 'small' as const,
    text: isBestValue ? colors.value.textStrong : colors.value.text,
    bg: isBestValue ? colors.value.bgStrong : colors.value.bg,
    border: isBestValue ? colors.value.borderStrong : colors.value.border,
    barColor: isBestValue 
      ? (isStrong ? 'bg-emerald-400' : isModerate ? 'bg-emerald-500' : 'bg-emerald-500/70')
      : 'bg-emerald-600/60',
    label: isStrong ? '🔥 Strong Edge' : isModerate ? '✨ Good Edge' : '🎯 Edge Detected',
    badge: `+${edgePercent.toFixed(0)}% edge`,
    glow: isBestValue && isStrong ? colors.value.glow : '',
    opacity: `opacity-${Math.round(intensity * 100)}`,
  };
}

/**
 * Get overpriced styling (negative edge)
 */
export function getOverpricedStyle(edgePercent: number) {
  return {
    text: colors.negative.textMuted,
    bg: colors.neutral.bg,
    border: colors.neutral.border,
    barColor: 'bg-rose-400/50',
    label: `−${Math.abs(edgePercent).toFixed(0)}% over`,
  };
}

// ============================================
// SIGNAL STYLING
// ============================================

export type SignalLevel = 'strong' | 'moderate' | 'slight' | 'neutral' | 'weak';

/**
 * Universal signal styling - positive vs neutral
 * Strong/moderate = emerald, weak/neutral = zinc
 */
export function getSignalStyle(level: SignalLevel) {
  switch (level) {
    case 'strong':
      return {
        text: colors.value.textStrong,
        bg: colors.value.bgStrong,
        border: colors.value.borderStrong,
        label: 'Strong',
      };
    case 'moderate':
      return {
        text: colors.value.text,
        bg: colors.value.bg,
        border: colors.value.border,
        label: 'Moderate',
      };
    case 'slight':
      return {
        text: colors.value.textMuted,
        bg: colors.value.bg,
        border: colors.value.border,
        label: 'Slight',
      };
    case 'neutral':
      return {
        text: colors.neutral.text,
        bg: colors.neutral.bg,
        border: colors.neutral.border,
        label: 'Neutral',
      };
    case 'weak':
    default:
      return {
        text: colors.neutral.textMuted,
        bg: colors.neutral.bg,
        border: colors.neutral.border,
        label: 'Weak',
      };
  }
}

// ============================================
// RISK STYLING
// ============================================

export type RiskLevel = 'low' | 'medium' | 'high';

export function getRiskStyle(level: RiskLevel) {
  switch (level) {
    case 'low':
      return {
        text: colors.value.text,
        bg: colors.value.bg,
        border: colors.value.border,
        label: 'Low Risk',
      };
    case 'medium':
      return {
        text: colors.caution.text,
        bg: colors.caution.bg,
        border: colors.caution.border,
        label: 'Medium Risk',
      };
    case 'high':
      return {
        text: colors.negative.text,
        bg: colors.negative.bg,
        border: colors.negative.border,
        label: 'High Risk',
      };
  }
}

// ============================================
// PRO/PREMIUM STYLING
// ============================================

export const proBadge = {
  small: `px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.premium.bg} ${colors.premium.text} ${colors.premium.border} border`,
  medium: `px-2.5 py-1 rounded-full text-xs font-medium ${colors.premium.bg} ${colors.premium.text} ${colors.premium.border} border`,
};

export const proSection = {
  header: `text-sm font-semibold ${colors.premium.textStrong} uppercase tracking-wide`,
  border: `border ${colors.premium.border}`,
  icon: colors.premium.text,
};

// ============================================
// AVAILABILITY/INJURY STYLING
// ============================================

export function getAvailabilityStyle(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'low':
      return {
        text: colors.neutral.text,
        bg: colors.neutral.bg,
        label: 'Low Impact',
      };
    case 'medium':
      return {
        text: colors.caution.text,
        bg: colors.caution.bg,
        label: 'Some Concerns',
      };
    case 'high':
      return {
        text: colors.negative.text,
        bg: colors.negative.bg,
        label: 'Key Absences',
      };
  }
}

// ============================================
// CARD STYLING (Referee)
// ============================================

export const cardColors = {
  yellow: {
    text: colors.caution.text,
    icon: '🟨',
  },
  red: {
    text: colors.negative.text,
    icon: '🟥',
  },
};

// ============================================
// COMMON COMPONENT CLASSES
// ============================================

export const componentClasses = {
  // Cards
  card: 'bg-zinc-900/50 rounded-xl border border-zinc-800/50',
  cardHover: 'hover:border-zinc-700/50 transition-colors',
  
  // Badges
  badge: 'px-3 py-1.5 rounded-full text-sm font-medium border',
  badgeSmall: 'px-2 py-0.5 rounded-full text-xs font-medium border',
  
  // Text
  heading: 'text-white font-semibold',
  subheading: 'text-zinc-400 text-sm',
  label: 'text-zinc-500 text-xs uppercase tracking-wide',
  
  // Interactive
  button: 'rounded-xl font-medium transition-all',
};
