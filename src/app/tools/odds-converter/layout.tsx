import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Odds Converter Calculator - Convert American, Decimal & Fractional Odds',
    description: 'Free odds converter tool. Convert between American, Decimal, and Fractional betting odds instantly. Calculate implied probability for any sports betting line.',
    keywords: ['odds converter', 'betting odds calculator', 'decimal to american odds', 'fractional odds converter', 'implied probability calculator', 'sports betting calculator'],
    openGraph: {
        title: 'Free Odds Converter Calculator | SportBot AI',
        description: 'Convert between American, Decimal, and Fractional betting odds instantly. See implied probability for any line.',
        type: 'website',
    },
};

// FAQ Schema for SEO rich results
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
            name: 'What does implied probability mean?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Implied probability is the likelihood of an outcome as suggested by the betting odds. It tells you what chance the market believes an event has of happening. For example, -200 odds imply a 66.7% probability.',
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
