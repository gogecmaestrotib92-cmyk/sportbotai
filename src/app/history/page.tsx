/**
 * Analysis History Page
 * 
 * Shows user's past analyses with ability to view details and delete.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TeamLogo from '@/components/ui/TeamLogo';
import LeagueLogo from '@/components/ui/LeagueLogo';

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
}

interface HistoryResponse {
  analyses: AnalysisSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/history');
      return;
    }

    if (status === 'authenticated') {
      fetchHistory();
    }
  }, [status, router]);

  const fetchHistory = async (offset = 0) => {
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
  };

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
          <div className="text-center py-12">
            <p className="text-danger mb-4">{error}</p>
            <button onClick={() => fetchHistory()} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 sm:py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              Analysis History
            </h1>
            <p className="text-text-secondary">
              {history?.pagination.total || 0} total analyses
            </p>
          </div>
          <Link href="/analyzer" className="btn-primary">
            + New Analysis
          </Link>
        </div>

        {/* Empty State */}
        {history?.analyses.length === 0 && (
          <div className="text-center py-16 bg-bg-card rounded-card border border-divider">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              No analyses yet
            </h2>
            <p className="text-text-secondary mb-6">
              Your analysis history will appear here
            </p>
            <Link href="/analyzer" className="btn-primary">
              Start Analyzing
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
