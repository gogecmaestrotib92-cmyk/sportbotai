import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Statistika Sportskog Klađenja u SAD 2026 – Podaci po Državama',
  description: 'Sveobuhvatna statistika sportskog klađenja u SAD za 2026. Podaci po državama: promet, prihodi, porezi i rast tržišta. Ažurirano mesečno.',
  keywords: [
    'statistika sportskog kladjenja sad',
    'legalno kladjenje amerika',
    'sportsko kladjenje po drzavama',
    'prihodi od kladjenja',
    'porez na kladjenje',
  ],
  alternates: {
    canonical: '/sr/stats/us-sports-betting-statistics',
    languages: {
      'en': '/stats/us-sports-betting-statistics',
      'sr': '/sr/stats/us-sports-betting-statistics',
      'x-default': '/stats/us-sports-betting-statistics',
    },
  },
  openGraph: {
    title: 'Statistika Sportskog Klađenja u SAD 2026',
    description: 'Podaci po državama: promet, prihodi, porezi. Mesečno ažuriranje.',
    type: 'article',
    images: ['/og-stats-us-betting.png'],
  },
};

export default function USBettingStatsLayoutSR({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
