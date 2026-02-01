/**
 * MainWrapper - Handles dynamic padding based on promo banner visibility
 * 
 * Tracks scroll position and adjusts content padding when promo banner hides.
 */

'use client';

import { useState, useEffect, ReactNode } from 'react';

interface MainWrapperProps {
  children: ReactNode;
}

export default function MainWrapper({ children }: MainWrapperProps) {
  const [promoBannerVisible, setPromoBannerVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    // Check initial scroll position
    setPromoBannerVisible(window.scrollY <= 50);
    
    // Check if banner is dismissed
    const dismissed = localStorage.getItem('promo-banner-dismissed');
    if (dismissed === 'true') {
      setPromoBannerVisible(false);
    }
  }, []);
  
  useEffect(() => {
    const handleScroll = () => {
      // Same threshold as PromoBanner (50px)
      // But only if not dismissed
      const dismissed = localStorage.getItem('promo-banner-dismissed');
      if (dismissed === 'true') {
        setPromoBannerVisible(false);
      } else {
        setPromoBannerVisible(window.scrollY <= 50);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Default padding before mount
  const paddingTop = !isMounted 
    ? 'calc(64px + var(--promo-banner-height, 0px))'
    : promoBannerVisible 
      ? 'calc(64px + var(--promo-banner-height, 0px))' 
      : '64px';
  
  return (
    <div 
      className="min-h-screen flex flex-col pb-16 md:pb-0 transition-[padding-top] duration-300"
      style={{ paddingTop }}
    >
      {children}
    </div>
  );
}
