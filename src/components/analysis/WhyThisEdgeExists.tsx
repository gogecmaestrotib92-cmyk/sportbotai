/**
 * "Why This Edge Exists" — Premium Visual Analysis Block
 * 
 * Merges what were previously 3 separate sections:
 * - Match Snapshot (THE EDGE, MARKET MISS, THE PATTERN, THE RISK)
 * - Game Flow narrative
 * - Risk Factors list
 * 
 * Premium SVG visuals:
 * - EdgeStrengthBar — Animated bar showing edge magnitude with glow
 * - FormComparisonBars — Side-by-side form rating bars parsed from text
 * - H2HDominanceArc — SVG arc showing H2H win ratio
 * - Animated accent borders and pulse indicators
 * 
 * Design: Apple Health / Linear aesthetic. Dark mode native.
 */

'use client';

import { useState, useEffect } from 'react';
import PremiumIcon from '@/components/ui/PremiumIcon';

// ─── Translations ───────────────────────────────────────────

const translations = {
  en: {
    title: 'Why This Edge Exists',
    subtitle: 'Form + injuries + patterns → one conclusion',
    edgeLabel: 'THE EDGE',
    marketMissLabel: 'MARKET MISS',
    patternLabel: 'THE PATTERN',
    howItUnfolds: 'How It Unfolds',
    whatCouldGoWrong: 'What Could Go Wrong',
    riskCount: (n: number) => `${n} risk factor${n !== 1 ? 's' : ''}`,
    showMore: 'Show full analysis',
    showLess: 'Collapse',
    proOnly: 'PRO',
    upgradeToSee: 'Upgrade to Pro to see edge reasoning',
  },
  sr: {
    title: 'Zašto Postoji Ova Prednost',
    subtitle: 'Forma + povrede + obrasci → jedan zaključak',
    edgeLabel: 'PREDNOST',
    marketMissLabel: 'TRŽIŠNI PROPUST',
    patternLabel: 'OBRAZAC',
    howItUnfolds: 'Kako Se Odvija',
    whatCouldGoWrong: 'Šta Može Poći Po Zlu',
    riskCount: (n: number) => `${n} faktor${n !== 1 ? 'a' : ''} rizika`,
    showMore: 'Prikaži celu analizu',
    showLess: 'Skupi',
    proOnly: 'PRO',
    upgradeToSee: 'Nadogradi na Pro za obrazloženje prednosti',
  },
} as const;

// ─── SVG Visual Components ──────────────────────────────────

/** Extracts a percentage like "+2.5%" or "3.1%" from text */
function extractEdgePercent(text: string): number | null {
  const match = text.match(/[+-]?\d+\.?\d*\s*%/);
  if (match) {
    return Math.abs(parseFloat(match[0]));
  }
  return null;
}

/** Extracts form ratings like "40/100" from text, returns [home, away] */
function extractFormRatings(text: string): [number, number] | null {
  const matches = text.match(/(\d{1,3})\/100/g);
  if (matches && matches.length >= 2) {
    return [parseInt(matches[0]), parseInt(matches[1])];
  }
  return null;
}

