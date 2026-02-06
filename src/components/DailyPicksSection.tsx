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
import { getOptimizedTeamLogo, getOptimizedLeagueLogo } from '@/lib/logos';
import { Lock, Shield, ArrowRight } from 'lucide-react';

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
  confidence: number | null; // Data quality score (0-100)
  modelProbability: number | null; // Win probability for selected side
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

// Team Logo with fallback - Light card style (uses optimized ESPN URLs)
function TeamLogo({ name, sport, size = 32 }: { name: string; sport: string; size?: number }) {
  const [error, setError] = useState(false);
  // Use optimized URL that resizes ESPN images on-the-fly
  const url = getOptimizedTeamLogo(name, sport, size);
  
  if (error || !url) {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div 
        className="flex items-center justify-center bg-zinc-100 rounded-lg text-zinc-600 font-bold"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {initials}
      </div>
    );
  }
  
  return (
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      className="rounded-lg bg-zinc-50 object-contain p-0.5"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}

// League Logo with fallback (uses optimized ESPN URLs)
function LeagueLogo({ league, size = 16 }: { league: string; size?: number }) {
  const [error, setError] = useState(false);
  // Use optimized URL for league logos
  const url = getOptimizedLeagueLogo(league, size);
  
  if (error || !url) {
    return <Shield className="text-zinc-400" style={{ width: size, height: size }} />;
  }
  
  return (
    <img
      src={url}
      alt={league}
      width={size}
      height={size}
      className="rounded-sm object-contain"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}

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

function formatLeague(league: string): string {
  return league
    .replace(/_/g, ' ')
    .replace(/soccer |basketball |americanfootball |icehockey /gi, '')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function PickCard({ pick, isPro }: { pick: Pick; isPro: boolean }) {
  const isLocked = pick.locked || !isPro;
  
  return (
    <div className="group relative bg-[#FFF3E0] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Header with league logo and edge */}
      <div className="bg-gradient-to-r from-purple-900/95 via-purple-800/90 to-purple-900/95 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg">
          <LeagueLogo league={pick.league} size={16} />
          <span className="text-white/90 text-xs font-medium">{formatLeague(pick.league)}</span>
        </div>
        {pick.edgeBucket && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-black text-white">
            {edgeBucketLabels[pick.edgeBucket] || pick.edgeBucket}
          </span>
        )}
      </div>
      
      {/* Teams with logos */}
      <div className="p-4 flex-1 tracking-wide">
        <div className="flex items-center gap-3 mb-3">
          <TeamLogo name={pick.homeTeam} sport={pick.sport} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-[#000000] font-semibold text-sm truncate">{pick.homeTeam}</div>
            <div className="text-[#000000]/60 text-xs">Home</div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <TeamLogo name={pick.awayTeam} sport={pick.sport} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-[#000000] font-semibold text-sm truncate">{pick.awayTeam}</div>
            <div className="text-[#000000]/60 text-xs">Away</div>
          </div>
        </div>
        
        {/* Kickoff */}
        <div className="flex items-center gap-1.5 text-xs text-[#000000] font-semibold mb-4">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatKickoff(pick.kickoff)}
        </div>
        
        {/* Stats - Blurred for free users */}
        <div className={`space-y-2 ${isLocked ? 'relative' : ''}`}>
          {isLocked && (
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/80 z-10 flex items-center justify-center rounded-lg">
              <Link 
                href="/pricing#pro" 
                className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors tracking-wide"
              >
                <Lock className="w-3.5 h-3.5" />
                Unlock with Pro
              </Link>
            </div>
          )}
          
          <div className={isLocked ? 'blur-sm select-none' : ''}>
            {/* Pick Selection - Most Important */}
            <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-100">
              <span className="text-[#000000] font-semibold">Our Pick</span>
              <span className="text-purple-700 font-bold">
                {pick.selection || 'Home Win'}
              </span>
            </div>
            
            {/* Value Edge - Why we like it */}
            <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-100">
              <span className="text-[#000000] font-semibold">Value Edge</span>
              <span className={`font-mono font-bold ${(pick.edgeValue || 0) >= 5 ? 'text-green-600' : 'text-blue-600'}`}>
                {pick.edgeValue ? `+${pick.edgeValue.toFixed(1)}%` : '+4.2%'}
              </span>
            </div>
            
            {/* Data Confidence - How much data we have */}
            <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-100">
              <span className="text-[#000000] font-semibold">Confidence</span>
              <div className="flex items-center gap-1">
                {/* Stars based on confidence score: 0-100 -> 1-5 stars */}
                {[1, 2, 3, 4, 5].map((star) => {
                  const threshold = star * 20; // 20, 40, 60, 80, 100
                  const isFilled = (pick.confidence || 0) >= threshold;
                  return (
                    <svg
                      key={star}
                      className={`w-3.5 h-3.5 ${isFilled ? 'text-amber-400' : 'text-zinc-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  );
                })}
              </div>
            </div>
            
            {/* Win Probability / Odds */}
            <div className="flex items-center justify-between text-sm py-2">
              <span className="text-[#000000] font-semibold">
                {(pick.modelProbability || 0) >= 50 ? 'Win Prob' : 'Odds'}
              </span>
              <span className="text-[#000000] font-medium">
                {(pick.modelProbability || 0) >= 50 
                  ? `${pick.modelProbability?.toFixed(0)}%`
                  : pick.odds ? `@${pick.odds.toFixed(2)}` : '@3.50'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Footer */}
      <Link 
        href={`/match/${generateMatchSlug(pick.homeTeam, pick.awayTeam, pick.sport, pick.kickoff)}`}
        className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 rounded-none transition-colors text-sm tracking-wide"
      >
        View Full Analysis
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function PickCardSkeleton() {
  return (
    <div className="bg-[#FFF3E0] rounded-xl overflow-hidden shadow-md animate-pulse">
      <div className="h-10 bg-purple-900/50" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-zinc-200 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-zinc-200 rounded mb-1" />
            <div className="h-3 w-12 bg-zinc-100 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-zinc-200 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-zinc-200 rounded mb-1" />
            <div className="h-3 w-12 bg-zinc-100 rounded" />
          </div>
        </div>
        <div className="h-3 w-20 bg-zinc-100 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-8 w-full bg-zinc-100 rounded" />
          <div className="h-8 w-full bg-zinc-100 rounded" />
          <div className="h-8 w-full bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="h-10 border-t border-zinc-100" />
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
          confidence: p.confidence, // Data quality score
          modelProbability: p.modelProbability, // Win probability
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
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
              {t.title}
            </h2>
            <p className="text-gray-400 mt-1">{t.subtitle}</p>
          </div>
          
          <Link 
            href={locale === 'sr' ? '/sr/picks' : '/picks'}
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors"
          >
            {t.viewAll}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <PickCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-gray-400">
            <p>{t.noPicks}</p>
            <p className="text-sm mt-1">{t.checkBack}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {picks.map((pick) => (
              <PickCard key={pick.id} pick={pick} isPro={isPro} />
            ))}
          </div>
        )}

        {/* Pro CTA for free users */}
        {!isPro && picks.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-col items-center gap-3 bg-black border border-zinc-800 rounded-xl px-5 py-4">
              <div className="text-center">
                <p className="text-white font-medium">
                  {locale === 'sr' ? 'Otključaj sve pikove i detalje' : 'Unlock all picks & full details'}
                </p>
                <p className="text-sm text-zinc-400">
                  {locale === 'sr' ? 'Edge %, confidence, i selekciju' : 'Edge %, confidence, and selection'}
                </p>
              </div>
              <Link
                href="/pricing#pro"
                className="w-full bg-accent hover:bg-accent/90 text-black font-semibold px-4 py-1.5 rounded-none transition-colors text-center text-sm"
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
