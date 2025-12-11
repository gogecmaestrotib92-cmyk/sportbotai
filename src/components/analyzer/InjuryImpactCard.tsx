/**
 * Injury Impact Card Component
 * 
 * Displays injury/suspension data with impact analysis.
 * Shows:
 * - List of absent players per team
 * - Player importance (KEY, STARTER, ROTATION)
 * - Individual impact scores
 * - Overall match impact assessment
 * - Advantage shift indicator
 * 
 * Desktop-optimized with side-by-side team comparison.
 */

'use client';

import { InjuryContext, InjuredPlayer, TeamInjuryContext } from '@/types';
import TeamLogo from '../ui/TeamLogo';

interface InjuryImpactCardProps {
  injuryContext: InjuryContext;
  homeTeam: string;
  awayTeam: string;
  sport?: string;
}

// Impact level colors and labels
const IMPACT_CONFIG = {
  NONE: { color: 'text-text-muted', bg: 'bg-white/5', label: 'No Impact' },
  LOW: { color: 'text-success', bg: 'bg-success/10', label: 'Low Impact' },
  MEDIUM: { color: 'text-warning', bg: 'bg-warning/10', label: 'Medium Impact' },
  HIGH: { color: 'text-danger', bg: 'bg-danger/10', label: 'High Impact' },
  CRITICAL: { color: 'text-danger', bg: 'bg-danger/20', label: 'Critical Impact' },
};

// Player importance badges
const IMPORTANCE_BADGE = {
  KEY: { label: 'KEY', color: 'bg-danger/20 text-danger border-danger/30' },
  STARTER: { label: 'STARTER', color: 'bg-warning/20 text-warning border-warning/30' },
  ROTATION: { label: 'ROTATION', color: 'bg-white/10 text-text-secondary border-white/10' },
  BACKUP: { label: 'BACKUP', color: 'bg-white/5 text-text-muted border-white/5' },
};

// Injury type icons
const INJURY_ICONS = {
  injury: '🏥',
  suspension: '🟥',
  doubtful: '❓',
};

