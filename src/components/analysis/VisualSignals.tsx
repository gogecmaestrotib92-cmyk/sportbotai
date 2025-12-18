/**
 * Visual Signals Components - Premium Data Visualization
 * 
 * Clean, minimal visual components for displaying match signals.
 * No charts libraries - pure CSS/SVG for performance.
 */

'use client';

import { InfoTooltip } from '@/components/ui/Tooltip';

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
}

export function EdgeBar({ direction, percentage, homeTeam, awayTeam }: EdgeBarProps) {
  // Calculate bar position (50 = center, 0 = full home, 100 = full away)
  const position = direction === 'even' 
    ? 50 
    : direction === 'home' 
      ? 50 - (percentage * 2.5)  // Move left for home advantage
      : 50 + (percentage * 2.5); // Move right for away advantage
  
  const clampedPosition = Math.max(15, Math.min(85, position));
  
  return (
    <div className="space-y-2">
      {/* Team labels */}
      <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
        <span>{homeTeam}</span>
        <span>{awayTeam}</span>
      </div>
      
      {/* Bar container */}
      <div className="relative h-2 bg-zinc-800/50 rounded-full overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-zinc-700/20 to-blue-500/20" />
        
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-600" />
        
        {/* Indicator */}
        <div 
          className="absolute top-0 bottom-0 w-4 -ml-2 transition-all duration-500 ease-out"
          style={{ left: `${clampedPosition}%` }}
        >
          <div className={`
            w-full h-full rounded-full
            ${direction === 'home' ? 'bg-emerald-500' : direction === 'away' ? 'bg-blue-500' : 'bg-zinc-500'}
            shadow-lg
          `} />
        </div>
      </div>
      
      {/* Edge label */}
      <div className="text-center">
        <span className={`text-xs font-medium ${
          direction === 'home' ? 'text-emerald-400' : 
          direction === 'away' ? 'text-blue-400' : 
          'text-zinc-500'
        }`}>
          {direction === 'even' ? 'Even' : `${direction === 'home' ? homeTeam : awayTeam} +${percentage}%`}
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
  
  const colors = {
    high: { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', text: 'text-emerald-400' },
    medium: { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', text: 'text-amber-400' },
    low: { stroke: '#71717a', bg: 'rgba(113, 113, 122, 0.1)', text: 'text-zinc-400' },
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
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider">data</span>
          <InfoTooltip 
            content="Measures how complete our data is (form, H2H, injuries). NOT a prediction of outcome."
            position="bottom"
          />
        </div>
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
  
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-sm transition-all ${
            i <= bars 
              ? level === 'high' ? 'bg-amber-500' : level === 'medium' ? 'bg-zinc-400' : 'bg-blue-500'
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
  clarityScore: number;
}

export function VerdictBadge({ favored, confidence, clarityScore }: VerdictBadgeProps) {
  const colors = {
    high: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    medium: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
    low: 'from-zinc-500/20 to-zinc-500/5 border-zinc-500/30 text-zinc-400',
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-6
      bg-gradient-to-br ${colors[confidence].split(' ').slice(0, 2).join(' ')}
      border ${colors[confidence].split(' ')[2]}
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
            Analysis Points To
          </p>
          <p className="text-xl font-semibold text-white">
            {favored || 'No Clear Edge'}
          </p>
        </div>
        <ConfidenceRing score={clarityScore} confidence={confidence} size={72} />
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
  const levels = {
    low: { dots: 1, color: 'bg-emerald-500', label: 'Low Impact' },
    medium: { dots: 2, color: 'bg-amber-500', label: 'Medium' },
    high: { dots: 3, color: 'bg-red-500', label: 'High' },
    critical: { dots: 4, color: 'bg-red-600', label: 'Critical' },
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
