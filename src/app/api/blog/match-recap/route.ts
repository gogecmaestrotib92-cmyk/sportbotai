/**
 * API Route: /api/blog/match-recap
 * 
 * Updates existing match preview posts with post-match analysis.
 * 
 * GET - List matches that need recap (finished but not yet updated)
 * POST - Update a specific match post with recap content
 * PUT - Batch update multiple matches with recaps
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  updateWithMatchRecap,
  getMatchesNeedingRecap 
} from '@/lib/blog/match-generator';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max

// GET - List matches needing recap
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow read without auth for admin UI
    const isAuthorized = !cronSecret || authHeader === `Bearer ${cronSecret}`;

    const matchesNeedingRecap = await getMatchesNeedingRecap();

    return NextResponse.json({
      success: true,
      count: matchesNeedingRecap.length,
      matches: matchesNeedingRecap.map(m => ({
        id: m.id,
        matchId: m.matchId,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        matchDate: m.matchDate,
        slug: m.slug,
        url: `/blog/${m.slug}`,
      })),
    });

  } catch (error) {
    console.error('[Match Recap API] Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches needing recap' },
      { status: 500 }
    );
  }
}

// POST - Update a specific match with recap
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { matchId, finalScore, homeGoals, awayGoals, winner } = body;

    if (!matchId || !finalScore) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['matchId', 'finalScore'],
          example: { matchId: 'abc123', finalScore: '2-1' },
        },
        { status: 400 }
      );
    }

    console.log(`[Match Recap API] Updating match ${matchId} with score: ${finalScore}`);

    const result = await updateWithMatchRecap(matchId, finalScore, {
      homeGoals,
      awayGoals,
      winner,
    });

    if (result.success) {
      // Get updated post for response
      const post = await prisma.blogPost.findUnique({
        where: { id: result.postId },
        select: { slug: true, title: true },
      });

      return NextResponse.json({
        success: true,
        postId: result.postId,
        updated: result.updated,
        url: post ? `/blog/${post.slug}` : undefined,
        title: post?.title,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('already has') ? 409 : 404 }
      );
    }

  } catch (error) {
    console.error('[Match Recap API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update match with recap', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// PUT - Batch update matches with recaps (from external data source)
export async function PUT(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization');
    const vercelCron = request.headers.get('x-vercel-cron');
    const cronSecret = process.env.CRON_SECRET;

    const isVercelCron = vercelCron === '1' || vercelCron === 'true';
    const isAuthorized = !cronSecret || authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { results } = body; // Array of { matchId, finalScore, ... }

    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { 
          error: 'Missing results array',
          example: { 
            results: [
              { matchId: 'abc123', finalScore: '2-1' },
              { matchId: 'def456', finalScore: '0-0' },
            ] 
          },
        },
        { status: 400 }
      );
    }

    console.log(`[Match Recap API] Batch updating ${results.length} matches`);

    const updateResults = [];
    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const match of results) {
      if (!match.matchId || !match.finalScore) {
        skipped++;
        updateResults.push({ matchId: match.matchId, error: 'Missing required fields' });
        continue;
      }

      const result = await updateWithMatchRecap(
        match.matchId, 
        match.finalScore,
        {
          homeGoals: match.homeGoals,
          awayGoals: match.awayGoals,
          winner: match.winner,
        }
      );

      if (result.success) {
        updated++;
        updateResults.push({ matchId: match.matchId, success: true, postId: result.postId });
      } else if (result.error?.includes('already has')) {
        skipped++;
        updateResults.push({ matchId: match.matchId, skipped: true, reason: 'Already updated' });
      } else {
        failed++;
        updateResults.push({ matchId: match.matchId, error: result.error });
      }

      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        updated,
        skipped,
        failed,
      },
      results: updateResults,
    });

  } catch (error) {
    console.error('[Match Recap API] Batch error:', error);
    return NextResponse.json(
      { error: 'Batch update failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
