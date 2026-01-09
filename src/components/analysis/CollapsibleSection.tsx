/**
 * CollapsibleSection Component
 * 
 * Progressive disclosure pattern for sports apps:
 * - Show critical data up front
 * - Tuck deep stats into collapsible sections
 * - Maintains 44x44px touch targets for accessibility
 */

'use client';

import { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Icon element */
  icon?: ReactNode;
  /** Muted label text (optional) */
  label?: string;
  /** Whether section starts expanded */
  defaultExpanded?: boolean;
  /** Section content */
  children: ReactNode;
  /** Badge to show (e.g., count) */
  badge?: string | number;
  /** Additional className */
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  label,
  defaultExpanded = false,
  children,
  badge,
  className = '',
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`rounded-2xl bg-[#0a0a0b] border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header - 44px min height for accessibility */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full min-h-[48px] px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors text-left"
        aria-expanded={isExpanded}
      >
        {/* Icon */}
        {icon && (
          <span className="text-base flex-shrink-0 opacity-60">
            {icon}
          </span>
        )}
        
        {/* Title & Label */}
        <div className="flex-1 min-w-0">
          {label && (
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider block">
              {label}
            </span>
          )}
          <span className="text-sm font-medium text-zinc-300">
            {title}
          </span>
        </div>
        
        {/* Badge - matches AIvsMarketHero PRO style */}
        {badge !== undefined && (
          <span className="text-[10px] px-2.5 py-0.5 text-violet-400/60 rounded-full border border-violet-500/20 font-medium uppercase tracking-wider">
            {badge}
          </span>
        )}
        
        {/* Chevron */}
        <svg 
          className={`w-4 h-4 text-zinc-600 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Content */}
      <div 
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default CollapsibleSection;
