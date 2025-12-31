/**
 * Match Preview Page - Serbian Version (/sr/match/[matchId])
 * 
 * Premium, minimal match intelligence in Serbian.
 * Uses the same MatchPreviewClientV3 component with locale prop.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MatchPreviewClientV3 from '@/app/match/[matchId]/MatchPreviewClientV3';

interface PageProps {
  params: Promise<{ matchId: string }>;
}

// Generate metadata for SEO in Serbian
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchId } = await params;
  
  return {
    title: `Analiza Meča | SportBot AI`,
    description: 'Premium analiza mečeva pokretana AI-jem. Razumi bilo koji meč za 60 sekundi.',
    openGraph: {
      title: `Analiza Meča | SportBot AI`,
      description: 'Premium analiza mečeva pokretana AI-jem',
      type: 'article',
    },
  };
}

export default async function MatchPreviewPageSR({ params }: PageProps) {
  const { matchId } = await params;
  
  if (!matchId) {
    notFound();
  }

  return <MatchPreviewClientV3 matchId={matchId} locale="sr" />;
}
