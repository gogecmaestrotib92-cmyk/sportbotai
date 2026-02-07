/**
 * Analysis History Page - Simplified
 * 
 * Shows user's past picks with simple success/failure indicators.
 * Clean, minimal design - just the essential information.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TeamLogo from '@/components/ui/TeamLogo';

interface AnalysisSummary {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string | null;
  userPick: string | null;
  bestValueSide: string | null;
  createdAt: string;
  predictionOutcome?: {
    wasAccurate: boolean | null;
    actualScore: string | null;
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
}

// Get display pick - what did we suggest?
function getPickDisplay(analysis: AnalysisSummary): { pick: string; team: string | null } {
  const pick = analysis.userPick || analysis.bestValueSide;
  if (!pick || pick === 'NONE') return { pick: 'No pick', team: null };
  
  if (pick === 'HOME' || pick === 'home') {
    return { pick: analysis.homeTeam, team: 'home' };
  }
  if (pick === 'AWAY' || pick === 'away') {
    return { pick: analysis.awayTeam, team: 'away' };
  }
  if (pick === 'DRAW' || pick === 'draw') {
    return { pick: 'Draw', team: null };
  }
  return { pick, team: null };
}

// Get outcome status
function getOutcomeStatus(analysis: AnalysisSummary): { 
  status: 'hit' | 'miss' | 'pending' | 'void' | 'none';
  label: string;
  color: string;
} {
  const outcome = analysis.predictionOutcome?.outcome;
  
  if (outcome === 'HIT') {
    return { status: 'hit', label: '✓ Hit', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  }
  if (outcome === 'MISS') {
    return { status: 'miss', label: '✗ Miss', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  }
  if (outcome === 'VOID' || outcome === 'PUSH') {
    return { status: 'void', label: '○ Void', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' };
  }
  if (outcome === 'PENDING') {
    return { status: 'pending', label: '⏳ Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  }
  
  // No outcome yet - check if match is in the past
  if (analysis.matchDate && new Date(analysis.matchDate) < new Date()) {
    return { status: 'pending', label: '⏳ Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  }
  
  return { status: 'none', label: 'Upcoming', color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' };
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/history?limit=50&offset=${offset}`);
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

  // Calculate stats
  const stats = history?.analyses.reduce(
    (acc, a) => {
      const outcome = a.predictionOutcome?.outcome;
      if (outcome === 'HIT') acc.hits++;
      else if (outcome === 'MISS') acc.misses++;
      else if (outcome === 'PENDING' || (a.matchDate && new Date(a.matchDate) < new Date() && !outcome)) acc.pending++;
      return acc;
    },
    { hits: 0, misses: 0, pending: 0 }
  ) || { hits: 0, misses: 0, pending: 0 };

  const hitRate = stats.hits + stats.misses > 0 
    ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(0) 
    : '-';

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-bg py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-white/5 rounded w-48"></div>
            <div className="h-16 bg-white/5 rounded"></div>
            <div className="h-16 bg-white/5 rounded"></div>
            <div className="h-16 bg-white/5 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => fetchHistory()} className="text-violet-400 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Pick History</h1>
          <p className="text-zinc-500 text-sm">Track record of your analyzed matches</p>
        </div>

        {/* Stats Summary */}
        {history && history.analyses.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
              <div className="text-2xl font-bold text-white">{history.analyses.length}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</div>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
              <div className="text-2xl font-bold text-emerald-400">{stats.hits}</div>
              <div className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Hits</div>
            </div>
            <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{stats.misses}</div>
              <div className="text-[10px] text-red-400/70 uppercase tracking-wider">Misses</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
              <div className="text-2xl font-bold text-white">{hitRate}%</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Hit Rate</div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!history || history.analyses.length === 0) && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-lg font-medium text-white mb-2">No picks yet</h2>
            <p className="text-zinc-500 mb-6 text-sm">Start analyzing matches to track your record</p>
            <Link 
              href="/matches" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Browse Matches
            </Link>
          </div>
        )}

        {/* Picks List */}
        {history && history.analyses.length > 0 && (
          <div className="space-y-2">
            {history.analyses.map((analysis) => {
              const pickInfo = getPickDisplay(analysis);
              const outcome = getOutcomeStatus(analysis);
              
              return (
                <div
                  key={analysis.id}
                  className="flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5 transition-colors"
                >
                  {/* Teams */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex -space-x-2">
                      <TeamLogo teamName={analysis.homeTeam} sport={analysis.sport} size="sm" />
                      <TeamLogo teamName={analysis.awayTeam} sport={analysis.sport} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {analysis.homeTeam} vs {analysis.awayTeam}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {new Date(analysis.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>

                  {/* Pick */}
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 mb-0.5">Pick</div>
                    <div className={`text-sm font-medium ${
                      pickInfo.team === 'home' ? 'text-blue-400' : 
                      pickInfo.team === 'away' ? 'text-orange-400' : 
                      'text-zinc-400'
                    }`}>
                      {pickInfo.pick}
                    </div>
                  </div>

                  {/* Score (if available) */}
                  {analysis.predictionOutcome?.actualScore && (
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 mb-0.5">Score</div>
                      <div className="text-sm font-mono text-white">
                        {analysis.predictionOutcome.actualScore}
                      </div>
                    </div>
                  )}

                  {/* Outcome Badge */}
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${outcome.color}`}>
                    {outcome.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {history?.pagination.hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => fetchHistory(history.pagination.offset + history.pagination.limit)}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Load more
            </button>
          </div>
        )}

        {/* Browse Matches CTA */}
        {history && history.analyses.length > 0 && (
          <div className="mt-8 text-center">
            <Link 
              href="/matches" 
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Browse upcoming matches →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
