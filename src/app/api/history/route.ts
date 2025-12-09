/**
 * API Route: /api/history
 * 
 * GET - Retrieve user's analysis history
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = token.id as string;

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sport = searchParams.get('sport');

    // Build where clause
    const where: any = { userId };
    if (sport) {
      where.sport = sport;
    }

    // Fetch analyses
    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          sport: true,
          league: true,
          homeTeam: true,
          awayTeam: true,
          matchDate: true,
          homeWinProb: true,
          drawProb: true,
          awayWinProb: true,
          riskLevel: true,
          bestValueSide: true,
          userPick: true,
          userStake: true,
          createdAt: true,
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    return NextResponse.json({
      analyses,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
