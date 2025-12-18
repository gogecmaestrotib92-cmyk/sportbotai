/**
 * Analysis Detail Page
 * 
 * Shows full analysis details from history
 * Robust display that works with both old and new analysis formats
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface FullAnalysis {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string | null;
  userPick: string | null;
  userStake: number | null;
  homeWinProb: number | null;
  drawProb: number | null;
  awayWinProb: number | null;
  riskLevel: string | null;
  bestValueSide: string | null;
  fullResponse: Record<string, unknown> | null;
  createdAt: string;
}

export default function AnalysisDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/history');
      return;
    }

    if (status === 'authenticated' && id) {
      fetchAnalysis();
    }
  }, [status, id, router]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/history/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Analysis not found');
        } else {
          throw new Error('Failed to fetch analysis');
        }
        return;
      }
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError('Failed to load analysis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="container-custom max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-bg-card rounded w-64"></div>
            <div className="h-48 bg-bg-card rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="container-custom text-center">
          <p className="text-danger mb-4">{error || 'Analysis not found'}</p>
          <Link href="/history" className="btn-primary">
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  // Extract data from fullResponse first, fall back to database columns
  const fr = analysis.fullResponse || {};
  
  // Get probabilities - try multiple sources
  const probs = extractProbabilities(fr, analysis);
  const story = extractStory(fr);
  const marketIntel = extractMarketIntel(fr);
  const signals = extractSignals(fr);

  return (
    <div className="min-h-screen bg-[#050506] py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Link */}
        <Link 
          href="/history" 
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 mb-6 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to History
        </Link>

        {/* Match Header - Clean Premium Style */}
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
            <span className="uppercase tracking-wider">{analysis.league}</span>
            <span>•</span>
            <span>
              {new Date(analysis.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          
          {/* Teams */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-center flex-1">
              <p className="text-lg sm:text-xl font-semibold text-white">{analysis.homeTeam}</p>
              <p className="text-[10px] text-zinc-600 uppercase mt-1">Home</p>
            </div>
            <div className="text-zinc-600 text-sm font-medium">vs</div>
            <div className="text-center flex-1">
              <p className="text-lg sm:text-xl font-semibold text-white">{analysis.awayTeam}</p>
              <p className="text-[10px] text-zinc-600 uppercase mt-1">Away</p>
            </div>
          </div>
        </div>

        {/* AI Verdict */}
        {story.favored && (
          <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 p-5 sm:p-6 mb-4">
            <h3 className="text-[10px] font-medium text-violet-400/70 uppercase tracking-widest mb-3">
              AI Verdict
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {story.favored === 'home' ? '🏠' : story.favored === 'away' ? '✈️' : '🤝'}
              </span>
              <div>
                <p className="text-lg font-semibold text-white">
                  {story.favored === 'home' ? analysis.homeTeam : 
                   story.favored === 'away' ? analysis.awayTeam : 'Draw'} Favored
                </p>
                <p className="text-sm text-zinc-400 capitalize">
                  {story.confidence || 'moderate'} confidence
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Win Probabilities - Use extracted probs */}
        {(probs.home !== null || probs.away !== null) && (
          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5 sm:p-6 mb-4">
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-4">
              Win Probabilities
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {/* Home */}
              <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <p className="text-[10px] text-zinc-500 mb-1">Home</p>
                <p className="text-xl font-bold text-white">
                  {probs.home !== null ? `${probs.home}%` : '-'}
                </p>
              </div>
              {/* Draw */}
              <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <p className="text-[10px] text-zinc-500 mb-1">Draw</p>
                <p className="text-xl font-bold text-zinc-400">
                  {probs.draw !== null ? `${probs.draw}%` : '-'}
                </p>
              </div>
              {/* Away */}
              <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <p className="text-[10px] text-zinc-500 mb-1">Away</p>
                <p className="text-xl font-bold text-white">
                  {probs.away !== null ? `${probs.away}%` : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Risk Level & Value */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Risk Level */}
          {analysis.riskLevel && (
            <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-4">
              <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2">
                Risk Level
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                analysis.riskLevel === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                analysis.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {analysis.riskLevel === 'LOW' && '🛡️'}
                {analysis.riskLevel === 'MEDIUM' && '⚡'}
                {analysis.riskLevel === 'HIGH' && '🔥'}
                {analysis.riskLevel}
              </span>
            </div>
          )}
          
          {/* Best Value Side */}
          {analysis.bestValueSide && analysis.bestValueSide !== 'NONE' && (
            <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-4">
              <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2">
                Value Detected
              </h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                ✦ {analysis.bestValueSide === 'HOME' ? analysis.homeTeam : 
                    analysis.bestValueSide === 'AWAY' ? analysis.awayTeam : 'Draw'}
              </span>
            </div>
          )}
        </div>

        {/* Market Intel */}
        {marketIntel && marketIntel.summary && (
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 p-5 sm:p-6 mb-4">
            <h3 className="text-[10px] font-medium text-emerald-400/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>📊</span> Market Intel
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed mb-3">
              {marketIntel.summary}
            </p>
            {marketIntel.valueEdgeLabel && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-zinc-500">Value Edge:</span>
                <span className={`text-sm font-medium ${
                  marketIntel.valueEdgeStrength === 'strong' ? 'text-emerald-400' :
                  marketIntel.valueEdgeStrength === 'moderate' ? 'text-yellow-400' :
                  'text-zinc-400'
                }`}>{marketIntel.valueEdgeLabel}</span>
              </div>
            )}
            {marketIntel.recommendation && (
              <div className="mt-2 p-2 rounded-lg bg-white/[0.03]">
                <span className="text-xs text-emerald-400">💡 {marketIntel.recommendation.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Universal Signals */}
        {signals && (signals.form || signals.strengthEdge || signals.tempo) && (
          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5 sm:p-6 mb-4">
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-4">
              Match Signals
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {signals.form && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 mb-1">Form</p>
                  <p className="text-sm text-white">{signals.form}</p>
                </div>
              )}
              {signals.strengthEdge && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 mb-1">Strength Edge</p>
                  <p className="text-sm text-white">{signals.strengthEdge}</p>
                </div>
              )}
              {signals.tempo && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 mb-1">Tempo</p>
                  <p className="text-sm text-white">{signals.tempo}</p>
                </div>
              )}
              {signals.efficiency && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-zinc-500 mb-1">Efficiency</p>
                  <p className="text-sm text-white">{signals.efficiency}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User's Pick */}
        {analysis.userPick && (
          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-4 mb-4">
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2">
              Your Prediction
            </h3>
            <p className="text-white font-medium">{analysis.userPick}</p>
          </div>
        )}

        {/* Story Narrative */}
        {story.narrative && (
          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5 sm:p-6 mb-4">
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3">
              Analysis Summary
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {story.narrative}
            </p>
            {story.snapshot && story.snapshot.length > 0 && (
              <ul className="mt-3 space-y-1">
                {story.snapshot.map((item, i) => (
                  <li key={i} className="text-xs text-zinc-500 italic flex items-start gap-2">
                    <span className="text-zinc-600">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Fallback: Narrative from fullResponse if story.narrative not available */}
        {!story.narrative && analysis.fullResponse && extractNarrative(analysis.fullResponse) && (
          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5 sm:p-6 mb-4">
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3">
              Analysis Summary
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {extractNarrative(analysis.fullResponse)}
            </p>
          </div>
        )}

        {/* Key Factors from fullResponse if available */}
        {analysis.fullResponse && extractKeyFactors(analysis.fullResponse).length > 0 && (
          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-5 sm:p-6 mb-4">
            <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3">
              Key Factors
            </h3>
            <ul className="space-y-2">
              {extractKeyFactors(analysis.fullResponse).map((factor, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="text-violet-400 mt-0.5">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Factors from story or fullResponse */}
        {(story.riskFactors && story.riskFactors.length > 0) ? (
          <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-5 sm:p-6 mb-4">
            <h3 className="text-[10px] font-medium text-amber-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>⚠</span> Risk Factors
            </h3>
            <ul className="space-y-2">
              {story.riskFactors.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="text-amber-400 mt-0.5">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        ) : (analysis.fullResponse && extractRiskExplanation(analysis.fullResponse)) && (
          <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-5 sm:p-6 mb-4">
            <h3 className="text-[10px] font-medium text-amber-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>⚠</span> Risk Analysis
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {extractRiskExplanation(analysis.fullResponse)}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
          <p className="text-[10px] text-zinc-600 text-center">
            This analysis is for educational purposes only. Past analysis does not guarantee future outcomes.
            Always gamble responsibly. 18+
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper functions to safely extract data from fullResponse

// Extract probabilities from multiple possible sources
function extractProbabilities(fr: Record<string, unknown>, analysis: { homeWinProb: number | null; drawProb: number | null; awayWinProb: number | null }) {
  try {
    // Try marketIntel.modelProbability first (has real AI estimates)
    const marketIntel = fr.marketIntel as Record<string, unknown> | undefined;
    if (marketIntel?.modelProbability) {
      const mp = marketIntel.modelProbability as Record<string, unknown>;
      return {
        home: mp.home as number | null,
        draw: mp.draw as number | null,
        away: mp.away as number | null,
      };
    }
    
    // Try probabilities object
    const probabilities = fr.probabilities as Record<string, unknown> | undefined;
    if (probabilities) {
      return {
        home: probabilities.homeWin as number | null,
        draw: probabilities.draw as number | null,
        away: probabilities.awayWin as number | null,
      };
    }
    
    // Try story.favored + confidence to estimate
    const story = fr.story as Record<string, unknown> | undefined;
    if (story?.favored) {
      const favored = story.favored as string;
      const confidence = story.confidence as string || 'moderate';
      const strongProb = confidence === 'strong' ? 65 : confidence === 'slight' ? 45 : 55;
      const weakProb = confidence === 'strong' ? 20 : confidence === 'slight' ? 35 : 30;
      
      return {
        home: favored === 'home' ? strongProb : favored === 'away' ? weakProb : 33,
        draw: favored === 'draw' ? 40 : 15,
        away: favored === 'away' ? strongProb : favored === 'home' ? weakProb : 33,
      };
    }
    
    // Fall back to database columns - convert if they're decimals
    const convert = (val: number | null) => {
      if (val === null) return null;
      return val <= 1 ? Math.round(val * 100) : Math.round(val);
    };
    
    return {
      home: convert(analysis.homeWinProb),
      draw: convert(analysis.drawProb),
      away: convert(analysis.awayWinProb),
    };
  } catch {
    return { home: null, draw: null, away: null };
  }
}

// Extract story/narrative content
function extractStory(fr: Record<string, unknown>) {
  try {
    const story = fr.story as Record<string, unknown> | undefined;
    return {
      favored: story?.favored as string || null,
      confidence: story?.confidence as string || null,
      narrative: story?.narrative as string || null,
      snapshot: (story?.snapshot as string[]) || [],
      riskFactors: (story?.riskFactors as string[]) || [],
    };
  } catch {
    return { favored: null, confidence: null, narrative: null, snapshot: [], riskFactors: [] };
  }
}

// Extract market intelligence
function extractMarketIntel(fr: Record<string, unknown>) {
  try {
    const mi = fr.marketIntel as Record<string, unknown> | undefined;
    if (!mi) return null;
    
    const ve = mi.valueEdge as Record<string, unknown> | undefined;
    
    return {
      summary: mi.summary as string | null,
      valueEdgeLabel: ve?.label as string | null,
      valueEdgeStrength: ve?.strength as string | null,
      recommendation: mi.recommendation as string | null,
    };
  } catch {
    return null;
  }
}

// Extract universal signals
function extractSignals(fr: Record<string, unknown>) {
  try {
    const us = fr.universalSignals as Record<string, unknown> | undefined;
    if (!us) return null;
    
    return {
      form: us.form as string || null,
      strengthEdge: us.strength_edge as string || null,
      tempo: us.tempo as string || null,
      efficiency: us.efficiency as string || null,
      availability: us.availability as string || null,
    };
  } catch {
    return null;
  }
}

function extractNarrative(fullResponse: Record<string, unknown>): string | null {
  try {
    // Try different paths where narrative might be stored
    const tacticalAnalysis = fullResponse.tacticalAnalysis as Record<string, unknown> | undefined;
    const matchNarrative = fullResponse.matchNarrative as string | undefined;
    const story = fullResponse.story as Record<string, unknown> | undefined;
    
    return (tacticalAnalysis?.matchNarrative as string) || 
           (tacticalAnalysis?.expertConclusionOneLiner as string) ||
           matchNarrative ||
           (story?.narrative as string) ||
           null;
  } catch {
    return null;
  }
}

function extractKeyFactors(fullResponse: Record<string, unknown>): string[] {
  try {
    const factors: string[] = [];
    
    // Try momentumAndForm.keyFormFactors
    const momentumAndForm = fullResponse.momentumAndForm as Record<string, unknown> | undefined;
    if (momentumAndForm?.keyFormFactors && Array.isArray(momentumAndForm.keyFormFactors)) {
      factors.push(...(momentumAndForm.keyFormFactors as string[]).slice(0, 4));
    }
    
    // Try riskAnalysis.keyRiskFactors
    const riskAnalysis = fullResponse.riskAnalysis as Record<string, unknown> | undefined;
    if (riskAnalysis?.keyRiskFactors && Array.isArray(riskAnalysis.keyRiskFactors)) {
      factors.push(...(riskAnalysis.keyRiskFactors as string[]).slice(0, 2));
    }
    
    // Try story.snapshot
    const story = fullResponse.story as Record<string, unknown> | undefined;
    if (story?.snapshot && Array.isArray(story.snapshot)) {
      factors.push(...(story.snapshot as string[]).slice(0, 4));
    }
    
    return factors.slice(0, 5);
  } catch {
    return [];
  }
}
function extractRiskExplanation(fullResponse: Record<string, unknown>): string | null {
  try {
    const riskAnalysis = fullResponse.riskAnalysis as Record<string, unknown> | undefined;
    return (riskAnalysis?.riskExplanation as string) || null;
  } catch {
    return null;
  }
}
