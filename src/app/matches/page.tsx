import { Metadata } from 'next';
import MatchBrowser from '@/components/MatchBrowser';
import { META, SITE_CONFIG, getMatchAnalyzerSchema, getMatchesBreadcrumb } from '@/lib/seo';
import { prisma } from '@/lib/prisma';

// Dynamic metadata to handle query params for proper hreflang
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { league?: string };
}): Promise<Metadata> {
  const leagueParam = searchParams.league ? `?league=${searchParams.league}` : '';
  const leagueTitle = searchParams.league 
    ? ` - ${searchParams.league.toUpperCase()} Matches` 
    : '';

  return {
    title: `${META.matches.title}${leagueTitle}`,
    description: META.matches.description,
    keywords: META.matches.keywords,
    openGraph: {
      title: `${META.matches.title}${leagueTitle}`,
      url: `${SITE_CONFIG.url}/matches${leagueParam}`,
      siteName: SITE_CONFIG.name,
      type: 'website',
      images: [
        {
          url: `${SITE_CONFIG.url}/og-matches.png`,
          width: 1200,
          height: 630,
          alt: 'Browse Matches - AI Sports Analysis Tool',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: META.matches.title,
      description: META.matches.description,
      site: SITE_CONFIG.twitter,
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/matches${leagueParam}`,
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

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: { league?: string };
}) {
  const jsonLd = getMatchAnalyzerSchema();
  const breadcrumbSchema = getMatchesBreadcrumb();

  // Pre-fetch matches for SEO (server-rendered content for crawlers)
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

      <div className="min-h-screen bg-bg relative overflow-x-hidden" style={{ contain: 'layout' }}>
        {/* Ambient Background Glows - hidden on mobile to prevent CLS */}
        <div className="hidden md:block absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />
        <div className="hidden md:block absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />

        {/* Header */}
        <section className="relative border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-violet/5 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 tracking-tight">
                  Browse Matches
                </h1>
                <p className="text-text-secondary text-sm">
                  Select any upcoming match to get your pre-match intelligence briefing
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span>Live data from 4 major sports</span>
              </div>
            </div>
          </div>
        </section>

        {/* SSR Content for SEO - Hidden visually but readable by crawlers */}
        {upcomingMatches.length > 0 && (
          <noscript>
            <section className="max-w-7xl mx-auto px-4 py-8">
              <h2 className="text-xl font-bold text-white mb-4">Upcoming Matches</h2>
              <p className="text-zinc-400 mb-6">
                Get AI-powered analysis for these upcoming matches across Premier League, NBA, NFL, NHL and more.
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
          <h2>Upcoming Sports Matches for AI Analysis</h2>
          <p>Browse upcoming matches from Premier League, La Liga, NBA, NFL, NHL and other major sports leagues.
            Get AI-powered pre-match analysis, form data, head-to-head records, and betting value detection.</p>
          {upcomingMatches.slice(0, 10).map((match, i) => (
            <p key={i}>{match.homeTeam} vs {match.awayTeam} - {match.league} match analysis</p>
          ))}
        </div>

        {/* Match Browser (Client Component) */}
        <MatchBrowser maxMatches={24} initialLeague={searchParams.league} />
      </div>
    </>
  );
}
