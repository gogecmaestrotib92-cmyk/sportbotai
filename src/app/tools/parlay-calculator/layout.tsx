import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Parlay Calculator - Free Parlay Odds & Payout Calculator',
    description: 'Free parlay calculator for sports betting. Calculate your parlay payout for NFL, NBA, MLB & more. Enter odds, see total parlay odds & potential winnings instantly. Supports 2-15 legs.',
    keywords: ['parlay calculator', 'free parlay calculator', 'parlay odds calculator', 'parlay payout calculator', 'nfl parlay calculator', 'nba parlay calculator', 'accumulator calculator', 'multi bet calculator', 'same game parlay calculator', 'parlay betting calculator'],
    openGraph: {
        title: 'Free Parlay Calculator - Sports Betting Odds & Payout',
        description: 'Calculate parlay payouts for NFL, NBA, MLB & more. Add up to 15 legs and see total odds instantly.',
        type: 'website',
        url: 'https://www.sportbotai.com/tools/parlay-calculator',
    },
    alternates: {
        canonical: 'https://www.sportbotai.com/tools/parlay-calculator',
    },
};

// FAQ Schema for SEO rich results - expanded with more questions
const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What is a parlay bet?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'A parlay (also called an accumulator) is a single bet that combines multiple selections into one wager. All selections must win for the parlay to pay out. The odds multiply together, creating higher potential payouts but with lower probability of winning.',
            },
        },
        {
            '@type': 'Question',
            name: 'How does the parlay calculator work?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'The parlay calculator converts all odds to decimal format, then multiplies them together to get the total parlay odds. For American odds: +200 becomes 3.0 in decimal, -150 becomes 1.67. The calculator then multiplies your stake by the combined decimal odds to show your potential payout.',
            },
        },
        {
            '@type': 'Question',
            name: 'How are parlay odds calculated?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Parlay odds are calculated by multiplying the decimal odds of each leg. Example: Leg 1 (-110 = 1.91) × Leg 2 (+100 = 2.00) × Leg 3 (-105 = 1.95) = 7.45 total decimal odds, or approximately +645 in American odds.',
            },
        },
        {
            '@type': 'Question',
            name: 'Are a parlay calculator and odds payout calculator the same thing?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. A parlay calculator handles multi-leg bets by combining the odds of each leg. An odds payout calculator is for single bets. A parlay calculator handles the compounding nature of parlays, while an odds calculator does not.',
            },
        },
        {
            '@type': 'Question',
            name: 'Are parlays a good betting strategy?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Parlays offer higher payouts but have lower expected value than straight bets. The more legs you add, the more the house edge compounds. Most professional bettors avoid large parlays (5+ legs), but 2-3 leg correlated parlays can occasionally offer value.',
            },
        },
        {
            '@type': 'Question',
            name: 'What happens if one leg of my parlay pushes?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'If a leg pushes (ties), that leg is typically removed from the parlay and the odds are recalculated with the remaining legs. A 4-leg parlay becomes a 3-leg parlay. DraftKings and FanDuel typically remove the leg.',
            },
        },
        {
            '@type': 'Question',
            name: 'What is a same game parlay (SGP)?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'A same game parlay (SGP) combines multiple bets from the same event—like an NFL moneyline, over/under, and player props all in one parlay. Most sportsbooks offer SGPs with adjusted odds since the outcomes are correlated.',
            },
        },
        {
            '@type': 'Question',
            name: 'How many legs can I add to a parlay?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Most sportsbooks allow parlays with 2-15 legs. This parlay calculator supports up to 15 legs. A 10-leg parlay at -110 each has only about a 0.09% chance of winning (roughly 1 in 1,100).',
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
