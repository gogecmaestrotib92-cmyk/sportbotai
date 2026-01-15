/**
 * NHL Landing Page (/nhl)
 * 
 * SEO-optimized page targeting "NHL odds", "NHL betting odds", "hockey odds"
 * Shows today's NHL games with links to match analysis.
 */

import { Metadata } from 'next';
import MatchBrowser from '@/components/MatchBrowser';
import { SITE_CONFIG } from '@/lib/seo';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
    title: 'NHL Odds & Lines Today - Hockey Betting Analysis | SportBot AI',
    description: 'Get today\'s NHL odds, puck lines, and AI-powered analysis for every hockey game. Live moneylines, totals, and value detection for NHL betting.',
    keywords: ['nhl odds', 'nhl betting odds', 'hockey odds', 'nhl puck line', 'nhl moneyline', 'hockey betting', 'nhl lines today'],
    openGraph: {
        title: 'NHL Odds & Lines Today | SportBot AI',
        description: 'Today\'s NHL betting odds with AI analysis. Live puck lines, moneylines, and value detection.',
        url: `${SITE_CONFIG.url}/nhl`,
        siteName: SITE_CONFIG.name,
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'NHL Odds & Lines Today | SportBot AI',
        description: 'Today\'s NHL betting odds with AI analysis.',
    },
    alternates: {
        canonical: `${SITE_CONFIG.url}/nhl`,
    },
};

// Fetch today's NHL matches for SSR SEO content
async function getNhlMatches() {
    try {
        const now = new Date();
        const endOfTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const matches = await prisma.oddsSnapshot.findMany({
            where: {
                sport: 'icehockey',
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

export default async function NhlPage() {
    const nhlMatches = await getNhlMatches();
    const matchCount = nhlMatches.length;

    const nhlSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'NHL Odds & Lines Today',
        description: 'Live NHL betting odds, puck lines, moneylines, and AI-powered analysis for today\'s hockey games.',
        url: `${SITE_CONFIG.url}/nhl`,
        mainEntity: {
            '@type': 'SportsOrganization',
            name: 'NHL',
            sport: 'Ice Hockey',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(nhlSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

                {/* Hero Section */}
                <section className="relative border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">🏒</span>
                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20">
                                        HOCKEY
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
                                    NHL Odds & Lines Today
                                </h1>
                                <p className="text-text-secondary text-base max-w-xl">
                                    Today&apos;s NHL betting odds with AI-powered analysis. Get puck lines, moneylines,
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
                                        <strong className="text-white">{matchCount}</strong> games today
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SSR Content for SEO */}
                {nhlMatches.length > 0 && (
                    <div className="sr-only">
                        <h2>Today&apos;s NHL Games & Betting Odds</h2>
                        <p>
                            Get AI analysis for today&apos;s NHL matchups. Our system analyzes puck lines,
                            moneylines, and totals to detect potential value in NHL betting markets.
                        </p>
                        {nhlMatches.map((match, i) => (
                            <p key={i}>
                                {match.homeTeam} vs {match.awayTeam} - NHL odds and betting analysis
                            </p>
                        ))}
                    </div>
                )}

                {/* Match Browser - Filtered to Hockey/NHL */}
                <MatchBrowser
                    initialSport="hockey"
                    initialLeague="icehockey_nhl"
                    maxMatches={24}
                />

                {/* SEO Content Section */}
                <section className="border-t border-white/10 mt-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            NHL Betting Odds Explained
                        </h2>

                        <div className="space-y-6 text-gray-400">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Puck Line</h3>
                                <p>
                                    The NHL puck line is typically set at -1.5 for favorites. This means the
                                    favorite must win by 2+ goals to cover. Puck line betting offers better
                                    odds on favorites at the cost of needing a larger margin of victory.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Moneylines</h3>
                                <p>
                                    NHL moneylines are popular due to hockey&apos;s competitive nature—underdogs
                                    win more frequently than in other sports. Our AI analyzes goaltender
                                    matchups, home ice advantage, and recent form.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Totals (Over/Under)</h3>
                                <p>
                                    NHL totals typically range from 5.5-7 goals. Back-to-back games, goalie
                                    performance, and team scoring trends are key factors in our analysis.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
