/**
 * Quick Glance Card Component (Layer 1)
 * 
 * The primary summary view showing only essential information:
 * - Match info (sport, league, teams, date)
 * - Key metrics: probabilities, risk level, value, upset chance
 * 
 * Clean, scannable design for mobile-first experience.
 */

'use client';

import { AnalyzeResponse, RiskLevel, ValueFlag } from '@/types';

interface QuickGlanceCardProps {
  result: AnalyzeResponse;
}

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: 'text-accent-green', bg: 'bg-accent-green/10' },
  MEDIUM: { label: 'Medium', color: 'text-accent-gold', bg: 'bg-accent-gold/10' },
  HIGH: { label: 'High', color: 'text-accent-red', bg: 'bg-accent-red/10' },
};

const valueConfig: Record<ValueFlag, { label: string; color: string; bg: string }> = {
  NONE: { label: 'None', color: 'text-gray-500', bg: 'bg-gray-100' },
  LOW: { label: 'Low', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  MEDIUM: { label: 'Medium', color: 'text-accent-lime', bg: 'bg-accent-lime/10' },
  HIGH: { label: 'High', color: 'text-accent-green', bg: 'bg-accent-green/10' },
};

export default function QuickGlanceCard({ result }: QuickGlanceCardProps) {
  const { matchInfo, probabilities, riskAnalysis, valueAnalysis, upsetPotential } = result;
  
  const risk = riskConfig[riskAnalysis.overallRiskLevel];
  
  // Determine best value flag for display
  const valueFlagValues = Object.values(valueAnalysis.valueFlags);
  const bestValueFlag = valueFlagValues.includes('HIGH') ? 'HIGH' 
    : valueFlagValues.includes('MEDIUM') ? 'MEDIUM'
    : valueFlagValues.includes('LOW') ? 'LOW' 
    : 'NONE';
  const value = valueConfig[bestValueFlag];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Check if it's a draw-enabled sport (soccer, etc.)
  const hasDraw = probabilities.draw !== null;

  return (
    <div className="bg-primary-900 rounded-2xl overflow-hidden">
      {/* Header: Sport + League */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-accent-cyan/20 text-accent-cyan text-sm font-medium rounded-full">
              {matchInfo.sport}
            </span>
            <span className="text-gray-400 text-sm">{matchInfo.leagueName}</span>
          </div>
          <span className="text-gray-500 text-sm">{formatDate(matchInfo.matchDate)}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="px-6 py-8">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center flex-1">
            <p className="text-2xl md:text-3xl font-bold text-white">{matchInfo.homeTeam}</p>
            <p className="text-xs text-gray-500 mt-1">Home</p>
          </div>
          <div className="px-4">
            <span className="text-gray-600 text-2xl font-light">vs</span>
          </div>
          <div className="text-center flex-1">
            <p className="text-2xl md:text-3xl font-bold text-white">{matchInfo.awayTeam}</p>
            <p className="text-xs text-gray-500 mt-1">Away</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="bg-primary-800 px-6 py-6">
        <div className={`grid gap-4 ${hasDraw ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
          
          {/* Probabilities */}
          <div className="bg-primary-900/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">AI Probabilities</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Home</span>
                <span className="text-lg font-bold text-accent-green">
                  {probabilities.homeWin !== null ? `${probabilities.homeWin}%` : '-'}
                </span>
              </div>
              {hasDraw && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Draw</span>
                  <span className="text-lg font-bold text-gray-300">
                    {probabilities.draw !== null ? `${probabilities.draw}%` : '-'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Away</span>
                <span className="text-lg font-bold text-accent-cyan">
                  {probabilities.awayWin !== null ? `${probabilities.awayWin}%` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Level */}
          <div className="bg-primary-900/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Risk Level</p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${risk.color} ${risk.bg}`}>
                {risk.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
              {riskAnalysis.riskExplanation.split('.')[0]}.
            </p>
          </div>

          {/* Value */}
          <div className="bg-primary-900/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Value Found</p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${value.color} ${value.bg}`}>
                {value.label}
              </span>
            </div>
            {valueAnalysis.bestValueSide !== 'NONE' && (
              <p className="text-xs text-gray-400 mt-2">
                Best: {valueAnalysis.bestValueSide === 'HOME' ? matchInfo.homeTeam : 
                       valueAnalysis.bestValueSide === 'AWAY' ? matchInfo.awayTeam : 'Draw'}
              </p>
            )}
          </div>

          {/* Upset Chance */}
          <div className="bg-primary-900/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Upset Chance</p>
            <p className={`text-2xl font-bold ${
              upsetPotential.upsetProbability >= 40 ? 'text-accent-red' :
              upsetPotential.upsetProbability >= 25 ? 'text-accent-gold' :
              'text-accent-cyan'
            }`}>
              {upsetPotential.upsetProbability}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {upsetPotential.upsetProbability >= 40 ? 'High risk' :
               upsetPotential.upsetProbability >= 25 ? 'Moderate' : 'Low'}
            </p>
          </div>
        </div>

        {/* Expert One-Liner */}
        {result.tacticalAnalysis.expertConclusionOneLiner && (
          <div className="mt-4 p-4 bg-accent-lime/5 border border-accent-lime/20 rounded-xl">
            <p className="text-sm text-gray-300 italic">
              &ldquo;{result.tacticalAnalysis.expertConclusionOneLiner}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
