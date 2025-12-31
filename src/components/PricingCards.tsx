/**
 * Pricing Cards component
 * 
 * Displays three pricing plans: FREE, PRO (with toggle), PREMIUM (with toggle)
 * With Stripe checkout integration.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Types for pricing plans
interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  description: string;
  yearlyDescription: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}

// Plans definition
const plans: PricingPlan[] = [
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: '$19.99',
    yearlyPrice: '$149',
    monthlyPriceId: 'pro',
    yearlyPriceId: 'pro-yearly',
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
    monthlyPriceId: 'premium',
    yearlyPriceId: 'premium-yearly',
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

// Plan hierarchy for comparison
const PLAN_RANK: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2,
};

export default function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Single billing period toggle - yearly is default (true = yearly)
  const [isYearlyBilling, setIsYearlyBilling] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const { data: session } = useSession();
  const router = useRouter();

  // Fetch user's current plan
  useEffect(() => {
    const fetchPlan = async () => {
      if (!session) {
        setCurrentPlan('FREE');
        return;
      }
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan(data.plan || 'FREE');
        }
      } catch (error) {
        console.error('Failed to fetch plan:', error);
      }
    };
    fetchPlan();
  }, [session]);

  // Get the toggle state for any plan
  const isYearly = () => isYearlyBilling;

  // Toggle handler
  const toggleBilling = () => setIsYearlyBilling(!isYearlyBilling);

  // Function for Stripe checkout
  const handleCheckout = async (plan: PricingPlan) => {
    // Must be logged in for paid plans
    if (!session) {
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    const yearly = isYearly();
    const priceId = yearly ? plan.yearlyPriceId : plan.monthlyPriceId;
    const checkoutId = `${plan.id}-${yearly ? 'yearly' : 'monthly'}`;

    setLoading(checkoutId);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          planName: `${plan.name} ${yearly ? 'Yearly' : 'Monthly'}`,
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

  // Handle free plan
  const handleFreePlan = () => {
    if (session) {
      router.push('/analyzer');
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="relative">
      {/* Single Billing Toggle at Top */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={`text-sm font-medium transition-colors ${!isYearlyBilling ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
        <button
          onClick={toggleBilling}
          role="switch"
          aria-checked={isYearlyBilling}
          aria-label="Toggle between monthly and yearly billing"
          className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
            isYearlyBilling ? 'bg-violet' : 'bg-gray-600'
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
          <span className="ml-2 text-xs bg-violet/30 text-white px-2 py-0.5 rounded-full">Save up to 52%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
        {/* Free Plan Card */}
        <div className={`card-glass p-5 sm:p-6 ${
          currentPlan === 'FREE' ? 'border-2 border-accent shadow-glow-accent' : ''
        } relative`}>
          {currentPlan === 'FREE' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-accent-dark text-bg text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-glow-accent">
              YOUR PLAN
            </div>
          )}
          <div className="text-center mb-6 pt-2">
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

          <button
            onClick={handleFreePlan}
            disabled={currentPlan === 'FREE'}
            className={`w-full py-3 px-6 rounded-btn font-semibold transition-all duration-200 min-h-[48px] ${
              currentPlan === 'FREE'
                ? 'bg-accent/20 text-accent border border-accent/30 cursor-default'
                : 'btn-gradient-border'
            }`}
          >
            {currentPlan === 'FREE' ? '✓ Current Plan' : 'Start Free'}
          </button>
        </div>

        {/* Pro and Premium Cards */}
        {plans.map((plan) => {
          const isPremium = plan.id === 'premium';
          const yearly = isYearly();
          const checkoutId = `${plan.id}-${yearly ? 'yearly' : 'monthly'}`;
          const planKey = plan.id.toUpperCase(); // 'PRO' or 'PREMIUM'
          const currentPlanRank = PLAN_RANK[currentPlan] || 0;
          const thisPlanRank = PLAN_RANK[planKey] || 0;
          const isCurrentPlan = currentPlan === planKey;
          const isDowngrade = currentPlanRank > thisPlanRank;
          const canUpgrade = !isCurrentPlan && !isDowngrade;
          
          // Determine button text based on subscription state
          const getButtonText = () => {
            if (isCurrentPlan) return '✓ Current Plan';
            if (isDowngrade) return 'Manage Subscription';
            return plan.buttonText;
          };
          
          // Handle button click
          const handleButtonClick = () => {
            if (isCurrentPlan) return; // Do nothing for current plan
            if (isDowngrade) {
              // Go to Stripe portal to downgrade
              router.push('/account');
              return;
            }
            handleCheckout(plan);
          };
          
          return (
            <div
              key={plan.id}
              className={`card-glass p-5 sm:p-6 relative ${
                isCurrentPlan
                  ? 'border-2 border-accent shadow-glow-accent'
                  : plan.highlighted && canUpgrade
                  ? 'border-2 border-violet/50 shadow-glow-violet md:scale-105'
                  : isPremium && canUpgrade
                  ? 'border-2 border-accent/30 shadow-glow-accent'
                  : ''
              }`}
            >
              {/* Badge */}
              {isCurrentPlan ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-accent-dark text-bg text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-glow-accent">
                  YOUR PLAN
                </div>
              ) : plan.highlighted && canUpgrade ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet to-violet-dark text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-glow-violet">
                  MOST POPULAR
                </div>
              ) : isPremium && canUpgrade && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-accent-dark text-bg text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-glow-accent">
                  BEST VALUE
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-4 pt-2">
                <h3 className="text-xl font-bold mb-3 text-white">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-2">
                  <span className={`text-4xl font-extrabold ${
                    plan.highlighted ? 'text-gradient-violet-accent' : isPremium ? 'text-accent' : 'text-white'
                  }`}>
                    {yearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-sm text-gray-400">
                    {yearly ? '/year' : '/month'}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
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
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={handleButtonClick}
                disabled={loading === checkoutId || isCurrentPlan}
                className={`w-full py-3 px-6 rounded-btn font-semibold transition-all duration-200 min-h-[48px] ${
                  isCurrentPlan
                    ? 'bg-accent/20 text-accent border border-accent/30 cursor-default'
                    : isDowngrade
                    ? 'btn-gradient-border'
                    : plan.highlighted
                    ? 'btn-violet'
                    : isPremium
                    ? 'bg-gradient-to-r from-accent to-accent-dark text-bg hover:from-accent-dark hover:to-accent shadow-glow-accent'
                    : 'btn-gradient-border'
                } ${loading === checkoutId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading === checkoutId ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  getButtonText()
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-center mt-4 max-w-5xl mx-auto">
          {error}
        </div>
      )}
    </div>
  );
}
