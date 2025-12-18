'use client';

/**
 * AI Sports Desk Feed - Compact Sidebar Version
 * 
 * Condensed feed of SportBot Agent posts for sidebar display.
 * Auto-posts that will also sync to X/Twitter.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, RefreshCw, Radio } from 'lucide-react';

// Sport emoji mapping for API sport keys
const sportEmojis: Record<string, string> = {
  soccer: '⚽', football: '⚽', basketball: '🏀', nba: '🏀',
  hockey: '🏒', nhl: '🏒', icehockey: '🏒', baseball: '⚾', mlb: '⚾',
  americanfootball: '🏈', nfl: '🏈', mma: '🥊', ufc: '🥊', default: '🎯',
};

function getSportEmoji(sport: string): string {
  if (!sport) return sportEmojis.default;
  const normalized = sport.toLowerCase();
  if (sportEmojis[normalized]) return sportEmojis[normalized];
  for (const key of Object.keys(sportEmojis)) {
    if (normalized.includes(key)) return sportEmojis[key];
  }
  return sportEmojis.default;
}

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
}

const confidenceDots = {
  LOW: 'bg-yellow-400',
  MEDIUM: 'bg-blue-400',
  HIGH: 'bg-green-400',
};

export default function AIDeskFeedSidebar({ limit = 8 }: { limit?: number }) {
  const [posts, setPosts] = useState<AgentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  
  // Use ref to track if initial fetch has been done
  const hasFetched = useRef(false);
  
  const togglePostExpanded = (postId: string) => {
    setExpandedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/agent?limit=${limit}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit]);

  useEffect(() => {
    // Only fetch once on mount, not on every re-render
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPosts();
    }
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchPosts, 60000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-emerald-500/30 ring-1 ring-emerald-500/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-sm font-medium text-white">Loading feed...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-emerald-500/30 ring-1 ring-emerald-500/10 rounded-xl overflow-hidden">
      {/* Header - Collapsible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Live Intel Feed</span>
          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-medium rounded border border-emerald-500/30">
            AUTO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-text-muted ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </button>

      {/* Posts List */}
      {expanded && (
        <div className="border-t border-white/5">
          {posts.length === 0 ? (
            <div className="p-4 text-center text-text-muted text-sm">
              No intel available yet
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {posts.map((post, idx) => {
                const isPostExpanded = expandedPosts.has(post.id);
                const contentText = stripMarkdown(post.content);
                const isLongContent = contentText.length > 120;
                
                return (
                <div
                  key={post.id}
                  className={`px-4 py-3 hover:bg-white/5 transition-colors ${
                    idx !== posts.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  {/* Category & Time */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{post.categoryIcon}</span>
                      <span className="text-xs font-medium text-text-muted">
                        {post.categoryName}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${confidenceDots[post.confidence]}`} />
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Content - Expandable */}
                  <p className={`text-xs text-text-secondary leading-relaxed ${!isPostExpanded && isLongContent ? 'line-clamp-2' : ''}`}>
                    {contentText}
                  </p>
                  
                  {/* Read more/less toggle */}
                  {isLongContent && (
                    <button
                      onClick={() => togglePostExpanded(post.id)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 mt-1 transition-colors"
                    >
                      {isPostExpanded ? '← Show less' : 'Read more →'}
                    </button>
                  )}

                  {/* Match Reference - Teams */}
                  {post.matchRef && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-xs">{getSportEmoji(post.sport)}</span>
                      <span className="text-xs font-medium text-white/80 truncate">{post.matchRef}</span>
                      <span className="text-[10px] text-text-muted ml-auto">{post.league}</span>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
            <p className="text-[10px] text-text-muted text-center">
              Auto-posts sync to 𝕏 • AI-generated insights
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
