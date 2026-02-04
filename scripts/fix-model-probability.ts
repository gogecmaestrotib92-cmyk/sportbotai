/**
 * Fix modelProbability values
 * 
 * modelProbability should be the MAX probability (home/draw/away) * 100
 * This represents our model's confidence in the most likely outcome
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find predictions where modelProbability seems too low (not properly calculated)
  const preds = await prisma.prediction.findMany({
    where: {
      outcome: 'PENDING',
      OR: [
        { modelProbability: null },
        { modelProbability: { lt: 30 } } // Likely miscalculated
      ]
    },
    select: { 
      id: true, 
      matchName: true, 
      modelProbability: true,
      homeWin: true,
      draw: true,
      awayWin: true,
    }
  });
  
  console.log('Found', preds.length, 'predictions to fix');
  let updated = 0;
  
  for (const p of preds) {
    // Calculate max probability as percentage
    const probs = [p.homeWin || 0, p.draw || 0, p.awayWin || 0];
    const maxProb = Math.max(...probs);
    
    // Convert to percentage (0.65 -> 65)
    const modelProbability = Math.round(maxProb * 100);
    
    if (modelProbability > 30) { // Only update if it's meaningful
      await prisma.prediction.update({
        where: { id: p.id },
        data: { modelProbability }
      });
      updated++;
      console.log('Fixed:', p.matchName, '| old:', p.modelProbability, '-> new:', modelProbability, 
        `(h:${Math.round((p.homeWin||0)*100)}% d:${Math.round((p.draw||0)*100)}% a:${Math.round((p.awayWin||0)*100)}%)`);
    }
  }
  
  console.log('\nDone! Fixed', updated, 'predictions');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
