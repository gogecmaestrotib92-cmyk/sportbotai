/**
 * AI Desk Client Component
 * 
 * Handles authentication check and registration gate for AI Desk features.
 * Non-authenticated users see a teaser with registration CTA.
 */

'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AIDeskHeroChat from '@/components/AIDeskHeroChat';
import AIDeskFeedSidebar from '@/components/AIDeskFeedSidebar';

export default function AIDeskClient() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session;

  // Show loading state with dimensions matched to actual content for CLS prevention
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        <div className="lg:col-span-2">
          {/* Match AIDeskHeroChat dimensions */}
          <div className="card-glass rounded-2xl overflow-hidden min-h-[450px]">
            <div className="p-4 border-b border-white/5 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/5 rounded-lg" />
                <div className="h-4 bg-white/5 rounded w-32" />
              </div>
            </div>
            <div className="p-6 space-y-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full flex-shrink-0" />
                <div className="flex-1 bg-white/5 rounded-xl p-4 h-20" />
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full flex-shrink-0" />
                <div className="flex-1 bg-white/5 rounded-xl p-4 h-32" />
              </div>
            </div>
            <div className="p-4 border-t border-white/5 animate-pulse mt-auto">
              <div className="h-12 bg-white/5 rounded-xl" />
            </div>
          </div>
        </div>
        <div>
          {/* Match AIDeskFeedSidebar dimensions */}
          <div className="card-glass rounded-2xl p-4 min-h-[400px]">
            <div className="h-6 bg-white/5 rounded w-1/2 mb-4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-white/5 rounded animate-pulse" />
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
              <div className="card-glass rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet/20 rounded-lg" />
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
                    <div className="flex-1 bg-violet/10 rounded-xl p-4 h-16 max-w-md" />
                    <div className="w-8 h-8 bg-violet/20 rounded-full" />
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full" />
                    <div className="flex-1 bg-white/5 rounded-xl p-4 h-32" />
                  </div>
                </div>
                <div className="p-4 border-t border-white/5">
                  <div className="h-12 bg-white/5 rounded-xl" />
                </div>
              </div>
            </div>
            <div>
              {/* Fake feed preview */}
              <div className="card-glass rounded-2xl p-4 space-y-3">
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
          <div className="card-glass p-5 sm:p-8 max-w-md text-center shadow-2xl shadow-violet/5">
            {/* Icon */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet/20 to-violet-dark/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 border border-violet/20">
              <span className="text-2xl sm:text-3xl">🧠</span>
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-extrabold text-white mb-1.5 sm:mb-2 tracking-tight">
              Unlock AI Sports Desk
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-zinc-400 mb-4 sm:mb-6 leading-relaxed">
              Create a free account to chat with our AI about any sport, get real-time intelligence, and access the live intel feed.
            </p>

            {/* Features List */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-accent/10 text-accent text-[10px] sm:text-xs font-semibold rounded-full border border-accent/20 flex items-center gap-1">
                <span>💬</span> Ask Anything
              </span>
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500/10 text-blue-400 text-[10px] sm:text-xs font-semibold rounded-full border border-blue-500/20 flex items-center gap-1">
                <span>⚡</span> Real-Time
              </span>
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-accent/10 text-accent text-[10px] sm:text-xs font-semibold rounded-full border border-accent/20 flex items-center gap-1">
                <span>📡</span> Live Intel
              </span>
            </div>

            {/* CTA Button */}
            <Link
              href="/register"
              className="btn-primary w-full justify-center text-xs sm:text-sm flex items-center gap-2"
            >
              <span>Create Free Account</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            {/* Sign in link */}
            <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-zinc-500">
              Already have an account?{' '}
              <Link href="/login" className="text-accent hover:text-accent-dark transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show full AI Desk
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
      {/* HERO: Chat - Takes 2/3 of the space */}
      <div className="lg:col-span-2">
        <AIDeskHeroChat />
      </div>

      {/* SIDEBAR: Live Intel Feed */}
      <div className="space-y-4">
        {/* Feed Component */}
        <AIDeskFeedSidebar limit={10} />

        {/* Disclaimer */}
        <div className="card-glass border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-500/80 text-xs leading-relaxed">
            ⚠️ AI-generated content for informational purposes only. This is not betting advice.
            Please gamble responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}
