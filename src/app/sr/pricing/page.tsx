/**
 * Pricing Page - Serbian Version (/sr/pricing)
 * 
 * Page with detailed overview of pricing plans and Stripe checkout.
 */

import { Metadata } from 'next';
import PricingCardsI18n from '@/components/PricingCardsI18n';
import { SITE_CONFIG, getFAQSchema, getPricingSchema, getPricingBreadcrumb } from '@/lib/seo';
import { getTranslations } from '@/lib/i18n/translations';

const t = getTranslations('sr');

export const metadata: Metadata = {
  title: 'Cene | SportBot AI - Jednostavne i Transparentne Cene',
  description: 'Jednostavne cene bez skrivenih troškova. Počni besplatno, nadogradi kada budeš spreman. Pro i Premium planovi za ozbiljne analitičare.',
  keywords: ['sportbot cene', 'AI analiza cena', 'sportska analitika pretplata', 'pro plan', 'premium plan'],
  openGraph: {
    title: 'Cene | SportBot AI',
    description: 'Jednostavne cene bez skrivenih troškova. Počni besplatno.',
    url: `${SITE_CONFIG.url}/sr/pricing`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cene | SportBot AI',
    description: 'Jednostavne cene bez skrivenih troškova. Počni besplatno.',
    site: SITE_CONFIG.twitter,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/sr/pricing`,
    languages: {
      'en': `${SITE_CONFIG.url}/pricing`,
      'sr': `${SITE_CONFIG.url}/sr/pricing`,
    },
  },
};

// FAQ data for structured markup (Serbian)
const pricingFAQs = [
  {
    question: t.pricingPage.faq.cancel.question,
    answer: t.pricingPage.faq.cancel.answer,
  },
  {
    question: 'Da li je SportBot AI tipsterski servis?',
    answer: 'Ne. SportBot AI je analitički alat koji pruža modele verovatnoće i statističke uvide. Ne pružamo tipove, pikove ili garantovane ishode.',
  },
  {
    question: 'Koji sportovi su pokriveni?',
    answer: 'SportBot AI pokriva Fudbal (Premier Liga, La Liga, Liga Šampiona, Serie A, Bundesliga, Ligue 1), NBA, NFL, NHL i UFC/MMA sa integracijom podataka u realnom vremenu.',
  },
  {
    question: 'Koliko su tačni modeli verovatnoće?',
    answer: 'Naši AI modeli pružaju procenjene verovatnoće bazirane na statističkoj analizi. Nijedan sistem predikcije nije 100% tačan. Fokusiramo se na transparentnost i pomoć korisnicima da razumeju podatke.',
  },
];

export default function PricingPageSR() {
  const faqSchema = getFAQSchema(pricingFAQs);
  const pricingSchema = getPricingSchema();
  const breadcrumbSchema = getPricingBreadcrumb();

  return (
    <div className="bg-bg min-h-screen">
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Product/Pricing Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      {/* Header section */}
      <section className="bg-bg-card border-b border-divider text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t.pricingPage.title}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t.pricingPage.subtitle}
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="section-container -mt-8">
        <PricingCardsI18n locale="sr" />
      </section>

      {/* FAQ section */}
      <section className="section-container">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          {t.pricingPage.faqTitle}
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="card">
            <h3 className="font-bold text-white mb-2">{t.pricingPage.faq.cancel.question}</h3>
            <p className="text-text-secondary">
              {t.pricingPage.faq.cancel.answer}
            </p>
          </div>

          <div className="card">
            <h3 className="font-bold text-white mb-2">{t.pricingPage.faq.payment.question}</h3>
            <p className="text-text-secondary">
              {t.pricingPage.faq.payment.answer}
            </p>
          </div>

          <div className="card">
            <h3 className="font-bold text-white mb-2">{t.pricingPage.faq.guarantee.question}</h3>
            <p className="text-text-secondary">
              <strong>Ne.</strong> {t.pricingPage.faq.guarantee.answer.replace('No. ', '')}
            </p>
          </div>

          <div className="card">
            <h3 className="font-bold text-white mb-2">{t.pricingPage.faq.freePlan.question}</h3>
            <p className="text-text-secondary">
              {t.pricingPage.faq.freePlan.answer}
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-warning/10 border-t border-warning/30 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-warning text-sm leading-relaxed">
            <strong>⚠️ {t.pricingPage.note}</strong> {t.pricingPage.disclaimer}
          </p>
        </div>
      </section>
    </div>
  );
}
