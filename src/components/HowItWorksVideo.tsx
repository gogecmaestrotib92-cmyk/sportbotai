/**
 * How It Works Video Section
 * 
 * Displays the demo video above pricing to show product in action.
 * Uses YouTube lite embed for performance.
 */

'use client';

import { useState } from 'react';

interface HowItWorksVideoProps {
    locale?: 'en' | 'sr';
}

const YOUTUBE_VIDEO_ID = 'dEIjEJDLX70';

const translations = {
    en: {
        title: 'How It Works',
        subtitle: 'See our AI analyze a real match in 90 seconds',
        watchButton: 'Watch Demo',
    },
    sr: {
        title: 'Kako Funkcioniše',
        subtitle: 'Pogledajte AI analizu prave utakmice za 90 sekundi',
        watchButton: 'Pogledaj Demo',
    },
};

export default function HowItWorksVideo({ locale = 'en' }: HowItWorksVideoProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const t = translations[locale];

    // Use local thumbnail for guaranteed display (also uploaded to YouTube)
    const thumbnailUrl = '/SportBot_YouTube_Thumbnail.png';

    return (
        <section className="py-16 sm:py-20 bg-bg-primary">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-10">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                        {t.title}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
                        {t.subtitle}
                    </p>
                </div>

                {/* Video Container */}
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                    {!isLoaded ? (
                        // Thumbnail with play button (lazy load)
                        <button
                            onClick={() => setIsLoaded(true)}
                            className="absolute inset-0 w-full h-full group cursor-pointer"
                            aria-label={t.watchButton}
                        >
                            {/* Thumbnail */}
                            <img
                                src={thumbnailUrl}
                                alt="SportBot AI Demo"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />

                            {/* Dark overlay */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

                            {/* Play button */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/90 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-accent transition-all">
                                    <svg
                                        className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Watch Demo text */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                <span className="text-white/90 text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
                                    {t.watchButton}
                                </span>
                            </div>
                        </button>
                    ) : (
                        // YouTube iframe (loaded on click)
                        <iframe
                            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
                            title="SportBot AI Demo"
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
