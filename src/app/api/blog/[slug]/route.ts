// GET /api/blog/[slug] - Get single blog post by slug

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        keyword: {
          select: {
            keyword: true,
          },
        },
      },
    });

    if (!post || post.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment view count (fire and forget)
    prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    }).catch(() => {});

    // Get related posts
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: post.id },
        OR: [
          { category: post.category },
          { tags: { hasSome: post.tags } },
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

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        featuredImage: post.featuredImage,
        imageAlt: post.imageAlt,
        category: post.category,
        tags: post.tags,
        publishedAt: post.publishedAt,
        views: post.views,
      },
      relatedPosts,
    });

  } catch (error) {
    console.error('Blog post fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}
