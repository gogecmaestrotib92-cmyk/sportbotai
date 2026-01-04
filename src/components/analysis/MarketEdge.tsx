/**
 * Premium Edge Visual Components
 * 
 * Visual displays for the paywall-worthy content:
 * 1. Value Detection - "Here's where the market is wrong"
 * 2. Model vs Market - "Here's the probability we calculated"
 * 3. Market Summary - Overall recommendation
 */

'use client';

import React from 'react';
import type { MarketIntel, OddsData } from '@/lib/value-detection';
import { formatProb, formatOdds, getRecommendationColor, getRecommendationLabel } from '@/lib/value-detection';

type Locale = 'en' | 'sr';

const translations = {
  en: {
    fairPrice: 'Fair Price',
    market: 'Market',
    model: 'Model',
    value: 'value',
    overpriced: 'overpriced',
    marketEdge: 'Execution Breakdown',
    executionLayer: 'Execution layer — use for stake sizing & timing',
    currentOdds: 'Current Odds',
    modelVsMarket: 'Model vs Market',
    draw: 'Draw',
    home: 'Home',
    away: 'Away',
    marketVerdict: 'Calibration Check',
    bookmakerMargin: 'Bookmaker margin',
    signalQuality: 'Model Confidence',
    premiumEdgeData: 'Pricing Analysis',
    seeWhereMarketWrong: 'See detailed pricing breakdown',
    unlockPro: 'Unlock Pro',
    via: 'via',
    noEdgeExplanation: 'Even when the market is efficient, confirming alignment avoids false edges and overbetting.',
    marketEfficient: 'Market appears efficient',
    // Collapsed state for FREE
    executionLocked: 'Execution details available in Pro',
    executionLockedDesc: 'Exact odds, calibration & thresholds',
  },
  sr: {
    fairPrice: 'Fer Cena',
    market: 'Tržište',
    model: 'Model',
    value: 'vrednost',
    overpriced: 'precenjeno',
    marketEdge: 'Analiza Izvršenja',
    executionLayer: 'Sloj izvršenja — za dimenzioniranje uloga i tajming',
    currentOdds: 'Trenutne Kvote',
    modelVsMarket: 'Model vs Tržište',
    draw: 'Nerešeno',
    home: 'Domaćin',
    away: 'Gost',
    marketVerdict: 'Provera Kalibracije',
    bookmakerMargin: 'Kladioničarska marža',
    signalQuality: 'Pouzdanost Modela',
    premiumEdgeData: 'Analiza Cena',
    seeWhereMarketWrong: 'Vidite detaljnu analizu cena',
    unlockPro: 'Otključaj Pro',
    via: 'preko',
    noEdgeExplanation: 'Čak i kada je tržište efikasno, potvrda usklađenosti izbegava lažne prednosti i prekomerno klađenje.',
    marketEfficient: 'Tržište deluje efikasno',
    // Collapsed state for FREE
    executionLocked: 'Detalji izvršenja dostupni u Pro',
    executionLockedDesc: 'Tačne kvote, kalibracija i pragovi',
  },
};

// ============================================
// VALUE BADGE
// ============================================

interface ValueBadgeProps {
  valueEdge: MarketIntel['valueEdge'];
  locale?: Locale;
}

