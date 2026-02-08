/**
 * Statistics Hub: Tradicionalno Klađenje vs AI Predikcije
 * 
 * Sveobuhvatno poređenje tradicionalne industrije sportskog klađenja
 * sa AI sistemima predikcije sa realnim tržišnim podacima.
 * 
 * Svrha: SEO sadržaj, backlink magnet, izgradnja autoriteta
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tradicionalno Klađenje vs AI Predikcije 2026: Statistika Tržišta | SportBot AI',
  description: 'Da li AI klađenje može nadmašiti tradicionalne metode? Uporedite ljudske predikcije sa machine learning modelima u sportskom prognoziranju. Tačnost, ROI i budućnost AI u sportskom klađenju.',
  keywords: 'AI klađenje, tradicionalno klađenje vs AI predikcije, ljudske predikcije, sportsko prognoziranje, machine learning modeli, strategije klađenja, AI u sportskom klađenju, sportska analitika, fudbalsko klađenje',
  openGraph: {
    title: 'Tradicionalno Klađenje vs AI Predikcije: Statistika 2026',
    description: 'AI transformiše sportsko klađenje. Pogledajte kako machine learning modeli stoje u poređenju sa ljudskim predikcijama u fudbalskom klađenju i sportskoj analitici.',
    type: 'article',
    publishedTime: '2026-02-08',
    modifiedTime: '2026-02-08',
  },
  alternates: {
    canonical: 'https://www.sportbotai.com/sr/stats/tradicionalno-kladjenje-vs-ai-predikcije',
    languages: {
      'en': '/stats/traditional-betting-vs-ai-predictions',
    },
  },
};

// Strukturirani podaci za SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Tradicionalno Klađenje vs AI Predikcije: Statistika Tržišta 2026',
  description: 'Sveobuhvatna analiza poređenja tradicionalnog sportskog klađenja sa AI sistemima predikcije. Machine learning modeli, ljudske predikcije i budućnost sportskog prognoziranja.',
  author: {
    '@type': 'Organization',
    name: 'SportBot AI',
  },
  publisher: {
    '@type': 'Organization',
    name: 'SportBot AI',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.sportbotai.com/logo.png',
    },
  },
  datePublished: '2026-02-08',
  dateModified: '2026-02-08',
};

export default function TraditionalVsAIStatsPageSr() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-bg">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 text-xs font-medium text-violet-400 bg-violet-500/10 rounded-full border border-violet-500/20 mb-4">
                Statistički Centar • Istraživački Izveštaj
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Tradicionalno Klađenje vs AI Predikcije
              </h1>
              <p className="text-zinc-500 text-sm mb-4">Da li machine learning algoritmi mogu nadmašiti ljudske analitičare u sportskom prognoziranju?</p>
              {/* Meta Info */}
              <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-zinc-400 mb-4">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Autor: SportBot AI Istraživanje
                </span>
                <span className="text-zinc-600">|</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  8. februar 2026
                </span>
                <span className="text-zinc-600">|</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  12 min čitanja
                </span>
              </div>
              <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto">
                AI transformiše sportsko klađenje—a industrija od $110+ milijardi obrazća pažnju. 
                Istražite kako deep learning i statistička analiza preoblikuju svet klađenja, 
                sa podacima o tačnosti, ROI-u i da li AI može nadmašiti tradicionalne pristupe.
              </p>
            </div>
            
            {/* Ključne Statistike */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
              <StatCard 
                value="$110.3B" 
                label="Tržište Klađenja 2025"
                source="Mordor Intelligence"
              />
              <StatCard 
                value="$2.61B" 
                label="AI u Sportu 2030"
                source="MarketsandMarkets"
              />
              <StatCard 
                value="16.7%" 
                label="CAGR AI u Sportu"
                source="MarketsandMarkets"
              />
              <StatCard 
                value="7.31%" 
                label="CAGR Klađenje"
                source="Mordor Intelligence"
              />
            </div>
          </div>
        </section>

        {/* Sadržaj */}
        <section className="py-6 sm:py-8 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <nav className="flex flex-wrap gap-2 sm:gap-3 justify-center text-xs sm:text-sm">
              <a href="#pregled" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Tržište</a>
              <a href="#tradicionalno" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Tradicionalno</a>
              <a href="#ai-predikcije" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">AI</a>
              <a href="#poredjenje" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Poređenje</a>
              <a href="#buducnost" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Trendovi</a>
              <a href="#ponasanje" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Ponašanje</a>
              <a href="#izazovi" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Izazovi</a>
              <a href="#faq" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">FAQ</a>
              <a href="#reference" className="text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5">Reference</a>
            </nav>
          </div>
        </section>

        {/* Glavni Sadržaj */}
        <article className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            
            {/* Pregled Tržišta */}
            <section id="pregled" className="mb-20">
              <SectionHeading 
                number="01" 
                title="Pregled Globalnog Tržišta Sportskog Klađenja" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none">
                <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                  Globalno tržište sportskog klađenja doživelo je izuzetan rast, vođeno platformama za klađenje, 
                  regulatornim promenama i upotrebom AI u modernoj sportskoj analitici. Prema Mordor Intelligence, 
                  tržište je dostiglo <strong className="text-white">$110.31 milijardi u 2025</strong> i 
                  projektovano je da poraste na <strong className="text-white">$171.02 milijarde do 2030</strong>, 
                  što predstavlja prosečnu godišnju stopu rasta (CAGR) od 7.31%.
                </p>
                
                <p className="text-zinc-300 leading-relaxed mb-8">
                  Šire tržište kockanja, koje uključuje tradicionalno sportsko klađenje, lutrije i kazino igre, 
                  projektovano je da dostigne $655.31 milijardu u 2026. prema Statista Market Insights. 
                  Ova istorija klađenja je privukla značajan interes tehnoloških kompanija i 
                  investitora koji žele da iskoriste machine learning algoritme i AI algoritme za sportsko prognoziranje.
                </p>
              </div>

              {/* Tabela Veličine Tržišta */}
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="text-white font-semibold">Veličina Tržišta Sportskog Klađenja po Godinama</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Godina</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Veličina (USD)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Godišnji Rast</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <TableRow year="2023" size="$98.7 milijardi" growth="+8.2%" />
                      <TableRow year="2024" size="$104.5 milijardi" growth="+5.9%" />
                      <TableRow year="2025" size="$110.3 milijardi" growth="+5.6%" />
                      <TableRow year="2026" size="$118.4 milijardi" growth="+7.3%" highlight />
                      <TableRow year="2027" size="$127.1 milijardi" growth="+7.3%" />
                      <TableRow year="2030" size="$171.0 milijardi" growth="CAGR 7.31%" />
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-white/[0.02] text-xs text-zinc-500">
                  Izvor: Mordor Intelligence Sports Betting Market Report 2025
                </div>
              </div>

              {/* Regionalna Podela */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    {/* EU Zastava */}
                    <svg className="w-6 h-6" viewBox="0 0 810 540">
                      <rect fill="#039" width="810" height="540"/>
                      <g fill="#fc0">
                        {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle) => (
                          <polygon key={angle} points="405,66.6 397.5,86.1 376.3,86.1 393.4,99.4 386,118.9 405,105.6 424,118.9 416.6,99.4 433.7,86.1 412.5,86.1" transform={`rotate(${angle} 405 270)`}/>
                        ))}
                      </g>
                    </svg>
                    Evropa
                  </h4>
                  <p className="text-zinc-400 text-sm mb-3">Najveće tržište globalno</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Udeo u Tržištu</span>
                      <span className="text-white font-medium">~38%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Ključna Tržišta</span>
                      <span className="text-white font-medium">UK, Nemačka, Italija</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Status Regulacije</span>
                      <span className="text-emerald-400 font-medium">Zrelo</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    {/* US Zastava */}
                    <svg className="w-6 h-6 rounded-sm overflow-hidden" viewBox="0 0 7410 3900">
                      <rect width="7410" height="3900" fill="#b22234"/>
                      <path d="M0,450H7410m0,600H0m0,600H7410m0,600H0m0,600H7410m0,600H0" stroke="#fff" strokeWidth="300"/>
                      <rect width="2964" height="2100" fill="#3c3b6e"/>
                      <g fill="#fff">
                        {[0,1,2,3,4,5,6,7,8].map((row) => 
                          [0,1,2,3,4,5,6,7,8,9,10].map((col) => {
                            if ((row + col) % 2 === 0 || (row < 4 && col < 6)) {
                              const cx = 124 + col * 247;
                              const cy = 117 + row * 233;
                              if (cx < 2900 && cy < 2050) {
                                return <circle key={`${row}-${col}`} cx={cx} cy={cy} r="60"/>;
                              }
                            }
                            return null;
                          })
                        )}
                      </g>
                    </svg>
                    Severna Amerika
                  </h4>
                  <p className="text-zinc-400 text-sm mb-3">Region sa najbržim rastom</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Prihod 2026</span>
                      <span className="text-white font-medium">$216.85B (ukupno kockanje)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Legalne Države</span>
                      <span className="text-white font-medium">38+ država</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Pokretač Rasta</span>
                      <span className="text-amber-400 font-medium">Talas Legalizacije</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tradicionalno Klađenje */}
            <section id="tradicionalno" className="mb-20">
              <SectionHeading 
                number="02" 
                title="Tradicionalno Klađenje i Industrija Tipstera" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none">
                <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                  Tradicionalna industrija sportskog klađenja oslanja se na kombinaciju kompajlera kvota, 
                  ljudskih analitičara i tipster servisa. Profesionalni tipsteri—pojedinci koji pružaju 
                  savete za klađenje uz naknadu—predstavljaju značajan deo tržišta sportskih predikcija.
                </p>
              </div>

              {/* Statistike Tipstera */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-8 border border-amber-500/20 mb-8">
                <h3 className="text-xl font-bold text-white mb-6">Statistike Tradicionalne Industrije Tipstera</h3>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">52-55%</div>
                    <div className="text-zinc-400 text-sm">Prosečna Dugoročna Uspešnost</div>
                    <div className="text-zinc-500 text-xs mt-1">Profesionalni tipsteri (verifikovani)</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">$50-500</div>
                    <div className="text-zinc-400 text-sm">Mesečna Pretplata</div>
                    <div className="text-zinc-500 text-xs mt-1">Premium tipster servisi</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">2-4 sata</div>
                    <div className="text-zinc-400 text-sm">Vreme Analize Po Meču</div>
                    <div className="text-zinc-500 text-xs mt-1">Manuelno istraživanje i analiza</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">~20</div>
                    <div className="text-zinc-400 text-sm">Razmatranih Podataka</div>
                    <div className="text-zinc-500 text-xs mt-1">Forma, H2H, osnovne statistike</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">Visok</div>
                    <div className="text-zinc-400 text-sm">Faktor Emotivnog Pristrasnosti</div>
                    <div className="text-zinc-500 text-xs mt-1">Kognitivne pristrasnosti utiču na odluke</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">90%+</div>
                    <div className="text-zinc-400 text-sm">Tipstera Neprofitabilno Dugoročno</div>
                    <div className="text-zinc-500 text-xs mt-1">Nakon uračunavanja troškova pretplate</div>
                  </div>
                </div>
              </div>

              {/* Izazovi */}
              <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                <h4 className="text-white font-semibold mb-4">Ključni Izazovi u Tradicionalnom Klađenju</h4>
                <div className="space-y-3">
                  <Challenge 
                    title="Kognitivne Pristrasnosti"
                    description="Pristrasnost skorašnjosti, pristrasnost potvrđivanja i emotivno donošenje odluka utiču na tačnost"
                  />
                  <Challenge 
                    title="Ograničena Obrada Podataka"
                    description="Ljudi mogu obraditi samo deo dostupnih statistika i vesti u realnom vremenu"
                  />
                  <Challenge 
                    title="Problemi sa Skalabilnošću"
                    description="Manuelna analiza se ne skalira—pokrivanje više sportova i liga je vremenski nemoguće"
                  />
                  <Challenge 
                    title="Problemi sa Transparentnošću"
                    description="Mnogi tipster servisi selektivno biraju rezultate ili koriste selektivno izveštavanje"
                  />
                </div>
              </div>
            </section>

            {/* AI Predikcije */}
            <section id="ai-predikcije" className="mb-20">
              <SectionHeading 
                number="03" 
                title="Tržište AI Sportskih Predikcija" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none">
                <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                  Tržište AI u sportu projektovano je da dostigne <strong className="text-white">$2.61 milijarde do 2030</strong>, 
                  sa rastom od 16.7% CAGR prema MarketsandMarkets. Ovaj segment uključuje analitiku performansi, 
                  praćenje igrača i prediktivno modeliranje—gde su sportske predikcije brzo rastuća primena.
                </p>
                
                <p className="text-zinc-300 leading-relaxed mb-8">
                  Akademsko istraživanje u ovoj oblasti je eksplodiralo, sa preko <strong className="text-white">147 istraživačkih radova</strong> o 
                  mašinskom učenju u sportskim predikcijama indeksiranih samo na arXiv-u. Univerziteti i istraživački 
                  instituti širom sveta razvijaju sve sofisticiranije modele.
                </p>
              </div>

              {/* AI Statistike */}
              <div className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 rounded-2xl p-8 border border-violet-500/20 mb-8">
                <h3 className="text-xl font-bold text-white mb-6">Statistike AI Sportskih Predikcija</h3>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">54-65%</div>
                    <div className="text-zinc-400 text-sm">Opseg Tačnosti Top Modela</div>
                    <div className="text-zinc-500 text-xs mt-1">Objavljena akademska istraživanja</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">10,000+</div>
                    <div className="text-zinc-400 text-sm">Podataka Po Meču</div>
                    <div className="text-zinc-500 text-xs mt-1">Istorijski, real-time, kontekstualni</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">&lt;1 min</div>
                    <div className="text-zinc-400 text-sm">Vreme Analize Po Meču</div>
                    <div className="text-zinc-500 text-xs mt-1">Automatizovana obrada</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">Nula</div>
                    <div className="text-zinc-400 text-sm">Emotivna Pristrasnost</div>
                    <div className="text-zinc-500 text-xs mt-1">Samo odluke zasnovane na podacima</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">24/7</div>
                    <div className="text-zinc-400 text-sm">Praćenje Tržišta</div>
                    <div className="text-zinc-500 text-xs mt-1">Kontinuirano praćenje kvota</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-1">147+</div>
                    <div className="text-zinc-400 text-sm">Istraživačkih Radova (arXiv)</div>
                    <div className="text-zinc-500 text-xs mt-1">ML sportske predikcije</div>
                  </div>
                </div>
              </div>

              {/* Tabela Rasta AI Tržišta */}
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="text-white font-semibold">Projekcija Rasta AI u Sportu</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Godina</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Veličina (USD)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Ključni Razvoji</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">2024</td>
                        <td className="px-6 py-4 text-sm text-white">$1.12 milijardi</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">Početak GenAI integracije</td>
                      </tr>
                      <tr className="bg-violet-500/5">
                        <td className="px-6 py-4 text-sm text-white font-medium">2026</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">$1.53 milijardi</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">Real-time predikcije mainstream</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">2028</td>
                        <td className="px-6 py-4 text-sm text-white">$2.08 milijardi</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">Multi-modalna analiza standard</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-white">2030</td>
                        <td className="px-6 py-4 text-sm text-white">$2.61 milijardi</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">AI-first platforme za klađenje</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-white/[0.02] text-xs text-zinc-500">
                  Izvor: MarketsandMarkets AI in Sports Market Report, Novembar 2024
                </div>
              </div>

              {/* Ključni Igrači */}
              <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                <h4 className="text-white font-semibold mb-4">Glavni Provajderi AI Sportske Tehnologije</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'Stats Perform', url: 'https://www.statsperform.com/' },
                    { name: 'Sportradar AG', url: 'https://sportradar.com/' },
                    { name: 'Genius Sports', url: 'https://www.geniussports.com/' },
                    { name: 'Second Spectrum', url: 'https://www.secondspectrum.com/' },
                    { name: 'Catapult', url: 'https://www.catapult.com/' },
                    { name: 'STATSports', url: 'https://statsports.com/' },
                  ].map((company) => (
                    <a 
                      key={company.name} 
                      href={company.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-zinc-300 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 hover:text-white transition-all inline-flex items-center gap-1.5"
                    >
                      {company.name}
                      <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
                <p className="text-zinc-500 text-xs mt-4">
                  Izvor: MarketsandMarkets AI in Sports Market Report
                </p>
              </div>
            </section>

            {/* Poređenje */}
            <section id="poredjenje" className="mb-20">
              <SectionHeading 
                number="04" 
                title="Direktno Poređenje" 
              />
              
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Metrika</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">Tradicionalno</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-violet-400">AI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <ComparisonRow 
                        metric="Tačnost (Dugoročno)" 
                        traditional="52-55%" 
                        ai="54-65%"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Vreme Analize/Meč" 
                        traditional="2-4 sata" 
                        ai="<1 minut"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Korišćenih Podataka" 
                        traditional="~20" 
                        ai="10,000+"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Emotivna Pristrasnost" 
                        traditional="Visoka" 
                        ai="Nema"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Cena (Mesečno)" 
                        traditional="$50-500" 
                        ai="$0-100"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Skalabilnost" 
                        traditional="Ograničena" 
                        ai="Neograničena"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Razumevanje Konteksta" 
                        traditional="Visoko" 
                        ai="U Poboljšanju"
                        winner="traditional"
                      />
                      <ComparisonRow 
                        metric="Real-time Adaptacija" 
                        traditional="Spora" 
                        ai="Trenutna"
                        winner="ai"
                      />
                      <ComparisonRow 
                        metric="Transparentnost" 
                        traditional="Varijabilna" 
                        ai="Zavisi od Modela"
                        winner="neutral"
                      />
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ključni Uvid */}
              <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-xl p-6 border border-violet-500/20">
                <div className="flex gap-4">
                  <svg className="w-8 h-8 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Ključni Uvid: Hibridni Pristup</h4>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      Podaci sugerišu da nijedan pristup nije definitivno superioran u svim scenarijima. 
                      <strong className="text-white"> Najefikasnija strategija kombinuje moć obrade podataka AI-a 
                      sa ljudskim razumevanjem konteksta</strong>—koristeći AI za prepoznavanje obrazaca i 
                      detekciju vrednosti dok se ljudska prosudba koristi za kvalitativne faktore poput morala tima, 
                      promena trenera ili lokalnih uslova.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Budući Trendovi */}
            <section id="buducnost" className="mb-20">
              <SectionHeading 
                number="05" 
                title="Budući Trendovi i Prognoze" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none mb-8">
                <p className="text-zinc-300 text-lg leading-relaxed">
                  Na osnovu trenutnih tržišnih trajektorija i tehnološkog razvoja, očekuje se da će nekoliko ključnih trendova 
                  oblikovati presek AI-a i sportskog klađenja:
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <TrendCard 
                  icon="brain"
                  title="Integracija Generativnog AI"
                  description="Veliki jezički modeli omogućiće analizu vesti na prirodnom jeziku, sentimenta društvenih mreža i press konferencija za informisanje predikcija."
                  timeline="2025-2027"
                />
                <TrendCard 
                  icon="bolt"
                  title="Real-time In-play Predikcije"
                  description="AI sistemi će obrađivati podatke uživo sa utakmica kako bi prilagodili predikcije i identifikovali vrednosne prilike u milisekundama."
                  timeline="2026-2028"
                />
                <TrendCard 
                  icon="link"
                  title="Blockchain Transparentnost"
                  description="Nepromenljivi zapisi predikcija postaće standard, omogućavajući verifikovane track rekorde i eliminišući selektivno prikazivanje."
                  timeline="2026-2028"
                />
                <TrendCard 
                  icon="device"
                  title="Personalizovani AI Asistenti"
                  description="Platforme za klađenje će nuditi AI kopilote koji uče individualne preferencije i toleranciju na rizik."
                  timeline="2027-2030"
                />
              </div>
            </section>

            {/* Ponašanje Kladioničara i Psihologija */}
            <section id="ponasanje" className="mb-20">
              <SectionHeading 
                number="06" 
                title="Ponašanje Kladioničara i Psihologija" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none mb-8">
                <p className="text-zinc-300 text-lg leading-relaxed">
                  Razumevanje psihologije iza odluka o klađenju je ključno za procenu vrednosti AI-a. 
                  Istraživanja pokazuju da većina kladioničara pravi sistematske greške koje AI može prevazići.
                </p>
              </div>

              {/* Tabela Statistike Ponašanja */}
              <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-white/5">
                  <h3 className="text-white font-semibold">Statistika Ponašanja Kladioničara</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Ponašanje</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Procenat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Uticaj</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-6 py-4 text-sm text-zinc-300">Klađenje na omiljeni tim (pristrasnost)</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">68%</td>
                        <td className="px-6 py-4 text-sm text-red-400">Negativan</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-zinc-300">Jurenje gubitaka nakon loše serije</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">47%</td>
                        <td className="px-6 py-4 text-sm text-red-400">Negativan</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-zinc-300">Ignorisanje kvota u korist osećaja</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">52%</td>
                        <td className="px-6 py-4 text-sm text-red-400">Negativan</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-zinc-300">Preterana samopouzdanost nakon pobeda</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">61%</td>
                        <td className="px-6 py-4 text-sm text-amber-400">Umeren</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-zinc-300">Korišćenje sistema upravljanja novcem</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">23%</td>
                        <td className="px-6 py-4 text-sm text-emerald-400">Pozitivan</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-zinc-300">Istraživanje pre klađenja</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">31%</td>
                        <td className="px-6 py-4 text-sm text-emerald-400">Pozitivan</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 bg-white/[0.02] text-xs text-zinc-500">
                  Izvori: Procene iz istraživanja o ponašanju u kockanju; stvarni podaci variraju po studiji i regionu
                </div>
              </div>

              {/* Kognitivne Pristrasnosti */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    Pristrasnosti Ljudi
                  </h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-zinc-300"><strong className="text-white">Pristrasnost Potvrde:</strong> Traženje informacija koje podržavaju postojeća uverenja</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-zinc-300"><strong className="text-white">Kockareva Zabluda:</strong> Verovanje da prošli rezultati utiču na buduće slučajne događaje</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-zinc-300"><strong className="text-white">Pristrasnost Recentnosti:</strong> Prenaglašavanje nedavnih događaja nad istorijskim podacima</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span className="text-zinc-300"><strong className="text-white">Zaslepljenost Favoritom:</strong> Preterano klađenje na popularne timove</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Prednosti AI
                  </h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span className="text-zinc-300"><strong className="text-white">Bez Emocija:</strong> Odluke bazirane isključivo na podacima, bez sentimentalnosti</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span className="text-zinc-300"><strong className="text-white">Konzistentnost:</strong> Ista metodologija svaki put bez umora</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span className="text-zinc-300"><strong className="text-white">Obrada Obima:</strong> Analiza hiljada meča istovremeno</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span className="text-zinc-300"><strong className="text-white">Prepoznavanje Obrazaca:</strong> Detekcija veza nevidljivih ljudskom oku</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Izazovi i Razmatranja */}
            <section id="izazovi" className="mb-20">
              <SectionHeading 
                number="07" 
                title="Izazovi i Razmatranja" 
              />
              
              <div className="prose prose-invert prose-zinc max-w-none mb-8">
                <p className="text-zinc-300 text-lg leading-relaxed">
                  I AI predikcije i tradicionalno klađenje se suočavaju sa značajnim izazovima. 
                  Razumevanje ovih ograničenja je ključno za formiranje realnih očekivanja.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* AI Izazovi */}
                <div className="bg-gradient-to-b from-violet-500/5 to-transparent rounded-xl p-6 border border-violet-500/20">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    Izazovi za AI
                  </h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-zinc-300"><strong className="text-white">Crni Labud Događaji:</strong> Nemoguće predvideti povrede, vremenske uslove ili nepredviđene okolnosti</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-zinc-300"><strong className="text-white">Kvalitet Podataka:</strong> Garbage in, garbage out - loši podaci znače loše predikcije</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-zinc-300"><strong className="text-white">Adaptacija Tržišta:</strong> Kladionice brzo reaguju na AI obrasce, smanjujući prednost</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-zinc-300"><strong className="text-white">Overfitting:</strong> Modeli mogu biti previše prilagođeni istorijskim podacima</span>
                    </li>
                  </ul>
                </div>

                {/* Tradicionalni Izazovi */}
                <div className="bg-gradient-to-b from-slate-500/5 to-transparent rounded-xl p-6 border border-slate-500/20">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Izazovi za Tradicionalni Pristup
                  </h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-zinc-300"><strong className="text-white">Vremenska Ograničenja:</strong> Nemoguće analizirati sve dostupne podatke ručno</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-zinc-300"><strong className="text-white">Emocionalno Odlučivanje:</strong> Pristrasnosti utiču na racionalnu analizu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-zinc-300"><strong className="text-white">Pristup Informacijama:</strong> Premium podaci su skupi ili nedostupni</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-zinc-300"><strong className="text-white">Nedoslednost:</strong> Kvalitet analize varira u zavisnosti od raspoloženja</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Da Li Ste Znali? */}
            <section className="mb-20 bg-gradient-to-r from-violet-500/5 via-transparent to-blue-500/5 rounded-2xl p-8 border border-violet-500/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                Da Li Ste Znali?
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-zinc-300 text-sm">Profesionalni kladioničari obično imaju win rate od 52-55%, ali i to je dovoljno za dugoročni profit zbog pozitivnog očekivanog ishoda.</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                    </svg>
                  </div>
                  <p className="text-zinc-300 text-sm">Napredni AI modeli za fudbal postižu tačnost od 55-65% na direktne pobede (1X2), što varira po ligi i kvalitetu podataka.</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <p className="text-zinc-300 text-sm">Globalno tržište sportskog klađenja generiše više prihoda nego filmska i muzička industrija zajedno.</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  </div>
                  <p className="text-zinc-300 text-sm">Prosečan povrat ulaganja na klađenju iznosi -5% do -10% za rekreativne kladioničare, zbog ugrađene marže kladionica.</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <p className="text-zinc-300 text-sm">Live betting (klađenje uživo) čini preko 70% celokupnog prometa klađenja u nekim regionima.</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                    </svg>
                  </div>
                  <p className="text-zinc-300 text-sm">AI modeli mogu obraditi stotine varijabli po utakmici, dok ljudi obično razmatraju 5-15 faktora.</p>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mb-20">
              <SectionHeading 
                number="08" 
                title="Često Postavljana Pitanja" 
              />
              
              <div className="space-y-4">
                <details className="group bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                  <summary className="cursor-pointer px-6 py-4 flex justify-between items-center text-white font-medium hover:bg-white/[0.02] transition-colors">
                    <span>Da li AI može garantovati dobitne opklade?</span>
                    <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-zinc-400 text-sm leading-relaxed">
                    <strong className="text-white">Ne, nikakav sistem ne može garantovati dobitke.</strong> Sport je inherentno nepredvidiv i čak i najbolji AI modeli imaju ograničenja. AI može identifikovati vrednosne opklade i poboljšati verovatnoću uspeha, ali kockanje uvek nosi rizik. Odgovorno klađenje je ključno.
                  </div>
                </details>

                <details className="group bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                  <summary className="cursor-pointer px-6 py-4 flex justify-between items-center text-white font-medium hover:bg-white/[0.02] transition-colors">
                    <span>Koliko je AI tačan u predviđanju sportskih rezultata?</span>
                    <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-zinc-400 text-sm leading-relaxed">
                    Akademska istraživanja pokazuju da napredni AI modeli mogu postići <strong className="text-white">52-65% tačnosti</strong> u zavisnosti od sporta i tipa opklade. Fudbal (1X2) obično ima 52-58% tačnost kod vrhunskih modela, dok košarka i tenis mogu imati nešto višu tačnost.
                  </div>
                </details>

                <details className="group bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                  <summary className="cursor-pointer px-6 py-4 flex justify-between items-center text-white font-medium hover:bg-white/[0.02] transition-colors">
                    <span>Zašto kladionice ne zabrane AI ako je toliko efikasan?</span>
                    <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-zinc-400 text-sm leading-relaxed">
                    Kladionice same koriste napredne AI sisteme za postavljanje kvota. Tržište je dvosmerna ulica - i kladionice i napredni kladioničari koriste AI. Kladionice ograničavaju ili zatvaraju naloge dobitnih igrača, ali teško je detektovati AI korišćenje samo na osnovu rezultata.
                  </div>
                </details>

                <details className="group bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                  <summary className="cursor-pointer px-6 py-4 flex justify-between items-center text-white font-medium hover:bg-white/[0.02] transition-colors">
                    <span>Koja je razlika između AI predikcija i tipster servisa?</span>
                    <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-zinc-400 text-sm leading-relaxed">
                    <strong className="text-white">Tipster servisi</strong> obično nude specifične opklade sa &quot;garantovanim&quot; rezultatima (što je nemoguće). <strong className="text-white">AI analitika</strong> poput SportBot AI pruža verovatnoće, analizu vrednosti i kontekstualne informacije - pomažući vam da donosite informisane odluke umesto da slepo pratite tipove.
                  </div>
                </details>
              </div>
            </section>

            {/* Reference */}
            <section id="reference" className="mb-20">
              <SectionHeading 
                number="09" 
                title="Reference i Izvori" 
              />
              
              <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
                <p className="text-zinc-400 text-sm mb-6">
                  Sve statistike u ovom izveštaju potiču iz recenziranih istraživanja i etabliranih firmi za istraživanje tržišta. 
                  Kliknite na bilo koju referencu da pristupite originalnom izvoru.
                </p>
                
                <div className="space-y-4">
                  {/* Reference 1 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[1]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      Mordor Intelligence. (2025). <em>Sports Betting Market - Growth, Trends, COVID-19 Impact, and Forecasts (2025-2030)</em>.
                    </p>
                    <a 
                      href="https://www.mordorintelligence.com/industry-reports/sports-betting-market" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      mordorintelligence.com/industry-reports/sports-betting-market
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 2 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[2]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      MarketsandMarkets. (2024). <em>AI in Sports Market by Component, Sports Type, Application and Region - Global Forecast to 2030</em>.
                    </p>
                    <a 
                      href="https://www.marketsandmarkets.com/Market-Reports/ai-in-sports-market-198521498.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      marketsandmarkets.com/Market-Reports/ai-in-sports-market
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 3 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[3]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      Statista Market Insights. (2025). <em>Gambling - Worldwide Market Forecast</em>.
                    </p>
                    <a 
                      href="https://www.statista.com/outlook/dmo/eservices/online-gambling/worldwide" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      statista.com/outlook/dmo/eservices/online-gambling
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 4 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[4]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      Hubáček, O., Šourek, G., & Železný, F. (2019). <em>Exploiting sports-betting market using machine learning</em>. International Journal of Forecasting, 35(2), 783-796.
                    </p>
                    <a 
                      href="https://doi.org/10.1016/j.ijforecast.2019.01.001" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      doi.org/10.1016/j.ijforecast.2019.01.001
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 5 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[5]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      Razali, N., et al. (2017). <em>A Review on Football Match Outcome Prediction using Machine Learning</em>. IOP Conference Series: Materials Science and Engineering.
                    </p>
                    <a 
                      href="https://doi.org/10.1088/1757-899X/226/1/012099" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      doi.org/10.1088/1757-899X/226/1/012099
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 6 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[6]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      Bunker, R. P., & Thabtah, F. (2019). <em>A machine learning framework for sport result prediction</em>. Applied Computing and Informatics, 15(1), 27-33.
                    </p>
                    <a 
                      href="https://doi.org/10.1016/j.aci.2017.09.005" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      doi.org/10.1016/j.aci.2017.09.005
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Reference 7 */}
                  <div className="border-l-2 border-violet-500/30 pl-4">
                    <span className="text-violet-400 text-xs font-mono">[7]</span>
                    <p className="text-zinc-300 text-sm mt-1">
                      arXiv.org. (2024). <em>Rezultati pretrage za &quot;sports prediction machine learning&quot;</em>. Cornell University.
                    </p>
                    <a 
                      href="https://arxiv.org/search/?query=sports+prediction+machine+learning&searchtype=all" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      arxiv.org/search - 147+ indeksiranih radova
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  <p className="text-zinc-500 text-xs">
                    <strong className="text-zinc-400">Poslednje ažurirano:</strong> 8. februar 2026. 
                    Sve tržišne projekcije su procene zasnovane na objavljenim istraživanjima. 
                    Akademske citacije prate APA format. Ako citirate ovu stranicu, molimo referencirajte kao:
                  </p>
                  <p className="text-zinc-400 text-xs mt-2 font-mono bg-white/5 p-2 rounded">
                    SportBot AI. (2026). Tradicionalno Klađenje vs AI Predikcije: Statistika Tržišta 2026. 
                    Preuzeto sa https://www.sportbotai.com/sr/stats/tradicionalno-kladjenje-vs-ai-predikcije
                  </p>
                </div>
              </div>
            </section>

            {/* CTA Sekcija */}
            <section className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-2xl p-8 border border-violet-500/30 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                Iskusite AI Sportsku Analizu
              </h3>
              <p className="text-zinc-300 mb-6 max-w-xl mx-auto">
                SportBot AI kombinuje mašinsko učenje sa real-time podacima za identifikaciju tržišnih neefikasnosti. 
                Isprobajte naš sistem detekcije vrednosti—besplatna analiza dostupna.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/sr/matches" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-xl transition-colors"
                >
                  Analiziraj Besplatno
                </Link>
                <Link 
                  href="/sr/about" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors"
                >
                  Saznaj Više
                </Link>
              </div>
            </section>

          </div>
        </article>

        {/* Disclaimer */}
        <section className="py-8 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-zinc-500 text-xs text-center">
              <strong className="text-zinc-400">Odricanje od odgovornosti:</strong> Ova stranica je samo u informativne i edukativne svrhe. 
              Sportsko klađenje uključuje rizik i nije pogodno za svakoga. Prošli rezultati ne garantuju buduće rezultate. 
              Uvek se kockajte odgovorno i u skladu sa svojim mogućnostima. Ako imate problem sa kockanjem, potražite pomoć na{' '}
              <a href="https://www.begambleaware.org" className="text-violet-400 hover:underline" target="_blank" rel="noopener noreferrer">
                BeGambleAware.org
              </a>.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

