import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Find user by email and mark as unsubscribed
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      await prisma.user.update({
        where: { email },
        data: { unsubscribedAt: new Date() },
      });
    }

    // Mark any campaigns to this email as unsubscribed
    await prisma.emailCampaign.updateMany({
      where: { userEmail: email },
      data: { unsubscribedAt: new Date() },
    });

    // Log the unsubscribe
    console.log(`[Unsubscribe] ${email} unsubscribed from marketing emails`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
