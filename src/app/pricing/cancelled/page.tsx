/**
 * Payment Cancelled Page
 * 
 * Shown when user cancels Stripe checkout
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Checkout Cancelled | SportBot AI',
  description: 'Your checkout was cancelled. No charges were made.',
};

export default function CancelledPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/20 border border-warning/30 mb-6">
          <svg className="w-10 h-10 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Checkout Cancelled
        </h1>
        
        <p className="text-text-secondary mb-8">
          No worries! Your checkout was cancelled and no charges were made. 
          You can continue using the free plan or upgrade anytime.
        </p>

        {/* Benefits reminder */}
        <div className="bg-bg-card rounded-xl border border-divider p-6 mb-8 text-left">
          <h3 className="text-sm font-medium text-text-muted mb-3">What you&apos;re missing with Pro:</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-center gap-2">
              <span className="text-accent">✓</span> 30 analyses per day (vs 1 trial)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent">✓</span> All sports coverage
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent">✓</span> Advanced value detection
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent">✓</span> Priority support
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing#pro"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            View Plans Again
          </Link>
          <Link
            href="/matches"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            Continue Free
          </Link>
        </div>

        {/* Help text */}
        <p className="text-sm text-text-muted mt-8">
          Having issues? <Link href="/contact" className="text-accent hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
