/**
 * Team Logo Component
 * 
 * Displays team logos with automatic fallback to generated initials.
 * Uses ESPN, API-Sports, or fallback SVG based on sport/team.
 * For MMA/UFC (individual sports), shows fighter's country flag instead.
 * Features smooth fade-in transitions and graceful error handling.
 * Uses in-memory cache for instant display on revisit.
 */

'use client';

import { useState, useEffect } from 'react';
import { getTeamLogo } from '@/lib/logos';
import FighterFlag from './FighterFlag';

// In-memory cache for loaded team logos
const loadedLogos = new Set<string>();

/**
 * Proxy external logo URLs through our API for better caching and resizing
 * Only proxy external URLs, not data URIs or local URLs
 */
function getProxiedLogoUrl(url: string, pixelSize: number = 100): string {
  // Don't proxy data URIs or local URLs
  if (url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }
  // Proxy external URLs for better caching (7 days vs ESPN's short TTL)
  // Include size parameter for ESPN images to be resized by their combiner
  return `/api/logo?url=${encodeURIComponent(url)}&size=${pixelSize}`;
}

interface TeamLogoProps {
  teamName: string;
  sport: string;
  league?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

// Map size names to pixel values for image optimization
const sizePixels = {
  sm: 48,  // 24px * 2 for retina
  md: 64,  // 32px * 2 for retina
  lg: 80,  // 40px * 2 for retina
  xl: 96,  // 48px * 2 for retina
};

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

const textSizeClasses = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
};

/**
 * Check if sport is an individual combat sport (MMA/UFC/Boxing)
 */
function isIndividualSport(sport: string): boolean {
  const normalized = sport.toLowerCase();
  return (
    normalized.includes('mma') ||
    normalized.includes('ufc') ||
    normalized.includes('bellator') ||
    normalized.includes('pfl') ||
    normalized.includes('boxing') ||
    normalized.includes('mixed_martial_arts')
  );
}

export default function TeamLogo({ 
  teamName, 
  sport, 
  league, 
  size = 'md',
  className = '',
  priority = false 
}: TeamLogoProps) {
  // Compute these values before any hooks
  const isIndividual = isIndividualSport(sport);
  const rawLogoUrl = isIndividual ? '' : getTeamLogo(teamName, sport, league);
  const isFallback = !isIndividual && rawLogoUrl.startsWith('data:');
  // Use proxied URL for external logos (better caching + resizing for ESPN)
  const pixelSize = sizePixels[size];
  const logoUrl = isFallback ? rawLogoUrl : getProxiedLogoUrl(rawLogoUrl, pixelSize);
  
  // All hooks must be called unconditionally at the top level
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => !isIndividual && loadedLogos.has(logoUrl));
  
  // Preload logo image
  useEffect(() => {
    if (isIndividual || isFallback || loadedLogos.has(logoUrl)) return;
    
    const img = new Image();
    img.onload = () => {
      loadedLogos.add(logoUrl);
      setIsLoaded(true);
    };
    img.onerror = () => setHasError(true);
    img.src = logoUrl;
  }, [logoUrl, isFallback, isIndividual]);

  // For MMA/UFC/Boxing - show fighter's country flag instead of team logo
  if (isIndividual) {
    return <FighterFlag fighterName={teamName} size={size} className={className} />;
  }

  // Generate fallback initials
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
    return `hsl(${hue}, 65%, 45%)`;
  };

  // Dark logos that need a light background (black/dark logos on dark UI)
  const needsLightBackground = (name: string) => {
    const darkLogos = ['asvel', 'lyon', 'ldlc asvel', 'villeurbanne'];
    return darkLogos.some(dark => name.toLowerCase().includes(dark));
  };

  // Fallback component with initials
  const FallbackLogo = () => (
    <div 
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${className}`}
      style={{ backgroundColor: getColor(teamName) }}
    >
      <span className={`text-white font-bold ${textSizeClasses[size]}`}>
        {getInitials(teamName)}
      </span>
    </div>
  );

  const hasDarkLogo = needsLightBackground(teamName);

  // If external logo fails, show initials
  if (hasError || isFallback) {
    return <FallbackLogo />;
  }

  return (
    <div className={`${sizeClasses[size]} relative flex-shrink-0 ${className}`}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 rounded-lg animate-pulse"
          style={{ backgroundColor: `${getColor(teamName)}40` }}
        />
      )}
      {/* Light background only for dark logos (ASVEL/Lyon) */}
      {hasDarkLogo && <div className="absolute inset-0 bg-white/90 rounded-lg" />}
      <img
        src={logoUrl}
        alt={`${teamName} logo`}
        className={`${hasDarkLogo ? 'relative p-0.5' : ''} w-full h-full object-contain transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => {
          loadedLogos.add(logoUrl);
          setIsLoaded(true);
        }}
        onError={() => setHasError(true)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}
