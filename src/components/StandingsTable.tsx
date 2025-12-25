/**
 * Standings Table Component
 * 
 * Displays league standings/table with team positions.
 * Highlights specific teams (e.g., teams in the current match).
 * Supports soccer, basketball, hockey, and NFL.
 * 
 * Features:
 * - Collapsible for mobile
 * - Team logo display
 * - Form guide (last 5 matches)
 * - Position descriptions (Champions League, Relegation, etc.)
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Trophy, TrendingDown, TrendingUp } from 'lucide-react';

interface StandingEntry {
  position: number;
  teamId: number;
  teamName: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: string | null;
  group: string | null;
  description: string | null;
}

interface StandingsData {
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
    season: string;
  };
  standings: StandingEntry[];
}

interface StandingsTableProps {
  sport: 'soccer' | 'basketball' | 'hockey' | 'nfl';
  leagueId: number;
  season?: string;
  highlightTeams?: string[]; // Team names to highlight
  maxRows?: number; // Limit rows shown (for compact view)
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showAroundTeams?: boolean; // Show context around highlighted teams
  className?: string;
}

// Position descriptions color coding
function getPositionStyle(description: string | null, position: number): string {
  if (!description) return '';
  
  const desc = description.toLowerCase();
  
  if (desc.includes('champions league') || desc.includes('championship')) {
    return 'border-l-4 border-l-blue-500 bg-blue-500/10';
  }
  if (desc.includes('europa') || desc.includes('conference')) {
    return 'border-l-4 border-l-orange-500 bg-orange-500/10';
  }
  if (desc.includes('playoff')) {
    return 'border-l-4 border-l-green-500 bg-green-500/10';
  }
  if (desc.includes('relegation') || desc.includes('relegated')) {
    return 'border-l-4 border-l-red-500 bg-red-500/10';
  }
  
  // Top 3 get subtle gold
  if (position <= 3) {
    return 'bg-yellow-500/5';
  }
  
  return '';
}

// Form result to colored dot
function FormDot({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: 'bg-green-500',
    D: 'bg-yellow-500',
    L: 'bg-red-500',
  };
  
  return (
    <span 
      className={`inline-block w-2 h-2 rounded-full ${colors[result] || 'bg-gray-500'}`}
      title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
    />
  );
}

export default function StandingsTable({
  sport,
  leagueId,
  season,
  highlightTeams = [],
  maxRows,
  collapsible = true,
  defaultExpanded = false,
  showAroundTeams = true,
  className = '',
}: StandingsTableProps) {
  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  useEffect(() => {
    async function fetchStandings() {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          sport,
          league: String(leagueId),
        });
        if (season) params.set('season', season);
        
        const response = await fetch(`/api/standings?${params}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load standings');
        }
      } catch (err) {
        setError('Failed to load standings');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStandings();
  }, [sport, leagueId, season]);
  
  // Filter/slice standings based on props
  function getDisplayStandings(): StandingEntry[] {
    if (!data) return [];
    
    const standings = [...data.standings];
    
    // If showing around teams, find their positions and show context
    if (showAroundTeams && highlightTeams.length > 0) {
      const highlightPositions = standings
        .filter(s => highlightTeams.some(t => 
          s.teamName.toLowerCase().includes(t.toLowerCase()) ||
          t.toLowerCase().includes(s.teamName.toLowerCase())
        ))
        .map(s => s.position);
      
      if (highlightPositions.length > 0) {
        // Show continuous range from top to 2 positions below the lowest highlighted team
        const maxPos = Math.min(standings.length, Math.max(...highlightPositions) + 2);
        
        // Ensure we show at least down to maxPos (all positions from 1 to maxPos)
        const contextRange = standings.slice(0, maxPos);
        
        // If no limit or not collapsible, show all
        if (!maxRows && !collapsible) {
          return standings;
        }
        
        return contextRange;
      }
    }
    
    // Default: show top 10 if no highlighted teams found
    if (maxRows && !expanded) {
      return standings.slice(0, maxRows);
    }
    
    // If collapsible but no maxRows, show top 10 by default
    if (collapsible && !expanded) {
      return standings.slice(0, 10);
    }
    
    return standings;
  }
  
  const displayStandings = getDisplayStandings();
  const showExpandButton = collapsible && data && displayStandings.length < data.standings.length;
  
  // Check if a team should be highlighted
  const isHighlighted = (teamName: string) => {
    return highlightTeams.some(t => 
      teamName.toLowerCase().includes(t.toLowerCase()) ||
      t.toLowerCase().includes(teamName.toLowerCase())
    );
  };
  
  // Different column headers based on sport
  const isSoccer = sport === 'soccer';
  const showDraws = isSoccer; // Only soccer has draws
  
  if (loading) {
    return (
      <div className={`rounded-xl border border-white/10 bg-surface-dark p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className={`rounded-xl border border-white/10 bg-surface-dark p-4 text-center text-gray-400 ${className}`}>
        <p>{error || 'No standings available'}</p>
      </div>
    );
  }
  
  return (
    <div className={`rounded-xl border border-white/10 bg-surface-dark overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        {data.league.logo && (
          <Image
            src={data.league.logo}
            alt={data.league.name}
            width={32}
            height={32}
            className="object-contain"
          />
        )}
        <div>
          <h3 className="font-semibold text-white">{data.league.name}</h3>
          <p className="text-xs text-gray-400">{data.league.country} · {data.league.season}</p>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-white/10">
              <th className="text-left py-2 px-3 w-8">#</th>
              <th className="text-left py-2 px-3">Team</th>
              <th className="text-center py-2 px-2 hidden sm:table-cell">P</th>
              <th className="text-center py-2 px-2">W</th>
              {showDraws && <th className="text-center py-2 px-2 hidden sm:table-cell">D</th>}
              <th className="text-center py-2 px-2">L</th>
              <th className="text-center py-2 px-2 hidden md:table-cell">GF</th>
              <th className="text-center py-2 px-2 hidden md:table-cell">GA</th>
              <th className="text-center py-2 px-2 hidden sm:table-cell">+/-</th>
              <th className="text-center py-2 px-2 font-bold">{isSoccer ? 'Pts' : 'W'}</th>
              <th className="text-center py-2 px-2 hidden lg:table-cell">Form</th>
            </tr>
          </thead>
          <tbody>
            {displayStandings.map((team, idx) => {
              const highlighted = isHighlighted(team.teamName);
              const positionStyle = getPositionStyle(team.description, team.position);
              
              // Check if there's a gap in positions (for context view)
              const prevPos = idx > 0 ? displayStandings[idx - 1].position : 0;
              const showGap = team.position - prevPos > 1;
              
              return (
                <>
                  {showGap && (
                    <tr key={`gap-${team.position}`}>
                      <td colSpan={11} className="py-1 px-3 text-center text-gray-500 text-xs border-b border-white/5">
                        ···
                      </td>
                    </tr>
                  )}
                  <tr 
                    key={team.teamId}
                    className={`
                      border-b border-white/5 transition-colors
                      ${highlighted 
                        ? 'bg-accent-blue/20 border-l-4 border-l-accent-blue' 
                        : positionStyle
                      }
                      ${!highlighted && !positionStyle ? 'hover:bg-white/5' : ''}
                    `}
                  >
                    <td className="py-2 px-3 text-gray-400 font-medium">
                      <span className="flex items-center gap-1">
                        {team.position === 1 && <Trophy className="w-3 h-3 text-yellow-500" />}
                        {team.position}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {team.teamLogo && (
                          <Image
                            src={team.teamLogo}
                            alt={team.teamName}
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        )}
                        <span className={`truncate max-w-[120px] sm:max-w-none ${highlighted ? 'text-white font-semibold' : 'text-gray-300'}`}>
                          {team.teamName}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center text-gray-400 hidden sm:table-cell">{team.played}</td>
                    <td className="py-2 px-2 text-center text-green-400">{team.won}</td>
                    {showDraws && <td className="py-2 px-2 text-center text-gray-400 hidden sm:table-cell">{team.drawn}</td>}
                    <td className="py-2 px-2 text-center text-red-400">{team.lost}</td>
                    <td className="py-2 px-2 text-center text-gray-400 hidden md:table-cell">{team.goalsFor}</td>
                    <td className="py-2 px-2 text-center text-gray-400 hidden md:table-cell">{team.goalsAgainst}</td>
                    <td className="py-2 px-2 text-center hidden sm:table-cell">
                      <span className={team.goalDiff > 0 ? 'text-green-400' : team.goalDiff < 0 ? 'text-red-400' : 'text-gray-400'}>
                        {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-white">{isSoccer ? team.points : team.won}</td>
                    <td className="py-2 px-2 text-center hidden lg:table-cell">
                      {team.form && (
                        <div className="flex items-center justify-center gap-1">
                          {team.form.split('').slice(-5).map((result, i) => (
                            <FormDot key={i} result={result} />
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Expand/Collapse Button */}
      {showExpandButton && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 px-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/10"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              View Full Table ({data.standings.length} teams)
            </>
          )}
        </button>
      )}
      
      {/* Legend */}
      {data.standings.some(s => s.description) && (
        <div className="px-4 py-2 border-t border-white/10 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-sm" /> Champions League
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-500 rounded-sm" /> Europa League
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-sm" /> Relegation
          </span>
        </div>
      )}
    </div>
  );
}
