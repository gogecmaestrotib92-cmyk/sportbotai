// Cron endpoint for automated blog generation
// Called by Vercel Cron or external scheduler

import { NextRequest, NextResponse } from 'next/server';
import { generateBatch, seedKeywords, getNextKeyword } from '@/lib/blog';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max for generation

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if we have keywords
    const nextKeyword = await getNextKeyword();
    
    if (!nextKeyword) {
      // Seed keywords if none exist
      await seedKeywords();
    }

    // Generate 1 post per cron run (to stay within limits)
    const results = await generateBatch(1);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const count = Math.min(body.count || 1, 5); // Max 5 at a time

    const results = await generateBatch(count);

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('Manual blog generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
