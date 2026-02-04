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
  return (
    <main className="min-h-screen bg-bg">
      <EditorialPicksContent locale="sr" />
    </main>
  );
}
