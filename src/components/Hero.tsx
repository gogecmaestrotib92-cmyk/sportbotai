/**
 * Hero section for landing page
 * 
 * Modern sports analytics themed hero with mock analysis card preview.
 */

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative bg-bg-primary overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2A3036_1px,transparent_1px),linear-gradient(to_bottom,#2A3036_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-sm font-medium text-gray-300 mb-6 backdrop-blur-sm border border-white/10">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              AI-Powered Sports Analytics
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Smarter sports analysis
              <br />
              <span className="text-accent">with AI</span>
              <span className="text-gray-400"> — not betting tips</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-xl">
              BetSense AI helps you understand probabilities, value, and risk across multiple sports. 
              No fixed matches. No guarantees. Just transparent analysis.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/analyzer" 
                className="btn-primary text-center text-lg px-8 py-4"
              >
                Start analyzing matches
              </Link>
              <Link 
                href="/pricing" 
                className="btn-secondary text-center text-lg px-8 py-4"
              >
                View pricing
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 pt-8 border-t border-white/10">
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Multi-Sport Coverage</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Transparent Risk Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Responsible Approach</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Mock Analysis Card */}
          <div className="relative lg:pl-8">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-50" />
              
              {/* Card */}
              <div className="relative bg-bg-card border border-divider rounded-card p-6 shadow-2xl">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <span className="text-xl">⚽</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">Premier League</p>
                      <p className="text-gray-500 text-sm">Dec 15, 2024 • 15:00</p>
                    </div>
                  </div>
                  <span className="badge badge-info">Live Odds</span>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between py-4 border-y border-divider">
                  <div className="text-center flex-1">
                    <p className="text-white font-bold text-lg">Arsenal</p>
                    <p className="text-gray-500 text-sm">Home</p>
                  </div>
                  <div className="px-4">
                    <span className="text-gray-600 text-2xl font-light">vs</span>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-white font-bold text-lg">Chelsea</p>
                    <p className="text-gray-500 text-sm">Away</p>
                  </div>
                </div>

                {/* Probabilities */}
                <div className="mt-6">
                  <p className="text-gray-400 text-sm mb-3">AI Probability Estimates</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-accent/10 rounded-lg p-3 text-center border border-accent/20">
                      <p className="text-accent font-bold text-xl">52%</p>
                      <p className="text-gray-400 text-xs">Home Win</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                      <p className="text-gray-300 font-bold text-xl">24%</p>
                      <p className="text-gray-400 text-xs">Draw</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                      <p className="text-gray-300 font-bold text-xl">24%</p>
                      <p className="text-gray-400 text-xs">Away Win</p>
                    </div>
                  </div>
                </div>

                {/* Value & Risk Badges */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success">Value Found</span>
                    <span className="badge badge-warning">Medium Risk</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>+12% momentum</span>
                  </div>
                </div>

                {/* Mock Analysis Preview */}
                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm leading-relaxed">
                    <span className="text-primary font-medium">AI Insight:</span> Arsenal&apos;s strong home form and recent momentum suggest favorable conditions. However, Chelsea&apos;s defensive resilience warrants caution...
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -right-4 top-1/4 bg-bg-card border border-divider rounded-lg px-3 py-2 shadow-lg animate-float hidden lg:block">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-white text-sm font-medium">Live Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
