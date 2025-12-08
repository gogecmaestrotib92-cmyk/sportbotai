/**
 * Match List Component
 * 
 * Premium list of matches with clean, scannable design.
 * Shows teams, date/time, odds preview, and selection state.
 */

'use client';

import { MatchData } from '@/types';
import { formatMatchDate } from './utils';

interface MatchListProps {
  matches: MatchData[];
  selectedMatchId?: string;
  onMatchSelect: (match: MatchData) => void;
  loading?: boolean;
  compact?: boolean;
}

export default function MatchList({
  matches,
  selectedMatchId,
  onMatchSelect,
  loading = false,
  compact = false,
}: MatchListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-bg-elevated rounded-card h-[72px]" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No matches found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => {
        const isSelected = match.matchId === selectedMatchId;
        const hasOdds = match.odds && match.odds.home > 0;
        
        return (
          <button
            key={match.matchId}
            onClick={() => onMatchSelect(match)}
            className={`
              w-full text-left p-3 sm:p-4 rounded-card transition-all duration-200 active:scale-[0.99]
              ${isSelected
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-bg-card border border-divider hover:border-primary/20 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Match Info */}
              <div className="flex-1 min-w-0">
                {/* Teams */}
                <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
                  <span className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-white'}`}>
                    {match.homeTeam}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/10 text-gray-300' : 'bg-bg-elevated text-gray-400'}`}>
                    vs
                  </span>
                  <span className={`font-medium truncate ${isSelected ? 'text-gray-200' : 'text-gray-300'}`}>
                    {match.awayTeam}
                  </span>
                </div>
                
                {/* Date/Time */}
                <div className={`flex items-center gap-2 text-xs mt-1.5 ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatMatchDate(match.commenceTime)}
                </div>
              </div>

              {/* Odds preview (if available) */}
              {hasOdds && !compact && (
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-semibold px-2 py-1 rounded-lg ${isSelected ? 'bg-white/10 text-accent' : 'bg-accent/10 text-accent'}`}>
                    {match.odds.home.toFixed(2)}
                  </span>
                  {match.odds.draw && (
                    <span className={`text-xs font-mono px-2 py-1 rounded-lg ${isSelected ? 'bg-white/10 text-gray-300' : 'bg-bg-elevated text-gray-400'}`}>
                      {match.odds.draw.toFixed(2)}
                    </span>
                  )}
                  <span className={`text-xs font-mono px-2 py-1 rounded-lg ${isSelected ? 'bg-white/10 text-gray-300' : 'bg-bg-elevated text-gray-400'}`}>
                    {match.odds.away.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Compact odds */}
              {hasOdds && compact && (
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-accent' : 'text-accent'}`}>
                    {match.odds.home.toFixed(2)}
                  </span>
                  <span className={`text-[10px] ${isSelected ? 'text-gray-500' : 'text-gray-500'}`}>|</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                    {match.odds.away.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Select indicator */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                ${isSelected 
                  ? 'bg-accent text-bg-primary' 
                  : 'bg-bg-elevated text-gray-400 group-hover:bg-divider'
                }`}
              >
                {isSelected ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
