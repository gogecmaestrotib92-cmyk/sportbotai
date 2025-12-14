'use client';

/**
 * AI Desk Chat Component
 * 
 * Interactive chat powered by Perplexity (real-time search) + GPT (reasoning)
 * Ask any sports question and get intelligent, data-driven answers.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles, ExternalLink, X, MessageCircle, Volume2, VolumeX, Square } from 'lucide-react';

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
// SUGGESTED QUESTIONS - Showcasing different categories
// ============================================

const SUGGESTED_QUESTIONS = [
  // Rosters & Squads
  "Who is the starting goalkeeper for Real Madrid?",
  // Injuries
  "What's the latest injury news for Arsenal?",
  // Fixtures
  "When do Liverpool play next in the Premier League?",
  // Results
  "What was the score in last night's NBA games?",
  // Standings
  "Who's top of the Serie A table?",
  // Stats
  "How many goals has Haaland scored this season?",
  // Transfers
  "Any transfer rumors for the January window?",
  // Managers
  "What did Klopp say in his last press conference?",
  // Odds
  "What are the odds for the Lakers game tonight?",
  // Comparisons
  "Compare Messi and Ronaldo's stats this season",
];

// Helper to get random questions (stable for SSR)
function getRandomQuestions(count: number): string[] {
  const shuffled = [...SUGGESTED_QUESTIONS];
  // Use a simple shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// ============================================
// COMPONENT
// ============================================

export default function AIDeskChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Store random questions to prevent re-shuffle on every render
  const [suggestedQuestions] = useState(() => getRandomQuestions(4));
  
  // Audio state for TTS
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

    // Add user message
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

      // Add assistant message
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
  // COLLAPSED STATE - Floating Button
  // ==========================================
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
        title="Ask SportBot anything"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-bg animate-pulse" />
      </button>
    );
  }

  // ==========================================
  // EXPANDED STATE - Chat Window
  // ==========================================
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-card border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">SportBot Chat</h3>
            <p className="text-xs text-text-muted flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by GPT + Perplexity
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-text-muted hover:text-white transition-colors px-2 py-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          // Welcome state with suggestions
          <div className="h-full flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-white font-medium mb-2">Ask me anything about sports!</h4>
              <p className="text-text-muted text-sm">
                I combine real-time search with AI reasoning to give you the best answers.
              </p>
            </div>
            
            {/* Suggested questions - show 4 random ones */}
            <div className="space-y-2">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Try asking:</p>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-text-secondary hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Chat messages
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-primary/20' 
                    : 'bg-gradient-to-br from-primary/20 to-accent/20'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-primary" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </div>

                {/* Message content */}
                <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-md'
                      : 'bg-white/[0.03] text-white/90 rounded-tl-md border border-white/[0.06]'
                  }`}>
                    <p className={`whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'text-sm'
                        : 'text-[14px] leading-[1.7] tracking-[-0.01em] font-light'
                    }`}>{msg.content}</p>
                  </div>

                  {/* Real-time search indicator */}
                  {msg.role === 'assistant' && msg.usedRealTimeSearch && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                      <Sparkles className="w-3 h-3" />
                      <span>Used real-time search</span>
                    </div>
                  )}

                  {/* Voice read button for assistant messages */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => playMessage(msg.id, msg.content)}
                        disabled={audioState === 'loading' && playingMessageId === msg.id}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
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
                      {audioState === 'error' && playingMessageId === msg.id && (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <VolumeX className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </div>
                  )}

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-text-muted">Sources:</p>
                      {msg.citations.slice(0, 3).map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 truncate"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{new URL(url).hostname}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-2xl rounded-tl-md">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-text-muted">Searching & analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any match, team, or player..."
            disabled={isLoading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2 text-center">
          Real-time sports intelligence • No betting advice
        </p>
      </div>
    </div>
  );
}
