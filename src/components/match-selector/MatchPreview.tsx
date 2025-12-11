/**
 * Match Preview Component
 * 
 * Premium preview card for selected match.
 * Displays teams, odds, implied probabilities, and analyze CTA.
 * Features: Glass morphism, gradient accents, animated elements.
 * Enhanced with countdown timer and improved analyze button.
 */

'use client';

import { MatchData } from '@/types';
import { SportConfig } from '@/lib/config/sportsConfig';
import { formatMatchDate } from './utils';
import MatchCountdown from '@/components/analyzer/MatchCountdown';
import QuickAnalyzeButton from '@/components/analyzer/QuickAnalyzeButton';
import TeamLogo from '@/components/ui/TeamLogo';
import LeagueLogo from '@/components/ui/LeagueLogo';

interface MatchPreviewProps {
  match: MatchData;
  sportConfig: SportConfig | null;
  onAnalyze: () => void;
  loading?: boolean;
  loadingOdds?: boolean;
}

export default function MatchPreview({
  match,
  sportConfig,
  onAnalyze,
  loading = false,
  loadingOdds = false,
}: MatchPreviewProps) {
  const hasDraw = sportConfig?.hasDraw ?? true;
  const hasOdds = match.odds && match.odds.home > 0;

  return (
    <div className="bg-gradient-to-br from-bg-card via-bg-card to-bg-hover rounded-card overflow-hidden shadow-2xl shadow-bg/50 border border-divider">
      {/* Header with gradient accent */}
      <div className="relative px-5 sm:px-6 py-4 border-b border-divider">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-50"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LeagueLogo leagueName={match.league || match.sport} sport={match.sport} size="md" />
            <span className="text-text-secondary text-sm font-medium truncate max-w-[150px] sm:max-w-none">
              {match.league}
            </span>
          </div>
          {/* Countdown Timer Badge */}
          <MatchCountdown matchDate={match.commenceTime} compact />
        </div>
      </div>

      {/* Teams with VS badge */}
      <div className="px-5 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Home Team */}
          <div className="text-center flex-1 min-w-0">
            <div className="flex justify-center mb-2">
              <TeamLogo teamName={match.homeTeam} sport={match.sport} size="lg" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-text-primary truncate leading-tight">
              {match.homeTeam}
            </p>
            {sportConfig?.participantTerm !== 'player' && (
              <p className="text-[10px] sm:text-xs text-text-muted mt-1 uppercase tracking-wider">Home</p>
            )}
          </div>
          
          {/* VS Badge */}
          <div className="flex-shrink-0 relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-divider to-bg-hover border border-divider flex items-center justify-center">
              <span className="text-text-muted text-sm sm:text-base font-semibold">VS</span>
            </div>
          </div>
          
          {/* Away Team */}
          <div className="text-center flex-1 min-w-0">
            <div className="flex justify-center mb-2">
              <TeamLogo teamName={match.awayTeam} sport={match.sport} size="lg" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-text-primary truncate leading-tight">
              {match.awayTeam}
            </p>
            {sportConfig?.participantTerm !== 'player' && (
              <p className="text-[10px] sm:text-xs text-text-muted mt-1 uppercase tracking-wider">Away</p>
            )}
          </div>
        </div>
      </div>

      {/* Odds Section */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        {loadingOdds ? (
          <div className="text-center py-8 bg-bg-hover rounded-card border border-divider">
            <div className="relative w-8 h-8 mx-auto mb-3">
              <div className="absolute inset-0 border-2 border-divider rounded-full"></div>
              <div className="absolute inset-0 border-2 border-primary rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="text-text-muted text-sm">Fetching live odds...</p>
          </div>
        ) : hasOdds ? (
          <>
            {/* Odds Header */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-divider"></div>
              <span className="text-[10px] text-text-muted uppercase tracking-widest font-medium">Match Odds</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-divider"></div>
            </div>

            {/* Odds Grid */}
            <div className={`grid gap-2 sm:gap-3 ${hasDraw ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {/* Home */}
              <div className="bg-gradient-to-b from-bg-hover/80 to-bg-hover/30 rounded-btn p-3 sm:p-4 text-center border border-divider group hover:border-success/30 transition-all duration-200">
                <p className="text-[10px] sm:text-xs text-text-muted mb-1.5 uppercase tracking-wider">
                  {sportConfig?.participantTerm === 'player' ? '1' : 'Home'}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-success group-hover:scale-105 transition-transform">
                  {match.odds.home.toFixed(2)}
                </p>
                {match.impliedProbabilities?.home && (
                  <div className="mt-1.5 px-2 py-0.5 bg-success/10 rounded-chip inline-block">
                    <p className="text-[10px] sm:text-xs text-success font-medium">
                      {match.impliedProbabilities.home.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Draw */}
              {hasDraw && match.odds.draw && (
                <div className="bg-gradient-to-b from-bg-hover/80 to-bg-hover/30 rounded-btn p-3 sm:p-4 text-center border border-divider group hover:border-text-muted/30 transition-all duration-200">
                  <p className="text-[10px] sm:text-xs text-text-muted mb-1.5 uppercase tracking-wider">Draw</p>
                  <p className="text-xl sm:text-2xl font-bold text-text-secondary group-hover:scale-105 transition-transform">
                    {match.odds.draw.toFixed(2)}
                  </p>
                  {match.impliedProbabilities?.draw && (
                    <div className="mt-1.5 px-2 py-0.5 bg-bg-hover rounded-chip inline-block">
                      <p className="text-[10px] sm:text-xs text-text-muted font-medium">
                        {match.impliedProbabilities.draw.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Away */}
              <div className="bg-gradient-to-b from-bg-hover/80 to-bg-hover/30 rounded-btn p-3 sm:p-4 text-center border border-divider group hover:border-info/30 transition-all duration-200">
                <p className="text-[10px] sm:text-xs text-text-muted mb-1.5 uppercase tracking-wider">
                  {sportConfig?.participantTerm === 'player' ? '2' : 'Away'}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-info group-hover:scale-105 transition-transform">
                  {match.odds.away.toFixed(2)}
                </p>
                {match.impliedProbabilities?.away && (
                  <div className="mt-1.5 px-2 py-0.5 bg-info/10 rounded-chip inline-block">
                    <p className="text-[10px] sm:text-xs text-info font-medium">
                      {match.impliedProbabilities.away.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Over/Under if available */}
            {match.odds.over && match.odds.under && (
              <div className="mt-4 pt-4 border-t border-divider">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider">
                    Total {sportConfig?.scoringUnit || 'Points'}
                  </span>
                  <span className="px-2 py-0.5 bg-bg-hover rounded text-xs font-medium text-text-secondary">
                    {match.odds.overUnderLine}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-bg-hover rounded-btn p-2.5 sm:p-3 text-center border border-divider hover:border-accent/30 transition-colors">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Over</p>
                    <p className="text-lg font-bold text-accent">{match.odds.over.toFixed(2)}</p>
                  </div>
                  <div className="bg-bg-hover rounded-btn p-2.5 sm:p-3 text-center border border-divider hover:border-info/30 transition-colors">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Under</p>
                    <p className="text-lg font-bold text-info">{match.odds.under.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 bg-bg-hover rounded-card border border-divider">
            <div className="w-10 h-10 bg-divider rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-text-muted text-sm">Odds not available</p>
          </div>
        )}
      </div>

      {/* Analyze Button - Enhanced */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <QuickAnalyzeButton
          onClick={onAnalyze}
          loading={loading}
          hasOdds={hasOdds}
          size="lg"
        />
      </div>
    </div>
  );
}
