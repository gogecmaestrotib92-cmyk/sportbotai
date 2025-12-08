/**
 * Header component for BetSense AI
 * 
 * Modern navigation with sports analytics branding.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-bg/95 backdrop-blur-md border-b border-divider sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-accent rounded-btn flex items-center justify-center">
              <svg className="w-5 h-5 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">
              BetSense<span className="text-accent">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm"
            >
              Home
            </Link>
            <Link 
              href="/pricing" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm"
            >
              Pricing
            </Link>
            <Link 
              href="/responsible-gambling" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm"
            >
              Responsible Gaming
            </Link>
            <Link 
              href="/analyzer" 
              className="bg-accent text-bg px-5 py-2 rounded-btn font-semibold text-sm hover:bg-accent-dark transition-all duration-200 shadow-md hover:shadow-glow-accent"
            >
              Start Analyzing
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-divider">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-3 py-2 rounded-btn transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/pricing"
                className="text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-3 py-2 rounded-btn transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/responsible-gambling"
                className="text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-3 py-2 rounded-btn transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Responsible Gaming
              </Link>
              <Link
                href="/analyzer"
                className="bg-accent text-bg px-5 py-2.5 rounded-btn font-semibold text-center mt-2 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Start Analyzing
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
