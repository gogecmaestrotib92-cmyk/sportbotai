/**
 * Hero section for landing page - Internationalized
 * 
 * Modern sports analytics themed hero with SportBot Agent showcase.
 * Features premium video background on desktop.
 */

'use client';

import Link from 'next/link';
import { LiveStatsCounterI18n } from './SocialProofI18n';
import LiveIntelCardI18n from './LiveIntelCardI18n';
import VideoBackground from './VideoBackground';
import { TranslationsType, Locale } from '@/lib/i18n';

interface HeroI18nProps {
  t: TranslationsType;
  locale: Locale;
}

export default function HeroI18n({ t, locale }: HeroI18nProps) {
  const matchesHref = locale === 'sr' ? '/sr/matches' : '/matches';
  const aiDeskHref = locale === 'sr' ? '/sr/ai-desk' : '/ai-desk';

  return (
    <section className="relative bg-bg-primary overflow-hidden">
      {/* Video Background (desktop) / Static Image (mobile) */}
      <VideoBackground
        videoSrc="/videos/hero-bg.mp4"
        overlayOpacity={0.45}
        disableOnMobile={true}
      />

      {/* Extra dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 pointer-events-none" />

      {/* Additional decorative elements - HIDDEN ON MOBILE (blur is expensive) */}
      <div className="hidden md:block absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[60px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Side - Content */}
          <div className="text-center lg:text-left">
            {/* Live Stats Badge */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 sm:mb-6 justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs sm:text-sm font-medium text-gray-300 backdrop-blur-sm border border-white/10">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                {t.hero.badge}
              </div>
              <LiveStatsCounterI18n className="hidden sm:flex" t={t} />
            </div>

            {/* Headline - H1 for SEO */}
            <h1 className="text-3xl xs:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4 sm:mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {t.hero.title}
              <br className="hidden xs:block" />
              <span className="text-accent drop-shadow-[0_0_20px_rgba(42,246,160,0.5)]">{t.hero.titleHighlight}</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-white leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 bg-black/60 backdrop-blur-md rounded-xl px-5 py-4 shadow-xl border border-white/10">
              {t.hero.subtitle}
              <strong className="text-accent">{t.hero.subtitleHighlight}</strong>
            </p>

            {/* CTA Buttons - Stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link
                href={matchesHref}
                className="btn-primary text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto glow-accent-strong"
              >
                {t.hero.ctaPrimary}
              </Link>
              <Link
                href={aiDeskHref}
                className="btn-secondary inline-flex items-center justify-center gap-2 text-center text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto"
              >
                <span>🧠</span>
                {t.hero.ctaSecondary}
              </Link>
            </div>

            {/* Trust Indicators - Horizontal scroll on mobile */}
            <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/20">
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-5 text-xs sm:text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📰</span>
                  <span>{t.hero.trust.headlines}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <span>{t.hero.trust.form}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span>{t.hero.trust.ai}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📤</span>
                  <span>{t.hero.trust.share}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Live Intel Card */}
          <div className="relative lg:pl-8">
            <LiveIntelCardI18n locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
