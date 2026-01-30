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
    answer: "SportBot AI is an AI-powered sports analytics platform that helps you find where the market is wrong. We provide real-time analysis including team form, injuries, key stats, and probability estimates — so you can spot edges and make smarter decisions."
  },
  {
    question: "How will it help me?",
    answer: "Whether you're a casual fan wanting to understand a match before watching, a content creator needing quick research, or someone who wants deeper sports insights — SportBot AI saves you hours of research by delivering AI-curated analysis instantly."
  },
  {
    question: "Is this a tipster service?",
    answer: "No. We don't give picks or tell you what to bet. SportBot AI is an educational tool that gives you understanding and context. You see the data, the analysis, and the insights — then you decide what it means for you."
  },
  {
    question: "What sports do you cover?",
    answer: "We cover all major sports including Premier League, La Liga, Serie A, Champions League, NBA, NFL, NHL, MLB, Euroleague Basketball, and many more. Our AI works across soccer, basketball, American football, hockey, and other popular leagues."
  },
  {
    question: "How much does SportBot AI cost?",
    answer: "We offer a free tier with basic match analysis, plus Pro and Premium plans for power users who want unlimited AI chat, market alerts, and advanced features. Check our pricing page for current plans."
  },
  {
    question: "How do I cancel my plan?",
    answer: "You can cancel anytime from your account settings. There are no long-term contracts — cancel whenever you want and you'll retain access until the end of your billing period."
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
    answer: "The Free plan includes 1 match analysis and 1 AI chat message to try out the platform before deciding to upgrade."
  },
  {
    question: "What's the difference between Pro and Premium?",
    answer: "Pro gives you unlimited match analyses and AI chat. Premium adds Market Alerts — our AI-powered system that detects value opportunities and market edges in real-time."
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
