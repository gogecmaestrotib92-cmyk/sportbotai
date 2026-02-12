/**
 * NFL Landing Page - Serbian Version (/sr/nfl)
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'AI NFL Predikcije i Kvote Danas',
    description: 'Besplatne AI NFL predikcije za utakmice ove nedelje. AI tipovi sa analizom verovatnoće, spredovi i kvote. Data-driven fudbalske predikcije.',
    keywords: ['ai nfl predikcije', 'ai americki fudbal predikcije', 'nfl ai tipovi', 'nfl kvote', 'nfl kladjenje', 'ai sportske predikcije'],
    openGraph: {
        title: 'NFL Kvote Danas',
        description: 'Današnje NFL kvote za klađenje sa AI analizom.',
        url: 'https://sportbotai.com/sr/nfl',
    },
    alternates: {
        canonical: 'https://sportbotai.com/sr/nfl',
        languages: {
            'en': 'https://sportbotai.com/nfl',
            'sr': 'https://sportbotai.com/sr/nfl',
        },
    },
};

const NFL_LEAGUES = [
    { key: 'americanfootball_nfl', name: 'NFL' },
    { key: 'americanfootball_ncaaf', name: 'NCAA Football' },
];

export default function NflPageSr() {
    return (
        <div className="min-h-screen bg-bg relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Hero Section */}
            <section className="relative border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
                    <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                        <Link href="/sr" className="hover:text-white transition-colors">Početna</Link>
                        <span>/</span>
                        <Link href="/sr/matches" className="hover:text-white transition-colors">Mečevi</Link>
                        <span>/</span>
                        <span className="text-white">NFL</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-4xl">🏈</span>
                                <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-wider uppercase rounded-full border border-blue-500/20">
                                    Američki Fudbal
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
                                AI NFL Predikcije i Kvote
                            </h1>
                            <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                Besplatne AI predikcije za NFL utakmice ove nedelje. AI tipovi,
                                analiza verovatnoće, spredovi i kvote sa data-driven uvidima.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-2xl font-bold text-blue-400">24/7</div>
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

            {/* Intro Content */}
            <section className="border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-gray-400 leading-relaxed max-w-4xl">
                        Dobijte besplatne <strong className="text-white">AI NFL predikcije</strong> za svaku utakmicu ove nedelje.
                        Naš <strong className="text-white">AI sportski prediktor</strong> analizira statistike timova, povrede,
                        i kretanja linija da generiše <strong className="text-white">AI fudbalske tipove</strong> sa procenama verovatnoće.
                    </p>
                </div>
            </section>

            {/* Match Grid */}
            <SportMatchGrid
                sport="americanfootball"
                leagues={NFL_LEAGUES}
                accentColor="blue-400"
                maxMatches={12}
            />

            {/* How to Bet Section */}
            <section className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                        Kako se Kladiti na NFL Utakmice
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-3xl">
                        NFL klađenje je popularno zbog velike zainteresovanosti za američki fudbal.
                        Evo kako da počnete:
                    </p>

                    <div className="grid sm:grid-cols-4 gap-4">
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold mb-3">1</div>
                            <h3 className="text-white font-semibold mb-2">Izaberite Tip Opklade</h3>
                            <p className="text-gray-400 text-sm">Spred poena, manije linija, total ili igračke propove.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold mb-3">2</div>
                            <h3 className="text-white font-semibold mb-2">Uporedite Kvote</h3>
                            <p className="text-gray-400 text-sm">Proverite više kladionica za najbolje linije.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold mb-3">3</div>
                            <h3 className="text-white font-semibold mb-2">Analizirajte Vrednost</h3>
                            <p className="text-gray-400 text-sm">Koristite AI analizu za pronalaženje vrednosti.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold mb-3">4</div>
                            <h3 className="text-white font-semibold mb-2">Uplatite Opkladu</h3>
                            <p className="text-gray-400 text-sm">Unesite ulog i potvrdite vašu NFL opkladu.</p>
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
    );
}
