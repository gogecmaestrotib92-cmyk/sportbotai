import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sportbotai.com';

  return {
    rules: [
      // Googlebot-News - for Google News indexing
      {
        userAgent: 'Googlebot-News',
        allow: [
          '/news',
          '/news/*',
          '/api/og',
        ],
        disallow: [
          '/blog',  // Only index /news/ section for Google News
          '/admin/',
          '/account/',
        ],
      },
      // Twitterbot - MUST allow /api/og for social sharing images
      {
        userAgent: 'Twitterbot',
        allow: [
          '/',
          '/api/og',  // OG images for Twitter cards - CRITICAL
          '/news',
          '/news/*',
          '/blog',
          '/blog/*',
          '/matches',
        ],
        disallow: [
          '/admin/',
          '/account/',
          '/login',
          '/register',
        ],
      },
      // Default rules for all crawlers
      {
        userAgent: '*',
        allow: [
          '/',
          '/api/og',  // Allow OG images for social sharing
          '/news',
          '/news/*',
          '/news/feed.xml',  // RSS feed for Google News
          '/matches',
          '/ai-desk',
          '/blog',
          '/blog/*',
          '/team/*',
          '/pricing',
          '/contact',
          '/terms',
          '/privacy',
          '/responsible-gambling',
        ],
        disallow: [
          '/api/analyze',
          '/api/ai-chat',
          '/api/stripe',
          '/api/cron',
          '/api/admin',
          '/admin/',
          '/account/',
          '/history/',
          '/my-teams/',
          '/login',
          '/register',
          '/match/', // Dynamic match analysis pages (require auth)
          '/market-alerts/',
        ],
      },
      // Googlebot - allow faster crawling for main content
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/api/og',  // Allow OG images
          '/matches',
          '/ai-desk',
          '/blog/',
          '/team/',
          '/pricing',
        ],
        disallow: [
          '/api/analyze',
          '/api/ai-chat',
          '/api/stripe',
          '/api/cron',
          '/admin/',
          '/account/',
          '/login',
          '/register',
        ],
      },
      // Bingbot
      {
        userAgent: 'Bingbot',
        allow: ['/', '/api/og'],
        disallow: ['/api/analyze', '/api/ai-chat', '/api/stripe', '/admin/', '/account/'],
      },
      // =============================================
      // AI CRAWLER POLICY
      // =============================================
      // ALLOW: AI Search bots (appear in AI search results)
      // BLOCK: AI Training bots (protect content from training)

      // ChatGPT browsing mode - ALLOW (AI search visibility)
      {
        userAgent: 'ChatGPT-User',
        allow: [
          '/',
          '/news',
          '/news/*',
          '/blog',
          '/blog/*',
          '/matches',
          '/ai-desk',
          '/pricing',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
          '/login',
          '/register',
        ],
      },
      // OpenAI SearchBot - ALLOW (AI search visibility)
      {
        userAgent: 'OAI-SearchBot',
        allow: [
          '/',
          '/news',
          '/news/*',
          '/blog',
          '/blog/*',
          '/matches',
          '/ai-desk',
          '/pricing',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
        ],
      },
      // Perplexity AI - ALLOW (AI search visibility)
      {
        userAgent: 'PerplexityBot',
        allow: [
          '/',
          '/news',
          '/news/*',
          '/blog',
          '/blog/*',
          '/matches',
          '/ai-desk',
          '/pricing',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
        ],
      },
      // GPTBot - BLOCK (AI training, not search)
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      // CCBot (Common Crawl) - BLOCK (used for AI training)
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      // Anthropic Claude - BLOCK (AI training)
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      // Google-Extended (Gemini training) - BLOCK
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/news/sitemap.xml`,  // Google News sitemap
    ],
    host: baseUrl,
  };
}
