/**
 * API Route: /api/blog/match-preview
 * 
 * Generates pre-match analysis blog posts for upcoming matches.
 * 
 * GET - Generate previews for upcoming matches (batch mode)
 * POST - Generate preview for a specific match
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { 
  generateMatchPreview, 
  generatePreviewsForUpcomingMatches 
} from '@/lib/blog/match-generator';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

const ADMIN_EMAILS = [
  'admin@sportbotai.com',
  'gogani92@gmail.com',
  'streamentor@gmail.com',
  'stefan@automateed.com',
];

// GET - Batch generate previews for upcoming matches
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const sportKey = searchParams.get('sportKey') || undefined;
    const limit = parseInt(searchParams.get('limit') || '5');

    console.log(`[Match Preview API] Generating previews for sportKey: ${sportKey || 'default'}, limit: ${limit}`);

    const result = await generatePreviewsForUpcomingMatches(sportKey, Math.min(limit, 10));

    // Revalidate blog AND news pages so new posts appear immediately
    if (result.generated > 0) {
      revalidatePath('/blog');
      revalidatePath('/news');
      console.log('[Match Preview API] Revalidated /blog and /news cache');
    }

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('[Match Preview API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate match previews', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// POST - Generate preview for a specific match
export async function POST(request: NextRequest) {
  try {
    // Check for admin session OR cron secret
    const session = await getServerSession(authOptions);
    console.log('[Match Preview API] Session:', session?.user?.email || 'no session');
    
    const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);
    console.log('[Match Preview API] Is Admin:', isAdmin, 'Email:', session?.user?.email);
    
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    const hasCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isAdmin && !hasCronAuth) {
      console.log('[Match Preview API] Unauthorized - no admin session or cron auth');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const { matchId, homeTeam, awayTeam, sport, sportKey, league, commenceTime, odds } = body;

    if (!matchId || !homeTeam || !awayTeam || !sport || !league || !commenceTime) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['matchId', 'homeTeam', 'awayTeam', 'sport', 'league', 'commenceTime'],
        },
        { status: 400 }
      );
    }

    console.log(`[Match Preview API] Generating preview for: ${homeTeam} vs ${awayTeam}`);

    const result = await generateMatchPreview({
      matchId,
      homeTeam,
      awayTeam,
      sport,
      sportKey: sportKey || sport.toLowerCase().replace(' ', '_'),
      league,
      commenceTime,
      odds,
    });

    if (result.success) {
      // Revalidate blog AND news pages so new posts appear immediately
      revalidatePath('/blog');
      revalidatePath(`/blog/${result.slug}`);
      revalidatePath('/news');
      revalidatePath(`/news/${result.slug}`);
      console.log('[Match Preview API] Revalidated /blog and /news cache');

      return NextResponse.json({
        success: true,
        postId: result.postId,
        slug: result.slug,
        cost: result.cost,
        duration: result.duration,
        url: `/blog/${result.slug}`,
        newsUrl: `/news/${result.slug}`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes('already exists') ? 409 : 500 }
      );
    }

  } catch (error) {
    console.error('[Match Preview API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate match preview', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
