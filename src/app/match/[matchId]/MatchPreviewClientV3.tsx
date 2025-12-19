/**
 * Match Preview Client Component V3 - Universal Signals Framework
 * 
 * Clean, minimal, confident analysis.
 * Universal design that works across ALL sports.
 * Zero betting advice. Pure match intelligence.
 * 
 * Uses the 5 normalized signals:
 * - Form
 * - Strength Edge
 * - Tempo
 * - Efficiency
 * - Availability
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  PremiumMatchHeader,
  ShareCard,
  UniversalSignalsDisplay,
  MarketIntelSection,
  RegistrationBlur,
  PremiumBlur,
} from '@/components/analysis';
import type { UniversalSignals } from '@/lib/universal-signals';
import type { MarketIntel, OddsData } from '@/lib/value-detection';

// Parse matchId on client to show header immediately
function parseMatchIdClient(matchId: string): { homeTeam: string; awayTeam: string; league: string; sport: string; kickoff: string } | null {
  try {
    // Try base64 decode first
    const decoded = atob(matchId);
    const parsed = JSON.parse(decoded);
    return {
      homeTeam: parsed.homeTeam || 'Home Team',
      awayTeam: parsed.awayTeam || 'Away Team',
      league: parsed.league || '',
      sport: parsed.sport || 'soccer',
      kickoff: parsed.kickoff || new Date().toISOString(),
    };
  } catch {
    // Fallback: parse underscore-separated format
    const parts = matchId.split('_');
    if (parts.length >= 3) {
      return {
        homeTeam: parts[0].replace(/-/g, ' '),
        awayTeam: parts[1].replace(/-/g, ' '),
        league: parts[2].replace(/-/g, ' '),
        sport: 'soccer',
        kickoff: parts[3] ? new Date(parseInt(parts[3])).toISOString() : new Date().toISOString(),
      };
    }
    return null;
  }
}

interface MatchPreviewClientProps {
  matchId: string;
}

interface MatchPreviewData {
  matchInfo: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    hasDraw?: boolean;
    scoringUnit?: string;
    kickoff: string;
    venue?: string;
  };
  // Data availability info
  dataAvailability?: {
    source: string;
    hasFormData: boolean;
    hasH2H: boolean;
    hasInjuries: boolean;
    message?: string;
  };
  story: {
    favored: 'home' | 'away' | 'draw';
    confidence: 'strong' | 'moderate' | 'slight';
    narrative?: string;
    snapshot?: string[];
    riskFactors?: string[];
    supportingStats?: Array<{
      icon: string;
      stat: string;
      context: string;
    }>;
    audioUrl?: string;
  };
  // New Universal Signals (V3)
  universalSignals?: UniversalSignals;
  // Legacy signals format (backwards compatibility)
  signals?: {
    formLabel: string;
    strengthEdgeLabel: string;
    strengthEdgeDirection: string;
    tempoLabel: string;
    efficiencyLabel: string;
    availabilityLabel: string;
  };
  viralStats?: {
    h2h: { headline: string; favors: string };
    form: { home: string; away: string };
    keyAbsence: { player: string; team: string; impact: string } | null;
    streak: { text: string; team: string } | null;
  };
  headlines?: Array<{
    icon: string;
    text: string;
    favors: string;
    viral?: boolean;
  }>;
  // Premium Edge Features
  marketIntel?: MarketIntel;
  odds?: OddsData;
  // Demo match indicators
  isDemo?: boolean;
  demoId?: string;
  requestedMatch?: {
    homeTeam: string;
    awayTeam: string;
    sport: string;
  };
  message?: string;
}

// Usage limit data from 429 response
interface UsageLimitData {
  usageLimitReached: boolean;
  message: string;
  usage: {
    remaining: number;
    limit: number;
    used: number;
  };
  plan: string;
  matchInfo?: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    kickoff: string;
  };
}

export default function MatchPreviewClient({ matchId }: MatchPreviewClientProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<MatchPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageLimit, setUsageLimit] = useState<UsageLimitData | null>(null);
  
  // Parse matchId immediately to show header while loading
  const parsedMatch = useMemo(() => parseMatchIdClient(matchId), [matchId]);

  // Scroll to top on mount to prevent unwanted scroll position
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const fetchMatchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        setUsageLimit(null);
        
        // Add cache-busting timestamp to force fresh fetch (no browser cache)
        const response = await fetch(`/api/match-preview/${matchId}?_t=${Date.now()}`, {
          credentials: 'include', // Ensure cookies are sent
          cache: 'no-store', // Don't use browser cache
        });
        
        const result = await response.json();
        
        // Handle 429 (usage limit reached) specifically
        if (response.status === 429 && result.usageLimitReached) {
          setUsageLimit(result as UsageLimitData);
          return;
        }
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to load match preview');
        }
        
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchPreview();
  }, [matchId]);

  // Show header immediately with skeleton content while loading
  if (loading && parsedMatch) {
    return (
      <div className="min-h-screen bg-[#050506]">
        <div className="fixed inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-transparent pointer-events-none" />
        
        <div className="relative max-w-2xl mx-auto px-4 py-6 sm:py-10">
          {/* Back navigation */}
          <Link 
            href="/matches"
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">All Matches</span>
          </Link>

          {/* Show real match header immediately */}
          <PremiumMatchHeader 
            homeTeam={parsedMatch.homeTeam}
            awayTeam={parsedMatch.awayTeam}
            league={parsedMatch.league}
            sport={parsedMatch.sport}
            kickoff={parsedMatch.kickoff}
          />

          {/* Loading indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-zinc-500">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
            <span className="text-sm">Loading analysis...</span>
          </div>

          {/* Skeleton for signals */}
          <div className="mt-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>

          {/* Skeleton for content sections */}
          <div className="mt-6 space-y-4">
            <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Fallback skeleton if we can't parse matchId
  if (loading) {
    return <PremiumSkeleton />;
  }

  // Usage limit reached - show upgrade card with match info
  if (usageLimit) {
    const matchForHeader = usageLimit.matchInfo || parsedMatch;
    return (
      <div className="min-h-screen bg-[#050506]">
        <div className="fixed inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-transparent pointer-events-none" />
        
        <div className="relative max-w-2xl mx-auto px-4 py-6 sm:py-10">
          {/* Back navigation */}
          <Link 
            href="/matches"
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">All Matches</span>
          </Link>

          {/* Show match header */}
          {matchForHeader && (
            <PremiumMatchHeader 
              homeTeam={matchForHeader.homeTeam}
              awayTeam={matchForHeader.awayTeam}
              league={matchForHeader.league}
              sport={matchForHeader.sport}
              kickoff={matchForHeader.kickoff}
            />
          )}

          {/* Upgrade Card - Pro uses purple, Premium uses silver */}
          <div className={`mt-8 bg-gradient-to-br from-bg-card via-bg-card ${usageLimit.plan === 'FREE' ? 'to-purple-500/5 border-purple-500/30' : 'to-zinc-400/5 border-zinc-400/30'} border rounded-2xl p-8 text-center`}>
            <div className="text-6xl mb-6">🔒</div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {usageLimit.plan === 'FREE' ? 'Upgrade to Pro' : 'Upgrade to Premium'}
            </h1>
            
            {/* Usage Counter */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-4">
              <span className="text-zinc-400 text-sm">Daily Credits:</span>
              <span className="text-white font-semibold">{usageLimit.usage.remaining}/{usageLimit.usage.limit}</span>
              <span className="text-red-400 text-xs">(used)</span>
            </div>
            
            <p className="text-zinc-400 text-lg mb-6">
              {usageLimit.message}
            </p>

            {/* Plan Benefits */}
            <div className="bg-[#0A0D10]/50 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-white mb-4 text-center">What you get:</h3>
              <ul className="space-y-3 text-zinc-300">
                {usageLimit.plan === 'FREE' ? (
                  <>
                    <li className="flex items-center gap-3">
                      <span className="text-purple-400">✓</span>
                      30 analyses per day
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-purple-400">✓</span>
                      Market Intel & Value Detection
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-purple-400">✓</span>
                      Early access to new features
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-purple-400">✓</span>
                      Priority customer support
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-3">
                      <span className="text-zinc-300">✓</span>
                      Unlimited analyses
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-zinc-300">✓</span>
                      Priority AI processing
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-zinc-300">✓</span>
                      Full analysis history access
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-zinc-300">✓</span>
                      Market Alerts & Steam Moves
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* CTA Button - Pro uses purple, Premium uses silver */}
            <Link 
              href="/pricing" 
              className={usageLimit.plan === 'FREE' 
                ? "inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg px-8 py-3 rounded-lg transition-colors"
                : "inline-block bg-gradient-to-r from-zinc-300 to-zinc-400 hover:from-zinc-200 hover:to-zinc-300 text-zinc-900 font-semibold text-lg px-8 py-3 rounded-lg transition-colors shadow-lg shadow-zinc-400/20"
              }
            >
              {usageLimit.plan === 'FREE' ? 'Upgrade to Pro' : 'Upgrade to Premium'}
            </Link>

            {/* Secondary info */}
            <p className="mt-4 text-zinc-500 text-sm">
              Your credits reset daily at midnight UTC
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.matchInfo) {
    return (
      <div className="min-h-screen bg-[#050506] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Match Not Found</h1>
          <p className="text-zinc-500 mb-6 text-sm">
            {error || "We couldn't find this match. It may have already been played or the link is incorrect."}
          </p>
          <Link 
            href="/matches"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-xl text-white text-sm font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            <span>←</span>
            <span>Browse Matches</span>
          </Link>
        </div>
      </div>
    );
  }

  // Map confidence from old format if needed
  const mapConfidence = (conf: string): 'high' | 'medium' | 'low' => {
    if (conf === 'strong') return 'high';
    if (conf === 'slight') return 'low';
    return 'medium';
  };

  // Build snapshot from old format if not present
  const snapshot = data.story.snapshot || (data.story.supportingStats?.map(s => `${s.stat}: ${s.context}`) || []);
  
  // Build game flow from narrative
  const gameFlow = data.story.narrative || '';
  
  // Build risk factors
  const riskFactors = data.story.riskFactors || [];

  // Check if this is a demo match being shown to anonymous user
  const isDemo = data.isDemo && !session;
  const requestedDifferentMatch = data.requestedMatch && 
    (data.requestedMatch.homeTeam !== data.matchInfo.homeTeam || 
     data.requestedMatch.awayTeam !== data.matchInfo.awayTeam);

  // Determine if user has access to premium content
  // Logic: If user got a 200 response with real data (not demo), they have access
  // This includes: PRO/PREMIUM users, OR FREE users who used their 1 credit
  const hasPremiumAccess = 
    session?.user?.plan === 'PRO' || 
    session?.user?.plan === 'PREMIUM' ||
    (session && !isDemo); // FREE user with valid session who got real data = used their credit

  return (
    <div className="min-h-screen bg-[#050506]">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Demo Banner - Show when anonymous user views demo */}
        {isDemo && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">✨</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-amber-400 font-medium text-sm mb-1">
                  {requestedDifferentMatch ? 'Sample Analysis Preview' : 'Demo Analysis'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {requestedDifferentMatch ? (
                    <>
                      You asked for <span className="text-white">{data.requestedMatch?.homeTeam} vs {data.requestedMatch?.awayTeam}</span>. 
                      Register for free to get real-time AI analysis of any match!
                    </>
                  ) : (
                    <>This is a sample analysis. Register for free to analyze any match with live AI insights!</>
                  )}
                </p>
                <Link 
                  href="/register"
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-colors"
                >
                  <span>Register Free</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Back navigation - Minimal */}
        <Link 
          href="/matches"
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">All Matches</span>
        </Link>

        {/* Match Header - Clean and premium */}
        <PremiumMatchHeader 
          homeTeam={data.matchInfo.homeTeam}
          awayTeam={data.matchInfo.awayTeam}
          league={data.matchInfo.league}
          sport={data.matchInfo.sport}
          kickoff={data.matchInfo.kickoff}
          venue={data.matchInfo.venue}
        />

        {/* Data Availability Notice - Show when limited data */}
        {data.dataAvailability && !data.dataAvailability.hasFormData && (
          <div className="mt-4 mb-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-sm">ℹ️</span>
              <p className="text-xs text-blue-400/80">
                {data.dataAvailability.message || 'Limited historical data available for this sport. Analysis based on AI estimation.'}
              </p>
            </div>
          </div>
        )}

        {/* LAYER 1: Registration Blur - Universal Signals & Risk Factors */}
        <RegistrationBlur 
          isAuthenticated={!!session}
          title="Unlock Match Signals"
          description="Create a free account to see our 5 universal match signals and risk analysis."
        >
          {/* Universal Signals Display - Free with registration */}
          {data.universalSignals && (
            <div className="mt-4 sm:mt-5">
              <UniversalSignalsDisplay
                signals={data.universalSignals}
                homeTeam={data.matchInfo.homeTeam}
                awayTeam={data.matchInfo.awayTeam}
                homeForm={data.viralStats?.form?.home || '-----'}
                awayForm={data.viralStats?.form?.away || '-----'}
              />
            </div>
          )}

          {/* Risk Factors - Free with registration */}
          {riskFactors && riskFactors.length > 0 && (
            <div className="mt-3 sm:mt-4 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-4 sm:p-5">
              <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="text-amber-500/80">⚠</span>
                Risk Factors
              </h3>
              <ul className="space-y-2">
                {riskFactors.map((risk, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-1 h-1 rounded-full bg-amber-500/40 mt-2 flex-shrink-0" />
                    <span className="text-sm text-zinc-500 leading-relaxed">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </RegistrationBlur>

        {/* LAYER 2: Premium Blur - Match Snapshot, Game Flow, Market Edge */}
        <PremiumBlur
          isPro={hasPremiumAccess}
          title="Pro Match Analysis"
          description="Get detailed match insights, game flow predictions, and value detection with Pro."
        >
          {/* Match Snapshot - Premium */}
          {snapshot && snapshot.length > 0 && (
            <div className="mt-3 sm:mt-4 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-4 sm:p-5">
              <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-violet-400">✦</span>
                Match Snapshot
                <span className="ml-auto text-[9px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">PRO</span>
              </h3>
              <ul className="space-y-2.5">
                {snapshot.slice(0, 4).map((insight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-1 h-1 rounded-full bg-white/30 mt-2 flex-shrink-0" />
                    <span className="text-sm text-zinc-300 leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Game Flow - Premium */}
          {gameFlow && (
            <div className="mt-3 sm:mt-4 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-4 sm:p-5">
              <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="text-violet-400">✦</span>
                Game Flow
                <span className="ml-auto text-[9px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">PRO</span>
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {gameFlow}
              </p>
            </div>
          )}

          {/* Market Edge - Premium */}
          {data.marketIntel && data.odds ? (
            <div className="mt-5">
              <MarketIntelSection
                marketIntel={data.marketIntel}
                odds={data.odds}
                homeTeam={data.matchInfo.homeTeam}
                awayTeam={data.matchInfo.awayTeam}
                hasDraw={data.matchInfo.hasDraw}
                isPro={true}
              />
            </div>
          ) : (
            <div className="mt-5 p-5 rounded-2xl bg-[#0a0a0b] border border-white/[0.06]">
              <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="text-violet-400">✦</span>
                Market Edge
                <span className="ml-auto text-[9px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">PRO</span>
              </h3>
              <div className="flex items-center gap-3 text-zinc-400 text-sm">
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Odds data temporarily unavailable for this match</span>
              </div>
            </div>
          )}
        </PremiumBlur>

        {/* Headline Quote (if available) */}
        {data.headlines && data.headlines.length > 0 && (
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06]">
            <p className="text-base text-white font-medium leading-relaxed">
              "{data.headlines[0].text}"
            </p>
            <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-wider">
              — SportBot Analysis
            </p>
          </div>
        )}

        {/* Share Card */}
        <div className="mt-8">
          <ShareCard
            matchId={matchId}
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            verdict={data.headlines?.[0]?.text || `${data.matchInfo.homeTeam} vs ${data.matchInfo.awayTeam}`}
            kickoff={data.matchInfo.kickoff}
          />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-zinc-600 max-w-sm mx-auto">
            SportBot AI provides match intelligence for educational purposes only. 
            This is not betting advice. If you gamble, please do so responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Premium Loading Skeleton
 */
function PremiumSkeleton() {
  return (
    <div className="min-h-screen bg-[#050506]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back button skeleton */}
        <div className="h-4 w-24 bg-white/5 rounded mb-8" />
        
        {/* Header skeleton */}
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="h-5 w-32 bg-white/5 rounded" />
            <div className="h-4 w-24 bg-white/5 rounded" />
          </div>
          <div className="flex items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-white/5 rounded-full animate-pulse" />
              <div className="h-5 w-24 bg-white/5 rounded" />
            </div>
            <div className="w-14 h-14 bg-white/5 rounded-full" />
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-white/5 rounded-full animate-pulse" />
              <div className="h-5 w-24 bg-white/5 rounded" />
            </div>
          </div>
        </div>

        {/* Analysis skeleton */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-xl" />
              <div>
                <div className="h-3 w-20 bg-white/5 rounded mb-2" />
                <div className="h-5 w-32 bg-white/5 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-white/[0.02] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
            <div className="h-3 w-24 bg-white/5 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${100 - i * 10}%` }} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
            <div className="h-3 w-32 bg-white/5 rounded mb-4" />
            <div className="h-16 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
