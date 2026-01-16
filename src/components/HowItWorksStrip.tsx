/**
 * How It Works Strip - Unified Component
 * 
 * Ultra-minimal 1-row "how it works" - replaces the 4-card version.
 * Shows the core flow: Odds → AI → Edge in a single horizontal strip.
 * Supports multiple languages via optional locale prop.
 */

interface HowItWorksStripProps {
  locale?: 'en' | 'sr';
}

const translations = {
  en: {
    explanation: 'We compare AI probabilities with bookmaker odds to detect mispricing.',
    steps: [
      { icon: '📊', label: 'Market Odds' },
      { icon: '🤖', label: 'AI Probability' },
      { icon: '⚡', label: 'Edge Detected' },
    ],
  },
  sr: {
    explanation: 'Upoređujemo AI verovatnoće sa kvotama kladionica da otkrijemo pogrešno cenjenje.',
    steps: [
      { icon: '📊', label: 'Tržišne Kvote' },
      { icon: '🤖', label: 'AI Verovatnoća' },
      { icon: '⚡', label: 'Edge Otkriven' },
    ],
  },
};

export default function HowItWorksStrip({ locale = 'en' }: HowItWorksStripProps) {
  const t = translations[locale];

  return (
    <section className="py-8 bg-bg-primary border-y border-divider/50">
      <div className="max-w-4xl mx-auto px-4">
        {/* One-liner explanation */}
        <p className="text-center text-gray-400 text-sm mb-6">
          {t.explanation}
        </p>

        {/* 3-step flow */}
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {t.steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-4 sm:gap-8">
              {/* Step */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl sm:text-3xl">{step.icon}</span>
                <span className="text-xs sm:text-sm text-gray-300 font-medium">{step.label}</span>
              </div>

              {/* Arrow (except after last) */}
              {index < t.steps.length - 1 && (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
