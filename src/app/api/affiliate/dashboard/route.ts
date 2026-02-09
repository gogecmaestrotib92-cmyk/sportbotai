/**
 * API Route: /api/affiliate/dashboard
 * Get affiliate dashboard data
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

    // Recent conversions (last 10)
    const recentConversions = affiliate.conversions.slice(0, 10).map(c => ({
      id: c.id,
      planName: c.planName,
      amount: c.amount,
      commission: c.commission,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    }));

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

      monthlyStats.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        clicks: monthClicks,
        conversions: monthConversions.length,
        commission: monthCommission,
      });
    }

    return NextResponse.json({
      affiliate: {
        name: affiliate.name,
        code: affiliate.code,
        email: affiliate.email,
        status: affiliate.status,
        commissionRate: affiliate.commissionRate,
      },
      stats: {
        totalClicks,
        totalConversions,
        conversionRate,
        pendingCommission,
        approvedCommission,
        paidCommission,
        totalEarnings,
      },
      recentConversions,
      monthlyStats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
