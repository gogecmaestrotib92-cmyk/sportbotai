// Blog listing page - /blog

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { BLOG_CATEGORIES } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Sports Analytics Blog | SportBot AI',
  description: 'Educational articles about sports analytics, betting strategies, probability analysis, and responsible gambling. Learn data-driven approaches to sports analysis.',
  openGraph: {
    title: 'Sports Analytics Blog | SportBot AI',
    description: 'Educational articles about sports analytics, betting strategies, and responsible gambling.',
    type: 'website',
  },
};

export const revalidate = 3600; // Revalidate every hour

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Sports Analytics <span className="text-emerald-400">Blog</span>
            </h1>
            <p className="text-xl text-slate-300">
              Educational insights on sports data analysis, probability theory, and responsible approaches to sports analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-8">
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
      <section className="py-8 pb-16">
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
                    className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-500/50 transition-all hover:transform hover:scale-[1.02]"
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <div className="aspect-video relative bg-slate-700">
                        {post.featuredImage ? (
                          <Image
                            src={post.featuredImage}
                            alt={post.imageAlt || post.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl">📊</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        {post.category && (
                          <span className="text-emerald-400 text-sm font-medium">
                            {post.category}
                          </span>
                        )}
                        <h2 className="text-xl font-semibold text-white mt-2 mb-3 line-clamp-2">
                          {post.title}
                        </h2>
                        <p className="text-slate-400 text-sm line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                          <span className="text-slate-500 text-sm">
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Draft'}
                          </span>
                          <span className="text-slate-500 text-sm">
                            {post.views} views
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
      <section className="py-16 bg-slate-800/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Analyze Matches?
          </h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Put your knowledge into practice with our AI-powered sports analytics tool.
          </p>
          <Link
            href="/analyzer"
            className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Try the Analyzer
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
