'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import ProBadge from '@/components/ProBadge';

// Admin emails - only these users see admin link
const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
];

// Custom event for usage updates - kept for components that dispatch it
export const USAGE_UPDATED_EVENT = 'sportbot:usage-updated';

export function UserMenu() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Detect if we're on Serbian version - use false during SSR to avoid hydration mismatch
  const isSerbian = mounted && pathname?.startsWith('/sr');
  const localePath = (path: string) => isSerbian ? `/sr${path}` : path;
  
  // Use live plan from API, fallback to session
  const [livePlan, setLivePlan] = useState<string>('FREE');
  
  // Fetch live plan from API
  useEffect(() => {
    if (!session?.user) return;
    
    const fetchPlan = async () => {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          if (data.plan) {
            setLivePlan(data.plan);
          }
        }
      } catch {
        // Ignore - use session plan
        setLivePlan(session.user?.plan || 'FREE');
      }
    };
    fetchPlan();
  }, [session?.user]);

  // Toggle menu - simple and direct
  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close menu
  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      // Small delay to allow click events to complete on mobile
      // This prevents the menu from closing before a menu item click registers
      const target = event.target as Node;
      
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    // Close on escape key
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      // Use 'click' instead of 'mousedown' to fix mobile touch issues
      // mousedown fires before the click completes, causing menu to close prematurely
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="w-9 h-9 rounded-full bg-bg-tertiary animate-pulse" />
    );
  }

  // i18n labels
  const t = {
    signIn: isSerbian ? 'Prijavi se' : 'Sign in',
    getStarted: isSerbian ? 'Započni' : 'Get Started',
  };

  // Not authenticated
  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={localePath('/login')}
          className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
        >
          {t.signIn}
        </Link>
        <Link
          href={localePath('/register')}
          className="btn-primary text-sm py-2 px-4"
        >
          {t.getStarted}
        </Link>
      </div>
    );
  }

  // Authenticated
  // Calculate initials - handle empty strings properly
  const userName = session.user?.name?.trim();
  const userEmail = session.user?.email?.trim();
  
  let userInitials = 'U';
  if (userName && userName.length > 0) {
    userInitials = userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  } else if (userEmail && userEmail.length > 0) {
    // Use first letter of email
    userInitials = userEmail[0].toUpperCase();
  }

  const plan = livePlan;
  const isPro = plan === 'PRO' || plan === 'PREMIUM';
  const isPremium = plan === 'PREMIUM';

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 p-1 rounded-full hover:bg-bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-9 h-9 rounded-full border-2 border-border-primary"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            {userInitials && userInitials !== 'U' ? (
              <span className="text-sm font-bold text-bg-primary">{userInitials}</span>
            ) : (
              <svg className="w-5 h-5 text-bg-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </div>
        )}
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#0a0a0b] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden z-[100]"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-border-primary">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">
                  {session.user?.name || 'User'}
                </p>
                <p className="text-xs text-text-secondary truncate">{session.user?.email}</p>
              </div>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-text-muted/20 text-text-muted flex-shrink-0">
                {isPro ? <ProBadge variant="inline" /> : plan}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2" role="none">
            {/* Admin Link - only visible to admin */}
            {session.user?.email && ADMIN_EMAILS.includes(session.user.email) && (
              <Link
                href="/admin"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-2 text-sm text-accent hover:text-accent hover:bg-accent/10 transition-colors font-medium"
                role="menuitem"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Dashboard
              </Link>
            )}
            
            <Link
              href={localePath('/my-teams')}
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {isSerbian ? 'Moji Timovi' : 'My Teams'}
            </Link>

            <Link
              href={localePath('/matches')}
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {isSerbian ? 'Mečevi' : 'Matches'}
            </Link>

            <Link
              href={localePath('/account')}
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {isSerbian ? 'Moj Nalog' : 'My Account'}
            </Link>

            {!isPro && (
              <Link
                href={localePath('/pricing')}
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors font-medium"
                role="menuitem"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {isSerbian ? 'Nadogradi na Pro' : 'Upgrade to Pro'}
              </Link>
            )}
            
            {isPro && !isPremium && (
              <Link
                href={localePath('/pricing')}
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-2 text-sm bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 bg-clip-text text-transparent hover:from-white hover:via-slate-200 hover:to-white hover:bg-slate-500/10 transition-colors font-semibold"
                role="menuitem"
              >
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                ✨ {isSerbian ? 'Nadogradi na Premium' : 'Upgrade to Premium'}
              </Link>
            )}
          </div>

          {/* Sign Out */}
          <div className="border-t border-border-primary py-2">
            <button
              onClick={() => {
                closeMenu();
                signOut({ callbackUrl: isSerbian ? '/sr' : '/' });
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isSerbian ? 'Odjavi se' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
