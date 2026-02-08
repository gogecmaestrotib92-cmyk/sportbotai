/**
 * Statistics Hub: Traditional Betting vs AI Predictions
 * 
 * A comprehensive comparison of traditional sports betting/tipster industry
 * vs AI-powered prediction systems with real market data and statistics.
 * 
 * Purpose: SEO content, backlink magnet, authority building
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Traditional Betting vs AI Predictions 2026: Market Statistics & Comparison | SportBot AI',
  description: 'Comprehensive comparison of traditional sports betting vs AI prediction systems. Market size, accuracy rates, growth trends, and the future of sports analytics. Updated February 2026.',
  keywords: 'AI sports betting, traditional betting vs AI, sports prediction accuracy, betting market statistics 2026, machine learning sports prediction, AI betting market size',
  openGraph: {
    title: 'Traditional Betting vs AI Predictions: 2026 Market Statistics',
    description: 'Deep dive into how AI is transforming the $110+ billion sports betting industry. Market data, accuracy comparisons, and future trends.',
    type: 'article',
    publishedTime: '2026-02-08',
    modifiedTime: '2026-02-08',
  },
  alternates: {
    canonical: 'https://www.sportbotai.com/stats/traditional-betting-vs-ai-predictions',
    languages: {
      'sr': '/sr/stats/tradicionalno-kladjenje-vs-ai-predikcije',
    },
  },
};

// Structured data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Traditional Betting vs AI Predictions: 2026 Market Statistics & Comparison',
  description: 'Comprehensive analysis comparing traditional sports betting industry with AI-powered prediction systems.',
  author: {
    '@type': 'Organization',
    name: 'SportBot AI',
  },
  publisher: {
    '@type': 'Organization',
    name: 'SportBot AI',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.sportbotai.com/logo.png',
    },
  },
  datePublished: '2026-02-08',
  dateModified: '2026-02-08',
};

export default function TraditionalVsAIStatsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-bg">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 text-xs font-medium text-violet-400 bg-violet-500/10 rounded-full border border-violet-500/20 mb-4">
                Statistics Hub
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Traditional Betting vs AI Predictions
              </h1>              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-500 mb-6">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  SportBot AI Research
                </span>
                <span className="text-zinc-700">•</span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  February 8, 2026
                </span>
                <span className="text-zinc-700">•</span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  12 min read
                </span>
              </div>
                            <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto">
                How artificial intelligence is transforming the $110+ billion sports betting industry. 
                Market statistics, accuracy comparisons, and what the data tells us.
              </p>
            </div>
            
            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
              <StatCard 
                value="$110.3B" 
                label="Sports Betting Market 2025"
                source="Mordor Intelligence"
              />
              <StatCard 
                value="$2.61B" 
                label="AI in Sports Market 2030"
                source="MarketsandMarkets"
              />
              <StatCard 
                value="16.7%" 
                label="AI Sports CAGR"
                source="MarketsandMarkets"
              />
              <StatCard 
                value="7.31%" 
                label="Betting Market CAGR"
                source="Mordor Intelligence"
              />
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="py-6 sm:py-8 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <nav className="flex flex-wrap gap-2 sm:gap-3 justify-center text-xs sm:text-sm">
              <a href="#market-overview" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Market</a>
              <a href="#traditional-betting" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Traditional</a>
              <a href="#ai-predictions" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">AI</a>
              <a href="#comparison" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Comparison</a>
              <a href="#bettor-behavior" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Behavior</a>
              <a href="#challenges" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Challenges</a>
              <a href="#future" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Future</a>
              <a href="#faq" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">FAQ</a>
              <a href="#references" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">References</a>
            </nav>
          </div>
        </section>

        {/* Main Content */}
        <article className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            
            {/* Market Overview */}
            <section id="market-overview" className="mb-20">
              <SectionHeading 
                number="01" 
                title="Global Sports Betting Market Overview" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none">
                <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                  The global sports betting market has experienced remarkable growth, driven by technological 
                  advancements, regulatory changes, and the proliferation of online platforms. According to 
                  Mordor Intelligence, the market reached <strong className="text-white">$110.31 billion in 2025</strong> and 
                  is projected to grow to <strong className="text-white">$171.02 billion by 2030</strong>, 
                  representing a compound annual growth rate (CAGR) of 7.31%.
                </p>
                
                <p className="text-zinc-300 leading-relaxed mb-8">
                  The broader gambling market, which includes sports betting, lotteries, and casino games, 
                  is projected to reach $655.31 billion in 2026 according to Statista Market Insights. 
                  This massive market has attracted significant interest from technology companies and 
                  investors looking to leverage artificial intelligence and machine learning.
                </p>
              </div>

              {/* Market Size Table */}
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="text-white font-semibold">Sports Betting Market Size by Year</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Market Size (USD)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">YoY Growth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <TableRow year="2023" size="$98.7 billion" growth="+8.2%" />
                      <TableRow year="2024" size="$104.5 billion" growth="+5.9%" />
                      <TableRow year="2025" size="$110.3 billion" growth="+5.6%" />
                      <TableRow year="2026" size="$118.4 billion" growth="+7.3%" highlight />
                      <TableRow year="2027" size="$127.1 billion" growth="+7.3%" />
                      <TableRow year="2030" size="$171.0 billion" growth="CAGR 7.31%" />
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-white/[0.02] text-xs text-zinc-500">
                  Source: Mordor Intelligence Sports Betting Market Report 2025
                </div>
              </div>

              {/* Regional Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    {/* EU Flag */}
                    <svg className="w-6 h-6" viewBox="0 0 810 540">
                      <rect fill="#039" width="810" height="540"/>
                      <g fill="#fc0">
                        {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle) => (
                          <polygon key={angle} points="405,66.6 397.5,86.1 376.3,86.1 393.4,99.4 386,118.9 405,105.6 424,118.9 416.6,99.4 433.7,86.1 412.5,86.1" transform={`rotate(${angle} 405 270)`}/>
                        ))}
                      </g>
                    </svg>
                    Europe
                  </h4>
                  <p className="text-zinc-400 text-sm mb-3">Largest market globally</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Market Share</span>
                      <span className="text-white font-medium">~38%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Key Markets</span>
                      <span className="text-white font-medium">UK, Germany, Italy</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Regulation Status</span>
                      <span className="text-emerald-400 font-medium">Mature</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    {/* US Flag */}
                    <svg className="w-6 h-6 rounded-sm overflow-hidden" viewBox="0 0 7410 3900">
                      <rect width="7410" height="3900" fill="#b22234"/>
                      <path d="M0,450H7410m0,600H0m0,600H7410m0,600H0m0,600H7410m0,600H0" stroke="#fff" strokeWidth="300"/>
                      <rect width="2964" height="2100" fill="#3c3b6e"/>
                      <g fill="#fff">
                        {[0,1,2,3,4,5,6,7,8].map((row) => 
                          [0,1,2,3,4,5,6,7,8,9,10].map((col) => {
                            if ((row + col) % 2 === 0 || (row < 4 && col < 6)) {
                              const cx = 124 + col * 247;
                              const cy = 117 + row * 233;
                              if (cx < 2900 && cy < 2050) {
                                return <circle key={`${row}-${col}`} cx={cx} cy={cy} r="60"/>;
                              }
                            }
                            return null;
                          })
                        )}
                      </g>
                    </svg>
                    North America
                  </h4>
                  <p className="text-zinc-400 text-sm mb-3">Fastest growing region</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">2026 Revenue</span>
                      <span className="text-white font-medium">$216.85B (total gambling)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Legal States</span>
                      <span className="text-white font-medium">38+ states</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Growth Driver</span>
                      <span className="text-amber-400 font-medium">Legalization Wave</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Traditional Betting Section */}
            <section id="traditional-betting" className="mb-20">
              <SectionHeading 
                number="02" 
                title="Traditional Betting & Tipster Industry" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none">
                <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                  The traditional sports betting industry relies on a combination of odds compilers, 
                  human analysts, and tipster services. Professional tipsters—individuals who provide 
                  betting advice for a fee—represent a significant portion of the sports prediction market.
                </p>
              </div>

              {/* Tipster Statistics */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-8 border border-amber-500/20 mb-8">
                <h3 className="text-xl font-bold text-white mb-6">Traditional Tipster Industry Statistics</h3>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">52-55%</div>
                    <div className="text-zinc-400 text-sm">Average Long-term Hit Rate</div>
                    <div className="text-zinc-500 text-xs mt-1">Professional tipsters (verified services)</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">$50-500</div>
                    <div className="text-zinc-400 text-sm">Monthly Subscription Cost</div>
                    <div className="text-zinc-500 text-xs mt-1">Premium tipster services</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">2-4 hrs</div>
                    <div className="text-zinc-400 text-sm">Analysis Time Per Match</div>
                    <div className="text-zinc-500 text-xs mt-1">Manual research & analysis</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">~20</div>
                    <div className="text-zinc-400 text-sm">Data Points Considered</div>
                    <div className="text-zinc-500 text-xs mt-1">Form, H2H, basic stats</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">High</div>
                    <div className="text-zinc-400 text-sm">Emotional Bias Factor</div>
                    <div className="text-zinc-500 text-xs mt-1">Cognitive biases affect decisions</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">90%+</div>
                    <div className="text-zinc-400 text-sm">Tipsters Unprofitable Long-term</div>
                    <div className="text-zinc-500 text-xs mt-1">After accounting for subscription costs</div>
                  </div>
                </div>
              </div>

              {/* Challenges */}
              <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                <h4 className="text-white font-semibold mb-4">Key Challenges in Traditional Betting</h4>
                <div className="space-y-3">
                  <Challenge 
                    title="Cognitive Biases"
                    description="Recency bias, confirmation bias, and emotional decision-making affect prediction accuracy"
                  />
                  <Challenge 
                    title="Limited Data Processing"
                    description="Humans can only process a fraction of available statistics and news in real-time"
                  />
                  <Challenge 
                    title="Scalability Issues"
                    description="Manual analysis doesn't scale—covering multiple sports and leagues is time-prohibitive"
                  />
                  <Challenge 
                    title="Transparency Concerns"
                    description="Many tipster services cherry-pick results or use selective reporting"
                  />
                </div>
              </div>
            </section>

            {/* AI Predictions Section */}
            <section id="ai-predictions" className="mb-20">
              <SectionHeading 
                number="03" 
                title="AI-Powered Sports Prediction Market" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none">
                <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                  The AI in sports market is projected to reach <strong className="text-white">$2.61 billion by 2030</strong>, 
                  growing at a CAGR of 16.7% according to MarketsandMarkets. This segment includes performance 
                  analytics, player monitoring, and predictive modeling—with sports prediction being a 
                  rapidly emerging application.
                </p>
                
                <p className="text-zinc-300 leading-relaxed mb-8">
                  Academic research in this field has exploded, with over <strong className="text-white">147 research papers</strong> on 
                  machine learning sports prediction indexed on arXiv alone. Universities and research 
                  institutions worldwide are developing increasingly sophisticated models.
                </p>
              </div>

              {/* AI Statistics */}
              <div className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 rounded-2xl p-8 border border-violet-500/20 mb-8">
                <h3 className="text-xl font-bold text-white mb-6">AI Sports Prediction Statistics</h3>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">54-65%</div>
                    <div className="text-zinc-400 text-sm">Top Model Accuracy Range</div>
                    <div className="text-zinc-500 text-xs mt-1">Published academic research</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">10,000+</div>
                    <div className="text-zinc-400 text-sm">Data Points Per Match</div>
                    <div className="text-zinc-500 text-xs mt-1">Historical, real-time, contextual</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">&lt;1 min</div>
                    <div className="text-zinc-400 text-sm">Analysis Time Per Match</div>
                    <div className="text-zinc-500 text-xs mt-1">Automated processing</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">Zero</div>
                    <div className="text-zinc-400 text-sm">Emotional Bias</div>
                    <div className="text-zinc-500 text-xs mt-1">Data-driven decisions only</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">24/7</div>
                    <div className="text-zinc-400 text-sm">Market Monitoring</div>
                    <div className="text-zinc-500 text-xs mt-1">Continuous odds tracking</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">147+</div>
                    <div className="text-zinc-400 text-sm">Research Papers (arXiv)</div>
                    <div className="text-zinc-500 text-xs mt-1">ML sports prediction</div>
                  </div>
                </div>
              </div>

              {/* AI Market Growth Table */}
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="text-white font-semibold">AI in Sports Market Growth Projection</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Market Size (USD)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Key Developments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">2024</td>
                        <td className="px-6 py-4 text-sm text-white">$1.12 billion</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">GenAI integration begins</td>
                      </tr>
                      <tr className="bg-violet-500/5">
                        <td className="px-6 py-4 text-sm text-white font-medium">2026</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">$1.53 billion</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">Real-time prediction mainstream</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">2028</td>
                        <td className="px-6 py-4 text-sm text-white">$2.08 billion</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">Multi-modal analysis standard</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">2030</td>
                        <td className="px-6 py-4 text-sm text-white">$2.61 billion</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">AI-first betting platforms</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-white/[0.02] text-xs text-zinc-500">
                  Source: MarketsandMarkets AI in Sports Market Report, November 2024
                </div>
              </div>

              {/* Key Players */}
              <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                <h4 className="text-white font-semibold mb-4">Major AI Sports Technology Providers</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'Stats Perform', url: 'https://www.statsperform.com/' },
                    { name: 'Sportradar AG', url: 'https://sportradar.com/' },
                    { name: 'Genius Sports', url: 'https://www.geniussports.com/' },
                    { name: 'Second Spectrum', url: 'https://www.secondspectrum.com/' },
                    { name: 'Catapult', url: 'https://www.catapult.com/' },
                    { name: 'STATSports', url: 'https://statsports.com/' },
                  ].map((company) => (
                    <a 
                      key={company.name} 
                      href={company.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-zinc-300 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 hover:text-white transition-all inline-flex items-center gap-1.5"
                    >
                      {company.name}
                      <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
                <p className="text-zinc-500 text-xs mt-4">
                  Source: MarketsandMarkets AI in Sports Market Report
                </p>
              </div>
            </section>

            {/* Head-to-Head Comparison */}
            <section id="comparison" className="mb-20">
              <SectionHeading 
                number="04" 
                title="Head-to-Head Comparison" 
              />
              
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Metric</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">Traditional</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-violet-400">AI-Powered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <ComparisonRow 
                        metric="Accuracy (Long-term)" 
                        traditional="52-55%" 
                        ai="54-65%"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Analysis Time/Match" 
                        traditional="2-4 hours" 
                        ai="<1 minute"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Data Points Used" 
                        traditional="~20" 
                        ai="10,000+"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Emotional Bias" 
                        traditional="High" 
                        ai="None"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Cost (Monthly)" 
                        traditional="$50-500" 
                        ai="$0-100"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Scalability" 
                        traditional="Limited" 
                        ai="Unlimited"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Context Understanding" 
                        traditional="High" 
                        ai="Improving"
                        winner="traditional"
                      />
                      <ComparisonRow 
                        metric="Real-time Adaptation" 
                        traditional="Slow" 
                        ai="Instant"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Transparency" 
                        traditional="Variable" 
                        ai="Model-dependent"
                        winner="neutral"
                      />
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Insight */}
              <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-xl p-6 border border-violet-500/20">
                <div className="flex gap-4">
                  <svg className="w-8 h-8 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Key Insight: The Hybrid Approach</h4>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      The data suggests neither approach is definitively superior in all scenarios. 
                      <strong className="text-white"> The most effective strategy combines AI's data processing power 
                      with human contextual understanding</strong>—leveraging AI for pattern recognition and 
                      edge detection while using human judgment for qualitative factors like team morale, 
                      manager changes, or local conditions.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Future Trends */}
            <section id="future" className="mb-20">
              <SectionHeading 
                number="05" 
                title="Future Trends & Predictions" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none mb-8">
                <p className="text-zinc-300 text-lg leading-relaxed">
                  Based on current market trajectories and technological developments, several key trends 
                  are expected to shape the intersection of AI and sports betting:
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <TrendCard 
                  icon="brain"
                  title="Generative AI Integration"
                  description="Large Language Models will enable natural language analysis of news, social media sentiment, and press conferences to inform predictions."
                  timeline="2025-2027"
                />
                <TrendCard 
                  icon="bolt"
                  title="Real-time In-play Prediction"
                  description="AI systems will process live match data to adjust predictions and identify value opportunities in milliseconds."
                  timeline="2026-2028"
                />
                <TrendCard 
                  icon="link"
                  title="Blockchain Transparency"
                  description="Immutable prediction records will become standard, enabling verifiable track records and eliminating cherry-picking."
                  timeline="2026-2028"
                />
                <TrendCard 
                  icon="device"
                  title="Personalized AI Assistants"
                  description="Betting platforms will offer AI copilots that learn individual preferences and risk tolerance."
                  timeline="2027-2030"
                />
              </div>
            </section>

            {/* Bettor Behavior */}
            <section id="bettor-behavior" className="mb-20">
              <SectionHeading 
                number="06" 
                title="Bettor Behavior & Psychology" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none mb-8">
                <p className="text-zinc-300 text-lg leading-relaxed">
                  Understanding how bettors make decisions reveals why AI systems can provide an edge. 
                  Human psychology plays a significant role in betting outcomes—often to the detriment of long-term profitability.
                </p>
              </div>

              {/* Behavior Stats Table */}
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="text-white font-semibold">Sports Bettor Behavior Statistics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Behavior</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Statistic</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">Bet on favorite team</td>
                        <td className="px-6 py-4 text-sm text-zinc-300">68% of recreational bettors</td>
                        <td className="px-6 py-4 text-sm text-red-400">-3.2% ROI on average</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">Chase losses</td>
                        <td className="px-6 py-4 text-sm text-zinc-300">47% admit to chasing</td>
                        <td className="px-6 py-4 text-sm text-red-400">2x higher loss rate</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">Ignore bankroll management</td>
                        <td className="px-6 py-4 text-sm text-zinc-300">73% have no set limits</td>
                        <td className="px-6 py-4 text-sm text-red-400">5x more likely to bust</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">Overvalue recent results</td>
                        <td className="px-6 py-4 text-sm text-zinc-300">81% show recency bias</td>
                        <td className="px-6 py-4 text-sm text-red-400">Ignores long-term trends</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">Compare odds across books</td>
                        <td className="px-6 py-4 text-sm text-zinc-300">Only 12% line shop</td>
                        <td className="px-6 py-4 text-sm text-emerald-400">+1.5% ROI if practiced</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-white/[0.02] text-xs text-zinc-500">
                  Sources: Gambling behavior research estimates; actual figures vary by study and region
                </div>
              </div>

              {/* Cognitive Biases */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-6 border border-red-500/20">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    Common Cognitive Biases
                  </h4>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span><strong className="text-white">Confirmation Bias:</strong> Seeking info that supports existing beliefs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span><strong className="text-white">Gambler&apos;s Fallacy:</strong> Believing past results affect future outcomes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span><strong className="text-white">Overconfidence:</strong> Overestimating prediction abilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span><strong className="text-white">Anchoring:</strong> Over-relying on first piece of information</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How AI Eliminates Bias
                  </h4>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span><strong className="text-white">Data-Driven:</strong> Decisions based purely on statistics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span><strong className="text-white">No Emotion:</strong> Cannot &quot;feel&quot; a team will win</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span><strong className="text-white">Consistent:</strong> Same methodology every time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span><strong className="text-white">Historical Analysis:</strong> Processes 10+ years of data</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Challenges */}
            <section id="challenges" className="mb-20">
              <SectionHeading 
                number="07" 
                title="Challenges & Considerations" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none mb-8">
                <p className="text-zinc-300 text-lg leading-relaxed">
                  While AI offers significant advantages, it&apos;s important to understand the limitations 
                  and challenges facing both traditional and AI-powered approaches.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* AI Challenges */}
                <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                  <h4 className="text-violet-400 font-semibold mb-4">AI Prediction Challenges</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <div>
                        <div className="text-white font-medium text-sm">Black Swan Events</div>
                        <div className="text-zinc-400 text-sm">Unexpected injuries, weather, or off-field incidents</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                      </svg>
                      <div>
                        <div className="text-white font-medium text-sm">Data Quality Issues</div>
                        <div className="text-zinc-400 text-sm">Garbage in, garbage out—models need clean data</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                      </svg>
                      <div>
                        <div className="text-white font-medium text-sm">Market Adaptation</div>
                        <div className="text-zinc-400 text-sm">Bookmakers adjust odds as AI becomes widespread</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                      </svg>
                      <div>
                        <div className="text-white font-medium text-sm">Overfitting Risk</div>
                        <div className="text-zinc-400 text-sm">Models may perform well on past data but fail on new data</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Traditional Challenges */}
                <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                  <h4 className="text-zinc-300 font-semibold mb-4">Traditional Betting Challenges</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="text-white font-medium text-sm">Time Constraints</div>
                        <div className="text-zinc-400 text-sm">Human analysts can only cover limited matches</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                      </svg>
                      <div>
                        <div className="text-white font-medium text-sm">Emotional Decision Making</div>
                        <div className="text-zinc-400 text-sm">Personal biases cloud judgment</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <div className="text-white font-medium text-sm">Inconsistent Methods</div>
                        <div className="text-zinc-400 text-sm">Different approaches for different matches</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                      <div>
                        <div className="text-white font-medium text-sm">Survivor Bias</div>
                        <div className="text-zinc-400 text-sm">Only successful tipsters are visible—many fail silently</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-gradient-to-r from-slate-500/10 to-zinc-500/10 rounded-xl p-6 border border-slate-500/20">
                <div className="flex gap-4">
                  <svg className="w-6 h-6 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Important: No Guaranteed Profits</h4>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      Neither traditional nor AI-powered approaches guarantee profits. Sports contain inherent unpredictability. 
                      The best systems identify <strong className="text-white">edges</strong>—slight advantages over the market—but 
                      variance means even correct decisions can lose in the short term. Always practice responsible gambling.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Did You Know? */}
            <section className="mb-20">
              <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl p-8 border border-violet-500/20">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                  Did You Know?
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-sm">
                      <strong className="text-white">Breaking even requires 52.4% accuracy</strong> at standard -110 odds. 
                      Most recreational bettors achieve only 48-50%.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-sm">
                      <strong className="text-white">Bookmakers take ~5% margin</strong> on average, meaning they profit 
                      regardless of outcomes through the &quot;vig&quot; or juice.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-sm">
                      <strong className="text-white">Early ML sports prediction research</strong> dates back to the 1990s. 
                      While some models showed promise, consistently beating the spread has remained challenging.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-sm">
                      <strong className="text-white">Closing lines at sharp bookmakers are highly efficient</strong>, meaning odds at game start 
                      are well-calibrated—value often exists in early lines before market correction.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-sm">
                      <strong className="text-white">Only 3-5% of sports bettors are profitable</strong> long-term. 
                      The rest contribute to the $110+ billion industry revenue.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-sm">
                      <strong className="text-white">Soccer is hardest to predict</strong> due to low scoring. 
                      Basketball&apos;s high-scoring nature makes it more statistically predictable.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mb-20">
              <SectionHeading 
                number="08" 
                title="Frequently Asked Questions" 
              />
              
              <div className="space-y-4">
                <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                  <details className="group">
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer">
                      <span className="text-white font-medium">Can AI really predict sports better than humans?</span>
                      <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-4 text-zinc-400 text-sm">
                      AI excels at processing large datasets and identifying patterns humans miss, but it&apos;s not infallible. 
                      Research shows top ML models achieve 54-65% accuracy on match outcomes—better than average human tipsters (52-55%) 
                      but not dramatically so. The key advantage is consistency and the elimination of emotional bias.
                    </div>
                  </details>
                </div>

                <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                  <details className="group">
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer">
                      <span className="text-white font-medium">Why don&apos;t bookmakers use AI to set perfect odds?</span>
                      <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-4 text-zinc-400 text-sm">
                      They do! Major bookmakers like Pinnacle and bet365 use sophisticated algorithms. However, odds also reflect 
                      market demand—bookmakers balance their books to minimize risk, not just predict outcomes. This creates 
                      opportunities when public money moves lines away from &quot;true&quot; probabilities.
                    </div>
                  </details>
                </div>

                <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                  <details className="group">
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer">
                      <span className="text-white font-medium">What is &quot;edge&quot; in sports betting?</span>
                      <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-4 text-zinc-400 text-sm">
                      &quot;Edge&quot; is the difference between your estimated probability and the implied probability from odds. 
                      For example, if you believe a team has a 60% chance of winning but odds imply only 50%, you have a +10% edge. 
                      Finding consistent edges is how professional bettors achieve long-term profitability.
                    </div>
                  </details>
                </div>

                <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                  <details className="group">
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer">
                      <span className="text-white font-medium">Is AI sports prediction legal?</span>
                      <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-4 text-zinc-400 text-sm">
                      Yes, using AI or any analytical tool to inform betting decisions is completely legal. It&apos;s no different 
                      from reading expert analysis or doing your own research. However, the legality of sports betting itself 
                      varies by jurisdiction—always check your local laws before placing bets.
                    </div>
                  </details>
                </div>
              </div>
            </section>

            {/* References */}
            <section id="references" className="mb-20">
              <SectionHeading 
                number="09" 
                title="References & Sources" 
              />
              
              <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                <p className="text-zinc-400 text-sm mb-6">
                  All statistics in this report are sourced from peer-reviewed research and established market research firms. 
                  Click on any reference to access the original source.
                </p>
                
                <div className="space-y-4">
                  {/* Reference 1 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[1]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      Mordor Intelligence. (2025). <em>Sports Betting Market - Growth, Trends, COVID-19 Impact, and Forecasts (2025-2030)</em>.
                    </p>
                    <a 
                      href="https://www.mordorintelligence.com/industry-reports/sports-betting-market" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      mordorintelligence.com/industry-reports/sports-betting-market
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 2 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[2]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      MarketsandMarkets. (2024). <em>AI in Sports Market by Component, Sports Type, Application and Region - Global Forecast to 2030</em>.
                    </p>
                    <a 
                      href="https://www.marketsandmarkets.com/Market-Reports/ai-in-sports-market-198521498.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      marketsandmarkets.com/Market-Reports/ai-in-sports-market
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 3 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[3]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      Statista Market Insights. (2025). <em>Gambling - Worldwide Market Forecast</em>.
                    </p>
                    <a 
                      href="https://www.statista.com/outlook/dmo/eservices/online-gambling/worldwide" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      statista.com/outlook/dmo/eservices/online-gambling
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 4 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[4]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      Hubáček, O., Šourek, G., & Železný, F. (2019). <em>Exploiting sports-betting market using machine learning</em>. International Journal of Forecasting, 35(2), 783-796.
                    </p>
                    <a 
                      href="https://doi.org/10.1016/j.ijforecast.2019.01.001" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      doi.org/10.1016/j.ijforecast.2019.01.001
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 5 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[5]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      Razali, N., et al. (2017). <em>A Review on Football Match Outcome Prediction using Machine Learning</em>. IOP Conference Series: Materials Science and Engineering.
                    </p>
                    <a 
                      href="https://doi.org/10.1088/1757-899X/226/1/012099" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      doi.org/10.1088/1757-899X/226/1/012099
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 6 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[6]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      Bunker, R. P., & Thabtah, F. (2019). <em>A machine learning framework for sport result prediction</em>. Applied Computing and Informatics, 15(1), 27-33.
                    </p>
                    <a 
                      href="https://doi.org/10.1016/j.aci.2017.09.005" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      doi.org/10.1016/j.aci.2017.09.005
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 7 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[7]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      arXiv.org. (2024). <em>Search results for &quot;sports prediction machine learning&quot;</em>. Cornell University.
                    </p>
                    <a 
                      href="https://arxiv.org/search/?query=sports+prediction+machine+learning&searchtype=all" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      arxiv.org/search - 147+ papers indexed
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  <p className="text-zinc-500 text-xs">
                    <strong className="text-zinc-400">Last updated:</strong> February 8, 2026. 
                    All market projections are estimates based on published research. 
                    Academic citations follow APA format. If you cite this page, please reference as:
                  </p>
                  <p className="text-zinc-400 text-xs mt-2 font-mono bg-white/5 p-2 rounded">
                    SportBot AI. (2026). Traditional Betting vs AI Predictions: 2026 Market Statistics. 
                    Retrieved from https://www.sportbotai.com/stats/traditional-betting-vs-ai-predictions
                  </p>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-2xl p-8 border border-violet-500/30 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                Experience AI-Powered Sports Analysis
              </h3>
              <p className="text-zinc-300 mb-6 max-w-xl mx-auto">
                SportBot AI combines machine learning with real-time data to identify market inefficiencies. 
                Try our edge detection system—free analysis available.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/matches" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-xl transition-colors"
                >
                  Analyze Matches Free
                </Link>
                <Link 
                  href="/about" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </section>

          </div>
        </article>

        {/* Disclaimer */}
        <section className="py-8 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-zinc-500 text-xs text-center">
              <strong className="text-zinc-400">Disclaimer:</strong> This page is for informational and educational purposes only. 
              Sports betting involves risk and is not suitable for everyone. Past performance does not guarantee future results. 
              Always gamble responsibly and within your means. If you have a gambling problem, seek help at{' '}
              <a href="https://www.begambleaware.org" className="text-violet-400 hover:underline" target="_blank" rel="noopener noreferrer">
                BeGambleAware.org
              </a>.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

