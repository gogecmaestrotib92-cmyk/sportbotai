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
      'en': '/matches',
      'sr': '/sr/matches',
      'x-default': '/matches',
    },
  },
};

export default function MatchesPageSr({
  searchParams,
}: {
  searchParams: { league?: string };
}) {
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
      
      <div className="min-h-screen bg-bg relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
        
        {/* Header */}
        <section className="relative border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-violet/5 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 tracking-tight">
                  Pregledaj Mečeve
                </h1>
                <p className="text-text-secondary text-sm">
                  Izaberi bilo koji predstojeći meč za pred-utakmični brifing
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span>Podaci uživo iz 4 glavna sporta</span>
              </div>
            </div>
          </div>
        </section>

        {/* Match Browser */}
        <MatchBrowserI18n maxMatches={24} locale="sr" initialLeague={searchParams.league} />
      </div>
    </>
  );
}
