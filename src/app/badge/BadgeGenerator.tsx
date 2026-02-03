/**
 * Badge Generator Client Component
 * 
 * Allows users to preview and copy the badge embed code.
 */

'use client';

import { useState } from 'react';

const BADGE_STYLES = {
  dark: {
    name: 'Dark',
    bg: '#0D0D12',
    text: '#ffffff',
    accent: '#10B981',
  },
  light: {
    name: 'Light', 
    bg: '#ffffff',
    text: '#1f2937',
    accent: '#059669',
  },
};

export default function BadgeGenerator() {
  const [style, setStyle] = useState<'dark' | 'light'>('dark');
  const [copied, setCopied] = useState(false);

  const badgeUrl = 'https://www.sportbotai.com';
  const selectedStyle = BADGE_STYLES[style];

  // Generate embed code
  const embedCode = `<a href="${badgeUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:${selectedStyle.bg};border-radius:8px;border:1px solid ${style === 'dark' ? '#374151' : '#e5e7eb'};text-decoration:none;font-family:system-ui,-apple-system,sans-serif;">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${selectedStyle.accent}" stroke-width="1.5">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/>
  </svg>
  <span style="color:${selectedStyle.text};font-size:14px;font-weight:600;">Featured on SportBot AI</span>
</a>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Style Selector */}
      <div className="card-glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">1. Choose Style</h2>
        <div className="flex gap-3">
          {(Object.keys(BADGE_STYLES) as Array<'dark' | 'light'>).map((key) => (
            <button
              key={key}
              onClick={() => setStyle(key)}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                style === key
                  ? 'border-accent bg-accent/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-white font-medium">{BADGE_STYLES[key].name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="card-glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">2. Preview</h2>
        <div 
          className="flex justify-center p-8 rounded-lg"
          style={{ background: style === 'dark' ? '#1f2937' : '#f3f4f6' }}
        >
          {/* Live Badge Preview */}
          <a 
            href={badgeUrl}
            target="_blank"
            rel="noopener"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: selectedStyle.bg,
              borderRadius: '8px',
              border: `1px solid ${style === 'dark' ? '#374151' : '#e5e7eb'}`,
              textDecoration: 'none',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={selectedStyle.accent} strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/>
            </svg>
            <span style={{ color: selectedStyle.text, fontSize: '14px', fontWeight: 600 }}>
              Featured on SportBot AI
            </span>
          </a>
        </div>
      </div>

      {/* Embed Code */}
      <div className="card-glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">3. Copy Embed Code</h2>
        <div className="relative">
          <pre className="bg-black/50 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              copied
                ? 'bg-accent text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Paste this code in your website&apos;s HTML where you want the badge to appear.
        </p>
      </div>

      {/* Notification */}
      <div className="card-glass rounded-xl p-4 border-accent/30 bg-accent/5">
        <p className="text-sm text-gray-300">
          <strong className="text-accent">📧 Let us know!</strong> After adding the badge, 
          reply to our email and we&apos;ll upgrade your backlink to dofollow within 24 hours.
        </p>
      </div>
    </div>
  );
}
