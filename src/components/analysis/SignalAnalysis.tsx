/**
 * Signal Analysis Component - Premium Match Intelligence
 * 
 * Clean, minimal display of normalized signals.
 * No raw stats. No clutter. Just sharp insights.
 * 
 * Designed to look the same across ALL sports.
 */

'use client';

import { useState } from 'react';
import PremiumIcon, { type IconName } from '@/components/ui/PremiumIcon';

interface SignalAnalysisProps {
  homeTeam: string;
  awayTeam: string;
  sport: string;
  favored: 'home' | 'away' | 'draw';
  confidence: 'high' | 'medium' | 'low';
  snapshot: string[];
  gameFlow: string;
  riskFactors: string[];
  signals?: {
    formLabel: string;
    strengthEdgeLabel: string;
    tempoLabel: string;
    efficiencyLabel: string;
    availabilityLabel: string;
  };
}

export default function SignalAnalysis({
  homeTeam,
  awayTeam,
  favored,
  confidence,
  snapshot,
  gameFlow,
  riskFactors,
  signals,
}: SignalAnalysisProps) {
  const favoredTeam = favored === 'home' ? homeTeam : favored === 'away' ? awayTeam : 'Draw';
  
  const confidenceConfig = {
    high: { label: 'Strong Signal', color: 'text-emerald-400', ring: 'ring-emerald-500/30' },
    medium: { label: 'Mixed Signals', color: 'text-amber-400', ring: 'ring-amber-500/30' },
    low: { label: 'Limited Data', color: 'text-zinc-400', ring: 'ring-zinc-500/30' },
  }[confidence];

  return (
    <div className="space-y-6">
      {/* Verdict Card - Clean and decisive */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0b] border border-white/[0.06]">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
        
        <div className="relative p-7">
          {/* Verdict Header */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-white/[0.04] ring-1 ${confidenceConfig.ring} flex items-center justify-center`}>
                <PremiumIcon 
                  name={favored === 'draw' ? 'scale' : favored === 'home' ? 'home' : 'plane'} 
                  size="xl" 
                  className="text-white" 
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                  Analysis Points To
                </p>
                <h2 className="text-2xl font-bold text-white">
                  {favored === 'draw' ? 'Draw' : `${favoredTeam}`}
                </h2>
              </div>
            </div>
            <span className={`text-sm font-semibold ${confidenceConfig.color}`}>
              {confidenceConfig.label}
            </span>
          </div>

          {/* Normalized Signals Grid - The Universal Framework */}
          {signals && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-7">
              <SignalPill label="Form" value={signals.formLabel} />
              <SignalPill label="Edge" value={signals.strengthEdgeLabel} />
              <SignalPill label="Tempo" value={signals.tempoLabel} />
              <SignalPill label="Efficiency" value={signals.efficiencyLabel} />
              <SignalPill label="Availability" value={signals.availabilityLabel} />
            </div>
          )}
        </div>
      </div>

      {/* Match Snapshot - The Key Insights with Expandable Details */}
      {snapshot && snapshot.length > 0 && (
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-7">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Match Snapshot
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 text-violet-400/60 rounded-full border border-violet-500/20 font-medium uppercase tracking-wider">
              PRO
            </span>
          </div>
          <ul className="space-y-3">
            {snapshot.slice(0, 5).map((insight, index) => (
              <SnapshotInsight key={index} insight={insight} index={index} />
            ))}
          </ul>
        </div>
      )}

      {/* Game Flow - How it unfolds */}
      {gameFlow && (
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-7">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Game Flow Expectation
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 text-violet-400/60 rounded-full border border-violet-500/20 font-medium uppercase tracking-wider">
              PRO
            </span>
          </div>
          <p className="text-base text-zinc-300 leading-relaxed">
            {gameFlow}
          </p>
        </div>
      )}

      {/* Risk Factors - What could change */}
      {riskFactors && riskFactors.length > 0 && (
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-7">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-5 flex items-center gap-2">
            <span className="text-amber-500 text-lg">⚠</span>
            Risk Factors
          </h3>
          <ul className="space-y-3">
            {riskFactors.map((risk, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-500/50 mt-2 flex-shrink-0" />
                <span className="text-base text-zinc-400 leading-relaxed">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer - Always present */}
      <p className="text-sm text-zinc-500 text-center px-4">
        This analysis is for informational purposes only. Not betting advice.
      </p>
    </div>
  );
}

/**
 * Signal Pill Component - Compact signal display
 */
function SignalPill({ label, value }: { label: string; value: string }) {
  // Extract the key part of the value for display
  const displayValue = value
    .replace(/expected/i, '')
    .replace(/impact:?/i, '')
    .trim();

  return (
    <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-zinc-300 truncate" title={displayValue}>
        {displayValue}
      </p>
    </div>
  );
}

/**
 * Snapshot Insight Component - Expandable insight with colored bullet and explanation
 */
function SnapshotInsight({ insight, index }: { insight: string; index: number }) {
  const [expanded, setExpanded] = useState(false);
  
  // Determine bullet type and color based on content
  const getBulletConfig = (text: string, idx: number): { color: string; iconName: IconName; label: string; explanation: string } => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('the edge:') || idx === 0) {
      return { 
        color: 'bg-emerald-500', 
        iconName: 'target',
        label: 'THE EDGE',
        explanation: 'This is our primary pick based on statistical analysis. The percentage shown is the computed edge between our model probability and the market odds.'
      };
    }
    if (lowerText.includes('market miss:') || idx === 1) {
      return { 
        color: 'bg-blue-500', 
        iconName: 'lightbulb',
        label: 'MARKET MISS',
        explanation: 'This identifies what the bookmaker odds are potentially undervaluing. We compare home/away form splits, recent performance, and market implied probabilities.'
      };
    }
    if (lowerText.includes('the pattern:') || idx === 2) {
      return { 
        color: 'bg-violet-500', 
        iconName: 'chart',
        label: 'THE PATTERN',
        explanation: 'Historical patterns from head-to-head meetings and streaks. While past performance doesn\'t guarantee future results, recurring patterns can indicate underlying dynamics.'
      };
    }
    if (lowerText.includes('the risk:') || idx === 3) {
      return { 
        color: 'bg-amber-500', 
        iconName: 'warning',
        label: 'THE RISK',
        explanation: 'Key factors that could invalidate this analysis. Always consider these before making decisions. Injuries, fatigue, and form changes can significantly impact outcomes.'
      };
    }
    return { 
      color: 'bg-zinc-500', 
      iconName: 'info',
      label: 'INSIGHT',
      explanation: 'Additional context from our analysis.'
    };
  };
  
  const config = getBulletConfig(insight, index);
  
  // Extract the text after the label (e.g., "THE EDGE: Arsenal because...")
  const displayText = insight.replace(/^(THE EDGE|MARKET MISS|THE PATTERN|THE RISK):\s*/i, '');
  
  return (
    <li className="group">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-start gap-3 p-3 -m-3 rounded-xl hover:bg-white/[0.02] transition-colors"
      >
        {/* Colored bullet */}
        <span className={`w-2.5 h-2.5 rounded-full ${config.color} mt-1.5 flex-shrink-0 ring-2 ring-offset-1 ring-offset-[#0a0a0b] ${config.color.replace('bg-', 'ring-')}/30`} />
        
        <div className="flex-1 min-w-0">
          {/* Label badge */}
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mb-1 ${config.color.replace('bg-', 'text-')}`}>
            {config.label}
          </span>
          
          {/* Main insight text */}
          <p className="text-base text-zinc-300 leading-relaxed">
            {displayText}
          </p>
          
          {/* Expandable explanation */}
          {expanded && (
            <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-sm text-zinc-400 leading-relaxed flex items-start gap-2">
                <PremiumIcon name="info" size="sm" className="text-zinc-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-zinc-300">Why this matters:</strong> {config.explanation}</span>
              </p>
            </div>
          )}
        </div>
        
        {/* Expand indicator */}
        <span className={`text-zinc-500 text-sm transition-transform ${expanded ? 'rotate-180' : ''} opacity-0 group-hover:opacity-100`}>
          ▼
        </span>
      </button>
    </li>
  );
}
