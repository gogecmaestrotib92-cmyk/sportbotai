/**
 * Serbian My Teams Page - /sr/my-teams
 * Moji Timovi - praćenje omiljenih timova
 */

import { Metadata } from 'next';
import MyTeamsDashboardSr from './MyTeamsDashboardSr';

export const metadata: Metadata = {
  title: 'Moji Timovi',
  description: 'Pratite vaše omiljene timove i vidite njihove predstojeće utakmice. Dobijte personalizovanu AI analizu za timove koje pratite.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SerbianMyTeamsPage() {
  return (
    <main className="min-h-screen bg-bg">
      <MyTeamsDashboardSr />
    </main>
  );
}
