'use client';

import { useState } from 'react';

interface FeaturedBadgeSnippetProps {
  toolName: string;
  reviewUrl: string;
}

export default function FeaturedBadgeSnippet({ toolName, reviewUrl }: FeaturedBadgeSnippetProps) {
  const [copied, setCopied] = useState(false);

  // The HTML snippet with dofollow link
  const snippet = `<a href="${reviewUrl}" title="${toolName} Review on SportBot AI" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 8px; text-decoration: none; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; color: white; font-weight: 500;">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
    <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  Featured on SportBot AI
</a>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 to-white rounded-xl shadow-lg border-2 border-emerald-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Featured Badge</h3>
          <p className="text-sm text-slate-600">Add this badge to your website</p>
        </div>
      </div>

      {/* Preview */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
        <p className="text-xs text-slate-500 mb-2">Preview:</p>
        <a 
          href={reviewUrl}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg text-white text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all"
          style={{ textDecoration: 'none' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Featured on SportBot AI
        </a>
      </div>

      {/* Code snippet */}
      <div className="relative">
        <pre className="p-4 bg-slate-900 rounded-lg text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap break-all">
          <code>{snippet}</code>
        </pre>
        <button
          onClick={handleCopy}
          className={`absolute top-2 right-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            copied 
              ? 'bg-emerald-600 text-white' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Copy this HTML and paste it on your website to link back to your review.
      </p>
    </div>
  );
}
