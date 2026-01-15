/**
 * Sport Match Grid Component
 * 
 * Premium component for sport-specific landing pages.
 * Shows matches for a single sport without the sport picker.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MatchData } from '@/types';
import MatchCard from '@/components/MatchCard';
import { StaggeredItem } from '@/components/ui';
import LeagueLogo from '@/components/ui/LeagueLogo';

interface SportMatchGridProps {
    sport: 'basketball' | 'americanfootball' | 'hockey' | 'soccer';
    leagues: { key: string; name: string }[];
    accentColor?: string;
    maxMatches?: number;
}

// Time filter type
type TimeFilter = 'today' | 'tomorrow' | 'later';

export default function SportMatchGrid({
    sport,
    leagues,
    accentColor = 'accent',
    maxMatches = 12,
}: SportMatchGridProps) {
    const [selectedLeague, setSelectedLeague] = useState(leagues[0]?.key || '');
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
    const [leagueCounts, setLeagueCounts] = useState<Record<string, number>>({});

    // Get current league config
    const currentLeague = leagues.find(l => l.key === selectedLeague) || leagues[0];

    // Fetch match counts for all leagues
    useEffect(() => {
        async function fetchCounts() {
            const counts: Record<string, number> = {};
            await Promise.all(
                leagues.map(async (league) => {
                    try {
                        const res = await fetch(`/api/match-data?sportKey=${league.key}&includeOdds=false`);
                        if (res.ok) {
                            const data = await res.json();
                            counts[league.key] = data.events?.length || 0;
                        }
                    } catch {
                        counts[league.key] = 0;
                    }
                })
            );
            setLeagueCounts(counts);
        }
        fetchCounts();
    }, [leagues]);

    // Fetch matches for selected league
    const fetchMatches = useCallback(async () => {
        if (!selectedLeague) return;
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetch(`/api/match-data?sportKey=${selectedLeague}&includeOdds=false`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setMatches(data.events || []);
        } catch {
            setError('Failed to load matches');
            setMatches([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedLeague]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    // Filter matches by time
    const filterByTime = useCallback((matchList: MatchData[], filter: TimeFilter) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        return matchList.filter(m => {
            const d = new Date(m.commenceTime);
            if (filter === 'today') return d >= today && d < tomorrow;
            if (filter === 'tomorrow') return d >= tomorrow && d < dayAfter;
            return d >= dayAfter;
        });
    }, []);

    // Time counts
    const timeCounts = useMemo(() => ({
        today: filterByTime(matches, 'today').length,
        tomorrow: filterByTime(matches, 'tomorrow').length,
        later: filterByTime(matches, 'later').length,
    }), [matches, filterByTime]);

    // Filtered matches
    const filteredMatches = useMemo(() => {
        return filterByTime(matches, timeFilter);
    }, [matches, timeFilter, filterByTime]);

    // Featured match (first one for today, or trending)
    const featuredMatch = filteredMatches[0];

    // Total count for all leagues
    const totalMatches = Object.values(leagueCounts).reduce((a, b) => a + b, 0);

    return (
        <section className="py-6 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Stats Strip */}
                <div className="flex items-center gap-6 mb-6 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">{totalMatches}</span>
                        <span className="text-sm text-gray-400">matches available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        <span className="text-sm text-gray-400">Live odds data</span>
                    </div>
                </div>

                {/* League Pills - Horizontal scroll */}
                {leagues.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
                        {leagues.map((league) => (
                            <button
                                key={league.key}
                                onClick={() => setSelectedLeague(league.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedLeague === league.key
                                        ? `bg-${accentColor}/20 text-white border border-${accentColor}/30`
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                                    }`}
                            >
                                <LeagueLogo leagueName={league.name} sport={league.key} size="xs" />
                                {league.name}
                                {leagueCounts[league.key] > 0 && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${selectedLeague === league.key
                                            ? 'bg-white/20'
                                            : 'bg-white/10'
                                        }`}>
                                        {leagueCounts[league.key]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Time Filter */}
                <div className="flex items-center gap-2 mb-6">
                    {(['today', 'tomorrow', 'later'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeFilter(t)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeFilter === t
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                            <span className={`text-xs px-1.5 py-0.5 rounded ${timeFilter === t ? 'bg-accent/20 text-accent' : 'bg-white/5'
                                }`}>
                                {timeCounts[t]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Featured Match */}
                {!isLoading && featuredMatch && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">⭐</span>
                            <span className="text-sm font-semibold text-white">Featured Matchup</span>
                        </div>
                        <div className="max-w-lg">
                            <MatchCard
                                matchId={featuredMatch.matchId}
                                homeTeam={featuredMatch.homeTeam}
                                awayTeam={featuredMatch.awayTeam}
                                league={currentLeague?.name || ''}
                                sportKey={selectedLeague}
                                commenceTime={featuredMatch.commenceTime}
                                badge="🔥 Top Pick"
                                contextLine="Featured matchup with AI analysis available"
                            />
                        </div>
                    </div>
                )}

                {/* League Header */}
                <div className="flex items-center gap-3 mb-4">
                    <LeagueLogo leagueName={currentLeague?.name || ''} sport={selectedLeague} size="md" />
                    <div>
                        <h3 className="text-lg font-bold text-white">{currentLeague?.name}</h3>
                        <p className="text-sm text-gray-400">
                            {isLoading ? 'Loading...' : `${filteredMatches.length} games ${timeFilter}`}
                        </p>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card-glass rounded-xl p-4 animate-pulse">
                                <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
                                <div className="h-6 bg-white/5 rounded w-2/3 mb-2" />
                                <div className="h-4 bg-white/5 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && !isLoading && (
                    <div className="text-center py-12 bg-red-500/5 rounded-xl border border-red-500/10">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                            onClick={fetchMatches}
                            className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Matches Grid */}
                {!isLoading && !error && filteredMatches.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMatches.slice(1, maxMatches + 1).map((match, i) => (
                            <StaggeredItem key={match.matchId} index={i} staggerDelay={50}>
                                <MatchCard
                                    matchId={match.matchId}
                                    homeTeam={match.homeTeam}
                                    awayTeam={match.awayTeam}
                                    league={currentLeague?.name || ''}
                                    sportKey={selectedLeague}
                                    commenceTime={match.commenceTime}
                                />
                            </StaggeredItem>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && filteredMatches.length === 0 && (
                    <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-gray-400 mb-4">
                            No matches scheduled for {timeFilter}
                        </p>
                        {timeCounts.tomorrow > 0 && timeFilter === 'today' && (
                            <button
                                onClick={() => setTimeFilter('tomorrow')}
                                className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm"
                            >
                                Check Tomorrow ({timeCounts.tomorrow})
                            </button>
                        )}
                    </div>
                )}

                {/* Show count */}
                {!isLoading && filteredMatches.length > maxMatches && (
                    <p className="text-center text-sm text-gray-400 mt-6">
                        Showing {maxMatches} of {filteredMatches.length} matches
                    </p>
                )}
            </div>
        </section>
    );
}
