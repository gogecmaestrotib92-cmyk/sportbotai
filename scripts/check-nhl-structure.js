const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const pred = await prisma.prediction.findFirst({
    where: { 
      sport: { contains: 'hockey' },
    },
    orderBy: { createdAt: 'desc' },
    select: { matchName: true, fullResponse: true }
  });
  
  if (!pred) {
    console.log('No prediction found');
    return;
  }
  
  const fr = pred.fullResponse;
  console.log('Match:', pred.matchName);
  
  if (!fr) {
    console.log('fullResponse is null');
    return;
  }
  
  console.log('\nKeys in fullResponse:', Object.keys(fr));
  console.log('\nodds:', JSON.stringify(fr.odds, null, 2));
  console.log('\nmarketIntel?.odds:', JSON.stringify(fr.marketIntel?.odds, null, 2));
  console.log('\nprobabilities:', JSON.stringify(fr.probabilities, null, 2));
}
check().finally(() => prisma.$disconnect());
