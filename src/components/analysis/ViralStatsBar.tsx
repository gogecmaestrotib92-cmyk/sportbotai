/**
 * Viral Stats Bar Component
 * 
 * Horizontal bar of shareable, screenshot-worthy stats.
 * H2H record and Key absence/Streak - the stuff people share.
 * 
 * Note: Form is shown in UniversalSignalsDisplay, not here.
 */

'use client';

import PremiumIcon from '@/components/ui/PremiumIcon';

interface ViralStatsBarProps {
  homeTeam: string;
  awayTeam: string;
  hasDraw?: boolean; // Whether this sport has draws
  stats: {
    h2h: {
      /** e.g., "7 matches unbeaten" or "3 wins in a row" */
      headline: string;
      /** Who has the upper hand */
      favors: 'home' | 'away' | 'even';
    };
    form?: {
      home: string; // "WWWDL" - kept for API compat but not displayed
      away: string; // "LDWWW"
    };
    keyAbsence?: {
      team: 'home' | 'away';
      player: string;
      impact: 'star' | 'key' | 'rotation';
    };
    streak?: {
      text: string; // "5 wins in a row"
      team: 'home' | 'away';
    };
  };
}

export default function ViralStatsBar({
  homeTeam,
  awayTeam,
  hasDraw = true,
  stats,
}: ViralStatsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* H2H Record */}
      <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-3">
          <PremiumIcon name="users" size="lg" className="text-white" />
          <span className="matrix-label">Head to Head</span>
        </div>
        <p className="text-base font-bold text-white mb-2">{stats.h2h.headline}</p>
        <p className="text-sm text-zinc-500">
          {stats.h2h.favors === 'home' ? `${homeTeam} dominates` : 
           stats.h2h.favors === 'away' ? `${awayTeam} dominates` : 
           'Evenly matched'}
        </p>
      </div>

      {/* Key Absence or Streak */}
      {stats.keyAbsence ? (
        <div className="rounded-2xl bg-[#0a0a0b] border border-red-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <PremiumIcon name="alert" size="lg" className="text-red-400" />
            <span className="matrix-label !text-red-400/80">Key Absence</span>
          </div>
          <p className="text-base font-bold text-white mb-2">
            {stats.keyAbsence.player} OUT
          </p>
          <p className="text-sm text-zinc-500">
            {stats.keyAbsence.team === 'home' ? homeTeam : awayTeam} without their {stats.keyAbsence.impact === 'star' ? 'star player' : stats.keyAbsence.impact === 'key' ? 'key player' : 'squad player'}
          </p>
        </div>
      ) : stats.streak ? (
        <div className="rounded-2xl bg-[#0a0a0b] border border-emerald-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <PremiumIcon name="fire" size="lg" className="text-emerald-400" />
            <span className="matrix-label !text-emerald-400/80">Hot Streak</span>
          </div>
          <p className="text-base font-bold text-white mb-2">
            {stats.streak.text}
          </p>
          <p className="text-sm text-zinc-500">
            {stats.streak.team === 'home' ? homeTeam : awayTeam} on fire
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5">
          <div className="flex items-center gap-2 mb-3">
            <PremiumIcon name="check" size="lg" className="text-emerald-400" />
            <span className="matrix-label">Squad Status</span>
          </div>
          <p className="text-base font-bold text-white mb-2">Full Strength</p>
          <p className="text-sm text-zinc-500">No major absences reported</p>
        </div>
      )}
    </div>
  );
}
