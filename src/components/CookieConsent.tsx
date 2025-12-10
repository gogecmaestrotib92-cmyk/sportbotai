'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'sportbot-cookie-consent';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
    
    // Initialize analytics after consent
    if (typeof window !== 'undefined' && window.gtag) {
      // Use type assertion to allow 'consent' command
      (window.gtag as (...args: unknown[]) => void)('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
  };

  const acceptNecessary = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-surface-card border border-divider rounded-xl shadow-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Text Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-white font-semibold">Cookie Notice</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              We use cookies to enhance your experience and analyze site traffic. 
              By clicking &quot;Accept All&quot;, you consent to our use of cookies. 
              Read our{' '}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>{' '}
              to learn more.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={acceptNecessary}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-transparent border border-divider rounded-lg hover:bg-surface-card hover:border-gray-500 transition-colors"
            >
              Necessary Only
            </button>
            <button
              onClick={acceptAll}
              className="px-6 py-2 text-sm font-semibold text-primary-900 bg-accent rounded-lg hover:bg-accent-green transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
