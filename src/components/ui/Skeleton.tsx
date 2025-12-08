/**
 * Skeleton Loading Components
 * 
 * Provides shimmer loading placeholders for various content types.
 */

'use client';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

// Base skeleton with shimmer animation
export function Skeleton({ className = '', animate = true }: SkeletonProps) {
  return (
    <div 
      className={`
        bg-gray-200 rounded
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
    />
  );
}

// Text line skeleton
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'}`} 
        />
      ))}
    </div>
  );
}

// Card skeleton
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

// Match card skeleton for match selector
export function SkeletonMatchCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="text-right">
          <Skeleton className="h-6 w-12 mb-1" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  );
}

// Analysis result skeleton
export function SkeletonAnalysisResult() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Quick glance */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-3">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Accordion sections */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="w-6 h-6 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Sport tabs skeleton
export function SkeletonSportTabs() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton 
          key={i} 
          className="h-12 w-24 rounded-xl flex-shrink-0" 
        />
      ))}
    </div>
  );
}

// League list skeleton
export function SkeletonLeagueList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="w-6 h-6 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Full page loading
export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        
        {/* Content */}
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

// Inline loading spinner
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };
  
  return (
    <div className={`${sizeClasses[size]} border-gray-200 border-t-primary-900 rounded-full animate-spin`} />
  );
}

// Button loading state
export function ButtonLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <span className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </span>
  );
}
