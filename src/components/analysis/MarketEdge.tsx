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
    marketEdge: 'Market Edge',
    currentOdds: 'Current Odds',
    modelVsMarket: 'Model vs Market',
    draw: 'Draw',
    home: 'Home',
    away: 'Away',
    marketVerdict: 'Market Verdict',
    bookmakerMargin: 'Bookmaker margin',
    signalQuality: 'Signal Quality',
    premiumEdgeData: 'Premium Edge Data',
    seeWhereMarketWrong: 'See where the market is wrong',
    unlockPro: 'Unlock Pro',
    via: 'via',
  },
  sr: {
    fairPrice: 'Fer Cena',
    market: 'Tržište',
    model: 'Model',
    value: 'vrednost',
    overpriced: 'precenjeno',
    marketEdge: 'Tržišna Prednost',
    currentOdds: 'Trenutne Kvote',
    modelVsMarket: 'Model vs Tržište',
    draw: 'Nerešeno',
    home: 'Domaćin',
    away: 'Gost',
    marketVerdict: 'Tržišna Procena',
    bookmakerMargin: 'Kladioničarska marža',
    signalQuality: 'Kvalitet Signala',
    premiumEdgeData: 'Premium Edge Podaci',
    seeWhereMarketWrong: 'Vidite gde je tržište u grešci',
    unlockPro: 'Otključaj Pro',
    via: 'preko',
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
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a2a1a] text-gray-400 text-sm">
        <span className="w-2 h-2 rounded-full bg-gray-500"></span>
        <span>{t.fairPrice}</span>
      </div>
    );
  }

  const colorMap = {
    strong: 'bg-green-500/20 text-green-400 border-green-500/30',
    moderate: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    slight: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    none: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const dotColor = {
    strong: 'bg-green-400',
    moderate: 'bg-emerald-400',
    slight: 'bg-yellow-400',
    none: 'bg-gray-400',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorMap[valueEdge.strength]}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor[valueEdge.strength]} animate-pulse`}></span>
      <span className="text-sm font-medium">{valueEdge.label}</span>
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
}

export function ProbabilityCompare({ modelProb, marketProb, label, teamName, locale = 'en' }: ProbabilityCompareProps) {
  const t = translations[locale];
  const diff = modelProb - marketProb;
  const isValue = diff > 3;
  const isOverpriced = diff < -3;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">{teamName || label}</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">{t.market}: {marketProb}%</span>
          <span className={`font-medium ${isValue ? 'text-green-400' : isOverpriced ? 'text-red-400' : 'text-white'}`}>
            {t.model}: {modelProb}%
          </span>
        </div>
      </div>
      
      {/* Comparison bar */}
      <div className="relative h-2 bg-[#1a2a1a] rounded-full overflow-hidden">
        {/* Market probability (gray) */}
        <div 
          className="absolute top-0 left-0 h-full bg-gray-600 rounded-full"
          style={{ width: `${marketProb}%` }}
        />
        {/* Model probability (colored) */}
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all ${
            isValue ? 'bg-green-500' : isOverpriced ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${modelProb}%` }}
        />
      </div>

      {/* Edge indicator */}
      {Math.abs(diff) > 3 && (
        <div className={`text-xs ${isValue ? 'text-green-400' : 'text-red-400'}`}>
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
}

export function ModelVsMarket({ marketIntel, homeTeam, awayTeam, hasDraw = true, locale = 'en' }: ModelVsMarketProps) {
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
      />
      
      {hasDraw && modelProbability.draw !== undefined && impliedProbability.draw !== undefined && (
        <ProbabilityCompare
          modelProb={modelProbability.draw}
          marketProb={impliedProbability.draw}
          label={t.draw}
          locale={locale}
        />
      )}
      
      <ProbabilityCompare
        modelProb={modelProbability.away}
        marketProb={impliedProbability.away}
        label={t.away}
        teamName={awayTeam}
        locale={locale}
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

export function OddsDisplay({ odds, homeTeam, awayTeam, hasDraw = true, locale = 'en' }: OddsDisplayProps) {
  const t = translations[locale];
  
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex-1 text-center p-2 bg-[#1a2a1a] rounded-lg">
        <div className="text-gray-400 text-xs mb-1">{homeTeam}</div>
        <div className="text-white font-mono font-medium">{formatOdds(odds.homeOdds)}</div>
      </div>
      
      {hasDraw && odds.drawOdds && (
        <div className="flex-1 text-center p-2 bg-[#1a2a1a] rounded-lg">
          <div className="text-gray-400 text-xs mb-1">{t.draw}</div>
          <div className="text-white font-mono font-medium">{formatOdds(odds.drawOdds)}</div>
        </div>
      )}
      
      <div className="flex-1 text-center p-2 bg-[#1a2a1a] rounded-lg">
        <div className="text-gray-400 text-xs mb-1">{awayTeam}</div>
        <div className="text-white font-mono font-medium">{formatOdds(odds.awayOdds)}</div>
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
    <div className="p-4 bg-[#0d1f0d] border border-[#1a3a1a] rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm uppercase tracking-wider">{t.marketVerdict}</span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
          {badgeLabel}
        </span>
      </div>
      
      <p className="text-gray-300 text-sm leading-relaxed">
        {marketIntel.summary}
      </p>
      
      {/* Conflict Explanation - explains when value is on non-favored team */}
      {marketIntel.conflictExplanation && (
        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-sm">💡</span>
            <p className="text-amber-200/90 text-sm leading-relaxed">
              {marketIntel.conflictExplanation}
            </p>
          </div>
        </div>
      )}
      
      {marketIntel.impliedProbability.margin && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{t.bookmakerMargin}:</span>
          <span className="font-mono">{marketIntel.impliedProbability.margin}%</span>
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
  isPro?: boolean;
  locale?: Locale;
}

export function MarketIntelSection({ 
  marketIntel, 
  odds, 
  homeTeam, 
  awayTeam, 
  hasDraw = true,
  isPro = false,
  locale = 'en'
}: MarketIntelSectionProps) {
  const t = translations[locale];
  
  // If not Pro, show blurred preview
  if (!isPro) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          <MarketIntelContent 
            marketIntel={marketIntel}
            odds={odds}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            hasDraw={hasDraw}
            locale={locale}
          />
        </div>
        
        {/* Upgrade overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a1a0a]/60 rounded-xl">
          <div className="text-center p-6">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="text-white font-semibold mb-1">{t.premiumEdgeData}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t.seeWhereMarketWrong}
            </p>
            <a 
              href="/pricing" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t.unlockPro}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MarketIntelContent 
      marketIntel={marketIntel}
      odds={odds}
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      hasDraw={hasDraw}
      locale={locale}
    />
  );
}

// Internal component for the actual content
function MarketIntelContent({ 
  marketIntel, 
  odds, 
  homeTeam, 
  awayTeam, 
  hasDraw,
  locale = 'en'
}: Omit<MarketIntelSectionProps, 'isPro'>) {
  const t = translations[locale];
  
  return (
    <div className="space-y-6 p-6 bg-[#0a1a0a] border border-[#1a3a1a] rounded-xl">
      {/* Header with Value Badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-lg">📊</span>
          {t.marketEdge}
        </h3>
        <ValueBadge valueEdge={marketIntel.valueEdge} locale={locale} />
      </div>

      {/* Current Odds */}
      <div>
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">{t.currentOdds}</div>
        <OddsDisplay 
          odds={odds} 
          homeTeam={homeTeam} 
          awayTeam={awayTeam} 
          hasDraw={hasDraw}
          locale={locale}
        />
        {odds.bookmaker && (
          <div className="text-gray-500 text-xs mt-1">{t.via} {odds.bookmaker}</div>
        )}
      </div>

      {/* Model vs Market */}
      <div>
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">{t.modelVsMarket}</div>
        <ModelVsMarket 
          marketIntel={marketIntel}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          hasDraw={hasDraw}
          locale={locale}
        />
      </div>

      {/* Recommendation */}
      <RecommendationCard marketIntel={marketIntel} locale={locale} />

      {/* Signal Quality */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-[#1a3a1a]">
        <span className="text-gray-400">{t.signalQuality}</span>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-[#1a2a1a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${marketIntel.modelProbability.confidence}%` }}
            />
          </div>
          <span className="text-white font-mono text-xs">{marketIntel.modelProbability.confidence}%</span>
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
}

export function ValueIndicator({ marketIntel, size = 'md' }: ValueIndicatorProps) {
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

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${bgColor}`}>
      <span>+{valueEdge.edgePercent}%</span>
      <span className="opacity-70">value</span>
    </span>
  );
}
