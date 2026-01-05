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
 * Two-Column Availability Display
 * Always visible side-by-side team comparison with injury counts
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
  const [showAll, setShowAll] = useState(false);
  const homeInjuries = display.availability.homeInjuries || [];
  const awayInjuries = display.availability.awayInjuries || [];
  const hasInjuries = homeInjuries.length > 0 || awayInjuries.length > 0;
  
  // Show first 3 injuries per team, rest behind "show more"
  const maxVisible = 3;
  const homeVisible = showAll ? homeInjuries : homeInjuries.slice(0, maxVisible);
  const awayVisible = showAll ? awayInjuries : awayInjuries.slice(0, maxVisible);
  const hasMore = homeInjuries.length > maxVisible || awayInjuries.length > maxVisible;

  // Get status badge styling
  const getStatusStyle = (reason: string) => {
    const r = reason.toLowerCase();
    if (r.includes('suspend')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (r.includes('doubtful') || r.includes('questionable')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (r.includes('probable') || r.includes('gtd') || r.includes('day-to-day')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (r.includes('out')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30';
  };

  const getStatusLabel = (injury: { reason?: string; details?: string }) => {
    // For Perplexity injuries, reason contains the full info like "Right Ankle Sprain - Out"
    const reason = injury.reason || '';
    
    // If it contains injury details (e.g., "Knee - Out"), show it
    if (reason && reason.length > 3 && !['injury', 'doubtful', 'suspension'].includes(reason.toLowerCase())) {
      // Truncate if too long
      return reason.length > 25 ? reason.slice(0, 22) + '...' : reason;
    }
    
    // Legacy soccer format
    if (reason === 'suspension') return locale === 'sr' ? 'Suspendovan' : 'Suspended';
    if (reason === 'doubtful') return locale === 'sr' ? 'Neizvestan' : 'Doubtful';
    return injury.details || (locale === 'sr' ? 'Ne igra' : 'Out');
  };

  return (
    <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">🏥</span>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
            {locale === 'sr' ? 'Raspoloživost Tima' : 'Squad Availability'}
          </span>
        </div>
        <AvailabilityDots level={display.availability.level} />
      </div>

      {hasInjuries ? (
        <>
          {/* Two-Column Team Split */}
          <div className="grid grid-cols-2 gap-3">
            {/* Home Team Column */}
            <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-300 truncate">{homeTeam}</span>
                {homeInjuries.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                    {homeInjuries.length} {locale === 'sr' ? 'van' : 'out'}
                  </span>
                )}
              </div>
              {homeInjuries.length > 0 ? (
                <div className="space-y-2">
                  {homeVisible.map((injury, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{injury.player}</p>
                        <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded border mt-0.5 ${getStatusStyle(injury.reason || '')}`}>
                          {getStatusLabel(injury)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  {locale === 'sr' ? 'Nema prijavljenih' : 'No absences'}
                </p>
              )}
            </div>

            {/* Away Team Column */}
            <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-300 truncate">{awayTeam}</span>
                {awayInjuries.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                    {awayInjuries.length} {locale === 'sr' ? 'van' : 'out'}
                  </span>
                )}
              </div>
              {awayInjuries.length > 0 ? (
                <div className="space-y-2">
                  {awayVisible.map((injury, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{injury.player}</p>
                        <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded border mt-0.5 ${getStatusStyle(injury.reason || '')}`}>
                          {getStatusLabel(injury)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  {locale === 'sr' ? 'Nema prijavljenih' : 'No absences'}
                </p>
              )}
            </div>
          </div>

          {/* Show More Button */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2 text-xs text-zinc-400 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1"
            >
              {showAll ? (
                <>
                  {locale === 'sr' ? 'Prikaži manje' : 'Show less'}
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

          {/* Availability Note */}
          {display.availability.note && (
            <p className="text-[10px] text-zinc-500 mt-3 text-center">
              {display.availability.note}
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-zinc-500">
            {t.noInjuries}
          </p>
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
