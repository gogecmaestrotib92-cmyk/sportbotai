/**
 * Responsible Gambling Page (/responsible-gambling)
 * 
 * Important page promoting responsible gambling.
 * This page is an ethical and regulatory requirement.
 */

import { Metadata } from 'next';
import { META } from '@/lib/seo';

export const metadata: Metadata = {
  title: META.responsibleGambling.title,
  description: META.responsibleGambling.description,
  openGraph: {
    title: META.responsibleGambling.title,
    description: META.responsibleGambling.description,
    url: '/responsible-gambling',
    type: 'website',
  },
  alternates: {
    canonical: '/responsible-gambling',
    languages: {
      'en': '/responsible-gambling',
      'sr': '/sr/responsible-gambling',
      'x-default': '/responsible-gambling',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ResponsibleGamblingPage() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <section className="bg-warning/20 border-b border-warning/30 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-warning" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Responsible Gambling</h1>
          <p className="text-xl text-text-secondary">
            Betting should be fun, not a problem. Here&apos;s how to gamble responsibly.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Our Commitment</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              SportBot AI is committed to promoting responsible gambling. Our tool is designed 
              to help you make informed decisions, but <strong className="text-white">you should never bet more than 
              you can afford to lose</strong>.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Sports betting carries inherent risk. Even the best analysis cannot guarantee 
              a win. Always gamble responsibly and recognize the signs of problem gambling.
            </p>
          </div>

          {/* Tips */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Tips for Responsible Gambling</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Set a Budget</h3>
                  <p className="text-text-secondary text-sm">Set a monthly limit for betting and stick to it strictly.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Limit Your Time</h3>
                  <p className="text-text-secondary text-sm">Don&apos;t spend too much time betting. Set a timer.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Don&apos;t Chase Losses</h3>
                  <p className="text-text-secondary text-sm">If you lose, don&apos;t try to recover with bigger bets.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Bet Sober</h3>
                  <p className="text-text-secondary text-sm">Never bet under the influence of alcohol or emotions.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Recognize the Signs</h3>
                  <p className="text-text-secondary text-sm">Be aware of addiction signs and react in time.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Entertainment, Not Income</h3>
                  <p className="text-text-secondary text-sm">Betting is not a way to make money. Treat it as entertainment.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning signs */}
          <div className="card mb-8 border-l-4 border-danger">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-danger" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Signs of Problem Gambling
            </h2>
            <p className="text-text-secondary mb-4">
              If you recognize any of these signs, it may be time to seek help:
            </p>
            <ul className="space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Betting money meant for bills or basic needs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Lying to family or friends about your betting
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Feeling the need to bet increasingly larger amounts
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Becoming anxious or depressed when you can&apos;t bet
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Neglecting work, school, or family because of betting
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Borrowing money or selling things to bet
              </li>
            </ul>
          </div>

          {/* Help resources */}
          <div className="card mb-8 bg-primary/10 border-primary/30">
            <h2 className="text-xl font-bold text-white mb-4">Help Resources</h2>
            <p className="text-text-secondary mb-6">
              If you or someone you know has a gambling problem, seek help:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="https://www.gamblersanonymous.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-bg-hover p-4 rounded-lg border border-divider hover:border-primary/50 transition-colors"
              >
                <h3 className="font-semibold text-primary">Gamblers Anonymous</h3>
                <p className="text-text-secondary text-sm">International support organization</p>
              </a>
              <a 
                href="https://www.begambleaware.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-bg-hover p-4 rounded-lg border border-divider hover:border-primary/50 transition-colors"
              >
                <h3 className="font-semibold text-primary">BeGambleAware</h3>
                <p className="text-text-secondary text-sm">Information and support</p>
              </a>
              <a 
                href="https://www.gamcare.org.uk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-bg-hover p-4 rounded-lg border border-divider hover:border-primary/50 transition-colors"
              >
                <h3 className="font-semibold text-primary">GamCare</h3>
                <p className="text-text-secondary text-sm">Free support and counseling</p>
              </a>
              <a 
                href="https://www.ncpgambling.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-bg-hover p-4 rounded-lg border border-divider hover:border-primary/50 transition-colors"
              >
                <h3 className="font-semibold text-primary">NCPG</h3>
                <p className="text-text-secondary text-sm">National Council on Problem Gambling</p>
              </a>
            </div>
          </div>

          {/* Self-exclusion */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">Self-Exclusion</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              If you feel like you&apos;re losing control, most bookmakers offer self-exclusion options:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
              <li>Daily/weekly/monthly deposit limits</li>
              <li>Loss limits</li>
              <li>Temporary account freeze (cooling-off period)</li>
              <li>Permanent self-exclusion</li>
            </ul>
            <p className="text-text-secondary leading-relaxed">
              Contact your bookmaker for more information about these options.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
