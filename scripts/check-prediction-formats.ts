import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const preds = await prisma.prediction.findMany({
    where: { outcome: { in: ['HIT', 'MISS'] } },
    select: { prediction: true, outcome: true, actualScore: true, matchName: true },
    take: 30,
    orderBy: { kickoff: 'desc' }
  });

  console.log('Sample predictions:\n');
  preds.forEach(p => {
    const pred = p.prediction.toLowerCase();
    const scoreParts = p.actualScore!.split('-').map(s => parseInt(s.trim()));
    const winner = scoreParts[0] > scoreParts[1] ? 'home' : scoreParts[1] > scoreParts[0] ? 'away' : 'draw';
    
    // Check what the old logic would match
    const oldLogicHome = pred.includes('home') || pred.includes('win');
    const newLogicHome = pred.includes('home win') || (pred.includes('home') && !pred.includes('away'));
    const newLogicAway = pred.includes('away win') || (pred.includes('away') && !pred.includes('home'));
    
    console.log(`Prediction: "${p.prediction}"`);
    console.log(`  Match: ${p.matchName}`);
    console.log(`  Score: ${p.actualScore} (winner: ${winner})`);
    console.log(`  Outcome: ${p.outcome}`);
    console.log(`  Old logic home: ${oldLogicHome}, New logic home: ${newLogicHome}, New logic away: ${newLogicAway}`);
    console.log();
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
