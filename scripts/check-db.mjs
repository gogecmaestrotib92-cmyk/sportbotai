import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const pred = await prisma.prediction.findFirst({
    where: {
      matchName: { contains: 'Mavericks', mode: 'insensitive' },
      NOT: { fullResponse: { equals: Prisma.DbNull } },
    },
    orderBy: { createdAt: 'desc' }
  });

  if (pred?.fullResponse) {
    const fr = pred.fullResponse;
    console.log('=== PREDICTION TABLE ===');
    console.log('matchName:', pred.matchName);
    console.log('matchId:', pred.matchId);
    console.log('sport:', pred.sport);
    console.log('kickoff:', pred.kickoff);
    console.log('');
    console.log('=== PROBABILITIES IN fullResponse ===');
    console.log('probabilities:', JSON.stringify(fr.probabilities, null, 2));
    console.log('');
    console.log('=== MARKET INTEL IN fullResponse ===');
    console.log('marketIntel:', JSON.stringify(fr.marketIntel, null, 2));
    console.log('');
    console.log('=== UNIVERSAL SIGNALS (injuries) ===');
    const signals = fr.universalSignals;
    if (signals?.display?.availability) {
      console.log('homeInjuries:', JSON.stringify(signals.display.availability.homeInjuries, null, 2));
      console.log('awayInjuries:', JSON.stringify(signals.display.availability.awayInjuries, null, 2));
    } else {
      console.log('No injury data in signals');
    }
    console.log('');
    console.log('=== TOP-LEVEL INJURIES ===');
    console.log('injuries:', JSON.stringify(fr.injuries, null, 2));
  }

  await prisma.$disconnect();
}
check().catch(e => console.error(e));
