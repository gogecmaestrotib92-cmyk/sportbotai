/**
 * Floating Action Button (FAB)
 * 
 * Mobile-friendly floating button for primary actions.
 * Positioned above bottom nav with proper safe area handling.
 */

'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';

interface FloatingActionButtonProps {
  /** Button icon */
  icon: ReactNode;
  /** Screen reader label */
  label: string;
  /** Link href or click handler */
  href?: string;
  onClick?: () => void;
  /** Show on desktop too */
  showOnDesktop?: boolean;
  /** Expandable menu items */
  menuItems?: {
    icon: ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
  }[];
  /** Position offset from bottom (accounts for bottom nav) */
  bottomOffset?: number;
}

export default function FloatingActionButton({
  icon,
  label,
  href,
  onClick,
  showOnDesktop = false,
  menuItems,
  bottomOffset = 70, // Above mobile bottom nav
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (menuItems && menuItems.length > 0) {
      setIsExpanded(!isExpanded);
    } else {
      onClick?.();
    }
  };

  const buttonClasses = `
    flex items-center justify-center
    w-14 h-14 rounded-full
    bg-gradient-to-r from-accent to-emerald-500
    text-bg-primary font-bold
    shadow-lg shadow-accent/30
    active:scale-95 transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg
  `;

  const content = (
    <>
      {/* Expanded menu */}
      {menuItems && menuItems.length > 0 && (
        <div className={`
          absolute bottom-16 right-0
          flex flex-col gap-3 items-end
          transition-all duration-200 origin-bottom-right
          ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}>
          {menuItems.map((item, i) => (
            item.href ? (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-3 group"
                onClick={() => setIsExpanded(false)}
              >
                <span className="px-3 py-1.5 bg-bg-card rounded-lg text-sm font-medium text-white shadow-lg border border-white/10 group-hover:bg-bg-elevated transition-colors">
                  {item.label}
                </span>
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-card shadow-lg border border-white/10 text-white group-hover:bg-bg-elevated transition-colors">
                  {item.icon}
                </span>
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => {
                  item.onClick?.();
                  setIsExpanded(false);
                }}
                className="flex items-center gap-3 group"
              >
                <span className="px-3 py-1.5 bg-bg-card rounded-lg text-sm font-medium text-white shadow-lg border border-white/10 group-hover:bg-bg-elevated transition-colors">
                  {item.label}
                </span>
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-card shadow-lg border border-white/10 text-white group-hover:bg-bg-elevated transition-colors">
                  {item.icon}
                </span>
              </button>
            )
          ))}
        </div>
      )}

      {/* Main button */}
      {href && !menuItems ? (
        <Link href={href} className={buttonClasses} aria-label={label}>
          {icon}
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <button onClick={handleClick} className={buttonClasses} aria-label={label}>
            <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-45' : ''}`}>
              {icon}
            </span>
          </button>
          {/* Mini label when closed */}
          <span className={`text-[10px] font-medium text-white/80 transition-opacity ${isExpanded ? 'opacity-0' : 'opacity-100'}`}>
            Menu
          </span>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Backdrop when menu is open */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      <div 
        className={`
          fixed right-4 z-50
          ${showOnDesktop ? '' : 'md:hidden'}
        `}
        style={{ 
          bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        {content}
      </div>
    </>
  );
}
