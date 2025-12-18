/**
 * Matches Page (/matches)
 * 
 * Browse all upcoming matches by league.
 * The main match discovery page.
 */

import { Metadata } from 'next';
import MatchBrowser from '@/components/MatchBrowser';
import { META, SITE_CONFIG, getMatchAnalyzerSchema } from '@/lib/seo';

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
  },
};

export default function MatchesPage() {
  const jsonLd = getMatchAnalyzerSchema();
  
  return (
    <>
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
                  Browse Matches
                </h1>
                <p className="text-text-secondary text-sm">
                  Select any upcoming match to get your pre-match intelligence briefing
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span>Live data from 7 major sports</span>
              </div>
            </div>
          </div>
        </section>

        {/* Match Browser */}
        <MatchBrowser maxMatches={24} />
      </div>
    </>
  );
}
