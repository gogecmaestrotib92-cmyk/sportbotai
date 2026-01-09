/**
 * Match Headlines Component
 * 
 * 3-4 shareable one-liner facts about the match.
 * These are the "Did You Know?" viral stats people screenshot.
 */

'use client';

import PremiumIcon from '@/components/ui/PremiumIcon';

interface Headline {
  icon: string;
  text: string;
  /** Which team this benefits, if any */
  favors?: 'home' | 'away' | 'neutral';
  /** Is this particularly shocking/shareable? */
  viral?: boolean;
}

interface MatchHeadlinesProps {
  headlines: Headline[];
  homeTeam: string;
  awayTeam: string;
}

export default function MatchHeadlines({
  headlines,
  homeTeam,
  awayTeam,
}: MatchHeadlinesProps) {
  return (
    <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-violet-600/10 rounded-xl flex items-center justify-center">
            <PremiumIcon name="lightbulb" size="xl" className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Did You Know?</h3>
            <p className="text-sm text-zinc-400">Key facts about this fixture</p>
          </div>
        </div>
        <span className="text-sm text-zinc-500 font-medium">{headlines?.length || 0} insights</span>
      </div>

      {/* Headlines List */}
      <div className="divide-y divide-zinc-800/50">
        {headlines.map((headline, index) => (
          <div 
            key={index}
            className={`px-6 py-5 flex items-start gap-5 hover:bg-white/[0.02] transition-colors ${
              headline.viral ? 'bg-gradient-to-r from-violet-500/5 to-transparent' : ''
            }`}
          >
            {/* Icon */}
            <span className="text-3xl flex-shrink-0">{headline.icon}</span>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-base text-stone-200 leading-relaxed">
                {headline.text}
              </p>
              
              {/* Favors tag - Uses neutral colors to avoid casino-like appearance */}
              {headline.favors && headline.favors !== 'neutral' && (
                <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded text-xs font-medium bg-zinc-800/50 text-zinc-300">
                  Favors {headline.favors === 'home' ? homeTeam : awayTeam}
                </span>
              )}
            </div>

            {/* Viral badge - More subtle */}
            {headline.viral && (
              <span className="flex-shrink-0 px-3 py-1.5 bg-violet-500/10 text-violet-300 text-xs font-medium rounded border border-violet-500/20">
                Key Stat
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
