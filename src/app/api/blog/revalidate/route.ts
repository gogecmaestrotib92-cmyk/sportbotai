// API route to revalidate/clear blog page cache

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Check for admin auth
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || 'sportbot-admin-2024';
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Revalidate blog pages
    revalidatePath('/blog');
    revalidatePath('/blog/[slug]', 'page');

    return NextResponse.json({
      success: true,
      message: 'Blog cache cleared',
      revalidatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Revalidate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    );
  }
}
