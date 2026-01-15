/**
 * NFL Landing Page (/nfl)
 * 
 * SEO-optimized page targeting "NFL lines", "NFL odds", "NFL betting lines"
 * Shows this week's NFL games with links to match analysis.
 */

import { Metadata } from 'next';
import MatchBrowser from '@/components/MatchBrowser';
import { SITE_CONFIG } from '@/lib/seo';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
    title: 'NFL Lines & Odds Today - Football Betting Analysis | SportBot AI',
    description: 'Get this week\'s NFL lines, betting odds, and AI-powered analysis for every football game. Live spreads, moneylines, totals, and value detection for NFL betting.',
    keywords: ['nfl lines', 'nfl odds', 'nfl betting odds', 'nfl spreads', 'nfl moneyline', 'football odds today', 'nfl betting lines', 'nfl point spreads'],
    openGraph: {
        title: 'NFL Lines & Odds Today | SportBot AI',
        description: 'This week\'s NFL betting lines with AI analysis. Live spreads, moneylines, and value detection.',
        url: `${SITE_CONFIG.url}/nfl`,
        siteName: SITE_CONFIG.name,
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'NFL Lines & Odds Today | SportBot AI',
        description: 'This week\'s NFL betting lines with AI analysis.',
    },
    alternates: {
        canonical: `${SITE_CONFIG.url}/nfl`,
    },
};

// Fetch upcoming NFL matches for SSR SEO content
async function getNflMatches() {
    try {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const matches = await prisma.oddsSnapshot.findMany({
            where: {
                sport: 'americanfootball',
                matchDate: {
                    gte: now,
                    lte: nextWeek,
                },
            },
            select: {
                homeTeam: true,
                awayTeam: true,
                league: true,
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

export default async function NflPage() {
    const nflMatches = await getNflMatches();
    const matchCount = nflMatches.length;

    const nflSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'NFL Lines & Odds Today',
        description: 'Live NFL betting lines, spreads, moneylines, and AI-powered analysis for this week\'s football games.',
        url: `${SITE_CONFIG.url}/nfl`,
        mainEntity: {
            '@type': 'SportsOrganization',
            name: 'NFL',
            sport: 'American Football',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(nflSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

                {/* Hero Section */}
                <section className="relative border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">🏈</span>
                                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full border border-green-500/20">
                                        FOOTBALL
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
                                    NFL Lines & Odds
                                </h1>
                                <p className="text-text-secondary text-base max-w-xl">
                                    This week&apos;s NFL betting lines with AI-powered analysis. Get spreads, moneylines,
                                    totals, and value detection for every game.
                                </p>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-2">
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                    <span>Live odds data</span>
                                </div>
                                {matchCount > 0 && (
                                    <div className="text-sm text-gray-400">
                                        <strong className="text-white">{matchCount}</strong> games this week
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SSR Content for SEO */}
                {nflMatches.length > 0 && (
                    <div className="sr-only">
                        <h2>This Week&apos;s NFL Games & Betting Lines</h2>
                        <p>
                            Get AI analysis for this week&apos;s NFL matchups. Our system analyzes spreads,
                            moneylines, and totals to detect potential value in NFL betting markets.
                        </p>
                        {nflMatches.map((match, i) => (
                            <p key={i}>
                                {match.homeTeam} vs {match.awayTeam} - NFL odds and betting analysis
                            </p>
                        ))}
                    </div>
                )}

                {/* Match Browser - Filtered to American Football/NFL */}
                <MatchBrowser
                    initialSport="americanfootball"
                    initialLeague="americanfootball_nfl"
                    maxMatches={24}
                />

                {/* SEO Content Section */}
                <section className="border-t border-white/10 mt-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            NFL Betting Lines Explained
                        </h2>

                        <div className="space-y-6 text-gray-400">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Point Spreads</h3>
                                <p>
                                    NFL spreads are the most popular way to bet on football. A spread of -7 means
                                    the favorite must win by 8+ points to cover. Key numbers like 3, 7, and 10 are
                                    especially important in football due to scoring patterns.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Moneylines</h3>
                                <p>
                                    NFL moneylines let you bet on the outright winner. Underdogs can offer
                                    significant value, especially in divisional games where familiarity
                                    often leads to closer matchups.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Totals (Over/Under)</h3>
                                <p>
                                    NFL totals typically range from 35-55 points. Weather conditions,
                                    defensive matchups, and pace of play are key factors our AI considers
                                    when analyzing over/under value.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
