/**
 * Premium Blur Component
 * 
 * Layer 2 of the two-layer blur system.
 * Shows a blur overlay for non-Pro users with a CTA to upgrade.
 * 
 * Design:
 * - Blurred preview of premium content
 * - "Upgrade to Pro" CTA in center
 * - Lock icon and value proposition
 */

'use client';

import Link from 'next/link';

interface PremiumBlurProps {
  /** The content to blur/show */
  children: React.ReactNode;
  /** Whether the user has Pro/Premium access */
  isPro: boolean;
  /** Optional title for the blur overlay */
  title?: string;
  /** Optional description for the blur overlay */
  description?: string;
}

export function PremiumBlur({
  children,
  isPro,
  title = 'Pro Analysis',
  description = 'Upgrade to Pro for detailed match insights, game flow analysis, and AI-powered predictions.',
}: PremiumBlurProps) {
  // If Pro user, just render children normally
  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="blur-[6px] opacity-30 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay with CTA */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#050506]/70 backdrop-blur-sm rounded-xl sm:rounded-2xl">
        <div className="text-center px-4 sm:px-6 py-6 sm:py-8 max-w-sm mx-4">
          {/* Lock icon */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500/20 to-purple-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-violet-500/20">
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
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
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:from-violet-400 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20"
          >
            <span>Upgrade to Pro</span>
            <span className="text-[10px] sm:text-xs opacity-75">$9/mo</span>
          </Link>
          
          {/* What's included */}
          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/5">
            <div className="flex flex-wrap justify-center gap-2 text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <span className="text-violet-400">✓</span> Match Insights
              </span>
              <span className="flex items-center gap-1">
                <span className="text-violet-400">✓</span> Game Flow
              </span>
              <span className="flex items-center gap-1">
                <span className="text-violet-400">✓</span> Value Detection
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumBlur;
