/**
 * FAQ Component
 * 
 * Props.Cash inspired accordion FAQ section.
 * Clean, minimal design with smooth expand/collapse animations.
 * Reusable - can accept custom FAQ items or use defaults.
 */

'use client';

import { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

// Default FAQ data for homepage
export const defaultFAQData: FAQItem[] = [
  {
    question: "What is SportBot AI?",
    answer: "SportBot AI turns 2 hours of pre-match research into 60 seconds. Our AI cross-references team form, injuries, odds from 50+ bookmakers, and historical data — then tells you exactly where the market might be wrong."
  },
  {
    question: "How will it help me?",
    answer: "If you've ever spent your Saturday morning reading injury reports, checking lineups, and comparing odds across sites — that's what our AI does in one click. Fans use it to prep for matches. Content creators use it for instant research. Analysts use it to spot edges faster."
  },
  {
    question: "Is this a tipster service?",
    answer: "No. We don't give picks or tell you what to bet. SportBot AI is an analytical tool that shows you data, probabilities, and where the odds look off — then you decide what to do with that information."
  },
  {
    question: "What sports do you cover?",
    answer: "4 sports across 20+ leagues: Soccer (Premier League, La Liga, Serie A, Bundesliga, Champions League & more), Basketball (NBA, EuroLeague), American Football (NFL, NCAA), and Hockey (NHL). If there's a match with odds, our AI can analyze it."
  },
  {
    question: "How much does it cost?",
    answer: "Free to try (1 analysis). Pro is $0.66/day ($19.99/month) for 10 daily analyses and 50 AI questions. Premium is $1.66/day for unlimited everything plus Edge Alerts. Cancel anytime, no contracts."
  },
  {
    question: "How do I cancel my plan?",
    answer: "One click from your account settings. No contracts, no cancellation fees, no hoops to jump through. You keep access until your billing period ends."
  },
];

// Pricing-specific FAQ data
export const pricingFAQData: FAQItem[] = [
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel your subscription at any time. There are no fixed-term contracts. Access remains active until the end of the paid period."
  },
  {
    question: "What payment methods are supported?",
    answer: "We accept all major cards (Visa, Mastercard, Amex) through the secure Stripe payment system."
  },
  {
    question: "Are analyses a guarantee of winnings?",
    answer: "No. SportBot AI is an analytical tool that provides estimates based on available data. Sports betting always carries risk and we cannot guarantee any outcome."
  },
  {
    question: "What do I get with the Free plan?",
    answer: "One full match analysis and one AI chat message — enough to see exactly what you'd get with Pro, no credit card needed."
  },
  {
    question: "What's the difference between Pro and Premium?",
    answer: "Pro ($0.66/day) gives you 10 analyses and 50 AI questions daily — enough for a full weekend of matches. Premium ($1.66/day) removes all limits and adds Edge Alerts that notify you when our AI spots a value opportunity in real time."
  },
  {
    question: "Is there a refund policy?",
    answer: "Due to the digital nature of our service, we don't offer refunds. However, you can try our free tier before committing to a paid plan to make sure it's right for you."
  },
];

function FAQAccordionItem({ item, isOpen, onToggle }: { 
  item: FAQItem; 
  isOpen: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className={`font-semibold text-base sm:text-lg transition-colors ${isOpen ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
          {item.question}
        </span>
        <span className={`ml-4 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
          <svg 
            className={`w-5 h-5 ${isOpen ? 'text-accent' : 'text-gray-500'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed pr-8">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

interface FAQProps {
  items?: FAQItem[];
  title?: string;
  label?: string;
  showCard?: boolean;
}

export default function FAQ({ 
  items = defaultFAQData, 
  title = "FAQ",
  label = "Support",
  showCard = true
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const content = (
    <>
      {items.map((item, index) => (
        <FAQAccordionItem
          key={index}
          item={item}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
        />
      ))}
    </>
  );

  return (
    <section className="py-16 sm:py-24 bg-bg-primary relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-accent text-xs font-semibold uppercase tracking-wider mb-2 block">
            {label}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h2>
        </div>

        {/* Accordion */}
        {showCard ? (
          <div className="card-glass rounded-2xl p-6 sm:p-8">
            {content}
          </div>
        ) : (
          <div className="px-2">
            {content}
          </div>
        )}
      </div>
    </section>
  );
}
