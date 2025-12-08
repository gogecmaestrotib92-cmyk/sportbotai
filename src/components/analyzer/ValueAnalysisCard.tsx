/**
 * Value Analysis Card Component (Phase 2 Enhanced)
 * 
 * Features:
 * - Implied vs AI probability comparison
 * - Value flags with visual indicators
 * - Full Kelly Criterion with fractional options
 * - Confidence-adjusted stake recommendations
 * - Interactive probability bars
 */

'use client';

import { useState } from 'react';
import { ValueAnalysis, ValueFlag, BestValueSide, KellyResult } from '@/types';

interface ValueAnalysisCardProps {
  valueAnalysis: ValueAnalysis;
}

const valueFlagConfig: Record<ValueFlag, { label: string; bgColor: string; textColor: string; borderColor: string; barColor: string }> = {
  NONE: { label: 'No Edge', bgColor: 'bg-gray-50', textColor: 'text-gray-500', borderColor: 'border-gray-200', barColor: 'bg-gray-300' },
  LOW: { label: 'Slight Edge', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200', barColor: 'bg-blue-400' },
  MEDIUM: { label: 'Good Edge', bgColor: 'bg-accent-lime/10', textColor: 'text-accent-lime', borderColor: 'border-accent-lime/30', barColor: 'bg-accent-lime' },
  HIGH: { label: 'Strong Edge', bgColor: 'bg-accent-green/10', textColor: 'text-accent-green', borderColor: 'border-accent-green/30', barColor: 'bg-accent-green' },
};

const bestValueSideConfig: Record<BestValueSide, { label: string; icon: string; color: string }> = {
  HOME: { label: 'Home Win', icon: '🏠', color: 'text-accent-green' },
  DRAW: { label: 'Draw', icon: '🤝', color: 'text-gray-600' },
  AWAY: { label: 'Away Win', icon: '✈️', color: 'text-accent-cyan' },
  NONE: { label: 'No Clear Edge', icon: '⚖️', color: 'text-gray-500' },
};

// Kelly Criterion calculator (client-side for user input)
function calculateKelly(
  probability: number, 
  decimalOdds: number,
  confidenceMultiplier: number = 1.0
): KellyResult {
  const p = probability / 100;
  const b = decimalOdds - 1;
  const q = 1 - p;
  
  // Kelly formula: (bp - q) / b
  const rawKelly = ((b * p) - q) / b;
  const edge = (p * decimalOdds - 1) * 100;
  
  // Apply confidence adjustment
  const adjustedKelly = Math.max(0, rawKelly * confidenceMultiplier);
  
  // Determine confidence based on edge magnitude
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (edge < 3) confidence = 'LOW';
  else if (edge > 8) confidence = 'HIGH';
  
  return {
    fullKelly: Math.round(adjustedKelly * 1000) / 10, // % with 1 decimal
    halfKelly: Math.round(adjustedKelly * 500) / 10,
    quarterKelly: Math.round(adjustedKelly * 250) / 10,
    edge: Math.round(edge * 10) / 10,
    confidence,
  };
}

interface ProbabilityComparisonProps {
  label: string;
  impliedProb: number | null;
  aiProb: number | null;
  flag: ValueFlag;
  isActive?: boolean;
}

function ProbabilityComparison({ label, impliedProb, aiProb, flag, isActive }: ProbabilityComparisonProps) {
  const config = valueFlagConfig[flag];
  const edge = impliedProb && aiProb ? (aiProb - impliedProb) : null;
  
  return (
    <div className={`
      p-3 sm:p-4 rounded-xl border-2 transition-all duration-200
      ${isActive ? 'ring-2 ring-primary-900/20 border-primary-900' : config.borderColor}
      ${config.bgColor}
    `}>
      <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">{label}</p>
      
      {/* Probability Bars */}
      <div className="space-y-2 mb-3">
        {/* Market/Implied */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
            <span>Market</span>
            <span className="font-medium">{impliedProb !== null ? `${impliedProb.toFixed(0)}%` : '—'}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-400 rounded-full transition-all duration-500"
              style={{ width: `${impliedProb || 0}%` }}
            />
          </div>
        </div>
        
        {/* AI Estimate */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
            <span>AI Est.</span>
            <span className={`font-medium ${config.textColor}`}>{aiProb !== null ? `${aiProb.toFixed(0)}%` : '—'}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
              style={{ width: `${aiProb || 0}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Edge Badge */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${config.textColor}`}>
          {config.label}
        </span>
        {edge !== null && edge > 0 && (
          <span className={`text-xs font-bold ${config.textColor}`}>
            +{edge.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

interface KellyDisplayProps {
  kelly: KellyResult | null;
  bestSide: BestValueSide;
}

function KellyDisplay({ kelly, bestSide }: KellyDisplayProps) {
  const [selectedFraction, setSelectedFraction] = useState<'full' | 'half' | 'quarter'>('half');
  
  if (!kelly || bestSide === 'NONE') {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">📊</span>
          <span className="text-sm font-semibold text-gray-700">Kelly Criterion</span>
        </div>
        <p className="text-xs text-gray-500">
          No positive edge detected. Kelly suggests no stake.
        </p>
      </div>
    );
  }
  
  const fractions = [
    { key: 'quarter' as const, label: '¼ Kelly', value: kelly.quarterKelly, desc: 'Very Safe' },
    { key: 'half' as const, label: '½ Kelly', value: kelly.halfKelly, desc: 'Recommended' },
    { key: 'full' as const, label: 'Full Kelly', value: kelly.fullKelly, desc: 'Aggressive' },
  ];
  
  const confidenceColors = {
    LOW: 'text-amber-600 bg-amber-50',
    MEDIUM: 'text-blue-600 bg-blue-50',
    HIGH: 'text-green-600 bg-green-50',
  };
  
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span className="text-sm font-semibold text-gray-900">Kelly Criterion</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${confidenceColors[kelly.confidence]}`}>
          {kelly.confidence} confidence
        </span>
      </div>
      
      {/* Edge indicator */}
      <div className="mb-3 px-3 py-2 bg-white rounded-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Expected Edge</span>
          <span className={`text-sm font-bold ${kelly.edge > 5 ? 'text-accent-green' : kelly.edge > 2 ? 'text-accent-lime' : 'text-blue-600'}`}>
            +{kelly.edge.toFixed(1)}%
          </span>
        </div>
      </div>
      
      {/* Fraction Selector */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {fractions.map(({ key, label, value, desc }) => (
          <button
            key={key}
            onClick={() => setSelectedFraction(key)}
            className={`
              p-2 rounded-lg text-center transition-all duration-200 border-2
              ${selectedFraction === key 
                ? 'border-primary-900 bg-primary-900 text-white' 
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <p className={`text-[10px] ${selectedFraction === key ? 'text-gray-300' : 'text-gray-500'}`}>
              {label}
            </p>
            <p className={`text-lg font-bold ${selectedFraction === key ? 'text-white' : 'text-gray-900'}`}>
              {value.toFixed(1)}%
            </p>
            <p className={`text-[9px] ${selectedFraction === key ? 'text-gray-300' : 'text-gray-400'}`}>
              {desc}
            </p>
          </button>
        ))}
      </div>
      
      {/* Example calculation */}
      <div className="text-[10px] text-gray-500 bg-gray-50 rounded-lg p-2">
        <span className="font-medium">Example:</span> On a $1,000 bankroll → stake ${(fractions.find(f => f.key === selectedFraction)?.value || 0) * 10}
      </div>
    </div>
  );
}

export default function ValueAnalysisCard({ valueAnalysis }: ValueAnalysisCardProps) {
  const [showDetailed, setShowDetailed] = useState(false);
  const bestValueConfig = bestValueSideConfig[valueAnalysis.bestValueSide];
  
  // Determine which outcome is active (best value)
  const isHomeActive = valueAnalysis.bestValueSide === 'HOME';
  const isDrawActive = valueAnalysis.bestValueSide === 'DRAW';
  const isAwayActive = valueAnalysis.bestValueSide === 'AWAY';

  return (
    <div className="space-y-4">
      {/* Header with Best Value Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{bestValueConfig.icon}</span>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Best Value</h4>
            <p className={`text-xs font-medium ${bestValueConfig.color}`}>
              {bestValueConfig.label}
            </p>
          </div>
        </div>
        {valueAnalysis.bestValueSide !== 'NONE' && (
          <div className="px-3 py-1.5 bg-accent-green/10 rounded-full">
            <span className="text-xs font-semibold text-accent-green">Edge Detected</span>
          </div>
        )}
      </div>

      {/* Probability Comparison Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <ProbabilityComparison
          label="Home"
          impliedProb={valueAnalysis.impliedProbabilities.homeWin}
          aiProb={valueAnalysis.aiProbabilities?.homeWin ?? valueAnalysis.impliedProbabilities.homeWin}
          flag={valueAnalysis.valueFlags.homeWin}
          isActive={isHomeActive}
        />
        <ProbabilityComparison
          label="Draw"
          impliedProb={valueAnalysis.impliedProbabilities.draw}
          aiProb={valueAnalysis.aiProbabilities?.draw ?? valueAnalysis.impliedProbabilities.draw}
          flag={valueAnalysis.valueFlags.draw}
          isActive={isDrawActive}
        />
        <ProbabilityComparison
          label="Away"
          impliedProb={valueAnalysis.impliedProbabilities.awayWin}
          aiProb={valueAnalysis.aiProbabilities?.awayWin ?? valueAnalysis.impliedProbabilities.awayWin}
          flag={valueAnalysis.valueFlags.awayWin}
          isActive={isAwayActive}
        />
      </div>

      {/* Kelly Criterion Section */}
      <KellyDisplay 
        kelly={valueAnalysis.kellyStake} 
        bestSide={valueAnalysis.bestValueSide} 
      />

      {/* Short Comment */}
      <p className="text-sm text-gray-700 leading-relaxed">
        {valueAnalysis.valueCommentShort}
      </p>

      {/* Expandable Detailed Analysis */}
      <button
        onClick={() => setShowDetailed(!showDetailed)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-medium text-gray-600">
          {showDetailed ? 'Hide detailed analysis' : 'Show detailed analysis'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDetailed ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showDetailed && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 animate-fadeIn">
          <p className="text-sm text-gray-600 leading-relaxed">
            {valueAnalysis.valueCommentDetailed}
          </p>
        </div>
      )}
    </div>
  );
}
