/**
 * Analysis Results Component
 * 
 * Clean, layered layout for analysis results:
 * - Layer 1: Quick Glance Card (always visible)
 * - Layer 2: Analysis Accordion (collapsed by default)
 * - Layer 3: Extras Section (audio, warnings, disclaimer)
 * 
 * Mobile-first, scannable design.
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
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Analysis Error</h3>
            <p className="text-gray-600">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Layer 1: Quick Glance */}
      <QuickGlanceCard result={result} />

      {/* Layer 2: Detailed Analysis (Accordion) */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Detailed Analysis
        </h2>
        <AnalysisAccordion result={result} />
      </div>

      {/* Layer 3: Extras */}
      <ExtrasSection result={result} />
    </div>
  );
}
