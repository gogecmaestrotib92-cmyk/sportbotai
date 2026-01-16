/**
 * Footer component for SportBot AI
 * 
 * Clean modern footer with single global disclaimer.
 */

import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG } from '@/lib/seo';

// Hardcoded to avoid hydration mismatch - update yearly
const CURRENT_YEAR = 2025;

export default function Footer() {
  const currentYear = CURRENT_YEAR;

  return (
    <footer className="bg-bg text-text-secondary">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/favicon.svg"
                alt="SportBot AI"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-text-primary">
                Sport<span className="text-accent">Bot</span>
                <span className="ml-1.5 text-xs font-semibold bg-accent text-bg px-1.5 py-0.5 rounded">AI</span>
              </span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-md">
              AI-powered sports analytics for educational purposes.
              Understand probabilities, value, and risk—not betting tips.
            </p>
            <div className="mt-4">
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="text-text-muted hover:text-accent transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {SITE_CONFIG.email}
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/matches" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  Matches
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/tools" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  Betting Tools
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  Featured Tools
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Sports */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4 text-sm uppercase tracking-wider">Sports</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/nba" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  NBA Odds
                </Link>
              </li>
              <li>
                <Link href="/nfl" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  NFL Lines
                </Link>
              </li>
              <li>
                <Link href="/nhl" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  NHL Odds
                </Link>
              </li>
              <li>
                <Link href="/soccer" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  Soccer Odds
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/terms" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/responsible-gambling" className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
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
              SportBot AI provides analytical insights for educational purposes only.
              We do not offer betting tips, guarantees, or financial advice.
              All betting carries risk. Gamble responsibly. <strong className="text-text-secondary">18+ only.</strong>
            </p>
          </div>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-text-muted text-xs">
              © {currentYear} SportBot AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {/* Product Hunt Badge */}
              <a
                href="https://www.producthunt.com/products/sportbot-ai?utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-sportbot-ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1063032&theme=dark"
                  alt="SportBot AI on Product Hunt"
                  width="150"
                  height="33"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
              {/* Techbase Directory Badge */}
              <a
                href="https://techbasedirectory.com/product/sportbot-ai?utm_source=featured_embed"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://techbasedirectory.com/api/featured-embed"
                  alt="SportBot AI on Techbase Directory"
                  width="150"
                  height="33"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
              {/* NextGen Tools Badge */}
              <a
                href="https://nxgntools.com/tools/sportbot-ai"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg opacity-80 hover:opacity-100 hover:border-accent/30 transition-all"
              >
                <span className="text-accent font-bold text-sm">🚀</span>
                <span className="text-text-secondary text-xs font-medium">NextGen Tools</span>
              </a>
              <span className="text-divider hidden sm:inline">|</span>
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
