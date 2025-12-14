'use client';

/**
 * AI Desk Hero Chat Component
 * 
 * Full-width embedded chat - the main feature of AI Desk page.
 * Powered by Perplexity (real-time search) + GPT (reasoning)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles, ExternalLink, Trash2, Volume2, VolumeX, Square } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  usedRealTimeSearch?: boolean;
  timestamp: Date;
}

interface ChatResponse {
  success: boolean;
  response: string;
  citations: string[];
  usedRealTimeSearch: boolean;
  error?: string;
}

// Audio playback states
type AudioState = 'idle' | 'loading' | 'playing' | 'error';

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
  const shuffled = [...SUGGESTED_QUESTIONS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// ============================================
// COMPONENT
// ============================================

export default function AIDeskHeroChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions] = useState(() => getRandomQuestions(6));
  
  // Audio state for TTS
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    try {
      const response = await fetch('/api/ai-chat', {
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

      const data: ChatResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        citations: data.citations,
        usedRealTimeSearch: data.usedRealTimeSearch,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
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
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              SportBot Chat
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                LIVE
              </span>
            </h2>
            <p className="text-sm text-text-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              GPT-4 + Perplexity Real-Time Search
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors px-3 py-2 hover:bg-white/5 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          // Welcome state - minimalistic
          <div className="h-full flex flex-col justify-end max-w-3xl mx-auto pb-4">
            {/* Minimal suggested prompts - inline hints */}
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q.text)}
                  className="px-4 py-2 text-xs text-text-muted hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all hover:bg-white/5"
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Chat messages
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-primary/20' 
                    : 'bg-gradient-to-br from-primary/20 to-accent/20'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-5 h-5 text-primary" />
                  ) : (
                    <Bot className="w-5 h-5 text-primary" />
                  )}
                </div>

                {/* Message content */}
                <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-5 py-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-md'
                      : 'bg-white/[0.03] text-white/90 rounded-tl-md border border-white/[0.06]'
                  }`}>
                    <p className={`whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'text-sm leading-relaxed'
                        : 'text-[15px] leading-[1.7] tracking-[-0.01em] font-light'
                    }`}>{msg.content}</p>
                  </div>

                  {/* Real-time search indicator */}
                  {msg.role === 'assistant' && msg.usedRealTimeSearch && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400">
                      <Sparkles className="w-3 h-3" />
                      <span>Used real-time web search</span>
                    </div>
                  )}

                  {/* Voice read button for assistant messages */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2">
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
                            <span>Generating audio...</span>
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
                      {audioState === 'error' && playingMessageId === msg.id && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <VolumeX className="w-3 h-3" />
                          Failed to generate audio
                        </span>
                      )}
                    </div>
                  )}

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-text-muted">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.slice(0, 4).map((url, i) => {
                          // Skip if not a valid URL
                          if (!url || typeof url !== 'string' || !url.startsWith('http')) {
                            return null;
                          }
                          try {
                            const urlObj = new URL(url);
                            const hostname = urlObj.hostname.replace('www.', '');
                            return (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-md"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {hostname}
                              </a>
                            );
                          } catch {
                            return null;
                          }
                        }).filter(Boolean)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-3 px-5 py-4 bg-white/5 rounded-2xl rounded-tl-md border border-white/5">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-text-muted">Searching the web & analyzing...</span>
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

      {/* Input Area - Large prominent input */}
      <div className="p-6 border-t border-white/10 bg-gradient-to-t from-bg-secondary to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about sports..."
              disabled={isLoading}
              rows={4}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 pr-16 text-base text-white placeholder-text-muted/50 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] disabled:opacity-50 resize-none min-h-[140px] transition-all"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="absolute bottom-4 right-4 w-10 h-10 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-text-muted/50 mt-2 text-center">
            AI-powered • Not betting advice
          </p>
        </div>
      </div>
    </div>
  );
}