/** Extracts H2H record like "6-4-0" from text, returns [wins, draws, losses] */
function extractH2HRecord(text: string): [number, number, number] | null {
  const match = text.match(/(\d+)-(\d+)-(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  return null;
}

/** Extracts a "X-point" gap from text */
function extractPointGap(text: string): number | null {
  const match = text.match(/(\d+)[- ]point/i);
  if (match) return parseInt(match[1]);
  return null;
}

// ─── EdgeStrengthBar — Animated bar showing edge magnitude ──

function EdgeStrengthBar({ percent }: { percent: number }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(Math.min(percent * 8, 100)), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  // Color based on edge size
  const isStrong = percent >= 3;
  const isMedium = percent >= 1.5;
  const color = isStrong ? '#2AF6A0' : isMedium ? '#34d399' : '#6ee7b7';
  const glowColor = isStrong ? 'rgba(42,246,160,0.4)' : 'rgba(52,211,153,0.2)';

  return (
    <div className="mt-2.5 mb-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Edge Strength</span>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          +{percent.toFixed(1)}%
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${animatedWidth}%`,
            background: `linear-gradient(90deg, ${color}33, ${color})`,
            boxShadow: `0 0 12px ${glowColor}`,
          }}
        />
        {/* Shimmer overlay */}
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
          style={{ width: `${animatedWidth}%` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
              animation: 'shimmer 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>
      {/* Edge quality label */}
      <div className="flex justify-end mt-1">
        <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{
          color,
          backgroundColor: `${color}11`,
          borderColor: `${color}22`,
        }}>
          {isStrong ? 'Strong Edge' : isMedium ? 'Moderate Edge' : 'Thin Edge'}
        </span>
      </div>
    </div>
  );
}

// ─── FormComparisonBars — Two bars comparing form ratings ───

function FormComparisonBars({ ratings, text }: { ratings: [number, number]; text: string }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Extract team names from text before the ratings  
  const parts = text.split(/\d+\/100/);
  const teamA = parts[0]?.replace(/[.,]?\s*$/, '').split(/\s+/).slice(-1)[0] || 'Home';
  const teamB = parts[1]?.replace(/^\s*vs\.?\s*/i, '').split(/\s+/)[0]?.replace(/'s$/i, '') || 'Away';

  const [ratingA, ratingB] = ratings;
  const leader = ratingA > ratingB ? 'A' : ratingA < ratingB ? 'B' : 'tie';
  const diff = Math.abs(ratingA - ratingB);

  return (
    <div className="mt-2.5 mb-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Form Rating</span>
        <span className="text-[10px] text-zinc-500">
          {diff > 0 ? `${diff}-point gap` : 'Even'}
        </span>
      </div>
      <div className="space-y-2">
        {/* Team A */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-zinc-400 w-16 truncate text-right">{teamA}</span>
          <div className="flex-1 relative h-3 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: animated ? `${ratingA}%` : '0%',
                background: leader === 'A'
                  ? 'linear-gradient(90deg, rgba(59,130,246,0.3), rgba(59,130,246,0.8))'
                  : 'linear-gradient(90deg, rgba(161,161,170,0.2), rgba(161,161,170,0.5))',
                boxShadow: leader === 'A' ? '0 0 8px rgba(59,130,246,0.3)' : 'none',
              }}
            />
          </div>
          <span className={`text-xs font-mono font-bold w-8 text-right ${leader === 'A' ? 'text-blue-400' : 'text-zinc-500'}`}>
            {ratingA}
          </span>
        </div>
        {/* Team B */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-zinc-400 w-16 truncate text-right">{teamB}</span>
          <div className="flex-1 relative h-3 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: animated ? `${ratingB}%` : '0%',
                background: leader === 'B'
                  ? 'linear-gradient(90deg, rgba(244,63,94,0.3), rgba(244,63,94,0.8))'
                  : 'linear-gradient(90deg, rgba(161,161,170,0.2), rgba(161,161,170,0.5))',
                boxShadow: leader === 'B' ? '0 0 8px rgba(244,63,94,0.3)' : 'none',
              }}
            />
          </div>
          <span className={`text-xs font-mono font-bold w-8 text-right ${leader === 'B' ? 'text-rose-400' : 'text-zinc-500'}`}>
            {ratingB}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── H2HDominanceArc — SVG arc showing H2H dominance ────────

function H2HDominanceArc({ record }: { record: [number, number, number] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const [wins, draws, losses] = record;
  const total = wins + draws + losses;
  if (total === 0) return null;

  const winPct = (wins / total) * 100;
  const drawPct = (draws / total) * 100;
  // Arc parameters
  const size = 52;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const winArc = (winPct / 100) * circumference;
  const drawArc = (drawPct / 100) * circumference;

  const dominant = wins > losses ? 'leading' : wins < losses ? 'trailing' : 'even';
  const dominantColor = dominant === 'leading' ? '#3b82f6' : dominant === 'trailing' ? '#f43f5e' : '#a1a1aa';

  return (
    <div className="mt-2.5 mb-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">H2H Record</span>
        <span className="text-[10px] text-zinc-500">Last {total} meetings</span>
      </div>
      <div className="flex items-center gap-4">
        {/* Arc SVG */}
        <svg width={size} height={size / 2 + 4} viewBox={`0 0 ${size} ${size / 2 + 4}`} className="flex-shrink-0">
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Win arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${animated ? winArc : 0} ${circumference}`}
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
          {/* Draw arc (offset after wins) */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#a1a1aa"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`0 ${animated ? winArc : 0} ${animated ? drawArc : 0} ${circumference}`}
            style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
            opacity={0.5}
          />
        </svg>
        {/* Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-mono font-bold text-blue-400">{wins}W</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-xs font-mono text-zinc-500">{draws}D</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-mono text-rose-400">{losses}L</span>
          </div>
        </div>
        {/* Dominance badge */}
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full border" style={{
          color: dominantColor,
          backgroundColor: `${dominantColor}11`,
          borderColor: `${dominantColor}22`,
        }}>
          {dominant === 'leading' ? 'Dominant' : dominant === 'trailing' ? 'Underdog' : 'Even'}
        </span>
      </div>
    </div>
  );
}

