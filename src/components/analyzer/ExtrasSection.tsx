/**
 * Extras Section Component (Layer 3)
 * 
 * Contains:
 * - Audio analysis button (if TTS is available)
 * - Responsible gambling note (subtle, not banner-style)
 * - Warnings from meta.warnings (as small info items, not red banners)
 */

'use client';

import { AnalyzeResponse } from '@/types';
import ListenToAnalysisButton from './ListenToAnalysisButton';

interface ExtrasSectionProps {
  result: AnalyzeResponse;
}

export default function ExtrasSection({ result }: ExtrasSectionProps) {
  const warnings = result.meta.warnings || [];
  const userContext = result.userContext;
  const hasUserPick = userContext?.userPick || (userContext?.userStake && userContext.userStake > 0);

  return (
    <div className="space-y-4">
      {/* User Selection (if provided) */}
      {hasUserPick && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">👤</span>
            <h3 className="font-semibold text-gray-900">Your Selection</h3>
          </div>
          <div className="flex flex-wrap gap-4 mb-3">
            {userContext.userPick && (
              <div>
                <p className="text-xs text-gray-500">Pick</p>
                <p className="font-semibold text-accent-cyan">{userContext.userPick}</p>
              </div>
            )}
            {userContext.userStake > 0 && (
              <div>
                <p className="text-xs text-gray-500">Stake</p>
                <p className="font-semibold text-accent-cyan">{userContext.userStake} units</p>
              </div>
            )}
          </div>
          {userContext.pickComment && (
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{userContext.pickComment}</p>
          )}
        </div>
      )}

      {/* Audio Analysis Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-cyan/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Audio Analysis</h3>
              <p className="text-sm text-gray-500">Listen to the AI-generated summary</p>
            </div>
          </div>
          <ListenToAnalysisButton result={result} />
        </div>
      </div>

      {/* Analysis Notes (warnings) - subtle style */}
      {warnings.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-500">ℹ️</span>
            <h3 className="text-sm font-medium text-gray-700">Analysis Notes</h3>
          </div>
          <ul className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-gray-400">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Responsible Gambling Note */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-gray-500 leading-relaxed">
          This analysis is for informational and educational purposes only. It is not betting advice and no outcome is guaranteed. 
          Gamble responsibly. 18+. Need help?{' '}
          <a 
            href="https://www.begambleaware.org/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline hover:text-gray-700"
          >
            BeGambleAware.org
          </a>
        </p>
      </div>

      {/* Meta Footer */}
      <div className="text-center text-xs text-gray-400 pt-2">
        <p>
          Analysis by BetSense AI v{result.meta.modelVersion} • {new Date(result.meta.analysisGeneratedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
