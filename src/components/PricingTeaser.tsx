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
  dailyPriceMonthly: string;
  dailyPriceYearly: string;
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
    dailyPriceMonthly: '$0.66',
    dailyPriceYearly: '$0.40',
    description: 'Analysis + Edge Detection',
    yearlyDescription: 'Save $90/year',
    features: [
      '10 matches analyzed daily — cover your whole weekend slate',
      '50 AI questions/day — ask anything about any match',
      'Soccer, NBA, NFL & NHL covered',
      'Advanced edge detection — see what the market misses',
      'Form streaks & injury alerts before kickoff',
      'Priority support — real humans, fast replies',
      '30-day analysis history — track your research',
      'My Teams — one click to your favorite clubs',
    ],
    highlighted: true,
    buttonText: 'Start Finding Edges',
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: '$49.99',
    yearlyPrice: '$290',
    dailyPriceMonthly: '$1.66',
    dailyPriceYearly: '$0.79',
    description: 'Unlimited Analysis + Edge Alerts',
    yearlyDescription: 'Save $310/year (52% off)',
    features: [
      'Unlimited analyses — no daily cap, ever',
      'Unlimited AI chat — deep-dive any match or player',
      'Soccer, NBA, NFL & NHL covered',
      'Edge Alerts — get notified when value appears',
      'Advanced stats & trend tracking',
      'Full analysis history — your complete research log',
      'My Teams — instant updates on clubs you follow',
      '24/7 priority support',
    ],
    buttonText: 'Go Premium',
  },
];

export default function PricingTeaser() {
  // Single billing period toggle - yearly is default (true = yearly)
  const [isYearlyBilling, setIsYearlyBilling] = useState(false);

  // Get the toggle state
  const isYearly = () => isYearlyBilling;

  // Toggle handler
  const toggleBilling = () => setIsYearlyBilling(!isYearlyBilling);

  return (
    <section className="section-container relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="text-center mb-8 relative">
        <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Pricing</p>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-wide uppercase">
          Smarter analysis <span className="text-gradient-accent">for less than a coffee</span>
        </h2>
        <p className="text-lg text-gray-300 font-medium max-w-2xl mx-auto">
          One bad decision costs more than a year of Pro. Start free, upgrade when you see the edge.
        </p>
      </div>

      {/* Single Billing Toggle at Top */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={`text-sm font-medium transition-colors ${!isYearlyBilling ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
        <button
          onClick={toggleBilling}
          role="switch"
          aria-checked={isYearlyBilling}
          aria-label="Toggle between monthly and yearly billing"
          className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
            isYearlyBilling ? 'bg-accent' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
              isYearlyBilling ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${isYearlyBilling ? 'text-white' : 'text-gray-400'}`}>
          Yearly
          <span className="ml-2 text-xs bg-accent/30 text-white px-2 py-0.5 rounded-full">Save up to 52%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto relative">
        {/* Free Plan Card */}
        <div className="card-glass p-5 sm:p-6 border border-accent/20">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2 text-white">Free</h3>
            <div className="mb-2">
              <span className="text-4xl font-extrabold text-white">$0</span>
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
            className="btn-gradient-border block w-full py-3 px-6 text-center font-semibold min-h-[48px]"
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
              className={`card-glass p-5 sm:p-6 relative ${
                plan.highlighted
                  ? 'border-2 border-accent/50 md:scale-105'
                  : 'border-2 border-accent/30'
              }`}
            >
              {/* Badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  MOST POPULAR
                </div>
              )}
              {isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  BEST VALUE
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-4 pt-2">
                <h3 className="text-xl font-bold mb-3 text-white">
                  {plan.name}
                </h3>

                {/* Price - Per Day Dominant */}
                <div className="mb-2 flex flex-col items-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      {yearly ? plan.dailyPriceYearly : plan.dailyPriceMonthly}
                    </span>
                    <span className="text-lg text-gray-400 font-medium">/day</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {yearly ? plan.yearlyPrice : plan.monthlyPrice} {yearly ? '/year' : '/month'}
                  </div>
                </div>
                <p className={`text-sm font-semibold ${yearly ? 'text-gray-400' : 'text-gradient-gold'}`}>
                  {yearly ? plan.yearlyDescription : plan.description}
                </p>
              </div>

              {/* Features list */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5 text-accent"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button - links to pricing page */}
              <Link
                href="/pricing#pro"
                className={`block w-full py-3 px-6 rounded-btn font-semibold transition-all duration-200 min-h-[48px] text-center ${
                  plan.highlighted
                    ? 'bg-accent-dark hover:bg-accent text-white'
                    : 'bg-accent-dark hover:bg-accent/90 text-white'
                }`}
              >
                {plan.buttonText}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <Link href="/pricing#pro" className="inline-flex items-center gap-2 text-accent font-semibold hover:text-accent-dark transition-colors group">
          View full pricing details
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
