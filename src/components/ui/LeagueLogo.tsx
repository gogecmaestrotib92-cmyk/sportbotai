/**
 * League Logo Component
 * 
 * Displays league/competition logos with automatic fallback.
 * Features smooth fade-in transitions and graceful error handling.
 */

'use client';

import { useState } from 'react';
import { getLeagueLogo } from '@/lib/logos';

interface LeagueLogoProps {
  leagueName: string;
  sport?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Bigger, more visible sizes
const sizeClasses = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

// Font sizes for fallback initials
const fontSizeClasses = {
  xs: 'text-[8px]',
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
};

export default function LeagueLogo({ 
  leagueName, 
  sport,
  size = 'md',
  className = '' 
}: LeagueLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const logoUrl = getLeagueLogo(leagueName, sport);
  const isFallback = !logoUrl || logoUrl.startsWith('data:');

  // Generate initials for fallback
  const getInitials = (name: string) => {
    const words = name.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  // Generate consistent color from name
  const getColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 50%, 40%)`;
  };

  // Fallback component with initials
  const FallbackLogo = () => (
    <div 
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: getColor(leagueName) }}
    >
      <span className={`text-white/90 font-semibold ${fontSizeClasses[size]}`}>
        {getInitials(leagueName)}
      </span>
    </div>
  );

  if (hasError || isFallback) {
    return <FallbackLogo />;
  }

  return (
    <div className={`${sizeClasses[size]} relative flex-shrink-0 ${className}`}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 rounded-lg animate-pulse"
          style={{ backgroundColor: `${getColor(leagueName)}40` }}
        />
      )}
      {/* Light background for dark logos visibility */}
      <div className="absolute inset-0 bg-white/90 rounded-lg" />
      <img
        src={logoUrl}
        alt={`${leagueName} logo`}
        className={`relative w-full h-full object-contain p-0.5 transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}
