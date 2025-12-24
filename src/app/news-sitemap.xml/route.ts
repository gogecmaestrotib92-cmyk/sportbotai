import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour

export async function GET() {
  const baseUrl = 'https://www.sportbotai.com';

  // Get articles from the last 2 days (Google News sitemap requirement)
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const articles = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      postType: {
        in: ['MATCH_PREVIEW', 'NEWS'],
      },
      publishedAt: {
        gte: twoDaysAgo,
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 1000, // Google News sitemap limit
    select: {
      slug: true,
      title: true,
      publishedAt: true,
      sport: true,
    },
  });

  // Map sport to Google News keywords
  const sportKeywords: Record<string, string> = {
    soccer: 'Soccer, Football',
    basketball: 'Basketball, NBA',
    football: 'American Football, NFL',
    baseball: 'Baseball, MLB',
    hockey: 'Hockey, NHL',
    tennis: 'Tennis',
    mma: 'MMA, UFC, Mixed Martial Arts',
    boxing: 'Boxing',
  };

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${articles
  .map((article) => {
    const pubDate = article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : new Date().toISOString();
    const keywords = article.sport
      ? sportKeywords[article.sport.toLowerCase()] || article.sport
      : 'Sports';

    return `  <url>
    <loc>${baseUrl}/news/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>SportBot AI</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      <news:keywords>${keywords}</news:keywords>
    </news:news>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
