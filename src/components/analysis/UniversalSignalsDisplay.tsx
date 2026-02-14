/**
 * Universal Signals Display V2 - Premium Visual UI
 * 
 * Clean, visual display of the 5 normalized signals.
 * Uses visual indicators instead of text-only presentation.
 * Works identically for ALL sports.
 */

'use client';

import { useState } from 'react';
import PremiumIcon from '@/components/ui/PremiumIcon';
import { UniversalSignals } from '@/lib/universal-signals';
import { InfoTooltip } from '@/components/ui/Tooltip';
import type { MarketIntel } from '@/lib/value-detection';
import {
  FormDots,
  EdgeBar,
  ConfidenceRing,
  TempoIndicator,
  AvailabilityDots,
  VerdictBadge,
} from './VisualSignals';

// i18n translations for signals
const signalTranslations = {
  en: {
    loadingSignals: 'Loading match signals...',
    form: 'Form',
    strengthEdge: 'Strength Edge',
    tempo: 'Tempo',
    efficiency: 'Efficiency',
    advantage: 'advantage',
    availabilityImpact: 'Availability Impact',
    players: 'players',
    out: 'Out',
    suspension: 'Suspended',
    doubtful: 'Doubtful',
    noInjuries: 'No injuries reported • Full squads expected',
    disclaimer: 'Signals calculated from recent performance. Not betting advice.',
    noData: 'No data available',
    edge: 'Edge',
    data: 'Data',
    rich: 'Rich',
    standard: 'Standard',
    limited: 'Limited',
    // Tooltips
    formTooltip: 'Last 5 results. Recent form predicts short-term performance better than season averages.',
    edgeTooltip: 'Probability gap between teams based on our model. Higher % = stronger advantage.',
    tempoTooltip: 'Expected game pace. High-tempo matches often produce more goals/points.',
    efficiencyTooltip: 'How well teams convert chances. The difference between good teams and great ones.',
    availabilityTooltip: 'Squad health impact. Key absences can shift outcomes by 10-20%.',
  },
  sr: {
    loadingSignals: 'Učitavamo signale meča...',
    form: 'Forma',
    strengthEdge: 'Prednost u Snazi',
    tempo: 'Tempo',
    efficiency: 'Efikasnost',
    advantage: 'prednost',
    availabilityImpact: 'Uticaj Raspoloživosti',
    players: 'igrača',
    out: 'Ne igra',
    suspension: 'Suspendovan',
    doubtful: 'Pod znakom pitanja',
    noInjuries: 'Nema prijavljenih povreda • Očekuju se kompletni timovi',
    disclaimer: 'Signali izračunati na osnovu nedavnih performansi. Nije savet za klađenje.',
    noData: 'Nema dostupnih podataka',
    edge: 'Prednost',
    data: 'Podaci',
    rich: 'Bogato',
    standard: 'Standardno',
    limited: 'Ograničeno',
    // Tooltips
    formTooltip: 'Poslednjih 5 rezultata. Nedavna forma bolje predviđa kratkoročne performanse.',
    edgeTooltip: 'Razlika u verovatnoći između timova. Viši % = jača prednost.',
    tempoTooltip: 'Očekivani tempo igre. Brze utakmice često donose više golova/poena.',
    efficiencyTooltip: 'Koliko dobro timovi realizuju šanse. Razlika između dobrih i sjajnih timova.',
    availabilityTooltip: 'Uticaj zdravlja tima. Ključna odsustva mogu pomeriti ishod za 10-20%.',
  },
};

interface UniversalSignalsDisplayProps {
  signals: UniversalSignals;
  homeTeam: string;
  awayTeam: string;
  homeForm?: string;
  awayForm?: string;
  locale?: 'en' | 'sr';
  canSeeExactNumbers?: boolean; // If false, hide percentages in VerdictBadge and EdgeBar
  marketIntel?: MarketIntel | null; // Pipeline-calculated edge (single source of truth)
}

