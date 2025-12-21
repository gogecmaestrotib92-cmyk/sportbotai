/**
 * Admin User Management API
 * 
 * GET /api/admin/users - List users with filters
 * POST /api/admin/users - Perform actions on users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Plan } from '@prisma/client';

// Admin access list
const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
  'gogani92@gmail.com',
  'stefan@automateed.com',
  'streamentor@gmail.com',
];

async function isAdmin(request: NextRequest): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!(session?.user?.email && ADMIN_EMAILS.includes(session.user.email));
}

/**
 * GET /api/admin/users
 * List users with optional filters
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const plan = searchParams.get('plan') as Plan | null;
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (plan) {
      where.plan = plan;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          plan: true,
          analysisCount: true,
          bonusCredits: true,
          lastActiveAt: true,
          lastAnalysisDate: true,
          isBanned: true,
          bannedReason: true,
          referralSource: true,
          referralMedium: true,
          referralCampaign: true,
          createdAt: true,
          stripeSubscriptionId: true,
          stripeCurrentPeriodEnd: true,
          accounts: {
            select: { provider: true },
          },
          _count: {
            select: { 
              analyses: true,
              favoriteTeams: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform for frontend
    const transformedUsers = users.map((user: any) => ({
      ...user,
      authProviders: user.accounts?.map((a: any) => a.provider) || [],
      analysesCount: user._count?.analyses || 0,
      favoriteTeamsCount: user._count?.favoriteTeams || 0,
      hasActiveSubscription: user.stripeCurrentPeriodEnd 
        ? new Date(user.stripeCurrentPeriodEnd) > new Date() 
        : false,
    }));

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Admin Users] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Perform admin actions on users
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, userId, data } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing userId or action' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'addCredits': {
        const credits = parseInt(data?.credits || '0');
        if (credits <= 0) {
          return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
        }
        
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { bonusCredits: { increment: credits } },
        });
        
        return NextResponse.json({
          success: true,
          message: `Added ${credits} credits to ${user.email}`,
          newBalance: updated.bonusCredits,
        });
      }

      case 'changePlan': {
        const newPlan = data?.plan as Plan;
        if (!['FREE', 'PRO', 'PREMIUM', 'ADMIN'].includes(newPlan)) {
          return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            plan: newPlan,
            // Reset analysis count when upgrading
            ...(newPlan !== 'FREE' ? { analysisCount: 0 } : {}),
          },
        });
        
        return NextResponse.json({
          success: true,
          message: `Changed ${user.email} plan to ${newPlan}`,
        });
      }

      case 'ban': {
        const reason = data?.reason || 'Banned by admin';
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            isBanned: true,
            bannedReason: reason,
          },
        });
        
        return NextResponse.json({
          success: true,
          message: `Banned user ${user.email}`,
        });
      }

      case 'unban': {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            isBanned: false,
            bannedReason: null,
          },
        });
        
        return NextResponse.json({
          success: true,
          message: `Unbanned user ${user.email}`,
        });
      }

      case 'resetPassword': {
        // Generate a random password reset token (in production, send email)
        const resetToken = crypto.randomUUID();
        
        // For now, just clear the password (user must use OAuth or reset)
        await prisma.user.update({
          where: { id: userId },
          data: { password: null },
        });
        
        return NextResponse.json({
          success: true,
          message: `Password reset for ${user.email}. User must use OAuth or request password reset.`,
        });
      }

      case 'delete': {
        // Delete user and all related data (cascade)
        await prisma.user.delete({
          where: { id: userId },
        });
        
        return NextResponse.json({
          success: true,
          message: `Deleted user ${user.email} and all associated data`,
        });
      }

      case 'exportData': {
        // GDPR data export
        const userData = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            analyses: true,
            favoriteTeams: true,
            accounts: {
              select: { provider: true },
            },
          },
        });
        
        return NextResponse.json({
          success: true,
          data: userData,
          exportedAt: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Admin Users] Action error:', error);
    return NextResponse.json(
      { error: 'Action failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
