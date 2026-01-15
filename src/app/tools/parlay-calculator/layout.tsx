import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Parlay Calculator - Calculate Multi-Bet Payouts | SportBot AI',
    description: 'Free parlay calculator. Calculate potential payouts for multi-leg parlays with up to 15 selections. Works with American and Decimal odds.',
    keywords: ['parlay calculator', 'parlay odds calculator', 'accumulator calculator', 'multi bet calculator', 'parlay payout calculator'],
    openGraph: {
        title: 'Free Parlay Calculator | SportBot AI',
        description: 'Calculate potential payouts for multi-leg parlays. Add up to 15 legs and see total odds instantly.',
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
            name: 'What is a parlay bet?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'A parlay is a single bet that combines multiple selections into one wager. All selections must win for the parlay to pay out. The odds multiply together, creating higher potential payouts but with lower probability.',
            },
        },
        {
            '@type': 'Question',
            name: 'How are parlay odds calculated?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Parlay odds are calculated by multiplying the decimal odds of each leg together. For example: 1.91 × 2.00 × 1.80 = 6.88 total decimal odds. Your stake is then multiplied by this total.',
            },
        },
        {
            '@type': 'Question',
            name: 'Are parlays a good betting strategy?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Parlays offer higher payouts but have lower expected value than straight bets. The more legs you add, the more the house edge compounds. Most professionals avoid large parlays.',
            },
        },
        {
            '@type': 'Question',
            name: 'What happens if one leg of my parlay pushes?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'If a leg pushes (ties), that leg is typically removed and odds are recalculated with remaining legs. A 4-leg parlay becomes a 3-leg parlay.',
            },
        },
    ],
};

export default function ParlayCalculatorLayout({
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
