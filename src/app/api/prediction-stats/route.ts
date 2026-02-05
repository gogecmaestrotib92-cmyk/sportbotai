/**
 * Prediction Stats API
 * 
 * Returns real track record stats from our predictions database.
 * Used by /picks page to show actual performance.
 * Same logic as admin dashboard ROI simulation.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all settled predictions with binaryOutcome (same as admin dashboard)
    // Only count those with edge >= 2% (our betting threshold)
    const predictions = await prisma.prediction.findMany({
      where: {
        binaryOutcome: { not: null },
      },
      select: {
        binaryOutcome: true,
        edgeValue: true,
        valueBetEdge: true,
        marketOddsAtPrediction: true,
        odds: true,
      },
    });

    // Filter to only edge >= 2% (same as admin ROI simulation)
    const qualifiedPicks = predictions.filter(p => {
      const edge = p.edgeValue ?? p.valueBetEdge ?? 0;
      return Math.abs(edge) >= 2;
    });

    const totalPicks = qualifiedPicks.length;
    
    if (totalPicks === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalPicks: 0,
          roi: 0,
          hasData: false,
        },
      });
    }

    // Calculate ROI (same as admin dashboard)
    // Flat 1 unit stake per prediction
    let totalBets = 0;
    let totalProfit = 0;
    
    for (const p of qualifiedPicks) {
      const odds = p.marketOddsAtPrediction ?? p.odds ?? 0;
      if (odds <= 1) continue;
      
      totalBets++;
      // profit = (odds - 1) if win, -1 if loss (1 unit stake)
      const profit = p.binaryOutcome === 1 ? (odds - 1) : -1;
      totalProfit += profit;
    }

    if (totalBets === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalPicks: 0,
          roi: 0,
          hasData: false,
        },
      });
    }

    const roi = Math.round((totalProfit / totalBets) * 1000) / 10; // percentage with 1 decimal

    return NextResponse.json({
      success: true,
      stats: {
        totalPicks: totalBets,
        roi,
        hasData: true,
      },
    });
  } catch (error) {
    console.error('Error fetching prediction stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
