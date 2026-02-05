/**
 * Editorial Picks Content - Premium Design
 * 
 * Clean, premium showcase of our top daily picks.
 * Features our highest-confidence predictions.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getTeamLogo, getLeagueLogo } from '@/lib/logos';
import { 
  Target, 
  BarChart3, 
  Calendar, 
  Unlock, 
  TrendingUp, 
  Zap,
  ArrowRight,
  Lock,
  Sparkles,
  ChevronRight,
  Shield
} from 'lucide-react';

// Team Logo with fallback - Light card style
function TeamLogo({ name, sport, size = 40 }: { name: string; sport: string; size?: number }) {
  const [error, setError] = useState(false);
  const url = getTeamLogo(name, sport);
  
  if (error || !url) {
    // Fallback: show initials with light bg
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div 
        className="flex items-center justify-center bg-zinc-100 rounded-xl text-zinc-600 font-bold"
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
      className="rounded-xl bg-zinc-50 object-contain p-1"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}

// League Logo with fallback
function LeagueLogo({ league, size = 20 }: { league: string; size?: number }) {
  const [error, setError] = useState(false);
  const url = getLeagueLogo(league);
  
  if (error || !url) {
    return <Shield className="text-zinc-400" style={{ width: size, height: size }} />;
  }
  
  return (
    <div 
      className="bg-white rounded-sm flex items-center justify-center p-0.5"
      style={{ width: size + 4, height: size + 4 }}
    >
      <img
        src={url}
        alt={league}
        width={size}
        height={size}
        className="rounded-sm object-contain"
        style={{ width: size, height: size }}
        onError={() => setError(true)}
      />
    </div>
  );
}

// Types
interface Analysis {
  story?: string;
  headlines?: string[];
  viralStats?: string[];
  form?: {
    homeForm?: string;
    awayForm?: string;
    homeTrend?: string;
    awayTrend?: string;
    h2hSummary?: string;
    keyFactors?: string[];
  };
  injuries?: {
    home?: Array<{ player: string; status: string; impact: string }>;
    away?: Array<{ player: string; status: string; impact: string }>;
  };
}

interface Pick {
  rank: number;
  id: string;
  matchId: string;
  slug: string; // SEO-friendly URL slug
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
  kickoff: string;
  confidence: number;
  edgeValue: number;
  edgeBucket: string | null;
  selection: string | null;
  odds: number | null;
  probabilities: { home: number; draw: number | null; away: number } | null;
  predictedScore: string | null;
  headline: string | null;
  locked: boolean;
  analysis: Analysis | null;
}

interface PicksResponse {
  success: boolean;
  date: string;
  picks: Pick[];
  isPro: boolean;
  meta?: {
    total: number;
    showing: number;
  };
}

function formatKickoffShort(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  if (isToday) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) + ` ${time}`;
}

function formatLeague(league: string): string {
  return league
    .replace(/_/g, ' ')
    .replace(/soccer |basketball |americanfootball |icehockey /gi, '')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Helper to safely extract string from potential object
function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    if ('text' in value) return String((value as { text?: unknown }).text || '');
    if ('narrative' in value) return String((value as { narrative?: unknown }).narrative || '');
  }
  return '';
}

// Confidence badge - light card style
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const level = confidence >= 70 ? 'high' : confidence >= 60 ? 'medium' : 'low';
  const labels = {
    high: 'High Confidence',
    medium: 'Good Confidence',
    low: 'Moderate',
  };
  
  return (
    <span className="text-sm font-medium text-black tracking-wide">
      {labels[level]} • {confidence}%
    </span>
  );
}

// Star rating component (like reviews)
function StarRating({ confidence }: { confidence: number }) {
  const stars = Math.round(confidence / 20); // 60% = 3 stars, 80% = 4 stars, 100% = 5 stars
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= stars ? 'text-amber-400' : 'text-black/20'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-black ml-1 tracking-wide">{confidence}%</span>
    </div>
  );
}

// Single Pick Card - Breatheeze Style (Light cards, dark badge)
function PickCard({ pick, isPro, rank }: { pick: Pick; isPro: boolean; rank: number }) {
  const analysis = pick.analysis;
  
  // Format probabilities (stored as 0-1, display as %)
  const probs = pick.probabilities;
  const homeProb = probs?.home ? Math.round(probs.home * 100) : null;
  const awayProb = probs?.away ? Math.round(probs.away * 100) : null;
  
  // Determine favored team based on probabilities
  const favoredTeam = homeProb && awayProb 
    ? homeProb > awayProb ? pick.homeTeam : pick.awayTeam
    : null;

  return (
    <article className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 tracking-wide">
      {/* Top Badge - Dark strip like Breatheeze */}
      <div className="bg-zinc-900 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-accent text-black text-xs font-bold px-2 py-0.5 rounded">#{rank}</span>
          <span className="text-white/90 text-sm font-medium">+{pick.edgeValue.toFixed(1)}% EDGE</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-lg">
          <LeagueLogo league={pick.league} size={16} />
          <span className="text-white text-xs font-medium">{formatLeague(pick.league)}</span>
        </div>
      </div>
      
      {/* Main Content - Light background, pure black text */}
      <div className="p-5 text-black">
        {/* Teams Display */}
        <div className="flex items-center justify-center gap-4 mb-5">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <TeamLogo name={pick.homeTeam} sport={pick.sport} size={52} />
            <p className="font-semibold text-black text-sm mt-2 leading-tight">{pick.homeTeam}</p>
            {homeProb !== null && (
              <p className="text-xs text-black mt-0.5">{homeProb}%</p>
            )}
          </div>
          
          {/* VS Divider */}
          <div className="flex flex-col items-center px-2">
            <span className="text-black text-sm font-medium">VS</span>
            <span className="text-[10px] text-black mt-1 whitespace-nowrap">{formatKickoffShort(pick.kickoff)}</span>
          </div>
          
          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <TeamLogo name={pick.awayTeam} sport={pick.sport} size={52} />
            <p className="font-semibold text-black text-sm mt-2 leading-tight">{pick.awayTeam}</p>
            {awayProb !== null && (
              <p className="text-xs text-black mt-0.5">{awayProb}%</p>
            )}
          </div>
        </div>
        
        {/* Star Rating */}
        <div className="flex justify-center mb-4">
          <StarRating confidence={pick.confidence} />
        </div>
        
        {/* Divider */}
        <div className="h-px bg-black/20 mb-4" />
        
        {!pick.locked && pick.selection ? (
          <>
            {/* Our Pick - Clean typography */}
            <div className="text-center mb-4">
              <p className="text-lg font-bold text-black">{pick.selection}</p>
              {pick.odds && (
                <p className="text-black text-sm">@ {pick.odds.toFixed(2)}</p>
              )}
            </div>
            
            {/* Headline */}
            {analysis?.headlines?.[0] && (
              <p className="text-black text-sm text-center leading-relaxed mb-4 line-clamp-2">
                &ldquo;{safeString(analysis.headlines[0])}&rdquo;
              </p>
            )}
            
            {/* CTA Button */}
            <Link
              href={`/match/${pick.slug}`}
              className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 rounded-none transition-colors text-sm tracking-wide"
            >
              View Full Analysis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          /* Locked State */
          <>
            <div className="text-center mb-4">
              <p className="text-base font-semibold text-black">
                {favoredTeam ? `${favoredTeam} favored` : 'Analysis available'}
              </p>
              <ConfidenceBadge confidence={pick.confidence} />
            </div>
            
            {pick.headline && (
              <p className="text-black text-sm text-center mb-4 line-clamp-2 italic">
                &ldquo;{safeString(pick.headline)}&rdquo;
              </p>
            )}
            
            {/* Unlock CTA */}
            <div className="bg-zinc-100 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-black" />
                <span className="text-black text-sm font-medium">Unlock full analysis</span>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 bg-accent hover:bg-accent/90 text-black font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors tracking-wide"
              >
                Go Pro
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

// Track Record Stats - fetches real data from API
function TrackRecord() {
  const [stats, setStats] = useState<{
    totalPicks: number;
    roi: number;
    hasData: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/prediction-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats?.hasData) {
          setStats(data.stats);
        }
      })
      .catch(console.error);
  }, []);

  // Don't show if no real data or less than 10 picks
  if (!stats || !stats.hasData || stats.totalPicks < 10) {
    return null;
  }

  return (
    <article className="bg-zinc-100 rounded-2xl shadow-lg overflow-hidden mb-8 tracking-wide">
      {/* Dark header strip - matching pick cards */}
      <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between relative overflow-hidden">
        {/* Subtle gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
        
        <div className="relative flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">AI Track Record</span>
        </div>
        <div className="relative flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Live</span>
        </div>
      </div>
      
      {/* Content - gray background */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center py-3 px-4 bg-white rounded-xl border border-zinc-200">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">ROI</span>
            </div>
            <p className={`text-3xl font-black tracking-tight ${stats.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.roi >= 0 ? '+' : ''}{stats.roi}%
            </p>
          </div>
          <div className="text-center py-3 px-4 bg-white rounded-xl border border-zinc-200">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Analyzed</span>
            </div>
            <p className="text-3xl font-black text-black tracking-tight">{stats.totalPicks}</p>
          </div>
        </div>
        
        {/* Footer badges */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-gradient-to-b from-zinc-200 to-zinc-300 border border-zinc-400/50 font-mono text-black font-bold shadow-sm">2%+ EDGE</span>
          <span className="text-zinc-400">•</span>
          <span className="font-mono text-black font-bold">FLAT STAKE</span>
        </div>
      </div>
    </article>
  );
}

interface Props {
  locale: 'en' | 'sr';
}

export default function EditorialPicksContent({ locale }: Props) {
  const { data: session } = useSession();
  const [data, setData] = useState<PicksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isPro = session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM';

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        const res = await fetch('/api/editorial-picks?limit=6');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to fetch editorial picks:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPicks();
  }, []);

  const t = {
    en: {
      title: "Today's Top Picks",
      subtitle: "AI-powered selections with the highest confidence",
      noPicks: 'No high-confidence picks available',
      checkBack: 'Check back when matches are scheduled',
      methodology: 'How We Select Picks',
      methodologyText: 'Our AI model ranks all upcoming matches by confidence level and edge over market odds. Only matches with 60%+ model confidence AND positive value edge make this list.',
      disclaimer: 'For entertainment purposes only. Gamble responsibly.',
    },
    sr: {
      title: 'Današnji Top Pikovi',
      subtitle: 'AI selekcije sa najvišim poverenjem',
      noPicks: 'Nema pikova visokog poverenja',
      checkBack: 'Proveri ponovo kada budu zakazani mečevi',
      methodology: 'Kako Biramo Pikove',
      methodologyText: 'Naš AI model rangira sve predstojeće mečeve po nivou poverenja i edge-u u odnosu na tržišne kvote. Samo mečevi sa 60%+ poverenjem modela I pozitivnim value edge-om ulaze na ovu listu.',
      disclaimer: 'Samo u zabavne svrhe. Kladite se odgovorno.',
    },
  }[locale];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 pt-24">
        <div className="animate-pulse space-y-8">
          <div className="text-center space-y-4">
            <div className="h-10 w-64 bg-white/10 rounded-lg mx-auto" />
            <div className="h-6 w-96 bg-white/10 rounded mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 pt-24 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <Target className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{t.noPicks}</h1>
        <p className="text-gray-400 mb-8">{t.checkBack}</p>
        <Link href="/analyzer" className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-black font-semibold px-6 py-3 rounded-xl transition-colors">
          Analyze Any Match
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-full mb-6">
          <Target className="w-4 h-4 text-accent" />
          <span className="text-accent font-medium text-sm">Daily AI Picks</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          {t.title}
        </h1>
        <p className="text-xl text-gray-400 mb-2">{t.subtitle}</p>
        <p className="text-sm text-gray-500">{data.date}</p>
      </header>

      {/* Track Record */}
      <TrackRecord />

      {/* Picks Grid */}
      {data.picks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-400 text-lg mb-2">{t.noPicks}</p>
          <p className="text-gray-500">{t.checkBack}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {data.picks.map((pick, index) => (
            <PickCard key={pick.id} pick={pick} isPro={data.isPro} rank={index + 1} />
          ))}
        </div>
      )}

      {/* Methodology */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-3">{t.methodology}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          {t.methodologyText}
        </p>
      </section>

      {/* Disclaimer */}
      <p className="text-center text-gray-500 text-sm">
        {t.disclaimer}
      </p>

      {/* Pro CTA */}
      {!isPro && data.picks.length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-accent/10 via-purple-500/10 to-accent/10 border border-accent/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <Unlock className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {locale === 'sr' ? 'Otključaj Sve Pikove' : 'Unlock All Picks'}
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {locale === 'sr' 
              ? 'Dobij selekcije, kvote, formu, reasoning i detaljan edge za svaki pick'
              : 'Get selections, odds, form, reasoning and detailed edge analysis for every pick'
            }
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-black font-bold px-8 py-4 rounded-xl transition-colors text-lg"
          >
            <Sparkles className="w-5 h-5" />
            {locale === 'sr' ? 'Nadogradi na Pro' : 'Upgrade to Pro'}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}
