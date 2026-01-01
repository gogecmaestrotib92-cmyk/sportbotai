/**
 * Language Switcher Component
 * 
 * Allows users to switch between English and Serbian languages.
 * Uses flag emojis for visual representation.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
  showLabel?: boolean;
}

const languages: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sr', name: 'Srpski', flag: '🇷🇸' },
];

export default function LanguageSwitcher({ currentLocale, className = '', showLabel = false }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  const currentLanguage = languages.find(l => l.code === currentLocale) || languages[0];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleLanguageChange = (newLocale: Locale) => {
    setIsOpen(false);
    
    // Save preference in cookie
    document.cookie = `preferred-locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    
    // Navigate to the new locale
    let newPath: string;
    
    if (currentLocale === 'sr') {
      // Currently on Serbian, switching to English
      if (newLocale === 'en') {
        // Remove /sr prefix
        newPath = pathname.replace(/^\/sr/, '') || '/';
      } else {
        newPath = pathname;
      }
    } else {
      // Currently on English, switching to Serbian
      if (newLocale === 'sr') {
        // Add /sr prefix
        newPath = `/sr${pathname === '/' ? '' : pathname}`;
      } else {
        newPath = pathname;
      }
    }
    
    router.push(newPath);
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="text-lg leading-none">{currentLanguage.flag}</span>
        {showLabel && <span className="text-sm text-white">{currentLanguage.name}</span>}
        <svg 
          className={`w-3 h-3 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 py-1 bg-bg-card border border-divider rounded-lg shadow-xl z-50 min-w-[120px] animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                lang.code === currentLocale 
                  ? 'bg-accent/10 text-accent' 
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              <span className="text-lg leading-none">{lang.flag}</span>
              <span>{lang.name}</span>
              {lang.code === currentLocale && (
                <svg className="w-4 h-4 ml-auto text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
