/**
 * Serbian Landing Page - Home (/sr)
 * 
 * Main page of the SportBot AI application in Serbian.
 * Contains all sections for presenting the platform.
 */

import { Metadata } from 'next';
import HeroI18n from '@/components/HeroI18n';
import TrendingSectionServer from '@/components/TrendingSectionServer';
import HowItWorksI18n from '@/components/HowItWorksI18n';
import WhyNotTipsterI18n from '@/components/WhyNotTipsterI18n';
import FeaturesI18n from '@/components/FeaturesI18n';
import PricingTeaserI18n from '@/components/PricingTeaserI18n';
import ResponsibleGamblingBlockI18n from '@/components/ResponsibleGamblingBlockI18n';
import FAQI18n from '@/components/FAQI18n';
import { TrustBadgesI18n } from '@/components/SocialProofI18n';
import LeagueScroll from '@/components/LeagueScroll';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import { getTranslations } from '@/lib/i18n';
import { getOrganizationSchema, getWebsiteSchema, getMatchAnalyzerSchema, getAIDeskSchema, getHomepageFAQSchema, getHomeBreadcrumb } from '@/lib/seo';

// Homepage metadata with canonical for Serbian
export const metadata: Metadata = {
  title: 'SportBot AI - AI Analiza Mečeva za 60 Sekundi',
  description: 'Pred-utakmična inteligencija sa AI uvidima. Naslovi, forma timova, H2H statistika. Fudbal, NBA, NFL, NHL i UFC analiza.',
  alternates: {
    canonical: '/sr',
    languages: {
      'en': '/',
      'sr': '/sr',
    },
  },
  openGraph: {
    locale: 'sr_RS',
  },
};

export default function SerbianHomePage() {
  // Get Serbian translations
  const t = getTranslations('sr');
  
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
      <HeroI18n t={t} locale="sr" />

      {/* League logos - infinite scroll */}
      <LeagueScroll />

      {/* Trending matches - server-rendered for fast LCP */}
      <TrendingSectionServer maxMatches={6} locale="sr" />

      {/* Testimonials - social proof */}
      <TestimonialsCarousel />

      {/* How it works - 4 steps */}
      <HowItWorksI18n t={t} />

      {/* Why we're not a tipster - IMPORTANT positioning section */}
      <WhyNotTipsterI18n t={t} />

      {/* Main features */}
      <FeaturesI18n t={t} />

      {/* Pricing teaser */}
      <PricingTeaserI18n t={t} locale="sr" />

      {/* FAQ section */}
      <FAQI18n t={t} />

      {/* Trust badges */}
      <div className="py-8 bg-bg-primary">
        <TrustBadgesI18n className="max-w-4xl mx-auto px-4" t={t} />
      </div>

      {/* Responsible gambling - MANDATORY */}
      <ResponsibleGamblingBlockI18n t={t} locale="sr" />
    </>
  );
}
