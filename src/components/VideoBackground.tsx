/**
 * Video Background Component
 * 
 * Premium video background with all safeguards:
 * - Poster image fallback (shows immediately)
 * - Mobile detection (static image on phones)
 * - Accessibility (respects reduced motion)
 * - Dark overlay for text readability
 * - Lazy loading for performance (deferred until after LCP)
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  /** Video source (MP4) */
  videoSrc: string;
  /** WebM source for better compression (optional) */
  webmSrc?: string;
  /** Poster image shown while loading (optional) */
  posterSrc?: string;
  /** Overlay opacity (0-1) */
  overlayOpacity?: number;
  /** Disable video on mobile */
  disableOnMobile?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function VideoBackground({
  videoSrc,
  webmSrc,
  posterSrc,
  overlayOpacity = 0.6,
  disableOnMobile = true,
  className = '',
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(true); // Default to mobile to prevent video load on SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false); // Defer video loading

  useEffect(() => {
    // Check for mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Listen for motion preference changes
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);
    
    // Defer video loading until after initial render (LCP optimization)
    // Wait 2 seconds to ensure LCP has completed
    const timer = setTimeout(() => {
      setShouldLoadVideo(true);
    }, 2000);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      motionQuery.removeEventListener('change', handleMotionChange);
      clearTimeout(timer);
    };
  }, []);

  // Should we show video? Only after deferred loading and on desktop
  const showVideo = shouldLoadVideo && !hasError && !prefersReducedMotion && !(disableOnMobile && isMobile);

  // Try to play video when conditions are met
  useEffect(() => {
    if (showVideo && videoRef.current && isVideoLoaded) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, fall back to poster
        setHasError(true);
      });
    }
  }, [showVideo, isVideoLoaded]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Mobile fallback: gradient background */}
      {!showVideo && !posterSrc && (
        <div className="absolute inset-0">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#2A3036_1px,transparent_1px),linear-gradient(to_bottom,#2A3036_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30" />
          {/* Gradient orbs */}
          <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-primary/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-accent/15 rounded-full blur-[60px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
        </div>
      )}
      
      {/* Poster image fallback (if provided) */}
      {posterSrc && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ 
            backgroundImage: `url(${posterSrc})`,
            opacity: showVideo && isVideoLoaded ? 0 : 1,
          }}
        />
      )}
      
      {/* Video (only on desktop with no reduced motion, deferred 2s after page load) */}
      {showVideo && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterSrc}
          onLoadedData={() => setIsVideoLoaded(true)}
          onError={() => setHasError(true)}
        >
          {webmSrc && <source src={webmSrc} type="video/webm" />}
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
      
      {/* Dark overlay for text readability */}
      <div 
        className="absolute inset-0 bg-bg-primary"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
    </div>
  );
}
