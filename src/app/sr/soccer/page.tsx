/**
 * Soccer Landing Page - Serbian Version (/sr/soccer)
 */

import { Metadata } from 'next';
import SportMatchGrid from '@/components/SportMatchGrid';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'AI Fudbalske Prognoze i Kvote Danas - Tipovi i Linije za Klađenje',
    description: 'AI fudbalske prognoze i live kvote za Premier Ligu, La Ligu, Bundesligu, Ligu Šampiona. Tipovi zasnovani na podacima sa linijama za klađenje.',
    keywords: ['ai fudbalske prognoze', 'fudbal kvote', 'fudbal tipovi', 'prognoze fudbal', 'premier liga kvote', 'premier liga prognoze', 'la liga kvote', 'liga sampiona prognoze', 'fudbalske opklade', 'ai analiza fudbala'],
    openGraph: {
        title: 'AI Fudbalske Prognoze i Kvote Danas',
        description: 'AI prognoze za fudbal i live kvote. Tipovi za Premier Ligu, La Ligu, Ligu Šampiona.',
        url: 'https://sportbotai.com/sr/soccer',
    },
    alternates: {
        canonical: 'https://sportbotai.com/sr/soccer',
        languages: {
            'en': 'https://sportbotai.com/soccer',
            'sr': 'https://sportbotai.com/sr/soccer',
        },
    },
};

const SOCCER_LEAGUES = [
    { key: 'soccer_epl', name: 'Premier Liga' },
    { key: 'soccer_spain_la_liga', name: 'La Liga' },
    { key: 'soccer_germany_bundesliga', name: 'Bundesliga' },
    { key: 'soccer_italy_serie_a', name: 'Serija A' },
    { key: 'soccer_france_ligue_one', name: 'Ligue 1' },
    { key: 'soccer_uefa_champs_league', name: 'Liga Šampiona' },
];

export default function SoccerPageSr() {
    return (
        <div className="min-h-screen bg-bg relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Hero Section */}
            <section className="relative border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
                    <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                        <Link href="/sr" className="hover:text-white transition-colors">Početna</Link>
                        <span>/</span>
                        <Link href="/sr/matches" className="hover:text-white transition-colors">Mečevi</Link>
                        <span>/</span>
                        <span className="text-white">Fudbal</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-4xl">⚽</span>
                                <span className="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-bold tracking-wider uppercase rounded-full border border-green-500/20">
                                    Fudbal
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3">
                                AI Fudbalske Prognoze i Kvote
                            </h1>
                            <p className="text-gray-400 text-base sm:text-lg max-w-xl">
                                AI prognoze za fudbal i live kvote za Premier Ligu, La Ligu, Ligu Šampiona.
                                Tipovi zasnovani na podacima sa analizom verovatnoće.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="text-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-2xl font-bold text-green-400">50+</div>
                                <div className="text-xs text-gray-400">Liga</div>
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
                        Pronađite današnje <strong className="text-white">fudbalske kvote</strong> za sve evropske lige.
                        Bilo da tražite <strong className="text-white">Premier Liga kvote</strong>, La Liga ili Ligu Šampiona,
                        naš AI analizira kvote kladionica da vam pomogne pronaći vrednost.
                    </p>
                </div>
            </section>

            {/* Match Grid */}
            <SportMatchGrid
                sport="soccer"
                leagues={SOCCER_LEAGUES}
                accentColor="green-400"
                maxMatches={20}
            />

            {/* How to Bet Section */}
            <section className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                        Kako se Kladiti na Fudbal
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-3xl">
                        Fudbal je najpopularniji sport za klađenje u svetu.
                        Evo najpopularnijih tipova opklada:
                    </p>

                    <div className="grid sm:grid-cols-4 gap-4">
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-2">1X2</h3>
                            <p className="text-gray-400 text-sm">Izaberite pobednika: domaćin (1), nerešeno (X) ili gost (2).</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-2">Oba Tima Daju Gol</h3>
                            <p className="text-gray-400 text-sm">Kladite se da li će oba tima postići gol ili ne.</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-2">Over/Under Golovi</h3>
                            <p className="text-gray-400 text-sm">Kladite se na ukupan broj golova (npr. preko 2.5).</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                            <h3 className="text-white font-semibold mb-2">Azijski Hendikep</h3>
                            <p className="text-gray-400 text-sm">Hendikepi koji eliminišu nerešeni ishod.</p>
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
