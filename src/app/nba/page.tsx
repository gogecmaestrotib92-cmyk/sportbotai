/**
 * NBA Landing Page (/nba)
 * 
 * Premium SEO-optimized page targeting "NBA odds", "NBA lines", "NBA betting odds"
 * Shows today's NBA games with AI-powered analysis links.
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'NBA Odds & Lines Today',
    description: 'Get today\'s NBA odds, betting lines, and AI-powered analysis for every basketball game. Live spreads, moneylines, totals, and value detection for NBA betting.',
    keywords: ['nba odds', 'nba lines', 'nba betting odds', 'nba spreads', 'nba moneyline', 'basketball odds today', 'nba betting lines', 'nba point spreads'],
    openGraph: {
        title: 'NBA Odds & Lines Today | SportBot AI',
        description: 'Today\'s NBA betting odds with AI analysis. Live spreads, moneylines, and value detection.',
        url: 'https://sportbotai.com/nba',
        type: 'website',
    },
    alternates: {
        canonical: 'https://sportbotai.com/nba',
    },
};

// Icon components for educational cards
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

// NBA leagues configuration
const NBA_LEAGUES = [
    { key: 'basketball_nba', name: 'NBA' },
    { key: 'basketball_euroleague', name: 'EuroLeague' },
];

// Schema markup
const nbaSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NBA Odds & Lines Today',
    description: 'Live NBA betting odds, spreads, moneylines, and AI-powered analysis for today\'s basketball games.',
    url: 'https://sportbotai.com/nba',
    mainEntity: {
        '@type': 'SportsOrganization',
        name: 'NBA',
        sport: 'Basketball',
    },
};

export default function NbaPage() {
    return (
        <>
            {/* Schema Markup */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(nbaSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Hero Section */}
                <section className="relative border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <span>/</span>
                            <Link href="/matches" className="hover:text-white transition-colors">Matches</Link>
                            <span>/</span>
                            <span className="text-white">NBA</span>
                        </nav>

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-4xl">🏀</span>
                                    <span className="px-3 py-1.5 bg-orange-500/10 text-orange-400 text-xs font-bold tracking-wider uppercase rounded-full border border-orange-500/20">
                                        Basketball
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
                                    NBA Odds & Lines
                                </h1>
                                <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                    AI-powered analysis for every NBA game. Get spreads, moneylines,
                                    totals, and value detection.
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-4">
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-orange-400">24/7</div>
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

                {/* Match Grid */}
                <SportMatchGrid
                    sport="basketball"
                    leagues={NBA_LEAGUES}
                    accentColor="orange-400"
                    maxMatches={12}
                />

                {/* Educational Content - Premium Cards */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            NBA Betting Markets Explained
                        </h2>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Point Spreads Card */}
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-orange-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4">
                                        <SpreadIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Point Spreads</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        NBA spreads level the playing field. A spread of -6.5 means the favorite must win by 7+ to cover.
                                        Our AI analyzes recent form, home/away splits, and injury reports to assess value.
                                    </p>
                                </div>
                            </div>

                            {/* Moneylines Card */}
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-orange-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4">
                                        <MoneylineIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Moneylines</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Pick the outright winner. Odds like -180 mean betting $180 to win $100 on favorites.
                                        We compare implied probability with AI predictions to detect mispriced lines.
                                    </p>
                                </div>
                            </div>

                            {/* Totals Card */}
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-orange-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4">
                                        <TotalsIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Totals (O/U)</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        NBA totals typically range 210-240 points. Our analysis considers pace factors,
                                        defensive efficiency, and recent scoring trends to find over/under value.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-10 text-center">
                            <p className="text-gray-400 mb-4">Need help with betting math?</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Link
                                    href="/tools/odds-converter"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
                                >
                                    Odds Converter
                                </Link>
                                <Link
                                    href="/tools/parlay-calculator"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
                                >
                                    Parlay Calculator
                                </Link>
                                <Link
                                    href="/tools/hedge-calculator"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
                                >
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
