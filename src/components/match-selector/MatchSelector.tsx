/**
 * Match Selector Component
 * 
 * Premium 3-step match selection experience:
 * 1. Select Sport (horizontal tabs)
 * 2. Select League (pills within category)
 * 3. Select Match (accordion + preview)
 * 
 * Features:
 * - Clean Sport → League → Match hierarchy
 * - Trending/HOT matches section
 * - Global search functionality
 * - Mobile-first responsive design
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MatchData, AnalyzeRequest, AnalyzeResponse } from '@/types';
import { SPORTS_CONFIG, SportConfig, getSportsGroupedByCategory } from '@/lib/config/sportsConfig';
import SportTabs from './SportTabs';
import MatchSearchBar from './MatchSearchBar';
import LeagueAccordion from './LeagueAccordion';
import MatchPreview from './MatchPreview';
import { TrendingMatches } from './TrendingMatches';
import { groupMatchesByLeague, filterLeagueGroupsBySearch, LeagueGroup } from './utils';
import { getTrendingMatches, TrendingMatch } from './trending';

interface MatchSelectorProps {
  onResult: (result: AnalyzeResponse) => void;
  onLoading: (loading: boolean) => void;
}

export default function MatchSelector({ onResult, onLoading }: MatchSelectorProps) {
  // API state
  const [apiConfigured, setApiConfigured] = useState(true);
  const [manualMode, setManualMode] = useState(false);

  // Sport selection state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSportKey, setSelectedSportKey] = useState<string>('');
  const [selectedSportConfig, setSelectedSportConfig] = useState<SportConfig | null>(null);

  // Events state
  const [events, setEvents] = useState<MatchData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MatchData | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingOdds, setLoadingOdds] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Grouped sports
  const groupedSports = useMemo(() => getSportsGroupedByCategory(), []);
  const categories = useMemo(() => Object.keys(groupedSports).sort((a, b) => {
    // Priority order
    const priority: Record<string, number> = {
      'Soccer': 1,
      'Basketball': 2,
      'American Football': 3,
      'Tennis': 4,
      'Ice Hockey': 5,
      'MMA': 6,
    };
    return (priority[a] || 99) - (priority[b] || 99);
  }), [groupedSports]);

  // Sports in selected category
  const sportsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return groupedSports[selectedCategory] || [];
  }, [selectedCategory, groupedSports]);

  // Grouped events by league
  const leagueGroups = useMemo(() => {
    return groupMatchesByLeague(events);
  }, [events]);

  // Filtered league groups by search
  const filteredLeagueGroups = useMemo(() => {
    return filterLeagueGroupsBySearch(leagueGroups, searchQuery);
  }, [leagueGroups, searchQuery]);

  // Trending matches for current category
  const trendingMatches = useMemo(() => {
    if (events.length === 0) return [];
    return getTrendingMatches(events, 8);
  }, [events]);

  // Check if search is active (to hide trending section)
  const isSearching = searchQuery.trim().length > 0;

  // Total match counts for search UI
  const totalMatches = useMemo(() => events.length, [events]);
  const filteredMatches = useMemo(() => 
    filteredLeagueGroups.reduce((acc, g) => acc + g.matches.length, 0),
    [filteredLeagueGroups]
  );

  // ============================================
  // API CALLS
  // ============================================

  // Check if API is configured on mount
  useEffect(() => {
    async function checkApiStatus() {
      try {
        const response = await fetch('/api/sports');
        if (!response.ok) {
          const data = await response.json();
          if (data.error?.includes('not configured')) {
            setApiConfigured(false);
            setManualMode(true);
          }
        }
      } catch {
        setApiConfigured(false);
        setManualMode(true);
      }
    }
    checkApiStatus();
  }, []);

  // Auto-select first category on load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Fetch events when sport changes
  const fetchEvents = useCallback(async (sportKey: string) => {
    if (!sportKey || manualMode) return;

    setLoadingEvents(true);
    setEvents([]);
    setSelectedEvent(null);
    setSearchQuery('');
    setError(null);

    try {
      const response = await fetch(`/api/match-data?sportKey=${sportKey}&includeOdds=true`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch events');
      }

      const data = await response.json();

      if (data.events && data.events.length > 0) {
        setEvents(data.events);
      } else {
        setError('No upcoming events found for this league.');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Error loading events');
    } finally {
      setLoadingEvents(false);
    }
  }, [manualMode]);

  // Fetch odds for a specific event
  const fetchEventOdds = useCallback(async (sportKey: string, eventId: string) => {
    if (!sportKey || !eventId || manualMode) return;

    setLoadingOdds(true);

    try {
      const response = await fetch(`/api/match-data?sportKey=${sportKey}&eventId=${eventId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch event odds');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setSelectedEvent(data.data);
      }
    } catch (err) {
      console.error('Error fetching event odds:', err);
    } finally {
      setLoadingOdds(false);
    }
  }, [manualMode]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSportKey('');
    setSelectedSportConfig(null);
    setEvents([]);
    setSelectedEvent(null);
    setSearchQuery('');
    setError(null);
  };

  const handleLeagueSelect = (sportKey: string) => {
    setSelectedSportKey(sportKey);
    setSelectedEvent(null);
    setSearchQuery('');
    setError(null);

    const config = Object.values(SPORTS_CONFIG).find(c => c.oddsApiSportKey === sportKey);
    setSelectedSportConfig(config || null);

    if (sportKey && !manualMode) {
      fetchEvents(sportKey);
    }
  };

  const handleMatchSelect = (match: MatchData) => {
    setSelectedEvent(match);

    // If event doesn't have odds, fetch them
    if (!match.odds || match.odds.home === 0) {
      fetchEventOdds(selectedSportKey, match.matchId);
    }
  };

  const handleTrendingMatchSelect = (match: TrendingMatch) => {
    // Trending matches already have full data, just select
    setSelectedEvent(match);

    // If event doesn't have odds, fetch them
    if (!match.odds || match.odds.home === 0) {
      fetchEventOdds(selectedSportKey, match.matchId);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedEvent) return;

    setLoadingAnalysis(true);
    onLoading(true);
    setError(null);

    const data: AnalyzeRequest = {
      matchData: {
        sport: selectedSportConfig?.displayName || 'Soccer',
        league: selectedEvent.league,
        homeTeam: selectedEvent.homeTeam,
        awayTeam: selectedEvent.awayTeam,
        sourceType: 'API',
        matchDate: selectedEvent.commenceTime,
        odds: {
          home: selectedEvent.odds?.home || 0,
          draw: selectedEvent.odds?.draw,
          away: selectedEvent.odds?.away || 0,
        },
      },
    };

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoadingAnalysis(false);
      onLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // Manual mode fallback (simplified)
  if (manualMode) {
    return (
      <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-card text-sm">
        <strong>Note:</strong> Live data not available. Please configure ODDS_API_KEY.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Sport Selection */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          1. Select Sport
        </h2>
        <SportTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          loading={loadingEvents}
        />
      </div>

      {/* Step 2: League Selection (within category) */}
      {selectedCategory && sportsInCategory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">
              2. Select League
            </h2>
            {sportsInCategory.length > 5 && (
              <span className="text-[10px] text-text-muted">
                {sportsInCategory.length} leagues
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sportsInCategory.map((sport) => {
              const isSelected = sport.oddsApiSportKey === selectedSportKey;
              return (
                <button
                  key={sport.oddsApiSportKey}
                  onClick={() => handleLeagueSelect(sport.oddsApiSportKey)}
                  disabled={loadingEvents}
                  className={`
                    px-3 sm:px-4 py-2 rounded-btn text-xs sm:text-sm font-medium transition-all duration-200
                    border active:scale-95
                    ${isSelected
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-bg-card text-text-secondary border-divider hover:border-primary/30 hover:bg-bg-hover'
                    }
                    ${loadingEvents ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {sport.displayName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Match Selection */}
      {selectedSportKey && (
        <div>
          {/* Section Header with Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">
                3. Select Match
              </h2>
              {events.length > 0 && (
                <p className="text-xs text-text-muted mt-0.5">
                  {events.length} matches available
                </p>
              )}
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column: Match Browser */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Search Bar */}
              <MatchSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                disabled={loadingEvents || events.length === 0}
                totalMatches={totalMatches}
                filteredMatches={filteredMatches}
              />

              {/* Trending/HOT Matches (hide when searching) */}
              {!isSearching && (
                <TrendingMatches
                  matches={trendingMatches}
                  selectedMatchId={selectedEvent?.matchId || null}
                  onSelectMatch={handleTrendingMatchSelect}
                  isLoading={loadingEvents}
                />
              )}

              {/* Error Message */}
              {error && !loadingEvents && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-card text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Loading State */}
              {loadingEvents && (
                <div className="text-center py-16 bg-bg-card rounded-card border border-divider">
                  <div className="relative w-12 h-12 mx-auto mb-4">
                    <div className="absolute inset-0 border-3 border-divider rounded-full"></div>
                    <div className="absolute inset-0 border-3 border-primary rounded-full animate-spin border-t-transparent"></div>
                  </div>
                  <p className="text-text-primary font-medium mb-1">Loading matches...</p>
                  <p className="text-text-muted text-sm">Fetching live odds data</p>
                </div>
              )}

              {/* League Accordion */}
              {!loadingEvents && events.length > 0 && (
                <LeagueAccordion
                  leagues={filteredLeagueGroups}
                  selectedMatchId={selectedEvent?.matchId}
                  onMatchSelect={handleMatchSelect}
                  searchQuery={searchQuery}
                  defaultExpanded={leagueGroups.length === 1}
                />
              )}

              {/* Empty state when no matches */}
              {!loadingEvents && events.length === 0 && !error && (
                <div className="text-center py-16 bg-bg-card rounded-card border border-divider">
                  <div className="w-16 h-16 bg-bg-hover rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🏟️</span>
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">No Matches Yet</h3>
                  <p className="text-text-muted text-sm max-w-xs mx-auto">
                    Select a league above to view upcoming matches and odds
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Match Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-4">
                {selectedEvent ? (
                  <MatchPreview
                    match={selectedEvent}
                    sportConfig={selectedSportConfig}
                    onAnalyze={handleAnalyze}
                    loading={loadingAnalysis}
                    loadingOdds={loadingOdds}
                  />
                ) : (
                  <div className="bg-gradient-to-br from-bg-card to-bg-hover border-2 border-dashed border-divider rounded-card p-8 text-center">
                    <div className="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-card">
                      <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-text-primary mb-2">Select a Match</h3>
                    <p className="text-text-muted text-sm">
                      Click on any match to preview odds and run AI analysis
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial state - no league selected */}
      {!selectedSportKey && selectedCategory && (
        <div className="text-center py-16 bg-gradient-to-br from-bg-card to-bg-hover rounded-card border border-divider">
          <div className="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-card">
            <span className="text-3xl">👆</span>
          </div>
          <h3 className="font-semibold text-text-primary mb-2">Choose a League</h3>
          <p className="text-text-muted text-sm max-w-xs mx-auto">
            Select a league from the options above to browse available matches
          </p>
        </div>
      )}
    </div>
  );
}
