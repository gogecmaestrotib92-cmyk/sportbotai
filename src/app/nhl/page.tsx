/**
 * NHL Landing Page (/nhl)
 * 
 * Premium SEO-optimized page for NHL betting odds
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'AI Hockey Predictions & NHL Odds Today | SportBot AI',
    description: 'Free AI hockey predictions for today\'s NHL games. Get AI-powered NHL picks, puck lines, moneylines with probability analysis. Data-driven hockey betting predictions and Stanley Cup futures.',
    keywords: ['ai hockey predictions', 'ai nhl predictions', 'nhl ai picks', 'nhl odds', 'nhl betting odds', 'hockey odds', 'nhl puck line', 'ai sports predictions', 'nhl predictions today', 'stanley cup odds'],
    openGraph: {
        title: 'AI Hockey Predictions & NHL Odds Today | SportBot AI',
        description: 'Free AI hockey predictions with probability analysis. Data-driven NHL picks.',
        url: 'https://www.sportbotai.com/nhl',
        type: 'website',
    },
    alternates: {
        canonical: 'https://www.sportbotai.com/nhl',
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

const FuturesIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const NHL_LEAGUES = [
    { key: 'icehockey_nhl', name: 'NHL' },
];

const nhlSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NHL Odds Today - Live Hockey Betting Lines',
    description: 'Live NHL betting odds, puck lines, moneylines, and AI-powered analysis.',
    url: 'https://sportbotai.com/nhl',
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What is an NHL puck line?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'The NHL puck line is typically -1.5 for favorites (they must win by 2+ goals) or +1.5 for underdogs (they can lose by 1 and still cover).',
            },
        },
        {
            '@type': 'Question',
            name: 'Why are NHL moneylines popular?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'NHL moneylines are popular because hockey is competitive—underdogs win often. Unlike football, the puck line (-1.5) is harder to cover.',
            },
        },
    ],
};

export default function NhlPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(nhlSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
                                    AI NHL Predictions & Odds
                                </h1>
                                <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                    Free AI hockey predictions for today&apos;s NHL games. Get AI-powered picks,
                                    probability analysis, puck lines, and moneylines with data-driven insights.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-blue-400">24/7</div>
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
                            Get free <strong className="text-white">AI hockey predictions</strong> for every NHL game today.
                            Our <strong className="text-white">AI sports predictor</strong> analyzes goalie matchups, team form, injuries,
                            and <strong className="text-white">hockey odds</strong> to generate AI NHL picks with probability estimates.
                        </p>
                    </div>
                </section>

                <SportMatchGrid
                    sport="hockey"
                    leagues={NHL_LEAGUES}
                    accentColor="blue-400"
                    maxMatches={12}
                />

                {/* How AI Predictions Work */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                            How Our AI Hockey Predictions Work
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-3xl">
                            Our AI sports predictor uses machine learning to analyze thousands of data points
                            and generate accurate NHL predictions. Here&apos;s how it works:
                        </p>

                        <div className="grid sm:grid-cols-4 gap-4">
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold mb-3">1</div>
                                <h3 className="text-white font-semibold mb-2">Data Collection</h3>
                                <p className="text-gray-400 text-sm">AI gathers goalie stats, team form, injuries, and real-time NHL odds.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold mb-3">2</div>
                                <h3 className="text-white font-semibold mb-2">Pattern Analysis</h3>
                                <p className="text-gray-400 text-sm">Machine learning identifies trends and patterns from historical hockey data.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold mb-3">3</div>
                                <h3 className="text-white font-semibold mb-2">Probability Calc</h3>
                                <p className="text-gray-400 text-sm">AI calculates win probabilities and compares them to bookmaker odds.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold mb-3">4</div>
                                <h3 className="text-white font-semibold mb-2">Value Detection</h3>
                                <p className="text-gray-400 text-sm">Highlights mismatches where AI probability differs from market odds.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Betting Markets */}
                <section className="border-t border-white/10 bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            NHL Betting Markets Explained
                        </h2>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-blue-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
                                    <PuckLineIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Puck Line</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    The NHL puck line is -1.5 for favorites. They must win by 2+ goals for your bet to win.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-blue-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
                                    <MoneylineIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Moneyline</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Pick which team wins outright. NHL moneylines are popular—underdogs win often in hockey.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-blue-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
                                    <TotalsIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Totals (O/U)</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Bet on total goals scored. NHL totals typically range 5.5-7 goals. Goalie matchups matter.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-blue-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
                                    <FuturesIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Stanley Cup Futures</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Bet on which team will win the Stanley Cup. Long-term bets with big payouts.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Example */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                            NHL Betting Example
                        </h2>

                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 max-w-3xl">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">🏒</span>
                                <h3 className="text-lg font-semibold text-white">Bruins vs. Rangers - Sample NHL Bet</h3>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                    <div className="text-sm text-gray-500 mb-1">Bruins</div>
                                    <div className="text-white font-semibold">Puck Line: -1.5 (+165)</div>
                                    <div className="text-white font-semibold">Moneyline: -145</div>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                    <div className="text-sm text-gray-500 mb-1">Rangers</div>
                                    <div className="text-white font-semibold">Puck Line: +1.5 (-190)</div>
                                    <div className="text-white font-semibold">Moneyline: +125</div>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 mb-4">
                                <div className="text-sm text-gray-500 mb-1">Game Total</div>
                                <div className="text-white font-semibold">Over/Under 6 goals (-110 each)</div>
                            </div>
                            <p className="text-gray-400 text-sm">
                                The Bruins are favorites at -145. The +1.5 puck line on the Rangers means they can lose by 1 goal and still cover.
                                Most bettors prefer NHL moneylines since games are often decided by 1 goal.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="border-t border-white/10 bg-white/[0.01]">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            NHL Betting FAQ
                        </h2>

                        <div className="space-y-4">
                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    What is an NHL puck line?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    The NHL puck line is hockey&apos;s version of a point spread. It&apos;s typically -1.5 for favorites (must win by 2+ goals)
                                    or +1.5 for underdogs (can lose by 1 and still cover). The puck line offers better odds than moneylines but is harder to hit.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    Why do bettors prefer NHL moneylines?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    NHL moneylines are popular because hockey games are often decided by 1 goal, making the -1.5 puck line risky.
                                    Underdogs win frequently in the NHL, offering value on positive moneylines.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    How do NHL totals work?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    NHL totals are bets on combined goals scored by both teams. Totals typically range 5.5-7 goals.
                                    Goaltender matchups, back-to-back games, and team scoring trends all impact the total.
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
