/**
 * API Route: /api/affiliate/apply
 * Handle new affiliate applications
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAffiliateApplicationNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, website, audience, promotion } = await request.json();

    if (!name || !email || !promotion) {
      return NextResponse.json(
        { error: 'Name, email, and promotion plan are required' },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await prisma.affiliate.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 400 }
      );
    }

    // Generate unique code from name
    const baseCode = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    const code = `${baseCode}${randomSuffix}`;

    const promotionPlan = `Audience: ${audience || 'Not specified'}\n\nPromotion plan:\n${promotion}`;

    // Create affiliate with PENDING status (no password yet - will be set on approval)
    const affiliate = await prisma.affiliate.create({
      data: {
        name,
        email: email.toLowerCase(),
        code,
        password: '', // Will be set when approved
        website: website || null,
        notes: promotionPlan,
        status: 'PENDING',
      },
    });

    // Send email notification to admins
    await sendAffiliateApplicationNotification(name, email, website, promotionPlan);

    console.log(`[Affiliate] New application: ${name} (${email}) - Code: ${code}`);

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      code: affiliate.code, // For reference
    });
  } catch (error) {
    console.error('Affiliate application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
