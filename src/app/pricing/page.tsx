/**
 * Pricing Page (/pricing)
 * 
 * Page with detailed overview of pricing plans and Stripe checkout.
 */

import { Metadata } from 'next';
import PricingCards from '@/components/PricingCards';
import FAQ, { pricingFAQData } from '@/components/FAQ';
import { META, SITE_CONFIG, getFAQSchema, getPricingSchema, getPricingBreadcrumb } from '@/lib/seo';

export const metadata: Metadata = {
  title: META.pricing.title,
  description: META.pricing.description,
  keywords: META.pricing.keywords,
  openGraph: {
    title: META.pricing.title,
    description: META.pricing.description,
    url: `${SITE_CONFIG.url}/pricing`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: META.pricing.title,
    description: META.pricing.description,
    site: SITE_CONFIG.twitter,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/pricing`,
    languages: {
      'en': '/pricing',
      'sr': '/sr/pricing',
      'x-default': '/pricing',
    },
  },
};

// FAQ data for structured markup
const pricingFAQs = [
  {
    question: 'Can I cancel my subscription?',
    answer: 'One click from your account settings. No contracts, no cancellation fees. You keep access until your billing period ends.',
  },
  {
    question: 'Is SportBot AI a tipster service?',
    answer: 'No. We show you data, probabilities, and where the odds look off — then you decide what to do with that information.',
  },
  {
    question: 'What sports are covered?',
    answer: '4 sports across 20+ leagues: Soccer (Premier League, La Liga, Serie A, Champions League & more), Basketball (NBA, EuroLeague), American Football (NFL, NCAA), and Hockey (NHL).',
  },
  {
    question: "What's the difference between Pro and Premium?",
    answer: 'Pro ($0.66/day) gives you 10 analyses and 50 AI questions daily — enough for a full weekend of matches. Premium ($1.66/day) removes all limits and adds Edge Alerts that notify you when our AI spots value in real time.',
  },
];

export default function PricingPage() {
  const faqSchema = getFAQSchema(pricingFAQs);
  const pricingSchema = getPricingSchema();
  const breadcrumbSchema = getPricingBreadcrumb();

  return (
    <div className="bg-bg min-h-screen relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Product/Pricing Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      {/* Header section */}
      <section className="relative text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Pricing</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Smarter Analysis, <span className="text-gradient-accent">Less Than a Coffee</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            One bad decision costs more than a year of Pro. Start free, cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="section-container -mt-8 relative">
        <PricingCards />
      </section>

      {/* FAQ section - accordion style */}
      <FAQ 
        items={pricingFAQData} 
        title="Frequently Asked Questions" 
        label="FAQ"
      />

      {/* Disclaimer */}
      <section className="bg-warning/5 border-t border-warning/20 py-8 relative">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-warning/80 text-sm leading-relaxed">
            <strong>⚠️ Note:</strong> Payment for SportBot AI does not guarantee winnings. 
            Our tool is purely analytical and educational. Bet responsibly and only with money you can afford to lose.
          </p>
        </div>
      </section>
    </div>
  );
}
