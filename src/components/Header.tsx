/**
 * Header component for SportBot AI
 * 
 * Modern navigation with sports analytics branding.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserMenu } from './auth';

// Admin emails list (same as in admin/page.tsx)
const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  return (
    <header className="bg-bg/95 backdrop-blur-md border-b border-divider sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image 
              src="/favicon.svg" 
              alt="SportBot AI" 
              width={36} 
              height={36}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">
              Sport<span className="text-accent">Bot</span>
              <span className="ml-1.5 text-xs font-semibold bg-accent text-bg px-1.5 py-0.5 rounded">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm"
            >
              Home
            </Link>
            <Link 
              href="/matches" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm flex items-center gap-1.5"
            >
              <span className="text-base">⚡</span>
              Analyze
            </Link>
            <Link 
              href="/ai-desk" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm flex items-center gap-1.5"
            >
              <span className="text-base">🧠</span>
              AI Desk
            </Link>
            <Link 
              href="/market-alerts" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm flex items-center gap-1.5"
            >
              <span className="text-base">📊</span>
              Alerts
              <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">PREMIUM</span>
            </Link>
            <Link 
              href="/pricing" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm"
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm"
            >
              Blog
            </Link>
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-divider animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                className="flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
              <Link
                href="/ai-desk"
                className="flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-lg">🧠</span>
                AI Desk
              </Link>
              <Link
                href="/matches"
                className="flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-lg">⚡</span>
                Analyze Match
              </Link>
              
              {/* User Section - Only show to logged in users */}
              {session && (
                <>
                  <div className="my-2 border-t border-divider" />
                  
                  <p className="px-4 py-2 text-xs text-text-muted uppercase tracking-wider">Your Account</p>
                  
                  <Link
                    href="/my-teams"
                    className="flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    My Teams
                  </Link>
                  <Link
                    href="/history"
                    className="flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </Link>
                  <Link
                    href="/market-alerts"
                    className="flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-lg">📊</span>
                    Market Alerts
                    <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded ml-auto">PREMIUM</span>
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Account Settings
                  </Link>
                </>
              )}
              
              {/* Sign In for guests */}
              {!session && (
                <>
                  <div className="my-2 border-t border-divider" />
                  <Link
                    href="/login"
                    className="flex items-center gap-3 text-accent hover:text-accent/80 hover:bg-accent/10 font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </Link>
                </>
              )}
              
              {/* Admin Section - Only show to admins */}
              {isAdmin && (
                <>
                  <div className="my-2 border-t border-divider" />
                  <p className="px-4 py-2 text-xs text-text-muted uppercase tracking-wider">Admin</p>
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 text-accent hover:text-accent/80 hover:bg-accent/10 font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Admin Dashboard
                  </Link>
                </>
              )}
              
              {/* Divider - More Section */}
              <div className="my-2 border-t border-divider" />
              <p className="px-4 py-2 text-xs text-text-muted uppercase tracking-wider">More</p>
              
              <Link
                href="/pricing"
                className="flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pricing
              </Link>
              <Link
                href="/blog"
                className="flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Blog
              </Link>
              <Link
                href="/responsible-gambling"
                className="flex items-center gap-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-4 py-3.5 rounded-btn transition-colors active:scale-[0.98]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Responsible Gaming
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
