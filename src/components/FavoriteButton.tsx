'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useFavorites } from '@/lib/FavoritesContext'
import { Heart, ExternalLink } from 'lucide-react'

interface FavoriteButtonProps {
  teamName: string
  sport: string
  league?: string
  sportKey?: string
  teamLogo?: string
  country?: string
  teamId?: string  // API Football team ID for linking to profile
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  showProfileLink?: boolean
  className?: string
}

export default function FavoriteButton({
  teamName,
  sport,
  league,
  sportKey,
  teamLogo,
  country,
  teamId,
  size = 'md',
  showText = false,
  showProfileLink = false,
  className = ''
}: FavoriteButtonProps) {
  const { data: session } = useSession()
  const { isFavorite, addFavorite, removeFavorite, canAddMore, maxTeams, favorites } = useFavorites()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const favorited = isFavorite(teamName, sport)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const buttonSizes = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user?.id) {
      // Show sign-in prompt
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 3000)
      return
    }

    if (!favorited && !canAddMore) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 3000)
      return
    }

    setIsUpdating(true)

    try {
      if (favorited) {
        await removeFavorite(teamName, sport)
      } else {
        await addFavorite({
          teamName,
          sport,
          league,
          sportKey,
          teamLogo,
          country
        })
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleClick}
        disabled={isUpdating}
        className={`
          ${buttonSizes[size]}
          rounded-full transition-all duration-200
          ${favorited 
            ? 'text-red-500 bg-red-50 hover:bg-red-100' 
            : 'text-gray-400 hover:text-red-400 hover:bg-gray-100'
          }
          ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          ${className}
        `}
        title={favorited ? 'Remove from My Teams' : 'Add to My Teams'}
        aria-label={favorited ? `Remove ${teamName} from favorites` : `Add ${teamName} to favorites`}
      >
        <Heart 
          className={`
            ${sizeClasses[size]}
            ${favorited ? 'fill-current' : ''}
            ${isUpdating ? 'animate-pulse' : ''}
          `} 
        />
      </button>

      {showText && (
        <span className={`ml-1 text-sm ${favorited ? 'text-red-500' : 'text-gray-500'}`}>
          {favorited ? 'Saved' : 'Save'}
        </span>
      )}

      {/* Profile Link for Soccer teams with teamId */}
      {showProfileLink && teamId && sport.toLowerCase() === 'soccer' && (
        <Link
          href={`/team/${teamId}`}
          className="p-1 text-gray-400 hover:text-accent transition-colors"
          title={`View ${teamName} profile`}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className={sizeClasses[size]} />
        </Link>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-fade-in">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            {!session?.user?.id ? (
              <span>Sign in to save teams</span>
            ) : !canAddMore ? (
              <span>
                Limit reached ({favorites.length}/{maxTeams}). 
                <a href="/pricing" className="text-blue-400 hover:underline ml-1">Upgrade</a>
              </span>
            ) : null}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
