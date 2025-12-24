// Individual news article page - /news/[slug]
// Uses NewsArticle schema for Google News eligibility

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/lib/seo';
import ViewTracker from '@/components/ViewTracker';

export const dynamicParams = true;
export const revalidate = 60;

interface NewsArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Author info for Google News
const AUTHOR = {
  name: 'SportBot AI Editorial',
  url: `${SITE_CONFIG.url}/about`,
  image: `${SITE_CONFIG.url}/team/sportbot-editorial.png`,
};

interface RelatedArticle {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  league: string | null;
  publishedAt: Date | null;
}

async function getArticle(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      postType: { in: ['MATCH_PREVIEW', 'NEWS'] },
    },
  });

  if (!post) {
    return null;
  }

  // Get related news articles
  const relatedArticles: RelatedArticle[] = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      postType: { in: ['MATCH_PREVIEW', 'NEWS'] },
      id: { not: post.id },
      OR: [
        { sport: post.sport },
        { league: post.league },
      ],
    },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      league: true,
      publishedAt: true,
    },
    take: 4,
    orderBy: { publishedAt: 'desc' },
  });

  return { post, relatedArticles };
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArticle(slug);

  if (!data) {
    return {
      title: 'Article Not Found | SportBot AI News',
    };
  }

  const { post } = data;
  const baseUrl = SITE_CONFIG.url;

  // Generate OG image URL
  let ogImageUrl: string;
  if (post.homeTeam && post.awayTeam) {
    const ogParams = new URLSearchParams({
      home: post.homeTeam,
      away: post.awayTeam,
      league: post.league || post.sport || 'Sports News',
      verdict: 'Breaking News',
      date: post.matchDate ? new Date(post.matchDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) : '',
    });
    ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
  } else {
    ogImageUrl = post.featuredImage?.startsWith('http')
      ? post.featuredImage
      : `${baseUrl}${post.featuredImage || '/og-news.png'}`;
  }

  // Use news title for news section (more journalistic)
  const displayTitle = post.newsTitle || post.title;

  const ogImage = {
    url: ogImageUrl,
    width: 1200,
    height: 630,
    alt: displayTitle,
  };

  return {
    title: post.metaTitle || `${displayTitle} | SportBot AI News`,
    description: post.metaDescription || post.excerpt,
    keywords: post.tags.join(', '),
    authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
    alternates: {
      // Canonical points to blog version to avoid duplicate content
      // Google News bot sees /news/ (we block /blog/ for Googlebot-News in robots.ts)
      // Regular Google indexes /blog/ as canonical
      canonical: `https://www.sportbotai.com/blog/${slug}`,
    },
    openGraph: {
      title: post.metaTitle || displayTitle,
      description: post.metaDescription || post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [AUTHOR.name],
      section: post.league || post.sport || 'Sports',
      tags: post.tags,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || displayTitle,
      description: post.metaDescription || post.excerpt,
      images: [ogImage],
    },
  };
}

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      postType: { in: ['MATCH_PREVIEW', 'NEWS'] },
    },
    select: { slug: true },
    take: 100,
    orderBy: { publishedAt: 'desc' },
  });

  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const data = await getArticle(slug);

  if (!data) {
    notFound();
  }

  const { post, relatedArticles } = data;
  const baseUrl = SITE_CONFIG.url;

  // Generate OG image for schema
  let ogImageUrl: string;
  if (post.homeTeam && post.awayTeam) {
    const ogParams = new URLSearchParams({
      home: post.homeTeam,
      away: post.awayTeam,
      league: post.league || 'Sports',
    });
    ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
  } else {
    ogImageUrl = post.featuredImage || `${baseUrl}/og-news.png`;
  }

  // NewsArticle structured data - REQUIRED for Google News
  // Use newsContent/newsTitle when available (optimized for news)
  const articleContent = post.newsContent || post.content;
  const articleTitle = post.newsTitle || post.title;

  const newsArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: articleTitle,
    description: post.excerpt,
    image: [ogImageUrl],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: AUTHOR.name,
      url: AUTHOR.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SportBot AI',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/news/${post.slug}`,
    },
    articleSection: post.league || post.sport || 'Sports',
    keywords: post.tags.join(', '),
    wordCount: articleContent.split(/\s+/).length,
    isAccessibleForFree: true,
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'News',
        item: `${baseUrl}/news`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${baseUrl}/news/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <ViewTracker postId={post.id} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Breadcrumb */}
        <nav className="container mx-auto px-4 py-4">
          <ol className="flex items-center gap-2 text-sm text-slate-400">
            <li>
              <Link href="/" className="hover:text-emerald-400 transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/news" className="hover:text-emerald-400 transition-colors">
                News
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-500 truncate max-w-[200px]">{post.newsTitle || post.title}</li>
          </ol>
        </nav>

        {/* Article Header */}
        <header className="container mx-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            {/* League/Sport Badge */}
            {post.league && (
              <Link
                href={`/news?sport=${post.sport?.toLowerCase() || ''}`}
                className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm font-semibold rounded-full mb-4 hover:bg-emerald-500/20 transition-colors"
              >
                {post.league}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {post.newsTitle || post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-slate-400 mb-8">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <span className="text-emerald-400 text-sm font-bold">S</span>
                </div>
                <span className="font-medium text-white">{AUTHOR.name}</span>
              </div>

              <span className="text-slate-600">•</span>

              {/* Published Date */}
              <time dateTime={post.publishedAt?.toISOString()}>
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Draft'}
              </time>

              {post.matchDate && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Match: {new Date(post.matchDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </>
              )}
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="aspect-video relative rounded-2xl overflow-hidden bg-slate-800 mb-8">
                <Image
                  src={post.featuredImage}
                  alt={post.imageAlt || post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </header>

        {/* Article Content */}
        <article className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div
              className="prose prose-invert prose-emerald max-w-none prose-headings:text-white prose-p:text-slate-300 prose-a:text-emerald-400 prose-strong:text-white prose-li:text-slate-300"
              dangerouslySetInnerHTML={{ __html: post.newsContent || post.content }}
            />
          </div>
        </article>

        {/* Tags */}
        {post.tags.length > 0 && (
          <section className="container mx-auto px-4 pb-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-800 text-slate-400 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Share / CTA */}
        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Get AI-Powered Match Analysis
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Dive deeper with real-time probabilities and insights
                  </p>
                </div>
                <Link
                  href="/matches"
                  className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors whitespace-nowrap"
                >
                  Analyze Matches →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="container mx-auto px-4 pb-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Related News</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/news/${article.slug}`}
                    className="group bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-emerald-500/50 transition-all"
                  >
                    <div className="aspect-video relative bg-slate-700">
                      {article.featuredImage && (
                        <Image
                          src={article.featuredImage}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      {article.league && (
                        <span className="text-emerald-400 text-xs font-semibold">
                          {article.league}
                        </span>
                      )}
                      <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 mt-1">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
