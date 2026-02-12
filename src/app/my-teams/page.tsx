import { Metadata } from 'next'
import MyTeamsDashboard from '@/components/MyTeamsDashboard'

export const metadata: Metadata = {
  title: 'My Teams',
  description: 'Track your favorite teams and see their upcoming matches. Get personalized AI analysis for the teams you follow.',
  robots: {
    index: false, // User-specific page
    follow: false
  }
}

export default function MyTeamsPage() {
  return (
    <main className="min-h-screen bg-bg">
      <MyTeamsDashboard />
    </main>
  )
}
