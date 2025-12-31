/**
 * Social Proof Components - Internationalized
 * 
 * Shows social proof elements with translations.
 */

'use client';

import { useState, useEffect } from 'react';
import { TranslationsType } from '@/lib/i18n';

// ============================================
// LIVE STATS COUNTER I18N
// Shows rolling count of analyses completed
// ============================================
interface LiveStatsCounterI18nProps {
  className?: string;
  t: TranslationsType;
}

export function LiveStatsCounterI18n({ className = '', t }: LiveStatsCounterI18nProps) {
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
          <span className="text-white font-semibold tabular-nums">–</span> {t.hero.analysesCompleted}
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
        </span> {t.hero.analysesCompleted}
      </span>
    </div>
  );
}

// ============================================
// TRUST BADGES BAR I18N
// Shows credibility indicators
// ============================================
interface TrustBadgesI18nProps {
  variant?: 'horizontal' | 'compact';
  className?: string;
  t: TranslationsType;
}

export function TrustBadgesI18n({ variant = 'horizontal', className = '', t }: TrustBadgesI18nProps) {
  const badges = [
    { icon: '🔒', label: t.trustBadges.ssl },
    { icon: '🛡️', label: t.trustBadges.gdpr },
    { icon: '🔞', label: t.trustBadges.age },
    { icon: '🎰', label: t.trustBadges.responsible },
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
// STATS STRIP I18N
// Horizontal bar with key metrics
// ============================================
interface StatsStripI18nProps {
  className?: string;
  t: TranslationsType;
}

export function StatsStripI18n({ className = '', t }: StatsStripI18nProps) {
  const stats = [
    { value: '7', label: t.stats.sportsCovered },
    { value: '1K+', label: t.stats.analysesRun },
    { value: '< 60s', label: t.stats.perAnalysis },
    { value: '24/7', label: t.stats.liveData },
  ];

  return (
    <div className={`py-6 border-y border-white/10 ${className}`}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TESTIMONIALS SECTION I18N
// Multiple testimonials in a grid
// ============================================
interface TestimonialsSectionI18nProps {
  t: TranslationsType;
}

interface TestimonialCardProps {
  quote: string;
  author: string;
  role?: string;
  rating?: number;
}

function TestimonialCard({ quote, author, role, rating = 5 }: TestimonialCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
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
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
          {author.charAt(0)}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{author}</p>
          {role && <p className="text-white/60 text-xs">{role}</p>}
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSectionI18n({ t }: TestimonialsSectionI18nProps) {
  const testimonials = [
    {
      quote: "Finally an analytics tool that doesn't promise miracles. Clean data, real insights.",
      author: "Marcus K.",
      role: "Sports Analyst",
      rating: 5,
    },
    {
      quote: "The 60-second briefings save me so much time before matches. Worth every penny.",
      author: "Anna M.",
      role: "Pro Member",
      rating: 5,
    },
    {
      quote: "Love that they're transparent about being an analysis tool, not tipsters.",
      author: "David R.",
      role: "Premium User",
      rating: 5,
    },
  ];

  return (
    <section className="bg-bg-primary section-container">
      <div className="text-center mb-12">
        <p className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-3">{t.testimonials.label}</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">{t.testimonials.title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((testimonial, i) => (
          <TestimonialCard key={i} {...testimonial} />
        ))}
      </div>
    </section>
  );
}
