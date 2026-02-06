import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugEdge() {
  const pred = await prisma.prediction.findFirst({
    where: { 
      matchName: { contains: 'Manchester United vs Tottenham' },
      fullResponse: { not: null }
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!pred) {
    console.log('No prediction found');
    return;
  }

  console.log('=== MATCH ===');
  console.log('Name:', pred.matchName);
  console.log('Selection:', pred.selection);
  console.log('');
  
  console.log('=== STORED VALUES ===');
  console.log('Edge Value:', pred.edgeValue?.toFixed(2), '%');
  console.log('Model Probability:', pred.modelProbability?.toFixed(2), '%');
  console.log('Market Odds:', pred.marketOddsAtPrediction);
  console.log('');
  
  console.log('=== PROBABILITIES (stored) ===');
  console.log('Home Win:', pred.homeWin?.toFixed(2), '%');
  console.log('Away Win:', pred.awayWin?.toFixed(2), '%');
  console.log('Draw:', pred.draw?.toFixed(2), '%');
  const total = (pred.homeWin || 0) + (pred.awayWin || 0) + (pred.draw || 0);
  console.log('TOTAL:', total.toFixed(2), '%');
  console.log('');

  // Check fullResponse
  const fr = pred.fullResponse as any;
  if (fr?.odds) {
    console.log('=== ODDS FROM FULL RESPONSE ===');
    console.log(JSON.stringify(fr.odds, null, 2));
  }
  
  if (fr?.probabilities) {
    console.log('=== PROBABILITIES FROM FULL RESPONSE ===');
    console.log(JSON.stringify(fr.probabilities, null, 2));
  }

  await prisma.$disconnect();
}

debugEdge().catch(console.error);
