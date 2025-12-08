/**
 * Footer component for BetSense AI
 * 
 * Clean modern footer with single global disclaimer.
 */

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg text-text-secondary">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-btn flex items-center justify-center">
                <svg className="w-5 h-5 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-text-primary">
                BetSense<span className="text-accent">AI</span>
              </span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-md">
              AI-powered sports analytics for educational purposes. 
              Understand probabilities, value, and risk—not betting tips.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-text-muted hover:text-accent transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/analyzer" className="text-text-muted hover:text-accent transition-colors text-sm">
                  Analyzer
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-text-muted hover:text-accent transition-colors text-sm">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-text-muted hover:text-accent transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-text-muted hover:text-accent transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/responsible-gambling" className="text-text-muted hover:text-accent transition-colors text-sm">
                  Responsible Gambling
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-divider mt-10 pt-8">
          {/* Global Disclaimer - Single, subtle version */}
          <div className="flex items-start gap-3 p-4 bg-bg-hover rounded-card border border-divider mb-6">
            <svg className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-text-muted text-xs leading-relaxed">
              BetSense AI provides analytical insights for educational purposes only. 
              We do not offer betting tips, guarantees, or financial advice. 
              All betting carries risk. Gamble responsibly. <strong className="text-text-secondary">18+ only.</strong>
            </p>
          </div>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-text-muted text-xs">
              © {currentYear} BetSense AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.begambleaware.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-secondary text-xs transition-colors"
              >
                BeGambleAware.org
              </a>
              <span className="text-divider">|</span>
              <span className="text-text-muted text-xs">18+</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
