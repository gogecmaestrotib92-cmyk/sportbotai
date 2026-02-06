// Individual blog post page - /blog/[...slug] (catch-all for tools/xyz paths)

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getBlogPostBreadcrumb, SITE_CONFIG } from '@/lib/seo';
import ViewTracker from '@/components/ViewTracker';
import FeaturedBadgeSnippet from '@/components/FeaturedBadgeSnippet';

// Allow dynamic rendering for new blog posts not in generateStaticParams
export const dynamicParams = true;

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{ slug: string[] }>;
}

// Author info for E-E-A-T
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

interface RelatedPost {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: string | null;
}

async function getPost(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post || post.status !== 'PUBLISHED') {
    return null;
  }

  // Signal that MATCH_PREVIEW posts should redirect to /news/[slug]
  if (post.postType === 'MATCH_PREVIEW') {
    return { redirectToNews: true, slug };
  }

  // NOTE: Views are tracked client-side via ViewTracker component
  // This prevents double-counting from generateMetadata + page render

  // Get related posts
  const relatedPosts: RelatedPost[] = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: post.id },
      OR: [
        { category: post.category },
        { tags: { hasSome: post.tags.slice(0, 3) } },
      ],
    },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      category: true,
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  return { post, relatedPosts };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug: slugArray } = await params;
  const slug = slugArray.join('/');
  const data = await getPost(slug);

  if (!data || !('post' in data) || !data.post) {
    return {
      title: 'Post Not Found | SportBot AI',
    };
  }

  const { post } = data;

  // Determine OG image URL for social sharing
  // Twitter/X requires PNG/JPG images with absolute URLs
  // SVG images don't work on Twitter, so we use dynamic /api/og for all match previews
  const baseUrl = 'https://www.sportbotai.com'; // Must be absolute URL for Twitter

  let ogImageUrl: string;

  // Always use /api/og for match previews - it generates PNG that works on Twitter
  // SVG images from Vercel Blob don't display on Twitter/X
  if (post.homeTeam && post.awayTeam) {
    const ogParams = new URLSearchParams({
      home: post.homeTeam,
      away: post.awayTeam,
      league: post.league || post.sport || 'Match Preview',
      verdict: 'AI Match Analysis',
      date: post.matchDate ? new Date(post.matchDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : '',
    });
    ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
  } else if (post.featuredImage && !post.featuredImage.endsWith('.svg')) {
    // Use existing PNG/JPG image if available
    ogImageUrl = post.featuredImage.startsWith('http')
      ? post.featuredImage
      : `${baseUrl}${post.featuredImage}`;
  } else {
    // Generic fallback for non-match posts
    const titleParts = post.title.split(' vs ');
    ogImageUrl = `${baseUrl}/api/og?home=${encodeURIComponent(titleParts[0] || 'SportBot')}&away=${encodeURIComponent(titleParts[1]?.split(' ')[0] || 'AI')}`;
  }

  // Build proper image object for OG/Twitter with dimensions
  const ogImage = {
    url: ogImageUrl,
    width: 1200,
    height: 630,
    alt: post.homeTeam && post.awayTeam
      ? `${post.homeTeam} vs ${post.awayTeam} - Match Preview`
      : post.title,
  };

  return {
    title: post.metaTitle || `${post.title} | SportBot AI Blog`,
    description: post.metaDescription || post.excerpt,
    keywords: post.tags.join(', '),
    alternates: {
      canonical: `/blog/${slug}`,
      languages: {
        'en': `/blog/${slug}`,
        'sr': `/sr/blog/${slug}`,
        'x-default': `/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: [ogImage],
    },
  };
}

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
    take: 100, // Pre-render top 100 posts
  });

  return posts.map((post: { slug: string }) => ({
    slug: post.slug.split('/'),
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join('/');
  const data = await getPost(slug);

  if (!data) {
    notFound();
  }

  // Redirect MATCH_PREVIEW posts to /news for proper news layout
  if ('redirectToNews' in data && data.redirectToNews) {
    redirect(`/news/${data.slug}`);
  }

  // Type guard - at this point we know data has post
  if (!('post' in data) || !data.post) {
    notFound();
  }

  const { post, relatedPosts } = data;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'SportBot AI',
      url: 'https://www.sportbotai.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SportBot AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.sportbotai.com/logo.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.sportbotai.com/blog/${post.slug}`,
    },
  };

  const breadcrumbSchema = getBlogPostBreadcrumb(post.title, post.category || undefined);

  // FAQ Schema - helps with Google rich snippets
  // Different FAQs for different post types
  const isToolReview = slug.endsWith('-review');
  const isMatchPreview = post.homeTeam && post.awayTeam;
  const toolName = isToolReview ? post.title.replace(/ Review.*$/i, '').trim() : '';
  const matchName = isMatchPreview ? `${post.homeTeam} vs ${post.awayTeam}` : '';

  // Build FAQ schema based on post type
  let faqSchema: object | null = null;

  if (isToolReview) {
    // Tool review FAQs
    faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `What is ${toolName}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: post.excerpt || `${toolName} is a sports betting analytics tool reviewed by SportBot AI.`,
          },
        },
        {
          '@type': 'Question',
          name: `Is ${toolName} worth it?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Read our comprehensive ${toolName} review to understand its features, pros, cons, and whether it's the right fit for your sports betting strategy.`,
          },
        },
        {
          '@type': 'Question',
          name: `What are the pros and cons of ${toolName}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Our ${toolName} review covers key advantages and disadvantages based on real testing. Check the full review for detailed analysis.`,
          },
        },
      ],
    };
  } else if (isMatchPreview) {
    // Match preview FAQs
    const matchDateStr = post.matchDate
      ? new Date(post.matchDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : 'scheduled date';
    faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `When is ${matchName}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${matchName} is scheduled for ${matchDateStr}. Check our analysis for the latest kickoff time and TV coverage.`,
          },
        },
        {
          '@type': 'Question',
          name: `Who will win ${matchName}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: post.excerpt || `Our AI analysis breaks down the probabilities for ${matchName}, covering form, head-to-head records, and key factors.`,
          },
        },
        {
          '@type': 'Question',
          name: `What is the prediction for ${matchName}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Read our full ${matchName} preview for AI-powered predictions, value bets, and risk assessment based on data analysis.`,
          },
        },
      ],
    };
  } else {
    // General blog posts - sports betting FAQs
    faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is SportBot AI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SportBot AI is an AI-powered sports analytics platform that provides match predictions, value betting insights, and data-driven analysis for football, basketball, tennis, and more.',
          },
        },
        {
          '@type': 'Question',
          name: 'How accurate are AI sports predictions?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AI sports predictions use statistical models and machine learning to analyze form, head-to-head records, and market data. While no prediction is guaranteed, AI helps identify value opportunities the market may have missed.',
          },
        },
      ],
    };
  }

  return (
    <>
      <ViewTracker postId={post.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

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
        {/* Hero Section */}
        <header className="pt-8 pb-12 relative z-10">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <ol className="flex items-center gap-2 text-sm text-slate-600">
                <li>
                  <Link href="/" className="hover:text-slate-900">Home</Link>
                </li>
                <li>/</li>
                <li>
                  <Link href="/blog" className="hover:text-slate-900">Blog</Link>
                </li>
                {slug.includes('/') && (
                  <>
                    <li>/</li>
                    <li>
                      <Link href="/blog?category=Tools+%26+Resources" className="hover:text-slate-900">Tools</Link>
                    </li>
                  </>
                )}
                <li>/</li>
                <li className="text-slate-900 truncate max-w-[200px] font-medium">{post.title}</li>
              </ol>
            </nav>

            <div className="max-w-4xl mx-auto">
              {/* Category */}
              {post.category && (
                <Link
                  href={`/blog?category=${encodeURIComponent(post.category)}`}
                  className="inline-block text-emerald-700 text-sm font-bold mb-4 hover:text-emerald-800"
                >
                  {post.category}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta - with author link */}
              <div className="flex flex-wrap items-center gap-4 text-slate-700 text-sm mb-8 font-medium">
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
                <span>•</span>
                <span>{post.views} views</span>
                <span>•</span>
                <span>{Math.ceil(post.content.split(' ').length / 200)} min read</span>
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

        {/* Content */}
        <section className="pb-16 relative z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {/* Article Content - Custom Blog Styling with auto-linked team names */}
              <article
                className="blog-content bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-slate-200"
                dangerouslySetInnerHTML={{ __html: post.content }}
                suppressHydrationWarning
              />

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-300 bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                  <h3 className="text-sm font-medium text-slate-600 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/blog?tag=${encodeURIComponent(tag)}`}
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
                  Found this helpful? Share it with fellow sports analytics enthusiasts!
                </p>
              </div>

              {/* Author Box - E-E-A-T signal */}
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
                      Sports analyst with expertise in data-driven match analysis and betting markets.
                      Combining AI technology with deep sports knowledge to deliver actionable insights.
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

              {/* MAIN CTA - High Visibility */}
              <div className="mt-12 mb-8 p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl border border-slate-700 text-center relative overflow-hidden group">
                {/* Background glow effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 opacity-70"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-10 transition duration-1000 blur-lg"></div>

                <h3 className="text-2xl font-bold text-white mb-3 relative z-10">
                  Stop Guessing. Start Winning.
                </h3>
                <p className="text-slate-300 mb-6 max-w-lg mx-auto relative z-10">
                  Get AI-powered picks, probability models, and market edge detection for <span className="text-emerald-400 font-bold">~$0.66/day</span>.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                  <Link
                    href="/pricing#pro"
                    className="inline-flex items-center justify-center px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg hover:shadow-emerald-500/25"
                  >
                    Get Your Edge Now
                  </Link>
                  <Link
                    href="/matches"
                    className="inline-flex items-center justify-center px-8 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all border border-slate-600"
                  >
                    View Free Analysis
                  </Link>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-16 relative z-10">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {relatedPosts.map((related: RelatedPost) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group bg-white/95 rounded-xl overflow-hidden border-2 border-slate-900/20 hover:border-emerald-600/60 transition-all hover:shadow-xl"
                  >
                    <div className="aspect-video relative bg-slate-200">
                      {related.featuredImage ? (
                        <Image
                          src={related.featuredImage}
                          alt={related.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl">📊</span>
                        </div>
                      )}
                    </div>

                    {/* Content below image */}
                    <div className="p-4">
                      <span className="inline-block px-2 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wide rounded-sm mb-2">
                        {related.category}
                      </span>
                      <h3 className="text-slate-900 font-bold text-sm line-clamp-2 leading-tight">
                        {related.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Old CTA Removed - moved up */}
      </article>
    </>
  );
}
