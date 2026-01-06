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
  
  // Try to extract team names from matchId for unique meta description
  const teamNames = matchId.split('-vs-').map(team => 
    team.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  );
  
  const uniqueTitle = teamNames.length === 2 
    ? `${teamNames[0]} vs ${teamNames[1]} - Analiza | SportBot AI`
    : `Analiza Meča ${matchId} | SportBot AI`;
    
  const uniqueDescription = teamNames.length === 2
    ? `Detaljne AI analize za ${teamNames[0]} vs ${teamNames[1]}. Forma, H2H statistika, ključni igrači i predikcije za ovaj meč.`
    : 'Detaljne AI analize sa formom timova, H2H statistikom, ključnim igračima i predikcijama za ovaj meč.';
  
  return {
    title: uniqueTitle,
    description: uniqueDescription,
    alternates: {
      canonical: `/sr/match/${matchId}`,
      languages: {
        'en': `/match/${matchId}`,
        'sr': `/sr/match/${matchId}`,
        'x-default': `/match/${matchId}`,
      },
    },
    openGraph: {
      title: uniqueTitle,
      description: uniqueDescription,
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
