/**
 * Responsible Gambling block - Internationalized
 * 
 * Subtle, elegant section promoting responsible gambling.
 */

import Link from 'next/link';
import { TranslationsType } from '@/lib/i18n';

interface ResponsibleGamblingBlockI18nProps {
  t: TranslationsType;
  locale: 'en' | 'sr';
}

export default function ResponsibleGamblingBlockI18n({ t, locale }: ResponsibleGamblingBlockI18nProps) {
  const guideHref = locale === 'sr' ? '/sr/responsible-gambling' : '/responsible-gambling';
  
  return (
    <section className="bg-bg-card section-container-sm">
      <div className="max-w-4xl mx-auto">
        <div className="bg-bg-elevated rounded-card p-8 md:p-10 border border-divider shadow-card">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-warning/10 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                {t.responsibleGambling.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {t.responsibleGambling.description}
                <span className="font-medium text-white"> {t.responsibleGambling.ageRestriction}</span>
              </p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              <Link 
                href={guideHref} 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-bg-card hover:bg-bg-primary text-gray-300 rounded-lg font-medium transition-colors text-sm border border-divider"
              >
                {t.responsibleGambling.ctaButton}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Tips - Horizontal */}
          <div className="mt-6 pt-6 border-t border-divider flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {t.responsibleGambling.tips.time}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {t.responsibleGambling.tips.budget}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {t.responsibleGambling.tips.help} <a href="https://www.begambleaware.org/" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-accent-dark">BeGambleAware.org</a>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
