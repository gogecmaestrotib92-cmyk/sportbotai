/**
 * Universal Signals Display V2 - Premium Visual UI
 * 
 * Clean, visual display of the 5 normalized signals.
 * Uses visual indicators instead of text-only presentation.
 * Works identically for ALL sports.
 */

'use client';

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

interface UniversalSignalsDisplayProps {
  signals: UniversalSignals;
  homeTeam: string;
  awayTeam: string;
  homeForm?: string;
  awayForm?: string;
}

export default function UniversalSignalsDisplay({
  signals,
  homeTeam,
  awayTeam,
  homeForm = '-----',
  awayForm = '-----',
}: UniversalSignalsDisplayProps) {
  // Guard against undefined signals or display
  if (!signals || !signals.display) {
    return (
      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center text-zinc-500 text-sm">
        Loading match signals...
      </div>
    );
  }
  
  const { display, confidence, clarity_score } = signals;
  
  // Determine the favored side with null check
  const edgeDirection = display.edge?.direction;
  const favoredSide = edgeDirection === 'home' ? homeTeam
    : edgeDirection === 'away' ? awayTeam
    : null;

  return (
    <div className="space-y-4">
      {/* Main Verdict Card with Confidence Ring */}
      <VerdictBadge 
        favored={favoredSide || 'No Clear Edge'}
        confidence={confidence}
        clarityScore={clarity_score}
      />

      {/* Visual Signals Grid */}
      <div className="grid grid-cols-1 gap-3">
        
        {/* Form - Visual dots */}
        <SignalCard 
          icon="📊" 
          label="Form"
          rightContent={
            <span className={`text-xs font-medium ${
              display.form.trend === 'home_better' ? 'text-emerald-400' :
              display.form.trend === 'away_better' ? 'text-blue-400' :
              'text-zinc-400'
            }`}>
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
        <SignalCard icon="⚡" label="Strength Edge">
          <div className="mt-3">
            <EdgeBar
              direction={display.edge?.direction || 'even'}
              percentage={display.edge?.percentage || 50}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          </div>
        </SignalCard>

        {/* Tempo + Efficiency Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tempo */}
          <div className="p-4 rounded-xl bg-[#0a0a0b] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎯</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Tempo</span>
              </div>
              <TempoIndicator level={display.tempo.level} />
            </div>
            <p className={`text-sm font-medium ${
              display.tempo.level === 'high' ? 'text-amber-400' :
              display.tempo.level === 'low' ? 'text-blue-400' :
              'text-zinc-300'
            }`}>
              {display.tempo.label}
            </p>
          </div>

          {/* Efficiency */}
          <div className="p-4 rounded-xl bg-[#0a0a0b] border border-white/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">📈</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Efficiency</span>
            </div>
            <p className={`text-sm font-medium ${
              display.efficiency.winner === 'home' ? 'text-emerald-400' :
              display.efficiency.winner === 'away' ? 'text-blue-400' :
              'text-zinc-400'
            }`}>
              {display.efficiency.label}
            </p>
            {display.efficiency.aspect && (
              <p className="text-[10px] text-zinc-600 mt-0.5">
                {display.efficiency.aspect} advantage
              </p>
            )}
          </div>
        </div>

        {/* Availability */}
        <div className="p-4 rounded-xl bg-[#0a0a0b] border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🏥</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Availability Impact</span>
            </div>
            <AvailabilityDots level={display.availability.level} />
          </div>
          {display.availability.note && (
            <p className="text-xs text-zinc-500 mt-2">
              {display.availability.note}
            </p>
          )}
        </div>
      </div>

      {/* Minimal disclaimer */}
      <p className="text-[9px] text-zinc-700 text-center">
        Signals calculated from recent performance. Not betting advice.
      </p>
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
    <div className="p-4 rounded-xl bg-[#0a0a0b] border border-white/[0.04]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
        </div>
        {rightContent}
      </div>
      {children}
    </div>
  );
}

/**
 * Compact Signal Pills - For summary/header areas
 */
export function SignalPills({ signals }: { signals: UniversalSignals }) {
  const { display, confidence } = signals;
  
  // Handle undefined display or edge
  const edgeDirection = display?.edge?.direction || 'even';
  const tempoLevel = display?.tempo?.level || 'medium';
  
  return (
    <div className="flex flex-wrap gap-2">
      <Pill 
        label="Edge" 
        value={signals.strength_edge}
        color={edgeDirection === 'home' ? 'emerald' : edgeDirection === 'away' ? 'blue' : 'zinc'}
      />
      <Pill 
        label="Tempo" 
        value={signals.tempo}
        color={tempoLevel === 'high' ? 'amber' : 'zinc'}
      />
      <Pill 
        label="Data" 
        value={`${signals.clarity_score}%`}
        color={confidence === 'high' ? 'emerald' : confidence === 'medium' ? 'amber' : 'zinc'}
        tooltip="How complete our data is (form, H2H, injuries). NOT a prediction."
      />
    </div>
  );
}

function Pill({ 
  label, 
  value, 
  color = 'zinc',
  tooltip,
}: { 
  label: string; 
  value: string; 
  color?: 'emerald' | 'amber' | 'blue' | 'zinc';
  tooltip?: string;
}) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    zinc: 'text-zinc-400 bg-zinc-500/10',
  };

  return (
    <div className={`px-2.5 py-1.5 rounded-lg ${colors[color]} flex items-center gap-1`}>
      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</span>
      {tooltip && <InfoTooltip content={tooltip} position="bottom" />}
      <span className="mx-1 text-zinc-700">·</span>
      <span className="text-[11px] font-medium">{value}</span>
    </div>
  );
}
