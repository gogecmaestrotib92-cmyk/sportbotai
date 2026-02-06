/**
 * Fix probability format in Prediction table
 * Problem: homeWin, awayWin, draw stored as 0-1 instead of 0-100
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProbabilities() {
  // Get all predictions with probabilities that look like decimals (< 1)
  const predictions = await prisma.prediction.findMany({
    where: {
      OR: [
        { homeWin: { lt: 1, gt: 0 } },
        { awayWin: { lt: 1, gt: 0 } },
      ]
    },
    select: {
      id: true,
      matchName: true,
      homeWin: true,
      awayWin: true,
      draw: true,
    }
  });

  console.log(`Found ${predictions.length} predictions with decimal probabilities`);

  for (const pred of predictions) {
    const newHomeWin = pred.homeWin ? pred.homeWin * 100 : null;
    const newAwayWin = pred.awayWin ? pred.awayWin * 100 : null;
    const newDraw = pred.draw ? pred.draw * 100 : null;

    console.log(`${pred.matchName}: H ${pred.homeWin?.toFixed(2)} → ${newHomeWin?.toFixed(1)}%, A ${pred.awayWin?.toFixed(2)} → ${newAwayWin?.toFixed(1)}%`);

    await prisma.prediction.update({
      where: { id: pred.id },
      data: {
        homeWin: newHomeWin,
        awayWin: newAwayWin,
        draw: newDraw,
      }
    });
  }

  console.log('\nDone!');
  await prisma.$disconnect();
}

fixProbabilities().catch(console.error);
