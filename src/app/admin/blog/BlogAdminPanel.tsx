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

export default function BlogAdminPanel({ posts, stats }: BlogAdminPanelProps) {
  const [filter, setFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT' | 'SCHEDULED'>('all');
  const [generating, setGenerating] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter((p) => p.status === filter);

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
          <h2 className="text-lg font-semibold text-white mb-4">Generate New Post</h2>
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
