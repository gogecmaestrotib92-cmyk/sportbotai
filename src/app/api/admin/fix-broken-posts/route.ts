import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/admin/fix-broken-posts
// Finds and deletes blog posts with unresolved placeholders
export async function DELETE(request: Request) {
  try {
    // Check for admin auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find posts with placeholder patterns
    const brokenPosts = await prisma.blogPost.findMany({
      where: {
        OR: [
          { content: { contains: '[HOME_%]' } },
          { content: { contains: '[AWAY_%]' } },
          { content: { contains: '[DRAW_%]' } },
          { content: { contains: '[HOME_WINS]' } },
          { content: { contains: '[AWAY_WINS]' } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    if (brokenPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No broken posts found',
        deleted: 0,
      });
    }

    // Delete broken posts
    const deleted = await prisma.blogPost.deleteMany({
      where: {
        id: { in: brokenPosts.map(p => p.id) },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} broken posts`,
      deleted: deleted.count,
      posts: brokenPosts.map(p => ({ title: p.title, slug: p.slug })),
    });
  } catch (error) {
    console.error('Error deleting broken posts:', error);
    return NextResponse.json(
      { error: 'Failed to delete broken posts' },
      { status: 500 }
    );
  }
}

// GET /api/admin/fix-broken-posts
// Lists posts with unresolved placeholders (preview before delete)
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brokenPosts = await prisma.blogPost.findMany({
      where: {
        OR: [
          { content: { contains: '[HOME_%]' } },
          { content: { contains: '[AWAY_%]' } },
          { content: { contains: '[DRAW_%]' } },
          { content: { contains: '[HOME_WINS]' } },
          { content: { contains: '[AWAY_WINS]' } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        homeTeam: true,
        awayTeam: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: brokenPosts.length,
      posts: brokenPosts,
    });
  } catch (error) {
    console.error('Error finding broken posts:', error);
    return NextResponse.json(
      { error: 'Failed to find broken posts' },
      { status: 500 }
    );
  }
}
