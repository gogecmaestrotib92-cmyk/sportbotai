/**
 * DoubleTapHeart Component
 * 
 * Instagram-style double-tap to favorite animation.
 * Shows a heart animation overlay on double-tap.
 */

'use client';

import { ReactNode, useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useDoubleTap } from '@/hooks/useDoubleTap';

interface DoubleTapHeartProps {
  children: ReactNode;
  /** Called when favorited */
  onFavorite?: () => void;
  /** Current favorite state */
  isFavorite?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Additional class */
  className?: string;
}

export function DoubleTapHeart({
  children,
  onFavorite,
  isFavorite = false,
  disabled = false,
  className = '',
}: DoubleTapHeartProps) {
  const [showHeart, setShowHeart] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });

  const handleDoubleTap = useCallback(() => {
    if (disabled) return;
    
    // Show heart animation
    setShowHeart(true);
    
    // Call favorite callback
    onFavorite?.();
    
    // Hide heart after animation
    setTimeout(() => {
      setShowHeart(false);
    }, 800);
  }, [disabled, onFavorite]);

  const { handlers } = useDoubleTap({
    onDoubleTap: handleDoubleTap,
    haptic: true,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Capture position for heart placement
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    setHeartPosition({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  }, []);

  return (
    <div
      {...handlers}
      onTouchStart={(e) => {
        handleTouchStart(e);
        handlers.onTouchEnd?.();
      }}
      className={`relative ${className}`}
    >
      {children}
      
      {/* Heart animation overlay */}
      {showHeart && (
        <div 
          className="absolute pointer-events-none z-10"
          style={{
            left: heartPosition.x - 40,
            top: heartPosition.y - 40,
          }}
        >
          <Heart
            size={80}
            className={`
              text-red-500 fill-red-500 
              animate-[heartBurst_0.8s_ease-out_forwards]
            `}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))',
            }}
          />
        </div>
      )}

      {/* Small favorite indicator in corner */}
      {isFavorite && (
        <div className="absolute top-2 right-2 z-10">
          <Heart
            size={16}
            className="text-red-500 fill-red-500 animate-pulse"
          />
        </div>
      )}
    </div>
  );
}

export default DoubleTapHeart;
