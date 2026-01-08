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

  const now = new Date();

  const filteredPredictions = predictions.filter(p => {
    const kickoff = new Date(p.kickoff);
    if (filter === 'past') return kickoff < now;
    if (filter === 'upcoming') return kickoff >= now;
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
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'past' 
                ? 'bg-accent text-white' 
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            ⏰ Past ({predictions.filter(p => new Date(p.kickoff) < now).length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'upcoming' 
                ? 'bg-accent text-white' 
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            📅 Upcoming ({predictions.filter(p => new Date(p.kickoff) >= now).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-accent text-white' 
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            All ({predictions.length})
          </button>
        </div>
        <span className="text-xs text-text-muted">
          {filteredPredictions.length} predictions
        </span>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
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
            {filteredPredictions.map((pred) => (
              <div key={pred.id} className="p-4 hover:bg-bg-tertiary/30">
                <div className="flex items-start justify-between gap-4">
                  {/* Match Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isPast(pred.kickoff) 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {isPast(pred.kickoff) ? '⏰ Finished' : '📅 Upcoming'}
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
                      <button
                        onClick={() => handleEdit(pred)}
                        disabled={!isPast(pred.kickoff)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isPast(pred.kickoff)
                            ? 'bg-accent hover:bg-accent/80 text-white'
                            : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
                        }`}
                      >
                        {isPast(pred.kickoff) ? 'Enter Result' : 'Not Started'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
