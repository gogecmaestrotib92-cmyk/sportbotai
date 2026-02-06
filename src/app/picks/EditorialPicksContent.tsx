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
  Shield,
  FlaskConical,
  BadgeCheck,
  CircleDot
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
  let result = '';
  if (typeof value === 'string') result = value;
  else if (value && typeof value === 'object') {
    if ('text' in value) result = String((value as { text?: unknown }).text || '');
    else if ('narrative' in value) result = String((value as { narrative?: unknown }).narrative || '');
  }
  // Replace "Pre-analyzed" with "AI Prediction"
  return result.replace(/Pre-analyzed/gi, 'AI Prediction');
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
      {labels[level]} • {Math.round(confidence)}%
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
      <span className="text-xs text-black ml-1 tracking-wide">{Math.round(confidence)}%</span>
    </div>
  );
}

// Single Pick Card - Breatheeze Style (Light cards, dark badge)
function PickCard({ pick, isPro, rank, locale = 'en' }: { pick: Pick; isPro: boolean; rank: number; locale?: 'en' | 'sr' }) {
  const analysis = pick.analysis;
  
  // Translations
  const t = {
    edgeHidden: locale === 'sr' ? 'Edge Sakriven' : 'Edge Hidden',
    premiumPick: locale === 'sr' ? 'Premium Pik' : 'Premium Pick',
    aiPredictionAvailable: locale === 'sr' ? 'AI predikcija dostupna' : 'AI-powered prediction available',
    unlockDetails: locale === 'sr' ? 'Otključaj edge %, verovatnoće i analizu' : 'Unlock edge %, probabilities & full analysis',
    unlockPick: locale === 'sr' ? 'Otključaj Pik' : 'Unlock Pick',
    viewFullAnalysis: locale === 'sr' ? 'Pogledaj Celu Analizu' : 'View Full Analysis',
    ourPick: locale === 'sr' ? 'Naš Pik' : 'Our Pick',
    underdogValue: locale === 'sr' ? 'Underdog Value' : 'Underdog Value',
  };
  
  // Format probabilities (already stored as percentages like 36.41)
  const probs = pick.probabilities;
  const homeProb = probs?.home ? Math.round(probs.home) : null;
  const awayProb = probs?.away ? Math.round(probs.away) : null;
  
  // Determine if pick is an underdog (selection != expected winner)
  const expectedWinner = homeProb && awayProb 
    ? homeProb > awayProb ? pick.homeTeam : pick.awayTeam
    : null;
  const isUnderdogPick = pick.selection && expectedWinner && pick.selection !== expectedWinner;

  return (
    <article className="group relative bg-[#FFF3E0] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 tracking-wide h-full flex flex-col">
      {/* Top Badge - Glass deep purple */}
      <div className="bg-gradient-to-r from-purple-900/90 via-purple-800/80 to-purple-900/90 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <span className="bg-accent text-black text-xs font-bold px-2 py-0.5 rounded">#{rank}</span>
          {/* Only show edge for Pro users */}
          {!pick.locked ? (
            <span className="text-white/90 text-sm font-medium">+{pick.edgeValue.toFixed(1)}% EDGE</span>
          ) : (
            <span className="text-white/60 text-sm font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {t.edgeHidden}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-lg">
          <LeagueLogo league={pick.league} size={16} />
          <span className="text-white text-xs font-medium">{formatLeague(pick.league)}</span>
        </div>
      </div>
      
      {/* Main Content - Light background, pure black text */}
      <div className="p-5 text-[#000000] flex-1 flex flex-col">
        {/* Teams Display */}
        <div className="flex items-center justify-center gap-4 mb-5">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <TeamLogo name={pick.homeTeam} sport={pick.sport} size={52} />
            <p className="font-semibold text-[#000000] text-sm mt-2 leading-tight min-h-[2.5rem] flex items-center justify-center">{pick.homeTeam}</p>
            {/* Hide probabilities for locked picks */}
            {!pick.locked && homeProb !== null && (
              <p className="text-xs text-[#000000] mt-0.5">{homeProb}%</p>
            )}
          </div>
          
          {/* VS Divider */}
          <div className="flex flex-col items-center px-2">
            <span className="text-[#000000] text-sm font-medium">VS</span>
            <span className="text-[10px] text-[#000000] mt-1 whitespace-nowrap">{formatKickoffShort(pick.kickoff)}</span>
          </div>
          
          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <TeamLogo name={pick.awayTeam} sport={pick.sport} size={52} />
            <p className="font-semibold text-[#000000] text-sm mt-2 leading-tight min-h-[2.5rem] flex items-center justify-center">{pick.awayTeam}</p>
            {/* Hide probabilities for locked picks */}
            {!pick.locked && awayProb !== null && (
              <p className="text-xs text-[#000000] mt-0.5">{awayProb}%</p>
            )}
          </div>
        </div>
        
        {/* Star Rating - only for unlocked */}
        {!pick.locked && (
          <div className="flex justify-center mb-4">
            <StarRating confidence={pick.confidence} />
          </div>
        )}
        
        {/* Divider */}
        <div className="h-px bg-black/20 mb-4" />
        
        {/* Content wrapper - flex-1 to push CTA to bottom */}
        <div className="flex-1 flex flex-col">
        {!pick.locked && pick.selection ? (
          <>
            {/* Our Pick - Clean typography with "Value Pick" label */}
            <div className="text-center mb-4 min-h-[3.5rem] flex flex-col justify-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{t.ourPick}</p>
              <p className="text-lg font-bold text-[#000000]">{pick.selection}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                {pick.odds && (
                  <span className="text-purple-700 text-sm font-semibold">@ {pick.odds.toFixed(2)}</span>
                )}
                {isUnderdogPick && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {t.underdogValue}
                  </span>
                )}
              </div>
            </div>
            
            {/* Headline */}
            <div className="min-h-[3rem] flex items-center justify-center mb-4">
              {analysis?.headlines?.[0] && (
                <p className="text-[#000000] text-sm text-center leading-relaxed line-clamp-2">
                  &ldquo;{safeString(analysis.headlines[0])}&rdquo;
                </p>
              )}
            </div>
            
            {/* Spacer to push button down */}
            <div className="flex-1" />
            
            {/* CTA Button */}
            <Link
              href={`/match/${pick.slug}`}
              className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 rounded-none transition-colors text-sm tracking-wide mt-auto"
            >
              {t.viewFullAnalysis}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          /* Locked State - Minimal info, strong paywall */
          <>
            {/* Blurred/Hidden analysis preview */}
            <div className="text-center mb-4 relative">
              <div className="flex items-center justify-center gap-2 text-zinc-400 mb-3">
                <Lock className="w-5 h-5" />
                <span className="text-sm font-medium">{t.premiumPick}</span>
              </div>
              {/* Teaser - just show something is available */}
              <div className="space-y-2">
                <div className="h-6 bg-zinc-200 rounded w-3/4 mx-auto blur-[2px]" />
                <div className="h-4 bg-zinc-100 rounded w-1/2 mx-auto blur-[2px]" />
              </div>
            </div>
            
            {/* Spacer to push button down */}
            <div className="flex-1" />
            
            {/* Unlock CTA - More prominent */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-5 text-center mt-auto">
              <p className="text-white/90 text-sm mb-1">{t.aiPredictionAvailable}</p>
              <p className="text-white/60 text-xs mb-3">{t.unlockDetails}</p>
              <Link
                href="/pricing#pro"
                className="flex items-center justify-center gap-1 w-full bg-accent hover:bg-accent/90 text-black font-semibold py-2 rounded-none text-sm transition-colors tracking-wide"
              >
                {t.unlockPick}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
        </div>
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
    <article className="bg-[#FFFBF5] rounded-2xl shadow-lg overflow-hidden mb-8 tracking-wide">
      {/* Ultraviolet header strip */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 px-4 py-3 flex items-center justify-between relative overflow-hidden">
        {/* Subtle gradient glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 via-transparent to-purple-400/20" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        
        <div className="relative flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">AI Track Record</span>
        </div>
        <div className="relative flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Live</span>
        </div>
      </div>
      
      {/* Content - gray background */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center py-3 px-4 bg-[#FFF3E0] rounded-xl border border-amber-200">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">ROI</span>
            </div>
            <p className={`text-3xl font-black tracking-tight ${stats.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.roi >= 0 ? '+' : ''}{stats.roi}%
            </p>
          </div>
          <div className="text-center py-3 px-4 bg-[#FFF3E0] rounded-xl border border-amber-200">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Zap className="w-4 h-4 text-violet-500" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Analyzed</span>
            </div>
            <p className="text-3xl font-black text-black tracking-tight">{stats.totalPicks}</p>
          </div>
        </div>
        
        {/* Footer badges */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-gradient-to-b from-violet-500 to-purple-600 border border-violet-400/50 font-mono text-white font-bold shadow-sm">2%+ EDGE</span>
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
      subtitle: "SportBot AI predictions with the highest confidence",
      noPicks: 'No high-confidence picks available',
      checkBack: 'Check back when matches are scheduled',
      methodology: 'How We Select Picks',
      methodologyText: 'Our AI model evaluates every upcoming match across 50+ data points and calculates true win probabilities. A pick makes this list only when two conditions are met: the model has high confidence (50%+ probability) AND detects a 2%+ edge vs bookmaker odds. This dual filter ensures we surface only high-conviction picks where the market appears to be mispricing the outcome.',
      disclaimer: 'For entertainment purposes only. Gamble responsibly.',
      // SEO content
      seo: {
        aiPredictionsTitle: 'AI Sports Predictions & Analysis',
        aiPredictionsP1: 'SportBot AI uses advanced machine learning algorithms to analyze thousands of data points and generate accurate sports predictions. Our AI prediction system processes historical match data, team form, head-to-head records, injuries, and real-time odds movements to identify value opportunities.',
        aiPredictionsP2: 'Unlike traditional tipsters, our AI sports predictor removes emotional bias and delivers data-driven picks across NBA, NFL, Premier League, La Liga, Bundesliga, Serie A, and more. Each AI prediction includes probability estimates, edge calculations, and confidence ratings.',
        howItWorksTitle: 'How Our AI Sports Picks Work',
        dataAnalysisTitle: 'Data Analysis',
        dataAnalysisText: 'Our AI analyzes 50+ variables per match including form, injuries, H2H, and market odds',
        edgeDetectionTitle: 'Edge Detection',
        edgeDetectionText: 'We compare AI probabilities vs market odds to find mispriced opportunities',
        verifiedPicksTitle: 'Verified Picks',
        verifiedPicksText: 'Only picks with 2%+ edge over market odds make our daily selection',
        sportsTitle: 'AI Predictions for All Major Sports',
        sportsText: 'Our AI sports prediction bot covers all major leagues worldwide. Whether you\'re looking for AI basketball predictions, football tips, or hockey picks - SportBot AI delivers free daily predictions with detailed analysis.',
        faqTitle: 'Frequently Asked Questions',
        faq1Q: 'What is "edge" in sports betting?',
        faq1A: 'Edge is the difference between our AI\'s calculated probability and what the bookmaker odds imply. For example, if we calculate 60% win probability but odds imply only 50%, that\'s a +10% edge - meaning the market is undervaluing that outcome.',
        faq2Q: 'How does your AI calculate win probabilities?',
        faq2A: 'Our model analyzes 50+ variables per match: recent form, head-to-head history, home/away performance, injuries, rest days, travel distance, weather conditions, and real-time odds movements from 15+ bookmakers.',
        faq3Q: 'What sports do you cover with AI predictions?',
        faq3A: 'We cover NBA, NFL, NHL, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, EuroLeague basketball, and more. Our AI processes 500+ matches daily across all major leagues.',
        faq4Q: 'How is this different from tipster services?',
        faq4A: 'Unlike tipsters who rely on gut feeling, our AI removes emotional bias completely. We show you the math: probability %, edge %, and confidence rating for every pick. Full transparency, no hidden agenda.',
        faq5Q: 'Can I see your historical prediction accuracy?',
        faq5A: 'Yes! Check the Track Record section at the top of this page. We track every pick with verified results - wins, losses, and actual ROI. No cherry-picking, full transparency.',
        sportLinks: [
          { label: 'NBA Predictions', league: 'basketball_nba' },
          { label: 'NFL Predictions', league: 'americanfootball_nfl' },
          { label: 'Premier League Predictions', league: 'soccer_epl' },
          { label: 'La Liga Predictions', league: 'soccer_spain_la_liga' },
          { label: 'Bundesliga Predictions', league: 'soccer_germany_bundesliga' },
          { label: 'Serie A Predictions', league: 'soccer_italy_serie_a' },
          { label: 'NHL Predictions', league: 'icehockey_nhl' },
          { label: 'EuroLeague Predictions', league: 'basketball_euroleague' },
          { label: 'Champions League Predictions', league: 'soccer_uefa_champs_league' },
        ],
      },
    },
    sr: {
      title: 'Današnji Top Pikovi',
      subtitle: 'AI selekcije sa najvišim poverenjem',
      noPicks: 'Nema pikova visokog poverenja',
      checkBack: 'Proveri ponovo kada budu zakazani mečevi',
      methodology: 'Kako Biramo Pikove',
      methodologyText: 'Naš AI model evaluira svaki predstojeći meč kroz 50+ podataka i izračunava stvarne verovatnoće pobede. Pik ulazi na ovu listu samo kada su ispunjena dva uslova: model ima visoko poverenje (50%+ verovatnoća) I detektuje 2%+ edge u odnosu na kladioničarske kvote. Ovaj dvostruki filter osigurava da prikazujemo samo visoko-pouzdane pikove gde tržište izgleda pogrešno procenjuje ishod.',
      disclaimer: 'Samo u zabavne svrhe. Kladite se odgovorno.',
      // SEO content - Serbian
      seo: {
        aiPredictionsTitle: 'AI Sportske Predikcije i Analize',
        aiPredictionsP1: 'SportBot AI koristi napredne algoritme mašinskog učenja za analizu hiljada podataka i generisanje tačnih sportskih predikcija. Naš AI sistem obrađuje istorijske podatke mečeva, formu timova, međusobne susrete, povrede i kretanje kvota u realnom vremenu kako bi identifikovao value prilike.',
        aiPredictionsP2: 'Za razliku od tradicionalnih tipstera, naš AI sportski prediktor uklanja emotivnu pristrasnost i pruža predikcije zasnovane na podacima za NBA, NFL, Premier ligu, La Ligu, Bundesligu, Seriju A i druge. Svaka AI predikcija uključuje procene verovatnoće, edge kalkulacije i ocene poverenja.',
        howItWorksTitle: 'Kako Funkcionišu Naši AI Sportski Pikovi',
        dataAnalysisTitle: 'Analiza Podataka',
        dataAnalysisText: 'Naš AI analizira 50+ varijabli po meču uključujući formu, povrede, H2H i tržišne kvote',
        edgeDetectionTitle: 'Detekcija Edge-a',
        edgeDetectionText: 'Poredimo AI verovatnoće sa tržišnim kvotama da pronađemo pogrešno procenjene prilike',
        verifiedPicksTitle: 'Verifikovani Pikovi',
        verifiedPicksText: 'Samo pikovi sa 2%+ edge-om u odnosu na tržišne kvote ulaze u našu dnevnu selekciju',
        sportsTitle: 'AI Predikcije za Sve Velike Sportove',
        sportsText: 'Naš AI bot za sportske predikcije pokriva sve velike lige širom sveta. Bilo da tražiš AI košarkaške predikcije, fudbalske tipove ili hokej pikove - SportBot AI pruža besplatne dnevne predikcije sa detaljnom analizom.',
        faqTitle: 'Često Postavljana Pitanja',
        faq1Q: 'Šta je "edge" u sportskom klađenju?',
        faq1A: 'Edge je razlika između verovatnoće koju naš AI izračuna i one koju kvote impliciraju. Na primer, ako izračunamo 60% šanse za pobedu a kvote impliciraju samo 50%, to je +10% edge - što znači da tržište potcenjuje taj ishod.',
        faq2Q: 'Kako vaš AI računa verovatnoće pobede?',
        faq2A: 'Naš model analizira 50+ varijabli po meču: nedavnu formu, istoriju međusobnih susreta, performanse kod kuće/u gostima, povrede, dane odmora, putnu distancu, vremenske uslove i kretanje kvota u realnom vremenu od 15+ kladionica.',
        faq3Q: 'Koje sportove pokrivate AI predikcijama?',
        faq3A: 'Pokrivamo NBA, NFL, NHL, Premier ligu, La Ligu, Bundesligu, Seriju A, Ligue 1, Ligu šampiona, Evroligu košarku i još mnogo toga. Naš AI obrađuje 500+ mečeva dnevno iz svih velikih liga.',
        faq4Q: 'Kako se ovo razlikuje od tipster servisa?',
        faq4A: 'Za razliku od tipstera koji se oslanjaju na osećaj, naš AI potpuno uklanja emocionalnu pristrasnost. Pokazujemo vam matematiku: verovatnoću %, edge % i ocenu poverenja za svaki pik. Potpuna transparentnost, bez skrivenih agendi.',
        faq5Q: 'Mogu li da vidim vašu istorijsku tačnost predikcija?',
        faq5A: 'Da! Pogledaj sekciju Track Record na vrhu ove stranice. Pratimo svaki pik sa verifikovanim rezultatima - pobede, porazi i stvarni ROI. Bez biranja samo uspešnih, potpuna transparentnost.',
        sportLinks: [
          { label: 'NBA Predikcije', league: 'basketball_nba' },
          { label: 'NFL Pikovi', league: 'americanfootball_nfl' },
          { label: 'Premier Liga Tipovi', league: 'soccer_epl' },
          { label: 'La Liga Predikcije', league: 'soccer_spain_la_liga' },
          { label: 'Bundesliga Analiza', league: 'soccer_germany_bundesliga' },
          { label: 'Serija A Pikovi', league: 'soccer_italy_serie_a' },
          { label: 'NHL Predikcije', league: 'icehockey_nhl' },
          { label: 'Evroliga Košarka', league: 'basketball_euroleague' },
          { label: 'Liga Šampiona', league: 'soccer_uefa_champs_league' },
        ],
      },
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
        <div className="grid md:grid-cols-2 gap-6 mb-12 items-stretch">
          {data.picks.map((pick, index) => (
            <PickCard key={pick.id} pick={pick} isPro={data.isPro} rank={index + 1} locale={locale} />
          ))}
        </div>
      )}

      {/* Methodology */}
      <section className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] rounded-2xl p-6 mb-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">{t.methodology}</h2>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed pl-11">
          {t.methodologyText}
        </p>
      </section>

      {/* Disclaimer */}
      <p className="text-center text-gray-500/80 text-xs tracking-wide">
        {t.disclaimer}
      </p>

      {/* SEO Content Section - Premium Layout */}
      <section className="mt-16 space-y-6">
        {/* Section Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">Learn More</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* AI Sports Predictions Explained - Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/20 via-transparent to-transparent border border-white/[0.06] p-8">
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">{t.seo.aiPredictionsTitle}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <p className="text-gray-400 text-sm leading-relaxed">
                {t.seo.aiPredictionsP1}
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t.seo.aiPredictionsP2}
              </p>
            </div>
          </div>
        </div>

        {/* How AI Picks Work - Feature Grid */}
        <div className="rounded-3xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.06] p-8">
          <h2 className="text-xl font-bold text-white mb-8 text-center">{t.seo.howItWorksTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group relative p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-purple-500/20 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{t.seo.dataAnalysisTitle}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{t.seo.dataAnalysisText}</p>
            </div>
            <div className="group relative p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-purple-500/20 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <CircleDot className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{t.seo.edgeDetectionTitle}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{t.seo.edgeDetectionText}</p>
            </div>
            <div className="group relative p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-purple-500/20 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BadgeCheck className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{t.seo.verifiedPicksTitle}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{t.seo.verifiedPicksText}</p>
            </div>
          </div>
        </div>

        {/* Sports Covered - Tag Cloud */}
        <div className="rounded-3xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.06] p-8">
          <h2 className="text-xl font-bold text-white mb-6">{t.seo.sportsTitle}</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {t.seo.sportLinks.map(({ label, league }) => (
              <Link 
                key={league} 
                href={`${locale === 'sr' ? '/sr' : ''}/matches?league=${league}`}
                className="group px-4 py-2 bg-white/[0.04] hover:bg-purple-500/20 border border-white/[0.06] hover:border-purple-500/30 text-gray-400 hover:text-white text-sm rounded-xl transition-all duration-200"
              >
                <span className="group-hover:translate-x-0.5 inline-block transition-transform duration-200">{label}</span>
              </Link>
            ))}
          </div>
          <p className="text-gray-500 text-sm leading-relaxed max-w-3xl">
            {t.seo.sportsText}
          </p>
        </div>

        {/* FAQ - Accordion Style */}
        <div className="rounded-3xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.06] p-8">
          <h2 className="text-xl font-bold text-white mb-6">{t.seo.faqTitle}</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <h3 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400">Q</span>
                {t.seo.faq1Q}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed pl-7">{t.seo.faq1A}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <h3 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400">Q</span>
                {t.seo.faq2Q}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed pl-7">{t.seo.faq2A}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <h3 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400">Q</span>
                {t.seo.faq3Q}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed pl-7">{t.seo.faq3A}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <h3 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400">Q</span>
                {t.seo.faq4Q}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed pl-7">{t.seo.faq4A}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <h3 className="font-medium text-white text-sm mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400">Q</span>
                {t.seo.faq5Q}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed pl-7">{t.seo.faq5A}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pro CTA - Premium */}
      {!isPro && data.picks.length > 0 && (
        <div className="mt-16 relative overflow-hidden rounded-3xl border border-purple-500/20">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-purple-800/10 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <div className="relative p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/30 to-purple-500/20 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/10">
              <Unlock className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {locale === 'sr' ? 'Otključaj Sve Pikove' : 'Unlock All Picks'}
            </h3>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              {locale === 'sr' 
                ? 'Dobij selekcije, kvote, formu, reasoning i detaljan edge za svaki pick'
                : 'Get selections, odds, form, reasoning and detailed edge analysis for every pick'
              }
            </p>
            <Link
              href="/pricing#pro"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-black font-bold px-10 py-4 rounded-xl transition-all duration-300 text-lg shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.02]"
            >
              <Sparkles className="w-5 h-5" />
              {locale === 'sr' ? 'Nadogradi na Pro' : 'Upgrade to Pro'}
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
