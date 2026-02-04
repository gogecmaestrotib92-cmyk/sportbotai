/**
 * Backfill modelProbability and edgeValue from fullResponse
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const preds = await prisma.prediction.findMany({
    where: { modelProbability: null },
    select: { id: true, matchName: true, fullResponse: true }
  });
  
  console.log('Found', preds.length, 'predictions to update');
  let updated = 0;
  
  for (const p of preds) {
    const fr = p.fullResponse as Record<string, unknown> | null;
    const marketIntel = fr?.marketIntel as Record<string, unknown> | undefined;
    if (!marketIntel) continue;
    
    const modelProb = marketIntel.modelProbability as { confidence?: number } | undefined;
    const valueEdge = marketIntel.valueEdge as { edgePercent?: number } | undefined;
    
    const conf = modelProb?.confidence;
    const edge = valueEdge?.edgePercent;
    
    if (conf != null || edge != null) {
      await prisma.prediction.update({
        where: { id: p.id },
        data: {
          modelProbability: conf ?? 50,
          edgeValue: edge ?? 0
        }
      });
      updated++;
      console.log('Updated:', p.matchName, '- conf:', conf, 'edge:', edge);
    }
  }
  
  console.log('\nDone! Updated', updated, 'predictions');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
