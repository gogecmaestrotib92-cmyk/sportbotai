/**
 * Value Betting Explainer Section
 * 
 * SEO-focused section explaining value betting and how SportBot AI finds edges.
 * Keywords: value betting, expected value bets, AI betting predictions, sports betting analytics
 */

'use client';

import Link from 'next/link';
import PremiumIcon from '@/components/ui/PremiumIcon';

interface ValueBettingExplainerProps {
    locale?: 'en' | 'sr';
}

const translations = {
    en: {
        title: 'Why the Odds Are Wrong (And How to Spot It)',
        subtitle: 'Bookmakers make mistakes every day. Here\'s exactly where — and why.',

        intro: 'Every day, bookmakers set thousands of odds under time pressure. They can\'t watch every match, track every injury, or react to every lineup leak. That gap between their price and reality? That\'s where edge lives — and our AI finds it in 60 seconds.',

        sources: [
            {
                icon: 'target' as const,
                title: 'Slow Reactions',
                desc: 'A star player gets injured at 6pm. The odds don\'t move until 7pm. That hour is free money for anyone paying attention.',
            },
            {
                icon: 'chart' as const,
                title: 'Ignored Leagues',
                desc: 'Bookmakers spend 90% of their effort on the Premier League. Eredivisie? Serie B? Their odds are often 3-5% off.',
            },
            {
                icon: 'bolt' as const,
                title: 'Cross-Book Gaps',
                desc: 'One bookmaker adjusts, the rest lag behind. Our AI compares 50+ sources in real time to catch these windows.',
            },
        ],

        howWeWork: 'How We Find What They Miss',
        howWeWorkDesc: 'Our AI cross-references team form, head-to-head records, injury reports, and real-time odds from 50+ bookmakers. It calculates expected value by comparing our probability model against the market — and flags every edge above 2%.',

        formula: 'Expected Value = (Odds × AI Probability) − 100%',
        formulaNote: 'Positive EV = the market is underpricing this outcome',

        cta: 'Find Today\'s Edges',
        ctaSecondary: 'Value Betting Guide',
    },
    sr: {
        title: 'Zašto su Kvote Pogrešne (I Kako to Primetiti)',
        subtitle: 'Kladionice prave greške svaki dan. Evo gde tačno — i zašto.',

        intro: 'Svaki dan, kladionice postavljaju hiljade kvota pod pritiskom vremena. Ne mogu da gledaju svaki meč, prate svaku povredu, niti da reaguju na svaki procure postave. Taj jaz između njihove cene i stvarnosti? Tu živi prednost — a naš AI je pronalazi za 60 sekundi.',

        sources: [
            {
                icon: 'target' as const,
                title: 'Spore Reakcije',
                desc: 'Zvezda tima se povredi u 18h. Kvote se ne pomeraju do 19h. Taj sat je besplatan novac za svakoga ko obraća pažnju.',
            },
            {
                icon: 'chart' as const,
                title: 'Zanemarene Lige',
                desc: 'Kladionice troše 90% truda na Premijer Ligu. Eredivize? Serija B? Njihove kvote su često 3-5% netačne.',
            },
            {
                icon: 'bolt' as const,
                title: 'Razlike Između Kladionica',
                desc: 'Jedna kladionica koriguje, ostale kasne. Naš AI upoređuje 50+ izvora u realnom vremenu da uhvati ove prozore.',
            },
        ],

        howWeWork: 'Kako Nalazimo Ono Što Oni Propuštaju',
        howWeWorkDesc: 'Naš AI ukršta formu timova, međusobne rezultate, izveštaje o povredama i kvote u realnom vremenu od 50+ kladionica. Računa očekivanu vrednost upoređujući naš model verovatnoće sa tržištem — i označava svaku prednost iznad 2%.',

        formula: 'Očekivana Vrednost = (Kvota × AI Verovatnoća) − 100%',
        formulaNote: 'Pozitivna EV = tržište potcenjuje ovaj ishod',

        cta: 'Pronađi Današnje Prednosti',
        ctaSecondary: 'Vodič za Value Klađenje',
    },
};

export default function ValueBettingExplainer({ locale = 'en' }: ValueBettingExplainerProps) {
    const t = translations[locale];

    return (
        <section className="py-16 sm:py-20 bg-gradient-to-b from-bg-primary via-bg-primary to-[#0a0f0a]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                        {t.title}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
                        {t.subtitle}
                    </p>
                </div>

                {/* Intro paragraph */}
                <p className="text-base sm:text-lg text-gray-300 text-center max-w-3xl mx-auto mb-12 leading-relaxed">
                    {t.intro}
                </p>

                {/* 3 Sources of Value */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
                    {t.sources.map((source, index) => (
                        <div
                            key={index}
                            className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                                <PremiumIcon name={source.icon} size="lg" className="text-accent" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{source.title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{source.desc}</p>
                        </div>
                    ))}
                </div>

                {/* How We Work */}
                <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-accent/5 to-transparent border border-accent/20">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                            <PremiumIcon name="brain" size="lg" className="text-accent" />
                        </div>
                        {t.howWeWork}
                    </h3>
                    <p className="text-base text-gray-300 leading-relaxed mb-6">
                        {t.howWeWorkDesc}
                    </p>

                    {/* Formula box */}
                    <div className="inline-flex flex-col items-start gap-2 px-5 py-4 rounded-xl bg-black/30 border border-white/10">
                        <code className="text-accent font-mono text-sm sm:text-base font-semibold">
                            {t.formula}
                        </code>
                        <span className="text-xs text-gray-500">{t.formulaNote}</span>
                    </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                    <Link
                        href={locale === 'sr' ? '/sr/matches' : '/matches'}
                        className="btn-primary text-center px-8 py-3.5"
                    >
                        {t.cta}
                    </Link>
                    <Link
                        href={locale === 'sr' ? '/sr/blog' : '/blog'}
                        className="btn-secondary text-center px-8 py-3.5"
                    >
                        {t.ctaSecondary}
                    </Link>
                </div>
            </div>
        </section>
    );
}
