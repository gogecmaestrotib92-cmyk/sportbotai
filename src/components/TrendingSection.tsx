/**
 * Trending Section for Homepage
 * 
 * Displays live trending matches from the API on the homepage.
 * Creates daily check-in habit by showing today's interesting matches.
 * Links to match preview pages for the pre-match intelligence experience.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingMatch, getTrendingMatches } from '@/components/match-selector/trending';
import MatchCard from '@/components/MatchCard';
import { StaggeredItem } from '@/components/ui';
import { MatchData } from '@/types';

interface TrendingSectionProps {
  maxMatches?: number;
}

export default function TrendingSection({ maxMatches = 6 }: TrendingSectionProps) {
  const [matches, setMatches] = useState<TrendingMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrendingMatches() {
      try {
        setIsLoading(true);
        
        // Fetch matches from multiple sports
        const sportsToFetch = [
          'soccer_epl',
          'soccer_spain_la_liga', 
          'soccer_uefa_champs_league',
          'basketball_nba',
          'americanfootball_nfl',
          'icehockey_nhl',
        ];
        
        const allMatches: TrendingMatch[] = [];
        
        // Fetch in parallel
        const responses = await Promise.allSettled(
          sportsToFetch.map(sport =>
            fetch(`/api/match-data?sportKey=${sport}&includeOdds=false`)
              .then(res => res.json())
          )
        );
        
        for (const response of responses) {
          if (response.status === 'fulfilled' && response.value.events) {
            const trending = getTrendingMatches(response.value.events as MatchData[], 10);
            allMatches.push(...trending);
          }
        }
        
        // Sort by hot score and take top matches
        const sorted = allMatches
          .sort((a, b) => b.hotScore - a.hotScore)
          .slice(0, maxMatches);
        
        setMatches(sorted);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch trending matches:', err);
        setError('Failed to load trending matches');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrendingMatches();
  }, [maxMatches]);

  // Format time until match
  const formatTimeUntil = (dateString: string) => {
    const matchDate = new Date(dateString);
    const now = new Date();
    const diffMs = matchDate.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Live';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  // Get derby/rivalry tags from hotFactors
  const getMatchTags = (match: TrendingMatch): string[] => {
    const tags: string[] = [];
    if (match.hotFactors.derbyScore > 0) tags.push('Derby');
    if (match.hotFactors.leagueScore >= 9) tags.push('Top League');
    if (match.hotFactors.proximityScore >= 8) tags.push('Starting Soon');
    if (match.hotFactors.bookmakerScore >= 7) tags.push('High Interest');
    return tags;
  };

  if (error) {
    return null; // Silently fail on homepage
  }

  return (
    <section id="trending" className="py-12 sm:py-16 bg-bg-primary scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Trending Matches</h2>
              <p className="text-sm text-gray-400">Top matches happening now</p>
            </div>
          </div>
          <Link 
            href="/matches"
            className="text-sm text-blue-400 hover:text-blue-300 font-medium hidden sm:flex items-center gap-1 transition-colors"
          >
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[140px] rounded-xl bg-bg-card animate-pulse border border-divider" />
            ))}
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && matches.length > 0 && (
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
                  />
                </StaggeredItem>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No trending matches right now</p>
            <Link href="/matches" className="btn-primary">
              Browse all matches
            </Link>
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden text-center">
          <Link href="/matches" className="btn-secondary inline-flex items-center gap-2">
            View all matches
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
