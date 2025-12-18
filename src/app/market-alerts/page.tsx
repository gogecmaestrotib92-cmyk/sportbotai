/**
 * Market Alerts Page - Premium Feature
 * 
 * Redesigned with:
 * - Clear visual hierarchy (Decision → Context → Metadata)
 * - Edge strength indicators with confidence bars
 * - Steam move direction clarity with icons
 * - Market summary brain (sticky insight bar)
 * - Refined color palette (3-level greens/ambers)
 * - Premium micro-interactions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getLeagueLogo } from '@/lib/logos';

// ============================================
// TYPES
// ============================================

interface MarketAlert {
  id: string;
  matchRef: string;
  sport: string;
  sportTitle: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  homeChange?: number;
  awayChange?: number;
  drawChange?: number;
  changeDirection: 'toward_home' | 'toward_away' | 'stable';
  modelHomeProb: number;
  modelAwayProb: number;
  modelDrawProb?: number;
  homeEdge: number;
  awayEdge: number;
  drawEdge?: number;
  bestEdge: {
    outcome: 'home' | 'away' | 'draw';
    percent: number;
    label: string;
  };
  hasSteamMove: boolean;
  hasValueEdge: boolean;
  alertLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  alertNote?: string;
}

interface MarketAlertsResponse {
  success: boolean;
  data?: {
    topEdgeMatches: MarketAlert[];
    steamMoves: MarketAlert[];
    recentUpdates: {
      lastFetch: string;
      matchesScanned: number;
      alertsGenerated: number;
    };
  };
  error?: string;
  isPremium: boolean;
}

// ============================================
// LEAGUE CONFIG
// ============================================

interface LeagueConfig {
  countryFlag?: string;
  isInternational: boolean;
}

const leagueConfig: Record<string, LeagueConfig> = {
  soccer_epl: { countryFlag: '🇬🇧', isInternational: false },
  soccer_spain_la_liga: { countryFlag: '🇪🇸', isInternational: false },
  soccer_germany_bundesliga: { countryFlag: '🇩🇪', isInternational: false },
  soccer_italy_serie_a: { countryFlag: '🇮🇹', isInternational: false },
  soccer_france_ligue_one: { countryFlag: '🇫🇷', isInternational: false },
  basketball_nba: { isInternational: false },
  icehockey_nhl: { isInternational: false },
  americanfootball_nfl: { isInternational: false },
  basketball_euroleague: { isInternational: true },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getEdgeStrength(percent: number): { level: 'strong' | 'moderate' | 'slight'; bars: number; label: string } {
  if (percent >= 8) return { level: 'strong', bars: 5, label: 'Strong Edge' };
  if (percent >= 5) return { level: 'moderate', bars: 4, label: 'Good Edge' };
  if (percent >= 3) return { level: 'slight', bars: 3, label: 'Slight Edge' };
  return { level: 'slight', bars: 2, label: 'Marginal' };
}

function getConfidenceLevel(alertLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null): { label: string; color: string } {
  switch (alertLevel) {
    case 'HIGH': return { label: 'High', color: 'text-emerald-400' };
    case 'MEDIUM': return { label: 'Medium', color: 'text-amber-400' };
    case 'LOW': return { label: 'Low', color: 'text-blue-400' };
    default: return { label: 'N/A', color: 'text-text-muted' };
  }
}

function getSteamSignal(alert: MarketAlert): { icon: string; label: string; intensity: 'hot' | 'warm' | 'cooling' } {
  const homeChange = Math.abs(alert.homeChange || 0);
  const awayChange = Math.abs(alert.awayChange || 0);
  const maxChange = Math.max(homeChange, awayChange);
  
  // Determine direction
  const direction = alert.changeDirection;
  const team = direction === 'toward_home' ? alert.homeTeam : 
               direction === 'toward_away' ? alert.awayTeam : null;
  
  if (maxChange >= 5) {
    return { icon: '🔥', label: team ? `Heavy money on ${team}` : 'Major line movement', intensity: 'hot' };
  } else if (maxChange >= 3) {
    return { icon: '⚡', label: team ? `Sharp action on ${team}` : 'Sharp money detected', intensity: 'warm' };
  } else {
    return { icon: '📊', label: team ? `Money trickling on ${team}` : 'Slight movement', intensity: 'cooling' };
  }
}

// ============================================
// COMPONENTS
// ============================================

/**
 * Market Summary Brain - Compact insight bar
 */
