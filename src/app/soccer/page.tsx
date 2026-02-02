/**
 * Soccer Landing Page (/soccer)
 * 
 * Premium SEO-optimized page for soccer/football betting odds
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'AI Soccer Predictions & Odds Today - Football Tips & Betting Lines',
    description: 'AI-powered soccer predictions and live odds for Premier League, La Liga, Bundesliga, Champions League. Data-driven football tips with betting lines and probability analysis.',
    keywords: ['ai soccer predictions', 'ai picks soccer', 'soccer odds', 'football predictions', 'soccer tips', 'premier league odds', 'premier league predictions', 'champions league tips', 'la liga odds', 'bundesliga odds', 'football betting tips', 'soccer betting odds', 'ai football analysis', 'soccer match predictions'],
    openGraph: {
        title: 'AI Soccer Predictions & Odds Today | SportBot AI',
        description: 'AI-powered soccer predictions and live betting odds. Football tips for Premier League, La Liga, Champions League.',
        url: 'https://www.sportbotai.com/soccer',
        type: 'website',
    },
    alternates: {
        canonical: 'https://www.sportbotai.com/soccer',
    },
};

// Icons
const MoneylineIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SpreadIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18M8 6v12M16 6v12" />
    </svg>
);

const TotalsIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
);

const DrawIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="8" width="18" height="8" rx="2" />
        <path strokeLinecap="round" d="M8 12h8" />
    </svg>
);

const SOCCER_LEAGUES = [
    { key: 'soccer_epl', name: 'Premier League' },
    { key: 'soccer_spain_la_liga', name: 'La Liga' },
    { key: 'soccer_germany_bundesliga', name: 'Bundesliga' },
    { key: 'soccer_uefa_champs_league', name: 'Champions League' },
];

const soccerSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Soccer Odds Today - Live Football Betting Lines',
    description: 'Live soccer betting odds, moneylines, spreads, and AI-powered analysis.',
    url: 'https://sportbotai.com/soccer',
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What is 3-way moneyline in soccer?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Soccer uses 3-way moneylines: bet on Home, Away, or Draw. This differs from US sports which only have 2-way outcomes. If you bet Home and the game draws, you lose.',
            },
        },
        {
            '@type': 'Question',
            name: 'How do soccer goal spreads work?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Soccer spreads (Asian Handicaps) add or subtract goals. A -1.5 spread means the team must win by 2+ goals. Spreads remove the draw outcome.',
            },
        },
    ],
};

export default function SoccerPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(soccerSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-x-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Hero */}
                <section className="relative border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent" />
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
                                    <span className="px-3 py-1.5 bg-violet-500/10 text-violet-400 text-xs font-bold tracking-wider uppercase rounded-full border border-violet-500/20">
                                        Football
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
                                    AI Soccer Predictions & Odds
                                </h1>
                                <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                    AI-powered soccer predictions and live odds for Premier League, La Liga, Champions League.
                                    Data-driven football tips with probability analysis.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-violet-400">24/7</div>
                                    <div className="text-xs text-gray-400">Live Odds</div>
                                </div>
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-accent">AI</div>
                                    <div className="text-xs text-gray-400">Analysis</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Intro */}
                <section className="border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <p className="text-gray-400 leading-relaxed max-w-4xl">
                            Find today&apos;s <strong className="text-white">soccer odds</strong> for every major league.
                            Whether you&apos;re betting on <strong className="text-white">Premier League</strong>, Champions League,
                            or La Liga, our AI analyzes <strong className="text-white">football betting odds</strong> to help you find value.
                        </p>
                    </div>
                </section>

                <SportMatchGrid
                    sport="soccer"
                    leagues={SOCCER_LEAGUES}
                    accentColor="violet-400"
                    maxMatches={12}
                />

                {/* Betting Markets */}
                <section className="border-t border-white/10 bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            Soccer Betting Markets Explained
                        </h2>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-violet-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-3">
                                    <MoneylineIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">3-Way Moneyline</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Bet on Home, Away, or Draw. Soccer uses 3-way betting since draws are common outcomes.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-violet-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-3">
                                    <SpreadIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Goal Spread (Asian Handicap)</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Add or subtract goals to level the field. -1.5 means the team must win by 2+ goals.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-violet-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-3">
                                    <TotalsIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Totals (O/U Goals)</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Bet on total goals scored. Over/Under 2.5 goals is the most common soccer total.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-violet-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-3">
                                    <DrawIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Draw No Bet</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Your stake is refunded if the game draws. Reduces risk by removing the draw outcome.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Example */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                            Soccer Betting Example
                        </h2>

                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 max-w-3xl">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">⚽</span>
                                <h3 className="text-lg font-semibold text-white">Man City vs. Liverpool - Premier League</h3>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-4 mb-4">
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 text-center">
                                    <div className="text-sm text-gray-500 mb-1">Man City</div>
                                    <div className="text-white font-semibold">+120</div>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 text-center">
                                    <div className="text-sm text-gray-500 mb-1">Draw</div>
                                    <div className="text-white font-semibold">+250</div>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 text-center">
                                    <div className="text-sm text-gray-500 mb-1">Liverpool</div>
                                    <div className="text-white font-semibold">+180</div>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 mb-4">
                                <div className="text-sm text-gray-500 mb-1">Goal Total</div>
                                <div className="text-white font-semibold">Over/Under 2.5 goals (-110 each)</div>
                            </div>
                            <p className="text-gray-400 text-sm">
                                In the 3-way moneyline, you must pick one of three outcomes. If you bet Man City and the game draws 1-1, you lose.
                                Over 2.5 goals wins if 3+ total goals are scored.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="border-t border-white/10 bg-white/[0.01]">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            Soccer Betting FAQ
                        </h2>

                        <div className="space-y-4">
                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    What is 3-way moneyline betting?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    Soccer uses 3-way moneylines: bet on Home Win, Away Win, or Draw. Unlike US sports with 2-way outcomes,
                                    soccer betting includes the draw. If you bet on a team to win and the game draws, you lose.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    What is an Asian Handicap?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    Asian Handicaps are goal spreads in soccer. A -1.5 handicap means the team must win by 2+ goals.
                                    Asian Handicaps eliminate the draw, turning soccer into a 2-way betting market.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    What does Over 2.5 goals mean?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    Over 2.5 goals wins if the total goals scored by both teams is 3 or more.
                                    Under 2.5 goals wins if the game ends 0-0, 1-0, 0-1, 1-1, or 2-0/0-2. This is the most popular soccer total bet.
                                </div>
                            </details>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
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
                </section>
            </div>
        </>
    );
}
