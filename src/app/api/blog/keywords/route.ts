// GET /api/blog/keywords - List all keywords
// POST /api/blog/keywords - Add new keyword

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SEED_KEYWORDS } from '@/lib/blog';

// GET - List keywords
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const keywords = await prisma.blogKeyword.findMany({
      where,
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { lastGeneratedAt: 'asc' },
      ],
    });

    return NextResponse.json({
      keywords: keywords.map((k: { id: string; keyword: string; status: string; lastGeneratedAt: Date | null; generationCount: number; _count: { posts: number } }) => ({
        id: k.id,
        keyword: k.keyword,
        status: k.status,
        lastGeneratedAt: k.lastGeneratedAt,
        generationCount: k.generationCount,
        postCount: k._count.posts,
      })),
      total: keywords.length,
    });

  } catch (error) {
    console.error('Keywords list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

// POST - Add new keyword(s)
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('Authorization');
    const apiKey = process.env.BLOG_API_KEY || process.env.CRON_SECRET;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { keywords, action } = body;

    // Action: seed default keywords
    if (action === 'seed') {
      let added = 0;
      for (const keyword of SEED_KEYWORDS) {
        const existing = await prisma.blogKeyword.findUnique({
          where: { keyword },
        });
        if (!existing) {
          await prisma.blogKeyword.create({
            data: { keyword, status: 'ACTIVE' },
          });
          added++;
        }
      }
      return NextResponse.json({ 
        success: true, 
        added,
        message: `Seeded ${added} new keywords`,
      });
    }

    // Add custom keywords
    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'keywords array is required' },
        { status: 400 }
      );
    }

    const results = [];
    for (const keyword of keywords) {
      if (typeof keyword !== 'string' || keyword.length < 3) continue;

      const existing = await prisma.blogKeyword.findUnique({
        where: { keyword: keyword.toLowerCase().trim() },
      });

      if (!existing) {
        const created = await prisma.blogKeyword.create({
          data: {
            keyword: keyword.toLowerCase().trim(),
            status: 'PENDING',
          },
        });
        results.push({ keyword: created.keyword, status: 'created' });
      } else {
        results.push({ keyword: existing.keyword, status: 'exists' });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('Keywords add error:', error);
    return NextResponse.json(
      { error: 'Failed to add keywords' },
      { status: 500 }
    );
  }
}
