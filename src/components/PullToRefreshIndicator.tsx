/**
 * Pull-to-Refresh Indicator Component
 * 
 * Premium visual indicator with smooth animations during pull-to-refresh gesture.
 */

'use client';

import React from 'react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export default function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldShow = pullDistance > 10 || isRefreshing;
  const isReady = progress >= 1;
  
  if (!shouldShow) return null;
  
  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out"
      style={{ 
        top: `max(${Math.min(pullDistance, threshold + 20)}px, env(safe-area-inset-top, 20px))`,
        opacity: Math.min(progress * 1.5, 1),
        transform: `translateX(-50%) scale(${0.8 + progress * 0.2})`,
      }}
    >
      <div className={`
        bg-bg-card/95 backdrop-blur-sm border rounded-full p-3 shadow-xl
        transition-all duration-300
        ${isReady || isRefreshing ? 'border-accent/50 shadow-accent/20' : 'border-divider'}
      `}>
        {isRefreshing ? (
          // Premium spinning loader
          <div className="relative w-6 h-6">
            <svg 
              className="w-6 h-6 text-accent animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-20" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="3"
              />
              <path 
                className="opacity-90" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          // Arrow that rotates as you pull
          <svg 
            className={`w-6 h-6 transition-all duration-200 ${isReady ? 'text-accent' : 'text-text-secondary'}`}
            style={{ transform: `rotate(${progress * 180}deg)` }}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2.5}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        )}
      </div>
      
      {/* Ready text indicator */}
      {isReady && !isRefreshing && (
        <p className="text-[10px] text-accent text-center mt-1 font-medium animate-in fade-in duration-200">
          Release to refresh
        </p>
      )}
    </div>
  );
}
