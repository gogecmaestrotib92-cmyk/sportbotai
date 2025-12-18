/**
 * Quick Briefing Card
 * 
 * "60-Second Briefing" - A condensed, scannable summary of the full analysis.
 * Designed for users who want to understand a match quickly without reading everything.
 * 
 * Key features:
 * - 4-6 bullet points capturing the essence
 * - Visual probability bar
 * - One-tap audio briefing
 * - Expandable for full analysis
 */

'use client';

import { useState, useRef } from 'react';
import { AnalyzeResponse } from '@/types';

interface QuickBriefingCardProps {
  result: AnalyzeResponse;
  onExpandToFull?: () => void;
}

type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export default function QuickBriefingCard({ result, onExpandToFull }: QuickBriefingCardProps) {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [showFullBriefing, setShowFullBriefing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const { matchInfo, probabilities, valueAnalysis, riskAnalysis, tacticalAnalysis, upsetPotential } = result;

  // Build quick briefing points
  const briefingPoints = buildBriefingPoints(result);
  
  // Build audio text (condensed version)
  const buildAudioText = (): string => {
    const parts = [
      `60-second briefing for ${matchInfo.homeTeam} versus ${matchInfo.awayTeam}.`,
      `${matchInfo.leagueName}.`,
      '',
      ...briefingPoints.map(p => p.text),
      '',
      `Bottom line: ${tacticalAnalysis.expertConclusionOneLiner || valueAnalysis.valueCommentShort}`,
      '',
      'This is for educational purposes only. Always gamble responsibly.',
    ];
    return parts.join(' ');
  };

  // Generate audio
  const handleAudio = async () => {
    // Toggle pause/play if audio exists
    if (audioRef.current && audioState === 'playing') {
      audioRef.current.pause();
      setAudioState('paused');
      return;
    }
    if (audioRef.current && audioState === 'paused') {
      audioRef.current.play();
      setAudioState('playing');
      return;
    }

    // Generate new audio
    setAudioState('loading');
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: buildAudioText() }),
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Cleanup old audio
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      // Create audio element
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
        { type: data.contentType }
      );
      const url = URL.createObjectURL(audioBlob);
      audioUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => setAudioState('idle');
      audio.onerror = () => setAudioState('error');
      
      await audio.play();
      setAudioState('playing');
    } catch (error) {
      console.error('[QuickBriefing] Audio error:', error);
      setAudioState('error');
    }
  };

  // Determine the favored team
  const homeProb = probabilities.homeWin || 0;
  const awayProb = probabilities.awayWin || 0;
  const drawProb = probabilities.draw || 0;
  const maxProb = Math.max(homeProb, awayProb, drawProb);
  const favorite = homeProb === maxProb ? matchInfo.homeTeam : 
                   awayProb === maxProb ? matchInfo.awayTeam : 'Draw';

  return (
    <div className="bg-gradient-to-br from-bg-card to-bg-elevated border border-divider rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 px-5 py-4 border-b border-divider">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">60-Second Briefing</h3>
              <p className="text-xs text-gray-400">Quick match intelligence</p>
            </div>
          </div>
          
          {/* Audio Button */}
          <button
            onClick={handleAudio}
            disabled={audioState === 'loading'}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
              ${audioState === 'loading' 
                ? 'bg-gray-700 text-gray-400 cursor-wait' 
                : audioState === 'playing'
                ? 'bg-primary text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
              }
            `}
          >
            {audioState === 'loading' && (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating...</span>
              </>
            )}
            {audioState === 'idle' && (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                <span>Listen</span>
              </>
            )}
            {audioState === 'playing' && (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Pause</span>
              </>
            )}
            {audioState === 'paused' && (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                <span>Resume</span>
              </>
            )}
            {audioState === 'error' && (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Retry</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Probability Bar */}
      <div className="px-5 py-4 border-b border-divider">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-white font-medium">{matchInfo.homeTeam}</span>
          {probabilities.draw !== null && (
            <span className="text-gray-400">Draw</span>
          )}
          <span className="text-white font-medium">{matchInfo.awayTeam}</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-bg-primary">
          <div 
            className="bg-primary transition-all"
            style={{ width: `${homeProb}%` }}
          />
          {probabilities.draw !== null && (
            <div 
              className="bg-gray-500 transition-all"
              style={{ width: `${drawProb}%` }}
            />
          )}
          <div 
            className="bg-accent transition-all"
            style={{ width: `${awayProb}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
          <span>{homeProb}%</span>
          {probabilities.draw !== null && <span>{drawProb}%</span>}
          <span>{awayProb}%</span>
        </div>
      </div>

      {/* Key Insights - Bullet Points */}
      <div className="px-5 py-4 space-y-3">
        {briefingPoints.slice(0, showFullBriefing ? undefined : 4).map((point, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-sm ${point.color}`}>
              {point.icon}
            </span>
            <p className="text-sm text-gray-300 leading-relaxed">{point.text}</p>
          </div>
        ))}
        
        {briefingPoints.length > 4 && !showFullBriefing && (
          <button 
            onClick={() => setShowFullBriefing(true)}
            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
          >
            +{briefingPoints.length - 4} more insights
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Line */}
      <div className="px-5 py-4 bg-bg-primary/50 border-t border-divider">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Bottom Line</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            riskAnalysis.overallRiskLevel === 'LOW' ? 'bg-green-500/20 text-green-400' :
            riskAnalysis.overallRiskLevel === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {riskAnalysis.overallRiskLevel} Risk
          </span>
        </div>
        <p className="text-white font-medium">
          {tacticalAnalysis.expertConclusionOneLiner || valueAnalysis.valueCommentShort}
        </p>
      </div>

      {/* Expand CTA */}
      {onExpandToFull && (
        <button
          onClick={onExpandToFull}
          className="w-full px-5 py-3 bg-primary/10 hover:bg-primary/20 transition-colors text-primary text-sm font-medium flex items-center justify-center gap-2"
        >
          View Full Analysis
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Build the briefing bullet points from analysis
 */
interface BriefingPoint {
  icon: string;
  text: string;
  color: string;
}

function buildBriefingPoints(result: AnalyzeResponse): BriefingPoint[] {
  const points: BriefingPoint[] = [];
  const { matchInfo, probabilities, valueAnalysis, riskAnalysis, momentumAndForm, upsetPotential, tacticalAnalysis } = result;

  // 1. Favorite & probability
  const homeProb = probabilities.homeWin || 0;
  const awayProb = probabilities.awayWin || 0;
  const favorite = homeProb > awayProb ? matchInfo.homeTeam : matchInfo.awayTeam;
  const favoriteProb = Math.max(homeProb, awayProb);
  
  points.push({
    icon: '📊',
    text: `${favorite} is favored at ${favoriteProb}% win probability.`,
    color: 'bg-primary/20',
  });

  // 2. Probability difference analysis (neutral, not betting advice)
  // Use oddsComparison if available, otherwise fall back to valueAnalysis
  const comp = result.oddsComparison?.comparison;
  if (result.oddsComparison?.largestDifference && result.oddsComparison.largestDifference.outcome !== 'NONE' && comp?.homeWin && comp?.awayWin) {
    const diff = result.oddsComparison.largestDifference;
    
    if (diff.difference >= 5) {
      const outcomeName = diff.outcome === 'HOME' ? matchInfo.homeTeam :
                          diff.outcome === 'AWAY' ? matchInfo.awayTeam : 'Draw';
      const aiProb = diff.outcome === 'HOME' ? comp.homeWin?.aiEstimate :
                     diff.outcome === 'AWAY' ? comp.awayWin?.aiEstimate : comp.draw?.aiEstimate;
      const marketProb = diff.outcome === 'HOME' ? comp.homeWin?.marketImplied :
                         diff.outcome === 'AWAY' ? comp.awayWin?.marketImplied : comp.draw?.marketImplied;
      
      points.push({
        icon: '🔍',
        text: `Notable difference: AI estimates ${outcomeName} at ${aiProb?.toFixed(0) ?? '?'}% vs market's ${marketProb?.toFixed(0) ?? '?'}% (${diff.difference.toFixed(0)}pp gap).`,
        color: 'bg-accent/20',
      });
    }
  } else if (valueAnalysis.bestValueSide && valueAnalysis.bestValueSide !== 'NONE') {
    // Fallback to old format but with neutral language
    const diffSide = valueAnalysis.bestValueSide === 'HOME' ? matchInfo.homeTeam :
                      valueAnalysis.bestValueSide === 'AWAY' ? matchInfo.awayTeam : 'Draw';
    points.push({
      icon: '🔍',
      text: `Largest AI vs Market difference: ${diffSide}. ${valueAnalysis.valueCommentShort}`,
      color: 'bg-accent/20',
    });
  }

  // 3. Form summary
  const homeTrend = momentumAndForm.homeTrend;
  const awayTrend = momentumAndForm.awayTrend;
  if (homeTrend !== 'UNKNOWN' || awayTrend !== 'UNKNOWN') {
    const homeIcon = homeTrend === 'RISING' ? '↑' : homeTrend === 'FALLING' ? '↓' : '→';
    const awayIcon = awayTrend === 'RISING' ? '↑' : awayTrend === 'FALLING' ? '↓' : '→';
    points.push({
      icon: '📈',
      text: `Form: ${matchInfo.homeTeam} ${homeIcon} momentum, ${matchInfo.awayTeam} ${awayIcon} momentum`,
      color: 'bg-blue-500/20',
    });
  }

  // 4. Risk warning
  points.push({
    icon: riskAnalysis.overallRiskLevel === 'HIGH' ? '⚠️' : '🛡️',
    text: riskAnalysis.riskExplanation,
    color: riskAnalysis.overallRiskLevel === 'HIGH' ? 'bg-red-500/20' : 'bg-yellow-500/20',
  });

  // 5. Upset potential
  if (upsetPotential.upsetProbability > 25) {
    points.push({
      icon: '🔥',
      text: `Upset alert (${upsetPotential.upsetProbability}%): ${upsetPotential.upsetComment}`,
      color: 'bg-orange-500/20',
    });
  }

  // 6. Key tactical insight
  if (tacticalAnalysis.keyMatchFactors && tacticalAnalysis.keyMatchFactors.length > 0) {
    points.push({
      icon: '🎯',
      text: tacticalAnalysis.keyMatchFactors[0],
      color: 'bg-purple-500/20',
    });
  }

  // 7. Psychology warning
  if (riskAnalysis.psychologyBias?.name) {
    points.push({
      icon: '🧠',
      text: `Watch out for ${riskAnalysis.psychologyBias.name}: ${riskAnalysis.psychologyBias.description}`,
      color: 'bg-pink-500/20',
    });
  }

  return points;
}
