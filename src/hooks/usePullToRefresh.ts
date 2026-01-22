/**
 * Pull-to-Refresh Hook
 * 
 * Native-like pull-to-refresh for mobile devices.
 * Shows a loading indicator when user pulls down at top of page.
 * 
 * ANDROID/CHROME FIX: Uses dynamic listener switching to avoid scroll blocking.
 * - Starts with passive listeners (allows normal scroll)
 * - When pull gesture detected at top, adds non-passive listener to block scroll
 * - Removes blocking listener when gesture ends
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
  const isPullConfirmed = useRef(false);
  // Track if blocking listener is attached
  const blockingListenerAttached = useRef(false);

  // Use ref for blocking function so we always remove the SAME function we added
  const blockingTouchMoveRef = useRef<((e: TouchEvent) => void) | null>(null);
  
  // Initialize the blocking function once
  if (!blockingTouchMoveRef.current) {
    blockingTouchMoveRef.current = (e: TouchEvent) => {
      e.preventDefault();
    };
  }

  // Attach the blocking listener
  const attachBlockingListener = useCallback(() => {
    if (!blockingListenerAttached.current && blockingTouchMoveRef.current) {
      document.addEventListener('touchmove', blockingTouchMoveRef.current, { passive: false });
      blockingListenerAttached.current = true;
    }
  }, []);

  // Detach the blocking listener
  const detachBlockingListener = useCallback(() => {
    if (blockingListenerAttached.current && blockingTouchMoveRef.current) {
      document.removeEventListener('touchmove', blockingTouchMoveRef.current);
      blockingListenerAttached.current = false;
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only track if at top of page
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isPullConfirmed.current = false;
    } else {
      startY.current = 0;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    // Not at top? Reset everything and let browser scroll
    if (window.scrollY !== 0) {
      if (isPulling) {
        setPullDistance(0);
        setIsPulling(false);
        isPullConfirmed.current = false;
        detachBlockingListener();
      }
      startY.current = 0;
      return;
    }
    
    // No start position? Ignore
    if (startY.current === 0) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Scrolling UP - reset and let browser handle
    if (diff < 0) {
      if (isPulling) {
        setPullDistance(0);
        setIsPulling(false);
        isPullConfirmed.current = false;
        detachBlockingListener();
      }
      return;
    }
    
    // Pulling DOWN at top of page
    if (diff > 0) {
      // Confirm pull gesture after 10px of downward movement
      if (!isPullConfirmed.current && diff > 10) {
        isPullConfirmed.current = true;
        setIsPulling(true);
        // NOW attach the blocking listener since we're definitely pulling
        attachBlockingListener();
      }
      
      if (isPullConfirmed.current) {
        const distance = Math.min(diff / resistance, threshold * 1.5);
        setPullDistance(distance);
      }
    }
  }, [isPulling, isRefreshing, resistance, threshold, attachBlockingListener, detachBlockingListener]);

  const handleTouchEnd = useCallback(async () => {
    // Always detach blocking listener on touch end
    detachBlockingListener();
    
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
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, detachBlockingListener]);

  useEffect(() => {
    const container = containerRef.current || document;
    
    if ('ontouchstart' in window) {
      // These are PASSIVE - they don't block scroll
      // The blocking listener is added dynamically only when needed
      container.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
      container.addEventListener('touchmove', handleTouchMove as EventListener, { passive: true });
      container.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart as EventListener);
        container.removeEventListener('touchmove', handleTouchMove as EventListener);
        container.removeEventListener('touchend', handleTouchEnd as EventListener);
        // Make sure to clean up blocking listener too
        detachBlockingListener();
      };
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, detachBlockingListener]);

  return {
    isRefreshing,
    pullDistance,
    isPulling,
    containerRef,
  };
}

export default usePullToRefresh;
