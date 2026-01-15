import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hedge Bet Calculator - Lock In Guaranteed Profit | SportBot AI',
    description: 'Free hedge calculator. Calculate the optimal hedge bet amount to guarantee profit or minimize loss on your open bets. Works with American and Decimal odds.',
    keywords: ['hedge calculator', 'hedge bet calculator', 'hedging calculator', 'betting hedge calculator', 'lock in profit calculator'],
    openGraph: {
        title: 'Free Hedge Bet Calculator | SportBot AI',
        description: 'Calculate the optimal hedge bet to lock in guaranteed profit on your open bets.',
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
            name: 'What is hedge betting?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Hedge betting is placing a bet on the opposite outcome of an existing bet to reduce risk or lock in profit. For example, if you have a futures bet on a team to win, you can hedge by betting on their opponent to guarantee profit.',
            },
        },
        {
            '@type': 'Question',
            name: 'When should I hedge a bet?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Consider hedging when your original bet has significant value and you want to lock in guaranteed profit, the potential loss would be financially significant, or circumstances have changed and you want to reduce exposure.',
            },
        },
        {
            '@type': 'Question',
            name: 'How is the hedge amount calculated?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Hedge Bet = (Original Stake × Original Decimal Odds) / Hedge Decimal Odds. This calculates the exact amount to bet so you win the same regardless of which bet wins.',
            },
        },
        {
            '@type': 'Question',
            name: 'Is hedging always profitable?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Not always. If combined odds create too much vig, you might lock in a small loss. However, hedging is valuable for risk management—a small guaranteed loss is often better than risking a large loss.',
            },
        },
    ],
};

export default function HedgeCalculatorLayout({
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
