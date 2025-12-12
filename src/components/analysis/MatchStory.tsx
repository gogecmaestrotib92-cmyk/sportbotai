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
  
  const confidenceLabel = {
    strong: { text: 'Strong lean', color: 'text-green-400', bg: 'bg-green-500/20' },
    moderate: { text: 'Moderate lean', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    slight: { text: 'Slight lean', color: 'text-orange-400', bg: 'bg-orange-500/20' },
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
    <div className="bg-gradient-to-br from-[#0F1114] via-[#12151A] to-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header with verdict */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-accent/30 to-primary/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Match Analysis</h2>
              <p className="text-sm text-text-muted">Why we think this match will play out</p>
            </div>
          </div>
          
          {/* Audio option */}
          {audioUrl && (
            <button
              onClick={handlePlayAudio}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              {isPlaying ? (
                <span className="w-5 h-5 flex items-center justify-center">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
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
      <div className="px-5 py-4 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border-b border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {favored === 'draw' ? '🤝' : favored === 'home' ? '🏠' : '✈️'}
            </span>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Our Analysis Points To</p>
              <h3 className="text-xl font-bold text-white">
                {favored === 'draw' ? 'A Draw' : `${favoredTeam} Win`}
              </h3>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${confidenceLabel.bg} ${confidenceLabel.color}`}>
            {confidenceLabel.text}
          </span>
        </div>
      </div>

      {/* The Narrative */}
      <div className="p-5">
        <div className="prose prose-invert prose-sm max-w-none">
          {narrative.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-text-secondary leading-relaxed mb-4 last:mb-0 text-[15px]">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Supporting Stats */}
        {supportingStats.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/5">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Data Behind This Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {supportingStats.map((stat, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5"
                >
                  <span className="text-xl">{stat.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{stat.stat}</p>
                    <p className="text-xs text-text-muted">{stat.context}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-3 bg-white/[0.02] border-t border-white/5">
        <p className="text-[10px] text-text-muted text-center">
          This is AI-generated analysis for educational purposes • Not betting advice • Football is unpredictable
        </p>
      </div>
    </div>
  );
}
