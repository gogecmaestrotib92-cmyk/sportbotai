/**
 * Core Verdict Card Component (Tier 1 Hero)
 * 
 * The most important card - shows the essential verdict at a glance:
 * - Match info (teams, league, date)
 * - Main verdict (who's favored)
 * - Probability visualization
 * - Risk level
 * - Value indicator
 * - Expert take
 * 
 * Premium dark glass design with strong visual presence.
 */

'use client';

import { AnalyzeResponse, RiskLevel, ValueFlag } from '@/types';
import ProbabilityDonut from './ProbabilityDonut';
import TeamLogo from '../ui/TeamLogo';
import LeagueLogo from '../ui/LeagueLogo';

interface CoreVerdictCardProps {
  result: AnalyzeResponse;
}

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string; icon: string }> = {
  LOW: { label: 'Low Risk', color: 'text-success', bg: 'bg-success/15', icon: '🛡️' },
  MEDIUM: { label: 'Medium', color: 'text-warning', bg: 'bg-warning/15', icon: '⚡' },
  HIGH: { label: 'High Risk', color: 'text-danger', bg: 'bg-danger/15', icon: '🔥' },
};

const valueConfig: Record<ValueFlag, { label: string; color: string; bg: string }> = {
  NONE: { label: 'Fair Odds', color: 'text-text-muted', bg: 'bg-white/5' },
  LOW: { label: 'Small Gap', color: 'text-info', bg: 'bg-info/15' },
  MEDIUM: { label: 'Odds Gap', color: 'text-accent', bg: 'bg-accent/15' },
  HIGH: { label: 'Big Gap', color: 'text-success', bg: 'bg-success/15' },
};

export default function CoreVerdictCard({ result }: CoreVerdictCardProps) {
  const { matchInfo, probabilities, riskAnalysis, valueAnalysis, tacticalAnalysis } = result;
  
  // Determine verdict
  const getVerdict = () => {
    const home = probabilities.homeWin ?? 0;
    const away = probabilities.awayWin ?? 0;
    const draw = probabilities.draw ?? 0;
    const max = Math.max(home, away, draw);
    const diff = Math.abs(home - away);
    
    if (max === draw && draw > 0) {
      return { team: 'Draw', confidence: diff < 10 ? 'Expected' : 'Likely', prob: draw, icon: '🤝' };
    }
    if (max === home) {
      const conf = diff > 25 ? 'Strong' : diff > 15 ? 'Moderate' : 'Slight';
      return { team: matchInfo.homeTeam, confidence: conf, prob: home, icon: '🏠' };
    }
    const conf = diff > 25 ? 'Strong' : diff > 15 ? 'Moderate' : 'Slight';
    return { team: matchInfo.awayTeam, confidence: conf, prob: away, icon: '✈️' };
  };
  
  const verdict = getVerdict();
  const risk = riskConfig[riskAnalysis.overallRiskLevel];
  
  // Best value flag
  const valueFlagValues = Object.values(valueAnalysis.valueFlags);
  const bestValueFlag = valueFlagValues.includes('HIGH') ? 'HIGH' 
    : valueFlagValues.includes('MEDIUM') ? 'MEDIUM'
    : valueFlagValues.includes('LOW') ? 'LOW' : 'NONE';
  const value = valueConfig[bestValueFlag];

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-[#12161B] via-[#0E1216] to-[#0A0C0F] border border-white/10 shadow-2xl">
      {/* Top accent glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"></div>
      <div className="absolute top-0 left-1/4 right-1/4 h-20 bg-accent/5 blur-3xl"></div>
      
      {/* Main Content */}
      <div className="relative">
        {/* Match Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-4 border-b border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full">
                {matchInfo.sport}
              </span>
              <LeagueLogo leagueName={matchInfo.leagueName} sport={matchInfo.sport} size="sm" />
              <span className="text-text-secondary text-sm">{matchInfo.leagueName}</span>
            </div>
            <span className="text-text-muted text-xs sm:text-sm">{formatDate(matchInfo.matchDate)}</span>
          </div>
          
          {/* Teams */}
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-2">
                <TeamLogo teamName={matchInfo.homeTeam} sport={matchInfo.sport} league={matchInfo.leagueName} size="lg" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{matchInfo.homeTeam}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Home</p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-text-muted text-xs font-bold">VS</span>
            </div>
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-2">
                <TeamLogo teamName={matchInfo.awayTeam} sport={matchInfo.sport} league={matchInfo.leagueName} size="lg" />
              </div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{matchInfo.awayTeam}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Away</p>
            </div>
          </div>
        </div>
        
        {/* Core Metrics - The Heart of the Card */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* Left: Probability Donut */}
            <div className="flex justify-center lg:justify-start">
              <ProbabilityDonut
                homeWin={probabilities.homeWin ?? 0}
                draw={probabilities.draw}
                awayWin={probabilities.awayWin ?? 0}
                homeTeam={matchInfo.homeTeam}
                awayTeam={matchInfo.awayTeam}
                size={160}
              />
            </div>
            
            {/* Right: Verdict + Metrics */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Main Verdict */}
              <div className="text-center lg:text-left mb-6">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">AI Verdict</p>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <span className="text-2xl">{verdict.icon}</span>
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{verdict.team}</span>
                </div>
                <p className="text-sm text-accent mt-1">
                  {verdict.confidence} favorite • {verdict.prob.toFixed(0)}% probability
                </p>
              </div>
              
              {/* Metrics Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Risk Level */}
                <div className={`p-3 sm:p-4 rounded-xl ${risk.bg} border border-white/5`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{risk.icon}</span>
                    <span className={`text-sm font-bold ${risk.color}`}>{risk.label}</span>
                  </div>
                  <p className="text-[10px] text-text-muted">Analysis Risk</p>
                </div>
                
                {/* Value */}
                <div className={`p-3 sm:p-4 rounded-xl ${value.bg} border border-white/5`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📊</span>
                    <span className={`text-sm font-bold ${value.color}`}>{value.label}</span>
                  </div>
                  <p className="text-[10px] text-text-muted">Odds vs AI</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expert Take - Bottom */}
          {tacticalAnalysis.expertConclusionOneLiner && (
            <div className="mt-6 pt-5 border-t border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">💡</span>
                </div>
                <div>
                  <p className="text-[10px] text-accent uppercase tracking-wider mb-1">Expert Take</p>
                  <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                    {tacticalAnalysis.expertConclusionOneLiner}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
