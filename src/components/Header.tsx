/**
 * Header component for SportBot AI
 * 
 * Modern navigation with sports analytics branding.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { UserMenu } from './auth';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-bg/95 backdrop-blur-md border-b border-divider sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image 
              src="/favicon.svg" 
              alt="SportBot AI" 
              width={36} 
              height={36}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">
              Sport<span className="text-accent">Bot</span>
              <span className="ml-1.5 text-xs font-semibold bg-accent text-bg px-1.5 py-0.5 rounded">AI</span>
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
              href="/history" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm"
            >
              History
            </Link>
            <Link 
              href="/pricing" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm"
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm"
            >
              Blog
            </Link>
            <Link 
              href="/responsible-gambling" 
              className="text-text-secondary hover:text-text-primary font-medium transition-colors text-sm"
            >
              Responsible Gaming
            </Link>
            <UserMenu />
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
                href="/history"
                className="text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-3 py-2 rounded-btn transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                History
              </Link>
              <Link
                href="/pricing"
                className="text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-3 py-2 rounded-btn transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                className="text-text-secondary hover:text-text-primary hover:bg-bg-hover font-medium px-3 py-2 rounded-btn transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
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
