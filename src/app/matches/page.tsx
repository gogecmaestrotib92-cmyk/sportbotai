/**
 * Matches Page (/matches)
 * 
 * Browse all upcoming matches by league.
 * The main match discovery page.
 */

import { Metadata } from 'next';
import MatchBrowser from '@/components/MatchBrowser';
import { META, SITE_CONFIG, getMatchAnalyzerSchema, getMatchesBreadcrumb } from '@/lib/seo';

export const metadata: Metadata = {
  title: META.matches.title,
  description: META.matches.description,
  keywords: META.matches.keywords,
  openGraph: {
    title: META.matches.title,
    description: META.matches.description,
    url: `${SITE_CONFIG.url}/matches`,
    siteName: SITE_CONFIG.name,
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-matches.png`,
        width: 1200,
        height: 630,
        alt: 'Browse Matches - AI Sports Analysis Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: META.matches.title,
    description: META.matches.description,
    site: SITE_CONFIG.twitter,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/matches`,
    languages: {
      'en': '/matches',
      'sr': '/sr/matches',
      'x-default': '/matches',
    },
  },
};

export default function MatchesPage({
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
                  Browse Matches
                </h1>
                <p className="text-text-secondary text-sm">
                  Select any upcoming match to get your pre-match intelligence briefing
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span>Live data from 4 major sports</span>
              </div>
            </div>
          </div>
        </section>

        {/* Match Browser */}
        <MatchBrowser maxMatches={24} initialLeague={searchParams.league} />
      </div>
    </>
  );
}