export default function UniversalSignalsDisplay({
  signals,
  homeTeam,
  awayTeam,
  homeForm = '-----',
  awayForm = '-----',
  locale = 'en',
  canSeeExactNumbers = true, // Default to true for backwards compatibility
  marketIntel,
}: UniversalSignalsDisplayProps) {
  const t = signalTranslations[locale];

  // Guard against undefined signals or display
  if (!signals || !signals.display) {
    return (
      <div className="p-4 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] text-center text-zinc-500 text-sm">
        {t.loadingSignals}
      </div>
    );
  }

  const { display, confidence, clarity_score } = signals;

  // ═══════════════════════════════════════════════════════════
  // PIPELINE OVERRIDE: Use marketIntel as single source of truth
  // Fall back to heuristic signals only when marketIntel is not available
  // ═══════════════════════════════════════════════════════════
  const hasPipelineEdge = marketIntel && marketIntel.valueEdge;

  let edgePercentage: number;
  let favoredSide: string | null;
  let effectiveConfidence: 'high' | 'medium' | 'low';

  if (hasPipelineEdge) {
    // Pipeline edge: convert edgePercent to 0-100 scale (50 = neutral)
    const pipeEdge = marketIntel.valueEdge.edgePercent;
    const pipeOutcome = marketIntel.valueEdge.outcome;
    const pipeStrength = marketIntel.valueEdge.strength;

    if (pipeOutcome === 'home' && pipeStrength !== 'none') {
      edgePercentage = 50 + Math.abs(pipeEdge);
      favoredSide = homeTeam;
    } else if (pipeOutcome === 'away' && pipeStrength !== 'none') {
      edgePercentage = 50 - Math.abs(pipeEdge);
      favoredSide = awayTeam;
    } else {
      edgePercentage = 50;
      favoredSide = null;
    }

    // Map pipeline strength to confidence
    // 'slight' (3-6%) is still a valid edge → 'medium', not 'low'
    effectiveConfidence = pipeStrength === 'strong' ? 'high'
      : (pipeStrength === 'moderate' || pipeStrength === 'slight') ? 'medium'
        : 'low';
  } else {
    // Fallback to heuristic signals
    const heuristicDirection = display.edge?.direction;
    edgePercentage = display.edge?.percentage || 50;
    effectiveConfidence = confidence;

    if (heuristicDirection === 'home') {
      favoredSide = homeTeam;
    } else if (heuristicDirection === 'away') {
      favoredSide = awayTeam;
    } else if (edgePercentage > 50) {
      favoredSide = homeTeam;
    } else if (edgePercentage < 50) {
      favoredSide = awayTeam;
    } else {
      favoredSide = null;
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Verdict Card with Confidence Ring */}
      <VerdictBadge
        favored={favoredSide || (locale === 'sr' ? 'Nema Jasne Prednosti' : 'No Clear Edge')}
        confidence={effectiveConfidence}
        clarityScore={clarity_score}
        edgePercentage={canSeeExactNumbers ? edgePercentage : undefined}
        canSeeExactNumbers={canSeeExactNumbers}
      />

      {/* Visual Signals Grid */}
      <div className="grid grid-cols-1 gap-3">

        {/* Form - Visual dots + rating bars */}
        <SignalCard
          icon={<PremiumIcon name="chart" size="lg" className="text-white" />}
          label={t.form}
          tooltip={t.formTooltip}
          rightContent={
            <span className="text-sm font-medium text-zinc-200">
              {/* Derive a clean label from form data instead of raw AI text */}
              {(() => {
                const h = display.form.home;
                const a = display.form.away;
                if (h === 'strong' && a !== 'strong') return homeTeam;
                if (a === 'strong' && h !== 'strong') return awayTeam;
                if (h === 'weak' && a !== 'weak') return awayTeam;
                if (a === 'weak' && h !== 'weak') return homeTeam;
                return locale === 'sr' ? 'Ujednačeno' : 'Even';
              })()}
            </span>
          }
        >
          <div className="space-y-1.5 mt-3">
            <FormDots form={homeForm} teamName={homeTeam} size="sm" />
            <FormDots form={awayForm} teamName={awayTeam} size="sm" />
          </div>
          {/* Form rating bars (0-100) */}
          {(display.form.homeRating > 0 || display.form.awayRating > 0) && (
            canSeeExactNumbers ? (
              <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                <FormRatingBar team={homeTeam} rating={display.form.homeRating} />
                <FormRatingBar team={awayTeam} rating={display.form.awayRating} />
              </div>
            ) : (
              <div className="relative mt-3 pt-3 border-t border-white/[0.06]">
                <div className="blur-[6px] pointer-events-none select-none space-y-2">
                  <FormRatingBar team={homeTeam} rating={72} />
                  <FormRatingBar team={awayTeam} rating={58} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    PRO
                  </span>
                </div>
              </div>
            )
          )}
        </SignalCard>

        {/* Strength Edge - Visual bar */}
        <SignalCard icon={<PremiumIcon name="bolt" size="lg" className="text-white" />} label={t.strengthEdge} tooltip={t.edgeTooltip}>
          <div className="mt-3">
            <EdgeBar
              direction={edgePercentage > 50 ? 'home' : edgePercentage < 50 ? 'away' : 'even'}
              percentage={edgePercentage}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              canSeeExactNumbers={canSeeExactNumbers}
            />
          </div>
        </SignalCard>

        {/* Tempo + Efficiency Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tempo */}
          <div className="p-5 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] border-t-white/[0.12]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PremiumIcon name="target" size="lg" className="text-white" />
                <span className="matrix-label">{t.tempo}</span>
                <InfoTooltip content={t.tempoTooltip} position="bottom" />
              </div>
              <TempoIndicator level={display.tempo.level} />
            </div>
            {(display.tempo.avgGoals ?? 0) > 0 ? (
              <div>
                <p className="text-base font-medium text-stone-200">
                  ~{display.tempo.avgGoals} <span className="text-sm text-zinc-500">{locale === 'sr' ? 'golova/meč' : 'goals/game'}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-0.5 capitalize">{display.tempo.level} {locale === 'sr' ? 'tempo' : 'tempo'}</p>
              </div>
            ) : (
              <p className="text-base font-medium text-stone-200 capitalize">
                {display.tempo.level} {locale === 'sr' ? 'Tempo' : 'Tempo'}
              </p>
            )}
          </div>

          {/* Efficiency */}
          <div className="p-5 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] border-t-white/[0.12]">
            <div className="flex items-center gap-2 mb-3">
              <PremiumIcon name="trending" size="lg" className="text-white" />
              <span className="matrix-label">{t.efficiency}</span>
              <InfoTooltip content={t.efficiencyTooltip} position="bottom" />
            </div>
            {/* Concrete per-game stats */}
            {((display.efficiency.homeOffense ?? 0) > 0 || (display.efficiency.awayOffense ?? 0) > 0) ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 truncate max-w-[45%]">{homeTeam}</span>
                  <span className="text-zinc-300 font-medium tabular-nums">
                    <span className="text-emerald-400/80">{display.efficiency.homeOffense}</span>
                    <span className="text-zinc-600 mx-1">/</span>
                    <span className="text-red-400/80">{display.efficiency.homeDefense}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 truncate max-w-[45%]">{awayTeam}</span>
                  <span className="text-zinc-300 font-medium tabular-nums">
                    <span className="text-emerald-400/80">{display.efficiency.awayOffense}</span>
                    <span className="text-zinc-600 mx-1">/</span>
                    <span className="text-red-400/80">{display.efficiency.awayDefense}</span>
                  </span>
                </div>
                <p className="text-[9px] text-zinc-600 mt-0.5">
                  {locale === 'sr' ? 'postignuto / primljeno po meču' : 'scored / conceded per game'}
                </p>
              </div>
            ) : (
              <p className="text-base font-medium text-stone-200">
                {/* Map winner to team name for human-readable display */}
                {(() => {
                  const w = display.efficiency.winner;
                  if (w === 'home') return `${homeTeam} ${t.advantage}`;
                  if (w === 'away') return `${awayTeam} ${t.advantage}`;
                  return locale === 'sr' ? 'Ujednačeno' : 'Even';
                })()}
              </p>
            )}
          </div>
        </div>

        {/* Availability - Expandable */}
        <ExpandableAvailability
          display={display}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          locale={locale}
          tooltip={t.availabilityTooltip}
          canSeeExactNumbers={canSeeExactNumbers}
        />
      </div>

      {/* Minimal disclaimer */}
      <p className="text-[9px] text-zinc-700 text-center">
        {t.disclaimer}
      </p>
    </div>
  );
}

