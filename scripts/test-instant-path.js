const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const homeWord = 'Roma';
  const awayWord = 'Stuttgart';
  
  console.log('Testing INSTANT PATH query...');
  console.log('Looking for:', homeWord, 'vs', awayWord);
  console.log('Kickoff >= ', new Date(Date.now() - 72 * 60 * 60 * 1000));
  
  const prediction = await prisma.prediction.findFirst({
    where: {
      OR: [
        {
          AND: [
            { matchName: { contains: homeWord, mode: 'insensitive' } },
            { matchName: { contains: awayWord, mode: 'insensitive' } },
          ]
        },
        {
          AND: [
            { matchName: { contains: awayWord, mode: 'insensitive' } },
            { matchName: { contains: homeWord, mode: 'insensitive' } },
          ]
        }
      ],
      kickoff: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
    },
    orderBy: { kickoff: 'asc' },
  });
  
  console.log('---');
  console.log('Found:', prediction?.matchName || 'NULL');
  console.log('Has fullResponse:', !!prediction?.fullResponse);
  
  if (prediction?.fullResponse) {
    const fr = prediction.fullResponse;
    console.log('fullResponse keys:', Object.keys(fr));
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);