function MarketSummary({ 
  edgeCount, 
  steamCount, 
  matchesScanned,
  lastRefresh 
}: { 
  edgeCount: number; 
  steamCount: number;
  matchesScanned: number;
  lastRefresh: Date | null;
}) {
  const getMarketState = () => {
    if (edgeCount >= 3) return { text: 'Multiple opportunities detected', color: 'text-emerald-400' };
    if (steamCount >= 2) return { text: 'Active sharp money movement', color: 'text-amber-400' };
    if (edgeCount > 0 || steamCount > 0) return { text: 'Light edge activity', color: 'text-blue-400' };
    return { text: 'Markets appear efficient', color: 'text-text-muted' };
  };
  
  const state = getMarketState();
  
  return (
    <div className="bg-bg-card/80 border border-divider rounded-lg px-4 py-3 mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Market State */}
        <div className="flex items-center gap-3">
          <span className="text-lg">🧠</span>
          <div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider mr-2">Status:</span>
            <span className={`text-sm font-medium ${state.color}`}>{state.text}</span>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-emerald-400">{edgeCount}</span>
            <span className="text-text-muted text-xs">edges</span>
          </div>
          <div className="w-px h-4 bg-divider"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-amber-400">{steamCount}</span>
            <span className="text-text-muted text-xs">steam</span>
          </div>
          <div className="w-px h-4 bg-divider"></div>
          <div className="text-text-muted/50 text-xs">
            {matchesScanned} scanned
            {lastRefresh && ` • ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Edge Strength Bar - Compact inline indicator
 */
function EdgeStrengthBar({ percent, alertLevel }: { percent: number; alertLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null }) {
  const { bars, label } = getEdgeStrength(percent);
  const confidence = getConfidenceLevel(alertLevel);
  
  const barColor = percent >= 8 ? 'bg-emerald-400' : 
                   percent >= 5 ? 'bg-emerald-500/80' : 
                   'bg-emerald-600/60';
  
  return (
    <div className="flex items-center gap-4 pt-2 border-t border-divider/50">
      {/* Edge Strength */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-[10px] text-text-muted uppercase">Strength</span>
        <div className="flex gap-0.5 flex-1 max-w-[60px]">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= bars ? barColor : 'bg-text-muted/20'}`} />
          ))}
        </div>
        <span className="text-[10px] text-emerald-400">{label}</span>
      </div>
      {/* Confidence */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-text-muted uppercase">Conf</span>
        <span className={`text-[10px] font-medium ${confidence.color}`}>{confidence.label}</span>
      </div>
    </div>
  );
}

/**
 * League Header - Ultra compact context
 */
function LeagueHeader({ sport, sportTitle, time }: { sport: string; sportTitle: string; time?: string }) {
  const config = leagueConfig[sport] || { isInternational: false };
  const leagueLogo = getLeagueLogo(sport);
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1.5 opacity-60">
        {config.countryFlag && !config.isInternational && (
          <span className="text-xs">{config.countryFlag}</span>
        )}
        {!imgError ? (
          <Image
            src={leagueLogo}
            alt={sportTitle}
            width={14}
            height={14}
            className="w-3.5 h-3.5 object-contain"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : null}
        <span className="text-text-muted text-[11px]">{sportTitle}</span>
      </div>
      {time && <span className="text-text-muted/40 text-[10px]">{time}</span>}
    </div>
  );
}

/**
 * Edge Match Card - Compact with strong hierarchy
 */
