/**
 * Recalculate edge values using CORRECT formula:
 * Edge = Model Probability - Market Implied Probability
 * 
 * Uses homeWin/awayWin/draw from DB and odds from fullResponse
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function recalculate() {
  const preds = await prisma.prediction.findMany({
    where: {
      kickoff: { gte: new Date('2026-02-01') },
      fullResponse: { not: null },
    },
  });

  console.log(`Found ${preds.length} predictions to check\n`);

  let fixed = 0;
  let noValue = 0;

  for (const pred of preds) {
    const fr = pred.fullResponse as any;
    const odds = fr?.odds;
    
    if (!odds?.homeOdds || !odds?.awayOdds) {
      console.log(`SKIP (no odds): ${pred.matchName}`);
      continue;
    }

    // Get model probabilities from DB
    const homeProb = pred.homeWin || 0;
    const awayProb = pred.awayWin || 0;
    const drawProb = pred.draw || 0;

    // Calculate implied probabilities
    const homeImplied = (1 / odds.homeOdds) * 100;
    const awayImplied = (1 / odds.awayOdds) * 100;
    const drawImplied = odds.drawOdds ? (1 / odds.drawOdds) * 100 : 0;

    // Calculate edges
    const homeEdge = homeProb - homeImplied;
    const drawEdge = drawProb - drawImplied;
    const awayEdge = awayProb - awayImplied;

    // Check if sport has draws
    const hasDraw = pred.sport?.includes('soccer') || 
                    pred.sport?.includes('hockey') || 
                    pred.sport?.includes('nhl') ||
                    (drawProb > 0 && drawProb < 20); // Only count draw if meaningful

    // Find best edge
    type Side = 'HOME' | 'AWAY' | 'DRAW';
    let bestSide: Side = 'HOME';
    let bestEdge = homeEdge;
    let bestProb = homeProb;
    let bestOdds = odds.homeOdds;

    // Only consider draw if sport has draws AND draw has real value
    if (hasDraw && drawEdge > bestEdge && drawProb > 0 && drawProb < 40) {
      bestSide = 'DRAW';
      bestEdge = drawEdge;
      bestProb = drawProb;
      bestOdds = odds.drawOdds;
    }
    if (awayEdge > bestEdge) {
      bestSide = 'AWAY';
      bestEdge = awayEdge;
      bestProb = awayProb;
      bestOdds = odds.awayOdds;
    }

    // Get selection text
    const [homeTeam, awayTeam] = pred.matchName.split(' vs ');
    const selection = bestSide === 'HOME' ? homeTeam?.trim() : 
                      bestSide === 'AWAY' ? awayTeam?.trim() : 'Draw';

    // Determine edge bucket
    const edgeBucket = bestEdge >= 5 ? 'HIGH' : 
                       bestEdge >= 3 ? 'MEDIUM' : 
                       bestEdge >= 2 ? 'SMALL' : 'NO_EDGE';

    // Check if values changed
    const oldEdge = pred.edgeValue || 0;
    const edgeChanged = Math.abs(oldEdge - bestEdge) > 0.5;
    const selectionChanged = pred.selection !== selection;

    if (edgeChanged || selectionChanged) {
      console.log(`[${pred.matchName}]`);
      console.log(`  OLD: edge=${oldEdge.toFixed(1)}% selection=${pred.selection}`);
      console.log(`  NEW: edge=${bestEdge.toFixed(1)}% selection=${selection} (${bestSide})`);
      console.log(`  Edges: H=${homeEdge.toFixed(1)}% D=${drawEdge.toFixed(1)}% A=${awayEdge.toFixed(1)}%`);
      
      if (bestEdge < 2) {
        console.log(`  ⚠️  NO VALUE (edge < 2%)`);
        noValue++;
      }
      console.log('');

      await prisma.prediction.update({
        where: { id: pred.id },
        data: {
          selection,
          valueBetSide: bestSide,
          modelProbability: bestProb,
          marketOddsAtPrediction: bestOdds,
          odds: bestOdds,
          edgeValue: bestEdge,
          edgeBucket,
        },
      });
      fixed++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Fixed: ${fixed}`);
  console.log(`No value (edge < 2%): ${noValue}`);

  await prisma.$disconnect();
}

recalculate().catch(console.error);
