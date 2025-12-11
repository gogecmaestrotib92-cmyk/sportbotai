/**
 * Team Stats Section Component
 * 
 * Displays team statistics from API-Sports (sport-adaptive):
 * - Soccer: Goals scored/conceded, Clean sheets
 * - Basketball: Points scored/allowed, PPG
 * - Hockey: Goals scored/allowed
 * - NFL: Points scored/allowed
 * - MMA: Wins/Losses, Finishes
 */

'use client';

import { TeamStats } from '@/types';
import TeamLogo from '../ui/TeamLogo';

interface TeamStatsSectionProps {
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  homeTeam: string;
  awayTeam: string;
  sport?: string;
}

// Sport-specific label mappings
function getStatLabels(sport?: string): {
  scored: string;
  conceded: string;
  cleanSheets: string;
  avgScored: string;
  avgConceded: string;
  differential: string;
} {
  const sportLower = (sport || '').toLowerCase();
  
  if (sportLower.includes('basketball') || sportLower.includes('nba')) {
    return {
      scored: 'Points Scored',
      conceded: 'Points Allowed',
      cleanSheets: 'Blowouts (20+)',
      avgScored: 'Avg. PPG',
      avgConceded: 'Avg. Allowed',
      differential: 'Point Diff',
    };
  }
  
  if (sportLower.includes('hockey') || sportLower.includes('nhl')) {
    return {
      scored: 'Goals Scored',
      conceded: 'Goals Allowed',
      cleanSheets: 'Shutouts',
      avgScored: 'Avg. Goals',
      avgConceded: 'Avg. Allowed',
      differential: 'Goal Diff',
    };
  }
  
  if (sportLower.includes('football') || sportLower.includes('nfl')) {
    return {
      scored: 'Points Scored',
      conceded: 'Points Allowed',
      cleanSheets: 'Shutouts',
      avgScored: 'Avg. PPG',
      avgConceded: 'Avg. Allowed',
      differential: 'Point Diff',
    };
  }
  
  if (sportLower.includes('mma') || sportLower.includes('ufc')) {
    return {
      scored: 'Wins',
      conceded: 'Losses',
      cleanSheets: 'Finishes',
      avgScored: 'Win Rate',
      avgConceded: 'Loss Rate',
      differential: 'W-L Diff',
    };
  }
  
  // Default: Soccer
  return {
    scored: 'Goals Scored',
    conceded: 'Goals Conceded',
    cleanSheets: 'Clean Sheets',
    avgScored: 'Avg. Scored',
    avgConceded: 'Avg. Conceded',
    differential: 'Goal Diff',
  };
}

interface StatBarProps {
  homeValue: number;
  awayValue: number;
  label: string;
  format?: 'number' | 'decimal';
  higherIsBetter?: boolean;
}

function StatBar({ homeValue, awayValue, label, format = 'number', higherIsBetter = true }: StatBarProps) {
  const total = homeValue + awayValue || 1;
  const homePercentage = (homeValue / total) * 100;
  
  // Determine which side is "winning"
  const homeBetter = higherIsBetter ? homeValue >= awayValue : homeValue <= awayValue;
  const awayBetter = higherIsBetter ? awayValue >= homeValue : awayValue <= homeValue;
  
  const formatValue = (val: number) => {
    if (format === 'decimal') return val.toFixed(2);
    return val.toString();
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className={`font-semibold ${homeBetter ? 'text-green-600' : 'text-text-secondary'}`}>
          {formatValue(homeValue)}
        </span>
        <span className="text-text-muted font-medium">{label}</span>
        <span className={`font-semibold ${awayBetter ? 'text-blue-600' : 'text-text-secondary'}`}>
          {formatValue(awayValue)}
        </span>
      </div>
      <div className="h-2 bg-bg-hover rounded-full overflow-hidden flex">
        <div 
          className={`h-full transition-all duration-500 ${homeBetter ? 'bg-green-500' : 'bg-green-300'}`}
          style={{ width: `${homePercentage}%` }}
        />
        <div 
          className={`h-full transition-all duration-500 ${awayBetter ? 'bg-blue-500' : 'bg-blue-300'}`}
          style={{ width: `${100 - homePercentage}%` }}
        />
      </div>
    </div>
  );
}

