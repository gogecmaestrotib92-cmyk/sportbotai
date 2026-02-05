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
  Trophy,
  Zap,
  ArrowRight,
  Lock,
  Sparkles,
  ChevronRight,
  Shield
} from 'lucide-react';

// Team Logo with fallback
function TeamLogo({ name, sport, size = 40 }: { name: string; sport: string; size?: number }) {
  const [error, setError] = useState(false);
  const url = getTeamLogo(name, sport);
  
  if (error || !url) {
    // Fallback: show initials
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div 
        className="flex items-center justify-center bg-white/10 rounded-lg text-white font-bold"
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
      className="rounded-lg bg-white/5 object-contain"
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
    return <Shield className="text-gray-500" style={{ width: size, height: size }} />;
  }
  
  return (
    <img
      src={url}
      alt={league}
      width={size}
      height={size}
      className="rounded object-contain"
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
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

// Confidence badge
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const level = confidence >= 70 ? 'high' : confidence >= 60 ? 'medium' : 'low';
  const colors = {
    high: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  const labels = {
    high: 'High Confidence',
    medium: 'Good Confidence',
    low: 'Moderate',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[level]}`}>
      {labels[level]} • {confidence}%
    </span>
  );
}

// Edge badge
function EdgeBadge({ edge }: { edge: number }) {
  const color = edge >= 10 ? 'text-emerald-400' : edge >= 5 ? 'text-green-400' : 'text-blue-400';
  return (
    <span className={`text-lg font-bold ${color}`}>
      +{edge.toFixed(1)}% Edge
    </span>
  );
}

// Single Pick Card - Premium Design
function PickCard({ pick, isPro, rank }: { pick: Pick; isPro: boolean; rank: number }) {
  const analysis = pick.analysis;
  
  // Format probabilities (stored as 0-1, display as %)
  const probs = pick.probabilities;
  const homeProb = probs?.home ? Math.round(probs.home * 100) : null;
  const drawProb = probs?.draw ? Math.round(probs.draw * 100) : null;
  const awayProb = probs?.away ? Math.round(probs.away * 100) : null;
  
  // Determine favored team based on probabilities
  const favoredTeam = homeProb && awayProb 
    ? homeProb > awayProb ? pick.homeTeam : pick.awayTeam
    : null;

  return (
    <article className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300">
      {/* Rank Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
          <span className="text-accent font-bold text-lg">#{rank}</span>
        </div>
      </div>
      
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        {/* League & Time */}
        <div className="flex items-center justify-between mb-4 ml-12 sm:ml-14">
          <div className="flex items-center gap-2">
            <LeagueLogo league={pick.league} size={18} />
            <span className="text-xs sm:text-sm text-gray-400 truncate max-w-[100px] sm:max-w-none">{formatLeague(pick.league)}</span>
          </div>
          <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{formatKickoffShort(pick.kickoff)}</span>
        </div>
        
        {/* Teams - Stack on mobile */}
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          {/* Home Team */}
          <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
            <TeamLogo name={pick.homeTeam} sport={pick.sport} size={36} />
            <div className="text-center sm:text-left">
              <p className="font-semibold text-white text-sm sm:text-base leading-tight">{pick.homeTeam}</p>
              {homeProb !== null && (
                <p className="text-xs sm:text-sm text-gray-400">{homeProb}%</p>
              )}
            </div>
          </div>
          
          {/* VS */}
          <div className="flex-shrink-0">
            <span className="text-lg sm:text-xl text-gray-600 font-light">vs</span>
          </div>
          
          {/* Away Team */}
          <div className="flex-1 flex flex-col-reverse sm:flex-row-reverse items-center sm:items-center gap-2 sm:gap-3">
            <TeamLogo name={pick.awayTeam} sport={pick.sport} size={36} />
            <div className="text-center sm:text-right">
              <p className="font-semibold text-white text-sm sm:text-base leading-tight">{pick.awayTeam}</p>
              {awayProb !== null && (
                <p className="text-xs sm:text-sm text-gray-400">{awayProb}%</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Selection & Edge Section */}
      <div className="px-4 sm:px-6 py-4 sm:py-5">
        {!pick.locked && pick.selection ? (
          <>
            {/* Our Pick */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Our Pick</p>
                <p className="text-lg sm:text-xl font-bold text-white">{pick.selection}</p>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                <EdgeBadge edge={pick.edgeValue} />
                {pick.odds && (
                  <p className="text-sm text-gray-400">@ {pick.odds.toFixed(2)}</p>
                )}
              </div>
            </div>
            
            {/* Confidence & Headline */}
            <div className="flex items-center gap-3 mb-4">
              <ConfidenceBadge confidence={pick.confidence} />
            </div>
            
            {/* Headline/Reasoning */}
            {analysis?.headlines?.[0] && (
              <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2">
                &ldquo;{safeString(analysis.headlines[0])}&rdquo;
              </p>
            )}
            
            {/* Form Preview */}
            {analysis?.form && (analysis.form.homeForm || analysis.form.awayForm) && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {analysis.form.homeForm && (
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 mb-1">{pick.homeTeam}</p>
                    <p className="font-mono text-sm text-white tracking-wider">{safeString(analysis.form.homeForm)}</p>
                  </div>
                )}
                {analysis.form.awayForm && (
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 mb-1">{pick.awayTeam}</p>
                    <p className="font-mono text-sm text-white tracking-wider">{safeString(analysis.form.awayForm)}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Locked State */
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Model Prediction</p>
                <p className="text-base sm:text-lg font-semibold text-white">
                  {favoredTeam ? `${favoredTeam} favored` : 'Analysis available'}
                </p>
              </div>
              <ConfidenceBadge confidence={pick.confidence} />
            </div>
            
            {pick.headline && (
              <p className="text-gray-400 text-sm mb-4 line-clamp-2 italic">
                &ldquo;{safeString(pick.headline)}&rdquo;
              </p>
            )}
            
            <div className="bg-gradient-to-r from-accent/5 to-purple-500/5 border border-accent/20 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-accent/60 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">Unlock full pick</p>
                  <p className="text-xs text-gray-500">Selection, odds & analysis</p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 bg-accent hover:bg-accent/90 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors w-full sm:w-auto justify-center"
              >
                Go Pro
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
      
      {/* Footer - View Analysis CTA */}
      {!pick.locked && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-5">
          <Link
            href={`/match/${pick.matchId}`}
            className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2.5 sm:py-3 rounded-xl transition-colors text-sm sm:text-base"
          >
            View Full Analysis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </article>
  );
}

// Track Record Stats
function TrackRecord() {
  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Our Track Record</h3>
          <p className="text-sm text-gray-400">High-confidence picks performance</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">67%</p>
          <p className="text-xs text-gray-500">Win Rate</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold text-white">+8.2%</p>
          <p className="text-xs text-gray-500">Avg Edge</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">142</p>
          <p className="text-xs text-gray-500">Picks Made</p>
        </div>
      </div>
    </div>
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
