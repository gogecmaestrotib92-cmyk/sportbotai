/**
 * Match Browser Component - i18n Version
 * 
 * Browse matches organized by Sport → League with locale support.
 * Sports: Soccer, Basketball, American Football, Hockey
 * Links to Match Preview pages.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MatchData } from '@/types';
import MatchCardI18n from '@/components/MatchCardI18n';
import { StaggeredItem } from '@/components/ui';
import LeagueLogo from '@/components/ui/LeagueLogo';
import CountryFlag, { getCountryForLeague } from '@/components/ui/CountryFlag';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator';
import { Locale, getTranslations } from '@/lib/i18n/translations';

interface MatchBrowserI18nProps {
  initialSport?: string;
  maxMatches?: number;
  locale: Locale;
}

// Sports with their leagues organized - now uses locale for display names
const getSports = (locale: Locale) => {
  const t = getTranslations(locale);
  return [
    {
      id: 'soccer',
      name: t.matches.sports.soccer,
      icon: '⚽',
      leagues: [
        { key: 'soccer_epl', name: 'Premier League' },
        { key: 'soccer_spain_la_liga', name: 'La Liga' },
        { key: 'soccer_germany_bundesliga', name: 'Bundesliga' },
        { key: 'soccer_italy_serie_a', name: 'Serie A' },
        { key: 'soccer_france_ligue_one', name: 'Ligue 1' },
        { key: 'soccer_portugal_primeira_liga', name: 'Primeira Liga' },
        { key: 'soccer_netherlands_eredivisie', name: 'Eredivisie' },
        { key: 'soccer_turkey_super_league', name: 'Süper Lig' },
        { key: 'soccer_belgium_first_div', name: 'Jupiler Pro League' },
        { key: 'soccer_spl', name: 'Scottish Premiership' },
        { key: 'soccer_uefa_champs_league', name: 'Champions League' },
        { key: 'soccer_uefa_europa_league', name: 'Europa League' },
      ],
    },
    {
      id: 'basketball',
      name: t.matches.sports.basketball,
      icon: '🏀',
      leagues: [
        { key: 'basketball_nba', name: 'NBA' },
        { key: 'basketball_euroleague', name: 'EuroLeague' },
      ],
    },
    {
      id: 'americanfootball',
      name: t.matches.sports.americanFootball,
      icon: '🏈',
      leagues: [
        { key: 'americanfootball_nfl', name: 'NFL' },
      ],
    },
    {
      id: 'hockey',
      name: t.matches.sports.hockey,
      icon: '🏒',
      leagues: [
        { key: 'icehockey_nhl', name: 'NHL' },
      ],
    },
  ];
};

// Seasonal leagues that have off-seasons (American sports)
const SEASONAL_LEAGUES = [
  'americanfootball_nfl',
  'basketball_nba',
  'icehockey_nhl',
];

export default function MatchBrowserI18n({ initialSport, maxMatches = 12, locale }: MatchBrowserI18nProps) {
  const t = getTranslations(locale);
  const SPORTS = getSports(locale);
  
  const [selectedSport, setSelectedSport] = useState(initialSport || 'soccer');
  const [selectedLeague, setSelectedLeague] = useState(SPORTS[0].leagues[0].key);
  const [matches, setMatches] = useState<MatchData[] | null>(null);
  const [leagueMatchCounts, setLeagueMatchCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get locale path prefix for links
  const localePath = locale === 'sr' ? '/sr' : '';

  const currentSport = SPORTS.find(s => s.id === selectedSport) || SPORTS[0];
  const currentLeague = currentSport.leagues.find(l => l.key === selectedLeague) || currentSport.leagues[0];

  // When sport changes, select first league of that sport
  useEffect(() => {
    const sport = SPORTS.find(s => s.id === selectedSport);
    if (sport) {
      setSelectedLeague(sport.leagues[0].key);
    }
  }, [selectedSport]);

  // Fetch match counts for all leagues of current sport
  useEffect(() => {
    const fetchLeagueCounts = async () => {
      const counts: Record<string, number> = {};
      const sport = SPORTS.find(s => s.id === selectedSport);
      if (!sport) return;

      await Promise.all(
        sport.leagues.map(async (league) => {
          try {
            const response = await fetch(`/api/match-data?sportKey=${league.key}&includeOdds=false`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            counts[league.key] = data.events?.length || 0;
          } catch {
            counts[league.key] = 0;
          }
        })
      );
      setLeagueMatchCounts(counts);
    };

    fetchLeagueCounts();
  }, [selectedSport]);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/match-data?sportKey=${selectedLeague}&includeOdds=false`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setMatches(data.events || []);
    } catch {
      setError('Could not load matches');
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
            {currentSport.name} {t.matches.leagues}
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
              {isLoading ? t.matches.loadingMatches : `${matches?.length || 0} ${t.matches.upcomingMatches}`}
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
            <h3 className="text-lg font-semibold text-white mb-2">{t.matches.connectionIssue}</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              {t.matches.connectionError} {currentLeague.name}. {t.matches.temporaryIssue}
            </p>
            <button 
              onClick={() => setSelectedLeague(selectedLeague)} 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t.matches.tryAgain}
            </button>
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && !error && matches && matches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.slice(0, maxMatches).map((match, index) => (
              <StaggeredItem key={match.matchId} index={index} staggerDelay={50} initialDelay={80}>
                <MatchCardI18n
                  matchId={match.matchId}
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                  league={currentLeague.name}
                  sportKey={selectedLeague}
                  commenceTime={match.commenceTime}
                  locale={locale}
                />
              </StaggeredItem>
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
              {SEASONAL_LEAGUES.includes(selectedLeague) ? t.matches.competitionOnBreak : t.matches.noUpcomingMatches}
            </h3>
            <p className="text-gray-400 mb-2 max-w-sm mx-auto">
              {SEASONAL_LEAGUES.includes(selectedLeague) 
                ? `${currentLeague.name} ${t.matches.betweenMatchdays}`
                : `${t.matches.noScheduledMatches} ${currentLeague.name} ${t.matches.atTheMoment}`
              }
            </p>
            <p className="text-sm text-text-muted mb-6">
              {SEASONAL_LEAGUES.includes(selectedLeague)
                ? t.matches.exploreOtherLeagues
                : t.matches.checkBackLater
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
              {t.matches.showingOf} {maxMatches} {t.matches.of} {matches?.length || 0} {t.matches.matchesText}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