// ─── MarketGapIndicator — Visual for form gap / market miss ─

function MarketGapIndicator({ gap }: { gap: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const severity = gap >= 10 ? 'high' : gap >= 5 ? 'medium' : 'low';
  const config = {
    high: { color: '#f59e0b', label: 'Significant Gap', width: 90 },
    medium: { color: '#3b82f6', label: 'Notable Gap', width: 60 },
    low: { color: '#6ee7b7', label: 'Marginal Gap', width: 35 },
  }[severity];

  return (
    <div className="mt-2.5 mb-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Market Gap</span>
        <span className="text-xs font-mono font-bold" style={{ color: config.color }}>
          {gap} pts
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: animated ? `${config.width}%` : '0%',
            background: `linear-gradient(90deg, ${config.color}33, ${config.color})`,
            boxShadow: `0 0 10px ${config.color}33`,
          }}
        />
      </div>
      <div className="flex justify-end mt-1">
        <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{
          color: config.color,
          backgroundColor: `${config.color}11`,
          borderColor: `${config.color}22`,
        }}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

// ─── SVG Icons for each bullet type ─────────────────────────

function EdgeBoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8.5 1L3 9h4.5l-1 6L13 7H8.5l1-6z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function MarketTargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PatternChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12l3.5-4 3 2.5L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14" cy="4" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

// ─── Types ──────────────────────────────────────────────────

interface EdgeFactors {
  formContribution: number;
  winRateContribution: number;
  goalDiffContribution: number;
  h2hContribution: number;
  homeAdvContribution: number;
  dominant: string;
}

interface PipelineSignals {
  display: {
    form: {
      home: string;
      away: string;
      homeRating: number;
      awayRating: number;
      trend: string;
      label: string;
    };
    edge: {
      direction: 'home' | 'away' | 'even';
      percentage: number;
      label: string;
      factors?: EdgeFactors;
    };
    tempo: {
      level: string;
      label: string;
      avgGoals: number;
    };
    efficiency: {
      winner: string;
      aspect: string | null;
      label: string;
      homeOffense: number;
      awayOffense: number;
      homeDefense: number;
      awayDefense: number;
    };
    availability: {
      level: string;
      note: string | null;
      label: string;
      homeInjuries?: Array<{ player: string; position?: string; reason?: string }>;
      awayInjuries?: Array<{ player: string; position?: string; reason?: string }>;
    };
  };
  confidence: string;
  clarity_score: number;
}

interface WhyThisEdgeExistsProps {
  /** 4 snapshot bullets from AI (fallback if no pipeline signals) */
  snapshot: string[];
  /** Game flow narrative — how the match unfolds */
  gameFlow?: string;
  /** Risk factors — what could invalidate the thesis */
  riskFactors?: string[];
  /** Can the user see exact numbers? (PRO/PREMIUM only) */
  canSeeExactNumbers: boolean;
  /** Locale for i18n */
  locale?: 'en' | 'sr';
  /** Pipeline signals for deterministic bullet generation */
  universalSignals?: PipelineSignals;
  /** Team names for AIXBT copy */
  homeTeam?: string;
  awayTeam?: string;
}

// ─── Deterministic AIXBT Bullet Generator ───────────────────
// Generates sharp, data-backed bullets from pipeline signals.
// No AI hallucination — every number comes from the computed pipeline.

