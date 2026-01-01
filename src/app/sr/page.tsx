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
import { StatsStripI18n, TestimonialsSectionI18n, TrustBadgesI18n } from '@/components/SocialProofI18n';
import { getTranslations } from '@/lib/i18n';
import { getOrganizationSchema, getWebsiteSchema, getMatchAnalyzerSchema, getAIDeskSchema, getHomepageFAQSchema, getHomeBreadcrumb } from '@/lib/seo';

// Homepage metadata with canonical for Serbian
export const metadata: Metadata = {
  title: 'SportBot AI - AI Sportska Analiza | Razumi Mečeve za 60 Sekundi',
  description: 'Pred-utakmična inteligencija: naslovi, forma, H2H istorija i AI uvidi. Fudbal, NBA, NFL, NHL i UFC—sve za 60 sekundi.',
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

      {/* Stats strip - social proof */}
      <StatsStripI18n t={t} />

      {/* Trending matches - server-rendered for fast LCP */}
      <TrendingSectionServer maxMatches={6} locale="sr" />

      {/* How it works - 4 steps */}
      <HowItWorksI18n t={t} />

      {/* Why we're not a tipster - IMPORTANT positioning section */}
      <WhyNotTipsterI18n t={t} />

      {/* Main features */}
      <FeaturesI18n t={t} />

      {/* Testimonials - social proof */}
      <TestimonialsSectionI18n t={t} />

      {/* Pricing teaser */}
      <PricingTeaserI18n t={t} locale="sr" />

      {/* Trust badges */}
      <div className="py-8 bg-bg">
        <TrustBadgesI18n className="max-w-4xl mx-auto px-4" t={t} />
      </div>

      {/* Responsible gambling - MANDATORY */}
      <ResponsibleGamblingBlockI18n t={t} locale="sr" />
    </>
  );
}
