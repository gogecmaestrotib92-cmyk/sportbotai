/**
 * Analysis Accordion Component (Layer 2)
 * 
 * Clean collapsible sections for detailed analysis:
 * - Value Analysis (implied probabilities, market efficiency)
 * - Risk & Psychology (risk factors, cognitive biases)
 * - Form & Momentum (team trends, performance)
 * - Tactics & Narrative (playing styles, match story)
 * 
 * Mobile-first design with smooth animations.
 * Sections collapsed by default for clean initial view.
 */

'use client';

import { useState } from 'react';
import { AnalyzeResponse, ValueFlag, RiskLevel, Trend, MarketConfidence } from '@/types';

interface AnalysisAccordionProps {
  result: AnalyzeResponse;
}

interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: { text: string; color: string };
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, subtitle, icon, badge, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className={`bg-bg-card rounded-card border transition-all duration-200 ${isOpen ? 'border-divider shadow-card' : 'border-divider/50'}`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 sm:px-5 flex items-center justify-between hover:bg-bg-hover transition-colors rounded-card"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-btn flex items-center justify-center transition-colors ${isOpen ? 'bg-primary text-white' : 'bg-bg-hover text-text-secondary'}`}>
            {icon}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary text-sm sm:text-base">{title}</span>
              {badge && (
                <span className={`px-2 py-0.5 rounded-chip text-[10px] sm:text-xs font-medium ${badge.color}`}>
                  {badge.text}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-text-muted transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-5 sm:px-5 border-t border-divider">
          {children}
        </div>
      </div>
    </div>
  );
}

// Value flag styling - Design System v2.0
const valueFlagConfig: Record<ValueFlag, { label: string; color: string; bgClass: string }> = {
  NONE: { label: 'None', color: 'text-text-muted', bgClass: 'bg-bg-hover border-divider' },
  LOW: { label: 'Low', color: 'text-info', bgClass: 'bg-info/10 border-info/20' },
  MEDIUM: { label: 'Medium', color: 'text-accent', bgClass: 'bg-accent/10 border-accent/20' },
  HIGH: { label: 'High', color: 'text-success', bgClass: 'bg-success/10 border-success/20' },
};

// Risk level styling - Design System v2.0
const riskConfig: Record<RiskLevel, { label: string; color: string; bgClass: string }> = {
  LOW: { label: 'Low', color: 'text-success', bgClass: 'bg-success/10 border-success/20' },
  MEDIUM: { label: 'Medium', color: 'text-warning', bgClass: 'bg-warning/10 border-warning/20' },
  HIGH: { label: 'High', color: 'text-danger', bgClass: 'bg-danger/10 border-danger/20' },
};

// Stability styling (HIGH stability = good) - Design System v2.0
const stabilityConfig: Record<RiskLevel, { label: string; color: string; bgClass: string }> = {
  LOW: { label: 'Volatile', color: 'text-danger', bgClass: 'bg-danger/10 border-danger/20' },
  MEDIUM: { label: 'Moderate', color: 'text-warning', bgClass: 'bg-warning/10 border-warning/20' },
  HIGH: { label: 'Stable', color: 'text-success', bgClass: 'bg-success/10 border-success/20' },
};

// Trend styling - Design System v2.0
const trendConfig: Record<Trend, { label: string; icon: string; color: string; bgClass: string }> = {
  RISING: { label: 'Rising', icon: '↗', color: 'text-success', bgClass: 'bg-success/10' },
  FALLING: { label: 'Falling', icon: '↘', color: 'text-danger', bgClass: 'bg-danger/10' },
  STABLE: { label: 'Stable', icon: '→', color: 'text-text-secondary', bgClass: 'bg-bg-hover' },
  UNKNOWN: { label: 'Unknown', icon: '?', color: 'text-text-muted', bgClass: 'bg-bg-hover' },
};

function ConfidenceStars({ confidence }: { confidence: MarketConfidence }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${star <= confidence ? 'text-warning' : 'text-divider'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// Icons as components
const ValueIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RiskIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const FormIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TacticsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

export default function AnalysisAccordion({ result }: AnalysisAccordionProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const { valueAnalysis, marketStability, momentumAndForm, tacticalAnalysis, riskAnalysis, matchInfo } = result;

  // Determine badges for each section
  const valueBadge = valueAnalysis.bestValueSide !== 'NONE' 
    ? { text: 'Edge Found', color: 'bg-success/15 text-success' } 
    : undefined;

  const riskBadge = riskAnalysis.overallRiskLevel === 'HIGH'
    ? { text: 'Caution', color: 'bg-danger/15 text-danger' }
    : undefined;

  return (
    <div className="space-y-3">
      {/* Section 1: Value Analysis */}
      <AccordionSection
        title="Value Analysis"
        subtitle="Implied probabilities & market efficiency"
        icon={<ValueIcon />}
        badge={valueBadge}
        isOpen={openSections.has('value')}
        onToggle={() => toggleSection('value')}
      >
        <div className="pt-4 space-y-5">
          {/* Implied Probabilities Grid */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Implied Probabilities (from odds)</h4>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Home Win', value: valueAnalysis.impliedProbabilities.homeWin, flag: valueAnalysis.valueFlags.homeWin },
                { label: 'Draw', value: valueAnalysis.impliedProbabilities.draw, flag: valueAnalysis.valueFlags.draw },
                { label: 'Away Win', value: valueAnalysis.impliedProbabilities.awayWin, flag: valueAnalysis.valueFlags.awayWin },
              ].map((item) => {
                const flagStyle = valueFlagConfig[item.flag];
                return (
                  <div key={item.label} className={`p-3 rounded-btn border ${flagStyle.bgClass}`}>
                    <p className="text-[10px] sm:text-xs text-text-muted mb-1">{item.label}</p>
                    <p className="text-base sm:text-lg font-bold text-text-primary">
                      {item.value !== null ? `${item.value.toFixed(1)}%` : '-'}
                    </p>
                    <div className={`flex items-center gap-1 mt-1.5 ${flagStyle.color}`}>
                      <span className="text-[10px] sm:text-xs font-medium">Value: {flagStyle.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best Value & Comment */}
          <div className="p-4 bg-bg-hover rounded-card border border-divider">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Best Value Side</span>
              <span className="font-bold text-primary">
                {valueAnalysis.bestValueSide === 'NONE' ? 'None detected' : valueAnalysis.bestValueSide}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{valueAnalysis.valueCommentDetailed}</p>
          </div>

          {/* Market Stability */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Market Stability</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                { key: '1X2', market: marketStability.markets.main_1x2 },
                { key: 'Over/Under', market: marketStability.markets.over_under },
                { key: 'BTTS', market: marketStability.markets.btts },
              ].map(({ key, market }) => {
                const stabStyle = stabilityConfig[market.stability];
                return (
                  <div key={key} className="p-3 bg-bg-card rounded-btn border border-divider">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-secondary">{key}</span>
                      <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-chip border ${stabStyle.color} ${stabStyle.bgClass}`}>
                        {stabStyle.label}
                      </span>
                    </div>
                    <ConfidenceStars confidence={market.confidence} />
                    <p className="text-[10px] sm:text-xs text-text-muted mt-2 line-clamp-2">{market.comment}</p>
                  </div>
                );
              })}
            </div>
            
            {/* Safest Market */}
            <div className="mt-3 p-3 bg-success/10 border border-success/20 rounded-btn">
              <div className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span className="text-xs font-medium text-text-secondary">Safest Market:</span>
                <span className="text-xs font-bold text-success">
                  {marketStability.safestMarketType === 'NONE' ? 'None recommended' : marketStability.safestMarketType}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-text-muted mt-1 ml-6">{marketStability.safestMarketExplanation}</p>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Section 2: Risk & Psychology */}
      <AccordionSection
        title="Risk & Psychology"
        subtitle="Risk factors & cognitive biases"
        icon={<RiskIcon />}
        badge={riskBadge}
        isOpen={openSections.has('risk')}
        onToggle={() => toggleSection('risk')}
      >
        <div className="pt-4 space-y-4">
          {/* Risk Level Banner */}
          <div className={`p-4 rounded-card border ${riskConfig[riskAnalysis.overallRiskLevel].bgClass}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-sm font-bold ${riskConfig[riskAnalysis.overallRiskLevel].color}`}>
                Overall Risk: {riskConfig[riskAnalysis.overallRiskLevel].label}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{riskAnalysis.riskExplanation}</p>
          </div>

          {/* Bankroll Impact */}
          <div className="p-4 bg-bg-hover rounded-card border border-divider">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Bankroll Impact</h4>
            <p className="text-sm text-text-secondary">{riskAnalysis.bankrollImpact}</p>
          </div>

          {/* Psychology Bias Alert */}
          <div className="p-4 bg-gradient-to-r from-info/10 to-primary/10 border border-info/20 rounded-card">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-info/20 rounded-btn flex items-center justify-center">
                <span className="text-sm">🧠</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-info mb-1">
                  Cognitive Bias: {riskAnalysis.psychologyBias.name}
                </h4>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{riskAnalysis.psychologyBias.description}</p>
              </div>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Section 3: Form & Momentum */}
      <AccordionSection
        title="Form & Momentum"
        subtitle="Team performance & trends"
        icon={<FormIcon />}
        isOpen={openSections.has('form')}
        onToggle={() => toggleSection('form')}
      >
        <div className="pt-4 space-y-4">
          {/* Team Momentum Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { team: matchInfo.homeTeam, score: momentumAndForm.homeMomentumScore, trend: momentumAndForm.homeTrend, isHome: true },
              { team: matchInfo.awayTeam, score: momentumAndForm.awayMomentumScore, trend: momentumAndForm.awayTrend, isHome: false },
            ].map(({ team, score, trend, isHome }) => {
              const trendStyle = trendConfig[trend];
              const scoreColor = score !== null 
                ? (score >= 7 ? 'text-success' : score >= 5 ? 'text-warning' : 'text-danger')
                : 'text-text-muted';
              
              return (
                <div 
                  key={team} 
                  className={`p-4 rounded-card border ${isHome ? 'bg-success/5 border-success/20' : 'bg-info/5 border-info/20'}`}
                >
                  <p className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wide">{isHome ? 'Home' : 'Away'}</p>
                  <p className="font-semibold text-text-primary text-sm sm:text-base mb-3 truncate">{team}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-text-muted mb-0.5">Momentum</p>
                      <span className={`text-2xl sm:text-3xl font-bold ${scoreColor}`}>
                        {score !== null ? score : '-'}
                      </span>
                      <span className="text-text-muted text-sm">/10</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-chip text-xs font-medium ${trendStyle.bgClass} ${trendStyle.color}`}>
                      <span className="text-sm">{trendStyle.icon}</span>
                      <span>{trendStyle.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Form Factors */}
          {momentumAndForm.keyFormFactors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Key Form Factors</h4>
              <ul className="space-y-2">
                {momentumAndForm.keyFormFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="flex-shrink-0 w-5 h-5 bg-accent/20 text-accent rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* Section 4: Tactics & Narrative */}
      <AccordionSection
        title="Tactics & Narrative"
        subtitle="Playing styles & match story"
        icon={<TacticsIcon />}
        isOpen={openSections.has('tactics')}
        onToggle={() => toggleSection('tactics')}
      >
        <div className="pt-4 space-y-4">
          {/* Styles Summary */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Playing Styles</h4>
            <p className="text-sm text-text-secondary leading-relaxed">{tacticalAnalysis.stylesSummary}</p>
          </div>

          {/* Match Narrative */}
          <div className="p-4 bg-bg-hover rounded-card border border-divider">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Match Narrative</h4>
            <p className="text-sm text-text-secondary leading-relaxed">{tacticalAnalysis.matchNarrative}</p>
          </div>

          {/* Key Match Factors */}
          {tacticalAnalysis.keyMatchFactors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Key Match Factors</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tacticalAnalysis.keyMatchFactors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-bg-card rounded-btn border border-divider text-sm text-text-secondary">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AccordionSection>
    </div>
  );
}
