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
  
  // Determine which side has the edge (positive edge = value)
  const homeEdge = modelProbability.home - impliedProbability.home;
  const awayEdge = modelProbability.away - impliedProbability.away;
  const hasSignificantEdge = Math.abs(homeEdge) > 5 || Math.abs(awayEdge) > 5;
  
  // Who has VALUE? (positive edge means underpriced by market)
  // If home is negative (overpriced) and away is positive (underpriced), away has value
  const favoredSide = awayEdge > homeEdge ? 'away' : homeEdge > awayEdge ? 'home' : 'even';
  const favoredTeam = favoredSide === 'home' ? homeTeam : favoredSide === 'away' ? awayTeam : null;
  
  // Edge magnitude should be the POSITIVE edge of the favored team, not the max absolute
  const edgeMagnitude = favoredSide === 'home' ? homeEdge : favoredSide === 'away' ? awayEdge : 0;

  // ============================================
  // STATE 1: GUEST (Not logged in) - Teaser skeleton (NO real numbers)
  // ============================================
  if (!isAuthenticated) {
    return (
      <div className="mt-4 sm:mt-5 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-[#0a0a0b] to-[#0a0a0b] border border-violet-500/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">🧠</span>
            </div>
            <h3 className="text-white font-semibold">{t.aiVsMarket}</h3>
          </div>
          <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs rounded-full">
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
        <div className="text-center pt-2 border-t border-zinc-800/50">
          <p className="text-zinc-400 text-sm mb-3">{t.signInToSee}</p>
          <Link
            href={`${localePath}/auth/signin`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
          >
            {t.createAccount}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="mt-4 sm:mt-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{t.aiVsMarket}</span>
          </div>
          {hasSignificantEdge && (
            <span className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
              {t.marketMispricing}
            </span>
          )}
        </div>

        {/* Direction-only message */}
        <div className="text-center py-2">
          {hasSignificantEdge && favoredTeam ? (
            <>
              <p className="text-xl font-semibold text-white mb-1 inline-flex items-center gap-1.5">
                {t.modelFavors} <span className="text-violet-400">{favoredTeam}</span>
                <span className="group relative cursor-help">
                  <svg className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 text-xs text-zinc-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal w-64 text-left z-50 shadow-xl border border-zinc-700">
                    {t.valueTooltip}
                  </span>
                </span>
              </p>
              <p className="text-sm text-zinc-400">
                {t.modelDisagrees}
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-white mb-1">
                {t.modelAgrees}
              </p>
              <p className="text-sm text-zinc-400">
                {t.fairlyPriced}
              </p>
              {/* Discipline hook for no-edge matches */}
              <p className="text-xs text-zinc-500 mt-3 max-w-sm mx-auto leading-relaxed">
                {t.disciplineHook}
              </p>
            </>
          )}
        </div>

        {/* Locked "What Pro would show" preview */}
        <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-2">
            <span>🔒</span>
            <span className="uppercase tracking-wider">{t.proWouldShow}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-600">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
              {t.exactProbDiff}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
              {t.oddsDrift}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
              {t.altMarkets}
            </li>
          </ul>
        </div>

        {/* Upgrade CTA */}
        <div className="mt-4 pt-4 border-t border-violet-500/10">
          <div className="flex items-center justify-center">
            <Link
              href={`${localePath}/pricing`}
              className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
            >
              {t.upgradeToPro}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const edgeColor = edgeMagnitude > 15 ? 'text-emerald-400' : edgeMagnitude > 8 ? 'text-green-400' : 'text-yellow-400';
  const edgeBg = edgeMagnitude > 15 ? 'bg-emerald-500/20 border-emerald-500/30' : 
                edgeMagnitude > 8 ? 'bg-green-500/20 border-green-500/30' : 
                'bg-yellow-500/20 border-yellow-500/30';

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-emerald-500/5 border border-violet-500/20 p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{t.aiVsMarket}</span>
        </div>
        <span className="text-[9px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">
          {t.pro}
        </span>
      </div>

      {/* Main Edge Display */}
      {hasSignificantEdge && favoredTeam ? (
        <div className="text-center mb-5">
          <p className="text-sm text-zinc-400 mb-1 inline-flex items-center gap-1.5">
            {t.modelFavors}
            <span className="group relative cursor-help">
              <svg className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 text-xs text-zinc-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal w-64 text-left z-50 shadow-xl border border-zinc-700">
                {t.valueTooltip}
              </span>
            </span>
          </p>
          <p className="text-2xl font-bold text-white mb-2">{favoredTeam}</p>
          
          {/* Edge Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${edgeBg}`}>
            <span className={`text-xl font-bold ${edgeColor}`}>
              +{edgeMagnitude.toFixed(1)}%
            </span>
            <span className="text-sm text-zinc-300">{t.edgeDetected}</span>
          </div>
        </div>
      ) : (
        <div className="text-center mb-5">
          <p className="text-xl font-semibold text-white mb-1">{t.modelAgrees}</p>
          <p className="text-sm text-zinc-400">{t.fairlyPriced}</p>
        </div>
      )}

      {/* Probability Comparison Grid */}
      {canSeeExactNumbers && modelProbability && impliedProbability && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Home */}
          <ProbabilityCard
            label={homeTeam || 'Home'}
            modelProb={modelProbability.home}
            marketProb={impliedProbability.home}
            t={t}
          />
          
          {/* Away */}
          <ProbabilityCard
            label={awayTeam || 'Away'}
            modelProb={modelProbability.away}
            marketProb={impliedProbability.away}
            t={t}
          />
          
          {/* Draw (if applicable) */}
          {hasDraw && modelProbability.draw !== undefined && impliedProbability.draw !== undefined && (
            <div className="col-span-2">
              <ProbabilityCard
                label="Draw"
                modelProb={modelProbability.draw}
                marketProb={impliedProbability.draw}
                t={t}
                isFullWidth
              />
            </div>
          )}
        </div>
      )}
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
  isFullWidth?: boolean;
}

function ProbabilityCard({ label, modelProb, marketProb, t, isFullWidth }: ProbabilityCardProps) {
  const diff = modelProb - marketProb;
  const isValue = diff > 3;
  const isOverpriced = diff < -3;
  
  return (
    <div className={`p-3 rounded-xl bg-[#0a0a0b]/50 border border-white/[0.04] ${isFullWidth ? 'text-center' : ''}`}>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
      
      <div className="flex items-center justify-between gap-2">
        {/* Model Probability */}
        <div>
          <p className="text-[9px] text-zinc-600 mb-0.5">{t.winProb}</p>
          <p className={`text-lg font-bold ${isValue ? 'text-emerald-400' : isOverpriced ? 'text-red-400' : 'text-white'}`}>
            {modelProb.toFixed(1)}%
          </p>
        </div>
        
        {/* vs */}
        <span className="text-zinc-600 text-xs">vs</span>
        
        {/* Market Implied */}
        <div className="text-right">
          <p className="text-[9px] text-zinc-600 mb-0.5">{t.marketImplied}</p>
          <p className="text-lg font-medium text-zinc-400">
            {marketProb.toFixed(1)}%
          </p>
        </div>
      </div>
      
      {/* Edge indicator */}
      {Math.abs(diff) > 3 && (
        <div className={`text-[10px] mt-2 ${isValue ? 'text-emerald-400' : 'text-red-400'}`}>
          {isValue ? `+${diff.toFixed(1)}% ${t.value}` : `${diff.toFixed(1)}%`}
        </div>
      )}
    </div>
  );
}

export default AIvsMarketHero;
