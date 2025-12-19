/**
 * Enhanced Analyzer Form Component
 * 
 * Form for analyzing matches with live data from The Odds API.
 * Dynamically loads sports, matches, and odds.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnalyzeRequest, AnalyzeResponse } from '@/types';
import TeamLogo from './ui/TeamLogo';
import { USAGE_UPDATED_EVENT } from './auth/UserMenu';

// Types for API response
interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
}

interface SportGroup {
  group: string;
  sports: Sport[];
}

interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  analysis?: {
    averageOdds: {
      home: number;
      draw: number | null;
      away: number;
    };
    impliedProbability: {
      home: number;
      draw: number | null;
      away: number;
    };
  };
}

interface AnalyzerFormProps {
  onResult: (result: AnalyzeResponse) => void;
  onLoading: (loading: boolean) => void;
}

export default function AnalyzerFormLive({ onResult, onLoading }: AnalyzerFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [sportGroups, setSportGroups] = useState<SportGroup[]>([]);
  const [events, setEvents] = useState<OddsEvent[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<OddsEvent | null>(null);
  const [loadingSports, setLoadingSports] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingOdds, setLoadingOdds] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(true);

  // Load sports on mount
  useEffect(() => {
    async function fetchSports() {
      try {
        const response = await fetch('/api/sports');
        if (!response.ok) {
          const data = await response.json();
          if (data.error?.includes('not configured')) {
            setApiConfigured(false);
            setManualMode(true);
          }
          throw new Error(data.error || 'Failed to fetch sports');
        }
        const data = await response.json();
        setSportGroups(data.grouped || []);
      } catch (err) {
        console.error('Error fetching sports:', err);
        // If API is not configured, switch to manual mode
        setManualMode(true);
      } finally {
        setLoadingSports(false);
      }
    }

    fetchSports();
  }, []);

  // Load events when sport changes
  const fetchEvents = useCallback(async (sportKey: string) => {
    if (!sportKey || manualMode) return;

    setLoadingEvents(true);
    setEvents([]);
    setSelectedEvent(null);

    try {
      const response = await fetch(`/api/events/${sportKey}`);
      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Error loading matches. Please try again.');
    } finally {
      setLoadingEvents(false);
    }
  }, [manualMode]);

  // Load odds for selected event
  const fetchOdds = useCallback(async (sportKey: string, eventId: string) => {
    if (!sportKey || !eventId || manualMode) return;

    setLoadingOdds(true);

    try {
      const response = await fetch(`/api/odds/${sportKey}?regions=eu&markets=h2h`);
      if (!response.ok) throw new Error('Failed to fetch odds');

      const data = await response.json();
      const eventWithOdds = data.events?.find((e: OddsEvent) => e.id === eventId);

      if (eventWithOdds) {
        setSelectedEvent(eventWithOdds);
      }
    } catch (err) {
      console.error('Error fetching odds:', err);
    } finally {
      setLoadingOdds(false);
    }
  }, [manualMode]);

  // Handler for sport change
  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sportKey = e.target.value;
    setSelectedSport(sportKey);
    setSelectedEvent(null);
    if (sportKey) {
      fetchEvents(sportKey);
    }
  };

  // Handler for event change
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    const event = events.find(ev => ev.id === eventId);

    if (event) {
      setSelectedEvent(event);
      fetchOdds(selectedSport, eventId);
    }
  };

  // Handler for form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    onLoading(true);

    const formData = new FormData(e.currentTarget);

    // Parse form values
    const sport = formData.get('sport') as string || selectedEvent?.sport_title || 'Soccer';
    const league = formData.get('league') as string || selectedEvent?.sport_title || 'Unknown League';
    const homeTeam = formData.get('teamA') as string || selectedEvent?.home_team || '';
    const awayTeam = formData.get('teamB') as string || selectedEvent?.away_team || '';
    const oddsHome = parseFloat(formData.get('oddsHome') as string) || selectedEvent?.analysis?.averageOdds.home || 0;
    const oddsDraw = parseFloat(formData.get('oddsDraw') as string) || selectedEvent?.analysis?.averageOdds.draw || null;
    const oddsAway = parseFloat(formData.get('oddsAway') as string) || selectedEvent?.analysis?.averageOdds.away || 0;
    const userPick = formData.get('userPrediction') as string;

    // Build request in new format
    const data: AnalyzeRequest = {
      matchData: {
        sport,
        league,
        homeTeam,
        awayTeam,
        sourceType: 'API',
        matchDate: selectedEvent?.commence_time,
        odds: {
          home: oddsHome,
          draw: oddsDraw,
          away: oddsAway,
        },
      },
      userPick,
    };

    // Basic validation
    if (!homeTeam || !awayTeam) {
      setError('Please fill in the teams or select a match.');
      onLoading(false);
      return;
    }

    if (data.matchData.odds.home <= 0 || data.matchData.odds.away <= 0) {
      setError('Odds must be greater than 0.');
      onLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error during analysis');
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

  // Format date
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

  // Manual mode fallback (static sports list)
  const manualSports = [
    'Soccer',
    'Basketball',
    'Tennis',
    'Hockey',
    'American Football',
    'Baseball',
    'Other',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* API Status / Mode Toggle */}
      {!apiConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          <strong>Note:</strong> The Odds API is not configured. 
          Using manual data entry. Add <code>ODDS_API_KEY</code> to .env.local for live data.
        </div>
      )}

      {apiConfigured && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">Data source:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className={`px-3 py-1 text-sm rounded-lg transition ${
                !manualMode
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              📡 Live Matches
            </button>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className={`px-3 py-1 text-sm rounded-lg transition ${
                manualMode
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              ✏️ Manual Entry
            </button>
          </div>
        </div>
      )}

      {/* LIVE MODE - Sport and match selection */}
      {!manualMode && (
        <>
          {/* Sport Selector */}
          <div>
            <label htmlFor="sportSelect" className="input-label">
              Select Sport *
            </label>
            {loadingSports ? (
              <div className="input-field bg-slate-700 animate-pulse">Loading...</div>
            ) : (
              <select
                id="sportSelect"
                value={selectedSport}
                onChange={handleSportChange}
                className="input-field"
              >
                <option value="">-- Select sport --</option>
                {sportGroups.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.sports.map((sport) => (
                      <option key={sport.key} value={sport.key}>
                        {sport.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>

          {/* Event Selector */}
          {selectedSport && (
            <div>
              <label htmlFor="eventSelect" className="input-label">
                Select Match *
              </label>
              {loadingEvents ? (
                <div className="input-field bg-slate-700 animate-pulse">Loading matches...</div>
              ) : events.length === 0 ? (
                <div className="text-yellow-500 text-sm">
                  No matches available for this sport at the moment.
                </div>
              ) : (
                <select
                  id="eventSelect"
                  onChange={handleEventChange}
                  className="input-field"
                >
                  <option value="">-- Select match --</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.home_team} vs {event.away_team} ({formatDate(event.commence_time)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Selected Match Preview */}
          {selectedEvent && (
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <h4 className="font-semibold text-emerald-400 mb-2">Selected Match</h4>
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-3">
                  <TeamLogo teamName={selectedEvent.home_team} sport={selectedSport} size="md" />
                  <span className="text-lg">
                    {selectedEvent.home_team} <span className="text-gray-500">vs</span> {selectedEvent.away_team}
                  </span>
                  <TeamLogo teamName={selectedEvent.away_team} sport={selectedSport} size="md" />
                </div>
                <div className="text-xs text-gray-500">{formatDate(selectedEvent.commence_time)}</div>
              </div>

              {/* Odds Display */}
              {loadingOdds ? (
                <div className="text-center text-gray-400 animate-pulse">Loading odds...</div>
              ) : selectedEvent.analysis ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800 rounded p-2">
                    <div className="text-xs text-gray-500">1 (Home)</div>
                    <div className="text-xl font-bold text-white">
                      {selectedEvent.analysis.averageOdds.home.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedEvent.analysis.impliedProbability.home}%
                    </div>
                  </div>
                  {selectedEvent.analysis.averageOdds.draw && (
                    <div className="bg-slate-800 rounded p-2">
                      <div className="text-xs text-gray-500">X (Draw)</div>
                      <div className="text-xl font-bold text-white">
                        {selectedEvent.analysis.averageOdds.draw.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedEvent.analysis.impliedProbability.draw}%
                      </div>
                    </div>
                  )}
                  <div className="bg-slate-800 rounded p-2">
                    <div className="text-xs text-gray-500">2 (Away)</div>
                    <div className="text-xl font-bold text-white">
                      {selectedEvent.analysis.averageOdds.away.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedEvent.analysis.impliedProbability.away}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm">
                  Odds will be loaded automatically
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MANUAL MODE - Manual entry */}
      {manualMode && (
        <>
          {/* Sport and League */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sport" className="input-label">
                Sport *
              </label>
              <select id="sport" name="sport" required className="input-field">
                <option value="">Select sport</option>
                {manualSports.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="league" className="input-label">
                League *
              </label>
              <input
                type="text"
                id="league"
                name="league"
                required
                placeholder="e.g. Premier League, NBA..."
                className="input-field"
              />
            </div>
          </div>

          {/* Team A vs Team B */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="teamA" className="input-label">
                Team A (Home) *
              </label>
              <input
                type="text"
                id="teamA"
                name="teamA"
                required
                placeholder="e.g. Manchester United"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="teamB" className="input-label">
                Team B (Away) *
              </label>
              <input
                type="text"
                id="teamB"
                name="teamB"
                required
                placeholder="e.g. Liverpool"
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

      {/* Hidden fields for live mode - data from selectedEvent */}
      {!manualMode && selectedEvent && (
        <>
          <input type="hidden" name="sport" value={selectedEvent.sport_title} />
          <input type="hidden" name="league" value={selectedEvent.sport_title} />
          <input type="hidden" name="teamA" value={selectedEvent.home_team} />
          <input type="hidden" name="teamB" value={selectedEvent.away_team} />
          <input type="hidden" name="oddsHome" value={selectedEvent.analysis?.averageOdds.home || 0} />
          <input type="hidden" name="oddsDraw" value={selectedEvent.analysis?.averageOdds.draw || 0} />
          <input type="hidden" name="oddsAway" value={selectedEvent.analysis?.averageOdds.away || 0} />
        </>
      )}

      {/* Your prediction - common for both modes */}
      <div>
        <label htmlFor="userPrediction" className="input-label">
          Your Prediction (Optional)
        </label>
        <input
          type="text"
          id="userPrediction"
          name="userPrediction"
          placeholder="e.g. Home win, Over 2.5 goals..."
          className="input-field"
        />
        <p className="text-xs text-text-muted mt-1">Share your prediction and see how it compares</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!manualMode && !selectedEvent}
        className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!manualMode && !selectedEvent ? 'Select a match to analyze' : 'Analyze Match'}
      </button>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 text-center">
        * Required fields. Analysis is for informational purposes only and does not guarantee any outcome.
        {!manualMode && ' Odds are average values from multiple bookmakers.'}
      </p>
    </form>
  );
}
