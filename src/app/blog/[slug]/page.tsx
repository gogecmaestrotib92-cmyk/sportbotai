// Individual blog post page - /blog/[slug]

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getBlogPostBreadcrumb, SITE_CONFIG } from '@/lib/seo';
import ViewTracker from '@/components/ViewTracker';
import { autoLinkTeamsSimple } from '@/lib/team-linker';

// Allow dynamic rendering for new blog posts not in generateStaticParams
export const dynamicParams = true;

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data) {
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
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data) {
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

      <article className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 relative">
        {/* Glass morphism overlay with newspaper texture */}
        <div 
          className="absolute inset-0 bg-white/40 backdrop-blur-3xl"
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
              <ol className="flex items-center gap-2 text-sm text-slate-400">
                <li>
                  <Link href="/" className="hover:text-white">Home</Link>
                </li>
                <li>/</li>
                <li>
                  <Link href="/blog" className="hover:text-white">Blog</Link>
                </li>
                <li>/</li>
                <li className="text-slate-700 truncate max-w-[200px]">{post.title}</li>
              </ol>
            </nav>

            <div className="max-w-4xl mx-auto">
              {/* Category */}
              {post.category && (
                <Link
                  href={`/blog?category=${encodeURIComponent(post.category)}`}
                  className="inline-block text-emerald-600 text-sm font-medium mb-4 hover:text-emerald-700"
                >
                  {post.category}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta - with author link */}
              <div className="flex flex-wrap items-center gap-4 text-slate-600 text-sm mb-8">
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
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {/* Article Content - Custom Blog Styling with auto-linked team names */}
              <article 
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: autoLinkTeamsSimple(post.content) }}
              />

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-700">
                  <h3 className="text-sm font-medium text-slate-400 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/blog?tag=${encodeURIComponent(tag)}`}
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
                  Found this helpful? Share it with fellow sports analytics enthusiasts!
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

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-16 bg-slate-800/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">
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
                      {/* Gradient overlay - always visible */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      
                      {/* Content overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                        <span className="inline-block px-2 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wide rounded-sm mb-2">
                          {related.category}
                        </span>
                        <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight">
                          {related.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Put This Knowledge to Use
            </h2>
            <p className="text-slate-300 mb-8 max-w-xl mx-auto">
              Use our AI-powered analyzer to apply these concepts to real matches.
            </p>
            <Link
              href="/matches"
              className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Browse Matches
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}
