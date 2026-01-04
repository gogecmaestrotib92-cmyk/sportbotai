/**
 * Live Intel Card Component
 * 
 * Shows real-time posts from the SportBot Agent feed.
 * Fetches from /api/agent and auto-refreshes every 30 seconds.
 * Premium, minimal design matching our style.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface IntelPost {
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
}

const confidenceStyles = {
  LOW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HIGH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const confidenceLabels = {
  LOW: 'Limited Data',
  MEDIUM: 'Mixed Signals',
  HIGH: 'Strong Signal',
};

const sportEmojis: Record<string, string> = {
  soccer: '⚽',
  football: '⚽',
  basketball: '🏀',
  nba: '🏀',
  hockey: '🏒',
  nhl: '🏒',
  icehockey: '🏒',
  baseball: '⚾',
  mlb: '⚾',
  americanfootball: '🏈',
  nfl: '🏈',
  mma: '🥊',
  ufc: '🥊',
  default: '🎯',
};

/**
 * Get sport emoji from sport key (handles API keys like 'basketball_nba', 'americanfootball_nfl')
 */
function getSportEmojiFromKey(sport: string): string {
  if (!sport) return sportEmojis.default;
  const normalized = sport.toLowerCase();
  
  // Direct match first
  if (sportEmojis[normalized]) return sportEmojis[normalized];
  
  // Check for partial matches (americanfootball_nfl -> nfl)
  for (const key of Object.keys(sportEmojis)) {
    if (normalized.includes(key)) return sportEmojis[key];
  }
  
  return sportEmojis.default;
}

export default function LiveIntelCard() {
  const [posts, setPosts] = useState<IntelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  
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

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/agent?limit=3');
      const data = await response.json();
      
      if (data.success && data.posts) {
        setPosts(data.posts);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch intel posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPosts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getSportEmoji = (sport: string) => {
    return getSportEmojiFromKey(sport);
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="relative">
      {/* Card Container - Premium minimal style with green accent border */}
      <div className="bg-[#0a0a0b] border border-emerald-500/30 rounded-xl sm:rounded-2xl overflow-hidden ring-1 ring-emerald-500/10">
        {/* Header */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-accent/30">
              <span className="text-base sm:text-lg">🧠</span>
            </div>
            <div>
              <span className="text-white font-semibold text-xs sm:text-sm block">Live Intel</span>
              <p className="text-zinc-500 text-[9px] sm:text-[10px] flex items-center gap-1">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Auto-updating
              </p>
            </div>
          </div>
          <Link 
            href="/ai-desk" 
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-md sm:rounded-lg transition-all shadow-sm shadow-emerald-500/20"
          >
            Open →
          </Link>
        </div>

        {/* Posts */}
        <div className="divide-y divide-white/[0.04]">
          {loading ? (
            // Loading skeleton
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-3 sm:px-5 py-3 sm:py-4 animate-pulse">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/5 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 sm:h-3 bg-white/5 rounded w-20 sm:w-24" />
                      <div className="h-3.5 sm:h-4 bg-white/5 rounded w-full" />
                      <div className="h-2.5 sm:h-3 bg-white/5 rounded w-28 sm:w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : posts.length === 0 ? (
            // Empty state
            <div className="px-3 sm:px-5 py-6 sm:py-8 text-center">
              <p className="text-zinc-500 text-xs sm:text-sm">No intel posts yet</p>
            </div>
          ) : (
            // Real posts
            posts.map((post) => {
              const isPostExpanded = expandedPosts.has(post.id);
              const isLongContent = post.content.length > 100;
              
              return (
              <div 
                key={post.id} 
                className="px-3 sm:px-5 py-3 sm:py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl flex-shrink-0">{post.categoryIcon}</span>
                  <div className="flex-1 min-w-0">
                    {/* Category + Confidence */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                      <span className="text-zinc-400 text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">
                        {post.categoryName}
                      </span>
                      <span className={`px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-semibold rounded border ${confidenceStyles[post.confidence]}`}>
                        {confidenceLabels[post.confidence]}
                      </span>
                    </div>
                    
                    {/* Content - Expandable */}
                    <p className={`text-zinc-300 text-xs sm:text-sm leading-relaxed ${!isPostExpanded && isLongContent ? 'line-clamp-2' : ''}`}>
                      {post.content}
                    </p>
                    
                    {/* Read more/less toggle */}
                    {isLongContent && (
                      <button
                        onClick={() => togglePostExpanded(post.id)}
                        className="text-[10px] sm:text-xs text-emerald-400 hover:text-emerald-300 mt-1 transition-colors"
                      >
                        {isPostExpanded ? '← Show less' : 'Read more →'}
                      </button>
                    )}
                    
                    {/* Match ref + Time */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                      <span className="text-xs sm:text-sm">{getSportEmoji(post.sport)}</span>
                      <span className="text-zinc-400 text-[10px] sm:text-[11px] font-medium truncate">{post.matchRef}</span>
                      <span className="text-zinc-600 text-[9px] sm:text-[10px] flex-shrink-0">• {formatTime(post.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );})
          )}
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-5 py-2 sm:py-3 border-t border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 sm:gap-2">
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/[0.03] text-zinc-500 text-[8px] sm:text-[9px] font-medium rounded border border-white/[0.06]">
                ⚡ Real-Time
              </span>
              <a 
                href="https://x.com/sportbotai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 text-[8px] sm:text-[9px] font-medium rounded border border-white/[0.06] transition-colors flex items-center gap-1"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="hidden xs:inline">Follow</span>
              </a>
            </div>
            <span className="text-zinc-600 text-[8px] sm:text-[9px]">
              {formatTime(lastUpdate.toISOString())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
