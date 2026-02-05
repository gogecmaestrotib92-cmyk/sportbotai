/**
 * Calculate and populate edge values for predictions that are missing them
 */

import { prisma } from '../src/lib/prisma';

// Convert odds to implied probability
function oddsToProb(odds: number): number {
  return (1 / odds) * 100;
}

// Normalize decimal probabilities to percentage
function normalizeProb(prob: number): number {
  // If it's decimal (0-1), convert to percentage
  if (prob <= 1) return prob * 100;
  return prob;
}

// Calculate edge: model probability - market implied probability
function calculateEdge(modelProb: number, marketOdds: number): number {
  const impliedProb = oddsToProb(marketOdds);
  return modelProb - impliedProb;
}

async function main() {
  const now = new Date();
  const futureLimit = new Date(now);
  futureLimit.setUTCDate(futureLimit.getUTCDate() + 7);

  const predictions = await prisma.prediction.findMany({
    where: {
      kickoff: { gte: now, lte: futureLimit },
      outcome: 'PENDING',
      edgeValue: null,
    },
  });

  console.log(`Found ${predictions.length} predictions to update\n`);

  let updated = 0;
  let skipped = 0;

  for (const pred of predictions) {
    const fr = pred.fullResponse as any;
    const odds = fr?.odds;

    if (!odds?.homeOdds || !odds?.awayOdds) {
      console.log(`SKIP (no odds): ${pred.matchName}`);
      skipped++;
      continue;
    }

    // Normalize probabilities
    const homeProb = normalizeProb(pred.homeWin || 0);
    const drawProb = normalizeProb(pred.draw || 0);
    const awayProb = normalizeProb(pred.awayWin || 0);

    if (homeProb + drawProb + awayProb < 90) {
      console.log(`SKIP (invalid probs ${homeProb}+${drawProb}+${awayProb}): ${pred.matchName}`);
      skipped++;
      continue;
    }

    // Calculate edge for each outcome
    const homeEdge = calculateEdge(homeProb, odds.homeOdds);
    const drawEdge = odds.drawOdds ? calculateEdge(drawProb, odds.drawOdds) : -100;
    const awayEdge = calculateEdge(awayProb, odds.awayOdds);

    // Find best edge
    let bestEdge = homeEdge;
    let bestSide: 'HOME' | 'DRAW' | 'AWAY' = 'HOME';
    let bestProb = homeProb;
    let bestOdds = odds.homeOdds;
    let selection = pred.matchName.split(' vs ')[0]; // home team

    if (drawEdge > bestEdge && odds.drawOdds) {
      bestEdge = drawEdge;
      bestSide = 'DRAW';
      bestProb = drawProb;
      bestOdds = odds.drawOdds;
      selection = 'Draw';
    }
    if (awayEdge > bestEdge) {
      bestEdge = awayEdge;
      bestSide = 'AWAY';
      bestProb = awayProb;
      bestOdds = odds.awayOdds;
      selection = pred.matchName.split(' vs ')[1]; // away team
    }

    // Determine edge bucket
    let edgeBucket = 'NONE';
    if (bestEdge >= 10) edgeBucket = 'HIGH';
    else if (bestEdge >= 5) edgeBucket = 'MEDIUM';
    else if (bestEdge >= 2) edgeBucket = 'LOW';

    console.log(`UPDATE: ${pred.matchName}`);
    console.log(`  Model: H=${homeProb.toFixed(1)}% D=${drawProb.toFixed(1)}% A=${awayProb.toFixed(1)}%`);
    console.log(`  Edges: H=${homeEdge.toFixed(1)}% D=${drawEdge.toFixed(1)}% A=${awayEdge.toFixed(1)}%`);
    console.log(`  BEST: ${bestSide} with ${bestEdge.toFixed(1)}% edge @ ${bestOdds} odds`);
    console.log('');

    // Update in database
    await prisma.prediction.update({
      where: { id: pred.id },
      data: {
        homeWin: homeProb,
        draw: drawProb,
        awayWin: awayProb,
        modelProbability: bestProb,
        edgeValue: bestEdge,
        edgeBucket: edgeBucket,
        marketOddsAtPrediction: bestOdds,
        valueBetSide: bestSide,
        selection: selection,
      },
    });

    updated++;
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);

  await prisma.$disconnect();
}

main().catch(console.error);
