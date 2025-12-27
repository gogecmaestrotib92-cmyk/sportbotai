/**
 * AI Sports Desk Feed Component
 * 
 * Displays SportBot Agent posts in a clean, engaging feed.
 * AIXBT-style intelligence updates for sports analysis.
 * Now with real-time data powered by Perplexity.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import ShareToX, { generatePostShareText } from './ui/ShareToX';

/**
 * Strip markdown formatting from AI responses
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .trim();
}

interface AgentPost {
  id: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  content: string;
  matchRef: string;
  sport: string;
  league: string;
  timestamp: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  realTimeData?: boolean;
  citations?: string[];
}

interface FeedMeta {
  total: number;
  limit: number;
  sport: string;
  realTimeEnabled?: boolean;
}

interface AISportsDeskProps {
  sport?: string;
  limit?: number;
  compact?: boolean;
}

const confidenceColors = {
  LOW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  HIGH: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const confidenceLabels = {
  LOW: 'Limited Data',
  MEDIUM: 'Mixed Signals',
  HIGH: 'Strong Signal',
};

export default function AISportsDesk({ sport, limit = 10, compact = false }: AISportsDeskProps) {
  const [posts, setPosts] = useState<AgentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [meta, setMeta] = useState<FeedMeta | null>(null);
  
  // Track if we've fetched to prevent duplicate fetches on re-renders
  const hasFetched = useRef(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sport) params.set('sport', sport);
      params.set('limit', limit.toString());
      
      const response = await fetch(`/api/agent?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
        setMeta(data.meta);
      } else {
        setError('Failed to load intelligence feed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }, [sport, limit]);

  useEffect(() => {
    // Only fetch once on mount (or when dependencies change)
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPosts();
    }
  }, [fetchPosts]);

  const categories = ['all', ...Array.from(new Set(posts.map(p => p.categoryName)))];
  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(p => p.categoryName === selectedCategory);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Sports Desk</h2>
            <p className="text-xs text-text-muted">Match Intelligence Feed</p>
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-24 mb-3" />
            <div className="h-4 bg-white/10 rounded w-full mb-2" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
        <span className="text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl flex items-center justify-center border border-white/10">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Sports Desk</h2>
            <p className="text-xs text-text-muted">Live Match Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {meta?.realTimeEnabled && (
            <div className="flex items-center gap-1.5 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20">
              <span className="text-[10px]">⚡</span>
              <span className="text-[10px] text-purple-400 font-medium">Real-Time</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-text-muted">Live</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {!compact && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10'
              }`}
            >
              {cat === 'all' ? 'All Updates' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <span className="text-3xl mb-2 block">📭</span>
            <p>No intelligence updates yet</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <AgentPostCard key={post.id} post={post} compact={compact} />
          ))
        )}
      </div>

      {/* Footer */}
      {!compact && posts.length > 0 && (
        <div className="text-center pt-4">
          <button 
            onClick={fetchPosts}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Refresh Feed
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Agent Post Card Component
// ============================================

function AgentPostCard({ post, compact }: { post: AgentPost; compact: boolean }) {
  const timeAgo = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });
  const [showCitations, setShowCitations] = useState(false);

  return (
    <div className="bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-xl p-4 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{post.categoryIcon}</span>
          <span className="text-xs font-medium text-text-secondary">{post.categoryName}</span>
          {post.realTimeData && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <span>⚡</span>
              <span>Live Data</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${confidenceColors[post.confidence]}`}>
            {confidenceLabels[post.confidence]}
          </span>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-white leading-relaxed mb-3">
        {stripMarkdown(post.content)}
      </p>

      {/* Citations (if available) */}
      {post.citations && post.citations.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowCitations(!showCitations)}
            className="text-[10px] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
          >
            <span>📎</span>
            <span>{post.citations.length} source{post.citations.length > 1 ? 's' : ''}</span>
            <span>{showCitations ? '▲' : '▼'}</span>
          </button>
          {showCitations && (
            <div className="mt-2 space-y-1">
              {post.citations.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[10px] text-primary/70 hover:text-primary truncate"
                >
                  {url}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">{post.matchRef}</span>
          <span>•</span>
          <span>{post.league}</span>
        </div>
        <div className="flex items-center gap-3">
          <ShareToX
            text={generatePostShareText(post.content, post.matchRef)}
            hashtags={['SportBot', 'AIAnalysis']}
            variant="text"
          />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Hover action */}
      {!compact && (
        <div className="mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            View Match Analysis →
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Standalone Post Component (for sharing)
// ============================================

export function StandaloneAgentPost({ post }: { post: AgentPost }) {
  return (
    <div className="max-w-md mx-auto bg-gradient-to-b from-bg-secondary to-bg-primary border border-white/10 rounded-2xl p-6">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
          <span className="text-sm">🧠</span>
        </div>
        <div>
          <span className="text-sm font-bold text-white">SportBot Agent</span>
          <span className="text-xs text-text-muted ml-2">AI Sports Desk</span>
        </div>
      </div>

      {/* Category */}
      <div className="flex items-center gap-2 mb-3">
        <span>{post.categoryIcon}</span>
        <span className="text-xs text-primary font-medium">{post.categoryName}</span>
      </div>

      {/* Content */}
      <p className="text-white text-lg leading-relaxed mb-4">
        {stripMarkdown(post.content)}
      </p>

      {/* Match Reference */}
      <div className="bg-white/5 rounded-lg px-3 py-2 mb-4">
        <span className="text-sm text-text-secondary">{post.matchRef}</span>
        <span className="text-xs text-text-muted ml-2">• {post.league}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>sportbot.ai</span>
        <span>{new Date(post.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
