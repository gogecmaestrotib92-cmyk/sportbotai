import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sportbotai.com';
  
  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: '*',
        allow: [
          '/',
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
          '/api/',
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
          '/matches',
          '/ai-desk',
          '/blog/',
          '/team/',
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
      // Bingbot
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/account/'],
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
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
