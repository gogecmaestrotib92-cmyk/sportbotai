/**
 * Account Deletion API Route
 * 
 * DELETE /api/account/delete
 * 
 * Permanently deletes the authenticated user's account and all associated data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    console.log(`[Account Delete] User ${userEmail} requested account deletion`);

    // Delete all user data in order (respecting foreign key constraints)
    // 1. Delete sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // 2. Delete accounts (OAuth connections)
    await prisma.account.deleteMany({
      where: { userId },
    });

    // 3. Delete analysis history
    await prisma.analysis.deleteMany({
      where: { userId },
    });

    // 4. Delete favorite teams
    await prisma.favoriteTeam.deleteMany({
      where: { userId },
    });

    // 5. Finally, delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`[Account Delete] Successfully deleted account for ${userEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('[Account Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support.' },
      { status: 500 }
    );
  }
}
