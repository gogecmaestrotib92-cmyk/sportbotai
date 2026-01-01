/**
 * Header component for SportBot AI - i18n version
 * 
 * Modern navigation with sports analytics branding.
 * Supports multiple languages with correct links.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { UserMenu } from './auth';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import LanguageSwitcher from './LanguageSwitcher';
import { Locale, getTranslations } from '@/lib/i18n';

// Admin emails list (same as in admin/page.tsx)
const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
];

// NavLink component with premium active state
// Supports icon + label format where underline only appears under label
function NavLink({ 
  href, 
  children, 
  icon,
  badge,
  className = '',
  onClick,
}: { 
  href: string; 
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  // Handle both /sr/path and /path for active state
  const normalizedPathname = pathname?.replace(/^\/sr/, '') || '/';
  const normalizedHref = href.replace(/^\/sr/, '') || '/';
  const isActive = normalizedPathname === normalizedHref || 
    (normalizedHref !== '/' && normalizedPathname?.startsWith(normalizedHref));
  
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-1.5 font-medium transition-all duration-300 text-sm ${className} ${
        isActive 
          ? 'text-accent' 
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span className="relative">
        {children}
        {/* Premium glowing underline indicator - only under text */}
        {isActive && (
          <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent rounded-full shadow-[0_0_8px_2px_rgba(16,185,129,0.4)]" />
        )}
      </span>
      {badge}
    </Link>
  );
}

