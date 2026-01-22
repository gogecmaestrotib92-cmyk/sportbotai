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

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only activate if STRICTLY at top of scroll (=== 0)
    // Prevents false activations on Android/Chrome
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only pull down when at top of page
    // CRITICAL: Check scrollY STRICTLY at 0 to avoid blocking normal scroll
    if (diff > 0 && window.scrollY === 0) {
      // Apply resistance to make it feel natural
      const distance = Math.min(diff / resistance, threshold * 1.5);
      setPullDistance(distance);
      
      // Only prevent default when significantly pulling (>30px) at top
      // This allows normal scroll to work on Android/Chrome
      if (distance > 30) {
        e.preventDefault();
      }
    } else if (diff < 0) {
      // User is scrolling up (normal behavior) - reset pull state
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [isPulling, isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
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
