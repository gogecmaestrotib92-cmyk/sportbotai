/**
 * Result Card component
 * 
 * Displays AI match analysis results following the FINAL schema.
 */

import { AnalyzeResponse, RiskLevel, ValueFlag, Trend } from '@/types';
import TeamLogo from './ui/TeamLogo';
import LeagueLogo from './ui/LeagueLogo';

interface ResultCardProps {
  result: AnalyzeResponse;
}

// Colors for different risk levels
const riskColors: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  LOW: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
  },
  MEDIUM: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
  },
  HIGH: {
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/30',
  },
};

// Labels for risk levels
const riskLabels: Record<RiskLevel, string> = {
  LOW: 'Low Risk',
  MEDIUM: 'Medium Risk',
  HIGH: 'High Risk',
};

// Colors for value flags
const valueFlagColors: Record<ValueFlag, string> = {
  NONE: 'text-gray-400',
  LOW: 'text-primary',
  MEDIUM: 'text-accent',
  HIGH: 'text-success font-bold',
};

// Trend arrows
const trendIcons: Record<Trend, { icon: string; color: string }> = {
  RISING: { icon: '↗', color: 'text-success' },
  FALLING: { icon: '↘', color: 'text-danger' },
  STABLE: { icon: '→', color: 'text-gray-400' },
  UNKNOWN: { icon: '?', color: 'text-gray-500' },
};

