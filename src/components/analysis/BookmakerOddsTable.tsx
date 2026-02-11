/**
 * BookmakerOddsTable - Line Shopping / Odds Comparison
 * 
 * Shows odds from ALL bookmakers side-by-side so users can find the best price.
 * Best odds per outcome are highlighted in emerald.
 * 
 * Supports 3 markets via tabs:
 * - Moneyline (1X2) — home/draw/away
 * - Spread (handicap) — line + odds per side
 * - Over/Under (totals) — line + over/under odds
 * 
 * Access: Visible to ALL users (free feature to drive engagement)
 */

'use client';

import { useState, useMemo } from 'react';
import { colors } from '@/lib/design-system';

type Locale = 'en' | 'sr';
type MarketTab = 'moneyline' | 'spread' | 'totals';
type SortMode = 'alpha' | 'bestHome' | 'bestAway' | 'bestDraw' | 'bestOver' | 'bestUnder' | 'bestLine';

const translations = {
  en: {
    title: 'Odds Comparison',
    bookmaker: 'Bookmaker',
    home: 'Home',
    draw: 'Draw',
    away: 'Away',
    bestOdds: 'Best Odds',
    bestSpread: 'Best Spread',
    bestTotals: 'Best Totals',
    sortBy: 'Sort by',
    sortAlpha: 'Name',
    showAll: 'Show all',
    showLess: 'Show less',
    bookmakers: 'bookmakers',
    findBestPrice: 'Find the best price across',
    disclaimer: 'Odds are for informational purposes only. Always verify with the bookmaker.',
    overUnder: 'Over/Under',
    spread: 'Spread',
    moneyline: 'Moneyline',
    over: 'Over',
    under: 'Under',
    line: 'Line',
    bestPrice: 'best price',
  },
  sr: {
    title: 'Poređenje Kvota',
    bookmaker: 'Kladionica',
    home: 'Domaćin',
    draw: 'Nerešeno',
    away: 'Gost',
    bestOdds: 'Najbolje Kvote',
    bestSpread: 'Najbolji Hendikep',
    bestTotals: 'Najbolji Total',
    sortBy: 'Sortiraj po',
    sortAlpha: 'Ime',
    showAll: 'Prikaži sve',
    showLess: 'Prikaži manje',
    bookmakers: 'kladionica',
    findBestPrice: 'Pronađi najbolju cenu kod',
    disclaimer: 'Kvote su samo u informativne svrhe. Uvek proverite kod kladionice.',
    overUnder: 'Više/Manje',
    spread: 'Hendikep',
    moneyline: 'Pobednik',
    over: 'Više',
    under: 'Manje',
    line: 'Linija',
    bestPrice: 'najbolja kvota',
  },
};

// Bookmaker display names and brand colors
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

// ── Helpers ──────────────────────────────────────────────
const fmtOdds = (odds: number) => odds.toFixed(2);
const fmtLine = (line: number) => (line > 0 ? `+${line}` : `${line}`);
const impliedProb = (odds: number) => ((1 / odds) * 100).toFixed(1);
const isBestVal = (value: number, best: number) => Math.abs(value - best) < 0.001;

