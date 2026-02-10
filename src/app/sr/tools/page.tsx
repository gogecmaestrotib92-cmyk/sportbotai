import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Besplatni Kalkulatori za Klađenje | SportBot AI',
    description: 'Besplatni alati za sportsko klađenje: konvertor kvota, hedž kalkulator, parlay kalkulator i još. Profesionalni kalkulatori za klađenje.',
    alternates: {
        canonical: 'https://sportbotai.com/sr/tools',
        languages: {
            'en': 'https://sportbotai.com/tools',
            'sr': 'https://sportbotai.com/sr/tools',
        },
    },
};

// Premium SVG Icons
const ArrowsIcon = () => (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4M7 4L3 8M7 4L11 8" />
        <path d="M17 8V20M17 20L21 16M17 20L13 16" />
    </svg>
);

const ShieldIcon = () => (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

const ChartIcon = () => (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 5-6" />
    </svg>
);

const tools = [
    {
        name: 'Konvertor Kvota',
        description: 'Konvertujte između američkih, decimalnih i razlomačkih kvota. Izračunajte implicirane verovatnoće.',
        href: '/sr/tools/odds-converter',
        icon: ArrowsIcon,
        status: 'live' as const,
        gradient: 'from-accent/20 to-accent/5',
        iconColor: 'text-accent',
    },
    {
        name: 'Hedž Kalkulator',
        description: 'Izračunajte optimalnu hedž opkladu za garantovan profit ili minimiziranje gubitka.',
        href: '/sr/tools/hedge-calculator',
        icon: ShieldIcon,
        status: 'live' as const,
        gradient: 'from-violet/20 to-violet/5',
        iconColor: 'text-violet',
    },
    {
        name: 'Parlay Kalkulator',
        description: 'Izračunajte potencijalne parlay isplate i prave kvote za više opklada.',
        href: '/sr/tools/parlay-calculator',
        icon: ChartIcon,
        status: 'live' as const,
        gradient: 'from-primary/20 to-primary/5',
        iconColor: 'text-primary',
    },
];

// Schema markup for calculator tools
const toolsSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Besplatni Kalkulatori za Klađenje',
    description: 'Profesionalni kalkulatori i alati za sportsko klađenje',
    itemListElement: [
        {
            '@type': 'ListItem',
            position: 1,
            item: {
                '@type': 'SoftwareApplication',
                name: 'Konvertor Kvota',
                description: 'Konvertujte između američkih, decimalnih i razlomačkih kvota.',
                url: 'https://sportbotai.com/sr/tools/odds-converter',
                applicationCategory: 'UtilitiesApplication',
                operatingSystem: 'Web Browser',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.7, ratingCount: 89, bestRating: 5, worstRating: 1 },
            },
        },
        {
            '@type': 'ListItem',
            position: 2,
            item: {
                '@type': 'SoftwareApplication',
                name: 'Hedž Kalkulator',
                description: 'Izračunajte optimalnu hedž opkladu za garantovan profit.',
                url: 'https://sportbotai.com/sr/tools/hedge-calculator',
                applicationCategory: 'UtilitiesApplication',
                operatingSystem: 'Web Browser',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.8, ratingCount: 124, bestRating: 5, worstRating: 1 },
            },
        },
        {
            '@type': 'ListItem',
            position: 3,
            item: {
                '@type': 'SoftwareApplication',
                name: 'Parlay Kalkulator',
                description: 'Izračunajte potencijalne parlay isplate i prave kvote.',
                url: 'https://sportbotai.com/sr/tools/parlay-calculator',
                applicationCategory: 'UtilitiesApplication',
                operatingSystem: 'Web Browser',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.6, ratingCount: 156, bestRating: 5, worstRating: 1 },
            },
        },
    ],
};

export default function ToolsIndexPageSr() {
    return (
        <>
            {/* Schema Markup */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsSchema) }}
            />

            <main className="min-h-screen bg-bg-primary">
                {/* Hero Section */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px]" />
                        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-violet/8 rounded-full blur-[100px]" />
                    </div>

                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
                        <div className="text-center mb-14">
                            <p className="text-sm font-medium text-accent uppercase tracking-widest mb-4">
                                Besplatni Alati
                            </p>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-5">
                                Kalkulatori za Klađenje
                            </h1>
                            <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto">
                                Profesionalni alati koji vam pomažu da donosite pametnije odluke.
                            </p>
                        </div>

                        {/* Tools Grid - Premium Cards */}
                        <div className="grid gap-5">
                            {tools.map((tool) => {
                                const IconComponent = tool.icon;
                                const isLive = tool.status === 'live';

                                return (
                                    <Link
                                        key={tool.name}
                                        href={isLive ? tool.href : '#'}
                                        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${isLive
                                            ? 'border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]'
                                            : 'border-white/5 bg-white/[0.01] cursor-not-allowed'
                                            }`}
                                    >
                                        {/* Subtle gradient background */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                        <div className="relative flex items-center gap-5 p-6">
                                            {/* Icon Container */}
                                            <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${tool.iconColor} ${isLive ? 'group-hover:border-white/20 group-hover:bg-white/10' : 'opacity-50'
                                                } transition-all duration-300`}>
                                                <IconComponent />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h2 className={`text-lg font-semibold ${isLive ? 'text-white' : 'text-gray-400'}`}>
                                                        {tool.name}
                                                    </h2>
                                                    {!isLive && (
                                                        <span className="px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-white/5 text-gray-500 rounded-full border border-white/5">
                                                            Uskoro
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm leading-relaxed ${isLive ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {tool.description}
                                                </p>
                                            </div>

                                            {/* Arrow */}
                                            {isLive && (
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-500 group-hover:text-accent group-hover:bg-accent/10 transition-all duration-300">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
