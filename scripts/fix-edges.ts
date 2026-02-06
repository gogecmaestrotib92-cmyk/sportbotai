/**
 * Recalculate edge values for all predictions
 * Edge = Model Probability - Market Implied Probability (no vig)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function oddsToImpliedProb(odds: number): number {
  return 1 / odds;
}

async function recalculateEdges() {
  const predictions = await prisma.prediction.findMany({
    where: {
      marketOddsAtPrediction: { not: null },
      modelProbability: { not: null },
    },
    select: {
      id: true,
      matchName: true,
      selection: true,
      modelProbability: true,
      marketOddsAtPrediction: true,
      edgeValue: true,
      homeWin: true,
      awayWin: true,
    }
  });

  console.log(`Found ${predictions.length} predictions to recalculate\n`);

  let fixed = 0;
  for (const pred of predictions) {
    const marketOdds = pred.marketOddsAtPrediction!;
    const modelProb = pred.modelProbability!; // Now in 0-100 format
    
    // Market implied probability (no-vig approximation)
    const marketImpliedProb = oddsToImpliedProb(marketOdds) * 100; // Convert to %
    
    // Edge = Model - Market (both in %)
    const newEdge = modelProb - marketImpliedProb;
    
    // Only update if edge changed significantly
    if (Math.abs((pred.edgeValue || 0) - newEdge) > 0.5) {
      console.log(`${pred.matchName} [${pred.selection}]:`);
      console.log(`  Model: ${modelProb.toFixed(1)}% | Market: ${marketImpliedProb.toFixed(1)}% (odds ${marketOdds.toFixed(2)})`);
      console.log(`  Edge: ${pred.edgeValue?.toFixed(1)}% → ${newEdge.toFixed(1)}%`);
      console.log('');
      
      await prisma.prediction.update({
        where: { id: pred.id },
        data: {
          edgeValue: newEdge,
          edgeBucket: newEdge >= 5 ? 'HIGH' : newEdge >= 3 ? 'MEDIUM' : newEdge >= 2 ? 'SMALL' : 'NO_EDGE',
        }
      });
      fixed++;
    }
  }

  console.log(`\nRecalculated ${fixed} edges`);
  await prisma.$disconnect();
}

recalculateEdges().catch(console.error);
