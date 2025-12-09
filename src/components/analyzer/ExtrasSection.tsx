/**
 * Extras Section Component (Layer 3)
 * 
 * Clean, compact section containing:
 * - User selection (if provided)
 * - Audio analysis button (compact inline design)
 * - Analysis notes/warnings (subtle, not alarming)
 * - Responsible gambling note (minimal, non-intrusive)
 * - Meta footer (version, timestamp)
 * 
 * Mobile-first, non-cluttered design.
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
      {/* User Selection Card (if provided) */}
      {hasUserPick && (
        <div className="bg-bg-card rounded-xl border border-divider p-4 sm:p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">👤</span>
            </div>
            <h3 className="font-semibold text-white text-sm sm:text-base">Your Selection</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3">
            {userContext.userPick && (
              <div className="flex items-center gap-2 bg-bg-hover px-3 py-2 rounded-lg">
                <span className="text-xs text-text-muted">Pick:</span>
                <span className="font-semibold text-white">{userContext.userPick}</span>
              </div>
            )}
            {userContext.userStake > 0 && (
              <div className="flex items-center gap-2 bg-bg-hover px-3 py-2 rounded-lg">
                <span className="text-xs text-text-muted">Stake:</span>
                <span className="font-semibold text-white">{userContext.userStake} units</span>
              </div>
            )}
          </div>
          
          {userContext.pickComment && (
            <p className="text-sm text-text-secondary bg-bg-hover p-3 rounded-lg border border-divider leading-relaxed">
              {userContext.pickComment}
            </p>
          )}
        </div>
      )}

      {/* Audio Analysis - Compact Inline Card */}
      <div className="bg-bg-card rounded-xl border border-divider p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Audio Analysis</h3>
              <p className="text-xs text-text-muted">Listen to AI-generated summary</p>
            </div>
          </div>
          <ListenToAnalysisButton result={result} />
        </div>
      </div>

      {/* Analysis Notes - Subtle Inline Style */}
      {warnings.length > 0 && (
        <div className="bg-bg-hover rounded-xl border border-divider px-4 py-3">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-muted mb-1.5">Analysis Notes</p>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-xs sm:text-sm text-text-secondary flex items-start gap-1.5">
                    <span className="text-text-muted">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Responsible Gambling Note - Minimal Footer Style */}
      <div className="flex items-start gap-2.5 px-4 py-3 bg-bg-hover/50 border border-divider rounded-xl">
        <svg className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-[11px] sm:text-xs text-text-muted leading-relaxed">
          For educational purposes only. No outcome is guaranteed. 
          Gamble responsibly. 18+.{' '}
          <a 
            href="https://www.begambleaware.org/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:text-accent underline underline-offset-2"
          >
            BeGambleAware.org
          </a>
        </p>
      </div>

      {/* Meta Footer - Subtle */}
      <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-gray-400 pt-1">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          SportBot AI v{result.meta.modelVersion}
        </span>
        <span className="text-gray-300">•</span>
        <span>{new Date(result.meta.analysisGeneratedAt).toLocaleString()}</span>
      </div>
    </div>
  );
}
