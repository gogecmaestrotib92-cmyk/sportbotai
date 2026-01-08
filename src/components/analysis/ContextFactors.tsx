/**
 * Context Factors Component
 * 
 * The "hidden" factors that matter:
 * - Rest days
 * - Motivation
 * - Manager record
 * - Historical fixture average
 */

'use client';

interface ContextFactor {
  id: string;
  icon: string;
  label: string;
  value: string;
  /** Optional: who this helps */
  favors?: 'home' | 'away' | 'neutral';
  /** Optional: extra context */
  note?: string;
}

interface ContextFactorsProps {
  factors: ContextFactor[];
  homeTeam: string;
  awayTeam: string;
}

export default function ContextFactors({
  factors,
  homeTeam,
  awayTeam,
}: ContextFactorsProps) {
  if (factors.length === 0) return null;

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Context & Factors</h3>
            <p className="text-sm text-text-muted">Additional intel that could matter</p>
          </div>
        </div>
      </div>

      {/* Factors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/5">
        {factors.map((factor) => (
          <div 
            key={factor.id}
            className="bg-[#0F1114] p-5 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{factor.icon}</span>
              <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
                {factor.label}
              </span>
            </div>
            
            <p className="text-base font-semibold text-white mb-2">{factor.value}</p>
            
            {factor.favors && factor.favors !== 'neutral' && (
              <span className={`text-xs font-medium ${factor.favors === 'home' ? 'text-emerald-400' : 'text-emerald-400'}`}>
                → {factor.favors === 'home' ? homeTeam : awayTeam}
              </span>
            )}
            
            {factor.note && (
              <p className="text-xs text-text-muted mt-2">{factor.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
