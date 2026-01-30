/**
 * Match Countdown Badge Component
 * 
 * Shows time until match starts with visual urgency indicators.
 * Updates in real-time and shows contextual styling.
 */

'use client';

import { useState, useEffect } from 'react';

interface MatchCountdownProps {
  commenceTime: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function MatchCountdown({
  commenceTime,
  size = 'md',
  showIcon = true,
  className = '',
}: MatchCountdownProps) {
  // Initialize with empty state to avoid hydration mismatch
  const [timeLeft, setTimeLeft] = useState({
    display: '',
    isLive: false,
    totalMinutes: 0,
    days: 0,
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    // Calculate immediately on mount
    setTimeLeft(getTimeLeft(commenceTime));
    
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(commenceTime));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [commenceTime]);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  // Get urgency styling
  const getUrgencyStyle = () => {
    if (timeLeft.isLive) {
      return {
        bg: 'bg-red-500/20',
        border: 'border-red-500/40',
        text: 'text-red-400',
        glow: 'shadow-red-500/20',
        pulse: true,
      };
    }
    if (timeLeft.totalMinutes <= 60) {
      // Within 1 hour - urgent
      return {
        bg: 'bg-orange-500/15',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        glow: 'shadow-orange-500/10',
        pulse: true,
      };
    }
    if (timeLeft.totalMinutes <= 180) {
      // Within 3 hours - soon
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        text: 'text-yellow-400',
        glow: '',
        pulse: false,
      };
    }
    if (timeLeft.days === 0) {
      // Today
      return {
        bg: 'bg-accent/10',
        border: 'border-accent/20',
        text: 'text-accent',
        glow: '',
        pulse: false,
      };
    }
    // Future
    return {
      bg: 'bg-white/5',
      border: 'border-white/10',
      text: 'text-gray-400',
      glow: '',
      pulse: false,
    };
  };

  const style = getUrgencyStyle();

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${sizeClasses[size]}
        ${style.bg} ${style.border} ${style.text}
        border
        ${style.glow ? `shadow-lg ${style.glow}` : ''}
        ${className}
      `}
    >
      {showIcon && (
        <span className={`${style.pulse ? 'animate-pulse' : ''}`}>
          {timeLeft.isLive ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          ) : timeLeft.totalMinutes <= 60 ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : null}
        </span>
      )}
      <span className="tabular-nums">{timeLeft.display}</span>
    </span>
  );
}

function getTimeLeft(dateString: string) {
  const matchDate = new Date(dateString);
  const now = new Date();
  const diffMs = matchDate.getTime() - now.getTime();

  if (diffMs <= -7200000) {
    // More than 2 hours ago - finished
    return {
      display: 'Finished',
      isLive: false,
      totalMinutes: 0,
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  if (diffMs <= 0) {
    // Started but within 2 hours - likely live
    return {
      display: 'LIVE',
      isLive: true,
      totalMinutes: 0,
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  let display: string;

  if (days > 7) {
    // More than a week - show date
    display = matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (days > 0) {
    // Days away
    display = `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    // Hours away
    display = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    // Minutes away
    display = `${minutes}m`;
  } else {
    display = 'Starting';
  }

  return {
    display,
    isLive: false,
    totalMinutes,
    days,
    hours,
    minutes,
  };
}

/**
 * Compact countdown for tight spaces (e.g., match cards)
 */
export function CountdownCompact({ commenceTime, className = '' }: { commenceTime: string; className?: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(commenceTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(commenceTime));
    }, 60000);

    return () => clearInterval(timer);
  }, [commenceTime]);

  const getColor = () => {
    if (timeLeft.isLive) return 'text-red-400';
    if (timeLeft.totalMinutes <= 60) return 'text-orange-400';
    if (timeLeft.totalMinutes <= 180) return 'text-yellow-400';
    if (timeLeft.days === 0) return 'text-accent';
    return 'text-gray-400';
  };

  return (
    <span className={`font-medium tabular-nums ${getColor()} ${className}`}>
      {timeLeft.isLive && (
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          LIVE
        </span>
      )}
      {!timeLeft.isLive && timeLeft.display}
    </span>
  );
}
