/**
 * Pricing Teaser section - Internationalized
 * 
 * Compact pricing preview with toggles
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TranslationsType } from '@/lib/i18n';

interface PricingTeaserI18nProps {
  t: TranslationsType;
  locale: 'en' | 'sr';
}

export default function PricingTeaserI18n({ t, locale }: PricingTeaserI18nProps) {
  // Single billing period toggle - yearly is default (true = yearly)
  const [isYearlyBilling, setIsYearlyBilling] = useState(true);

  const pricingHref = locale === 'sr' ? '/sr/pricing' : '/pricing';
  const analyzerHref = locale === 'sr' ? '/sr/analyzer' : '/analyzer';

  return (
    <section className="bg-bg-primary section-container">
      <div className="text-center mb-8">
        <p className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-3">{t.pricing.label}</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {t.pricing.title}
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          {t.pricing.subtitle}
        </p>
      </div>

      {/* Single Billing Toggle at Top */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={`text-sm font-medium transition-colors ${!isYearlyBilling ? 'text-white' : 'text-gray-400'}`}>{t.pricing.monthly}</span>
        <button
          onClick={() => setIsYearlyBilling(!isYearlyBilling)}
          role="switch"
          aria-checked={isYearlyBilling}
          aria-label="Toggle between monthly and yearly billing"
          className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
            isYearlyBilling ? 'bg-primary' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
              isYearlyBilling ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${isYearlyBilling ? 'text-white' : 'text-gray-400'}`}>
          {t.pricing.yearly}
          <span className="ml-2 text-xs bg-primary/30 text-white px-2 py-0.5 rounded-full">{t.pricing.saveUpTo}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
        {/* Free Plan Card */}
        <div className="card-glass p-5 sm:p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2 text-white">{t.pricing.free}</h3>
            <div className="mb-2">
              <span className="text-4xl font-bold text-white">$0</span>
            </div>
            <p className="text-sm text-gray-400">{locale === 'sr' ? 'Probaj jednom besplatno' : 'Try it once for free'}</p>
          </div>

          <ul className="space-y-3 mb-8">
            {t.pricing.freeFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href={analyzerHref}
            className="block w-full py-3 px-6 rounded-btn font-semibold transition-all duration-200 bg-bg-elevated text-white hover:bg-bg-elevated/80 border border-divider min-h-[48px] text-center"
          >
            {t.pricing.getStarted}
          </Link>
        </div>

        {/* Pro Plan Card */}
        <div className="card-glass p-5 sm:p-6 relative border-2 border-primary/50 md:scale-105">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
            {locale === 'sr' ? 'NAJPOPULARNIJE' : 'MOST POPULAR'}
          </div>

          <div className="text-center mb-4 pt-2">
            <h3 className="text-xl font-bold mb-3 text-white">{t.pricing.pro.name}</h3>
            <div className="mb-2">
              <span className="text-4xl font-extrabold text-white">
                {isYearlyBilling ? '$149' : '$19.99'}
              </span>
              <span className="text-sm text-gray-400">
                {isYearlyBilling ? (locale === 'sr' ? '/godišnje' : '/year') : t.pricing.perMonth}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {isYearlyBilling ? t.pricing.pro.yearlyDescription : t.pricing.pro.description}
            </p>
          </div>

          <ul className="space-y-3 mb-8">
            {t.pricing.pro.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href={pricingHref}
            className="block w-full py-3 px-6 rounded-btn font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary/80 min-h-[48px] text-center"
          >
            {t.pricing.pro.buttonText}
          </Link>
        </div>

        {/* Premium Plan Card */}
        <div className="card-glass p-5 sm:p-6 relative border-2 border-white/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-accent-dark text-bg text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-glow-accent">
            {locale === 'sr' ? 'NAJBOLJA VREDNOST' : 'BEST VALUE'}
          </div>

          <div className="text-center mb-4 pt-2">
            <h3 className="text-xl font-bold mb-3 text-white">{t.pricing.premium.name}</h3>
            <div className="mb-2">
              <span className="text-4xl font-extrabold text-white">
                {isYearlyBilling ? '$290' : '$49.99'}
              </span>
              <span className="text-sm text-gray-400">
                {isYearlyBilling ? (locale === 'sr' ? '/godišnje' : '/year') : t.pricing.perMonth}
              </span>
            </div>
            <p className="text-sm text-text-muted">
              {isYearlyBilling ? t.pricing.premium.yearlyDescription : t.pricing.premium.description}
            </p>
          </div>

          <ul className="space-y-3 mb-8">
            {t.pricing.premium.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href={pricingHref}
            className="block w-full py-3 px-6 rounded-btn font-semibold transition-all duration-200 bg-slate-600/50 hover:bg-slate-600/70 text-white border border-slate-500/30 min-h-[48px] text-center"
          >
            {t.pricing.premium.buttonText}
          </Link>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link href={pricingHref} className="inline-flex items-center gap-2 text-violet-light font-semibold hover:text-accent transition-colors group">
          {t.pricing.viewAll}
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
