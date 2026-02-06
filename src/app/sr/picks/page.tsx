/**
 * /sr/picks - Serbian Editorial Daily Picks Page
 */

import { Metadata } from 'next';
import EditorialPicksContent from '@/app/picks/EditorialPicksContent';
import { SITE_CONFIG } from '@/lib/seo';

function getDateString() {
  return new Date().toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const dateStr = getDateString();
  
  return {
    title: `Današnji AI Pikovi - ${dateStr} | SportBot AI`,
    description: `Top 3 AI predikcije sa visokim poverenjem za ${dateStr}. Detaljna analiza forme, H2H, povreda i tržišnih informacija.`,
    keywords: ['sportske predikcije', 'AI pikovi', 'kladjenje', 'fudbal predikcije', 'NBA pikovi', 'dnevni pikovi'],
    openGraph: {
      title: `Današnji AI Pikovi - ${dateStr}`,
      description: 'Top 3 AI predikcije sa detaljnom analizom.',
      url: `${SITE_CONFIG.url}/sr/picks`,
      siteName: SITE_CONFIG.name,
      type: 'article',
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/sr/picks`,
      languages: {
        'en': '/picks',
        'sr': '/sr/picks',
        'x-default': '/picks',
      },
    },
  };
}

export default function PicksPageSR() {
  const dateStr = getDateString();
  const isoDate = new Date().toISOString().split('T')[0];
  
  // Schema.org structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Današnji AI Sportski Pikovi - ${dateStr}`,
    description: 'Top AI predikcije sa visokim poverenjem i detaljnom analizom.',
    datePublished: isoDate,
    dateModified: isoDate,
    inLanguage: 'sr',
    author: {
      '@type': 'Organization',
      name: 'SportBot AI',
      url: 'https://www.sportbotai.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SportBot AI',
      url: 'https://www.sportbotai.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.sportbotai.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://www.sportbotai.com/sr/picks',
    },
    about: {
      '@type': 'Thing',
      name: 'Sportske Predikcije',
    },
  };

  return (
    <main className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EditorialPicksContent locale="sr" />
    </main>
  );
}
