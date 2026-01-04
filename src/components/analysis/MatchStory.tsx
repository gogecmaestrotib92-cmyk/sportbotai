/**
 * Match Story Component
 * 
 * THE HERO - AI-generated narrative explaining who will win and WHY.
 * Storytelling format backed by data. This is what makes us unique.
 */

'use client';

import { useState } from 'react';

interface MatchStoryProps {
  homeTeam: string;
  awayTeam: string;
  /** Which team the AI favors */
  favored: 'home' | 'away' | 'draw';
  /** Confidence: how strong is the lean */
  confidence: 'strong' | 'moderate' | 'slight';
  /** The narrative - 2-3 paragraphs explaining WHY */
  narrative: string;
  /** Key data points that support the narrative */
  supportingStats: Array<{
    icon: string;
    stat: string;
    context: string;
  }>;
  /** Optional audio version */
  audioUrl?: string;
}

export default function MatchStory({
  homeTeam,
  awayTeam,
  favored,
  confidence,
  narrative,
  supportingStats,
  audioUrl,
}: MatchStoryProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const favoredTeam = favored === 'home' ? homeTeam : favored === 'away' ? awayTeam : 'Draw';
  
  // RESTRAINED COLOR SYSTEM:
  // - Strong: subtle emerald (only when there's real edge)
  // - Moderate: neutral zinc
  // - Slight: neutral zinc (no color for weak signals)
  const confidenceLabel = {
    strong: { text: 'Strong lean', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    moderate: { text: 'Moderate lean', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    slight: { text: 'Slight lean', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
  }[confidence];

  const handlePlayAudio = () => {
    if (!audioUrl) return;
    
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    const newAudio = new Audio(audioUrl);
    newAudio.onended = () => setIsPlaying(false);
    newAudio.onerror = () => setIsPlaying(false);
    newAudio.play();
    setAudio(newAudio);
    setIsPlaying(true);
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/80 rounded-2xl border border-zinc-800/50 overflow-hidden">
      {/* Header with verdict */}
      <div className="px-6 py-5 border-b border-zinc-800/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-violet-600/10 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🎯</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Match Analysis</h2>
              <p className="text-sm text-zinc-400">Why we think this match will play out</p>
            </div>
          </div>
          
          {/* Audio option */}
          {audioUrl && (
            <button
              onClick={handlePlayAudio}
              className="flex items-center gap-2 px-5 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              {isPlaying ? (
                <span className="w-5 h-5 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-pulse" />
                </span>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
              <span className="text-sm text-white font-medium">
                {isPlaying ? 'Playing...' : 'Listen'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* The Verdict Banner */}
      <div className="px-6 py-5 bg-zinc-900/70 border-b border-zinc-800/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="text-3xl">
              {favored === 'draw' ? '🤝' : favored === 'home' ? '🏠' : '✈️'}
            </span>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Our Analysis Points To</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {favored === 'draw' ? 'A Draw' : `${favoredTeam} Win`}
              </h3>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${confidenceLabel.bg} ${confidenceLabel.color}`}>
            {confidenceLabel.text}
          </span>
        </div>
      </div>

      {/* The Narrative */}
      <div className="p-6">
        <div className="prose prose-invert max-w-none">
          {narrative.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-stone-300 leading-relaxed mb-5 last:mb-0 text-base">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Supporting Stats */}
        {supportingStats && supportingStats.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-800/50">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Data Behind This Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {supportingStats.map((stat, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50"
                >
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="text-base font-semibold text-white">{stat.stat}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">{stat.context}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-4 bg-zinc-900/30 border-t border-zinc-800/50">
        <p className="text-xs text-zinc-500 text-center">
          This is AI-generated analysis for educational purposes • Not betting advice • Football is unpredictable
        </p>
      </div>
    </div>
  );
}
