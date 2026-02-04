/**
 * PromoBanner - Scrolling announcement bar
 * 
 * Marquee-style promotional banner that sits above the header.
 * Similar to props.cash announcement bar.
 * 
 * - Marquee on both desktop and mobile
 * - Hides when user scrolls down
 * - Shows when user is at top of page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Premium SVG Icons
const ChartIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

interface PromoBannerProps {
  /** Whether to show the banner (can be controlled externally) */
  show?: boolean;
}

export default function PromoBanner({ show = true }: PromoBannerProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  
  // Check if Serbian version - use false during SSR to avoid hydration mismatch
  const isSerbian = isMounted && pathname?.startsWith('/sr');
  
  // Don't show on pricing page (redundant)
  const hiddenPaths = ['/pricing', '/sr/pricing', '/checkout', '/sr/checkout'];
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path));
  
  // Mount effect
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Hide banner after scrolling 50px
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  if (!show || shouldHide) {
    return null;
  }
  
  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="promo-banner fixed top-0 left-0 right-0 z-[60] bg-[#2AF6A0] overflow-hidden">
        <div className="py-2 md:py-2.5 h-[36px] md:h-[44px]" />
      </div>
    );
  }
  
  // Promo content - English and Serbian
  const promoText = isSerbian
    ? 'Premium Launch 20% OFF prvih 6 meseci — $40/mesečno'
    : 'Premium Launch 20% OFF for your first 6 months — $40/month';
  
  const ctaText = isSerbian ? 'Pogledaj' : 'View Plans';
  const pricingLink = isSerbian ? '/sr/pricing' : '/pricing';
  
  return (
    <div 
      className={`
        promo-banner fixed top-0 left-0 right-0 z-[60] bg-[#2AF6A0] overflow-hidden
        transition-transform duration-300 ease-out
        ${isScrolled ? '-translate-y-full' : 'translate-y-0'}
      `}
    >
      {/* Marquee container - both mobile and desktop */}
      <div className="marquee-container py-2 md:py-2.5">
        <div className="marquee-content flex items-center gap-8 md:gap-12 animate-marquee">
          {/* Repeat content multiple times for seamless loop */}
          {[...Array(6)].map((_, i) => (
            <Link 
              key={i}
              href={pricingLink}
              className="flex items-center gap-3 md:gap-4 whitespace-nowrap hover:opacity-80 transition-opacity"
            >
              <ChartIcon />
              <span className="text-xs md:text-sm font-bold text-black tracking-tight">{promoText}</span>
              <span className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-bold bg-black text-[#2AF6A0] px-2 md:px-2.5 py-0.5 md:py-1 rounded-full">
                {ctaText}
                <ArrowRightIcon />
              </span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Gradient edges for smooth fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-[#2AF6A0] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-[#2AF6A0] to-transparent pointer-events-none" />
    </div>
  );
}
