// Serbian individual news article page - /sr/news/[slug]
// Displays Serbian translation if available, falls back to English

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

// Author info for Google News E-E-A-T
const AUTHOR = {
  name: 'Stefan Mitrovic',
  url: `${SITE_CONFIG.url}/about`,
  jobTitle: 'Sportski Analitičar & Urednik',
  photo: '/images/stefan-mitrovic.png',
  sameAs: [
    'https://www.upwork.com/freelancers/~017b8c67c94029389f',
    'https://www.linkedin.com/company/automateed/',
  ],
};

interface RelatedArticle {
  title: string;
  titleSr: string | null;
  slug: string;
  excerpt: string;
  excerptSr: string | null;
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

  // Get related news articles with Serbian content
  const relatedArticles: RelatedArticle[] = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      postType: { in: ['MATCH_PREVIEW', 'NEWS'] },
      id: { not: post.id },
      OR: [
        { sport: post.sport },
        { league: post.league },
      ],
      // Prefer articles with Serbian translations
      titleSr: { not: null },
    },
    select: {
      title: true,
      titleSr: true,
      slug: true,
      excerpt: true,
      excerptSr: true,
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
      title: 'Članak Nije Pronađen | SportBot AI Vesti',
    };
  }

  const { post } = data;
  const baseUrl = SITE_CONFIG.url;

  // Use Serbian translations if available
  const displayTitle = post.newsTitleSr || post.newsTitle || post.titleSr || post.title;
  const displayDescription = post.metaDescriptionSr || post.metaDescription || post.excerptSr || post.excerpt;

  // Generate OG image URL
  let ogImageUrl: string;
  if (post.homeTeam && post.awayTeam) {
    const ogParams = new URLSearchParams({
      home: post.homeTeam,
      away: post.awayTeam,
      league: post.league || post.sport || 'Sportske Vesti',
      verdict: 'Najnovije Vesti',
      date: post.matchDate ? new Date(post.matchDate).toLocaleDateString('sr-RS', {
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

  return {
    title: post.metaTitleSr || `${displayTitle} | SportBot AI Vesti`,
    description: displayDescription,
    keywords: post.tags.join(', '),
    authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
    alternates: {
      canonical: `${SITE_CONFIG.url}/sr/news/${slug}`,
      languages: {
        'en': `/news/${slug}`,
        'sr': `/sr/news/${slug}`,
        'x-default': `/news/${slug}`,
      },
    },
    openGraph: {
      title: displayTitle,
      description: displayDescription,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [AUTHOR.name],
      section: post.league || post.sport || 'Sport',
      tags: post.tags,
      locale: 'sr_RS',
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: displayTitle,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: displayDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function SerbianNewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const data = await getArticle(slug);

  if (!data) {
    notFound();
  }

  const { post, relatedArticles } = data;
  const baseUrl = SITE_CONFIG.url;

  // Check if Serbian translation exists
  const hasSerbian = Boolean(post.newsContentSr || post.contentSr || post.newsTitleSr || post.titleSr);
  
  // Use Serbian translations when available
  const articleContent = post.newsContentSr || post.contentSr || post.newsContent || post.content;
  const articleTitle = post.newsTitleSr || post.titleSr || post.newsTitle || post.title;
  const articleExcerpt = post.excerptSr || post.excerpt;

  // Generate OG image for schema
  let ogImageUrl: string;
  if (post.homeTeam && post.awayTeam) {
    const ogParams = new URLSearchParams({
      home: post.homeTeam,
      away: post.awayTeam,
      league: post.league || 'Sport',
    });
    ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
  } else {
    ogImageUrl = post.featuredImage || `${baseUrl}/og-news.png`;
  }

  // NewsArticle structured data
  const newsArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: articleTitle,
    description: articleExcerpt,
    image: [ogImageUrl],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: 'sr',
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
      '@id': `${baseUrl}/sr/news/${post.slug}`,
    },
    articleSection: post.league || post.sport || 'Sport',
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
        name: 'Početna',
        item: `${baseUrl}/sr`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Vesti',
        item: `${baseUrl}/sr/news`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: articleTitle,
        item: `${baseUrl}/sr/news/${post.slug}`,
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

      <article className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 relative">
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
        {/* Hero Section - matches blog structure */}
        <header className="pt-8 pb-12 relative z-10">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <ol className="flex items-center gap-2 text-sm text-slate-600">
                <li>
                  <Link href="/sr" className="hover:text-slate-900">Početna</Link>
                </li>
                <li>/</li>
                <li>
                  <Link href="/sr/news" className="hover:text-slate-900">Vesti</Link>
                </li>
                <li>/</li>
                <li className="text-slate-900 truncate max-w-[200px] font-medium">{articleTitle}</li>
              </ol>
            </nav>

            <div className="max-w-4xl mx-auto">
              {/* Language switch and League Badge */}
              <div className="flex items-center justify-between mb-4">
                {post.league && (
                  <Link
                    href={`/sr/news?sport=${post.sport?.toLowerCase() || ''}`}
                    className="text-emerald-700 text-sm font-bold hover:text-emerald-800"
                  >
                    {post.league}
                  </Link>
                )}
                <Link 
                  href={`/news/${slug}`} 
                  className="text-sm text-slate-600 hover:text-emerald-600 transition-colors"
                >
                  🌐 English
                </Link>
              </div>

              {/* Translation notice if not translated */}
              {!hasSerbian && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-700 text-sm">
                    ⚠️ Ovaj članak još nije preveden na srpski. Prikazuje se originalna engleska verzija.
                  </p>
                </div>
              )}

              {/* Title - Creative headline for readers */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3 leading-tight">
                {articleTitle}
              </h1>

              {/* SEO Subtitle - Shows "prediction" keyword when newsTitle differs from title */}
              {post.newsTitle && post.newsTitle !== post.title && (
                <p className="text-lg text-slate-600 mb-6 font-medium">
                  {post.titleSr || post.title}
                </p>
              )}

              {/* Meta - with author link */}
              <div className="flex flex-wrap items-center gap-4 text-slate-700 text-sm mb-8 font-medium">
                <Link href="/about" className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
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
                    ? new Date(post.publishedAt).toLocaleDateString('sr-RS', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Nacrt'}
                </span>
                {post.matchDate && (
                  <>
                    <span>•</span>
                    <span>
                      Utakmica: {new Date(post.matchDate).toLocaleDateString('sr-RS', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{post.views} pregleda</span>
                <span>•</span>
                <span>{Math.ceil(articleContent.split(' ').length / 200)} min čitanja</span>
              </div>

              {/* Featured Image */}
              {post.featuredImage && (
                <div className="aspect-video relative rounded-xl overflow-hidden bg-slate-700 mb-8">
                  <Image
                    src={post.featuredImage}
                    alt={post.imageAlt || articleTitle}
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
        <section className="pb-16 relative z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div
                className="blog-content bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-slate-200"
                dangerouslySetInnerHTML={{ __html: articleContent }}
                suppressHydrationWarning
              />
            </div>
          </div>
        </section>

        {/* Content Footer - Tags & Share */}
        <section className="pb-16 relative z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-300 bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                  <h3 className="text-sm font-medium text-slate-600 mb-4">Tagovi</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/sr/news?tag=${encodeURIComponent(tag)}`}
                        className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-sm rounded-full hover:border-emerald-600 hover:text-emerald-700"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Section */}
              <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border-2 border-slate-200">
                <p className="text-slate-700 text-center">
                  Budite u toku sa najnovijim sportskim vestima i AI analizama
                </p>
              </div>

              {/* Author Box */}
              <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border-2 border-slate-200">
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
                    <Link href="/about" className="text-lg font-semibold text-slate-900 hover:text-emerald-600 transition-colors">
                      {AUTHOR.name}
                    </Link>
                    <p className="text-emerald-600 text-sm mb-2">{AUTHOR.jobTitle}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Sportski analitičar sa ekspertizom u analizi utakmica zasnovanih na podacima i tržištima klađenja. 
                      Kombinovanje AI tehnologije sa dubokim poznavanjem sporta za pružanje korisnih uvida.
                    </p>
                    <div className="flex gap-3 mt-3">
                      <a 
                        href={AUTHOR.sameAs[0]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
                      >
                        Upwork
                      </a>
                      <a 
                        href={AUTHOR.sameAs[1]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-emerald-600 transition-colors text-sm"
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
          <section className="py-16 relative z-10">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
                Povezani Članci
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {relatedArticles.slice(0, 3).map((article) => (
                  <Link
                    key={article.slug}
                    href={`/sr/news/${article.slug}`}
                    className="bg-white rounded-2xl overflow-hidden border-2 border-slate-900/20 hover:border-emerald-600/60 transition-all hover:shadow-2xl shadow-lg"
                  >
                    <div className="aspect-video relative bg-slate-200">
                      {article.featuredImage && (
                        <Image
                          src={article.featuredImage}
                          alt={article.titleSr || article.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      {article.league && (
                        <span className="inline-block px-2 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wide rounded-sm mb-2">
                          {article.league}
                        </span>
                      )}
                      <h3 className="text-slate-900 font-bold text-sm line-clamp-2 leading-tight">
                        {article.titleSr || article.title}
                      </h3>
                      {article.publishedAt && (
                        <p className="text-slate-500 text-xs mt-2">
                          {new Date(article.publishedAt).toLocaleDateString('sr-RS', {
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
      </article>
    </>
  );
}
