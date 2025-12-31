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
import VideoTestimonialsCarousel from '@/components/VideoTestimonialsCarousel';
import HowItWorks from '@/components/HowItWorks';
import WhyNotTipster from '@/components/WhyNotTipster';
import Features from '@/components/Features';
import PricingTeaser from '@/components/PricingTeaser';
import FAQ from '@/components/FAQ';
import ResponsibleGamblingBlock from '@/components/ResponsibleGamblingBlock';
import { StatsStrip, TrustBadges } from '@/components/SocialProof';
import { getOrganizationSchema, getWebsiteSchema, getMatchAnalyzerSchema, getAIDeskSchema, getHomepageFAQSchema, getHomeBreadcrumb } from '@/lib/seo';

// Homepage metadata with canonical
export const metadata: Metadata = {
  alternates: {
    canonical: '/',
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

      {/* Stats strip - social proof */}
      <StatsStrip />

      {/* Trending matches - server-rendered for fast LCP */}
      <TrendingSectionServer maxMatches={6} />

      {/* Video Testimonials - UGC style carousel */}
      <VideoTestimonialsCarousel />

      {/* How it works - 3 steps */}
      <HowItWorks />

      {/* Why we're not a tipster - IMPORTANT positioning section */}
      <WhyNotTipster />

      {/* Main features */}
      <Features />

      {/* Pricing teaser */}
      <PricingTeaser />

      {/* FAQ section */}
      <FAQ />

      {/* Trust badges */}
      <div className="py-8 bg-bg">
        <TrustBadges className="max-w-4xl mx-auto px-4" />
      </div>

      {/* Responsible gambling - MANDATORY */}
      <ResponsibleGamblingBlock />
    </>
  );
}
