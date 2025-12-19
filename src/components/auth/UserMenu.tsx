'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import ProBadge from '@/components/ProBadge';

// Admin emails - only these users see admin link
const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
];

const PLAN_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: 30,
  PREMIUM: -1, // Unlimited
};

// Custom event for usage updates
export const USAGE_UPDATED_EVENT = 'sportbot:usage-updated';

export function UserMenu() {
  const { data: session, status, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [usageData, setUsageData] = useState<{ remaining: number; limit: number; plan: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch fresh usage data on mount and when session changes
  useEffect(() => {
    if (session) {
      fetch('/api/usage')
        .then(res => res.json())
        .then(data => {
          if (data.remaining !== undefined) {
            setUsageData({
              remaining: data.remaining,
              limit: data.limit,
              plan: data.plan || session.user?.plan || 'FREE',
            });
          }
        })
        .catch(() => {
          // Fallback to session data on error
        });
    }
  }, [session]);

  // Listen for usage update events (dispatched after analysis)
  useEffect(() => {
    const handleUsageUpdate = () => {
      if (session) {
        fetch('/api/usage')
          .then(res => res.json())
          .then(data => {
            if (data.remaining !== undefined) {
              setUsageData({
                remaining: data.remaining,
                limit: data.limit,
                plan: data.plan || session.user?.plan || 'FREE',
              });
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener(USAGE_UPDATED_EVENT, handleUsageUpdate);
    return () => window.removeEventListener(USAGE_UPDATED_EVENT, handleUsageUpdate);
  }, [session]);
  
  // Refetch when menu opens to get latest data
  useEffect(() => {
    if (isOpen && session) {
      fetch('/api/usage')
        .then(res => res.json())
        .then(data => {
          if (data.remaining !== undefined) {
            setUsageData({
              remaining: data.remaining,
              limit: data.limit,
              plan: data.plan || session.user?.plan || 'FREE',
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, session]);

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
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
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
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Session refresh is now handled by AuthProvider (5 min interval)
  // No need to refresh here - it causes unnecessary re-renders

  // Loading state
  if (status === 'loading') {
    return (
      <div className="w-9 h-9 rounded-full bg-bg-tertiary animate-pulse" />
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="btn-primary text-sm py-2 px-4"
        >
          Get Started
        </Link>
      </div>
    );
  }

  // Authenticated
  const userInitials = session.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || session.user?.email?.[0].toUpperCase() || 'U';

  // Use fresh usageData if available, otherwise fall back to session data
  const plan = usageData?.plan || session.user?.plan || 'FREE';
  const limit = usageData?.limit ?? PLAN_LIMITS[plan] ?? 1;
  // IMPORTANT: Prefer usageData.remaining as it's fresh from DB
  // Only use session.analysisCount as absolute last resort (it's stale in JWT)
  const remaining = usageData?.remaining ?? (limit === -1 ? Infinity : limit);
  const isUnlimited = limit === -1;

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
            <span className="text-sm font-bold text-bg-primary">{userInitials}</span>
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
          className="absolute right-0 mt-2 w-72 rounded-xl border border-border-primary bg-bg-secondary shadow-xl overflow-hidden z-[100]"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-border-primary">
            <p className="text-sm font-medium text-text-primary truncate">
              {session.user?.name || 'User'}
            </p>
            <p className="text-xs text-text-secondary truncate">{session.user?.email}</p>
          </div>

          {/* Usage Stats */}
          <div className="px-4 py-3 border-b border-border-primary bg-bg-tertiary/50">
            {/* Usage Counter Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {isUnlimited ? (
                  <span className="text-sm text-accent font-medium">Unlimited analyses</span>
                ) : (
                  <span className={`text-sm font-medium ${remaining === 0 ? 'text-danger' : remaining <= 1 ? 'text-warning' : 'text-accent'}`}>
                    {remaining}/{limit} left today
                  </span>
                )}
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-text-muted/20 text-text-muted">
                {plan === 'PRO' || plan === 'PREMIUM' ? (
                  <ProBadge variant="inline" />
                ) : (
                  plan
                )}
              </span>
            </div>
            
            {/* Data Status Row */}
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
              <span>Live data enabled</span>
            </div>
            
            {/* Upgrade CTA when limit reached */}
            {!isUnlimited && remaining === 0 && (
              <Link
                href="/pricing"
                onClick={closeMenu}
                className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Upgrade to Pro
              </Link>
            )}
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
              href="/matches"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Matches
            </Link>

            <Link
              href="/account"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Account
            </Link>

            <Link
              href="/pricing"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Upgrade Plan
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-border-primary py-2">
            <button
              onClick={() => {
                closeMenu();
                signOut({ callbackUrl: '/' });
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
