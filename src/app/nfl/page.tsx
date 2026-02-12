/**
 * NFL Landing Page (/nfl)
 * 
 * Premium SEO-optimized page for NFL betting odds
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
    title: 'AI NFL Predictions & Football Odds Today',
    description: 'Free AI NFL predictions for this week\'s games. Get AI-powered football picks, point spreads, moneylines with probability analysis. Data-driven NFL betting predictions and Super Bowl futures.',
    keywords: ['ai nfl predictions', 'ai football predictions', 'nfl ai picks', 'nfl odds', 'nfl betting odds', 'nfl lines', 'nfl spreads', 'ai sports predictions', 'nfl predictions today', 'football betting', 'super bowl odds'],
    openGraph: {
        title: 'AI NFL Predictions & Football Odds Today',
        description: 'Free AI NFL predictions with probability analysis. Data-driven football picks.',
        url: 'https://www.sportbotai.com/nfl',
        type: 'website',
        images: [{
            url: 'https://www.sportbotai.com/images/generated/sport-nfl.webp',
            width: 1440,
            height: 810,
            alt: 'AI NFL Predictions - SportBot AI',
        }],
    },
    alternates: {
        canonical: 'https://www.sportbotai.com/nfl',
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

const PropsIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const FuturesIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const NFL_LEAGUES = [
    { key: 'americanfootball_nfl', name: 'NFL' },
    { key: 'americanfootball_ncaaf', name: 'NCAA Football' },
];

const nflSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NFL Odds Today - Live Football Betting Lines',
    description: 'Live NFL betting odds, point spreads, moneylines, and AI-powered analysis.',
    url: 'https://sportbotai.com/nfl',
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What are NFL point spreads?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'NFL point spreads give the underdog a handicap. If Chiefs are -7, they must win by 8+ for the bet to win. Key numbers like 3, 7, and 10 are important due to football scoring.',
            },
        },
        {
            '@type': 'Question',
            name: 'How do NFL moneylines work?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'NFL moneylines are bets on which team wins outright. Negative odds show how much to bet to win $100. Positive odds show profit from a $100 bet.',
            },
        },
    ],
};

export default function NflPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(nflSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Hero */}
                <section className="relative border-b border-white/5 overflow-hidden">
                    {/* AI-generated sport background */}
                    <div className="absolute inset-0">
                        <Image
                            src="/images/generated/sport-nfl.webp"
                            alt=""
                            fill
                            className="object-cover opacity-40"
                            sizes="100vw"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/60 to-bg" />
                    </div>
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
                                    AI NFL Predictions & Odds
                                </h1>
                                <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                    Free AI football predictions for this week&apos;s NFL games. Get AI-powered picks,
                                    probability analysis, spreads, and moneylines with data-driven insights.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-green-400">24/7</div>
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

                {/* Intro Content */}
                <section className="border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <p className="text-gray-400 leading-relaxed max-w-4xl">
                            Get free <strong className="text-white">AI NFL predictions</strong> for every football game this week.
                            Our <strong className="text-white">AI sports predictor</strong> analyzes team stats, injuries, weather,
                            and line movements to generate <strong className="text-white">AI football picks</strong> with probability estimates.
                            Compare <strong className="text-white">NFL odds</strong> and find value bets with data-driven insights.
                        </p>
                    </div>
                </section>

                <SportMatchGrid
                    sport="americanfootball"
                    leagues={NFL_LEAGUES}
                    accentColor="green-400"
                    maxMatches={12}
                />

                {/* How to Bet */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                            How Our AI Football Predictions Work
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-3xl">
                            Our AI sports predictor uses machine learning to analyze thousands of data points
                            and generate accurate NFL predictions. Here&apos;s how it works:
                        </p>

                        <div className="grid sm:grid-cols-4 gap-4">
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 font-bold mb-3">1</div>
                                <h3 className="text-white font-semibold mb-2">Data Collection</h3>
                                <p className="text-gray-400 text-sm">AI gathers team stats, injuries, weather, and real-time NFL odds.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 font-bold mb-3">2</div>
                                <h3 className="text-white font-semibold mb-2">Pattern Analysis</h3>
                                <p className="text-gray-400 text-sm">Machine learning identifies trends and key numbers (3, 7, 10) in NFL data.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 font-bold mb-3">3</div>
                                <h3 className="text-white font-semibold mb-2">Probability Calc</h3>
                                <p className="text-gray-400 text-sm">AI calculates win probabilities and compares them to bookmaker odds.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 font-bold mb-3">4</div>
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
                            NFL Betting Markets Explained
                        </h2>

                        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-green-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-3">
                                    <SpreadIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Point Spread</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    The NFL point spread levels the field. Key numbers like 3 and 7 matter most due to football scoring patterns.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-green-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-3">
                                    <MoneylineIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Moneyline</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Pick which team will win outright. Underdogs in divisional games often offer value.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-green-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-3">
                                    <TotalsIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Totals (O/U)</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Bet on total points scored. NFL totals typically range 35-55 points. Weather and pace matter.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-green-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-3">
                                    <PropsIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Player Props</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Wager on player stats: passing yards, rushing yards, touchdowns, receptions.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-green-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-3">
                                    <FuturesIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Super Bowl Futures</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Bet on which team will win the Super Bowl. Long-term bets with big payouts.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Example */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                            NFL Betting Example
                        </h2>

                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 max-w-3xl">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">🏈</span>
                                <h3 className="text-lg font-semibold text-white">Chiefs vs. Eagles - Sample NFL Bet</h3>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                    <div className="text-sm text-gray-500 mb-1">Chiefs</div>
                                    <div className="text-white font-semibold">Spread: -3 (-110)</div>
                                    <div className="text-white font-semibold">Moneyline: -155</div>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                    <div className="text-sm text-gray-500 mb-1">Eagles</div>
                                    <div className="text-white font-semibold">Spread: +3 (-110)</div>
                                    <div className="text-white font-semibold">Moneyline: +135</div>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 mb-4">
                                <div className="text-sm text-gray-500 mb-1">Game Total</div>
                                <div className="text-white font-semibold">Over/Under 48.5 points (-110 each)</div>
                            </div>
                            <p className="text-gray-400 text-sm">
                                The Chiefs are 3-point favorites. Since 3 is a key NFL number (games often decided by a field goal),
                                getting +3 on the underdog can be valuable in close matchups.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="border-t border-white/10 bg-white/[0.01]">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            NFL Betting FAQ
                        </h2>

                        <div className="space-y-4">
                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    What are key numbers in NFL betting?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    Key numbers in NFL betting are 3, 7, and 10—the most common margins of victory due to field goals (3) and touchdowns (7).
                                    Getting +3 instead of +2.5 on an underdog can significantly impact your bet&apos;s win rate.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    How do NFL point spreads work?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    NFL point spreads give the underdog a handicap. If Chiefs are -7, they must win by 8+ for your bet to win.
                                    If Eagles are +7, they can lose by up to 6 points and your wager still wins.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    What are NFL player props?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    NFL player props are bets on individual performance: passing yards, rushing yards, receiving yards, touchdowns, receptions.
                                    Example: Patrick Mahomes Over 275.5 passing yards at -110.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    How do Super Bowl futures work?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    Super Bowl futures are long-term bets on which team will win the championship.
                                    Odds change throughout the season based on performance. Betting early offers higher payouts but more risk.
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
                            <Link href="/tools/hedge-calculator" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors">
                                Hedge Calculator
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
