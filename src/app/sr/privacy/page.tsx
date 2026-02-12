/**
 * Privacy Policy Page - Serbian (/sr/privacy)
 * 
 * Politika privatnosti za SportBot AI platformu.
 */

import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Politika Privatnosti',
  description: 'Politika privatnosti za SportBot AI platformu. Saznajte kako prikupljamo, koristimo i štitimo vaše podatke.',
  openGraph: {
    title: 'Politika Privatnosti',
    description: 'Politika privatnosti za SportBot AI. Saznajte kako prikupljamo i štitimo vaše podatke.',
    url: '/sr/privacy',
    type: 'website',
    locale: 'sr_RS',
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/sr/privacy`,
    languages: {
      'en': `${SITE_CONFIG.url}/privacy`,
      'sr': `${SITE_CONFIG.url}/sr/privacy`,
      'x-default': `${SITE_CONFIG.url}/privacy`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPageSr() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <section className="bg-bg-card border-b border-divider text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold">Politika Privatnosti</h1>
          <p className="text-gray-400 mt-2">Poslednje ažuriranje: Decembar 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">1. Uvod</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              SportBot AI (&ldquo;mi&rdquo;, &ldquo;nas&rdquo;, &ldquo;naš&rdquo;) poštuje privatnost svojih korisnika. 
              Ova Politika Privatnosti objašnjava kako prikupljamo, koristimo, čuvamo 
              i štitimo vaše podatke kada koristite našu platformu.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Korišćenjem SportBot AI, pristajete na prikupljanje i korišćenje informacija 
              u skladu sa ovom politikom.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">2. Podaci Koje Prikupljamo</h2>
            
            <h3 className="text-lg font-semibold text-white mt-4 mb-2">2.1 Podaci koje direktno pružate:</h3>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
              <li>Email adresa (prilikom registracije)</li>
              <li>Podaci o plaćanju (obrađuje Stripe, ne čuvamo podatke o karticama)</li>
              <li>Podaci koje unosite u analizator (sportovi, timovi, kvote)</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">2.2 Automatski prikupljeni podaci:</h3>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>IP adresa</li>
              <li>Tip pretraživača i operativnog sistema</li>
              <li>Stranice koje posećujete i vreme provedeno na njima</li>
              <li>Kolačići za funkcionalnost sajta</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">3. Kako Koristimo Vaše Podatke</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Koristimo vaše podatke za:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Pružanje i održavanje Servisa</li>
              <li>Obradu plaćanja i upravljanje pretplatama</li>
              <li>Slanje servisnih obaveštenja (promene, održavanje)</li>
              <li>Poboljšanje korisničkog iskustva i performansi</li>
              <li>Analitiku korišćenja (anonimizovano)</li>
              <li>Prevenciju zloupotreba i bezbednosne svrhe</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Deljenje Podataka</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              <strong className="text-white">Ne prodajemo vaše lične podatke trećim stranama.</strong>
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              Delimo podatke samo sa:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li><strong className="text-white">Stripe:</strong> za obradu plaćanja (pogledajte Stripe politiku privatnosti)</li>
              <li><strong className="text-white">Hosting provajderi:</strong> Vercel za hosting aplikacije</li>
              <li><strong className="text-white">AI provajderi:</strong> OpenAI/Anthropic za obradu analiza (podaci su anonimizovani)</li>
              <li><strong className="text-white">Zakonski zahtevi:</strong> kada je to zakonski obavezno</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">5. Kolačići</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Koristimo sledeće vrste kolačića:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li><strong className="text-white">Neophodni:</strong> za funkcionalnost sajta i autentifikaciju</li>
              <li><strong className="text-white">Analitički:</strong> da razumemo kako koristite sajt</li>
              <li><strong className="text-white">Funkcionalni:</strong> da zapamtimo vaše preference</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              Možete kontrolisati kolačiće kroz podešavanja vašeg pretraživača.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">6. Bezbednost Podataka</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Primenjujemo industrijske standarde za zaštitu podataka:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>HTTPS enkripcija za sve komunikacije</li>
              <li>Hashovanje lozinki (nikada ne čuvamo plain-text)</li>
              <li>Redovna ažuriranja bezbednosnih zakrpa</li>
              <li>Ograničen pristup podacima samo ovlašćenom osoblju</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">7. Vaša Prava</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Imate pravo da:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Zatražite kopiju vaših podataka</li>
              <li>Ispravite netačne podatke</li>
              <li>Zatražite brisanje vaših podataka</li>
              <li>Povučete saglasnost za marketinške komunikacije</li>
              <li>Prenesete vaše podatke na drugi servis</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              Da biste ostvarili ova prava, kontaktirajte nas na contact@sportbotai.com
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">8. Čuvanje Podataka</h2>
            <p className="text-text-secondary leading-relaxed">
              Čuvamo vaše podatke dok god imate aktivan nalog. Nakon brisanja naloga, 
              podaci će biti uklonjeni u roku od 30 dana, osim podataka koje smo zakonski 
              obavezni da čuvamo (npr. podaci o transakcijama za poreske svrhe).
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">9. Maloletnici</h2>
            <p className="text-text-secondary leading-relaxed">
              SportBot AI nije namenjen osobama mlađim od 18 godina. Ne prikupljamo svesno 
              podatke od maloletnika. Ako saznate da je maloletnik koristio 
              naš servis, molimo vas da nas kontaktirate.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">10. Promene Politike</h2>
            <p className="text-text-secondary leading-relaxed">
              Možemo povremeno ažurirati ovu Politiku Privatnosti. O značajnim promenama ćemo vas obavestiti 
              putem emaila ili obaveštenja na platformi. Nastavak 
              korišćenja Servisa nakon promena predstavlja prihvatanje nove politike.
            </p>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">11. Kontakt</h2>
            <p className="text-text-secondary leading-relaxed">
              Za sva pitanja u vezi sa privatnošću, kontaktirajte nas na:
              <br />
              <strong className="text-white">Email:</strong> contact@sportbotai.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
