/**
 * Pricing Teaser section for landing page
 * 
 * Compact pricing preview with toggles - matches PricingCards exactly.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

// Types for pricing plans
interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  yearlyDescription: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}

// Plans definition - matches PricingCards exactly
const plans: PricingPlan[] = [
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: '$19.99',
    yearlyPrice: '$149',
    description: 'For serious analysts',
    yearlyDescription: 'Save $90/year',
    features: [
      '10 analyses per day',
      '50 AI chat messages per day',
      'All sports',
      'Advanced AI analysis',
      'Pre-match insights & streaks',
      'Priority support',
      'Analysis history (30 days)',
      'My Teams favorites',
    ],
    highlighted: true,
    buttonText: 'Upgrade to Pro',
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: '$49.99',
    yearlyPrice: '$290',
    description: 'Unlimited everything + Alerts',
    yearlyDescription: 'Save $310/year (52% off)',
    features: [
      'Unlimited analyses',
      'Unlimited AI chat messages',
      'All sports',
      'Market Alerts (value edge detection)',
      'Advanced statistics & trends',
      'Unlimited analysis history',
      'My Teams favorites',
      'Priority support 24/7',
    ],
    buttonText: 'Go Premium',
  },
];

export default function PricingTeaser() {
  // Single billing period toggle - yearly is default (true = yearly)
  const [isYearlyBilling, setIsYearlyBilling] = useState(true);

  // Get the toggle state
  const isYearly = () => isYearlyBilling;

  // Toggle handler
  const toggleBilling = () => setIsYearlyBilling(!isYearlyBilling);

  return (
    <section className="bg-bg-primary section-container">
      <div className="text-center mb-8">
        <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Pricing</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Start free, upgrade when you need more. No hidden fees.
        </p>
      </div>

      {/* Single Billing Toggle at Top */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={`text-sm font-medium transition-colors ${!isYearlyBilling ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
        <button
          onClick={toggleBilling}
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
        <span className={`text-sm font-medium transition-colors ${isYearlyBilling ? 'text-white' : 'text-gray-500'}`}>
          Yearly
          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Save up to 52%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
        {/* Free Plan Card */}
        <div className="rounded-card p-5 sm:p-6 bg-bg-card border border-divider">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2 text-white">Free</h3>
            <div className="mb-2">
              <span className="text-4xl font-bold text-white">$0</span>
            </div>
            <p className="text-sm text-gray-400">Try it once for free</p>
          </div>

          <ul className="space-y-3 mb-8">
            {['1 match analysis', '1 AI chat message', 'Basic sports (soccer)', 'Standard AI analysis', 'Email support'].map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/analyzer"
            className="block w-full py-3 px-6 rounded-btn font-semibold transition-all duration-200 bg-bg-elevated text-white hover:bg-bg-elevated/80 border border-divider min-h-[48px] text-center"
          >
            Start Free
          </Link>
        </div>

        {/* Pro and Premium Cards */}
        {plans.map((plan) => {
          const isPremium = plan.id === 'premium';
          const yearly = isYearly();
          
          return (
            <div
              key={plan.id}
              className={`rounded-card p-5 sm:p-6 relative ${
                plan.highlighted
                  ? 'bg-bg-card border-2 border-primary shadow-glow-primary md:scale-105'
                  : isPremium
                  ? 'bg-gradient-to-b from-slate-800/50 to-slate-900/50 border-2 border-slate-400/30 shadow-[0_0_20px_rgba(148,163,184,0.15)]'
                  : 'bg-bg-card border border-divider'
              }`}
            >
              {/* Badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  MOST POPULAR
                </div>
              )}
              {isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  BEST VALUE
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-4 pt-2">
                <h3 className={`text-xl font-bold mb-3 ${isPremium ? 'text-slate-200' : 'text-white'}`}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-2">
                  <span className={`text-4xl font-bold ${
                    plan.highlighted ? 'text-primary' : isPremium ? 'text-slate-200' : 'text-white'
                  }`}>
                    {yearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className={`text-sm ${isPremium ? 'text-slate-400' : 'text-gray-400'}`}>
                    {yearly ? '/year' : '/month'}
                  </span>
                </div>
                <p className={`text-sm ${isPremium ? 'text-slate-400' : 'text-gray-400'}`}>
                  {yearly ? plan.yearlyDescription : plan.description}
                </p>
              </div>

              {/* Features list */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? 'text-primary' : isPremium ? 'text-slate-300' : 'text-accent'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={`text-sm ${isPremium ? 'text-slate-300' : 'text-gray-300'}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button - links to pricing page */}
              <Link
                href="/pricing"
                className={`block w-full py-3 px-6 rounded-btn font-semibold transition-all duration-200 min-h-[48px] text-center ${
                  plan.highlighted
                    ? 'bg-primary text-white hover:bg-primary/80'
                    : isPremium
                    ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 hover:from-slate-200 hover:to-slate-300'
                    : 'bg-bg-elevated text-white hover:bg-bg-elevated/80 border border-divider'
                }`}
              >
                {plan.buttonText}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-primary font-medium hover:text-accent transition-colors">
          View full pricing details
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
