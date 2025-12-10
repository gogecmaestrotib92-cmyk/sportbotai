'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

const PLAN_LIMITS: Record<string, number> = {
  FREE: 3,
  PRO: 30,
  PREMIUM: -1, // Unlimited
};

export function UserMenu() {
  const { data: session, status, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Refresh session data when dropdown opens
  useEffect(() => {
    if (isOpen && session) {
      update(); // Refresh session to get latest usage count
    }
  }, [isOpen, session, update]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-bg-tertiary transition-colors"
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
          className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border-primary bg-bg-secondary shadow-lg overflow-hidden z-50">
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
                {(() => {
                  const plan = session.user?.plan || 'FREE';
                  const limit = PLAN_LIMITS[plan] ?? 3;
                  const used = session.user?.analysisCount || 0;
                  const remaining = limit === -1 ? Infinity : Math.max(0, limit - used);
                  const isUnlimited = limit === -1;
                  
                  return isUnlimited ? (
                    <span className="text-sm text-accent font-medium">Unlimited analyses</span>
                  ) : (
                    <span className={`text-sm font-medium ${remaining === 0 ? 'text-danger' : remaining <= 1 ? 'text-warning' : 'text-accent'}`}>
                      {remaining}/{limit} left today
                    </span>
                  );
                })()}
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-text-muted/20 text-text-muted">
                {session.user?.plan || 'FREE'}
              </span>
            </div>
            
            {/* Data Status Row */}
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
              <span>Live data enabled</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/analyzer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analyzer
            </Link>

            <Link
              href="/pricing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
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
                setIsOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
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
