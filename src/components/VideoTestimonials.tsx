/**
 * Video Testimonials Carousel
 * 
 * UGC-style video testimonials that auto-slide.
 * Videos play on hover/tap, muted by default.
 * 
 * Place videos in: public/videos/testimonials/
 * Format: testimonial-1.mp4, testimonial-2.mp4, etc.
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Testimonial {
  id: number;
  videoSrc: string;
  posterSrc?: string;
  name: string;
  role: string;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    videoSrc: '/videos/testimonials/testimonial-1.mp4',
    posterSrc: '/videos/testimonials/poster-1.jpg',
    name: 'Mike R.',
    role: 'NBA Fan',
    quote: 'The value detection is what got me hooked',
  },
  {
    id: 2,
    videoSrc: '/videos/testimonials/testimonial-2.mp4',
    posterSrc: '/videos/testimonials/poster-2.jpg',
    name: 'Emma T.',
    role: 'EPL Fan',
    quote: 'Like having a sports analyst in your pocket',
  },
  {
    id: 3,
    videoSrc: '/videos/testimonials/testimonial-3.mp4',
    posterSrc: '/videos/testimonials/poster-3.jpg',
    name: 'Sarah K.',
    role: 'Content Creator',
    quote: 'My prep time went from 2 hours to 20 minutes',
  },
  {
    id: 4,
    videoSrc: '/videos/testimonials/testimonial-4.mp4',
    posterSrc: '/videos/testimonials/poster-4.jpg',
    name: 'Daniel M.',
    role: 'Multi-Sport Fan',
    quote: 'Works for soccer fans, basketball fans, everyone',
  },
  {
    id: 5,
    videoSrc: '/videos/testimonials/testimonial-5.mp4',
    posterSrc: '/videos/testimonials/poster-5.jpg',
    name: 'Alex P.',
    role: 'Smart Bettor',
    quote: 'It gives you understanding, not just picks',
  },
];

function VideoCard({ 
  testimonial, 
  isActive,
  onVideoEnd 
}: { 
  testimonial: Testimonial; 
  isActive: boolean;
  onVideoEnd: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Play/pause based on active state
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div 
      className={`relative flex-shrink-0 w-[280px] sm:w-[300px] aspect-[9/16] rounded-2xl overflow-hidden bg-bg-secondary transition-all duration-500 ${
        isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
      }`}
      onClick={handleVideoClick}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={testimonial.videoSrc}
        poster={testimonial.posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted={isMuted}
        loop={false}
        onEnded={onVideoEnd}
        preload="metadata"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Play indicator (when paused) */}
      {!isPlaying && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Mute/Unmute button */}
      {isActive && (
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      )}

      {/* User info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white/90 text-sm mb-3 line-clamp-2">&ldquo;{testimonial.quote}&rdquo;</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
            {testimonial.name.charAt(0)}
          </div>
          <div>
            <p className="text-white font-medium text-sm">{testimonial.name}</p>
            <p className="text-white/60 text-xs">{testimonial.role}</p>
          </div>
        </div>
      </div>

      {/* AI disclosure badge */}
      <div className="absolute top-4 left-4 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-[10px] text-white/60">
        Illustrative
      </div>
    </div>
  );
}

export default function VideoTestimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  // Auto-advance when video ends
  const handleVideoEnd = useCallback(() => {
    if (!isPaused) {
      goToNext();
    }
  }, [isPaused, goToNext]);

  // Auto-scroll timer (fallback if video doesn't end properly)
  useEffect(() => {
    if (isPaused) return;
    
    autoPlayRef.current = setInterval(() => {
      goToNext();
    }, 25000); // 25 seconds fallback

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isPaused, goToNext]);

  // Scroll active card into view
  useEffect(() => {
    if (containerRef.current) {
      const activeCard = containerRef.current.children[activeIndex] as HTMLElement;
      if (activeCard) {
        const containerWidth = containerRef.current.offsetWidth;
        const cardWidth = activeCard.offsetWidth;
        const scrollLeft = activeCard.offsetLeft - (containerWidth / 2) + (cardWidth / 2);
        
        containerRef.current.scrollTo({
          left: scrollLeft,
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    setTouchStart(null);
    setTimeout(() => setIsPaused(false), 3000);
  };

  return (
    <section className="py-12 sm:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            What Users Are Saying
          </h2>
          <p className="text-white/50">Join fans who understand matches better</p>
        </div>

        {/* Carousel */}
        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Cards container */}
          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-8 py-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Spacer for centering */}
            <div className="flex-shrink-0 w-[calc(50vw-170px)] sm:w-[calc(50vw-180px)]" />
            
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="snap-center cursor-pointer"
                onClick={() => setActiveIndex(index)}
              >
                <VideoCard
                  testimonial={testimonial}
                  isActive={index === activeIndex}
                  onVideoEnd={handleVideoEnd}
                />
              </div>
            ))}
            
            {/* Spacer for centering */}
            <div className="flex-shrink-0 w-[calc(50vw-170px)] sm:w-[calc(50vw-180px)]" />
          </div>

          {/* Navigation arrows (desktop) */}
          <button
            onClick={goToPrev}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center hover:bg-white/20 transition-colors z-10"
            aria-label="Previous testimonial"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToNext}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center hover:bg-white/20 transition-colors z-10"
            aria-label="Next testimonial"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className="p-3 group"
              aria-label={`Go to testimonial ${index + 1}`}
            >
              <span className={`block h-2 rounded-full transition-all ${
                index === activeIndex 
                  ? 'w-6 bg-accent' 
                  : 'w-2 bg-white/30 group-hover:bg-white/50'
              }`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