function PlayerCard({ player }: { player: InjuredPlayer }) {
  const importance = player.importance || 'ROTATION';
  const badge = IMPORTANCE_BADGE[importance];
  const icon = INJURY_ICONS[player.type] || '⚠️';
  
  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg hover:bg-white/8 transition-colors">
      {/* Icon */}
      <span className="text-lg flex-shrink-0" title={player.type}>
        {icon}
      </span>
      
      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-white text-sm truncate">
            {player.name}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.color} whitespace-nowrap`}>
            {badge.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-secondary truncate">
            {player.position}
          </span>
          <span className="text-xs text-text-muted">•</span>
          <span className="text-xs text-text-muted truncate">
            {player.reason}
          </span>
        </div>
      </div>
      
      {/* Impact Score */}
      {player.impactScore && (
        <div className="flex-shrink-0 text-right">
          <div className={`text-sm font-bold ${player.impactScore >= 7 ? 'text-danger' : player.impactScore >= 4 ? 'text-warning' : 'text-text-secondary'}`}>
            {player.impactScore}/10
          </div>
          <div className="text-[10px] text-text-muted">Impact</div>
        </div>
      )}
    </div>
  );
}

function TeamInjurySection({ 
  context, 
  teamName, 
  isHome,
  sport 
}: { 
  context: TeamInjuryContext | null; 
  teamName: string;
  isHome: boolean;
  sport: string;
}) {
  if (!context || context.players.length === 0) {
    return (
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <TeamLogo teamName={teamName} sport={sport} size="md" />
          <h4 className="font-semibold text-white text-sm">{teamName}</h4>
          <span className="text-xs text-text-muted">{isHome ? '(Home)' : '(Away)'}</span>
        </div>
        <div className="p-4 bg-success/5 border border-success/20 rounded-lg text-center">
          <span className="text-success text-sm">✓ No reported absences</span>
        </div>
      </div>
    );
  }
  
  // Sort players by importance (KEY first)
  const sortedPlayers = [...context.players].sort((a, b) => {
    const order = { KEY: 0, STARTER: 1, ROTATION: 2, BACKUP: 3 };
    return (order[a.importance || 'ROTATION'] || 2) - (order[b.importance || 'ROTATION'] || 2);
  });
  
  return (
    <div className="flex-1">
      {/* Header with team name and summary */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TeamLogo teamName={teamName} sport={sport} size="md" />
          <h4 className="font-semibold text-white text-sm">{teamName}</h4>
          <span className="text-xs text-text-muted">{isHome ? '(Home)' : '(Away)'}</span>
        </div>
        <div className="text-right">
          <div className={`text-xs font-medium ${context.totalImpactScore >= 50 ? 'text-danger' : context.totalImpactScore >= 25 ? 'text-warning' : 'text-text-secondary'}`}>
            {context.totalImpactScore}% impact
          </div>
        </div>
      </div>
      
      {/* Key absences count */}
      {context.keyAbsences > 0 && (
        <div className="mb-2 px-2 py-1 bg-danger/10 border border-danger/20 rounded text-xs text-danger">
          ⚠️ {context.keyAbsences} key player{context.keyAbsences > 1 ? 's' : ''} unavailable
        </div>
      )}
      
      {/* Player list */}
      <div className="space-y-2">
        {sortedPlayers.slice(0, 5).map((player, idx) => (
          <PlayerCard key={`${player.name}-${idx}`} player={player} />
        ))}
        {sortedPlayers.length > 5 && (
          <div className="text-xs text-text-muted text-center py-1">
            +{sortedPlayers.length - 5} more
          </div>
        )}
      </div>
    </div>
  );
}

export default function InjuryImpactCard({ 
  injuryContext, 
  homeTeam, 
  awayTeam,
  sport = 'soccer'
}: InjuryImpactCardProps) {
  const impactConfig = IMPACT_CONFIG[injuryContext.overallImpact];
  
  return (
    <div className="bg-bg-card rounded-xl sm:rounded-2xl border border-white/10 shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">🏥</span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Squad Availability
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary">
                Injuries & Suspensions Impact
              </p>
            </div>
          </div>
          
          {/* Overall Impact Badge */}
          <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${impactConfig.bg}`}>
            <span className={`text-xs sm:text-sm font-semibold ${impactConfig.color}`}>
              {impactConfig.label}
            </span>
          </div>
        </div>
      </div>
      
      {/* Impact Summary */}
      {injuryContext.impactSummary && (
        <div className="px-4 sm:px-6 py-3 bg-white/3 border-b border-white/5">
          <p className="text-sm text-text-secondary">
            {injuryContext.impactSummary}
          </p>
          
          {/* Advantage Shift Indicator */}
          {injuryContext.advantageShift && injuryContext.advantageShift !== 'NEUTRAL' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-accent">📈</span>
              <span className="text-xs text-accent">
                {injuryContext.advantageShift === 'HOME' ? homeTeam : awayTeam} has squad advantage
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Team Comparison - Side by Side on Desktop */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <TeamInjurySection 
            context={injuryContext.homeTeam} 
            teamName={homeTeam}
            isHome={true}
            sport={sport}
          />
          
          {/* Divider - visible on mobile, hidden on desktop where grid gap handles it */}
          <div className="lg:hidden border-t border-white/10 -mx-4 sm:-mx-6"></div>
          
          <TeamInjurySection 
            context={injuryContext.awayTeam} 
            teamName={awayTeam}
            isHome={false}
            sport={sport}
          />
        </div>
      </div>
      
      {/* Data Source Footer */}
      <div className="px-4 sm:px-6 py-2 border-t border-white/5 bg-white/2">
        <p className="text-[10px] sm:text-xs text-text-muted text-center">
          📡 Data from API-Football • Updated within 24h
        </p>
      </div>
    </div>
  );
}
