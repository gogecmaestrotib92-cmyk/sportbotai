/**
 * Admin API - Clear Match Preview Cache
 * 
 * POST /api/admin/clear-cache
 * Body: { homeTeam, awayTeam, sport, matchDate }
 * 
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cacheDelete, CACHE_KEYS } from '@/lib/cache';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Admin emails (same as other admin endpoints)
const ADMIN_EMAILS = ['office@sportbotai.com', 'stefan.miletic@gmail.com'];

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { homeTeam, awayTeam, sport, matchDate } = body;

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: 'Missing required fields: homeTeam, awayTeam' },
        { status: 400 }
      );
    }

    // Build cache key (same format as match-preview API)
    const dateStr = matchDate || new Date().toISOString().split('T')[0];
    const sportKey = sport || 'soccer';
    const cacheKey = CACHE_KEYS.matchPreview(homeTeam, awayTeam, sportKey, dateStr);

    console.log(`[Admin] Clearing cache for key: ${cacheKey}`);

    // Delete the cache
    await cacheDelete(cacheKey);

    return NextResponse.json({
      success: true,
      message: `Cache cleared for ${homeTeam} vs ${awayTeam}`,
      cacheKey,
    });
  } catch (error) {
    console.error('[Admin] Clear cache error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
