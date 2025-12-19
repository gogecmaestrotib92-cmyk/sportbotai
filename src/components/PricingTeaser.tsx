/**
 * Pricing Teaser section for landing page
 * 
 * Compact pricing preview with modern card design.
 */

import Link from 'next/link';

export default function PricingTeaser() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '',
      description: 'Try it once',
      features: ['1 match analysis', '1 AI chat message', 'Basic sports (soccer)'],
      cta: 'Get Started',
      href: '/analyzer',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$19.99',
      period: '/month',
      description: 'For serious analysts',
      features: ['10 analyses/day', '50 AI chat messages/day', 'All sports', 'Analysis history'],
      cta: 'Upgrade to Pro',
      href: '/pricing',
      highlighted: true,
    },
    {
      name: 'Premium',
      price: '$49.99',
      period: '/month',
      description: 'Unlimited + Alerts',
      features: ['Unlimited everything', 'Market Alerts', 'Advanced stats', 'Priority support'],
      cta: 'Go Premium',
      href: '/pricing',
      highlighted: false,
    },
    {
      name: 'Pro Yearly',
      price: '$149',
      period: '/year',
      description: 'Save $90/year',
      features: ['Everything in Pro', 'Billed annually', 'Save 37%'],
      cta: 'Pro Annual',
      href: '/pricing',
      highlighted: false,
    },
    {
      name: 'Premium Yearly',
      price: '$290',
      period: '/year',
      description: 'Best value - Save $310',
      features: ['Unlimited + Alerts', 'Advanced stats', 'Save 52%'],
      cta: 'Best Deal',
      href: '/pricing',
      highlighted: false,
    },
  ];

  return (
    <section className="bg-bg-primary section-container">
      <div className="text-center mb-14">
        <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Pricing</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Start free, upgrade when you need more. No hidden fees.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`rounded-card p-6 transition-all duration-300 ${
              plan.highlighted 
                ? 'bg-bg-elevated text-white ring-2 ring-accent shadow-glow-accent scale-105' 
                : 'bg-bg-card border border-divider hover:border-primary/30'
            }`}
          >
            {/* Popular Badge */}
            {plan.highlighted && (
              <span className="inline-block bg-accent text-bg-primary text-xs font-bold px-3 py-1 rounded-full mb-4">
                MOST POPULAR
              </span>
            )}

            {/* Plan Name */}
            <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-white'}`}>
              {plan.name}
            </h3>
            <p className={`text-sm mb-4 ${plan.highlighted ? 'text-gray-300' : 'text-gray-400'}`}>
              {plan.description}
            </p>

            {/* Price */}
            <div className="mb-6">
              <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-white'}`}>
                {plan.price}
              </span>
              <span className={`text-sm ${plan.highlighted ? 'text-gray-300' : 'text-gray-400'}`}>
                {plan.period}
              </span>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className={`flex items-center gap-2 text-sm ${plan.highlighted ? 'text-gray-200' : 'text-gray-400'}`}>
                  <svg className={`w-4 h-4 ${plan.highlighted ? 'text-accent' : 'text-success'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link 
              href={plan.href}
              className={`block text-center py-3 px-4 rounded-lg font-semibold transition-all ${
                plan.highlighted 
                  ? 'bg-accent text-bg-primary hover:bg-success' 
                  : 'bg-primary text-white hover:bg-primary/80'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-primary font-medium hover:text-accent transition-colors">
          View full pricing comparison
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
