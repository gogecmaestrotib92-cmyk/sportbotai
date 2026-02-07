/**
 * Match Card Component - i18n Version
 * 
 * A clickable card that links to the match preview page.
 * Used on homepage and match discovery pages.
 * Shows LIVE score when match is in progress.
 * Supports localization.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TeamLogo from '@/components/ui/TeamLogo';
import LeagueLogo from '@/components/ui/LeagueLogo';
import MatchCountdown from '@/components/ui/MatchCountdown';
import { Locale } from '@/lib/i18n/translations';
import { generateMatchSlug } from '@/lib/match-utils';

interface LiveScore {
  homeScore: number;
  awayScore: number;
  status: { short: string; elapsed: number | null };
}

// Status codes that indicate finished games
const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AOT', 'AP', 'POST', 'FT/OT', 'CANC', 'ABD', 'AWD', 'WO'];

// Translations for MatchCard
const matchCardTranslations = {
  en: {
    live: 'LIVE',
    fullTime: 'Full Time',
    ft: 'FT',
    hot: 'HOT',
    watchLive: 'Watch Live',
    viewRecap: 'View Recap',
    viewInsights: 'View Insights',
    tomorrow: 'Tomorrow',
    inProgress: 'In Progress',
    finished: 'Finished',
  },
  sr: {
    live: 'UŽIVO',
    fullTime: 'Kraj',
    ft: 'KRAJ',
    hot: 'HOT',
    watchLive: 'Gledaj Uživo',
    viewRecap: 'Pogledaj Rezime',
    viewInsights: 'Pogledaj',
    tomorrow: 'Sutra',
    inProgress: 'U toku',
    finished: 'Završeno',
  },
};

interface MatchCardI18nProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sportKey: string;
  commenceTime: string;
  hotScore?: number;
  tags?: string[];
  locale: Locale;
  /** Optional badge to display (e.g., "🔥 Hottest", "📊 Trending") */
  badge?: string;
  /** Optional context line to show under teams */
  contextLine?: string;
}

