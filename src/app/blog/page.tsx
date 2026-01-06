// Blog listing page - /blog

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { BLOG_CATEGORIES } from '@/lib/blog';
import { META, SITE_CONFIG, getBlogSchema, getBlogBreadcrumb } from '@/lib/seo';

export const metadata: Metadata = {
  title: META.blog.title,
  description: META.blog.description,
  keywords: META.blog.keywords,
  openGraph: {
    title: META.blog.title,
    description: META.blog.description,
    url: `${SITE_CONFIG.url}/blog`,
    siteName: SITE_CONFIG.name,
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-blog.png`,
        width: 1200,
        height: 630,
        alt: 'SportBot AI Blog - Sports Analytics Insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: META.blog.title,
    description: META.blog.description,
    site: SITE_CONFIG.twitter,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/blog`,
    languages: {
      'en': '/blog',
      'sr': '/sr/blog',
      'x-default': '/blog',
    },
  },
};

export const revalidate = 60; // Revalidate every minute (also triggered on-demand after new posts)

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
  }>;
}

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  imageAlt: string | null;
  category: string | null;
  tags: string[];
  publishedAt: Date | null;
  views: number;
}

async function getBlogPosts(page: number, category?: string) {
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    status: 'PUBLISHED',
  };

  if (category) {
    where.category = category;
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        imageAlt: true,
        category: true,
        tags: true,
        publishedAt: true,
        views: true,
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    }) as Promise<BlogPostItem[]>,
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

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const category = params.category;

  const { posts, pagination } = await getBlogPosts(page, category);
  const breadcrumbSchema = getBlogBreadcrumb();

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
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Header */}
      <section className="py-16 md:py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Sports Analytics <span className="text-emerald-600">Blog</span>
            </h1>
            <p className="text-xl text-slate-700">
              Educational insights on sports data analysis, probability theory, and responsible approaches to sports analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/blog"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !category
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              All Posts
            </Link>
            {BLOG_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/blog?category=${encodeURIComponent(cat)}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-8 pb-16 relative z-10">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-lg">No posts found.</p>
              <p className="text-slate-500 mt-2">Check back soon for new content!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="group bg-white/95 rounded-2xl overflow-hidden border-2 border-slate-900/20 hover:border-emerald-600/60 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/20 hover:transform hover:scale-[1.02]"
                  >
                    <Link href={`/blog/${post.slug}`}>
                      {/* Image Container */}
                      <div className="aspect-video relative bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.imageAlt || post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl opacity-50">📊</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content below image */}
                      <div className="p-6">
                        {/* Category Badge */}
                        {post.category && (
                          <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wide rounded-sm mb-3">
                            {post.category}
                          </span>
                        )}
                        
                        {/* Title */}
                        <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 leading-tight">
                          {post.title}
                        </h2>
                        
                        {/* Excerpt */}
                        <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed mb-3">
                          {post.excerpt}
                        </p>
                        
                        {/* Meta Footer */}
                        <div className="flex items-center gap-4 text-slate-500 text-xs">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {post.publishedAt
                                ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Draft'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {post.views}
                            </span>
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
                      href={`/blog?page=${page - 1}${category ? `&category=${category}` : ''}`}
                      className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-slate-400">
                    Page {page} of {pagination.totalPages}
                  </span>
                  {page < pagination.totalPages && (
                    <Link
                      href={`/blog?page=${page + 1}${category ? `&category=${category}` : ''}`}
                      className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
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

      {/* CTA Section */}
      <section className="py-16 bg-black relative z-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Analyze Matches?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Put your knowledge into practice with our AI-powered sports analytics tool.
          </p>
          <Link
            href="/matches"
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Browse Matches
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
