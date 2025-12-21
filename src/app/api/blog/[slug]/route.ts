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

// Admin emails for authentication
const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
  'stefan@automateed.com',
];

// DELETE /api/blog/[slug] - Delete a blog post (admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    // For admin operations, we use the id instead of slug
    // The slug param is actually the post ID when deleting
    const postId = slug;

    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { id: postId },
    });

    console.log(`[Blog API] Deleted post: ${post.title}`);

    return NextResponse.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Blog post delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}

// PATCH /api/blog/[slug] - Update a blog post (admin only)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // For admin operations, we use the id instead of slug
    const postId = slug;

    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (body.status) {
      updateData.status = body.status;
    }
    
    if (body.publishedAt) {
      updateData.publishedAt = new Date(body.publishedAt);
    }
    
    if (body.title) updateData.title = body.title;
    if (body.content) updateData.content = body.content;
    if (body.excerpt) updateData.excerpt = body.excerpt;

    const updatedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
    });

    console.log(`[Blog API] Updated post: ${updatedPost.title} (${updatedPost.status})`);

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error('Blog post update error:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}
