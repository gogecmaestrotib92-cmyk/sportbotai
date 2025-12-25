/**
 * Match Browser Component
 * 
 * Browse matches organized by Sport → League.
 * Sports: Soccer, Basketball, American Football, Hockey
 * Links to Match Preview pages.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MatchData } from '@/types';
import MatchCard from '@/components/MatchCard';
import LeagueLogo from '@/components/ui/LeagueLogo';
import CountryFlag, { getCountryForLeague } from '@/components/ui/CountryFlag';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator';

interface MatchBrowserProps {
  initialSport?: string;
  maxMatches?: number;
}

// Sports with their leagues organized
const SPORTS = [
  {
    id: 'soccer',
    name: 'Soccer',
    icon: '⚽',
    leagues: [
      { key: 'soccer_epl', name: 'Premier League' },
      { key: 'soccer_spain_la_liga', name: 'La Liga' },
      { key: 'soccer_germany_bundesliga', name: 'Bundesliga' },
      { key: 'soccer_italy_serie_a', name: 'Serie A' },
      { key: 'soccer_france_ligue_one', name: 'Ligue 1' },
      { key: 'soccer_uefa_champs_league', name: 'Champions League' },
    ],
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    leagues: [
      { key: 'basketball_nba', name: 'NBA' },
      { key: 'basketball_euroleague', name: 'EuroLeague' },
    ],
  },
  {
    id: 'americanfootball',
    name: 'American Football',
    icon: '🏈',
    leagues: [
      { key: 'americanfootball_nfl', name: 'NFL' },
      { key: 'americanfootball_ncaaf', name: 'NCAA Football' },
    ],
  },
  {
    id: 'hockey',
    name: 'Hockey',
    icon: '🏒',
    leagues: [
      { key: 'icehockey_nhl', name: 'NHL' },
      { key: 'icehockey_sweden_allsvenskan', name: 'SHL' },
    ],
  },
];

export default function MatchBrowser({ initialSport = 'soccer', maxMatches = 12 }: MatchBrowserProps) {
  const [selectedSport, setSelectedSport] = useState<string>(initialSport);
  const [selectedLeague, setSelectedLeague] = useState<string>('soccer_epl');
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagueMatchCounts, setLeagueMatchCounts] = useState<Record<string, number>>({});

  // Get current sport config
  const currentSport = SPORTS.find(s => s.id === selectedSport) || SPORTS[0];
  const currentLeague = currentSport.leagues.find(l => l.key === selectedLeague) || currentSport.leagues[0];

  // Tournaments that have off-seasons or breaks
  const SEASONAL_LEAGUES = [
    'soccer_uefa_champs_league',
    'soccer_uefa_europa_league', 
    'soccer_uefa_europa_conference_league',
    'americanfootball_ncaaf',
  ];

  // When sport changes, select first league of that sport
  useEffect(() => {
    const sport = SPORTS.find(s => s.id === selectedSport);
    if (sport && sport.leagues.length > 0) {
      setSelectedLeague(sport.leagues[0].key);
    }
  }, [selectedSport]);

  // Pre-fetch match counts for all leagues in current sport (for badges)
  useEffect(() => {
    async function fetchLeagueCounts() {
      const counts: Record<string, number> = {};
      
      // Fetch counts in parallel for all leagues in current sport
      await Promise.all(
        currentSport.leagues.map(async (league) => {
          try {
            const response = await fetch(`/api/match-data?sportKey=${league.key}&includeOdds=false`);
            if (response.ok) {
              const data = await response.json();
              counts[league.key] = data.events?.length || 0;
            } else {
              counts[league.key] = 0;
            }
          } catch {
            counts[league.key] = 0;
          }
        })
      );
      
      setLeagueMatchCounts(counts);
    }

    fetchLeagueCounts();
  }, [currentSport]);

  // Fetch matches for selected league
  const fetchMatches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/match-data?sportKey=${selectedLeague}&includeOdds=false`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const data = await response.json();
      setMatches(data.events || []);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError('Failed to load matches');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Pull-to-refresh
  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: fetchMatches,
    threshold: 80,
  });

  return (
    <section className="py-8 sm:py-12">
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing} 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Sport Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedSport === sport.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{sport.icon}</span>
              <span>{sport.name}</span>
            </button>
          ))}
        </div>

        {/* League Pills */}
        <div className="mb-6">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">
            {currentSport.name} Leagues
          </p>
          <div className="flex flex-wrap gap-2">
            {currentSport.leagues.map((league) => {
              const matchCount = leagueMatchCounts[league.key];
              const hasNoMatches = matchCount === 0;
              
              return (
                <button
                  key={league.key}
                  onClick={() => setSelectedLeague(league.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedLeague === league.key
                      ? 'bg-white/20 text-white border border-white/20'
                      : hasNoMatches
                        ? 'bg-white/5 text-gray-500 hover:bg-white/10 opacity-60'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                  }`}
                >
                  {/* Use country flag for domestic leagues, league logo for international competitions */}
                  {getCountryForLeague(league.name) && !league.name.toLowerCase().includes('champions') && !league.name.toLowerCase().includes('europa') ? (
                    <CountryFlag country={getCountryForLeague(league.name)!} size="xs" />
                  ) : (
                    <LeagueLogo leagueName={league.name} sport={league.key} size="xs" />
                  )}
                  <span>{league.name}</span>
                  {matchCount !== undefined && matchCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/10 text-gray-400">
                      {matchCount}
                    </span>
                  )}
                  {hasNoMatches && matchCount !== undefined && (
                    <span className="ml-1 text-xs text-gray-500">•</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current League Header */}
        <div className="flex items-center gap-3 mb-4 py-3 border-t border-divider">
          <LeagueLogo leagueName={currentLeague.name} sport={selectedLeague} size="md" />
          <div>
            <h3 className="text-lg font-semibold text-white">{currentLeague.name}</h3>
            <p className="text-sm text-text-muted">
              {isLoading ? 'Loading matches...' : `${matches?.length || 0} upcoming matches`}
            </p>
          </div>
        </div>

        {/* Loading State with Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-bg-card rounded-xl border border-divider p-4">
                {/* League & Time Skeleton */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    <div className="w-20 h-3 rounded bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  </div>
                  <div className="w-10 h-5 rounded-full bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                </div>
                {/* Teams Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    <div className="w-24 h-4 rounded bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  </div>
                  <div className="w-6 h-4 rounded bg-white/5 mx-2" />
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="w-24 h-4 rounded bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    <div className="w-8 h-8 rounded-lg bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  </div>
                </div>
                {/* Footer Skeleton */}
                <div className="mt-3 pt-3 border-t border-divider flex items-center justify-between">
                  <div className="w-16 h-3 rounded bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  <div className="w-20 h-7 rounded-full bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16 bg-gradient-to-b from-red-500/5 to-transparent rounded-2xl border border-red-500/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Connection Issue</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              We couldn&apos;t load matches from {currentLeague.name}. This might be a temporary issue.
            </p>
            <button 
              onClick={() => setSelectedLeague(selectedLeague)} 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && !error && matches && matches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.slice(0, maxMatches).map((match) => (
              <MatchCard
                key={match.matchId}
                matchId={match.matchId}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                league={currentLeague.name}
                sportKey={selectedLeague}
                commenceTime={match.commenceTime}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!matches || matches.length === 0) && (
          <div className="text-center py-16 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {SEASONAL_LEAGUES.includes(selectedLeague) ? 'Competition on Break' : 'No Upcoming Matches'}
            </h3>
            <p className="text-gray-400 mb-2 max-w-sm mx-auto">
              {SEASONAL_LEAGUES.includes(selectedLeague) 
                ? `${currentLeague.name} is currently between matchdays. Next fixtures will appear once scheduled.`
                : `There are no scheduled matches in ${currentLeague.name} at the moment.`
              }
            </p>
            <p className="text-sm text-text-muted mb-6">
              {SEASONAL_LEAGUES.includes(selectedLeague)
                ? 'Explore other leagues with live matches'
                : 'Check back later or explore other leagues'
              }
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {currentSport.leagues
                .filter(l => l.key !== selectedLeague && (leagueMatchCounts[l.key] || 0) > 0)
                .slice(0, 3)
                .map((league) => (
                <button
                  key={league.key}
                  onClick={() => setSelectedLeague(league.key)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  <LeagueLogo leagueName={league.name} sport={league.key} size="xs" />
                  {league.name}
                  <span className="text-xs text-primary">({leagueMatchCounts[league.key]})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Show More */}
        {!isLoading && matches && matches.length > maxMatches && (
          <div className="text-center mt-6">
            <p className="text-sm text-text-muted">
              Showing {maxMatches} of {matches?.length || 0} matches
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
