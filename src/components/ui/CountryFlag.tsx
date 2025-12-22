/**
 * Country Flag Component
 * 
 * Displays country flags using flag CDN.
 * Supports common country codes for soccer leagues.
 * Uses in-memory cache for instant display on revisit.
 */

'use client';

import { useState, useEffect } from 'react';

// In-memory cache for loaded flags
const loadedFlags = new Set<string>();

interface CountryFlagProps {
  country: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

// Size mappings
const sizeClasses = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

// Country code mappings - using standard ISO codes
const COUNTRY_CODES: Record<string, string> = {
  // Europe
  'england': 'gb',
  'uk': 'gb',
  'spain': 'es',
  'germany': 'de',
  'italy': 'it',
  'france': 'fr',
  'portugal': 'pt',
  'netherlands': 'nl',
  'belgium': 'be',
  'scotland': 'gb',
  'turkey': 'tr',
  'greece': 'gr',
  'russia': 'ru',
  'ukraine': 'ua',
  'poland': 'pl',
  'austria': 'at',
  'switzerland': 'ch',
  'czech': 'cz',
  'croatia': 'hr',
  'serbia': 'rs',
  'denmark': 'dk',
  'sweden': 'se',
  'norway': 'no',
  // Americas
  'usa': 'us',
  'brazil': 'br',
  'argentina': 'ar',
  'mexico': 'mx',
  'colombia': 'co',
  // Asia
  'japan': 'jp',
  'china': 'cn',
  'south korea': 'kr',
  'australia': 'au',
  // International
  'europe': 'eu',
  'uefa': 'eu',
  'world': 'un',
  'fifa': 'un',
};

// League to country mapping (only domestic leagues, not international competitions)
const LEAGUE_COUNTRY: Record<string, string> = {
  // Soccer
  'premier league': 'england',
  'la liga': 'spain',
  'bundesliga': 'germany',
  'serie a': 'italy',
  'ligue 1': 'france',
  'primeira liga': 'portugal',
  'eredivisie': 'netherlands',
  'pro league': 'belgium',
  'super lig': 'turkey',
  'scottish premiership': 'scotland',
  // Basketball - only domestic
  'nba': 'usa',
  // American Football
  'nfl': 'usa',
  'ncaa football': 'usa',
  'ncaaf': 'usa',
  // Hockey - only domestic
  'nhl': 'usa',
  'shl': 'sweden',
  'khl': 'russia',
};

export function getCountryForLeague(leagueName: string): string | null {
  const lower = leagueName.toLowerCase();
  
  // Check direct match
  if (LEAGUE_COUNTRY[lower]) {
    return LEAGUE_COUNTRY[lower];
  }
  
  // Check partial match
  for (const [key, country] of Object.entries(LEAGUE_COUNTRY)) {
    if (lower.includes(key) || key.includes(lower)) {
      return country;
    }
  }
  
  return null;
}

export function getCountryCode(country: string): string | null {
  const lower = country.toLowerCase();
  return COUNTRY_CODES[lower] || null;
}

export default function CountryFlag({ 
  country, 
  size = 'md',
  className = '',
  priority = false 
}: CountryFlagProps) {
  const countryCode = getCountryCode(country);
  const flagUrl = countryCode ? `https://flagcdn.com/w80/${countryCode}.png` : null;
  
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => loadedFlags.has(flagUrl || ''));
  
  // Preload flag image
  useEffect(() => {
    if (!flagUrl || loadedFlags.has(flagUrl)) return;
    
    const img = new Image();
    img.onload = () => {
      loadedFlags.add(flagUrl);
      setIsLoaded(true);
    };
    img.onerror = () => setHasError(true);
    img.src = flagUrl;
  }, [flagUrl]);
  
  if (!countryCode || hasError) {
    // Fallback to emoji or initials
    return (
      <div 
        className={`${sizeClasses[size]} rounded flex items-center justify-center flex-shrink-0 bg-white/10 ${className}`}
      >
        <span className="text-xs">🏳️</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative flex-shrink-0 overflow-hidden rounded ${className}`}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-white/10 animate-pulse rounded" />
      )}
      <img
        src={flagUrl || undefined}
        alt={`${country} flag`}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => {
          if (flagUrl) loadedFlags.add(flagUrl);
          setIsLoaded(true);
        }}
        onError={() => setHasError(true)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}
