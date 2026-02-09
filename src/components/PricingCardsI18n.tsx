/**
 * Pricing Cards component - i18n Version
 * 
 * Displays three pricing plans: FREE, PRO (with toggle), PREMIUM (with toggle)
 * With Stripe checkout integration.
 * Supports localization.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Locale, getTranslations } from '@/lib/i18n/translations';
import { trackCheckoutStart, trackUpgradeIntent } from '@/lib/analytics';

interface PricingCardsI18nProps {
  locale: Locale;
}

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

// Plan hierarchy for comparison
const PLAN_RANK: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2,
};

// Translations specific to pricing cards
const cardTranslations = {
  en: {
    monthly: 'Monthly',
    yearly: 'Yearly',
    saveUpTo: 'Save up to 52%',
    free: 'Free',
    tryItOnce: 'Try it once for free',
    startFree: 'Start Free',
    yourPlan: 'YOUR PLAN',
    currentPlan: '✓ Current Plan',
    mostPopular: 'MOST POPULAR',
    bestValue: 'BEST VALUE',
    loading: 'Loading...',
    perYear: '/year',
    perMonth: '/month',
    perDay: '/day',
    manageSubscription: 'Manage Subscription',
    freeFeatures: [
      '1 match analysis',
      '1 AI chat message',
      'Basic sports (soccer)',
      'Standard AI analysis',
      'Email support',
    ],
    proFeatures: [
      '10 analyses per day',
      '50 AI chat messages per day',
      'All sports',
      'Advanced AI analysis',
      'Pre-match insights & streaks',
      'Priority support',
      'Analysis history (30 days)',
      'My Teams favorites',
    ],
    premiumFeatures: [
      'Unlimited analyses',
      'Unlimited AI chat messages',
      'All sports',
      'Edge Alerts (value detection)',
      'Advanced statistics & trends',
      'Unlimited analysis history',
      'My Teams favorites',
      'Priority support 24/7',
    ],
    proDescription: 'Analysis + Edge Detection',
    proYearlyDescription: 'Save $90/year',
    proButtonText: 'Upgrade to Pro',
    premiumDescription: 'Unlimited Analysis + Edge Alerts',
    premiumYearlyDescription: 'Save $310/year (52% off)',
    premiumButtonText: 'Go Premium',
  },
  sr: {
    monthly: 'Mesečno',
    yearly: 'Godišnje',
    saveUpTo: 'Uštedi do 52%',
    free: 'Besplatno',
    tryItOnce: 'Probaj jednom besplatno',
    startFree: 'Počni Besplatno',
    yourPlan: 'TVOJ PLAN',
    currentPlan: '✓ Trenutni Plan',
    mostPopular: 'NAJPOPULARNIJI',
    bestValue: 'NAJBOLJA VREDNOST',
    loading: 'Učitavanje...',
    perYear: '/godišnje',
    perMonth: '/mesečno',
    perDay: '/dnevno',
    manageSubscription: 'Upravljaj Pretplatom',
    freeFeatures: [
      '1 analiza meča',
      '1 AI chat poruka',
      'Osnovni sportovi (fudbal)',
      'Standardna AI analiza',
      'Email podrška',
    ],
    proFeatures: [
      '10 analiza dnevno',
      '50 AI chat poruka dnevno',
      'Svi sportovi',
      'Napredna AI analiza',
      'Pred-utakmični uvidi i nizovi',
      'Prioritetna podrška',
      'Istorija analiza (30 dana)',
      'Moji Timovi favoriti',
    ],
    premiumFeatures: [
      'Neograničene analize',
      'Neograničene AI chat poruke',
      'Svi sportovi',
      'Edge Alarmi (detekcija vrednosti)',
      'Napredna statistika i trendovi',
      'Neograničena istorija analiza',
      'Moji Timovi favoriti',
      'Prioritetna podrška 24/7',
    ],
    proDescription: 'Analiza + Detekcija Edge-a',
    proYearlyDescription: 'Uštedi $90/godišnje',
    proButtonText: 'Nadogradi na Pro',
    premiumDescription: 'Neograničena Analiza + Edge Alarmi',
    premiumYearlyDescription: 'Uštedi $310/godišnje (52% popusta)',
    premiumButtonText: 'Pređi na Premium',
  },
};

export default function PricingCardsI18n({ locale }: PricingCardsI18nProps) {
  const t = cardTranslations[locale];
  const localePath = locale === 'sr' ? '/sr' : '';

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isYearlyBilling, setIsYearlyBilling] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const { data: session } = useSession();
  const router = useRouter();

  // Plans definition with localized content
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
      description: t.proDescription,
      yearlyDescription: t.proYearlyDescription,
      features: t.proFeatures,
      highlighted: true,
      buttonText: t.proButtonText,
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
      description: t.premiumDescription,
      yearlyDescription: t.premiumYearlyDescription,
      features: t.premiumFeatures,
      buttonText: t.premiumButtonText,
    },
  ];

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

  const isYearly = () => isYearlyBilling;
  const toggleBilling = () => setIsYearlyBilling(!isYearlyBilling);

  // Function for Stripe checkout
  const handleCheckout = async (plan: PricingPlan) => {
    if (!session) {
      router.push(`${localePath}/login?callbackUrl=${localePath}/pricing`);
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
      // Get affiliate ref from cookie if exists
      const affiliateRef = typeof document !== 'undefined' 
        ? document.cookie.match(/affiliate_ref=([^;]+)/)?.[1] || null
        : null;

      const response = await fetch('/api/stripe/create-checkout-session', {
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

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(null);
    }
  };

  const handleFreePlan = () => {
    if (session) {
      router.push(`${localePath}/analyzer`);
    } else {
      router.push(`${localePath}/register`);
    }
  };

  return (
    <div className="relative">
      {/* Single Billing Toggle at Top */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={`text-sm font-medium transition-colors ${!isYearlyBilling ? 'text-white' : 'text-gray-400'}`}>
          {t.monthly}
        </span>
        <button
          onClick={toggleBilling}
          role="switch"
          aria-checked={isYearlyBilling}
          aria-label="Toggle between monthly and yearly billing"
          className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${isYearlyBilling ? 'bg-accent-dark' : 'bg-gray-600'
            }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${isYearlyBilling ? 'translate-x-7' : 'translate-x-0'
              }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${isYearlyBilling ? 'text-white' : 'text-gray-400'}`}>
          {t.yearly}
          <span className="ml-2 text-xs bg-accent-dark/30 text-white px-2 py-0.5 rounded-full">{t.saveUpTo}</span>
        </span>
      </div>
      {/* Pricing cards grid - min-height prevents CLS during hydration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto min-h-[580px] sm:min-h-[520px]">
        {/* Free Plan Card */}
        <div className={`card-glass p-5 sm:p-6 ${currentPlan === 'FREE' ? 'border-2 border-accent shadow-glow-accent' : ''
          } relative`}>
          {currentPlan === 'FREE' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
              {t.yourPlan}
            </div>
          )}
          <div className="text-center mb-6 pt-2">
            <h3 className="text-xl font-bold mb-2 text-white">{t.free}</h3>
            <div className="mb-2">
              <span className="text-4xl font-bold text-white">$0</span>
            </div>
            <p className="text-sm text-gray-400">{t.tryItOnce}</p>
          </div>

          <ul className="space-y-3 mb-8">
            {t.freeFeatures.map((feature, index) => (
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
              : 'bg-bg-elevated text-white hover:bg-bg-elevated/80 border border-divider'
              }`}
          >
            {currentPlan === 'FREE' ? t.currentPlan : t.startFree}
          </button>
        </div>

        {/* Pro and Premium Cards */}
        {plans.map((plan) => {
          const isPremium = plan.id === 'premium';
          const yearly = isYearly();
          const checkoutId = `${plan.id}-${yearly ? 'yearly' : 'monthly'}`;
          const planKey = plan.id.toUpperCase();
          const currentPlanRank = PLAN_RANK[currentPlan] || 0;
          const thisPlanRank = PLAN_RANK[planKey] || 0;
          const isCurrentPlan = currentPlan === planKey;
          const isDowngrade = currentPlanRank > thisPlanRank;
          const canUpgrade = !isCurrentPlan && !isDowngrade;

          const getButtonText = () => {
            if (isCurrentPlan) return t.currentPlan;
            if (isDowngrade) return t.manageSubscription;
            return plan.buttonText;
          };

          const handleButtonClick = () => {
            if (isCurrentPlan) return;
            if (isDowngrade) {
              router.push(`${localePath}/account`);
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
                  : isPremium && canUpgrade
                    ? 'border-2 border-accent/30'
                    : ''
                }`}
            >
              {/* Badge */}
              {isCurrentPlan ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  {t.yourPlan}
                </div>
              ) : plan.highlighted && canUpgrade ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  {t.mostPopular}
                </div>
              ) : isPremium && canUpgrade && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  {t.bestValue}
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
                    <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : isPremium ? 'text-slate-400' : 'text-white'
                      }`}>
                      {yearly ? plan.dailyPriceYearly : plan.dailyPriceMonthly}
                    </span>
                    <span className="text-lg text-gray-400 font-medium">{t.perDay}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {yearly ? plan.yearlyPrice : plan.monthlyPrice} {yearly ? t.perYear : t.perMonth}
                  </div>
                </div>
                <p className={`text-sm font-semibold mb-2 ${yearly ? 'text-gray-400' : 'text-gradient-gold'}`}>
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
                      : isPremium
                        ? 'bg-accent-dark/80 hover:bg-accent-dark text-white border border-accent/30'
                        : 'btn-gradient-border'
                  } ${loading === checkoutId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading === checkoutId ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t.loading}
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
