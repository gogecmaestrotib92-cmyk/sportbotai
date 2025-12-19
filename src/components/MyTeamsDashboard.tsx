'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useFavorites } from '@/lib/FavoritesContext'
import { Heart, Trash2, Calendar, Trophy, ChevronRight, Star, Loader2, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface UpcomingMatch {
  id: string
  homeTeam: string
  awayTeam: string
  commenceTime: string
  sport: string
  league?: string
  sportTitle?: string
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
        
        // Fetch events for each sport
        const matchPromises = sportKeys.map(async (sportKey) => {
          const response = await fetch(`/api/events/${sportKey}`)
          if (!response.ok) return []
          const data = await response.json()
          return (data.events || []).map((event: UpcomingMatch) => ({
            ...event,
            sport: sportKey,
            sportTitle: data.sportTitle
          }))
        })

        const allMatches = (await Promise.all(matchPromises)).flat()

        // Filter to only include matches with favorited teams
        const teamSlugs = favorites.map(f => f.teamSlug)
        const relevantMatches = allMatches.filter(match => {
          const homeSlug = generateSlug(match.homeTeam)
          const awaySlug = generateSlug(match.awayTeam)
          return teamSlugs.includes(homeSlug) || teamSlugs.includes(awaySlug)
        })

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">My Teams</h2>
          <p className="text-gray-600 mb-6">
            Sign in to save your favorite teams and get personalized match updates.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In to Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    )
  }

  // Loading state
  if (authStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-500">Loading your teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            My Teams
          </h1>
          <p className="text-gray-600 mt-1">
            {favorites.length} of {maxTeams} teams saved
          </p>
        </div>

        {/* Progress indicator */}
        <div className="hidden sm:flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${(favorites.length / maxTeams) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {favorites.length}/{maxTeams}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams saved yet</h3>
          <p className="text-gray-600 max-w-sm mx-auto mb-6">
            Start following teams to see their upcoming matches and get quick access to analysis.
          </p>
          <Link
            href="/matches"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Find Teams to Follow
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Favorite Teams List */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Saved Teams
              </h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {favorites.map((team) => (
                <li 
                  key={team.id}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                    deletingId === team.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {team.teamLogo ? (
                      <Image
                        src={team.teamLogo}
                        alt={team.teamName}
                        width={32}
                        height={32}
                        className="rounded-full object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{team.teamName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {team.league || team.sport}
                        {team.country && ` • ${team.country}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(team.id)}
                    disabled={deletingId === team.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from favorites"
                  >
                    {deletingId === team.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming Matches */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Upcoming Matches
              </h2>
            </div>
            
            {loadingMatches ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : upcomingMatches.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No upcoming matches found</p>
                <p className="text-gray-400 text-xs mt-1">Check back soon!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcomingMatches.map((match) => (
                  <li key={match.id}>
                    <Link
                      href={`/analyzer?homeTeam=${encodeURIComponent(match.homeTeam)}&awayTeam=${encodeURIComponent(match.awayTeam)}&sport=${match.sport}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                          {match.homeTeam} vs {match.awayTeam}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatMatchDate(match.commenceTime)}
                          {match.sportTitle && ` • ${match.sportTitle}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
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
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Want to follow more teams?</h3>
          <p className="text-gray-600 text-sm mb-4">
            Upgrade to Pro to save up to 20 teams and unlock unlimited analysis.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Pro Plans
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      )}
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
