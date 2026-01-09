/**
 * AI vs Market Hero Component
 * 
 * THE conversion hook - shows above the fold, right after match header.
 * This is where users see "The market is wrong, our model disagrees."
 * 
 * 3-tier access:
 * - Guest (not logged in): Blurred teaser with CTA
 * - Registered FREE: Direction only ("Model favors Home over Market")
 * - PRO: Exact Win Prob % and Edge Magnitude %
 */

'use client';

import Link from 'next/link';
import type { MarketIntel } from '@/lib/value-detection';
import { colors, getEdgeStyle, getOverpricedStyle } from '@/lib/design-system';

type Locale = 'en' | 'sr';

const translations = {
  en: {
    aiVsMarket: 'AI vs Market',
    modelFavors: 'Edge detected on',
    overMarket: 'over market',
    modelAgrees: 'Model agrees with market',
    marketMispricing: 'Market Mispricing Detected',
    fairlyPriced: 'Market looks fairly priced',
    winProb: 'Win Prob',
    marketImplied: 'Market',
    edgeDetected: 'edge detected',
    value: 'value',
    signInToSee: 'Sign in to see our AI analysis',
    signIn: 'Sign In',
    createAccount: 'Create Free Account',
    upgradeToSee: 'Upgrade to see exact probabilities',
    upgradeToPro: 'Upgrade to Pro',
    pro: 'PRO',
    modelDisagrees: 'Model disagrees with market pricing',
    exactEdge: 'See exactly where the market is wrong',
    // Discipline hook
    disciplineHook: 'Pro confirms when NOT to bet — avoiding false edges is part of long-term profitability.',
    // Locked preview
    proWouldShow: 'Pro would show',
    exactProbDiff: 'Exact probability difference',
    oddsDrift: 'Whether odds drift creates late value',
    altMarkets: 'Alternative markets (O/U, AH)',
    // Value tooltip
    valueTooltip: 'Value ≠ Favorite. A team can be the underdog while offering value if the market underprices their chances.',
  },
  sr: {
    aiVsMarket: 'AI vs Tržište',
    modelFavors: 'Prednost otkrivena na',
    overMarket: 'u odnosu na tržište',
    modelAgrees: 'Model se slaže sa tržištem',
    marketMispricing: 'Otkrivena Tržišna Greška',
    fairlyPriced: 'Tržište izgleda fer procenjeno',
    winProb: 'Verovatnoća',
    marketImplied: 'Tržište',
    edgeDetected: 'prednost otkrivena',
    value: 'vrednost',
    signInToSee: 'Prijavi se da vidiš AI analizu',
    signIn: 'Prijavi se',
    createAccount: 'Napravi Besplatan Nalog',
    upgradeToSee: 'Nadogradi da vidiš tačne verovatnoće',
    upgradeToPro: 'Nadogradi na Pro',
    pro: 'PRO',
    modelDisagrees: 'Model se ne slaže sa tržišnom cenom',
    exactEdge: 'Vidi tačno gde tržište greši',
    // Discipline hook
    disciplineHook: 'Pro potvrđuje kada NE kladiti se — izbegavanje lažnih prednosti je deo dugoročne profitabilnosti.',
    // Locked preview
    proWouldShow: 'Pro bi pokazao',
    exactProbDiff: 'Tačnu razliku verovatnoća',
    oddsDrift: 'Da li pomeranje kvota stvara kasnu vrednost',
    altMarkets: 'Alternativna tržišta (O/U, AH)',
    // Value tooltip
    valueTooltip: 'Vrednost ≠ Favorit. Tim može biti autsajder, a ipak nuditi vrednost ako tržište potcenjuje njihove šanse.',
  },
};

interface AIvsMarketHeroProps {
  marketIntel: MarketIntel | null;
  homeTeam: string;
  awayTeam: string;
  hasDraw?: boolean;
  // Access control
  isAuthenticated: boolean;
  canSeeExactNumbers: boolean; // true only for PRO
  locale?: Locale;
}

