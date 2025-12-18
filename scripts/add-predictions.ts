/**
 * Script to add recent analyses to PredictionOutcome table
 * Run with: npx ts-node scripts/add-predictions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addRecentAnalysesToPredictions() {
  console.log('Fetching recent analyses...');
  
  const recentAnalyses = await prisma.analysis.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      homeTeam: true,
      awayTeam: true,
      league: true,
      matchDate: true,
      bestValueSide: true,
      createdAt: true,
    },
  });
  
  console.log(`Found ${recentAnalyses.length} recent analyses`);
  
  let created = 0;
  let skipped = 0;
  
  for (const analysis of recentAnalyses) {
    const matchRef = `${analysis.homeTeam} vs ${analysis.awayTeam}`;
    const favored = analysis.bestValueSide || 'draw';
    
    // Check if prediction exists
    const existing = await prisma.predictionOutcome.findFirst({
      where: { matchRef },
    });
    
    if (existing) {
      console.log(`⏭️  Skipping (exists): ${matchRef}`);
      skipped++;
      continue;
    }
    
    const predictedScenario = favored === 'home' 
      ? `${analysis.homeTeam} win` 
      : favored === 'away' 
        ? `${analysis.awayTeam} win` 
        : 'Draw';
    
    await prisma.predictionOutcome.create({
      data: {
        matchRef,
        league: analysis.league,
        matchDate: analysis.matchDate || new Date(),
        narrativeAngle: 'Match Analysis prediction',
        predictedScenario,
        confidenceLevel: 65,
        source: 'MATCH_ANALYSIS',
      },
    });
    console.log(`✅ Created: ${matchRef} -> ${predictedScenario}`);
    created++;
  }
  
  console.log(`\n📊 Summary: Created ${created}, Skipped ${skipped}`);
  await prisma.$disconnect();
}

addRecentAnalysesToPredictions().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
