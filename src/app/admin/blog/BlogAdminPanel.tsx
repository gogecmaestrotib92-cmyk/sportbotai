'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string | null;
  views: number;
  createdAt: Date;
  publishedAt: Date | null;
  featuredImage: string | null;
  postType?: string;
}

interface BlogAdminPanelProps {
  posts: BlogPost[];
  stats: {
    total: number;
    published: number;
    draft: number;
    scheduled: number;
    totalViews: number;
  };
}

const SPORTS_OPTIONS = [
  { value: 'soccer_spain_la_liga', label: '⚽ La Liga (Spain)' },
  { value: 'soccer_epl', label: '⚽ Premier League' },
  { value: 'soccer_germany_bundesliga', label: '⚽ Bundesliga' },
  { value: 'soccer_italy_serie_a', label: '⚽ Serie A' },
  { value: 'soccer_france_ligue_one', label: '⚽ Ligue 1' },
  { value: 'soccer_uefa_champs_league', label: '⚽ Champions League' },
  { value: 'basketball_nba', label: '🏀 NBA' },
  { value: 'americanfootball_nfl', label: '🏈 NFL' },
  { value: 'icehockey_nhl', label: '🏒 NHL' },
  { value: 'mma_mixed_martial_arts', label: '🥊 UFC/MMA' },
];

