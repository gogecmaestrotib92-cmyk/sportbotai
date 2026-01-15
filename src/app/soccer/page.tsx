/**
 * Soccer Landing Page (/soccer)
 * 
 * SEO-optimized page targeting "soccer odds", "premier league odds", "football betting"
 * Shows today's soccer games with links to match analysis.
 */

import { Metadata } from 'next';
import MatchBrowser from '@/components/MatchBrowser';
import { SITE_CONFIG } from '@/lib/seo';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
    title: 'Soccer Odds & Lines Today - Premier League, La Liga & More | SportBot AI',
    description: 'Get today\'s soccer odds, betting lines, and AI-powered analysis for every match. Premier League, La Liga, Champions League odds with value detection.',
    keywords: ['soccer odds', 'premier league odds', 'football betting odds', 'soccer betting', 'epl odds', 'la liga odds', 'champions league betting'],
    openGraph: {
        title: 'Soccer Odds & Lines Today | SportBot AI',
        description: 'Today\'s soccer betting odds with AI analysis. Premier League, La Liga, Champions League, and more.',
        url: `${SITE_CONFIG.url}/soccer`,
        siteName: SITE_CONFIG.name,
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Soccer Odds & Lines Today | SportBot AI',
        description: 'Today\'s soccer betting odds with AI analysis.',
    },
    alternates: {
        canonical: `${SITE_CONFIG.url}/soccer`,
    },
};

// Fetch today's soccer matches for SSR SEO content
async function getSoccerMatches() {
    try {
        const now = new Date();
        const endOfTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const matches = await prisma.oddsSnapshot.findMany({
            where: {
                sport: 'soccer',
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
            take: 20,
            distinct: ['homeTeam', 'awayTeam'],
        });

        return matches;
    } catch {
        return [];
    }
}

export default async function SoccerPage() {
    const soccerMatches = await getSoccerMatches();
    const matchCount = soccerMatches.length;

    const soccerSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Soccer Odds & Lines Today',
        description: 'Live soccer betting odds, lines, and AI-powered analysis for today\'s football matches.',
        url: `${SITE_CONFIG.url}/soccer`,
        mainEntity: {
            '@type': 'SportsOrganization',
            name: 'Various Soccer Leagues',
            sport: 'Soccer',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(soccerSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

                {/* Hero Section */}
                <section className="relative border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-violet/5 to-transparent" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">⚽</span>
                                    <span className="px-3 py-1 bg-violet/10 text-violet-400 text-xs font-semibold rounded-full border border-violet/20">
                                        SOCCER
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
                                    Soccer Odds & Lines Today
                                </h1>
                                <p className="text-text-secondary text-base max-w-xl">
                                    Today&apos;s soccer betting odds with AI-powered analysis. Premier League, La Liga,
                                    Champions League, Bundesliga, and more.
                                </p>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-2">
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                    <span>Live odds data</span>
                                </div>
                                {matchCount > 0 && (
                                    <div className="text-sm text-gray-400">
                                        <strong className="text-white">{matchCount}</strong> matches today
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SSR Content for SEO */}
                {soccerMatches.length > 0 && (
                    <div className="sr-only">
                        <h2>Today&apos;s Soccer Matches & Betting Odds</h2>
                        <p>
                            Get AI analysis for today&apos;s soccer matchups. Our system analyzes match odds,
                            over/under, and both teams to score markets to detect potential value.
                        </p>
                        {soccerMatches.map((match, i) => (
                            <p key={i}>
                                {match.homeTeam} vs {match.awayTeam} - {match.league} odds and betting analysis
                            </p>
                        ))}
                    </div>
                )}

                {/* Match Browser - Filtered to Soccer */}
                <MatchBrowser
                    initialSport="soccer"
                    maxMatches={24}
                />

                {/* SEO Content Section */}
                <section className="border-t border-white/10 mt-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            Soccer Betting Markets Explained
                        </h2>

                        <div className="space-y-6 text-gray-400">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Match Result (1X2)</h3>
                                <p>
                                    The most popular soccer bet—pick the home win (1), draw (X), or away win (2).
                                    Unlike American sports, draws are common in soccer, typically occurring in
                                    25-30% of matches. Our AI analyzes team form and head-to-head records.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Over/Under Goals</h3>
                                <p>
                                    Bet on the total goals scored. The most common line is Over/Under 2.5 goals.
                                    We analyze attacking and defensive stats, recent scoring trends, and
                                    league-specific patterns to identify value.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Both Teams to Score (BTTS)</h3>
                                <p>
                                    A popular market betting on whether both teams will find the net.
                                    Our analysis considers clean sheet records, defensive vulnerabilities,
                                    and attacking form to assess BTTS value.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
