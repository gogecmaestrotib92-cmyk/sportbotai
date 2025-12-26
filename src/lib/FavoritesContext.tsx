'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Plan } from '@prisma/client'

interface FavoriteTeam {
  id: string
  teamName: string
  teamSlug: string
  sport: string
  league?: string | null
  sportKey?: string | null
  teamLogo?: string | null
  country?: string | null
  notifyMatches: boolean
  notifyInjuries: boolean
  createdAt: string
}

interface FavoritesContextType {
  favorites: FavoriteTeam[]
  isLoading: boolean
  error: string | null
  
  // Actions
  addFavorite: (team: AddFavoriteParams) => Promise<boolean>
  removeFavorite: (teamName: string, sport: string) => Promise<boolean>
  removeFavoriteById: (id: string) => Promise<boolean>
  isFavorite: (teamName: string, sport: string) => boolean
  refreshFavorites: () => Promise<void>
  
  // Limits
  maxTeams: number
  canAddMore: boolean
}

interface AddFavoriteParams {
  teamName: string
  sport: string
  league?: string
  sportKey?: string
  teamLogo?: string
  country?: string
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Determine max teams based on plan
  const isPro = session?.user?.plan && session.user.plan !== Plan.FREE
  const maxTeams = isPro ? 20 : 3
  const canAddMore = favorites.length < maxTeams

  // Fetch favorites on mount and when session changes
  const fetchFavorites = useCallback(async () => {
    if (status === 'loading') return
    
    if (!session?.user?.id) {
      setFavorites([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/favorites')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch favorites')
      }

      setFavorites(data.favorites || [])
    } catch (err) {
      console.error('Error fetching favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to load favorites')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, status])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  // Check if team is favorited
  const isFavorite = useCallback((teamName: string, sport: string): boolean => {
    const slug = generateSlug(teamName)
    return favorites.some(f => f.teamSlug === slug && f.sport === sport)
  }, [favorites])

  // Add a team to favorites - OPTIMISTIC UPDATE
  const addFavorite = async (team: AddFavoriteParams): Promise<boolean> => {
    if (!session?.user?.id) {
      setError('Please sign in to save teams')
      return false
    }

    if (!canAddMore) {
      setError(`You can only save ${maxTeams} teams on your current plan`)
      return false
    }

    // Create optimistic favorite entry
    const optimisticFavorite: FavoriteTeam = {
      id: `temp-${Date.now()}`,
      teamName: team.teamName,
      teamSlug: generateSlug(team.teamName),
      sport: team.sport,
      league: team.league || null,
      sportKey: team.sportKey || null,
      teamLogo: team.teamLogo || null,
      country: team.country || null,
      notifyMatches: true,
      notifyInjuries: false,
      createdAt: new Date().toISOString()
    }

    // Optimistically add to state immediately
    setFavorites(prev => [optimisticFavorite, ...prev])
    setError(null)

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(team)
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Already favorited - just update with real data
          return true
        }
        throw new Error(data.error || 'Failed to add team')
      }

      // Replace optimistic entry with real data from server
      setFavorites(prev => prev.map(f => 
        f.id === optimisticFavorite.id ? data.favorite : f
      ))
      return true
    } catch (err) {
      // Rollback optimistic update on error
      setFavorites(prev => prev.filter(f => f.id !== optimisticFavorite.id))
      console.error('Error adding favorite:', err)
      setError(err instanceof Error ? err.message : 'Failed to add team')
      return false
    }
  }

  // Remove by team name + sport - OPTIMISTIC UPDATE
  const removeFavorite = async (teamName: string, sport: string): Promise<boolean> => {
    if (!session?.user?.id) return false

    const slug = generateSlug(teamName)
    const favoriteToRemove = favorites.find(f => f.teamSlug === slug && f.sport === sport)
    
    if (!favoriteToRemove) return false

    // Optimistically remove from state immediately
    setFavorites(prev => prev.filter(f => !(f.teamSlug === slug && f.sport === sport)))
    setError(null)

    try {
      const params = new URLSearchParams({ teamName, sport })
      const response = await fetch(`/api/favorites?${params}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove team')
      }

      return true
    } catch (err) {
      // Rollback: re-add the favorite on error
      setFavorites(prev => [favoriteToRemove, ...prev])
      console.error('Error removing favorite:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove team')
      return false
    }
  }

  // Remove by ID - OPTIMISTIC UPDATE
  const removeFavoriteById = async (id: string): Promise<boolean> => {
    if (!session?.user?.id) return false

    const favoriteToRemove = favorites.find(f => f.id === id)
    if (!favoriteToRemove) return false

    // Optimistically remove from state immediately
    setFavorites(prev => prev.filter(f => f.id !== id))
    setError(null)

    try {
      const response = await fetch(`/api/favorites?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove team')
      }

      return true
    } catch (err) {
      // Rollback: re-add the favorite on error
      setFavorites(prev => [favoriteToRemove, ...prev])
      console.error('Error removing favorite:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove team')
      return false
    }
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        error,
        addFavorite,
        removeFavorite,
        removeFavoriteById,
        isFavorite,
        refreshFavorites: fetchFavorites,
        maxTeams,
        canAddMore
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

// Hook for consuming the context
export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

// Helper function
function generateSlug(teamName: string): string {
  return teamName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
