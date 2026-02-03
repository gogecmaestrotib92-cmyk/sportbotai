/**
 * Badge Page - Get "Featured on SportBot AI" badge embed code
 * 
 * Tools reviewed on our site can embed this badge to show they're featured.
 * Provides dofollow backlink when they add the badge.
 */

import { Metadata } from 'next';
import BadgeGenerator from './BadgeGenerator';

export const metadata: Metadata = {
  title: 'Featured on SportBot AI Badge | Embed Code',
  description: 'Get the "Featured on SportBot AI" badge for your website. Show visitors your tool has been reviewed by our AI sports analytics experts.',
  robots: 'noindex, nofollow', // Don't index this utility page
};

export default function BadgePage() {
  return (
    <main className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-2xl mb-4 border border-accent/30">
            <svg className="w-8 h-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">
            Featured on SportBot AI
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            Your tool has been reviewed on SportBot AI! Add our badge to your website to show visitors you&apos;re featured.
          </p>
        </div>

        {/* Badge Generator Component */}
        <BadgeGenerator />

        {/* Benefits */}
        <div className="mt-10 card-glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Why add the badge?</h2>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong className="text-white">Social Proof</strong> — Show visitors your tool is recognized by AI sports analytics experts</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong className="text-white">Dofollow Backlink</strong> — We&apos;ll upgrade your review link to dofollow when you add the badge</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong className="text-white">Trust Signal</strong> — Independent reviews build credibility with your audience</span>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Questions? Email us at{' '}
          <a href="mailto:contact@sportbotai.com" className="text-accent hover:underline">
            contact@sportbotai.com
          </a>
        </div>
      </div>
    </main>
  );
}
