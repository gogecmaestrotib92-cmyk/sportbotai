'use client';

import { useState, useEffect } from 'react';

/* ─────── Vertical Bar Card (matches real AIvsMarketHero) ─────── */
function VertBarCard({ label, mkt, mdl, edge, isBest }: {
  label: string; mkt: number; mdl: number; edge: string; isBest: boolean;
}) {
  // Compute bar heights — scale so max is ~90%
  const maxVal = Math.max(mkt, mdl, 55);
  const mktH = (mkt / maxVal) * 100;
  const mdlH = (mdl / maxVal) * 100;
  const hasEdge = edge.startsWith('+');
  const isOverpriced = edge.startsWith('−') || edge.startsWith('-');
  const modelColor = hasEdge ? '#2AF6A0' : isOverpriced ? '#ef4444' : '#f59e0b';

  return (
    <div className={`flex flex-col p-2.5 rounded-xl border transition-all ${
      isBest
        ? 'bg-[#0a0a0b] border-[#2AF6A0]/40 shadow-[0_0_20px_rgba(42,246,160,0.15)] ring-1 ring-[#2AF6A0]/20'
        : 'bg-[#0a0a0b] border-white/[0.06] opacity-70'
    }`}>
      {/* Team name */}
      <p className="text-[10px] sm:text-xs font-semibold text-white text-center leading-tight min-h-[28px] flex items-center justify-center">{label}</p>

      {/* Percentage numbers */}
      <div className="flex flex-col items-center gap-0 mt-1 mb-1">
        <span className="text-[9px] sm:text-[10px] font-medium tabular-nums text-blue-400">{mkt.toFixed(1)}%</span>
        <span className="text-[11px] sm:text-xs font-bold tabular-nums" style={{ color: modelColor }}>{mdl.toFixed(1)}%</span>
      </div>

      {/* Vertical bars */}
      <div className="flex-1 min-h-[80px] flex items-end justify-center gap-2 pb-0.5">
        {/* Market bar */}
        <div className="flex flex-col items-center gap-0.5 w-7">
          <div className="w-full bg-white/5 rounded-t-[3px] relative" style={{ height: '80px' }}>
            <div
              className="absolute bottom-0 w-full rounded-t-[3px] bg-blue-500 transition-all duration-700"
              style={{ height: `${mktH}%` }}
            />
          </div>
        </div>
        {/* Model bar */}
        <div className="flex flex-col items-center gap-0.5 w-7">
          <div className="w-full bg-white/5 rounded-t-[3px] relative" style={{ height: '80px' }}>
            <div
              className="absolute bottom-0 w-full rounded-t-[3px] transition-all duration-700"
              style={{ height: `${mdlH}%`, backgroundColor: modelColor }}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-2 mt-1 mb-1">
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 rounded-sm bg-blue-500" />
          <span className="text-[7px] text-zinc-500 uppercase">Mkt</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: modelColor }} />
          <span className="text-[7px] text-zinc-300 uppercase font-medium">Mdl</span>
        </div>
      </div>

      {/* Edge badge */}
      <div className={`px-1.5 py-0.5 rounded-md border text-center text-[9px] font-semibold ${
        hasEdge
          ? 'bg-[#2AF6A0]/10 text-[#2AF6A0] border-[#2AF6A0]/30'
          : isOverpriced
            ? 'bg-white/5 text-rose-400 border-white/10'
            : 'bg-white/5 text-zinc-400 border-white/10'
      }`}>
        {edge}
      </div>
    </div>
  );
}

