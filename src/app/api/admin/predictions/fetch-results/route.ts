'use server';

/**
 * Admin API: Fetch All Prediction Results
 * 
 * This endpoint calls the track-predictions logic but is authenticated
 * via admin session instead of CRON_SECRET, allowing admin dashboard access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ADMIN_EMAILS = [
    'aiinstamarketing@gmail.com',
    'admin@sportbot.ai',
];

export async function POST(request: NextRequest) {
    try {
        // Check admin session
        const session = await getServerSession(authOptions);

        if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Admin Fetch Results] Called by:', session.user.email);

        // Call track-predictions internally with the CRON_SECRET
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const cronSecret = process.env.CRON_SECRET;

        const response = await fetch(`${baseUrl}/api/cron/track-predictions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cronSecret}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Admin Fetch Results] Error:', data);
            return NextResponse.json(
                { error: data.error || 'Failed to fetch results' },
                { status: response.status }
            );
        }

        console.log('[Admin Fetch Results] Success:', {
            updatedOutcomes: data.updatedOutcomes,
            stuckPredictions: data.stuckPredictions,
        });

        return NextResponse.json(data);

    } catch (error) {
        console.error('[Admin Fetch Results] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
