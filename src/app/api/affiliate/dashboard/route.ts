/**
 * API Route: /api/affiliate/dashboard
 * Get affiliate dashboard data with detailed tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AFFILIATE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'affiliate-secret-key'
);

async function getAffiliateFromToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('affiliate_token')?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.affiliateId as string;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const affiliateId = await getAffiliateFromToken();
    
    if (!affiliateId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get affiliate with stats
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        clicks: {
          orderBy: { createdAt: 'desc' },
        },
        conversions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Calculate stats
    const totalClicks = affiliate.clicks.length;
    const totalConversions = affiliate.conversions.length;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayClicks = affiliate.clicks.filter(c => c.createdAt >= today).length;
    const todayConversions = affiliate.conversions.filter(c => c.createdAt >= today).length;

    // This week's stats
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekClicks = affiliate.clicks.filter(c => c.createdAt >= weekStart).length;
    const weekConversions = affiliate.conversions.filter(c => c.createdAt >= weekStart).length;

    // Unique visitors (based on IP hash)
    const uniqueVisitors = new Set(affiliate.clicks.map(c => c.ipHash).filter(Boolean)).size;

    const pendingCommission = affiliate.conversions
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.commission, 0);

    const approvedCommission = affiliate.conversions
      .filter(c => c.status === 'APPROVED')
      .reduce((sum, c) => sum + c.commission, 0);

    const paidCommission = affiliate.conversions
      .filter(c => c.status === 'PAID')
      .reduce((sum, c) => sum + c.commission, 0);

    const totalEarnings = pendingCommission + approvedCommission + paidCommission;

    // Average order value
    const avgOrderValue = totalConversions > 0
      ? affiliate.conversions.reduce((sum, c) => sum + c.amount, 0) / totalConversions
      : 0;

    // Recent conversions (last 20)
    const recentConversions = affiliate.conversions.slice(0, 20).map(c => ({
      id: c.id,
      planName: c.planName,
      amount: c.amount,
      commission: c.commission,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    }));

    // Recent clicks (last 20) with details
    const recentClicks = affiliate.clicks.slice(0, 20).map(c => ({
      id: c.id,
      landingPage: c.landingPage || '/',
      referer: c.referer || 'Direct',
      createdAt: c.createdAt.toISOString(),
      converted: !!c.convertedAt,
    }));

    // Top landing pages
    const landingPageCounts: Record<string, number> = {};
    affiliate.clicks.forEach(c => {
      const page = c.landingPage || '/';
      landingPageCounts[page] = (landingPageCounts[page] || 0) + 1;
    });
    const topLandingPages = Object.entries(landingPageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }));

    // Top referrers
    const refererCounts: Record<string, number> = {};
    affiliate.clicks.forEach(c => {
      const ref = c.referer ? new URL(c.referer).hostname : 'Direct';
      refererCounts[ref] = (refererCounts[ref] || 0) + 1;
    });
    const topReferrers = Object.entries(refererCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));

    // Monthly stats (last 6 months)
    const now = new Date();
    const monthlyStats = [];
    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthClicks = affiliate.clicks.filter(c => 
        c.createdAt >= month && c.createdAt <= monthEnd
      ).length;

      const monthConversions = affiliate.conversions.filter(c =>
        c.createdAt >= month && c.createdAt <= monthEnd
      );

      const monthCommission = monthConversions.reduce((sum, c) => sum + c.commission, 0);
      const monthRevenue = monthConversions.reduce((sum, c) => sum + c.amount, 0);

      monthlyStats.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        clicks: monthClicks,
        conversions: monthConversions.length,
        commission: monthCommission,
        revenue: monthRevenue,
      });
    }

    // Daily stats for last 7 days (for chart)
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayClicks = affiliate.clicks.filter(c => 
        c.createdAt >= day && c.createdAt <= dayEnd
      ).length;

      const dayConversions = affiliate.conversions.filter(c =>
        c.createdAt >= day && c.createdAt <= dayEnd
      ).length;

      dailyStats.push({
        date: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        clicks: dayClicks,
        conversions: dayConversions,
      });
    }

    return NextResponse.json({
      affiliate: {
        name: affiliate.name,
        code: affiliate.code,
        email: affiliate.email,
        status: affiliate.status,
        commissionRate: affiliate.commissionRate,
        cookieDays: affiliate.cookieDays,
        createdAt: affiliate.createdAt.toISOString(),
      },
      stats: {
        totalClicks,
        totalConversions,
        conversionRate,
        uniqueVisitors,
        todayClicks,
        todayConversions,
        weekClicks,
        weekConversions,
        pendingCommission,
        approvedCommission,
        paidCommission,
        totalEarnings,
        avgOrderValue,
      },
      recentConversions,
      recentClicks,
      topLandingPages,
      topReferrers,
      monthlyStats,
      dailyStats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
