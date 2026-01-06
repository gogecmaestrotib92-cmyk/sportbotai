// News listing page - /news
// This section serves match previews as time-sensitive news for Google News eligibility

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Sports News - Latest Match Previews & Analysis | SportBot AI',
  description: 'Breaking sports news, match previews, and AI-powered analysis. Get the latest updates on NBA, NFL, Soccer, and more with real-time insights.',
  keywords: 'sports news, match previews, NBA news, NFL news, soccer news, sports analysis, breaking sports news',
  openGraph: {
    title: 'Sports News - Latest Match Previews & Analysis | SportBot AI',
    description: 'Breaking sports news, match previews, and AI-powered analysis. Get the latest updates on NBA, NFL, Soccer, and more.',
    url: `${SITE_CONFIG.url}/news`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sports News | SportBot AI',
    description: 'Breaking sports news and AI-powered match analysis.',
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/news`,
    languages: {
      'en': '/news',
      'sr': '/sr/news',
      'x-default': '/news',
    },
    types: {
      'application/rss+xml': `${SITE_CONFIG.url}/news/feed.xml`,
    },
  },
};

// Force dynamic rendering - always show latest posts
export const dynamic = 'force-dynamic';

interface NewsPageProps {
  searchParams: Promise<{
    page?: string;
    sport?: string;
  }>;
}

interface NewsItem {
  id: string;
  title: string;
  newsTitle: string | null;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  imageAlt: string | null;
  sport: string | null;
  league: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  matchDate: Date | null;
  publishedAt: Date | null;
  views: number;
}

const SPORTS_FILTERS = [
  { key: 'all', label: 'All Sports' },
  { key: 'basketball', label: 'Basketball' },
  { key: 'football', label: 'Football' },
  { key: 'soccer', label: 'Soccer' },
  { key: 'americanfootball', label: 'NFL' },
  { key: 'baseball', label: 'Baseball' },
  { key: 'icehockey', label: 'Hockey' },
  { key: 'tennis', label: 'Tennis' },
];

async function getNewsArticles(page: number, sport?: string) {
  const limit = 12;
  const skip = (page - 1) * limit;

  // News section shows match previews - time-sensitive content
  const where: Record<string, unknown> = {
    status: 'PUBLISHED',
    postType: { in: ['MATCH_PREVIEW', 'NEWS'] },
  };

  if (sport && sport !== 'all') {
    where.sport = { contains: sport, mode: 'insensitive' };
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        newsTitle: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        imageAlt: true,
        sport: true,
        league: true,
        homeTeam: true,
        awayTeam: true,
        matchDate: true,
        publishedAt: true,
        views: true,
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    }) as Promise<NewsItem[]>,
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const sport = params.sport;

  const { posts, pagination } = await getNewsArticles(page, sport);

  // WebPage structured data for news section
  const newsListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Sports News | SportBot AI',
    description: 'Breaking sports news and match previews with AI-powered analysis',
    url: `${SITE_CONFIG.url}/news`,
    publisher: {
      '@type': 'Organization',
      name: 'SportBot AI',
      url: SITE_CONFIG.url,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 relative">
      {/* Glass morphism overlay with newspaper texture */}
      <div 
        className="absolute inset-0 bg-white/40 z-0"
        style={{
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E"),
            radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, 3px 3px'
        }}
      />
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsListSchema) }}
      />

      {/* Header */}
      <section className="py-12 md:py-16 border-b border-slate-300/50 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full mb-6">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-medium">Live Sports News</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Sports <span className="text-emerald-600">News</span>
            </h1>
            <p className="text-lg text-slate-700">
              Breaking match previews, injury updates, and AI-powered analysis
            </p>
            {/* RSS Feed Link */}
            <Link
              href="/news/feed.xml"
              className="inline-flex items-center gap-2 mt-4 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" />
              </svg>
              RSS Feed
            </Link>
          </div>
        </div>
      </section>

      {/* Sport Filters */}
      <section className="py-6 sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-300/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {SPORTS_FILTERS.map((filter) => (
              <Link
                key={filter.key}
                href={filter.key === 'all' ? '/news' : `/news?sport=${filter.key}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (sport === filter.key || (!sport && filter.key === 'all'))
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:border-emerald-600 hover:text-emerald-700'
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* News Articles */}
      <section className="py-8 relative z-10">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-600 text-lg">No news articles found.</p>
              <p className="text-slate-500 mt-2">Check back soon for updates!</p>
            </div>
          ) : (
            <>
              {/* Featured Article (First) */}
              {posts[0] && (
                <article className="mb-8">
                  <Link href={`/news/${posts[0].slug}`} className="group block">
                    <div className="grid md:grid-cols-5 gap-6 bg-white rounded-2xl overflow-hidden border-2 border-slate-900/20 hover:border-emerald-600/60 transition-all hover:shadow-2xl shadow-lg">
                      {/* Image container - 2 columns on md+ */}
                      <div className="md:col-span-2 aspect-[4/3] md:aspect-auto relative bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center p-4 min-h-[200px] md:min-h-[280px]">
                        {posts[0].featuredImage ? (
                          <Image
                            src={posts[0].featuredImage}
                            alt={posts[0].imageAlt || posts[0].title}
                            fill
                            className="object-contain p-2"
                            priority
                          />
                        ) : (
                          <span className="text-6xl opacity-50">📰</span>
                        )}
                      </div>
                      {/* Content - 3 columns on md+ */}
                      <div className="md:col-span-3 p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-3">
                          {posts[0].league && (
                            <span className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-full">
                              {posts[0].league}
                            </span>
                          )}
                          <span className="text-slate-500 text-sm">
                            {posts[0].publishedAt && formatTimeAgo(new Date(posts[0].publishedAt))}
                          </span>
                          <span className="text-slate-400 text-sm flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {posts[0].views}
                          </span>
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                          {posts[0].newsTitle || posts[0].title}
                        </h2>
                        <p className="text-slate-600 line-clamp-2 md:line-clamp-3 mb-4 text-sm md:text-base">
                          {posts[0].excerpt}
                        </p>
                        {posts[0].matchDate && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Match: {new Date(posts[0].matchDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              )}

              {/* News Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(1).map((post) => (
                  <article
                    key={post.id}
                    className="group bg-white rounded-xl overflow-hidden border-2 border-slate-900/20 hover:border-emerald-600/60 transition-all hover:shadow-xl shadow-lg"
                  >
                    <Link href={`/news/${post.slug}`}>
                      <div className="aspect-video relative bg-gradient-to-br from-slate-200 to-slate-300">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.imageAlt || post.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl opacity-50">📰</span>
                          </div>
                        )}
                        {/* Time Badge */}
                        {post.publishedAt && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs text-white">
                            {formatTimeAgo(new Date(post.publishedAt))}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {post.league && (
                          <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-xs font-semibold rounded mb-2">
                            {post.league}
                          </span>
                        )}
                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">
                          {post.newsTitle || post.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{post.views} views</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  {page > 1 && (
                    <Link
                      href={`/news?page=${page - 1}${sport ? `&sport=${sport}` : ''}`}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:border-emerald-600 hover:text-emerald-700"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-slate-600">
                    Page {page} of {pagination.totalPages}
                  </span>
                  {page < pagination.totalPages && (
                    <Link
                      href={`/news?page=${page + 1}${sport ? `&sport=${sport}` : ''}`}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:border-emerald-600 hover:text-emerald-700"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
