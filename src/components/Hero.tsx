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
    <section className="relative bg-bg-primary overflow-hidden">
      {/* Video Background (desktop) / Static Image (mobile) */}
      <VideoBackground
        videoSrc="/videos/hero-bg.mp4"
        overlayOpacity={0.55}
        disableOnMobile={true}
      />
      
      {/* Additional decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-primary/5 rounded-full blur-[80px] sm:blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-accent/5 rounded-full blur-[60px] sm:blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Side - Content */}
          <div className="text-center lg:text-left">
            {/* Live Stats Badge */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 sm:mb-6 justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs sm:text-sm font-medium text-gray-300 backdrop-blur-sm border border-white/10">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                Understand any match in 60 seconds
              </div>
              <LiveStatsCounter className="hidden sm:flex" />
            </div>

            {/* Headline - H1 for SEO */}
            <h1 className="text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4 sm:mb-6">
              Know Any Match
              <br className="hidden xs:block" />
              <span className="text-accent">Before It Happens</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
              Pre-match intelligence: headlines, form, H2H history & AI insights.
              <strong className="text-gray-300"> Soccer, NBA, NFL, NHL & UFC—all in 60 seconds.</strong>
            </p>

            {/* CTA Buttons - Stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link 
                href="/matches" 
                className="btn-primary text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto"
              >
                Browse Matches
              </Link>
              <Link 
                href="/ai-desk" 
                className="inline-flex items-center justify-center gap-2 text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-lg hover:from-violet-400 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/20"
              >
                <span>🧠</span>
                Ask AI Agent
              </Link>
            </div>

            {/* Trust Indicators - Horizontal scroll on mobile */}
            <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/10">
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📰</span>
                  <span>Match Headlines</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <span>Form & H2H</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span>AI Briefings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📤</span>
                  <span>Share Cards</span>
                </div>
              </div>
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
