/**
 * AI Verdict Module
 * 
 * The hero insight card - Apple-style clean verdict presentation.
 * Shows the single most important takeaway with supporting context.
 * 
 * Design: Large typography, subtle gradients, minimal noise
 */

'use client';

import { AnalyzeResponse, RiskLevel, ValueFlag } from '@/types';
import PremiumIcon from '@/components/ui/PremiumIcon';

interface VerdictModuleProps {
  result: AnalyzeResponse;
}

const riskStyles: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  MEDIUM: { label: 'Medium Risk', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  HIGH: { label: 'High Risk', color: 'text-rose-400', bg: 'bg-rose-500/10' },
};

const valueStyles: Record<ValueFlag, { label: string; color: string; bg: string; visible: boolean; icon: 'target' | 'star' | 'fire' | null }> = {
  NONE: { label: 'Fair Odds', color: 'text-white/50', bg: 'bg-white/5', visible: false, icon: null },
  LOW: { label: 'Edge Detected', color: 'text-cyan-300', bg: 'bg-cyan-500/15 border-cyan-400/30', visible: true, icon: 'target' },
  MEDIUM: { label: 'Value Found', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-400/30', visible: true, icon: 'star' },
  HIGH: { label: 'Strong Value', color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-400/40', visible: true, icon: 'fire' },
};

export default function VerdictModule({ result }: VerdictModuleProps) {
  const { matchInfo, probabilities, riskAnalysis, valueAnalysis, tacticalAnalysis } = result;

  // Determine verdict
  const getVerdict = () => {
    const home = probabilities.homeWin ?? 0;
    const away = probabilities.awayWin ?? 0;
    const draw = probabilities.draw ?? 0;
    const max = Math.max(home, away, draw);
    const diff = Math.abs(home - away);

    if (max === draw && draw > 30) {
      return { 
        team: 'Draw Expected', 
        probability: draw,
        confidence: diff < 10 ? 'Likely' : 'Possible',
        isHome: null 
      };
    }
    if (max === home) {
      return { 
        team: matchInfo.homeTeam, 
        probability: home,
        confidence: diff > 25 ? 'Strong' : diff > 15 ? 'Moderate' : 'Slight',
        isHome: true 
      };
    }
    return { 
      team: matchInfo.awayTeam, 
      probability: away,
      confidence: diff > 25 ? 'Strong' : diff > 15 ? 'Moderate' : 'Slight',
      isHome: false 
    };
  };

  const verdict = getVerdict();
  const risk = riskStyles[riskAnalysis.overallRiskLevel];
  
  // Best value
  const valueFlagValues = Object.values(valueAnalysis.valueFlags);
  const bestValueFlag = valueFlagValues.includes('HIGH') ? 'HIGH' 
    : valueFlagValues.includes('MEDIUM') ? 'MEDIUM'
    : valueFlagValues.includes('LOW') ? 'LOW' : 'NONE';
  const value = valueStyles[bestValueFlag];

  return (
    <div className="relative">
      {/* Main Verdict Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a1f] to-[#0d0d10] border border-white/[0.08]">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-32 bg-white/[0.02] blur-3xl" />

        <div className="relative p-6 sm:p-8 lg:p-10">
          {/* Section Label */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-accent to-primary" />
            <span className="text-xs font-medium text-white/40 uppercase tracking-widest">AI Analysis</span>
          </div>

          {/* The Verdict */}
          <div className="mb-8">
            <p className="text-white/50 text-sm mb-2">Most Likely Outcome</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3">
              {verdict.team}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-semibold text-accent">
                {verdict.probability.toFixed(0)}%
              </span>
              <span className="text-white/40 text-lg">probability</span>
            </div>
          </div>

          {/* Confidence & Risk Row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1.5 rounded-full bg-white/5 text-sm text-white/70 border border-white/10">
              {verdict.confidence} Favorite
            </span>
            <span className={`px-3 py-1.5 rounded-full ${risk.bg} text-sm ${risk.color} border border-white/5`}>
              {risk.label}
            </span>
            {value.visible && (
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${value.color} ${value.bg} border animate-pulse`}>
                {value.label}
              </span>
            )}
          </div>

          {/* Expert Take */}
          {tacticalAnalysis.expertConclusionOneLiner && (
            <div className="pt-6 border-t border-white/[0.06]">
              <p className="text-base sm:text-lg text-white/70 leading-relaxed">
                &ldquo;{tacticalAnalysis.expertConclusionOneLiner}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