function EdgeMatchCard({ alert }: { alert: MarketAlert }) {
  const matchTime = new Date(alert.matchDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  
  const edgeOutcome = alert.bestEdge.outcome;
  const edgePercent = alert.bestEdge.percent;
  const edgeTeam = edgeOutcome === 'home' ? alert.homeTeam : 
                   edgeOutcome === 'away' ? alert.awayTeam : 'Draw';
  
  const edgeColor = edgePercent >= 8 ? 'text-emerald-300' : 
                    edgePercent >= 5 ? 'text-emerald-400' : 
                    'text-emerald-500';
  
  return (
    <div className="group bg-bg-card border border-divider rounded-lg p-3.5 hover:border-emerald-500/40 transition-all">
      {/* Context row - ultra compact */}
      <LeagueHeader sport={alert.sport} sportTitle={alert.sportTitle} time={matchTime} />
      
      {/* Main content: Edge highlight */}
      <div className="flex items-center justify-between mt-2.5 mb-2">
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-base truncate ${edgeOutcome === 'home' ? 'text-emerald-400' : edgeOutcome === 'away' ? 'text-text-primary' : 'text-text-primary'}`}>
            {alert.homeTeam}
          </div>
          <div className={`text-sm truncate ${edgeOutcome === 'away' ? 'text-emerald-400' : 'text-text-secondary'}`}>
            {alert.awayTeam}
          </div>
        </div>
        
        {/* Big Edge % */}
        <div className="text-right pl-3">
          <div className={`text-2xl font-black ${edgeColor}`}>
            +{edgePercent.toFixed(1)}%
          </div>
          <div className="text-[10px] text-text-muted uppercase">on {edgeOutcome}</div>
        </div>
      </div>
      
      {/* Compact odds row */}
      <div className="flex items-center gap-3 text-xs mb-2.5 bg-emerald-500/5 rounded px-2 py-1.5">
        <span className="text-text-muted">Odds</span>
        <span className="font-mono text-text-secondary">
          {edgeOutcome === 'home' ? alert.homeOdds.toFixed(2) : 
           edgeOutcome === 'away' ? alert.awayOdds.toFixed(2) : 
           alert.drawOdds?.toFixed(2)}
        </span>
        <span className="text-text-muted/50">→</span>
        <span className="text-text-muted">Model</span>
        <span className="font-mono text-emerald-400 font-medium">
          {edgeOutcome === 'home' ? alert.modelHomeProb : 
           edgeOutcome === 'away' ? alert.modelAwayProb : 
           alert.modelDrawProb}%
        </span>
        {alert.drawOdds && (
          <>
            <span className="text-text-muted/30 mx-1">|</span>
            <span className="text-text-muted">Draw</span>
            <span className="font-mono text-text-muted">{alert.drawOdds.toFixed(2)}</span>
          </>
        )}
      </div>
      
      {/* Inline strength indicator */}
      <EdgeStrengthBar percent={edgePercent} alertLevel={alert.alertLevel} />
    </div>
  );
}

/**
 * Steam Move Card - Compact ticker-style
 */
function SteamMoveCard({ alert }: { alert: MarketAlert }) {
  const matchTime = new Date(alert.matchDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  
  // Calculate previous odds
  const homePrevOdds = alert.homeChange && Math.abs(alert.homeChange) > 0.1 
    ? alert.homeOdds / (1 + alert.homeChange / 100) : null;
  const awayPrevOdds = alert.awayChange && Math.abs(alert.awayChange) > 0.1
    ? alert.awayOdds / (1 + alert.awayChange / 100) : null;
  
  const homeHasMove = homePrevOdds !== null;
  const awayHasMove = awayPrevOdds !== null;
  
  // Steam signal - simplified
  const signal = getSteamSignal(alert);
  
  // Compact pill styles
  const pillColors = {
    hot: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    warm: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    cooling: 'bg-amber-500/10 text-amber-500/70 border-amber-500/15',
  };
  
  return (
    <div className="group bg-bg-card border border-amber-500/15 rounded-lg p-3 hover:border-amber-500/30 transition-all">
      {/* Top row: League + Signal pill + Time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <LeagueHeader sport={alert.sport} sportTitle={alert.sportTitle} />
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${pillColors[signal.intensity]}`}>
            {signal.icon} {signal.intensity === 'hot' ? 'HOT' : signal.intensity === 'warm' ? 'SHARP' : 'MOVE'}
          </span>
        </div>
        <span className="text-text-muted/40 text-[10px]">{matchTime}</span>
      </div>
      
      {/* Teams with inline odds movement */}
      <div className="space-y-1">
        {/* Home Team */}
        <div className="flex items-center justify-between text-sm">
          <span className={`truncate flex-1 ${homeHasMove ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
            {alert.homeTeam}
          </span>
          {homeHasMove ? (
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-text-muted/50">{homePrevOdds!.toFixed(2)}</span>
              <span className="text-text-muted/30">→</span>
              <span className={`font-semibold ${alert.homeChange! < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {alert.homeOdds.toFixed(2)}
              </span>
              <span className={`text-[10px] ${alert.homeChange! < 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>
                {alert.homeChange! > 0 ? '+' : ''}{alert.homeChange!.toFixed(1)}%
              </span>
            </div>
          ) : (
            <span className="font-mono text-text-muted/50 text-xs">{alert.homeOdds.toFixed(2)}</span>
          )}
        </div>
        
        {/* Away Team */}
        <div className="flex items-center justify-between text-sm">
          <span className={`truncate flex-1 ${awayHasMove ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
            {alert.awayTeam}
          </span>
          {awayHasMove ? (
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-text-muted/50">{awayPrevOdds!.toFixed(2)}</span>
              <span className="text-text-muted/30">→</span>
              <span className={`font-semibold ${alert.awayChange! < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {alert.awayOdds.toFixed(2)}
              </span>
              <span className={`text-[10px] ${alert.awayChange! < 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>
                {alert.awayChange! > 0 ? '+' : ''}{alert.awayChange!.toFixed(1)}%
              </span>
            </div>
          ) : (
            <span className="font-mono text-text-muted/50 text-xs">{alert.awayOdds.toFixed(2)}</span>
          )}
        </div>
      </div>
      
      {/* Alert Note - ultra compact */}
      {alert.alertNote && (
        <div className="text-[10px] text-amber-400/60 mt-1.5 truncate">
          💡 {alert.alertNote}
        </div>
      )}
    </div>
  );
}

/**
 * Steam Legend - Icon guide at top of steam section
 */
function SteamLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-text-muted mb-4 flex-wrap">
      <span className="flex items-center gap-1"><span>🔥</span> Heavy Money</span>
      <span className="flex items-center gap-1"><span>⚡</span> Sharp Action</span>
      <span className="flex items-center gap-1"><span>📊</span> Slight Move</span>
    </div>
  );
}

function PremiumGate() {
  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="container-custom max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-bg-card via-bg-card to-purple-500/5 border border-purple-500/30 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">Market Alerts</h1>
          <p className="text-text-secondary text-lg mb-6">
            Real-time odds tracking, steam move detection, and model edge alerts 
            are exclusive to Premium subscribers.
          </p>
          
          <div className="bg-bg-primary/50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-text-primary mb-4 text-center">What you get:</h3>
            <ul className="space-y-3 text-text-secondary max-w-md mx-auto">
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Top 5 matches with highest model edge
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Steam move detection (sharp money alerts)
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Real-time odds movement tracking
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Edge strength & confidence indicators
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Market intelligence summary
              </li>
            </ul>
          </div>
          
          <Link href="/pricing" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg px-8 py-3 rounded-lg transition-colors">
            Upgrade to Premium
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="container-custom">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-bg-card rounded-xl"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-8 bg-bg-card rounded w-48"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-72 bg-bg-card rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-bg-card rounded w-40"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-52 bg-bg-card rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function MarketAlertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<MarketAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showAllEdges, setShowAllEdges] = useState(false);
  const [showAllSteam, setShowAllSteam] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/market-alerts');
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
      
      if (!json.success && res.status !== 403) {
        setError(json.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError('Failed to load market alerts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/market-alerts');
      return;
    }

    if (status === 'authenticated') {
      fetchAlerts();
    }
  }, [status, router, fetchAlerts]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!data?.isPremium) return;
    
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [data?.isPremium, fetchAlerts]);

  if (status === 'loading' || (loading && !data)) {
    return <LoadingState />;
  }

  if (data && !data.isPremium) {
    return <PremiumGate />;
  }

  if (error && !data?.data) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="container-custom">
          <div className="bg-bg-card border border-danger/30 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-text-secondary mb-4">{error}</p>
            <button onClick={fetchAlerts} className="btn-primary">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const { topEdgeMatches = [], steamMoves = [], recentUpdates } = data?.data || {};

  return (
    <div className="min-h-screen bg-bg-primary py-8 sm:py-10">
      <div className="container-custom">
        {/* Header - Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Market Alerts
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              PREMIUM
            </span>
          </div>
          
          <button 
            onClick={fetchAlerts} 
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Market Summary Brain */}
        <MarketSummary 
          edgeCount={topEdgeMatches.length} 
          steamCount={steamMoves.length}
          matchesScanned={recentUpdates?.matchesScanned || 0}
          lastRefresh={lastRefresh}
        />

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Value Edges */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <h2 className="text-base font-semibold text-text-primary">Value Edges</h2>
                <span className="text-[10px] text-text-muted bg-bg-card px-1.5 py-0.5 rounded">
                  {topEdgeMatches.length}
                </span>
              </div>
              {topEdgeMatches.length > 5 && (
                <button 
                  onClick={() => setShowAllEdges(!showAllEdges)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {showAllEdges ? '← Less' : `All ${topEdgeMatches.length}`}
                </button>
              )}
            </div>
            
            {topEdgeMatches.length === 0 ? (
              <div className="bg-bg-card/50 border border-divider rounded-lg p-6 text-center">
                <div className="text-2xl mb-2 opacity-50">📊</div>
                <h3 className="font-medium text-text-primary text-sm mb-0.5">No Edges Detected</h3>
                <p className="text-text-muted text-xs">Markets appear efficient</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(showAllEdges ? topEdgeMatches : topEdgeMatches.slice(0, 5)).map(alert => (
                  <EdgeMatchCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </section>

          {/* Steam Moves */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <h2 className="text-base font-semibold text-text-primary">Steam Moves</h2>
                <span className="text-[10px] text-text-muted bg-bg-card px-1.5 py-0.5 rounded">
                  {steamMoves.length}
                </span>
              </div>
              {steamMoves.length > 5 && (
                <button 
                  onClick={() => setShowAllSteam(!showAllSteam)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-medium"
                >
                  {showAllSteam ? '← Less' : `All ${steamMoves.length}`}
                </button>
              )}
            </div>
            
            {/* Steam Legend - inline */}
            <SteamLegend />
            
            {steamMoves.length === 0 ? (
              <div className="bg-bg-card/50 border border-divider rounded-lg p-6 text-center">
                <div className="text-2xl mb-2 opacity-50">📉</div>
                <h3 className="font-medium text-text-primary text-sm mb-0.5">No Steam Detected</h3>
                <p className="text-text-muted text-xs">Sharp money alerts appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(showAllSteam ? steamMoves : steamMoves.slice(0, 5)).map(alert => (
                  <SteamMoveCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Disclaimer - Very subtle */}
        <div className="mt-8 text-center">
          <p className="text-text-muted/50 text-[10px]">
            ⚠️ Educational purposes only. Model edges are statistical analysis, not guaranteed outcomes. 18+
          </p>
        </div>
      </div>
    </div>
  );
}
