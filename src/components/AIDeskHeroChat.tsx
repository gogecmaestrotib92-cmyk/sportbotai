'use client';

/**
 * AI Desk Hero Chat Component
 * 
 * Full-width embedded chat - the main feature of AI Desk page.
 * Powered by Perplexity (real-time search) + GPT (reasoning)
 * 
 * Features:
 * - Streaming responses
 * - Voice input (Speech Recognition)
 * - Feedback buttons (thumbs up/down)
 * - TTS audio playback
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Trash2, Volume2, VolumeX, Square, ThumbsUp, ThumbsDown, Mic, MicOff } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  usedRealTimeSearch?: boolean;
  followUps?: string[];
  fromCache?: boolean;
  isStreaming?: boolean;
  feedbackGiven?: 'up' | 'down' | null;
  timestamp: Date;
}

interface ChatResponse {
  success: boolean;
  response: string;
  citations?: string[];
  usedRealTimeSearch?: boolean;
  error?: string;
}

// Audio playback states
type AudioState = 'idle' | 'loading' | 'playing' | 'error';

// Voice input states
type VoiceState = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Strip markdown formatting from AI responses
 * Removes bold (**text**), headers (##), and other markdown syntax
 */
function stripMarkdown(text: string): string {
  return text
    // Remove bold markers: **text** or __text__
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Remove italic markers: *text* or _text_ (single)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1')
    // Remove headers: ## text or ### text
    .replace(/^#{1,6}\s+/gm, '')
    // Clean up numbered list markers at start: 1. 2. etc
    .replace(/^\d+\.\s+/gm, '')
    .trim();
}

// ============================================
// SUGGESTED QUESTIONS - Diverse categories
// ============================================

const SUGGESTED_QUESTIONS = [
  { text: "Who is the starting goalkeeper for Real Madrid?", icon: "👥", category: "Rosters" },
  { text: "What's the latest injury news for Arsenal?", icon: "🏥", category: "Injuries" },
  { text: "When do Liverpool play next?", icon: "📅", category: "Fixtures" },
  { text: "What was the score in last night's NBA games?", icon: "📊", category: "Results" },
  { text: "Who's top of the Serie A table?", icon: "🏆", category: "Standings" },
  { text: "How many goals has Haaland scored this season?", icon: "⚽", category: "Stats" },
  { text: "Any transfer rumors for the January window?", icon: "💰", category: "Transfers" },
  { text: "What did Guardiola say about the upcoming match?", icon: "🎙️", category: "Press" },
  { text: "What are the odds for the Lakers game tonight?", icon: "📈", category: "Odds" },
  { text: "Compare Messi and Ronaldo's stats this season", icon: "⚔️", category: "Compare" },
];

function getRandomQuestions(count: number) {
  // Return first N items for SSR stability (shuffled on client)
  return SUGGESTED_QUESTIONS.slice(0, count);
}

// ============================================
// COMPONENT
// ============================================

export default function AIDeskHeroChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState(() => getRandomQuestions(6));
  
  // Audio state for TTS
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  
  // Voice input state
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Shuffle questions on client mount only (after hydration)
  useEffect(() => {
    const shuffled = [...SUGGESTED_QUESTIONS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSuggestedQuestions(shuffled.slice(0, 6));
  }, []);

  // Auto-scroll to bottom (block: 'nearest' prevents page scroll)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  // ==========================================
  // TEXT-TO-SPEECH FUNCTIONS
  // ==========================================
  
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setPlayingMessageId(null);
    setAudioState('idle');
  }, []);

  const playMessage = useCallback(async (messageId: string, text: string) => {
    // If already playing this message, stop it
    if (playingMessageId === messageId && audioState === 'playing') {
      stopAudio();
      return;
    }

    // Stop any currently playing audio
    stopAudio();

    setPlayingMessageId(messageId);
    setAudioState('loading');

    try {
      // Clean text for TTS (remove markdown, links, etc.)
      const cleanText = text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic
        .replace(/`([^`]+)`/g, '$1') // Remove code
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate audio');
      }

      // Create audio from base64
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
        { type: data.contentType }
      );
      
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingMessageId(null);
        setAudioState('idle');
      };

      audio.onerror = () => {
        setAudioState('error');
        setPlayingMessageId(null);
      };

      await audio.play();
      setAudioState('playing');

    } catch (err) {
      console.error('TTS error:', err);
      setAudioState('error');
      setPlayingMessageId(null);
    }
  }, [playingMessageId, audioState, stopAudio]);

  // ==========================================
  // VOICE INPUT FUNCTIONS
  // ==========================================
  
  // Check for speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceState('unsupported');
    }
  }, []);

  const startVoiceInput = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceState('unsupported');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      setInput(transcript);
      
      // If final result, process it
      if (event.results[event.results.length - 1].isFinal) {
        setVoiceState('processing');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setVoiceState(event.error === 'not-allowed' ? 'unsupported' : 'error');
    };

    recognition.onend = () => {
      if (voiceState === 'listening') {
        // If we have input, send it
        if (input.trim()) {
          sendMessage(input.trim());
        }
      }
      setVoiceState('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [input, voiceState]);

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceState('idle');
  }, []);

  // ==========================================
  // FEEDBACK FUNCTIONS
  // ==========================================
  
  const submitFeedback = useCallback(async (
    messageId: string,
    rating: 'up' | 'down',
    query: string,
    response: string,
    meta?: { usedRealTimeSearch?: boolean; fromCache?: boolean }
  ) => {
    try {
      const res = await fetch('/api/ai-chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          query,
          response,
          rating: rating === 'up' ? 5 : 1,
          usedRealTimeSearch: meta?.usedRealTimeSearch,
          fromCache: meta?.fromCache,
        }),
      });

      if (res.ok) {
        // Update message to show feedback given
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, feedbackGiven: rating } : m
        ));
      }
    } catch (err) {
      console.error('Feedback error:', err);
    }
  }, []);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setError(null);
    setInput('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create placeholder for streaming response
    const assistantMessageId = (Date.now() + 1).toString();
    let streamedContent = '';
    let streamCitations: string[] = [];
    let streamUsedSearch = false;
    let streamFollowUps: string[] = [];

    try {
      // Use streaming endpoint
      const response = await fetch('/api/ai-chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const contentType = response.headers.get('Content-Type') || '';
      const isStreamable = contentType.includes('text/event-stream') || response.body !== null;
      let isFromCache = false;

      if (response.ok && isStreamable && response.body) {
        // Add empty assistant message for streaming
        setMessages(prev => [...prev, {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          isStreaming: true,
          timestamp: new Date(),
        }]);
        setIsLoading(false);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'metadata') {
                    streamCitations = data.citations || [];
                    streamUsedSearch = data.usedRealTimeSearch;
                    streamFollowUps = data.followUps || [];
                    isFromCache = data.fromCache || false;
                  } else if (data.type === 'content') {
                    streamedContent += data.content;
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { 
                            ...m, 
                            content: streamedContent, 
                            citations: streamCitations, 
                            usedRealTimeSearch: streamUsedSearch,
                            followUps: streamFollowUps,
                            fromCache: isFromCache,
                            isStreaming: true,
                          }
                        : m
                    ));
                  } else if (data.type === 'followUps') {
                    // Update with smart follow-ups (generated after response completes)
                    streamFollowUps = data.followUps || [];
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, followUps: streamFollowUps }
                        : m
                    ));
                  } else if (data.type === 'done') {
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, isStreaming: false }
                        : m
                    ));
                  } else if (data.type === 'error') {
                    throw new Error(data.error);
                  }
                } catch {
                  // Ignore JSON parse errors
                }
              }
            }
          }
          
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId 
              ? { ...m, isStreaming: false }
              : m
          ));
        } finally {
          reader.releaseLock();
        }
      } else {
        // Fallback to non-streaming
        const data: ChatResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to get response');
        }

        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: data.response,
          citations: data.citations,
          usedRealTimeSearch: data.usedRealTimeSearch,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== assistantMessageId || m.content));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="bg-bg-secondary border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-180px)] min-h-[500px] max-h-[900px]">
      {/* Clear button - only show when there are messages */}
      {messages.length > 0 && (
        <div className="flex justify-end px-4 py-2 border-b border-white/5">
          <button
            onClick={clearChat}
            className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors px-3 py-1.5 hover:bg-white/5 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          // Welcome state - minimalistic
          <div className="h-full flex flex-col justify-end max-w-3xl mx-auto pb-4">
            {/* Minimal suggested prompts - inline hints */}
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q.text)}
                  className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-text-muted hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all hover:bg-white/5 active:scale-95"
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Chat messages
          <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-primary/20' 
                    : 'bg-gradient-to-br from-primary/20 to-accent/20'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  ) : (
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  )}
                </div>

                {/* Message content */}
                <div className={`flex-1 max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-md'
                      : 'bg-white/[0.03] text-white/90 rounded-tl-md border border-white/[0.06]'
                  }`}>
                    <p className={`whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'text-[13px] sm:text-sm leading-relaxed'
                        : 'text-[13px] sm:text-[15px] leading-[1.6] sm:leading-[1.7] tracking-[-0.01em] font-light'
                    }`}>
                      {msg.role === 'assistant' ? stripMarkdown(msg.content) : msg.content}
                      {msg.role === 'assistant' && msg.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse rounded-sm" />
                      )}
                    </p>
                  </div>

                  {/* Status indicators */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {msg.fromCache && (
                        <div className="flex items-center gap-1 text-xs text-yellow-400/70">
                          <span className="text-[10px]">⚡</span>
                          <span>Instant</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voice read & Feedback buttons for assistant messages */}
                  {msg.role === 'assistant' && msg.content && !msg.isStreaming && (
                    <div className="flex items-center gap-2 mt-2">
                      {/* Listen button */}
                      <button
                        onClick={() => playMessage(msg.id, msg.content)}
                        disabled={audioState === 'loading' && playingMessageId === msg.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                          playingMessageId === msg.id && audioState === 'playing'
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : playingMessageId === msg.id && audioState === 'loading'
                            ? 'bg-white/5 text-text-muted cursor-wait'
                            : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
                        }`}
                        title={playingMessageId === msg.id && audioState === 'playing' ? 'Stop' : 'Listen'}
                      >
                        {playingMessageId === msg.id && audioState === 'loading' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : playingMessageId === msg.id && audioState === 'playing' ? (
                          <>
                            <Square className="w-3.5 h-3.5" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                      
                      {/* Feedback buttons */}
                      {!msg.feedbackGiven ? (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => {
                              const userMsg = messages.find((m, i) => 
                                m.role === 'user' && messages[i + 1]?.id === msg.id
                              );
                              submitFeedback(msg.id, 'up', userMsg?.content || '', msg.content, {
                                usedRealTimeSearch: msg.usedRealTimeSearch,
                                fromCache: msg.fromCache,
                              });
                            }}
                            className="p-1.5 rounded-lg bg-white/5 text-text-muted hover:bg-green-500/20 hover:text-green-400 transition-all"
                            title="Good response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const userMsg = messages.find((m, i) => 
                                m.role === 'user' && messages[i + 1]?.id === msg.id
                              );
                              submitFeedback(msg.id, 'down', userMsg?.content || '', msg.content, {
                                usedRealTimeSearch: msg.usedRealTimeSearch,
                                fromCache: msg.fromCache,
                              });
                            }}
                            className="p-1.5 rounded-lg bg-white/5 text-text-muted hover:bg-red-500/20 hover:text-red-400 transition-all"
                            title="Needs improvement"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted ml-2">
                          {msg.feedbackGiven === 'up' ? '👍 Thanks!' : '👎 Noted'}
                        </span>
                      )}
                      
                      {audioState === 'error' && playingMessageId === msg.id && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <VolumeX className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Follow-up suggestions */}
                  {msg.role === 'assistant' && msg.followUps && msg.followUps.length > 0 && !msg.isStreaming && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Follow up:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.followUps.map((followUp, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(followUp)}
                            disabled={isLoading}
                            className="text-xs px-2.5 py-1.5 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 rounded-lg text-text-secondary hover:text-white transition-all disabled:opacity-50"
                          >
                            {followUp}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 bg-white/5 rounded-xl sm:rounded-2xl sm:rounded-tl-md border border-white/5">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary" />
                  <span className="text-xs sm:text-sm text-text-muted">Searching & analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Input Area - Large prominent input with voice button */}
      <div className="p-4 sm:p-6 border-t border-white/10 bg-gradient-to-t from-bg-secondary to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={voiceState === 'listening' ? 'Listening...' : 'Ask anything about sports...'}
              disabled={isLoading || voiceState === 'listening'}
              rows={3}
              className={`w-full bg-white/[0.03] border rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 pr-28 sm:pr-32 text-sm sm:text-base text-white placeholder-text-muted/50 focus:outline-none focus:bg-white/[0.05] disabled:opacity-50 resize-none min-h-[100px] sm:min-h-[140px] transition-all ${
                voiceState === 'listening' 
                  ? 'border-red-500/50 animate-pulse' 
                  : 'border-white/10 focus:border-primary/30'
              }`}
            />
            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 flex items-center gap-2">
              {/* Voice input button */}
              {voiceState !== 'unsupported' && (
                <button
                  onClick={voiceState === 'listening' ? stopVoiceInput : startVoiceInput}
                  disabled={isLoading}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                    voiceState === 'listening'
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title={voiceState === 'listening' ? 'Stop listening' : 'Voice input'}
                >
                  {voiceState === 'listening' ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-white" />
                  )}
                </button>
              )}
              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-text-muted/50 mt-2 text-center">
            AI-powered • Not betting advice
          </p>
        </div>
      </div>
    </div>
  );
}
