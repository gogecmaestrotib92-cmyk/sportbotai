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
  matchId: string;  // SEO-friendly slug for linking to full analysis
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
  // Blur flags for non-premium users
  isBlurred?: boolean;
  blurRank?: number;
}

interface MarketAlertsResponse {
  success: boolean;
  data?: {
    topEdgeMatches: MarketAlert[];
    allMatches: MarketAlert[];  // All matches sorted by edge
    steamMoves: MarketAlert[];
    allSteamMoves: MarketAlert[];  // All steam moves
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
  soccer_portugal_primeira_liga: { countryFlag: '🇵🇹', isInternational: false },
  soccer_netherlands_eredivisie: { countryFlag: '🇳🇱', isInternational: false },
  soccer_turkey_super_league: { countryFlag: '🇹🇷', isInternational: false },
  soccer_belgium_first_div: { countryFlag: '🇧🇪', isInternational: false },
  soccer_spl: { countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', isInternational: false },
  soccer_uefa_europa_league: { isInternational: true },
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
    <div className="card-glass rounded-lg px-3 sm:px-4 py-3 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Market State */}
        <div className="flex items-center gap-2 sm:gap-3">
          <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Status:</span>
            <span className={`text-sm font-semibold ${state.color}`}>{state.text}</span>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex items-center gap-3 sm:gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold text-emerald-400">{edgeCount}</span>
            <span className="text-text-muted text-xs">edges</span>
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold text-amber-400">{steamCount}</span>
            <span className="text-text-muted text-xs">steam</span>
          </div>
          <div className="w-px h-4 bg-white/10 hidden sm:block"></div>
          <div className="text-text-muted/50 text-xs hidden sm:block">
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
function EdgeStrengthBar({ percent, alertLevel, noBorder = false }: { percent: number; alertLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null; noBorder?: boolean }) {
  const { bars, label } = getEdgeStrength(percent);
  const confidence = getConfidenceLevel(alertLevel);
  
  const barColor = percent >= 8 ? 'bg-emerald-400' : 
                   percent >= 5 ? 'bg-emerald-500/80' : 
                   'bg-emerald-600/60';
  
  return (
    <div className={`flex items-center justify-between gap-2 flex-1 min-w-0 ${noBorder ? '' : 'pt-2 border-t border-white/5'}`}>
      {/* Edge Strength */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="flex gap-0.5 w-10 sm:w-[60px] shrink-0">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= bars ? barColor : 'bg-text-muted/20'}`} />
          ))}
        </div>
        <span className="text-[10px] text-emerald-400 truncate">{label}</span>
      </div>
      {/* Confidence */}
      <div className="flex items-center gap-1 shrink-0">
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
    <div className="group card-glass rounded-lg p-3.5 hover:border-emerald-500/40 transition-all overflow-hidden">
      {/* Context row - ultra compact */}
      <LeagueHeader sport={alert.sport} sportTitle={alert.sportTitle} time={matchTime} />
      
      {/* Main content: Edge highlight */}
      <div className="flex items-center justify-between gap-2 mt-2.5 mb-2 min-w-0">
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-base truncate ${edgeOutcome === 'home' ? 'text-emerald-400' : edgeOutcome === 'away' ? 'text-text-primary' : 'text-text-primary'}`}>
            {alert.homeTeam}
          </div>
          <div className={`text-sm truncate ${edgeOutcome === 'away' ? 'text-emerald-400' : 'text-text-secondary'}`}>
            {alert.awayTeam}
          </div>
        </div>
        
        {/* Big Edge % */}
        <div className="text-right pl-2 shrink-0">
          <div className={`text-2xl font-black ${edgeColor}`}>
            +{edgePercent.toFixed(1)}%
          </div>
          <div className="text-[10px] text-text-muted uppercase">on {edgeOutcome}</div>
        </div>
      </div>
      
      {/* Compact odds row - responsive for mobile */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] mb-2.5 bg-emerald-500/5 rounded px-2 py-1.5 overflow-hidden">
        <span className="text-text-muted">Odds</span>
        <span className="font-mono text-text-secondary">
          {edgeOutcome === 'home' ? alert.homeOdds.toFixed(2) : 
           edgeOutcome === 'away' ? alert.awayOdds.toFixed(2) : 
           alert.drawOdds?.toFixed(2)}
        </span>
        <span className="text-text-muted/50">→</span>
        <span className="text-text-muted">Model</span>
        <span className="font-mono text-emerald-400 font-medium">
          {(edgeOutcome === 'home' ? alert.modelHomeProb : 
           edgeOutcome === 'away' ? alert.modelAwayProb : 
           alert.modelDrawProb)?.toFixed(1)}%
        </span>
        {alert.drawOdds && (
          <>
            <span className="text-text-muted">Draw</span>
            <span className="font-mono text-text-muted">{alert.drawOdds.toFixed(2)}</span>
          </>
        )}
      </div>
      
      {/* Strength indicator + View Analysis link */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
        <EdgeStrengthBar percent={edgePercent} alertLevel={alert.alertLevel} noBorder />
        <Link 
          href={`/match/${alert.matchId}`}
          className="text-[10px] text-violet hover:text-violet-light transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
        >
          <span className="hidden sm:inline">Full </span>Analysis
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/**
 * Blurred Edge Card - Shows partial info to entice non-premium users
 * Teams visible, edge % hidden with blur effect, teaser text showing edge strength hint
 */
function BlurredEdgeCard({ alert }: { alert: MarketAlert }) {
  const matchTime = new Date(alert.matchDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  
  const rank = alert.blurRank || 1;
  const rankBadge = rank <= 3 ? '🥇' : rank <= 6 ? '🥈' : '🥉';
  
  // Edge hint based on rank
  const edgeHint = rank <= 3 ? '+8-15%' : rank <= 6 ? '+5-8%' : '+3-5%';
  const hintColor = rank <= 3 ? 'from-emerald-400 to-emerald-500' : 
                    rank <= 6 ? 'from-emerald-500 to-emerald-600' : 
                    'from-emerald-600 to-emerald-700';
  
  return (
    <Link href="/pricing#pro" className="block">
      <div className="group relative bg-bg-card border border-zinc-500/30 rounded-lg p-3.5 hover:border-zinc-400/50 transition-all cursor-pointer overflow-hidden">
        {/* Premium badge overlay */}
        <div className="absolute top-2 right-2 z-10">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-zinc-300/20 to-zinc-400/20 text-zinc-300 border border-zinc-400/40 flex items-center gap-1">
            {rankBadge} #{rank}
          </span>
        </div>
        
        {/* Context row - ultra compact */}
        <LeagueHeader sport={alert.sport} sportTitle={alert.sportTitle} time={matchTime} />
        
        {/* Main content: Teams visible */}
        <div className="flex items-center justify-between gap-2 mt-2.5 mb-2 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base truncate text-text-primary">
              {alert.homeTeam}
            </div>
            <div className="text-sm truncate text-text-secondary">
              {alert.awayTeam}
            </div>
          </div>
          
          {/* Blurred Edge % with gradient tease */}
          <div className="text-right pl-2 relative shrink-0">
            <div className={`text-2xl font-black bg-gradient-to-r ${hintColor} bg-clip-text text-transparent blur-[2px] select-none`}>
              {edgeHint}
            </div>
            <div className="text-[10px] text-text-muted uppercase">edge hidden</div>
          </div>
        </div>
        
        {/* Blurred odds row */}
        <div className="flex items-center gap-3 text-xs mb-2.5 bg-zinc-500/10 rounded px-2 py-1.5 relative overflow-hidden">
          <span className="text-text-muted">Odds</span>
          <span className="font-mono text-text-muted/50">
            {alert.homeOdds.toFixed(2)}
          </span>
          <span className="text-text-muted/30">vs</span>
          <span className="font-mono text-text-muted/50">
            {alert.awayOdds.toFixed(2)}
          </span>
          <span className="text-text-muted/50 mx-1">|</span>
          <span className="text-zinc-400 font-medium blur-sm select-none">Model: ??.?%</span>
          {/* Blur overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bg-card/50 to-transparent pointer-events-none" />
        </div>
        
        {/* Teaser bar instead of strength indicator */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-500/30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">{alert.bestEdge.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
            <span>Unlock to see</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Blurred Steam Card - Shows partial steam info to entice non-premium users
 */
function BlurredSteamCard({ alert }: { alert: MarketAlert }) {
  const matchTime = new Date(alert.matchDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  
  const rank = alert.blurRank || 1;
  const intensity = rank <= 2 ? 'hot' : rank <= 4 ? 'warm' : 'cooling';
  
  const pillColors = {
    hot: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    warm: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    cooling: 'bg-amber-500/10 text-amber-500/70 border-amber-500/15',
  };
  
  return (
    <Link href="/pricing#pro" className="block">
      <div className="group card-glass border-zinc-500/30 rounded-lg p-3 hover:border-zinc-400/50 transition-all cursor-pointer relative overflow-hidden">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LeagueHeader sport={alert.sport} sportTitle={alert.sportTitle} />
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${pillColors[intensity]}`}>
              {intensity === 'hot' ? '🔥 HOT' : intensity === 'warm' ? '⚡ SHARP' : '📊 MOVE'}
            </span>
          </div>
          <span className="text-text-muted/40 text-[10px]">{matchTime}</span>
        </div>
        
        {/* Teams visible */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-2 text-sm min-w-0">
            <span className="truncate min-w-0 flex-1 text-text-primary font-medium">{alert.homeTeam}</span>
            <span className="font-mono text-xs text-text-muted/50 blur-sm select-none">?.?? → ?.??</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm min-w-0">
            <span className="truncate min-w-0 flex-1 text-text-secondary">{alert.awayTeam}</span>
            <span className="font-mono text-xs text-text-muted/50 blur-sm select-none">?.?? → ?.??</span>
          </div>
        </div>
        
        {/* Teaser */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-500/30 text-xs">
          <span className="text-amber-400/80">{alert.alertNote}</span>
          <span className="text-zinc-400 flex items-center gap-1 group-hover:text-zinc-300 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
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
    <div className="group card-glass border-amber-500/15 rounded-lg p-3 hover:border-amber-500/30 transition-all overflow-hidden">
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
        <div className="flex items-center justify-between gap-2 text-sm min-w-0">
          <span className={`truncate min-w-0 flex-1 ${homeHasMove ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
            {alert.homeTeam}
          </span>
          {homeHasMove ? (
            <div className="flex items-center gap-1 font-mono text-xs shrink-0">
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
        <div className="flex items-center justify-between gap-2 text-sm min-w-0">
          <span className={`truncate min-w-0 flex-1 ${awayHasMove ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
            {alert.awayTeam}
          </span>
          {awayHasMove ? (
            <div className="flex items-center gap-1 font-mono text-xs shrink-0">
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
    <div className="min-h-screen bg-bg relative w-full overflow-hidden py-12">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[80vw] sm:w-[600px] h-[80vw] sm:h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[60vw] sm:w-[500px] h-[60vw] sm:h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative">
        <div className="card-glass p-8 text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-extrabold text-text-primary mb-4 tracking-tight">Market Alerts</h1>
          <p className="text-text-secondary text-lg mb-6">
            Real-time odds tracking, steam move detection, and model edge alerts 
            are exclusive to Premium subscribers.
          </p>
          
          <div className="bg-white/5 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-bold text-text-primary mb-4 text-center">What you get:</h3>
            <ul className="space-y-3 text-text-secondary max-w-md mx-auto">
              <li className="flex items-center gap-3">
                <span className="text-violet-light">✓</span>
                Top 5 matches with highest model edge
              </li>
              <li className="flex items-center gap-3">
                <span className="text-violet-light">✓</span>
                Steam move detection (sharp money alerts)
              </li>
              <li className="flex items-center gap-3">
                <span className="text-violet-light">✓</span>
                Real-time odds movement tracking
              </li>
              <li className="flex items-center gap-3">
                <span className="text-violet-light">✓</span>
                Edge strength & confidence indicators
              </li>
              <li className="flex items-center gap-3">
                <span className="text-violet-light">✓</span>
                Market intelligence summary
              </li>
            </ul>
          </div>
          
          <Link href="/pricing#premium" className="btn-secondary inline-block">
            Upgrade to Premium
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-bg relative w-full overflow-hidden py-12">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[80vw] sm:w-[600px] h-[80vw] sm:h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="animate-pulse space-y-6">
          <div className="h-20 card-glass rounded-xl"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-8 card-glass rounded w-48"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-72 card-glass rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-8 card-glass rounded w-40"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-52 card-glass rounded-xl"></div>
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Auto-refresh every 5 minutes (only for premium)
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

  // Removed PremiumGate - now we show blurred data instead

  if (error && !data?.data) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

  const { topEdgeMatches = [], allMatches = [], steamMoves = [], allSteamMoves = [], recentUpdates } = data?.data || {};
  const isPremium = data?.isPremium ?? false;
  
  // Search filter function
  const matchesSearch = (alert: MarketAlert) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      alert.homeTeam.toLowerCase().includes(query) ||
      alert.awayTeam.toLowerCase().includes(query) ||
      alert.matchRef.toLowerCase().includes(query)
    );
  };
  
  // Filter matches based on search
  const isSearching = searchQuery.trim().length > 0;
  const filteredEdgeMatches = isSearching 
    ? allMatches.filter(matchesSearch) 
    : topEdgeMatches;
  const filteredSteamMoves = isSearching 
    ? allSteamMoves.filter(matchesSearch) 
    : steamMoves;
  
  // Remaining matches (after top edges shown) - only when not searching
  const remainingMatches = isSearching ? [] : allMatches.slice(isPremium ? 5 : 10);

  return (
    <div className="min-h-screen bg-bg relative w-full overflow-hidden py-8 sm:py-10">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[80vw] sm:w-[600px] h-[80vw] sm:h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[60vw] sm:w-[500px] h-[60vw] sm:h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Upgrade Banner for non-premium users */}
        {!isPremium && (
          <div className="mb-6 card-glass border-violet/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔓</span>
              <div>
                <h3 className="font-bold text-text-primary text-sm">Unlock All Market Edges</h3>
                <p className="text-text-muted text-xs">Top 10 edges are hidden • Upgrade to see exact values and full analytics</p>
              </div>
            </div>
            <Link 
              href="/pricing#premium" 
              className="btn-secondary flex-shrink-0 text-sm px-5 py-2"
            >
              Upgrade to Premium
            </Link>
          </div>
        )}
        
        {/* Header - Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Market Alerts
            </h1>
            {isPremium ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-violet/20 to-violet-dark/20 text-violet-light border border-violet/30">
                PREMIUM
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PREVIEW
              </span>
            )}
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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search team or match..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 card-glass border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet/50 focus:border-violet transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {isSearching && (
            <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
              <span>Found:</span>
              <span className="text-emerald-400 font-medium">{filteredEdgeMatches.length}</span>
              <span>in Value Edges,</span>
              <span className="text-amber-400 font-medium">{filteredSteamMoves.length}</span>
              <span>in Steam Moves</span>
            </div>
          )}
        </div>
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Value Edges */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
                <h2 className="text-base font-semibold text-text-primary">
                  {isSearching ? 'Value Edges' : 'Top Value Edges'}
                </h2>
                <span className="text-[10px] text-text-muted bg-bg-card px-1.5 py-0.5 rounded">
                  {isSearching ? filteredEdgeMatches.length : 'Top 5'}
                </span>
              </div>
              {isSearching && filteredEdgeMatches.length === 0 && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] text-primary hover:text-primary/80 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
            
            {filteredEdgeMatches.length === 0 ? (
              <div className="bg-bg-card/50 border border-divider rounded-lg p-6 text-center">
                <div className="text-2xl mb-2 opacity-50">{isSearching ? '🔍' : '📊'}</div>
                <h3 className="font-medium text-text-primary text-sm mb-0.5">
                  {isSearching ? 'No matches found' : 'No Edges Detected'}
                </h3>
                <p className="text-text-muted text-xs">
                  {isSearching ? `No results for "${searchQuery}"` : 'Markets appear efficient'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredEdgeMatches.map(alert => 
                  alert.isBlurred ? (
                    <BlurredEdgeCard key={alert.id} alert={alert} />
                  ) : (
                    <EdgeMatchCard key={alert.id} alert={alert} />
                  )
                )}
              </div>
            )}
            
            {/* Expandable: All Other Matches - only for premium users */}
            {isPremium && !isSearching && remainingMatches.length > 0 && (
              <div className="mt-4">
                <button 
                  onClick={() => setShowAllEdges(!showAllEdges)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-card/50 hover:bg-bg-card border border-divider rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📋</span>
                    <span className="text-sm text-text-secondary">
                      All Other Matches
                    </span>
                    <span className="text-[10px] text-text-muted bg-bg-primary px-1.5 py-0.5 rounded">
                      {remainingMatches.length}
                    </span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-text-muted transition-transform ${showAllEdges ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showAllEdges && (
                  <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {remainingMatches.map(alert => 
                      alert.isBlurred ? (
                        <BlurredEdgeCard key={alert.id} alert={alert} />
                      ) : (
                        <EdgeMatchCard key={alert.id} alert={alert} />
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Steam Moves */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                <h2 className="text-base font-semibold text-text-primary">Steam Moves</h2>
                <span className="text-[10px] text-text-muted bg-bg-card px-1.5 py-0.5 rounded">
                  {isSearching ? filteredSteamMoves.length : 'Top 5'}
                </span>
              </div>
              {isSearching && filteredSteamMoves.length === 0 && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] text-primary hover:text-primary/80 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
            
            {/* Steam Legend - inline */}
            <SteamLegend />
            
            {filteredSteamMoves.length === 0 ? (
              <div className="bg-bg-card/50 border border-divider rounded-lg p-6 text-center">
                <div className="text-2xl mb-2 opacity-50">{isSearching ? '🔍' : '📉'}</div>
                <h3 className="font-medium text-text-primary text-sm mb-0.5">
                  {isSearching ? 'No matches found' : 'No Steam Detected'}
                </h3>
                <p className="text-text-muted text-xs">
                  {isSearching ? `No results for "${searchQuery}"` : 'Sharp money alerts appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSteamMoves.map(alert => 
                  alert.isBlurred ? (
                    <BlurredSteamCard key={alert.id} alert={alert} />
                  ) : (
                    <SteamMoveCard key={alert.id} alert={alert} />
                  )
                )}
              </div>
            )}
            
            {/* Expandable: All Other Steam Moves - only for premium users */}
            {isPremium && !isSearching && allSteamMoves.length > 5 && (
              <div className="mt-4">
                <button 
                  onClick={() => setShowAllSteam(!showAllSteam)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-card/50 hover:bg-bg-card border border-divider rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📊</span>
                    <span className="text-sm text-text-secondary">
                      All Other Steam Moves
                    </span>
                    <span className="text-[10px] text-text-muted bg-bg-primary px-1.5 py-0.5 rounded">
                      {allSteamMoves.length - 5}
                    </span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-text-muted transition-transform ${showAllSteam ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showAllSteam && (
                  <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {allSteamMoves.slice(5).map(alert => 
                      alert.isBlurred ? (
                        <BlurredSteamCard key={alert.id} alert={alert} />
                      ) : (
                        <SteamMoveCard key={alert.id} alert={alert} />
                      )
                    )}
                  </div>
                )}
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
