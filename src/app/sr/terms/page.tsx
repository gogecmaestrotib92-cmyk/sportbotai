/**
 * Terms & Conditions Page - Serbian (/sr/terms)
 * 
 * Uslovi korišćenja za SportBot AI platformu.
 */

import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Uslovi Korišćenja',
  description: 'Uslovi korišćenja za SportBot AI platformu. Pročitajte naše uslove pre korišćenja servisa.',
  openGraph: {
    title: 'Uslovi Korišćenja',
    description: 'Uslovi korišćenja za SportBot AI platformu.',
    url: '/sr/terms',
    type: 'website',
    locale: 'sr_RS',
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/sr/terms`,
    languages: {
      'en': `${SITE_CONFIG.url}/terms`,
      'sr': `${SITE_CONFIG.url}/sr/terms`,
      'x-default': `${SITE_CONFIG.url}/terms`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPageSr() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <section className="bg-bg-card border-b border-divider text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold">Uslovi Korišćenja</h1>
          <p className="text-gray-400 mt-2">Poslednje ažuriranje: Decembar 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">1. Prihvatanje Uslova</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Korišćenjem SportBot AI platforme (&ldquo;Servis&rdquo;), prihvatate ove Uslove Korišćenja u potpunosti. 
              Ako se ne slažete sa bilo kojim delom ovih uslova, ne smete koristiti naš Servis.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Zadržavamo pravo da izmenimo ove uslove u bilo kom trenutku. Nastavak korišćenja Servisa 
              nakon izmena predstavlja prihvatanje novih uslova.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">2. Opis Servisa</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              SportBot AI je <strong className="text-white">analitički i edukativni alat</strong> koji koristi algoritme 
              veštačke inteligencije za analizu sportskih događaja. Servis pruža:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
              <li>Procenjene verovatnoće ishoda sportskih događaja</li>
              <li>Analitičke komentare i procenu rizika</li>
              <li>Edukativne informacije o odgovornom klađenju</li>
            </ul>
            <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg">
              <p className="text-warning font-semibold">
                VAŽNO: SportBot AI NIJE tipster servis, NE pruža garantovane tikete, 
                insajderske informacije niti finansijske savete. Sve analize su samo informativnog karaktera.
              </p>
            </div>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">3. Ograničenje Odgovornosti</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Korisnik izričito razume i prihvata sledeće:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Sportsko klađenje nosi inherentni rizik gubitka novca</li>
              <li>Nijedna analiza ne može garantovati dobitak</li>
              <li>Procene se zasnivaju na dostupnim podacima i imaju marginu greške</li>
              <li>Korisnik je isključivo odgovoran za svoje odluke o klađenju</li>
              <li>SportBot AI nije odgovoran za bilo kakve finansijske gubitke</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Uslovi Korišćenja</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Da biste koristili Servis, morate:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Imati najmanje 18 godina</li>
              <li>Nalaziti se u jurisdikciji gde je online klađenje legalno</li>
              <li>Ne koristiti Servis za nelegalne aktivnosti</li>
              <li>Ne pokušavati da manipulišete ili zloupotrebite sistem</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">5. Pretplate i Plaćanje</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Za plaćene planove (Pro, Premium):
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Plaćanje se vrši preko Stripe platnog sistema</li>
              <li>Pretplate se automatski obnavljaju mesečno</li>
              <li>Možete otkazati pretplatu u bilo kom trenutku</li>
              <li>Refundacije nisu dostupne za delimično iskorišćene periode</li>
              <li>Cene su u EUR i mogu se promeniti uz prethodno obaveštenje</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">6. Intelektualna Svojina</h2>
            <p className="text-text-secondary leading-relaxed">
              Sav sadržaj na SportBot AI platformi, uključujući tekstove, grafiku, logotipe, 
              algoritme i softver, vlasništvo je SportBot AI ili naših licencodavaca. 
              Kopiranje, distribucija ili modifikacija bez pisane dozvole nije dozvoljena.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">7. Ograničenje Odgovornosti</h2>
            <p className="text-text-secondary leading-relaxed">
              Do maksimalnog stepena dozvoljenog zakonom, SportBot AI i njegovi vlasnici, zaposleni 
              i partneri neće biti odgovorni za bilo kakvu direktnu, indirektnu, slučajnu, 
              posebnu ili posledičnu štetu koja proizlazi iz korišćenja ili nemogućnosti korišćenja 
              Servisa.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">8. Merodavno Pravo</h2>
            <p className="text-text-secondary leading-relaxed">
              Ovi Uslovi Korišćenja regulisani su i tumače se u skladu sa zakonima jurisdikcije 
              u kojoj je SportBot AI registrovan. Svi sporovi će se rešavati pred 
              nadležnim sudovima te jurisdikcije.
            </p>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">9. Kontakt</h2>
            <p className="text-text-secondary leading-relaxed">
              Za sva pitanja u vezi sa ovim Uslovima Korišćenja, kontaktirajte nas na:
              <br />
              <strong className="text-white">Email:</strong> contact@sportbotai.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
