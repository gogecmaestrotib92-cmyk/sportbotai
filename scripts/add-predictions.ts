/**
 * Script to add recent analyses to Prediction table
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
      sport: true,
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
    const existing = await prisma.prediction.findFirst({
      where: { matchName: matchRef },
    });
    
    if (existing) {
      console.log(`⏭️  Skipping (exists): ${matchRef}`);
      skipped++;
      continue;
    }
    
    const predictedScenario = favored === 'home' 
      ? `Home Win - ${analysis.homeTeam}` 
      : favored === 'away' 
        ? `Away Win - ${analysis.awayTeam}` 
        : 'Draw';
    
    await prisma.prediction.create({
      data: {
        matchId: matchRef.replace(/\s+/g, '_').toLowerCase(),
        matchName: matchRef,
        sport: analysis.sport || 'soccer',
        league: analysis.league,
        kickoff: analysis.matchDate || new Date(),
        type: 'MATCH_RESULT',
        prediction: predictedScenario,
        reasoning: 'Match Analysis prediction',
        conviction: 6,
        source: 'MATCH_ANALYSIS',
        outcome: 'PENDING',
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
