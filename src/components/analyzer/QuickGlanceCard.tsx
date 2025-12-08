/**
 * Quick Glance Card Component (Layer 1)
 * 
 * Premium summary view showing essential information at a glance:
 * - Match header (teams, league, date)
 * - 4 key metrics: AI Verdict, Win Probabilities, Value Indicator, Risk Level
 * - Expert one-liner conclusion
 * 
 * Clean, scannable, mobile-first design.
 */

'use client';

import { AnalyzeResponse, RiskLevel, ValueFlag } from '@/types';

interface QuickGlanceCardProps {
  result: AnalyzeResponse;
}

// Configuration for risk level display - Design System v2.0
const riskConfig: Record<RiskLevel, { label: string; color: string; bgClass: string; icon: string }> = {
  LOW: { label: 'Low Risk', color: 'text-success', bgClass: 'bg-success/10 border-success/20', icon: '✓' },
  MEDIUM: { label: 'Medium', color: 'text-warning', bgClass: 'bg-warning/10 border-warning/20', icon: '⚡' },
  HIGH: { label: 'High Risk', color: 'text-danger', bgClass: 'bg-danger/10 border-danger/20', icon: '⚠' },
};

// Configuration for value flag display - Design System v2.0
const valueConfig: Record<ValueFlag, { label: string; color: string; bgClass: string; description: string }> = {
  NONE: { label: 'No Value', color: 'text-text-muted', bgClass: 'bg-bg-hover border-divider', description: 'Odds reflect fair probability' },
  LOW: { label: 'Low Value', color: 'text-info', bgClass: 'bg-info/10 border-info/20', description: 'Minor edge detected' },
  MEDIUM: { label: 'Value Found', color: 'text-accent', bgClass: 'bg-accent/10 border-accent/20', description: 'Good opportunity' },
  HIGH: { label: 'High Value', color: 'text-success', bgClass: 'bg-success/10 border-success/20', description: 'Strong edge detected' },
};

