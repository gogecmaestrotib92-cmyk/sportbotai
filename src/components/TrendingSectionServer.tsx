/**
 * Trending Section - Server Component Version
 * 
 * Fetches trending matches on the server to avoid blocking LCP.
 * Uses ISR caching for performance.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { TrendingMatch, getTrendingMatches } from '@/components/match-selector/trending';
import TrendingGrid from './TrendingGrid';
import { MatchData } from '@/types';

// Fetch trending matches on server with caching
async function fetchTrendingMatches(maxMatches: number = 6): Promise<TrendingMatch[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sportbotai.com';
  
  const sportsToFetch = [
    'soccer_epl',
    'soccer_spain_la_liga',
    'soccer_uefa_champs_league',
    'basketball_nba',
    'americanfootball_nfl',
    'icehockey_nhl',
  ];

  const allMatches: TrendingMatch[] = [];

  try {
    // Fetch in parallel with timeout
    const responses = await Promise.allSettled(
      sportsToFetch.map(sport =>
        fetch(`${baseUrl}/api/match-data?sportKey=${sport}&includeOdds=false`, {
          next: { revalidate: 300 }, // Cache for 5 minutes
        }).then(res => res.ok ? res.json() : null)
      )
    );

    for (const response of responses) {
      if (response.status === 'fulfilled' && response.value?.events) {
        const trending = getTrendingMatches(response.value.events as MatchData[], 10);
        allMatches.push(...trending);
      }
    }

    // Sort by hot score and take top matches
    return allMatches
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, maxMatches);
  } catch (error) {
    console.error('Failed to fetch trending matches:', error);
    return [];
  }
}

// Loading skeleton
function TrendingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-[140px] rounded-xl bg-bg-card animate-pulse border border-divider" />
      ))}
    </div>
  );
}

// Server component that fetches and renders
async function TrendingContent({ maxMatches, locale }: { maxMatches: number; locale: 'en' | 'sr' }) {
  const matches = await fetchTrendingMatches(maxMatches);

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">{locale === 'sr' ? 'Trenutno nema popularnih mečeva' : 'No trending matches right now'}</p>
        <Link href={locale === 'sr' ? '/sr/matches' : '/matches'} className="btn-primary">
          {locale === 'sr' ? 'Pregled svih mečeva' : 'Browse all matches'}
        </Link>
      </div>
    );
  }

  return <TrendingGrid matches={matches} locale={locale} />;
}

interface TrendingSectionServerProps {
  maxMatches?: number;
  locale?: 'en' | 'sr';
}

export default function TrendingSectionServer({ maxMatches = 6, locale = 'en' }: TrendingSectionServerProps) {
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
              <h2 className="text-xl sm:text-2xl font-bold text-white">{locale === 'sr' ? 'Popularni Mečevi' : 'Trending Matches'}</h2>
              <p className="text-sm text-gray-400">{locale === 'sr' ? 'Najpopularniji mečevi koji se trenutno dešavaju' : 'Top matches happening now'}</p>
            </div>
          </div>
          <Link 
            href={locale === 'sr' ? '/sr/matches' : '/matches'}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium hidden sm:flex items-center gap-1 transition-colors"
          >
            {locale === 'sr' ? 'Svi mečevi' : 'View all'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Content with Suspense for streaming */}
        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingContent maxMatches={maxMatches} locale={locale} />
        </Suspense>

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden text-center">
          <Link href={locale === 'sr' ? '/sr/matches' : '/matches'} className="btn-secondary inline-flex items-center gap-2">
            {locale === 'sr' ? 'Svi mečevi' : 'View all matches'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
