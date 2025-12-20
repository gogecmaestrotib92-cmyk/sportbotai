/**
 * Update Referral Source API
 * 
 * Called after OAuth login to capture UTM params from localStorage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { source, medium, campaign } = body;
    
    // Only update if user doesn't already have a referral source
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralSource: true },
    });
    
    // Don't overwrite existing source (first touch attribution)
    if (user?.referralSource) {
      return NextResponse.json({ 
        success: true, 
        message: 'Referral source already set',
        existing: user.referralSource 
      });
    }
    
    // Update with new source
    if (source || medium || campaign) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          referralSource: source || null,
          referralMedium: medium || null,
          referralCampaign: campaign || null,
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Referral source updated',
        source,
        medium,
        campaign,
      });
    }
    
    return NextResponse.json({ success: true, message: 'No source to update' });
    
  } catch (error) {
    console.error('Error updating referral source:', error);
    return NextResponse.json(
      { error: 'Failed to update referral source' },
      { status: 500 }
    );
  }
}
