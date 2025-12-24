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
          '/_next/',
          '/static/',
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
      // Block AI training crawlers
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/news-sitemap.xml`,  // Google News sitemap
    ],
    host: baseUrl,
  };
}
