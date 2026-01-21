/**
 * AI Desk Chat Types
 * 
 * Shared type definitions for the AI Desk chat components.
 */

/**
 * Structured match analysis data for rich display in chat
 * This enables displaying the same data as match pages in chat responses
 */
export interface MatchAnalysisData {
    matchInfo: {
        id: string;
        homeTeam: string;
        awayTeam: string;
        league: string;
        sport: string;
        kickoff: string;
        venue?: string;
    };
    story: {
        favored: 'home' | 'away' | 'draw';
        confidence: 'strong' | 'moderate' | 'slight';
        narrative?: string;
        snapshot?: string[];
    };
    universalSignals?: {
        form?: string;
        strength_edge?: string;
        tempo?: string;
        efficiency_edge?: string;
        availability_impact?: string;
        display?: {
            form?: { home: string; away: string; label: string };
            edge?: { direction: string; percentage: number; label: string };
            tempo?: { level: string; label: string };
            efficiency?: { winner: string | null; label: string };
            availability?: { level: string; label: string };
        };
    };
    expectedScores?: {
        home: number;
        away: number;
    };
    matchUrl: string;  // Link to full analysis page
}

/**
 * Represents a single message in the chat
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: string[];
    usedRealTimeSearch?: boolean;
    followUps?: string[];
    fromCache?: boolean;
    isStreaming?: boolean;
    statusMessage?: string;  // Shows "Searching..." or "Generating..." during processing
    feedbackGiven?: 'up' | 'down' | null;
    timestamp: Date;
    // Data confidence for quality tracking
    dataConfidenceLevel?: string;
    dataConfidenceScore?: number;
    // Structured match analysis for rich display (instead of text)
    matchAnalysis?: MatchAnalysisData;
}

/**
 * Audio playback states for TTS
 */
export type AudioState = 'idle' | 'loading' | 'playing' | 'error';

/**
 * Voice input states for speech recognition
 */
export type VoiceState = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';
