/**
 * Sport & League Selector - Responsive Design (i18n Version)
 * 
 * Mobile: Big icon grid for sports, scrollable league list
 * Desktop: Horizontal sport tabs + league cards grid
 */

'use client';

import Image from 'next/image';
import LeagueLogo from '@/components/ui/LeagueLogo';
import CountryFlag, { getCountryForLeague } from '@/components/ui/CountryFlag';
import { Locale, getTranslations } from '@/lib/i18n/translations';

interface League {
  key: string;
  name: string;
}

interface Sport {
  id: string;
  name: string;
  icon: string;
  leagues: League[];
}

// Local sport background images (stored in /public/sports/) - WebP for performance
const SPORT_BACKGROUNDS: Record<string, string> = {
  soccer: '/sports/soccer.webp',
  basketball: '/sports/basketball.webp',
  americanfootball: '/sports/football.webp',
  hockey: '/sports/hockey.webp',
};

interface SportLeagueSelectorI18nProps {
  sports: Sport[];
  selectedSport: string;
  selectedLeague: string;
  leagueMatchCounts: Record<string, number>;
  onSportChange: (sportId: string) => void;
  onLeagueChange: (leagueKey: string) => void;
  locale: Locale;
}

export default function SportLeagueSelectorI18n({
  sports,
  selectedSport,
  selectedLeague,
  leagueMatchCounts,
  onSportChange,
  onLeagueChange,
  locale,
}: SportLeagueSelectorI18nProps) {
  const t = getTranslations(locale);
  const currentSport = sports.find(s => s.id === selectedSport) || sports[0];
  
  // Calculate total matches per sport
  const sportMatchCounts = sports.reduce((acc, sport) => {
    acc[sport.id] = sport.leagues.reduce((sum, league) => {
      return sum + (leagueMatchCounts[league.key] || 0);
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  // Get trending leagues (top 6 by match count)
  const allLeagues = sports.flatMap(sport => 
    sport.leagues.map(league => ({
      ...league,
      sportId: sport.id,
      sportIcon: sport.icon,
      matchCount: leagueMatchCounts[league.key] || 0,
    }))
  );
  const trendingLeagues = [...allLeagues]
    .filter(l => l.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Sports Grid - Cinematic Stadium Cards */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sports.map((sport) => {
            const count = sportMatchCounts[sport.id] || 0;
            const bgImage = SPORT_BACKGROUNDS[sport.id] || SPORT_BACKGROUNDS.soccer;
            return (
              <button
                key={sport.id}
                onClick={() => onSportChange(sport.id)}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 h-28 md:h-36 ${
                  selectedSport === sport.id
                    ? 'border-accent/60 shadow-lg shadow-accent/20 ring-2 ring-accent/30'
                    : 'border-white/10 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10'
                }`}
                style={{ transform: 'translateZ(0)' }}
              >
                {/* Background Image - Next.js Image for LCP optimization */}
                <Image
                  src={bgImage}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  quality={60}
                  className="object-cover object-center transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                  priority={sport.id === 'soccer'}
                  fetchPriority={sport.id === 'soccer' ? 'high' : 'auto'}
                  aria-hidden="true"
                />
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 pointer-events-none" />
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-end h-full pb-4 px-3">
                  <span className="text-base md:text-lg font-bold text-white drop-shadow-lg">
                    {sport.name}
                  </span>
                  {count > 0 && (
                    <span className="mt-1.5 px-2.5 py-0.5 text-[10px] md:text-xs font-semibold rounded-full bg-accent/30 text-accent backdrop-blur-sm">
                      {count} {t.matches.matchesCount}
                    </span>
                  )}
                </div>
                {/* Selected indicator */}
                {selectedSport === sport.id && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-lg shadow-accent/50" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending Leagues - Secondary, smaller */}
      {trendingLeagues.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {t.matches.trendingNow}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {trendingLeagues.map((league) => (
              <button
                key={league.key}
                onClick={() => {
                  onSportChange(league.sportId);
                  onLeagueChange(league.key);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${
                  selectedLeague === league.key
                    ? 'bg-accent/20 border-accent/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex-shrink-0">
                  {/* Use country flags only for domestic soccer leagues, not international competitions */}
                  {league.sportId === 'soccer' && getCountryForLeague(league.name) && 
                   !league.name.toLowerCase().includes('champions') &&
                   !league.name.toLowerCase().includes('europa') ? (
                    <CountryFlag country={getCountryForLeague(league.name)!} size="xs" />
                  ) : (
                    <LeagueLogo leagueName={league.name} sport={league.key} size="xs" />
                  )}
                </div>
                <span className="text-xs font-medium text-white">{league.name}</span>
                <span className="text-[10px] text-accent">{league.matchCount}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* League Section Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
          {currentSport.name} {t.matches.leagues}
        </p>
        <span className="text-xs text-text-muted">
          {currentSport.leagues.length} {t.matches.leaguesCount}
        </span>
      </div>

      {/* Mobile: League List */}
      <div className="md:hidden space-y-2">
        {currentSport.leagues.map((league) => {
          const matchCount = leagueMatchCounts[league.key] || 0;
          const hasNoMatches = matchCount === 0;
          return (
            <button
              key={league.key}
              onClick={() => onLeagueChange(league.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                selectedLeague === league.key
                  ? 'bg-accent/20 border-accent/40 shadow-lg shadow-accent/10'
                  : hasNoMatches
                    ? 'bg-white/5 border-white/5 opacity-50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex-shrink-0">
                {/* Use country flags only for domestic soccer leagues */}
                {currentSport.id === 'soccer' && getCountryForLeague(league.name) && 
                 !league.name.toLowerCase().includes('champions') && 
                 !league.name.toLowerCase().includes('europa') ? (
                  <CountryFlag country={getCountryForLeague(league.name)!} size="sm" />
                ) : (
                  <LeagueLogo leagueName={league.name} sport={league.key} size="sm" />
                )}
              </div>
              <span className="flex-1 text-left text-sm font-medium text-white">{league.name}</span>
              {matchCount > 0 ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent/20 text-accent">
                  {matchCount}
                </span>
              ) : (
                <span className="text-xs text-gray-500">{t.matches.noMatches}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop: League Cards Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {currentSport.leagues.map((league) => {
          const matchCount = leagueMatchCounts[league.key] || 0;
          const hasNoMatches = matchCount === 0;
          return (
            <button
              key={league.key}
              onClick={() => onLeagueChange(league.key)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                selectedLeague === league.key
                  ? 'bg-accent/20 border-accent/40 shadow-lg shadow-accent/10 ring-1 ring-accent/20'
                  : hasNoMatches
                    ? 'bg-white/5 border-white/5 opacity-50 hover:opacity-70'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {/* Use country flags only for domestic soccer leagues */}
                {currentSport.id === 'soccer' && getCountryForLeague(league.name) && 
                 !league.name.toLowerCase().includes('champions') && 
                 !league.name.toLowerCase().includes('europa') ? (
                  <CountryFlag country={getCountryForLeague(league.name)!} size="md" />
                ) : (
                  <LeagueLogo leagueName={league.name} sport={league.key} size="md" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{league.name}</div>
                <div className="text-xs text-text-muted">
                  {matchCount > 0 ? (
                    <span className="text-accent">{matchCount} {t.matches.matchesCount}</span>
                  ) : (
                    <span>{t.matches.noUpcoming}</span>
                  )}
                </div>
              </div>
              {selectedLeague === league.key && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
