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
import PremiumIcon from '@/components/ui/PremiumIcon';

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
  // Format ugly league keys like "GERMANY_BUNDESLIGA" → "Bundesliga"
  const formatLeagueName = (raw: string): string => {
    // Already nicely formatted
    if (!raw.includes('_') && raw !== raw.toUpperCase()) return raw;
    
    const leagueMap: Record<string, string> = {
      'soccer_epl': 'Premier League',
      'soccer_england_epl': 'Premier League',
      'soccer_germany_bundesliga': 'Bundesliga',
      'soccer_spain_la_liga': 'La Liga',
      'soccer_italy_serie_a': 'Serie A',
      'soccer_france_ligue_one': 'Ligue 1',
      'soccer_netherlands_eredivisie': 'Eredivisie',
      'soccer_portugal_primeira_liga': 'Primeira Liga',
      'soccer_turkey_super_league': 'Süper Lig',
      'soccer_belgium_first_div': 'Belgian Pro League',
      'soccer_spl': 'Scottish Premiership',
      'soccer_uefa_champs_league': 'Champions League',
      'soccer_uefa_europa_league': 'Europa League',
      'soccer_uefa_europa_conference_league': 'Conference League',
      'basketball_nba': 'NBA',
      'americanfootball_nfl': 'NFL',
      'icehockey_nhl': 'NHL',
    };
    
    const lower = raw.toLowerCase();
    if (leagueMap[lower]) return leagueMap[lower];
    
    // Fallback: "GERMANY_BUNDESLIGA" → "Bundesliga", "SPAIN_LA_LIGA" → "La Liga"
    const parts = raw.replace(/^soccer_/i, '').split('_');
    // Remove country prefix (first part) if more than one segment
    const leagueParts = parts.length > 1 ? parts.slice(1) : parts;
    return leagueParts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
  };

  // Fix team name casing: "Fsv Mainz 05" → "FSV Mainz 05"
  const fixTeamName = (name: string): string => {
    return name.replace(/\b(Fsv|Vfb|Vfl|Vfr|Bsc|Bvb|Fc|Sc|Sv|Sg|Tsv|Tsg|Rb|Afc|Rcd|Ssc|Ac|As|Us|Cd|Ud|Cf|Sd|Ss)\b/gi, 
      (match) => match.toUpperCase()
    );
  };

  // Get short team name for save label: "FSV Mainz 05" → "Mainz", "Borussia Dortmund" → "Dortmund"
  const getShortName = (name: string): string => {
    const prefixes = /^(fc|sc|sv|sg|rb|ac|as|us|cd|ud|cf|sd|ss|afc|bsc|bvb|fsv|vfb|vfl|vfr|tsv|tsg|rcd|ssc|1\.|borussia|real|sporting|atletico|dynamo|inter)\b/i;
    const suffixes = /\b(fc|sc|sv|cf|united|city|town|wanderers|rovers|county|athletic|albion|hotspur|\d{2,4})$/i;
    const words = name.trim().split(/\s+/);
    // Filter out prefix/suffix words to find the core name
    const core = words.filter(w => !prefixes.test(w) && !suffixes.test(w));
    // If we have a core name, use the last meaningful word
    if (core.length > 0) return core[core.length - 1];
    // Fallback: return last non-number word
    const nonNum = words.filter(w => !/^\d+$/.test(w));
    return nonNum.length > 0 ? nonNum[nonNum.length - 1] : words[0];
  };

  const displayLeague = formatLeagueName(league);
  const displayHome = fixTeamName(homeTeam);
  const displayAway = fixTeamName(awayTeam);
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

      {/* Favorite buttons - bottom corners of card */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
        <FavoriteButton 
          teamName={homeTeam}
          sport={sport}
          league={league}
          sportKey={sport}
          size="sm"
        />
        <span className="text-[10px] text-zinc-600 hidden sm:inline">Save {getShortName(displayHome)}</span>
      </div>
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-600 hidden sm:inline">Save {getShortName(displayAway)}</span>
        <FavoriteButton 
          teamName={awayTeam}
          sport={sport}
          league={league}
          sportKey={sport}
          size="sm"
        />
      </div>

      <div className="relative p-4 sm:p-6 pb-14">
        {/* League and Time Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-5 sm:mb-6">
          <div className="flex items-center gap-2">
            <LeagueLogo leagueName={displayLeague} sport={sport} size="sm" className="opacity-70" />
            <span className="text-xs sm:text-sm font-medium text-zinc-400">{displayLeague}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
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
                <span className="text-zinc-500 whitespace-nowrap">{formattedDate}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400 whitespace-nowrap">{formattedTime}</span>
                {isUpcoming && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 text-xs whitespace-nowrap">
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
            <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 relative">
              <TeamLogo teamName={homeTeam} sport={sport} league={league} size="xl" className="object-contain" priority={true} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
              {displayHome}
            </h2>
            <span className="matrix-dim mt-1.5">Home</span>
          </div>

          {/* VS Divider OR Live Score */}
          <div className="flex flex-col items-center">
            {(isLive || isFinished) && liveScore ? (
              /* Live/Final Score Display */
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-4xl sm:text-5xl font-bold font-mono ${
                    liveScore.homeScore > liveScore.awayScore ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {liveScore.homeScore}
                  </span>
                  <span className="text-2xl text-zinc-600">-</span>
                  <span className={`text-4xl sm:text-5xl font-bold font-mono ${
                    liveScore.awayScore > liveScore.homeScore ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {liveScore.awayScore}
                  </span>
                </div>
                {isLive && liveScore.status.long && (
                  <span className="text-sm text-zinc-500">{liveScore.status.long}</span>
                )}
              </div>
            ) : (
              /* VS Badge for upcoming matches */
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-bold text-zinc-400">VS</span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center flex-1 max-w-[140px] sm:max-w-[180px]">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 relative">
              <TeamLogo teamName={awayTeam} sport={sport} league={league} size="xl" className="object-contain" priority={true} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
              {displayAway}
            </h2>
            <span className="matrix-dim mt-1.5">Away</span>
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
                    {event.type === 'Goal' ? <PremiumIcon name="soccer" size="sm" /> : event.type === 'Card' ? <PremiumIcon name="card-yellow" size="sm" /> : <PremiumIcon name="swap" size="sm" />}
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
            <span className="text-xs text-zinc-500 flex items-center justify-center gap-1"><PremiumIcon name="location" size="xs" /> {venue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
