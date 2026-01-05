import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check last 7 days of predictions by date and sport
  const stats = await prisma.$queryRaw`
    SELECT 
      DATE("createdAt") as date, 
      sport, 
      COUNT(*)::int as count 
    FROM "Prediction" 
    WHERE "createdAt" > NOW() - INTERVAL '7 days' 
    GROUP BY DATE("createdAt"), sport 
    ORDER BY date DESC, count DESC
  `;
  
  console.log('\n=== Predictions created in last 7 days ===');
  console.table(stats);
  
  // Check pending predictions for upcoming matches
  const pending = await prisma.$queryRaw`
    SELECT 
      sport,
      league,
      COUNT(*)::int as count,
      MIN(kickoff)::text as earliest,
      MAX(kickoff)::text as latest
    FROM "Prediction" 
    WHERE outcome = 'PENDING' AND kickoff > NOW()
    GROUP BY sport, league 
    ORDER BY count DESC
    LIMIT 20
  `;
  
  console.log('\n=== Pending predictions for upcoming matches ===');
  console.table(pending);
  
  // Check if any NHL games exist
  const nhl = await prisma.prediction.findMany({
    where: {
      sport: 'Ice Hockey',
      outcome: 'PENDING',
      kickoff: { gt: new Date() }
    },
    orderBy: { kickoff: 'asc' },
    take: 10,
    select: {
      homeTeam: true,
      awayTeam: true,
      kickoff: true,
      prediction: true,
      conviction: true,
      valueBetEdge: true,
      createdAt: true
    }
  });
  
  console.log('\n=== Upcoming NHL predictions ===');
  console.table(nhl.map(n => ({
    match: `${n.awayTeam} @ ${n.homeTeam}`,
    kickoff: n.kickoff.toISOString().slice(0,16),
    prediction: n.prediction,
    conviction: n.conviction,
    edge: n.valueBetEdge,
    created: n.createdAt.toISOString().slice(0,10)
  })));
}

main().then(() => prisma.$disconnect());
