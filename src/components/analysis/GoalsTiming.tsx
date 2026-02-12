/**
 * Goals Timing Component
 * 
 * Shows when teams typically score & concede.
 * "80% of their goals come after 70th minute" type insights.
 */

'use client';

import PremiumIcon from '@/components/ui/PremiumIcon';

interface GoalsTimingData {
  /** Goals by time period */
  scoring: {
    '0-15': number;
    '16-30': number;
    '31-45': number;
    '46-60': number;
    '61-75': number;
    '76-90': number;
  };
  /** Conceding by time period */
  conceding: {
    '0-15': number;
    '16-30': number;
    '31-45': number;
    '46-60': number;
    '61-75': number;
    '76-90': number;
  };
  /** Pre-generated insight */
  insight?: string;
}

interface GoalsTimingProps {
  homeTeam: string;
  awayTeam: string;
  homeTiming: GoalsTimingData;
  awayTiming: GoalsTimingData;
}

const periods = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90'] as const;
const periodLabels = ['0-15\'', '16-30\'', '31-45\'', '46-60\'', '61-75\'', '76-90\''];

export default function GoalsTiming({
  homeTeam,
  awayTeam,
  homeTiming,
  awayTiming,
}: GoalsTimingProps) {
  
  // Calculate total goals for percentages
  const totalHomeScoring = Object.values(homeTiming.scoring).reduce((a, b) => a + b, 0);
  const totalAwayScoring = Object.values(awayTiming.scoring).reduce((a, b) => a + b, 0);
  
  // Check if we have any meaningful data
  const hasData = totalHomeScoring > 0 || totalAwayScoring > 0;

  // Find peak scoring times
  const findPeak = (data: GoalsTimingData['scoring']) => {
    let maxPeriod = '0-15';
    let maxGoals = 0;
    for (const period of periods) {
      if (data[period] > maxGoals) {
        maxGoals = data[period];
        maxPeriod = period;
      }
    }
    return { period: maxPeriod, goals: maxGoals };
  };

  const homePeak = findPeak(homeTiming.scoring);
  const awayPeak = findPeak(awayTiming.scoring);

  // If no data, show simplified card
  if (!hasData) {
    return (
      <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
              <PremiumIcon name="clock" size="lg" className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Goals Timing</h3>
              <p className="text-xs text-zinc-500">When teams score their goals</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm text-zinc-500">
            Goals timing data will be available once the season progresses.
          </p>
          <p className="text-xs text-zinc-600 mt-2">
            Watch for patterns as more matches are played.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
            <PremiumIcon name="clock" size="lg" className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Goals Timing</h3>
            <p className="text-xs text-zinc-500">When teams score their goals</p>
          </div>
        </div>
      </div>

      {/* Peak Times Highlight */}
      <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.06] grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-1">{homeTeam} most dangerous</p>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/15 text-emerald-400 text-sm font-bold rounded">
            <PremiumIcon name="bolt" size="sm" /> {homePeak.period}&apos;
          </span>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-1">{awayTeam} most dangerous</p>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/15 text-blue-400 text-sm font-bold rounded">
            <PremiumIcon name="bolt" size="sm" /> {awayPeak.period}&apos;
          </span>
        </div>
      </div>

      {/* Timing Charts */}
      <div className="p-5 space-y-6">
        {/* Home Team */}
        <div>
          <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><PremiumIcon name="home" size="xs" /> {homeTeam} scoring by period</p>
          <div className="flex items-end gap-1 h-16">
            {periods.map((period, index) => {
              const goals = homeTiming.scoring[period];
              const percent = totalHomeScoring > 0 ? (goals / totalHomeScoring) * 100 : 0;
              const height = Math.max(10, percent);
              
              return (
                <div key={period} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-emerald-500/60 rounded-t transition-all hover:bg-emerald-500"
                    style={{ height: `${height}%` }}
                    title={`${goals} goals (${Math.round(percent)}%)`}
                  />
                  <span className="text-[9px] text-zinc-600">{periodLabels[index]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Away Team */}
        <div>
          <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><PremiumIcon name="plane" size="xs" /> {awayTeam} scoring by period</p>
          <div className="flex items-end gap-1 h-16">
            {periods.map((period, index) => {
              const goals = awayTiming.scoring[period];
              const percent = totalAwayScoring > 0 ? (goals / totalAwayScoring) * 100 : 0;
              const height = Math.max(10, percent);
              
              return (
                <div key={period} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-blue-500/60 rounded-t transition-all hover:bg-blue-500"
                    style={{ height: `${height}%` }}
                    title={`${goals} goals (${Math.round(percent)}%)`}
                  />
                  <span className="text-[9px] text-zinc-600">{periodLabels[index]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights */}
      {(homeTiming.insight || awayTiming.insight) && (
        <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.06]">
          <p className="text-xs text-zinc-500 flex items-center gap-1.5">
            <PremiumIcon name="lightbulb" size="sm" className="text-amber-400" /> {homeTiming.insight || awayTiming.insight}
          </p>
        </div>
      )}
    </div>
  );
}
