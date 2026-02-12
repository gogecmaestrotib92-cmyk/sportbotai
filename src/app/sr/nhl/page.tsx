/**
 * NHL Landing Page - Serbian Version (/sr/nhl)
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'AI NHL Predikcije i Kvote Danas',
    description: 'Besplatne AI hokej predikcije za današnje NHL utakmice. AI tipovi sa analizom verovatnoće, puck linije i kvote. Data-driven NHL predikcije.',
    keywords: ['ai nhl predikcije', 'ai hokej predikcije', 'nhl ai tipovi', 'nhl kvote', 'nhl kladjenje', 'ai sportske predikcije'],
    openGraph: {
        title: 'NHL Kvote Danas',
        description: 'Današnje NHL kvote za klađenje sa AI analizom.',
        url: 'https://sportbotai.com/sr/nhl',
    },
    alternates: {
        canonical: 'https://sportbotai.com/sr/nhl',
        languages: {
            'en': 'https://sportbotai.com/nhl',
            'sr': 'https://sportbotai.com/sr/nhl',
        },
    },
};

const NHL_LEAGUES = [
    { key: 'icehockey_nhl', name: 'NHL' },
];

export default function NhlPageSr() {
    return (
        <div className="min-h-screen bg-bg relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Hero Section */}
            <section className="relative border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
                    <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                        <Link href="/sr" className="hover:text-white transition-colors">Početna</Link>
                        <span>/</span>
                        <Link href="/sr/matches" className="hover:text-white transition-colors">Mečevi</Link>
                        <span>/</span>
                        <span className="text-white">NHL</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-4xl">🏒</span>
                                <span className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-wider uppercase rounded-full border border-cyan-500/20">
                                    Hokej
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
                                AI NHL Predikcije i Kvote
                            </h1>
                            <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                Besplatne AI predikcije za današnje NHL utakmice. AI tipovi,
                                analiza verovatnoće, puck linije i kvote sa data-driven uvidima.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-2xl font-bold text-cyan-400">24/7</div>
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
                        Dobijte besplatne <strong className="text-white">AI hokej predikcije</strong> za svaku NHL utakmicu danas.
                        Naš <strong className="text-white">AI sportski prediktor</strong> analizira golmanske duel, formu timova,
                        i <strong className="text-white">hokej kvote</strong> da generiše AI NHL tipove sa procenama verovatnoće.
                    </p>
                </div>
            </section>

            {/* Match Grid */}
            <SportMatchGrid
                sport="hockey"
                leagues={NHL_LEAGUES}
                accentColor="cyan-400"
                maxMatches={12}
            />

            {/* How to Bet Section */}
            <section className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                        Kako se Kladiti na NHL Utakmice
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-3xl">
                        NHL klađenje nudi uzbudljive mogućnosti sa brzom igrom i čestim iznenađenjima.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-2">Puck Linija</h3>
                            <p className="text-gray-400 text-sm">Hokej verzija spreda poena. Obično -1.5 ili +1.5 golova.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-2">Manije Linija</h3>
                            <p className="text-gray-400 text-sm">Jednostavno izaberite pobednika utakmice bez spreda.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-2">Totali</h3>
                            <p className="text-gray-400 text-sm">Kladite se na ukupan broj golova. NHL totali su obično 5.5-6.5.</p>
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
