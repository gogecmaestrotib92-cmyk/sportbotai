/**
 * Fix corrupted probabilities in recent predictions
 * Uses fullResponse.marketIntel.modelProbability as source of truth
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  const preds = await prisma.prediction.findMany({
    where: { kickoff: { gte: new Date('2026-02-05') } }
  });
  
  let fixed = 0;
  for (const pred of preds) {
    const fr = pred.fullResponse as any;
    if (!fr?.marketIntel?.modelProbability) continue;
    
    const mp = fr.marketIntel.modelProbability;
    const oldSum = (pred.homeWin || 0) + (pred.draw || 0) + (pred.awayWin || 0);
    const newSum = mp.home + (mp.draw || 0) + mp.away;
    
    if (oldSum > 110 && newSum <= 110) {
      console.log(`[${pred.matchName}]`);
      console.log(`  OLD: H=${pred.homeWin} D=${pred.draw} A=${pred.awayWin} (sum=${oldSum})`);
      console.log(`  NEW: H=${mp.home} D=${mp.draw} A=${mp.away} (sum=${newSum})`);
      
      await prisma.prediction.update({
        where: { id: pred.id },
        data: {
          homeWin: mp.home,
          awayWin: mp.away,
          draw: mp.draw || null,
        }
      });
      fixed++;
    }
  }
  
  console.log(`\nFixed ${fixed} predictions`);
  await prisma.$disconnect();
}

fix().catch(console.error);
