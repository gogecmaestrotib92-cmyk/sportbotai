/**
 * League Logo Component
 * 
 * Displays league/competition logos with automatic fallback.
 */

'use client';

import { useState } from 'react';
import { getLeagueLogo } from '@/lib/logos';

interface LeagueLogoProps {
  leagueName: string;
  sport?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export default function LeagueLogo({ 
  leagueName, 
  sport,
  size = 'md',
  className = '' 
}: LeagueLogoProps) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getLeagueLogo(leagueName, sport);
  const isFallback = logoUrl.startsWith('data:');

  // Debug logging
  if (typeof window !== 'undefined' && isFallback) {
    console.log(`[LeagueLogo] Missing: "${leagueName}" | sport="${sport}" | url="${logoUrl.substring(0, 50)}..."`);
  }

  // Generate initials for fallback
  const getInitials = (name: string) => {
    const words = name.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  if (hasError || isFallback) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded flex items-center justify-center flex-shrink-0 bg-white/10 ${className}`}
      >
        <span className="text-white/60 font-semibold text-[8px]">
          {getInitials(leagueName)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${leagueName} logo`}
      className={`${sizeClasses[size]} object-contain flex-shrink-0 ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
