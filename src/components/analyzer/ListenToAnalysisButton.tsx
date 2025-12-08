/**
 * Listen to Analysis Button Component
 * 
 * Provides text-to-speech functionality for analysis results
 * using ElevenLabs API.
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { AnalyzeResponse } from '@/types';

interface ListenToAnalysisButtonProps {
  result: AnalyzeResponse;
}

type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export default function ListenToAnalysisButton({ result }: ListenToAnalysisButtonProps) {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  /**
   * Build the text content for TTS from analysis results
   */
  const buildTTSText = useCallback((): string => {
    const parts: string[] = [];

    // Match intro
    const { homeTeam, awayTeam, leagueName, matchDate } = result.matchInfo;
    parts.push(`Analysis for ${homeTeam} versus ${awayTeam}.`);
    if (leagueName) {
      parts.push(`Competition: ${leagueName}.`);
    }
    if (matchDate) {
      const date = new Date(matchDate);
      parts.push(`Match date: ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`);
    }

    // Probabilities summary
    const { probabilities } = result;
    parts.push(`Win probabilities: ${homeTeam} has a ${probabilities.homeWin}% chance of winning.`);
    parts.push(`${awayTeam} has a ${probabilities.awayWin}% chance of winning.`);
    if (probabilities.draw !== undefined && probabilities.draw !== null) {
      parts.push(`The probability of a draw is ${probabilities.draw}%.`);
    }

    // Value analysis summary
    const { valueAnalysis } = result;
    parts.push(`Best value side: ${valueAnalysis.bestValueSide}.`);
    parts.push(valueAnalysis.valueCommentDetailed);

    // Risk analysis
    const { riskAnalysis } = result;
    parts.push(`Risk level: ${riskAnalysis.overallRiskLevel}.`);
    parts.push(riskAnalysis.riskExplanation);

    // Match narrative (the main analysis)
    const { tacticalAnalysis } = result;
    if (tacticalAnalysis.matchNarrative) {
      parts.push('Match Analysis:');
      parts.push(tacticalAnalysis.matchNarrative);
    }

    // Expert conclusion
    if (tacticalAnalysis.expertConclusionOneLiner) {
      parts.push(`Expert conclusion: ${tacticalAnalysis.expertConclusionOneLiner}`);
    }

    // Upset potential
    const { upsetPotential } = result;
    if (upsetPotential.upsetProbability > 30) {
      parts.push(`Upset alert! ${upsetPotential.upsetComment}`);
    }

    // Responsible gambling note
    parts.push('Disclaimer: This analysis is for educational purposes only. Always gamble responsibly.');

    return parts.join(' ');
  }, [result]);

  /**
   * Generate audio from ElevenLabs API
   */
  const generateAudio = async (): Promise<string | null> => {
    const text = buildTTSText();
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate audio');
      }

      // Create audio URL from base64
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
        { type: data.contentType }
      );
      
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('[TTS] Error generating audio:', error);
      throw error;
    }
  };

  /**
   * Handle play button click
   */
  const handlePlay = async () => {
    // If we have audio and it's paused, just resume
    if (audioRef.current && audioState === 'paused') {
      audioRef.current.play();
      setAudioState('playing');
      return;
    }

    // If already playing, pause
    if (audioRef.current && audioState === 'playing') {
      audioRef.current.pause();
      setAudioState('paused');
      return;
    }

    // Generate new audio
    setAudioState('loading');
    setErrorMessage('');

    try {
      // Clean up previous audio URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      const audioUrl = await generateAudio();
      if (!audioUrl) {
        throw new Error('No audio URL returned');
      }

      audioUrlRef.current = audioUrl;

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setAudioState('playing');
      audio.onpause = () => {
        if (!audio.ended) setAudioState('paused');
      };
      audio.onended = () => {
        setAudioState('idle');
      };
      audio.onerror = () => {
        setAudioState('error');
        setErrorMessage('Failed to play audio');
      };

      await audio.play();
    } catch (error) {
      setAudioState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate audio');
    }
  };

  /**
   * Handle stop button click
   */
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioState('idle');
  };

  /**
   * Get button content based on state
   */
  const getButtonContent = () => {
    switch (audioState) {
      case 'loading':
        return (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Generating Audio...</span>
          </>
        );
      case 'playing':
        return (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
            <span>Pause</span>
          </>
        );
      case 'paused':
        return (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Resume</span>
          </>
        );
      case 'error':
        return (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Retry</span>
          </>
        );
      default:
        return (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span>Listen to Analysis</span>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlay}
          disabled={audioState === 'loading'}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            audioState === 'playing'
              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              : audioState === 'error'
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : audioState === 'loading'
              ? 'bg-gray-100 text-gray-500 cursor-wait'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {getButtonContent()}
        </button>

        {/* Stop button - only show when playing or paused */}
        {(audioState === 'playing' || audioState === 'paused') && (
          <button
            onClick={handleStop}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
            title="Stop"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {audioState === 'error' && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      {/* Status indicator when playing */}
      {audioState === 'playing' && (
        <div className="flex items-center gap-2 text-sm text-primary-600">
          <span className="flex gap-0.5">
            <span className="w-1 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-1 h-5 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
            <span className="w-1 h-3 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
          </span>
          <span>Now playing analysis...</span>
        </div>
      )}
    </div>
  );
}
