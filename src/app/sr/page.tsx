/**
 * Serbian Landing Page - Home (/sr)
 * 
 * Main page of the SportBot AI application in Serbian.
 * Contains all sections for presenting the platform.
 * 
 * SYNCED with English homepage structure.
 */

import { Metadata } from 'next';
import HeroI18n from '@/components/HeroI18n';
import TrendingSectionServer from '@/components/TrendingSectionServer';
import HowItWorksStripI18n from '@/components/HowItWorksStripI18n';
import PricingTeaserI18n from '@/components/PricingTeaserI18n';
import ResponsibleGamblingBlockI18n from '@/components/ResponsibleGamblingBlockI18n';
import FAQI18n from '@/components/FAQI18n';
import { TrustBadgesI18n } from '@/components/SocialProofI18n';
import LeagueScroll from '@/components/LeagueScroll';
import VideoTestimonialsCarousel from '@/components/VideoTestimonialsCarousel';
import { getTranslations } from '@/lib/i18n';
import { getOrganizationSchema, getWebsiteSchema, getMatchAnalyzerSchema, getAIDeskSchema, getHomepageFAQSchema, getHomeBreadcrumb } from '@/lib/seo';

// Homepage metadata with canonical for Serbian
export const metadata: Metadata = {
  title: 'SportBot AI - Pronađi Gde Tržište Greši',
  description: 'Pred-utakmična inteligencija sa AI analizom. Upoređujemo AI verovatnoće sa kvotama da otkrijemo edge. Fudbal, NBA, NFL, NHL i UFC.',
  alternates: {
    canonical: '/sr',
    languages: {
      'en': '/',
      'sr': '/sr',
      'x-default': '/',
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

      {/* Pricing - moved up for faster conversion path */}
      <PricingTeaserI18n t={t} locale="sr" />

      {/* How it works - minimal 1-row strip */}
      <HowItWorksStripI18n locale="sr" />

      {/* Moments carousel - marketing situations */}
      <VideoTestimonialsCarousel locale="sr" />

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
