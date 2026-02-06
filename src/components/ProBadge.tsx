'use client'

import { useSession } from 'next-auth/react'
import { Crown, Sparkles, Star } from 'lucide-react'

interface ProBadgeProps {
  variant?: 'default' | 'compact' | 'inline'
  showUpgrade?: boolean
  className?: string
}

export default function ProBadge({ 
  variant = 'default',
  showUpgrade = false,
  className = '' 
}: ProBadgeProps) {
  const { data: session } = useSession()
  
  const plan = session?.user?.plan || 'FREE'
  const isPro = plan === 'PRO' || plan === 'PREMIUM'
  const isPremium = plan === 'PREMIUM'

  // Don't render anything if free and not showing upgrade
  if (!isPro && !showUpgrade) {
    return null
  }

  // Upgrade prompt for free users
  if (!isPro && showUpgrade) {
    return (
      <a
        href="/pricing#pro"
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 
          bg-gradient-to-r from-amber-500/10 to-orange-500/10 
          border border-amber-500/30 rounded-full
          text-amber-500 text-xs font-medium
          hover:from-amber-500/20 hover:to-orange-500/20 
          transition-all duration-200
          ${className}
        `}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Upgrade to Pro
      </a>
    )
  }

  // Inline badge (just icon + text)
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 ${isPremium ? 'text-slate-300' : 'text-amber-500'} ${className}`}>
        <Crown className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{plan}</span>
      </span>
    )
  }

  // Compact badge
  if (variant === 'compact') {
    return (
      <span 
        className={`
          inline-flex items-center gap-1 px-2 py-0.5
          ${isPremium 
            ? 'bg-gradient-to-r from-slate-300/20 to-slate-400/20 border border-slate-400/40' 
            : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40'
          } rounded-full
          ${className}
        `}
      >
        <Crown className={`w-3 h-3 ${isPremium ? 'text-slate-300' : 'text-amber-400'}`} />
        <span className={`text-xs font-semibold ${isPremium ? 'text-slate-300' : 'text-amber-400'}`}>{plan}</span>
      </span>
    )
  }

  // Default badge (full style)
  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1.5
        ${isPremium
          ? 'bg-gradient-to-r from-slate-300/15 to-slate-400/15 border border-slate-400/30'
          : 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30'
        } rounded-lg
        ${className}
      `}
    >
      <div className="relative">
        <Crown className={`w-4 h-4 ${isPremium ? 'text-slate-300' : 'text-amber-400'}`} />
        <Star className={`w-2 h-2 ${isPremium ? 'text-slate-200' : 'text-amber-300'} absolute -top-0.5 -right-0.5`} />
      </div>
      <div className="flex flex-col">
        <span className={`text-xs font-bold ${isPremium ? 'text-slate-300' : 'text-amber-400'}`}>{plan}</span>
        <span className={`text-[10px] ${isPremium ? 'text-slate-400/70' : 'text-amber-500/70'}`}>Member</span>
      </div>
    </div>
  )
}

// Helper component for showing plan features
export function PlanFeature({ 
  available, 
  children 
}: { 
  available: boolean
  children: React.ReactNode 
}) {
  return (
    <div className={`flex items-center gap-2 ${available ? 'text-white' : 'text-gray-500'}`}>
      {available ? (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className="text-sm">{children}</span>
    </div>
  )
}
