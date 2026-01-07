/**
 * Quick check of prediction matchId format
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  const predictions = await prisma.prediction.findMany({
    where: {
      kickoff: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    orderBy: { kickoff: 'desc' },
    take: 10,
    select: { 
      matchId: true, 
      matchName: true,
      sport: true,
    },
  });

  console.log('Recent Predictions - matchId format:');
  console.log('='.repeat(80));
  
  for (const p of predictions) {
    console.log(`Match: ${p.matchName}`);
    console.log(`Sport: ${p.sport}`);
    console.log(`matchId: ${p.matchId}`);
    console.log('-'.repeat(80));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
