'use client';

import { useState } from 'react';

interface PendingPrediction {
  id: string;
  matchId: string;
  matchName: string;
  sport: string;
  league: string;
  kickoff: Date;
  prediction: string;
  selection: string | null;
  conviction: number;
  modelProbability: number | null;
  marketOddsAtPrediction: number | null;
  valueBetSide: string | null;
  valueBetOdds: number | null;
}

interface PendingPredictionsManagerProps {
  predictions: PendingPrediction[];
  onUpdate?: () => void;
}

export default function PendingPredictionsManager({
  predictions: initialPredictions,
  onUpdate
}: PendingPredictionsManagerProps) {
  const [predictions, setPredictions] = useState(initialPredictions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'past' | 'upcoming'>('past');
  const [bulkFetching, setBulkFetching] = useState(false);

  // Handle bulk fetch all results
  const handleFetchAllResults = async () => {
    setBulkFetching(true);
    setMessage(null);

    try {
      // Call admin API that internally triggers track-predictions with proper auth
      const response = await fetch('/api/admin/predictions/fetch-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch results');
      }

      const { updatedOutcomes, stuckPredictions, errors } = data;

      if (updatedOutcomes > 0) {
        // Refresh the page to get updated predictions list
        window.location.reload();
      } else if (stuckPredictions > 0) {
        setMessage({
          type: 'error',
          text: `⚠️ Could not fetch results for ${stuckPredictions} predictions. Try again later or enter manually.`
        });
      } else {
        setMessage({
          type: 'success',
          text: '✅ All predictions already have results or no finished matches found.'
        });
      }

      if (errors.length > 0) {
        console.error('Bulk fetch errors:', errors);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to fetch results'
      });
    } finally {
      setBulkFetching(false);
    }
  };

  // Handle delete prediction (for garbage/invalid data)
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prediction? This cannot be undone.')) return;

    setLoading(id);
    try {
      const response = await fetch(`/api/admin/predictions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }

      // Remove from list
      setPredictions(prev => prev.filter(p => p.id !== id));
      setMessage({ type: 'success', text: '🗑️ Prediction deleted' });
      onUpdate?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete'
      });
    } finally {
      setLoading(null);
    }
  };

  const now = new Date();

  // Helper to determine match status more accurately
  // A match needs ~3 hours after kickoff to be considered "finished"
  const isFinished = (kickoff: Date) => {
    const kickoffTime = new Date(kickoff);
    const threeHoursAfter = new Date(kickoffTime.getTime() + 3 * 60 * 60 * 1000);
    return now > threeHoursAfter;
  };

  const isInProgress = (kickoff: Date) => {
    const kickoffTime = new Date(kickoff);
    const threeHoursAfter = new Date(kickoffTime.getTime() + 3 * 60 * 60 * 1000);
    return now > kickoffTime && now <= threeHoursAfter;
  };

  const isPast = (date: Date) => new Date(date) < now;

  // Count predictions by status
  const finishedCount = predictions.filter(p => isFinished(p.kickoff)).length;
  const inProgressCount = predictions.filter(p => isInProgress(p.kickoff)).length;
  const upcomingCount = predictions.filter(p => new Date(p.kickoff) >= now).length;

  const filteredPredictions = predictions.filter(p => {
    const kickoff = new Date(p.kickoff);
    if (filter === 'past') return isFinished(kickoff); // Only show matches 3h+ after kickoff
    if (filter === 'upcoming') return kickoff >= now || isInProgress(kickoff); // Include in-progress
    return true;
  });

  const handleEdit = (prediction: PendingPrediction) => {
    setEditingId(prediction.id);
    setHomeScore('');
    setAwayScore('');
    setMessage(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setHomeScore('');
    setAwayScore('');
  };

  const handleSubmit = async (id: string) => {
    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setMessage({ type: 'error', text: 'Please enter valid scores (0 or higher)' });
      return;
    }

    setLoading(id);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/predictions/${id}/result`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore: home, awayScore: away }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update');
      }

      // Remove from list
      setPredictions(prev => prev.filter(p => p.id !== id));
      setMessage({
        type: 'success',
        text: `✅ ${data.prediction.matchName}: ${data.prediction.actualScore} → ${data.prediction.outcome}`
      });
      setEditingId(null);
      setHomeScore('');
      setAwayScore('');

      onUpdate?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update prediction'
      });
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPast = (date: Date) => new Date(date) < now;

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('past')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === 'past'
              ? 'bg-accent text-white'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
          >
            ✅ Finished ({finishedCount})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === 'upcoming'
              ? 'bg-accent text-white'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
          >
            📅 Upcoming ({upcomingCount + inProgressCount})
            {inProgressCount > 0 && <span className="ml-1 text-yellow-400">({inProgressCount} live)</span>}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === 'all'
              ? 'bg-accent text-white'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
          >
            All ({predictions.length})
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Bulk Fetch Button */}
          {filter === 'past' && filteredPredictions.length > 0 && (
            <button
              onClick={handleFetchAllResults}
              disabled={bulkFetching}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              {bulkFetching ? '⏳ Fetching...' : `🔄 Fetch All Results (${filteredPredictions.length})`}
            </button>
          )}
          <span className="text-xs text-text-muted">
            {filteredPredictions.length} predictions
          </span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
          {message.text}
        </div>
      )}

      {/* Predictions List */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-border-primary">
          <h3 className="text-sm font-medium text-text-primary">Pending Predictions</h3>
          <p className="text-xs text-text-muted mt-1">
            Enter final scores to mark predictions as HIT or MISS
          </p>
        </div>

        {filteredPredictions.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No {filter === 'past' ? 'past' : filter === 'upcoming' ? 'upcoming' : ''} pending predictions
          </div>
        ) : (
          <div className="divide-y divide-border-primary">
            {filteredPredictions.map((pred) => {
              const matchFinished = isFinished(pred.kickoff);
              const matchInProgress = isInProgress(pred.kickoff);
              
              return (
              <div key={pred.id} className="p-4 hover:bg-bg-tertiary/30">
                <div className="flex items-start justify-between gap-4">
                  {/* Match Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        matchFinished
                          ? 'bg-green-500/20 text-green-400'
                          : matchInProgress
                            ? 'bg-yellow-500/20 text-yellow-400 animate-pulse'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                        {matchFinished ? '✅ Finished' : matchInProgress ? '🔴 LIVE' : '📅 Upcoming'}
                      </span>
                      <span className="text-xs text-text-muted">{pred.sport}</span>
                    </div>
                    <div className="text-text-primary font-medium truncate">
                      {pred.matchName}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      {pred.league} • {formatDate(pred.kickoff)}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-text-muted">
                        Prediction: <span className="text-accent">{pred.prediction}</span>
                      </span>
                      {pred.modelProbability && (
                        <span className="text-text-muted">
                          Prob: <span className="text-text-secondary">{pred.modelProbability.toFixed(0)}%</span>
                        </span>
                      )}
                      {pred.valueBetSide && (
                        <span className="text-purple-400">
                          Value: {pred.valueBetSide} @ {pred.valueBetOdds?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    {editingId === pred.id ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
                          <input
                            type="number"
                            min="0"
                            value={homeScore}
                            onChange={(e) => setHomeScore(e.target.value)}
                            placeholder="H"
                            className="w-12 h-8 text-center bg-bg-secondary rounded border border-border-primary text-text-primary text-sm focus:border-accent focus:outline-none"
                            autoFocus
                          />
                          <span className="text-text-muted">-</span>
                          <input
                            type="number"
                            min="0"
                            value={awayScore}
                            onChange={(e) => setAwayScore(e.target.value)}
                            placeholder="A"
                            className="w-12 h-8 text-center bg-bg-secondary rounded border border-border-primary text-text-primary text-sm focus:border-accent focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleSubmit(pred.id)}
                          disabled={loading === pred.id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          {loading === pred.id ? '...' : '✓'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={loading === pred.id}
                          className="px-3 py-1.5 bg-bg-tertiary hover:bg-bg-secondary text-text-secondary rounded-lg text-sm transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(pred)}
                          disabled={!matchFinished || loading === pred.id}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            matchFinished
                              ? 'bg-accent hover:bg-accent/80 text-white'
                              : matchInProgress
                                ? 'bg-yellow-500/20 text-yellow-400 cursor-not-allowed'
                                : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                            }`}
                        >
                          {matchFinished ? 'Enter Result' : matchInProgress ? 'Live...' : 'Not Started'}
                        </button>
                        <button
                          onClick={() => handleDelete(pred.id)}
                          disabled={loading === pred.id}
                          className="px-2 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete this prediction"
                        >
                          {loading === pred.id ? '...' : '🗑️'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
  );
}
