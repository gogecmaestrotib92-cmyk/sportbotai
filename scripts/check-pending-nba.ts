import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.prediction.findMany({
    where: { outcome: 'PENDING', sport: { contains: 'nba' } },
    select: { matchName: true, kickoff: true, sport: true }
  });
  
  console.log('Pending NBA predictions:');
  pending.forEach(p => {
    console.log(`  ${p.matchName} - ${p.kickoff.toISOString().split('T')[0]} - ${p.sport}`);
  });
  
  await prisma.$disconnect();
}

main();