export default function ResultCard({ result }: ResultCardProps) {
  const riskLevel = result.riskAnalysis.overallRiskLevel;
  const risk = riskColors[riskLevel];

  // Error state
  if (!result.success && result.error) {
    return (
      <div className="bg-bg-card rounded-card p-6 border border-danger/30">
        <h3 className="text-xl font-bold text-danger mb-2">Analysis Error</h3>
        <p className="text-danger/80">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-card p-6 border border-divider space-y-6">
      {/* Header with match info and risk */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <TeamLogo teamName={result.matchInfo.homeTeam} sport={result.matchInfo.sport} league={result.matchInfo.leagueName} size="md" />
            <h3 className="text-xl font-bold text-white">
              {result.matchInfo.homeTeam} vs {result.matchInfo.awayTeam}
            </h3>
            <TeamLogo teamName={result.matchInfo.awayTeam} sport={result.matchInfo.sport} league={result.matchInfo.leagueName} size="md" />
          </div>
          <div className="flex items-center gap-2">
            <LeagueLogo leagueName={result.matchInfo.leagueName} sport={result.matchInfo.sport} size="sm" />
            <p className="text-sm text-gray-400">
              {result.matchInfo.leagueName} • {result.matchInfo.sport}
            </p>
          </div>
          {result.matchInfo.matchDate && (
            <p className="text-xs text-gray-500">
              {new Date(result.matchInfo.matchDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${risk.bg} ${risk.text} ${risk.border} border`}
          >
            {riskLabels[riskLevel]}
          </span>
          <span className="text-xs text-gray-500">
            Data: {result.matchInfo.sourceType === 'API' ? 'Live Data' : 'Manual Entry'}
          </span>
        </div>
      </div>

      {/* Probabilities */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Estimated Probabilities</h4>
        <div className="grid grid-cols-3 gap-4">
          {/* Home */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Home (1)</p>
            <p className="text-2xl font-bold text-primary-600">
              {result.probabilities.homeWin !== null
                ? `${result.probabilities.homeWin}%`
                : '-'}
            </p>
            <p className={`text-xs mt-1 ${valueFlagColors[result.valueAnalysis.valueFlags.homeWin]}`}>
              {result.valueAnalysis.valueFlags.homeWin !== 'NONE' 
                ? `Value: ${result.valueAnalysis.valueFlags.homeWin}` 
                : ''}
            </p>
          </div>

          {/* Draw */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Draw (X)</p>
            <p className="text-2xl font-bold text-gray-600">
              {result.probabilities.draw !== null
                ? `${result.probabilities.draw}%`
                : '-'}
            </p>
            <p className={`text-xs mt-1 ${valueFlagColors[result.valueAnalysis.valueFlags.draw]}`}>
              {result.valueAnalysis.valueFlags.draw !== 'NONE' 
                ? `Value: ${result.valueAnalysis.valueFlags.draw}` 
                : ''}
            </p>
          </div>

          {/* Away */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Away (2)</p>
            <p className="text-2xl font-bold text-primary-600">
              {result.probabilities.awayWin !== null
                ? `${result.probabilities.awayWin}%`
                : '-'}
            </p>
            <p className={`text-xs mt-1 ${valueFlagColors[result.valueAnalysis.valueFlags.awayWin]}`}>
              {result.valueAnalysis.valueFlags.awayWin !== 'NONE' 
                ? `Value: ${result.valueAnalysis.valueFlags.awayWin}` 
                : ''}
            </p>
          </div>
        </div>

        {/* Over/Under if available */}
        {(result.probabilities.over !== null || result.probabilities.under !== null) && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Over 2.5</p>
              <p className="text-xl font-bold text-gray-700">
                {result.probabilities.over !== null ? `${result.probabilities.over}%` : '-'}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Under 2.5</p>
              <p className="text-xl font-bold text-gray-700">
                {result.probabilities.under !== null ? `${result.probabilities.under}%` : '-'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Value Analysis */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Value Analysis</h4>
        <p className="text-gray-600 text-sm mb-2">{result.valueAnalysis.valueCommentShort}</p>
        {result.valueAnalysis.bestValueSide !== 'NONE' && (
          <p className="text-xs text-gray-500">
            Best Value Side: <span className="font-semibold">{result.valueAnalysis.bestValueSide}</span>
          </p>
        )}
        <details className="mt-2">
          <summary className="text-xs text-primary-600 cursor-pointer hover:underline">
            Show detailed analysis
          </summary>
          <p className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded">
            {result.valueAnalysis.valueCommentDetailed}
          </p>
        </details>
      </div>

      {/* Momentum & Form */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Momentum & Form</h4>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{result.matchInfo.homeTeam}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {result.momentumAndForm.homeMomentumScore !== null
                  ? `${result.momentumAndForm.homeMomentumScore}/10`
                  : '-'}
              </span>
              <span className={`text-xl ${trendIcons[result.momentumAndForm.homeTrend].color}`}>
                {trendIcons[result.momentumAndForm.homeTrend].icon}
              </span>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{result.matchInfo.awayTeam}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {result.momentumAndForm.awayMomentumScore !== null
                  ? `${result.momentumAndForm.awayMomentumScore}/10`
                  : '-'}
              </span>
              <span className={`text-xl ${trendIcons[result.momentumAndForm.awayTrend].color}`}>
                {trendIcons[result.momentumAndForm.awayTrend].icon}
              </span>
            </div>
          </div>
        </div>
        {result.momentumAndForm.keyFormFactors.length > 0 && (
          <ul className="text-xs text-gray-600 space-y-1">
            {result.momentumAndForm.keyFormFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                {factor}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Risk Analysis */}
      <div className={`p-4 rounded-lg ${risk.bg} ${risk.border} border`}>
        <h4 className={`text-sm font-semibold ${risk.text} mb-2`}>Risk Assessment</h4>
        <p className="text-sm text-gray-700 mb-2">{result.riskAnalysis.riskExplanation}</p>
        <p className="text-xs text-gray-600 mb-2">
          <strong>Bankroll Impact:</strong> {result.riskAnalysis.bankrollImpact}
        </p>
        <div className="text-xs text-gray-500 bg-white/50 p-2 rounded">
          <strong>Psychology Alert:</strong> {result.riskAnalysis.psychologyBias.name} - {result.riskAnalysis.psychologyBias.description}
        </div>
      </div>

      {/* Upset Potential */}
      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div>
          <h4 className="text-sm font-semibold text-purple-800">Upset Potential</h4>
          <p className="text-xs text-purple-600">{result.upsetPotential.upsetComment}</p>
        </div>
        <div className="text-2xl font-bold text-purple-700">
          {result.upsetPotential.upsetProbability}%
        </div>
      </div>

      {/* Tactical Analysis */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Tactical Analysis</h4>
        <p className="text-sm text-gray-600 mb-3">{result.tacticalAnalysis.matchNarrative}</p>
        
        {result.tacticalAnalysis.keyMatchFactors.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Key Factors:</p>
            <div className="flex flex-wrap gap-2">
              {result.tacticalAnalysis.keyMatchFactors.map((factor, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
          <p className="text-sm text-primary-800 font-medium italic">
            "{result.tacticalAnalysis.expertConclusionOneLiner}"
          </p>
        </div>
      </div>

      {/* User Context (if provided) */}
      {result.userContext.userPick && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-1">Your Selection</h4>
          <p className="text-sm text-blue-700">
            <strong>Pick:</strong> {result.userContext.userPick}
            {result.userContext.userStake > 0 && (
              <span> • <strong>Stake:</strong> €{result.userContext.userStake}</span>
            )}
          </p>
          <p className="text-xs text-blue-600 mt-1">{result.userContext.pickComment}</p>
        </div>
      )}

      {/* Market Stability Summary */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Market Stability</h4>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-500">1X2</p>
            <p className="font-semibold">{result.marketStability.markets.main_1x2.stability}</p>
            <p className="text-gray-400">Conf: {result.marketStability.markets.main_1x2.confidence}/5</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-500">O/U</p>
            <p className="font-semibold">{result.marketStability.markets.over_under.stability}</p>
            <p className="text-gray-400">Conf: {result.marketStability.markets.over_under.confidence}/5</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-500">BTTS</p>
            <p className="font-semibold">{result.marketStability.markets.btts.stability}</p>
            <p className="text-gray-400">Conf: {result.marketStability.markets.btts.confidence}/5</p>
          </div>
        </div>
        {result.marketStability.safestMarketType !== 'NONE' && (
          <p className="text-xs text-gray-500 mt-2">
            Most stable: <span className="font-semibold">{result.marketStability.safestMarketType}</span>
          </p>
        )}
      </div>

      {/* Responsible gambling note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-amber-800 mb-1">Important Notice</h4>
            <p className="text-sm text-amber-700 mb-2">{result.responsibleGambling.coreNote}</p>
            <p className="text-xs text-amber-600">{result.responsibleGambling.tailoredNote}</p>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {result.meta.warnings.length > 0 && (
        <div className="text-xs text-gray-400">
          <p className="font-semibold mb-1">Warnings:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {result.meta.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Meta info */}
      <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
        <p>Model: v{result.meta.modelVersion} • Generated: {new Date(result.meta.analysisGeneratedAt).toLocaleString()}</p>
        <p className="mt-1">This analysis was generated by AI and is for informational purposes only.</p>
      </div>
    </div>
  );
}
