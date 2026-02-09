'use client';

/**
 * AffiliateTracker - Tracks affiliate referrals via URL parameter
 * 
 * When user visits with ?ref=PARTNER_CODE, saves to cookie for 90 days.
 * This ref code is then passed to Stripe checkout metadata.
 * Also tracks the click in the database for affiliate dashboard.
 * 
 * Usage: Add to root layout, reads ?ref= from URL
 * 
 * Example: sportbot.ai/?ref=partner123
 */

import { useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

const COOKIE_NAME = 'affiliate_ref';
const COOKIE_DAYS = 90;

// Helper to set cookie
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Helper to get cookie
export function getAffiliateCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + COOKIE_NAME + '=([^;]+)'));
  return match ? match[2] : null;
}

// Track click in database
async function trackClick(code: string, landingPage: string) {
  try {
    await fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        referer: document.referrer || null,
        landingPage,
      }),
    });
  } catch (err) {
    // Silently fail - don't break user experience
    console.error('[Affiliate] Track error:', err);
  }
}

export default function AffiliateTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const ref = searchParams.get('ref');
    
    if (ref && ref.trim()) {
      const code = ref.trim();
      
      // Check if this is a new referral (not already in cookie)
      const existingRef = getAffiliateCookie();
      
      if (existingRef !== code) {
        // Save affiliate code to cookie (90 days)
        setCookie(COOKIE_NAME, code, COOKIE_DAYS);
        console.log(`[Affiliate] Tracked referral: ${code}`);
        
        // Track click in database
        trackClick(code, pathname);
      }
    }
  }, [searchParams, pathname]);

  return null; // No UI - just tracking
}
