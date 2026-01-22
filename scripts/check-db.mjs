import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  // Test: searching for "mavericks" + "state" WITH fullResponse filter
  const result = await prisma.prediction.findFirst({
    where: {
      AND: [
        { matchName: { contains: 'mavericks', mode: 'insensitive' } },
        { matchName: { contains: 'state', mode: 'insensitive' } },
      ],
      kickoff: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
      fullResponse: { not: null }, // This is what was missing!
    },
    select: { matchName: true, fullResponse: true },
    orderBy: { kickoff: 'asc' }
  });

  console.log('Result with fullResponse filter:', result ? result.matchName : 'NONE');
  console.log('Has fullResponse:', result ? !!result.fullResponse : 'N/A');

  await prisma.$disconnect();
}
check().catch(e => console.error(e));
