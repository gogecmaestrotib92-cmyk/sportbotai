/**
 * AI Sports Desk Page - Serbian Version
 * 
 * Main feature: SportBot Chat - Ask anything about sports
 * Secondary: Live Intel Feed (auto-posts for X/Twitter)
 * 
 * Registration required to access features.
 */

import { Metadata } from 'next';
import AIDeskClientI18n from './AIDeskClientI18n';
import { SITE_CONFIG, getAIDeskSchema, getAIDeskBreadcrumb } from '@/lib/seo';
import { getTranslations } from '@/lib/i18n/translations';

const t = getTranslations('sr');

export const metadata: Metadata = {
  title: 'AI Sportski Desk | SportBot AI - Sportska Inteligencija',
  description: 'Četiraj sa AI o bilo kom sportu. Dobij inteligenciju u realnom vremenu, analizu mečeva i uvide. GPT-4 + Perplexity za najnovije sportske podatke.',
  keywords: ['AI sportski chat', 'sportska inteligencija', 'AI analiza', 'sportski podaci uživo', 'GPT sportovi'],
  openGraph: {
    title: 'AI Sportski Desk',
    description: 'Četiraj sa AI o bilo kom sportu. Dobij inteligenciju u realnom vremenu.',
    url: `${SITE_CONFIG.url}/sr/ai-desk`,
    siteName: SITE_CONFIG.name,
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-ai-desk.png`,
        width: 1200,
        height: 630,
        alt: 'AI Sportski Desk - Inteligencija u Realnom Vremenu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Sportski Desk',
    description: 'Četiraj sa AI o bilo kom sportu. Dobij inteligenciju u realnom vremenu.',
    site: SITE_CONFIG.twitter,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/sr/ai-desk`,
    languages: {
      'en': `${SITE_CONFIG.url}/ai-desk`,
      'sr': `${SITE_CONFIG.url}/sr/ai-desk`,
      'x-default': `${SITE_CONFIG.url}/ai-desk`,
    },
  },
};

export default function AIDeskPageSR() {
  const jsonLd = getAIDeskSchema();
  const breadcrumbSchema = getAIDeskBreadcrumb();
  
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
      
      <main className="min-h-screen bg-bg">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-accent/30 to-accent-dark/30 rounded-xl flex items-center justify-center border border-white/10">
                <span className="text-2xl">🧠</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t.aiDesk.pageTitle}</h1>
                <p className="text-text-muted text-sm">{t.aiDesk.pageSubtitle}</p>
              </div>
            </div>
          </div>

          {/* Main Layout: Chat Hero + Feed Sidebar (with auth gate) */}
          <AIDeskClientI18n locale="sr" />

          {/* Mobile: Feature badges (visible on mobile, hidden on desktop) */}
          <div className="flex flex-wrap gap-2 mt-6 lg:hidden">
            <span className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20 flex items-center gap-1.5">
              <span>⚡</span> {t.aiDesk.realTimeData}
            </span>
            <span className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20 flex items-center gap-1.5">
              <span>🤖</span> {t.aiDesk.gptPerplexity}
            </span>
            <span className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20 flex items-center gap-1.5">
              <span>📡</span> {t.aiDesk.autoIntelFeed}
            </span>
          </div>
        </div>
      </main>
    </>
  );
}
