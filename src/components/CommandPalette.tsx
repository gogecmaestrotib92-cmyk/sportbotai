/**
 * Command Palette / Quick Search
 * 
 * Cmd/Ctrl + K to open quick search overlay.
 * Allows quick navigation and match search.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

interface CommandItem {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  shortcut?: string;
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define available commands
  const commands: CommandItem[] = [
    // Navigation
    { id: 'analyzer', label: 'Analyze a Match', icon: '🔍', action: () => router.push('/matches'), shortcut: '⌘A', category: 'Navigate' },
    { id: 'home', label: 'Go to Home', icon: '🏠', action: () => router.push('/'), category: 'Navigate' },
    { id: 'pricing', label: 'View Pricing', icon: '💰', action: () => router.push('/pricing'), category: 'Navigate' },
    { id: 'history', label: 'View History', icon: '📜', action: () => router.push('/history'), category: 'Navigate' },
    { id: 'account', label: 'Account Settings', icon: '👤', action: () => router.push('/account'), category: 'Navigate' },
    
    // Sports quick access
    { id: 'soccer', label: 'Soccer Matches', icon: '⚽', action: () => router.push('/analyzer?sport=soccer'), category: 'Sports' },
    { id: 'basketball', label: 'Basketball (NBA)', icon: '🏀', action: () => router.push('/analyzer?sport=basketball_nba'), category: 'Sports' },
    { id: 'nfl', label: 'NFL Football', icon: '🏈', action: () => router.push('/analyzer?sport=americanfootball_nfl'), category: 'Sports' },
    { id: 'mma', label: 'MMA / UFC', icon: '🥊', action: () => router.push('/analyzer?sport=mma_mixed_martial_arts'), category: 'Sports' },
    { id: 'tennis', label: 'Tennis', icon: '🎾', action: () => router.push('/analyzer?sport=tennis'), category: 'Sports' },
    
    // Actions
    { id: 'blog', label: 'Read Blog', icon: '📝', action: () => router.push('/blog'), category: 'More' },
    { id: 'contact', label: 'Contact Us', icon: '✉️', action: () => router.push('/contact'), category: 'More' },
    { id: 'responsible', label: 'Responsible Gambling', icon: '🛡️', action: () => router.push('/responsible-gambling'), category: 'More' },
  ];

  // Filter commands based on query
  const filteredCommands = query
    ? commands.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const cat = cmd.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Flatten for keyboard navigation
  const flatCommands = Object.values(groupedCommands).flat();

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % flatCommands.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + flatCommands.length) % flatCommands.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          flatCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [flatCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-full flex items-start justify-center pt-[15vh] px-4 pb-20">
        <div 
          className="relative w-full max-w-lg bg-bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onKeyDown={handleKeyDown}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search or type a command..."
              className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[10px] font-medium text-white/30 bg-white/5 rounded border border-white/10">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-2 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                  {category}
                </div>
                {items.map((cmd) => {
                  const isSelected = flatCommands[selectedIndex]?.id === cmd.id;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-primary/20 text-white' : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-lg">{cmd.icon}</span>
                      <span className="flex-1 text-sm font-medium">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-white/30 bg-white/5 rounded">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {flatCommands.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-white/40 text-sm">No results for &ldquo;{query}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/30">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/5 rounded">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/5 rounded">↵</kbd> select
              </span>
            </div>
            <span>SportBot AI</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================
// KEYBOARD SHORTCUTS PROVIDER
// Wraps the app to listen for global shortcuts
// ============================================
interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }

      // Escape to close
      if (e.key === 'Escape' && isCommandOpen) {
        setIsCommandOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandOpen]);

  return (
    <>
      {children}
      {isMounted && (
        <CommandPalette 
          isOpen={isCommandOpen} 
          onClose={() => setIsCommandOpen(false)} 
        />
      )}
    </>
  );
}

// ============================================
// SHORTCUT HINT BADGE
// Shows Cmd+K hint in UI
// ============================================
export function ShortcutHint({ className = '' }: { className?: string }) {
  const [platform, setPlatform] = useState<'mac' | 'other'>('other');

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setPlatform(navigator.platform.toLowerCase().includes('mac') ? 'mac' : 'other');
    }
  }, []);

  return (
    <div className={`hidden sm:flex items-center gap-1 text-white/30 text-xs ${className}`}>
      <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-[10px]">
        {platform === 'mac' ? '⌘' : 'Ctrl'}
      </kbd>
      <span>+</span>
      <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-[10px]">K</kbd>
      <span className="ml-1">Quick search</span>
    </div>
  );
}
