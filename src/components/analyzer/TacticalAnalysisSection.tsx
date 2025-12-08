/**
 * Tactical Analysis Section Component (Phase 6 Polish)
 * 
 * Features:
 * - Animated playing styles comparison
 * - Rich match narrative with visual accents
 * - Interactive key factors grid
 * - Premium expert conclusion card
 */

'use client';

import { TacticalAnalysis } from '@/types';

interface TacticalAnalysisSectionProps {
  tacticalAnalysis: TacticalAnalysis;
}

export default function TacticalAnalysisSection({ tacticalAnalysis }: TacticalAnalysisSectionProps) {
  const { stylesSummary, matchNarrative, keyMatchFactors, expertConclusionOneLiner } = tacticalAnalysis;

  return (
    <div className="space-y-4">
      {/* Styles Summary - with visual accent */}
      <div className="relative bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-100 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-900 to-accent-cyan"></div>
        <div className="pl-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🎮</span>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Playing Styles</h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {stylesSummary}
          </p>
        </div>
      </div>

      {/* Match Narrative - Feature card */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-base">🎬</span>
          </div>
          <h4 className="text-sm font-semibold text-gray-900">Match Narrative</h4>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {matchNarrative}
        </p>
      </div>

      {/* Key Match Factors - Grid with numbering */}
      {keyMatchFactors && keyMatchFactors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>⭐</span>
              Key Factors
            </h4>
            <span className="text-[10px] text-gray-400">{keyMatchFactors.length} factors</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {keyMatchFactors.map((factor, index) => (
              <div
                key={index}
                className="group flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-900/20 hover:bg-gray-100/50 transition-all duration-200"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-primary-900/10 text-primary-900 rounded-full flex items-center justify-center text-[10px] font-bold group-hover:bg-primary-900 group-hover:text-white transition-colors">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{factor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expert Conclusion - Premium quote card */}
      <div className="relative bg-gradient-to-br from-primary-900 via-primary-900 to-slate-800 rounded-xl p-5 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-cyan/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent-lime/20 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative">
          {/* Quote icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-lime" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-accent-lime font-semibold uppercase tracking-wider">Expert Verdict</p>
              <p className="text-xs text-gray-400">AI Analysis Conclusion</p>
            </div>
          </div>
          
          {/* Quote text */}
          <blockquote className="text-white font-medium text-base sm:text-lg leading-relaxed">
            &ldquo;{expertConclusionOneLiner}&rdquo;
          </blockquote>
        </div>
      </div>
    </div>
  );
}
