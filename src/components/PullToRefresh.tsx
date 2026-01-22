/**
 * Pull to Refresh Component
 * 
 * Native-feeling pull-to-refresh with custom animation.
 * Shows SportBot logo spinning during refresh.
 */

'use client';

import { ReactNode, useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  /** Disable the feature */
  disabled?: boolean;
  /** Pull distance to trigger refresh (px) */
  threshold?: number;
  /** Custom loading indicator */
  loadingIndicator?: ReactNode;
}

export default function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  loadingIndicator,
}: PullToRefreshProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Check if we're STRICTLY at top of page
  // Using === 0 to avoid false positives on Android/Chrome
  const isAtTop = useCallback(() => {
    return window.scrollY === 0;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop()) return;
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only allow pulling down when STRICTLY at top
    // CRITICAL: Use === 0 to avoid blocking scroll on Android/Chrome
    if (diff < 0 || window.scrollY !== 0) {
      setPullDistance(0);
      setIsPulling(false);
      return;
    }
    
    // Add resistance
    const resistance = 0.4;
    const resistedDiff = diff * resistance;
    
    setPullDistance(Math.min(resistedDiff, threshold * 1.5));
    
    // Only prevent default when significantly pulling (>30px) at top
    // This allows normal scroll to work on Android/Chrome
    if (resistedDiff > 30) {
      e.preventDefault();
    }
  }, [isPulling, disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // Hold at indicator position
      
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default: refresh the router
          router.refresh();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, router]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use document for touch events to catch all scrolling
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div 
        className={`
          fixed left-1/2 -translate-x-1/2 z-[60]
          flex items-center justify-center
          transition-all duration-200 ease-out
          ${showIndicator ? 'opacity-100' : 'opacity-0'}
        `}
        style={{ 
          top: Math.max(70, pullDistance - 20),
        }}
      >
        <div className={`
          flex items-center justify-center
          w-10 h-10 rounded-full
          bg-bg-card border border-white/20 shadow-lg
          ${isRefreshing ? 'animate-spin' : ''}
        `}
        style={{
          transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
        }}
        >
          {loadingIndicator || (
            <svg 
              className="w-5 h-5 text-accent" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : undefined,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
