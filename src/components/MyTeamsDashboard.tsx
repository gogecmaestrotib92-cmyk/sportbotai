/**
 * My Teams Dashboard
 * 
 * Premium dark UI for managing favorite teams.
 * Shows saved teams and their upcoming matches.
 * 
 * HOW IT WORKS:
 * 1. User saves teams from match pages (click heart icon)
 * 2. Teams are stored in database via FavoritesContext
 * 3. This page fetches upcoming matches for saved teams
 * 4. User can quickly access analysis for their teams' matches
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useFavorites } from '@/lib/FavoritesContext'
import { generateMatchSlug } from '@/lib/match-utils'
import Link from 'next/link'
import TeamLogo from '@/components/ui/TeamLogo'

interface UpcomingMatch {
  id: string
  homeTeam: string
  awayTeam: string
  commenceTime: string
  sport: string
  league?: string
  sportTitle?: string
}

// Generate clean, SEO-friendly match URL slug
function generateMatchId(match: UpcomingMatch): string {
  return generateMatchSlug(match.homeTeam, match.awayTeam, match.sport, match.commenceTime);
}

export default function MyTeamsDashboard() {
  const { status: authStatus } = useSession()
  const { favorites, isLoading, removeFavoriteById, maxTeams, error } = useFavorites()
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch upcoming matches for favorite teams
  useEffect(() => {
    if (favorites.length === 0) {
      setUpcomingMatches([])
      return
    }

    const fetchUpcomingMatches = async () => {
      setLoadingMatches(true)
      try {
        // Get unique sports from favorites
        const sportKeys: string[] = []
        const seen = new Set<string>()
        for (const f of favorites) {
          if (f.sportKey && !seen.has(f.sportKey)) {
            seen.add(f.sportKey)
            sportKeys.push(f.sportKey)
          }
        }
        
        // Also check sport field if sportKey is missing
        for (const f of favorites) {
          if (f.sport && !seen.has(f.sport)) {
            seen.add(f.sport)
            sportKeys.push(f.sport)
          }
        }

        console.log('[MyTeams] Fetching events for sports:', sportKeys)
        console.log('[MyTeams] Favorites:', favorites.map(f => ({ name: f.teamName, sport: f.sport, sportKey: f.sportKey })))
        
        // Fetch events for each sport
        const matchPromises = sportKeys.map(async (sportKey) => {
          const response = await fetch(`/api/events/${sportKey}`)
          if (!response.ok) {
            console.log(`[MyTeams] Failed to fetch ${sportKey}:`, response.status)
            return []
          }
          const data = await response.json()
          console.log(`[MyTeams] Got ${data.events?.length || 0} events for ${sportKey}`)
          
          // API already returns camelCase: homeTeam, awayTeam, commenceTime
          return (data.events || []).map((event: {
            matchId: string;
            homeTeam: string;
            awayTeam: string;
            commenceTime: string;
            sportTitle?: string;
          }) => ({
            id: event.matchId,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            commenceTime: event.commenceTime,
            sport: sportKey,
            sportTitle: event.sportTitle || data.sportTitle
          }))
        })

        const allMatches = (await Promise.all(matchPromises)).flat()
        console.log('[MyTeams] Total matches fetched:', allMatches.length)

        // Filter to only include matches with favorited teams
        // Use normalized name matching for better results
        const favoriteNames = favorites.map(f => normalizeName(f.teamName))
        
        const relevantMatches = allMatches.filter(match => {
          const homeNorm = normalizeName(match.homeTeam)
          const awayNorm = normalizeName(match.awayTeam)
          
          // Check if any favorite team matches
          const isMatch = favoriteNames.some(favName => 
            homeNorm.includes(favName) || 
            favName.includes(homeNorm) ||
            awayNorm.includes(favName) || 
            favName.includes(awayNorm)
          )
          
          return isMatch
        })

        console.log('[MyTeams] Relevant matches:', relevantMatches.length, relevantMatches.map(m => `${m.homeTeam} vs ${m.awayTeam}`))

        // Sort by date
        relevantMatches.sort((a, b) => 
          new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime()
        )

        setUpcomingMatches(relevantMatches.slice(0, 10)) // Limit to 10
      } catch (err) {
        console.error('Error fetching upcoming matches:', err)
      } finally {
        setLoadingMatches(false)
      }
    }

    fetchUpcomingMatches()
  }, [favorites])

  const handleRemove = async (id: string) => {
    setDeletingId(id)
    await removeFavoriteById(id)
    setDeletingId(null)
  }

  // Not logged in
  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-bg-card rounded-2xl flex items-center justify-center mx-auto mb-6 border border-divider">
            <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">My Teams</h2>
          <p className="text-text-secondary mb-8">
            Sign in to save your favorite teams and get personalized match updates.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg rounded-xl font-semibold hover:bg-accent-green transition-colors"
          >
            Sign In to Continue
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  // Loading state
  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-text-muted">Loading your teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header Section */}
      <div className="border-b border-divider">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-3">
                <span className="text-2xl">❤️</span>
                My Teams
              </h1>
              <p className="text-text-secondary mt-1">
                {favorites.length} of {maxTeams} teams saved
              </p>
            </div>

            {/* Progress Ring */}
            <div className="flex items-center gap-4 bg-bg-card rounded-xl px-5 py-3 border border-divider">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-divider"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${(favorites.length / maxTeams) * 125.6} 125.6`}
                    className="text-accent"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-primary">
                  {favorites.length}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Teams Saved</p>
                <p className="text-xs text-text-muted">Max {maxTeams} allowed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {favorites.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-bg-card rounded-2xl flex items-center justify-center mx-auto mb-6 border border-divider">
              <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No teams saved yet</h3>
            <p className="text-text-secondary max-w-sm mx-auto mb-8">
              Start following teams to see their upcoming matches and get quick access to analysis.
            </p>
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg rounded-xl font-semibold hover:bg-accent-green transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Find Teams to Follow
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Saved Teams List */}
            <div className="bg-bg-card rounded-2xl border border-divider overflow-hidden">
              <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  Saved Teams
                </h2>
                <span className="text-xs text-text-muted bg-bg px-2 py-1 rounded-lg">
                  {favorites.length} teams
                </span>
              </div>
              <ul className="divide-y divide-divider">
                {favorites.map((team) => (
                  <li 
                    key={team.id}
                    className={`flex items-center justify-between px-5 py-4 hover:bg-bg-hover transition-colors ${
                      deletingId === team.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <TeamLogo 
                        teamName={team.teamName} 
                        sport={team.sportKey || team.sport || 'soccer'} 
                        size="lg" 
                        className="rounded-xl"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">{team.teamName}</p>
                        <p className="text-sm text-text-muted truncate">
                          {team.league || team.sport}
                          {team.country && ` • ${team.country}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(team.id)}
                      disabled={deletingId === team.id}
                      className="p-2.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
                      title="Remove from favorites"
                    >
                      {deletingId === team.id ? (
                        <div className="w-5 h-5 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upcoming Matches */}
            <div className="bg-bg-card rounded-2xl border border-divider overflow-hidden">
              <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  Upcoming Matches
                </h2>
                {upcomingMatches.length > 0 && (
                  <span className="text-xs text-text-muted bg-bg px-2 py-1 rounded-lg">
                    {upcomingMatches.length} found
                  </span>
                )}
              </div>
              
              {loadingMatches ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              ) : upcomingMatches.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-bg rounded-xl flex items-center justify-center mx-auto mb-4 border border-divider">
                    <span className="text-2xl">📅</span>
                  </div>
                  <p className="text-text-secondary">No upcoming matches found</p>
                  <p className="text-text-muted text-sm mt-1">Check back soon!</p>
                </div>
              ) : (
                <ul className="divide-y divide-divider">
                  {upcomingMatches.map((match) => (
                    <li key={match.id}>
                      <Link
                        href={`/match/${generateMatchId(match)}`}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-bg-hover transition-colors group"
                      >
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <TeamLogo teamName={match.homeTeam} sport={match.sport} size="md" className="rounded-lg" />
                          <span className="text-text-muted text-xs font-medium">vs</span>
                          <TeamLogo teamName={match.awayTeam} sport={match.sport} size="md" className="rounded-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate group-hover:text-primary transition-colors">
                            {match.homeTeam} vs {match.awayTeam}
                          </p>
                          <p className="text-sm text-text-muted truncate">
                            {formatMatchDate(match.commenceTime)}
                            {match.sportTitle && ` • ${match.sportTitle}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-lg">
                            Analyze
                          </span>
                          <svg className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {favorites.length >= 3 && maxTeams === 3 && (
          <div className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  Want to follow more teams?
                </h3>
                <p className="text-text-secondary text-sm">
                  Upgrade to Pro to save up to 20 teams and unlock unlimited analysis.
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-bg rounded-xl font-semibold hover:bg-accent-green transition-colors whitespace-nowrap"
              >
                View Pro Plans
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* How it works - Info card */}
        <div className="mt-8 bg-bg-card rounded-2xl border border-divider p-6">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            How My Teams Works
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Save Teams</p>
                <p className="text-xs text-text-muted">Click the ❤️ on any team&apos;s logo in match pages</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Track Matches</p>
                <p className="text-xs text-text-muted">See all upcoming games in one place</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Quick Analysis</p>
                <p className="text-xs text-text-muted">One-click access to AI insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function generateSlug(teamName: string): string {
  return teamName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

function formatMatchDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } else if (days === 1) {
    return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } else if (days < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
