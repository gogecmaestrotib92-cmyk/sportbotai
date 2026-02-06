'use client'

import { Clock, Lock, ChevronRight, History } from 'lucide-react'
import Link from 'next/link'

interface HistoryAccessBannerProps {
  hiddenCount: number
  totalCount: number
  className?: string
}

export default function HistoryAccessBanner({
  hiddenCount,
  totalCount,
  className = ''
}: HistoryAccessBannerProps) {
  if (hiddenCount <= 0) return null

  return (
    <div className={`bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-blue-500/30 rounded-xl p-5 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <History className="w-6 h-6 text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <h4 className="font-semibold text-white">
              {hiddenCount} Analysis{hiddenCount !== 1 ? 'es' : ''} Hidden
            </h4>
          </div>
          
          <p className="text-sm text-gray-400 mb-4">
            Free users can only view analyses from the last 24 hours. 
            You have <span className="text-white font-medium">{totalCount} total analyses</span> in your history.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              href="/pricing#pro"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Unlock Full History
              <ChevronRight className="w-4 h-4" />
            </Link>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Pro includes unlimited history access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