function generatePipelineBullets(
  signals: PipelineSignals,
  homeTeam: string,
  awayTeam: string,
  locale: 'en' | 'sr'
): string[] {
  const { display } = signals;
  const factors = display.edge.factors;
  const edgePct = display.edge.percentage;
  const edgeDir = display.edge.direction;
  const favoredTeam = edgeDir === 'home' ? homeTeam : edgeDir === 'away' ? awayTeam : null;
  const underdog = edgeDir === 'home' ? awayTeam : edgeDir === 'away' ? homeTeam : null;
  const homeRating = display.form.homeRating;
  const awayRating = display.form.awayRating;
  const formGap = Math.abs(homeRating - awayRating);
  const betterFormTeam = homeRating > awayRating ? homeTeam : awayTeam;

  const bullets: string[] = [];

  // ── BULLET 1: THE EDGE — Primary driver with edge % ──
  if (favoredTeam && edgePct > 0 && factors) {
    // Sort factors by absolute contribution to find the top 2 drivers
    const sortedFactors = [
      { name: 'form', val: Math.abs(factors.formContribution), raw: factors.formContribution },
      { name: 'winRate', val: Math.abs(factors.winRateContribution), raw: factors.winRateContribution },
      { name: 'goalDiff', val: Math.abs(factors.goalDiffContribution), raw: factors.goalDiffContribution },
      { name: 'h2h', val: Math.abs(factors.h2hContribution), raw: factors.h2hContribution },
      { name: 'homeAdv', val: Math.abs(factors.homeAdvContribution), raw: factors.homeAdvContribution },
    ].sort((a, b) => b.val - a.val);

    const top = sortedFactors[0];
    const second = sortedFactors[1];

    const driverText = locale === 'sr'
      ? getDriverTextSr(top.name, display, homeTeam, awayTeam, formGap, betterFormTeam)
      : getDriverTextEn(top.name, display, homeTeam, awayTeam, formGap, betterFormTeam);

    const secondDriverText = second.val > 1
      ? (locale === 'sr'
          ? getSecondDriverSr(second.name)
          : getSecondDriverEn(second.name))
      : '';

    bullets.push(
      `THE EDGE: ${favoredTeam} +${edgePct}%. ${driverText}${secondDriverText}`
    );
  } else {
    // Even edge
    bullets.push(
      locale === 'sr'
        ? `THE EDGE: Ravnomerno. Forma ${homeRating}/100 vs ${awayRating}/100. Pipeline ne vidi jasnu prednost.`
        : `THE EDGE: Even. Form ${homeRating}/100 vs ${awayRating}/100. Pipeline sees no clear lean.`
    );
  }

  // ── BULLET 2: MARKET MISS — Efficiency or form data the market undervalues ──
  const { efficiency } = display;
  if (efficiency.homeOffense > 0 || efficiency.awayOffense > 0) {
    const betterAttack = efficiency.homeOffense > efficiency.awayOffense ? homeTeam : awayTeam;
    const betterDefense = efficiency.homeDefense < efficiency.awayDefense ? homeTeam : awayTeam;
    const offDiff = Math.abs(efficiency.homeOffense - efficiency.awayOffense);
    const defDiff = Math.abs(efficiency.homeDefense - efficiency.awayDefense);

    if (formGap >= 10 && favoredTeam) {
      bullets.push(
        locale === 'sr'
          ? `MARKET MISS: ${betterFormTeam} forma ${Math.max(homeRating, awayRating)}/100 vs ${Math.min(homeRating, awayRating)}/100. ${formGap}-poeni razlike koje tržište potcenjuje.`
          : `MARKET MISS: ${betterFormTeam} form at ${Math.max(homeRating, awayRating)}/100 vs ${Math.min(homeRating, awayRating)}/100. ${formGap}-point form gap the market is underpricing.`
      );
    } else if (offDiff > 0.3) {
      bullets.push(
        locale === 'sr'
          ? `MARKET MISS: ${betterAttack} postiže ${Math.max(efficiency.homeOffense, efficiency.awayOffense).toFixed(1)}/meč vs ${Math.min(efficiency.homeOffense, efficiency.awayOffense).toFixed(1)}. Napadačka razlika od ${offDiff.toFixed(1)} po utakmici.`
          : `MARKET MISS: ${betterAttack} scoring ${Math.max(efficiency.homeOffense, efficiency.awayOffense).toFixed(1)}/game vs ${Math.min(efficiency.homeOffense, efficiency.awayOffense).toFixed(1)}. ${offDiff.toFixed(1)} offensive gap per game.`
      );
    } else if (defDiff > 0.3) {
      bullets.push(
        locale === 'sr'
          ? `MARKET MISS: ${betterDefense} prima ${Math.min(efficiency.homeDefense, efficiency.awayDefense).toFixed(1)}/meč vs ${Math.max(efficiency.homeDefense, efficiency.awayDefense).toFixed(1)}. Defanzivna razlika favorizuje ${betterDefense}.`
          : `MARKET MISS: ${betterDefense} conceding ${Math.min(efficiency.homeDefense, efficiency.awayDefense).toFixed(1)}/game vs ${Math.max(efficiency.homeDefense, efficiency.awayDefense).toFixed(1)}. Defensive split favors ${betterDefense}.`
      );
    } else {
      bullets.push(
        locale === 'sr'
          ? `MARKET MISS: Efikasnost ujednačena — napad ${efficiency.homeOffense.toFixed(1)} vs ${efficiency.awayOffense.toFixed(1)}, odbrana ${efficiency.homeDefense.toFixed(1)} vs ${efficiency.awayDefense.toFixed(1)}. Margine su tanke.`
          : `MARKET MISS: Efficiency balanced — offense ${efficiency.homeOffense.toFixed(1)} vs ${efficiency.awayOffense.toFixed(1)}, defense ${efficiency.homeDefense.toFixed(1)} vs ${efficiency.awayDefense.toFixed(1)}. Margins are thin.`
      );
    }
  }

  // ── BULLET 3: THE PATTERN — Tempo + scoring context ──
  const { tempo } = display;
  const tempoLabel = tempo.level === 'high' 
    ? (locale === 'sr' ? 'Brz' : 'High-scoring')
    : tempo.level === 'low' 
      ? (locale === 'sr' ? 'Spor' : 'Low-scoring')
      : (locale === 'sr' ? 'Srednji' : 'Average');

  if (tempo.avgGoals > 0) {
    // Build a scoring pattern narrative
    const totalOffense = efficiency.homeOffense + efficiency.awayOffense;
    const totalDefense = efficiency.homeDefense + efficiency.awayDefense;

    if (tempo.level === 'high') {
      bullets.push(
        locale === 'sr'
          ? `THE PATTERN: ${tempoLabel} tempo — ${tempo.avgGoals.toFixed(1)} golova po utakmici prosečno. Oba tima daju ${totalOffense.toFixed(1)} kombinovano. Očekujte otvorenu igru.`
          : `THE PATTERN: ${tempoLabel} tempo — ${tempo.avgGoals.toFixed(1)} avg per game. Combined scoring rate ${totalOffense.toFixed(1)}/game. Expect an open contest.`
      );
    } else if (tempo.level === 'low') {
      bullets.push(
        locale === 'sr'
          ? `THE PATTERN: ${tempoLabel} tempo — ${tempo.avgGoals.toFixed(1)} golova prosečno. Odbrane primaju ${totalDefense.toFixed(1)} kombinovano. Kontrolisana igra.`
          : `THE PATTERN: ${tempoLabel} tempo — ${tempo.avgGoals.toFixed(1)} avg per game. Defenses conceding ${totalDefense.toFixed(1)} combined. Controlled affair.`
      );
    } else {
      bullets.push(
        locale === 'sr'
          ? `THE PATTERN: ${tempoLabel} tempo — ${tempo.avgGoals.toFixed(1)} golova prosečno. Napad ${totalOffense.toFixed(1)} vs odbrana ${totalDefense.toFixed(1)} po meču.`
          : `THE PATTERN: ${tempoLabel} tempo — ${tempo.avgGoals.toFixed(1)} avg per game. Offense ${totalOffense.toFixed(1)} vs defense ${totalDefense.toFixed(1)} per match.`
      );
    }
  }

  // ── BULLET 4: THE RISK — Biggest uncertainty ──
  const { availability } = display;
  const clarityScore = signals.clarity_score;

  if (availability.level === 'high' || availability.level === 'critical') {
    const totalInjuries = (availability.homeInjuries?.length || 0) + (availability.awayInjuries?.length || 0);
    bullets.push(
      locale === 'sr'
        ? `THE RISK: Dostupnost na ${availability.level === 'critical' ? 'kritičnom' : 'visokom'} nivou — ${totalInjuries} odsutnih igrača. Ovo može promeniti smer prednosti.`
        : `THE RISK: Availability at ${availability.level} — ${totalInjuries} absences flagged. This could flip the form advantage.`
    );
  } else if (clarityScore < 55) {
    bullets.push(
      locale === 'sr'
        ? `THE RISK: Pouzdanost podataka ${clarityScore}%. Manji uzorak ili nedostatak podataka. Prilagodite veličinu uloga.`
        : `THE RISK: Data clarity at ${clarityScore}%. Limited sample or data gaps. Size your position accordingly.`
    );
  } else if (formGap < 10 && edgePct < 3) {
    bullets.push(
      locale === 'sr'
        ? `THE RISK: Tanka prednost — samo ${edgePct}% sa razlikom forme od ${formGap} poena. Margine su male, ovo može da se prevrne u oba smera.`
        : `THE RISK: Thin edge — ${edgePct}% with ${formGap}-point form gap. Margins are razor-thin. This one could swing either way.`
    );
  } else {
    bullets.push(
      locale === 'sr'
        ? `THE RISK: Standardna pouzdanost (${clarityScore}% jasnoća). Nemamo veliki upozoravajući signal, ali reversion-to-mean je uvek u igri.`
        : `THE RISK: Standard confidence (${clarityScore}% clarity). No major red flag, but mean reversion is always in play.`
    );
  }

  return bullets;
}

