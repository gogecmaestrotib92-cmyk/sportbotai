// GET /api/blog - List published blog posts
// POST /api/blog - Generate new blog post (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBlogPost, seedKeywords, getNextKeyword } from '@/lib/blog';

// GET - List blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
    };

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = { has: tag };
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
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Blog list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

// POST - Generate new blog post
export async function POST(request: NextRequest) {
  try {
    // Simple API key auth (set BLOG_API_KEY in env for cron jobs)
    const authHeader = request.headers.get('Authorization');
    const apiKey = process.env.BLOG_API_KEY || process.env.CRON_SECRET;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { keyword, action } = body;

    // Action: seed keywords
    if (action === 'seed') {
      const count = await seedKeywords();
      return NextResponse.json({ 
        success: true, 
        message: `Seeded ${count} keywords` 
      });
    }

    // Action: generate post
    const targetKeyword = keyword || await getNextKeyword();
    
    if (!targetKeyword) {
      return NextResponse.json(
        { error: 'No keywords available. Seed keywords first.' },
        { status: 400 }
      );
    }

    const result = await generateBlogPost({ 
      keyword: targetKeyword,
      forceRegenerate: body.force === true,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        postId: result.postId,
        slug: result.slug,
        cost: result.cost,
        duration: result.duration,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Blog generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate blog post' },
      { status: 500 }
    );
  }
}
