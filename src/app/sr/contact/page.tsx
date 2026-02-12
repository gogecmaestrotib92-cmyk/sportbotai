/**
 * Contact Page - Serbian (/sr/contact)
 * 
 * Kontakt stranica sa formom za slanje poruka
 */

import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import { SITE_CONFIG } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Kontaktirajte Nas',
  description: 'Stupite u kontakt sa SportBot AI timom. Pitanja, povratne informacije ili poslovni upiti - rado ćemo vas čuti.',
  openGraph: {
    title: 'Kontaktirajte Nas',
    description: 'Stupite u kontakt sa SportBot AI timom.',
    url: '/sr/contact',
    type: 'website',
    locale: 'sr_RS',
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/sr/contact`,
    languages: {
      'en': `${SITE_CONFIG.url}/contact`,
      'sr': `${SITE_CONFIG.url}/sr/contact`,
      'x-default': `${SITE_CONFIG.url}/contact`,
    },
  },
};

export default function ContactPageSr() {
  return (
    <main className="min-h-screen bg-bg py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Kontaktirajte Nas
          </h1>
          <p className="text-text-secondary text-lg">
            Imate pitanje, povratnu informaciju ili poslovni upit? Rado ćemo vas čuti.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Email Card */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-text-primary font-semibold mb-2">Pišite nam</h3>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="text-accent hover:text-accent-hover transition-colors"
            >
              {SITE_CONFIG.email}
            </a>
          </div>

          {/* Response Time Card */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-text-primary font-semibold mb-2">Vreme odgovora</h3>
            <p className="text-text-secondary text-sm">
              Obično odgovaramo u roku od 24-48 sati
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="card p-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-6">
            Pošaljite nam poruku
          </h2>
          <ContactForm />
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-8">
          <p className="text-text-muted text-sm">
            Tražite brze odgovore? Pogledajte naše{' '}
            <a href="/sr/terms" className="text-accent hover:text-accent-hover transition-colors">
              Uslove korišćenja
            </a>
            {' '}ili{' '}
            <a href="/sr/privacy" className="text-accent hover:text-accent-hover transition-colors">
              Politiku privatnosti
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
