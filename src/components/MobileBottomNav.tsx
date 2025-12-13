/**
 * Mobile Bottom Navigation Component
 * 
 * Fixed bottom navigation for mobile devices.
 * Shows key navigation items with icons.
 * Only visible on screens < 768px (md breakpoint).
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/ai-desk',
    label: 'AI Desk',
    icon: (
      <span className="text-lg">🧠</span>
    ),
  },
  {
    href: '/analyzer',
    label: 'Analyze',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    highlight: true,
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/account',
    label: 'Account',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Don't show on certain pages
  const hiddenPaths = ['/login', '/register'];
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-bg-card/95 backdrop-blur-lg border-t border-divider safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 flex-1 h-full 
                transition-all duration-200 touch-manipulation active:scale-95
                ${item.highlight 
                  ? 'relative' 
                  : ''
                }
              `}
            >
              {/* Highlight bubble for main action */}
              {item.highlight && (
                <div className="absolute -top-3 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/30">
                  <div className={`${isActive ? 'text-bg' : 'text-bg'}`}>
                    {item.icon}
                  </div>
                </div>
              )}
              
              {!item.highlight && (
                <>
                  <div className={`
                    transition-colors duration-200
                    ${isActive ? 'text-accent' : 'text-text-muted'}
                  `}>
                    {item.icon}
                  </div>
                  <span className={`
                    text-[10px] font-medium transition-colors duration-200
                    ${isActive ? 'text-accent' : 'text-text-muted'}
                  `}>
                    {item.label}
                  </span>
                </>
              )}
              
              {item.highlight && (
                <span className={`
                  text-[10px] font-semibold mt-8 transition-colors duration-200
                  ${isActive ? 'text-accent' : 'text-text-muted'}
                `}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
