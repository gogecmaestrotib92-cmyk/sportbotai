/**
 * Usage Counter Component
 * 
 * Displays remaining analyses count based on user's plan.
 */

'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect } from 'react';

const PLAN_LIMITS: Record<string, number> = {
  FREE: 3,
  PRO: 30,
  PREMIUM: -1, // Unlimited
};

interface UsageCounterProps {
  usedToday?: number;
}

export default function UsageCounter({ usedToday = 0 }: UsageCounterProps) {
  const { data: session, status, update } = useSession();

  // Refresh session data on mount to get latest usage count
  useEffect(() => {
    if (session) {
      update();
    }
  }, []); // Only on mount

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <div className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <Link 
        href="/login"
        className="flex items-center gap-2 text-sm text-warning hover:text-warning/80 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Sign in to analyze</span>
      </Link>
    );
  }

  const plan = session.user?.plan || 'FREE';
  const limit = PLAN_LIMITS[plan] ?? 3;
  const used = session.user?.analysisCount || usedToday;
  const remaining = limit === -1 ? Infinity : Math.max(0, limit - used);
  const isUnlimited = limit === -1;

  // Color based on remaining
  const getColor = () => {
    if (isUnlimited) return 'text-accent';
    if (remaining === 0) return 'text-danger';
    if (remaining <= 1) return 'text-warning';
    return 'text-accent';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Usage Badge */}
      <div className={`flex items-center gap-2 text-sm ${getColor()}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {isUnlimited ? (
          <span>Unlimited</span>
        ) : (
          <span>{remaining}/{limit} left today</span>
        )}
      </div>

      {/* Plan Badge */}
      <span className={`
        px-2 py-0.5 rounded-full text-xs font-medium
        ${plan === 'PREMIUM' ? 'bg-accent/20 text-accent' : ''}
        ${plan === 'PRO' ? 'bg-primary/20 text-primary' : ''}
        ${plan === 'FREE' ? 'bg-text-muted/20 text-text-muted' : ''}
      `}>
        {plan}
      </span>

      {/* Upgrade Link (only for non-premium) */}
      {plan !== 'PREMIUM' && remaining <= 1 && (
        <Link 
          href="/pricing"
          className="text-xs text-primary hover:text-primary/80 transition-colors underline"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}
