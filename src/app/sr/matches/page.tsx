/**
 * Matches Page - Serbian Version (/sr/matches)
 * 
 * Browse all upcoming matches by league.
 * The main match discovery page in Serbian.
 */

import { Metadata } from 'next';
import MatchBrowserI18n from '@/components/MatchBrowserI18n';
import { SITE_CONFIG, getMatchAnalyzerSchema, getMatchesBreadcrumb } from '@/lib/seo';
import { getTranslations } from '@/lib/i18n/translations';

const t = getTranslations('sr');

export const metadata: Metadata = {
  title: 'Pregledaj Mečeve | SportBot AI - Analiza Sportskih Mečeva',
  description: 'Pregledaj sve predstojeće sportske mečeve sa AI analizom. Fudbal, NBA, NFL, NHL i UFC - sve na jednom mestu sa podacima uživo.',
  keywords: ['sportski mečevi', 'fudbal uživo', 'kvote', 'analiza mečeva', 'AI predikcije', 'sportsko klađenje'],
  openGraph: {
    title: 'Pregledaj Mečeve | SportBot AI',
    description: 'Pregledaj sve predstojeće sportske mečeve sa AI analizom.',
    url: `${SITE_CONFIG.url}/sr/matches`,
    siteName: SITE_CONFIG.name,
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-matches.png`,
        width: 1200,
        height: 630,
        alt: 'Pregledaj Mečeve - AI Analiza Sportova',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pregledaj Mečeve | SportBot AI',
    description: 'Pregledaj sve predstojeće sportske mečeve sa AI analizom.',
    site: SITE_CONFIG.twitter,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/sr/matches`,
    languages: {
      'en': `${SITE_CONFIG.url}/matches`,
      'sr': `${SITE_CONFIG.url}/sr/matches`,
    },
  },
};

export default function MatchesPageSR() {
  const jsonLd = getMatchAnalyzerSchema();
  const breadcrumbSchema = getMatchesBreadcrumb();
  
  return (
    <>
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-bg-primary">
        {/* Header */}
        <section className="bg-bg-card border-b border-divider">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {t.matches.pageTitle}
                </h1>
                <p className="text-text-secondary text-sm">
                  {t.matches.pageSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span>{t.matches.pageDescription}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Match Browser */}
        <MatchBrowserI18n maxMatches={24} locale="sr" />
      </div>
    </>
  );
}
