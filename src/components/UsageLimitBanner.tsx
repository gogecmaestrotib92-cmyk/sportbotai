'use client'

import { useSession } from 'next-auth/react'
import { AlertCircle, Zap, Lock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { PLAN_LIMITS } from '@/lib/auth'

interface UsageLimitBannerProps {
  remaining?: number
  limit?: number
  variant?: 'compact' | 'full' | 'inline'
  className?: string
}

export default function UsageLimitBanner({
  remaining,
  limit,
  variant = 'full',
  className = ''
}: UsageLimitBannerProps) {
  const { data: session } = useSession()
  
  const plan = (session?.user?.plan as keyof typeof PLAN_LIMITS) || 'FREE'
  const planLimit = limit ?? PLAN_LIMITS[plan] ?? 3
  const analysesRemaining = remaining ?? planLimit
  
  // Don't show for unlimited plans
  if (planLimit === -1) return null
  
  // Calculate usage
  const used = planLimit - analysesRemaining
  const usagePercent = Math.round((used / planLimit) * 100)
  const isLow = analysesRemaining <= 1
  const isEmpty = analysesRemaining === 0
  
  // Inline variant - just text
  if (variant === 'inline') {
    return (
      <span className={`text-sm ${isEmpty ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-gray-400'} ${className}`}>
        {analysesRemaining}/{planLimit} analyses left
      </span>
    )
  }
  
  // Compact variant - small bar
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              isEmpty ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <span className={`text-xs whitespace-nowrap ${
          isEmpty ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-gray-400'
        }`}>
          {analysesRemaining} left
        </span>
      </div>
    )
  }
  
  // Full variant - banner with upgrade CTA
  if (isEmpty) {
    return (
      <div className={`bg-red-950/50 border border-red-500/30 rounded-xl p-3 sm:p-4 ${className}`}>
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-red-400 text-sm sm:text-base mb-0.5 sm:mb-1">Daily Limit Reached</h4>
            <p className="text-xs sm:text-sm text-red-300/80 mb-2 sm:mb-3">
              You&apos;ve used your free analysis. Upgrade to Pro for 30 analyses per day.
            </p>
            <Link
              href="/pricing#pro"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
            >
              <Zap className="w-4 h-4" />
              Upgrade to Pro
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  if (isLow) {
    return (
      <div className={`bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 sm:p-4 ${className}`}>
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h4 className="font-semibold text-amber-400">
                {analysesRemaining} Analysis{analysesRemaining !== 1 ? 'es' : ''} Remaining
              </h4>
              <span className="text-xs text-amber-500/70">Resets at midnight</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-300/70">
                Want more? Upgrade for 30/day.
              </p>
              <Link
                href="/pricing#pro"
                className="text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                Upgrade
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Normal state - subtle
  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white">{used}/{planLimit}</span> used today
              <span className="text-gray-500 ml-2">• {analysesRemaining} left</span>
            </p>
          </div>
        </div>
        <div className="h-1.5 w-24 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
