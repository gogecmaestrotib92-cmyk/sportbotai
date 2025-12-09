/**
 * Analysis Detail Page
 * 
 * Shows full analysis details from history
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AnalyzeResponse } from '@/types';
import AnalysisResults from '@/components/analyzer/AnalysisResults';

interface FullAnalysis {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string | null;
  userPick: string | null;
  userStake: number | null;
  fullResponse: AnalyzeResponse | null;
  createdAt: string;
}

export default function AnalysisDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/history');
      return;
    }

    if (status === 'authenticated' && id) {
      fetchAnalysis();
    }
  }, [status, id, router]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/history/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Analysis not found');
        } else {
          throw new Error('Failed to fetch analysis');
        }
        return;
      }
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError('Failed to load analysis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="container-custom max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-bg-card rounded w-64"></div>
            <div className="h-48 bg-bg-card rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="container-custom text-center">
          <p className="text-danger mb-4">{error || 'Analysis not found'}</p>
          <Link href="/history" className="btn-primary">
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 sm:py-12">
      <div className="container-custom max-w-4xl">
        {/* Back Link */}
        <Link 
          href="/history" 
          className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-6 transition-colors"
        >
          ← Back to History
        </Link>

        {/* Header */}
        <div className="bg-bg-card rounded-card border border-divider p-5 mb-6">
          <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
            <span className="uppercase tracking-wider">{analysis.league}</span>
            <span>•</span>
            <span>
              {new Date(analysis.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-text-primary">
            {analysis.homeTeam} vs {analysis.awayTeam}
          </h1>
          
          {analysis.userPick && (
            <p className="text-text-secondary mt-2">
              Your pick: <span className="font-semibold text-primary">{analysis.userPick}</span>
              {analysis.userStake && ` • Stake: €${analysis.userStake}`}
            </p>
          )}
        </div>

        {/* Full Analysis Results */}
        {analysis.fullResponse ? (
          <AnalysisResults result={analysis.fullResponse} />
        ) : (
          <div className="bg-bg-card rounded-card border border-divider p-8 text-center">
            <p className="text-text-secondary">Full analysis data not available</p>
          </div>
        )}
      </div>
    </div>
  );
}
