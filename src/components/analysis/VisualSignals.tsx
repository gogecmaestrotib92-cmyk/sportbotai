/**
 * Visual Signals Components - Premium Data Visualization
 * 
 * Clean, minimal visual components for displaying match signals.
 * No charts libraries - pure CSS/SVG for performance.
 * 
 * COLORS: Uses unified design system - emerald for value, amber for caution, rose for negative
 */

'use client';

import { colors as dsColors } from '@/lib/design-system';

// ============================================
// FORM DOTS - Shows recent form as colored dots
// ============================================

interface FormDotsProps {
  form: string;        // "WWLDW" or "-----" for no data
  teamName: string;
  size?: 'sm' | 'md';
}

export function FormDots({ form, teamName, size = 'md' }: FormDotsProps) {
  const dots = form.slice(0, 5).split('');
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const isNoData = form === '-----' || form === 'DDDDD' && !form.includes('W') && !form.includes('L');
  
  const getColor = (result: string) => {
    switch (result.toUpperCase()) {
      case 'W': return 'bg-emerald-500';
      case 'D': return 'bg-zinc-500';
      case 'L': return 'bg-red-500';
      case '-': return 'bg-zinc-800 border border-zinc-700'; // No data
      default: return 'bg-zinc-700';
    }
  };

  // If no real data, show "No data" message
  if (isNoData) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 w-20 truncate">{teamName}</span>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`${dotSize} rounded-full bg-zinc-800 border border-zinc-700`}
              title="No data"
            />
          ))}
        </div>
        <span className="text-[10px] text-zinc-600 italic">
          No data
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 w-20 truncate">{teamName}</span>
      <div className="flex items-center gap-1">
        {dots.map((result, i) => (
          <div
            key={i}
            className={`${dotSize} rounded-full ${getColor(result)} transition-all`}
            title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : result === 'L' ? 'Loss' : 'No data'}
          />
        ))}
      </div>
      <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
        {form.slice(0, 5)}
      </span>
    </div>
  );
}

// ============================================
// FORM COMPARISON - Side by side form display
// ============================================

interface FormComparisonProps {
  homeTeam: string;
  awayTeam: string;
  homeForm: string;
  awayForm: string;
}

export function FormComparison({ homeTeam, awayTeam, homeForm, awayForm }: FormComparisonProps) {
  return (
    <div className="space-y-2">
      <FormDots form={homeForm} teamName={homeTeam} />
      <FormDots form={awayForm} teamName={awayTeam} />
    </div>
  );
}

// ============================================
// EDGE BAR - Visual representation of advantage
// ============================================

interface EdgeBarProps {
  direction: 'home' | 'away' | 'even';
  percentage: number;  // 0-15
  homeTeam: string;
  awayTeam: string;
  canSeeExactNumbers?: boolean; // PRO only - show exact percentages
}

export function EdgeBar({ direction, percentage, homeTeam, awayTeam, canSeeExactNumbers = false }: EdgeBarProps) {
  // Calculate bar position (50 = center, 0 = full home, 100 = full away)
  const position = direction === 'even' 
    ? 50 
    : direction === 'home' 
      ? 50 - (percentage * 2.5)  // Move left for home advantage
      : 50 + (percentage * 2.5); // Move right for away advantage
  
  // Clamp to prevent indicator from going beyond edges where labels are
  const clampedPosition = Math.max(20, Math.min(80, position));
  
  // RESTRAINED COLORS: Only show accent color when edge is meaningful (>5%)
  const hasSignificantEdge = percentage > 5;
  const indicatorColor = hasSignificantEdge 
    ? (direction === 'home' ? 'bg-emerald-500' : direction === 'away' ? 'bg-emerald-500' : 'bg-zinc-500')
    : 'bg-zinc-500';
  const textColor = hasSignificantEdge 
    ? 'text-zinc-300'
    : 'text-zinc-500';
  
  return (
    <div className="space-y-2">
      {/* Team labels */}
      <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
        <span className="truncate max-w-[40%]">{homeTeam}</span>
        <span className="truncate max-w-[40%] text-right">{awayTeam}</span>
      </div>
      
      {/* Bar container */}
      <div className="relative h-2 bg-zinc-800/50 rounded-full overflow-hidden">
        {/* Gradient background - more subtle */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/30 via-zinc-800/30 to-zinc-700/30" />
        
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-600" />
        
        {/* Indicator */}
        <div 
          className="absolute top-0 bottom-0 w-4 -ml-2 transition-all duration-500 ease-out"
          style={{ left: `${clampedPosition}%` }}
        >
          <div className={`w-full h-full rounded-full ${indicatorColor} shadow-lg`} />
        </div>
      </div>
      
      {/* Edge label - positioned below bar, never overlaps */}
      <div className="text-center">
        <span className={`text-xs font-medium ${textColor}`}>
          {direction === 'even' 
            ? 'Even' 
            : canSeeExactNumbers 
              ? `${direction === 'home' ? homeTeam : awayTeam} +${percentage}%`
              : `${direction === 'home' ? homeTeam : awayTeam} favored`
          }
        </span>
      </div>
    </div>
  );
}

// ============================================
// CONFIDENCE RING - Circular confidence meter
// ============================================

interface ConfidenceRingProps {
  score: number;       // 0-100
  confidence: 'high' | 'medium' | 'low';
  size?: number;       // Default 80
}

export function ConfidenceRing({ score, confidence, size = 80 }: ConfidenceRingProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  // RESTRAINED COLORS: Only high confidence gets accent color
  const colors = {
    high: { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', text: 'text-emerald-400' },
    medium: { stroke: '#71717a', bg: 'rgba(113, 113, 122, 0.1)', text: 'text-zinc-400' },
    low: { stroke: '#52525b', bg: 'rgba(82, 82, 91, 0.1)', text: 'text-zinc-500' },
  };
  
  const color = colors[confidence];

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-semibold ${color.text}`}>{score}%</span>
        <span className="text-[8px] text-zinc-500 uppercase tracking-wider">data</span>
      </div>
    </div>
  );
}

// ============================================
// SIGNAL BAR - Mini horizontal progress bar
// ============================================

interface SignalBarProps {
  value: number;       // 0-100
  color?: 'emerald' | 'amber' | 'blue' | 'red' | 'zinc';
}

export function SignalBar({ value, color = 'emerald' }: SignalBarProps) {
  const colors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    zinc: 'bg-zinc-500',
  };

  return (
    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ============================================
// TEMPO INDICATOR - Visual pace representation
// ============================================

interface TempoIndicatorProps {
  level: 'low' | 'medium' | 'high';
}

export function TempoIndicator({ level }: TempoIndicatorProps) {
  const bars = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  
  // RESTRAINED: Use neutral zinc colors for tempo (it's informational, not edge)
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-sm transition-all ${
            i <= bars 
              ? 'bg-zinc-400'
              : 'bg-zinc-800'
          }`}
          style={{ height: `${i * 33}%` }}
        />
      ))}
    </div>
  );
}

