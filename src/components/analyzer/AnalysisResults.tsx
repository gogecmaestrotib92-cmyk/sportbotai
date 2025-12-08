/**
 * Analysis Results Component
 * 
 * Main container that renders all analysis sections
 * from the AnalyzeResponse in a structured layout.
 */

'use client';

import { AnalyzeResponse } from '@/types';
import MatchSummaryCard from './MatchSummaryCard';
import ProbabilitiesPanel from './ProbabilitiesPanel';
import ValueAnalysisCard from './ValueAnalysisCard';
import RiskAnalysisCard from './RiskAnalysisCard';
import MomentumFormSection from './MomentumFormSection';
import MarketStabilitySection from './MarketStabilitySection';
import UpsetPotentialCard from './UpsetPotentialCard';
import TacticalAnalysisSection from './TacticalAnalysisSection';
import UserContextBox from './UserContextBox';
import ResponsibleGamblingSection from './ResponsibleGamblingSection';
import WarningsSection from './WarningsSection';
import ListenToAnalysisButton from './ListenToAnalysisButton';

interface AnalysisResultsProps {
  result: AnalyzeResponse;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  // Error state
  if (!result.success && result.error) {
    return (
      <div className="card bg-red-50 border-2 border-red-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Analysis Error</h3>
            <p className="text-red-700">{result.error}</p>
            <p className="text-sm text-red-600 mt-2">
              Please try again or check your input data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Match Summary (Top Card) */}
      <MatchSummaryCard 
        matchInfo={result.matchInfo} 
        meta={result.meta} 
      />

      {/* Listen to Analysis Button */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Audio Analysis
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Listen to the AI-generated analysis narration
            </p>
          </div>
          <ListenToAnalysisButton result={result} />
        </div>
      </div>

      {/* Two Column Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Section 2: Probabilities Panel */}
          <ProbabilitiesPanel 
            probabilities={result.probabilities}
            homeTeam={result.matchInfo.homeTeam}
            awayTeam={result.matchInfo.awayTeam}
          />

          {/* Section 3: Value Analysis Card */}
          <ValueAnalysisCard valueAnalysis={result.valueAnalysis} />

          {/* Section 5: Momentum & Form Section */}
          <MomentumFormSection 
            momentumAndForm={result.momentumAndForm}
            homeTeam={result.matchInfo.homeTeam}
            awayTeam={result.matchInfo.awayTeam}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Section 4: Risk & Bankroll Card */}
          <RiskAnalysisCard riskAnalysis={result.riskAnalysis} />

          {/* Section 7: Upset Potential Card */}
          <UpsetPotentialCard upsetPotential={result.upsetPotential} />

          {/* Section 6: Market Stability Section */}
          <MarketStabilitySection marketStability={result.marketStability} />
        </div>
      </div>

      {/* Full Width Sections */}
      
      {/* Section 8: Tactical & Narrative Section */}
      <TacticalAnalysisSection tacticalAnalysis={result.tacticalAnalysis} />

      {/* Section 9: User Context Box (only if user provided pick) */}
      <UserContextBox userContext={result.userContext} />

      {/* Warnings Section (if any) */}
      <WarningsSection warnings={result.meta.warnings} />

      {/* Section 10: Responsible Gambling Footer */}
      <ResponsibleGamblingSection responsibleGambling={result.responsibleGambling} />

      {/* Footer Meta */}
      <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        <p>
          Analysis generated by BetSense AI v{result.meta.modelVersion} • 
          {new Date(result.meta.analysisGeneratedAt).toLocaleString()}
        </p>
        <p className="mt-1">
          This analysis is for educational and informational purposes only. 
          No outcome is guaranteed.
        </p>
      </div>
    </div>
  );
}
