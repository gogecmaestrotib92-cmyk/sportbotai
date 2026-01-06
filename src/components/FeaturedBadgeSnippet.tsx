'use client';

import { useState } from 'react';
import Image from 'next/image';

interface FeaturedBadgeSnippetProps {
  toolName: string;
  reviewUrl: string;
}

export default function FeaturedBadgeSnippet({ toolName, reviewUrl }: FeaturedBadgeSnippetProps) {
  const [copied, setCopied] = useState(false);

  // The HTML snippet with dofollow link and SportBot logo
  const logoUrl = 'https://www.sportbotai.com/logo.svg';
  const snippet = `<a href="${reviewUrl}" title="${toolName} Review on SportBot AI" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px; text-decoration: none; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; color: white; font-weight: 500;">
  <img src="${logoUrl}" alt="SportBot AI" width="24" height="24" style="border-radius: 4px;">
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
        <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center p-1">
          <Image src="/logo.svg" alt="SportBot AI" width={32} height={32} />
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg text-white text-sm font-medium hover:from-slate-800 hover:to-slate-700 transition-all"
          style={{ textDecoration: 'none' }}
        >
          <Image src="/logo.svg" alt="SportBot AI" width={24} height={24} className="rounded" />
          Featured on SportBot AI
        </a>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${
          copied 
            ? 'bg-emerald-600 text-white' 
            : 'bg-slate-900 text-white hover:bg-slate-800'
        }`}
      >
        {copied ? '✓ Copied!' : 'Copy Badge Code'}
      </button>

      <p className="mt-3 text-xs text-slate-500 text-center">
        Paste this HTML on your website to display the badge
      </p>
    </div>
  );
}