export function AIvsMarketHero({
  marketIntel,
  homeTeam,
  awayTeam,
  hasDraw = true,
  isAuthenticated,
  canSeeExactNumbers,
  locale = 'en',
}: AIvsMarketHeroProps) {
  const t = translations[locale];
  const localePath = locale === 'sr' ? '/sr' : '';

  // If no market data, show placeholder
  if (!marketIntel) {
    return null;
  }

  const { modelProbability, impliedProbability, valueEdge } = marketIntel;
  
  // Use valueEdge from marketIntel for consistency across the page
  // valueEdge.edgePercent already includes bookmaker quality adjustment
  const hasSignificantEdge = valueEdge.strength !== 'none' && valueEdge.edgePercent > 3;
  
  // Who has VALUE? Use valueEdge.outcome for consistency
  const favoredSide = valueEdge.outcome || 'even';
  const favoredTeam = favoredSide === 'home' ? homeTeam : favoredSide === 'away' ? awayTeam : null;
  
  // Edge magnitude from the unified valueEdge calculation
  const edgeMagnitude = valueEdge.edgePercent || 0;

  // ============================================
  // STATE 1: GUEST (Not logged in) - Teaser skeleton (NO real numbers)
  // ============================================
  if (!isAuthenticated) {
    return (
      <div className="mt-4 sm:mt-5 p-6 sm:p-7 rounded-2xl bg-[#0a0a0b] border border-violet-500/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">🧠</span>
            </div>
            <h3 className="text-lg text-white font-bold">{t.aiVsMarket}</h3>
          </div>
          <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-sm font-medium rounded-full">
            🔒 {locale === 'sr' ? 'Zaključano' : 'Locked'}
          </span>
        </div>
        
        {/* Teaser skeleton - NO real data rendered */}
        <div className="space-y-3 mb-4">
          <div className="h-6 bg-zinc-800/50 rounded-lg w-3/4 animate-pulse" />
          <div className="flex gap-4">
            <div className="flex-1 h-16 bg-zinc-800/50 rounded-lg animate-pulse" />
            <div className="flex-1 h-16 bg-zinc-800/50 rounded-lg animate-pulse" />
          </div>
          <div className="h-4 bg-zinc-800/50 rounded w-1/2 animate-pulse" />
        </div>
        
        {/* CTA */}
        <div className="text-center pt-4 border-t border-white/[0.06]">
          <p className="text-zinc-300 text-base mb-4">{t.signInToSee}</p>
          <Link
            href={`${localePath}/auth/signin`}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-base font-semibold transition-colors min-h-[48px]"
          >
            {t.createAccount}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // ============================================
  // STATE 2: REGISTERED FREE - Direction only, no exact %
  // ============================================
  if (!canSeeExactNumbers) {
    return (
      <div className="mt-4 sm:mt-5 rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-lg opacity-60">🧠</span>
            <span className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">{t.aiVsMarket}</span>
          </div>
          {hasSignificantEdge && (
            <span className="text-xs px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 font-semibold">
              {t.marketMispricing}
            </span>
          )}
        </div>

        {/* Direction-only message */}
        <div className="text-center py-3">
          {hasSignificantEdge && favoredTeam ? (
            <>
              <p className="text-base text-zinc-300 mb-2 inline-flex items-center gap-2">
                {t.modelFavors} <span className="text-white font-bold text-lg">{favoredTeam}</span>
                <span className="group relative cursor-help">
                  <svg className="w-4 h-4 text-zinc-600 hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="absolute bottom-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 text-xs text-zinc-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal w-64 max-w-[calc(100vw-2rem)] text-left z-50 shadow-xl border border-zinc-700">
                    {t.valueTooltip}
                  </span>
                </span>
              </p>
              <p className="text-base text-zinc-400">
                {t.modelDisagrees}
              </p>
            </>
          ) : (
            <>
              {/* No edge - discipline signal with neutral violet (PRO color) */}
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-3 rounded-full bg-violet-500/10 border border-violet-500/20">
                <span className="text-violet-400 text-sm">⚖️</span>
                <span className="text-violet-300 font-semibold text-sm">DISCIPLINE SIGNAL</span>
              </div>
              <p className="text-xl font-bold text-white mb-2">
                {t.modelAgrees}
              </p>
              <p className="text-base text-zinc-400">
                {t.fairlyPriced}
              </p>
              {/* Discipline hook for no-edge matches */}
              <p className="text-sm text-zinc-500 mt-4 max-w-md mx-auto leading-relaxed">
                {t.disciplineHook}
              </p>
            </>
          )}
        </div>

        {/* Locked "What Pro would show" preview */}
        <div className="mt-5 p-4 bg-[#0a0a0b] border border-white/[0.06] rounded-xl">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
            <span>🔒</span>
            <span className="uppercase tracking-wider font-semibold">{t.proWouldShow}</span>
          </div>
          <ul className="space-y-2 text-sm text-zinc-500">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              {t.exactProbDiff}
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              {t.oddsDrift}
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              {t.altMarkets}
            </li>
          </ul>
        </div>

        {/* Upgrade CTA */}
        <div className="mt-5 pt-5 border-t border-violet-500/10">
          <div className="flex items-center justify-center">
            <Link
              href={`${localePath}/pricing`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-base font-semibold transition-colors min-h-[48px]"
            >
              {t.upgradeToPro}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STATE 3: PRO - Full exact numbers with labels
  // ============================================
  return (
    <div className="mt-4 sm:mt-5">
      <HeroContent
        t={t}
        hasSignificantEdge={hasSignificantEdge}
        favoredTeam={favoredTeam}
        edgeMagnitude={edgeMagnitude}
        modelProb={favoredSide === 'home' ? modelProbability.home : modelProbability.away}
        marketProb={favoredSide === 'home' ? impliedProbability.home : impliedProbability.away}
        canSeeExactNumbers={true}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        modelProbability={modelProbability}
        impliedProbability={impliedProbability}
        hasDraw={hasDraw}
      />
    </div>
  );
}

// ============================================
// Internal Hero Content Component
// ============================================

interface HeroContentProps {
  t: typeof translations['en'];
  hasSignificantEdge: boolean;
  favoredTeam: string | null;
  edgeMagnitude: number;
  modelProb: number;
  marketProb: number;
  canSeeExactNumbers: boolean;
  homeTeam?: string;
  awayTeam?: string;
  modelProbability?: { home: number; away: number; draw?: number };
  impliedProbability?: { home: number; away: number; draw?: number };
  hasDraw?: boolean;
}

function HeroContent({
  t,
  hasSignificantEdge,
  favoredTeam,
  edgeMagnitude,
  modelProb,
  marketProb,
  canSeeExactNumbers,
  homeTeam,
  awayTeam,
  modelProbability,
  impliedProbability,
  hasDraw,
}: HeroContentProps) {
  // Use unified design system - emerald for ALL edges, intensity via opacity
  const edgeStyle = getEdgeStyle(edgeMagnitude, true);
  const hasEdge = edgeStyle.tier !== 'none';

  return (
    <div className={`rounded-2xl border p-6 sm:p-7 bg-[#0a0a0b] ${hasSignificantEdge ? 'border-emerald-500/20' : 'border-white/[0.06]'}`}>
      {/* Header - muted label */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-lg opacity-60">🧠</span>
          <span className="matrix-label">{t.aiVsMarket}</span>
        </div>
        <span className="matrix-dim px-2.5 py-0.5 rounded-full border border-violet-500/20">
          {t.pro}
        </span>
      </div>

      {/* Main Verdict - Primary text, used sparingly */}
      {hasSignificantEdge && favoredTeam ? (
        <div className="text-center mb-6">
          {/* Primary verdict text - the ONE thing that stands out */}
          <p className="text-2xl sm:text-3xl font-bold text-white mb-3">{favoredTeam}</p>
          
          {/* Edge Badge - uses unified emerald color system */}
          <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border ${edgeStyle.bg} ${edgeStyle.border} mb-3`}>
            <span className={`text-base font-semibold ${edgeStyle.text}`}>
              {edgeStyle.label}
            </span>
            <span className="group relative cursor-help">
              <svg className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="absolute bottom-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 text-sm text-zinc-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal w-64 max-w-[calc(100vw-2rem)] text-left z-50 shadow-xl border border-zinc-700">
                {t.valueTooltip}
              </span>
            </span>
          </div>
          
          {/* Guidance line - turns insight into action */}
          <p className="text-sm text-zinc-500">
            Only one outcome shows positive expected value
          </p>
        </div>
      ) : (
        <div className="text-center mb-6">
          {/* No edge verdict - uses violet (PRO color) */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-4 rounded-full bg-violet-500/10 border border-violet-500/20">
            <span className="text-violet-400 text-base">⚖️</span>
            <span className="text-violet-300 font-semibold text-base">DISCIPLINE SIGNAL</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white mb-2">No Exploitable Edge</p>
          <p className="text-base text-zinc-400">{t.fairlyPriced}</p>
        </div>
      )}

      {/* Probability Comparison Grid - Vertical Cards in Row */}
      {canSeeExactNumbers && modelProbability && impliedProbability && (() => {
        // Calculate which outcome has the best value edge
        const edges = {
          home: modelProbability.home - impliedProbability.home,
          away: modelProbability.away - impliedProbability.away,
          draw: hasDraw && modelProbability.draw !== undefined && impliedProbability.draw !== undefined 
            ? modelProbability.draw - impliedProbability.draw 
            : -Infinity
        };
        const maxEdge = Math.max(edges.home, edges.away, edges.draw);
        const bestValue = maxEdge > 5 
          ? (edges.home === maxEdge ? 'home' : edges.away === maxEdge ? 'away' : 'draw')
          : null;
        
        return (
          <div className={`grid gap-3 mt-4 ${hasDraw && modelProbability.draw !== undefined ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {/* Home */}
            <ProbabilityCard
              label={homeTeam || 'Home'}
              modelProb={modelProbability.home}
              marketProb={impliedProbability.home}
              t={t}
              isBestValue={bestValue === 'home'}
            />
            
            {/* Draw (if applicable) - in middle */}
            {hasDraw && modelProbability.draw !== undefined && impliedProbability.draw !== undefined && (
              <ProbabilityCard
                label="Draw"
                modelProb={modelProbability.draw}
                marketProb={impliedProbability.draw}
                t={t}
                isBestValue={bestValue === 'draw'}
              />
            )}
            
            {/* Away */}
            <ProbabilityCard
              label={awayTeam || 'Away'}
              modelProb={modelProbability.away}
              marketProb={impliedProbability.away}
              t={t}
              isBestValue={bestValue === 'away'}
            />
          </div>
        );
      })()}
    </div>
  );
}

// ============================================
// Probability Card Component
// ============================================

interface ProbabilityCardProps {
  label: string;
  modelProb: number;
  marketProb: number;
  t: typeof translations['en'];
  isBestValue?: boolean;
}

function ProbabilityCard({ label, modelProb, marketProb, t, isBestValue = false }: ProbabilityCardProps) {
  const diff = modelProb - marketProb;
  
  // Use unified design system
  const edgeStyle = getEdgeStyle(diff, isBestValue);
  const overStyle = getOverpricedStyle(diff);
  const hasEdge = edgeStyle.tier !== 'none';
  const isOverpriced = diff < -3;
  const isNeutral = !hasEdge && !isOverpriced;
  
  // Edge badge styling - all edges use emerald now
  const edgeBadgeClass = hasEdge 
    ? `${edgeStyle.bg} ${edgeStyle.text} ${edgeStyle.border}`
    : isOverpriced 
      ? `${colors.neutral.bg} ${colors.negative.textMuted} ${colors.neutral.border}`
      : `${colors.neutral.bg} ${colors.neutral.text} ${colors.neutral.border}`;
  
  // Card styling - best value gets emerald glow
  const cardClass = isBestValue && hasEdge
    ? `bg-[#0a0a0b] border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2),0_0_60px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20`
    : 'bg-[#0a0a0b] border-white/[0.04] opacity-[0.65]';
  
  return (
    <div className={`flex flex-col min-h-[200px] p-3 sm:p-4 rounded-xl border ${cardClass}`}>
      {/* Team/Outcome Name - Header */}
      <div className="h-10 sm:h-11 mb-2 flex items-center justify-center">
        <p 
          className="text-sm sm:text-base font-semibold text-white leading-tight line-clamp-2 text-center"
          title={label}
        >
          {label}
        </p>
      </div>
      
      {/* Bar Chart with Percentages Above Each Bar */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Percentages row - aligned with bars below */}
        <div className="flex justify-center gap-3 mb-1">
          <div className="w-12 text-center">
            <span className="text-xs font-medium tabular-nums text-white whitespace-nowrap">
              {marketProb.toFixed(1)}%
            </span>
          </div>
          <div className="w-12 text-center">
            <span className="text-sm font-bold tabular-nums text-gradient-gold whitespace-nowrap">
              {modelProb.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {/* Bars row - contained within fixed height, scaled to max 100% */}
        <div className="flex justify-center items-end gap-3 h-16">
          {/* Market Bar - height scaled: max bar = 64px when prob = 100% */}
          <div 
            className="w-12 bg-zinc-700/50 rounded-t-sm transition-all duration-300 ease-out"
            style={{ height: `${Math.max((marketProb / 100) * 64, 8)}px` }}
          />
          {/* Model Bar - unified emerald for all edges, rose for overpriced */}
          <div 
            className={`w-12 rounded-t-sm transition-all duration-300 ease-out ${
              hasEdge 
                ? edgeStyle.barColor
                : isOverpriced 
                  ? 'bg-rose-400/50'
                  : 'bg-zinc-400'
            }`}
            style={{ height: `${Math.max((modelProb / 100) * 64, 8)}px` }}
          />
        </div>
        
        {/* Labels row - below bars */}
        <div className="flex justify-center gap-3 mt-1">
          <span className="w-12 text-center matrix-dim">Market</span>
          <span className="w-12 text-center matrix-label">Model</span>
        </div>
      </div>
      
      {/* Edge Badge - Footer, contained within card */}
      <div className="mt-3 pt-2 border-t border-white/5">
        <div 
          className={`px-2 py-1 rounded-md border text-center text-[10px] font-semibold truncate ${edgeBadgeClass}`}
          title={isNeutral 
            ? 'Fair price - no significant edge detected' 
            : hasEdge 
              ? `+${diff.toFixed(1)}% edge - model probability exceeds market by ${diff.toFixed(1)}%`
              : `${diff.toFixed(1)}% overpriced - market probability exceeds model by ${Math.abs(diff).toFixed(1)}%`
          }
        >
          {isNeutral 
            ? 'Fair price' 
            : hasEdge 
              ? edgeStyle.badge
              : `−${Math.abs(diff).toFixed(0)}% over`
          }
        </div>
      </div>
    </div>
  );
}

export default AIvsMarketHero;
