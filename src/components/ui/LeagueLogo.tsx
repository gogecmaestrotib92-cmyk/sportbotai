/**
 * League Logo Component
 * 
 * Displays league/competition logos with automatic fallback.
 * Features smooth fade-in transitions and graceful error handling.
 * Uses eager loading and in-memory cache for instant display.
 */

'use client';

import { useState, useEffect } from 'react';
import { getLeagueLogo } from '@/lib/logos';

// In-memory cache for loaded images (persists across component instances)
const loadedImages = new Set<string>();

/**
 * Proxy external logo URLs through our API for better caching and resizing
 */
function getProxiedLogoUrl(url: string, pixelSize: number = 100): string {
  if (!url || url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }
  return `/api/logo?url=${encodeURIComponent(url)}&size=${pixelSize}`;
}

interface LeagueLogoProps {
  leagueName: string;
  sport?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean; // Load eagerly for above-the-fold content
}

// Bigger, more visible sizes
const sizeClasses = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

// Pixel sizes for image optimization (2x for retina)
const sizePixels = {
  xs: 40,
  sm: 56,
  md: 72,
  lg: 96,
  xl: 128,
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
  className = '',
  priority = false 
}: LeagueLogoProps) {
  const rawLogoUrl = getLeagueLogo(leagueName, sport);
  const isFallback = !rawLogoUrl || rawLogoUrl.startsWith('data:');
  // Use proxied URL for better caching + resizing
  const logoUrl = isFallback ? rawLogoUrl : getProxiedLogoUrl(rawLogoUrl, sizePixels[size]);
  
  // Check if image was already loaded (cached in memory)
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => loadedImages.has(logoUrl || ''));
  
  // Preload image on mount for faster display
  useEffect(() => {
    if (!logoUrl || isFallback || loadedImages.has(logoUrl)) return;
    
    const img = new Image();
    img.onload = () => {
      loadedImages.add(logoUrl);
      setIsLoaded(true);
    };
    img.onerror = () => setHasError(true);
    img.src = logoUrl;
  }, [logoUrl, isFallback]);

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

  // Dark logos that need a light background
  const needsLightBackground = (name: string) => {
    const darkLogos = ['ligue 1', 'champions league', 'ucl'];
    return darkLogos.some(dark => name.toLowerCase().includes(dark));
  };

  // Logos that need to be rendered larger (SVG logos that appear too small)
  const needsLargerSize = (name: string) => {
    const smallLogos = ['euroleague'];
    return smallLogos.some(small => name.toLowerCase().includes(small));
  };

  if (hasError || isFallback) {
    return <FallbackLogo />;
  }

  const hasDarkLogo = needsLightBackground(leagueName);
  const needsBigger = needsLargerSize(leagueName);
  
  // Use a bigger size for logos that appear too small (like EuroLeague SVG)
  const actualSize = needsBigger && size === 'xs' ? 'sm' : (needsBigger && size === 'sm' ? 'md' : size);

  return (
    <div className={`${sizeClasses[actualSize]} relative flex-shrink-0 ${className}`}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 rounded-lg animate-pulse"
          style={{ backgroundColor: `${getColor(leagueName)}40` }}
        />
      )}
      {/* Light background only for dark logos (Ligue 1, Champions League) */}
      {hasDarkLogo && <div className="absolute inset-0 bg-white/90 rounded-lg" />}
      <img
        src={logoUrl}
        alt={`${leagueName} logo`}
        className={`${hasDarkLogo ? 'relative p-0.5' : ''} w-full h-full object-contain transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => {
          if (logoUrl) loadedImages.add(logoUrl);
          setIsLoaded(true);
        }}
        onError={() => setHasError(true)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </div>
  );
}
