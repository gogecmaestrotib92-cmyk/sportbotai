/**
 * Odds Comparison Card Component (Educational)
 * 
 * Shows AI probability estimates vs market-implied probabilities
 * in a neutral, educational way - no betting recommendations.
 * 
 * Replaces the old ValueAnalysisCard.
 */

'use client';

import { OddsComparison, ProbabilityComparison } from '@/types';

interface OddsComparisonCardProps {
  oddsComparison: OddsComparison;
  homeTeam: string;
  awayTeam: string;
}

// Neutral colors based on difference magnitude (not value)
const getDifferenceStyle = (diff: number | null) => {
  if (diff === null) return { color: 'text-text-muted', bg: 'bg-white/5' };
  const absDiff = Math.abs(diff);
  if (absDiff < 3) return { color: 'text-text-secondary', bg: 'bg-white/5' };
  if (absDiff < 6) return { color: 'text-info', bg: 'bg-info/10' };
  return { color: 'text-accent', bg: 'bg-accent/10' };
};

interface ComparisonRowProps {
  label: string;
  comparison: ProbabilityComparison;
  isLargest?: boolean;
}

function ComparisonRow({ label, comparison, isLargest }: ComparisonRowProps) {
  const { aiEstimate, marketImplied, difference } = comparison;
  const style = getDifferenceStyle(difference);
  
  return (
    <div className={`
      p-3 rounded-xl border transition-all
      ${isLargest ? 'border-accent/30 bg-accent/5' : 'border-white/10 bg-white/5'}
    `}>
      <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-2">
        {label}
        {isLargest && <span className="ml-2 text-accent text-[10px]">• Largest gap</span>}
      </p>
      
      {/* Side by side comparison */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-text-muted mb-1">Market</p>
          <p className="text-lg font-bold text-white">
            {marketImplied !== null ? `${marketImplied.toFixed(0)}%` : '—'}
          </p>
        </div>
        <div className="flex items-center justify-center">
          <div className={`px-2 py-1 rounded-full ${style.bg}`}>
            <p className={`text-sm font-bold ${style.color}`}>
              {difference !== null 
                ? `${difference > 0 ? '+' : ''}${difference.toFixed(1)}%`
                : '—'
              }
            </p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-text-muted mb-1">AI Est.</p>
          <p className="text-lg font-bold text-white">
            {aiEstimate !== null ? `${aiEstimate.toFixed(0)}%` : '—'}
          </p>
        </div>
      </div>
      
      {/* Visual bar comparison */}
      <div className="mt-3 space-y-1.5">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-500 rounded-full transition-all duration-500"
            style={{ width: `${marketImplied || 0}%` }}
          />
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              difference && difference > 0 ? 'bg-accent' : 'bg-info'
            }`}
            style={{ width: `${aiEstimate || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function OddsComparisonCard({ oddsComparison, homeTeam, awayTeam }: OddsComparisonCardProps) {
  const { comparison, largestDifference, marketImplied, explanationShort, explanationDetailed } = oddsComparison;
  
  // Safety check for missing comparison data (older analyses)
  if (!comparison || !comparison.homeWin || !comparison.awayWin) {
    return (
      <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-info/20 rounded-xl flex items-center justify-center">
            <span className="text-lg">📊</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Probability Comparison</h3>
            <p className="text-xs text-text-muted">Data not available for this analysis</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          Odds comparison data was not saved for this analysis. New analyses include full probability comparisons.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-info/20 rounded-xl flex items-center justify-center">
            <span className="text-lg">📊</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Probability Comparison</h3>
            <p className="text-xs text-text-muted">AI estimates vs market odds</p>
          </div>
        </div>
      </div>
      
      {/* Comparison Grid */}
      <div className="p-4 space-y-3">
        <ComparisonRow 
          label={`${homeTeam} Win`}
          comparison={comparison.homeWin}
          isLargest={largestDifference?.outcome === 'HOME'}
        />
        
        {comparison.draw?.marketImplied !== null && (
          <ComparisonRow 
            label="Draw"
            comparison={comparison.draw}
            isLargest={largestDifference?.outcome === 'DRAW'}
          />
        )}
        
        <ComparisonRow 
          label={`${awayTeam} Win`}
          comparison={comparison.awayWin}
          isLargest={largestDifference?.outcome === 'AWAY'}
        />
      </div>
      
      {/* Bookmaker Margin Info */}
      {marketImplied?.bookmakerMargin !== null && marketImplied?.bookmakerMargin !== undefined && (
        <div className="px-4 pb-3">
          <div className="px-3 py-2 bg-white/5 rounded-lg">
            <p className="text-xs text-text-muted">
              <span className="font-medium">Bookmaker margin:</span>{' '}
              <span className="text-text-secondary">{marketImplied.bookmakerMargin.toFixed(1)}%</span>
              <span className="ml-2 text-text-muted">
                (odds are adjusted to favor the bookmaker)
              </span>
            </p>
          </div>
        </div>
      )}
      
      {/* Explanation */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-br from-white/5 to-transparent rounded-xl p-4 border border-white/5">
          <p className="text-sm text-text-secondary leading-relaxed mb-2">
            {explanationShort}
          </p>
          <details className="group">
            <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary transition-colors">
              What does this mean?
            </summary>
            <p className="mt-2 text-xs text-text-muted leading-relaxed">
              {explanationDetailed}
            </p>
          </details>
        </div>
      </div>
      
      {/* Educational Disclaimer */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
          <span className="text-sm">ℹ️</span>
          <p className="text-xs text-warning/80 leading-relaxed">
            This comparison is for educational purposes. Differences between AI and market 
            estimates don't indicate which outcome is "better" — they show where our model 
            disagrees with bookmaker pricing. Always form your own conclusions.
          </p>
        </div>
      </div>
    </div>
  );
}