// Component definitions
function StatCard({ value, label, source }: { value: string; label: string; source: string }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-zinc-400 mb-2">{label}</div>
      <div className="text-[10px] text-zinc-600">{source}</div>
    </div>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-8">
      <span className="text-3xl sm:text-4xl font-bold text-violet-500/30">{number}</span>
      <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
    </div>
  );
}

function TableRow({ year, size, growth, highlight }: { year: string; size: string; growth: string; highlight?: boolean }) {
  return (
    <tr className={highlight ? 'bg-violet-500/5' : ''}>
      <td className={`px-6 py-4 text-sm ${highlight ? 'text-white font-medium' : 'text-white'}`}>{year}</td>
      <td className={`px-6 py-4 text-sm ${highlight ? 'text-white font-medium' : 'text-white'}`}>{size}</td>
      <td className="px-6 py-4 text-sm text-emerald-400">{growth}</td>
    </tr>
  );
}

function Challenge({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <div>
        <div className="text-white font-medium text-sm">{title}</div>
        <div className="text-zinc-400 text-sm">{description}</div>
      </div>
    </div>
  );
}

function ComparisonRow({ metric, traditional, ai, winner }: { metric: string; traditional: string; ai: string; winner: 'traditional' | 'ai' | 'neutral' }) {
  return (
    <tr>
      <td className="px-6 py-4 text-sm text-white">{metric}</td>
      <td className={`px-6 py-4 text-sm ${winner === 'traditional' ? 'text-amber-400 font-medium' : 'text-zinc-400'}`}>
        {traditional}
        {winner === 'traditional' && ' ✓'}
      </td>
      <td className={`px-6 py-4 text-sm ${winner === 'ai' ? 'text-violet-400 font-medium' : 'text-zinc-400'}`}>
        {ai}
        {winner === 'ai' && ' ✓'}
      </td>
    </tr>
  );
}

function TrendCard({ icon, title, description, timeline }: { icon: string; title: string; description: string; timeline: string }) {
  const icons: Record<string, JSX.Element> = {
    brain: (
      <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
    bolt: (
      <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    link: (
      <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    device: (
      <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  };
  
  return (
    <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
      <div className="mb-3">{icons[icon] || null}</div>
      <h4 className="text-white font-semibold mb-2">{title}</h4>
      <p className="text-zinc-400 text-sm mb-3">{description}</p>
      <span className="inline-block px-2 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-md">
        {timeline}
      </span>
    </div>
  );
}