// ── Component ────────────────────────────────────────────
export default function BookmakerOddsTable({
  bookmakerOdds,
  homeTeam,
  awayTeam,
  hasDraw = true,
  locale = 'en',
}: BookmakerOddsTableProps) {
  const t = translations[locale];

  // Detect available markets
  const hasSpread = useMemo(() => bookmakerOdds.some(bm => bm.spread), [bookmakerOdds]);
  const hasTotals = useMemo(() => bookmakerOdds.some(bm => bm.total), [bookmakerOdds]);

  const [activeMarket, setActiveMarket] = useState<MarketTab>('moneyline');
  const [sortMode, setSortMode] = useState<SortMode>('alpha');
  const [showAll, setShowAll] = useState(false);
  const INITIAL_SHOW = 8;

  // ── Moneyline best values ──
  const moneylineBest = useMemo(() => {
    const best = { home: -Infinity, draw: -Infinity, away: -Infinity };
    for (const bm of bookmakerOdds) {
      if (bm.homeOdds > best.home) best.home = bm.homeOdds;
      if (bm.drawOdds && bm.drawOdds > best.draw) best.draw = bm.drawOdds;
      if (bm.awayOdds > best.away) best.away = bm.awayOdds;
    }
    return best;
  }, [bookmakerOdds]);

  // ── Spread best values ──
  const spreadBest = useMemo(() => {
    const best = { homeOdds: -Infinity, awayOdds: -Infinity };
    for (const bm of bookmakerOdds) {
      if (bm.spread) {
        if (bm.spread.home.odds > best.homeOdds) best.homeOdds = bm.spread.home.odds;
        if (bm.spread.away.odds > best.awayOdds) best.awayOdds = bm.spread.away.odds;
      }
    }
    return best;
  }, [bookmakerOdds]);

  // ── Totals best values ──
  const totalsBest = useMemo(() => {
    const best = { overOdds: -Infinity, underOdds: -Infinity };
    for (const bm of bookmakerOdds) {
      if (bm.total) {
        if (bm.total.over.odds > best.overOdds) best.overOdds = bm.total.over.odds;
        if (bm.total.under.odds > best.underOdds) best.underOdds = bm.total.under.odds;
      }
    }
    return best;
  }, [bookmakerOdds]);

  // ── Sorted list for active market ──
  const sortedOdds = useMemo(() => {
    let filtered = bookmakerOdds;
    if (activeMarket === 'spread') filtered = bookmakerOdds.filter(bm => bm.spread);
    if (activeMarket === 'totals') filtered = bookmakerOdds.filter(bm => bm.total);

    return [...filtered].sort((a, b) => {
      switch (sortMode) {
        case 'bestHome':
          if (activeMarket === 'spread') return (b.spread?.home.odds ?? 0) - (a.spread?.home.odds ?? 0);
          return b.homeOdds - a.homeOdds;
        case 'bestAway':
          if (activeMarket === 'spread') return (b.spread?.away.odds ?? 0) - (a.spread?.away.odds ?? 0);
          return b.awayOdds - a.awayOdds;
        case 'bestDraw':
          return (b.drawOdds || 0) - (a.drawOdds || 0);
        case 'bestOver':
          return (b.total?.over.odds ?? 0) - (a.total?.over.odds ?? 0);
        case 'bestUnder':
          return (b.total?.under.odds ?? 0) - (a.total?.under.odds ?? 0);
        case 'bestLine':
          return (a.total?.over.line ?? 999) - (b.total?.over.line ?? 999);
        case 'alpha':
        default:
          return getBookmakerDisplay(a.bookmaker).localeCompare(getBookmakerDisplay(b.bookmaker));
      }
    });
  }, [bookmakerOdds, sortMode, activeMarket]);

  if (!bookmakerOdds || bookmakerOdds.length === 0) return null;

  const displayOdds = showAll ? sortedOdds : sortedOdds.slice(0, INITIAL_SHOW);
  const hasMore = sortedOdds.length > INITIAL_SHOW;

  // Reset sort when changing market
  const handleMarketChange = (market: MarketTab) => {
    setActiveMarket(market);
    setSortMode('alpha');
    setShowAll(false);
  };

  // ── Sort options per market ──
  const sortOptions: { key: SortMode; label: string }[] = (() => {
    const base: { key: SortMode; label: string }[] = [{ key: 'alpha', label: t.sortAlpha }];
    if (activeMarket === 'moneyline') {
      base.push({ key: 'bestHome', label: t.home });
      if (hasDraw) base.push({ key: 'bestDraw', label: t.draw });
      base.push({ key: 'bestAway', label: t.away });
    } else if (activeMarket === 'spread') {
      base.push({ key: 'bestHome', label: t.home });
      base.push({ key: 'bestAway', label: t.away });
    } else {
      base.push({ key: 'bestOver', label: t.over });
      base.push({ key: 'bestUnder', label: t.under });
      base.push({ key: 'bestLine', label: t.line });
    }
    return base;
  })();

  // ── Market tabs config ──
  const marketTabs: { key: MarketTab; label: string; available: boolean; icon: string }[] = [
    { key: 'moneyline', label: t.moneyline, available: true, icon: '⚡' },
    { key: 'spread', label: t.spread, available: hasSpread, icon: '↔' },
    { key: 'totals', label: t.overUnder, available: hasTotals, icon: '📊' },
  ];

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

      {/* Market Tabs */}
      {(hasSpread || hasTotals) && (
        <div className="flex gap-1.5 mb-4">
          {marketTabs.filter(tab => tab.available).map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleMarketChange(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeMarket === tab.key
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                  : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/30 hover:text-zinc-400 hover:border-zinc-600/40'
              }`}
            >
              <span className="text-[13px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MONEYLINE TAB
         ════════════════════════════════════════════════════ */}
      {activeMarket === 'moneyline' && (
        <>
          {/* Best Odds Summary */}
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/[0.07] border border-emerald-400/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-emerald-400 text-xs">✦</span>
              <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">{t.bestOdds}</span>
            </div>
            <div className={`grid ${hasDraw ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 truncate">{homeTeam}</div>
                <div className="text-xl font-bold text-emerald-400">{fmtOdds(moneylineBest.home)}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{impliedProb(moneylineBest.home)}%</div>
              </div>
              {hasDraw && moneylineBest.draw > 0 && (
                <div className="text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{t.draw}</div>
                  <div className="text-xl font-bold text-emerald-400">{fmtOdds(moneylineBest.draw)}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{impliedProb(moneylineBest.draw)}%</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 truncate">{awayTeam}</div>
                <div className="text-xl font-bold text-emerald-400">{fmtOdds(moneylineBest.away)}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{impliedProb(moneylineBest.away)}%</div>
              </div>
            </div>
          </div>

          {/* Sort Controls */}
          <SortBar sortMode={sortMode} setSortMode={setSortMode} options={sortOptions} sortByLabel={t.sortBy} />

          {/* Table */}
          <div className="rounded-xl bg-[#0a0a0b] border border-white/[0.06] overflow-hidden">
            <div className={`grid ${hasDraw ? 'grid-cols-[1fr_80px_80px_80px]' : 'grid-cols-[1fr_90px_90px]'} gap-0 px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.02]`}>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{t.bookmaker}</div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.home}</div>
              {hasDraw && <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.draw}</div>}
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.away}</div>
            </div>

            {displayOdds.map((bm, idx) => (
              <div
                key={bm.bookmaker}
                className={`grid ${hasDraw ? 'grid-cols-[1fr_80px_80px_80px]' : 'grid-cols-[1fr_90px_90px]'} gap-0 px-4 py-3 items-center ${
                  idx < displayOdds.length - 1 ? 'border-b border-white/[0.03]' : ''
                } hover:bg-white/[0.02] transition-colors`}
              >
                <BookmakerCell bookmaker={bm.bookmaker} />
                <OddsCell value={bm.homeOdds} best={moneylineBest.home} />
                {hasDraw && <OddsCell value={bm.drawOdds ?? undefined} best={moneylineBest.draw} />}
                <OddsCell value={bm.awayOdds} best={moneylineBest.away} />
              </div>
            ))}

            <ShowMoreButton
              hasMore={hasMore}
              showAll={showAll}
              setShowAll={setShowAll}
              total={sortedOdds.length}
              t={t}
            />
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════
          SPREAD TAB
         ════════════════════════════════════════════════════ */}
      {activeMarket === 'spread' && (
        <>
          {/* Best Spread Summary */}
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/[0.07] border border-emerald-400/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-emerald-400 text-xs">✦</span>
              <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">{t.bestSpread}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 truncate">{homeTeam}</div>
                <div className="text-xl font-bold text-emerald-400">{fmtOdds(spreadBest.homeOdds)}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{t.bestPrice}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 truncate">{awayTeam}</div>
                <div className="text-xl font-bold text-emerald-400">{fmtOdds(spreadBest.awayOdds)}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{t.bestPrice}</div>
              </div>
            </div>
          </div>

          {/* Sort Controls */}
          <SortBar sortMode={sortMode} setSortMode={setSortMode} options={sortOptions} sortByLabel={t.sortBy} />

          {/* Table */}
          <div className="rounded-xl bg-[#0a0a0b] border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-[1fr_70px_70px_70px_70px] gap-0 px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.02]">
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{t.bookmaker}</div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.line}</div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.home}</div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.line}</div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.away}</div>
            </div>

            {displayOdds.map((bm, idx) => (
              <div
                key={bm.bookmaker}
                className={`grid grid-cols-[1fr_70px_70px_70px_70px] gap-0 px-4 py-3 items-center ${
                  idx < displayOdds.length - 1 ? 'border-b border-white/[0.03]' : ''
                } hover:bg-white/[0.02] transition-colors`}
              >
                <BookmakerCell bookmaker={bm.bookmaker} />
                {/* Home line */}
                <div className="text-center">
                  <span className="text-xs font-mono text-zinc-500">
                    {bm.spread ? fmtLine(bm.spread.home.line) : '—'}
                  </span>
                </div>
                {/* Home odds */}
                <OddsCell value={bm.spread?.home.odds} best={spreadBest.homeOdds} />
                {/* Away line */}
                <div className="text-center">
                  <span className="text-xs font-mono text-zinc-500">
                    {bm.spread ? fmtLine(bm.spread.away.line) : '—'}
                  </span>
                </div>
                {/* Away odds */}
                <OddsCell value={bm.spread?.away.odds} best={spreadBest.awayOdds} />
              </div>
            ))}

            <ShowMoreButton
              hasMore={hasMore}
              showAll={showAll}
              setShowAll={setShowAll}
              total={sortedOdds.length}
              t={t}
            />
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════
          OVER/UNDER TAB
         ════════════════════════════════════════════════════ */}
      {activeMarket === 'totals' && (
        <>
          {/* Best Totals Summary */}
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/[0.07] border border-emerald-400/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-emerald-400 text-xs">✦</span>
              <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">{t.bestTotals}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{t.over}</div>
                <div className="text-xl font-bold text-emerald-400">{fmtOdds(totalsBest.overOdds)}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{t.bestPrice}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{t.under}</div>
                <div className="text-xl font-bold text-emerald-400">{fmtOdds(totalsBest.underOdds)}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{t.bestPrice}</div>
              </div>
            </div>
          </div>

          {/* Sort Controls */}
          <SortBar sortMode={sortMode} setSortMode={setSortMode} options={sortOptions} sortByLabel={t.sortBy} />

          {/* Table */}
          <div className="rounded-xl bg-[#0a0a0b] border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px_80px] gap-0 px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.02]">
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{t.bookmaker}</div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.line}</div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.over}</div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider text-center">{t.under}</div>
            </div>

            {displayOdds.map((bm, idx) => (
              <div
                key={bm.bookmaker}
                className={`grid grid-cols-[1fr_80px_80px_80px] gap-0 px-4 py-3 items-center ${
                  idx < displayOdds.length - 1 ? 'border-b border-white/[0.03]' : ''
                } hover:bg-white/[0.02] transition-colors`}
              >
                <BookmakerCell bookmaker={bm.bookmaker} />
                {/* Line */}
                <div className="text-center">
                  <span className="text-xs font-mono text-zinc-300 font-medium">
                    {bm.total ? bm.total.over.line.toFixed(1) : '—'}
                  </span>
                </div>
                {/* Over odds */}
                <OddsCell value={bm.total?.over.odds} best={totalsBest.overOdds} />
                {/* Under odds */}
                <OddsCell value={bm.total?.under.odds} best={totalsBest.underOdds} />
              </div>
            ))}

            <ShowMoreButton
              hasMore={hasMore}
              showAll={showAll}
              setShowAll={setShowAll}
              total={sortedOdds.length}
              t={t}
            />
          </div>
        </>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-zinc-600 mt-3 text-center">
        {t.disclaimer}
      </p>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function BookmakerCell({ bookmaker }: { bookmaker: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: bookmakerMeta[bookmaker]?.color || '#6b7280' }}
      />
      <span className="text-sm text-zinc-300 truncate">
        {getBookmakerDisplay(bookmaker)}
      </span>
    </div>
  );
}

