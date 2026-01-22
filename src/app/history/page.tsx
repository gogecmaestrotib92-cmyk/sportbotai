/**
 * Analysis History Page
 * 
 * Shows user's past analyses with ability to view details and delete.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TeamLogo from '@/components/ui/TeamLogo';
import LeagueLogo from '@/components/ui/LeagueLogo';
import { NoAnalysisHistory, ErrorState } from '@/components/ui';
import HistoryAccessBanner from '@/components/HistoryAccessBanner';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator';

interface AnalysisSummary {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string | null;
  homeWinProb: number | null;
  drawProb: number | null;
  awayWinProb: number | null;
  riskLevel: string | null;
  bestValueSide: string | null;
  userPick: string | null;
  createdAt: string;
  marketEdge?: {
    label: string | null;
    strength: string | null;
    summary: string | null;
  } | null;
  predictionOutcome?: {
    wasAccurate: boolean | null;
    actualResult: string | null;
    actualScore: string | null;
    predictedScenario: string | null;
    outcome?: string | null; // PENDING, HIT, MISS, VOID, PUSH
  } | null;
}

interface HistoryResponse {
  analyses: AnalysisSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  accessInfo?: {
    plan: string;
    restricted: boolean;
    visibleCount: number;
    totalCount: number;
    hiddenCount: number;
    message: string | null;
  };
}

const sportIcons: Record<string, string> = {
  soccer: '⚽',
  basketball: '🏀',
  hockey: '🏒',
  american_football: '🏈',
  baseball: '⚾',
  tennis: '🎾',
  mma: '🥊',
};

const riskColors: Record<string, string> = {
  LOW: 'bg-success/10 text-success border-success/20',
  MEDIUM: 'bg-warning/10 text-warning border-warning/20',
  HIGH: 'bg-danger/10 text-danger border-danger/20',
};

function getSportIcon(sport: string): string {
  const normalized = sport.toLowerCase();
  for (const [key, icon] of Object.entries(sportIcons)) {
    if (normalized.includes(key)) return icon;
  }
  return '🎯';
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/history?limit=20&offset=${offset}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError('Failed to load history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/history');
      return;
    }

    if (status === 'authenticated') {
      fetchHistory();
    }
  }, [status, router, fetchHistory]);

  // Pull-to-refresh DISABLED - causing scroll issues on Android Chrome
  // Users can use browser's native pull-to-refresh or the refresh button
  const isRefreshing = false;
  const pullDistance = 0;

  const deleteAnalysis = async (id: string) => {
    if (!confirm('Delete this analysis? This cannot be undone.')) return;
    
    try {
      setDeletingId(id);
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      // Remove from local state
      setHistory(prev => prev ? {
        ...prev,
        analyses: prev.analyses.filter(a => a.id !== id),
        pagination: { ...prev.pagination, total: prev.pagination.total - 1 }
      } : null);
    } catch (err) {
      alert('Failed to delete analysis');
    } finally {
      setDeletingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-bg-card rounded w-48"></div>
            <div className="h-32 bg-bg-card rounded"></div>
            <div className="h-32 bg-bg-card rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="container-custom">
          <div className="bg-bg-card rounded-card border border-divider">
            <ErrorState 
              title="Failed to Load History"
              message={error}
              onRetry={() => fetchHistory()}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 sm:py-12">
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing} 
      />
      
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              Analysis History
            </h1>
            <p className="text-text-secondary">
              {history?.pagination.total || 0} total analyses
              {history?.accessInfo?.restricted && history?.accessInfo?.hiddenCount > 0 && (
                <span className="text-amber-400 ml-2">
                  (showing last 24h)
                </span>
              )}
            </p>
          </div>
          <Link href="/matches" className="btn-primary">
            Browse Matches
          </Link>
        </div>

        {/* History Access Banner for Free Users */}
        {history?.accessInfo?.restricted && history?.accessInfo?.hiddenCount > 0 && (
          <HistoryAccessBanner 
            hiddenCount={history.accessInfo.hiddenCount}
            totalCount={history.accessInfo.totalCount}
            className="mb-6"
          />
        )}

        {/* Empty State */}
        {history?.analyses.length === 0 && (
          <div className="bg-bg-card rounded-card border border-divider">
            <NoAnalysisHistory />
            <Link href="/matches" className="btn-primary">
              Browse Matches
            </Link>
          </div>
        )}

        {/* Analysis List */}
        <div className="space-y-4">
          {history?.analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="bg-bg-card rounded-card border border-divider p-4 sm:p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Match Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <LeagueLogo leagueName={analysis.league} sport={analysis.sport} size="sm" />
                    <span className="text-xs text-text-muted uppercase tracking-wider">
                      {analysis.league}
                    </span>
                    {analysis.riskLevel && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${riskColors[analysis.riskLevel] || ''}`}>
                        {analysis.riskLevel} Risk
                      </span>
                    )}
                    {/* Prediction Outcome Badge */}
                    {analysis.predictionOutcome?.wasAccurate === true && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-success/10 text-success border-success/20">
                        ✓ Correct
                      </span>
                    )}
                    {analysis.predictionOutcome?.wasAccurate === false && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-danger/10 text-danger border-danger/20">
                        ✗ Wrong
                      </span>
                    )}
                    {/* Show Pending for: PENDING outcome, or no prediction yet for past matches */}
                    {((analysis.predictionOutcome?.outcome === 'PENDING' || analysis.predictionOutcome?.wasAccurate === null) ||
                      (analysis.predictionOutcome === null && analysis.matchDate && new Date(analysis.matchDate) < new Date())) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <TeamLogo teamName={analysis.homeTeam} sport={analysis.sport} size="sm" />
                    <h3 className="font-semibold text-text-primary truncate">
                      {analysis.homeTeam}
                    </h3>
                    <span className="text-text-muted">vs</span>
                    <TeamLogo teamName={analysis.awayTeam} sport={analysis.sport} size="sm" />
                    <span className="font-medium text-text-secondary truncate">
                      {analysis.awayTeam}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                    {/* Probabilities */}
                    {analysis.homeWinProb !== null && (
                      <span>
                        H: {analysis.homeWinProb.toFixed(0)}%
                        {analysis.drawProb !== null && ` • D: ${analysis.drawProb.toFixed(0)}%`}
                        {analysis.awayWinProb !== null && ` • A: ${analysis.awayWinProb.toFixed(0)}%`}
                      </span>
                    )}
                    
                    {/* Best Value */}
                    {analysis.bestValueSide && analysis.bestValueSide !== 'NONE' && (
                      <span className="text-success font-medium">
                        Value: {analysis.bestValueSide}
                      </span>
                    )}
                    
                    {/* Market Edge */}
                    {analysis.marketEdge?.label && (
                      <span className={`font-medium ${
                        analysis.marketEdge.strength === 'strong' ? 'text-emerald-400' :
                        analysis.marketEdge.strength === 'moderate' ? 'text-yellow-400' :
                        'text-zinc-400'
                      }`}>
                        📊 {analysis.marketEdge.label}
                      </span>
                    )}
                    
                    {/* Actual Result if available */}
                    {analysis.predictionOutcome?.actualScore && (
                      <span className="text-white font-medium">
                        Final: {analysis.predictionOutcome.actualScore}
                      </span>
                    )}
                  </div>
                  
                  {/* Date */}
                  <p className="text-xs text-text-muted mt-2">
                    Analyzed: {new Date(analysis.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/history/${analysis.id}`}
                    className="px-3 py-1.5 text-sm bg-bg-hover hover:bg-primary hover:text-white rounded-btn transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => deleteAnalysis(analysis.id)}
                    disabled={deletingId === analysis.id}
                    className="px-3 py-1.5 text-sm text-danger hover:bg-danger/10 rounded-btn transition-colors disabled:opacity-50"
                  >
                    {deletingId === analysis.id ? '...' : '×'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {history?.pagination.hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => fetchHistory(history.pagination.offset + history.pagination.limit)}
              className="btn-secondary"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
