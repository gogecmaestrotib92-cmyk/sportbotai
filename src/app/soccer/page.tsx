/**
 * Soccer Landing Page (/soccer)
 * 
 * Premium SEO-optimized page targeting "soccer odds", "premier league odds"
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Soccer Odds & Lines Today',
    description: 'Get today\'s soccer odds and AI-powered analysis. Premier League, La Liga, Champions League, and more with value detection.',
    keywords: ['soccer odds', 'premier league odds', 'football betting odds', 'soccer betting', 'epl odds', 'la liga odds'],
    openGraph: {
        title: 'Soccer Odds & Lines Today | SportBot AI',
        description: 'Today\'s soccer betting odds with AI analysis.',
        url: 'https://sportbotai.com/soccer',
        type: 'website',
    },
    alternates: {
        canonical: 'https://sportbotai.com/soccer',
    },
};

// Icons
const MatchResultIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const GoalsIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="6" width="18" height="12" rx="1" />
        <path strokeLinecap="round" d="M3 10h18M3 14h18M7 6v12M17 6v12M12 6v12" />
    </svg>
);

const BTTSIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="12" r="4" />
        <circle cx="16" cy="12" r="4" />
    </svg>
);

const SOCCER_LEAGUES = [
    { key: 'soccer_epl', name: 'Premier League' },
    { key: 'soccer_spain_la_liga', name: 'La Liga' },
    { key: 'soccer_germany_bundesliga', name: 'Bundesliga' },
    { key: 'soccer_italy_serie_a', name: 'Serie A' },
    { key: 'soccer_france_ligue_one', name: 'Ligue 1' },
    { key: 'soccer_uefa_champs_league', name: 'Champions League' },
];

const soccerSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Soccer Odds & Lines Today',
    description: 'Live soccer betting odds with AI analysis.',
    url: 'https://sportbotai.com/soccer',
};

export default function SoccerPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(soccerSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Hero */}
                <section className="relative border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-violet/5 to-transparent" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
                        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <span>/</span>
                            <Link href="/matches" className="hover:text-white transition-colors">Matches</Link>
                            <span>/</span>
                            <span className="text-white">Soccer</span>
                        </nav>

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-4xl">⚽</span>
                                    <span className="px-3 py-1.5 bg-violet/10 text-violet-400 text-xs font-bold tracking-wider uppercase rounded-full border border-violet/20">
                                        Soccer
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
                                    Soccer Odds & Lines
                                </h1>
                                <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                    AI-powered analysis for every match. Premier League, La Liga,
                                    Champions League, and more.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-violet-400">24/7</div>
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
                    sport="soccer"
                    leagues={SOCCER_LEAGUES}
                    accentColor="violet"
                    maxMatches={12}
                />

                {/* Educational Content */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            Soccer Betting Markets Explained
                        </h2>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-violet/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-violet/10 flex items-center justify-center text-violet-400 mb-4">
                                        <MatchResultIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Match Result (1X2)</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Pick home win (1), draw (X), or away win (2). Unlike American sports, draws are common—occurring
                                        in 25-30% of matches. Our AI analyzes team form and H2H records.
                                    </p>
                                </div>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-violet/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-violet/10 flex items-center justify-center text-violet-400 mb-4">
                                        <GoalsIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Over/Under Goals</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Bet on total goals. The most common line is O/U 2.5 goals. We analyze attacking and defensive
                                        stats, recent scoring, and league patterns.
                                    </p>
                                </div>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-violet/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-violet/10 flex items-center justify-center text-violet-400 mb-4">
                                        <BTTSIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Both Teams to Score</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Popular market betting on whether both teams will score. Our analysis considers clean sheet records,
                                        defensive vulnerabilities, and attacking form.
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
