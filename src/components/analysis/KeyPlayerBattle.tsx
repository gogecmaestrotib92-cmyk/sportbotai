/**
 * Key Player Battle Component
 * 
 * Head-to-head comparison of key players.
 * "Haaland vs Van Dijk" - the battles people screenshot.
 */

'use client';

interface PlayerStats {
  name: string;
  position: string;
  photo?: string;
  seasonGoals: number;
  seasonAssists: number;
  form: string; // "WWDLW" last 5 games
  minutesPlayed: number;
  rating?: number; // Average rating if available
}

interface KeyPlayerBattleProps {
  homeTeam: string;
  awayTeam: string;
  homePlayer: PlayerStats;
  awayPlayer: PlayerStats;
  battleType: 'attack-vs-defense' | 'midfield-duel' | 'top-scorers';
}

const battleLabels = {
  'attack-vs-defense': { icon: '⚔️', title: 'Key Matchup', subtitle: 'Attack meets Defense' },
  'midfield-duel': { icon: '🎯', title: 'Midfield Battle', subtitle: 'Who controls the game?' },
  'top-scorers': { icon: '🔥', title: 'Goal Threat', subtitle: 'Top scorers head-to-head' },
};

const FormBadge = ({ result }: { result: string }) => {
  const colors: Record<string, string> = {
    'W': 'bg-green-500',
    'D': 'bg-yellow-500',
    'L': 'bg-red-500',
  };
  return (
    <span className={`w-5 h-5 rounded text-[9px] font-bold text-white flex items-center justify-center ${colors[result] || 'bg-gray-500'}`}>
      {result}
    </span>
  );
};

export default function KeyPlayerBattle({
  homeTeam,
  awayTeam,
  homePlayer,
  awayPlayer,
  battleType,
}: KeyPlayerBattleProps) {
  const battle = battleLabels[battleType];

  const renderPlayerCard = (player: PlayerStats, team: string, isHome: boolean) => {
    const formArray = player.form.slice(-5).split('');
    const totalContributions = player.seasonGoals + player.seasonAssists;

    return (
      <div className={`flex-1 p-4 ${isHome ? 'pr-2' : 'pl-2'}`}>
        {/* Player avatar placeholder */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {player.photo ? (
              <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">⚽</span>
            )}
          </div>
        </div>

        {/* Player name & position */}
        <div className="text-center mb-3">
          <h4 className="font-bold text-white text-sm truncate">{player.name}</h4>
          <p className="text-xs text-text-muted">{player.position}</p>
          <p className="text-[10px] text-text-muted/60 mt-0.5">{team}</p>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Goals</span>
            <span className="text-sm font-bold text-white">{player.seasonGoals}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Assists</span>
            <span className="text-sm font-bold text-white">{player.seasonAssists}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">G+A</span>
            <span className="text-sm font-bold text-accent">{totalContributions}</span>
          </div>
          {player.rating && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Rating</span>
              <span className={`text-sm font-bold ${player.rating >= 7 ? 'text-emerald-400' : player.rating >= 6 ? 'text-amber-400' : 'text-rose-400'}`}>
                {player.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[10px] text-text-muted mb-1.5 text-center">Form (last 5)</p>
          <div className="flex justify-center gap-1">
            {formArray.map((result, i) => (
              <FormBadge key={i} result={result} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Determine who has the edge
  const homeScore = homePlayer.seasonGoals * 2 + homePlayer.seasonAssists + (homePlayer.rating || 0);
  const awayScore = awayPlayer.seasonGoals * 2 + awayPlayer.seasonAssists + (awayPlayer.rating || 0);
  const edge = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'even';

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">{battle.icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">{battle.title}</h3>
            <p className="text-xs text-text-muted">{battle.subtitle}</p>
          </div>
          {edge !== 'even' && (
            <div className={`px-2 py-1 rounded-lg text-[10px] font-medium ${
              edge === 'home' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {edge === 'home' ? homePlayer.name.split(' ').pop() : awayPlayer.name.split(' ').pop()} ↑
            </div>
          )}
        </div>
      </div>

      {/* Battle content */}
      <div className="flex">
        {renderPlayerCard(homePlayer, homeTeam, true)}
        
        {/* VS divider */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <span className="text-lg font-bold text-primary my-2">VS</span>
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        </div>
        
        {renderPlayerCard(awayPlayer, awayTeam, false)}
      </div>

      {/* Footer insight */}
      <div className="px-5 py-3 bg-white/[0.02] border-t border-white/5">
        <p className="text-[10px] text-text-muted text-center">
          Season stats • Form based on team results when player featured
        </p>
      </div>
    </div>
  );
}
