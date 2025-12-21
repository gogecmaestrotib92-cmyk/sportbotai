// POST /api/blog/track-view - Track a blog post view

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId } = body;

    if (!postId || typeof postId !== 'string') {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('View tracking error:', error);
    // Return success anyway - don't expose errors for analytics
    return NextResponse.json({ success: true });
  }
}
