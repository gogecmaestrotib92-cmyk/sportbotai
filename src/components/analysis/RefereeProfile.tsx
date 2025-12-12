/**
 * Referee Profile Component
 * 
 * Shows referee stats - cards/game, penalties, home bias.
 * Controversial data that gets shared.
 */

'use client';

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
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-xs font-bold text-white">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
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
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">🎯</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">Match Official</h3>
            <p className="text-xs text-text-muted">Referee stats this season</p>
          </div>
        </div>
      </div>

      {/* Referee info */}
      <div className="p-5">
        <div className="flex items-center gap-4 mb-5">
          {/* Referee avatar */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {referee.photo ? (
              <img src={referee.photo} alt={referee.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">👨‍⚖️</span>
            )}
          </div>
          <div>
            <h4 className="font-bold text-white text-lg">{referee.name}</h4>
            <p className="text-xs text-text-muted">{referee.matchesThisSeason} matches this season</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400 text-sm">🟨</span>
              <span className="text-xs text-text-muted">Yellows/game</span>
            </div>
            <p className={`text-xl font-bold ${referee.avgYellowCards >= 4.5 ? 'text-yellow-400' : 'text-white'}`}>
              {referee.avgYellowCards.toFixed(1)}
            </p>
          </div>
          <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-400 text-sm">🟥</span>
              <span className="text-xs text-text-muted">Reds/game</span>
            </div>
            <p className={`text-xl font-bold ${referee.avgRedCards >= 0.3 ? 'text-red-400' : 'text-white'}`}>
              {referee.avgRedCards.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">⚽</span>
              <span className="text-xs text-text-muted">Penalties</span>
            </div>
            <p className="text-xl font-bold text-white">{referee.penaltiesAwarded}</p>
          </div>
          <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🏠</span>
              <span className="text-xs text-text-muted">Home win %</span>
            </div>
            <p className={`text-xl font-bold ${referee.homeWinRate >= 55 ? 'text-green-400' : 'text-white'}`}>
              {referee.homeWinRate.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Visual bars */}
        <div className="space-y-3 mb-5">
          <StatBar 
            value={referee.avgYellowCards} 
            max={6} 
            label="Cards tendency" 
            color={referee.avgYellowCards >= 4.5 ? 'bg-yellow-500' : 'bg-white/30'}
          />
          <StatBar 
            value={referee.avgFouls} 
            max={30} 
            label="Fouls/game" 
            color="bg-orange-500"
          />
          <StatBar 
            value={referee.avgAddedTime} 
            max={10} 
            label="Added time (mins)" 
            color="bg-blue-500"
          />
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider">Key Insights</h5>
            <div className="space-y-1.5">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="text-accent mt-0.5">•</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-white/[0.02] border-t border-white/5">
        <p className="text-[10px] text-text-muted text-center">
          Stats from {referee.matchesThisSeason} matches officiated this season
        </p>
      </div>
    </div>
  );
}
