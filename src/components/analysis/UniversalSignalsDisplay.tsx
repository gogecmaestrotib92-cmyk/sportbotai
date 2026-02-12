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
}

export default function UniversalSignalsDisplay({
  signals,
  homeTeam,
  awayTeam,
  homeForm = '-----',
  awayForm = '-----',
  locale = 'en',
  canSeeExactNumbers = true, // Default to true for backwards compatibility
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
  
  // Determine the favored side with null check
  // For close matches ("even"), still determine which side has slight edge from percentage
  const edgeDirection = display.edge?.direction;
  const edgePercentage = display.edge?.percentage || 50;
  
  // Even for "even" matches, show which side has slight lean if percentage exists
  let favoredSide: string | null;
  if (edgeDirection === 'home') {
    favoredSide = homeTeam;
  } else if (edgeDirection === 'away') {
    favoredSide = awayTeam;
  } else if (edgePercentage > 50) {
    // "even" but has slight home lean
    favoredSide = homeTeam;
  } else if (edgePercentage < 50) {
    // "even" but has slight away lean
    favoredSide = awayTeam;
  } else {
    favoredSide = null;
  }

  return (
    <div className="space-y-4">
      {/* Main Verdict Card with Confidence Ring */}
      <VerdictBadge 
        favored={favoredSide || (locale === 'sr' ? 'Nema Jasne Prednosti' : 'No Clear Edge')}
        confidence={confidence}
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
            <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
              <FormRatingBar team={homeTeam} rating={display.form.homeRating} />
              <FormRatingBar team={awayTeam} rating={display.form.awayRating} />
            </div>
          )}
        </SignalCard>

        {/* Strength Edge - Visual bar */}
        <SignalCard icon={<PremiumIcon name="bolt" size="lg" className="text-white" />} label={t.strengthEdge} tooltip={t.edgeTooltip}>
          <div className="mt-3">
            <EdgeBar
              direction={display.edge?.direction || 'even'}
              percentage={display.edge?.percentage || 50}
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
 * Premium Availability Display
 * Side-by-side team columns with clean injury cards
 */
function ExpandableAvailability({
  display,
  homeTeam,
  awayTeam,
  locale = 'en',
  tooltip,
}: {
  display: UniversalSignals['display'];
  homeTeam: string;
  awayTeam: string;
  locale?: 'en' | 'sr';
  tooltip?: string;
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

  // Severity color mapping
  const getSeverity = (reason: string): { dot: string; bg: string; text: string; label: string } => {
    const r = (reason || '').toLowerCase();
    if (r.includes('suspend')) return { dot: 'bg-red-500', bg: 'bg-red-500/8', text: 'text-red-400', label: locale === 'sr' ? 'Suspendovan' : 'Suspended' };
    if (r.includes('doubtful') || r.includes('questionable')) return { dot: 'bg-amber-500', bg: 'bg-amber-500/8', text: 'text-amber-400', label: locale === 'sr' ? 'Neizvestan' : 'Doubtful' };
    if (r.includes('probable') || r.includes('gtd') || r.includes('day-to-day')) return { dot: 'bg-yellow-500', bg: 'bg-yellow-500/8', text: 'text-yellow-400', label: locale === 'sr' ? 'Upitan' : 'Questionable' };
    if (r.includes('inactive') || r.includes('rest')) return { dot: 'bg-zinc-500', bg: 'bg-zinc-500/8', text: 'text-zinc-400', label: locale === 'sr' ? 'Neaktivan' : 'Inactive' };
    return { dot: 'bg-red-500', bg: 'bg-red-500/8', text: 'text-red-400', label: locale === 'sr' ? 'Ne igra' : 'Out' };
  };

  const getInjuryDescription = (injury: { reason?: string; details?: string }) => {
    const reason = injury.reason || '';
    // If reason has actual injury info (not just "injury"/"out"), show it
    if (reason && reason.length > 3 && !['injury', 'doubtful', 'suspension', 'out'].includes(reason.toLowerCase())) {
      return reason.length > 30 ? reason.slice(0, 28) + '…' : reason;
    }
    return injury.details || '';
  };

  // Impact level bar color
  const impactColor = display.availability.level === 'high' 
    ? 'border-red-500/20' 
    : display.availability.level === 'medium' 
      ? 'border-amber-500/20' 
      : 'border-white/[0.06]';

  return (
    <div className={`rounded-2xl bg-[#0a0a0b] border border-t-white/[0.12] ${impactColor} overflow-hidden`}>
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
                {homeInjuries.length + awayInjuries.length} {locale === 'sr' ? 'igrača van terena' : 'players unavailable'}
              </span>
            )}
          </div>
          {tooltip && <InfoTooltip content={tooltip} position="bottom" />}
        </div>
        <AvailabilityDots level={display.availability.level} />
      </div>

      {hasInjuries ? (
        <>
          {/* Two-Column Team Split */}
          <div className="grid grid-cols-2 divide-x divide-white/[0.04]">
            {/* Home Team Column */}
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider truncate max-w-[70%]">{homeTeam}</span>
                {homeInjuries.length > 0 && (
                  <span className="text-[10px] tabular-nums font-bold text-red-400">
                    {homeInjuries.length}
                  </span>
                )}
              </div>
              {homeInjuries.length > 0 ? (
                <div className="space-y-1">
                  {homeVisible.map((injury, idx) => {
                    const severity = getSeverity(injury.reason || '');
                    const desc = getInjuryDescription(injury);
                    return (
                      <div key={idx} className={`p-2 rounded-lg ${severity.bg} transition-colors`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${severity.dot} flex-shrink-0`} />
                          <span className="text-[13px] font-medium text-white truncate flex-1">{injury.player}</span>
                        </div>
                        {desc && (
                          <p className={`text-[10px] ${severity.text} mt-0.5 ml-3.5 leading-tight`}>
                            {desc}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-3 text-center">
                  <span className="text-[10px] text-zinc-600">{locale === 'sr' ? 'Svi dostupni' : 'Full squad'}</span>
                </div>
              )}
            </div>

            {/* Away Team Column */}
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider truncate max-w-[70%]">{awayTeam}</span>
                {awayInjuries.length > 0 && (
                  <span className="text-[10px] tabular-nums font-bold text-red-400">
                    {awayInjuries.length}
                  </span>
                )}
              </div>
              {awayInjuries.length > 0 ? (
                <div className="space-y-1">
                  {awayVisible.map((injury, idx) => {
                    const severity = getSeverity(injury.reason || '');
                    const desc = getInjuryDescription(injury);
                    return (
                      <div key={idx} className={`p-2 rounded-lg ${severity.bg} transition-colors`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${severity.dot} flex-shrink-0`} />
                          <span className="text-[13px] font-medium text-white truncate flex-1">{injury.player}</span>
                        </div>
                        {desc && (
                          <p className={`text-[10px] ${severity.text} mt-0.5 ml-3.5 leading-tight`}>
                            {desc}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-3 text-center">
                  <span className="text-[10px] text-zinc-600">{locale === 'sr' ? 'Svi dostupni' : 'Full squad'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Show More / Less */}
          {hasMore && (
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
                  {locale === 'sr' ? 'Prikaži sve' : 'Show all'} ({homeInjuries.length + awayInjuries.length})
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
