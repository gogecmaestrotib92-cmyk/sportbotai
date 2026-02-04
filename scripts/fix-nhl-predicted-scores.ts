/**
 * Fix NHL Predicted Scores
 * 
 * Updates all NHL predictions that have the default 3.2-3 score
 * to use odds-based calculation for more realistic scores.
 */

import { PrismaClient } from '@prisma/client';
import { getExpectedScores, type ModelInput } from '../src/lib/accuracy-core/prediction-models';

const prisma = new PrismaClient();

async function fixNHLPredictedScores() {
  console.log('🏒 Fixing NHL Predicted Scores...\n');

  // Find all NHL predictions with default scores
  const nhlPredictions = await prisma.prediction.findMany({
    where: {
      sport: { contains: 'hockey' },
      predictedScore: { in: ['3.2-3', '3-3', '3.2-3.0'] }
    },
    select: {
      id: true,
      matchName: true,
      predictedScore: true,
      fullResponse: true,
    }
  });

  console.log(`Found ${nhlPredictions.length} NHL predictions with default scores\n`);

  let fixed = 0;
  let skipped = 0;

  for (const pred of nhlPredictions) {
    const fullResponse = pred.fullResponse as any;
    
    // Get odds from fullResponse - can be in different formats
    const oddsData = fullResponse?.odds;
    const homeOdds = oddsData?.homeOdds || oddsData?.home;
    const awayOdds = oddsData?.awayOdds || oddsData?.away;
    
    if (!homeOdds || !awayOdds) {
      console.log(`⚠️ ${pred.matchName} - No odds found, skipping`);
      skipped++;
      continue;
    }

    // Calculate new expected scores using odds
    const input: ModelInput = {
      sport: 'hockey',
      homeTeam: '',
      awayTeam: '',
      league: 'NHL',
      homeStats: { played: 0, wins: 0, draws: 0, losses: 0, scored: 0, conceded: 0 },
      awayStats: { played: 0, wins: 0, draws: 0, losses: 0, scored: 0, conceded: 0 },
      homeForm: '-----',
      awayForm: '-----',
    };

    const newScores = getExpectedScores(input, {
      homeOdds: homeOdds,
      awayOdds: awayOdds,
    });

    const newPredictedScore = `${newScores.home}-${newScores.away}`;
    
    // Update fullResponse.expectedScores too
    const updatedFullResponse = {
      ...fullResponse,
      expectedScores: newScores,
    };

    // Also update marketIntel.expectedScores if it exists
    if (updatedFullResponse.marketIntel) {
      updatedFullResponse.marketIntel.expectedScores = newScores;
    }

    await prisma.prediction.update({
      where: { id: pred.id },
      data: {
        predictedScore: newPredictedScore,
        fullResponse: updatedFullResponse,
      }
    });

    console.log(`✅ ${pred.matchName}: ${pred.predictedScore} → ${newPredictedScore} (odds: ${homeOdds.toFixed(2)}/${awayOdds.toFixed(2)})`);
    fixed++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Skipped (no odds): ${skipped}`);
  console.log(`   Total: ${nhlPredictions.length}`);
}

fixNHLPredictedScores()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
