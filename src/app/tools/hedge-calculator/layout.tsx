import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hedge Calculator - Free Hedge Bet Calculator',
    description: 'Free hedge bet calculator for sports betting. Calculate how much to hedge on NFL, NBA, MLB bets to lock in guaranteed profit. Works with parlays and futures.',
    keywords: ['hedge calculator', 'hedge bet calculator', 'hedging calculator', 'betting hedge calculator', 'lock in profit calculator', 'parlay hedge calculator', 'futures hedge calculator', 'arbitrage calculator'],
    openGraph: {
        title: 'Free Hedge Bet Calculator',
        description: 'Calculate the optimal hedge bet to lock in guaranteed profit on your open bets.',
        type: 'website',
        url: 'https://www.sportbotai.com/tools/hedge-calculator',
    },
    alternates: {
        canonical: 'https://www.sportbotai.com/tools/hedge-calculator',
    },
};

// FAQ Schema for SEO rich results - expanded
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
                text: 'Consider hedging when your original bet has significant value and you want to lock in guaranteed profit, the potential loss would be financially significant, circumstances have changed, or you are on the final leg of a big parlay.',
            },
        },
        {
            '@type': 'Question',
            name: 'How is the hedge bet amount calculated?',
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
        {
            '@type': 'Question',
            name: 'Can I hedge a parlay bet?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! Hedging parlays is common when you are on the final leg(s). If you have a 4-leg parlay with 3 legs won, you can hedge the final leg using this calculator.',
            },
        },
        {
            '@type': 'Question',
            name: 'What is the difference between hedging and arbitrage?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Hedging protects an existing bet that is now in a favorable position. Arbitrage involves placing bets on all outcomes simultaneously when odds discrepancies guarantee profit.',
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
