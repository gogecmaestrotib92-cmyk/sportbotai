/**
 * Social Proof Components
 * 
 * Shows social proof elements:
 * - Live analysis counter
 * - Trust badges
 * - Stats bar
 */

'use client';

import { useState, useEffect } from 'react';

// ============================================
// LIVE STATS COUNTER
// Shows rolling count of analyses completed
// ============================================
interface LiveStatsCounterProps {
  className?: string;
}

export function LiveStatsCounter({ className = '' }: LiveStatsCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setMounted(true);
    
    // Fetch real stats from API
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success && data.stats) {
          setCount(data.stats.totalAnalyses);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
    
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Show placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
        </span>
        <span className="text-white/60 text-sm">
          <span className="text-white font-semibold tabular-nums">–</span> analyses completed
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
      </span>
      <span className="text-white/60 text-sm">
        <span className="text-white font-semibold tabular-nums">
          {isLoading ? '–' : (count ?? 0).toLocaleString()}
        </span> analyses completed
      </span>
    </div>
  );
}

// ============================================
// TRUST BADGES BAR
// Shows credibility indicators
// ============================================
interface TrustBadgesProps {
  variant?: 'horizontal' | 'compact';
  className?: string;
}

export function TrustBadges({ variant = 'horizontal', className = '' }: TrustBadgesProps) {
  const badges = [
    { icon: '🔒', label: 'SSL Secured' },
    { icon: '🛡️', label: 'GDPR Compliant' },
    { icon: '🔞', label: '18+ Only' },
    { icon: '🎰', label: 'Responsible Gambling' },
  ];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {badges.slice(0, 2).map((badge, i) => (
          <span key={i} className="text-xs text-white/40 flex items-center gap-1">
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 ${className}`}>
      {badges.map((badge, i) => (
        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-sm">{badge.icon}</span>
          <span className="text-xs text-white/60">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// STATS STRIP
// Horizontal bar with key metrics - BOLD STYLE
// ============================================
interface StatsStripProps {
  className?: string;
}

export function StatsStrip({ className = '' }: StatsStripProps) {
  const stats = [
    { value: '7', label: 'Sports Covered' },
    { value: '1K+', label: 'Analyses Run' },
    { value: '< 60s', label: 'Per Analysis' },
    { value: '24/7', label: 'Live Data' },
  ];

  return (
    <div className={`py-8 border-y border-white/5 bg-bg-primary ${className}`}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1 tracking-tight">{stat.value}</div>
              <div className="text-xs md:text-sm text-white/40 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TESTIMONIAL CARD
// Single testimonial display
// ============================================
interface TestimonialProps {
  quote: string;
  author: string;
  role?: string;
  rating?: number;
}

export function TestimonialCard({ quote, author, role, rating = 5 }: TestimonialProps) {
  return (
    <div className="card-glass p-6 hover:shadow-glow-violet transition-all duration-300">
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      
      {/* Quote */}
      <p className="text-white/80 text-sm leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
      
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet to-accent flex items-center justify-center text-white text-xs font-bold shadow-glow-violet">
          {author.charAt(0)}
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{author}</p>
          {role && <p className="text-white/50 text-xs">{role}</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TESTIMONIALS SECTION
// Multiple testimonials in a grid
// ============================================
export function TestimonialsSection() {
  const testimonials: TestimonialProps[] = [
    {
      quote: "Finally, an AI tool that explains matches instead of just giving tips. The audio briefings are perfect for my commute.",
      author: "Marcus T.",
      role: "Football Fan",
      rating: 5,
    },
    {
      quote: "I use it before every NBA game. The value detection has genuinely changed how I think about odds.",
      author: "Sarah K.",
      role: "NBA Enthusiast",
      rating: 5,
    },
    {
      quote: "Clean UI, fast analysis, no BS. The 60-second format is exactly what I needed.",
      author: "James L.",
      role: "Sports Analyst",
      rating: 5,
    },
  ];

  return (
    <section className="py-16 px-4 bg-bg relative overflow-hidden">
      {/* Ambient glow */}
      <div className="hidden md:block absolute top-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
      
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-10">
          <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Testimonials</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">What Users Are Saying</h2>
          <p className="text-white/40">Join thousands who understand matches better</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// AS SEEN ON BAR (if you have media mentions)
// ============================================
export function AsSeenOn() {
  // Placeholder logos - replace with actual if you have press coverage
  const sources = ['ESPN', 'Sky Sports', 'The Athletic', 'BBC Sport'];

  return (
    <div className="py-8 border-y border-white/10">
      <div className="max-w-4xl mx-auto px-4">
        <p className="text-center text-xs text-white/30 uppercase tracking-wider mb-4">Trusted by fans worldwide</p>
        <div className="flex items-center justify-center gap-8 opacity-40">
          {sources.map((source, i) => (
            <span key={i} className="text-white/60 font-semibold text-sm">{source}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
