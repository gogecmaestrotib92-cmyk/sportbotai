/**
 * Match Summary Card Component
 * 
 * Displays match info from analysis.matchInfo and meta.
 * Shows sport, league, date, teams, and source type badge.
 * Note: dataQuality is kept in backend for internal logic but not displayed in UI.
 */

'use client';

import { MatchInfo, AnalysisMeta, SourceType } from '@/types';

interface MatchSummaryCardProps {
  matchInfo: MatchInfo;
  meta: AnalysisMeta;
}

const sourceTypeConfig: Record<SourceType, { label: string; bgColor: string; textColor: string; icon: string }> = {
  API: { label: 'Live Data', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', icon: '📡' },
  MANUAL: { label: 'Manual Entry', bgColor: 'bg-slate-100', textColor: 'text-slate-700', icon: '✏️' },
};

export default function MatchSummaryCard({ matchInfo, meta }: MatchSummaryCardProps) {
  const sourceConfig = sourceTypeConfig[matchInfo.sourceType];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-primary-900 rounded-xl p-6 text-white">
      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sourceConfig.bgColor} ${sourceConfig.textColor}`}>
          <span>{sourceConfig.icon}</span>
          {sourceConfig.label}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30">
          {matchInfo.sport}
        </span>
      </div>

      {/* League name */}
      <p className="text-gray-400 text-sm mb-4">{matchInfo.leagueName}</p>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4 py-4 border-y border-white/10">
        <div className="text-center flex-1">
          <p className="text-xl md:text-2xl font-bold">{matchInfo.homeTeam}</p>
          <p className="text-xs text-gray-400 mt-1">Home</p>
        </div>
        <div className="px-4">
          <span className="text-gray-500 text-xl font-light">vs</span>
        </div>
        <div className="text-center flex-1">
          <p className="text-xl md:text-2xl font-bold">{matchInfo.awayTeam}</p>
          <p className="text-xs text-gray-400 mt-1">Away</p>
        </div>
      </div>

      {/* Match date */}
      <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatDate(matchInfo.matchDate)}
      </div>
    </div>
  );
}
