/**
 * Infinite League Logos Scroll - v7.0
 * 
 * FAST + SMOOTH marquee using proven CSS technique.
 * Two tracks side by side, each animating independently.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';

const leagues = [
  { name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png', key: 'soccer_epl' },
  { name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png', key: 'soccer_spain_la_liga' },
  { name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png', key: 'soccer_italy_serie_a' },
  { name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png', key: 'soccer_germany_bundesliga' },
  { name: 'Ligue 1', logo: 'https://media.api-sports.io/football/leagues/61.png', key: 'soccer_france_ligue_one' },
  { name: 'Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png', key: 'soccer_uefa_champs_league' },
  { name: 'NBA', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png', key: 'basketball_nba' },
  { name: 'NFL', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png', key: 'americanfootball_nfl' },
  { name: 'NHL', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png', key: 'icehockey_nhl' },
  { name: 'EuroLeague', logo: 'https://media.api-sports.io/basketball/leagues/120.png', key: 'basketball_euroleague' },
];

const LeagueItem = ({ league }: { league: typeof leagues[0] }) => (
  <Link
    href={`/matches?league=${league.key}`}
    className="flex-shrink-0 flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
  >
    <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-white rounded-lg p-1.5">
      <Image
        src={league.logo}
        alt={`${league.name} logo`}
        fill
        sizes="48px"
        className="object-contain p-0.5"
      />
    </div>
    <span className="text-sm sm:text-base font-semibold text-gray-300 whitespace-nowrap">
      {league.name}
    </span>
  </Link>
);

export default function LeagueScroll() {
  return (
    <section className="py-8 bg-bg-primary border-y border-white/5 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scrollLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        .marquee-container {
          display: flex;
          overflow: hidden;
          gap: 0;
        }
        .marquee-track {
          display: flex;
          gap: 1rem;
          padding-right: 1rem;
          animation: scrollLeft 10s linear infinite;
          flex-shrink: 0;
        }
        @media (min-width: 640px) {
          .marquee-track {
            gap: 1.5rem;
            padding-right: 1.5rem;
          }
        }
      `}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <span className="text-accent text-xs font-semibold uppercase tracking-wider">
            Sports Coverage
          </span>
        </div>

        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-20 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-20 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

          {/* Two identical tracks create seamless infinite scroll */}
          <div className="marquee-container">
            <div className="marquee-track">
              {leagues.map((league) => (
                <LeagueItem key={`a-${league.key}`} league={league} />
              ))}
            </div>
            <div className="marquee-track">
              {leagues.map((league) => (
                <LeagueItem key={`b-${league.key}`} league={league} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
