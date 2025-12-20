/**
 * Landing Page - Home (/)
 * 
 * Main page of the SportBot AI application.
 * Contains all sections for presenting the platform.
 * 
 * A/B TEST ACTIVE: Hero section (hero-2024-12)
 */

import HeroABTest from '@/components/HeroABTest';
import TrendingSection from '@/components/TrendingSection';
import HowItWorks from '@/components/HowItWorks';
import WhyNotTipster from '@/components/WhyNotTipster';
import Features from '@/components/Features';
import PricingTeaser from '@/components/PricingTeaser';
import ResponsibleGamblingBlock from '@/components/ResponsibleGamblingBlock';
import { StatsStrip, TestimonialsSection, TrustBadges } from '@/components/SocialProof';
import { getOrganizationSchema, getWebsiteSchema, getMatchAnalyzerSchema, getAIDeskSchema, getHomepageFAQSchema } from '@/lib/seo';

export default function HomePage() {
  // Structured data for rich search results
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebsiteSchema();
  const analyzerSchema = getMatchAnalyzerSchema();
  const aiDeskSchema = getAIDeskSchema();
  const faqSchema = getHomepageFAQSchema();
  
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
      
      {/* Hero section - A/B TEST ACTIVE */}
      <HeroABTest />

      {/* Stats strip - social proof */}
      <StatsStrip />

      {/* Trending matches - daily habit driver */}
      <TrendingSection maxMatches={6} />

      {/* How it works - 3 steps */}
      <HowItWorks />

      {/* Why we're not a tipster - IMPORTANT positioning section */}
      <WhyNotTipster />

      {/* Main features */}
      <Features />

      {/* Testimonials - social proof */}
      <TestimonialsSection />

      {/* Pricing teaser */}
      <PricingTeaser />

      {/* Trust badges */}
      <div className="py-8 bg-bg">
        <TrustBadges className="max-w-4xl mx-auto px-4" />
      </div>

      {/* Responsible gambling - MANDATORY */}
      <ResponsibleGamblingBlock />
    </>
  );
}
