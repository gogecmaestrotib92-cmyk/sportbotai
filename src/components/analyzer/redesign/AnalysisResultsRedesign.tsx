/**
 * Analysis Results - Premium Redesign
 * 
 * World-class, Apple-style post-analysis page with:
 * - Clean visual hierarchy
 * - Modern card-based layout
 * - Storytelling flow
 * - Premium dark mode aesthetic
 * 
 * Structure:
 * 1. Match Header (hero with teams)
 * 2. Verdict Module (the key insight)
 * 3. Probability + Metrics row
 * 4. Insight Cards grid
 * 5. Deep Analysis (expandable)
 * 6. Disclaimer footer
 */

'use client';

import { AnalyzeResponse } from '@/types';
import MatchHeader from './MatchHeader';
import VerdictModule from './VerdictModule';
import ProbabilityBars from './ProbabilityBars';
import KeyMetricsDisplay from './KeyMetricsDisplay';
import InsightCards from './InsightCards';
import DeepAnalysisSection from './DeepAnalysisSection';
import DisclaimerFooter from './DisclaimerFooter';
import InjuryImpactCard from '../InjuryImpactCard';
import ShareCard from '../ShareCard';
import CopyInsightsButton from '../CopyInsightsButton';

interface AnalysisResultsRedesignProps {
  result: AnalyzeResponse;
}

export default function AnalysisResultsRedesign({ result }: AnalysisResultsRedesignProps) {
  // Error state
  if (!result.success && result.error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-rose-500/5 border border-rose-500/20 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Analysis Error</h3>
              <p className="text-sm text-white/60 leading-relaxed">{result.error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check for injury data
  const hasInjuryData = result.injuryContext && (
    result.injuryContext.homeTeam?.players.length || 
    result.injuryContext.awayTeam?.players.length
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* ===== SECTION 1: MATCH HEADER ===== */}
      <MatchHeader matchInfo={result.matchInfo} />

      {/* ===== SECTION 2: MAIN VERDICT ===== */}
      <div className="px-4 sm:px-6 lg:px-0 mt-6 sm:mt-8">
        <VerdictModule result={result} />
        
        {/* Share & Copy Actions */}
        <div className="flex items-center gap-3 mt-4">
          <CopyInsightsButton result={result} variant="compact" />
          <ShareCard result={result} />
        </div>
      </div>

      {/* ===== SECTION 3: PROBABILITY + METRICS ===== */}
      <div className="px-4 sm:px-6 lg:px-0 mt-6 sm:mt-8">
        <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Probability Bars - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ProbabilityBars result={result} />
          </div>
          
          {/* Key Metrics - Takes 3 columns */}
          <div className="lg:col-span-3">
            <KeyMetricsDisplay result={result} />
          </div>
        </div>
      </div>

      {/* ===== SECTION 4: INSIGHT CARDS ===== */}
      <div className="px-4 sm:px-6 lg:px-0 mt-8 sm:mt-10">
        <div className="flex items-center gap-2 px-1 mb-5">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-blue-500" />
          <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Key Insights</span>
        </div>
        <InsightCards result={result} />
      </div>

      {/* ===== SECTION 5: INJURY IMPACT (if available) ===== */}
      {hasInjuryData && (
        <div className="px-4 sm:px-6 lg:px-0 mt-6">
          <InjuryImpactCard
            injuryContext={result.injuryContext!}
            homeTeam={result.matchInfo.homeTeam}
            awayTeam={result.matchInfo.awayTeam}
            sport={result.matchInfo.sport}
          />
        </div>
      )}

      {/* ===== SECTION 6: DEEP ANALYSIS ===== */}
      <div className="px-4 sm:px-6 lg:px-0 mt-8 sm:mt-10">
        <DeepAnalysisSection result={result} />
      </div>

      {/* ===== SECTION 7: DISCLAIMER ===== */}
      <div className="px-4 sm:px-6 lg:px-0">
        <DisclaimerFooter responsibleGamblingNote={result.responsibleGambling?.coreNote} />
      </div>
    </div>
  );
}
