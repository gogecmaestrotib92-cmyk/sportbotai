/**
 * Key Factors Card Component
 * 
 * Displays the most important factors for this specific match.
 * A simple, scannable 3-5 bullet list with icons that helps users
 * quickly understand what matters most.
 * 
 * Combines:
 * - tacticalAnalysis.keyMatchFactors (AI-generated)
 * - momentumAndForm.keyFormFactors (form-based)
 * - Risk/Value highlights when significant
 */

'use client';

import { AnalyzeResponse } from '@/types';

interface KeyFactorsCardProps {
  result: AnalyzeResponse;
}

// Icon mapping for different factor types
function getFactorIcon(factor: string): string {
  const lowerFactor = factor.toLowerCase();
  
  // Form & Momentum
  if (lowerFactor.includes('form') || lowerFactor.includes('streak')) return '📈';
  if (lowerFactor.includes('momentum')) return '⚡';
  if (lowerFactor.includes('win') && lowerFactor.includes('row')) return '🔥';
  
  // Team specific
  if (lowerFactor.includes('home') && (lowerFactor.includes('advantage') || lowerFactor.includes('record'))) return '🏠';
  if (lowerFactor.includes('away') && lowerFactor.includes('struggle')) return '✈️';
  if (lowerFactor.includes('defense') || lowerFactor.includes('defensive')) return '🛡️';
  if (lowerFactor.includes('attack') || lowerFactor.includes('offensive') || lowerFactor.includes('scoring')) return '⚔️';
  
  // Match specific
  if (lowerFactor.includes('head') || lowerFactor.includes('h2h')) return '🤝';
  if (lowerFactor.includes('injury') || lowerFactor.includes('missing')) return '🏥';
  if (lowerFactor.includes('rest') || lowerFactor.includes('fatigue')) return '😴';
  if (lowerFactor.includes('motivation') || lowerFactor.includes('must-win')) return '💪';
  
  // Stats
  if (lowerFactor.includes('goal') || lowerFactor.includes('score')) return '⚽';
  if (lowerFactor.includes('clean sheet')) return '🧤';
  if (lowerFactor.includes('btts') || lowerFactor.includes('both teams')) return '🎯';
  if (lowerFactor.includes('over') || lowerFactor.includes('under')) return '📊';
  
  // Risk/Value
  if (lowerFactor.includes('value') || lowerFactor.includes('edge')) return '💰';
  if (lowerFactor.includes('risk') || lowerFactor.includes('volatile')) return '⚠️';
  if (lowerFactor.includes('upset')) return '🎲';
  
  // Weather/Conditions
  if (lowerFactor.includes('weather') || lowerFactor.includes('rain') || lowerFactor.includes('wind')) return '🌧️';
  if (lowerFactor.includes('pitch') || lowerFactor.includes('surface') || lowerFactor.includes('court')) return '🏟️';
  
  // Default
  return '•';
}

// Get importance color based on content
function getFactorColor(factor: string): string {
  const lowerFactor = factor.toLowerCase();
  
  // Positive indicators
  if (lowerFactor.includes('strong') || lowerFactor.includes('excellent') || 
      lowerFactor.includes('dominant') || lowerFactor.includes('unbeaten')) {
    return 'text-success';
  }
  
  // Warning indicators
  if (lowerFactor.includes('concern') || lowerFactor.includes('struggling') ||
      lowerFactor.includes('poor') || lowerFactor.includes('weak')) {
    return 'text-warning';
  }
  
  // Danger indicators
  if (lowerFactor.includes('injury') || lowerFactor.includes('missing') ||
      lowerFactor.includes('suspended') || lowerFactor.includes('risk')) {
    return 'text-danger';
  }
  
  return 'text-text-secondary';
}

export default function KeyFactorsCard({ result }: KeyFactorsCardProps) {
  const { tacticalAnalysis, momentumAndForm, riskAnalysis, valueAnalysis, upsetPotential } = result;
  
  // Collect factors from multiple sources
  const allFactors: string[] = [];
  
  // Add tactical key factors (primary source)
  if (tacticalAnalysis.keyMatchFactors?.length > 0) {
    allFactors.push(...tacticalAnalysis.keyMatchFactors);
  }
  
  // Add form factors if not already covered
  if (momentumAndForm.keyFormFactors?.length > 0) {
    momentumAndForm.keyFormFactors.forEach(factor => {
      // Avoid duplicates
      if (!allFactors.some(f => f.toLowerCase().includes(factor.toLowerCase().slice(0, 20)))) {
        allFactors.push(factor);
      }
    });
  }
  
  // Add high-value indicator if present
  if (valueAnalysis.bestValueSide !== 'NONE') {
    const valueFlags = Object.values(valueAnalysis.valueFlags);
    if (valueFlags.includes('HIGH') || valueFlags.includes('MEDIUM')) {
      const bestSide = valueAnalysis.bestValueSide === 'HOME' ? result.matchInfo.homeTeam :
                       valueAnalysis.bestValueSide === 'AWAY' ? result.matchInfo.awayTeam : 'Draw';
      if (!allFactors.some(f => f.toLowerCase().includes('value'))) {
        allFactors.push(`Value detected on ${bestSide}`);
      }
    }
  }
  
  // Add upset warning if significant
  if (upsetPotential.upsetProbability >= 30 && !allFactors.some(f => f.toLowerCase().includes('upset'))) {
    allFactors.push(`Upset potential: ${upsetPotential.upsetProbability}% chance`);
  }
  
  // Limit to top 5 factors
  const displayFactors = allFactors.slice(0, 5);
  
  // If no factors, show a fallback
  if (displayFactors.length === 0) {
    return null; // Don't render if no factors
  }

  return (
    <div className="bg-bg-card rounded-card border border-divider overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-divider bg-gradient-to-r from-accent/5 to-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <span className="text-sm">🎯</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">Key Factors</h3>
            <p className="text-[10px] sm:text-xs text-text-muted">What matters most in this match</p>
          </div>
        </div>
      </div>

      {/* Factors List */}
      <div className="p-4 sm:p-5">
        <ul className="space-y-3">
          {displayFactors.map((factor, index) => (
            <li key={index} className="flex items-start gap-3">
              {/* Icon */}
              <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-bg-hover flex items-center justify-center text-sm">
                {getFactorIcon(factor)}
              </span>
              
              {/* Factor Text */}
              <p className={`text-xs sm:text-sm leading-relaxed pt-1 ${getFactorColor(factor)}`}>
                {factor}
              </p>
            </li>
          ))}
        </ul>
        
        {/* Risk Level Indicator */}
        <div className="mt-4 pt-4 border-t border-divider">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-text-muted">Match Complexity</span>
            <div className="flex items-center gap-2">
              {/* Complexity dots */}
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`w-2 h-2 rounded-full ${
                      riskAnalysis.overallRiskLevel === 'LOW' && level <= 1 ? 'bg-success' :
                      riskAnalysis.overallRiskLevel === 'MEDIUM' && level <= 2 ? 'bg-warning' :
                      riskAnalysis.overallRiskLevel === 'HIGH' ? 'bg-danger' :
                      'bg-bg-tertiary'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-medium ${
                riskAnalysis.overallRiskLevel === 'LOW' ? 'text-success' :
                riskAnalysis.overallRiskLevel === 'MEDIUM' ? 'text-warning' :
                'text-danger'
              }`}>
                {riskAnalysis.overallRiskLevel === 'LOW' ? 'Straightforward' :
                 riskAnalysis.overallRiskLevel === 'MEDIUM' ? 'Moderate' :
                 'Complex'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
