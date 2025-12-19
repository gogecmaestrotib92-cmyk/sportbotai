/**
 * Multi-Sport Analyzer Form Component
 * 
 * Enhanced form supporting multiple sports via The Odds API.
 * Provides sport selection, event browsing, and analysis triggering.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnalyzeRequest, AnalyzeResponse, MatchData } from '@/types';
import { SPORTS_CONFIG, SportConfig, getSportsGroupedByCategory } from '@/lib/config/sportsConfig';
import TeamLogo from './ui/TeamLogo';
import LeagueLogo from './ui/LeagueLogo';
import { USAGE_UPDATED_EVENT } from './auth/UserMenu';

// ============================================
// TYPES
// ============================================

interface MultiSportAnalyzerFormProps {
  onResult: (result: AnalyzeResponse) => void;
  onLoading: (loading: boolean) => void;
}

interface SportGroup {
  group: string;
  sports: SportConfig[];
}

// ============================================
// COMPONENT
// ============================================

export default function MultiSportAnalyzerForm({ 
  onResult, 
  onLoading 
}: MultiSportAnalyzerFormProps) {
  // State
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(true);
  
  // Sport selection state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSportKey, setSelectedSportKey] = useState<string>('');
  const [selectedSportConfig, setSelectedSportConfig] = useState<SportConfig | null>(null);
  
  // Events state
  const [events, setEvents] = useState<MatchData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MatchData | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingOdds, setLoadingOdds] = useState(false);

  // Grouped sports for selector
  const groupedSports = useMemo(() => getSportsGroupedByCategory(), []);
  const categories = useMemo(() => Object.keys(groupedSports).sort(), [groupedSports]);
  
  // Sports in selected category
  const sportsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return groupedSports[selectedCategory] || [];
  }, [selectedCategory, groupedSports]);

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

  // Fetch events when sport changes
  const fetchEvents = useCallback(async (sportKey: string) => {
    if (!sportKey || manualMode) return;

    setLoadingEvents(true);
    setEvents([]);
    setSelectedEvent(null);
    setError(null);

    try {
      // Fetch events with odds included (uses API quota)
      const response = await fetch(
        `/api/match-data?sportKey=${sportKey}&includeOdds=true`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch events');
      }

      const data = await response.json();
      
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
      } else {
        setError(`No upcoming events found for this league.`);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Error loading events');
    } finally {
      setLoadingEvents(false);
    }
  }, [manualMode]);

  // Fetch full odds for a specific event
  const fetchEventOdds = useCallback(async (sportKey: string, eventId: string) => {
    if (!sportKey || !eventId || manualMode) return;

    setLoadingOdds(true);

    try {
      const response = await fetch(
        `/api/match-data?sportKey=${sportKey}&eventId=${eventId}`
      );

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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedSportKey('');
    setSelectedSportConfig(null);
    setEvents([]);
    setSelectedEvent(null);
    setError(null);
  };

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sportKey = e.target.value;
    setSelectedSportKey(sportKey);
    setSelectedEvent(null);
    setError(null);
    
    const config = Object.values(SPORTS_CONFIG).find(c => c.oddsApiSportKey === sportKey);
    setSelectedSportConfig(config || null);
    
    if (sportKey && !manualMode) {
      fetchEvents(sportKey);
    }
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    const event = events.find(ev => ev.matchId === eventId);
    
    if (event) {
      setSelectedEvent(event);
      // If event doesn't have odds, fetch them
      if (!event.odds || event.odds.home === 0) {
        fetchEventOdds(selectedSportKey, eventId);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    onLoading(true);

    const formData = new FormData(e.currentTarget);

    // Build match data
    const sport = manualMode 
      ? formData.get('sport') as string 
      : selectedSportConfig?.displayName || 'Soccer';
    
    const sportKey = manualMode 
      ? (formData.get('sport') as string)?.toLowerCase() 
      : selectedSportKey;

    const league = manualMode
      ? formData.get('league') as string
      : selectedEvent?.league || selectedSportConfig?.displayName || 'Unknown';

    const homeTeam = manualMode
      ? formData.get('teamA') as string
      : selectedEvent?.homeTeam || '';

    const awayTeam = manualMode
      ? formData.get('teamB') as string
      : selectedEvent?.awayTeam || '';

    const oddsHome = manualMode
      ? parseFloat(formData.get('oddsHome') as string)
      : selectedEvent?.odds?.home || 0;

    const oddsDraw = manualMode
      ? parseFloat(formData.get('oddsDraw') as string) || null
      : selectedEvent?.odds?.draw;

    const oddsAway = manualMode
      ? parseFloat(formData.get('oddsAway') as string)
      : selectedEvent?.odds?.away || 0;

    const userPick = formData.get('userPrediction') as string;

    // Build request
    const data: AnalyzeRequest = {
      matchData: {
        sport,
        league,
        homeTeam,
        awayTeam,
        sourceType: manualMode ? 'MANUAL' : 'API',
        matchDate: selectedEvent?.commenceTime,
        odds: {
          home: oddsHome,
          draw: oddsDraw,
          away: oddsAway,
        },
      },
      userPick,
    };

    // Validation
    if (!homeTeam || !awayTeam) {
      setError('Please fill in the teams or select a match.');
      onLoading(false);
      return;
    }

    if (oddsHome <= 0 || oddsAway <= 0) {
      setError('Valid odds (greater than 0) are required.');
      onLoading(false);
      return;
    }

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

      // Dispatch usage update event so header refreshes
      window.dispatchEvent(new Event(USAGE_UPDATED_EVENT));

      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      onLoading(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Manual mode sports list
  const manualSports = [
    'Soccer', 'Basketball', 'American Football', 'Tennis', 
    'Ice Hockey', 'Baseball', 'MMA', 'Boxing', 'Other',
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* API Status Notice */}
      {!apiConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          <strong>Note:</strong> The Odds API is not configured. Using manual entry mode.
          Add <code className="bg-yellow-100 px-1 rounded">ODDS_API_KEY</code> to enable live data.
        </div>
      )}

      {/* Mode Toggle */}
      {apiConfigured && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Data source:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
                !manualMode
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📡 Live Events
            </button>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
                manualMode
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✏️ Manual Entry
            </button>
          </div>
        </div>
      )}

      {/* ========== LIVE MODE ========== */}
      {!manualMode && (
        <>
          {/* Category Selector */}
          <div>
            <label htmlFor="categorySelect" className="input-label">
              Sport Category *
            </label>
            <select
              id="categorySelect"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="input-field"
            >
              <option value="">-- Select Sport Category --</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* League Selector */}
          {selectedCategory && sportsInCategory.length > 0 && (
            <div>
              <label htmlFor="leagueSelect" className="input-label">
                League / Competition *
              </label>
              <select
                id="leagueSelect"
                value={selectedSportKey}
                onChange={handleSportChange}
                className="input-field"
              >
                <option value="">-- Select League --</option>
                {sportsInCategory.map((sport) => (
                  <option key={sport.oddsApiSportKey} value={sport.oddsApiSportKey}>
                    {sport.icon} {sport.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Event Selector */}
          {selectedSportKey && (
            <div>
              <label htmlFor="eventSelect" className="input-label">
                Select {selectedSportConfig?.matchTerm || 'Match'} *
              </label>
              {loadingEvents ? (
                <div className="input-field bg-gray-100 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Loading events...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
                  No upcoming {selectedSportConfig?.matchTerm || 'match'}es found for this league.
                </div>
              ) : (
                <select
                  id="eventSelect"
                  onChange={handleEventChange}
                  className="input-field"
                >
                  <option value="">-- Select {selectedSportConfig?.matchTerm || 'Match'} --</option>
                  {events.map((event) => (
                    <option key={event.matchId} value={event.matchId}>
                      {event.homeTeam} vs {event.awayTeam} ({formatDate(event.commenceTime)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Selected Event Preview */}
          {selectedEvent && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <LeagueLogo leagueName={selectedEvent.league || ''} sport={selectedSportKey} size="md" />
                <span className="font-semibold text-gray-800">{selectedEvent.league}</span>
              </div>
              
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-3">
                  <TeamLogo teamName={selectedEvent.homeTeam} sport={selectedSportKey} size="lg" />
                  <div className="text-lg font-bold text-gray-900">
                    {selectedEvent.homeTeam}
                    <span className="mx-2 text-gray-400">vs</span>
                    {selectedEvent.awayTeam}
                  </div>
                  <TeamLogo teamName={selectedEvent.awayTeam} sport={selectedSportKey} size="lg" />
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatDate(selectedEvent.commenceTime)}
                </div>
              </div>

              {/* Odds Display */}
              {loadingOdds ? (
                <div className="text-center text-gray-500 animate-pulse py-4">
                  Loading odds...
                </div>
              ) : selectedEvent.odds && selectedEvent.odds.home > 0 ? (
                <div className={`grid ${selectedSportConfig?.hasDraw ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">
                      1 ({selectedSportConfig?.participantTerm === 'player' ? 'Winner' : 'Home'})
                    </div>
                    <div className="text-2xl font-bold text-primary-600">
                      {selectedEvent.odds.home.toFixed(2)}
                    </div>
                    {selectedEvent.impliedProbabilities?.home && (
                      <div className="text-xs text-gray-400 mt-1">
                        {selectedEvent.impliedProbabilities.home.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  
                  {selectedSportConfig?.hasDraw && selectedEvent.odds.draw && (
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">X (Draw)</div>
                      <div className="text-2xl font-bold text-gray-700">
                        {selectedEvent.odds.draw.toFixed(2)}
                      </div>
                      {selectedEvent.impliedProbabilities?.draw && (
                        <div className="text-xs text-gray-400 mt-1">
                          {selectedEvent.impliedProbabilities.draw.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">
                      2 ({selectedSportConfig?.participantTerm === 'player' ? 'Winner' : 'Away'})
                    </div>
                    <div className="text-2xl font-bold text-primary-600">
                      {selectedEvent.odds.away.toFixed(2)}
                    </div>
                    {selectedEvent.impliedProbabilities?.away && (
                      <div className="text-xs text-gray-400 mt-1">
                        {selectedEvent.impliedProbabilities.away.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm py-2">
                  Odds not available
                </div>
              )}

              {/* Over/Under if available */}
              {selectedEvent.odds?.over && selectedEvent.odds?.under && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 text-center mb-2">
                    Total {selectedSportConfig?.scoringUnit || 'points'} O/U {selectedEvent.odds.overUnderLine}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                      <div className="text-xs text-gray-500">Over</div>
                      <div className="text-lg font-bold text-primary-600">
                        {selectedEvent.odds.over.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                      <div className="text-xs text-gray-500">Under</div>
                      <div className="text-lg font-bold text-primary-600">
                        {selectedEvent.odds.under.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========== MANUAL MODE ========== */}
      {manualMode && (
        <>
          {/* Sport and League */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sport" className="input-label">Sport *</label>
              <select id="sport" name="sport" required className="input-field">
                <option value="">Select sport</option>
                {manualSports.map((sport) => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="league" className="input-label">League *</label>
              <input
                type="text"
                id="league"
                name="league"
                required
                placeholder="e.g. Premier League, NBA, NFL..."
                className="input-field"
              />
            </div>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="teamA" className="input-label">Team A (Home) *</label>
              <input
                type="text"
                id="teamA"
                name="teamA"
                required
                placeholder="e.g. Lakers, Patriots..."
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="teamB" className="input-label">Team B (Away) *</label>
              <input
                type="text"
                id="teamB"
                name="teamB"
                required
                placeholder="e.g. Warriors, Chiefs..."
                className="input-field"
              />
            </div>
          </div>

          {/* Odds */}
          <div>
            <label className="input-label">Odds *</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="oddsHome" className="text-xs text-gray-500 mb-1 block">
                  1 (Home)
                </label>
                <input
                  type="number"
                  id="oddsHome"
                  name="oddsHome"
                  required
                  step="0.01"
                  min="1"
                  placeholder="2.10"
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="oddsDraw" className="text-xs text-gray-500 mb-1 block">
                  X (Draw)
                </label>
                <input
                  type="number"
                  id="oddsDraw"
                  name="oddsDraw"
                  step="0.01"
                  min="1"
                  placeholder="3.40"
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="oddsAway" className="text-xs text-gray-500 mb-1 block">
                  2 (Away)
                </label>
                <input
                  type="number"
                  id="oddsAway"
                  name="oddsAway"
                  required
                  step="0.01"
                  min="1"
                  placeholder="3.20"
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========== USER CONTEXT (both modes) ========== */}
      <div>
        <label htmlFor="userPrediction" className="input-label">Your Prediction (Optional)</label>
        <input
          type="text"
          id="userPrediction"
          name="userPrediction"
          placeholder="e.g. Home win, Over 2.5 goals..."
          className="input-field"
        />
        <p className="text-xs text-text-muted mt-1">Share your prediction and see how it compares to the data</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!manualMode && !selectedEvent}
        className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!manualMode && !selectedEvent 
          ? `Select a ${selectedSportConfig?.matchTerm || 'match'} to analyze` 
          : `Analyze ${selectedSportConfig?.matchTerm || 'Match'}`
        }
      </button>

      {/* Footer Note */}
      <p className="text-xs text-gray-500 text-center">
        * Required fields. Analysis is for informational purposes only.
        {!manualMode && ' Odds are average values from multiple bookmakers.'}
      </p>
    </form>
  );
}
