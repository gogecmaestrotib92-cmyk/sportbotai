// Serbian individual blog post page - /sr/blog/[...slug] (catch-all for tools/xyz paths)
// Displays Serbian translation if available, falls back to English

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/lib/seo';
import ViewTracker from '@/components/ViewTracker';
import FeaturedBadgeSnippet from '@/components/FeaturedBadgeSnippet';

export const dynamicParams = true;
export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{ slug: string[] }>;
}

// Author info
const AUTHOR = {
  name: 'Stefan Mitrovic',
  url: `${SITE_CONFIG.url}/about`,
  jobTitle: 'Sportski Analitičar & Urednik',
  photo: 'https://www.upwork.com/profile-portraits/c1QVpOOlRVMXCujp1syLSScOWIl0cbOsxFl4HtH9scBn6y1CaZPeWLI5v_eg78VPCd',
  sameAs: [
    'https://www.upwork.com/freelancers/~017b8c67c94029389f',
    'https://www.linkedin.com/company/automateed/',
  ],
};

// Serbian category translations
const CATEGORY_TRANSLATIONS: Record<string, string> = {
  'Strategy Guides': 'Strateški Vodiči',
  'Bankroll Management': 'Upravljanje Budžetom',
  'Sports Analysis': 'Sportske Analize',
  'Odds & Probability': 'Kvote i Verovatnoća',
  'Platform Tutorials': 'Uputstva za Platformu',
  'Match Preview': 'Najave Utakmica',
  'Tools & Resources': 'Alati i Resursi',
};

interface RelatedPost {
  title: string;
  titleSr: string | null;
  slug: string;
  excerpt: string;
  excerptSr: string | null;
  featuredImage: string | null;
  category: string | null;
  publishedAt: Date | null;
}

async function getBlogPost(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
    },
  });

  if (!post) {
    return null;
  }

  // Signal that MATCH_PREVIEW posts should redirect to /sr/news/[slug]
  if (post.postType === 'MATCH_PREVIEW') {
    return { redirectToNews: true, slug };
  }

  // Get related posts with Serbian content
  const relatedPosts: RelatedPost[] = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: post.id },
      category: post.category,
      titleSr: { not: null },
    },
    select: {
      title: true,
      titleSr: true,
      slug: true,
      excerpt: true,
      excerptSr: true,
      featuredImage: true,
      category: true,
      publishedAt: true,
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  return { post, relatedPosts };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug: slugArray } = await params;
  const slug = slugArray.join('/');
  const data = await getBlogPost(slug);

  if (!data || !('post' in data) || !data.post) {
    return {
      title: 'Članak Nije Pronađen | SportBot AI Blog',
    };
  }

  const { post } = data;
  const baseUrl = SITE_CONFIG.url;

  // Use Serbian translations if available
  const displayTitle = post.titleSr || post.title;
  const displayDescription = post.metaDescriptionSr || post.metaDescription || post.excerptSr || post.excerpt;

  const ogImageUrl = post.featuredImage?.startsWith('http')
    ? post.featuredImage
    : `${baseUrl}${post.featuredImage || '/og-blog.png'}`;

  return {
    title: post.metaTitleSr || `${displayTitle} | SportBot AI Blog`,
    description: displayDescription,
    keywords: post.tags.join(', '),
    authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
    alternates: {
      canonical: `${SITE_CONFIG.url}/sr/blog/${slug}`,
      languages: {
        'en': `/blog/${slug}`,
        'sr': `/sr/blog/${slug}`,
        'x-default': `/blog/${slug}`,
      },
    },
    openGraph: {
      title: displayTitle,
      description: displayDescription,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [AUTHOR.name],
      section: post.category ? CATEGORY_TRANSLATIONS[post.category] || post.category : 'Sport',
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

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
    take: 100,
  });

  return posts.map((post: { slug: string }) => ({
    slug: post.slug.split('/'),
  }));
}

