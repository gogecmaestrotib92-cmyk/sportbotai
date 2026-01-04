/**
 * ProSection Component
 * 
 * Handles the collapsed teaser pattern for PRO content:
 * - FREE users see: title + teaser bullets + lock message
 * - PRO users see: full content
 * 
 * This creates the psychological gap:
 * "I understand it exists, but I can't consume its value."
 */

'use client';

import Link from 'next/link';
import React from 'react';

type Locale = 'en' | 'sr';

const translations = {
  en: {
    unlockPro: 'Unlock Pro',
    availableInPro: 'Available in Pro',
  },
  sr: {
    unlockPro: 'Otključaj Pro',
    availableInPro: 'Dostupno u Pro',
  },
};

interface ProSectionProps {
  /** Is user a PRO subscriber? */
  isPro: boolean;
  /** Section title (e.g., "Match Snapshot") */
  title: string;
  /** Icon to show before title */
  icon?: React.ReactNode;
  /** Teaser bullet points for FREE users */
  teaserBullets?: string[];
  /** Optional teaser paragraph (will be truncated/faded) */
  teaserText?: string;
  /** Full content to show for PRO users */
  children: React.ReactNode;
  /** Locale for translations */
  locale?: Locale;
  /** Custom class name */
  className?: string;
}

export function ProSection({
  isPro,
  title,
  icon = <span className="text-violet-400">✦</span>,
  teaserBullets,
  teaserText,
  children,
  locale = 'en',
  className = '',
}: ProSectionProps) {
  const t = translations[locale];
  const localePath = locale === 'sr' ? '/sr' : '';

  // PRO users see full content
  if (isPro) {
    return (
      <div className={`rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/10 p-5 sm:p-6 ${className}`}>
        <h3 className="text-sm font-semibold text-violet-300 uppercase tracking-wide mb-5 flex items-center gap-3">
          <span className="text-base">{icon}</span>
          {title}
          <span className="ml-auto text-[10px] px-2.5 py-1 bg-violet-500/15 text-violet-300 rounded-full border border-violet-500/25 font-medium">
            PRO
          </span>
        </h3>
        {children}
      </div>
    );
  }

  // FREE users see collapsed teaser
  return (
    <div className={`rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-5 sm:p-6 ${className}`}>
      {/* Header */}
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-4 flex items-center gap-3">
        <span className="opacity-60 text-base">{icon}</span>
        <span>{title}</span>
        <span className="ml-auto text-[10px] px-2.5 py-1 bg-zinc-800/70 text-zinc-400 rounded-full border border-zinc-700/40 font-medium">
          🔒 PRO
        </span>
      </h3>

      {/* Teaser content */}
      <div className="space-y-3">
        {/* Teaser bullets */}
        {teaserBullets && teaserBullets.length > 0 && (
          <ul className="space-y-2">
            {teaserBullets.map((bullet, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 flex-shrink-0" />
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {/* Teaser text with fade */}
        {teaserText && (
          <div className="relative">
            <p className="text-base text-zinc-400 leading-relaxed line-clamp-2">
              {teaserText}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0a0a0b] to-transparent" />
          </div>
        )}

        {/* Unlock CTA - larger touch target for mobile */}
        <div className="pt-3">
          <Link
            href={`${localePath}/pricing`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-violet-400/80 hover:text-violet-400 transition-colors py-2 -my-2"
          >
            {t.unlockPro}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * ProSectionPlaceholder
 * 
 * For sections that should show grey placeholder boxes instead of any content.
 * Used for Execution Breakdown where numbers must be completely hidden.
 */
interface ProSectionPlaceholderProps {
  isPro: boolean;
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  locale?: Locale;
  className?: string;
}

export function ProSectionPlaceholder({
  isPro,
  title,
  icon = <span className="text-violet-400">✦</span>,
  description,
  children,
  locale = 'en',
  className = '',
}: ProSectionPlaceholderProps) {
  const t = translations[locale];
  const localePath = locale === 'sr' ? '/sr' : '';

  // PRO users see full content
  if (isPro) {
    return (
      <div className={`rounded-2xl bg-[#0c0c0d] border border-zinc-800/60 p-4 sm:p-5 ${className}`}>
        <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          {icon}
          {title}
          <span className="ml-auto text-[9px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">
            PRO
          </span>
        </h3>
        {children}
      </div>
    );
  }

  // FREE users see placeholder boxes only
  return (
    <div className={`rounded-2xl bg-[#0a0a0b] border border-zinc-800/40 p-4 sm:p-5 ${className}`}>
      {/* Header */}
      <h3 className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="opacity-40">{icon}</span>
        <span className="text-zinc-500">{title}</span>
        <span className="ml-auto text-[9px] px-2 py-0.5 bg-zinc-800/50 text-zinc-500 rounded-full border border-zinc-700/30">
          🔒 PRO
        </span>
      </h3>

      {/* Grey placeholder boxes */}
      <div className="space-y-3">
        <div className="h-10 bg-zinc-800/30 rounded-lg" />
        <div className="flex gap-2">
          <div className="flex-1 h-14 bg-zinc-800/30 rounded-lg" />
          <div className="flex-1 h-14 bg-zinc-800/30 rounded-lg" />
          <div className="flex-1 h-14 bg-zinc-800/30 rounded-lg" />
        </div>
        <div className="h-16 bg-zinc-800/30 rounded-lg" />
      </div>

      {/* Lock message */}
      <div className="mt-4 pt-3 border-t border-zinc-800/30">
        <div className="flex items-center gap-2 text-zinc-500 mb-1">
          <span>🔒</span>
          <span className="text-xs font-medium">{t.availableInPro}</span>
        </div>
        {description && (
          <p className="text-zinc-600 text-xs mb-3">{description}</p>
        )}
        <Link
          href={`${localePath}/pricing`}
          className="inline-flex items-center gap-1.5 text-xs text-violet-400/80 hover:text-violet-400 transition-colors"
        >
          {t.unlockPro}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
