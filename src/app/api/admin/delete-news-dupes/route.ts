import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/admin/delete-news-dupes?secret=xxx
// Deletes duplicate "Sports News" posts (keeps Match Previews)
export async function DELETE(request: Request) {
  try {
    // Check for admin auth via header or query param
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const secretParam = url.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;
    
    const isAuthorized = 
      (authHeader && authHeader === `Bearer ${cronSecret}`) ||
      (secretParam && secretParam === cronSecret);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all "Sports News" category posts (the duplicates)
    const newsPosts = await prisma.blogPost.findMany({
      where: {
        category: 'Sports News',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
      },
    });

    if (newsPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Sports News posts found',
        deleted: 0,
      });
    }

    // Delete Sports News posts
    const deleted = await prisma.blogPost.deleteMany({
      where: {
        category: 'Sports News',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} Sports News duplicate posts`,
      deleted: deleted.count,
      posts: newsPosts.map(p => ({ title: p.title, slug: p.slug })),
    });
  } catch (error) {
    console.error('Error deleting news dupes:', error);
    return NextResponse.json(
      { error: 'Failed to delete posts', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/admin/delete-news-dupes?secret=xxx
// Preview which posts would be deleted
export async function GET(request: Request) {
  try {
    // Check for admin auth
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const secretParam = url.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;
    
    const isAuthorized = 
      (authHeader && authHeader === `Bearer ${cronSecret}`) ||
      (secretParam && secretParam === cronSecret);
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all "Sports News" category posts
    const newsPosts = await prisma.blogPost.findMany({
      where: {
        category: 'Sports News',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Found ${newsPosts.length} Sports News posts to delete`,
      count: newsPosts.length,
      posts: newsPosts.map(p => ({ 
        title: p.title, 
        slug: p.slug,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error finding news dupes:', error);
    return NextResponse.json(
      { error: 'Failed to find posts', details: String(error) },
      { status: 500 }
    );
  }
}
