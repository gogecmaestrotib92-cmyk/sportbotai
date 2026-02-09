/**
 * Affiliate Program Page - Serbian Version
 * 
 * Landing page for SportBot AI's affiliate/referral program.
 * Earn 30% recurring commission on referred subscriptions.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/seo';

const pageUrl = `${SITE_CONFIG.url}/sr/affiliate`;

export const metadata: Metadata = {
  title: 'Affiliate Program - Zaradite 30% Ponavljajuće Provizije',
  description: 'Pridružite se SportBot AI affiliate programu i zaradite 30% ponavljajuće provizije na svaku pretplatu koju preporučite. Savršeno za kreatore sadržaja o sportskom klađenju.',
  keywords: 'affiliate program, sportsko klađenje affiliate, referral program, zarada provizije, alati za klađenje affiliate',
  openGraph: {
    title: 'SportBot AI Affiliate Program - Zaradite 30% Ponavljajuće',
    description: 'Pridružite se našem affiliate programu i zaradite 30% ponavljajuće provizije na svaku pretplatu.',
    url: pageUrl,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SportBot AI Affiliate Program',
    description: 'Zaradite 30% ponavljajuće provizije promovisanjem AI alata za sportsku analitiku.',
  },
  alternates: {
    canonical: pageUrl,
    languages: {
      'en': `${SITE_CONFIG.url}/affiliate`,
      'sr': pageUrl,
    },
  },
};

export default function AffiliatePageSr() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-gray-950 to-purple-900/20" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Affiliate Program
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Zaradite <span className="text-emerald-400">30% Ponavljajuće</span> Provizije
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Postanite partner SportBot AI i ostvarite pasivni prihod promovisanjem najnaprednije 
            AI platforme za sportsku analitiku. Savršeno za kreatore sadržaja, tipstera i influensere.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/affiliate/apply"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Prijavite se
            </Link>
            <a 
              href="#how-it-works"
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors border border-gray-700"
            >
              Saznajte više
            </a>
          </div>
          <p className="text-gray-400 text-sm mt-6">
            Već ste partner? <Link href="/affiliate/login" className="text-emerald-400 hover:text-emerald-300 underline">Pristupite svom dashboardu</Link>
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">30%</div>
              <div className="text-gray-400 text-sm mt-1">Stopa provizije</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">Mesečno</div>
              <div className="text-gray-400 text-sm mt-1">Isplate</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">90 Dana</div>
              <div className="text-gray-400 text-sm mt-1">Trajanje kolačića</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">$50</div>
              <div className="text-gray-400 text-sm mt-1">Min. isplata</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Kako funkcioniše</h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Počnite zarađivati u tri jednostavna koraka. Nisu potrebne tehničke veštine.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800 text-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold">1</div>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 mt-2">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Registrujte se</h3>
            <p className="text-gray-400">
              Prijavite se za naš affiliate program. Pregledamo prijave u roku od 24-48 sati.
            </p>
          </div>
          
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800 text-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold">2</div>
            <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 mt-2">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Podelite svoj link</h3>
            <p className="text-gray-400">
              Dobijte jedinstveni referral link i podelite ga sa svojom publikom putem sadržaja, društvenih mreža ili emaila.
            </p>
          </div>
          
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800 text-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold">3</div>
            <div className="w-16 h-16 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 mt-2">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Primite isplatu</h3>
            <p className="text-gray-400">
              Zaradite 30% od svake pretplate, svakog meseca, sve dok ostanu pretplaćeni.
            </p>
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Struktura provizije</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Transparentne, konkurentne stope koje nagrađuju vaše promotivne napore.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Pro Plan preporuka</h3>
                  <p className="text-gray-400 text-sm">$19.99/mesec pretplata</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">Vaša provizija</span>
                  <span className="text-emerald-400 font-semibold">$6.00/mesec</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">Godišnja zarada (1 preporuka)</span>
                  <span className="text-emerald-400 font-semibold">$72/god</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">10 preporuka</span>
                  <span className="text-emerald-400 font-semibold">$720/god</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-2xl p-8 border border-emerald-800/50 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-emerald-600 text-xs px-2 py-1 rounded-full font-medium">
                POPULARNO
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Premium Plan preporuka</h3>
                  <p className="text-gray-400 text-sm">$49.99/mesec pretplata</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">Vaša provizija</span>
                  <span className="text-emerald-400 font-semibold">$15.00/mesec</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">Godišnja zarada (1 preporuka)</span>
                  <span className="text-emerald-400 font-semibold">$180/god</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">10 preporuka</span>
                  <span className="text-emerald-400 font-semibold">$1,800/god</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Should Join */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Ko treba da se pridruži?</h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Naš affiliate program je savršen za sve koji imaju publiku zainteresovanu za analitiku sportskog klađenja.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              icon: <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, 
              title: 'Kreatori sadržaja', 
              desc: 'Blogeri, YouTuberi, podkasteri koji pokrivaju sportsko klađenje' 
            },
            { 
              icon: <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, 
              title: 'Tipsteri i analitičari', 
              desc: 'Sportski hendikeperski i predikcioni servisi' 
            },
            { 
              icon: <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>, 
              title: 'Influenseri', 
              desc: 'Twitter, Instagram, TikTok sportski nalozi' 
            },
            { 
              icon: <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>, 
              title: 'Edukatori klađenja', 
              desc: 'Kursevi i zajednice koje podučavaju strategije klađenja' 
            },
          ].map((item, i) => (
            <div key={i} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 text-center hover:border-emerald-800/50 transition-colors">
              <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">{item.icon}</div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Zašto partnerstvo sa nama?</h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { title: 'Proizvod sa visokom konverzijom', desc: 'SportBot AI rešava prave probleme kladioničara. Naš besplatni nivo omogućava korisnicima da probaju pre kupovine.' },
              { title: 'Ponavljajući prihod', desc: 'Zaradite proviziju svakog meseca dok vaše preporuke ostaju pretplaćene. Gradite pasivan prihod koji raste.' },
              { title: '90-dnevni prozor kolačića', desc: 'Dugi period atribucije znači da dobijate kredit čak i ako korisnici ne konvertuju odmah.' },
              { title: 'Kontrolna tabla u realnom vremenu', desc: 'Pratite klikove, konverzije i zaradu u realnom vremenu kroz vaš affiliate dashboard.' },
              { title: 'Marketinški materijali', desc: 'Pristupite banerima, email šablonima i materijalima za društvene mreže za efikasnu promociju.' },
              { title: 'Posvećena podrška', desc: 'Dobijte personalizovanu podršku od našeg partnerskog tima za maksimizovanje zarade.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Često postavljana pitanja</h2>
        
        <div className="space-y-4">
          {[
            { q: 'Kako dobijam isplatu?', a: 'Plaćamo putem PayPal-a ili bankovnog transfera (za iznose preko $200). Isplate se procesiraju 15. u mesecu za zaradu prethodnog meseca.' },
            { q: 'Postoji li minimalna isplata?', a: 'Da, minimalni prag isplate je $50. Ako ga ne dostignete u mesecu, vaš balans se prenosi u sledeći mesec.' },
            { q: 'Koliko dugo traje kolačić?', a: 'Naš praćeni kolačić traje 90 dana. Ako neko klikne na vaš link i konvertuje u roku od 90 dana, dobijate kredit za prodaju.' },
            { q: 'Da li zarađujem na obnovama?', a: 'Da! Zarađujete 30% provizije na svaku uplatu vaših preporuka, uključujući sve mesečne obnove. Ovo je istinski ponavljajući prihod.' },
            { q: 'Mogu li promovisati na društvenim mrežama?', a: 'Apsolutno! Možete promovisati putem bloga, YouTube-a, Twitter-a, Instagram-a, TikTok-a, email newsletter-a ili bilo kog drugog kanala.' },
            { q: 'Šta ako preporuka zatraži povraćaj?', a: 'Ako preporuka zatraži povraćaj u okviru naše 7-dnevne garancije povrata novca, provizija za tu transakciju će biti stornirana.' },
          ].map((item, i) => (
            <details key={i} className="group bg-gray-900/50 rounded-xl border border-gray-800">
              <summary className="flex items-center justify-between p-6 cursor-pointer">
                <span className="font-semibold">{item.q}</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-6 pb-6 text-gray-400">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-900/50 to-blue-900/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Spremni da počnete zarađivati?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Pridružite se našem affiliate programu danas i počnite zarađivati 30% ponavljajuće provizije na svaku preporuku.
          </p>
          <Link 
            href="/affiliate/apply"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Prijavite se
          </Link>
          <p className="text-gray-400 text-sm mt-4">
            Prijave se pregledaju u roku od 24-48 sati
          </p>
        </div>
      </section>

      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'SportBot AI Affiliate Program',
            description: 'Pridružite se SportBot AI affiliate programu i zaradite 30% ponavljajuće provizije na svaku pretplatu.',
            url: pageUrl,
            inLanguage: 'sr',
            mainEntity: {
              '@type': 'Service',
              name: 'SportBot AI Affiliate Program',
              description: 'Zaradite 30% ponavljajuće provizije promovisanjem AI alata za sportsku analitiku',
              provider: {
                '@type': 'Organization',
                name: 'SportBot AI',
                url: 'https://www.sportbotai.com',
              },
            },
          }),
        }}
      />
    </div>
  );
}
