/**
 * NBA Landing Page (/nba)
 * 
 * Premium SEO-optimized page targeting "NBA odds", "NBA betting odds", "NBA lines"
 * Enhanced with competitor keyword analysis.
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'AI Basketball Predictions & NBA Odds Today | SportBot AI',
    description: 'Free AI basketball predictions for today\'s NBA games. Get AI-powered NBA picks, point spreads, moneylines, and totals with probability analysis. Data-driven NBA betting predictions you can trust.',
    keywords: ['ai basketball predictions', 'ai nba predictions', 'nba ai picks', 'nba odds', 'nba betting odds', 'nba lines', 'nba spreads', 'nba moneyline', 'basketball betting', 'ai sports predictions', 'nba predictions today', 'basketball odds today'],
    openGraph: {
        title: 'AI Basketball Predictions & NBA Odds Today | SportBot AI',
        description: 'Free AI basketball predictions for NBA games. AI-powered picks with probability analysis.',
        url: 'https://www.sportbotai.com/nba',
        type: 'website',
    },
    alternates: {
        canonical: 'https://www.sportbotai.com/nba',
    },
};

// Icon components
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

const NBA_LEAGUES = [
    { key: 'basketball_nba', name: 'NBA' },
    { key: 'basketball_euroleague', name: 'EuroLeague' },
];

// Enhanced schema
const nbaSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NBA Odds Today - Live Basketball Betting Lines',
    description: 'Live NBA betting odds, point spreads, moneylines, totals, and AI-powered analysis for today\'s basketball games.',
    url: 'https://sportbotai.com/nba',
    mainEntity: {
        '@type': 'SportsOrganization',
        name: 'NBA',
        sport: 'Basketball',
    },
};

// FAQ Schema
const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What are NBA point spreads?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'NBA point spreads are betting lines that give the underdog a head start in points. If a team is -6.5, they must win by 7+ points for the bet to win. This levels the playing field between favorites and underdogs.',
            },
        },
        {
            '@type': 'Question',
            name: 'How do NBA moneylines work?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'NBA moneylines are bets on which team will win the game outright. Negative odds like -180 mean you bet $180 to win $100. Positive odds like +150 mean a $100 bet wins $150.',
            },
        },
        {
            '@type': 'Question',
            name: 'What are NBA player props?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'NBA player props are bets on individual player performance, like total points scored, rebounds, or assists. Example: LeBron James Over 25.5 points at -110.',
            },
        },
    ],
};

export default function NbaPage() {
    return (
        <>
            {/* Schema Markup */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(nbaSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="min-h-screen bg-bg relative overflow-x-hidden">
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
                                    AI NBA Predictions & Odds
                                </h1>
                                <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                    Free AI basketball predictions for today&apos;s NBA games. Get AI-powered picks,
                                    probability analysis, spreads, and moneylines with data-driven insights.
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-4">
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-orange-400">24/7</div>
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

                {/* Intro Content - SEO Text */}
                <section className="border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <p className="text-gray-400 leading-relaxed max-w-4xl">
                            Get free <strong className="text-white">AI basketball predictions</strong> for every NBA game today.
                            Our <strong className="text-white">AI sports predictor</strong> analyzes historical data, team form, injuries,
                            and odds movements to generate <strong className="text-white">AI NBA picks</strong> with probability estimates.
                            Compare <strong className="text-white">NBA odds</strong> and find value bets with data-driven insights.
                        </p>
                    </div>
                </section>

                {/* Match Grid */}
                <SportMatchGrid
                    sport="basketball"
                    leagues={NBA_LEAGUES}
                    accentColor="orange-400"
                    maxMatches={12}
                />

                {/* How to Bet Section */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                            How Our AI Basketball Predictions Work
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-3xl">
                            Our AI sports predictor uses machine learning to analyze thousands of data points
                            and generate accurate NBA predictions. Here&apos;s how it works:
                        </p>

                        <div className="grid sm:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold mb-3">1</div>
                                <h3 className="text-white font-semibold mb-2">Data Collection</h3>
                                <p className="text-gray-400 text-sm">AI gathers team stats, injuries, form, H2H history, and real-time odds.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold mb-3">2</div>
                                <h3 className="text-white font-semibold mb-2">Pattern Analysis</h3>
                                <p className="text-gray-400 text-sm">Machine learning identifies patterns and trends from historical NBA data.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold mb-3">3</div>
                                <h3 className="text-white font-semibold mb-2">Probability Calc</h3>
                                <p className="text-gray-400 text-sm">AI calculates win probabilities and compares them to bookmaker odds.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold mb-3">4</div>
                                <h3 className="text-white font-semibold mb-2">Value Detection</h3>
                                <p className="text-gray-400 text-sm">Highlights mismatches where AI probability differs from market odds.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* NBA Betting Markets */}
                <section className="border-t border-white/10 bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            NBA Betting Markets Explained
                        </h2>

                        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {/* Point Spreads */}
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-orange-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3">
                                    <SpreadIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Point Spread</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    The NBA point spread levels the playing field. A -6.5 spread means the favorite must win by 7+ points for your bet to win.
                                </p>
                            </div>

                            {/* Moneylines */}
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-orange-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3">
                                    <MoneylineIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Moneyline</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Pick which team will win the NBA game outright. The underdog offers higher payouts if they pull off the upset.
                                </p>
                            </div>

                            {/* Totals */}
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-orange-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3">
                                    <TotalsIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Totals (O/U)</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Bet on the total number of points scored by both teams. NBA totals typically range from 210-240 points.
                                </p>
                            </div>

                            {/* Player Props */}
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-orange-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3">
                                    <PropsIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Player Props</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Wager on individual performance: points scored, rebounds, assists. Popular for star players each game.
                                </p>
                            </div>

                            {/* Futures */}
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-orange-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3">
                                    <FuturesIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Futures Bet</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Bet on which team will win the NBA Finals or conference. Long-term bets with bigger payouts.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* NBA Betting Example */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                            NBA Betting Example
                        </h2>

                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 max-w-3xl">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">🏀</span>
                                <h3 className="text-lg font-semibold text-white">Lakers vs. Celtics - Sample NBA Bet</h3>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Here&apos;s how NBA odds might look for a bettor considering this matchup:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                    <div className="text-sm text-gray-500 mb-1">Lakers</div>
                                    <div className="text-white font-semibold">Spread: +4.5 (-110)</div>
                                    <div className="text-white font-semibold">Moneyline: +160</div>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                    <div className="text-sm text-gray-500 mb-1">Celtics</div>
                                    <div className="text-white font-semibold">Spread: -4.5 (-110)</div>
                                    <div className="text-white font-semibold">Moneyline: -190</div>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 mb-4">
                                <div className="text-sm text-gray-500 mb-1">Game Total</div>
                                <div className="text-white font-semibold">Over/Under 224.5 points (-110 each)</div>
                            </div>
                            <p className="text-gray-400 text-sm">
                                In this example, the Celtics are 4.5-point favorites. A bet on Lakers +4.5 wins if LA wins outright or loses by 4 or fewer points.
                                The total of 224.5 means bettors expect roughly 225 points scored in the game.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="border-t border-white/10 bg-white/[0.01]">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            NBA Betting FAQ
                        </h2>

                        <div className="space-y-4">
                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    What are NBA point spreads?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    NBA point spreads are betting odds that give the underdog a head start. If a team is -6.5, they must win by 7+ points for your bet to win.
                                    Spreads level the playing field between favorites and underdogs, making the wager more competitive for sports betting.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    How do I bet on NBA games?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    To bet on an NBA game: (1) Choose a legal sportsbook, (2) Find the NBA game you want to wager on, (3) Select your bet type (spread, moneyline, total, or player props),
                                    (4) Enter your stake, and (5) Confirm your basketball bet. Compare betting odds to get the best value.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    What are NBA player props?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    NBA player props are bets on individual player performance rather than the game outcome. Common prop bets include points scored, rebounds, assists, and three-pointers made.
                                    Example: betting on whether LeBron James will score over or under 25.5 points.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    How do NBA futures bets work?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    A futures bet is a wager on a long-term outcome, like which team will win the NBA Finals or NBA MVP.
                                    These bets offer higher payouts because you&apos;re betting before the season or playoffs. For example, betting on the Celtics to win the NBA championship at +350.
                                </div>
                            </details>

                            <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                                <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                    How are NBA totals (over/under) calculated?
                                    <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                    NBA totals represent the number of points sportsbooks expect both teams to score combined.
                                    If the total is 224.5, you bet whether the actual points scored will go over or under that number. High-paced teams typically have higher totals.
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
                </section>
            </div>
        </>
    );
}
