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
    const type = searchParams.get('type') || 'all'; // 'all', 'tool-review', 'nurture'
    const limit = parseInt(searchParams.get('limit') || '100');

    // ============================================
    // TOOL REVIEW OUTREACH
    // ============================================
    let toolReviewEmails: any[] = [];
    if (type === 'all' || type === 'tool-review') {
      const toolWhere: Record<string, unknown> = {};
      if (status !== 'all') {
        toolWhere.outreachStatus = status;
      } else {
        toolWhere.outreachStatus = {
          in: ['SENT', 'OPENED', 'CLICKED', 'REPLIED', 'BOUNCED'],
        };
      }

      toolReviewEmails = await prisma.toolReview.findMany({
        where: toolWhere,
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

      // Add type marker
      toolReviewEmails = toolReviewEmails.map(e => ({
        ...e,
        emailType: 'tool-review',
      }));
    }

    // ============================================
    // NURTURE CAMPAIGNS (Daily Picks, etc.)
    // ============================================
    let nurtureEmails: any[] = [];
    if (type === 'all' || type === 'nurture') {
      const nurtureWhere: Record<string, unknown> = {};
      if (status !== 'all') {
        nurtureWhere.status = status;
      }

      nurtureEmails = await prisma.emailCampaign.findMany({
        where: nurtureWhere,
        select: {
          id: true,
          type: true,
          subject: true,
          userId: true,
          userEmail: true,
          userName: true,
          matchesData: true,
          status: true,
          sentAt: true,
          openedAt: true,
          clickedAt: true,
          unsubscribedAt: true,
          convertedToPaid: true,
          convertedAt: true,
        },
        orderBy: {
          sentAt: 'desc',
        },
        take: limit,
      });

      // Map to unified format
      nurtureEmails = nurtureEmails.map(e => ({
        id: e.id,
        toolName: e.type === 'DAILY_PICKS' ? '🎯 Daily Picks' : e.type,
        toolUrl: null,
        contactEmail: e.userEmail,
        blogSlug: null,
        reviewTitle: e.subject,
        outreachStatus: e.status,
        outreachSentAt: e.sentAt,
        outreachOpened: !!e.openedAt,
        outreachClicked: !!e.clickedAt,
        outreachReplied: e.convertedToPaid,
        outreachReplyAt: e.convertedAt,
        backlinkStatus: e.convertedToPaid ? 'DOFOLLOW' : 'NONE', // Converted = success
        backlinkUrl: null,
        emailType: 'nurture',
        userName: e.userName,
        matchesCount: Array.isArray(e.matchesData) ? e.matchesData.length : 0,
      }));
    }

    // Combine and sort by date
    const allEmails = [...toolReviewEmails, ...nurtureEmails]
      .sort((a, b) => {
        const dateA = a.outreachSentAt ? new Date(a.outreachSentAt).getTime() : 0;
        const dateB = b.outreachSentAt ? new Date(b.outreachSentAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);

    // Get stats for tool reviews
    const toolStats = await prisma.toolReview.groupBy({
      by: ['outreachStatus'],
      _count: true,
    });

    const toolStatsMap = toolStats.reduce((acc, s) => {
      acc[s.outreachStatus] = s._count;
      return acc;
    }, {} as Record<string, number>);

    // Get stats for nurture campaigns
    const nurtureStats = await prisma.emailCampaign.groupBy({
      by: ['status'],
      _count: true,
    });

    const nurtureCount = nurtureStats.reduce((acc, s) => acc + s._count, 0);
    const nurtureConverted = await prisma.emailCampaign.count({
      where: { convertedToPaid: true },
    });

    return NextResponse.json({
      outreachEmails: allEmails,
      stats: {
        total: allEmails.length,
        sent: (toolStatsMap['SENT'] || 0) + nurtureCount,
        opened: toolStatsMap['OPENED'] || 0,
        clicked: toolStatsMap['CLICKED'] || 0,
        replied: toolStatsMap['REPLIED'] || 0,
        bounced: toolStatsMap['BOUNCED'] || 0,
        notSent: toolStatsMap['NOT_SENT'] || 0,
        noEmail: toolStatsMap['NO_EMAIL'] || 0,
        // Nurture-specific stats
        nurtureTotal: nurtureCount,
        nurtureConverted,
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