/* ─────── Slide 1: Odds Cards + H2H + Roster (matches real app) ─────── */
function SlideOddsCards() {
  return (
    <div className="px-3 pt-2 pb-3 flex flex-col justify-between h-full">
      {/* 2 vertical bar cards — NBA is moneyline (no draw) */}
      <div className="grid grid-cols-2 gap-2">
        <VertBarCard label="Boston Celtics" mkt={58.3} mdl={63.1} edge="+5% edge" isBest={true} />
        <VertBarCard label="LA Lakers" mkt={41.7} mdl={36.9} edge="−5% over" isBest={false} />
      </div>

      {/* Head to Head card */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0b] p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <span className="text-[9px] font-semibold text-[#2AF6A0] uppercase tracking-widest">Head to Head</span>
        </div>
        <p className="text-[13px] font-bold text-white">Celtics: 6 wins in last 10</p>
        <p className="text-[9px] text-white/40 mt-0.5">Celtics lead the series 3-1 this season</p>
      </div>

      {/* Squad Availability — matches real app design */}
      <div className="rounded-xl border border-red-500/15 bg-[#0a0a0b] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-800/80 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <span className="text-[9px] font-semibold text-[#2AF6A0] uppercase tracking-widest block">Squad Availability</span>
              <span className="text-[8px] text-zinc-600">4 players unavailable</span>
            </div>
          </div>
          {/* Severity dots */}
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <span className="text-[8px] text-red-400 font-medium ml-1">High</span>
          </div>
        </div>

        {/* Squad Impact bar */}
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[7px] text-zinc-600 uppercase tracking-wider">Squad Impact</span>
            <span className="text-[7px] font-medium text-red-400">High Impact</span>
          </div>
          <div className="h-1 rounded-full bg-zinc-800/60 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: '80%', background: 'linear-gradient(90deg, #ef444466, #ef4444)', boxShadow: '0 0 6px rgba(239,68,68,0.4)' }} />
          </div>
        </div>

        {/* Two-column team split */}
        <div className="grid grid-cols-2 divide-x divide-white/[0.04]">
          {/* Celtics */}
          <div className="px-2.5 pb-2.5 pt-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-semibold text-zinc-300 uppercase tracking-wider">Celtics</span>
              <span className="text-[8px] tabular-nums font-bold text-red-400 bg-red-500/10 px-1 py-0.5 rounded">1</span>
            </div>
            {/* Injury card */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-red-500/[0.06] border border-white/[0.04]">
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
                <circle cx="14" cy="8" r="4.5" fill="#ef4444" fillOpacity={0.15} stroke="#ef4444" strokeWidth="1" strokeOpacity={0.4} />
                <path d="M7 24c0-4 3.134-7 7-7s7 3 7 7" fill="#ef4444" fillOpacity={0.1} stroke="#ef4444" strokeWidth="1" strokeOpacity={0.3} />
                <circle cx="21" cy="5" r="3" fill="#ef4444" />
                <path d="M19.8 3.8l2.4 2.4m0-2.4l-2.4 2.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <div className="min-w-0">
                <span className="text-[9px] font-semibold text-white block truncate">J. Holiday</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[7px] text-red-400 font-medium">Out</span>
                  <span className="text-[7px] text-zinc-600">·</span>
                  <span className="text-[7px] text-zinc-500 truncate">Hamstring...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lakers */}
          <div className="px-2.5 pb-2.5 pt-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-semibold text-zinc-300 uppercase tracking-wider">Lakers</span>
              <span className="text-[8px] tabular-nums font-bold text-red-400 bg-red-500/10 px-1 py-0.5 rounded">3</span>
            </div>
            {/* Injury cards */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-500/[0.06] border border-white/[0.04]">
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
                  <circle cx="14" cy="8" r="4.5" fill="#f59e0b" fillOpacity={0.15} stroke="#f59e0b" strokeWidth="1" strokeOpacity={0.4} />
                  <path d="M7 24c0-4 3.134-7 7-7s7 3 7 7" fill="#f59e0b" fillOpacity={0.1} stroke="#f59e0b" strokeWidth="1" strokeOpacity={0.3} />
                  <circle cx="21" cy="5" r="3" fill="#f59e0b" />
                  <text x="21" y="6.5" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">?</text>
                </svg>
                <div className="min-w-0">
                  <span className="text-[9px] font-semibold text-white block truncate">A. Davis</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[7px] text-amber-400 font-medium">Doubtful</span>
                    <span className="text-[7px] text-zinc-600">·</span>
                    <span className="text-[7px] text-zinc-500 truncate">Knee...</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-red-500/[0.06] border border-white/[0.04]">
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
                  <circle cx="14" cy="8" r="4.5" fill="#ef4444" fillOpacity={0.15} stroke="#ef4444" strokeWidth="1" strokeOpacity={0.4} />
                  <path d="M7 24c0-4 3.134-7 7-7s7 3 7 7" fill="#ef4444" fillOpacity={0.1} stroke="#ef4444" strokeWidth="1" strokeOpacity={0.3} />
                  <circle cx="21" cy="5" r="3" fill="#ef4444" />
                  <path d="M19.8 3.8l2.4 2.4m0-2.4l-2.4 2.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <div className="min-w-0">
                <span className="text-[9px] font-semibold text-white block truncate">R. Hachimura</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[7px] text-red-400 font-medium">Out</span>
                  <span className="text-[7px] text-zinc-600">·</span>
                  <span className="text-[7px] text-zinc-500 truncate">Ankle Inj...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────── Slide 2: Win Prob + Form + Risk + Verdict ─────── */
function SlideProbAndForm() {
  return (
    <div className="px-3 pt-2 pb-3 flex flex-col justify-between h-full">
      {/* Win Probability */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0b] p-3">
        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-semibold">Win Probability</div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-white/50 uppercase font-bold text-white">Boston Celtics</span>
          <span className="text-[9px] text-white/50 uppercase">LA Lakers</span>
        </div>
        <div className="flex h-3.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center" style={{ width: '63%' }}>
            <span className="text-[8px] font-bold text-white">63%</span>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center" style={{ width: '37%' }}>
            <span className="text-[8px] font-bold text-white">37%</span>
          </div>
        </div>
        <div className="flex justify-center mt-1.5">
          <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#2AF6A0]/10 text-[#2AF6A0] font-medium">☘️ Celtics value — market underprices by 5%</span>
        </div>
      </div>

      {/* Form Momentum chart */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0b] p-3">
        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-semibold">Form Momentum</div>
        <div className="relative h-[70px]">
          <svg viewBox="0 0 240 60" className="w-full h-full">
            {/* Grid lines */}
            <line x1="0" y1="15" x2="240" y2="15" stroke="white" strokeOpacity="0.04" />
            <line x1="0" y1="30" x2="240" y2="30" stroke="white" strokeOpacity="0.04" />
            <line x1="0" y1="45" x2="240" y2="45" stroke="white" strokeOpacity="0.04" />
            {/* Celtics line — strong uptrend */}
            <polyline points="15,35 60,22 115,18 170,10 225,8" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" />
            {/* Lakers line — inconsistent */}
            <polyline points="15,28 60,40 115,20 170,38 225,42" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinejoin="round" />
            {/* Celtics dots */}
            <circle cx="15" cy="35" r="3.5" fill="#22c55e" />
            <circle cx="60" cy="22" r="3.5" fill="#22c55e" />
            <circle cx="115" cy="18" r="3.5" fill="#22c55e" />
            <circle cx="170" cy="10" r="3.5" fill="#22c55e" />
            <circle cx="225" cy="8" r="3.5" fill="#22c55e" />
            {/* Lakers dots */}
            <circle cx="15" cy="28" r="3.5" fill="#22c55e" />
            <circle cx="60" cy="40" r="3.5" fill="#ef4444" />
            <circle cx="115" cy="20" r="3.5" fill="#22c55e" />
            <circle cx="170" cy="38" r="3.5" fill="#ef4444" />
            <circle cx="225" cy="42" r="3.5" fill="#ef4444" />
          </svg>
          <div className="absolute bottom-0 right-0 flex items-center gap-2.5">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[8px] text-white/40">BOS</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-[8px] text-white/40">LAL</span></div>
          </div>
        </div>
      </div>

      {/* Risk Level */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0b] p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Risk Level</span>
          <span className="text-xs font-bold text-[#2AF6A0]">Low</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#2AF6A0] to-[#2AF6A0]/70 rounded-full" style={{ width: '22%' }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[7px] text-white/20">Safe</span>
          <span className="text-[7px] text-white/20">Moderate</span>
          <span className="text-[7px] text-white/20">Risky</span>
        </div>
      </div>

      {/* Analysis Points To */}
      <div className="rounded-xl border border-[#2AF6A0]/20 bg-gradient-to-r from-[#2AF6A0]/5 to-transparent p-3">
        <div className="text-[9px] text-white/40 uppercase mb-0.5">Analysis Points To</div>
        <div className="text-sm font-bold text-white">Boston Celtics</div>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <span className="text-[8px] text-white/40">Signal</span>
            <span className="text-[10px] font-bold text-[#2AF6A0]">Strong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-white/40">Edge</span>
            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#2AF6A0] rounded-full" style={{ width: '50%' }} />
            </div>
            <span className="text-[10px] font-bold text-[#2AF6A0]">5.0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────── Slide 3: Predicted Score + Spread + O/U ─────── */
function SlidePredictedScore() {
  return (
    <div className="px-3 pt-2 pb-3 flex flex-col justify-between h-full">
      <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Predicted Score</div>

      {/* Score rings */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center">
          <div className="relative w-[80px] h-[80px]">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="33" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="3" />
              <circle cx="40" cy="40" r="33" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${0.52 * 2 * Math.PI * 33} ${2 * Math.PI * 33}`}
                style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[24px] font-bold text-white">112</span>
            </div>
          </div>
          <span className="text-[9px] text-green-400 mt-1 font-medium">BOS</span>
        </div>

        <div className="w-7 h-7 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <span className="text-[9px] text-white/30 font-medium">vs</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-[80px] h-[80px]">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="33" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="3" />
              <circle cx="40" cy="40" r="33" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${0.48 * 2 * Math.PI * 33} ${2 * Math.PI * 33}`}
                style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.5))' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[24px] font-bold text-white">105</span>
            </div>
          </div>
          <span className="text-[9px] text-purple-400 mt-1 font-medium">LAL</span>
        </div>
      </div>

      {/* Total Points pill */}
      <div className="flex justify-center">
        <span className="text-[9px] px-2.5 py-1 rounded-full bg-white/[0.05] text-white/50 border border-white/[0.06]">
          Projected Total: <span className="text-white font-semibold">217 pts</span>
        </span>
      </div>

      {/* Spread vs Our Model */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0b] p-3 text-center">
          <div className="text-[8px] text-white/30 uppercase">Market Spread</div>
          <div className="text-lg font-bold text-white mt-0.5">BOS -5.5</div>
        </div>
        <div className="rounded-xl border border-[#2AF6A0]/20 bg-[#2AF6A0]/5 p-3 text-center">
          <div className="text-[8px] text-[#2AF6A0]/60 uppercase">Our Model</div>
          <div className="text-lg font-bold text-[#2AF6A0] mt-0.5">BOS -7</div>
        </div>
      </div>

      {/* Over/Under */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0b] p-3 text-center">
          <div className="text-[9px] text-white/40 uppercase">Over 217.5</div>
          <div className="text-[18px] font-bold text-white mt-0.5">1.91</div>
          <div className="text-[8px] text-white/30 mt-0.5">52.4% implied</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0b] p-3 text-center">
          <div className="text-[9px] text-white/40 uppercase">Under 217.5</div>
          <div className="text-[18px] font-bold text-white mt-0.5">1.91</div>
          <div className="text-[8px] text-white/30 mt-0.5">52.4% implied</div>
        </div>
      </div>
    </div>
  );
}

/* ─────── Slide 4: Best Odds + Bookmaker Table (NBA moneyline) ─────── */
function SlideOddsTable() {
  const bestOdds = [
    { label: 'BOS', odds: '1.65', pct: '60.6%' },
    { label: 'LAL', odds: '2.35', pct: '42.6%' },
  ];
  const bookmakers: { name: string; home: string; away: string; bestCol: 'home' | 'away' | null }[] = [
    { name: 'DraftKings', home: '1.65', away: '2.30', bestCol: 'home' },
    { name: 'FanDuel', home: '1.63', away: '2.35', bestCol: 'away' },
    { name: 'BetMGM', home: '1.61', away: '2.30', bestCol: null },
    { name: 'Caesars', home: '1.62', away: '2.32', bestCol: null },
    { name: 'PointsBet', home: '1.64', away: '2.28', bestCol: null },
    { name: 'BetRivers', home: '1.60', away: '2.33', bestCol: null },
    { name: 'Bet365', home: '1.63', away: '2.30', bestCol: null },
    { name: 'Unibet', home: '1.62', away: '2.25', bestCol: null },
  ];
  return (
    <div className="px-3 pt-2 pb-3 flex flex-col justify-between h-full">
      {/* Best Odds highlight */}
      <div className="rounded-xl border border-[#2AF6A0]/20 bg-[#2AF6A0]/5 p-3">
        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-semibold">Best Odds</div>
        <div className="grid grid-cols-2 gap-4">
          {bestOdds.map((b) => (
            <div key={b.label} className="text-center">
              <div className="text-[8px] text-white/40">{b.label}</div>
              <div className="text-[15px] font-bold text-[#2AF6A0]">{b.odds}</div>
              <div className="text-[7px] text-white/30">{b.pct}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sort by tabs */}
      <div className="flex gap-1">
        {['Name', 'BOS', 'LAL'].map((tab, i) => (
          <button key={tab} className={`text-[8px] px-2.5 py-0.5 rounded-full font-medium transition-colors ${i === 0 ? 'bg-[#2AF6A0]/10 text-[#2AF6A0]' : 'bg-white/5 text-white/30'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Bookmaker table — 3 columns (no draw in NBA) */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-3 bg-white/[0.03] px-2.5 py-1.5 border-b border-white/[0.06]">
          <span className="text-[8px] text-white/30 font-medium">Bookmaker</span>
          <span className="text-[8px] text-white/30 font-medium text-center">BOS</span>
          <span className="text-[8px] text-white/30 font-medium text-center">LAL</span>
        </div>
        {bookmakers.map((bm, idx) => (
          <div key={bm.name} className={`grid grid-cols-3 px-2.5 py-1.5 items-center ${idx < bookmakers.length - 1 ? 'border-b border-white/[0.03]' : ''}`}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
              <span className="text-[8px] text-white/60 truncate">{bm.name}</span>
            </div>
            <span className={`text-[9px] font-medium text-center ${bm.bestCol === 'home' ? 'text-[#2AF6A0] font-bold' : 'text-white/70'}`}>{bm.home}</span>
            <span className={`text-[9px] font-medium text-center ${bm.bestCol === 'away' ? 'text-[#2AF6A0] font-bold' : 'text-white/70'}`}>{bm.away}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────── MAIN: Phone Mockup (bigger, fullscreen content) ─────── */
const slides = [SlideOddsCards, SlideProbAndForm, SlidePredictedScore, SlideOddsTable];

export default function HeroProductMockup() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-[380px] sm:w-[420px] mx-auto select-none">
      {/* Glow */}
      <div className="absolute -inset-10 bg-[#2AF6A0]/5 rounded-[80px] blur-3xl pointer-events-none" />

      {/* Phone frame */}
      <div className="relative bg-[#111] rounded-[48px] sm:rounded-[54px] p-[10px] sm:p-[12px] shadow-2xl shadow-black/60 border border-white/[0.08]">
        {/* Screen — flex column, fixed height matching real iPhone proportions */}
        <div className="relative bg-black rounded-[40px] sm:rounded-[44px] overflow-hidden flex flex-col h-[680px] sm:h-[740px]">

          {/* Status bar */}
          <div className="relative z-20 flex-shrink-0 flex items-center justify-between px-7 pt-3.5 pb-1">
            <span className="text-[12px] font-semibold text-white/90">9:41</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-[15px] h-[11px] text-white/80" fill="currentColor" viewBox="0 0 18 12"><path d="M1 3.5h1v5H1zM4 2.5h1v6H4zM7 1.5h1v8H7zM10 .5h1v10h-1z" /><path d="M13.5 3a3.5 3.5 0 013.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
              <svg className="w-[22px] h-[11px] text-white/80" fill="currentColor" viewBox="0 0 25 12"><rect x="0" y="1" width="21" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1" /><rect x="22" y="4" width="2" height="4" rx="0.5" /><rect x="2" y="3" width="14" height="6" rx="1" /></svg>
            </div>
          </div>

          {/* Dynamic Island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-[100px] h-[28px] bg-black rounded-full" />

          {/* Match header bar — expanded with records & logos */}
          <div className="relative z-10 flex-shrink-0 mx-3 mt-1 mb-0.5 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] px-4 py-5">
            <div className="flex items-center justify-between">
              {/* Home team — Celtics */}
              <div className="flex flex-col items-center gap-1.5">
                <img
                  src="/images/logos/nba/bos.webp"
                  alt="Boston Celtics"
                  className="w-12 h-12 object-contain"
                  width={48}
                  height={48}
                  draggable={false}
                />
                <span className="text-[13px] font-bold text-white tracking-wide">BOS</span>
                <span className="text-[9px] text-white/30">38-12</span>
              </div>

              {/* Center info */}
              <div className="flex flex-col items-center gap-1">
                <img
                  src="/images/logos/nba/nba.webp"
                  alt="NBA"
                  className="w-8 h-8 object-contain"
                  width={32}
                  height={32}
                  draggable={false}
                />
                <span className="text-[14px] font-bold text-white/70">7:30 PM</span>
                <span className="text-[8px] text-white/20">TD Garden, Boston</span>
              </div>

              {/* Away team — Lakers */}
              <div className="flex flex-col items-center gap-1.5">
                <img
                  src="/images/logos/nba/lal.webp"
                  alt="LA Lakers"
                  className="w-12 h-12 object-contain"
                  width={48}
                  height={48}
                  draggable={false}
                />
                <span className="text-[13px] font-bold text-white tracking-wide">LAL</span>
                <span className="text-[9px] text-white/30">28-24</span>
              </div>
            </div>

            {/* Season series bar */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-white/25 uppercase tracking-wider">Season Series</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-green-400">BOS 3</span>
                  <span className="text-[8px] text-white/20">—</span>
                  <span className="text-[9px] font-bold text-purple-400">1 LAL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slide content - grows to fill ALL remaining space */}
          <div className="relative flex-1 min-h-0">
            {slides.map((Slide, i) => (
              <div key={i} className={`absolute inset-0 transition-opacity duration-500 ${i === active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <Slide />
              </div>
            ))}
          </div>

          {/* Home indicator */}
          <div className="flex-shrink-0 flex justify-center py-2">
            <div className="w-[130px] h-[4px] rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
