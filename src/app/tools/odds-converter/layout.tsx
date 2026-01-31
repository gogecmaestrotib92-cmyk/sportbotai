import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Odds Converter - Free Betting Odds Calculator',
    description: 'Free odds converter for sports betting. Convert American odds to decimal, decimal to fractional, and see implied probability. NFL, NBA, MLB odds conversion chart included.',
    keywords: ['odds converter', 'betting odds calculator', 'american to decimal odds', 'decimal to american odds', 'fractional odds converter', 'implied probability calculator', 'sports betting odds calculator', 'odds conversion chart'],
    openGraph: {
        title: 'Free Odds Converter - Betting Odds Calculator | SportBot AI',
        description: 'Convert between American, Decimal, and Fractional betting odds instantly. See implied probability for any line.',
        type: 'website',
        url: 'https://www.sportbotai.com/tools/odds-converter',
    },
    alternates: {
        canonical: 'https://www.sportbotai.com/tools/odds-converter',
    },
};

// FAQ Schema for SEO rich results - expanded
const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'How do I convert American odds to decimal?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'For positive American odds: Decimal = (American / 100) + 1. For example, +200 becomes 3.00. For negative American odds: Decimal = (100 / |American|) + 1. For example, -150 becomes 1.67.',
            },
        },
        {
            '@type': 'Question',
            name: 'How do I convert decimal odds to American?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'For decimal odds ≥ 2.00: American = (Decimal - 1) × 100. Example: 3.00 becomes +200. For decimal odds < 2.00: American = -100 / (Decimal - 1). Example: 1.50 becomes -200.',
            },
        },
        {
            '@type': 'Question',
            name: 'What does implied probability mean?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Implied probability is the likelihood of an outcome as suggested by the betting odds. For example, -200 odds imply a 66.7% probability, while +200 odds imply a 33.3% probability.',
            },
        },
        {
            '@type': 'Question',
            name: 'Which odds format is best for calculating payouts?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Decimal odds are the easiest for calculating payouts. Simply multiply your stake by the decimal odds to get your total return.',
            },
        },
        {
            '@type': 'Question',
            name: 'Why do American odds use positive and negative numbers?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Negative odds indicate the favorite and show how much you must bet to win $100. Positive odds indicate the underdog and show how much you win from a $100 bet.',
            },
        },
        {
            '@type': 'Question',
            name: 'What are fractional odds?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Fractional odds are traditional UK/Irish format written as fractions like 5/1 or 3/2. The first number is your profit relative to the second number (your stake). 5/1 means you win $5 for every $1 bet.',
            },
        },
        {
            '@type': 'Question',
            name: 'Where are different odds formats used?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'American odds are used primarily in the US (NFL, NBA, MLB betting). Decimal odds are standard in Europe, Canada, and Australia. Fractional odds are traditional in the UK and Ireland.',
            },
        },
    ],
};

export default function ToolsOddsConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            {children}
        </>
    );
}