// ── Helper: Driver text for THE EDGE bullet ──

function getDriverTextEn(
  factor: string,
  display: PipelineSignals['display'],
  homeTeam: string,
  awayTeam: string,
  formGap: number,
  betterFormTeam: string
): string {
  switch (factor) {
    case 'form':
      return `Form gap is ${formGap} points (${display.form.homeRating}/100 vs ${display.form.awayRating}/100). The trend is the signal.`;
    case 'winRate':
      return `Win rate differential is the driver. ${betterFormTeam} converting at a higher clip.`;
    case 'goalDiff':
      return `Scoring differential leads. ${display.efficiency.homeOffense.toFixed(1)} vs ${display.efficiency.awayOffense.toFixed(1)} per game. The numbers don't lie.`;
    case 'h2h':
      return `Head-to-head record is the backbone. Historical dominance carries weight.`;
    case 'homeAdv':
      return `Home advantage is the tilt. ${homeTeam} at home is a different proposition.`;
    default:
      return `Multiple factors align. Form ${display.form.homeRating}/100 vs ${display.form.awayRating}/100.`;
  }
}

function getDriverTextSr(
  factor: string,
  display: PipelineSignals['display'],
  homeTeam: string,
  awayTeam: string,
  formGap: number,
  betterFormTeam: string
): string {
  switch (factor) {
    case 'form':
      return `Razlika u formi ${formGap} poena (${display.form.homeRating}/100 vs ${display.form.awayRating}/100). Trend je signal.`;
    case 'winRate':
      return `Razlika u procentu pobeda je ključna. ${betterFormTeam} pobeđuje češće.`;
    case 'goalDiff':
      return `Gol razlika vodi. ${display.efficiency.homeOffense.toFixed(1)} vs ${display.efficiency.awayOffense.toFixed(1)} po meču. Brojevi ne lažu.`;
    case 'h2h':
      return `Međusobni rezultat je osnova. Istorijska dominacija ima težinu.`;
    case 'homeAdv':
      return `Domaći teren je prevaga. ${homeTeam} kod kuće je drugačiji tim.`;
    default:
      return `Više faktora se poklapa. Forma ${display.form.homeRating}/100 vs ${display.form.awayRating}/100.`;
  }
}

