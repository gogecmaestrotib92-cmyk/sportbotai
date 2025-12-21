/**
 * Account Dashboard Client Component
 * 
 * Interactive dashboard with subscription management
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import ProBadge from '@/components/ProBadge';
import FeedbackModal from '@/components/FeedbackModal';

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

interface Props {
  user: UserData;
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

export default function AccountDashboard({ user }: Props) {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [usageData, setUsageData] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; type: 'feature' | 'problem' }>({
    isOpen: false,
    type: 'feature',
  });

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
              <Image
                src={user.image}
                alt={user.name || 'User'}
                width={64}
                height={64}
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
              Today&apos;s Usage
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

        {/* Quick Links */}
        <div className="mt-8">
          <Link 
            href="/history"
            className="flex items-center justify-between p-4 bg-bg-card rounded-xl border border-divider hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Analysis History</p>
                <p className="text-text-muted text-sm">View all your past analyses</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Feedback Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Help Us Improve</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Suggest a Feature */}
            <button
              onClick={() => setFeedbackModal({ isOpen: true, type: 'feature' })}
              className="flex items-center gap-4 p-4 bg-bg-card rounded-xl border border-divider hover:border-primary/30 transition-colors group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium group-hover:text-primary transition-colors">Suggest a Feature</p>
                <p className="text-text-muted text-sm">Share your ideas to improve SportBot</p>
              </div>
              <svg className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Report a Problem */}
            <button
              onClick={() => setFeedbackModal({ isOpen: true, type: 'problem' })}
              className="flex items-center gap-4 p-4 bg-bg-card rounded-xl border border-divider hover:border-danger/30 transition-colors group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium group-hover:text-danger transition-colors">Report a Problem</p>
                <p className="text-text-muted text-sm">Let us know if something isn&apos;t working</p>
              </div>
              <svg className="w-5 h-5 text-text-muted group-hover:text-danger transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        type={feedbackModal.type}
        userEmail={user.email}
        userName={user.name}
      />
    </div>
  );
}
