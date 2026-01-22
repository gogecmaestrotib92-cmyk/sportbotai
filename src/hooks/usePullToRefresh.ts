/**
 * Pull-to-Refresh Hook
 * 
 * Native-like pull-to-refresh for mobile devices.
 * Shows a loading indicator when user pulls down at top of page.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // pixels to pull before triggering
  resistance?: number; // resistance factor (higher = harder to pull)
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  isPulling: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  // Track if we've confirmed this is a pull-down gesture (not scroll)
  const isPullConfirmed = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Record start position but DON'T activate pulling yet
    // We'll decide in touchmove if this is a pull or scroll
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isPullConfirmed.current = false;
      // Don't set isPulling here - let touchmove decide
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    // Not at top? Let browser handle scroll normally
    if (window.scrollY !== 0) {
      if (isPulling) {
        setPullDistance(0);
        setIsPulling(false);
        isPullConfirmed.current = false;
      }
      return;
    }
    
    // No start position recorded? Ignore
    if (startY.current === 0) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // User is scrolling UP (negative diff) - let browser handle it
    if (diff < 0) {
      if (isPulling) {
        setPullDistance(0);
        setIsPulling(false);
        isPullConfirmed.current = false;
      }
      return;
    }
    
    // User is pulling DOWN at top of page
    if (diff > 0) {
      // Only confirm as pull gesture after 15px of downward movement
      // This prevents accidental triggers during horizontal swipes
      if (!isPullConfirmed.current && diff > 15) {
        isPullConfirmed.current = true;
        setIsPulling(true);
      }
      
      if (isPullConfirmed.current) {
        const distance = Math.min(diff / resistance, threshold * 1.5);
        setPullDistance(distance);
        
        // Only prevent scroll after significant pull (>40px visual distance)
        // This is the key: we let small movements scroll normally
        if (distance > 40) {
          e.preventDefault();
        }
      }
    }
  }, [isPulling, isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    // Reset start position
    startY.current = 0;
    
    if (!isPulling) {
      isPullConfirmed.current = false;
      return;
    }
    
    setIsPulling(false);
    isPullConfirmed.current = false;
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Lock at threshold during refresh
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animate back to 0
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current || document;
    
    // Only add listeners on touch devices
    if ('ontouchstart' in window) {
      container.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
      container.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
      container.addEventListener('touchend', handleTouchEnd as EventListener);
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart as EventListener);
        container.removeEventListener('touchmove', handleTouchMove as EventListener);
        container.removeEventListener('touchend', handleTouchEnd as EventListener);
      };
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isRefreshing,
    pullDistance,
    isPulling,
    containerRef,
  };
}

export default usePullToRefresh;