function getSecondDriverEn(factor: string): string {
  switch (factor) {
    case 'form': return ' Form trend backs it up.';
    case 'winRate': return ' Win rate confirms.';
    case 'goalDiff': return ' Goal differential adds weight.';
    case 'h2h': return ' H2H history agrees.';
    case 'homeAdv': return ' Home advantage compounds.';
    default: return '';
  }
}

function getSecondDriverSr(factor: string): string {
  switch (factor) {
    case 'form': return ' Trend forme to potvrđuje.';
    case 'winRate': return ' Procenat pobeda potvrđuje.';
    case 'goalDiff': return ' Gol razlika dodaje težinu.';
    case 'h2h': return ' Međusobni skor se slaže.';
    case 'homeAdv': return ' Domaći teren pojačava.';
    default: return '';
  }
}

// ─── Bullet Parsing ─────────────────────────────────────────

interface ParsedBullet {
  type: 'edge' | 'market-miss' | 'pattern' | 'risk' | 'insight';
  label: string;
  text: string;
  color: string;
  textColor: string;
  accentHex: string;
  bgColor: string;
  borderColor: string;
  iconName: 'bolt' | 'target' | 'chart' | 'medical' | 'lightbulb';
}

function parseBullet(raw: string, index: number, locale: 'en' | 'sr'): ParsedBullet {
  const t = translations[locale];
  const lower = raw.toLowerCase();

  const stripLabel = (text: string) =>
    text.replace(/^(THE EDGE|MARKET MISS|THE PATTERN|THE RISK|PREDNOST|TRŽIŠNI PROPUST|OBRAZAC):\s*/i, '');

  if (lower.includes('the edge:') || lower.includes('prednost:') || index === 0) {
    return {
      type: 'edge', label: t.edgeLabel, text: stripLabel(raw),
      color: 'text-emerald-400', textColor: 'text-emerald-400', accentHex: '#2AF6A0',
      bgColor: 'bg-emerald-500/[0.06]', borderColor: 'border-emerald-500/20',
      iconName: 'bolt',
    };
  }
  if (lower.includes('market miss:') || lower.includes('tržišni propust:') || index === 1) {
    return {
      type: 'market-miss', label: t.marketMissLabel, text: stripLabel(raw),
      color: 'text-blue-400', textColor: 'text-blue-400', accentHex: '#3b82f6',
      bgColor: 'bg-blue-500/[0.06]', borderColor: 'border-blue-500/20',
      iconName: 'target',
    };
  }
  if (lower.includes('the pattern:') || lower.includes('obrazac:') || index === 2) {
    return {
      type: 'pattern', label: t.patternLabel, text: stripLabel(raw),
      color: 'text-violet-400', textColor: 'text-violet-400', accentHex: '#8b5cf6',
      bgColor: 'bg-violet-500/[0.06]', borderColor: 'border-violet-500/20',
      iconName: 'chart',
    };
  }
  if (lower.includes('the risk:') || index === 3) {
    return {
      type: 'risk', label: '', text: stripLabel(raw),
      color: 'text-amber-400', textColor: 'text-amber-400', accentHex: '#f59e0b',
      bgColor: 'bg-amber-500/[0.06]', borderColor: 'border-amber-500/20',
      iconName: 'medical',
    };
  }

  return {
    type: 'insight', label: 'INSIGHT', text: raw,
    color: 'text-zinc-400', textColor: 'text-zinc-400', accentHex: '#71717a',
    bgColor: 'bg-zinc-500/[0.06]', borderColor: 'border-zinc-500/20',
    iconName: 'lightbulb',
  };
}

