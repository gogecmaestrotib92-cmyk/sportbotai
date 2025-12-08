/**
 * Analysis Accordion Component (Layer 2)
 * 
 * Collapsible sections for detailed analysis:
 * - Value & Markets
 * - Form & Momentum  
 * - Tactics & Narrative
 * - Risk & Psychology
 * 
 * All sections collapsed by default for a clean initial view.
 */

'use client';

import { useState } from 'react';
import { AnalyzeResponse, ValueFlag, RiskLevel, Trend, MarketConfidence } from '@/types';

interface AnalysisAccordionProps {
  result: AnalyzeResponse;
}

interface AccordionSectionProps {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, icon, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

// Value flag styling
const valueFlagConfig: Record<ValueFlag, { label: string; color: string; bg: string }> = {
  NONE: { label: 'None', color: 'text-gray-600', bg: 'bg-gray-100' },
  LOW: { label: 'Low', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  MEDIUM: { label: 'Medium', color: 'text-accent-lime', bg: 'bg-accent-lime/10' },
  HIGH: { label: 'High', color: 'text-accent-green', bg: 'bg-accent-green/10' },
};

// Risk level styling
const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: 'text-accent-green', bg: 'bg-accent-green/10' },
  MEDIUM: { label: 'Medium', color: 'text-accent-gold', bg: 'bg-accent-gold/10' },
  HIGH: { label: 'High', color: 'text-accent-red', bg: 'bg-accent-red/10' },
};

// Stability styling (inverted - HIGH stability is good)
const stabilityConfig: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: 'text-accent-red', bg: 'bg-accent-red/10' },
  MEDIUM: { label: 'Medium', color: 'text-accent-gold', bg: 'bg-accent-gold/10' },
  HIGH: { label: 'High', color: 'text-accent-green', bg: 'bg-accent-green/10' },
};

// Trend styling
const trendConfig: Record<Trend, { label: string; icon: string; color: string }> = {
  RISING: { label: 'Rising', icon: '↗', color: 'text-accent-green' },
  FALLING: { label: 'Falling', icon: '↘', color: 'text-accent-red' },
  STABLE: { label: 'Stable', icon: '→', color: 'text-gray-500' },
  UNKNOWN: { label: 'Unknown', icon: '?', color: 'text-gray-400' },
};

