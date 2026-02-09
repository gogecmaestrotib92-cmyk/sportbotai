/**
 * API Route: /api/affiliate/track
 * Track affiliate link clicks
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { code, referer, landingPage } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    // Find affiliate by code
    const affiliate = await prisma.affiliate.findUnique({
      where: { code },
    });

    if (!affiliate || affiliate.status !== 'ACTIVE') {
      // Silently fail for inactive/invalid codes
      return NextResponse.json({ success: false });
    }

    // Hash IP for privacy (we don't store raw IPs)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

    // Get user agent
    const userAgent = request.headers.get('user-agent') || null;

    // Create click record
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipHash,
        userAgent: userAgent?.slice(0, 255),
        referer: referer?.slice(0, 500) || null,
        landingPage: landingPage?.slice(0, 500) || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Affiliate track error:', error);
    // Don't expose errors to client
    return NextResponse.json({ success: false });
  }
}
