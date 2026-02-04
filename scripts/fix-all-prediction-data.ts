/**
 * Fix All Prediction Data
 * 
 * This script fixes inconsistencies between:
 * - Direct fields (homeWin, awayWin, draw, modelProbability, edgeValue)
 * - fullResponse.marketIntel (modelProbability, impliedProbability, valueEdge)
 * 
 * The direct fields should be the source of truth, and fullResponse.marketIntel
 * should be recalculated to match.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing all prediction data inconsistencies...\n');

  // Get all v2 predictions with fullResponse
  const predictions = await prisma.prediction.findMany({
    where: {
      modelVersion: 'v2',
      NOT: { fullResponse: { equals: null } },
    },
  });

  console.log(`Found ${predictions.length} predictions to check\n`);

  let fixedCount = 0;
  let alreadyOkCount = 0;
  let noDataCount = 0;

  for (const pred of predictions) {
    const fr = pred.fullResponse as any;
    if (!fr) {
      noDataCount++;
      continue;
    }

    // Get direct field values (source of truth)
    const directHomeWin = pred.homeWin;
    const directAwayWin = pred.awayWin;
    const directDraw = pred.draw;

    // Skip if no direct data
    if (!directHomeWin || !directAwayWin) {
      noDataCount++;
      continue;
    }

    // Convert to percentages if stored as decimals
    const isDecimal = directHomeWin < 1 && directAwayWin < 1;
    const homeProb = isDecimal ? directHomeWin * 100 : directHomeWin;
    const awayProb = isDecimal ? directAwayWin * 100 : directAwayWin;
    const drawProb = directDraw ? (isDecimal ? directDraw * 100 : directDraw) : undefined;

    // Get fullResponse marketIntel values
    const frModelProb = fr.marketIntel?.modelProbability;
    const frHome = frModelProb?.home || 0;
    const frAway = frModelProb?.away || 0;

    // Check if already consistent (within 5% tolerance)
    const homeMatch = Math.abs(homeProb - frHome) < 5;
    const awayMatch = Math.abs(awayProb - frAway) < 5;

    if (homeMatch && awayMatch) {
      alreadyOkCount++;
      continue;
    }

    // Need to fix - recalculate marketIntel
    console.log(`❌ Fixing: ${pred.matchName}`);
    console.log(`   Direct: H=${homeProb.toFixed(0)}% A=${awayProb.toFixed(0)}%`);
    console.log(`   Was:    H=${frHome}% A=${frAway}%`);

    // Get odds from fullResponse
    const odds = fr.odds;
    if (!odds?.homeOdds || !odds?.awayOdds) {
      console.log(`   ⚠️ No odds data, skipping\n`);
      noDataCount++;
      continue;
    }

    // Calculate fair market probabilities (remove vig)
    const totalImplied = (1/odds.homeOdds + 1/odds.awayOdds + (odds.drawOdds ? 1/odds.drawOdds : 0));
    const impliedHome = ((1/odds.homeOdds) / totalImplied) * 100;
    const impliedAway = ((1/odds.awayOdds) / totalImplied) * 100;
    const impliedDraw = odds.drawOdds ? ((1/odds.drawOdds) / totalImplied) * 100 : undefined;
    const margin = Math.round((totalImplied - 1) * 100);

    // Calculate edges
    const homeEdge = homeProb - impliedHome;
    const awayEdge = awayProb - impliedAway;
    const drawEdgeVal = drawProb && impliedDraw ? drawProb - impliedDraw : undefined;

    // Find best value
    let bestEdge = { outcome: 'none' as const, edgePercent: 0, strength: 'none' as const };
    if (awayEdge > homeEdge && awayEdge > (drawEdgeVal || -999)) {
      bestEdge = { 
        outcome: 'away' as const, 
        edgePercent: parseFloat(awayEdge.toFixed(1)),
        strength: awayEdge >= 10 ? 'strong' as const : awayEdge >= 5 ? 'moderate' as const : 'slight' as const
      };
    } else if (homeEdge > awayEdge && homeEdge > (drawEdgeVal || -999)) {
      bestEdge = { 
        outcome: 'home' as const, 
        edgePercent: parseFloat(homeEdge.toFixed(1)),
        strength: homeEdge >= 10 ? 'strong' as const : homeEdge >= 5 ? 'moderate' as const : 'slight' as const
      };
    } else if (drawEdgeVal && drawEdgeVal > 0) {
      bestEdge = { 
        outcome: 'draw' as const, 
        edgePercent: parseFloat(drawEdgeVal.toFixed(1)),
        strength: drawEdgeVal >= 10 ? 'strong' as const : drawEdgeVal >= 5 ? 'moderate' as const : 'slight' as const
      };
    }

    // Build new marketIntel
    const newMarketIntel = {
      summary: bestEdge.edgePercent > 0 
        ? `Model sees ${bestEdge.outcome === 'home' ? 'Home' : bestEdge.outcome === 'away' ? 'Away' : 'Draw'} +${bestEdge.edgePercent.toFixed(1)}% Value.`
        : 'No significant edge detected.',
      valueEdge: {
        label: bestEdge.edgePercent > 0 
          ? `${bestEdge.outcome === 'home' ? 'Home' : bestEdge.outcome === 'away' ? 'Away' : 'Draw'} +${bestEdge.edgePercent.toFixed(1)}% Value`
          : 'No Edge',
        outcome: bestEdge.outcome,
        strength: bestEdge.strength,
        edgePercent: bestEdge.edgePercent,
      },
      recommendation: bestEdge.edgePercent >= 5 ? 'consider' : 'avoid',
      modelProbability: {
        home: Math.round(homeProb),
        draw: drawProb ? Math.round(drawProb) : undefined,
        away: Math.round(awayProb),
        confidence: Math.max(Math.round(homeProb), Math.round(awayProb)),
      },
      impliedProbability: {
        home: parseFloat(impliedHome.toFixed(1)),
        draw: impliedDraw ? parseFloat(impliedDraw.toFixed(1)) : undefined,
        away: parseFloat(impliedAway.toFixed(1)),
        margin,
      },
      conflictExplanation: null,
    };

    // Fix expectedScores if model and prediction don't match
    let newExpectedScores = fr.expectedScores;
    if (pred.prediction && newExpectedScores) {
      const predSide = pred.prediction.toLowerCase();
      // If prediction is away but expected scores show home winning, fix it
      if (predSide === 'away' && newExpectedScores.home > newExpectedScores.away) {
        newExpectedScores = {
          home: newExpectedScores.away,
          away: newExpectedScores.home,
        };
      } else if (predSide === 'home' && newExpectedScores.away > newExpectedScores.home) {
        newExpectedScores = {
          home: newExpectedScores.away,
          away: newExpectedScores.home,
        };
      }
    }

    // Update fullResponse
    const updatedFR = {
      ...fr,
      marketIntel: newMarketIntel,
      expectedScores: newExpectedScores,
    };

    // Calculate correct edgeValue for direct field
    const bestDirectEdge = Math.max(homeEdge, awayEdge, drawEdgeVal || -999);
    const modelProbability = Math.max(homeProb, awayProb, drawProb || 0);

    // Update prediction
    await prisma.prediction.update({
      where: { id: pred.id },
      data: {
        fullResponse: updatedFR,
        modelProbability: Math.round(modelProbability),
        edgeValue: parseFloat(bestDirectEdge.toFixed(1)),
        marketProbabilityFair: bestEdge.outcome === 'home' ? parseFloat(impliedHome.toFixed(1)) :
                              bestEdge.outcome === 'away' ? parseFloat(impliedAway.toFixed(1)) :
                              impliedDraw ? parseFloat(impliedDraw.toFixed(1)) : null,
      },
    });

    console.log(`   ✅ Fixed: H=${Math.round(homeProb)}% A=${Math.round(awayProb)}% Edge=${bestDirectEdge.toFixed(1)}%\n`);
    fixedCount++;
  }

  console.log('\n========================================');
  console.log(`✅ Fixed: ${fixedCount} predictions`);
  console.log(`✓ Already OK: ${alreadyOkCount} predictions`);
  console.log(`⚠️ No data: ${noDataCount} predictions`);
  console.log('========================================\n');

  await prisma.$disconnect();
}

main().catch(console.error);
