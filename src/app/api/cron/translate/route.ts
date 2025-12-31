/**
 * Cron job API endpoint for translating blog posts to Serbian
 * 
 * Called by Vercel Cron or external cron service
 * Runs 10x daily to translate new posts
 * 
 * GET /api/cron/translate
 * 
 * Security: Requires CRON_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { translateBlogPost } from '@/lib/translate';

// Vercel cron config - 10 times daily (every 2.4 hours ≈ every 2h 24min)
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

const POSTS_PER_RUN = 5; // Translate 5 posts per run to stay under time limits

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Starting Serbian translation job...');

  try {
    // Find posts without Serbian translations
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        translatedAt: null,
      },
      orderBy: [
        { postType: 'asc' }, // Prioritize NEWS/MATCH_PREVIEW
        { publishedAt: 'desc' },
      ],
      take: POSTS_PER_RUN,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
        newsTitle: true,
        newsContent: true,
        postType: true,
      },
    });

    if (posts.length === 0) {
      console.log('[Cron] No posts to translate');
      return NextResponse.json({ 
        success: true, 
        message: 'No posts to translate',
        translated: 0,
      });
    }

    console.log(`[Cron] Translating ${posts.length} posts...`);

    const results = {
      success: 0,
      failed: 0,
      posts: [] as string[],
    };

    for (const post of posts) {
      try {
        console.log(`[Cron] Translating: ${post.slug}`);
        
        const translations = await translateBlogPost({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          newsTitle: post.newsTitle,
          newsContent: post.newsContent,
          postType: post.postType,
        });

        // Update the post with translations
        await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            titleSr: translations.titleSr,
            excerptSr: translations.excerptSr,
            contentSr: translations.contentSr,
            metaTitleSr: translations.metaTitleSr,
            metaDescriptionSr: translations.metaDescriptionSr,
            newsTitleSr: translations.newsTitleSr,
            newsContentSr: translations.newsContentSr,
            translatedAt: new Date(),
          },
        });

        results.success++;
        results.posts.push(post.slug);
        console.log(`[Cron] ✅ Translated: ${post.slug}`);

      } catch (error) {
        console.error(`[Cron] ❌ Failed to translate ${post.slug}:`, error);
        results.failed++;
      }
    }

    // Count remaining untranslated posts
    const remaining = await prisma.blogPost.count({
      where: {
        status: 'PUBLISHED',
        translatedAt: null,
      },
    });

    console.log(`[Cron] Translation complete: ${results.success} success, ${results.failed} failed, ${remaining} remaining`);

    return NextResponse.json({
      success: true,
      translated: results.success,
      failed: results.failed,
      remaining,
      posts: results.posts,
    });

  } catch (error) {
    console.error('[Cron] Translation job failed:', error);
    return NextResponse.json(
      { error: 'Translation job failed', details: String(error) },
      { status: 500 }
    );
  }
}
