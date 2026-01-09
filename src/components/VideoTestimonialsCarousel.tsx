/**
 * Moments Carousel - Marketing Situations
 * 
 * Horizontal scrolling carousel showing relatable betting moments.
 * Purple gradient cards with situations + ambient video clips (always playing).
 * Mobile-optimized with snap scrolling and touch gestures.
 * 
 * Supports i18n: pass locale="sr" for Serbian
 */

'use client';

import { useState, useRef, useEffect } from 'react';

// Situation card (gradient with scenario text)
interface SituationCard {
  type: 'situation';
  id: string;
  icon: string;
  headline: { en: string; sr: string };
  subtext: { en: string; sr: string };
}

// Video clip (ambient, always playing)
interface VideoClip {
  type: 'video';
  id: string;
  videoSrc: string;
}

type CarouselItem = SituationCard | VideoClip;

// Alternating situations and video vibes
const CAROUSEL_ITEMS: CarouselItem[] = [
  {
    type: 'situation',
    id: 'situation-1',
    icon: 'bolt',
    headline: { 
      en: 'When the 8% edge alert drops',
      sr: 'Kada stigne alert za 8% prednosti'
    },
    subtext: { 
      en: 'Market mispricing. You move first.',
      sr: 'Tržište greši. Ti reaguješ prvi.'
    },
  },
  {
    type: 'video',
    id: 'video-1',
    videoSrc: '/videos/the pub moment.mp4',
  },
  {
    type: 'situation',
    id: 'situation-2',
    icon: 'target',
    headline: { 
      en: 'When your +180 underdog covers',
      sr: 'Kada tvoj autsajder na +180 prođe'
    },
    subtext: { 
      en: 'Data over hype. Every time.',
      sr: 'Podaci pre svega. Uvek.'
    },
  },
  {
    type: 'video',
    id: 'video-2',
    videoSrc: '/videos/the morning check.mp4',
  },
  {
    type: 'situation',
    id: 'situation-3',
    icon: 'chart',
    headline: { 
      en: '+12% ROI this month',
      sr: '+12% ROI ovog meseca'
    },
    subtext: { 
      en: 'Quiet confidence. No sweating.',
      sr: 'Tiho samopouzdanje. Bez stresa.'
    },
  },
  {
    type: 'video',
    id: 'video-3',
    videoSrc: '/videos/the calm collect.mp4',
  },
  {
    type: 'situation',
    id: 'situation-4',
    icon: 'trending',
    headline: { 
      en: 'When the line moves your way',
      sr: 'Kada se linija pomeri u tvoju korist'
    },
    subtext: { 
      en: 'You saw the edge. The market caught up.',
      sr: 'Video si prednost. Tržište je stiglo.'
    },
  },
  {
    type: 'video',
    id: 'video-4',
    videoSrc: '/videos/the alert hit.mp4',
  },
  {
    type: 'situation',
    id: 'situation-5',
    icon: 'diamond',
    headline: { 
      en: 'Finding value others miss',
      sr: 'Pronalazak vrednosti koju drugi propuštaju'
    },
    subtext: { 
      en: 'Not tips. Edge.',
      sr: 'Ne tipovi. Prednost.'
    },
  },
  {
    type: 'video',
    id: 'video-5',
    videoSrc: '/videos/the silent nod.mp4',
  },
];

// Section text translations
const SECTION_TEXT = {
  en: {
    title: 'Moments That Matter',
    subtitle: 'Find where the market is wrong',
    swipeHint: 'Swipe to explore',
  },
  sr: {
    title: 'Momenti Koji Znače',
    subtitle: 'Pronađi gde tržište greši',
    swipeHint: 'Prevuci za više',
  },
};

// Premium SVG icons
const ICONS: Record<string, JSX.Element> = {
  trending: (
    <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  target: (
    <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  chart: (
    <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  bolt: (
    <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  diamond: (
    <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 6-8 14-8-14 8-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16" />
    </svg>
  ),
};

// Situation card (purple gradient like PrizePicks)
function SituationCardComponent({ item, locale }: { item: SituationCard; locale: 'en' | 'sr' }) {
  return (
    <div className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[220px] aspect-[9/14] rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800 p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-purple-900/30">
      {/* Icon with glow */}
      <div className="text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
        {ICONS[item.icon]}
      </div>
      
      {/* Text */}
      <div className="flex-grow flex flex-col justify-center py-2">
        <h3 className="text-white text-base sm:text-xl lg:text-2xl font-bold leading-tight mb-1 sm:mb-2">
          {item.headline[locale]}
        </h3>
        <p className="text-white/70 text-xs sm:text-sm leading-snug">
          {item.subtext[locale]}
        </p>
      </div>
      
      {/* Brand tag */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-white/50 text-[10px] sm:text-xs">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent"></span>
        <span>SportBot AI</span>
      </div>
    </div>
  );
}

// Video card (ambient, always playing, no controls)
function VideoCardComponent({ item }: { item: VideoClip }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start playing when component mounts or becomes visible
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Try to play immediately
    video.play().catch(() => {});

    // Use IntersectionObserver to play when visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[220px] aspect-[9/14] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 shadow-lg shadow-black/30">
      <video
        ref={videoRef}
        src={item.videoSrc}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        autoPlay
        preload="auto"
      />
    </div>
  );
}

export default function VideoTestimonialsCarousel({ locale = 'en' }: { locale?: 'en' | 'sr' }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const t = SECTION_TEXT[locale];

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = window.innerWidth < 640 ? 176 : 220;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-10 sm:py-12 lg:py-16 bg-bg-primary overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 px-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1.5 sm:mb-2">
            {t.title}
          </h2>
          <p className="text-white/50 text-xs sm:text-sm">
            {t.subtitle}
          </p>
        </div>

        {/* Scrollable container */}
        <div className="relative">
          {/* Left fade - subtle on mobile */}
          <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-12 lg:w-16 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          
          {/* Right fade - subtle on mobile */}
          <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-12 lg:w-16 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

          {/* Cards - snap scroll on mobile */}
          <div 
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2 snap-x snap-mandatory"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {CAROUSEL_ITEMS.map((item) => (
              <div key={item.id} className="snap-start">
                {item.type === 'situation' 
                  ? <SituationCardComponent item={item} locale={locale} />
                  : <VideoCardComponent item={item} />
                }
              </div>
            ))}
            {/* End spacer for last card visibility */}
            <div className="flex-shrink-0 w-1 sm:w-4" />
          </div>
        </div>

        {/* Navigation arrows - hidden on mobile (swipe instead) */}
        <div className="hidden sm:flex justify-center gap-3 mt-6">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2.5 sm:p-3 rounded-full border transition-all ${
              canScrollLeft 
                ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white active:scale-95' 
                : 'border-white/10 text-white/30 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2.5 sm:p-3 rounded-full border transition-all ${
              canScrollRight 
                ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white active:scale-95' 
                : 'border-white/10 text-white/30 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Mobile swipe hint */}
        <div className="flex sm:hidden justify-center mt-4">
          <div className="flex items-center gap-1.5 text-white/30 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span>{t.swipeHint}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
