/**
 * Analyzer Form component
 * 
 * Form for entering match data to be analyzed.
 * Sends data to /api/analyze endpoint.
 */

'use client';

import { useState } from 'react';
import { AnalyzeRequest, AnalyzeResponse } from '@/types';
import { USAGE_UPDATED_EVENT } from './auth/UserMenu';

interface AnalyzerFormProps {
  onResult: (result: AnalyzeResponse) => void;
  onLoading: (loading: boolean) => void;
}

export default function AnalyzerForm({ onResult, onLoading }: AnalyzerFormProps) {
  const [error, setError] = useState<string | null>(null);

  // List of sports for select
  const sports = [
    'Soccer',
    'Basketball',
    'Tennis',
    'Hockey',
    'American Football',
    'Baseball',
    'MMA / UFC',
    'Other',
  ];

  // Handler for submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    onLoading(true);

    const formData = new FormData(e.currentTarget);

    // Parse form values
    const sport = formData.get('sport') as string;
    const league = formData.get('league') as string;
    const homeTeam = formData.get('teamA') as string;
    const awayTeam = formData.get('teamB') as string;
    const oddsHome = parseFloat(formData.get('oddsHome') as string) || 0;
    const oddsDraw = parseFloat(formData.get('oddsDraw') as string) || null;
    const oddsAway = parseFloat(formData.get('oddsAway') as string) || 0;
    const userPick = formData.get('userPrediction') as string;

    // Build request in new format
    const data: AnalyzeRequest = {
      matchData: {
        sport,
        league,
        homeTeam,
        awayTeam,
        sourceType: 'MANUAL',
        odds: {
          home: oddsHome,
          draw: oddsDraw,
          away: oddsAway,
        },
      },
      userPick,
    };

    // Basic validation
    if (!sport || !league || !homeTeam || !awayTeam) {
      setError('Please fill in all required fields.');
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
        throw new Error(result.error || 'Analysis error');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sport and League */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sport" className="input-label">
            Sport *
          </label>
          <select
            id="sport"
            name="sport"
            required
            className="input-field"
          >
            <option value="">Select sport</option>
            {sports.map((sport) => (
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

      {/* Your prediction */}
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
      <button type="submit" className="btn-primary w-full text-lg py-4">
        Analyze Match
      </button>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 text-center">
        * Required fields. Analysis is for informational purposes only and does not guarantee any outcome.
      </p>
    </form>
  );
}
