import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  // Get predictions with 2%+ edge
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const picks = await prisma.prediction.findMany({
    where: {
      edgeValue: { gte: 2 },
      kickoff: { gte: today },
    },
    orderBy: { edgeValue: 'desc' },
    take: 10
  });
  
  console.log('Top picks with 2%+ edge for today/future:');
  console.log('=========================================');
  if (picks.length === 0) {
    console.log('No picks found!');
  }
  picks.forEach(p => {
    console.log(`[${p.edgeValue?.toFixed(1)}%] ${p.matchName} → ${p.selection}`);
    console.log(`  Model: ${p.modelProbability?.toFixed(1)}% | Kickoff: ${p.kickoff}`);
    console.log();
  });
  
  console.log(`Total picks with 2%+ edge: ${picks.length}`);
  
  // Also show total counts
  const total = await prisma.prediction.count();
  const withEdge = await prisma.prediction.count({ where: { edgeValue: { gte: 2 } } });
  console.log(`\nTotal predictions: ${total}`);
  console.log(`With 2%+ edge: ${withEdge}`);
  
  await prisma.$disconnect();
}

check();