export function ValueBadge({ valueEdge, locale = 'en' }: ValueBadgeProps) {
  const t = translations[locale];
  
  if (!valueEdge.outcome || valueEdge.strength === 'none') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800/50 text-zinc-500 text-sm">
        <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
        <span>{t.fairPrice}</span>
      </div>
    );
  }

  const colorMap = {
    strong: 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/20',
    moderate: 'bg-emerald-500/10 text-emerald-400/70 border-emerald-500/15',
    slight: 'bg-amber-500/10 text-amber-400/70 border-amber-500/15',
    none: 'bg-zinc-800/50 text-zinc-500 border-zinc-700/30',
  };

  const dotColor = {
    strong: 'bg-emerald-400/80',
    moderate: 'bg-emerald-400/60',
    slight: 'bg-amber-400/60',
    none: 'bg-zinc-500',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border ${colorMap[valueEdge.strength]}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor[valueEdge.strength]}`}></span>
      <span className="text-sm font-semibold">{valueEdge.label}</span>
    </div>
  );
}

// ============================================
// PROBABILITY COMPARISON BAR
// ============================================

interface ProbabilityCompareProps {
  modelProb: number;
  marketProb: number;
  label: string; // "Home" | "Away" | "Draw"
  teamName?: string;
  locale?: Locale;
  canSeeExactNumbers?: boolean; // PRO only - show exact percentages
}

export function ProbabilityCompare({ modelProb, marketProb, label, teamName, locale = 'en', canSeeExactNumbers = false }: ProbabilityCompareProps) {
  const t = translations[locale];
  const diff = modelProb - marketProb;
  const isValue = diff > 3;
  const isOverpriced = diff < -3;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-base font-medium">{teamName || label}</span>
        <div className="flex items-center gap-4">
          {canSeeExactNumbers ? (
            <>
              <span className="text-gray-500 text-sm">{t.market}: {marketProb}%</span>
              <span className={`font-bold text-base ${isValue ? 'text-green-400' : isOverpriced ? 'text-red-400' : 'text-white'}`}>
                {t.model}: {modelProb}%
              </span>
            </>
          ) : (
            <span className={`font-semibold text-base ${isValue ? 'text-green-400' : isOverpriced ? 'text-red-400' : 'text-zinc-400'}`}>
              {isValue ? 'Value detected' : isOverpriced ? 'Overpriced' : 'Fair price'}
            </span>
          )}
        </div>
      </div>
      
      {/* Comparison bar */}
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
        {/* Market probability (gray) */}
        <div 
          className="absolute top-0 left-0 h-full bg-zinc-700 rounded-full"
          style={{ width: `${marketProb}%` }}
        />
        {/* Model probability (colored) */}
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all ${
            isValue ? 'bg-emerald-600/80' : isOverpriced ? 'bg-red-600/80' : 'bg-zinc-500'
          }`}
          style={{ width: `${modelProb}%` }}
        />
      </div>

      {/* Edge indicator - PRO only */}
      {canSeeExactNumbers && Math.abs(diff) > 3 && (
        <div className={`text-sm font-semibold ${isValue ? 'text-green-400' : 'text-red-400'}`}>
          {isValue ? `+${diff.toFixed(1)}% ${t.value}` : `${diff.toFixed(1)}% ${t.overpriced}`}
        </div>
      )}
    </div>
  );
}

// ============================================
// MODEL VS MARKET PANEL
// ============================================

interface ModelVsMarketProps {
  marketIntel: MarketIntel;
  homeTeam: string;
  awayTeam: string;
  hasDraw?: boolean;
  locale?: Locale;
  canSeeExactNumbers?: boolean; // PRO only
}

export function ModelVsMarket({ marketIntel, homeTeam, awayTeam, hasDraw = true, locale = 'en', canSeeExactNumbers = false }: ModelVsMarketProps) {
  const t = translations[locale];
  const { modelProbability, impliedProbability } = marketIntel;

  return (
    <div className="space-y-4">
      <ProbabilityCompare
        modelProb={modelProbability.home}
        marketProb={impliedProbability.home}
        label={t.home}
        teamName={homeTeam}
        locale={locale}
        canSeeExactNumbers={canSeeExactNumbers}
      />
      
      {hasDraw && modelProbability.draw !== undefined && impliedProbability.draw !== undefined && (
        <ProbabilityCompare
          modelProb={modelProbability.draw}
          marketProb={impliedProbability.draw}
          label={t.draw}
          locale={locale}
          canSeeExactNumbers={canSeeExactNumbers}
        />
      )}
      
      <ProbabilityCompare
        modelProb={modelProbability.away}
        marketProb={impliedProbability.away}
        label={t.away}
        teamName={awayTeam}
        locale={locale}
        canSeeExactNumbers={canSeeExactNumbers}
      />
    </div>
  );
}

// ============================================
// ODDS DISPLAY
// ============================================

interface OddsDisplayProps {
  odds: OddsData;
  homeTeam: string;
  awayTeam: string;
  hasDraw?: boolean;
  locale?: Locale;
}

