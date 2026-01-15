/**
 * NHL Landing Page (/nhl)
 * 
 * Premium SEO-optimized page targeting "NHL odds", "hockey odds"
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'NHL Odds & Lines Today',
    description: 'Get today\'s NHL odds, puck lines, and AI-powered analysis for every hockey game. Live moneylines, totals, and value detection.',
    keywords: ['nhl odds', 'nhl betting odds', 'hockey odds', 'nhl puck line', 'nhl moneyline', 'hockey betting'],
    openGraph: {
        title: 'NHL Odds & Lines Today | SportBot AI',
        description: 'Today\'s NHL betting odds with AI analysis.',
        url: 'https://sportbotai.com/nhl',
        type: 'website',
    },
    alternates: {
        canonical: 'https://sportbotai.com/nhl',
    },
};

// Icons
const PuckLineIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M12 6v12M6 12h12" />
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

const NHL_LEAGUES = [
    { key: 'icehockey_nhl', name: 'NHL' },
];

const nhlSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NHL Odds & Lines Today',
    description: 'Live NHL betting odds with AI analysis.',
    url: 'https://sportbotai.com/nhl',
};

export default function NhlPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(nhlSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Hero */}
                <section className="relative border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
                        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <span>/</span>
                            <Link href="/matches" className="hover:text-white transition-colors">Matches</Link>
                            <span>/</span>
                            <span className="text-white">NHL</span>
                        </nav>

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-4xl">🏒</span>
                                    <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-wider uppercase rounded-full border border-blue-500/20">
                                        Hockey
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
                                    NHL Odds & Lines
                                </h1>
                                <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                    AI-powered analysis for every NHL game. Get puck lines, moneylines,
                                    totals, and value detection.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-blue-400">24/7</div>
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
                    sport="hockey"
                    leagues={NHL_LEAGUES}
                    accentColor="blue-400"
                    maxMatches={12}
                />

                {/* Educational Content */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            NHL Betting Markets Explained
                        </h2>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                                        <PuckLineIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Puck Line</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        NHL puck line is typically -1.5 for favorites. The favorite must win by 2+ goals to cover.
                                        Offers better odds but requires a larger margin of victory.
                                    </p>
                                </div>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                                        <MoneylineIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Moneylines</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        NHL moneylines are popular due to hockey&apos;s competitive nature—underdogs win often.
                                        Our AI analyzes goaltender matchups, home ice, and recent form.
                                    </p>
                                </div>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-blue-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                                        <TotalsIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Totals (O/U)</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        NHL totals range 5.5-7 goals. Back-to-back games, goalie performance, and scoring trends
                                        are key factors in our analysis.
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
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
