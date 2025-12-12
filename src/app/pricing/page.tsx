/**
 * Pricing Page (/pricing)
 * 
 * Page with detailed overview of pricing plans and Stripe checkout.
 */

import { Metadata } from 'next';
import PricingCards from '@/components/PricingCards';
import { META, getFAQSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: META.pricing.title,
  description: META.pricing.description,
  keywords: META.pricing.keywords,
  openGraph: {
    title: META.pricing.title,
    description: META.pricing.description,
  },
};

// FAQ data for structured markup
const pricingFAQs = [
  {
    question: 'Can I cancel my subscription?',
    answer: 'Yes, you can cancel your subscription at any time. There are no fixed-term contracts. Access remains active until the end of the paid period.',
  },
  {
    question: 'Is SportBot AI a tipster service?',
    answer: 'No. SportBot AI is an analytics tool that provides probability models and statistical insights. We do not provide betting tips, picks, or guaranteed outcomes.',
  },
  {
    question: 'What sports are covered?',
    answer: 'SportBot AI covers Soccer (Premier League, La Liga, UCL, Serie A, Bundesliga, Ligue 1), NBA, NFL, NHL, and UFC/MMA with real-time data integration.',
  },
  {
    question: 'How accurate are the probability models?',
    answer: 'Our AI models provide estimated probabilities based on statistical analysis. No prediction system is 100% accurate. We focus on transparency and helping users understand the data.',
  },
];

export default function PricingPage() {
  const faqSchema = getFAQSchema(pricingFAQs);

  return (
    <div className="bg-bg min-h-screen">
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Header section */}
      <section className="bg-bg-card border-b border-divider text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple Pricing
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            No hidden fees. Cancel anytime. Start free and upgrade when you&apos;re ready.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="section-container -mt-8">
        <PricingCards />
      </section>

      {/* FAQ section */}
      <section className="section-container">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="card">
            <h3 className="font-bold text-white mb-2">Can I cancel my subscription?</h3>
            <p className="text-text-secondary">
              Yes, you can cancel your subscription at any time. There are no fixed-term contracts. 
              Access remains active until the end of the paid period.
            </p>
          </div>

          <div className="card">
            <h3 className="font-bold text-white mb-2">What payment methods are supported?</h3>
            <p className="text-text-secondary">
              We accept all major cards (Visa, Mastercard, Amex) through the secure Stripe payment system.
            </p>
          </div>

          <div className="card">
            <h3 className="font-bold text-white mb-2">Are analyses a guarantee of winnings?</h3>
            <p className="text-text-secondary">
              <strong>No.</strong> SportBot AI is an analytical tool that provides estimates based on available data. 
              Sports betting always carries risk and we cannot guarantee any outcome.
            </p>
          </div>

          <div className="card">
            <h3 className="font-bold text-white mb-2">What do I get with the Free plan?</h3>
            <p className="text-text-secondary">
              The Free plan includes 3 analyses per day for soccer. Great for trying out the platform 
              before deciding to upgrade.
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-warning/10 border-t border-warning/30 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-warning text-sm leading-relaxed">
            <strong>⚠️ Note:</strong> Payment for SportBot AI does not guarantee winnings. 
            Our tool is purely analytical and educational. Bet responsibly and only with money you can afford to lose.
          </p>
        </div>
      </section>
    </div>
  );
}
