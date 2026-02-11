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
import { getAffiliateCookie } from './AffiliateTracker';
import { trackCheckoutStart, trackUpgradeIntent } from '@/lib/analytics';

// Types for pricing plans
interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  dailyPriceMonthly: string;
  dailyPriceYearly: string;
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
    dailyPriceMonthly: '$0.66',
    dailyPriceYearly: '$0.40',
    monthlyPriceId: 'pro',
    yearlyPriceId: 'pro-yearly',
    description: 'Analysis + Edge Detection',
    yearlyDescription: 'Save $90/year',
    features: [
      '10 matches analyzed daily — cover your whole weekend slate',
      '50 AI questions/day — ask anything about any match',
      'All 7 sports covered',
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
    monthlyPriceId: 'premium',
    yearlyPriceId: 'premium-yearly',
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
  const [isYearlyBilling, setIsYearlyBilling] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
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

    // Track upgrade intent and checkout start
    const price = yearly
      ? parseFloat(plan.yearlyPrice.replace('$', ''))
      : parseFloat(plan.monthlyPrice.replace('$', ''));
    trackUpgradeIntent(`pricing-${plan.id}-${yearly ? 'yearly' : 'monthly'}`);
    trackCheckoutStart({ plan: plan.id, price });

    try {
      // Use the selected payment method
      const apiUrl = paymentMethod === 'paypal'
        ? '/api/paypal/create-subscription'
        : '/api/stripe/create-checkout-session';

      // Get affiliate ref from cookie
      const affiliateRef = typeof document !== 'undefined' 
        ? getAffiliateCookie() 
        : null;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          planName: `${plan.name} ${yearly ? 'Yearly' : 'Monthly'}`,
          affiliateRef: affiliateRef,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creating checkout session');
      }

      // Redirect to Stripe/PayPal Checkout
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
          className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${isYearlyBilling ? 'bg-accent' : 'bg-gray-600'
            }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${isYearlyBilling ? 'translate-x-7' : 'translate-x-0'
              }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${isYearlyBilling ? 'text-white' : 'text-gray-400'}`}>
          Yearly
          <span className="ml-2 text-xs bg-accent/30 text-white px-2 py-0.5 rounded-full">Save up to 52%</span>
        </span>
      </div>

      {/* Payment Method Selection */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className="text-sm text-gray-400">Pay with:</span>
        <button
          onClick={() => setPaymentMethod('stripe')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${paymentMethod === 'stripe'
            ? 'bg-accent text-black'
            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
        >
          💳 Card
        </button>
        <button
          onClick={() => setPaymentMethod('paypal')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${paymentMethod === 'paypal'
            ? 'bg-[#0070ba] text-white'
            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
        >
          <span className="font-bold">Pay</span><span className="font-bold text-[#003087]">Pal</span>
        </button>
      </div>
      {/* Pricing cards grid - min-height prevents CLS during hydration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto min-h-[580px] sm:min-h-[520px]">
        {/* Free Plan Card */}
        <div className={`card-glass p-5 sm:p-6 border border-accent/20 ${currentPlan === 'FREE' ? 'border-2 border-accent shadow-glow-accent' : ''
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
            className={`w-full py-3 px-6 rounded-btn font-semibold transition-all duration-200 min-h-[48px] ${currentPlan === 'FREE'
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
              id={plan.id}
              className={`card-glass p-5 sm:p-6 relative scroll-mt-24 ${isCurrentPlan
                ? 'border-2 border-accent shadow-glow-accent'
                : plan.highlighted && canUpgrade
                  ? 'border-2 border-accent/50 md:scale-105'
                  : canUpgrade
                    ? 'border-2 border-accent/30'
                    : ''
                }`}
            >
              {/* Badge */}
              {isCurrentPlan ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-accent-dark text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-glow-accent">
                  YOUR PLAN
                </div>
              ) : plan.highlighted && canUpgrade ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  MOST POPULAR
                </div>
              ) : isPremium && canUpgrade && (
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

              {/* CTA Button */}
              <button
                onClick={handleButtonClick}
                disabled={loading === checkoutId || isCurrentPlan}
                className={`w-full py-3 px-6 rounded-btn font-semibold transition-all duration-200 min-h-[48px] ${isCurrentPlan
                  ? 'bg-accent/20 text-accent border border-accent/30 cursor-default'
                  : isDowngrade
                    ? 'btn-gradient-border'
                    : plan.highlighted
                      ? 'bg-accent-dark hover:bg-accent text-white'
                      : 'bg-accent-dark hover:bg-accent/90 text-white'
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
