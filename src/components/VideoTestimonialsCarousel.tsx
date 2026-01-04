/**
 * Video Testimonials Carousel
 * 
 * UGC-style video testimonials in a sliding carousel.
 * Auto-advances, plays on hover/tap, mobile swipe support.
 * 
 * Videos should be placed in /public/videos/testimonials/
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface VideoTestimonial {
  id: string;
  videoSrc: string;
  posterSrc?: string;
  name: string;
  role: string;
  quote: string;
}

// Placeholder testimonials - replace videoSrc with actual InVideo outputs
const TESTIMONIALS: VideoTestimonial[] = [
  {
    id: 'nba-fan',
    videoSrc: '/videos/testimonials/nba-fan.mp4',
    posterSrc: '/videos/testimonials/nba-fan-poster.jpg',
    name: 'Marcus T.',
    role: 'NBA Fan',
    quote: 'The value detection has genuinely changed how I think about odds.',
  },
  {
    id: 'epl-fan',
    videoSrc: '/videos/testimonials/epl-fan.mp4',
    posterSrc: '/videos/testimonials/epl-fan-poster.jpg',
    name: 'James W.',
    role: 'Premier League Fan',
    quote: "It's like having a sports analyst in your pocket.",
  },
  {
    id: 'creator',
    videoSrc: '/videos/testimonials/creator.mp4',
    posterSrc: '/videos/testimonials/creator-poster.jpg',
    name: 'Sophie K.',
    role: 'Sports Content Creator',
    quote: 'My prep time went from 2 hours to 20 minutes.',
  },
  {
    id: 'multi-sport',
    videoSrc: '/videos/testimonials/multi-sport.mp4',
    posterSrc: '/videos/testimonials/multi-sport-poster.jpg',
    name: 'Alex M.',
    role: 'Multi-Sport Fan',
    quote: 'NBA, Premier League, Serie A — it covers all of them.',
  },
  {
    id: 'smart-bettor',
    videoSrc: '/videos/testimonials/smart-bettor.mp4',
    posterSrc: '/videos/testimonials/smart-bettor-poster.jpg',
    name: 'David L.',
    role: 'Sports Enthusiast',
    quote: "It doesn't give you picks, it gives you understanding.",
  },
];

function VideoCard({ 
  testimonial, 
  isActive,
  onVideoEnd,
}: { 
  testimonial: VideoTestimonial;
  isActive: boolean;
  onVideoEnd: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Play/pause based on active state
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setHasError(true));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleVideoEnd = () => {
    setIsPlaying(false);
    onVideoEnd();
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => setHasError(true));
      setIsPlaying(true);
    }
  };

  return (
    <div 
      className={`
        relative flex-shrink-0 w-[280px] sm:w-[320px] aspect-[9/16] rounded-2xl overflow-hidden
        bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10
        transition-all duration-300 cursor-pointer
        ${isActive ? 'ring-2 ring-accent shadow-lg shadow-accent/20 scale-[1.02]' : 'opacity-70 hover:opacity-90'}
      `}
      onClick={togglePlay}
    >
      {/* Video */}
      {!hasError ? (
        <video
          ref={videoRef}
          src={testimonial.videoSrc}
          poster={testimonial.posterSrc}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          onEnded={handleVideoEnd}
          onError={() => setHasError(true)}
        />
      ) : (
        /* Fallback gradient if video fails */
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <div className="text-6xl">🎬</div>
        </div>
      )}
      
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      {/* Play/Pause indicator */}
      <div className={`
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm
        flex items-center justify-center
        transition-opacity duration-200
        ${isPlaying ? 'opacity-0' : 'opacity-100'}
      `}>
        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      </div>
      
      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Quote */}
        <p className="text-white text-sm font-medium mb-3 line-clamp-2">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        
        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-sm">
            {testimonial.name.charAt(0)}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{testimonial.name}</p>
            <p className="text-white/60 text-xs">{testimonial.role}</p>
          </div>
        </div>
      </div>
      
      {/* Active indicator dot */}
      {isActive && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
          </span>
        </div>
      )}
    </div>
  );
}

export default function VideoTestimonialsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % TESTIMONIALS.length);
  }, []);

  const goToPrev = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  // Auto-advance every 8 seconds (unless paused)
  useEffect(() => {
    if (isPaused) return;
    
    autoAdvanceRef.current = setInterval(goToNext, 8000);
    
    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    };
  }, [isPaused, goToNext]);

  // Scroll to active card
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const cards = container.querySelectorAll('[data-card]');
    const activeCard = cards[activeIndex] as HTMLElement;
    
    if (activeCard) {
      const containerWidth = container.offsetWidth;
      const cardLeft = activeCard.offsetLeft;
      const cardWidth = activeCard.offsetWidth;
      const scrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [activeIndex]);

  // Touch/swipe support
  const touchStartX = useRef(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    
    // Resume auto-advance after 5 seconds
    setTimeout(() => setIsPaused(false), 5000);
  };

  return (
    <section className="py-12 sm:py-16 overflow-hidden bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            What Fans Are Saying
          </h2>
          <p className="text-white/50 text-sm sm:text-base">
            Real users, real experiences
          </p>
          <p className="text-white/30 text-xs mt-2">
            AI-generated dramatizations for illustration
          </p>
        </div>

        {/* Carousel */}
        <div 
          ref={containerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left spacer for centering */}
          <div className="flex-shrink-0 w-[calc(50vw-160px)] sm:w-[calc(50vw-180px)]" />
          
          {TESTIMONIALS.map((testimonial, index) => (
            <div 
              key={testimonial.id} 
              data-card
              className="snap-center"
              onClick={() => setActiveIndex(index)}
            >
              <VideoCard
                testimonial={testimonial}
                isActive={index === activeIndex}
                onVideoEnd={goToNext}
              />
            </div>
          ))}
          
          {/* Right spacer for centering */}
          <div className="flex-shrink-0 w-[calc(50vw-160px)] sm:w-[calc(50vw-180px)]" />
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-1 mt-6">
          {TESTIMONIALS.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className="p-3 group"
              aria-label={`Go to testimonial ${index + 1}`}
            >
              <span className={`
                block h-2 rounded-full transition-all duration-300
                ${index === activeIndex 
                  ? 'w-6 bg-accent' 
                  : 'w-2 bg-white/30 group-hover:bg-white/50'}
              `} />
            </button>
          ))}
        </div>

        {/* Navigation arrows (desktop) */}
        <div className="hidden sm:flex justify-center gap-4 mt-6">
          <button
            onClick={goToPrev}
            className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            aria-label="Previous testimonial"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            aria-label="Next testimonial"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
