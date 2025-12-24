// Individual news article page - /news/[slug]
// Uses NewsArticle schema for Google News eligibility

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/lib/seo';
import ViewTracker from '@/components/ViewTracker';
import { autoLinkTeamsSimple } from '@/lib/team-linker';

export const dynamicParams = true;
export const revalidate = 60;

interface NewsArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Author info for Google News E-E-A-T
const AUTHOR = {
  name: 'Stefan Mitrovic',
  url: `${SITE_CONFIG.url}/about`,
  jobTitle: 'Sports Analyst & Editor',
  photo: 'https://www.upwork.com/profile-portraits/c1QVpOOlRVMXCujp1syLSScOWIl0cbOsxFl4HtH9scBn6y1CaZPeWLI5v_eg78VPCd',
  sameAs: [
    'https://www.upwork.com/freelancers/~017b8c67c94029389f',
    'https://www.linkedin.com/company/automateed/',
  ],
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
      // Canonical for news section - Google News indexes this URL
      canonical: `https://www.sportbotai.com/news/${slug}`,
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
      jobTitle: AUTHOR.jobTitle,
      sameAs: AUTHOR.sameAs,
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
        {/* Hero Section - matches blog structure */}
        <header className="pt-8 pb-12">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <ol className="flex items-center gap-2 text-sm text-slate-400">
                <li>
                  <Link href="/" className="hover:text-white">Home</Link>
                </li>
                <li>/</li>
                <li>
                  <Link href="/news" className="hover:text-white">News</Link>
                </li>
                <li>/</li>
                <li className="text-slate-300 truncate max-w-[200px]">{post.newsTitle || post.title}</li>
              </ol>
            </nav>

            <div className="max-w-4xl mx-auto">
              {/* League Badge - styled like blog category */}
              {post.league && (
                <Link
                  href={`/news?sport=${post.sport?.toLowerCase() || ''}`}
                  className="inline-block text-emerald-400 text-sm font-medium mb-4 hover:text-emerald-300"
                >
                  {post.league}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                {post.newsTitle || post.title}
              </h1>

              {/* Meta - with author link */}
              <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm mb-8">
                <Link href="/about" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                  <Image
                    src={AUTHOR.photo}
                    alt={AUTHOR.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span>{AUTHOR.name}</span>
                </Link>
                <span>•</span>
                <span>
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Draft'}
                </span>
                {post.matchDate && (
                  <>
                    <span>•</span>
                    <span>
                      Match: {new Date(post.matchDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{Math.ceil((post.newsContent || post.content).split(' ').length / 200)} min read</span>
              </div>

              {/* Featured Image */}
              {post.featuredImage && (
                <div className="aspect-video relative rounded-xl overflow-hidden bg-slate-700 mb-8">
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
          </div>
        </header>

        {/* Article Content */}
        <article className="container mx-auto px-4 pb-16">
          <div className="max-w-3xl mx-auto">
            {/* Use same blog-content CSS class for visual consistency with auto-linked team names */}
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: autoLinkTeamsSimple(post.newsContent || post.content) }}
            />
          </div>
        </article>

        {/* Content Footer - Tags & Share (matches blog structure) */}
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-700">
                  <h3 className="text-sm font-medium text-slate-400 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/news?tag=${encodeURIComponent(tag)}`}
                        className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full hover:bg-slate-700"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Section */}
              <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                <p className="text-slate-300 text-center">
                  Stay informed with the latest sports news and AI-powered analysis
                </p>
              </div>

              {/* Author Box - E-E-A-T signal */}
              <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="flex items-start gap-4">
                  <Link href="/about" className="flex-shrink-0">
                    <Image
                      src={AUTHOR.photo}
                      alt={AUTHOR.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link href="/about" className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors">
                      {AUTHOR.name}
                    </Link>
                    <p className="text-emerald-400 text-sm mb-2">{AUTHOR.jobTitle}</p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Sports analyst with expertise in data-driven match analysis and betting markets. 
                      Combining AI technology with deep sports knowledge to deliver actionable insights.
                    </p>
                    <div className="flex gap-3 mt-3">
                      <a 
                        href={AUTHOR.sameAs[0]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                      >
                        Upwork
                      </a>
                      <a 
                        href={AUTHOR.sameAs[1]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                      >
                        LinkedIn
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="py-16 bg-slate-800/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {relatedArticles.slice(0, 3).map((article) => (
                  <Link
                    key={article.slug}
                    href={`/news/${article.slug}`}
                    className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-500/50 transition-all"
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
                        <span className="text-emerald-400 text-xs font-medium">
                          {article.league}
                        </span>
                      )}
                      <h3 className="font-semibold text-white hover:text-emerald-300 transition-colors line-clamp-2 mt-1">
                        {article.title}
                      </h3>
                      {article.publishedAt && (
                        <p className="text-slate-500 text-xs mt-2">
                          {new Date(article.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      )}
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
