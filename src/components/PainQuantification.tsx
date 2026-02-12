/**
 * Pain Quantification Section
 * 
 * Premium "Before vs After" comparison showing time saved.
 * Direct response technique: quantify the pain to make the solution obvious.
 * Uses glassmorphism cards, animated bars, and ambient glow effects.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PremiumIcon from '@/components/ui/PremiumIcon';

interface PainQuantificationProps {
  locale?: 'en' | 'sr';
}

const translations = {
  en: {
    badge: 'Time Saved',
    headline: 'Stop Wasting Hours on',
    headlineAccent: 'Match Research',
    subtitle: 'The average bettor spends 2+ hours researching a single match. Our AI does it in 60 seconds — with better data.',
    without: 'The Old Way',
    with: 'With SportBot AI',
    steps: [
      { time: '45 min', label: 'Checking injury reports across sources', pct: 41, icon: 'medical' as const },
      { time: '30 min', label: 'Researching head-to-head stats', pct: 27, icon: 'chart' as const },
      { time: '20 min', label: 'Reading expert opinions & previews', pct: 18, icon: 'clipboard' as const },
      { time: '15 min', label: 'Comparing odds across bookmakers', pct: 14, icon: 'scale' as const },
    ],
    totalTime: '2+ hours',
    totalLabel: 'per match',
    stillUncertain: '...and you\'re still guessing',
    fastTime: '60',
    fastUnit: 'seconds',
    fastLabel: 'AI does the work. You make the call.',
    features: [
      { label: 'Injuries, form & H2H analyzed', icon: 'check' as const },
      { label: 'Odds from 50+ bookmakers compared', icon: 'check' as const },
      { label: 'Edge detection with exact percentages', icon: 'check' as const },
      { label: 'Risk level & trap match warnings', icon: 'check' as const },
    ],
    cta: 'Try It Free — 60 Second Analysis',
    ctaSubtext: 'No credit card required',
  },
  sr: {
    badge: 'Ušteda Vremena',
    headline: 'Prestani da Trošiš Sate na',
    headlineAccent: 'Istraživanje Mečeva',
    subtitle: 'Prosečan kladilac troši 2+ sata na istraživanje jednog meča. Naš AI to radi za 60 sekundi — sa boljim podacima.',
    without: 'Stari Način',
    with: 'Sa SportBot AI',
    steps: [
      { time: '45 min', label: 'Provera izveštaja o povredama', pct: 41, icon: 'medical' as const },
      { time: '30 min', label: 'Istraživanje međusobnih statistika', pct: 27, icon: 'chart' as const },
      { time: '20 min', label: 'Čitanje mišljenja eksperata', pct: 18, icon: 'clipboard' as const },
      { time: '15 min', label: 'Upoređivanje kvota kod kladionica', pct: 14, icon: 'scale' as const },
    ],
    totalTime: '2+ sata',
    totalLabel: 'po meču',
    stillUncertain: '...i dalje nisi siguran/na',
    fastTime: '60',
    fastUnit: 'sekundi',
    fastLabel: 'AI radi posao. Ti donosiš odluku.',
    features: [
      { label: 'Povrede, forma i H2H analizirani', icon: 'check' as const },
      { label: 'Kvote sa 50+ kladionica upoređene', icon: 'check' as const },
      { label: 'Detekcija prednosti sa tačnim procentima', icon: 'check' as const },
      { label: 'Nivo rizika i upozorenja za zamke', icon: 'check' as const },
    ],
    cta: 'Probaj Besplatno — Analiza za 60 Sekundi',
    ctaSubtext: 'Nije potrebna kartica',
  },
};

export default function PainQuantification({ locale = 'en' }: PainQuantificationProps) {
  const t = translations[locale];
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Animated count-up for the "60 seconds" hero number
  const [countValue, setCountValue] = useState(0);
  const [countComplete, setCountComplete] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 1800;
    const startDelay = 600;
    const target = 60;
    let startTime: number | null = null;
    let raf: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp + startDelay;
      if (timestamp < startTime) { raf = requestAnimationFrame(animate); return; }
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCountValue(Math.round(eased * target));
      if (progress < 1) { raf = requestAnimationFrame(animate); }
      else { setCountComplete(true); }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isVisible]);

  return (
    <>
    {/* Scoped CSS keyframe animations for premium scroll effects */}
    <style>{`
      @keyframes pain-scan-line {
        0% { top: -2px; opacity: 0; }
        5% { opacity: 1; }
        95% { opacity: 0.8; }
        100% { top: calc(100% + 2px); opacity: 0; }
      }
      @keyframes pain-pulse-ring {
        0% { transform: scale(0.8); opacity: 0.5; }
        100% { transform: scale(2.8); opacity: 0; }
      }
      @keyframes pain-arrow-glow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(42,246,160,0.3); }
        50% { box-shadow: 0 0 24px 6px rgba(42,246,160,0.12); }
      }
      @keyframes pain-glow-breathe {
        0%, 100% { opacity: 0.08; transform: scale(1); }
        50% { opacity: 0.25; transform: scale(1.15); }
      }
      @keyframes pain-red-scan {
        0% { top: -2px; opacity: 0; }
        5% { opacity: 1; }
        95% { opacity: 0.6; }
        100% { top: calc(100% + 2px); opacity: 0; }
      }
      @keyframes pain-shake {
        0%, 100% { transform: translateX(0); }
        10% { transform: translateX(-4px) rotate(-0.5deg); }
        20% { transform: translateX(4px) rotate(0.5deg); }
        30% { transform: translateX(-3px); }
        40% { transform: translateX(3px); }
        50% { transform: translateX(-2px); }
        60% { transform: translateX(2px); }
        70% { transform: translateX(-1px); }
        80% { transform: translateX(0); }
      }
      @keyframes pain-x-pop {
        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
        60% { transform: scale(1.3) rotate(10deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes pain-clock-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
        50% { box-shadow: 0 0 12px 4px rgba(239,68,68,0.15); }
      }
      @keyframes pain-strikethrough {
        0% { width: 0; }
        100% { width: 100%; }
      }
      @keyframes pain-text-reveal {
        from { clip-path: inset(0 100% 0 0); }
        to { clip-path: inset(0 0% 0 0); }
      }
      @keyframes pain-time-pop {
        0% { opacity: 0; transform: scale(0); }
        60% { opacity: 1; transform: scale(1.25); }
        100% { opacity: 1; transform: scale(1); }
      }
      .pain-scan { animation: pain-scan-line 2s ease-in-out 1s forwards; }
      .pain-red-scan { animation: pain-red-scan 1.8s ease-in-out 0.3s forwards; }
      .pain-ring-1 { animation: pain-pulse-ring 1.2s ease-out forwards; }
      .pain-ring-2 { animation: pain-pulse-ring 1.2s ease-out 0.3s forwards; }
      .pain-arrow { animation: pain-arrow-glow 2.5s ease-in-out infinite; }
      .pain-breathe { animation: pain-glow-breathe 3s ease-in-out infinite; }
      .pain-shake { animation: pain-shake 0.6s ease-in-out; }
      .pain-x-pop { animation: pain-x-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; opacity: 0; }
      .pain-clock-pulse { animation: pain-clock-pulse 2s ease-in-out infinite; }
    `}</style>
    <section
      ref={sectionRef}
      className="py-10 sm:py-16 lg:py-24 bg-bg-primary relative overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-red-500/[0.04] rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-accent/[0.04] rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-12 lg:mb-16">
          <p className="text-accent font-semibold text-xs sm:text-sm uppercase tracking-wider mb-2 sm:mb-3 flex items-center justify-center gap-1.5 sm:gap-2">
            <PremiumIcon name="clock" size="xs" className="text-accent sm:hidden" />
            <PremiumIcon name="clock" size="sm" className="text-accent hidden sm:block" />
            {t.badge}
          </p>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 sm:mb-4 tracking-tight">
            {t.headline}{' '}
            <span className="text-gradient-accent">{t.headlineAccent}</span>
          </h2>
          <p className="hidden sm:block text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* === MOBILE LAYOUT (compact side-by-side) === */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          {/* Left: Pain card */}
          <div
            className={`
              relative card-glass rounded-xl p-4 border-red-500/10 overflow-hidden
              transition-all duration-500 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
            `}
            style={{ transitionDelay: '100ms' }}
          >
            {/* AI-generated background */}
            <Image
              src="/images/pain-card-bg.webp"
              alt=""
              fill
              className="object-cover opacity-20 pointer-events-none"
              aria-hidden="true"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80 pointer-events-none" aria-hidden="true" />
            <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-red-500/20 via-transparent to-transparent pointer-events-none" aria-hidden="true" />

            {/* Red scan line — mobile */}
            {isVisible && (
              <div
                className="absolute left-0 right-0 h-[1px] z-20 pointer-events-none pain-red-scan"
                style={{ top: 0 }}
                aria-hidden="true"
              >
                <div className="w-full h-full bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
                <div className="w-full h-[4px] -mt-[1px] bg-gradient-to-r from-transparent via-red-500/15 to-transparent blur-sm" />
              </div>
            )}

            <div className="relative">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center ${isVisible ? 'pain-clock-pulse' : ''}`}>
                  <PremiumIcon name="clock" size="sm" className="text-red-400" />
                </div>
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wide">{t.without}</h3>
              </div>

              {/* Animated step timeline — mobile */}
              <div className="relative space-y-2.5 mb-3 pl-5">
                {/* Connecting line */}
                <div className="absolute left-[5px] top-1 bottom-1 w-[2px] bg-red-500/10 overflow-hidden rounded-full">
                  <div
                    className="w-full bg-gradient-to-b from-red-500/40 to-red-500/15 transition-all duration-[2000ms] ease-out"
                    style={{ height: isVisible ? '100%' : '0%', transitionDelay: '300ms' }}
                  />
                </div>

                {t.steps.map((step, i) => (
                  <div
                    key={i}
                    className={`relative transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                    style={{ transitionDelay: `${300 + i * 400}ms` }}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-5 top-[3px] w-[12px] h-[12px] rounded-full border-2 border-red-500/30 transition-all duration-300 ${isVisible ? 'bg-red-500/40 scale-100' : 'bg-transparent scale-0'}`}
                      style={{ transitionDelay: `${400 + i * 400}ms` }}
                    />

                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span className="text-[11px] text-gray-400 flex-1 leading-tight">{step.label}</span>
                      <span
                        className="text-[11px] font-mono font-bold text-red-400/80 flex-shrink-0 relative"
                        style={isVisible ? { animation: `pain-time-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) ${0.65 + i * 0.4}s both` } : { opacity: 0 }}
                      >
                        {step.time}
                        {isVisible && (
                          <span
                            className="absolute left-0 top-1/2 h-[1px] bg-red-400/50 pointer-events-none"
                            style={{ animation: `pain-strikethrough 0.4s ease-out ${0.95 + i * 0.4}s forwards`, width: 0 }}
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500/50 to-red-400/30 transition-all duration-700 ease-out relative"
                        style={{
                          width: isVisible ? `${step.pct}%` : '0%',
                          transitionDelay: `${550 + i * 400}ms`,
                        }}
                      >
                        <div
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-[6px] rounded-full bg-red-400 transition-opacity duration-300"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transitionDelay: `${850 + i * 400}ms`,
                            boxShadow: '0 0 6px 1px rgba(248,113,113,0.4)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/[0.06] my-2.5" />

              {/* Total */}
              <div className={`text-center ${isVisible ? 'pain-shake' : ''}`} style={{ animationDelay: '2.2s' }}>
                <span className="text-2xl font-extrabold text-red-400 tracking-tight">
                  {t.totalTime}
                </span>
                <span className="text-[10px] text-gray-500 block">{t.totalLabel}</span>
              </div>
              <p className={`text-[10px] text-gray-500 text-center mt-1 italic transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '2.6s' }}>{t.stillUncertain}</p>
            </div>
          </div>

          {/* Right: Solution card */}
          <div
            className={`
              relative card-glass-elevated rounded-xl p-4 flex flex-col overflow-hidden
              transition-all duration-500 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
            `}
            style={{ transitionDelay: '200ms' }}
          >
            {/* AI-generated background */}
            <Image
              src="/images/solution-card-bg.webp"
              alt=""
              fill
              className="object-cover opacity-15 pointer-events-none"
              aria-hidden="true"
              sizes="50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80 pointer-events-none" aria-hidden="true" />
            <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-accent/20 via-accent/5 to-transparent pointer-events-none" aria-hidden="true" />

            {/* AI scan line effect — mobile */}
            {isVisible && (
              <div
                className="absolute left-0 right-0 h-[1px] z-20 pointer-events-none pain-scan"
                style={{ top: 0 }}
                aria-hidden="true"
              >
                <div className="w-full h-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
                <div className="w-full h-[4px] -mt-[1px] bg-gradient-to-r from-transparent via-accent/15 to-transparent blur-sm" />
              </div>
            )}

            <div className="relative flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg border border-accent/20 overflow-hidden relative">
                  <Image src="/logo.svg" alt="SportBot" fill className="object-cover" />
                </div>
                <h3 className="text-xs font-bold text-accent uppercase tracking-wide">{t.with}</h3>
              </div>

              {/* Big number */}
              <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
                <div className="relative">
                  {/* Breathing glow — mobile */}
                  <div className={`absolute inset-0 -m-5 rounded-full bg-accent/[0.08] blur-xl ${isVisible ? 'pain-breathe' : ''}`} aria-hidden="true" />
                  <span
                    className={`
                      relative text-5xl font-extrabold text-white tracking-tighter
                      transition-all duration-700 ease-out
                      ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                    `}
                    style={{ transitionDelay: '400ms', textShadow: '0 0 40px rgba(42, 246, 160, 0.3)' }}
                  >
                    {countValue}
                  </span>
                  {/* Pulse rings on count completion — mobile */}
                  {countComplete && (
                    <>
                      <div className="absolute inset-0 -m-4 rounded-full border border-accent/30 pain-ring-1 opacity-0" aria-hidden="true" />
                      <div className="absolute inset-0 -m-4 rounded-full border border-accent/20 pain-ring-2 opacity-0" aria-hidden="true" />
                    </>
                  )}
                </div>
                <span className="text-sm font-bold text-accent mt-1 uppercase tracking-wide">
                  {t.fastUnit}
                </span>
                <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">{t.fastLabel}</p>
              </div>

              {/* CTA */}
              <Link
                href={locale === 'sr' ? '/sr/matches' : '/matches'}
                className="btn-primary block w-full py-2.5 text-center font-semibold text-xs mt-auto glow-accent-strong"
              >
                {locale === 'sr' ? 'Probaj Besplatno' : 'Try It Free'}
              </Link>
              <p className="text-[9px] text-gray-500 text-center mt-1">{t.ctaSubtext}</p>
            </div>
          </div>
        </div>

        {/* Mobile connecting arrow */}
        <div
          className={`
            flex sm:hidden justify-center -mt-[18px] mb-[-18px] relative z-10
            transition-all duration-500
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
          `}
          style={{ transitionDelay: '350ms' }}
        >
          <div className={`w-9 h-9 rounded-full bg-bg-card border border-accent/20 flex items-center justify-center shadow-lg ${isVisible ? 'pain-arrow' : ''}`}>
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        {/* === TABLET + DESKTOP LAYOUT (full cards) === */}
        <div className="hidden sm:grid sm:grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

          {/* LEFT CARD: Without SportBot (Pain) */}
          <div
            className={`
              relative card-glass rounded-2xl p-6 sm:p-8 border-red-500/10 overflow-hidden
              transition-all duration-700 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: '100ms' }}
          >
            {/* AI-generated background */}
            <Image
              src="/images/pain-card-bg.webp"
              alt=""
              fill
              className="object-cover opacity-20 pointer-events-none"
              aria-hidden="true"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/75 pointer-events-none" aria-hidden="true" />
            {/* Red glow behind card */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-red-500/20 via-transparent to-transparent pointer-events-none" aria-hidden="true" />

            {/* Red scan line — desktop */}
            {isVisible && (
              <div
                className="absolute left-0 right-0 h-[2px] z-20 pointer-events-none pain-red-scan"
                style={{ top: 0 }}
                aria-hidden="true"
              >
                <div className="w-full h-full bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
                <div className="w-full h-[6px] -mt-[2px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent blur-sm" />
              </div>
            )}
            
            <div className="relative">
              {/* Card Header */}
              <div className="flex items-center gap-3 mb-6 lg:mb-8">
                <div className={`w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center ${isVisible ? 'pain-clock-pulse' : ''}`}>
                  <PremiumIcon name="clock" size="lg" className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t.without}</h3>
                  <p className="text-xs text-red-400/70 font-medium">Manual Research</p>
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="space-y-4 mb-6 lg:mb-8">
                {t.steps.map((step, i) => (
                  <div
                    key={i}
                    className={`
                      group transition-all duration-500
                      ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                    `}
                    style={{ transitionDelay: `${300 + i * 400}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <PremiumIcon name={step.icon} size="sm" className="text-red-400/70" />
                      </div>
                      <span
                        className="text-sm text-gray-300 flex-1"
                        style={isVisible ? { animation: `pain-text-reveal 0.5s ease-out ${0.4 + i * 0.4}s both` } : { clipPath: 'inset(0 100% 0 0)' }}
                      >
                        {step.label}
                      </span>
                      <span
                        className="text-sm font-mono font-bold text-red-400 flex-shrink-0 relative"
                        style={isVisible ? { animation: `pain-time-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) ${0.7 + i * 0.4}s both` } : { opacity: 0 }}
                      >
                        {step.time}
                        {/* Strikethrough animation */}
                        {isVisible && (
                          <span
                            className="absolute left-0 top-1/2 h-[1px] bg-red-400/60 pointer-events-none"
                            style={{ animation: `pain-strikethrough 0.4s ease-out ${1.1 + i * 0.4}s forwards`, width: 0 }}
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      {/* Red X pop-in */}
                      {isVisible && (
                        <div
                          className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0 pain-x-pop"
                          style={{ animationDelay: `${1200 + i * 400}ms` }}
                        >
                          <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Animated progress bar with glowing tip */}
                    <div className="ml-10 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500/60 to-red-400/40 transition-all duration-1000 ease-out relative"
                        style={{
                          width: isVisible ? `${step.pct}%` : '0%',
                          transitionDelay: `${600 + i * 400}ms`,
                        }}
                      >
                        <div
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2.5 rounded-full bg-red-400 transition-opacity duration-500"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transitionDelay: `${1000 + i * 400}ms`,
                            boxShadow: '0 0 8px 2px rgba(248,113,113,0.5)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.06] my-4 lg:my-6" />

              {/* Total */}
              <div className={`flex items-center justify-between ${isVisible ? 'pain-shake' : ''}`} style={{ animationDelay: '2.6s' }}>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-red-400 tracking-tight">
                    {t.totalTime}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">{t.totalLabel}</span>
                </div>
                <div className={`w-12 h-12 rounded-full bg-red-500/10 border border-red-500/15 flex items-center justify-center ${isVisible ? 'pain-clock-pulse' : ''}`}>
                  <svg className="w-5 h-5 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className={`text-sm text-gray-500 mt-2 italic transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: '3s' }}>{t.stillUncertain}</p>
            </div>
          </div>

          {/* RIGHT CARD: With SportBot (Solution) */}
          <div
            className={`
              relative card-glass-elevated rounded-2xl p-6 sm:p-8 flex flex-col overflow-hidden
              transition-all duration-700 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: '250ms' }}
          >
            {/* AI-generated background */}
            <Image
              src="/images/solution-card-bg.webp"
              alt=""
              fill
              className="object-cover opacity-15 pointer-events-none"
              aria-hidden="true"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/55 to-black/70 pointer-events-none" aria-hidden="true" />
            {/* Accent glow behind card */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-accent/20 via-accent/5 to-transparent pointer-events-none" aria-hidden="true" />
            {/* Bottom glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-accent/10 blur-[60px] rounded-full pointer-events-none" aria-hidden="true" />

            {/* AI scan line effect */}
            {isVisible && (
              <div
                className="absolute left-0 right-0 h-[2px] z-20 pointer-events-none pain-scan"
                style={{ top: 0 }}
                aria-hidden="true"
              >
                <div className="w-full h-full bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
                <div className="w-full h-[6px] -mt-[2px] bg-gradient-to-r from-transparent via-accent/20 to-transparent blur-sm" />
              </div>
            )}

            <div className="relative flex flex-col h-full">
              {/* Card Header */}
              <div className="flex items-center gap-3 mb-6 lg:mb-8">
                <div className="w-10 h-10 rounded-xl border border-accent/20 overflow-hidden relative glow-accent">
                  <Image src="/logo.svg" alt="SportBot" fill className="object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t.with}</h3>
                  <p className="text-xs text-accent/70 font-medium">AI-Powered</p>
                </div>
              </div>

              {/* Big Number — Hero Element */}
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4 lg:py-8">
                <div className="relative mb-3 sm:mb-4">
                  {/* Breathing glow behind number */}
                  <div className={`absolute inset-0 -m-8 rounded-full bg-accent/[0.08] blur-2xl ${isVisible ? 'pain-breathe' : ''}`} aria-hidden="true" />
                  <span
                    className={`
                      relative text-7xl sm:text-8xl lg:text-9xl font-extrabold text-white tracking-tighter
                      transition-all duration-1000 ease-out
                      ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                    `}
                    style={{ transitionDelay: '600ms', textShadow: '0 0 80px rgba(42, 246, 160, 0.3)' }}
                  >
                    {countValue}
                  </span>
                  {/* Pulse rings burst on count completion */}
                  {countComplete && (
                    <>
                      <div className="absolute inset-0 -m-6 rounded-full border-2 border-accent/30 pain-ring-1 opacity-0" aria-hidden="true" />
                      <div className="absolute inset-0 -m-6 rounded-full border border-accent/20 pain-ring-2 opacity-0" aria-hidden="true" />
                    </>
                  )}
                </div>
                <span
                  className={`
                    text-xl sm:text-2xl font-bold text-accent mb-2 sm:mb-3 tracking-wide uppercase
                    transition-all duration-700
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  `}
                  style={{ transitionDelay: '800ms' }}
                >
                  {t.fastUnit}
                </span>
                <p className="text-sm text-gray-400 max-w-[260px] leading-relaxed">{t.fastLabel}</p>
              </div>

              {/* Feature checklist with pop-in animation */}
              <div className="space-y-2.5 mb-6">
                {t.features.map((feat, i) => (
                  <div
                    key={i}
                    className={`
                      flex items-center gap-2.5 transition-all duration-500
                      ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                    `}
                    style={{ transitionDelay: `${900 + i * 120}ms` }}
                  >
                    <div
                      className={`
                        w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0
                        transition-transform duration-500
                        ${isVisible ? 'scale-100' : 'scale-0'}
                      `}
                      style={{
                        transitionDelay: `${950 + i * 120}ms`,
                        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      <PremiumIcon name={feat.icon} size="xs" className="text-accent" />
                    </div>
                    <span className="text-sm text-gray-300">{feat.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-auto">
                <Link
                  href={locale === 'sr' ? '/sr/matches' : '/matches'}
                  className="btn-primary block w-full py-3.5 text-center font-semibold text-base glow-accent-strong"
                >
                  {t.cta}
                </Link>
                <p className="text-xs text-gray-500 text-center mt-2">{t.ctaSubtext}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Connecting visual — center arrow (desktop only) */}
        <div
          className={`
            hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 mt-8
            transition-all duration-700
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
          `}
          style={{ transitionDelay: '400ms' }}
        >
          <div className={`w-14 h-14 rounded-full bg-bg-card border border-accent/20 flex items-center justify-center shadow-lg ${isVisible ? 'pain-arrow' : ''}`}>
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
