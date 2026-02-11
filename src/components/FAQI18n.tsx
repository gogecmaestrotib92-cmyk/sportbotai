/**
 * FAQ Component - Serbian Version
 * 
 * Serbian translation of the FAQ section using translation system.
 */

'use client';

import FAQ, { FAQItem } from './FAQ';
import { TranslationsType } from '@/lib/i18n/translations';

interface FAQI18nProps {
  t: TranslationsType;
}

export default function FAQI18n({ t }: FAQI18nProps) {
  // Serbian FAQ data - translated from English homepage FAQ
  const faqItems: FAQItem[] = [
    {
      question: "Šta je SportBot AI?",
      answer: "SportBot AI pretvara 2 sata istraživanja pre meča u 60 sekundi. Naš AI ukršta formu timova, povrede, kvote od 50+ kladionica i istorijske podatke — pa ti kaže tačno gde tržište možda greši."
    },
    {
      question: "Kako će mi pomoći?",
      answer: "Ako si ikad proveo subotnje jutro čitajući izveštaje o povredama, proveravajući postave i upoređujući kvote po sajtovima — to je ono što naš AI radi jednim klikom. Navijači ga koriste za pripremu pre meča. Kreatori sadržaja za instant istraživanje. Analitičari za brže pronalaženje prednosti."
    },
    {
      question: "Da li je ovo tipster servis?",
      answer: "Ne. Ne dajemo tikete niti ti govorimo šta da igraš. SportBot AI je analitički alat koji ti pokazuje podatke, verovatnoće i gde kvote izgledaju pogrešno — a ti odlučuješ šta ćeš s tim."
    },
    {
      question: "Koje sportove pokrivate?",
      answer: "4 sporta u 20+ liga: Fudbal (Premijer Liga, La Liga, Serija A, Bundesliga, Liga Šampiona i više), Košarka (NBA, Evroliga), Američki Fudbal (NFL, NCAA) i Hokej (NHL). Ako postoji meč sa kvotama, naš AI ga može analizirati."
    },
    {
      question: "Koliko košta?",
      answer: "Besplatno za probu (1 analiza). Pro je $0.66/dan ($19.99/mesečno) za 10 dnevnih analiza i 50 AI pitanja. Premium je $1.66/dan za neograničeno sve plus Alarme za Prednosti. Otkaži kad hoćeš, bez ugovora."
    },
    {
      question: "Kako da otkažem svoj plan?",
      answer: "Jedan klik iz postavki naloga. Bez ugovora, bez naknada za otkazivanje, bez komplikacija. Zadržavaš pristup do kraja perioda naplate."
    },
  ];

  return (
    <FAQ 
      items={faqItems} 
      title={t.pricingPage.faqTitle}
      label="Podrška"
    />
  );
}
