/**
 * Quick Stats Card Component
 * 
 * Sport-adaptive statistics display showing key metrics at a glance.
 * Automatically adapts content based on sport type:
 * - Soccer: Goals, Clean Sheets, H2H record
 * - Basketball: PPG, Form streak, H2H
 * - NFL: Points, Win rate, H2H
 * - Tennis: Sets, Form, Surface record
 * 
 * Shows real data when available, gracefully degrades when not.
 */

'use client';

import { AnalyzeResponse, FormMatch, TeamStats } from '@/types';

interface QuickStatsCardProps {
  result: AnalyzeResponse;
}

// Sport-specific stat configurations
const SPORT_STATS_CONFIG: Record<string, {
  primaryStats: { key: string; label: string; icon: string }[];
  formLabel: string;
  scoringUnit: string;
}> = {
  soccer: {
    primaryStats: [
      { key: 'goalsScored', label: 'Goals', icon: '⚽' },
      { key: 'goalsConceded', label: 'Conceded', icon: '🥅' },
      { key: 'cleanSheets', label: 'Clean Sheets', icon: '🧤' },
    ],
    formLabel: 'Recent Form',
    scoringUnit: 'goals',
  },
  basketball: {
    primaryStats: [
      { key: 'pointsFor', label: 'PPG', icon: '🏀' },
      { key: 'pointsAgainst', label: 'Opp PPG', icon: '📊' },
      { key: 'winPercentage', label: 'Win %', icon: '📈' },
    ],
    formLabel: 'Last 5 Games',
    scoringUnit: 'points',
  },
  nba: {
    primaryStats: [
      { key: 'pointsFor', label: 'PPG', icon: '🏀' },
      { key: 'pointsAgainst', label: 'Opp PPG', icon: '📊' },
      { key: 'winPercentage', label: 'Win %', icon: '📈' },
    ],
    formLabel: 'Last 5 Games',
    scoringUnit: 'points',
  },
  nfl: {
    primaryStats: [
      { key: 'pointsFor', label: 'PPG', icon: '🏈' },
      { key: 'pointsAgainst', label: 'Opp PPG', icon: '📊' },
      { key: 'winPercentage', label: 'Win %', icon: '📈' },
    ],
    formLabel: 'Last 5 Games',
    scoringUnit: 'points',
  },
  tennis: {
    primaryStats: [
      { key: 'wins', label: 'Wins', icon: '🎾' },
      { key: 'winPercentage', label: 'Win %', icon: '📈' },
    ],
    formLabel: 'Recent Matches',
    scoringUnit: 'sets',
  },
  default: {
    primaryStats: [
      { key: 'wins', label: 'Wins', icon: '✓' },
      { key: 'losses', label: 'Losses', icon: '✗' },
    ],
    formLabel: 'Recent Form',
    scoringUnit: 'points',
  },
};

// Get sport config with fallback
function getSportStatsConfig(sport: string) {
  const normalized = sport.toLowerCase().replace(/[^a-z]/g, '');
  
  if (normalized.includes('soccer') || normalized.includes('football') && !normalized.includes('american')) {
    return SPORT_STATS_CONFIG.soccer;
  }
  if (normalized.includes('basketball') || normalized.includes('nba')) {
    return SPORT_STATS_CONFIG.basketball;
  }
  if (normalized.includes('nfl') || normalized.includes('american')) {
    return SPORT_STATS_CONFIG.nfl;
  }
  if (normalized.includes('tennis')) {
    return SPORT_STATS_CONFIG.tennis;
  }
  
  return SPORT_STATS_CONFIG.default;
}

// Calculate form streak (e.g., "W3" for 3 wins in a row)
function getFormStreak(form: FormMatch[]): { streak: string; color: string } {
  if (!form || form.length === 0) return { streak: '-', color: 'text-text-muted' };
  
  const firstResult = form[0].result;
  let count = 0;
  
  for (const match of form) {
    if (match.result === firstResult) count++;
    else break;
  }
  
  const streakMap: Record<string, { prefix: string; color: string }> = {
    'W': { prefix: 'W', color: 'text-success' },
    'D': { prefix: 'D', color: 'text-warning' },
    'L': { prefix: 'L', color: 'text-danger' },
  };
  
  const { prefix, color } = streakMap[firstResult] || { prefix: '?', color: 'text-text-muted' };
  return { streak: `${prefix}${count}`, color };
}

