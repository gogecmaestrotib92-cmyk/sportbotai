/**
 * Match Preview Page - The Core Product V3
 * 
 * Premium, minimal match intelligence.
 * Clean design that works across ALL sports.
 * Zero betting advice. Pure understanding.
 * 
 * "Find where the market is wrong"
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MatchPreviewClientV3 from './MatchPreviewClientV3';
import { getFastMatchData } from '@/lib/match-preview-server';

interface PageProps {
  params: Promise<{ matchId: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchId } = await params;
  
  return {
    title: `Match Analysis | SportBot AI`,
    description: 'Premium match intelligence powered by AI. Find where the market is wrong.',
    alternates: {
      canonical: `/match/${matchId}`,
      languages: {
        'en': `/match/${matchId}`,
        'sr': `/sr/match/${matchId}`,
        'x-default': `/match/${matchId}`,
      },
    },
    openGraph: {
      title: `Match Analysis | SportBot AI`,
      description: 'Premium match intelligence powered by AI',
      type: 'article',
    },
  };
}

export default async function MatchPreviewPage({ params }: PageProps) {
  const { matchId } = await params;
  
  if (!matchId) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isAnonymous = !session?.user;
  
  // Try to get fast data on server to improve LCP
  const initialData = await getFastMatchData(matchId, isAnonymous);

  return <MatchPreviewClientV3 matchId={matchId} initialData={initialData} />;
}
