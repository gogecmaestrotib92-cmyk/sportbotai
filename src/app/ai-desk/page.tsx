/**
 * AI Sports Desk Page
 * 
 * Main feature: SportBot Chat - Ask anything about sports
 * Secondary: Live Intel Feed (auto-posts for X/Twitter)
 * 
 * Registration required to access features.
 */

import { Metadata } from 'next';
import AIDeskClient from './AIDeskClient';
import { META, SITE_CONFIG, getAIDeskSchema, getAIDeskBreadcrumb } from '@/lib/seo';

export const metadata: Metadata = {
  title: META.aiDesk.title,
  description: META.aiDesk.description,
  keywords: META.aiDesk.keywords,
  openGraph: {
    title: META.aiDesk.title,
    description: META.aiDesk.description,
    url: `${SITE_CONFIG.url}/ai-desk`,
    siteName: SITE_CONFIG.name,
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-ai-desk.png`,
        width: 1200,
        height: 630,
        alt: 'AI Sports Desk - Real-Time Intelligence Feed',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: META.aiDesk.title,
    description: META.aiDesk.description,
    site: SITE_CONFIG.twitter,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/ai-desk`,
    languages: {
      'en': '/ai-desk',
      'sr': '/sr/ai-desk',
      'x-default': '/ai-desk',
    },
  },
};

export default function AIDeskPage() {
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
      
      <main className="min-h-screen bg-bg relative overflow-x-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 relative">
          {/* Page Header - SSR for fast LCP */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/30 shadow-lg shadow-accent/10">
                <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div>
                <span className="text-accent text-xs font-semibold uppercase tracking-wider block mb-0.5">AI-Powered</span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Sports Desk</h1>
              </div>
            </div>
          </div>

          {/* Main Layout: Chat Hero + Feed Sidebar (with auth gate) */}
          <AIDeskClient />

          {/* Mobile: Feature badges (visible on mobile, hidden on desktop) */}
          <div className="flex flex-wrap gap-2 mt-6 lg:hidden">
            <span className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-semibold rounded-full border border-accent/20 flex items-center gap-1.5">
              <span>⚡</span> Real-Time Data
            </span>
            <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20 flex items-center gap-1.5">
              <span>🤖</span> GPT-4 + Perplexity
            </span>
            <span className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-semibold rounded-full border border-accent/20 flex items-center gap-1.5">
              <span>📡</span> Auto Intel Feed
            </span>
          </div>
        </div>
      </main>
    </>
  );
}
