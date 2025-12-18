/**
 * Account Dashboard Client Component
 * 
 * Interactive dashboard with subscription management
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import ProBadge from '@/components/ProBadge';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: string;
  analysisCount: number;
  lastAnalysisDate: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  _count: {
    analyses: number;
  };
}

interface Analysis {
  id: string;
  sport: string;
  league: string | null;
  homeTeam: string;
  awayTeam: string;
  createdAt: Date;
}

interface Props {
  user: UserData;
  recentAnalyses: Analysis[];
}

const PLAN_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: 30,
  PREMIUM: -1,
};

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  FREE: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  PRO: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
  PREMIUM: { bg: 'bg-accent/20', text: 'text-accent', border: 'border-accent/30' },
};

export default function AccountDashboard({ user, recentAnalyses }: Props) {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [usageData, setUsageData] = useState<{ used: number; limit: number; remaining: number } | null>(null);

  // Fetch real-time usage on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setUsageData({
            used: data.used ?? user.analysisCount,
            limit: data.limit ?? PLAN_LIMITS[user.plan] ?? 1,
            remaining: data.remaining ?? 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      }
    };
    fetchUsage();
  }, [user.analysisCount, user.plan]);

  const planColors = PLAN_COLORS[user.plan] || PLAN_COLORS.FREE;
  const limit = usageData?.limit ?? PLAN_LIMITS[user.plan] ?? 1;
  const used = usageData?.used ?? user.analysisCount;
  const remaining = usageData?.remaining ?? (limit === -1 ? Infinity : Math.max(0, limit - used));
  const usagePercent = limit === -1 ? 0 : (used / limit) * 100;

  const handleManageSubscription = async () => {
    if (!user.stripeCustomerId) {
      // No subscription - redirect to pricing
      window.location.href = '/pricing';
      return;
    }

    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create portal session');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const userInitials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.[0].toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <section className="bg-bg-card border-b border-divider">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="w-16 h-16 rounded-full border-2 border-divider"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xl font-bold text-bg">{userInitials}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name || 'User'}</h1>
              <p className="text-text-secondary">{user.email}</p>
            </div>
            <div className="ml-auto">
              <ProBadge variant="default" showUpgrade={user.plan === 'FREE'} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Usage Card */}
          <div className="bg-bg-card rounded-xl border border-divider p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Today's Usage
            </h3>
            
            <div className="mb-4">
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-bold text-white">
                  {limit === -1 ? '∞' : `${used} / ${limit}`}
                </span>
                <span className="text-text-muted text-sm">
                  {limit === -1 ? 'unlimited' : `used today`}
                </span>
              </div>
              
              {limit !== -1 && (
                <>
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${usagePercent > 80 ? 'bg-danger' : usagePercent > 50 ? 'bg-warning' : 'bg-accent'}`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    {remaining > 0 ? `${remaining} ${remaining === 1 ? 'analysis' : 'analyses'} remaining` : 'Limit reached – resets at midnight'}
                  </p>
                </>
              )}
            </div>
            
            <Link 
              href="/matches"
              className="btn-primary w-full text-center text-sm py-2"
            >
              Browse Matches
            </Link>
          </div>

          {/* Total Analyses Card */}
          <div className="bg-bg-card rounded-xl border border-divider p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Total Analyses
            </h3>
            
            <div className="mb-4">
              <span className="text-3xl font-bold text-white">{user._count.analyses}</span>
              <span className="text-text-muted text-sm ml-2">all time</span>
            </div>
            
            <Link 
              href="/history"
              className="btn-secondary w-full text-center text-sm py-2"
            >
              View History
            </Link>
          </div>

          {/* Subscription Card */}
          <div className={`bg-bg-card rounded-xl border ${planColors.border} p-6`}>
            <h3 className="text-sm font-medium text-text-muted mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Subscription
            </h3>
            
            <div className="mb-4">
              <span className={`text-2xl font-bold ${planColors.text}`}>{user.plan}</span>
              {user.plan === 'FREE' && (
                <p className="text-text-muted text-sm mt-1">Upgrade for more analyses</p>
              )}
              {user.plan !== 'FREE' && (
                <p className="text-text-muted text-sm mt-1">Active subscription</p>
              )}
            </div>
            
            <button
              onClick={handleManageSubscription}
              disabled={isLoadingPortal}
              className={`w-full text-center text-sm py-2 rounded-lg font-medium transition-colors ${
                user.plan === 'FREE' 
                  ? 'bg-accent text-bg hover:bg-accent-green' 
                  : 'bg-bg border border-divider text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {isLoadingPortal ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </span>
              ) : user.plan === 'FREE' ? (
                'Upgrade Plan'
              ) : (
                'Manage Billing'
              )}
            </button>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Analyses</h2>
          
          {recentAnalyses.length === 0 ? (
            <div className="bg-bg-card rounded-xl border border-divider p-8 text-center">
              <svg className="w-12 h-12 text-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-text-secondary mb-4">No analyses yet</p>
              <Link href="/matches" className="btn-primary inline-block">
                Browse Matches
              </Link>
            </div>
          ) : (
            <div className="bg-bg-card rounded-xl border border-divider overflow-hidden">
              <div className="divide-y divide-divider">
                {recentAnalyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    href={`/history/${analysis.id}`}
                    className="flex items-center justify-between p-4 hover:bg-bg-hover transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center text-lg">
                        {analysis.sport === 'soccer' ? '⚽' : 
                         analysis.sport === 'basketball' ? '🏀' :
                         analysis.sport === 'tennis' ? '🎾' :
                         analysis.sport === 'hockey' ? '🏒' :
                         analysis.sport === 'american_football' ? '🏈' :
                         analysis.sport === 'mma' ? '🥊' : '🏆'}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {analysis.homeTeam} vs {analysis.awayTeam}
                        </p>
                        <p className="text-text-muted text-sm">
                          {analysis.league || analysis.sport}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-sm">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </p>
                      <svg className="w-5 h-5 text-text-muted ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="p-4 border-t border-divider bg-bg/50">
                <Link 
                  href="/history" 
                  className="text-primary hover:text-primary/80 text-sm font-medium flex items-center justify-center gap-1"
                >
                  View All History
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Account Settings</h2>
          
          <div className="bg-bg-card rounded-xl border border-divider divide-y divide-divider">
            {/* Member Since */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-text-secondary">Member since</span>
              </div>
              <span className="text-white">
                {new Date(user.createdAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-text-secondary">Email</span>
              </div>
              <span className="text-white">{user.email}</span>
            </div>

            {/* Sign Out */}
            <div className="p-4">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 text-danger hover:text-danger/80 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Danger Zone</h2>
          
          <div className="bg-bg-card rounded-xl border border-danger/30 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-medium">Delete Account</h3>
                <p className="text-text-muted text-sm mt-1">
                  Permanently delete your account and all data. This action cannot be undone.
                </p>
              </div>
              <Link
                href="/account/delete"
                className="px-4 py-2 text-sm font-medium text-danger border border-danger/30 rounded-lg hover:bg-danger/10 transition-colors"
              >
                Delete Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
