/**
 * Premium Visual Components — SVG-based Data Visualization
 * 
 * High-quality, minimal, premium-tech visuals.
 * No external libraries — pure SVG + CSS animations.
 * Designed to replace text-heavy sections with visual devices.
 * 
 * DESIGN PHILOSOPHY:
 * - Apple Health / Linear / Stripe aesthetic
 * - Dark mode native (#0a0a0b background)
 * - Emerald (#10b981) for positive, Rose (#ef4444) for negative
 * - Animations are subtle, purposeful, not decorative
 * - Every visual tells a story at a glance
 * 
 * Components:
 * - StackedProbBar — Animated 1x2 probability bar with shimmer
 * - MomentumTimeline — WWLDW form as connected SVG line graph
 * - RiskGauge — Traffic-light needle gauge for risk level
 */

'use client';

import { useState, useEffect } from 'react';


// ============================================
// RISK GAUGE — Mini circular risk indicator
// Traffic-light style (green → yellow → red)
// ============================================

interface RiskGaugeProps {
  /** Risk level */
  level: 'low' | 'medium' | 'high';
  /** Size in pixels */
  size?: number;
  /** Show label */
  showLabel?: boolean;
  /** Label override */
  label?: string;
}

export function RiskGauge({ level, size = 48, showLabel = true, label }: RiskGaugeProps) {
  const configs = {
    low: { color: '#10b981', angle: 30, label: 'Low Risk', glowColor: 'rgba(16, 185, 129, 0.3)' },
    medium: { color: '#f59e0b', angle: 90, label: 'Medium', glowColor: 'rgba(245, 158, 11, 0.3)' },
    high: { color: '#ef4444', angle: 150, label: 'High Risk', glowColor: 'rgba(239, 68, 68, 0.3)' },
  };

  const config = configs[level];
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2 + radius * 0.1;

  // Semi-circle background
  const bgStartX = cx - radius;
  const bgEndX = cx + radius;
  const bgPath = `M ${bgStartX} ${cy} A ${radius} ${radius} 0 0 1 ${bgEndX} ${cy}`;

  // Needle angle (0° = left/low, 180° = right/high)
  const needleAngle = (config.angle * Math.PI) / 180;
  const needleLength = radius - strokeWidth - 4;
  const needleX = cx - needleLength * Math.cos(needleAngle);
  const needleY = cy - needleLength * Math.sin(needleAngle);

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`} className="overflow-visible">
        {/* Background semi-circle with gradient: green → yellow → red */}
        <defs>
          <linearGradient id="risk-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        <path d={bgPath} fill="none" stroke="url(#risk-gradient)" strokeWidth={strokeWidth} strokeLinecap="round" />

        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needleX} y2={needleY}
          stroke={config.color}
          strokeWidth={2}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill={config.color} />
      </svg>

      {showLabel && (
        <span className="text-[10px] font-medium mt-0.5" style={{ color: config.color }}>
          {label || config.label}
        </span>
      )}
    </div>
  );
}


// ============================================
// STACKED PROBABILITY BAR — Win/Draw/Loss in one row
// Premium version of the probability display
// ============================================

interface StackedProbBarProps {
  home: number;
  draw: number | null;
  away: number;
  homeTeam: string;
  awayTeam: string;
  /** Highlight which side has value */
  valueSide?: 'home' | 'draw' | 'away' | null;
  animate?: boolean;
  /** Hide exact numbers (free users see bar shape but not %) */
  locked?: boolean;
}

export function StackedProbBar({
  home,
  draw,
  away,
  homeTeam,
  awayTeam,
  valueSide,
  animate = true,
  locked = false,
}: StackedProbBarProps) {
  const [animated, setAnimated] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(timer);
  }, [animate]);

  const max = Math.max(home, away, draw ?? 0);

  return (
    <div>
      {/* Labels */}
      <div className="flex items-center justify-between mb-2 text-[10px] text-zinc-500 uppercase tracking-widest">
        <span className={home === max ? 'text-blue-400 font-semibold' : ''}>{homeTeam}</span>
        {draw !== null && <span className={draw === max ? 'text-zinc-300 font-semibold' : ''}>Draw</span>}
        <span className={away === max ? 'text-rose-400 font-semibold' : ''}>{awayTeam}</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800/40 gap-px">
        <div
          className={`bg-gradient-to-r from-blue-600 to-blue-500 rounded-l-full transition-all duration-700 ease-out relative ${
            valueSide === 'home' ? 'ring-1 ring-emerald-400/50' : ''
          }`}
          style={{ width: animated ? `${home}%` : '33%' }}
        >
          {home === max && animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_3s_infinite]" />
          )}
        </div>

        {draw !== null && (
          <div
            className={`bg-zinc-500/50 transition-all duration-700 ease-out ${
              valueSide === 'draw' ? 'ring-1 ring-emerald-400/50' : ''
            }`}
            style={{ width: animated ? `${draw}%` : '33%' }}
          />
        )}

        <div
          className={`bg-gradient-to-r from-rose-500 to-rose-600 rounded-r-full transition-all duration-700 ease-out relative ${
            valueSide === 'away' ? 'ring-1 ring-emerald-400/50' : ''
          }`}
          style={{ width: animated ? `${away}%` : '33%' }}
        >
          {away === max && animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_3s_infinite]" />
          )}
        </div>
      </div>

      {/* Values */}
      <div className="flex items-center justify-between mt-1.5">
        {locked ? (
          <>
            <span className="text-sm font-bold tabular-nums text-zinc-700 blur-[5px] select-none">33%</span>
            {draw !== null && <span className="text-sm font-bold tabular-nums text-zinc-700 blur-[5px] select-none">34%</span>}
            <span className="text-sm font-bold tabular-nums text-zinc-700 blur-[5px] select-none">33%</span>
          </>
        ) : (
          <>
            <span className={`text-sm font-bold tabular-nums ${home === max ? 'text-blue-400' : 'text-zinc-600'}`}>
              {home.toFixed(0)}%
            </span>
            {draw !== null && (
              <span className={`text-sm font-bold tabular-nums ${draw === max ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {draw.toFixed(0)}%
              </span>
            )}
            <span className={`text-sm font-bold tabular-nums ${away === max ? 'text-rose-400' : 'text-zinc-600'}`}>
              {away.toFixed(0)}%
            </span>
          </>
        )}
      </div>

      {/* Value indicator / PRO upsell */}
      {locked ? (
        <div className="mt-2 flex justify-center">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold">
            🔒 PRO — exact probabilities
          </span>
        </div>
      ) : valueSide ? (
        <div className="mt-2 flex justify-center">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            💎 {valueSide === 'home' ? homeTeam : valueSide === 'away' ? awayTeam : 'Draw'} value
          </span>
        </div>
      ) : null}
    </div>
  );
}


