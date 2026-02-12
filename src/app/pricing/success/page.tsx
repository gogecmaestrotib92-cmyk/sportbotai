/**
 * Payment Success Page
 * 
 * Shown after successful Stripe checkout
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Welcome to Your New Plan!',
  description: 'Thank you for upgrading your SportBot AI subscription.',
};

// Plan features for display
const PLAN_FEATURES = {
  Pro: {
    emoji: '🚀',
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    borderColor: 'border-primary/30',
    analyses: '30 analyses per day',
    features: [
      { icon: '📊', text: '30 AI analyses per day' },
      { icon: '⚽', text: 'All sports included' },
      { icon: '🎯', text: 'Advanced value detection' },
      { icon: '📈', text: 'Detailed probability breakdowns' },
      { icon: '💬', text: 'Priority email support' },
      { icon: '📅', text: '30-day analysis history' },
    ],
  },
  Premium: {
    emoji: '👑',
    color: 'text-accent',
    bgColor: 'bg-accent/20',
    borderColor: 'border-accent/30',
    analyses: 'Unlimited analyses',
    features: [
      { icon: '♾️', text: 'Unlimited AI analyses' },
      { icon: '🎮', text: 'All sports + eSports' },
      { icon: '🧠', text: 'Premium AI model (GPT-4)' },
      { icon: '💎', text: 'Advanced value & edge detection' },
      { icon: '🔌', text: 'API access for automation' },
      { icon: '🛎️', text: '24/7 priority support' },
      { icon: '📚', text: 'Unlimited analysis history' },
      { icon: '🔔', text: 'Custom match alerts' },
    ],
  },
};

function SuccessContent({ plan }: { plan: string }) {
  const planKey = plan === 'Premium' ? 'Premium' : 'Pro';
  const planInfo = PLAN_FEATURES[planKey];

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${planInfo.bgColor} ${planInfo.borderColor} border-2 mb-6 animate-bounce-subtle`}>
            <span className="text-5xl">{planInfo.emoji}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welcome to <span className={planInfo.color}>{planKey}!</span>
          </h1>
          
          <p className="text-lg text-text-secondary max-w-md mx-auto">
            Thank you for upgrading! Your account has been activated with all {planKey} features.
          </p>
        </div>

        {/* Features Card */}
        <div className={`bg-bg-card rounded-2xl border ${planInfo.borderColor} p-6 md:p-8 mb-8`}>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your {planKey} Benefits
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {planInfo.features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 bg-bg/50 rounded-xl"
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-text-secondary">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-bg-card rounded-xl p-4 text-center border border-divider">
            <div className={`text-2xl font-bold ${planInfo.color}`}>
              {planKey === 'Premium' ? '∞' : '30'}
            </div>
            <div className="text-xs text-text-muted">Daily Analyses</div>
          </div>
          <div className="bg-bg-card rounded-xl p-4 text-center border border-divider">
            <div className={`text-2xl font-bold ${planInfo.color}`}>
              {planKey === 'Premium' ? '10+' : '7'}
            </div>
            <div className="text-xs text-text-muted">Sports</div>
          </div>
          <div className="bg-bg-card rounded-xl p-4 text-center border border-divider">
            <div className={`text-2xl font-bold ${planInfo.color}`}>24/7</div>
            <div className="text-xs text-text-muted">Support</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/matches"
            className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Browse Matches
          </Link>
          <Link
            href="/history"
            className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View History
          </Link>
        </div>

        {/* Email Notice */}
        <p className="text-center text-sm text-text-muted mt-8">
          📧 A confirmation email has been sent to your inbox with your receipt and subscription details.
        </p>

        {/* Support Link */}
        <p className="text-center text-sm text-text-muted mt-4">
          Questions? <Link href="/contact" className="text-accent hover:underline">Contact our support team</Link>
        </p>
      </div>
    </div>
  );
}

// Wrapper to handle searchParams
function SuccessPageContent({ searchParams }: { searchParams: { plan?: string } }) {
  const plan = searchParams.plan || 'Pro';
  return <SuccessContent plan={plan} />;
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessPageContent searchParams={searchParams} />
    </Suspense>
  );
}