// Mobile NavLink with active state
function MobileNavLink({ 
  href, 
  children, 
  onClick,
  className = '',
}: { 
  href: string; 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const normalizedPathname = pathname?.replace(/^\/sr/, '') || '/';
  const normalizedHref = href.replace(/^\/sr/, '') || '/';
  const isActive = normalizedPathname === normalizedHref || 
    (normalizedHref !== '/' && normalizedPathname?.startsWith(normalizedHref));
  
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 font-medium px-4 py-3.5 rounded-btn transition-all duration-300 active:scale-[0.98] ${
        isActive 
          ? 'text-accent bg-accent/10 border-l-2 border-accent shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' 
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

interface HeaderI18nProps {
  locale?: Locale;
}

export default function HeaderI18n({ locale: propLocale }: HeaderI18nProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);
  const { isVisible, scrollY } = useHideOnScroll({ threshold: 15, mobileOnly: true });
  
  // Determine current locale from pathname or prop
  const locale: Locale = propLocale || (pathname?.startsWith('/sr') ? 'sr' : 'en');
  const t = getTranslations(locale);
  
  // Scroll-aware styling
  const isScrolled = scrollY > 20;
  
  // Helper to create locale-aware links
  const localePath = (path: string) => locale === 'sr' ? `/sr${path === '/' ? '' : path}` : path;
  const homeLink = locale === 'sr' ? '/sr' : '/';

  return (
    <header 
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}
        ${isScrolled 
          ? 'bg-black/50 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.3)]' 
          : 'bg-transparent border-b border-transparent'
        }
      `}
    >
      {/* Subtle gradient glow when scrolled */}
      {isScrolled && (
        <div className="absolute inset-0 bg-gradient-to-r from-violet/5 via-transparent to-accent/5 pointer-events-none" />
      )}
      
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'}`}>
          {/* Logo */}
          <Link href={homeLink} className="flex items-center gap-2.5 group">
            <Image 
              src="/favicon.svg" 
              alt="SportBot AI" 
              width={36} 
              height={36}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">
              Sport<span className="text-accent">Bot</span>
              <span className="ml-1.5 text-xs font-semibold bg-accent text-bg px-1.5 py-0.5 rounded">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink href={homeLink}>
              {t.header.home}
            </NavLink>
            <NavLink href={localePath('/matches')} icon="⚡">
              {t.header.analyze}
            </NavLink>
            <NavLink href={localePath('/ai-desk')} icon="🧠">
              {t.header.aiDesk}
            </NavLink>
            <NavLink 
              href={localePath('/market-alerts')}
              icon="📊"
              badge={<span className="text-[10px] font-semibold bg-gradient-to-r from-zinc-400/20 to-slate-300/20 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-400/30">{t.header.premium}</span>}
            >
              {t.header.alerts}
            </NavLink>
            <NavLink href={localePath('/pricing')}>
              {t.header.pricing}
            </NavLink>
            <NavLink 
              href={localePath('/news')}
              icon={<span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
            >
              {t.header.news}
            </NavLink>
            <NavLink href={localePath('/blog')}>
              {t.header.blog}
            </NavLink>
            <LanguageSwitcher currentLocale={locale} />
            <UserMenu />
          </div>

          {/* Mobile: Language Switcher + Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher currentLocale={locale} />
            <button
              type="button"
              className="p-2 rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop - click to close */}
            <div 
              className="fixed inset-0 top-16 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu content */}
            <div className="md:hidden absolute left-0 right-0 top-16 bg-bg-card border-b border-divider shadow-2xl z-50 max-h-[70vh] overflow-y-auto animate-slide-down">
              <div className="flex flex-col gap-1 py-4">
              <MobileNavLink
                href={homeLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t.header.home}
              </MobileNavLink>
              <MobileNavLink
                href={localePath('/ai-desk')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-lg">🧠</span>
                {t.header.aiDesk}
              </MobileNavLink>
              <MobileNavLink
                href={localePath('/matches')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-lg">⚡</span>
                {t.header.analyzeMatch}
              </MobileNavLink>
              
              {/* User Section - Only show to logged in users */}
              {session && (
                <>
                  <div className="my-2 border-t border-divider" />
                  
                  <p className="px-4 py-2 text-xs text-text-muted uppercase tracking-wider">{t.header.yourAccount}</p>
                  
                  <MobileNavLink
                    href={localePath('/my-teams')}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {t.header.myTeams}
                  </MobileNavLink>
                  <MobileNavLink
                    href={localePath('/history')}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t.header.history}
                  </MobileNavLink>
                  <MobileNavLink
                    href={localePath('/market-alerts')}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-lg">📊</span>
                    {t.header.marketAlerts}
                    <span className="text-[10px] font-semibold bg-gradient-to-r from-zinc-400/20 to-slate-300/20 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-400/30 ml-auto">{t.header.premium}</span>
                  </MobileNavLink>
                  <MobileNavLink
                    href={localePath('/account')}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t.header.accountSettings}
                  </MobileNavLink>
                </>
              )}
              
              {/* Sign In for guests */}
              {!session && (
                <>
                  <div className="my-2 border-t border-divider" />
                  <MobileNavLink
                    href={localePath('/login')}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    {t.header.signIn}
                  </MobileNavLink>
                </>
              )}
              
              {/* Admin Section - Only show to admins */}
              {isAdmin && (
                <>
                  <div className="my-2 border-t border-divider" />
                  <p className="px-4 py-2 text-xs text-text-muted uppercase tracking-wider">{t.header.admin}</p>
                  <MobileNavLink
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    {t.header.adminDashboard}
                  </MobileNavLink>
                </>
              )}
              
              {/* Divider - More Section */}
              <div className="my-2 border-t border-divider" />
              <p className="px-4 py-2 text-xs text-text-muted uppercase tracking-wider">{t.header.more}</p>
              
              <MobileNavLink
                href={localePath('/pricing')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.header.pricing}
              </MobileNavLink>
              <MobileNavLink
                href={localePath('/news')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </div>
                {t.header.news}
              </MobileNavLink>
              <MobileNavLink
                href={localePath('/blog')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                {t.header.blog}
              </MobileNavLink>
              <MobileNavLink
                href={localePath('/responsible-gambling')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {t.header.responsibleGaming}
              </MobileNavLink>
              
              {/* Language Switcher in Mobile Menu */}
              <div className="my-2 border-t border-divider" />
              <div className="px-4 py-3">
                <LanguageSwitcher currentLocale={locale} showLabel />
              </div>
            </div>
          </div>
          </>
        )}
      </nav>
    </header>
  );
}
