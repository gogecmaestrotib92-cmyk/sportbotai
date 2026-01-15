/**
 * NFL Landing Page (/nfl)
 * 
 * Premium SEO-optimized page targeting "NFL lines", "NFL odds"
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'NFL Lines & Odds Today',
    description: 'Get this week\'s NFL lines, betting odds, and AI-powered analysis for every football game. Live spreads, moneylines, totals, and value detection.',
    keywords: ['nfl lines', 'nfl odds', 'nfl betting odds', 'nfl spreads', 'nfl moneyline', 'football odds today', 'nfl betting lines'],
    openGraph: {
        title: 'NFL Lines & Odds Today | SportBot AI',
        description: 'This week\'s NFL betting lines with AI analysis.',
        url: 'https://sportbotai.com/nfl',
        type: 'website',
    },
    alternates: {
        canonical: 'https://sportbotai.com/nfl',
    },
};

// Icons
const SpreadIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18M8 6v12M16 6v12" />
    </svg>
);

const MoneylineIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TotalsIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
);

const NFL_LEAGUES = [
    { key: 'americanfootball_nfl', name: 'NFL' },
    { key: 'americanfootball_ncaaf', name: 'NCAA Football' },
];

const nflSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NFL Lines & Odds Today',
    description: 'Live NFL betting lines with AI analysis.',
    url: 'https://sportbotai.com/nfl',
};

export default function NflPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(nflSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Hero */}
                <section className="relative border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
                        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <span>/</span>
                            <Link href="/matches" className="hover:text-white transition-colors">Matches</Link>
                            <span>/</span>
                            <span className="text-white">NFL</span>
                        </nav>

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-4xl">🏈</span>
                                    <span className="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-bold tracking-wider uppercase rounded-full border border-green-500/20">
                                        Football
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
                                    NFL Lines & Odds
                                </h1>
                                <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                    AI-powered analysis for every NFL game. Get spreads, moneylines,
                                    totals, and value detection.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-green-400">24/7</div>
                                    <div className="text-xs text-gray-400">Live Data</div>
                                </div>
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-accent">AI</div>
                                    <div className="text-xs text-gray-400">Powered</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <SportMatchGrid
                    sport="americanfootball"
                    leagues={NFL_LEAGUES}
                    accentColor="green-400"
                    maxMatches={12}
                />

                {/* Educational Content */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            NFL Betting Lines Explained
                        </h2>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-green-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-4">
                                        <SpreadIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Point Spreads</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        NFL spreads are the most popular way to bet. A -7 spread means the favorite must win by 8+ points.
                                        Key numbers like 3, 7, and 10 are crucial due to football scoring patterns.
                                    </p>
                                </div>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-green-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-4">
                                        <MoneylineIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Moneylines</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        NFL moneylines let you bet on outright winners. Underdogs can offer significant value,
                                        especially in divisional games where familiarity leads to closer matchups.
                                    </p>
                                </div>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-green-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-4">
                                        <TotalsIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Totals (O/U)</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        NFL totals range 35-55 points. Weather, defensive matchups, and pace are key factors
                                        our AI considers when analyzing over/under value.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 text-center">
                            <p className="text-gray-400 mb-4">Need help with betting math?</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Link href="/tools/odds-converter" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors">
                                    Odds Converter
                                </Link>
                                <Link href="/tools/parlay-calculator" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors">
                                    Parlay Calculator
                                </Link>
                                <Link href="/tools/hedge-calculator" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors">
                                    Hedge Calculator
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
