/**
 * Landing Page - Home (/)
 * 
 * Main page of the SportBot AI application.
 * Contains all sections for presenting the platform.
 * 
 * A/B TEST ACTIVE: Hero section (hero-2024-12)
 */

import { Metadata } from 'next';
import HeroABTest from '@/components/HeroABTest';
import TrendingSectionServer from '@/components/TrendingSectionServer';
import HowItWorksStrip from '@/components/HowItWorksStrip';
import PricingTeaser from '@/components/PricingTeaser';
import FAQ from '@/components/FAQ';
import ResponsibleGamblingBlock from '@/components/ResponsibleGamblingBlock';
import { TrustBadges } from '@/components/SocialProof';
import LeagueScroll from '@/components/LeagueScroll';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import { getOrganizationSchema, getWebsiteSchema, getMatchAnalyzerSchema, getAIDeskSchema, getHomepageFAQSchema, getHomeBreadcrumb } from '@/lib/seo';

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
      
      {/* Hero section - A/B TEST ACTIVE */}
      <HeroABTest />

      {/* League logos - infinite scroll */}
      <LeagueScroll />

      {/* Trending matches - server-rendered for fast LCP */}
      <TrendingSectionServer maxMatches={6} />

      {/* Pricing - moved up for faster conversion path */}
      <PricingTeaser />

      {/* How it works - minimal 1-row strip */}
      <HowItWorksStrip />

      {/* Testimonials - social proof */}
      <TestimonialsCarousel />

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