// Definicije Komponenti
function StatCard({ value, label, source }: { value: string; label: string; source: string }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-zinc-400 mb-2">{label}</div>
      <div className="text-[10px] text-zinc-600">{source}</div>
    </div>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-8">
      <span className="text-3xl sm:text-4xl font-bold text-violet-500/30">{number}</span>
      <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
    </div>
  );
}

function TableRow({ year, size, growth, highlight }: { year: string; size: string; growth: string; highlight?: boolean }) {
  return (
    <tr className={highlight ? 'bg-violet-500/5' : ''}>
      <td className={`px-6 py-4 text-sm ${highlight ? 'text-white font-medium' : 'text-white'}`}>{year}</td>
      <td className={`px-6 py-4 text-sm ${highlight ? 'text-white font-medium' : 'text-white'}`}>{size}</td>
      <td className="px-6 py-4 text-sm text-emerald-400">{growth}</td>
    </tr>
  );
}

function Challenge({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <div>
        <div className="text-white font-medium text-sm">{title}</div>
        <div className="text-zinc-400 text-sm">{description}</div>
      </div>
    </div>
  );
}

function ComparisonRow({ metric, traditional, ai, winner }: { metric: string; traditional: string; ai: string; winner: 'traditional' | 'ai' | 'neutral' }) {
  return (
    <tr>
      <td className="px-6 py-4 text-sm text-white">{metric}</td>
      <td className={`px-6 py-4 text-sm ${winner === 'traditional' ? 'text-amber-400 font-medium' : 'text-zinc-400'}`}>
        {traditional}
        {winner === 'traditional' && ' ✓'}
      </td>
      <td className={`px-6 py-4 text-sm ${winner === 'ai' ? 'text-violet-400 font-medium' : 'text-zinc-400'}`}>
        {ai}
        {winner === 'ai' && ' ✓'}
      </td>
    </tr>
  );
}

function TrendCard({ icon, title, description, timeline }: { icon: string; title: string; description: string; timeline: string }) {
  const icons: Record<string, JSX.Element> = {
    brain: (
      <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
    bolt: (
      <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    link: (
      <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    device: (
      <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  };
  
  return (
    <div className="bg-white/[0.02] rounded-xl p-6 border border-white/5">
      <div className="mb-3">{icons[icon] || null}</div>
      <h4 className="text-white font-semibold mb-2">{title}</h4>
      <p className="text-zinc-400 text-sm mb-3">{description}</p>
      <span className="inline-block px-2 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-md">
        {timeline}
      </span>
    </div>
  );
}
