/**
 * Analysis Results - Premium Redesign v3
 * 
 * DESIGN PHILOSOPHY:
 * - "Answer-First": The verdict is immediate, everything else is optional
 * - Progressive Disclosure: Layers of depth, user chooses how deep to go
 * - Visual Hierarchy: ONE hero section, supporting details collapse
 * - Breathing Room: Premium spacing, not a dashboard
 * - Sticky Actions: Listen/Share always accessible
 * 
 * STRUCTURE:
 * ┌─────────────────────────────────────────────┐
 * │  HERO ZONE (above fold, no scroll needed)   │
 * │  - Match + Teams                            │
 * │  - THE VERDICT (big, bold)                  │
 * │  - Probability bar (visual)                 │
 * │  - Quick badges (value, risk, confidence)   │
 * │  - Actions (listen, share, copy)            │
 * └─────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────┐
 * │  THE STORY (why this call?)                 │
 * │  - 3 key reasons with icons                 │
 * │  - Expandable for more                      │
 * └─────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────┐
 * │  DEEP DIVE (collapsed tabs)                 │
 * │  [Form] [Injuries] [Value] [Full Analysis]  │
 * └─────────────────────────────────────────────┘
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AnalyzeResponse } from '@/types';
import { TeamLogo } from '@/components/ui';
import Link from 'next/link';
import ListenToAnalysisButton from '../ListenToAnalysisButton';
import ShareCard from '../ShareCard';
import CopyInsightsButton from '../CopyInsightsButton';

interface AnalysisResultsRedesignProps {
  result: AnalyzeResponse;
}

export default function AnalysisResultsRedesign({ result }: AnalysisResultsRedesignProps) {
  const { data: session } = useSession();
  const isPro = session?.user?.plan && session.user.plan !== 'FREE';
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Error state
  if (!result.success && result.error) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="rounded-3xl bg-rose-500/5 border border-rose-500/20 p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Analysis Failed</h3>
            <p className="text-white/60">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { matchInfo, probabilities, riskAnalysis, valueAnalysis, tacticalAnalysis, momentumAndForm, upsetPotential, injuryContext } = result;

  // Calculate verdict
  const home = probabilities.homeWin ?? 0;
  const away = probabilities.awayWin ?? 0;
  const draw = probabilities.draw ?? 0;
  const maxProb = Math.max(home, away, draw);
  
  const verdict = home === maxProb 
    ? { team: matchInfo.homeTeam, prob: home, type: 'home' as const }
    : away === maxProb 
    ? { team: matchInfo.awayTeam, prob: away, type: 'away' as const }
    : { team: 'Draw', prob: draw, type: 'draw' as const };

  const confidence = Math.abs(home - away) > 25 ? 'Strong' : Math.abs(home - away) > 15 ? 'Moderate' : 'Slight';
  
  // Value badge
  const hasValue = valueAnalysis.bestValueSide !== 'NONE';
  const valueSide = valueAnalysis.bestValueSide === 'HOME' ? matchInfo.homeTeam :
                    valueAnalysis.bestValueSide === 'AWAY' ? matchInfo.awayTeam : 'Draw';

  // Build the story (3 key reasons)
  const keyReasons = buildKeyReasons(result);
  
  // Check for data availability
  const hasInjuries = injuryContext?.homeTeam?.players.length || injuryContext?.awayTeam?.players.length;
  const hasForm = momentumAndForm?.homeForm?.length || momentumAndForm?.awayForm?.length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO ZONE - Everything above the fold                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-t-[2rem] pointer-events-none" />
        
        <div className="relative px-4 sm:px-8 pt-8 pb-6">
          {/* Match Info - Compact */}
          <div className="text-center mb-2">
            <span className="inline-flex items-center gap-2 text-xs text-white/40 font-medium">
              <span className="uppercase tracking-wider">{matchInfo.leagueName}</span>
              <span>•</span>
              <span>{new Date(matchInfo.matchDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </span>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8">
            <div className="text-center flex-1 max-w-[140px]">
              <TeamLogo teamName={matchInfo.homeTeam} sport={matchInfo.sport} league={matchInfo.leagueName} size="lg" className="mx-auto mb-2" />
              <h2 className="text-sm sm:text-base font-semibold text-white truncate">{matchInfo.homeTeam}</h2>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Home</span>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white/20">vs</span>
            </div>
            
            <div className="text-center flex-1 max-w-[140px]">
              <TeamLogo teamName={matchInfo.awayTeam} sport={matchInfo.sport} league={matchInfo.leagueName} size="lg" className="mx-auto mb-2" />
              <h2 className="text-sm sm:text-base font-semibold text-white truncate">{matchInfo.awayTeam}</h2>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Away</span>
            </div>
          </div>

          {/* THE VERDICT - Big and Bold */}
          <div className="text-center mb-6">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">AI Verdict</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2">
              {verdict.team}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-accent">{verdict.prob.toFixed(0)}%</span>
              <span className="text-lg text-white/40">probability</span>
            </div>
          </div>

          {/* Probability Bar - Visual */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                style={{ width: `${home}%` }}
              />
              {draw > 0 && (
                <div 
                  className="bg-white/30 transition-all duration-700"
                  style={{ width: `${draw}%` }}
                />
              )}
              <div 
                className="bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-700"
                style={{ width: `${away}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/40 mt-1.5 font-medium">
              <span>{home.toFixed(0)}%</span>
              {draw > 0 && <span>{draw.toFixed(0)}%</span>}
              <span>{away.toFixed(0)}%</span>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/70 border border-white/10">
              {confidence} Favorite
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs border ${
              riskAnalysis.overallRiskLevel === 'LOW' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : riskAnalysis.overallRiskLevel === 'MEDIUM'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {riskAnalysis.overallRiskLevel} Risk
            </span>
            {hasValue && (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-xs text-emerald-400 border border-emerald-500/20">
                💰 Value on {valueSide}
              </span>
            )}
            {upsetPotential.upsetProbability > 25 && (
              <span className="px-3 py-1.5 rounded-full bg-orange-500/10 text-xs text-orange-400 border border-orange-500/20">
                ⚡ Upset Alert
              </span>
            )}
          </div>

          {/* Actions - Always Visible */}
          <div className="flex items-center justify-center gap-3">
            <ListenToAnalysisButton result={result} />
            <ShareCard result={result} />
            <CopyInsightsButton result={result} variant="icon" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* THE STORY - Why this call?                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-8 py-8 border-t border-white/[0.06]">
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5">Why This Call?</h3>
        
        <div className="space-y-4">
          {keyReasons.slice(0, 3).map((reason, i) => (
            <div key={i} className="flex items-start gap-4 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${reason.bgColor}`}>
                <span className="text-lg">{reason.icon}</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm text-white/80 leading-relaxed">{reason.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Expert Quote */}
        {tacticalAnalysis.expertConclusionOneLiner && (
          <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-base text-white/70 italic leading-relaxed">
              &ldquo;{tacticalAnalysis.expertConclusionOneLiner}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DEEP DIVE - Collapsible Tabs                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-8 py-6 border-t border-white/[0.06]">
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Deep Dive</h3>
        
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'form', label: 'Form & Stats', icon: '📊', available: hasForm },
            { id: 'injuries', label: 'Injuries', icon: '🏥', available: hasInjuries },
            { id: 'value', label: 'Value Analysis', icon: '💰', available: true },
            { id: 'full', label: 'Full Analysis', icon: '📝', available: true },
          ].filter(tab => tab.available).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 animate-in fade-in slide-in-from-top-2 duration-300">
            {activeTab === 'form' && <FormContent result={result} />}
            {activeTab === 'injuries' && <InjuriesContent result={result} />}
            {activeTab === 'value' && <ValueContent result={result} />}
            {activeTab === 'full' && <FullAnalysisContent result={result} />}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PRO UPSELL (for free users)                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!isPro && (
        <div className="px-4 sm:px-8 py-6 border-t border-white/[0.06]">
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Go Pro for More</h3>
            <p className="text-sm text-white/60 mb-4 max-w-sm mx-auto">
              30 analyses/day, team profiles, full history, and advanced value detection.
            </p>
            <Link 
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-xl transition-colors"
            >
              Upgrade to Pro - €9.99/mo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DISCLAIMER                                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-8 py-6 border-t border-white/[0.06]">
        <p className="text-[11px] text-white/30 text-center leading-relaxed max-w-lg mx-auto">
          {result.responsibleGambling?.coreNote || 
            'This analysis is for educational purposes only. Past performance does not guarantee future results. Please gamble responsibly. 18+ only.'}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* HELPER: Build Key Reasons                                               */
/* ═══════════════════════════════════════════════════════════════════════ */
interface KeyReason {
  icon: string;
  text: string;
  bgColor: string;
}

function buildKeyReasons(result: AnalyzeResponse): KeyReason[] {
  const reasons: KeyReason[] = [];
  const { matchInfo, momentumAndForm, valueAnalysis, riskAnalysis, upsetPotential, tacticalAnalysis, probabilities } = result;

  // 1. Form-based reason
  const homeTrend = momentumAndForm.homeTrend;
  const awayTrend = momentumAndForm.awayTrend;
  if (homeTrend === 'RISING' && awayTrend !== 'RISING') {
    reasons.push({
      icon: '📈',
      text: `${matchInfo.homeTeam} is on an upward trajectory while ${matchInfo.awayTeam}'s form is ${awayTrend === 'FALLING' ? 'declining' : 'stable'}.`,
      bgColor: 'bg-emerald-500/10',
    });
  } else if (awayTrend === 'RISING' && homeTrend !== 'RISING') {
    reasons.push({
      icon: '📈',
      text: `${matchInfo.awayTeam} is surging with rising momentum, potentially offsetting home advantage.`,
      bgColor: 'bg-emerald-500/10',
    });
  } else if (homeTrend === 'FALLING' && awayTrend === 'FALLING') {
    reasons.push({
      icon: '📉',
      text: `Both teams showing declining form—expect a tighter, more unpredictable contest.`,
      bgColor: 'bg-amber-500/10',
    });
  }

  // 2. Value reason
  if (valueAnalysis.bestValueSide !== 'NONE') {
    const side = valueAnalysis.bestValueSide === 'HOME' ? matchInfo.homeTeam : 
                 valueAnalysis.bestValueSide === 'AWAY' ? matchInfo.awayTeam : 'Draw';
    reasons.push({
      icon: '💰',
      text: valueAnalysis.valueCommentShort || `Odds suggest value on ${side}—market may be underrating them.`,
      bgColor: 'bg-green-500/10',
    });
  }

  // 3. Risk/upset reason
  if (upsetPotential.upsetProbability > 30) {
    reasons.push({
      icon: '⚡',
      text: upsetPotential.upsetComment || `${upsetPotential.upsetProbability}% upset chance—underdog has real paths to victory here.`,
      bgColor: 'bg-orange-500/10',
    });
  } else if (riskAnalysis.overallRiskLevel === 'HIGH') {
    reasons.push({
      icon: '⚠️',
      text: riskAnalysis.riskExplanation,
      bgColor: 'bg-rose-500/10',
    });
  }

  // 4. Tactical insight
  if (tacticalAnalysis.keyMatchFactors?.[0]) {
    reasons.push({
      icon: '🎯',
      text: tacticalAnalysis.keyMatchFactors[0],
      bgColor: 'bg-purple-500/10',
    });
  }

  // 5. Probability margin
  const home = probabilities.homeWin ?? 0;
  const away = probabilities.awayWin ?? 0;
  const margin = Math.abs(home - away);
  if (margin > 25) {
    const favorite = home > away ? matchInfo.homeTeam : matchInfo.awayTeam;
    reasons.push({
      icon: '📊',
      text: `Clear favorite: ${favorite} holds a ${margin.toFixed(0)}% probability edge.`,
      bgColor: 'bg-blue-500/10',
    });
  } else if (margin < 10) {
    reasons.push({
      icon: '⚖️',
      text: `Coin-flip territory: Only ${margin.toFixed(0)}% separates these teams.`,
      bgColor: 'bg-gray-500/10',
    });
  }

  // 6. Psychology
  if (riskAnalysis.psychologyBias?.name) {
    reasons.push({
      icon: '🧠',
      text: `Watch for ${riskAnalysis.psychologyBias.name}: ${riskAnalysis.psychologyBias.description}`,
      bgColor: 'bg-pink-500/10',
    });
  }

  return reasons;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* TAB CONTENT COMPONENTS                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function FormContent({ result }: { result: AnalyzeResponse }) {
  const { matchInfo, momentumAndForm } = result;
  const homeForm = momentumAndForm.homeForm || [];
  const awayForm = momentumAndForm.awayForm || [];

  const formColors: Record<string, string> = {
    'W': 'bg-emerald-500 text-white',
    'D': 'bg-white/30 text-white',
    'L': 'bg-rose-500 text-white',
  };

  return (
    <div className="space-y-6">
      {/* Home Team */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TeamLogo teamName={matchInfo.homeTeam} sport={matchInfo.sport} league={matchInfo.leagueName} size="sm" />
          <span className="text-sm font-medium text-white">{matchInfo.homeTeam}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            momentumAndForm.homeTrend === 'RISING' ? 'bg-emerald-500/20 text-emerald-400' :
            momentumAndForm.homeTrend === 'FALLING' ? 'bg-rose-500/20 text-rose-400' :
            'bg-white/10 text-white/50'
          }`}>
            {momentumAndForm.homeTrend === 'RISING' ? '↑ Rising' : 
             momentumAndForm.homeTrend === 'FALLING' ? '↓ Falling' : '→ Stable'}
          </span>
        </div>
        <div className="flex gap-1.5">
          {homeForm.slice(0, 5).map((m, i) => (
            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${formColors[m.result]}`}>
              {m.result}
            </div>
          ))}
          {homeForm.length === 0 && <span className="text-xs text-white/40">No form data available</span>}
        </div>
      </div>

      {/* Away Team */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TeamLogo teamName={matchInfo.awayTeam} sport={matchInfo.sport} league={matchInfo.leagueName} size="sm" />
          <span className="text-sm font-medium text-white">{matchInfo.awayTeam}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            momentumAndForm.awayTrend === 'RISING' ? 'bg-emerald-500/20 text-emerald-400' :
            momentumAndForm.awayTrend === 'FALLING' ? 'bg-rose-500/20 text-rose-400' :
            'bg-white/10 text-white/50'
          }`}>
            {momentumAndForm.awayTrend === 'RISING' ? '↑ Rising' : 
             momentumAndForm.awayTrend === 'FALLING' ? '↓ Falling' : '→ Stable'}
          </span>
        </div>
        <div className="flex gap-1.5">
          {awayForm.slice(0, 5).map((m, i) => (
            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${formColors[m.result]}`}>
              {m.result}
            </div>
          ))}
          {awayForm.length === 0 && <span className="text-xs text-white/40">No form data available</span>}
        </div>
      </div>

      {/* Key Form Factors */}
      {momentumAndForm.keyFormFactors?.length > 0 && (
        <div className="pt-4 border-t border-white/[0.06]">
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Key Factors</h4>
          <ul className="space-y-2">
            {momentumAndForm.keyFormFactors.slice(0, 3).map((factor, i) => (
              <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                <span className="text-white/30">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InjuriesContent({ result }: { result: AnalyzeResponse }) {
  const { matchInfo, injuryContext } = result;

  if (!injuryContext) {
    return <p className="text-sm text-white/40">No injury data available for this match.</p>;
  }

  type InjuredPlayer = { name: string; reason?: string };

  const renderTeamInjuries = (teamName: string, players: InjuredPlayer[]) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <TeamLogo teamName={teamName} sport={matchInfo.sport} league={matchInfo.leagueName} size="sm" />
        <span className="text-sm font-medium text-white">{teamName}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
          {players.length} out
        </span>
      </div>
      {players.length > 0 ? (
        <div className="space-y-2 pl-8">
          {players.slice(0, 4).map((player, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-white/70">{player.name}</span>
              <span className="text-white/40 text-xs">{player.reason || 'Unavailable'}</span>
            </div>
          ))}
          {players.length > 4 && (
            <span className="text-xs text-white/30">+{players.length - 4} more</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-white/40 pl-8">No reported injuries</p>
      )}
    </div>
  );

  return (
    <div>
      {renderTeamInjuries(matchInfo.homeTeam, injuryContext.homeTeam?.players || [])}
      {renderTeamInjuries(matchInfo.awayTeam, injuryContext.awayTeam?.players || [])}
      
      {injuryContext.impactSummary && (
        <div className="pt-4 border-t border-white/[0.06]">
          <p className="text-sm text-white/60">{injuryContext.impactSummary}</p>
        </div>
      )}
    </div>
  );
}

function ValueContent({ result }: { result: AnalyzeResponse }) {
  const { valueAnalysis, probabilities, matchInfo } = result;

  const outcomes = [
    { label: matchInfo.homeTeam, prob: probabilities.homeWin, flag: valueAnalysis.valueFlags.homeWin, side: 'HOME' },
    { label: 'Draw', prob: probabilities.draw, flag: valueAnalysis.valueFlags.draw, side: 'DRAW' },
    { label: matchInfo.awayTeam, prob: probabilities.awayWin, flag: valueAnalysis.valueFlags.awayWin, side: 'AWAY' },
  ].filter(o => o.prob !== null);

  const flagColors: Record<string, string> = {
    'NONE': 'text-white/30',
    'LOW': 'text-sky-400',
    'MEDIUM': 'text-emerald-400',
    'HIGH': 'text-emerald-300',
  };

  const flagLabels: Record<string, string> = {
    'NONE': 'Fair odds',
    'LOW': 'Small edge',
    'MEDIUM': 'Value found',
    'HIGH': 'Strong value',
  };

  return (
    <div className="space-y-4">
      {outcomes.map((outcome, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
          <div>
            <span className="text-sm text-white/80">{outcome.label}</span>
            <span className="text-xs text-white/40 ml-2">{outcome.prob?.toFixed(0)}% AI</span>
          </div>
          <span className={`text-sm font-medium ${flagColors[outcome.flag]}`}>
            {flagLabels[outcome.flag]}
          </span>
        </div>
      ))}

      {valueAnalysis.valueCommentDetailed && (
        <div className="pt-4 border-t border-white/[0.06]">
          <p className="text-sm text-white/60 leading-relaxed">{valueAnalysis.valueCommentDetailed}</p>
        </div>
      )}

      {valueAnalysis.bestValueSide !== 'NONE' && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-sm text-emerald-400">
            <strong>Best Value:</strong> {valueAnalysis.bestValueSide === 'HOME' ? matchInfo.homeTeam : 
                                          valueAnalysis.bestValueSide === 'AWAY' ? matchInfo.awayTeam : 'Draw'}
          </p>
        </div>
      )}
    </div>
  );
}

function FullAnalysisContent({ result }: { result: AnalyzeResponse }) {
  const { tacticalAnalysis, riskAnalysis, upsetPotential } = result;

  return (
    <div className="space-y-6">
      {/* Key Match Factors */}
      {tacticalAnalysis.keyMatchFactors?.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Key Factors</h4>
          <ul className="space-y-2">
            {tacticalAnalysis.keyMatchFactors.map((factor, i) => (
              <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                <span className="text-primary">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Breakdown */}
      <div>
        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Risk Assessment</h4>
        <p className="text-sm text-white/60 mb-3">{riskAnalysis.riskExplanation}</p>
        <p className="text-xs text-white/40">Bankroll impact: {riskAnalysis.bankrollImpact}</p>
      </div>

      {/* Upset Analysis */}
      {upsetPotential.upsetProbability > 15 && (
        <div>
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Upset Potential</h4>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <span className="text-xl font-bold text-orange-400">{upsetPotential.upsetProbability}%</span>
            </div>
            <p className="text-sm text-white/60 flex-1">{upsetPotential.upsetComment}</p>
          </div>
        </div>
      )}

      {/* Match Narrative */}
      {tacticalAnalysis.matchNarrative && (
        <div>
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Match Narrative</h4>
          <p className="text-sm text-white/60 leading-relaxed">{tacticalAnalysis.matchNarrative}</p>
        </div>
      )}
    </div>
  );
}
