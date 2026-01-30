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
  domain: 'www.sportbotai.com',
  url: 'https://www.sportbotai.com',
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
    title: 'SportBot AI – AI Sports Analysis in 60 Seconds',
    description: 'Free AI-powered sports match analysis. Get data-driven predictions, probability estimates, and value detection for soccer, NBA, NFL matches. AI picks with accuracy you can trust.',
    keywords: [
      // 1. Primary Target: "ai picks soccer" cluster
      'ai picks soccer',
      'ai soccer predictions',
      'ai football prediction',
      'soccer prediction ai',
      'ai-powered soccer analysis',
      'data-driven soccer picks',
      
      // 2. The Power Keywords (High Volume, High Intent)
      'ai sports betting',
      'ai sports picks',
      'ai sports predictions',
      'ai betting predictions',
      'ai betting bot',
      'ai predictor',
      'free ai sports predictions',
      
      // 3. Match & Prediction focused
      'match prediction',
      'soccer match analysis',
      'football prediction tips',
      'ai predictions accuracy',
      
      // 4. Leagues (from NeuronWriter)
      'premier league predictions',
      'la liga ai picks',
      'bundesliga predictions',
      'ligue 1 predictions',
      
      // 5. Tech/Trust signals
      'data-driven betting',
      'ai analyze match',
      'betting trend analysis',
      'outcome prediction ai',
      
      // 6. Brand & Tech Authority
      'most accurate prediction site',
      'AI market edge',
      'predictive sports engine',
      'sports probability model'
    ],
  },
  
  matches: {
    title: 'AI Soccer Picks & Match Predictions – Live Analysis',
    description: 'Browse upcoming soccer matches with AI-powered predictions. Get data-driven football predictions for Premier League, La Liga, Bundesliga, Ligue 1. Accurate match analysis and betting tips.',
    keywords: [
      // Primary: ai picks soccer cluster
      'ai picks soccer',
      'soccer predictions today',
      'football prediction ai',
      'ai soccer tips',
      'match prediction accuracy',
      
      // Leagues
      'premier league predictions',
      'la liga ai picks',
      'bundesliga predictions',
      'ligue 1 predictions',
      'champions league tips',
      
      // Match/Analysis focused
      'upcoming matches',
      'live sports analysis',
      'match analyzer',
      'data-driven picks',
      'ai analyze soccer',
      'football betting trends',
      'outcome predictions',
      
      // Sports variety
      'NBA ai predictions',
      'NFL analysis tool',
      
      // Trust signals
      'accurate soccer predictions',
      'ai-powered analysis',
      'sports probability model',
    ],
  },
  
  aiDesk: {
    title: 'AI Sports Desk – Real-Time Intelligence Feed',
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
      // AI Assistant Keywords
      'ChatGPT for sports',
      'AI sports research bot',
      'automated sports researcher',
      'real-time match insights',
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
      // Tech/Model Keywords
      'AI prediction software',
      'machine learning odds',
      'neural network sports model',
      'market value finder',
      'advanced sports statistics',
    ],
  },
  
  blog: {
    title: 'Sports Analytics Blog – Insights & Guides',
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
    title: 'Pricing – Free Trial & Pro Sports Analytics',
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
      ratingValue: 4.8,
      ratingCount: 150,
      bestRating: 5,
      worstRating: 1,
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
      'Probability models for 4 major sports',
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
      description: 'Free access to live sports intelligence feed',
      availability: 'https://schema.org/InStock',
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
      ratingValue: 4.8,
      reviewCount: 150,
    },
  };
}

// ==============================================
// HOMEPAGE FAQ SCHEMA (Optimized for AI Search / ChatGPT)
// ==============================================

export function getHomepageFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is SportBot AI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SportBot AI is a free AI-powered sports analysis platform that helps you find where the market is wrong. It provides probability estimates, value detection, and edge identification for Soccer, NBA, NFL, Tennis, UFC and more.'
        },
      },
      {
        '@type': 'Question',
        name: 'Is SportBot AI free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! SportBot AI offers a free tier with 1 match analysis per day. Pro and Premium plans are available for users who need more analyses and advanced features.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does AI sports analysis work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SportBot AI uses machine learning models trained on historical match data, team form, injuries, head-to-head records, and real-time odds from 40+ bookmakers to generate probability estimates and identify value opportunities.',
        },
      },
      {
        '@type': 'Question',
        name: 'What sports does SportBot AI cover?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SportBot AI covers 7+ major sports including Soccer (Premier League, La Liga, Champions League, etc.), NBA, NFL, NHL, Tennis, UFC/MMA, and more. We analyze matches from leagues worldwide.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is SportBot AI a tipster service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. SportBot AI is an educational analytics tool, not a tipster service. We provide data-driven insights and probability models to help you understand matches better - we don\'t guarantee outcomes or tell you what to bet.',
        },
      },
      {
        '@type': 'Question',
        name: 'How accurate is SportBot AI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SportBot AI provides probability estimates based on statistical models and real-time data. Like any analytical tool, accuracy varies. We focus on helping you understand the factors that influence match outcomes rather than guaranteeing predictions.',
        },
      },
    ],
  };
}

// ==============================================
// BREADCRUMB SCHEMA
// ==============================================

export interface BreadcrumbItem {
  name: string;
  url?: string; // Optional for last item (current page)
}

/**
 * Generate BreadcrumbList schema for any page
 * Usage: getBreadcrumbSchema([
 *   { name: 'Home', url: '/' },
 *   { name: 'Blog', url: '/blog' },
 *   { name: 'Article Title' }
 * ])
 */
export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: `${SITE_CONFIG.url}${item.url}` }),
    })),
  };
}

// Pre-built breadcrumbs for common pages
export function getHomeBreadcrumb() {
  return getBreadcrumbSchema([{ name: 'Home' }]);
}

export function getBlogBreadcrumb() {
  return getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog' },
  ]);
}

export function getBlogPostBreadcrumb(title: string, category?: string) {
  const items: BreadcrumbItem[] = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
  ];
  if (category) {
    items.push({ name: category, url: `/blog?category=${encodeURIComponent(category)}` });
  }
  items.push({ name: title });
  return getBreadcrumbSchema(items);
}

export function getPricingBreadcrumb() {
  return getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Pricing' },
  ]);
}

export function getMatchesBreadcrumb() {
  return getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Matches' },
  ]);
}

export function getAIDeskBreadcrumb() {
  return getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'AI Sports Desk' },
  ]);
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