export default function TeamStatsSection({ 
  homeStats, 
  awayStats, 
  homeTeam, 
  awayTeam,
  sport
}: TeamStatsSectionProps) {
  // Get sport-specific labels
  const labels = getStatLabels(sport);
  
  // If no stats available
  if (!homeStats && !awayStats) {
    return (
      <div className="text-center py-6 text-text-muted">
        <span className="text-2xl mb-2 block">📊</span>
        <p className="text-sm">No team statistics available</p>
      </div>
    );
  }

  // Default values if one side is missing
  const home: TeamStats = homeStats || {
    goalsScored: 0,
    goalsConceded: 0,
    cleanSheets: 0,
    avgGoalsScored: 0,
    avgGoalsConceded: 0,
  };
  
  const away: TeamStats = awayStats || {
    goalsScored: 0,
    goalsConceded: 0,
    cleanSheets: 0,
    avgGoalsScored: 0,
    avgGoalsConceded: 0,
  };

  return (
    <div className="space-y-4">
      {/* Data Source Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg py-1.5 px-3">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Real season statistics
      </div>

      {/* Team Headers */}
      <div className="flex items-center justify-between px-2">
        <div className="text-center">
          <TeamLogo teamName={homeTeam} sport={sport || 'soccer'} size="md" className="mx-auto mb-1" />
          <p className="text-[10px] text-text-muted font-medium truncate max-w-[80px]" title={homeTeam}>
            {homeTeam.split(' ').slice(0, 2).join(' ')}
          </p>
        </div>
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Season Stats
        </div>
        <div className="text-center">
          <TeamLogo teamName={awayTeam} sport={sport || 'soccer'} size="md" className="mx-auto mb-1" />
          <p className="text-[10px] text-text-muted font-medium truncate max-w-[80px]" title={awayTeam}>
            {awayTeam.split(' ').slice(0, 2).join(' ')}
          </p>
        </div>
      </div>

      {/* Stats Comparison */}
      <div className="space-y-1 bg-bg-hover rounded-xl p-4 border border-divider">
        <StatBar 
          homeValue={home.goalsScored} 
          awayValue={away.goalsScored} 
          label={labels.scored}
          higherIsBetter={true}
        />
        <StatBar 
          homeValue={home.goalsConceded} 
          awayValue={away.goalsConceded} 
          label={labels.conceded}
          higherIsBetter={false}
        />
        <StatBar 
          homeValue={home.cleanSheets} 
          awayValue={away.cleanSheets} 
          label={labels.cleanSheets}
          higherIsBetter={true}
        />
        
        {/* Averages */}
        {(home.avgGoalsScored || away.avgGoalsScored) && (
          <>
            <div className="border-t border-divider my-3 pt-3">
              <p className="text-[10px] text-center text-text-muted uppercase tracking-wider mb-2">
                Per Game Averages
              </p>
            </div>
            <StatBar 
              homeValue={home.avgGoalsScored || 0} 
              awayValue={away.avgGoalsScored || 0} 
              label={labels.avgScored}
              format="decimal"
              higherIsBetter={true}
            />
            <StatBar 
              homeValue={home.avgGoalsConceded || 0} 
              awayValue={away.avgGoalsConceded || 0} 
              label={labels.avgConceded}
              format="decimal"
              higherIsBetter={false}
            />
          </>
        )}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-2 gap-2">
        {/* Differential */}
        <div className="bg-bg-card rounded-lg p-3 border border-divider text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{labels.differential}</p>
          <p className={`text-lg font-bold ${(home.goalsScored - home.goalsConceded) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {home.goalsScored - home.goalsConceded >= 0 ? '+' : ''}{home.goalsScored - home.goalsConceded}
          </p>
          <p className="text-[10px] text-text-muted">{homeTeam.split(' ')[0]}</p>
        </div>
        <div className="bg-bg-card rounded-lg p-3 border border-divider text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{labels.differential}</p>
          <p className={`text-lg font-bold ${(away.goalsScored - away.goalsConceded) >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {away.goalsScored - away.goalsConceded >= 0 ? '+' : ''}{away.goalsScored - away.goalsConceded}
          </p>
          <p className="text-[10px] text-text-muted">{awayTeam.split(' ')[0]}</p>
        </div>
      </div>
    </div>
  );
}
