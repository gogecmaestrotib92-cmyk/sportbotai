/**
 * Trending Grid - Client Component
 * 
 * Renders the trending matches grid with animations.
 * Data is passed from server component, no client fetching.
 */

'use client';

import { TrendingMatch } from '@/components/match-selector/trending';
import MatchCard from '@/components/MatchCard';
import { StaggeredItem } from '@/components/ui';

interface TrendingGridProps {
  matches: TrendingMatch[];
  locale?: 'en' | 'sr';
}

// Get derby/rivalry tags from hotFactors
function getMatchTags(match: TrendingMatch): string[] {
  const tags: string[] = [];
  if (match.hotFactors.derbyScore > 0) tags.push('Derby');
  if (match.hotFactors.leagueScore >= 9) tags.push('Top League');
  if (match.hotFactors.proximityScore >= 8) tags.push('Starting Soon');
  if (match.hotFactors.bookmakerScore >= 7) tags.push('High Interest');
  return tags;
}

export default function TrendingGrid({ matches, locale = 'en' }: TrendingGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match, index) => {
        const tags = getMatchTags(match);
        return (
          <StaggeredItem key={match.matchId} index={index} staggerDelay={60} initialDelay={100}>
            <MatchCard
              matchId={match.matchId}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              league={match.league}
              sportKey={match.sportKey}
              commenceTime={match.commenceTime}
              hotScore={match.hotScore}
              tags={tags}
              locale={locale}
            />
          </StaggeredItem>
        );
      })}
    </div>
  );
}
