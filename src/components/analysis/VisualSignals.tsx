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
    high: { stroke: '#2AF6A0', bg: 'rgba(42,246,160, 0.1)', text: 'text-emerald-400' },
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
// VERDICT BADGE - Premium visual prediction display
// ============================================

interface VerdictBadgeProps {
  favored: string;
  confidence: 'high' | 'medium' | 'low';
  clarityScore?: number;
  edgePercentage?: number;
  canSeeExactNumbers?: boolean;
}

/** Animated SVG confidence arc */
function ConfidenceArc({ confidence, size = 56 }: { confidence: 'high' | 'medium' | 'low'; size?: number }) {
  const config = {
    high: { angle: 150, color: '#2AF6A0', glow: 'rgba(42,246,160,0.4)', label: 'HIGH' },
    medium: { angle: 95, color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', label: 'MED' },
    low: { angle: 45, color: '#71717a', glow: 'rgba(113,113,122,0.2)', label: 'LOW' },
  };
  const c = config[confidence];
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // semicircle
  const arcLength = (c.angle / 180) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + 6} viewBox={`0 0 ${size} ${size / 2 + 6}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} strokeLinecap="round"
        />
        {/* Confidence arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none" stroke={c.color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 6px ${c.glow})`, transition: 'stroke-dasharray 1s ease-out' }}
        />
        {/* Center dot */}
        <circle cx={size / 2} cy={size / 2 - 2} r="2.5" fill={c.color} opacity="0.8" />
      </svg>
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: c.color }}>
        {c.label}
      </span>
    </div>
  );
}

/** Verdict icon SVG based on confidence */
function VerdictIcon({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  if (confidence === 'high') {
    // Bullseye / target
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
        <circle cx="10" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <circle cx="10" cy="10" r="2" fill="currentColor" />
      </svg>
    );
  }
  if (confidence === 'medium') {
    // Scale / balance
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v14M5 7l5-2 5 2M5 7l-1 4h4L5 7zM15 7l1 4h-4l3-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      </svg>
    );
  }
  // Low — question / uncertain
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      <path d="M8 8a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2.5 2-2.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <circle cx="10" cy="14.5" r="0.8" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function VerdictBadge({ favored, confidence, edgePercentage, canSeeExactNumbers = false }: VerdictBadgeProps) {
  const accentConfig = {
    high: { hex: '#2AF6A0', gradient: 'from-emerald-500/10 to-emerald-500/[0.03]', border: 'border-emerald-500/15', barGlow: 'rgba(42,246,160,0.3)' },
    medium: { hex: '#f59e0b', gradient: 'from-amber-500/[0.06] to-amber-500/[0.02]', border: 'border-amber-500/10', barGlow: 'rgba(245,158,11,0.2)' },
    low: { hex: '#71717a', gradient: 'from-zinc-700/20 to-zinc-800/20', border: 'border-zinc-700/20', barGlow: 'rgba(113,113,122,0.15)' },
  };
  const accent = accentConfig[confidence];

  const confidenceLabels = canSeeExactNumbers ? {
    high: 'Strong Signal',
    medium: 'Moderate Signal',
    low: 'Weak Signal',
  } : {
    high: 'Directional Signal',
    medium: 'Model Lean',
    low: 'Slight Lean',
  };

  const isNoEdge = !favored || favored === 'No Clear Edge' || favored === 'Nema Jasne Prednosti';
  const displayText = isNoEdge && confidence === 'low' 
    ? 'Too Close to Call'
    : confidence === 'low' && favored && !isNoEdge && edgePercentage
      ? `Slight edge to ${favored}`
      : isNoEdge ? (favored === 'Nema Jasne Prednosti' ? 'Preblizu da se Odredi' : 'No Clear Edge') : favored;

  const showPercentage = canSeeExactNumbers && confidence === 'low' && favored && favored !== 'No Clear Edge' && edgePercentage;

  // For edge strength mini-bar (PRO only)
  const edgeBarWidth = edgePercentage ? Math.min(Math.abs(edgePercentage - 50) * 6, 100) : 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${accent.gradient} ${accent.border} border`}>
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: `linear-gradient(180deg, ${accent.hex}, ${accent.hex}33)`, boxShadow: `0 0 8px ${accent.barGlow}` }}
      />

      <div className="flex items-center justify-between p-5 sm:p-6 pl-5 sm:pl-6">
        {/* Left: Verdict content */}
        <div className="flex-1 min-w-0 ml-2">
          {/* Header with icon */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${accent.hex}12`, border: `1px solid ${accent.hex}18` }}>
              <span style={{ color: accent.hex }}><VerdictIcon confidence={confidence} /></span>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Analysis Points To
            </p>
          </div>

          {/* Main verdict */}
          <p className="text-xl sm:text-2xl font-bold text-white leading-tight">
            {displayText}
          </p>

          {/* Sub-label: confidence + optional percentage */}
          <div className="flex items-center gap-2.5 mt-2">
            {/* Pulse dot */}
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent.hex }} />
            <span className="text-xs font-medium" style={{ color: accent.hex }}>
              {confidenceLabels[confidence]}
            </span>
            {showPercentage && (
              <span className="text-xs text-zinc-500 font-mono">
                ({edgePercentage}%)
              </span>
            )}
          </div>

          {/* Confidence sub-text for low */}
          {confidence === 'low' && (
            <p className="text-[11px] text-zinc-600 mt-1.5 ml-4">
              Data suggests a lean, but not enough to call confidently
            </p>
          )}

          {/* Edge strength mini-bar (PRO only) */}
          {canSeeExactNumbers && edgePercentage && edgePercentage !== 50 && (
            <div className="mt-3 ml-4">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Edge</span>
                <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${edgeBarWidth}%`,
                      background: `linear-gradient(90deg, ${accent.hex}44, ${accent.hex})`,
                      boxShadow: `0 0 8px ${accent.barGlow}`,
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono" style={{ color: accent.hex }}>
                  {Math.abs(edgePercentage - 50).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Confidence Arc */}
        <div className="flex-shrink-0 ml-4">
          <ConfidenceArc confidence={confidence} />
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
