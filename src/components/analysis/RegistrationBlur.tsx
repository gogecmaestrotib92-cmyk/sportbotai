/**
 * Registration Blur Component
 * 
 * Layer 1 of the two-layer blur system.
 * Shows a blur overlay for non-authenticated users with a CTA to create a free account.
 * 
 * Design:
 * - Blurred preview of content behind
 * - "Create Free Account" CTA in center
 * - Lock icon and value proposition
 */

'use client';

import Link from 'next/link';

interface RegistrationBlurProps {
  /** The content to blur/show */
  children: React.ReactNode;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Optional title for the blur overlay */
  title?: string;
  /** Optional description for the blur overlay */
  description?: string;
  /** i18n translations */
  translations?: {
    createFreeAccount: string;
    alreadyHaveAccount: string;
    signIn: string;
    matchSignals: string;
    aiInsights: string;
    gameFlow: string;
  };
  /** Locale for proper link routing */
  locale?: 'en' | 'sr';
}

export function RegistrationBlur({
  children,
  isAuthenticated,
  title = 'Full Analysis Unlocked',
  description = 'Create a free account to access complete match intelligence, signals, and AI insights.',
  translations,
  locale = 'en',
}: RegistrationBlurProps) {
  const localePath = locale === 'sr' ? '/sr' : '';
  
  // Default translations
  const t = translations || {
    createFreeAccount: 'Create Free Account',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign in',
    matchSignals: 'Match Signals',
    aiInsights: 'AI Insights',
    gameFlow: 'Game Flow',
  };
  // If authenticated, just render children normally
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="blur-[8px] opacity-40 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay with CTA */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#050506]/60 backdrop-blur-sm rounded-xl sm:rounded-2xl">
        <div className="text-center px-4 sm:px-6 py-4 sm:py-8 max-w-sm mx-4">
          {/* Lock icon */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-emerald-500/20">
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
          
          {/* Title */}
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-xs sm:text-sm text-zinc-400 mb-4 sm:mb-6 leading-relaxed">
            {description}
          </p>
          
          {/* CTA Button */}
          <Link
            href={`${localePath}/register`}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
          >
            <span>{t.createFreeAccount}</span>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          
          {/* Sign in link */}
          <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-zinc-500">
            {t.alreadyHaveAccount}{' '}
            <Link href={`${localePath}/login`} className="text-emerald-400 hover:text-emerald-300 transition-colors">
              {t.signIn}
            </Link>
          </p>
          
          {/* Bullet points - What they get */}
          <div className="mt-3 sm:mt-6 pt-2 sm:pt-4 border-t border-white/5">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">✓</span> {t.matchSignals}
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">✓</span> {t.aiInsights}
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">✓</span> {t.gameFlow}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationBlur;
