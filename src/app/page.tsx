/**
 * Landing Page - Home (/)
 * 
 * Main page of the SportBot AI application.
 * Contains all sections for presenting the platform.
 * 
 * A/B TEST ACTIVE: Hero section (hero-2024-12)
 * 
 * PERFORMANCE: Below-fold components use dynamic imports to reduce initial bundle
 */

import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Critical path - load immediately (above fold)
import Hero from '@/components/Hero';
import LeagueScroll from '@/components/LeagueScroll';
import TrendingSectionServer from '@/components/TrendingSectionServer';
import { TrustBadges } from '@/components/SocialProof';
import { getOrganizationSchema, getWebsiteSchema, getMatchAnalyzerSchema, getAIDeskSchema, getHomepageFAQSchema, getHomeBreadcrumb } from '@/lib/seo';

// Below-fold components - dynamic imports for better TBT/LCP
const DailyPicksSection = dynamic(
  () => import('@/components/DailyPicksSection'),
  { ssr: true }
);
const VideoTestimonialsCarousel = dynamic(
  () => import('@/components/VideoTestimonialsCarousel'),
  { ssr: true }
);
const HowItWorksVideo = dynamic(
  () => import('@/components/HowItWorksVideo'),
  { ssr: true }
);
const PricingTeaser = dynamic(
  () => import('@/components/PricingTeaser'),
  { ssr: true }
);
const ValueBettingExplainer = dynamic(
  () => import('@/components/ValueBettingExplainer'),
  { ssr: true }
);
const FAQ = dynamic(
  () => import('@/components/FAQ'),
  { ssr: true }
);
const ResponsibleGamblingBlock = dynamic(
  () => import('@/components/ResponsibleGamblingBlock'),
  { ssr: true }
);


// Homepage metadata with canonical and hreflang
export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    languages: {
      'en': '/',
      'sr': '/sr',
      'x-default': '/',
    },
  },
};

export default function HomePage() {
  // Structured data for rich search results
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebsiteSchema();
  const analyzerSchema = getMatchAnalyzerSchema();
  const aiDeskSchema = getAIDeskSchema();
  const faqSchema = getHomepageFAQSchema();
  const breadcrumbSchema = getHomeBreadcrumb();

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(analyzerSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aiDeskSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero section */}
      <Hero />

      {/* League logos - infinite scroll */}
      <LeagueScroll />

      {/* Daily Picks - AI value picks with edge */}
      <DailyPicksSection locale="en" />

      {/* Trending matches - server-rendered for fast LCP */}
      <TrendingSectionServer maxMatches={6} />

      {/* Testimonials - video social proof */}
      <VideoTestimonialsCarousel />

      {/* How It Works - Demo video */}
      <HowItWorksVideo />

      {/* Pricing - conversion CTA */}
      <PricingTeaser />

      {/* Value Betting Explainer - SEO content */}
      <ValueBettingExplainer />

      {/* FAQ section */}
      <FAQ />

      {/* Trust badges */}
      <div className="py-8 bg-bg-primary">
        <TrustBadges className="max-w-4xl mx-auto px-4" />
      </div>

      {/* Responsible gambling - MANDATORY */}
      <ResponsibleGamblingBlock />
    </>
  );
}
