/**
 * Market Alerts Page - Serbian Version (/sr/market-alerts)
 * 
 * Premium feature showing value edges and steam moves.
 * Redirects to English version but preserves Serbian locale for auth.
 */

import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/seo';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Tržišni Alarmi - Premium Analitika',
  description: 'Premium tržišni alarmi sa vrednosnim ivicama i steam pokretima. AI analiza sportskih kvota i otkrivanje vrednosti u realnom vremenu.',
  keywords: ['tržišni alarmi', 'vrednosne ivice', 'steam pokreti', 'sportske kvote', 'AI analiza', 'premium'],
  openGraph: {
    title: 'Tržišni Alarmi',
    description: 'Premium tržišni alarmi sa AI analizom sportskih kvota.',
    url: `${SITE_CONFIG.url}/sr/market-alerts`,
    siteName: SITE_CONFIG.name,
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-market-alerts.png`,
        width: 1200,
        height: 630,
        alt: 'Tržišni Alarmi - Premium Analitika',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tržišni Alarmi',
    description: 'Premium tržišni alarmi sa AI analizom sportskih kvota.',
    site: SITE_CONFIG.twitter,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/sr/market-alerts`,
    languages: {
      'en': `${SITE_CONFIG.url}/market-alerts`,
      'sr': `${SITE_CONFIG.url}/sr/market-alerts`,
      'x-default': `${SITE_CONFIG.url}/market-alerts`,
    },
  },
};

// Check auth and redirect appropriately
export default async function SerbianMarketAlertsPage() {
  const session = await getServerSession(authOptions);
  
  // If not logged in, redirect to Serbian login
  if (!session) {
    redirect('/sr/login?callbackUrl=/sr/market-alerts');
  }
  
  // If logged in, redirect to English market-alerts (the actual page)
  redirect('/market-alerts');
}
