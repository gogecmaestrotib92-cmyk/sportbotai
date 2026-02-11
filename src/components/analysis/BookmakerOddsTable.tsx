/**
 * BookmakerOddsTable - Line Shopping / Odds Comparison
 * 
 * Shows odds from ALL bookmakers side-by-side so users can find the best price.
 * Best odds per outcome are highlighted in emerald.
 * 
 * This directly addresses the competitive gap:
 * "Doesn't have odds comparison/line shopping features"
 * 
 * Access: Visible to ALL users (free feature to drive engagement)
 * PRO: Shows exact edge % per bookmaker vs model probability
 */

'use client';

import { useState, useMemo } from 'react';
import { colors } from '@/lib/design-system';

type Locale = 'en' | 'sr';

const translations = {
  en: {
    title: 'Odds Comparison',
    subtitle: 'Compare prices across bookmakers',
    bookmaker: 'Bookmaker',
    home: 'Home',
    draw: 'Draw',
    away: 'Away',
    best: 'Best',
    bestOdds: 'Best Odds',
    sortBy: 'Sort by',
    sortAlpha: 'Name',
    sortBestHome: 'Best Home',
    sortBestAway: 'Best Away',
    lastUpdated: 'Last updated',
    showAll: 'Show all',
    showLess: 'Show less',
    bookmakers: 'bookmakers',
    bestPrice: 'Best price',
    lineShopping: 'Line Shopping',
    findBestPrice: 'Find the best price across',
    noOdds: 'Odds comparison not available for this match',
    disclaimer: 'Odds are for informational purposes only. Always verify with the bookmaker.',
    pro: 'PRO',
    impliedProb: 'Implied',
    overUnder: 'Over/Under',
    spread: 'Spread',
    moneyline: 'Moneyline',
    market: 'Market',
    allMarkets: 'All Markets',
  },
  sr: {
    title: 'Poređenje Kvota',
    subtitle: 'Uporedi cene kod kladionica',
    bookmaker: 'Kladionica',
    home: 'Domaćin',
    draw: 'Nerešeno',
    away: 'Gost',
    best: 'Najbolje',
    bestOdds: 'Najbolje Kvote',
    sortBy: 'Sortiraj po',
    sortAlpha: 'Ime',
    sortBestHome: 'Najbolji domaćin',
    sortBestAway: 'Najbolji gost',
    lastUpdated: 'Poslednje ažuriranje',
    showAll: 'Prikaži sve',
    showLess: 'Prikaži manje',
    bookmakers: 'kladionica',
    bestPrice: 'Najbolja cena',
    lineShopping: 'Poređenje Kvota',
    findBestPrice: 'Pronađi najbolju cenu kod',
    noOdds: 'Poređenje kvota nije dostupno za ovaj meč',
    disclaimer: 'Kvote su samo u informativne svrhe. Uvek proverite kod kladionice.',
    pro: 'PRO',
    impliedProb: 'Implicirano',
    overUnder: 'Više/Manje',
    spread: 'Hendikep',
    moneyline: 'Pobednik',
    market: 'Tržište',
    allMarkets: 'Sva Tržišta',
  },
};

// Bookmaker display names and logos (known bookmakers)
const bookmakerMeta: Record<string, { display: string; color?: string }> = {
  'draftkings': { display: 'DraftKings', color: '#53d337' },
  'fanduel': { display: 'FanDuel', color: '#1493ff' },
  'betmgm': { display: 'BetMGM', color: '#bfa14a' },
  'bovada': { display: 'Bovada', color: '#cc0000' },
  'pointsbetus': { display: 'PointsBet', color: '#f42f4c' },
  'williamhill_us': { display: 'Caesars', color: '#0a3d2a' },
  'betrivers': { display: 'BetRivers', color: '#1a1a2e' },
  'unibet_us': { display: 'Unibet', color: '#147b45' },
  'mybookieag': { display: 'MyBookie', color: '#1f1f1f' },
  'betonlineag': { display: 'BetOnline', color: '#900000' },
  'lowvig': { display: 'LowVig', color: '#2a2a2a' },
  'bet365': { display: 'bet365', color: '#027b5b' },
  'pinnacle': { display: 'Pinnacle', color: '#eab308' },
  'betfair': { display: 'Betfair', color: '#ffb80c' },
  'betfair_ex_eu': { display: 'Betfair Exchange', color: '#ffb80c' },
  'williamhill': { display: 'William Hill', color: '#003e29' },
  'sport888': { display: '888sport', color: '#1b8f5a' },
  'unibet_eu': { display: 'Unibet', color: '#147b45' },
  'paddypower': { display: 'Paddy Power', color: '#004833' },
  'ladbrokes_uk': { display: 'Ladbrokes', color: '#ec1c24' },
  'coral': { display: 'Coral', color: '#00625f' },
  'skybet': { display: 'Sky Bet', color: '#003b7e' },
  'betway': { display: 'Betway', color: '#00a826' },
  'marathon_bet': { display: 'Marathonbet', color: '#1a3a5e' },
  'matchbook': { display: 'Matchbook', color: '#ff6600' },
  'sportsbet': { display: 'Sportsbet', color: '#f47920' },
  'tab': { display: 'TAB', color: '#ed1c24' },
  'neds': { display: 'Neds', color: '#ff5f00' },
  'pointsbet_au': { display: 'PointsBet AU', color: '#f42f4c' },
  'betclic': { display: 'Betclic', color: '#e53028' },
  'suprabets': { display: 'Suprabets', color: '#1a1a2e' },
  'onexbet': { display: '1xBet', color: '#1a5276' },
  'coolbet': { display: 'Coolbet', color: '#00d4aa' },
  'nordicbet': { display: 'NordicBet', color: '#0a2240' },
  'gtbets': { display: 'GTbets', color: '#8b0000' },
  'betus': { display: 'BetUS', color: '#1a237e' },
};

