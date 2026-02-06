/**
 * Mobile Bottom Navigation Component - i18n version
 * 
 * Fixed bottom navigation for mobile devices.
 * Shows key navigation items with icons.
 * Only visible on screens < 768px (md breakpoint).
 * Auto-hides on scroll down for more content space.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { Locale, getTranslations } from '@/lib/i18n';

const getNavItems = (locale: Locale, t: ReturnType<typeof getTranslations>) => {
  const prefix = locale === 'sr' ? '/sr' : '';
  
  return [
    {
      href: prefix || '/',
      label: t.header.home,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: `${prefix}/picks`,
      label: t.header.picks,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
      highlight: true,
    },
    {
      href: `${prefix}/ai-desk`,
      label: t.header.aiDesk,
      icon: (
        <span className="text-lg">🧠</span>
      ),
    },
    {
      href: `${prefix}/analyzer`,
      label: t.header.analyze,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      href: `${prefix}/account`,
      label: t.header.account,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];
};

export default function MobileBottomNavI18n() {
  const pathname = usePathname();
  const { isVisible } = useHideOnScroll({ threshold: 10, mobileOnly: true });
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine locale from pathname - use 'en' during SSR to avoid hydration mismatch
  const detectedLocale: Locale = pathname?.startsWith('/sr') ? 'sr' : 'en';
  const locale: Locale = mounted ? detectedLocale : 'en';
  const t = getTranslations(locale);
  const navItems = getNavItems(locale, t);

  // Don't show on certain pages
  const hiddenPaths = ['/login', '/register'];
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  return (
    <nav 
      className={`
        fixed bottom-0 left-0 right-0 z-50 md:hidden 
        bg-bg-card/95 backdrop-blur-xl border-t border-divider/50
        transition-transform duration-300 ease-out
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{ 
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
      }}
    >
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          // Handle active state for both locales
          const normalizedPathname = pathname?.replace(/^\/sr/, '') || '/';
          const normalizedHref = item.href.replace(/^\/sr/, '') || '/';
          const isActive = normalizedPathname === normalizedHref || 
            (normalizedHref !== '/' && normalizedPathname.startsWith(normalizedHref));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-0.5 flex-1 h-full 
                transition-all duration-150 touch-manipulation
                active:scale-90 active:opacity-80
                ${item.highlight ? 'relative' : ''}
              `}
            >
              {/* Highlight bubble for main action */}
              {item.highlight && (
                <div className="absolute -top-4 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/40 active:scale-95 transition-transform">
                  <div className="text-bg">
                    {item.icon}
                  </div>
                </div>
              )}
              
              {!item.highlight && (
                <>
                  <div className={`
                    transition-all duration-150
                    ${isActive ? 'text-accent scale-110' : 'text-text-muted'}
                  `}>
                    {item.icon}
                  </div>
                  <span className={`
                    text-[10px] font-medium transition-colors duration-150
                    ${isActive ? 'text-accent' : 'text-text-muted'}
                  `}>
                    {item.label}
                  </span>
                </>
              )}
              
              {item.highlight && (
                <span className={`
                  text-[10px] font-semibold mt-7 transition-colors duration-150
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