export default async function SerbianBlogPostPage({ params }: BlogPostPageProps) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join('/');
  const data = await getBlogPost(slug);

  if (!data) {
    notFound();
  }

  // Redirect MATCH_PREVIEW posts to /sr/news for proper news layout
  if ('redirectToNews' in data && data.redirectToNews) {
    redirect(`/sr/news/${data.slug}`);
  }

  // Type guard - at this point we know data has post
  if (!('post' in data) || !data.post) {
    notFound();
  }

  const { post, relatedPosts } = data;
  const baseUrl = SITE_CONFIG.url;

  // Check if Serbian translation exists
  const hasSerbian = Boolean(post.contentSr || post.titleSr);
  
  // Use Serbian translations when available
  const articleContent = post.contentSr || post.content;
  const articleTitle = post.titleSr || post.title;
  const articleExcerpt = post.excerptSr || post.excerpt;

  // Article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articleTitle,
    description: articleExcerpt,
    image: post.featuredImage || `${baseUrl}/og-blog.png`,
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
      '@id': `${baseUrl}/sr/blog/${post.slug}`,
    },
    articleSection: post.category ? CATEGORY_TRANSLATIONS[post.category] || post.category : 'Sport',
    keywords: post.tags.join(', '),
    wordCount: articleContent.split(/\s+/).length,
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
        name: 'Blog',
        item: `${baseUrl}/sr/blog`,
      },
      ...(slug.includes('/') ? [{
        '@type': 'ListItem',
        position: 3,
        name: 'Alati',
        item: `${baseUrl}/sr/blog?category=Tools+%26+Resources`,
      }] : []),
      {
        '@type': 'ListItem',
        position: slug.includes('/') ? 4 : 3,
        name: articleTitle,
        item: `${baseUrl}/sr/blog/${post.slug}`,
      },
    ],
  };

  return (
    <>
      <ViewTracker postId={post.id} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

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
        {/* Hero Section */}
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
                  <Link href="/sr/blog" className="hover:text-slate-900">Blog</Link>
                </li>
                {slug.includes('/') && (
                  <>
                    <li>/</li>
                    <li>
                      <Link href="/sr/blog?category=Tools+%26+Resources" className="hover:text-slate-900">Alati</Link>
                    </li>
                  </>
                )}
                <li>/</li>
                <li className="text-slate-900 truncate max-w-[200px] font-medium">{articleTitle}</li>
              </ol>
            </nav>

            <div className="max-w-4xl mx-auto">
              {/* Language switch */}
              <div className="flex items-center justify-between mb-4">
                {post.category && (
                  <Link
                    href={`/sr/blog?category=${encodeURIComponent(post.category)}`}
                    className="text-emerald-700 text-sm font-bold hover:text-emerald-800"
                  >
                    {CATEGORY_TRANSLATIONS[post.category] || post.category}
                  </Link>
                )}
                <Link 
                  href={`/blog/${slug}`} 
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

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
                {articleTitle}
              </h1>

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
                <span>•</span>
                <span>{Math.ceil(articleContent.split(' ').length / 200)} min čitanja</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.views} pregleda
                </span>
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
              <article
                className="blog-content bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-slate-200"
                dangerouslySetInnerHTML={{ __html: articleContent }}
                suppressHydrationWarning
              />
            </div>
          </div>
        </section>

        {/* Content Footer - Tags */}
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
                        href={`/sr/blog?tag=${encodeURIComponent(tag)}`}
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
                  Da li ti je ovo bilo korisno? Podeli sa prijateljima zainteresovanim za sportsku analitiku!
                </p>
              </div>

              {/* CTA */}
              <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border-2 border-slate-200 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Spremni za Analizu Utakmica?
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  Primenite svoje znanje uz naš AI alat za sportsku analitiku.
                </p>
                <Link
                  href="/sr/matches"
                  className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Pregledaj Utakmice
                  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
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

              {/* Featured Badge Snippet - Only for tool reviews */}
              {post.slug.endsWith('-review') && (
                <FeaturedBadgeSnippet 
                  toolName={post.title.replace(' Review', '').replace(' review', '')}
                  reviewUrl={`${SITE_CONFIG.url}/blog/${post.slug}`}
                />
              )}
            </div>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-16 relative z-10">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
                Povezani Članci
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {relatedPosts.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/sr/blog/${article.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden border-2 border-slate-900/20 hover:border-emerald-600/60 transition-all hover:shadow-2xl shadow-lg"
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
                      {article.category && (
                        <span className="inline-block px-2 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wide rounded-sm mb-2">
                          {CATEGORY_TRANSLATIONS[article.category] || article.category}
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
      </div>
    </>
  );
}
