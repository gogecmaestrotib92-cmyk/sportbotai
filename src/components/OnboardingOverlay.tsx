/**
 * First-Time User Onboarding
 * 
 * Guides new users through their first analysis.
 * Shows only once per user (localStorage flag).
 * 
 * Steps:
 * 1. Welcome + Value prop
 * 2. How it works (3 steps visual)
 * 3. Start analyzing CTA
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ONBOARDING_KEY = 'sportbot_onboarding_complete';

interface OnboardingOverlayProps {
  onComplete?: () => void;
}

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay for better UX
      setTimeout(() => setShow(true), 500);
    }
  }, []);

  const handleComplete = () => {
    setIsExiting(true);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  if (!show) return null;

  const steps = [
    {
      title: 'Welcome to SportBot AI',
      subtitle: 'Find where the market is wrong',
      content: (
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
            <span className="text-4xl">⚡</span>
          </div>
          <p className="text-white/70 text-lg leading-relaxed max-w-md mx-auto">
            AI-powered match analysis that tells you <strong className="text-white">what you need to know</strong>—not 
            what to bet. Pure sports intelligence.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="px-3 py-1.5 rounded-full bg-white/5 text-sm text-white/60">⚽ Soccer</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 text-sm text-white/60">🏀 NBA</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 text-sm text-white/60">🏈 NFL</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 text-sm text-white/60">🥊 UFC</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 text-sm text-white/60">+17 more</span>
          </div>
        </div>
      ),
    },
    {
      title: 'How It Works',
      subtitle: '3 simple steps',
      content: (
        <div className="space-y-6">
          {[
            { icon: '🔍', title: 'Pick a Match', desc: 'Choose from trending matches or search any fixture' },
            { icon: '🤖', title: 'AI Analyzes', desc: 'Live odds, form, injuries—processed in seconds' },
            { icon: '🎯', title: 'Get Your Answer', desc: 'Clear verdict with confidence level and key factors' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{item.icon}</span>
              </div>
              <div>
                <h4 className="text-white font-medium mb-0.5">{item.title}</h4>
                <p className="text-white/50 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Ready to Start?',
      subtitle: 'Try your first analysis free',
      content: (
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-6 border border-accent/30">
            <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-white/70 text-lg mb-6">
            No credit card required. Start understanding matches like a pro.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>1 free trial analysis</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Audio briefings included</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Soccer, NBA, NFL & NHL available</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div 
        className={`relative w-full max-w-lg bg-bg-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ${
          isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Progress dots */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step ? 'bg-accent w-6' : i < step ? 'bg-accent' : 'bg-white/20'
              }`} 
            />
          ))}
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-white/40 hover:text-white/60 text-sm font-medium transition-colors"
        >
          Skip
        </button>

        {/* Content */}
        <div className="px-6 sm:px-10 pt-14 pb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{currentStep.title}</h2>
            <p className="text-white/50">{currentStep.subtitle}</p>
          </div>

          <div className="mb-8">
            {currentStep.content}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 px-6 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={nextStep}
              className="flex-1 py-3 px-6 rounded-xl bg-accent text-black font-semibold hover:bg-accent/90 transition-colors"
            >
              {step === 2 ? 'Start Analyzing' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FEATURE TOOLTIP (for highlighting features)
// ============================================
interface FeatureTooltipProps {
  targetRef: React.RefObject<HTMLElement>;
  title: string;
  description: string;
  onDismiss: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function FeatureTooltip({ 
  targetRef, 
  title, 
  description, 
  onDismiss,
  position = 'bottom' 
}: FeatureTooltipProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2,
      });
    }
  }, [targetRef]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onDismiss} />
      
      {/* Tooltip */}
      <div 
        className="fixed z-50 w-72 p-4 rounded-xl bg-bg-card border border-white/10 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300"
        style={{ 
          top: coords.top, 
          left: coords.left,
          transform: 'translateX(-50%)'
        }}
      >
        {/* Arrow */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-bg-card border-l border-t border-white/10" />
        
        <h4 className="text-white font-semibold mb-1">{title}</h4>
        <p className="text-white/60 text-sm mb-3">{description}</p>
        <button
          onClick={onDismiss}
          className="text-accent text-sm font-medium hover:underline"
        >
          Got it
        </button>
      </div>
    </>
  );
}

// ============================================
// RESET ONBOARDING (for testing)
// ============================================
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
  window.location.reload();
}
