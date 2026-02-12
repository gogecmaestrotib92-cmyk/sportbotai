/**
 * "Why This Edge Exists" — Unified Analysis Block
 * 
 * Merges what were previously 3 separate sections:
 * - Match Snapshot (THE EDGE, MARKET MISS, THE PATTERN, THE RISK)
 * - Game Flow narrative
 * - Risk Factors list
 * 
 * Into one cohesive block that answers the only question users care about:
 * "WHY does this edge exist, and should I trust it?"
 * 
 * Design: Single card, 3 internal layers, no redundancy.
 */

'use client';

import { useState } from 'react';
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

// ─── Types ──────────────────────────────────────────────────

interface WhyThisEdgeExistsProps {
  /** 4 snapshot bullets from AI: THE EDGE, MARKET MISS, THE PATTERN, THE RISK */
  snapshot: string[];
  /** Game flow narrative — how the match unfolds */
  gameFlow?: string;
  /** Risk factors — what could invalidate the thesis */
  riskFactors?: string[];
  /** Can the user see exact numbers? (PRO/PREMIUM only) */
  canSeeExactNumbers: boolean;
  /** Locale for i18n */
  locale?: 'en' | 'sr';
}

// ─── Bullet Parsing ─────────────────────────────────────────

interface ParsedBullet {
  type: 'edge' | 'market-miss' | 'pattern' | 'risk' | 'insight';
  label: string;
  text: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: 'bolt' | 'target' | 'chart' | 'medical' | 'lightbulb';
}

function parseBullet(raw: string, index: number, locale: 'en' | 'sr'): ParsedBullet {
  const t = translations[locale];
  const lower = raw.toLowerCase();

  // Strip the label prefix if it exists  
  const stripLabel = (text: string) =>
    text.replace(/^(THE EDGE|MARKET MISS|THE PATTERN|THE RISK|PREDNOST|TRŽIŠNI PROPUST|OBRAZAC):\s*/i, '');

  if (lower.includes('the edge:') || lower.includes('prednost:') || index === 0) {
    return {
      type: 'edge',
      label: t.edgeLabel,
      text: stripLabel(raw),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      iconName: 'bolt',
    };
  }
  if (lower.includes('market miss:') || lower.includes('tržišni propust:') || index === 1) {
    return {
      type: 'market-miss',
      label: t.marketMissLabel,
      text: stripLabel(raw),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      iconName: 'target',
    };
  }
  if (lower.includes('the pattern:') || lower.includes('obrazac:') || index === 2) {
    return {
      type: 'pattern',
      label: t.patternLabel,
      text: stripLabel(raw),
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
      iconName: 'chart',
    };
  }
  // Index 3 = THE RISK — we pull this into the risk section below, not shown as a bullet
  if (lower.includes('the risk:') || index === 3) {
    return {
      type: 'risk',
      label: '',
      text: stripLabel(raw),
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      iconName: 'medical',
    };
  }

  return {
    type: 'insight',
    label: 'INSIGHT',
    text: raw,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/20',
    iconName: 'lightbulb',
  };
}

// ─── Main Component ─────────────────────────────────────────

export default function WhyThisEdgeExists({
  snapshot,
  gameFlow,
  riskFactors = [],
  canSeeExactNumbers,
  locale = 'en',
}: WhyThisEdgeExistsProps) {
  const t = translations[locale];
  const [expanded, setExpanded] = useState(false);

  if (!snapshot || snapshot.length === 0) return null;

  // Parse bullets
  const bullets = snapshot.map((s, i) => parseBullet(s, i, locale));
  
  // Separate: first 3 are the thesis (edge, market miss, pattern)
  // 4th bullet (THE RISK) gets merged into risk factors section
  const thesisBullets = bullets.filter(b => b.type !== 'risk');
  const riskBullet = bullets.find(b => b.type === 'risk');
  
  // Combine risk bullet with explicit risk factors (dedup)
  const allRisks: string[] = [];
  if (riskBullet) allRisks.push(riskBullet.text);
  riskFactors.forEach(rf => {
    // Don't duplicate if already captured from snapshot
    if (!allRisks.some(existing => existing.toLowerCase().includes(rf.toLowerCase().slice(0, 30)))) {
      allRisks.push(rf);
    }
  });

  // Locked state for non-PRO users
  if (!canSeeExactNumbers) {
    return (
      <div className="mt-3 sm:mt-4 p-5 sm:p-6 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] relative overflow-hidden">
        {/* Header */}
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
            <div key={i} className={`p-3 rounded-xl ${bullet.bgColor} border ${bullet.borderColor}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${bullet.color}`}>{bullet.label}</span>
              <p className="text-sm text-stone-300 mt-1 line-clamp-1">
                {bullet.text.slice(0, 40)}...
              </p>
            </div>
          ))}
        </div>

        {/* Upgrade CTA overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent flex items-end justify-center pb-5">
          <p className="text-xs text-zinc-500">{t.upgradeToSee}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 sm:mt-4 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] overflow-hidden">
      {/* ─── Header ─── */}
      <div className="p-5 sm:p-6 pb-0">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/10">
            <PremiumIcon name="lightbulb" size="md" className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{t.title}</h3>
            <p className="text-[10px] text-zinc-500">{t.subtitle}</p>
          </div>
          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet-500 to-violet-400 text-white rounded-full">
            {t.proOnly}
          </span>
        </div>

        {/* ─── Thesis Bullets (THE EDGE, MARKET MISS, THE PATTERN) ─── */}
        <div className="space-y-3">
          {thesisBullets.map((bullet, i) => (
            <div 
              key={i}
              className={`p-3.5 rounded-xl ${bullet.bgColor} border ${bullet.borderColor} transition-all`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <PremiumIcon name={bullet.iconName} size="sm" className={bullet.color} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${bullet.color}`}>
                  {bullet.label}
                </span>
              </div>
              <p className="text-[15px] text-stone-200 leading-relaxed">
                {bullet.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Game Flow + Risks — collapsed by default for progressive disclosure ─── */}
      {(gameFlow || allRisks.length > 0) && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          {/* Toggle */}
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

          {/* Expandable content */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-4">

              {/* Game Flow — How it unfolds */}
              {gameFlow && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-sm">⚡</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {t.howItUnfolds}
                    </span>
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    {gameFlow}
                  </p>
                </div>
              )}

              {/* Risk Factors — What could go wrong */}
              {allRisks.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/10">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⚠️</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                        {t.whatCouldGoWrong}
                      </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/60 border border-amber-500/15">
                      {t.riskCount(allRisks.length)}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {allRisks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-stone-300/90 leading-relaxed">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
