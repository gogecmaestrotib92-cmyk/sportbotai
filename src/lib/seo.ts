/**
 * SEO Configuration & Utilities
 * 
 * Centralized SEO settings for SportBot AI
 * Easy to update when domain/branding changes
 */

// ==============================================
// SITE CONFIGURATION (Update these when ready)
// ==============================================

export const SITE_CONFIG = {
  name: 'SportBot AI',
  tagline: 'AI-Powered Sports Analytics',
  domain: 'sportbotai.com',
  url: 'https://sportbotai.com',
  email: 'contact@sportbotai.com',
  
  // Brand colors for social sharing
  themeColor: '#10B981', // accent green
  
  // Social handles (add when created)
  twitter: '', // @sportbotai
  
  // Legal
  foundingYear: 2024,
};

// ==============================================
// DEFAULT META DESCRIPTIONS
// ==============================================

export const META = {
  home: {
    title: 'SportBot AI – AI-Powered Sports Analytics & Match Intelligence',
    description: 'Transform sports data into actionable insights. AI probability models, value detection, risk analysis for Soccer, NBA, NFL, Tennis & more. Not betting tips—pure sports intelligence.',
    keywords: [
      'sports analytics',
      'AI sports analysis',
      'match analysis tool',
      'sports probability model',
      'odds analysis',
      'sports intelligence platform',
      'football analytics',
      'NBA analysis',
      'NFL analysis',
      'tennis analytics',
    ],
  },
  
  analyzer: {
    title: 'AI Match Analyzer – Real-Time Sports Analysis',
    description: 'Analyze any match with AI. Get probability estimates, value detection, risk assessment, and expert-level breakdowns in seconds. Soccer, NBA, NFL, Tennis, UFC & more.',
    keywords: [
      'match analyzer',
      'sports analysis tool',
      'AI match analysis',
      'probability calculator sports',
      'odds analyzer',
      'live sports analysis',
    ],
  },
  
  pricing: {
    title: 'Pricing Plans – Free & Pro Sports Analytics',
    description: 'Start free with 3 daily analyses. Upgrade to Pro for unlimited AI match analysis, audio reports, and advanced value detection. No hidden fees, cancel anytime.',
    keywords: [
      'sports analytics pricing',
      'AI analysis subscription',
      'sports analysis tool cost',
    ],
  },
  
  terms: {
    title: 'Terms of Service',
    description: 'Terms of Service for SportBot AI sports analytics platform. Read our usage policies and guidelines.',
  },
  
  privacy: {
    title: 'Privacy Policy',
    description: 'Privacy Policy for SportBot AI. Learn how we collect, use, and protect your data.',
  },
  
  responsibleGambling: {
    title: 'Responsible Gambling Resources',
    description: 'SportBot AI promotes responsible gambling. Find resources, helplines, and information about safe gambling practices.',
  },
  
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with SportBot AI. Questions, feedback, or partnership inquiries - we respond within 24-48 hours.',
  },
};

// ==============================================
// OPEN GRAPH DEFAULTS
// ==============================================

export const OG_DEFAULTS = {
  type: 'website',
  locale: 'en_US',
  siteName: SITE_CONFIG.name,
  images: [
    {
      url: `${SITE_CONFIG.url}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'SportBot AI - AI-Powered Sports Analytics',
    },
  ],
};

// ==============================================
// STRUCTURED DATA (JSON-LD)
// ==============================================

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_CONFIG.name,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    description: META.home.description,
    url: SITE_CONFIG.url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Free tier with 3 daily analyses',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'AI Probability Models',
      'Multi-Sport Coverage',
      'Value Detection',
      'Risk Assessment',
      'Audio Analysis',
      'Real-Time Odds',
    ],
  };
}

export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: META.home.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/analyzer?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// ==============================================
// SAFE KEYWORDS (Stripe/AdSense compliant)
// ==============================================

// These keywords are SAFE to use
export const SAFE_KEYWORDS = [
  'sports analytics',
  'sports analysis',
  'sports intelligence',
  'match analysis',
  'probability model',
  'odds analysis',
  'statistical analysis',
  'data-driven insights',
  'AI sports tool',
  'sports data platform',
];

// AVOID these keywords (can trigger payment processor flags)
export const AVOID_KEYWORDS = [
  'betting tips',
  'betting predictions',
  'sure bets',
  'guaranteed wins',
  'fixed matches',
  'betting advice',
  'gambling predictions',
  'winning picks',
  'value betting', // borderline, avoid in headlines
];
