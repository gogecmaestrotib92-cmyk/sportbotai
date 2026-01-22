/**
 * Serbian Analysis History Page - /sr/history
 * Istorija Analiza - prikazuje prethodne analize korisnika
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
    outcome?: string | null;
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

const riskLabelsSr: Record<string, string> = {
  LOW: 'Nizak',
  MEDIUM: 'Srednji',
  HIGH: 'Visok',
};

function getSportIcon(sport: string): string {
  const normalized = sport.toLowerCase();
  for (const [key, icon] of Object.entries(sportIcons)) {
    if (normalized.includes(key)) return icon;
  }
  return '🎯';
}

export default function SerbianHistoryPage() {
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
      if (!res.ok) throw new Error('Greška pri učitavanju istorije');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError('Greška pri učitavanju istorije');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sr/login?callbackUrl=/sr/history');
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
    if (!confirm('Obrisati ovu analizu? Ova akcija se ne može poništiti.')) return;
    
    try {
      setDeletingId(id);
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Greška pri brisanju');
      
      setHistory(prev => prev ? {
        ...prev,
        analyses: prev.analyses.filter(a => a.id !== id),
        pagination: { ...prev.pagination, total: prev.pagination.total - 1 }
      } : null);
    } catch (err) {
      alert('Greška pri brisanju analize');
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
              title="Greška pri učitavanju istorije"
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
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing} 
      />
      
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              Istorija Analiza
            </h1>
            <p className="text-text-secondary">
              {history?.pagination.total || 0} ukupno analiza
              {history?.accessInfo?.restricted && history?.accessInfo?.hiddenCount > 0 && (
                <span className="text-amber-400 ml-2">
                  (prikazano poslednjih 24h)
                </span>
              )}
            </p>
          </div>
          <Link 
            href="/history" 
            className="text-sm text-slate-500 hover:text-primary transition-colors"
          >
            🌐 English
          </Link>
        </div>

        {/* Access Banner for Free users */}
        {history?.accessInfo?.restricted && (
          <div className="mb-6">
            <HistoryAccessBanner 
              hiddenCount={history.accessInfo.hiddenCount}
              totalCount={history.accessInfo.totalCount}
            />
          </div>
        )}

        {/* Analyses List */}
        {!history?.analyses.length ? (
          <div className="bg-bg-card rounded-card border border-divider p-8 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Nemate analiza
            </h2>
            <p className="text-text-secondary mb-6">
              Počnite analizirati utakmice da biste videli istoriju ovde.
            </p>
            <Link href="/sr/matches" className="btn-primary inline-block">
              Pregledaj Utakmice
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="bg-bg-card rounded-card border border-divider p-4 sm:p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Match Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getSportIcon(analysis.sport)}</span>
                      <span className="text-sm text-text-secondary">{analysis.league}</span>
                      {analysis.riskLevel && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${riskColors[analysis.riskLevel]}`}>
                          Rizik: {riskLabelsSr[analysis.riskLevel] || analysis.riskLevel}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <TeamLogo teamName={analysis.homeTeam} sport={analysis.sport} size="md" />
                        <span className="font-medium text-text-primary">{analysis.homeTeam}</span>
                      </div>
                      <span className="text-text-tertiary">vs</span>
                      <div className="flex items-center gap-2">
                        <TeamLogo teamName={analysis.awayTeam} sport={analysis.sport} size="md" />
                        <span className="font-medium text-text-primary">{analysis.awayTeam}</span>
                      </div>
                    </div>

                    {/* Probabilities */}
                    <div className="flex gap-4 text-sm">
                      {analysis.homeWinProb && (
                        <span className="text-text-secondary">
                          Domaćin: <span className="text-text-primary font-medium">{analysis.homeWinProb}%</span>
                        </span>
                      )}
                      {analysis.drawProb && (
                        <span className="text-text-secondary">
                          Nerešeno: <span className="text-text-primary font-medium">{analysis.drawProb}%</span>
                        </span>
                      )}
                      {analysis.awayWinProb && (
                        <span className="text-text-secondary">
                          Gost: <span className="text-text-primary font-medium">{analysis.awayWinProb}%</span>
                        </span>
                      )}
                    </div>

                    {/* Outcome Badge */}
                    {analysis.predictionOutcome?.outcome && (
                      <div className="mt-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          analysis.predictionOutcome.outcome === 'HIT' 
                            ? 'bg-success/20 text-success' 
                            : analysis.predictionOutcome.outcome === 'MISS'
                            ? 'bg-danger/20 text-danger'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {analysis.predictionOutcome.outcome === 'HIT' ? '✓ Pogodak' 
                            : analysis.predictionOutcome.outcome === 'MISS' ? '✗ Promašaj' 
                            : analysis.predictionOutcome.outcome === 'PENDING' ? '⏳ Na čekanju'
                            : analysis.predictionOutcome.outcome}
                          {analysis.predictionOutcome.actualScore && ` (${analysis.predictionOutcome.actualScore})`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 items-end">
                    <span className="text-xs text-text-tertiary">
                      {new Date(analysis.createdAt).toLocaleDateString('sr-RS', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => deleteAnalysis(analysis.id)}
                      disabled={deletingId === analysis.id}
                      className="text-text-tertiary hover:text-danger transition-colors text-sm disabled:opacity-50"
                    >
                      {deletingId === analysis.id ? 'Brisanje...' : 'Obriši'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {history.pagination.hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => fetchHistory(history.pagination.offset + history.pagination.limit)}
                  className="text-primary hover:text-primary-hover transition-colors"
                >
                  Učitaj još →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
