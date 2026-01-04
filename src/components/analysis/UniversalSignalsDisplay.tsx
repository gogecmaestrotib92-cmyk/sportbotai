/**
 * Universal Signals Display V2 - Premium Visual UI
 * 
 * Clean, visual display of the 5 normalized signals.
 * Uses visual indicators instead of text-only presentation.
 * Works identically for ALL sports.
 */

'use client';

import { useState } from 'react';
import { UniversalSignals } from '@/lib/universal-signals';
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
      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center text-zinc-500 text-sm">
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
        
        {/* Form - Visual dots */}
        <SignalCard 
          icon="📊" 
          label={t.form}
          rightContent={
            <span className="text-sm font-medium text-zinc-200">
              {display.form.label}
            </span>
          }
        >
          <div className="space-y-1.5 mt-3">
            <FormDots form={homeForm} teamName={homeTeam} size="sm" />
            <FormDots form={awayForm} teamName={awayTeam} size="sm" />
          </div>
        </SignalCard>

        {/* Strength Edge - Visual bar */}
        <SignalCard icon="⚡" label={t.strengthEdge}>
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
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{t.tempo}</span>
              </div>
              <TempoIndicator level={display.tempo.level} />
            </div>
            <p className="text-base font-medium text-stone-200">
              {display.tempo.label}
            </p>
          </div>

          {/* Efficiency */}
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📈</span>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{t.efficiency}</span>
            </div>
            <p className="text-base font-medium text-stone-200">
              {display.efficiency.label}
            </p>
            {display.efficiency.aspect && (
              <p className="text-xs text-zinc-500 mt-1">
                {display.efficiency.aspect} {t.advantage}
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
 * Expandable Availability Section
 */
function ExpandableAvailability({
  display,
  homeTeam,
  awayTeam,
  locale = 'en',
}: {
  display: UniversalSignals['display'];
  homeTeam: string;
  awayTeam: string;
  locale?: 'en' | 'sr';
}) {
  const t = signalTranslations[locale];
  const [expanded, setExpanded] = useState(false);
  const homeInjuries = display.availability.homeInjuries || [];
  const awayInjuries = display.availability.awayInjuries || [];
  const hasInjuries = homeInjuries.length > 0 || awayInjuries.length > 0;
  
  // Debug: log what we received
  console.log('[UniversalSignalsDisplay] Availability data:', {
    hasDisplay: !!display,
    hasAvailability: !!display?.availability,
    homeInjuriesCount: homeInjuries.length,
    awayInjuriesCount: awayInjuries.length,
    level: display?.availability?.level,
  });

  return (
    <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
      <button
        onClick={() => hasInjuries && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between ${hasInjuries ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!hasInjuries}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🏥</span>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{t.availabilityImpact}</span>
          {hasInjuries && (
            <span className="text-xs text-zinc-500">
              ({homeInjuries.length + awayInjuries.length} {t.players})
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <AvailabilityDots level={display.availability.level} />
          {hasInjuries && (
            <svg
              className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>
      
      {display.availability.note && !expanded && (
        <p className="text-xs text-zinc-500 mt-2">
          {display.availability.note}
        </p>
      )}

      {expanded && hasInjuries && (
        <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-3">
          {/* Home Team Injuries */}
          {homeInjuries.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                {homeTeam}
              </p>
              <div className="space-y-1.5">
                {homeInjuries.map((injury, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-white">{injury.player}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      injury.reason === 'suspension' ? 'bg-red-500/20 text-red-400' :
                      injury.reason === 'doubtful' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {injury.details || injury.reason || t.out}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Away Team Injuries */}
          {awayInjuries.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                {awayTeam}
              </p>
              <div className="space-y-1.5">
                {awayInjuries.map((injury, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-white">{injury.player}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      injury.reason === 'suspension' ? 'bg-red-500/20 text-red-400' :
                      injury.reason === 'doubtful' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {injury.details || injury.reason || t.out}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!hasInjuries && (
        <p className="text-[10px] text-zinc-600 mt-2">
          {t.noInjuries}
        </p>
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
}: { 
  icon: string; 
  label: string; 
  children: React.ReactNode;
  rightContent?: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</span>
        </div>
        {rightContent}
      </div>
      {children}
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
  color?: 'emerald' | 'amber' | 'blue' | 'zinc';
}) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    zinc: 'text-zinc-400 bg-zinc-500/10',
  };

  return (
    <div className={`px-2.5 py-1.5 rounded-lg ${colors[color]}`}>
      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="mx-1.5 text-zinc-700">·</span>
      <span className="text-[11px] font-medium">{value}</span>
    </div>
  );
}
