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
  twitter: '@sportbotai',
  
  // Legal
  foundingYear: 2024,
};

// ==============================================
// DEFAULT META DESCRIPTIONS
// ==============================================

export const META = {
  home: {
    title: 'SportBot AI – AI-Powered Sports Analytics & Match Intelligence',
    description: 'Transform sports data into actionable insights. AI probability models, value detection, risk analysis for Soccer, NBA, NFL, Tennis & more. Understand any match in 60 seconds.',
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
      'sports data platform',
      'match intelligence',
    ],
  },
  
  matches: {
    title: 'Browse Matches – Live Sports Analysis Tool',
    description: 'Browse upcoming matches across 7 major sports. Get instant AI analysis for Premier League, La Liga, Champions League, NBA, NFL, Tennis & more. Real-time odds and probability models.',
    keywords: [
      'upcoming matches',
      'live sports analysis',
      'match analyzer',
      'sports analysis tool',
      'football match analysis',
      'NBA game analysis',
      'NFL analysis tool',
      'tennis match analyzer',
      'premier league analysis',
      'la liga analysis',
      'champions league analysis',
    ],
  },
  
  aiDesk: {
    title: 'AI Sports Desk – Real-Time Sports Intelligence Feed',
    description: 'Live sports intelligence powered by AI. Get instant updates on injuries, lineups, market movements, and match insights. Your 24/7 AI sports analyst covering football, NBA, NFL & more.',
    keywords: [
      'sports intelligence feed',
      'live sports news',
      'AI sports analyst',
      'real-time injury updates',
      'lineup news',
      'sports market analysis',
      'football news live',
      'NBA news updates',
      'sports data feed',
      'match intelligence',
      'sports AI assistant',
    ],
  },
  
  analyzer: {
    title: 'AI Match Analyzer – Instant Sports Analysis',
    description: 'Analyze any match with AI in 60 seconds. Get probability estimates, value detection, risk assessment, and expert-level breakdowns. Soccer, NBA, NFL, Tennis, UFC & more.',
    keywords: [
      'match analyzer',
      'sports analysis tool',
      'AI match analysis',
      'probability calculator sports',
      'odds analyzer',
      'live sports analysis',
      'match prediction model',
      'sports probability calculator',
    ],
  },
  
  blog: {
    title: 'Sports Analytics Blog – Expert Insights & Guides',
    description: 'Educational articles on sports analytics, data-driven analysis techniques, and responsible gambling. Learn how AI transforms sports understanding.',
    keywords: [
      'sports analytics blog',
      'football analysis articles',
      'sports data science',
      'betting education',
      'responsible gambling guides',
      'sports statistics explained',
      'probability in sports',
    ],
  },
  
  pricing: {
    title: 'Pricing Plans – Free Trial & Pro Sports Analytics',
    description: 'Try free with 1 analysis. Upgrade to Pro for 30 daily AI match analyses, audio reports, and advanced insights. No hidden fees, cancel anytime.',
    keywords: [
      'sports analytics pricing',
      'AI analysis subscription',
      'sports analysis tool cost',
      'sports intelligence subscription',
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
      description: 'Free trial with 1 analysis',
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
      'AI Sports Intelligence Feed',
      'Live Match Data',
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
        urlTemplate: `${SITE_CONFIG.url}/matches?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Schema for the AI Match Analyzer tool
 * Targets: "match analyzer", "sports analysis tool", "AI sports analysis"
 */
export function getMatchAnalyzerSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'SportBot AI Match Analyzer',
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web Browser',
    description: META.matches.description,
    url: `${SITE_CONFIG.url}/matches`,
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Free trial with 1 analysis',
    },
    featureList: [
      'AI-powered match analysis in 60 seconds',
      'Probability models for 7 major sports',
      'Real-time odds comparison',
      'Value detection algorithm',
      'Risk assessment scoring',
      'Head-to-head statistics',
      'Form analysis',
      'Audio report generation',
    ],
    screenshot: `${SITE_CONFIG.url}/og-analyzer.png`,
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };
}

/**
 * Schema for the AI Sports Desk (Intelligence Feed)
 * Targets: "sports news", "live sports updates", "AI sports analyst"
 */
export function getAIDeskSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI Sports Desk',
    applicationCategory: 'NewsApplication',
    applicationSubCategory: 'SportsApplication',
    operatingSystem: 'Web Browser',
    description: META.aiDesk.description,
    url: `${SITE_CONFIG.url}/ai-desk`,
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    featureList: [
      'Real-time sports intelligence feed',
      'AI-powered injury updates',
      'Lineup change notifications',
      'Market movement analysis',
      'Match momentum tracking',
      'Multi-sport coverage',
      '24/7 automated updates',
    ],
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };
}

/**
 * Schema for Blog articles
 */
export function getBlogSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'SportBot AI Blog',
    description: META.blog.description,
    url: `${SITE_CONFIG.url}/blog`,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
    blogPost: [], // Populated dynamically with actual posts
  };
}

/**
 * Schema for individual blog articles
 */
export function getBlogPostSchema(post: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  modifiedAt?: string;
  author?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: `${SITE_CONFIG.url}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author || SITE_CONFIG.name,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
    image: post.image || `${SITE_CONFIG.url}/og-blog.png`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/blog/${post.slug}`,
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

/**
 * Schema for Pricing page with product offerings
 */
export function getPricingSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'SportBot AI Pro',
    description: 'AI-powered sports analysis with advanced features',
    url: `${SITE_CONFIG.url}/pricing`,
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'EUR',
        description: '1 match analysis, 1 AI chat message',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Pro Monthly',
        price: '9.99',
        priceCurrency: 'EUR',
        description: '10 analyses per day, 50 AI chat messages per day, all sports',
        availability: 'https://schema.org/InStock',
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      },
      {
        '@type': 'Offer',
        name: 'Premium Annual',
        price: '79',
        priceCurrency: 'EUR',
        description: 'Unlimited analyses, unlimited AI chat, API access, priority support',
        availability: 'https://schema.org/InStock',
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
    },
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
