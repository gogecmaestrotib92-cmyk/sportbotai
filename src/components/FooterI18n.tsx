/**
 * Footer component for SportBot AI - i18n version
 * 
 * Clean modern footer with single global disclaimer.
 * Supports English and Serbian locales.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/seo';
import { Locale } from '@/lib/i18n';

// Hardcoded to avoid hydration mismatch - update yearly
const CURRENT_YEAR = 2025;

const translations = {
  en: {
    tagline: 'AI-powered sports analytics for educational purposes. Understand probabilities, value, and risk—not betting tips.',
    product: 'Product',
    home: 'Home',
    matches: 'Matches',
    pricing: 'Pricing',
    contact: 'Contact',
    legal: 'Legal',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    responsibleGambling: 'Responsible Gambling',
    disclaimer: 'SportBot AI provides analytical insights for educational purposes only. We do not offer betting tips, guarantees, or financial advice. All betting carries risk. Gamble responsibly.',
    adultsOnly: '18+ only.',
    copyright: '© {year} SportBot AI. All rights reserved.',
  },
  sr: {
    tagline: 'Sportska analitika pokretana AI-jem u edukativne svrhe. Razumi verovatnoće, vrednost i rizik—ne savete za klađenje.',
    product: 'Proizvod',
    home: 'Početna',
    matches: 'Mečevi',
    pricing: 'Cene',
    contact: 'Kontakt',
    legal: 'Pravno',
    terms: 'Uslovi korišćenja',
    privacy: 'Politika privatnosti',
    responsibleGambling: 'Odgovorno klađenje',
    disclaimer: 'SportBot AI pruža analitičke uvide samo u edukativne svrhe. Ne nudimo savete za klađenje, garancije niti finansijske savete. Svako klađenje nosi rizik. Kladite se odgovorno.',
    adultsOnly: 'Samo 18+.',
    copyright: '© {year} SportBot AI. Sva prava zadržana.',
  },
};

interface FooterI18nProps {
  locale?: Locale;
}

export default function FooterI18n({ locale: localeProp }: FooterI18nProps) {
  const pathname = usePathname();
  const currentYear = CURRENT_YEAR;
  
  // Auto-detect locale from pathname if not provided
  const locale: Locale = localeProp || (pathname?.startsWith('/sr') ? 'sr' : 'en');
  const t = translations[locale];
  const localePath = locale === 'sr' ? '/sr' : '';

  return (
    <footer className="bg-bg text-text-secondary">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link href={`${localePath}/`} className="flex items-center gap-2.5 mb-4">
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
              {t.tagline}
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
            <h3 className="text-text-primary font-semibold mb-4 text-sm uppercase tracking-wider">{t.product}</h3>
            <ul className="space-y-1">
              <li>
                <Link href={`${localePath}/`} className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  {t.home}
                </Link>
              </li>
              <li>
                <Link href={`${localePath}/matches`} className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  {t.matches}
                </Link>
              </li>
              <li>
                <Link href={`${localePath}/pricing`} className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  {t.pricing}
                </Link>
              </li>
              <li>
                <Link href={`${localePath}/contact`} className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  {t.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4 text-sm uppercase tracking-wider">{t.legal}</h3>
            <ul className="space-y-1">
              <li>
                <Link href={`${localePath}/terms`} className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  {t.terms}
                </Link>
              </li>
              <li>
                <Link href={`${localePath}/privacy`} className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  {t.privacy}
                </Link>
              </li>
              <li>
                <Link href={`${localePath}/responsible-gambling`} className="text-text-muted hover:text-accent transition-colors text-sm py-2 inline-block touch-manipulation">
                  {t.responsibleGambling}
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
              {t.disclaimer} <strong className="text-text-secondary">{t.adultsOnly}</strong>
            </p>
          </div>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-text-muted text-xs">
              {t.copyright.replace('{year}', String(currentYear))}
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
