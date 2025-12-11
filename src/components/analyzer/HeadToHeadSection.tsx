/**
 * Head-to-Head Section Component
 * 
 * Displays historical head-to-head data between two teams:
 * - Win/Draw/Loss summary
 * - Recent match results
 */

'use client';

import { HeadToHeadMatch } from '@/types';
import TeamLogo from '../ui/TeamLogo';

interface HeadToHeadSectionProps {
  headToHead?: HeadToHeadMatch[];
  h2hSummary?: {
    totalMatches: number;
    homeWins: number;
    awayWins: number;
    draws: number;
  };
  homeTeam: string;
  awayTeam: string;
  sport?: string;
}

export default function HeadToHeadSection({ 
  headToHead, 
  h2hSummary, 
  homeTeam, 
  awayTeam,
  sport = 'soccer'
}: HeadToHeadSectionProps) {
  // If no H2H data available
  if (!headToHead || headToHead.length === 0 || !h2hSummary) {
    return (
      <div className="text-center py-6 text-text-muted">
        <span className="text-2xl mb-2 block">🔍</span>
        <p className="text-sm">No head-to-head data available</p>
      </div>
    );
  }

  const { totalMatches, homeWins, awayWins, draws } = h2hSummary;
  
  // Calculate percentages for the bar
  const total = homeWins + awayWins + draws;
  const homePercentage = total > 0 ? (homeWins / total) * 100 : 33;
  const drawPercentage = total > 0 ? (draws / total) * 100 : 34;
  const awayPercentage = total > 0 ? (awayWins / total) * 100 : 33;

  return (
    <div className="space-y-4">
      {/* Data Source Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg py-1.5 px-3">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Real head-to-head data
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
          <div className="flex justify-center mb-1">
            <TeamLogo teamName={homeTeam} sport={sport} size="sm" />
          </div>
          <p className="text-2xl font-bold text-green-600">{homeWins}</p>
          <p className="text-[10px] text-green-700 font-medium uppercase tracking-wide mt-1">
            {homeTeam.split(' ').slice(0, 2).join(' ')}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <p className="text-2xl font-bold text-gray-600">{draws}</p>
          <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wide mt-1">Draws</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <div className="flex justify-center mb-1">
            <TeamLogo teamName={awayTeam} sport={sport} size="sm" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{awayWins}</p>
          <p className="text-[10px] text-blue-700 font-medium uppercase tracking-wide mt-1">
            {awayTeam.split(' ').slice(0, 2).join(' ')}
          </p>
        </div>
      </div>

      {/* Visual Bar */}
      <div className="h-3 bg-bg-hover rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
          style={{ width: `${homePercentage}%` }}
          title={`${homeTeam}: ${homeWins} wins`}
        />
        <div 
          className="h-full bg-gradient-to-r from-gray-300 to-gray-400 transition-all duration-500"
          style={{ width: `${drawPercentage}%` }}
          title={`Draws: ${draws}`}
        />
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
          style={{ width: `${awayPercentage}%` }}
          title={`${awayTeam}: ${awayWins} wins`}
        />
      </div>

      {/* Total Matches */}
      <p className="text-center text-xs text-text-muted">
        Based on {totalMatches} recorded {totalMatches === 1 ? 'match' : 'matches'}
      </p>

      {/* Recent Matches */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Recent Encounters
        </h4>
        <div className="space-y-2">
          {headToHead.slice(0, 5).map((match, index) => {
            const matchDate = new Date(match.date);
            const formattedDate = matchDate.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            
            // Determine winner
            let resultClass = 'bg-gray-50 border-gray-200';
            if (match.homeScore > match.awayScore) {
              resultClass = 'bg-green-50/50 border-green-200';
            } else if (match.awayScore > match.homeScore) {
              resultClass = 'bg-blue-50/50 border-blue-200';
            }

            return (
              <div 
                key={index}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${resultClass}`}
              >
                <span className="text-xs text-text-muted w-20 flex-shrink-0">
                  {formattedDate}
                </span>
                <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
                  <span className="text-xs font-medium text-text-primary truncate max-w-[80px] text-right" title={match.homeTeam}>
                    {match.homeTeam.split(' ').slice(0, 2).join(' ')}
                  </span>
                  <span className="flex-shrink-0 px-2 py-0.5 bg-bg-card rounded font-bold text-sm text-text-primary border border-divider">
                    {match.homeScore} - {match.awayScore}
                  </span>
                  <span className="text-xs font-medium text-text-primary truncate max-w-[80px]" title={match.awayTeam}>
                    {match.awayTeam.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