export default function BlogAdminPanel({ posts, stats }: BlogAdminPanelProps) {
  const [filter, setFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT' | 'SCHEDULED'>('all');
  const [generating, setGenerating] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Match Preview State
  const [selectedSport, setSelectedSport] = useState('soccer_spain_la_liga');
  const [matchGenerating, setMatchGenerating] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<Array<{
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
    league: string;
  }>>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter((p) => p.status === filter);

  // Fetch upcoming matches for selected sport
  const handleFetchMatches = async () => {
    setLoadingMatches(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/match-data?sportKey=${selectedSport}`);
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        setUpcomingMatches(data.events.slice(0, 10)); // Limit to 10 matches
        if (data.events.length === 0) {
          setMessage({ type: 'error', text: 'No upcoming matches found for this sport' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch matches' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error fetching matches' });
    } finally {
      setLoadingMatches(false);
    }
  };

  // Generate match preview blog post
  const handleGenerateMatchPreview = async () => {
    const match = upcomingMatches.find(m => m.matchId === selectedMatch);
    if (!match) {
      setMessage({ type: 'error', text: 'Please select a match' });
      return;
    }

    setMatchGenerating(true);
    setMessage(null);

    try {
      const sportLabel = SPORTS_OPTIONS.find(s => s.value === selectedSport)?.label || selectedSport;
      const res = await fetch('/api/blog/match-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.matchId,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          sport: sportLabel.split(' ')[1] || 'soccer',
          sportKey: selectedSport,
          league: match.league,
          commenceTime: match.commenceTime,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ Match preview created! View: /blog/${data.slug}` 
        });
        setSelectedMatch(null);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate match preview' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setMatchGenerating(false);
    }
  };

  // Generate batch match previews
  const handleGenerateBatch = async () => {
    setMatchGenerating(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/blog/match-preview?sportKey=${selectedSport}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ Generated ${data.generated} posts, skipped ${data.skipped} existing` 
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate batch' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setMatchGenerating(false);
    }
  };

  const handleGeneratePost = async () => {
    if (!keyword.trim()) {
      setMessage({ type: 'error', text: 'Please enter a keyword' });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Post created: ${data.post?.title || 'Success!'}` });
        setKeyword('');
        // Reload page to see new post
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate post' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeletePost = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Post deleted' });
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete post' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handlePublishPost = async (id: string) => {
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED', publishedAt: new Date().toISOString() }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Post published!' });
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: 'Failed to publish' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleUnpublishPost = async (id: string) => {
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Post unpublished' });
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: 'Failed to unpublish' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Link href="/admin" className="text-accent hover:underline text-sm mb-2 inline-block">
              ← Back to Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Blog Management</h1>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-bg-secondary rounded-xl p-4 border border-white/10">
            <p className="text-text-muted text-sm">Total Posts</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-white/10">
            <p className="text-text-muted text-sm">Published</p>
            <p className="text-2xl font-bold text-green-400">{stats.published}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-white/10">
            <p className="text-text-muted text-sm">Drafts</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.draft}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-white/10">
            <p className="text-text-muted text-sm">Scheduled</p>
            <p className="text-2xl font-bold text-blue-400">{stats.scheduled}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-white/10">
            <p className="text-text-muted text-sm">Total Views</p>
            <p className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
          </div>
        </div>

        {/* Generate New Post */}
        <div className="bg-bg-secondary rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Generate New Post (Keyword)</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword (e.g., 'NBA analytics', 'Premier League predictions')"
              className="flex-1 bg-bg-primary border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent"
              disabled={generating}
            />
            <button
              onClick={handleGeneratePost}
              disabled={generating || !keyword.trim()}
              className="px-6 py-3 bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Post'}
            </button>
          </div>
          <p className="text-text-muted text-sm mt-2">
            AI will research the topic, generate content, and create a featured image. This takes ~30-60 seconds.
          </p>
        </div>

        {/* Generate Match Preview */}
        <div className="bg-gradient-to-r from-accent/10 to-purple-500/10 rounded-xl p-6 border border-accent/30 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚽</span>
            <h2 className="text-lg font-semibold text-white">Generate Match Preview</h2>
            <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">NEW</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Select Sport & Fetch */}
            <div>
              <label className="block text-sm text-text-muted mb-2">Select Sport/League</label>
              <div className="flex gap-2">
                <select
                  value={selectedSport}
                  onChange={(e) => {
                    setSelectedSport(e.target.value);
                    setUpcomingMatches([]);
                    setSelectedMatch(null);
                  }}
                  className="flex-1 bg-bg-primary border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                  disabled={matchGenerating}
                >
                  {SPORTS_OPTIONS.map((sport) => (
                    <option key={sport.value} value={sport.value}>
                      {sport.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleFetchMatches}
                  disabled={loadingMatches || matchGenerating}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg text-white transition-colors"
                >
                  {loadingMatches ? '...' : '🔄'}
                </button>
              </div>
              
              {/* Match List */}
              {upcomingMatches.length > 0 && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  <label className="block text-sm text-text-muted mb-2">Select Match</label>
                  {upcomingMatches.map((match) => (
                    <label
                      key={match.matchId}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedMatch === match.matchId
                          ? 'bg-accent/20 border border-accent'
                          : 'bg-bg-primary/50 border border-white/5 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="match"
                        value={match.matchId}
                        checked={selectedMatch === match.matchId}
                        onChange={(e) => setSelectedMatch(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">
                          {match.homeTeam} vs {match.awayTeam}
                        </p>
                        <p className="text-text-muted text-xs">
                          {new Date(match.commenceTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {selectedMatch === match.matchId && (
                        <span className="text-accent">✓</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-text-muted text-sm mb-4">
                  Generate AI-powered match preview with team analysis, head-to-head stats, 
                  key players, tactical breakdown, and prediction. Includes team logos!
                </p>
                <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
                  <span className="px-2 py-1 bg-white/5 rounded">📊 Stats Tables</span>
                  <span className="px-2 py-1 bg-white/5 rounded">⚡ AI Analysis</span>
                  <span className="px-2 py-1 bg-white/5 rounded">🖼️ Team Logos</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGenerateMatchPreview}
                  disabled={matchGenerating || !selectedMatch}
                  className="w-full px-6 py-3 bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2"
                >
                  {matchGenerating ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Generating (~30s)...
                    </>
                  ) : (
                    <>
                      <span>🎯</span>
                      Generate Selected Match
                    </>
                  )}
                </button>
                <button
                  onClick={handleGenerateBatch}
                  disabled={matchGenerating}
                  className="w-full px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 disabled:opacity-50 rounded-lg font-medium text-purple-300 transition-colors flex items-center justify-center gap-2"
                >
                  <span>📦</span>
                  Generate All Upcoming ({SPORTS_OPTIONS.find(s => s.value === selectedSport)?.label.split(' ')[1]})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'PUBLISHED', 'DRAFT', 'SCHEDULED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-muted hover:text-white'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              {' '}
              ({status === 'all' ? stats.total : status === 'PUBLISHED' ? stats.published : status === 'DRAFT' ? stats.draft : stats.scheduled})
            </button>
          ))}
        </div>

        {/* Posts Table */}
        <div className="bg-bg-secondary rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-primary/50">
                <tr>
                  <th className="text-left px-4 py-3 text-text-muted text-sm font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-text-muted text-sm font-medium hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-text-muted text-sm font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-text-muted text-sm font-medium hidden md:table-cell">Views</th>
                  <th className="text-left px-4 py-3 text-text-muted text-sm font-medium hidden lg:table-cell">Created</th>
                  <th className="text-right px-4 py-3 text-text-muted text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                      No posts found
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-4">
                        <Link 
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-white hover:text-accent font-medium line-clamp-2"
                        >
                          {post.title}
                        </Link>
                        <p className="text-text-muted text-xs mt-1 truncate max-w-xs">
                          /blog/{post.slug}
                        </p>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="text-text-muted text-sm">{post.category}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          post.status === 'PUBLISHED' 
                            ? 'bg-green-500/20 text-green-400' 
                            : post.status === 'DRAFT'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-text-muted text-sm">{post.views.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-text-muted text-sm">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === 'DRAFT' ? (
                            <button
                              onClick={() => handlePublishPost(post.id)}
                              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-medium"
                            >
                              Publish
                            </button>
                          ) : post.status === 'PUBLISHED' && (
                            <button
                              onClick={() => handleUnpublishPost(post.id)}
                              className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded text-xs font-medium"
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePost(post.id, post.title)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