// ============================================
// MOMENTUM TIMELINE — Visual form streak
// Shows WWLDW as a connected line graph
// ============================================

interface MomentumTimelineProps {
  /** Form string like "WWLDW" */
  form: string;
  /** Team name */
  teamName: string;
  /** Trend direction */
  trend?: 'rising' | 'falling' | 'stable';
}

export function MomentumTimeline({ form, teamName, trend }: MomentumTimelineProps) {
  const [animated, setAnimated] = useState(false);
  const results = form.slice(0, 6).split('');

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Map results to Y values (W=80, D=50, L=20)
  const points = results.map((r, i) => {
    const y = r === 'W' ? 20 : r === 'D' ? 50 : r === 'L' ? 80 : 50;
    const x = (i / Math.max(results.length - 1, 1)) * 100;
    return { x, y, result: r };
  });

  if (results.length === 0 || form === '-----') return null;

  // Build SVG path
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const trendColor = trend === 'rising' ? 'text-emerald-400' : trend === 'falling' ? 'text-rose-400' : 'text-zinc-500';
  const trendIcon = trend === 'rising' ? '↗' : trend === 'falling' ? '↘' : '→';

  const resultColors: Record<string, string> = {
    W: 'fill-emerald-400 stroke-emerald-400',
    D: 'fill-zinc-500 stroke-zinc-500',
    L: 'fill-rose-500 stroke-rose-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400 font-medium truncate max-w-[140px]">{teamName}</span>
        <span className={`text-sm font-semibold ${trendColor}`}>{trendIcon}</span>
      </div>

      <div className="relative h-16">
        <svg viewBox="-5 5 110 85" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-all duration-700 ${animated ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              className={`${resultColors[p.result] || 'fill-zinc-600 stroke-zinc-600'} transition-all duration-500`}
              style={{ transitionDelay: `${i * 80}ms`, opacity: animated ? 1 : 0 }}
              strokeWidth={1.5}
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between -ml-3 pointer-events-none">
          <span className="text-[8px] text-emerald-600">W</span>
          <span className="text-[8px] text-zinc-600">D</span>
          <span className="text-[8px] text-rose-600">L</span>
        </div>
      </div>
    </div>
  );
}
