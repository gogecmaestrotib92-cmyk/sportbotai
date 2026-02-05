/**
 * Backfill Edge Data Script
 * 
 * Updates existing predictions that have fullResponse but no edge data.
 * Extracts edge from fullResponse.odds and fullResponse.probabilities.
 */

import { prisma } from '../src/lib/prisma';
import { Prisma } from '@prisma/client';

async function main() {
  console.log('=== BACKFILL EDGE DATA ===\n');

  // Find predictions with fullResponse but no edgeValue
  const predictions = await prisma.prediction.findMany({
    where: {
      edgeValue: null,
      NOT: { fullResponse: { equals: Prisma.DbNull } },
    },
    select: {
      id: true,
      matchName: true,
      homeWin: true,
      awayWin: true,
      draw: true,
      fullResponse: true,
    },
  });

  console.log(`Found ${predictions.length} predictions to update\n`);

  let updated = 0;
  let skipped = 0;

  for (const pred of predictions) {
    const fr = pred.fullResponse as any;
    
    // Try to get odds from fullResponse
    const odds = fr?.odds;
    if (!odds || (!odds.homeOdds && !odds.home)) {
      console.log(`[SKIP] ${pred.matchName} - no odds in fullResponse`);
      skipped++;
      continue;
    }

    // Normalize odds format
    const homeOdds = odds.homeOdds || odds.home;
    const awayOdds = odds.awayOdds || odds.away;
    const drawOdds = odds.drawOdds || odds.draw;

    if (!homeOdds || !awayOdds) {
      console.log(`[SKIP] ${pred.matchName} - missing home/away odds`);
      skipped++;
      continue;
    }

    // Get model probabilities (already in percentage format)
    const homeProb = pred.homeWin || 0;
    const awayProb = pred.awayWin || 0;
    const drawProb = pred.draw || 0;

    // Calculate implied probabilities from odds
    const homeImplied = (1 / homeOdds) * 100;
    const awayImplied = (1 / awayOdds) * 100;
    const drawImplied = drawOdds ? (1 / drawOdds) * 100 : 0;

    // Calculate edges
    const homeEdge = homeProb - homeImplied;
    const awayEdge = awayProb - awayImplied;
    const drawEdge = drawProb - drawImplied;

    // Find best edge
    const candidates = [
      { side: 'HOME' as const, edge: homeEdge, odds: homeOdds, prob: homeProb },
      { side: 'AWAY' as const, edge: awayEdge, odds: awayOdds, prob: awayProb },
    ];
    if (drawOdds && drawProb > 0) {
      candidates.push({ side: 'DRAW' as const, edge: drawEdge, odds: drawOdds, prob: drawProb });
    }
    candidates.sort((a, b) => b.edge - a.edge);
    const best = candidates[0];

    // Determine edge bucket (using Prisma enum values)
    const getEdgeBucket = (edge: number): 'NO_EDGE' | 'SMALL' | 'MEDIUM' | 'HIGH' => {
      if (edge >= 5) return 'HIGH';
      if (edge >= 3) return 'MEDIUM';
      if (edge >= 2) return 'SMALL';
      return 'NO_EDGE';
    };

    // Get team name for selection
    const [homeTeam, awayTeam] = pred.matchName.split(' vs ');
    const selection = best.side === 'HOME' ? homeTeam : best.side === 'AWAY' ? awayTeam : 'Draw';

    // Update prediction
    await prisma.prediction.update({
      where: { id: pred.id },
      data: {
        selection: selection?.trim(),
        modelProbability: best.prob,
        marketOddsAtPrediction: best.odds,
        edgeValue: best.edge,
        edgeBucket: getEdgeBucket(best.edge),
        odds: best.odds,
        valueBetSide: best.side,
        valueBetOdds: best.odds,
        valueBetEdge: best.edge,
      },
    });

    console.log(`[OK] ${pred.matchName} → ${selection} @ ${best.odds.toFixed(2)} (edge: ${best.edge.toFixed(1)}%)`);
    updated++;
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);

  await prisma.$disconnect();
}

main().catch(console.error);
