import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'US Sports Betting Statistics 2026 – State Data & Revenue',
  description: 'Comprehensive US sports betting statistics for 2026. State-by-state data on handle, revenue, tax rates, and market growth. Updated monthly with official sources.',
  keywords: [
    'us sports betting statistics',
    'sports betting revenue by state',
    'legal sports betting states',
    'sports betting handle',
    'sports betting tax revenue',
    'gambling statistics usa',
  ],
  alternates: {
    canonical: '/stats/us-sports-betting-statistics',
    languages: {
      'en': '/stats/us-sports-betting-statistics',
      'sr': '/sr/stats/us-sports-betting-statistics',
      'x-default': '/stats/us-sports-betting-statistics',
    },
  },
  openGraph: {
    title: 'US Sports Betting Statistics 2026 – Complete State Data',
    description: 'State-by-state sports betting data: handle, revenue, tax rates. Updated monthly.',
    type: 'article',
    images: ['/og-stats-us-betting.png'],
  },
};

export default function USBettingStatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