function OddsCell({ value, best, fallback }: { value?: number; best: number; fallback?: string }) {
  if (value == null) {
    return (
      <div className="text-center">
        <span className="text-zinc-700 text-sm">{fallback ?? '—'}</span>
      </div>
    );
  }
  const isBest = isBestVal(value, best);
  return (
    <div className="text-center">
      <span className={`text-sm font-mono font-semibold inline-flex items-center gap-1 ${isBest ? colors.value.text : 'text-zinc-400'}`}>
        {fmtOdds(value)}
        {isBest && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />}
      </span>
    </div>
  );
}

function SortBar({
  sortMode,
  setSortMode,
  options,
  sortByLabel,
}: {
  sortMode: SortMode;
  setSortMode: (m: SortMode) => void;
  options: { key: SortMode; label: string }[];
  sortByLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{sortByLabel}:</span>
      <div className="flex gap-1 flex-wrap">
        {options.map((opt) => (
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
  );
}

function ShowMoreButton({
  hasMore,
  showAll,
  setShowAll,
  total,
  t,
}: {
  hasMore: boolean;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  total: number;
  t: { showAll: string; showLess: string; bookmakers: string };
}) {
  if (!hasMore) return null;
  return (
    <button
      onClick={() => setShowAll(!showAll)}
      className="w-full py-3 text-center text-xs text-zinc-500 hover:text-zinc-400 border-t border-white/[0.04] transition-colors"
    >
      {showAll ? t.showLess : `${t.showAll} ${total} ${t.bookmakers}`}
    </button>
  );
}
