/**
 * Pricing Cards component
 * 
 * Displays three pricing plans: FREE, PRO, PREMIUM
 * With Stripe checkout integration (skeleton).
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Types for pricing plans
interface PricingPlan {
  id: string;
  name: string;
  price: string;
  priceId: string; // Stripe Price ID - CHANGE THIS after creating products in Stripe
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}

// Plans definition - priceId will be resolved server-side
const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    priceId: '', // Free plan has no Stripe checkout
    description: 'Try it once for free',
    features: [
      '1 match analysis',
      '1 AI chat message',
      'Basic sports (soccer)',
      'Standard AI analysis',
      'Email support',
    ],
    buttonText: 'Start Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€9.99',
    priceId: 'pro', // Will be resolved to actual Price ID server-side
    description: 'For serious analysts',
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
    price: '€79/year',
    priceId: 'premium', // Will be resolved to actual Price ID server-side
    description: 'Best deal - 6 weeks free',
    features: [
      'Unlimited analyses',
      'Unlimited AI chat',
      'All sports + eSports',
      'Premium AI model',
      'Advanced pattern detection',
      'API access',
      'Priority support 24/7',
      'Analysis history (unlimited)',
    ],
    buttonText: 'Get Annual Plan',
  },
];

export default function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  // Function for Stripe checkout
  const handleCheckout = async (plan: PricingPlan) => {
    // Free plan - go to register or analyzer
    if (plan.id === 'free') {
      if (session) {
        router.push('/analyzer');
      } else {
        router.push('/register');
      }
      return;
    }

    // Must be logged in for paid plans
    if (!session) {
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    setLoading(plan.id);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          planName: plan.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creating checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative">
      {/* Horizontal scroll container on mobile */}
      <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {plans.map((plan) => (
          <div
            key={plan.id}
            id={plan.id}
            className={`flex-shrink-0 w-[85vw] xs:w-[75vw] sm:w-[320px] md:w-auto snap-center bg-bg-card rounded-card p-5 sm:p-6 relative ${
              plan.highlighted
                ? 'border-2 border-primary shadow-glow-primary md:scale-105'
                : 'border border-divider'
            }`}
          >
            {/* Popular badge */}
            {plan.highlighted && (
              <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 rounded-full whitespace-nowrap">
                MOST POPULAR
              </div>
            )}

            {/* Plan header */}
            <div className="text-center mb-5 sm:mb-6 pt-2 sm:pt-0">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className={`text-3xl sm:text-4xl font-bold ${plan.highlighted ? 'text-primary' : 'text-white'}`}>
                  {plan.price}
                </span>
                <span className="text-gray-400 text-sm">/monthly</span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">{plan.description}</p>
            </div>

            {/* Features list */}
            <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2.5 sm:gap-3">
                  <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-primary' : 'text-accent'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-300 text-xs sm:text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button - Larger touch target */}
            <button
              onClick={() => handleCheckout(plan)}
              disabled={loading === plan.id}
              className={`w-full py-3.5 sm:py-3 px-6 rounded-btn font-semibold transition-all duration-200 touch-manipulation active:scale-[0.98] min-h-[48px] ${
                plan.highlighted
                  ? 'bg-primary text-white hover:bg-primary/80'
                  : 'bg-bg-elevated text-white hover:bg-bg-elevated/80 border border-divider'
              } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
            {loading === plan.id ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              plan.buttonText
            )}
          </button>
        </div>
      ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="col-span-full bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-center mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
