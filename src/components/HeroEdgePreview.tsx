/**
 * Hero Edge Preview Component
 * 
 * Replaces LiveIntelCard in the hero section.
 * Shows the #1 best-edge match with mini Recharts probability bars.
 * Same glassmorphism container, but demonstrates core product value.
 * 
 * - Guest: Sees bar shapes but numbers are blurred → CTA to sign in
 * - Logged in: Sees full data → CTA to view match
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, Tooltip, ResponsiveContainer } from 'recharts';

interface TopEdgePick {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
  kickoff: string;
  hasEdge: boolean;
  edgeBucket: string | null;
  edgeValue: number | null;
  confidence: number | null;
  selection: string | null;
  odds: number | null;
  probabilities: {
    home: number | null;
    draw: number | null;
    away: number | null;
  } | null;
  predictedScore: string | null;
  headline: string | null;
  locked?: boolean;
}

const sportEmojis: Record<string, string> = {
  soccer: '⚽',
  basketball: '🏀',
  nba: '🏀',
  hockey: '🏒',
  nhl: '🏒',
  icehockey: '🏒',
  americanfootball: '🏈',
  nfl: '🏈',
  mma: '🥊',
  ufc: '🥊',
  default: '🎯',
};

function getSportEmoji(sport: string): string {
  if (!sport) return sportEmojis.default;
  const normalized = sport.toLowerCase();
  for (const key of Object.keys(sportEmojis)) {
    if (normalized.includes(key)) return sportEmojis[key];
  }
  return sportEmojis.default;
}

function getLeagueShortName(league: string): string {
  if (!league) return '';
  // Common abbreviations
  const map: Record<string, string> = {
    'English Premier League': 'EPL',
    'Premier League': 'EPL',
    'La Liga': 'La Liga',
    'Bundesliga': 'Bundesliga',
    'Serie A': 'Serie A',
    'Ligue 1': 'Ligue 1',
    'Champions League': 'UCL',
    'UEFA Champions League': 'UCL',
    'Europa League': 'UEL',
    'NBA': 'NBA',
    'NFL': 'NFL',
    'NHL': 'NHL',
    'UFC': 'UFC',
  };
  for (const [full, short] of Object.entries(map)) {
    if (league.includes(full)) return short;
  }
  // Fallback: take first 3-4 meaningful words
  return league.length > 20 ? league.slice(0, 18) + '…' : league;
}

function formatKickoff(kickoff: string): string {
  try {
    const d = new Date(kickoff);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 0) return 'Live';
    if (diffHrs < 1) return `${Math.round(diffHrs * 60)}min`;
    if (diffHrs < 24) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

// Edge bucket colors
function getEdgeBucketStyle(bucket: string | null, edgeValue: number | null) {
  const val = edgeValue || 0;
  if (val >= 10) return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', label: 'Strong Edge' };
  if (val >= 5) return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Moderate Edge' };
  if (val >= 3) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/15', label: 'Slight Edge' };
  return { bg: 'bg-zinc-800/50', text: 'text-zinc-400', border: 'border-zinc-700', label: 'Analyzing...' };
}

// Custom tooltip for bars
function CustomBarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 shadow-xl">
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-1.5 text-[10px]">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span className="text-zinc-400">{entry.name}:</span>
          <span className="text-white font-semibold tabular-nums">{entry.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

// Mini probability bar card (one per outcome)
function MiniProbCard({ 
  label, 
  modelProb, 
  marketProb, 
  isValue, 
  isLocked 
}: { 
  label: string; 
  modelProb: number; 
  marketProb: number; 
  isValue: boolean; 
  isLocked: boolean;
}) {
  const diff = modelProb - marketProb;
  const hasEdge = diff > 3;
  const isOverpriced = diff < -3;

  const marketColor = '#3b82f6'; // blue
  const modelColor = hasEdge ? '#10b981' : isOverpriced ? '#ef4444' : '#f59e0b'; // emerald / red / amber

  const chartData = [{ market: marketProb, model: modelProb }];

  return (
    <div className={`flex flex-col p-2 rounded-lg border transition-all ${
      isValue && !isLocked
        ? 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
        : 'border-white/[0.06] bg-white/[0.02]'
    } ${!isValue ? 'opacity-60' : ''}`}>
      {/* Label */}
      <p className="text-[10px] sm:text-xs font-semibold text-white text-center truncate mb-1" title={label}>
        {label}
      </p>

      {/* Numbers or blur */}
      {isLocked ? (
        <div className="flex flex-col items-center gap-0.5 mb-1">
          <span className="text-[9px] text-blue-400 blur-[3px] select-none">48.2%</span>
          <span className="text-[11px] font-bold text-emerald-400 blur-[3px] select-none">56.1%</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0 mb-1">
          <span className="text-[9px] sm:text-[10px] font-medium tabular-nums" style={{ color: marketColor }}>{marketProb.toFixed(1)}%</span>
          <span className="text-[11px] sm:text-xs font-bold tabular-nums text-gradient-gold">{modelProb.toFixed(1)}%</span>
        </div>
      )}

      {/* Mini Recharts bar */}
      <div className="h-[50px] sm:h-[60px]">
        {isLocked ? (
          // Blurred placeholder bars
          <div className="h-full flex items-end justify-center gap-1.5 px-2">
            <div className="w-5 sm:w-7 rounded-t" style={{ height: '60%', backgroundColor: marketColor, opacity: 0.4 }} />
            <div className="w-5 sm:w-7 rounded-t" style={{ height: '75%', backgroundColor: '#10b981', opacity: 0.4 }} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }} barGap={1} barCategoryGap="15%">
              <Tooltip content={<CustomBarTooltip />} cursor={false} />
              <Bar dataKey="market" name="Market" fill={marketColor} radius={[3, 3, 0, 0]} maxBarSize={28} animationDuration={800} animationEasing="ease-out" />
              <Bar dataKey="model" name="Model" fill={modelColor} radius={[3, 3, 0, 0]} maxBarSize={28} animationDuration={800} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Edge badge */}
      <div className="mt-1">
        {isLocked ? (
          <div className="text-center text-[8px] sm:text-[9px] text-zinc-500 font-medium blur-[2px] select-none">+5.2% edge</div>
        ) : hasEdge ? (
          <div className="text-center text-[8px] sm:text-[9px] text-emerald-400 font-semibold">+{diff.toFixed(1)}% edge</div>
        ) : isOverpriced ? (
          <div className="text-center text-[8px] sm:text-[9px] text-zinc-500 font-medium">{diff.toFixed(1)}%</div>
        ) : (
          <div className="text-center text-[8px] sm:text-[9px] text-zinc-500 font-medium">Fair</div>
        )}
      </div>
    </div>
  );
}

