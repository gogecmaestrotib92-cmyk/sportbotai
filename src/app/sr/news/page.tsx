// Serbian News listing page - /sr/news

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Sportske Vesti - SportBot AI | Najnovije Sportske Analize',
  description: 'Pratite najnovije sportske vesti, analize utakmica i ekskluzivne uvide u fudbal, košarku, tenis i druge sportove uz SportBot AI.',
  keywords: 'sportske vesti, fudbal, košarka, tenis, sportske analize, uživo rezultati, sportski događaji',
  openGraph: {
    title: 'Sportske Vesti - SportBot AI',
    description: 'Pratite najnovije sportske vesti, analize utakmica i ekskluzivne uvide.',
    url: `${SITE_CONFIG.url}/sr/news`,
    siteName: SITE_CONFIG.name,
    type: 'website',
    locale: 'sr_RS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sportske Vesti - SportBot AI',
    description: 'Pratite najnovije sportske vesti, analize utakmica i ekskluzivne uvide.',
    site: SITE_CONFIG.twitter,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/sr/news`,
    languages: {
      'en': '/news',
      'sr': '/sr/news',
      'x-default': '/news',
    },
  },
};

export const revalidate = 60;

interface NewsPageProps {
  searchParams: Promise<{
    page?: string;
    sport?: string;
  }>;
}

interface NewsItem {
  id: string;
  title: string;
  titleSr: string | null;
  newsTitle: string | null;
  newsTitleSr: string | null;
  slug: string;
  excerpt: string;
  excerptSr: string | null;
  featuredImage: string | null;
  imageAlt: string | null;
  league: string | null;
  sport: string | null;
  matchDate: Date | null;
  publishedAt: Date | null;
  views: number;
}

const SPORT_FILTERS = [
  { key: 'all', label: 'Sve Vesti' },
  { key: 'soccer', label: 'Fudbal' },
  { key: 'basketball', label: 'Košarka' },
  { key: 'tennis', label: 'Tenis' },
  { key: 'americanfootball', label: 'Američki Fudbal' },
  { key: 'icehockey', label: 'Hokej' },
  { key: 'mma', label: 'MMA' },
];

async function getNewsPosts(page: number, sport?: string) {
  const limit = 13;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    status: 'PUBLISHED',
    // News = Match Previews category OR MATCH_PREVIEW postType
    OR: [
      { category: 'Match Previews' },
      { postType: 'MATCH_PREVIEW' },
    ],
  };

  if (sport && sport !== 'all') {
    where.sport = sport;
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        titleSr: true,
        newsTitle: true,
        newsTitleSr: true,
        slug: true,
        excerpt: true,
        excerptSr: true,
        featuredImage: true,
        imageAlt: true,
        league: true,
        sport: true,
        matchDate: true,
        publishedAt: true,
        views: true,
      },
      orderBy: [
        { matchDate: 'desc' },
        { publishedAt: 'desc' },
      ],
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
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `pre ${diffMins} min`;
  } else if (diffHours < 24) {
    return `pre ${diffHours}h`;
  } else if (diffDays < 7) {
    return `pre ${diffDays}d`;
  } else {
    return date.toLocaleDateString('sr-RS', { day: 'numeric', month: 'short' });
  }
}

// Get display title (prefer Serbian, fallback to English)
function getDisplayTitle(post: NewsItem): string {
  return post.newsTitleSr || post.newsTitle || post.titleSr || post.title;
}

// Get display excerpt (prefer Serbian, fallback to English)
function getDisplayExcerpt(post: NewsItem): string {
  return post.excerptSr || post.excerpt;
}

export default async function SerbianNewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const sport = params.sport;

  const { posts, pagination } = await getNewsPosts(page, sport);

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
      {/* Header */}
      <section className="py-8 md:py-12 border-b border-slate-300/50 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Sportske <span className="text-emerald-600">Vesti</span>
              </h1>
              <p className="text-slate-700">
                Najnovije sportske vesti, najave utakmica i ekskluzivni uvidi
              </p>
            </div>
            <div className="text-sm text-slate-600">
              <Link href="/news" className="hover:text-emerald-600 transition-colors">
                🌐 English
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sport Filters */}
      <section className="py-6 sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-300/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {SPORT_FILTERS.map((filter) => (
              <Link
                key={filter.key}
                href={filter.key === 'all' ? '/sr/news' : `/sr/news?sport=${filter.key}`}
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
              <p className="text-slate-600 text-lg">Nema pronađenih vesti.</p>
              <p className="text-slate-500 mt-2">Uskoro stižu novi članci!</p>
            </div>
          ) : (
            <>
              {/* Featured Article (First) */}
              {posts[0] && (
                <article className="mb-8">
                  <Link href={`/sr/news/${posts[0].slug}`} className="group block">
                    <div className="grid md:grid-cols-5 gap-6 bg-white rounded-2xl overflow-hidden border-2 border-slate-900/20 hover:border-emerald-600/60 transition-all hover:shadow-2xl shadow-lg">
                      {/* Image container */}
                      <div className="md:col-span-2 aspect-[4/3] md:aspect-auto relative bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center p-4 min-h-[200px] md:min-h-[280px]">
                        {posts[0].featuredImage ? (
                          <Image
                            src={posts[0].featuredImage}
                            alt={posts[0].imageAlt || getDisplayTitle(posts[0])}
                            fill
                            className="object-contain p-2"
                            priority
                          />
                        ) : (
                          <span className="text-6xl opacity-50">📰</span>
                        )}
                      </div>
                      {/* Content */}
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
                          {getDisplayTitle(posts[0])}
                        </h2>
                        <p className="text-slate-600 line-clamp-2 md:line-clamp-3 mb-4 text-sm md:text-base">
                          {getDisplayExcerpt(posts[0])}
                        </p>
                        {posts[0].matchDate && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Utakmica: {new Date(posts[0].matchDate).toLocaleDateString('sr-RS', {
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
                    <Link href={`/sr/news/${post.slug}`}>
                      <div className="aspect-video relative bg-gradient-to-br from-slate-200 to-slate-300">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.imageAlt || getDisplayTitle(post)}
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
                          {getDisplayTitle(post)}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-2">
                          {getDisplayExcerpt(post)}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{post.views} pregleda</span>
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
                      href={`/sr/news?page=${page - 1}${sport ? `&sport=${sport}` : ''}`}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:border-emerald-600 hover:text-emerald-700"
                    >
                      Prethodna
                    </Link>
                  )}
                  <span className="px-4 py-2 text-slate-600">
                    Strana {page} od {pagination.totalPages}
                  </span>
                  {page < pagination.totalPages && (
                    <Link
                      href={`/sr/news?page=${page + 1}${sport ? `&sport=${sport}` : ''}`}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:border-emerald-600 hover:text-emerald-700"
                    >
                      Sledeća
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
