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
      
      <main className="min-h-screen bg-bg relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 relative">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/30 shadow-lg shadow-accent/10">
                <span className="text-2xl">🧠</span>
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
