// RSS Feed for Google News - /news/feed.xml
// This feed is specifically formatted for Google News Publisher Center

import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/lib/seo';

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  const baseUrl = SITE_CONFIG.url;

  // Get latest news articles (match previews)
  const articles = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      postType: { in: ['MATCH_PREVIEW', 'NEWS'] },
    },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      updatedAt: true,
      sport: true,
      league: true,
      homeTeam: true,
      awayTeam: true,
      tags: true,
      featuredImage: true,
      newsTitle: true, // News-friendly title (no "prediction", "tips")
    },
    orderBy: { publishedAt: 'desc' },
    take: 50, // Google News recommends max 50 items
  });

  // Build RSS XML
  const rssItems = articles.map((article) => {
    const pubDate = article.publishedAt
      ? new Date(article.publishedAt).toUTCString()
      : new Date(article.updatedAt).toUTCString();

    // Generate image URL
    let imageUrl = article.featuredImage || '';
    if (article.homeTeam && article.awayTeam && (!imageUrl || imageUrl.endsWith('.svg'))) {
      const ogParams = new URLSearchParams({
        home: article.homeTeam,
        away: article.awayTeam,
        league: article.league || 'Sports',
      });
      imageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
    }

    // Clean excerpt for RSS (remove HTML)
    const cleanExcerpt = article.excerpt
      .replace(/<[^>]*>/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .substring(0, 500);

    // Use newsTitle if available (journalistic style), fallback to blog title
    const displayTitle = article.newsTitle || article.title;
    const cleanTitle = displayTitle
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Category for Google News
    const category = article.league || article.sport || 'Sports';

    return `
    <item>
      <title>${cleanTitle}</title>
      <link>${baseUrl}/news/${article.slug}</link>
      <guid isPermaLink="true">${baseUrl}/news/${article.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${cleanExcerpt}]]></description>
      <category>${category}</category>
      ${article.tags.map((tag) => `<category>${tag}</category>`).join('\n      ')}
      <author>editorial@sportbotai.com (SportBot AI Editorial)</author>
      ${imageUrl ? `<enclosure url="${imageUrl}" type="image/png" length="0"/>` : ''}
      <media:content url="${imageUrl}" medium="image" type="image/png"/>
      <media:thumbnail url="${imageUrl}"/>
    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>SportBot AI - Sports News</title>
    <link>${baseUrl}/news</link>
    <description>Breaking sports news, match previews, and AI-powered analysis. Get the latest updates on NBA, NFL, Soccer, and more.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${articles[0]?.publishedAt ? new Date(articles[0].publishedAt).toUTCString() : new Date().toUTCString()}</pubDate>
    <ttl>15</ttl>
    <atom:link href="${baseUrl}/news/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>SportBot AI</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <copyright>Copyright ${new Date().getFullYear()} SportBot AI. All rights reserved.</copyright>
    <managingEditor>editorial@sportbotai.com (SportBot AI Editorial)</managingEditor>
    <webMaster>contact@sportbotai.com (SportBot AI)</webMaster>
    <category>Sports</category>
    <category>Sports News</category>
    <category>Match Previews</category>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
