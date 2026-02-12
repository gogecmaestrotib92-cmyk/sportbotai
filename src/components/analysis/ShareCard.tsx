/**
 * Share Card Component
 * 
 * Quick actions to share the analysis.
 * Generate shareable image, copy link, etc.
 * Uses short URLs for cleaner sharing with OG image previews.
 */

'use client';

import { useState, useCallback } from 'react';

interface ShareCardProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  verdict: string;
  kickoff: string;
  league?: string;
  risk?: string;
  confidence?: number;
  sport?: string;
}

export default function ShareCard({
  matchId,
  homeTeam,
  awayTeam,
  verdict,
  kickoff,
  league = '',
  risk = 'MEDIUM',
  confidence = 70,
  sport = 'soccer',
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Create a short share URL with OG metadata
  const createShortUrl = useCallback(async (): Promise<string> => {
    // Return cached URL if available
    if (shortUrl) return shortUrl;
    
    // Fallback URL
    const fallbackUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/match/${matchId}`
      : `https://www.sportbotai.com/match/${matchId}`;
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          league,
          verdict,
          risk,
          confidence,
          date: kickoff,
          sport,
        }),
      });
      
      const data = await response.json();
      if (data.success && data.url) {
        setShortUrl(data.url);
        return data.url;
      }
    } catch (err) {
      console.error('Failed to create share URL:', err);
    } finally {
      setIsCreating(false);
    }
    
    return fallbackUrl;
  }, [matchId, homeTeam, awayTeam, league, verdict, risk, confidence, kickoff, sport, shortUrl]);

  const getShareText = (url: string) => 
    `🎯 ${homeTeam} vs ${awayTeam}\n\n${verdict}\n\nFull AI analysis:`;

  const handleCopyLink = async () => {
    try {
      const url = await createShortUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareTwitter = async () => {
    const url = await createShortUrl();
    const shareText = getShareText(url);
    const params = new URLSearchParams();
    params.set('text', shareText);
    params.set('url', url);
    params.set('via', 'SportBotAI');
    params.set('hashtags', 'SportBot,AIAnalysis');
    const twitterUrl = `https://twitter.com/intent/tweet?${params.toString()}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420,noopener,noreferrer');
  };

  const handleShareWhatsApp = async () => {
    const url = await createShortUrl();
    const shareText = getShareText(url);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const url = await createShortUrl();
        await navigator.share({
          title: `${homeTeam} vs ${awayTeam} Analysis`,
          text: verdict,
          url,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left side - CTA */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            Share This Analysis
          </h3>
          <p className="text-xs text-zinc-500">Help your friends prepare for the match</p>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2">
          {/* Native share (mobile) */}
          {'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="p-2.5 bg-zinc-800/60 border border-white/[0.06] rounded-xl hover:bg-zinc-700/60 transition-colors sm:hidden"
              title="Share"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}

          {/* Twitter */}
          <button
            onClick={handleShareTwitter}
            className="p-2.5 bg-zinc-800/60 border border-white/[0.06] rounded-xl hover:bg-[#1DA1F2]/20 transition-colors hidden sm:block"
            title="Share on Twitter"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="p-2.5 bg-zinc-800/60 border border-white/[0.06] rounded-xl hover:bg-[#25D366]/20 transition-colors hidden sm:block"
            title="Share on WhatsApp"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border ${
              copied 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-zinc-800/60 text-white hover:bg-zinc-700/60 border-white/[0.06]'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
