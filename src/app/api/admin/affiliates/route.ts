/**
 * API Route: /api/admin/affiliates
 * Admin management of affiliates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendAffiliateApprovalEmail } from '@/lib/email';

// Admin emails
const ADMIN_EMAILS = ['gogecmaestrotib92@gmail.com', 'aiinstamarketing@gmail.com'];

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.email && ADMIN_EMAILS.includes(session.user.email);
}

// GET - List all affiliates
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const affiliates = await prisma.affiliate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            clicks: true,
            conversions: true,
          },
        },
        conversions: {
          select: { commission: true },
        },
      },
    });

    // Calculate total commission for each affiliate
    const affiliatesWithCommission = affiliates.map(a => ({
      ...a,
      totalCommission: a.conversions.reduce((sum, c) => sum + c.commission, 0),
      conversions: undefined, // Don't expose full conversions list
    }));

    return NextResponse.json({ affiliates: affiliatesWithCommission });
  } catch (error) {
    console.error('Admin affiliates error:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
  }
}

// PATCH - Update affiliate status
export async function PATCH(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status, password } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    // Get affiliate info first (for email)
    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status };

    // If approving and password provided, hash and save it
    if (status === 'ACTIVE' && password) {
      updateData.password = await bcrypt.hash(password, 10);
      updateData.approvedAt = new Date();
    }

    await prisma.affiliate.update({
      where: { id },
      data: updateData,
    });

    // Send approval email if being activated
    if (status === 'ACTIVE' && password) {
      await sendAffiliateApprovalEmail(
        affiliate.email,
        affiliate.name,
        password,
        affiliate.code
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin affiliate update error:', error);
    return NextResponse.json({ error: 'Failed to update affiliate' }, { status: 500 });
  }
}