// ─── Bullet Card with SVG visuals ───────────────────────────

function BulletCard({ bullet }: { bullet: ParsedBullet }) {
  // Parse data from text for visual components
  const edgePercent = bullet.type === 'edge' ? extractEdgePercent(bullet.text) : null;
  const formRatings = bullet.type === 'edge' ? extractFormRatings(bullet.text) : null;
  const h2hRecord = bullet.type === 'pattern' ? extractH2HRecord(bullet.text) : null;
  const pointGap = bullet.type === 'market-miss' ? extractPointGap(bullet.text) : null;

  const IconComponent = bullet.type === 'edge' ? EdgeBoltIcon
    : bullet.type === 'market-miss' ? MarketTargetIcon
    : bullet.type === 'pattern' ? PatternChartIcon
    : null;

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: `linear-gradient(135deg, ${bullet.accentHex}08, ${bullet.accentHex}04, transparent)`,
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{
          background: `linear-gradient(180deg, ${bullet.accentHex}, ${bullet.accentHex}44)`,
          boxShadow: `0 0 8px ${bullet.accentHex}33`,
        }}
      />

      <div className="pl-4 pr-3.5 py-3.5">
        {/* Label row with icon */}
        <div className="flex items-center gap-2 mb-2">
          {/* Icon circle */}
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: `${bullet.accentHex}15`,
              border: `1px solid ${bullet.accentHex}22`,
            }}
          >
            {IconComponent ? (
              <span style={{ color: bullet.accentHex }}><IconComponent /></span>
            ) : (
              <PremiumIcon name={bullet.iconName} size="sm" className={bullet.color} />
            )}
          </div>
          {/* Label with pulse dot */}
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: bullet.accentHex }}
            />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: bullet.accentHex }}
            >
              {bullet.label}
            </span>
          </div>
        </div>

        {/* Text content */}
        <p className="text-[14px] text-stone-200/90 leading-relaxed ml-8">
          {bullet.text}
        </p>

        {/* Visual data extraction — only if data was parseable */}
        <div className="ml-8">
          {edgePercent !== null && <EdgeStrengthBar percent={edgePercent} />}
          {formRatings !== null && <FormComparisonBars ratings={formRatings} text={bullet.text} />}
          {h2hRecord !== null && <H2HDominanceArc record={h2hRecord} />}
          {pointGap !== null && <MarketGapIndicator gap={pointGap} />}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function WhyThisEdgeExists({
  snapshot,
  gameFlow,
  riskFactors = [],
  canSeeExactNumbers,
  locale = 'en',
  universalSignals,
  homeTeam,
  awayTeam,
}: WhyThisEdgeExistsProps) {
  const t = translations[locale];
  const [expanded, setExpanded] = useState(false);

  // Prefer deterministic pipeline bullets over AI snapshot
  const pipelineBullets = (universalSignals?.display?.edge && homeTeam && awayTeam)
    ? generatePipelineBullets(universalSignals, homeTeam, awayTeam, locale)
    : null;

  const effectiveSnapshot = pipelineBullets || snapshot;

  if (!effectiveSnapshot || effectiveSnapshot.length === 0) return null;

  const bullets = effectiveSnapshot.map((s, i) => parseBullet(s, i, locale));
  const thesisBullets = bullets.filter(b => b.type !== 'risk');
  const riskBullet = bullets.find(b => b.type === 'risk');

  const allRisks: string[] = [];
  if (riskBullet) allRisks.push(riskBullet.text);
  riskFactors.forEach(rf => {
    if (!allRisks.some(existing => existing.toLowerCase().includes(rf.toLowerCase().slice(0, 30)))) {
      allRisks.push(rf);
    }
  });

  // ─── Locked State ───
  if (!canSeeExactNumbers) {
    return (
      <div className="mt-3 sm:mt-4 p-5 sm:p-6 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/10">
              <PremiumIcon name="lightbulb" size="md" className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{t.title}</h3>
              <p className="text-[10px] text-zinc-500">{t.subtitle}</p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet-500 to-violet-400 text-white rounded-full">
            {t.proOnly}
          </span>
        </div>
        {/* Blurred teaser */}
        <div className="space-y-3 blur-[6px] select-none pointer-events-none" aria-hidden="true">
          {thesisBullets.slice(0, 3).map((bullet, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden" style={{
              background: `linear-gradient(135deg, ${bullet.accentHex}08, transparent)`,
            }}>
              <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{
                background: bullet.accentHex,
              }} />
              <div className="pl-4 pr-3.5 py-3">
                <span className="text-[10px] font-bold uppercase" style={{ color: bullet.accentHex }}>
                  {bullet.label}
                </span>
                <p className="text-sm text-stone-300 mt-1 line-clamp-1">{bullet.text.slice(0, 40)}...</p>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent flex items-end justify-center pb-5">
          <p className="text-xs text-zinc-500">{t.upgradeToSee}</p>
        </div>
      </div>
    );
  }

  // ─── PRO View ───
  return (
    <div className="mt-3 sm:mt-4 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 pb-0">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/10">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-400">
              <path d="M8.5 1L3 9h4.5l-1 6L13 7H8.5l1-6z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{t.title}</h3>
            <p className="text-[10px] text-zinc-500">{t.subtitle}</p>
          </div>
          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet-500 to-violet-400 text-white rounded-full">
            {t.proOnly}
          </span>
        </div>

        {/* Thesis Bullets — Premium Cards with SVG visuals */}
        <div className="space-y-2.5">
          {thesisBullets.map((bullet, i) => (
            <BulletCard key={i} bullet={bullet} />
          ))}
        </div>
      </div>

      {/* Game Flow + Risks */}
      {(gameFlow || allRisks.length > 0) && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-4 py-2.5 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-white/[0.02]"
          >
            <span>{expanded ? t.showLess : t.showMore}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-4">
              {/* Game Flow */}
              {gameFlow && (
                <div className="relative rounded-xl overflow-hidden" style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent)',
                }}>
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-zinc-600/40" />
                  <div className="pl-4 pr-3.5 py-3.5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-5 h-5 rounded-md bg-white/[0.05] flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-zinc-500" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {t.howItUnfolds}
                      </span>
                    </div>
                    <p className="text-sm text-stone-300 leading-relaxed ml-7">
                      {gameFlow}
                    </p>
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {allRisks.length > 0 && (
                <div className="relative rounded-xl overflow-hidden" style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.04), transparent)',
                }}>
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{
                    background: 'linear-gradient(180deg, #f59e0b, #f59e0b44)',
                  }} />
                  <div className="pl-4 pr-3.5 py-3.5">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/15">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 3v3.5M6 8.5v.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M5.13 1.5L1.07 8.75a1 1 0 00.87 1.5h8.12a1 1 0 00.87-1.5L6.87 1.5a1 1 0 00-1.74 0z" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.4" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                          {t.whatCouldGoWrong}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400/60 border border-amber-500/15">
                        {t.riskCount(allRisks.length)}
                      </span>
                    </div>
                    <ul className="space-y-2 ml-7">
                      {allRisks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 flex-shrink-0" />
                          <span className="text-sm text-stone-300/90 leading-relaxed">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shimmer keyframe — injected inline */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
