/**
 * Daily Picks Section - Homepage Teaser
 * 
 * Shows 3-4 top AI picks for today with blurred details for free users.
 * Links to /picks for full list.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { generateMatchSlug } from '@/lib/match-utils';

interface Pick {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
  kickoff: string;
  hasEdge: boolean;
  hasHighConfidence: boolean;
  edgeBucket: string | null;
  // Pro-only fields
  edgeValue: number | null;
  confidence: number | null;
  selection: string | null;
  odds: number | null;
  predictedScore: string | null;
  headline: string | null;
  locked?: boolean;
}

interface EditorialPicksResponse {
  success: boolean;
  picks: Pick[];
  isPro: boolean;
  meta: {
    total: number;
    showing: number;
    moreAvailable: boolean;
  };
}

const sportEmojis: Record<string, string> = {
  soccer: '⚽',
  basketball: '🏀',
  americanfootball: '🏈',
  icehockey: '🏒',
  baseball: '⚾',
  tennis: '🎾',
  mma: '🥊',
};

const edgeBucketColors: Record<string, string> = {
  SLIGHT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MODERATE: 'bg-green-500/20 text-green-400 border-green-500/30',
  STRONG: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  VERY_STRONG: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const edgeBucketLabels: Record<string, string> = {
  SLIGHT: 'Slight Edge',
  MODERATE: 'Good Edge',
  STRONG: 'Strong Edge',
  VERY_STRONG: 'Very Strong',
};

function formatKickoff(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  const time = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  
  if (isToday) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` ${time}`;
}

function PickCard({ pick, isPro }: { pick: Pick; isPro: boolean }) {
  const sportKey = pick.sport.split('_')[0];
  const emoji = sportEmojis[sportKey] || '🎯';
  const isLocked = pick.locked || !isPro;
  
  return (
    <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-200">
      {/* Sport & League */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-xs text-gray-400 uppercase tracking-wide">{pick.league.replace(/_/g, ' ')}</span>
        </div>
        {pick.edgeBucket && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${edgeBucketColors[pick.edgeBucket] || 'bg-gray-500/20 text-gray-400'}`}>
            {edgeBucketLabels[pick.edgeBucket] || pick.edgeBucket}
          </span>
        )}
      </div>
      
      {/* Teams */}
      <div className="mb-3">
        <div className="text-white font-medium">{pick.homeTeam}</div>
        <div className="text-gray-400 text-sm">vs {pick.awayTeam}</div>
      </div>
      
      {/* Kickoff */}
      <div className="text-xs text-gray-500 mb-3">
        {formatKickoff(pick.kickoff)}
      </div>
      
      {/* Edge & Selection - Blurred for free users */}
      <div className={`space-y-2 ${isLocked ? 'relative' : ''}`}>
        {isLocked && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent z-10 flex items-center justify-center rounded-lg">
            <Link 
              href="/pricing" 
              className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Unlock with Pro
            </Link>
          </div>
        )}
        
        <div className={isLocked ? 'blur-sm select-none' : ''}>
          {/* Edge Value */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">AI Edge</span>
            <span className={`font-mono ${(pick.edgeValue || 0) >= 5 ? 'text-green-400' : 'text-blue-400'}`}>
              {pick.edgeValue ? `+${pick.edgeValue.toFixed(1)}%` : '+4.2%'}
            </span>
          </div>
          
          {/* Confidence */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Confidence</span>
            <span className="text-gray-300">
              {pick.confidence ? `${pick.confidence.toFixed(0)}%` : '62%'}
            </span>
          </div>
          
          {/* Selection */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Pick</span>
            <span className="text-white font-medium">
              {pick.selection || 'Home Win'}
            </span>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <Link 
        href={`/match/${generateMatchSlug(pick.homeTeam, pick.awayTeam, pick.sport, pick.kickoff)}`}
        className="mt-4 block text-center text-xs text-accent hover:text-accent/80 transition-colors"
      >
        View Analysis →
      </Link>
    </div>
  );
}

function PickCardSkeleton() {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-3" />
      <div className="h-5 w-32 bg-white/10 rounded mb-2" />
      <div className="h-4 w-24 bg-white/10 rounded mb-3" />
      <div className="h-3 w-20 bg-white/10 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-white/10 rounded" />
        <div className="h-4 w-full bg-white/10 rounded" />
        <div className="h-4 w-full bg-white/10 rounded" />
      </div>
    </div>
  );
}

interface DailyPicksSectionProps {
  locale?: 'en' | 'sr';
}

interface MetaState {
  total: number;
  showing: number;
  isPro: boolean;
  moreAvailable: boolean;
}

export default function DailyPicksSection({ locale = 'en' }: DailyPicksSectionProps) {
  const { data: session } = useSession();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [meta, setMeta] = useState<MetaState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isPro = session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM';

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        // Use editorial-picks API (same as /picks page) for consistency
        // Show same 3 picks as /picks page
        const res = await fetch('/api/editorial-picks?limit=3');
        if (!res.ok) throw new Error('Failed to fetch');
        const data: EditorialPicksResponse = await res.json();
        
        // Map editorial picks to our Pick interface
        const mappedPicks: Pick[] = data.picks.map((p) => ({
          id: p.id,
          matchId: p.matchId,
          homeTeam: p.homeTeam,
          awayTeam: p.awayTeam,
          sport: p.sport,
          league: p.league,
          kickoff: p.kickoff,
          hasEdge: (p.edgeValue || 0) >= 2,
          hasHighConfidence: (p.confidence || 0) >= 55,
          edgeBucket: p.edgeBucket,
          edgeValue: p.edgeValue,
          confidence: p.confidence,
          selection: p.selection,
          odds: p.odds,
          predictedScore: p.predictedScore,
          headline: p.headline,
          locked: p.locked,
        }));
        
        setPicks(mappedPicks);
        setMeta({
          total: data.meta.total,
          showing: data.meta.showing,
          isPro: data.isPro,
          moreAvailable: data.meta.moreAvailable,
        });
      } catch (e) {
        console.error('Failed to fetch daily picks:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPicks();
  }, []);

  const t = {
    en: {
      title: "Today's AI Picks",
      subtitle: 'Matches where our AI found edge opportunities',
      viewAll: 'View All Picks',
      morePicks: 'more picks available',
      noPicks: 'No picks available right now',
      checkBack: 'Check back closer to match time',
    },
    sr: {
      title: 'Današnji AI Pikovi',
      subtitle: 'Mečevi gde je naš AI pronašao priliku',
      viewAll: 'Pogledaj Sve Pikove',
      morePicks: 'još pikova dostupno',
      noPicks: 'Trenutno nema pikova',
      checkBack: 'Proveri ponovo bliže početku meča',
    },
  }[locale];

  // Don't render if no picks and not loading
  if (!loading && picks.length === 0) {
    return null; // Hide section if no picks
  }

  return (
    <section className="py-12 sm:py-16 bg-[#0a0a0b]">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              {t.title}
            </h2>
            <p className="text-gray-400 mt-1">{t.subtitle}</p>
          </div>
          
          <Link 
            href={locale === 'sr' ? '/sr/picks' : '/picks'}
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors"
          >
            {t.viewAll}
            {meta && meta.total > picks.length && (
              <span className="text-xs bg-accent/20 px-2 py-0.5 rounded-full">
                +{meta.total - picks.length} {t.morePicks}
              </span>
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <PickCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-gray-400">
            <p>{t.noPicks}</p>
            <p className="text-sm mt-1">{t.checkBack}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {picks.map((pick) => (
              <PickCard key={pick.id} pick={pick} isPro={isPro} />
            ))}
          </div>
        )}

        {/* Pro CTA for free users */}
        {!isPro && picks.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20 rounded-xl px-6 py-4">
              <div className="text-left">
                <p className="text-white font-medium">
                  {locale === 'sr' ? 'Otključaj sve pikove i detalje' : 'Unlock all picks & full details'}
                </p>
                <p className="text-sm text-gray-400">
                  {locale === 'sr' ? 'Edge %, confidence, i selekciju' : 'Edge %, confidence, and selection'}
                </p>
              </div>
              <Link
                href="/pricing"
                className="bg-accent hover:bg-accent/90 text-black font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                {locale === 'sr' ? 'Idi na Pro' : 'Go Pro'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
