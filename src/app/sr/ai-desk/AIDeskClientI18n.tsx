/**
 * AI Desk Client Component - i18n Version
 * 
 * Handles authentication check and registration gate for AI Desk features.
 * Non-authenticated users see a teaser with registration CTA.
 * Supports localization.
 */

'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AIDeskHeroChat from '@/components/AIDeskHeroChat';
import AIDeskFeedSidebar from '@/components/AIDeskFeedSidebar';
import { Locale, getTranslations } from '@/lib/i18n/translations';

interface AIDeskClientI18nProps {
  locale: Locale;
}

export default function AIDeskClientI18n({ locale }: AIDeskClientI18nProps) {
  const t = getTranslations(locale);
  const localePath = locale === 'sr' ? '/sr' : '';
  
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session;

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-bg-card border border-border rounded-2xl p-8 animate-pulse">
            <div className="h-8 bg-white/5 rounded w-1/3 mb-4" />
            <div className="h-64 bg-white/5 rounded" />
          </div>
        </div>
        <div>
          <div className="bg-bg-card border border-border rounded-2xl p-4 animate-pulse">
            <div className="h-6 bg-white/5 rounded w-1/2 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/5 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show registration gate
  if (!isAuthenticated) {
    return (
      <div className="relative">
        {/* Blurred Preview */}
        <div className="blur-[6px] opacity-30 pointer-events-none select-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Fake chat preview */}
              <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg" />
                    <div className="h-4 bg-white/10 rounded w-32" />
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Fake messages */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full" />
                    <div className="flex-1 bg-white/5 rounded-xl p-4 h-20" />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 bg-primary/10 rounded-xl p-4 h-16 max-w-md" />
                    <div className="w-8 h-8 bg-primary/20 rounded-full" />
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full" />
                    <div className="flex-1 bg-white/5 rounded-xl p-4 h-32" />
                  </div>
                </div>
                <div className="p-4 border-t border-border">
                  <div className="h-12 bg-white/5 rounded-xl" />
                </div>
              </div>
            </div>
            <div>
              {/* Fake feed preview */}
              <div className="bg-bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="h-6 bg-white/10 rounded w-1/2" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 h-24" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Registration Gate Overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="bg-[#0a0a0b]/95 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-8 max-w-md text-center shadow-2xl">
            {/* Icon */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500/20 to-violet-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 border border-purple-500/20">
              <span className="text-2xl sm:text-3xl">🧠</span>
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">
              {t.aiDesk.unlockTitle}
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-zinc-400 mb-4 sm:mb-6 leading-relaxed">
              {t.aiDesk.unlockDescription}
            </p>

            {/* Features List */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-500/10 text-purple-400 text-[10px] sm:text-xs font-medium rounded-full border border-purple-500/20 flex items-center gap-1">
                <span>💬</span> {t.aiDesk.askAnything}
              </span>
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500/10 text-blue-400 text-[10px] sm:text-xs font-medium rounded-full border border-blue-500/20 flex items-center gap-1">
                <span>⚡</span> {t.aiDesk.realTime}
              </span>
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/10 text-green-400 text-[10px] sm:text-xs font-medium rounded-full border border-green-500/20 flex items-center gap-1">
                <span>📡</span> {t.aiDesk.liveIntel}
              </span>
            </div>

            {/* CTA Button */}
            <Link
              href={`${localePath}/register`}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/20 w-full justify-center"
            >
              <span>{t.aiDesk.createFreeAccount}</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            {/* Sign in link */}
            <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-zinc-500">
              {t.aiDesk.alreadyHaveAccount}{' '}
              <Link href={`${localePath}/login`} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                {t.aiDesk.signIn}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show full AI Desk
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* HERO: Chat - Takes 2/3 of the space */}
      <div className="lg:col-span-2">
        <AIDeskHeroChat />
      </div>

      {/* SIDEBAR: Live Intel Feed */}
      <div className="space-y-4">
        {/* Feed Component */}
        <AIDeskFeedSidebar limit={10} />

        {/* Disclaimer */}
        <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4">
          <p className="text-yellow-500/80 text-xs leading-relaxed">
            ⚠️ {t.aiDesk.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
