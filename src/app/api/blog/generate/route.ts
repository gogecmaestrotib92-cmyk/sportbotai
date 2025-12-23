// Cron endpoint for automated blog generation
// Called by Vercel Cron or external scheduler
// NEWS entries are automatically created when match previews are generated (in match-generator.ts)

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { generateBatch, seedKeywords, getNextKeyword } from '@/lib/blog';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max for generation

export async function GET(request: NextRequest) {
  try {
    // Check for health check mode
    const { searchParams } = new URL(request.url);
    const healthCheck = searchParams.get('health') === '1';
    
    if (healthCheck) {
      // Return status of required API keys and database
      const hasOpenAI = !!process.env.OPENAI_API_KEY;
      const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
      const hasReplicate = !!process.env.REPLICATE_API_TOKEN;
      const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
      
      let dbStatus = 'unknown';
      let keywordCount = 0;
      let postCount = 0;
      
      try {
        keywordCount = await prisma.blogKeyword.count();
        postCount = await prisma.blogPost.count();
        dbStatus = 'connected';
      } catch (dbError) {
        dbStatus = `error: ${dbError instanceof Error ? dbError.message : 'unknown'}`;
      }
      
      return NextResponse.json({
        status: 'ok',
        env: {
          openai: hasOpenAI,
          perplexity: hasPerplexity,
          replicate: hasReplicate,
          blobStorage: hasBlobToken,
        },
        database: {
          status: dbStatus,
          keywords: keywordCount,
          posts: postCount,
        },
        ready: hasOpenAI && hasPerplexity && dbStatus === 'connected',
      });
    }
    
    // Verify cron secret OR Vercel's internal cron header
    const authHeader = request.headers.get('Authorization');
    const vercelCron = request.headers.get('x-vercel-cron');
    const cronSecret = process.env.CRON_SECRET;

    const isVercelCron = vercelCron === '1' || vercelCron === 'true';
    const isAuthorized = !cronSecret || authHeader === `Bearer ${cronSecret}`;
    
    if (!isVercelCron && !isAuthorized) {
      console.log('[Blog Cron] Unauthorized request - no valid auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Blog Cron] Starting generation... (vercelCron: ${isVercelCron}, authorized: ${isAuthorized})`);

    // Check if we have keywords
    const nextKeyword = await getNextKeyword();
    console.log(`[Blog Cron] Next keyword: ${nextKeyword || 'none'}`);
    
    if (!nextKeyword) {
      console.log('[Blog Cron] No keywords found, seeding...');
      await seedKeywords();
    }

    // Generate 1 post per cron run (to stay within limits)
    // NEWS entries are automatically created when match previews are generated
    console.log('[Blog Cron] Starting batch generation...');
    const results = await generateBatch(1);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    console.log(`[Blog Cron] Complete: ${successful} generated, ${failed.length} failed`);
    if (failed.length > 0) {
      console.error('[Blog Cron] Failures:', failed.map(f => f.error));
    }

    // Revalidate blog pages
    if (successful > 0) {
      revalidatePath('/blog');
      console.log('[Blog Cron] Revalidated /blog cache');
    }

    return NextResponse.json({
      success: true,
      generated: successful,
      failed: failed.length,
      results: results.map(r => ({
        success: r.success,
        slug: r.slug,
        error: r.error,
        cost: r.cost,
        duration: r.duration,
      })),
    });

  } catch (error) {
    console.error('Cron blog generation error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// POST for manual trigger with count
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const count = Math.min(body.count || 1, 5);

    const results = await generateBatch(count);

    // Revalidate blog pages
    const successful = results.filter(r => r.success).length;
    if (successful > 0) {
      revalidatePath('/blog');
      console.log('[Blog Generate] Revalidated /blog cache');
    }

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('Manual blog generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
