/**
 * Infinite League Logos Scroll - v9.0
 * 
 * Optimized for mobile performance:
 * - Uses CSS-only animation without will-change (avoids GPU memory leak)
 * - Lightweight img tags instead of Next/Image for static external URLs
 * - Hardware acceleration via transform3d
 * - Pauses animation when not visible (IntersectionObserver)
 */

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

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
    className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
  >
    <div className="w-10 h-10 flex-shrink-0 bg-white rounded-lg p-1.5 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={league.logo}
        alt={`${league.name} logo`}
        width={28}
        height={28}
        className="object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
    <span className="text-sm font-semibold text-gray-300 whitespace-nowrap">
      {league.name}
    </span>
  </Link>
);

export default function LeagueScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Pause animation when not visible to save resources
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={containerRef} className="py-8 border-y border-white/5 overflow-hidden bg-black">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes league-scroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .league-marquee {
          display: flex;
          width: max-content;
          animation: league-scroll 35s linear infinite;
        }
        .league-marquee.paused {
          animation-play-state: paused;
        }
        .league-marquee:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .league-marquee {
            animation: none;
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
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

          {/* Single wrapper with duplicated content for seamless loop */}
          <div className={`league-marquee ${!isVisible ? 'paused' : ''}`}>
            <div className="flex gap-4 pr-4">
              {leagues.map((league) => (
                <LeagueItem key={`a-${league.key}`} league={league} />
              ))}
            </div>
            <div className="flex gap-4 pr-4">
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