export default function HeroEdgePreview() {
  const [pick, setPick] = useState<TopEdgePick | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchTopEdge = async () => {
    try {
      const response = await fetch('/api/daily-picks?limit=1');
      const data = await response.json();

      if (data.success && data.picks?.length > 0) {
        setPick(data.picks[0]);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch top edge:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopEdge();
    // Refresh every 5 minutes (edge data doesn't change as fast as intel)
    const interval = setInterval(fetchTopEdge, 300000);
    return () => clearInterval(interval);
  }, []);

  const isLocked = !pick || pick.locked === true || !pick.probabilities;

  // Derive market implied probabilities from odds (if we have them)
  // For display, we use the probabilities from the API
  const probs = pick?.probabilities;
  const hasDraw = probs?.draw !== null && probs?.draw !== undefined;

  // Estimate market implied probabilities (model prob - edge = implied market)
  // This is approximate but gives us the comparison data
  const modelProbs = probs ? {
    home: probs.home || 33,
    draw: probs.draw || (hasDraw ? 28 : 0),
    away: probs.away || 33,
  } : { home: 45, draw: 28, away: 27 };

  // Derive market probs: if selection has edge, market underprices it
  const edgeVal = pick?.edgeValue || 0;
  const selection = pick?.selection || 'home';
  const marketProbs = {
    home: selection === 'home' ? modelProbs.home - edgeVal : modelProbs.home + (edgeVal / (hasDraw ? 2 : 1)),
    draw: hasDraw ? (selection === 'draw' ? modelProbs.draw - edgeVal : modelProbs.draw + (edgeVal / 2)) : 0,
    away: selection === 'away' ? modelProbs.away - edgeVal : modelProbs.away + (edgeVal / (hasDraw ? 2 : 1)),
  };

  // Match slug for link
  const matchSlug = pick ? `${pick.homeTeam}-vs-${pick.awayTeam}`.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
  const matchLink = pick?.matchId ? `/match/${pick.matchId}` : `/matches`;

  return (
    <div className="relative">
      {/* Card Container — same shell as LiveIntelCard */}
      <div className="bg-[#0a0a0b] border border-emerald-500/30 rounded-xl sm:rounded-2xl overflow-hidden ring-1 ring-emerald-500/10">
        {/* Header */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-accent/30">
              <span className="text-base sm:text-lg">📊</span>
            </div>
            <div>
              <span className="text-white font-semibold text-xs sm:text-sm block">Today&apos;s Top Edge</span>
              <p className="text-zinc-500 text-[9px] sm:text-[10px] flex items-center gap-1">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                AI vs Market
              </p>
            </div>
          </div>
          <Link
            href={matchLink}
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-md sm:rounded-lg transition-all shadow-sm shadow-emerald-500/20"
          >
            View Full →
          </Link>
        </div>

        {/* Content */}
        <div className="px-3 sm:px-5 py-3 sm:py-4">
          {loading ? (
            /* Loading skeleton */
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/5 rounded w-3/4 mx-auto" />
              <div className="h-3 bg-white/5 rounded w-1/2 mx-auto" />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white/5 rounded-lg" />
                ))}
              </div>
            </div>
          ) : !pick ? (
            /* Empty state */
            <div className="py-6 text-center">
              <p className="text-zinc-500 text-xs sm:text-sm">No edges found today</p>
              <Link href="/matches" className="text-accent text-xs mt-2 inline-block hover:underline">
                Browse matches →
              </Link>
            </div>
          ) : (
            <>
              {/* Match info */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-sm sm:text-base">{getSportEmoji(pick.sport)}</span>
                  <span className="text-white font-bold text-sm sm:text-base">
                    {pick.homeTeam} <span className="text-zinc-500 font-normal">vs</span> {pick.awayTeam}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-zinc-500">
                  <span>{getLeagueShortName(pick.league)}</span>
                  <span>•</span>
                  <span>{formatKickoff(pick.kickoff)}</span>
                  {pick.hasEdge && !isLocked && (
                    <>
                      <span>•</span>
                      <span className={`font-semibold ${getEdgeBucketStyle(pick.edgeBucket, pick.edgeValue).text}`}>
                        {getEdgeBucketStyle(pick.edgeBucket, pick.edgeValue).label}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Recharts probability bars — 3 columns (or 2 for non-draw sports) */}
              <div className={`grid gap-1.5 sm:gap-2 ${hasDraw ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <MiniProbCard
                  label={pick.homeTeam}
                  modelProb={modelProbs.home}
                  marketProb={marketProbs.home}
                  isValue={selection === 'home'}
                  isLocked={isLocked}
                />
                {hasDraw && (
                  <MiniProbCard
                    label="Draw"
                    modelProb={modelProbs.draw}
                    marketProb={marketProbs.draw}
                    isValue={selection === 'draw'}
                    isLocked={isLocked}
                  />
                )}
                <MiniProbCard
                  label={pick.awayTeam}
                  modelProb={modelProbs.away}
                  marketProb={marketProbs.away}
                  isValue={selection === 'away'}
                  isLocked={isLocked}
                />
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-blue-500" />
                  <span className="text-zinc-500 text-[8px] sm:text-[9px] uppercase tracking-wide">Market</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-emerald-500" />
                  <span className="text-zinc-300 text-[8px] sm:text-[9px] uppercase tracking-wide font-medium">Model</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-5 py-2 sm:py-3 border-t border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 sm:gap-2">
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/[0.03] text-zinc-500 text-[8px] sm:text-[9px] font-medium rounded border border-white/[0.06]">
                ⚡ Real-Time
              </span>
              {isLocked && (
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-violet-500/10 text-violet-400 text-[8px] sm:text-[9px] font-medium rounded border border-violet-500/20">
                  🔒 PRO
                </span>
              )}
            </div>
            <span className="text-zinc-600 text-[8px] sm:text-[9px]">
              {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
