import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  // Check for Bruins vs Golden Knights
  const pred = await prisma.prediction.findFirst({
    where: {
      OR: [
        { matchName: { contains: 'Bruins', mode: 'insensitive' } },
        { matchName: { contains: 'Golden Knights', mode: 'insensitive' } },
      ],
      NOT: { fullResponse: { equals: Prisma.DbNull } },
    },
    orderBy: { createdAt: 'desc' }
  });

  if (pred) {
    console.log('=== FOUND PREDICTION ===');
    console.log('matchName:', pred.matchName);
    console.log('matchId:', pred.matchId);
    console.log('sport:', pred.sport);
    console.log('kickoff:', pred.kickoff);
    console.log('hasFullResponse:', !!pred.fullResponse);
  } else {
    console.log('No Bruins/Golden Knights prediction found with fullResponse');
  }
  
  // List recent NHL predictions
  const nhlPreds = await prisma.prediction.findMany({
    where: { sport: { contains: 'nhl', mode: 'insensitive' } },
    select: { matchName: true, sport: true, kickoff: true, source: true },
    orderBy: { kickoff: 'desc' },
    take: 5
  });
  
  console.log('\n=== RECENT NHL PREDICTIONS ===');
  nhlPreds.forEach(p => console.log('-', p.matchName, '|', p.kickoff?.toISOString().split('T')[0]));

  await prisma.$disconnect();
}
check().catch(e => console.error(e));
