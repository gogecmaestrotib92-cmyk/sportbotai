/**
 * Live Score Widget Component
 * 
 * Displays real-time score for a match when it's live.
 * Auto-updates every 30 seconds.
 * Shows match status (1H, HT, 2H, FT, etc.)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface LiveMatch {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: {
    short: string;
    long: string;
    elapsed: number | null;
  };
  league: string;
  leagueLogo: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  events: Array<{
    time: number;
    type: 'Goal' | 'Card' | 'Subst' | 'Var';
    team: 'home' | 'away';
    player: string;
    detail: string;
  }>;
  venue: string;
  startTime: string;
}

interface LiveScoreResponse {
  status: 'live' | 'upcoming' | 'finished' | 'not_found';
  match?: LiveMatch;
}

interface LiveScoreWidgetProps {
  homeTeam: string;
  awayTeam: string;
  kickoff?: string;
  compact?: boolean;
  onStatusChange?: (status: 'live' | 'upcoming' | 'finished' | 'not_found') => void;
}

// Status badge styling
const statusStyles: Record<string, { bg: string; text: string; pulse?: boolean }> = {
  '1H': { bg: 'bg-red-500', text: 'text-white', pulse: true },
  '2H': { bg: 'bg-red-500', text: 'text-white', pulse: true },
  'HT': { bg: 'bg-yellow-500', text: 'text-black' },
  'ET': { bg: 'bg-orange-500', text: 'text-white', pulse: true },
  'P': { bg: 'bg-purple-500', text: 'text-white', pulse: true },
  'FT': { bg: 'bg-gray-600', text: 'text-white' },
  'AET': { bg: 'bg-gray-600', text: 'text-white' },
  'PEN': { bg: 'bg-gray-600', text: 'text-white' },
  'NS': { bg: 'bg-blue-500', text: 'text-white' },
  'LIVE': { bg: 'bg-red-500', text: 'text-white', pulse: true },
};

export default function LiveScoreWidget({ 
  homeTeam, 
  awayTeam, 
  kickoff,
  compact = false,
  onStatusChange 
}: LiveScoreWidgetProps) {
  const [data, setData] = useState<LiveScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchLiveScore = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/live-scores?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result: LiveScoreResponse = await response.json();
      setData(result);
      setLastUpdate(new Date());
      setError(null);
      
      // Notify parent of status change
      if (onStatusChange) {
        onStatusChange(result.status);
      }
    } catch (err) {
      setError('Unable to fetch live score');
    } finally {
      setLoading(false);
    }
  }, [homeTeam, awayTeam, onStatusChange]);

  // Initial fetch
  useEffect(() => {
    fetchLiveScore();
  }, [fetchLiveScore]);

  // Auto-refresh every 30 seconds if match is live
  useEffect(() => {
    if (data?.status !== 'live') return;

    const interval = setInterval(fetchLiveScore, 30000);
    return () => clearInterval(interval);
  }, [data?.status, fetchLiveScore]);

  // Don't show anything if match not found or error
  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <div className="w-16 h-8 bg-bg-tertiary rounded"></div>
      </div>
    );
  }

  if (error || !data || data.status === 'not_found') {
    return null;
  }

  const match = data.match;
  if (!match) return null;

  const isLive = data.status === 'live';
  const isFinished = data.status === 'finished';
  const statusStyle = statusStyles[match.status.short] || statusStyles['NS'];

  // Compact version - just score and status
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Live indicator */}
        {isLive && (
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.pulse ? 'animate-pulse' : ''}`}>
            {match.status.elapsed ? `${match.status.elapsed}'` : match.status.short}
          </span>
        )}
        
        {/* Score */}
        <div className="flex items-center gap-1 font-mono font-bold text-lg">
          <span className={match.homeScore > match.awayScore ? 'text-green-400' : 'text-text-primary'}>
            {match.homeScore}
          </span>
          <span className="text-text-muted">-</span>
          <span className={match.awayScore > match.homeScore ? 'text-green-400' : 'text-text-primary'}>
            {match.awayScore}
          </span>
        </div>

        {/* Finished badge */}
        {isFinished && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-600 text-white">
            FT
          </span>
        )}
      </div>
    );
  }

  // Full version with more details
  return (
    <div className="bg-bg-secondary border border-border-primary rounded-xl p-4">
      {/* Header with live badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted uppercase tracking-wider">
          {isLive ? 'Live Score' : isFinished ? 'Final Score' : 'Match Status'}
        </span>
        
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.pulse ? 'animate-pulse' : ''}`}>
          {isLive && match.status.elapsed ? `${match.status.elapsed}'` : match.status.long}
        </span>
      </div>

      {/* Score display */}
      <div className="flex items-center justify-center gap-4 py-4">
        {/* Home */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {match.homeTeamLogo && (
            <img 
              src={match.homeTeamLogo} 
              alt={match.homeTeam}
              className="w-12 h-12 object-contain"
            />
          )}
          <span className="text-sm text-text-secondary text-center line-clamp-1">
            {match.homeTeam}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3">
          <span className={`text-4xl font-bold font-mono ${match.homeScore > match.awayScore ? 'text-green-400' : 'text-text-primary'}`}>
            {match.homeScore}
          </span>
          <span className="text-2xl text-text-muted">-</span>
          <span className={`text-4xl font-bold font-mono ${match.awayScore > match.homeScore ? 'text-green-400' : 'text-text-primary'}`}>
            {match.awayScore}
          </span>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {match.awayTeamLogo && (
            <img 
              src={match.awayTeamLogo} 
              alt={match.awayTeam}
              className="w-12 h-12 object-contain"
            />
          )}
          <span className="text-sm text-text-secondary text-center line-clamp-1">
            {match.awayTeam}
          </span>
        </div>
      </div>

      {/* Recent events */}
      {isLive && match.events && match.events.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-primary">
          <div className="text-xs text-text-muted mb-2">Recent Events</div>
          <div className="space-y-1">
            {match.events.slice(-3).map((event, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="text-text-muted w-6">{event.time}'</span>
                <span className={event.type === 'Goal' ? 'text-green-400' : event.type === 'Card' ? 'text-yellow-400' : 'text-text-secondary'}>
                  {event.type === 'Goal' ? '⚽' : event.type === 'Card' ? '🟨' : '↔️'}
                </span>
                <span className="text-text-secondary">{event.player}</span>
                {event.detail && <span className="text-text-muted">({event.detail})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last updated */}
      {lastUpdate && (
        <div className="mt-3 pt-2 border-t border-border-primary flex items-center justify-between text-xs text-text-muted">
          <span>Updated {lastUpdate.toLocaleTimeString()}</span>
          {isLive && (
            <button 
              onClick={fetchLiveScore}
              className="text-accent hover:text-accent/80 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Live indicator badge - small pulsing dot for use in lists
 */
export function LiveIndicator({ isLive }: { isLive: boolean }) {
  if (!isLive) return null;
  
  return (
    <span className="flex items-center gap-1">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </span>
      <span className="text-xs font-medium text-red-400 uppercase">Live</span>
    </span>
  );
}

/**
 * Hook for checking if a match is live
 */
export function useLiveStatus(homeTeam: string, awayTeam: string) {
  const [status, setStatus] = useState<'live' | 'upcoming' | 'finished' | 'not_found' | 'loading'>('loading');
  const [match, setMatch] = useState<LiveMatch | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/live-scores?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}`
        );
        if (!response.ok) throw new Error('Failed');
        
        const data: LiveScoreResponse = await response.json();
        setStatus(data.status);
        setMatch(data.match || null);
      } catch {
        setStatus('not_found');
      }
    };

    checkStatus();
    
    // Re-check every minute
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [homeTeam, awayTeam]);

  return { status, match, isLive: status === 'live' };
}
