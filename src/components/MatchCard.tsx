/**
 * Match Card Component
 * 
 * A clickable card that links to the match preview page.
 * Used on homepage and match discovery pages.
 * Shows LIVE score when match is in progress.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TeamLogo from '@/components/ui/TeamLogo';
import LeagueLogo from '@/components/ui/LeagueLogo';
import MatchCountdown from '@/components/ui/MatchCountdown';

interface LiveScore {
  homeScore: number;
  awayScore: number;
  status: { short: string; elapsed: number | null };
}

interface MatchCardProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sportKey: string;
  commenceTime: string;
  hotScore?: number;
  tags?: string[];
}

export default function MatchCard({
  matchId,
  homeTeam,
  awayTeam,
  league,
  sportKey,
  commenceTime,
  hotScore = 0,
  tags = [],
}: MatchCardProps) {
  const [liveScore, setLiveScore] = useState<LiveScore | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Check if match might be live
  useEffect(() => {
    const kickoff = new Date(commenceTime);
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    // Only check if match started within last 3 hours
    if (kickoff <= now && kickoff >= threeHoursAgo) {
      const checkLive = async () => {
        try {
          const res = await fetch(`/api/live-scores?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === 'live' && data.match) {
            setIsLive(true);
            setLiveScore({
              homeScore: data.match.homeScore,
              awayScore: data.match.awayScore,
              status: data.match.status,
            });
          }
        } catch {}
      };
      checkLive();
      // Refresh every 60 seconds for list views
      const interval = setInterval(checkLive, 60000);
      return () => clearInterval(interval);
    }
  }, [homeTeam, awayTeam, commenceTime]);

  // Generate match preview URL
  // Encode match info into URL-safe format
  const matchData = {
    homeTeam,
    awayTeam,
    league,
    sport: sportKey,
    kickoff: commenceTime,
  };
  const encodedMatchId = Buffer.from(JSON.stringify(matchData)).toString('base64');

  // Format match date
  const formatMatchDate = (dateString: string) => {
    const matchDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (matchDate.toDateString() === today.toDateString()) {
      return matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (matchDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Link
      href={`/match/${encodedMatchId}`}
      scroll={false}
      className={`group relative bg-bg-card rounded-xl border ${isLive ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-divider'} p-3 sm:p-4 hover:border-primary/30 hover:bg-bg-elevated transition-all duration-300 ease-out block hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg touch-manipulation`}
      data-card
    >
      {/* Live Badge */}
      {isLive && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-red-500 rounded-full text-[10px] font-bold text-white shadow-lg">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
          </span>
          LIVE
        </div>
      )}
      
      {/* Hot Score Badge (only if not live) */}
      {!isLive && hotScore >= 8 && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-[10px] font-bold text-white shadow-lg">
          HOT
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
        ) : (
          <MatchCountdown commenceTime={commenceTime} size="sm" />
        )}
      </div>

      {/* Teams with Live Score */}
      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="transition-transform duration-300 group-hover:scale-110">
            <TeamLogo teamName={homeTeam} sport={sportKey} league={league} size="md" />
          </div>
          <span className="text-sm font-semibold text-white truncate">{homeTeam}</span>
          {isLive && liveScore && (
            <span className={`text-lg font-bold font-mono ${liveScore.homeScore > liveScore.awayScore ? 'text-green-400' : 'text-white'}`}>
              {liveScore.homeScore}
            </span>
          )}
        </div>

        {isLive && liveScore ? (
          <span className="text-gray-600 text-lg font-medium px-1">-</span>
        ) : (
          <span className="text-gray-600 text-sm font-medium px-2 group-hover:text-gray-400 transition-colors">vs</span>
        )}

        {/* Away Team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          {isLive && liveScore && (
            <span className={`text-lg font-bold font-mono ${liveScore.awayScore > liveScore.homeScore ? 'text-green-400' : 'text-white'}`}>
              {liveScore.awayScore}
            </span>
          )}
          <span className="text-sm font-semibold text-white truncate text-right">{awayTeam}</span>
          <div className="transition-transform duration-300 group-hover:scale-110">
            <TeamLogo teamName={awayTeam} sport={sportKey} league={league} size="md" />
          </div>
        </div>
      </div>

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

      {/* Match time + Analyze CTA */}
      <div className="mt-3 pt-3 border-t border-divider flex items-center justify-between">
        <span className="text-xs text-text-muted">{formatMatchDate(commenceTime)}</span>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500 transition-all">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 group-hover:bg-white"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400 group-hover:bg-white"></span>
            </span>
            Watch Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-accent/15 text-accent border border-accent/30 rounded-full group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all">
            <span className="w-1.5 h-1.5 bg-accent rounded-full group-hover:bg-white animate-pulse"></span>
            Analyze
          </span>
        )}
      </div>
    </Link>
  );
}
