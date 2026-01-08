import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL = 'https://www.sportbotai.com';

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  // Core Product Pages
  { path: '', priority: 1, changeFreq: 'daily' as const },
  { path: '/matches', priority: 0.95, changeFreq: 'hourly' as const },
  { path: '/ai-desk', priority: 0.95, changeFreq: 'hourly' as const },
  
  // News Section (Google News eligible)
  { path: '/news', priority: 0.95, changeFreq: 'hourly' as const },
  
  // Content & Conversion
  { path: '/blog', priority: 0.85, changeFreq: 'daily' as const },
  { path: '/partners', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/pricing', priority: 0.8, changeFreq: 'monthly' as const },
  { path: '/contact', priority: 0.6, changeFreq: 'monthly' as const },
  
  // Legal & Compliance
  { path: '/responsible-gambling', priority: 0.5, changeFreq: 'monthly' as const },
  { path: '/terms', priority: 0.3, changeFreq: 'yearly' as const },
  { path: '/privacy', priority: 0.3, changeFreq: 'yearly' as const },
  
  // AI/LLM Discovery Files
  { path: '/llms.txt', priority: 0.4, changeFreq: 'monthly' as const },
  { path: '/llms-full.txt', priority: 0.4, changeFreq: 'monthly' as const },
];

// Serbian static pages
const SERBIAN_STATIC_PAGES = [
  { path: '/sr', priority: 0.9, changeFreq: 'daily' as const },
  { path: '/sr/matches', priority: 0.9, changeFreq: 'hourly' as const },
  { path: '/sr/ai-desk', priority: 0.9, changeFreq: 'hourly' as const },
  { path: '/sr/news', priority: 0.9, changeFreq: 'hourly' as const },
  { path: '/sr/blog', priority: 0.8, changeFreq: 'daily' as const },
  { path: '/sr/pricing', priority: 0.75, changeFreq: 'monthly' as const },
  { path: '/sr/analyzer', priority: 0.8, changeFreq: 'weekly' as const },
  { path: '/sr/market-alerts', priority: 0.75, changeFreq: 'daily' as const },
  { path: '/sr/login', priority: 0.5, changeFreq: 'monthly' as const },
  { path: '/sr/register', priority: 0.5, changeFreq: 'monthly' as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();
  
  // Build static pages (English)
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(page => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changeFreq,
    priority: page.priority,
  }));

  // Build static pages (Serbian)
  const serbianStaticEntries: MetadataRoute.Sitemap = SERBIAN_STATIC_PAGES.map(page => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changeFreq,
    priority: page.priority,
  }));

  // Fetch published blog posts for dynamic sitemap
  // Exclude match previews - those go to /news instead
  let blogEntries: MetadataRoute.Sitemap = [];
  let serbianBlogEntries: MetadataRoute.Sitemap = [];
  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: { 
        status: 'PUBLISHED',
        publishedAt: { not: null },
        // Exclude match previews and news - they go to /news section
        NOT: {
          OR: [
            { category: 'Match Previews' },
            { postType: 'MATCH_PREVIEW' },
            { postType: 'NEWS' },
          ],
        },
      },
      select: {
        slug: true,
        slugSr: true,
        titleSr: true,
        updatedAt: true,
        publishedAt: true,
        translatedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 100,
    });

    // English blog entries
    blogEntries = blogPosts.map(post => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt?.toISOString() || post.publishedAt?.toISOString() || currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Serbian blog entries (only translated posts)
    serbianBlogEntries = blogPosts
      .filter(post => post.titleSr)
      .map(post => ({
        url: `${BASE_URL}/sr/blog/${post.slug}`,
        lastModified: post.translatedAt?.toISOString() || post.updatedAt?.toISOString() || currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.65,
      }));
  } catch (error) {
    console.error('[Sitemap] Error fetching blog posts:', error);
  }

  // Fetch news articles (match previews)
  let newsEntries: MetadataRoute.Sitemap = [];
  let serbianNewsEntries: MetadataRoute.Sitemap = [];
  try {
    const newsArticles = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null },
        // News = Match Previews category OR MATCH_PREVIEW/NEWS postType
        OR: [
          { category: 'Match Previews' },
          { postType: 'MATCH_PREVIEW' },
          { postType: 'NEWS' },
        ],
      },
      select: {
        slug: true,
        slugSr: true,
        titleSr: true,
        updatedAt: true,
        publishedAt: true,
        translatedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    });

    // English news entries
    newsEntries = newsArticles.map(article => ({
      url: `${BASE_URL}/news/${article.slug}`,
      lastModified: article.updatedAt?.toISOString() || article.publishedAt?.toISOString() || currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    // Serbian news entries (only translated)
    serbianNewsEntries = newsArticles
      .filter(article => article.titleSr)
      .map(article => ({
        url: `${BASE_URL}/sr/news/${article.slug}`,
        lastModified: article.translatedAt?.toISOString() || article.updatedAt?.toISOString() || currentDate,
        changeFrequency: 'daily' as const,
        priority: 0.75,
      }));
  } catch (error) {
    console.error('[Sitemap] Error fetching news articles:', error);
  }

  const teamEntries: MetadataRoute.Sitemap = [];

  return [
    ...staticEntries, 
    ...serbianStaticEntries,
    ...newsEntries, 
    ...serbianNewsEntries,
    ...blogEntries, 
    ...serbianBlogEntries,
    ...teamEntries,
  ];
}
