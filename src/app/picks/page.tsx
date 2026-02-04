/**
 * /picks - Editorial Daily Picks Page
 * 
 * Article-style content with 3 top confidence picks.
 * Full editorial writeups for SEO value.
 */

import { Metadata } from 'next';
import EditorialPicksContent from './EditorialPicksContent';
import { SITE_CONFIG } from '@/lib/seo';

// Generate dynamic date for title
function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const dateStr = getDateString();
  
  return {
    title: `Today's AI Picks - ${dateStr} | SportBot AI`,
    description: `Our AI model's top 3 high-confidence picks for ${dateStr}. Detailed analysis with form, H2H, injuries, and market intel for each match.`,
    keywords: [
      'sports predictions today',
      'AI picks',
      'betting predictions',
      'soccer predictions',
      'NBA picks today',
      'NFL predictions',
      'daily picks',
      dateStr,
    ],
    openGraph: {
      title: `Today's AI Picks - ${dateStr}`,
      description: "Our AI model's top 3 high-confidence picks with detailed analysis.",
      url: `${SITE_CONFIG.url}/picks`,
      siteName: SITE_CONFIG.name,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Today's AI Picks - ${dateStr}`,
      description: "Our AI model's top 3 high-confidence picks.",
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/picks`,
      languages: {
        'en': '/picks',
        'sr': '/sr/picks',
        'x-default': '/picks',
      },
    },
  };
}

export default function PicksPage() {
  return (
    <main className="min-h-screen bg-bg">
      <EditorialPicksContent locale="en" />
    </main>
  );
}
