/**
 * Testimonials Carousel
 * 
 * Auto-rotating testimonials with smooth animations.
 * Shows social proof from real users.
 */

'use client';

import { useState, useEffect } from 'react';

const testimonials = [
  {
    id: 1,
    name: 'Marcus T.',
    role: 'Content Creator',
    text: 'Cut my match research time from 2 hours to 5 minutes. Game changer for making preview content.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Sarah K.',
    role: 'Sports Analyst',
    text: 'Finally, a platform that gives me insights without the BS. No picks, just data. Perfect.',
    rating: 5,
  },
  {
    id: 3,
    name: 'David R.',
    role: 'Casual Fan',
    text: 'I actually understand matches now before watching. No more blind guessing.',
    rating: 5,
  },
  {
    id: 4,
    name: 'Emma L.',
    role: 'Fantasy Player',
    text: 'Injury reports, form analysis, AI chat - everything I need for fantasy decisions in one place.',
    rating: 5,
  },
  {
    id: 5,
    name: 'James P.',
    role: 'Podcast Host',
    text: 'My secret weapon for podcast prep. Guests think I do hours of research. It takes 60 seconds.',
    rating: 5,
  },
];

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false); // Pause auto-play when user manually selects
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  return (
    <section className="py-16 bg-bg-primary relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-accent text-xs font-semibold uppercase tracking-wider mb-2 block">
            Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            What Our Users Say
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Testimonial Card */}
          <div className="card-glass rounded-2xl p-8 sm:p-12 min-h-[280px] flex flex-col justify-between">
            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5 text-accent"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8 flex-grow">
              "{testimonials[currentIndex].text}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              {/* Avatar placeholder */}
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                {testimonials[currentIndex].name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-white">
                  {testimonials[currentIndex].name}
                </div>
                <div className="text-sm text-gray-400">
                  {testimonials[currentIndex].role}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-12 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all duration-300 group"
            aria-label="Previous testimonial"
          >
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-12 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all duration-300 group"
            aria-label="Next testimonial"
          >
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-1 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`p-3 group`}
              aria-label={`Go to testimonial ${index + 1}`}
            >
              <span className={`block h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-accent'
                  : 'w-2 bg-gray-600 group-hover:bg-gray-500'
              }`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
