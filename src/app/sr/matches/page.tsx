/**
 * Matches Page - Serbian Version (/sr/matches)
 * 
 * Browse all upcoming matches by league.
 * The main match discovery page in Serbian.
 */

import { Metadata } from 'next';
import MatchBrowserI18n from '@/components/MatchBrowserI18n';
import { SITE_CONFIG, getMatchAnalyzerSchema, getMatchesBreadcrumb } from '@/lib/seo';
import { getTranslations } from '@/lib/i18n/translations';
import { prisma } from '@/lib/prisma';

const t = getTranslations('sr');

// Dynamic metadata to handle query params for proper hreflang
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { league?: string };
}): Promise<Metadata> {
  const leagueParam = searchParams.league ? `?league=${searchParams.league}` : '';
  const leagueTitle = searchParams.league 
    ? ` - ${searchParams.league.toUpperCase()} Mečevi` 
    : '';

  return {
    title: `Pregledaj Mečeve${leagueTitle} | SportBot AI`,
    description: 'Pregledaj sve predstojeće sportske mečeve sa AI analizom. Fudbal, NBA, NFL, NHL i UFC - sve na jednom mestu sa podacima uživo.',
    keywords: ['sportski mečevi', 'fudbal uživo', 'kvote', 'analiza mečeva', 'AI predikcije', 'sportsko klađenje'],
    openGraph: {
      title: `Pregledaj Mečeve${leagueTitle} | SportBot AI`,
      description: 'Pregledaj sve predstojeće sportske mečeve sa AI analizom.',
      url: `${SITE_CONFIG.url}/sr/matches${leagueParam}`,
      siteName: SITE_CONFIG.name,
      type: 'website',
      images: [
        {
          url: `${SITE_CONFIG.url}/og-matches.png`,
          width: 1200,
          height: 630,
          alt: 'Pregledaj Mečeve - AI Analiza Sportova',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Pregledaj Mečeve | SportBot AI',
      description: 'Pregledaj sve predstojeće sportske mečeve sa AI analizom.',
      site: SITE_CONFIG.twitter,
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/sr/matches${leagueParam}`,
      languages: {
        'en': `/matches${leagueParam}`,
        'sr': `/sr/matches${leagueParam}`,
        'x-default': `/matches${leagueParam}`,
      },
    },
  };
}

// Fetch upcoming matches for SSR SEO content
async function getUpcomingMatches() {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const matches = await prisma.oddsSnapshot.findMany({
      where: {
        matchDate: {
          gte: now,
          lte: tomorrow,
        },
      },
      select: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        sport: true,
        matchDate: true,
      },
      orderBy: { matchDate: 'asc' },
      take: 20,
      distinct: ['homeTeam', 'awayTeam'],
    });

    return matches;
  } catch {
    return [];
  }
}

export default async function MatchesPageSr({
  searchParams,
}: {
  searchParams: { league?: string };
}) {
  const jsonLd = getMatchAnalyzerSchema();
  const breadcrumbSchema = getMatchesBreadcrumb();

  // Pre-fetch matches for SEO
  const upcomingMatches = await getUpcomingMatches();

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

      <div className="min-h-screen bg-bg relative overflow-hidden" style={{ contain: 'layout' }}>
        {/* Ambient Background Glows - fixed position to prevent CLS */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" style={{ contain: 'strict' }} />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" style={{ contain: 'strict' }} />

        {/* Header */}
        <section className="relative border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-violet/5 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 tracking-tight">
                  Pregledaj Mečeve
                </h1>
                <p className="text-text-secondary text-sm">
                  Izaberi bilo koji predstojeći meč za pred-utakmični brifing
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span>Podaci uživo iz 4 glavna sporta</span>
              </div>
            </div>
          </div>
        </section>

        {/* SSR Content for SEO - Hidden visually but readable by crawlers */}
        {upcomingMatches.length > 0 && (
          <noscript>
            <section className="max-w-7xl mx-auto px-4 py-8">
              <h2 className="text-xl font-bold text-white mb-4">Predstojeći Mečevi</h2>
              <p className="text-zinc-400 mb-6">
                Dobijte AI-analizu za predstojeće mečeve iz Premier Lige, NBA, NFL, NHL i drugih liga.
              </p>
              <ul className="space-y-2">
                {upcomingMatches.map((match, i) => (
                  <li key={i} className="text-zinc-300">
                    <strong>{match.homeTeam}</strong> vs <strong>{match.awayTeam}</strong>
                    {match.league && <span className="text-zinc-500"> — {match.league}</span>}
                  </li>
                ))}
              </ul>
            </section>
          </noscript>
        )}

        {/* Server-rendered SEO text (visible but minimal) */}
        <div className="sr-only">
          <h2>Predstojeći Sportski Mečevi za AI Analizu</h2>
          <p>Pregledajte predstojeće mečeve iz Premier Lige, La Lige, NBA, NFL, NHL i drugih velikih sportskih liga.
            Dobijte AI-analizu pre meča, podatke o formi, međusobne rezultate i detekciju vrednosnih kvota.</p>
          {upcomingMatches.slice(0, 10).map((match, i) => (
            <p key={i}>{match.homeTeam} vs {match.awayTeam} - {match.league} analiza meča</p>
          ))}
        </div>

        {/* Match Browser */}
        <MatchBrowserI18n maxMatches={24} locale="sr" initialLeague={searchParams.league} />
      </div>
    </>
  );
}
