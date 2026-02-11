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
        title: 'What Are Value Bets?',
        subtitle: 'Sports betting analytics powered by AI probability modeling',

        intro: 'Value bets occur when bookmaker odds imply a lower probability than the actual chance of an outcome. This mispricing creates an edge for informed bettors.',

        sources: [
            {
                icon: 'target' as const,
                title: 'Market Inefficiency',
                desc: 'Bookmakers react slowly to lineup changes, injuries, and form shifts—creating temporary mispricings.',
            },
            {
                icon: 'chart' as const,
                title: 'Data Blind Spots',
                desc: 'Lower leagues and less popular sports receive less attention, leading to inaccurate odds.',
            },
            {
                icon: 'bolt' as const,
                title: 'Line Movement Lag',
                desc: 'When one bookmaker adjusts odds, others lag behind—opening value windows.',
            },
        ],

        howWeWork: 'How SportBot AI Finds Value',
        howWeWorkDesc: 'Our AI analyzes team form, head-to-head records, and real-time odds across multiple bookmakers. We calculate expected value by comparing our model probability with implied market odds—surfacing edges you can act on.',

        formula: 'Expected Value = (Odds × AI Probability) − 100%',
        formulaNote: 'Positive EV means the bet has value',

        cta: 'Browse Matches',
        ctaSecondary: 'Value Betting Guide',
    },
    sr: {
        title: 'Šta su Value Betovi?',
        subtitle: 'Sportska analitika klađenja pokretana AI modeliranjem verovatnoće',

        intro: 'Value betovi nastaju kada kvote kladionica impliciraju nižu verovatnoću od stvarne šanse ishoda. Ovo pogrešno cenjenje stvara prednost za informisane kladioničare.',

        sources: [
            {
                icon: 'target' as const,
                title: 'Neefikasnost Tržišta',
                desc: 'Kladionice sporo reaguju na promene postave, povrede i formu—stvarajući privremena pogrešna cenjenja.',
            },
            {
                icon: 'chart' as const,
                title: 'Slepe Tačke Podataka',
                desc: 'Niže lige i manje popularni sportovi dobijaju manje pažnje, što dovodi do netačnih kvota.',
            },
            {
                icon: 'bolt' as const,
                title: 'Kašnjenje Pomeranja Linija',
                desc: 'Kada jedna kladionica prilagodi kvote, druge kasne—otvarajući prozore vrednosti.',
            },
        ],

        howWeWork: 'Kako SportBot AI Pronalazi Vrednost',
        howWeWorkDesc: 'Naš AI analizira formu timova, međusobne rezultate i kvote u realnom vremenu kod više kladionica. Računamo očekivanu vrednost upoređujući verovatnoću našeg modela sa impliciranim tržišnim kvotama—otkrivajući prednosti na koje možete delovati.',

        formula: 'Očekivana Vrednost = (Kvota × AI Verovatnoća) − 100%',
        formulaNote: 'Pozitivna EV znači da opklada ima vrednost',

        cta: 'Pregledaj Utakmice',
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
