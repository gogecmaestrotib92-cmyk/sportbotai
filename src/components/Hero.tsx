/**
 * Hero section for landing page
 * 
 * Modern sports analytics themed hero with SportBot Agent showcase.
 * Features premium video background on desktop.
 */

'use client';

import Link from 'next/link';
import { LiveStatsCounter } from './SocialProof';
import LiveIntelCard from './LiveIntelCard';
import VideoBackground from './VideoBackground';

export default function Hero() {
  return (
    <section className="relative bg-bg-primary overflow-hidden min-h-[600px] lg:min-h-[700px]">
      {/* Video Background (desktop) / Static Image (mobile) */}
      <VideoBackground
        videoSrc="/videos/hero-bg.mp4"
        overlayOpacity={0.35}
        disableOnMobile={true}
      />

      {/* Decorative accent removed - turf texture provides the background */}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Side - Content */}
          <div className="text-center lg:text-left">
            {/* Live Stats Badge - Glassmorphism */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 sm:mb-6 justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full text-xs sm:text-sm font-medium text-gray-200 border border-white/10 shadow-glass">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-glow-accent" />
                2 hours of research → 60 seconds
              </div>
              <LiveStatsCounter className="hidden sm:flex" />
            </div>

            {/* Headline - H1 for SEO - Bolder with gradient */}
            <h1 className="text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-2 sm:mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              Find Where
              <br className="hidden xs:block" />
              <span className="text-gradient-accent drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">The Market Is Wrong</span>
            </h1>

            {/* Explainer - One line to clarify meaning */}
            <p className="text-sm sm:text-base text-white/90 mb-4 sm:mb-6 max-w-lg mx-auto lg:mx-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Our AI crunches injuries, form, H2H &amp; odds from 50+ sources—you get the edge, not guesses.
            </p>

            {/* Subheadline - Pain quantification */}
            <p className="text-base sm:text-lg text-white/90 leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 card-glass px-5 py-4">
              Stop spending hours on research that still leaves you guessing.
              <strong className="text-accent"> Soccer, NBA, NFL, NHL &amp; UFC—analyzed in 60 seconds.</strong>
            </p>

            {/* CTA Buttons - Stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link
                href="/matches"
                className="btn-primary text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto glow-accent-strong"
              >
                Get Free Match Analysis
              </Link>
              <Link
                href="/ai-desk"
                className="btn-secondary inline-flex items-center justify-center gap-2 text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto"
              >
                <span>🧠</span>
                Ask Any Sports Question
              </Link>
            </div>


          </div>

          {/* Right Side - Live Intel Card */}
          <div className="relative lg:pl-8">
            <LiveIntelCard />
          </div>
        </div>
      </div>
    </section>
  );
}