/**
 * Premium Availability Display — Visual Redesign
 * 
 * Features:
 * - SVG player silhouette icons with severity color coding
 * - Animated squad impact bar (visual meter)
 * - Clean card-per-player with position + injury type
 * - Side-by-side team columns
 */
function ExpandableAvailability({
  display,
  homeTeam,
  awayTeam,
  locale = 'en',
  tooltip,
  canSeeExactNumbers = true,
}: {
  display: UniversalSignals['display'];
  homeTeam: string;
  awayTeam: string;
  locale?: 'en' | 'sr';
  tooltip?: string;
  canSeeExactNumbers?: boolean;
}) {
  const t = signalTranslations[locale];
  const [showAll, setShowAll] = useState(false);
  const homeInjuries = display.availability.homeInjuries || [];
  const awayInjuries = display.availability.awayInjuries || [];
  const hasInjuries = homeInjuries.length > 0 || awayInjuries.length > 0;

  const maxVisible = 3;
  const homeVisible = showAll ? homeInjuries : homeInjuries.slice(0, maxVisible);
  const awayVisible = showAll ? awayInjuries : awayInjuries.slice(0, maxVisible);
  const hasMore = homeInjuries.length > maxVisible || awayInjuries.length > maxVisible;

  // Severity classification
  const getSeverity = (reason: string): {
    color: string;
    bgColor: string;
    textColor: string;
    label: string;
    icon: 'out' | 'suspended' | 'doubtful' | 'inactive';
  } => {
    const r = (reason || '').toLowerCase();
    if (r.includes('suspend')) return {
      color: '#ef4444', bgColor: 'bg-red-500/8', textColor: 'text-red-400',
      label: locale === 'sr' ? 'Suspendovan' : 'Suspended', icon: 'suspended'
    };
    if (r.includes('doubtful') || r.includes('questionable')) return {
      color: '#f59e0b', bgColor: 'bg-amber-500/8', textColor: 'text-amber-400',
      label: locale === 'sr' ? 'Neizvestan' : 'Doubtful', icon: 'doubtful'
    };
    if (r.includes('probable') || r.includes('gtd') || r.includes('day-to-day')) return {
      color: '#eab308', bgColor: 'bg-yellow-500/8', textColor: 'text-yellow-400',
      label: locale === 'sr' ? 'Upitan' : 'Questionable', icon: 'doubtful'
    };
    if (r.includes('inactive') || r.includes('rest')) return {
      color: '#71717a', bgColor: 'bg-zinc-500/8', textColor: 'text-zinc-400',
      label: locale === 'sr' ? 'Neaktivan' : 'Inactive', icon: 'inactive'
    };
    return {
      color: '#ef4444', bgColor: 'bg-red-500/8', textColor: 'text-red-400',
      label: locale === 'sr' ? 'Ne igra' : 'Out', icon: 'out'
    };
  };

  const getInjuryDescription = (injury: { reason?: string; details?: string }) => {
    const reason = injury.reason || '';
    if (reason && reason.length > 3 && !['injury', 'doubtful', 'suspension', 'out'].includes(reason.toLowerCase())) {
      return reason.length > 25 ? reason.slice(0, 23) + '…' : reason;
    }
    const details = injury.details || '';
    return details.length > 25 ? details.slice(0, 23) + '…' : details;
  };

  // Impact level for top-level visual
  const impactLevel = display.availability.level;
  const impactConfig = {
    critical: { barWidth: '95%', color: '#ef4444', glow: 'rgba(239,68,68,0.4)', label: locale === 'sr' ? 'Kritičan Uticaj' : 'Critical Impact', border: 'border-red-500/20' },
    high: { barWidth: '85%', color: '#ef4444', glow: 'rgba(239,68,68,0.4)', label: locale === 'sr' ? 'Visok Uticaj' : 'High Impact', border: 'border-red-500/15' },
    medium: { barWidth: '50%', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', label: locale === 'sr' ? 'Umeren Uticaj' : 'Moderate Impact', border: 'border-amber-500/15' },
    low: { barWidth: '20%', color: '#10b981', glow: 'rgba(16,185,129,0.3)', label: locale === 'sr' ? 'Nizak Uticaj' : 'Low Impact', border: 'border-emerald-500/15' },
  };
  const impact = impactConfig[impactLevel] || impactConfig.low;
  const totalOut = homeInjuries.length + awayInjuries.length;

  // SVG player silhouette with status indicator
  const PlayerIcon = ({ severity }: { severity: ReturnType<typeof getSeverity> }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
      {/* Head */}
      <circle cx="14" cy="8" r="4.5" fill={severity.color} fillOpacity={0.15} stroke={severity.color} strokeWidth="1" strokeOpacity={0.4} />
      {/* Body */}
      <path d="M7 24c0-4 3.134-7 7-7s7 3 7 7" fill={severity.color} fillOpacity={0.1} stroke={severity.color} strokeWidth="1" strokeOpacity={0.3} strokeLinecap="round" />
      {/* Status dot */}
      <circle cx="21" cy="5" r="3" fill={severity.color} />
      {severity.icon === 'out' && (
        <path d="M19.8 3.8l2.4 2.4m0-2.4l-2.4 2.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      )}
      {severity.icon === 'suspended' && (
        <rect x="20" y="3.5" width="2" height="3" rx="0.5" fill="white" />
      )}
      {severity.icon === 'doubtful' && (
        <text x="21" y="6.5" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">?</text>
      )}
    </svg>
  );

  // Single injury card — premium style
  const InjuryCard = ({ injury, index }: { injury: { player: string; position?: string; reason?: string; details?: string }; index: number }) => {
    const severity = getSeverity(injury.reason || '');
    const desc = getInjuryDescription(injury);
    const position = injury.position && injury.position !== 'Unknown' ? injury.position : null;

    return (
      <div
        className={`flex items-center gap-2.5 p-2.5 rounded-xl ${severity.bgColor} border border-white/[0.04] transition-all duration-300`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <PlayerIcon severity={severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-white truncate">{injury.player}</span>
            {position && (
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider flex-shrink-0">{position}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-medium ${severity.textColor}`}>{severity.label}</span>
            {desc && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="text-[10px] text-zinc-500 truncate">{desc}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Blurred placeholder for free users
  const BlurredCards = ({ count }: { count: number }) => (
    <div className="relative">
      <div className="blur-[6px] pointer-events-none select-none space-y-1.5">
        {Array.from({ length: Math.min(count, 2) }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-red-500/8 border border-white/[0.04]">
            <div className="w-7 h-7 rounded-full bg-red-500/20" />
            <div className="flex-1">
              <div className="h-3 w-20 bg-white/10 rounded" />
              <div className="h-2 w-14 bg-white/5 rounded mt-1" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-sm">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          PRO
        </span>
      </div>
    </div>
  );

  return (
    <div className={`rounded-2xl bg-[#0a0a0b] border ${impact.border} border-t-white/[0.12] overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <span className="matrix-label block">
              {locale === 'sr' ? 'Raspoloživost Tima' : 'Squad Availability'}
            </span>
            {hasInjuries && (
              <span className="text-[10px] text-zinc-600">
                {totalOut} {locale === 'sr' ? 'igrača van terena' : 'players unavailable'}
              </span>
            )}
          </div>
          {tooltip && <InfoTooltip content={tooltip} position="bottom" />}
        </div>
        <AvailabilityDots level={display.availability.level} />
      </div>

      {hasInjuries ? (
        <>
          {/* Squad Impact Meter */}
          <div className="px-5 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                {locale === 'sr' ? 'Uticaj na Tim' : 'Squad Impact'}
              </span>
              <span className="text-[10px] font-medium" style={{ color: impact.color }}>
                {impact.label}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: impact.barWidth,
                  background: `linear-gradient(90deg, ${impact.color}66, ${impact.color})`,
                  boxShadow: `0 0 8px ${impact.glow}`,
                }}
              />
            </div>
          </div>

          {/* Two-Column Team Split */}
          <div className="grid grid-cols-2 divide-x divide-white/[0.04]">
            {/* Home Team Column */}
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider truncate max-w-[70%]">{homeTeam}</span>
                {homeInjuries.length > 0 && (
                  <span className="text-[10px] tabular-nums font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                    {homeInjuries.length}
                  </span>
                )}
              </div>
              {homeInjuries.length > 0 ? (
                canSeeExactNumbers ? (
                  <div className="space-y-1.5">
                    {homeVisible.map((injury, idx) => (
                      <InjuryCard key={idx} injury={injury} index={idx} />
                    ))}
                  </div>
                ) : (
                  <BlurredCards count={homeInjuries.length} />
                )
              ) : (
                <div className="py-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                    <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] text-emerald-400/80">{locale === 'sr' ? 'Komplet' : 'Full squad'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Away Team Column */}
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider truncate max-w-[70%]">{awayTeam}</span>
                {awayInjuries.length > 0 && (
                  <span className="text-[10px] tabular-nums font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                    {awayInjuries.length}
                  </span>
                )}
              </div>
              {awayInjuries.length > 0 ? (
                canSeeExactNumbers ? (
                  <div className="space-y-1.5">
                    {awayVisible.map((injury, idx) => (
                      <InjuryCard key={idx} injury={injury} index={idx} />
                    ))}
                  </div>
                ) : (
                  <BlurredCards count={awayInjuries.length} />
                )
              ) : (
                <div className="py-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                    <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] text-emerald-400/80">{locale === 'sr' ? 'Komplet' : 'Full squad'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Show More / Less */}
          {hasMore && canSeeExactNumbers && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1.5 border-t border-white/[0.04]"
            >
              {showAll ? (
                <>
                  {locale === 'sr' ? 'Manje' : 'Show less'}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  {locale === 'sr' ? 'Prikaži sve' : 'Show all'} ({totalOut})
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </>
      ) : (
        <div className="text-center px-5 pb-5">
          <div className="py-3 px-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-emerald-400/80">{t.noInjuries}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Signal Card wrapper component
 */
function SignalCard({
  icon,
  label,
  children,
  rightContent,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  rightContent?: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-[#0a0a0b] border border-white/[0.06]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <span className="matrix-label">{label}</span>
          {tooltip && <InfoTooltip content={tooltip} position="bottom" />}
        </div>
        {rightContent}
      </div>
      {children}
    </div>
  );
}

/**
 * Form Rating Bar - Shows 0-100 form score as a compact horizontal bar
 */
function FormRatingBar({ team, rating }: { team: string; rating: number }) {
  const barColor = rating >= 65 ? 'bg-emerald-500' : rating >= 40 ? 'bg-zinc-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-zinc-500 w-20 truncate">{team}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, rating))}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-zinc-400 w-8 text-right">{rating}</span>
    </div>
  );
}

/**
 * Compact Signal Pills - For summary/header areas
 * Uses restrained colors: only emerald for positive edge, neutral otherwise
 */
export function SignalPills({ signals, locale = 'en' }: { signals: UniversalSignals; locale?: 'en' | 'sr' }) {
  const t = signalTranslations[locale];
  const { display, confidence } = signals;

  // Handle undefined display or edge
  const edgeDirection = display?.edge?.direction || 'even';
  const tempoLevel = display?.tempo?.level || 'medium';
  const edgePercentage = display?.edge?.percentage || 50;

  // Only show color if there's a meaningful edge (>5% from neutral)
  const hasSignificantEdge = Math.abs(edgePercentage - 50) > 5;

  // Convert clarity score to user-friendly label
  const getDataQualityLabel = (score: number): { label: string; color: 'emerald' | 'amber' | 'zinc' } => {
    if (score >= 75) return { label: t.rich, color: 'zinc' }; // Even good data = neutral
    if (score >= 50) return { label: t.standard, color: 'zinc' };
    return { label: t.limited, color: 'zinc' }; // Neutral for all
  };

  const dataQuality = getDataQualityLabel(signals.clarity_score);

  return (
    <div className="flex flex-wrap gap-2">
      <Pill
        label={t.edge}
        value={signals.strength_edge}
        color={hasSignificantEdge ? 'emerald' : 'zinc'}
      />
      <Pill
        label={t.tempo}
        value={signals.tempo}
        color="zinc" // Tempo is neutral - no color needed
      />
      <Pill
        label={t.data}
        value={dataQuality.label}
        color={dataQuality.color}
      />
    </div>
  );
}

function Pill({
  label,
  value,
  color = 'zinc',
}: {
  label: string;
  value: string;
  color?: 'emerald' | 'amber' | 'violet' | 'zinc';
}) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    zinc: 'text-zinc-400 bg-zinc-500/10',
  };

  return (
    <div className={`px-2.5 py-1.5 rounded-lg ${colors[color]}`}>
      <span className="matrix-dim">{label}</span>
      <span className="mx-1.5 text-zinc-700">·</span>
      <span className="text-[11px] font-medium">{value}</span>
    </div>
  );
}
