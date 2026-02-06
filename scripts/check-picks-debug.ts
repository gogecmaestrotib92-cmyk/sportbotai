import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function check() {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2*60*60*1000);
  
  const all = await p.prediction.findMany({
    where: { kickoff: { gt: twoHoursAgo } },
    orderBy: { kickoff: 'asc' },
    select: { matchName: true, edgeValue: true, modelProbability: true, kickoff: true },
    take: 30
  });
  
  console.log('NOW:', now.toISOString());
  console.log('');
  console.log('ALL PREDICTIONS (kickoff > 2 hours ago):');
  console.log('=========================================');
  
  all.forEach((pred, i) => {
    const kickoff = pred.kickoff.toISOString();
    const isPast = pred.kickoff < now;
    const edge = pred.edgeValue ? pred.edgeValue.toFixed(1) : 'N/A';
    const conf = pred.modelProbability ? pred.modelProbability.toFixed(1) : 'N/A';
    const qualifies = pred.edgeValue >= 2 && pred.modelProbability >= 50 && !isPast;
    const status = isPast ? '(PAST)' : qualifies ? 'YES' : 'NO';
    console.log(`${i+1}. [${status}] ${pred.matchName}`);
    console.log(`   Edge: ${edge}% | Conf: ${conf}% | ${kickoff}`);
  });
  
  // Count qualifying
  const qualifying = all.filter(pred => 
    pred.edgeValue >= 2 && 
    pred.modelProbability >= 50 && 
    pred.kickoff > now
  );
  
  console.log('');
  console.log(`Total qualifying for Daily Picks: ${qualifying.length}`);
  
  await p.$disconnect();
}

check();
