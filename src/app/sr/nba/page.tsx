/**
 * NBA Landing Page - Serbian Version (/sr/nba)
 * 
 * Fully translated SEO-optimized page for Serbian audience.
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'AI NBA Predikcije i Kvote Danas | SportBot AI',
    description: 'Besplatne AI košarkaške predikcije za današnje NBA utakmice. AI tipovi sa analizom verovatnoće, spredovi i kvote. Data-driven NBA predikcije.',
    keywords: ['ai nba predikcije', 'ai kosarka predikcije', 'nba ai tipovi', 'nba kvote', 'nba kladjenje', 'nba linije', 'ai sportske predikcije'],
    openGraph: {
        title: 'NBA Kvote Danas - Linije za Klađenje | SportBot AI',
        description: 'Današnje NBA kvote za klađenje sa AI analizom.',
        url: 'https://sportbotai.com/sr/nba',
        type: 'website',
    },
    alternates: {
        canonical: 'https://sportbotai.com/sr/nba',
        languages: {
            'en': 'https://sportbotai.com/nba',
            'sr': 'https://sportbotai.com/sr/nba',
        },
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

const NBA_LEAGUES = [
    { key: 'basketball_nba', name: 'NBA' },
    { key: 'basketball_euroleague', name: 'EuroLeague' },
];

export default function NbaPageSr() {
    return (
        <>
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
                            <Link href="/sr" className="hover:text-white transition-colors">Početna</Link>
                            <span>/</span>
                            <Link href="/sr/matches" className="hover:text-white transition-colors">Mečevi</Link>
                            <span>/</span>
                            <span className="text-white">NBA</span>
                        </nav>

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-4xl">🏀</span>
                                    <span className="px-3 py-1.5 bg-orange-500/10 text-orange-400 text-xs font-bold tracking-wider uppercase rounded-full border border-orange-500/20">
                                        Košarka
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
                                    AI NBA Predikcije i Kvote
                                </h1>
                                <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                    Besplatne AI predikcije za današnje NBA utakmice. AI tipovi,
                                    analiza verovatnoće, spredovi i kvote sa data-driven uvidima.
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-4">
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-orange-400">24/7</div>
                                    <div className="text-xs text-gray-400">Live Kvote</div>
                                </div>
                                <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-accent">AI</div>
                                    <div className="text-xs text-gray-400">Analiza</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Intro Content - SEO Text */}
                <section className="border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <p className="text-gray-400 leading-relaxed max-w-4xl">
                            Dobijte besplatne <strong className="text-white">AI košarkaške predikcije</strong> za svaku NBA utakmicu danas.
                            Naš <strong className="text-white">AI sportski prediktor</strong> analizira istorijske podatke, formu timova, povrede,
                            i kretanja kvota da generiše <strong className="text-white">AI NBA tipove</strong> sa procenama verovatnoće.
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
                            Kako se Kladiti na NBA Utakmice
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-3xl">
                            Klađenje na NBA utakmice je jednostavno kada razumete osnove.
                            Evo kako da se kladite na košarku:
                        </p>

                        <div className="grid sm:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold mb-3">1</div>
                                <h3 className="text-white font-semibold mb-2">Izaberite Opkladu</h3>
                                <p className="text-gray-400 text-sm">Izaberite spred, manije liniju, total ili igračke propove za vašu NBA opkladu.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold mb-3">2</div>
                                <h3 className="text-white font-semibold mb-2">Uporedite Kvote</h3>
                                <p className="text-gray-400 text-sm">Proverite kvote na više kladionica da dobijete najbolju vrednost.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold mb-3">3</div>
                                <h3 className="text-white font-semibold mb-2">Analizirajte Vrednost</h3>
                                <p className="text-gray-400 text-sm">Koristite naš AI da pronađete koji tim ima šanse protiv spreda.</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold mb-3">4</div>
                                <h3 className="text-white font-semibold mb-2">Uplatite Opkladu</h3>
                                <p className="text-gray-400 text-sm">Unesite vaš ulog i potvrdite košarkašku opkladu na kladionici.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* NBA Betting Markets */}
                <section className="border-t border-white/10 bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                            NBA Tržišta za Klađenje
                        </h2>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-orange-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3">
                                    <SpreadIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Spred Poena</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    NBA spred poena izjednačava šanse. Spred od -6.5 znači da favorit mora pobediti sa 7+ poena da opklada pobedi.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-orange-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3">
                                    <MoneylineIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Manije Linija</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Izaberite koji tim će pobediti NBA utakmicu. Autsajder nudi veće isplate ako uspe da iznenadi.
                                </p>
                            </div>

                            <div className="group relative bg-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-orange-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3">
                                    <TotalsIcon />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">Totali (O/U)</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Kladite se na ukupan broj poena koje oba tima postižu. NBA totali su obično između 210-240 poena.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
                        <p className="text-gray-400 mb-4">Potrebna vam je pomoć sa matematikom klađenja?</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link
                                href="/sr/tools/odds-converter"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
                            >
                                Konvertor Kvota
                            </Link>
                            <Link
                                href="/sr/tools/parlay-calculator"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
                            >
                                Parlay Kalkulator
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
