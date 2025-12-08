/**
 * Analysis Results Component
 * 
 * Premium 3-layer layout for analysis results:
 * - Layer 1: Quick Glance Card (summary with key metrics)
 * - Layer 2: Analysis Accordion (detailed sections, collapsed by default)
 * - Layer 3: Extras Section (audio, notes, disclaimer)
 * 
 * Mobile-first, clean, scannable design with clear visual hierarchy.
 */

'use client';

import { AnalyzeResponse } from '@/types';
import QuickGlanceCard from './QuickGlanceCard';
import AnalysisAccordion from './AnalysisAccordion';
import ExtrasSection from './ExtrasSection';

interface AnalysisResultsProps {
  result: AnalyzeResponse;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  // Error state
  if (!result.success && result.error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Analysis Error</h3>
            <p className="text-gray-600 leading-relaxed">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Layer 1: Quick Glance - Key Metrics Summary */}
      <section>
        <QuickGlanceCard result={result} />
      </section>

      {/* Layer 2: Detailed Analysis Accordion */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Detailed Analysis
          </h2>
          <span className="text-[10px] sm:text-xs text-gray-400">
            Tap to expand
          </span>
        </div>
        <AnalysisAccordion result={result} />
      </section>

      {/* Layer 3: Extras - Audio, Notes, Disclaimer */}
      <section>
        <div className="mb-3 sm:mb-4 px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
            More Options
          </h2>
        </div>
        <ExtrasSection result={result} />
      </section>
    </div>
  );
}
