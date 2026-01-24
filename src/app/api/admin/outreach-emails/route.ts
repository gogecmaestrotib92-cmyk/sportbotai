import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get filter from query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status !== 'all') {
      where.outreachStatus = status;
    } else {
      // Show all that have been sent or have any activity
      where.outreachStatus = {
        in: ['SENT', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED'],
      };
    }

    // Fetch outreach emails with tracking data
    const outreachEmails = await prisma.toolReview.findMany({
      where,
      select: {
        id: true,
        toolName: true,
        toolUrl: true,
        contactEmail: true,
        blogSlug: true,
        reviewTitle: true,
        outreachStatus: true,
        outreachSentAt: true,
        outreachOpened: true,
        outreachClicked: true,
        outreachReplied: true,
        outreachReplyAt: true,
        backlinkStatus: true,
        backlinkUrl: true,
      },
      orderBy: {
        outreachSentAt: 'desc',
      },
      take: limit,
    });

    // Get stats
    const stats = await prisma.toolReview.groupBy({
      by: ['outreachStatus'],
      _count: true,
    });

    const statsMap = stats.reduce((acc, s) => {
      acc[s.outreachStatus] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      outreachEmails,
      stats: {
        total: outreachEmails.length,
        sent: statsMap['SENT'] || 0,
        opened: statsMap['OPENED'] || 0,
        clicked: statsMap['CLICKED'] || 0,
        replied: statsMap['REPLIED'] || 0,
        bounced: statsMap['BOUNCED'] || 0,
        notSent: statsMap['NOT_SENT'] || 0,
        noEmail: statsMap['NO_EMAIL'] || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching outreach emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outreach emails' },
      { status: 500 }
    );
  }
}