// Render form badges (W/D/L pills)
function FormBadges({ form, limit = 5 }: { form?: FormMatch[]; limit?: number }) {
  if (!form || form.length === 0) {
    return <span className="text-text-muted text-xs">No data</span>;
  }
  
  const colorMap: Record<string, string> = {
    'W': 'bg-success/20 text-success border-success/30',
    'D': 'bg-warning/20 text-warning border-warning/30',
    'L': 'bg-danger/20 text-danger border-danger/30',
  };
  
  return (
    <div className="flex gap-1">
      {form.slice(0, limit).map((match, i) => (
        <span
          key={i}
          className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded text-[10px] sm:text-xs font-bold border ${colorMap[match.result] || 'bg-bg-tertiary text-text-muted'}`}
          title={match.opponent ? `vs ${match.opponent}: ${match.score || match.result}` : undefined}
        >
          {match.result}
        </span>
      ))}
    </div>
  );
}

// Get stat value from stats object
function getStatValue(stats: TeamStats | undefined, key: string): string {
  if (!stats) return '-';
  
  const value = (stats as any)[key];
  if (value === undefined || value === null) return '-';
  
  // Format percentages
  if (key === 'winPercentage') {
    return `${Math.round(value * 100)}%`;
  }
  
  // Format averages
  if (key.includes('avg') || key === 'pointsFor' || key === 'pointsAgainst') {
    return typeof value === 'number' ? value.toFixed(1) : value;
  }
  
  return String(value);
}

export default function QuickStatsCard({ result }: QuickStatsCardProps) {
  const { matchInfo, momentumAndForm } = result;
  const config = getSportStatsConfig(matchInfo.sport);
  
  const hasRealData = momentumAndForm.formDataSource === 'API_FOOTBALL' || 
                      momentumAndForm.formDataSource === 'API_SPORTS';
  
  const homeStreak = getFormStreak(momentumAndForm.homeForm || []);
  const awayStreak = getFormStreak(momentumAndForm.awayForm || []);
  
  // H2H summary
  const h2h = momentumAndForm.h2hSummary;
  const hasH2H = h2h && h2h.totalMatches > 0;

  return (
    <div className="bg-bg-card rounded-card border border-divider overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-divider bg-bg-hover/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm">📊</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-text-primary">Quick Stats</h3>
              <p className="text-[10px] sm:text-xs text-text-muted">
                {hasRealData ? 'Live data' : 'AI estimated'}
              </p>
            </div>
          </div>
          {hasRealData && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-success">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
              Real data
            </span>
          )}
        </div>
      </div>

      {/* Stats Content */}
      <div className="p-4 sm:p-5">
        {/* Team Stats Comparison */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-5">
          {/* Home Team Column */}
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-text-muted mb-2 truncate" title={matchInfo.homeTeam}>
              {matchInfo.homeTeam.split(' ').pop()}
            </p>
            <div className="space-y-2">
              {config.primaryStats.slice(0, 3).map((stat) => (
                <div key={stat.key} className="bg-bg-hover rounded-lg p-2">
                  <span className="text-sm sm:text-base font-bold text-text-primary">
                    {getStatValue(momentumAndForm.homeStats, stat.key)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Labels Column */}
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-text-muted mb-2">Stat</p>
            <div className="space-y-2">
              {config.primaryStats.slice(0, 3).map((stat) => (
                <div key={stat.key} className="p-2 flex items-center justify-center gap-1">
                  <span className="text-xs sm:text-sm">{stat.icon}</span>
                  <span className="text-[10px] sm:text-xs text-text-secondary">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Away Team Column */}
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-text-muted mb-2 truncate" title={matchInfo.awayTeam}>
              {matchInfo.awayTeam.split(' ').pop()}
            </p>
            <div className="space-y-2">
              {config.primaryStats.slice(0, 3).map((stat) => (
                <div key={stat.key} className="bg-bg-hover rounded-lg p-2">
                  <span className="text-sm sm:text-base font-bold text-text-primary">
                    {getStatValue(momentumAndForm.awayStats, stat.key)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-divider my-4"></div>

        {/* Form Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Home Form */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs text-text-muted">{config.formLabel}</span>
              <span className={`text-xs sm:text-sm font-bold ${homeStreak.color}`}>{homeStreak.streak}</span>
            </div>
            <FormBadges form={momentumAndForm.homeForm} />
          </div>

          {/* Away Form */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs text-text-muted">{config.formLabel}</span>
              <span className={`text-xs sm:text-sm font-bold ${awayStreak.color}`}>{awayStreak.streak}</span>
            </div>
            <FormBadges form={momentumAndForm.awayForm} />
          </div>
        </div>

        {/* H2H Summary (if available) */}
        {hasH2H && (
          <>
            <div className="border-t border-divider my-4"></div>
            <div className="bg-bg-hover rounded-lg p-3">
              <p className="text-[10px] sm:text-xs text-text-muted mb-2 text-center">
                Head-to-Head ({h2h!.totalMatches} matches)
              </p>
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                <div className="text-center">
                  <span className="text-lg sm:text-xl font-bold text-success">{h2h!.homeWins}</span>
                  <p className="text-[10px] sm:text-xs text-text-muted">Home</p>
                </div>
                <div className="text-center">
                  <span className="text-lg sm:text-xl font-bold text-text-secondary">{h2h!.draws}</span>
                  <p className="text-[10px] sm:text-xs text-text-muted">Draws</p>
                </div>
                <div className="text-center">
                  <span className="text-lg sm:text-xl font-bold text-info">{h2h!.awayWins}</span>
                  <p className="text-[10px] sm:text-xs text-text-muted">Away</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
