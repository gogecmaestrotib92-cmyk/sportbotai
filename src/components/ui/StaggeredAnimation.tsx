/**
 * Staggered Animation Components
 * 
 * Provides cascading animations for lists and grids.
 * Items animate in one-by-one with a slight delay.
 */

'use client';

import { ReactNode, Children, isValidElement, cloneElement, ReactElement } from 'react';

interface StaggeredListProps {
  children: ReactNode;
  staggerDelay?: number; // Delay between each item in ms (default: 50ms)
  initialDelay?: number; // Initial delay before first item (default: 0ms)
  className?: string;
  as?: 'div' | 'ul' | 'ol';
}

/**
 * Wraps children with staggered fade-in animations
 * Each child gets an incrementing animation delay
 */
export function StaggeredList({ 
  children, 
  staggerDelay = 50, 
  initialDelay = 0,
  className = '',
  as: Component = 'div'
}: StaggeredListProps) {
  const childArray = Children.toArray(children);
  
  return (
    <Component className={className}>
      {childArray.map((child, index) => {
        if (!isValidElement(child)) return child;
        
        const delay = initialDelay + (index * staggerDelay);
        
        return (
          <div
            key={child.key || index}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
            style={{ animationDelay: `${delay}ms` }}
          >
            {child}
          </div>
        );
      })}
    </Component>
  );
}

interface StaggeredItemProps {
  children: ReactNode;
  index: number;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}

/**
 * Individual staggered item for more control
 * Use when you need to wrap specific elements
 */
export function StaggeredItem({ 
  children, 
  index, 
  staggerDelay = 50, 
  initialDelay = 0,
  className = ''
}: StaggeredItemProps) {
  const delay = initialDelay + (index * staggerDelay);
  
  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both ${className}`}
      style={{ animationDelay: `${delay}ms`, willChange: 'opacity, transform' }}
    >
      {children}
    </div>
  );
}

interface StaggeredGridProps {
  children: ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

/**
 * Grid layout with staggered animations
 * Responsive columns with cascade effect
 */
export function StaggeredGrid({ 
  children, 
  staggerDelay = 60, 
  initialDelay = 100,
  className = '',
  columns = 3
}: StaggeredGridProps) {
  const childArray = Children.toArray(children);
  
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };
  
  return (
    <div className={`grid gap-4 ${gridCols[columns]} ${className}`}>
      {childArray.map((child, index) => {
        if (!isValidElement(child)) return child;
        
        const delay = initialDelay + (index * staggerDelay);
        
        return (
          <div
            key={child.key || index}
            className="animate-in fade-in slide-in-from-bottom-3 duration-400 fill-mode-both"
            style={{ animationDelay: `${delay}ms` }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hook for getting stagger styles
 * Use when you can't use the wrapper components
 */
export function useStaggeredAnimation(index: number, staggerDelay = 50, initialDelay = 0) {
  const delay = initialDelay + (index * staggerDelay);
  
  return {
    className: 'animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both',
    style: { animationDelay: `${delay}ms` },
  };
}

export default StaggeredList;
