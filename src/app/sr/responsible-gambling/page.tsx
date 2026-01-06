/**
 * Responsible Gambling Page - Serbian (/sr/responsible-gambling)
 * 
 * Stranica o odgovornom klađenju.
 * Ova stranica je etički i regulatorni zahtev.
 */

import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Odgovorno Klađenje | SportBot AI',
  description: 'Klađenje treba da bude zabava, ne problem. Saznajte kako se kladiti odgovorno i prepoznajte znake problematičnog kockanja.',
  alternates: {
    canonical: '/sr/responsible-gambling',
    languages: {
      'en': '/responsible-gambling',
      'sr': '/sr/responsible-gambling',
      'x-default': '/responsible-gambling',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ResponsibleGamblingPageSr() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <section className="bg-warning/20 border-b border-warning/30 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-warning" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Odgovorno Klađenje</h1>
          <p className="text-xl text-text-secondary">
            Klađenje treba da bude zabava, ne problem. Evo kako se kladiti odgovorno.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Naša Posvećenost</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              SportBot AI je posvećen promovisanju odgovornog klađenja. Naš alat je dizajniran 
              da vam pomogne da donosite informisane odluke, ali <strong className="text-white">nikada ne treba da se kladite 
              više nego što možete da priuštite da izgubite</strong>.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Sportsko klađenje nosi inherentni rizik. Čak ni najbolja analiza ne može garantovati 
              pobedu. Uvek se kladite odgovorno i prepoznajte znake problematičnog kockanja.
            </p>
          </div>

          {/* Tips */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Saveti za Odgovorno Klađenje</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Postavite Budžet</h3>
                  <p className="text-text-secondary text-sm">Postavite mesečni limit za klađenje i strogo ga se pridržavajte.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Ograničite Vreme</h3>
                  <p className="text-text-secondary text-sm">Ne trošite previše vremena na klađenje. Postavite tajmer.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Ne Jurite Gubitke</h3>
                  <p className="text-text-secondary text-sm">Ako izgubite, ne pokušavajte da nadoknadite većim opkladama.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Kladite se Trezni</h3>
                  <p className="text-text-secondary text-sm">Nikada se ne kladite pod uticajem alkohola ili emocija.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Prepoznajte Znake</h3>
                  <p className="text-text-secondary text-sm">Budite svesni znakova zavisnosti i reagujte na vreme.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Zabava, Ne Prihod</h3>
                  <p className="text-text-secondary text-sm">Klađenje nije način za zaradu. Tretirajte ga kao zabavu.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning signs */}
          <div className="card mb-8 border-l-4 border-danger">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-danger" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Znaci Problematičnog Kockanja
            </h2>
            <p className="text-text-secondary mb-4">
              Ako prepoznate bilo koji od ovih znakova, možda je vreme da potražite pomoć:
            </p>
            <ul className="space-y-2 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Klađenje novca namenjenog za račune ili osnovne potrebe
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Laganje porodici ili prijateljima o vašem klađenju
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Osećaj potrebe da se kladite na sve veće iznose
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Postajanje anksiozni ili depresivni kada ne možete da se kladite
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Zanemarivanje posla, škole ili porodice zbog klađenja
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger">•</span>
                Pozajmljivanje novca ili prodaja stvari da biste se kladili
              </li>
            </ul>
          </div>

          {/* Help resources */}
          <div className="card mb-8 bg-primary/10 border-primary/30">
            <h2 className="text-xl font-bold text-white mb-4">Resursi za Pomoć</h2>
            <p className="text-text-secondary mb-6">
              Ako vi ili neko koga poznajete ima problem sa kockanjem, potražite pomoć:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="https://www.gamblersanonymous.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-bg-hover p-4 rounded-lg border border-divider hover:border-primary/50 transition-colors"
              >
                <h3 className="font-semibold text-primary">Gamblers Anonymous</h3>
                <p className="text-text-secondary text-sm">Međunarodna organizacija za podršku</p>
              </a>
              <a 
                href="https://www.begambleaware.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-bg-hover p-4 rounded-lg border border-divider hover:border-primary/50 transition-colors"
              >
                <h3 className="font-semibold text-primary">BeGambleAware</h3>
                <p className="text-text-secondary text-sm">Informacije i podrška</p>
              </a>
              <a 
                href="https://www.gamcare.org.uk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-bg-hover p-4 rounded-lg border border-divider hover:border-primary/50 transition-colors"
              >
                <h3 className="font-semibold text-primary">GamCare</h3>
                <p className="text-text-secondary text-sm">Besplatna podrška i savetovanje</p>
              </a>
              <a 
                href="https://www.ncpgambling.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-bg-hover p-4 rounded-lg border border-divider hover:border-primary/50 transition-colors"
              >
                <h3 className="font-semibold text-primary">NCPG</h3>
                <p className="text-text-secondary text-sm">Nacionalni savet za problematično kockanje</p>
              </a>
            </div>
          </div>

          {/* Self-exclusion */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">Samoiskljičenje</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Ako osećate da gubite kontrolu, većina kladionica nudi opcije samoiskljičenja:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
              <li>Dnevni/nedeljni/mesečni limiti depozita</li>
              <li>Limiti gubitaka</li>
              <li>Privremeno zamrzavanje naloga (period hlađenja)</li>
              <li>Trajno samoiskljičenje</li>
            </ul>
            <p className="text-text-secondary leading-relaxed">
              Kontaktirajte vašu kladionicu za više informacija o ovim opcijama.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
