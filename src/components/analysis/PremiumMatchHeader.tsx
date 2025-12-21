/**
 * Premium Match Header - Minimal, Clean Design
 * 
 * Shows teams, time, league, and LIVE SCORE when match is in progress.
 * Works identically for all sports.
 * Includes heart icons to favorite individual teams.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import TeamLogo from '@/components/ui/TeamLogo';
import LeagueLogo from '@/components/ui/LeagueLogo';
import FavoriteButton from '@/components/FavoriteButton';

interface LiveScoreData {
  homeScore: number;
  awayScore: number;
  status: {
    short: string;
    long: string;
    elapsed: number | null;
  };
  events?: Array<{
    time: number;
    type: string;
    team: 'home' | 'away';
    player: string;
    detail: string;
  }>;
}

interface PremiumMatchHeaderProps {
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  kickoff: string;
  venue?: string;
}

export default function PremiumMatchHeader({
  homeTeam,
  awayTeam,
  league,
  sport,
  kickoff,
  venue,
}: PremiumMatchHeaderProps) {
  const [liveScore, setLiveScore] = useState<LiveScoreData | null>(null);
  const [matchStatus, setMatchStatus] = useState<'upcoming' | 'live' | 'finished' | 'not_found'>('upcoming');
  const [timeLabel, setTimeLabel] = useState<string>('');
  const [isUpcoming, setIsUpcoming] = useState(true);
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [formattedTime, setFormattedTime] = useState<string>('');

  const kickoffDate = new Date(kickoff);
  
  // Format date/time in useEffect to avoid hydration mismatch
  useEffect(() => {
    const kd = new Date(kickoff);
    setFormattedDate(kd.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }));
    setFormattedTime(kd.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }));
  }, [kickoff]);

  // Detect sport type for live scores API
  const getSportType = (sportName: string): string => {
    const s = sportName.toLowerCase();
    if (s.includes('nba') || s === 'basketball_nba') return 'nba';
    if (s.includes('basketball')) return 'basketball';
    if (s.includes('nfl') || s === 'americanfootball_nfl') return 'nfl';
    if (s.includes('american') || s.includes('ncaaf')) return 'american_football';
    if (s.includes('nhl') || s === 'hockey_nhl') return 'nhl';
    if (s.includes('hockey')) return 'hockey';
    return 'soccer';
  };

  // Fetch live score
  const fetchLiveScore = useCallback(async () => {
    try {
      const sportType = getSportType(sport);
      const response = await fetch(
        `/api/live-scores?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}&sport=${sportType}`
      );
      if (!response.ok) return;
      
      const data = await response.json();
      setMatchStatus(data.status);
      
      if (data.match) {
        setLiveScore({
          homeScore: data.match.homeScore,
          awayScore: data.match.awayScore,
          status: data.match.status,
          events: data.match.events,
        });
      }
    } catch {
      // Silent fail - live score is optional
    }
  }, [homeTeam, awayTeam, sport]);

  // Check for live score on mount and periodically
  useEffect(() => {
    // Only check if match should have started (within last 3 hours or in the future by less than 15 min)
    const now = new Date();
    const kickoffTime = kickoffDate.getTime();
    const threeHoursAgo = now.getTime() - (3 * 60 * 60 * 1000);
    const fifteenMinutesFromNow = now.getTime() + (15 * 60 * 1000);
    
    if (kickoffTime > threeHoursAgo && kickoffTime < fifteenMinutesFromNow + (3 * 60 * 60 * 1000)) {
      fetchLiveScore();
      
      // If match is live, refresh every 30 seconds
      const interval = setInterval(() => {
        if (matchStatus === 'live') {
          fetchLiveScore();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [kickoffDate, fetchLiveScore, matchStatus]);

  // Calculate time label in useEffect to avoid hydration mismatch
  const isLive = matchStatus === 'live';
  const isFinished = matchStatus === 'finished';
  
  useEffect(() => {
    const calculateTimeLabel = () => {
      const now = new Date();
      const upcoming = kickoffDate > now && matchStatus !== 'live';
      setIsUpcoming(upcoming);
      
      const timeDiff = kickoffDate.getTime() - now.getTime();
      const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
      const daysUntil = Math.floor(hoursUntil / 24);

      let label: string;
      if (matchStatus === 'live' && liveScore?.status.elapsed) {
        label = `${liveScore.status.elapsed}'`;
      } else if (matchStatus === 'finished') {
        label = 'Full Time';
      } else if (!upcoming) {
        label = 'In Progress';
      } else if (daysUntil > 0) {
        label = `${daysUntil}d ${hoursUntil % 24}h`;
      } else if (hoursUntil > 0) {
        label = `${hoursUntil}h`;
      } else {
        const minutesUntil = Math.floor(timeDiff / (1000 * 60));
        label = minutesUntil > 0 ? `${minutesUntil}m` : 'Starting Soon';
      }
      setTimeLabel(label);
    };
    
    calculateTimeLabel();
    const interval = setInterval(calculateTimeLabel, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [kickoffDate, matchStatus, liveScore]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0b] border border-white/[0.06]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, white 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="relative p-5 sm:p-6">
        {/* League and Time Row */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <LeagueLogo leagueName={league} sport={sport} size="sm" className="opacity-70" />
            <span className="text-sm font-medium text-zinc-400">{league}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {isLive ? (
              /* Live indicator */
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-red-400 text-xs font-bold uppercase">Live</span>
                  {liveScore?.status.elapsed && (
                    <span className="text-red-300 text-xs font-mono">{liveScore.status.elapsed}&apos;</span>
                  )}
                </span>
              </div>
            ) : isFinished ? (
              <span className="px-2.5 py-1 rounded-full bg-zinc-700/50 text-zinc-400 text-xs font-medium">
                Full Time
              </span>
            ) : (
              <>
                <span className="text-zinc-500">{formattedDate}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">{formattedTime}</span>
                {isUpcoming && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 text-xs">
                      {timeLabel}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-center gap-6 sm:gap-12">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center flex-1 max-w-[140px] sm:max-w-[180px]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 relative">
              <TeamLogo teamName={homeTeam} sport={sport} league={league} size="xl" className="object-contain" />
              {/* Favorite button - positioned at top right of logo */}
              <div className="absolute -top-1 -right-1">
                <FavoriteButton 
                  teamName={homeTeam}
                  sport={sport}
                  league={league}
                  sportKey={sport}
                  size="sm"
                />
              </div>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">
              {homeTeam}
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mt-1">Home</span>
          </div>

          {/* VS Divider OR Live Score */}
          <div className="flex flex-col items-center">
            {(isLive || isFinished) && liveScore ? (
              /* Live/Final Score Display */
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-3xl sm:text-4xl font-bold font-mono ${
                    liveScore.homeScore > liveScore.awayScore ? 'text-green-400' : 'text-white'
                  }`}>
                    {liveScore.homeScore}
                  </span>
                  <span className="text-xl text-zinc-600">-</span>
                  <span className={`text-3xl sm:text-4xl font-bold font-mono ${
                    liveScore.awayScore > liveScore.homeScore ? 'text-green-400' : 'text-white'
                  }`}>
                    {liveScore.awayScore}
                  </span>
                </div>
                {isLive && liveScore.status.long && (
                  <span className="text-xs text-zinc-500">{liveScore.status.long}</span>
                )}
              </div>
            ) : (
              /* VS Badge for upcoming matches */
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-zinc-500">VS</span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center flex-1 max-w-[140px] sm:max-w-[180px]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 relative">
              <TeamLogo teamName={awayTeam} sport={sport} league={league} size="xl" className="object-contain" />
              {/* Favorite button - positioned at top right of logo */}
              <div className="absolute -top-1 -right-1">
                <FavoriteButton 
                  teamName={awayTeam}
                  sport={sport}
                  league={league}
                  sportKey={sport}
                  size="sm"
                />
              </div>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">
              {awayTeam}
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mt-1">Away</span>
          </div>
        </div>

        {/* Recent Events (for live matches) */}
        {isLive && liveScore?.events && liveScore.events.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/[0.04]">
            <div className="flex flex-col gap-1.5">
              {liveScore.events.slice(-3).map((event, idx) => (
                <div key={idx} className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-zinc-600 font-mono w-6">{event.time}&apos;</span>
                  <span className={event.type === 'Goal' ? 'text-green-400' : event.type === 'Card' ? 'text-yellow-400' : 'text-zinc-500'}>
                    {event.type === 'Goal' ? '⚽' : event.type === 'Card' ? '🟨' : '↔️'}
                  </span>
                  <span className="text-zinc-400">{event.player}</span>
                  <span className={`text-xs ${event.team === 'home' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    ({event.team === 'home' ? homeTeam : awayTeam})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venue (if available and not showing events) */}
        {venue && !(isLive && liveScore?.events && liveScore.events.length > 0) && (
          <div className="mt-6 pt-4 border-t border-white/[0.04] text-center">
            <span className="text-xs text-zinc-500">📍 {venue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
