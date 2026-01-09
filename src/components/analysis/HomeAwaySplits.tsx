/**
 * Home/Away Splits Component
 * 
 * Side-by-side comparison of how teams perform at home vs away.
 * "Napoli unbeaten at home in 2 years" type stats.
 */

'use client';

import PremiumIcon from '@/components/ui/PremiumIcon';

interface TeamSplits {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  /** Optional highlight stat */
  highlight?: string;
}

interface HomeAwaySplitsProps {
  homeTeam: string;
  awayTeam: string;
  homeTeamAtHome: TeamSplits;
  awayTeamAway: TeamSplits;
  hasDraw?: boolean; // Whether this sport has draws
  scoringUnit?: string; // 'goals', 'points', 'runs', etc.
}

export default function HomeAwaySplits({
  homeTeam,
  awayTeam,
  homeTeamAtHome,
  awayTeamAway,
  hasDraw = true,
  scoringUnit = 'goals',
}: HomeAwaySplitsProps) {
  
  // Get display labels based on sport
  const getLabels = () => {
    if (scoringUnit === 'points') {
      return { perGame: 'PPG', cleanSheet: 'Blowouts' };
    }
    if (scoringUnit === 'runs') {
      return { perGame: 'Runs/Game', cleanSheet: 'Shutouts' };
    }
    return { perGame: 'Goals/Game', cleanSheet: 'Clean Sheets' };
  };
  
  const labels = getLabels();
  
  // Format record string based on sport
  const formatRecord = (splits: TeamSplits) => {
    if (hasDraw) {
      return `${splits.wins}W-${splits.draws}D-${splits.losses}L`;
    }
    return `${splits.wins}W-${splits.losses}L`;
  };

  // Check if we have meaningful data
  const hasHomeData = homeTeamAtHome.played > 0 || homeTeamAtHome.goalsFor > 0;
  const hasAwayData = awayTeamAway.played > 0 || awayTeamAway.goalsFor > 0;
  
  if (!hasHomeData && !hasAwayData) {
    return (
      <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
              <PremiumIcon name="stadium" size="lg" className="text-green-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Home & Away Form</h3>
              <p className="text-xs text-text-muted">This season&apos;s venue-specific records</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-text-muted text-sm">Home/away data not available yet</p>
          <p className="text-text-muted/60 text-xs mt-1">Check back closer to kickoff</p>
        </div>
      </div>
    );
  }
  
  const calcWinRate = (splits: TeamSplits) => 
    splits.played > 0 ? Math.round((splits.wins / splits.played) * 100) : 0;
  
  const calcGoalsPerGame = (splits: TeamSplits) =>
    splits.played > 0 ? (splits.goalsFor / splits.played).toFixed(1) : '0';

  const homeWinRate = calcWinRate(homeTeamAtHome);
  const awayWinRate = calcWinRate(awayTeamAway);

  return (
    <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
            <PremiumIcon name="stadium" size="lg" className="text-green-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Home & Away Form</h3>
            <p className="text-xs text-text-muted">This season&apos;s venue-specific records</p>
          </div>
        </div>
      </div>

      {/* Splits Comparison */}
      <div className="grid grid-cols-2 divide-x divide-white/5">
        {/* Home Team at Home */}
        <div className="p-4">
          <div className="text-center mb-4">
            <span className="text-xs text-text-muted flex items-center justify-center gap-1"><PremiumIcon name="home" size="xs" /> {homeTeam}</span>
            <p className="text-lg font-bold text-white">At Home</p>
          </div>

          {/* Win Rate Circle */}
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90">
                <circle
                  cx="40" cy="40" r="36"
                  className="fill-none stroke-white/10"
                  strokeWidth="6"
                />
                <circle
                  cx="40" cy="40" r="36"
                  className="fill-none stroke-accent"
                  strokeWidth="6"
                  strokeDasharray={`${homeWinRate * 2.26} 226`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{homeWinRate}%</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-center">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Record</span>
              <span className="text-white font-medium">
                {formatRecord(homeTeamAtHome)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">{labels.perGame}</span>
              <span className="text-white font-medium">{calcGoalsPerGame(homeTeamAtHome)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">{labels.cleanSheet}</span>
              <span className="text-white font-medium">{homeTeamAtHome.cleanSheets}</span>
            </div>
          </div>

          {/* Highlight */}
          {homeTeamAtHome.highlight && (
            <div className="mt-3 p-2 bg-accent/10 rounded-lg text-center">
              <p className="text-[10px] text-accent font-medium">{homeTeamAtHome.highlight}</p>
            </div>
          )}
        </div>

        {/* Away Team Away */}
        <div className="p-4">
          <div className="text-center mb-4">
            <span className="text-xs text-text-muted flex items-center justify-center gap-1"><PremiumIcon name="plane" size="xs" /> {awayTeam}</span>
            <p className="text-lg font-bold text-white">Away</p>
          </div>

          {/* Win Rate Circle */}
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90">
                <circle
                  cx="40" cy="40" r="36"
                  className="fill-none stroke-white/10"
                  strokeWidth="6"
                />
                <circle
                  cx="40" cy="40" r="36"
                  className="fill-none stroke-primary"
                  strokeWidth="6"
                  strokeDasharray={`${awayWinRate * 2.26} 226`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{awayWinRate}%</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-center">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Record</span>
              <span className="text-white font-medium">
                {formatRecord(awayTeamAway)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">{labels.perGame}</span>
              <span className="text-white font-medium">{calcGoalsPerGame(awayTeamAway)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">{labels.cleanSheet}</span>
              <span className="text-white font-medium">{awayTeamAway.cleanSheets}</span>
            </div>
          </div>

          {/* Highlight */}
          {awayTeamAway.highlight && (
            <div className="mt-3 p-2 bg-primary/10 rounded-lg text-center">
              <p className="text-[10px] text-primary font-medium">{awayTeamAway.highlight}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
