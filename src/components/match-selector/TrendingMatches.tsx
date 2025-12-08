'use client';

import { TrendingMatch } from './trending';
import { TrendingMatchCard } from './TrendingMatchCard';

interface TrendingMatchesProps {
  matches: TrendingMatch[];
  selectedMatchId: string | null;
  onSelectMatch: (match: TrendingMatch) => void;
  isLoading?: boolean;
}

/**
 * Trending/Hot matches section with snap-scroll on mobile
 * Vertical grid on mobile, horizontal scroll on desktop
 */
export function TrendingMatches({ 
  matches, 
  selectedMatchId, 
  onSelectMatch,
  isLoading = false,
}: TrendingMatchesProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-danger rounded-btn flex items-center justify-center">
            <span className="text-white text-sm">🔥</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Hot Picks</h3>
            <p className="text-xs text-text-muted">Loading trending matches...</p>
          </div>
        </div>
        
        {/* Mobile: Vertical skeleton */}
        <div className="grid grid-cols-1 sm:hidden gap-3">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="h-[100px] rounded-card bg-bg-hover animate-pulse"
            />
          ))}
        </div>
        
        {/* Desktop: Horizontal skeleton */}
        <div className="hidden sm:flex gap-3 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className="flex-shrink-0 w-[220px] h-[130px] rounded-card bg-bg-hover animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-danger rounded-btn flex items-center justify-center shadow-sm">
            <span className="text-white text-sm">🔥</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Hot Picks</h3>
            <p className="text-xs text-text-muted">{matches.length} trending matches</p>
          </div>
        </div>
        <span className="text-[10px] text-text-muted hidden md:block bg-bg-hover px-2 py-1 rounded-chip">
          Based on coverage & importance
        </span>
      </div>

      {/* Mobile: Vertical Stack (2 columns on larger mobile) */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:hidden gap-3">
        {matches.slice(0, 6).map((match) => (
          <TrendingMatchCard
            key={match.matchId}
            match={match}
            isSelected={selectedMatchId === match.matchId}
            onSelect={onSelectMatch}
            variant="compact"
          />
        ))}
      </div>

      {/* Desktop: Horizontal Scroll with snap */}
      <div className="hidden sm:block relative">
        {/* Gradient fade on right edge */}
        <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {matches.map((match) => (
            <TrendingMatchCard
              key={match.matchId}
              match={match}
              isSelected={selectedMatchId === match.matchId}
              onSelect={onSelectMatch}
              variant="default"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
