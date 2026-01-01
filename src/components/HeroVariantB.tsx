/**
 * Hero Variant B - A/B Test Version
 * 
 * Test variant with different headline and CTA focus.
 * Testing: "AI-Powered Match Intelligence" messaging
 */

'use client';

import Link from 'next/link';
import { LiveStatsCounter } from './SocialProof';
import LiveIntelCard from './LiveIntelCard';
import VideoBackground from './VideoBackground';

export default function HeroVariantB() {
  return (
    <section className="relative bg-bg-primary overflow-hidden">
      {/* Video Background (desktop) / Static fallback (mobile) */}
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
            {/* Live Stats Badge - VARIANT B: Different badge */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 sm:mb-6 justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/20 rounded-full text-xs sm:text-sm font-medium text-accent backdrop-blur-sm border border-accent/30">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                AI-Powered Sports Intelligence
              </div>
              <LiveStatsCounter className="hidden sm:flex" />
            </div>

            {/* Headline - VARIANT B: Different headline */}
            <h1 className="text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4 sm:mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              <span className="text-accent drop-shadow-[0_0_20px_rgba(42,246,160,0.5)]">60-Second</span> Match
              <br className="hidden xs:block" />
              Intelligence
            </h1>

            {/* Subheadline - VARIANT B: More benefit-focused */}
            <p className="text-base sm:text-lg text-white leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 bg-black/60 backdrop-blur-md rounded-xl px-5 py-4 shadow-xl border border-white/10">
              Stop guessing. Get <strong className="text-accent">AI-analyzed insights</strong> on any match:
              form trends, head-to-head patterns, and what the data actually says.
              <span className="block mt-2 text-gray-200 font-semibold">Soccer • NBA • NFL • NHL • UFC</span>
            </p>

            {/* CTA Buttons - VARIANT B: Reversed order, different copy */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link 
                href="/matches" 
                className="inline-flex items-center justify-center gap-2 text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto bg-gradient-to-r from-accent to-accent-dark text-bg-primary font-bold rounded-lg hover:from-accent-dark hover:to-accent transition-all shadow-lg shadow-accent/30"
              >
                Browse Matches
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/ai-desk" 
                className="inline-flex items-center justify-center gap-2 text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-all shadow-lg shadow-accent/20"
              >
                <span>🧠</span>
                Ask AI Agent
              </Link>
            </div>

            {/* Trust Indicators - VARIANT B: Different icons & copy */}
            <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/20">
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span>No signup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span>Real-time data</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span>5 sports covered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span>Free to start</span>
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