function ConfidenceStars({ confidence }: { confidence: MarketConfidence }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= confidence ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

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

  return (
    <div className="space-y-3">
      {/* Section 1: Value & Markets */}
      <AccordionSection
        title="Value & Markets"
        icon="💰"
        isOpen={openSections.has('value')}
        onToggle={() => toggleSection('value')}
      >
        <div className="pt-4 space-y-5">
          {/* Implied Probabilities */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Implied Probabilities (from odds)</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Home Win', value: valueAnalysis.impliedProbabilities.homeWin, flag: valueAnalysis.valueFlags.homeWin },
                { label: 'Draw', value: valueAnalysis.impliedProbabilities.draw, flag: valueAnalysis.valueFlags.draw },
                { label: 'Away Win', value: valueAnalysis.impliedProbabilities.awayWin, flag: valueAnalysis.valueFlags.awayWin },
              ].map((item) => {
                const flagStyle = valueFlagConfig[item.flag];
                return (
                  <div key={item.label} className={`p-3 rounded-lg border ${flagStyle.bg}`}>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-lg font-bold text-gray-800">
                      {item.value !== null ? `${item.value.toFixed(1)}%` : '-'}
                    </p>
                    <span className={`text-xs font-medium ${flagStyle.color}`}>
                      Value: {flagStyle.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best Value & Comment */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-gray-700">Best Value Side:</span>
              <span className="font-bold text-accent-cyan">
                {valueAnalysis.bestValueSide === 'NONE' ? 'None detected' : valueAnalysis.bestValueSide}
              </span>
            </div>
            <p className="text-sm text-gray-600">{valueAnalysis.valueCommentDetailed}</p>
          </div>

          {/* Market Stability */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Market Stability</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: '1X2', market: marketStability.markets.main_1x2 },
                { key: 'Over/Under', market: marketStability.markets.over_under },
                { key: 'BTTS', market: marketStability.markets.btts },
              ].map(({ key, market }) => {
                const stabStyle = stabilityConfig[market.stability];
                return (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{key}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${stabStyle.color} ${stabStyle.bg}`}>
                        {stabStyle.label}
                      </span>
                    </div>
                    <ConfidenceStars confidence={market.confidence} />
                    <p className="text-xs text-gray-500 mt-2">{market.comment}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-accent-lime/5 border border-accent-lime/20 rounded-lg">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Safest Market:</span>{' '}
                <span className="text-accent-lime font-semibold">
                  {marketStability.safestMarketType === 'NONE' ? 'None' : marketStability.safestMarketType}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">{marketStability.safestMarketExplanation}</p>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Section 2: Form & Momentum */}
      <AccordionSection
        title="Form & Momentum"
        icon="📈"
        isOpen={openSections.has('form')}
        onToggle={() => toggleSection('form')}
      >
        <div className="pt-4 space-y-4">
          {/* Momentum Scores */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { team: matchInfo.homeTeam, score: momentumAndForm.homeMomentumScore, trend: momentumAndForm.homeTrend, isHome: true },
              { team: matchInfo.awayTeam, score: momentumAndForm.awayMomentumScore, trend: momentumAndForm.awayTrend, isHome: false },
            ].map(({ team, score, trend, isHome }) => {
              const trendStyle = trendConfig[trend];
              const scoreColor = score !== null 
                ? (score >= 7 ? 'text-accent-green' : score >= 5 ? 'text-accent-gold' : 'text-accent-red')
                : 'text-gray-400';
              
              return (
                <div key={team} className={`p-4 rounded-lg border ${isHome ? 'bg-accent-green/5 border-accent-green/20' : 'bg-accent-cyan/5 border-accent-cyan/20'}`}>
                  <p className="text-xs text-gray-500">{isHome ? 'Home' : 'Away'}</p>
                  <p className="font-semibold text-gray-800 mb-2">{team}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${scoreColor}`}>
                      {score !== null ? `${score}/10` : '-'}
                    </span>
                    <span className={`flex items-center gap-1 text-sm ${trendStyle.color}`}>
                      <span className="text-lg">{trendStyle.icon}</span>
                      {trendStyle.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Form Factors */}
          {momentumAndForm.keyFormFactors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Form Factors</h4>
              <ul className="space-y-1">
                {momentumAndForm.keyFormFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-accent-lime">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* Section 3: Tactics & Narrative */}
      <AccordionSection
        title="Tactics & Narrative"
        icon="📝"
        isOpen={openSections.has('tactics')}
        onToggle={() => toggleSection('tactics')}
      >
        <div className="pt-4 space-y-4">
          {/* Styles Summary */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Playing Styles</h4>
            <p className="text-sm text-gray-600">{tacticalAnalysis.stylesSummary}</p>
          </div>

          {/* Match Narrative */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Match Narrative</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{tacticalAnalysis.matchNarrative}</p>
          </div>

          {/* Key Match Factors */}
          {tacticalAnalysis.keyMatchFactors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Match Factors</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tacticalAnalysis.keyMatchFactors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    <span className="w-5 h-5 bg-accent-lime/20 text-accent-lime rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* Section 4: Risk & Psychology */}
      <AccordionSection
        title="Risk & Psychology"
        icon="⚠️"
        isOpen={openSections.has('risk')}
        onToggle={() => toggleSection('risk')}
      >
        <div className="pt-4 space-y-4">
          {/* Risk Level */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Overall Risk:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${riskConfig[riskAnalysis.overallRiskLevel].color} ${riskConfig[riskAnalysis.overallRiskLevel].bg}`}>
              {riskConfig[riskAnalysis.overallRiskLevel].label}
            </span>
          </div>

          {/* Risk Explanation */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Risk Explanation</h4>
            <p className="text-sm text-gray-600">{riskAnalysis.riskExplanation}</p>
          </div>

          {/* Bankroll Impact */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Bankroll Impact</h4>
            <p className="text-sm text-gray-600">{riskAnalysis.bankrollImpact}</p>
          </div>

          {/* Psychology Bias */}
          <div className="p-3 bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg">
            <h4 className="text-sm font-semibold text-accent-cyan mb-1">
              🧠 Psychology Alert: {riskAnalysis.psychologyBias.name}
            </h4>
            <p className="text-sm text-gray-600">{riskAnalysis.psychologyBias.description}</p>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}
