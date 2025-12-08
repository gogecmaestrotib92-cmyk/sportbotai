/**
 * ElevenLabs Text-to-Speech API Route
 * 
 * POST /api/tts
 * 
 * Converts text to speech using ElevenLabs API.
 * Returns base64 encoded audio.
 */

import { NextRequest, NextResponse } from 'next/server';

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Default voice ID - Rachel (clear, professional female voice)
// Other options: 21m00Tcm4TlvDq8ikWAM (Rachel), EXAVITQu4vr4xnSDxMaL (Bella), ErXwobaYiN019PkySvjV (Antoni)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

interface TTSRequest {
  text: string;
  voiceId?: string;
}

interface TTSResponse {
  success: boolean;
  audioBase64?: string;
  contentType?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<TTSResponse>> {
  try {
    // Validate API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('[TTS] ELEVENLABS_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'TTS service not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body: TTSRequest = await request.json();
    const { text, voiceId = DEFAULT_VOICE_ID } = body;

    // Validate text
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    // Limit text length to prevent abuse (ElevenLabs has limits)
    const maxLength = 5000;
    const trimmedText = text.slice(0, maxLength);

    if (text.length > maxLength) {
      console.warn(`[TTS] Text truncated from ${text.length} to ${maxLength} characters`);
    }

    // Call ElevenLabs API
    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: trimmedText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    // Handle ElevenLabs API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS] ElevenLabs API error:', response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 500 }
        );
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Failed to generate audio' },
        { status: 500 }
      );
    }

    // Convert audio response to base64
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    console.log(`[TTS] Successfully generated audio for ${trimmedText.length} characters`);

    return NextResponse.json({
      success: true,
      audioBase64,
      contentType: 'audio/mpeg',
    });

  } catch (error) {
    console.error('[TTS] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
