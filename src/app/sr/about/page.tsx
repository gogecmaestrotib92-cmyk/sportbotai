// Serbian About page - /sr/about
// E-E-A-T signals: Author bio, credentials, social proof

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'O Nama - Upoznajte Tim',
  description: 'Saznajte više o SportBot AI i našem timu. Upoznajte Stefana Mitrovića, sportskog analitičara i urednika, i otkrijte kako kombinujemo AI tehnologiju sa stručnom sportskom analizom.',
  openGraph: {
    title: 'O Nama',
    description: 'Upoznajte tim iza SportBot AI - kombinujemo AI tehnologiju sa stručnom sportskom analizom.',
    url: `${SITE_CONFIG.url}/sr/about`,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/sr/about`,
    languages: {
      'en': `${SITE_CONFIG.url}/about`,
      'sr': `${SITE_CONFIG.url}/sr/about`,
      'x-default': `${SITE_CONFIG.url}/about`,
    },
  },
};

// Team member data
const TEAM = {
  stefan: {
    name: 'Stefan Mitrović',
    role: 'Sportski Analitičar i Urednik',
    photo: '/images/stefan-mitrovic.png',
    bio: 'Stefan je strastven ljubitelj sporta, pisac i analitičar sa talentom za kreiranje inovativnih aplikacija. Sa godinama iskustva u analizi sportskih podataka i trendova, donosi jedinstvenu kombinaciju tehničke ekspertize i sportskog znanja u SportBot AI. Njegov kreativan pristup sportskoj analitici pomaže u isporuci uvida koji su bitni.',
    skills: ['Sportska Analiza', 'Analitika Podataka', 'Strategija Sadržaja', 'Razvoj Aplikacija'],
    social: {
      upwork: 'https://www.upwork.com/freelancers/~017b8c67c94029389f',
      linkedin: 'https://www.linkedin.com/company/automateed/',
    },
  },
};

export default function AboutPageSr() {
  const baseUrl = SITE_CONFIG.url;

  // Organization schema for E-E-A-T
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SportBot AI',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'AI platforma za sportsku analitiku koja pruža analizu mečeva, predikcije i uvide u realnom vremenu.',
    foundingDate: '2024',
    sameAs: [
      'https://twitter.com/sportbotai',
      'https://www.linkedin.com/company/automateed/',
    ],
  };

  // Person schema for Stefan (author)
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: TEAM.stefan.name,
    jobTitle: TEAM.stefan.role,
    description: TEAM.stefan.bio,
    url: `${baseUrl}/sr/about`,
    sameAs: [
      TEAM.stefan.social.upwork,
      TEAM.stefan.social.linkedin,
    ],
    worksFor: {
      '@type': 'Organization',
      name: 'SportBot AI',
      url: baseUrl,
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header - clean, minimal */}
        <header className="pt-8 md:pt-12 pb-8 md:pb-12">
          <div className="container mx-auto px-4 sm:px-6">
            <nav className="mb-4 md:mb-6">
              <ol className="flex items-center gap-2 text-sm text-slate-400">
                <li>
                  <Link href="/sr" className="hover:text-white transition-colors">Početna</Link>
                </li>
                <li className="text-slate-600">/</li>
                <li className="text-white">O Nama</li>
              </ol>
            </nav>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 md:mb-4">
              O SportBot AI
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
              Kombinujemo najsavremeniju AI tehnologiju sa stručnom sportskom analizom da vam pomognemo da pronađete gde tržište greši.
            </p>
          </div>
        </header>

        {/* Mission Section */}
        <section className="py-8 md:py-12 border-t border-slate-700/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Naša Misija</h2>
              <p className="text-base md:text-lg text-slate-300 mb-4 leading-relaxed">
                Verujemo da svako zaslužuje pristup profesionalnoj sportskoj analizi. SportBot AI demokratizuje sportsku inteligenciju kombinovanjem podataka u realnom vremenu, AI uvida i stručne kuracije.
              </p>
              <p className="text-base md:text-lg text-slate-300 leading-relaxed">
                Naša platforma je <strong className="text-white">edukativni i analitički alat</strong> — pomažemo vam da razumete mečeve, ne garantujemo ishode. Prodajemo razumevanje, ne pobede.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-8 md:py-12 border-t border-slate-700/30">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8">Upoznajte Tim</h2>
            
            {/* Stefan's Card - centered on mobile */}
            <div className="max-w-xl bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5 sm:p-6 md:p-8">
              <div className="flex flex-col items-center text-center sm:text-left sm:flex-row gap-5 sm:gap-6">
                {/* Profile Photo */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden flex-shrink-0 relative ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-slate-900">
                  <Image
                    src={TEAM.stefan.photo}
                    alt={TEAM.stefan.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {TEAM.stefan.name}
                  </h3>
                  <p className="text-emerald-400 font-medium text-sm sm:text-base mb-3">
                    {TEAM.stefan.role}
                  </p>
                  <p className="text-slate-300 text-sm sm:text-base mb-4 leading-relaxed">
                    {TEAM.stefan.bio}
                  </p>
                  
                  {/* Skills */}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                    {TEAM.stefan.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-slate-700/50 text-slate-300 text-xs sm:text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  {/* Social Links */}
                  <div className="flex justify-center sm:justify-start gap-4">
                    <a
                      href={TEAM.stefan.social.upwork}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.546-1.405 0-2.543-1.14-2.543-2.546V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/>
                      </svg>
                      Upwork
                    </a>
                    <a
                      href={TEAM.stefan.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="py-8 md:py-12 border-t border-slate-700/30">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8">Šta Radimo</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl">
              <div className="bg-slate-800/30 rounded-xl p-5 md:p-6 border border-slate-700/40">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                  <span className="text-xl md:text-2xl">📊</span>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-2">AI Analiza</h3>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                  Analiza mečeva u realnom vremenu koja kombinuje verifikovanu statistiku sa AI uvidima.
                </p>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-5 md:p-6 border border-slate-700/40">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                  <span className="text-xl md:text-2xl">⚡</span>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-2">Podaci u Realnom Vremenu</h3>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                  Kvote uživo, povrede, i najnovije vesti iz pouzdanih izvora.
                </p>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-5 md:p-6 border border-slate-700/40 sm:col-span-2 md:col-span-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                  <span className="text-xl md:text-2xl">🎯</span>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-2">Stručna Kuracija</h3>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                  Svaka analiza je pregledana i kurirana od strane naših sportskih eksperata.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources Section */}
        <section className="py-8 md:py-12 border-t border-slate-700/30">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Naši Izvori Podataka</h2>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl mb-4 md:mb-6 leading-relaxed">
              Agregiramo podatke iz više pouzdanih izvora kako bismo osigurali tačnost:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 max-w-2xl text-slate-300 text-sm md:text-base">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Zvanična statistika lige
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Kvote uživo od kladionica
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Verifikovana statistika igrača
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Agregacija najnovijih vesti
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Istorijski podaci mečeva
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Izveštaji o povredama
              </li>
            </ul>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-8 md:py-12 border-t border-slate-700/30">
          <div className="container mx-auto px-4 sm:px-6 pb-8">
            <div className="max-w-xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Kontaktirajte Nas</h2>
              <p className="text-slate-300 text-sm md:text-base mb-5 md:mb-6">
                Imate pitanja ili povratne informacije? Rado bismo čuli od vas.
              </p>
              <Link
                href="/sr/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm md:text-base font-medium rounded-lg transition-colors"
              >
                Kontaktirajte Nas
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
