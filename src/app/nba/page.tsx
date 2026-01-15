/**
 * NBA Landing Page (/nba)
 * 
 * SEO-optimized page targeting "NBA odds", "NBA lines", "NBA betting odds"
 * Shows today's NBA games with links to match analysis.
 */

import { Metadata } from 'next';
import MatchBrowser from '@/components/MatchBrowser';
import { SITE_CONFIG } from '@/lib/seo';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
    title: 'NBA Odds & Lines Today - Live Basketball Betting Analysis | SportBot AI',
    description: 'Get today\'s NBA odds, betting lines, and AI-powered analysis for every basketball game. Live spreads, moneylines, totals, and value detection for NBA betting.',
    keywords: ['nba odds', 'nba lines', 'nba betting odds', 'nba spreads', 'nba moneyline', 'basketball odds today', 'nba betting lines', 'nba point spreads'],
    openGraph: {
        title: 'NBA Odds & Lines Today | SportBot AI',
        description: 'Today\'s NBA betting odds with AI analysis. Live spreads, moneylines, and value detection.',
        url: `${SITE_CONFIG.url}/nba`,
        siteName: SITE_CONFIG.name,
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'NBA Odds & Lines Today | SportBot AI',
        description: 'Today\'s NBA betting odds with AI analysis.',
    },
    alternates: {
        canonical: `${SITE_CONFIG.url}/nba`,
    },
};

// Fetch today's NBA matches for SSR SEO content
async function getNbaMatches() {
    try {
        const now = new Date();
        const endOfTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const matches = await prisma.oddsSnapshot.findMany({
            where: {
                sport: 'basketball',
                matchDate: {
                    gte: now,
                    lte: endOfTomorrow,
                },
            },
            select: {
                homeTeam: true,
                awayTeam: true,
                league: true,
                matchDate: true,
            },
            orderBy: { matchDate: 'asc' },
            take: 15,
            distinct: ['homeTeam', 'awayTeam'],
        });

        return matches;
    } catch {
        return [];
    }
}

export default async function NbaPage() {
    const nbaMatches = await getNbaMatches();
    const matchCount = nbaMatches.length;

    // Schema markup for NBA odds page
    const nbaSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'NBA Odds & Lines Today',
        description: 'Live NBA betting odds, spreads, moneylines, and AI-powered analysis for today\'s basketball games.',
        url: `${SITE_CONFIG.url}/nba`,
        mainEntity: {
            '@type': 'SportsOrganization',
            name: 'NBA',
            sport: 'Basketball',
        },
    };

    return (
        <>
            {/* Schema Markup */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(nbaSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-hidden">
                {/* Ambient Background Glows */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

                {/* Hero Section */}
                <section className="relative border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">🏀</span>
                                    <span className="px-3 py-1 bg-orange-500/10 text-orange-400 text-xs font-semibold rounded-full border border-orange-500/20">
                                        BASKETBALL
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
                                    NBA Odds & Lines Today
                                </h1>
                                <p className="text-text-secondary text-base max-w-xl">
                                    Live NBA betting odds with AI-powered analysis. Get spreads, moneylines, totals,
                                    and value detection for every game.
                                </p>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-2">
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                    <span>Live odds data</span>
                                </div>
                                {matchCount > 0 && (
                                    <div className="text-sm text-gray-400">
                                        <strong className="text-white">{matchCount}</strong> games today
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SSR Content for SEO - Hidden visually but readable by crawlers */}
                {nbaMatches.length > 0 && (
                    <div className="sr-only">
                        <h2>Today&apos;s NBA Games & Betting Lines</h2>
                        <p>
                            Get AI analysis for today&apos;s NBA matchups. Our system analyzes spreads,
                            moneylines, and totals to detect potential value in NBA betting markets.
                        </p>
                        {nbaMatches.map((match, i) => (
                            <p key={i}>
                                {match.homeTeam} vs {match.awayTeam} - NBA odds and betting analysis
                            </p>
                        ))}
                    </div>
                )}

                {/* Match Browser - Filtered to Basketball/NBA */}
                <MatchBrowser
                    initialSport="basketball"
                    initialLeague="basketball_nba"
                    maxMatches={24}
                />

                {/* SEO Content Section */}
                <section className="border-t border-white/10 mt-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            NBA Betting Odds Explained
                        </h2>

                        <div className="space-y-6 text-gray-400">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Point Spreads</h3>
                                <p>
                                    NBA point spreads level the playing field between favorites and underdogs.
                                    A spread of -6.5 means the favorite must win by 7+ points to cover.
                                    Our AI analyzes recent form, home/away performance, and injury reports to assess spread value.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Moneylines</h3>
                                <p>
                                    NBA moneylines let you pick the straight-up winner. Odds like -180 mean
                                    betting $180 to win $100 on the favorite. We compare implied probabilities
                                    with our AI predictions to detect mispriced lines.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Totals (Over/Under)</h3>
                                <p>
                                    NBA totals typically range from 210-240 points. Our analysis considers
                                    pace factors, defensive efficiency, and recent scoring trends to identify
                                    value on overs and unders.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
