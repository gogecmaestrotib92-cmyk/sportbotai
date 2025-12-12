/**
 * Match Browser Component
 * 
 * Browse matches organized by Sport → League.
 * Sports: Soccer, Basketball, American Football, Hockey
 * Links to Match Preview pages.
 */

'use client';

import { useState, useEffect } from 'react';
import { MatchData } from '@/types';
import MatchCard from '@/components/MatchCard';
import LeagueLogo from '@/components/ui/LeagueLogo';

interface MatchBrowserProps {
  initialSport?: string;
  maxMatches?: number;
}

// Sports with their leagues organized
const SPORTS = [
  {
    id: 'soccer',
    name: 'Soccer',
    icon: '⚽',
    leagues: [
      { key: 'soccer_epl', name: 'Premier League' },
      { key: 'soccer_spain_la_liga', name: 'La Liga' },
      { key: 'soccer_germany_bundesliga', name: 'Bundesliga' },
      { key: 'soccer_italy_serie_a', name: 'Serie A' },
      { key: 'soccer_france_ligue_one', name: 'Ligue 1' },
      { key: 'soccer_uefa_champs_league', name: 'Champions League' },
      { key: 'soccer_uefa_europa_league', name: 'Europa League' },
      { key: 'soccer_brazil_campeonato', name: 'Brasileirão' },
      { key: 'soccer_mexico_ligamx', name: 'Liga MX' },
      { key: 'soccer_usa_mls', name: 'MLS' },
    ],
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    leagues: [
      { key: 'basketball_nba', name: 'NBA' },
      { key: 'basketball_euroleague', name: 'EuroLeague' },
      { key: 'basketball_ncaab', name: 'NCAA Basketball' },
    ],
  },
  {
    id: 'americanfootball',
    name: 'American Football',
    icon: '🏈',
    leagues: [
      { key: 'americanfootball_nfl', name: 'NFL' },
      { key: 'americanfootball_ncaaf', name: 'NCAA Football' },
    ],
  },
  {
    id: 'hockey',
    name: 'Hockey',
    icon: '🏒',
    leagues: [
      { key: 'icehockey_nhl', name: 'NHL' },
      { key: 'icehockey_sweden_allsvenskan', name: 'SHL' },
    ],
  },
];

export default function MatchBrowser({ initialSport = 'soccer', maxMatches = 12 }: MatchBrowserProps) {
  const [selectedSport, setSelectedSport] = useState<string>(initialSport);
  const [selectedLeague, setSelectedLeague] = useState<string>('soccer_epl');
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current sport config
  const currentSport = SPORTS.find(s => s.id === selectedSport) || SPORTS[0];
  const currentLeague = currentSport.leagues.find(l => l.key === selectedLeague) || currentSport.leagues[0];

  // When sport changes, select first league of that sport
  useEffect(() => {
    const sport = SPORTS.find(s => s.id === selectedSport);
    if (sport && sport.leagues.length > 0) {
      setSelectedLeague(sport.leagues[0].key);
    }
  }, [selectedSport]);

  // Fetch matches for selected league
  useEffect(() => {
    async function fetchMatches() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/match-data?sportKey=${selectedLeague}&includeOdds=false`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }

        const data = await response.json();
        setMatches(data.events || []);
      } catch (err) {
        console.error('Failed to fetch matches:', err);
        setError('Failed to load matches');
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMatches();
  }, [selectedLeague]);

  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Sport Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedSport === sport.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{sport.icon}</span>
              <span>{sport.name}</span>
            </button>
          ))}
        </div>

        {/* League Pills */}
        <div className="mb-6">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">
            {currentSport.name} Leagues
          </p>
          <div className="flex flex-wrap gap-2">
            {currentSport.leagues.map((league) => (
              <button
                key={league.key}
                onClick={() => setSelectedLeague(league.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedLeague === league.key
                    ? 'bg-white/20 text-white border border-white/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                <LeagueLogo leagueName={league.name} sport={league.key} size="xs" />
                <span>{league.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current League Header */}
        <div className="flex items-center gap-3 mb-4 py-3 border-t border-divider">
          <LeagueLogo leagueName={currentLeague.name} sport={selectedLeague} size="md" />
          <div>
            <h3 className="text-lg font-semibold text-white">{currentLeague.name}</h3>
            <p className="text-sm text-text-muted">
              {isLoading ? 'Loading matches...' : `${matches?.length || 0} upcoming matches`}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[160px] rounded-xl bg-bg-card animate-pulse border border-divider" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => setSelectedLeague(selectedLeague)} 
              className="btn-secondary"
            >
              Try again
            </button>
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && !error && matches && matches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.slice(0, maxMatches).map((match) => (
              <MatchCard
                key={match.matchId}
                matchId={match.matchId}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                league={currentLeague.name}
                sportKey={selectedLeague}
                commenceTime={match.commenceTime}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!matches || matches.length === 0) && (
          <div className="text-center py-12 bg-white/5 rounded-xl">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-gray-400 mb-2">No upcoming matches in {currentLeague.name}</p>
            <p className="text-sm text-text-muted">Try selecting a different league</p>
          </div>
        )}

        {/* Show More */}
        {!isLoading && matches && matches.length > maxMatches && (
          <div className="text-center mt-6">
            <p className="text-sm text-text-muted">
              Showing {maxMatches} of {matches?.length || 0} matches
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