export default function MatchCardI18n({
  homeTeam,
  awayTeam,
  league,
  sportKey,
  commenceTime,
  hotScore = 0,
  tags = [],
  locale,
  badge,
  contextLine,
}: MatchCardI18nProps) {
  const t = matchCardTranslations[locale];
  const localePath = locale === 'sr' ? '/sr' : '';
  
  const [liveScore, setLiveScore] = useState<LiveScore | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Detect sport type for live scores API
  const getSportType = (sport: string): string => {
    const s = sport.toLowerCase();
    if (s.includes('nba') || s === 'basketball_nba') return 'nba';
    if (s.includes('basketball')) return 'basketball';
    if (s.includes('nfl') || s === 'americanfootball_nfl') return 'nfl';
    if (s.includes('american') || s.includes('ncaaf')) return 'american_football';
    if (s.includes('nhl') || s === 'hockey_nhl') return 'nhl';
    if (s.includes('hockey')) return 'hockey';
    return 'soccer';
  };

  // Check if match might be live or finished
  useEffect(() => {
    const kickoff = new Date(commenceTime);
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    
    // Only check if match started within last 6 hours (covers live + recently finished)
    if (kickoff <= now && kickoff >= sixHoursAgo) {
      const checkLive = async () => {
        try {
          const sportType = getSportType(sportKey);
          const res = await fetch(`/api/live-scores?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}&sport=${sportType}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.match) {
            const statusShort = data.match.status?.short || '';
            const isGameFinished = FINISHED_STATUSES.includes(statusShort);
            
            if (isGameFinished) {
              setIsFinished(true);
              setIsLive(false);
              setLiveScore({
                homeScore: data.match.homeScore,
                awayScore: data.match.awayScore,
                status: data.match.status,
              });
            } else if (data.status === 'live') {
              setIsLive(true);
              setIsFinished(false);
              setLiveScore({
                homeScore: data.match.homeScore,
                awayScore: data.match.awayScore,
                status: data.match.status,
              });
            }
          }
        } catch {}
      };
      checkLive();
      // Refresh every 60 seconds for list views (only if not finished)
      if (!isFinished) {
        const interval = setInterval(checkLive, 60000);
        return () => clearInterval(interval);
      }
    }
  }, [homeTeam, awayTeam, commenceTime, sportKey, isFinished]);

  // Generate clean, SEO-friendly URL slug
  const matchSlug = generateMatchSlug(homeTeam, awayTeam, sportKey, commenceTime);

  // Format match date - only called within useEffect/event handlers
  const [formattedDate, setFormattedDate] = useState<string>('');
  
  useEffect(() => {
    const formatMatchDate = (dateString: string) => {
      const matchDate = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (matchDate.toDateString() === today.toDateString()) {
        return matchDate.toLocaleTimeString(locale === 'sr' ? 'sr-Latn' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      }
      if (matchDate.toDateString() === tomorrow.toDateString()) {
        return t.tomorrow;
      }
      return matchDate.toLocaleDateString(locale === 'sr' ? 'sr-Latn' : 'en-US', { month: 'short', day: 'numeric' });
    };
    setFormattedDate(formatMatchDate(commenceTime));
  }, [commenceTime, locale, t.tomorrow]);

  // Determine if match is clickable (only upcoming matches can be analyzed)
  const isClickable = !isLive && !isFinished;

  // Common card styles
  const cardClassName = `group relative card-glass rounded-xl ${isLive ? 'border-red-500/40 ring-1 ring-red-500/20' : isFinished ? 'border-gray-600/40' : 'border-white/10'} p-3 sm:p-4 ${isClickable ? 'hover:border-accent/40 hover:bg-white/[0.08] hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/5 active:scale-[0.98] cursor-pointer' : 'cursor-default'} transition-all duration-300 ease-out block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg touch-manipulation ${isFinished ? 'opacity-80' : ''}`;

  // Card content (shared between Link and div)
  const cardContent = (
    <>
      {/* Live Badge */}
      {isLive && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-[10px] font-bold text-white shadow-lg shadow-red-500/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
          </span>
          {t.live}
        </div>
      )}
      
      {/* Finished Badge */}
      {isFinished && liveScore && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-zinc-700 rounded-full text-[10px] font-bold text-white shadow-lg">
          {t.ft}
        </div>
      )}
      
      {/* Custom Badge (e.g., "🔥 Hottest", "📊 Trending") - takes priority over HOT */}
      {!isLive && !isFinished && badge && (
        <div className="absolute -top-2 -right-2 px-2.5 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-[10px] font-bold text-white shadow-lg shadow-orange-500/30">
          {badge}
        </div>
      )}
      
      {/* Hot Score Badge (fallback if no custom badge and hotScore >= 8) */}
      {!isLive && !isFinished && !badge && hotScore >= 8 && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-accent rounded-full text-[10px] font-bold text-white shadow-lg shadow-accent/30">
          {t.hot}
        </div>
      )}

      {/* League & Time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LeagueLogo leagueName={league || sportKey} sport={sportKey} size="sm" />
          <span className="text-xs text-gray-400 truncate max-w-[120px]">{league}</span>
        </div>
        {isLive && liveScore ? (
          <span className="text-xs text-red-400 font-mono font-medium">
            {liveScore.status.elapsed ? `${liveScore.status.elapsed}'` : liveScore.status.short}
          </span>
        ) : isFinished && liveScore ? (
          <span className="text-xs text-gray-500 font-medium">
            {t.fullTime}
          </span>
        ) : (
          <MatchCountdown commenceTime={commenceTime} size="sm" />
        )}
      </div>

      {/* Teams with Score */}
      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`flex-shrink-0 transition-transform duration-300 ${isClickable ? 'group-hover:scale-110' : ''}`}>
            <TeamLogo teamName={homeTeam} sport={sportKey} league={league} size="md" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white truncate" title={homeTeam}>{homeTeam}</span>
        </div>

        {/* Score Display - Live or Finished */}
        {(isLive || isFinished) && liveScore ? (
          <div className="flex items-center gap-1 px-2">
            <span className={`text-xl font-bold font-mono ${
              isLive 
                ? (liveScore.homeScore > liveScore.awayScore ? 'text-green-400' : 'text-white')
                : (liveScore.homeScore > liveScore.awayScore ? 'text-green-400' : liveScore.homeScore < liveScore.awayScore ? 'text-gray-400' : 'text-white')
            }`}>
              {liveScore.homeScore}
            </span>
            <span className="text-gray-600 text-lg font-medium">-</span>
            <span className={`text-xl font-bold font-mono ${
              isLive 
                ? (liveScore.awayScore > liveScore.homeScore ? 'text-green-400' : 'text-white')
                : (liveScore.awayScore > liveScore.homeScore ? 'text-green-400' : liveScore.awayScore < liveScore.homeScore ? 'text-gray-400' : 'text-white')
            }`}>
              {liveScore.awayScore}
            </span>
          </div>
        ) : (
          <span className={`text-gray-400 text-sm font-medium px-2 ${isClickable ? 'group-hover:text-gray-300' : ''} transition-colors`}>vs</span>
        )}

        {/* Away Team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-xs sm:text-sm font-bold text-white truncate text-right" title={awayTeam}>{awayTeam}</span>
          <div className={`flex-shrink-0 transition-transform duration-300 ${isClickable ? 'group-hover:scale-110' : ''}`}>
            <TeamLogo teamName={awayTeam} sport={sportKey} league={league} size="md" />
          </div>
        </div>
      </div>

      {/* Context Line - Shows market signals/intelligence */}
      {contextLine && (
        <div className="mt-2 px-1">
          <p className="text-[11px] text-amber-400/80 truncate">
            {contextLine}
          </p>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {tags.slice(0, 2).map((tag) => (
            <span 
              key={tag}
              className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-400 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Match time + Status/CTA */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-text-muted" suppressHydrationWarning>{formattedDate}</span>
        {isLive ? (
          // LIVE: Show status indicator (not clickable)
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400"></span>
            </span>
            {t.inProgress}
          </span>
        ) : isFinished ? (
          // FINISHED: Show finished status (not clickable)
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-gray-500/15 text-gray-400 border border-gray-500/30 rounded-full">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {t.finished}
          </span>
        ) : (
          // UPCOMING: Show clickable CTA
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-accent/15 text-accent border border-accent/30 rounded-full group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all">
            <span className="w-1.5 h-1.5 bg-accent rounded-full group-hover:bg-white animate-pulse"></span>
            {t.viewInsights}
            <svg className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>
    </>
  );

  // Render as Link for upcoming matches, div for live/finished
  if (isClickable) {
    return (
      <Link
        href={`${localePath}/match/${matchSlug}`}
        scroll={false}
        className={cardClassName}
        data-card
      >
        {cardContent}
      </Link>
    );
  }

  // Non-clickable card for live/finished matches
  return (
    <div className={cardClassName} data-card>
      {cardContent}
    </div>
  );
}