// ============================================
// VERDICT BADGE - The main prediction display
// ============================================

interface VerdictBadgeProps {
  favored: string;
  confidence: 'high' | 'medium' | 'low';
  clarityScore?: number; // Optional - no longer displayed
  edgePercentage?: number; // e.g. 52 for 52%
  canSeeExactNumbers?: boolean; // PRO only - show exact percentages
}

export function VerdictBadge({ favored, confidence, edgePercentage, canSeeExactNumbers = false }: VerdictBadgeProps) {
  // RESTRAINED COLOR SYSTEM:
  // - High confidence (edge >5%): subtle emerald accent
  // - Medium/Low: neutral zinc - no color unless there's a clear edge
  const colors = {
    high: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    medium: 'from-zinc-800/50 to-zinc-900/50 border-zinc-700/30',
    low: 'from-zinc-800/50 to-zinc-900/50 border-zinc-700/30',
  };

  // PRO users see "Strong Signal", FREE users see "Directional Signal"
  const confidenceLabels = canSeeExactNumbers ? {
    high: 'Strong Signal',
    medium: 'Moderate Signal',
    low: 'Weak Signal',
  } : {
    high: 'Directional Signal',
    medium: 'Model Lean',
    low: 'Slight Lean',
  };

  // Accent color for the label: only emerald for high, neutral for rest
  const labelColor = confidence === 'high' ? 'text-emerald-400' : 'text-zinc-500';

  // For low confidence matches, show "Slight edge to X (52%)" instead of "No Clear Edge"
  const isNoEdge = !favored || favored === 'No Clear Edge' || favored === 'Nema Jasne Prednosti';
  const displayText = isNoEdge && confidence === 'low' 
    ? 'Too Close to Call'
    : confidence === 'low' && favored && !isNoEdge && edgePercentage
      ? `Slight edge to ${favored}`
      : isNoEdge ? (favored === 'Nema Jasne Prednosti' ? 'Preblizu da se Odredi' : 'No Clear Edge') : favored;
  
  // Show percentage ONLY for PRO users (canSeeExactNumbers)
  const showPercentage = canSeeExactNumbers && confidence === 'low' && favored && favored !== 'No Clear Edge' && edgePercentage;

  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-6 sm:p-8
      bg-gradient-to-br ${colors[confidence]} border
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Analysis Points To
          </p>
          {/* PRIMARY VERDICT: Near-white, bold - this is the main takeaway */}
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {displayText}
            {showPercentage && (
              <span className="text-lg font-normal text-zinc-400 ml-3">
                ({edgePercentage}%)
              </span>
            )}
          </p>
          {confidence === 'low' && (
            <p className="text-xs text-zinc-500 mt-1">
              Data suggests a lean, but not enough to call confidently
            </p>
          )}
        </div>
        <div className={`text-right ${labelColor}`}>
          <p className="text-sm font-medium">{confidenceLabels[confidence]}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// AVAILABILITY DOTS - Player availability indicator
// ============================================

interface AvailabilityDotsProps {
  level: 'low' | 'medium' | 'high' | 'critical';
}

export function AvailabilityDots({ level }: AvailabilityDotsProps) {
  // Use design system colors: emerald for low, amber for medium, rose for high/critical
  const levels = {
    low: { dots: 1, color: 'bg-emerald-500', label: 'Low Impact' },
    medium: { dots: 2, color: 'bg-amber-500', label: 'Medium' },
    high: { dots: 3, color: 'bg-rose-500', label: 'High' },
    critical: { dots: 4, color: 'bg-rose-600', label: 'Critical' },
  };
  
  const config = levels[level];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${i <= config.dots ? config.color : 'bg-zinc-800'}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-zinc-500">{config.label}</span>
    </div>
  );
}