// Helper to check if odds are valid (reasonable range for betting odds)
function isValidOdds(odds: number | undefined): boolean {
  if (odds === undefined || odds === null) return false;
  // Valid decimal odds typically range from 1.01 to ~100
  // Odds of 1.00 (100% prob) or 400+ are clearly errors
  return odds > 1.00 && odds <= 100;
}

export function OddsDisplay({ odds, homeTeam, awayTeam, hasDraw = true, locale = 'en' }: OddsDisplayProps) {
  const t = translations[locale];
  
  // Validate odds - if any are invalid, show unavailable message
  const hasValidOdds = isValidOdds(odds.homeOdds) && isValidOdds(odds.awayOdds) && 
    (!hasDraw || !odds.drawOdds || isValidOdds(odds.drawOdds));
  
  if (!hasValidOdds) {
    return (
      <div className="p-4 bg-zinc-800/30 rounded-lg text-center">
        <p className="text-zinc-500 text-base">
          {locale === 'sr' ? 'Kvote trenutno nedostupne' : 'Odds currently unavailable'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      <div className="flex-1 text-center p-3 bg-zinc-800/40 rounded-xl min-w-0">
        <div className="text-zinc-500 text-xs sm:text-sm mb-1.5 truncate font-medium">{homeTeam}</div>
        <div className="text-zinc-200 font-mono font-bold text-base sm:text-lg">{formatOdds(odds.homeOdds)}</div>
      </div>
      
      {hasDraw && odds.drawOdds && (
        <div className="flex-1 text-center p-3 bg-zinc-800/40 rounded-xl min-w-0">
          <div className="text-zinc-500 text-xs sm:text-sm mb-1.5 font-medium">{t.draw}</div>
          <div className="text-zinc-200 font-mono font-bold text-base sm:text-lg">{formatOdds(odds.drawOdds)}</div>
        </div>
      )}
      
      <div className="flex-1 text-center p-3 bg-zinc-800/40 rounded-xl min-w-0">
        <div className="text-zinc-500 text-xs sm:text-sm mb-1.5 truncate font-medium">{awayTeam}</div>
        <div className="text-zinc-200 font-mono font-bold text-base sm:text-lg">{formatOdds(odds.awayOdds)}</div>
      </div>
    </div>
  );
}

// ============================================
// RECOMMENDATION CARD
// ============================================

interface RecommendationCardProps {
  marketIntel: MarketIntel;
  locale?: Locale;
}

export function RecommendationCard({ marketIntel, locale = 'en' }: RecommendationCardProps) {
  const t = translations[locale];
  const badgeColor = getRecommendationColor(marketIntel.recommendation);
  const badgeLabel = getRecommendationLabel(marketIntel.recommendation);

  return (
    <div className="p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">{t.marketVerdict}</span>
        <span className={`px-3 py-1 rounded text-xs font-bold ${badgeColor}`}>
          {badgeLabel}
        </span>
      </div>
      
      <p className="text-zinc-300 text-base leading-relaxed">
        {marketIntel.summary}
      </p>
      
      {/* Conflict Explanation - explains when value is on non-favored team */}
      {marketIntel.conflictExplanation && (
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 text-base">💡</span>
            <p className="text-amber-200/90 text-base leading-relaxed">
              {marketIntel.conflictExplanation}
            </p>
          </div>
        </div>
      )}
      
      {marketIntel.impliedProbability.margin && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{t.bookmakerMargin}:</span>
          <span className="font-mono font-medium">{marketIntel.impliedProbability.margin}%</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// FULL MARKET INTEL SECTION
// ============================================

interface MarketIntelSectionProps {
  marketIntel: MarketIntel;
  odds: OddsData;
  homeTeam: string;
  awayTeam: string;
  hasDraw?: boolean;
  canSeeAnalysis?: boolean; // logged in or used daily unlock
  canSeeExactNumbers?: boolean; // PRO only
  locale?: Locale;
}

export function MarketIntelSection({ 
  marketIntel, 
  odds, 
  homeTeam, 
  awayTeam, 
  hasDraw = true,
  canSeeAnalysis = false,
  canSeeExactNumbers = false,
  locale = 'en'
}: MarketIntelSectionProps) {
  const t = translations[locale];
  
  // Guest: Show teaser skeleton (no real numbers rendered at all)
  if (!canSeeAnalysis) {
    return (
      <div className="space-y-6 p-7 bg-[#0a1a0a] border border-[#1a3a1a] rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-white text-lg font-bold flex items-center gap-3">
            <span className="text-xl">📊</span>
            {t.marketEdge}
          </h3>
          <span className="px-4 py-2 rounded-full bg-[#1a2a1a] text-gray-400 text-sm font-medium">
            🔒 {locale === 'sr' ? 'Zaključano' : 'Locked'}
          </span>
        </div>
        
        {/* Teaser skeleton - no real data */}
        <div className="space-y-4">
          <div className="h-14 bg-[#1a2a1a] rounded-xl animate-pulse" />
          <div className="h-24 bg-[#1a2a1a] rounded-xl animate-pulse" />
          <div className="h-20 bg-[#1a2a1a] rounded-xl animate-pulse" />
        </div>
        
        {/* CTA */}
        <div className="text-center py-5">
          <p className="text-gray-300 text-base mb-4">{t.seeWhereMarketWrong}</p>
          <a 
            href="/auth/signin" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-base font-semibold transition-colors"
          >
            {locale === 'sr' ? 'Prijavi se besplatno' : 'Sign in free'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  // Logged in (free or pro) - show full content with appropriate number visibility
  return (
    <MarketIntelContent 
      marketIntel={marketIntel}
      odds={odds}
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      hasDraw={hasDraw}
      locale={locale}
      canSeeExactNumbers={canSeeExactNumbers}
    />
  );
}

// Internal component for the actual content
interface MarketIntelContentProps {
  marketIntel: MarketIntel;
  odds: OddsData;
  homeTeam: string;
  awayTeam: string;
  hasDraw?: boolean;
  locale?: Locale;
  canSeeExactNumbers?: boolean;
}

function MarketIntelContent({ 
  marketIntel, 
  odds, 
  homeTeam, 
  awayTeam, 
  hasDraw,
  locale = 'en',
  canSeeExactNumbers = false
}: MarketIntelContentProps) {
  const t = translations[locale];
  const hasNoEdge = !marketIntel.valueEdge.outcome || marketIntel.valueEdge.strength === 'none';
  
  // FREE users see collapsed version (odds only, analysis locked)
  if (!canSeeExactNumbers) {
    return (
      <div className="p-5 bg-[#0c0c0d] border border-zinc-800/60 rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-zinc-400 font-medium flex items-center gap-2 text-sm">
            <span className="text-base opacity-40">📊</span>
            {t.marketEdge}
          </h3>
          <span className="px-2 py-0.5 bg-zinc-800/50 text-zinc-500 text-[10px] rounded">
            🔒 PRO
          </span>
        </div>
        
        {/* Current Odds - always visible (public data) */}
        <div className="mb-4">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">{t.currentOdds}</div>
          <OddsDisplay 
            odds={odds} 
            homeTeam={homeTeam} 
            awayTeam={awayTeam} 
            hasDraw={hasDraw}
            locale={locale}
          />
          {odds.bookmaker && (
            <div className="text-zinc-600 text-xs mt-1">{t.via} {odds.bookmaker}</div>
          )}
        </div>
        
        {/* Locked analysis section */}
        <div className="p-4 bg-zinc-900/50 border border-zinc-800/30 rounded-lg">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <span>🔒</span>
            <span className="text-xs font-medium">{t.executionLocked}</span>
          </div>
          <p className="text-zinc-600 text-xs">{t.executionLockedDesc}</p>
          <a 
            href={locale === 'sr' ? '/sr/pricing' : '/pricing'}
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            {t.unlockPro}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    );
  }
  
  // PRO users see full content
  return (
    <div className="space-y-5 p-5 bg-[#0c0c0d] border border-zinc-800/60 rounded-xl">
      {/* PRO Execution Layer Label */}
      {canSeeExactNumbers && (
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-widest">
          <span>🔬</span>
          <span>{t.executionLayer}</span>
        </div>
      )}
      
      {/* Header with Value Badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-zinc-300 font-medium flex items-center gap-2 text-sm">
          <span className="text-base opacity-60">📊</span>
          {t.marketEdge}
        </h3>
        <ValueBadge valueEdge={marketIntel.valueEdge} locale={locale} />
      </div>
      
      {/* No Edge Explanation - discipline signal */}
      {hasNoEdge && (
        <div className="p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-zinc-500 text-sm">✓</span>
            <div>
              <p className="text-zinc-400 text-xs font-medium mb-1">{t.marketEfficient}</p>
              <p className="text-zinc-500 text-xs leading-relaxed">{t.noEdgeExplanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Odds */}
      <div>
        <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">{t.currentOdds}</div>
        <OddsDisplay 
          odds={odds} 
          homeTeam={homeTeam} 
          awayTeam={awayTeam} 
          hasDraw={hasDraw}
          locale={locale}
        />
        {odds.bookmaker && (
          <div className="text-zinc-600 text-xs mt-1">{t.via} {odds.bookmaker}</div>
        )}
      </div>

      {/* Model vs Market */}
      <div>
        <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-3">{t.modelVsMarket}</div>
        <ModelVsMarket 
          marketIntel={marketIntel}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          hasDraw={hasDraw}
          locale={locale}
          canSeeExactNumbers={canSeeExactNumbers}
        />
      </div>

      {/* Recommendation */}
      <RecommendationCard marketIntel={marketIntel} locale={locale} />

      {/* Signal Quality - hide exact % for non-PRO */}
      <div className="flex items-center justify-between text-sm pt-3 border-t border-zinc-800/50">
        <span className="text-zinc-500 text-xs">{t.signalQuality}</span>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-zinc-500 rounded-full"
              style={{ width: `${marketIntel.modelProbability.confidence}%` }}
            />
          </div>
          {canSeeExactNumbers ? (
            <span className="text-zinc-400 font-mono text-xs">{marketIntel.modelProbability.confidence}%</span>
          ) : (
            <span className="text-zinc-500 text-xs">
              {marketIntel.modelProbability.confidence >= 70 ? 'High' : 
               marketIntel.modelProbability.confidence >= 50 ? 'Medium' : 'Low'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// LINE MOVEMENT INDICATOR
// ============================================

interface LineMovementProps {
  lineMovement: NonNullable<MarketIntel['lineMovement']>;
}

export function LineMovementIndicator({ lineMovement }: LineMovementProps) {
  const arrow = lineMovement.direction === 'toward_home' ? '←' : 
                lineMovement.direction === 'toward_away' ? '→' : '↔';
  
  const color = lineMovement.magnitude === 'sharp' ? 'text-yellow-400' :
                lineMovement.magnitude === 'moderate' ? 'text-blue-400' : 'text-gray-400';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a2a1a] text-sm ${color}`}>
      <span className="font-mono">{arrow}</span>
      <span>{lineMovement.interpretation}</span>
      {lineMovement.suspicious && (
        <span className="text-yellow-400">⚠️</span>
      )}
    </div>
  );
}

// ============================================
// COMPACT VALUE INDICATOR (for headers/cards)
// ============================================

interface ValueIndicatorProps {
  marketIntel: MarketIntel;
  size?: 'sm' | 'md';
  canSeeExactNumbers?: boolean; // PRO only
}

export function ValueIndicator({ marketIntel, size = 'md', canSeeExactNumbers = false }: ValueIndicatorProps) {
  const { valueEdge, recommendation } = marketIntel;
  
  if (valueEdge.strength === 'none') {
    return null;
  }

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-2.5 py-1';

  const bgColor = recommendation === 'strong_value' ? 'bg-green-500/20 text-green-400' :
                  recommendation === 'slight_value' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-gray-500/20 text-gray-400';

  // PRO users see exact %, free users see label only
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${bgColor}`}>
      {canSeeExactNumbers ? (
        <>
          <span>+{valueEdge.edgePercent}%</span>
          <span className="opacity-70">value</span>
        </>
      ) : (
        <span>Value detected</span>
      )}
    </span>
  );
}