export default function QuickGlanceCard({ result }: QuickGlanceCardProps) {
  const { matchInfo, probabilities, riskAnalysis, valueAnalysis, upsetPotential, tacticalAnalysis } = result;
  
  const risk = riskConfig[riskAnalysis.overallRiskLevel];
  
  // Determine best value flag for display
  const valueFlagValues = Object.values(valueAnalysis.valueFlags);
  const bestValueFlag = valueFlagValues.includes('HIGH') ? 'HIGH' 
    : valueFlagValues.includes('MEDIUM') ? 'MEDIUM'
    : valueFlagValues.includes('LOW') ? 'LOW' 
    : 'NONE';
  const value = valueConfig[bestValueFlag];

  // Format date nicely
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

  // Determine AI verdict based on probabilities
  const getVerdict = () => {
    const home = probabilities.homeWin ?? 0;
    const away = probabilities.awayWin ?? 0;
    const draw = probabilities.draw ?? 0;
    
    const max = Math.max(home, away, draw);
    const diff = Math.abs(home - away);
    
    if (max === home) {
      if (diff > 25) return { team: matchInfo.homeTeam, confidence: 'Strong', icon: '🏠' };
      if (diff > 10) return { team: matchInfo.homeTeam, confidence: 'Moderate', icon: '🏠' };
      return { team: matchInfo.homeTeam, confidence: 'Slight', icon: '🏠' };
    } else if (max === away) {
      if (diff > 25) return { team: matchInfo.awayTeam, confidence: 'Strong', icon: '✈️' };
      if (diff > 10) return { team: matchInfo.awayTeam, confidence: 'Moderate', icon: '✈️' };
      return { team: matchInfo.awayTeam, confidence: 'Slight', icon: '✈️' };
    }
    return { team: 'Draw', confidence: 'Possible', icon: '🤝' };
  };

  const verdict = getVerdict();
  const hasDraw = probabilities.draw !== null;

  return (
    <div className="bg-bg-card rounded-card shadow-card border border-divider overflow-hidden">
      {/* Match Header - Premium Dark Banner */}
      <div className="bg-gradient-to-r from-bg to-bg-card px-5 py-4 sm:px-6 sm:py-5">
        {/* League & Date Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-chip">
              {matchInfo.sport}
            </span>
            <span className="text-text-secondary text-sm font-medium truncate max-w-[150px] sm:max-w-none">{matchInfo.leagueName}</span>
          </div>
          <span className="text-text-muted text-xs sm:text-sm">{formatDate(matchInfo.matchDate)}</span>
        </div>

        {/* Teams Display */}
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 text-center min-w-0">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary leading-tight truncate">{matchInfo.homeTeam}</p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wide">Home</p>
          </div>
          
          <div className="flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-divider flex items-center justify-center">
              <span className="text-text-muted text-xs sm:text-sm font-bold">VS</span>
            </div>
          </div>
          
          <div className="flex-1 text-center min-w-0">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary leading-tight truncate">{matchInfo.awayTeam}</p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wide">Away</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid - 4 Cards */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Metric 1: AI Verdict */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-card p-3 sm:p-4 border border-primary/20">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <span className="text-base sm:text-lg">{verdict.icon}</span>
              <span className="text-[10px] sm:text-xs font-medium text-text-muted uppercase tracking-wide">AI Verdict</span>
            </div>
            <p className="text-sm sm:text-lg font-bold leading-tight truncate text-text-primary">{verdict.team}</p>
            <p className="text-[10px] sm:text-xs text-accent mt-0.5 sm:mt-1">{verdict.confidence} favorite</p>
          </div>

          {/* Metric 2: Win Probabilities */}
          <div className="bg-bg-hover rounded-card p-3 sm:p-4 border border-divider">
            <p className="text-[10px] sm:text-xs font-medium text-text-muted uppercase tracking-wide mb-2 sm:mb-3">Probabilities</p>
            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] sm:text-xs text-text-muted">Home</span>
                <span className="text-xs sm:text-sm font-bold text-success">
                  {probabilities.homeWin !== null ? `${probabilities.homeWin}%` : '-'}
                </span>
              </div>
              {hasDraw && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] sm:text-xs text-text-muted">Draw</span>
                  <span className="text-xs sm:text-sm font-bold text-text-secondary">
                    {probabilities.draw !== null ? `${probabilities.draw}%` : '-'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[10px] sm:text-xs text-text-muted">Away</span>
                <span className="text-xs sm:text-sm font-bold text-info">
                  {probabilities.awayWin !== null ? `${probabilities.awayWin}%` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Metric 3: Value Indicator */}
          <div className={`rounded-card p-3 sm:p-4 border ${value.bgClass}`}>
            <p className="text-[10px] sm:text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5 sm:mb-2">Value</p>
            <p className={`text-sm sm:text-lg font-bold ${value.color}`}>{value.label}</p>
            <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1 truncate">
              {valueAnalysis.bestValueSide !== 'NONE' 
                ? `Best: ${valueAnalysis.bestValueSide === 'HOME' ? matchInfo.homeTeam : 
                          valueAnalysis.bestValueSide === 'AWAY' ? matchInfo.awayTeam : 'Draw'}`
                : value.description}
            </p>
          </div>

          {/* Metric 4: Risk Level */}
          <div className={`rounded-card p-3 sm:p-4 border ${risk.bgClass}`}>
            <p className="text-[10px] sm:text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5 sm:mb-2">Risk</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg">{risk.icon}</span>
              <span className={`text-sm sm:text-lg font-bold ${risk.color}`}>{risk.label}</span>
            </div>
            {upsetPotential.upsetProbability >= 25 && (
              <p className="text-[10px] sm:text-xs text-warning mt-0.5 sm:mt-1 font-medium">
                ⚡ {upsetPotential.upsetProbability}% upset chance
              </p>
            )}
          </div>
        </div>

        {/* Expert One-Liner - Highlighted Quote */}
        {tacticalAnalysis.expertConclusionOneLiner && (
          <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20 rounded-card">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-accent/10 rounded-btn flex items-center justify-center">
                <span className="text-accent text-xs sm:text-sm">💡</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5 sm:mb-1">Expert Take</p>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {tacticalAnalysis.expertConclusionOneLiner}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
