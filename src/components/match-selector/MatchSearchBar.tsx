/**
 * Match Search Bar Component
 * 
 * Search input for filtering matches by team name.
 * Clean, minimal design with keyboard shortcut support.
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface MatchSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  totalMatches?: number;
  filteredMatches?: number;
}

export default function MatchSearchBar({
  value,
  onChange,
  placeholder = 'Search by team name...',
  disabled = false,
  totalMatches,
  filteredMatches,
}: MatchSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to clear and blur
      if (e.key === 'Escape' && isFocused) {
        if (value) {
          onChange('');
        } else {
          inputRef.current?.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, value, onChange]);

  const showResultCount = value.trim() && filteredMatches !== undefined && totalMatches !== undefined;
  const hasNoResults = showResultCount && filteredMatches === 0;

  return (
    <div className="relative">
      <div
        className={`
          relative flex items-center bg-bg-card border rounded-card transition-all duration-200
          ${isFocused 
            ? 'border-primary shadow-sm ring-2 ring-primary/10' 
            : 'border-divider hover:border-gray-500'
          }
          ${hasNoResults ? 'border-danger ring-2 ring-danger/10' : ''}
          ${disabled ? 'bg-bg-elevated opacity-60 cursor-not-allowed' : ''}
        `}
      >
        {/* Search icon */}
        <div className="pl-3.5 sm:pl-4 pr-2">
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
              hasNoResults ? 'text-danger' : isFocused ? 'text-primary' : 'text-gray-400'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 py-2.5 sm:py-3 pr-2 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm"
        />

        {/* Result count pill (inline when searching) */}
        {showResultCount && (
          <div className={`
            hidden sm:flex items-center gap-1 mr-2 px-2 py-1 rounded-full text-xs font-medium
            ${hasNoResults 
              ? 'bg-danger/10 text-danger' 
              : 'bg-bg-elevated text-gray-400'
            }
          `}>
            {hasNoResults ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                No matches
              </>
            ) : (
              <>{filteredMatches} found</>
            )}
          </div>
        )}

        {/* Clear button */}
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1.5 sm:p-2 mr-1.5 sm:mr-2 text-gray-400 hover:text-white rounded-lg hover:bg-bg-elevated transition-colors active:scale-95"
            type="button"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Keyboard shortcut hint */}
        {!value && !isFocused && (
          <div className="hidden sm:flex items-center gap-1 pr-3 text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded text-gray-400 font-mono text-[10px]">⌘K</kbd>
          </div>
        )}
      </div>

      {/* Mobile result count (below search bar) */}
      {showResultCount && (
        <div className={`sm:hidden absolute right-0 -bottom-5 text-xs ${hasNoResults ? 'text-danger' : 'text-gray-400'}`}>
          {hasNoResults ? 'No matches found' : `${filteredMatches} of ${totalMatches}`}
        </div>
      )}
    </div>
  );
}
