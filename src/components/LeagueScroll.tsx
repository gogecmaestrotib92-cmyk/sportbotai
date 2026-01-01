/**
 * Infinite League Logos Scroll
 * 
 * Displays supported sports leagues in an infinite horizontal scroll animation.
 * Uses real league logos from our app's logo library.
 */

'use client';

import Image from 'next/image';

const leagues = [
  { name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { name: 'Ligue 1', logo: 'https://media.api-sports.io/football/leagues/61.png' },
  { name: 'Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { name: 'NBA', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png' },
  { name: 'NFL', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png' },
  { name: 'NHL', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png' },
  { name: 'EuroLeague', logo: 'https://media.api-sports.io/basketball/leagues/120.png' },
];

export default function LeagueScroll() {
  // Duplicate leagues for seamless infinite scroll
  const duplicatedLeagues = [...leagues, ...leagues];

  return (
    <section className="py-8 bg-bg-primary border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div className="text-center mb-6">
          <span className="text-accent text-xs font-semibold uppercase tracking-wider">
            Sports Coverage
          </span>
        </div>

        {/* Infinite Scroll Container */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

          {/* Scrolling track */}
          <div className="flex gap-6 animate-scroll">
            {duplicatedLeagues.map((league, index) => (
              <div
                key={`${league.name}-${index}`}
                className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-accent/30 transition-all duration-300 group"
              >
                {/* League logo with white background for visibility */}
                <div className="relative w-8 h-8 flex-shrink-0 bg-white rounded-md p-1">
                  <Image
                    src={league.logo}
                    alt={`${league.name} logo`}
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-300 p-0.5"
                    unoptimized
                  />
                </div>
                {/* League name */}
                <span className="text-sm font-medium text-gray-300 whitespace-nowrap group-hover:text-white transition-colors">
                  {league.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 40s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
