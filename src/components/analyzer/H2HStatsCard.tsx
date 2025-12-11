/**
 * Head-to-Head Card Component
 * 
 * Premium visual display of head-to-head statistics.
 * Features:
 * - Visual bar comparison
 * - Recent meeting history
 * - Goal statistics
 * - Win/Draw/Loss breakdown
 */

'use client';

import { HeadToHeadMatch } from '@/types';
import TeamLogo from '../ui/TeamLogo';

interface H2HStatsCardProps {
  homeTeam: string;
  awayTeam: string;
  sport?: string;
  h2hMatches?: HeadToHeadMatch[];
  h2hSummary?: {
    totalMatches: number;
    homeWins: number;
    awayWins: number;
    draws: number;
  };
  maxRecentMatches?: number;
}

export default function H2HStatsCard({
  homeTeam,
  awayTeam,
  sport = 'soccer',
  h2hMatches = [],
  h2hSummary,
  maxRecentMatches = 5,
}: H2HStatsCardProps) {
  // If no data available
  if (!h2hSummary || h2hSummary.totalMatches === 0) {
    return (
      <div className="bg-bg-card rounded-card border border-divider p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm">⚔️</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Head-to-Head</h3>
            <p className="text-[10px] text-text-muted">Historical record</p>
          </div>
        </div>
        <div className="text-center py-6 text-text-muted text-sm">
          No head-to-head data available for these teams
        </div>
      </div>
    );
  }

  const { totalMatches, homeWins, awayWins, draws } = h2hSummary;
  
  // Calculate percentages for visual bars
  const homePercent = (homeWins / totalMatches) * 100;
  const drawPercent = (draws / totalMatches) * 100;
  const awayPercent = (awayWins / totalMatches) * 100;

  // Calculate goal stats from recent matches
  const goalStats = h2hMatches.slice(0, maxRecentMatches).reduce(
    (acc, match) => {
      // Check which team is home in this match
      const isCurrentHomeTeam = match.homeTeam.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0]) ||
                                homeTeam.toLowerCase().includes(match.homeTeam.toLowerCase().split(' ')[0]);
      
      if (isCurrentHomeTeam) {
        acc.homeGoals += match.homeScore;
        acc.awayGoals += match.awayScore;
      } else {
        acc.homeGoals += match.awayScore;
        acc.awayGoals += match.homeScore;
      }
      acc.matchCount++;
      return acc;
    },
    { homeGoals: 0, awayGoals: 0, matchCount: 0 }
  );

  return (
    <div className="bg-bg-card rounded-card border border-divider overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-divider bg-bg-hover/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm">⚔️</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Head-to-Head</h3>
            <p className="text-[10px] text-text-muted">{totalMatches} meetings</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Win/Draw/Loss Visual Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span className="font-medium text-success flex items-center gap-1">
              <TeamLogo teamName={homeTeam} sport={sport} size="sm" />
              {homeTeam.split(' ').pop()}
            </span>
            <span>Draws</span>
            <span className="font-medium text-info flex items-center gap-1">
              {awayTeam.split(' ').pop()}
              <TeamLogo teamName={awayTeam} sport={sport} size="sm" />
            </span>
          </div>
          
          {/* Stacked Bar */}
          <div className="h-6 sm:h-8 rounded-full overflow-hidden flex bg-bg-hover">
            {homePercent > 0 && (
              <div
                className="h-full bg-gradient-to-r from-success to-success/80 flex items-center justify-center transition-all duration-500"
                style={{ width: `${homePercent}%` }}
              >
                {homePercent >= 15 && (
                  <span className="text-xs font-bold text-white">{homeWins}</span>
                )}
              </div>
            )}
            {drawPercent > 0 && (
              <div
                className="h-full bg-gradient-to-r from-text-muted/50 to-text-muted/40 flex items-center justify-center transition-all duration-500"
                style={{ width: `${drawPercent}%` }}
              >
                {drawPercent >= 15 && (
                  <span className="text-xs font-bold text-white">{draws}</span>
                )}
              </div>
            )}
            {awayPercent > 0 && (
              <div
                className="h-full bg-gradient-to-r from-info/80 to-info flex items-center justify-center transition-all duration-500"
                style={{ width: `${awayPercent}%` }}
              >
                {awayPercent >= 15 && (
                  <span className="text-xs font-bold text-white">{awayWins}</span>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-success" />
              <span className="text-[10px] text-text-muted">{homeWins} wins</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-text-muted/50" />
              <span className="text-[10px] text-text-muted">{draws} draws</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-info" />
              <span className="text-[10px] text-text-muted">{awayWins} wins</span>
            </div>
          </div>
        </div>

        {/* Goal Stats */}
        {goalStats.matchCount > 0 && (
          <div className="border-t border-divider pt-4">
            <p className="text-[10px] text-text-muted text-center mb-3">
              Goals in last {goalStats.matchCount} meetings
            </p>
            <div className="flex items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-success">{goalStats.homeGoals}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{homeTeam.split(' ').pop()}</div>
              </div>
              <div className="text-xl text-text-muted">-</div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-info">{goalStats.awayGoals}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{awayTeam.split(' ').pop()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Meetings */}
        {h2hMatches.length > 0 && (
          <div className="border-t border-divider pt-4">
            <p className="text-[10px] text-text-muted mb-3">Recent meetings</p>
            <div className="space-y-2">
              {h2hMatches.slice(0, maxRecentMatches).map((match, index) => {
                const isHomeWin = match.homeScore > match.awayScore;
                const isAwayWin = match.awayScore > match.homeScore;
                const isDraw = match.homeScore === match.awayScore;
                
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-hover text-xs"
                  >
                    <span className="text-text-muted text-[10px] flex-shrink-0 w-16">
                      {new Date(match.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: '2-digit'
                      })}
                    </span>
                    <span className={`flex-1 truncate text-right ${isHomeWin ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                      {match.homeTeam.length > 12 ? match.homeTeam.split(' ').pop() : match.homeTeam}
                    </span>
                    <span className="font-bold text-text-primary flex-shrink-0 px-2 py-0.5 bg-bg-card rounded">
                      {match.homeScore} - {match.awayScore}
                    </span>
                    <span className={`flex-1 truncate ${isAwayWin ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                      {match.awayTeam.length > 12 ? match.awayTeam.split(' ').pop() : match.awayTeam}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
