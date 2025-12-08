/**
 * League Accordion Component
 * 
 * Premium expandable sections for each league.
 * Clean design with smooth animations and clear visual hierarchy.
 */

'use client';

import { useState, useEffect } from 'react';
import { MatchData } from '@/types';
import { LeagueGroup, getSportIcon } from './utils';
import MatchList from './MatchList';

interface LeagueAccordionProps {
  leagues: LeagueGroup[];
  selectedMatchId?: string;
  onMatchSelect: (match: MatchData) => void;
  loading?: boolean;
  defaultExpanded?: boolean;
  searchQuery?: string;
}

export default function LeagueAccordion({
  leagues,
  selectedMatchId,
  onMatchSelect,
  loading = false,
  defaultExpanded = false,
  searchQuery = '',
}: LeagueAccordionProps) {
  // Track which leagues are expanded
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());

  // Auto-expand when searching or when there's only one league
  useEffect(() => {
    if (searchQuery.trim() || leagues.length === 1) {
      setExpandedLeagues(new Set(leagues.map(l => l.leagueKey)));
    } else if (defaultExpanded) {
      setExpandedLeagues(new Set(leagues.map(l => l.leagueKey)));
    }
  }, [searchQuery, leagues, defaultExpanded]);

  // Auto-expand league containing selected match
  useEffect(() => {
    if (selectedMatchId) {
      const league = leagues.find(l => 
        l.matches.some(m => m.matchId === selectedMatchId)
      );
      if (league) {
        setExpandedLeagues(prev => new Set([...Array.from(prev), league.leagueKey]));
      }
    }
  }, [selectedMatchId, leagues]);

  const toggleLeague = (leagueKey: string) => {
    setExpandedLeagues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leagueKey)) {
        newSet.delete(leagueKey);
      } else {
        newSet.add(leagueKey);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-bg-elevated rounded-card" />
          </div>
        ))}
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <div className="text-center py-12 bg-bg-card rounded-card border border-divider">
        <div className="w-14 h-14 bg-bg-elevated rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h3 className="font-semibold text-white mb-1">
          {searchQuery ? 'No matches found' : 'No leagues available'}
        </h3>
        <p className="text-gray-400 text-sm">
          {searchQuery ? `Try a different search term` : 'Select a league to view matches'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leagues.map((league, index) => {
        const isExpanded = expandedLeagues.has(league.leagueKey);
        const matchCount = league.matches.length;
        const hasSelectedMatch = league.matches.some(m => m.matchId === selectedMatchId);

        return (
          <div
            key={league.leagueKey}
            className={`
              rounded-card overflow-hidden transition-all duration-200 border
              ${hasSelectedMatch 
                ? 'border-primary/30 bg-primary/5' 
                : 'border-divider bg-bg-card'
              }
              ${isExpanded ? 'shadow-card' : ''}
            `}
          >
            {/* League Header */}
            <button
              onClick={() => toggleLeague(league.leagueKey)}
              className={`
                w-full flex items-center justify-between p-4 text-left
                transition-colors duration-200 group
                ${isExpanded ? 'bg-bg-elevated/50' : 'hover:bg-bg-elevated/50'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                  ${isExpanded ? 'bg-primary text-white' : 'bg-bg-elevated text-gray-400 group-hover:bg-divider'}
                `}>
                  <span className="text-lg">{getSportIcon(league.sportKey)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm sm:text-base">{league.leagueName}</h3>
                  <p className="text-xs text-gray-400">
                    {matchCount} {matchCount === 1 ? 'match' : 'matches'} available
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {hasSelectedMatch && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Selected
                  </span>
                )}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${isExpanded ? 'bg-primary rotate-180' : 'bg-bg-elevated group-hover:bg-divider'}
                `}>
                  <svg
                    className={`w-4 h-4 transition-colors ${isExpanded ? 'text-white' : 'text-gray-400'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Matches - Expandable */}
            <div className={`
              overflow-hidden transition-all duration-300
              ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
            `}>
              <div className="px-4 pb-4 pt-2 border-t border-divider bg-bg-elevated/30">
                <MatchList
                  matches={league.matches}
                  selectedMatchId={selectedMatchId}
                  onMatchSelect={onMatchSelect}
                  compact
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
