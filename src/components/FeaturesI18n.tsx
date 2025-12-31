/**
 * Features section - Internationalized
 * 
 * Premium features grid with sports analytics theme.
 * Includes scroll reveal animations.
 */

'use client';

import ScrollReveal from '@/components/ui/ScrollReveal';
import { TranslationsType } from '@/lib/i18n';

interface FeaturesI18nProps {
  t: TranslationsType;
}

const featureIcons = ['🌍', '📊', '⚡', '💬', '🔔', '📁'];

export default function FeaturesI18n({ t }: FeaturesI18nProps) {
  return (
    <section className="bg-bg-card section-container">
      <ScrollReveal animation="fade-up">
        <div className="text-center mb-14">
          <p className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-3">{t.features.label}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t.features.title}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t.features.subtitle}
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {t.features.items.map((feature, index) => (
          <ScrollReveal key={feature.title} animation="fade-up" delay={index * 80}>
            <div 
              className="bg-bg-elevated rounded-card p-6 border border-divider hover:border-primary/30 hover:shadow-glow-primary transition-all duration-300 group h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{featureIcons[index]}</span>
                <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {feature.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
