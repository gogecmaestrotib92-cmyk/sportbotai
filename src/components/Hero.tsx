/**
 * Hero section for landing page
 * 
 * Modern sports analytics themed hero with SportBot Agent showcase.
 */

'use client';

import Link from 'next/link';
import { LiveStatsCounter } from './SocialProof';

export default function Hero() {
  return (
    <section className="relative bg-bg-primary overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2A3036_1px,transparent_1px),linear-gradient(to_bottom,#2A3036_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-primary/10 rounded-full blur-[80px] sm:blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-accent/10 rounded-full blur-[60px] sm:blur-[100px]" />
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
                Browse today&apos;s matches
              </Link>
              <Link 
                href="/pricing" 
                className="btn-secondary text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto"
              >
                View pricing
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

          {/* Right Side - SportBot Agent Card */}
          <div className="relative lg:pl-8">
            <div className="relative">
              {/* Animated Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 via-violet-500/20 to-fuchsia-500/30 rounded-3xl blur-2xl opacity-60 animate-pulse" />
              <div className="absolute -inset-2 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl" />
              
              {/* Card - SportBot Agent */}
              <div className="relative bg-gradient-to-br from-bg-card via-bg-card to-purple-950/20 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl">
                {/* Animated Header Bar */}
                <div className="relative bg-gradient-to-r from-purple-600/20 via-violet-600/20 to-fuchsia-600/20 px-6 py-4 border-b border-purple-500/20">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(168,85,247,0.1),transparent)] animate-shimmer" />
                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                          <span className="text-2xl">🧠</span>
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-bg-card animate-pulse" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">SportBot Agent</p>
                        <p className="text-purple-300 text-sm flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          AI Sports Desk • Live
                        </p>
                      </div>
                    </div>
                    <Link href="/ai-desk" className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold rounded-full border border-purple-500/30 transition-all hover:scale-105">
                      Open Desk →
                    </Link>
                  </div>
                </div>

                {/* Live Intelligence Feed */}
                <div className="p-5 space-y-3">
                  {/* Post 1 - Market Movement */}
                  <div className="group relative bg-gradient-to-r from-orange-500/10 to-transparent rounded-xl p-4 border border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📊</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider">Market Movement</span>
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded">MODERATE</span>
                        </div>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          Sharp movement detected on the early Premier League fixture. Market uncertainty elevated after late team news.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm">⚽</span>
                          <span className="text-white/80 text-xs font-medium">Chelsea vs Everton</span>
                          <span className="text-gray-500 text-[10px]">• 15m ago</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post 2 - Lineup Intel */}
                  <div className="group relative bg-gradient-to-r from-green-500/10 to-transparent rounded-xl p-4 border border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📋</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Lineup Intel</span>
                          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded">CONFIDENT</span>
                        </div>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          Key midfielder confirmed out. Model volatility adjusted upward. Classic mid-week rotation chaos.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm">⚽</span>
                          <span className="text-white/80 text-xs font-medium">Man City vs Man United</span>
                          <span className="text-gray-500 text-[10px]">• 2h ago</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post 3 - AI Insight */}
                  <div className="group relative bg-gradient-to-r from-purple-500/10 to-transparent rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">AI Insight</span>
                          <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded">UNCERTAIN</span>
                        </div>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          High-complexity alert. Both sides showing inconsistent form and a history of chaotic encounters.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm">⚽</span>
                          <span className="text-white/80 text-xs font-medium">Liverpool vs Tottenham</span>
                          <span className="text-gray-500 text-[10px]">• 3h ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer - Feature Pills */}
                <div className="px-5 pb-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 text-xs font-medium rounded-full border border-purple-500/20">
                      ⚡ Real-Time
                    </span>
                    <span className="px-2.5 py-1 bg-blue-500/10 text-blue-300 text-xs font-medium rounded-full border border-blue-500/20">
                      🔄 Auto-Updating
                    </span>
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-300 text-xs font-medium rounded-full border border-green-500/20">
                      🏥 Injury Alerts
                    </span>
                    <span className="px-2.5 py-1 bg-orange-500/10 text-orange-300 text-xs font-medium rounded-full border border-orange-500/20">
                      📈 Odds Shifts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
