/**
 * Serbian Layout for SportBot AI
 * 
 * Layout for Serbian language pages with proper SEO
 */

import type { Metadata } from 'next';
import { SITE_CONFIG, OG_DEFAULTS } from '@/lib/seo';

// Serbian SEO metadata
export const metadata: Metadata = {
  title: {
    default: 'SportBot AI - AI Sportska Analiza | Razumi Mečeve za 60 Sekundi',
    template: '%s | SportBot AI',
  },
  description: 'Pred-utakmična inteligencija: naslovi, forma, H2H istorija i AI uvidi. Fudbal, NBA, NFL, NHL i UFC—sve za 60 sekundi.',
  keywords: [
    'sportska analiza',
    'ai analiza meceva',
    'fudbal predikcije',
    'nba analiza',
    'kvote analiza',
    'sportsko kladjenje',
    'forma timova',
    'head to head statistika',
    'ai sportski asistent',
  ],
  
  // Canonical for Serbian
  alternates: {
    canonical: '/sr',
    languages: {
      'en': '/',
      'sr': '/sr',
    },
  },
  
  // Open Graph for Serbian
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    url: `${SITE_CONFIG.url}/sr`,
    siteName: 'SportBot AI',
    title: 'SportBot AI - AI Sportska Analiza',
    description: 'Pred-utakmična inteligencija: naslovi, forma, H2H istorija i AI uvidi. Fudbal, NBA, NFL, NHL i UFC—sve za 60 sekundi.',
    images: OG_DEFAULTS.images,
  },
  
  // Twitter for Serbian
  twitter: {
    card: 'summary_large_image',
    title: 'SportBot AI - AI Sportska Analiza',
    description: 'Pred-utakmična inteligencija sa AI analizom. Razumi bilo koji meč za 60 sekundi.',
    images: OG_DEFAULTS.images,
  },
};

export default function SerbianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
