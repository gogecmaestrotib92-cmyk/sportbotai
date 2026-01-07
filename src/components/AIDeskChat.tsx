'use client';

/**
 * AI Desk Chat Component
 * 
 * Interactive chat powered by Perplexity (real-time search) + GPT (reasoning)
 * Ask any sports question and get intelligent, data-driven answers.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Bot, User, Loader2, Sparkles, X, MessageCircle, Volume2, VolumeX, Square, ThumbsUp, ThumbsDown, Mic, MicOff, Zap } from 'lucide-react';
import Link from 'next/link';
import TypingIndicator from '@/components/ui/TypingIndicator';

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
  statusMessage?: string;  // Shows "Searching..." or "Generating..." during processing
  feedbackGiven?: 'up' | 'down' | null;
  timestamp: Date;
  // Data confidence for quality tracking
  dataConfidenceLevel?: string;
  dataConfidenceScore?: number;
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
// SUGGESTED QUESTIONS - Dynamic from API, fallback to static
// ============================================

const FALLBACK_QUESTIONS = [
  // Match Analysis (shows users we can analyze matches)
  "Analyze Real Madrid vs Barcelona",
  // Injuries
  "What's the latest injury news for Arsenal?",
  // Standings
  "Who's top of the Serie A table?",
  // Stats
  "How many goals has Haaland scored this season?",
  // Transfers
  "Any transfer rumors for the January window?",
  // Fixtures
  "When do Liverpool play next in the Premier League?",
];

// Get initial questions for SSR
function getInitialQuestions(count: number): string[] {
  return FALLBACK_QUESTIONS.slice(0, count);
}

// ============================================
// COMPONENT
// ============================================

export default function AIDeskChat() {
  const { data: session } = useSession();
  const userPlan = (session?.user as any)?.plan || 'FREE';
  const isFreePlan = userPlan === 'FREE';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Start with stable questions, fetch dynamic ones on mount
  const [suggestedQuestions, setSuggestedQuestions] = useState(() => getInitialQuestions(4));
  
  // Audio state for TTS
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  
  // Voice input state
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch dynamic prompts on client mount
  useEffect(() => {
    async function fetchDynamicPrompts() {
      try {
        const response = await fetch('/api/suggested-prompts');
        if (!response.ok) throw new Error('Failed to fetch prompts');
        
        const data = await response.json();
        if (data.prompts && Array.isArray(data.prompts) && data.prompts.length > 0) {
          // Take first 4 prompts (first one should be today's match)
          setSuggestedQuestions(data.prompts.slice(0, 4));
        }
      } catch (err) {
        console.error('[AIDeskChat] Error fetching dynamic prompts:', err);
        // Fallback: shuffle static questions
        const shuffled = [...FALLBACK_QUESTIONS];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setSuggestedQuestions(shuffled.slice(0, 4));
      }
    }
    
    fetchDynamicPrompts();
  }, []);

  // Auto-scroll to bottom (block: 'nearest' prevents page scroll)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    meta?: { 
      usedRealTimeSearch?: boolean; 
      fromCache?: boolean;
      dataConfidenceLevel?: string;
      dataConfidenceScore?: number;
    }
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
          dataConfidenceLevel: meta?.dataConfidenceLevel,
          dataConfidenceScore: meta?.dataConfidenceScore,
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

    // Add user message
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
      // Try streaming endpoint first
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

      // Check if response is OK and has a body we can stream
      const contentType = response.headers.get('Content-Type') || '';
      const isStreamable = contentType.includes('text/event-stream') || response.body !== null;
      let isFromCache = false;
      
      if (response.ok && isStreamable && response.body) {
        // Add assistant message with initial "Thinking..." status
        setMessages(prev => [...prev, {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          isStreaming: true,
          statusMessage: 'Thinking...',  // Show immediately
          timestamp: new Date(),
        }]);
        setIsLoading(false); // Show the streaming message

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = ''; // Buffer for incomplete lines

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'status') {
                    // Update status message (e.g., "Searching real-time data...")
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, statusMessage: data.status, isStreaming: true }
                        : m
                    ));
                  } else if (data.type === 'metadata') {
                    streamCitations = data.citations || [];
                    streamUsedSearch = data.usedRealTimeSearch;
                    streamFollowUps = data.followUps || [];
                    isFromCache = data.fromCache || false;
                    const dataConfidenceLevel = data.dataConfidenceLevel;
                    const dataConfidenceScore = data.dataConfidenceScore;
                    // Clear status message when we get metadata (about to stream content)
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, statusMessage: undefined, dataConfidenceLevel, dataConfidenceScore }
                        : m
                    ));
                  } else if (data.type === 'content') {
                    streamedContent += data.content;
                    // Update the message with streamed content
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
                            statusMessage: undefined,  // Clear status when content arrives
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
                    // Mark streaming as complete
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, isStreaming: false, statusMessage: undefined }
                        : m
                    ));
                  } else if (data.type === 'error') {
                    throw new Error(data.error);
                  }
                } catch (parseError) {
                  // Ignore JSON parse errors for incomplete chunks
                  console.log('[Chat] Parse error, skipping chunk');
                }
              }
            }
          }
          
          // Ensure streaming is marked complete after reader is done
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId 
              ? { ...m, isStreaming: false }
              : m
          ));
        } finally {
          reader.releaseLock();
        }
      } else {
        // Non-streaming response (error or fallback)
        const data = await response.json();
        
        // Handle rate limit specifically
        if (response.status === 429) {
          throw new Error(data.message || `You've reached your daily message limit. Upgrade for more!`);
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || data.message || 'Failed to get response');
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
      // Remove the empty streaming message if it was added
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
                    {/* Status message (e.g., "Searching real-time data...") */}
                    {msg.role === 'assistant' && msg.statusMessage && !msg.content && (
                      <div className="flex items-center gap-2 text-sm text-primary/80 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{msg.statusMessage}</span>
                      </div>
                    )}
                    <p className={`whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'text-sm'
                        : 'text-[14px] leading-[1.7] tracking-[-0.01em] font-light'
                    } ${msg.role === 'assistant' && msg.statusMessage && !msg.content ? 'hidden' : ''}`}>
                      {msg.role === 'assistant' ? stripMarkdown(msg.content) : msg.content}
                      {msg.role === 'assistant' && msg.isStreaming && !msg.statusMessage && (
                        <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse rounded-sm" />
                      )}
                    </p>
                  </div>

                  {/* Status indicators */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {msg.fromCache && (
                        <div className="flex items-center gap-1 text-xs text-yellow-400/70">
                          <span className="text-[10px]">⚡</span>
                          <span>Instant</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voice read button for assistant messages */}
                  {msg.role === 'assistant' && msg.content && !msg.isStreaming && (
                    <div className="flex items-center gap-2 mt-2">
                      {/* Listen button */}
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
                                dataConfidenceLevel: msg.dataConfidenceLevel,
                                dataConfidenceScore: msg.dataConfidenceScore,
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
                                dataConfidenceLevel: msg.dataConfidenceLevel,
                                dataConfidenceScore: msg.dataConfidenceScore,
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
                  {msg.role === 'assistant' && msg.followUps && msg.followUps.length > 0 && msg.content && (
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
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl rounded-tl-md">
                  <TypingIndicator size="md" />
                  <span className="text-sm text-text-muted">Searching & analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error message with upgrade CTA for limit errors */}
      {error && (
        <div className="px-4 py-2 sm:py-3 bg-red-500/10 border-t border-red-500/20">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-red-400 flex-1">{error}</p>
            {error.toLowerCase().includes('limit') && userPlan === 'FREE' && (
              <Link
                href="/pricing#pro"
                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Zap className="w-3 h-3" />
                Upgrade to Pro
              </Link>
            )}
            {error.toLowerCase().includes('limit') && userPlan === 'PRO' && (
              <Link
                href="/pricing#premium"
                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-zinc-300 to-zinc-400 hover:from-zinc-200 hover:to-zinc-300 text-zinc-900 text-xs font-medium rounded-lg transition-colors"
              >
                <Zap className="w-3 h-3" />
                Upgrade to Premium
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voiceState === 'listening' ? 'Listening...' : 'Ask about any match...'}
            disabled={isLoading || voiceState === 'listening'}
            className={`flex-1 bg-white/5 border rounded-xl px-3 sm:px-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none disabled:opacity-50 ${
              voiceState === 'listening' 
                ? 'border-red-500/50 animate-pulse' 
                : 'border-white/10 focus:border-primary/50'
            }`}
          />
          
          {/* Voice input button */}
          {voiceState !== 'unsupported' && (
            <button
              onClick={voiceState === 'listening' ? stopVoiceInput : startVoiceInput}
              disabled={isLoading}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
                voiceState === 'listening'
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              title={voiceState === 'listening' ? 'Stop listening' : 'Voice input'}
            >
              {voiceState === 'listening' ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>
          )}
          
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 sm:w-12 sm:h-12 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
        <p className="text-[10px] sm:text-xs text-text-muted mt-2 text-center">
          Real-time sports intelligence • No betting advice
        </p>
      </div>
    </div>
  );
}