function getBookmakerDisplay(key: string): string {
  return bookmakerMeta[key]?.display || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export interface BookmakerOddsEntry {
  bookmaker: string;
  homeOdds: number;
  drawOdds?: number | null;
  awayOdds: number;
  lastUpdate?: string;
  // Optional: spreads and totals
  spread?: {
    home: { line: number; odds: number };
    away: { line: number; odds: number };
  };
  total?: {
    over: { line: number; odds: number };
    under: { line: number; odds: number };
  };
}

interface BookmakerOddsTableProps {
  bookmakerOdds: BookmakerOddsEntry[];
  homeTeam: string;
  awayTeam: string;
  hasDraw?: boolean;
  locale?: Locale;
}

type SortMode = 'alpha' | 'bestHome' | 'bestAway' | 'bestDraw';

export default function BookmakerOddsTable({
  bookmakerOdds,
  homeTeam,
  awayTeam,
  hasDraw = true,
  locale = 'en',
}: BookmakerOddsTableProps) {
  const t = translations[locale];
  const [sortMode, setSortMode] = useState<SortMode>('alpha');
  const [showAll, setShowAll] = useState(false);
  const INITIAL_SHOW = 8;

  // Compute best odds per outcome
  const { bestHome, bestDraw, bestAway, sortedOdds } = useMemo(() => {
    const best = {
      home: -Infinity,
      draw: -Infinity,
      away: -Infinity,
    };

    for (const bm of bookmakerOdds) {
      if (bm.homeOdds > best.home) best.home = bm.homeOdds;
      if (bm.drawOdds && bm.drawOdds > best.draw) best.draw = bm.drawOdds;
      if (bm.awayOdds > best.away) best.away = bm.awayOdds;
    }

    // Sort
    const sorted = [...bookmakerOdds].sort((a, b) => {
      switch (sortMode) {
        case 'bestHome':
          return b.homeOdds - a.homeOdds;
        case 'bestAway':
          return b.awayOdds - a.awayOdds;
        case 'bestDraw':
          return (b.drawOdds || 0) - (a.drawOdds || 0);
        case 'alpha':
        default:
          return getBookmakerDisplay(a.bookmaker).localeCompare(getBookmakerDisplay(b.bookmaker));
      }
    });

    return {
      bestHome: best.home,
      bestDraw: best.draw,
      bestAway: best.away,
      sortedOdds: sorted,
    };
  }, [bookmakerOdds, sortMode]);

  if (!bookmakerOdds || bookmakerOdds.length === 0) {
    return null;
  }

  const displayOdds = showAll ? sortedOdds : sortedOdds.slice(0, INITIAL_SHOW);
  const hasMore = sortedOdds.length > INITIAL_SHOW;

  // Format odds to 2 decimal places
  const fmtOdds = (odds: number) => odds.toFixed(2);

  // Check if this odds value is the best
  const isBest = (value: number, best: number) => Math.abs(value - best) < 0.001;

  // Implied probability from decimal odds
  const impliedProb = (odds: number) => ((1 / odds) * 100).toFixed(1);

  return (
    <div className="mt-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/15 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">{t.title}</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {t.findBestPrice} {bookmakerOdds.length} {t.bookmakers}
            </p>
          </div>
        </div>
      </div>

      {/* Best Odds Summary Row */}
      <div className="mb-4 p-4 rounded-xl bg-emerald-500/[0.07] border border-emerald-400/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-emerald-400 text-xs">✦</span>
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">{t.bestOdds}</span>
        </div>
        <div className={`grid ${hasDraw ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
          <div className="text-center">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 truncate">{homeTeam}</div>
            <div className="text-xl font-bold text-emerald-400">{fmtOdds(bestHome)}</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">{impliedProb(bestHome)}%</div>
          </div>
          {hasDraw && bestDraw > 0 && (
            <div className="text-center">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{t.draw}</div>
              <div className="text-xl font-bold text-emerald-400">{fmtOdds(bestDraw)}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{impliedProb(bestDraw)}%</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 truncate">{awayTeam}</div>
            <div className="text-xl font-bold text-emerald-400">{fmtOdds(bestAway)}</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">{impliedProb(bestAway)}%</div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{t.sortBy}:</span>
        <div className="flex gap-1">
          {[
            { key: 'alpha' as SortMode, label: t.sortAlpha },
            { key: 'bestHome' as SortMode, label: t.home },
            ...(hasDraw ? [{ key: 'bestDraw' as SortMode, label: t.draw }] : []),
            { key: 'bestAway' as SortMode, label: t.away },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortMode(opt.key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                sortMode === opt.key
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-400/30'
                  : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30 hover:text-zinc-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#0a0a0b] border border-white/[0.06] overflow-hidden">
        {/* Table Header */}
        <div className={`grid ${hasDraw ? 'grid-cols-[1fr_80px_80px_80px]' : 'grid-cols-[1fr_90px_90px]'} gap-0 px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.02]`}>
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{t.bookmaker}</div>
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.home}</div>
          {hasDraw && (
            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.draw}</div>
          )}
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.away}</div>
        </div>

        {/* Rows */}
        {displayOdds.map((bm, idx) => {
          const isHomeBest = isBest(bm.homeOdds, bestHome);
          const isDrawBest = bm.drawOdds ? isBest(bm.drawOdds, bestDraw) : false;
          const isAwayBest = isBest(bm.awayOdds, bestAway);

          return (
            <div
              key={bm.bookmaker}
              className={`grid ${hasDraw ? 'grid-cols-[1fr_80px_80px_80px]' : 'grid-cols-[1fr_90px_90px]'} gap-0 px-4 py-3 items-center ${
                idx < displayOdds.length - 1 ? 'border-b border-white/[0.03]' : ''
              } hover:bg-white/[0.02] transition-colors`}
            >
              {/* Bookmaker name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: bookmakerMeta[bm.bookmaker]?.color || '#6b7280' }}
                />
                <span className="text-sm text-zinc-300 truncate">
                  {getBookmakerDisplay(bm.bookmaker)}
                </span>
              </div>

              {/* Home odds */}
              <div className="text-center">
                <span
                  className={`text-sm font-mono font-semibold ${
                    isHomeBest
                      ? `${colors.value.text} relative`
                      : 'text-zinc-400'
                  }`}
                >
                  {fmtOdds(bm.homeOdds)}
                  {isHomeBest && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  )}
                </span>
              </div>

              {/* Draw odds */}
              {hasDraw && (
                <div className="text-center">
                  {bm.drawOdds ? (
                    <span
                      className={`text-sm font-mono font-semibold ${
                        isDrawBest
                          ? `${colors.value.text} relative`
                          : 'text-zinc-400'
                      }`}
                    >
                      {fmtOdds(bm.drawOdds)}
                      {isDrawBest && (
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      )}
                    </span>
                  ) : (
                    <span className="text-zinc-700 text-sm">—</span>
                  )}
                </div>
              )}

              {/* Away odds */}
              <div className="text-center">
                <span
                  className={`text-sm font-mono font-semibold ${
                    isAwayBest
                      ? `${colors.value.text} relative`
                      : 'text-zinc-400'
                  }`}
                >
                  {fmtOdds(bm.awayOdds)}
                  {isAwayBest && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {/* Show More / Show Less */}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-3 text-center text-xs text-zinc-500 hover:text-zinc-400 border-t border-white/[0.04] transition-colors"
          >
            {showAll
              ? t.showLess
              : `${t.showAll} ${sortedOdds.length} ${t.bookmakers}`}
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-zinc-600 mt-3 text-center">
        {t.disclaimer}
      </p>
    </div>
  );
}
