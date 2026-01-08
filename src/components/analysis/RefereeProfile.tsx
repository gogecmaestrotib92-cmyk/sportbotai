/**
 * Referee Profile Component
 * 
 * Shows referee stats - cards/game, penalties, home bias.
 * Controversial data that gets shared.
 * 
 * COLORS: Uses amber for yellow cards, rose for red cards (design system)
 */

'use client';

import { colors } from '@/lib/design-system';

interface RefereeStats {
  name: string;
  photo?: string;
  matchesThisSeason: number;
  avgYellowCards: number;
  avgRedCards: number;
  avgFouls: number;
  penaltiesAwarded: number;
  homeWinRate: number; // % of matches home team won
  avgAddedTime: number; // minutes
}

interface RefereeProfileProps {
  referee: RefereeStats;
  homeTeam: string;
  awayTeam: string;
}

const StatBar = ({ 
  value, 
  max, 
  label, 
  color = 'bg-accent' 
}: { 
  value: number; 
  max: number; 
  label: string;
  color?: string;
}) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-text-muted font-medium">{label}</span>
        <span className="text-sm font-bold text-white">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default function RefereeProfile({
  referee,
  homeTeam,
  awayTeam,
}: RefereeProfileProps) {
  // Determine if referee is card-happy or lenient
  const isCardHappy = referee.avgYellowCards >= 4.5;
  const isLenient = referee.avgYellowCards < 3;
  const givesLotsPens = referee.penaltiesAwarded >= 5;
  const homeAdvantage = referee.homeWinRate >= 55;

  // Generate insights
  const insights: string[] = [];
  if (isCardHappy) insights.push(`Card-heavy referee (${referee.avgYellowCards.toFixed(1)} yellows/game)`);
  if (isLenient) insights.push(`Lenient with cards (${referee.avgYellowCards.toFixed(1)}/game)`);
  if (givesLotsPens) insights.push(`${referee.penaltiesAwarded} penalties awarded this season`);
  if (homeAdvantage) insights.push(`${referee.homeWinRate.toFixed(0)}% home win rate in his games`);
  if (referee.avgAddedTime >= 6) insights.push(`Adds ${referee.avgAddedTime.toFixed(1)} mins on average`);

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Match Official</h3>
            <p className="text-sm text-text-muted">Referee stats this season</p>
          </div>
        </div>
      </div>

      {/* Referee info */}
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          {/* Referee avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {referee.photo ? (
              <img src={referee.photo} alt={referee.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👨‍⚖️</span>
            )}
          </div>
          <div>
            <h4 className="font-bold text-white text-xl">{referee.name}</h4>
            <p className="text-sm text-text-muted">{referee.matchesThisSeason} matches this season</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400 text-base">🟨</span>
              <span className="text-sm text-text-muted font-medium">Yellows/game</span>
            </div>
            <p className={`text-2xl font-bold ${referee.avgYellowCards >= 4.5 ? 'text-amber-400' : 'text-white'}`}>
              {referee.avgYellowCards.toFixed(1)}
            </p>
          </div>
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-rose-400 text-base">🟥</span>
              <span className="text-sm text-text-muted font-medium">Reds/game</span>
            </div>
            <p className={`text-2xl font-bold ${referee.avgRedCards >= 0.3 ? 'text-rose-400' : 'text-white'}`}>
              {referee.avgRedCards.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">⚽</span>
              <span className="text-sm text-text-muted font-medium">Penalties</span>
            </div>
            <p className="text-2xl font-bold text-white">{referee.penaltiesAwarded}</p>
          </div>
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🏠</span>
              <span className="text-sm text-text-muted font-medium">Home win %</span>
            </div>
            <p className={`text-2xl font-bold ${referee.homeWinRate >= 55 ? 'text-emerald-400' : 'text-white'}`}>
              {referee.homeWinRate.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Visual bars */}
        <div className="space-y-4 mb-6">
          <StatBar 
            value={referee.avgYellowCards} 
            max={6} 
            label="Cards tendency" 
            color={referee.avgYellowCards >= 4.5 ? 'bg-amber-500' : 'bg-white/30'}
          />
          <StatBar 
            value={referee.avgFouls} 
            max={30} 
            label="Fouls/game" 
            color="bg-amber-500"
          />
          <StatBar 
            value={referee.avgAddedTime} 
            max={10} 
            label="Added time (mins)" 
            color="bg-zinc-500"
          />
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-bold text-white uppercase tracking-wider">Key Insights</h5>
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-accent mt-0.5">•</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5">
        <p className="text-xs text-text-muted text-center">
          Stats from {referee.matchesThisSeason} matches officiated this season
        </p>
      </div>
    </div>
  );
}
