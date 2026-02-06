'use server';

/**
 * Admin API: Delete Prediction
 * 
 * Allows admins to delete invalid/garbage predictions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAILS = [
    'aiinstamarketing@gmail.com',
    'admin@sportbotai.com',
];

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check admin session
        const session = await getServerSession(authOptions);

        if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 });
        }

        console.log('[Admin Delete Prediction] Deleting:', id, 'by:', session.user.email);

        // Delete the prediction
        await prisma.prediction.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, deletedId: id });

    } catch (error) {
        console.error('[Admin Delete Prediction] Error:', error);

        // Check for not found error
        if (error instanceof Error && error.message.includes('not found')) {
            return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
