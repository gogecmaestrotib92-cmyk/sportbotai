'use client';

import { TrendingMatch } from './trending';

interface TrendingMatchCardProps {
  match: TrendingMatch;
  isSelected: boolean;
  onSelect: (match: TrendingMatch) => void;
  variant?: 'default' | 'compact';
}

/**
 * Premium card for displaying a trending/hot match
 * Supports compact variant for mobile vertical stacking
 */
export function TrendingMatchCard({ 
  match, 
  isSelected, 
  onSelect,
  variant = 'default' 
}: TrendingMatchCardProps) {
  const matchDate = new Date(match.commenceTime);
  const isToday = new Date().toDateString() === matchDate.toDateString();
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === matchDate.toDateString();
  
  const timeStr = matchDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const dateStr = isToday 
    ? `Today ${timeStr}`
    : isTomorrow 
      ? `Tomorrow ${timeStr}`
      : matchDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

  // Get best odds for display
  const odds = match.odds ? { 
    home: match.odds.home, 
    away: match.odds.away 
  } : null;

  // Compact variant for mobile
  if (variant === 'compact') {
    return (
      <button
        onClick={() => onSelect(match)}
        className={`
          w-full p-3 rounded-card border text-left transition-all duration-200 active:scale-[0.98]
          ${isSelected 
            ? 'bg-primary border-primary shadow-lg' 
            : 'bg-bg-card border-divider hover:border-primary/30 hover:shadow-sm'
          }
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Hot Badge + League */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[10px] font-semibold">
                🔥 HOT
              </span>
              <span className={`text-[10px] truncate ${isSelected ? 'text-text-muted' : 'text-text-muted'}`}>
                {match.league || match.sport}
              </span>
            </div>

            {/* Teams */}
            <div className="space-y-0.5">
              <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                {match.homeTeam}
              </p>
              <p className={`text-sm truncate ${isSelected ? 'text-text-secondary' : 'text-text-secondary'}`}>
                {match.awayTeam}
              </p>
            </div>
          </div>

          {/* Odds */}
          {odds && (
            <div className="flex flex-col items-end gap-0.5">
              <span className={`text-xs font-mono font-bold ${isSelected ? 'text-accent' : 'text-success'}`}>
                {odds.home.toFixed(2)}
              </span>
              <span className={`text-xs font-mono ${isSelected ? 'text-text-muted' : 'text-text-muted'}`}>
                {odds.away.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between mt-2 pt-2 border-t ${isSelected ? 'border-white/10' : 'border-divider'}`}>
          <span className={`text-[10px] ${isSelected ? 'text-text-muted' : 'text-text-muted'}`}>
            {dateStr}
          </span>
          <span className={`text-[10px] ${isSelected ? 'text-text-muted' : 'text-text-muted'}`}>
            {match.bookmakers?.length || 0} bookmakers
          </span>
        </div>
      </button>
    );
  }

  // Default variant for desktop horizontal scroll
  return (
    <button
      onClick={() => onSelect(match)}
      className={`
        snap-start flex-shrink-0 w-[220px] p-4 rounded-card border text-left transition-all duration-200
        ${isSelected 
          ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
          : 'bg-bg-card border-divider hover:border-primary/30 hover:shadow-md'
        }
      `}
    >
      {/* Header: Hot Badge + Derby indicator */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-btn bg-gradient-to-r from-orange-500/10 to-danger/10 text-orange-500 text-[10px] font-bold uppercase tracking-wide">
          🔥 Hot Pick
        </span>
        {match.hotFactors.derbyScore > 0 && (
          <span className="text-[10px] text-warning font-medium">⚔️ Derby</span>
        )}
      </div>

      {/* League */}
      <p className={`text-[10px] truncate mb-2 ${isSelected ? 'text-text-muted' : 'text-text-muted'}`}>
        {match.league || match.sport}
      </p>

      {/* Teams with Odds */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold truncate flex-1 mr-2 ${isSelected ? 'text-white' : 'text-text-primary'}`}>
            {match.homeTeam}
          </span>
          {odds?.home && (
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/10 text-accent' : 'bg-success/10 text-success'}`}>
              {odds.home.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm truncate flex-1 mr-2 ${isSelected ? 'text-text-secondary' : 'text-text-secondary'}`}>
            {match.awayTeam}
          </span>
          {odds?.away && (
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/10 text-text-secondary' : 'bg-bg-hover text-text-secondary'}`}>
              {odds.away.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between pt-3 border-t ${isSelected ? 'border-white/10' : 'border-divider'}`}>
        <span className={`text-[10px] ${isSelected ? 'text-text-muted' : 'text-text-muted'}`}>
          {dateStr}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/10 text-text-muted' : 'bg-bg-hover text-text-muted'}`}>
          {match.bookmakers?.length || 0} books
        </span>
      </div>
    </button>
  );
}
