/**
 * useDoubleTap Hook
 * 
 * Detects double-tap gestures with configurable timing.
 * Used for quick actions like favoriting matches.
 */

import { useCallback, useRef } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

interface UseDoubleTapOptions {
  /** Time window for double tap detection (ms) */
  threshold?: number;
  /** Callback on double tap */
  onDoubleTap?: () => void;
  /** Callback on single tap */
  onSingleTap?: () => void;
  /** Enable haptic feedback */
  haptic?: boolean;
}

export function useDoubleTap({
  threshold = 300,
  onDoubleTap,
  onSingleTap,
  haptic = true,
}: UseDoubleTapOptions = {}) {
  const lastTapRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { success } = useHapticFeedback();

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    // Clear any pending single tap timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (timeSinceLastTap < threshold && timeSinceLastTap > 0) {
      // Double tap detected
      lastTapRef.current = 0;
      
      if (haptic) {
        success();
      }
      
      onDoubleTap?.();
    } else {
      // First tap - wait to see if second tap comes
      lastTapRef.current = now;
      
      // Delay single tap callback to allow for double tap
      timeoutRef.current = setTimeout(() => {
        onSingleTap?.();
        lastTapRef.current = 0;
      }, threshold);
    }
  }, [threshold, onDoubleTap, onSingleTap, haptic, success]);

  // Touch handler props
  // Note: We DON'T call preventDefault on touchEnd to avoid blocking scroll on Android
  // The double-tap detection works fine without it
  const handlers = {
    onClick: handleTap,
    onTouchEnd: () => {
      handleTap();
    },
  };

  return { handlers, handleTap };
}

export default useDoubleTap;
