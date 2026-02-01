/**
 * Check CLV tracking status
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('CLV TRACKING STATUS CHECK');
  console.log('========================================\n');

  // Overall stats
  const total = await prisma.prediction.count();
  const withOpeningOdds = await prisma.prediction.count({ where: { openingOdds: { not: null } } });
  const withClosingOdds = await prisma.prediction.count({ where: { closingOdds: { not: null } } });
  const withCLV = await prisma.prediction.count({ where: { clvValue: { not: null } } });
  
  console.log('📊 OVERALL STATS:');
  console.log(`   Total predictions: ${total}`);
  console.log(`   Has openingOdds: ${withOpeningOdds} (${(withOpeningOdds/total*100).toFixed(1)}%)`);
  console.log(`   Has closingOdds: ${withClosingOdds} (${(withClosingOdds/total*100).toFixed(1)}%)`);
  console.log(`   Has clvValue: ${withCLV} (${(withCLV/total*100).toFixed(1)}%)`);

  // Pending stats
  const pending = await prisma.prediction.count({ where: { outcome: 'PENDING' } });
  const pendingWithOpening = await prisma.prediction.count({ 
    where: { outcome: 'PENDING', openingOdds: { not: null } } 
  });
  
  console.log('\n📋 PENDING PREDICTIONS:');
  console.log(`   Total pending: ${pending}`);
  console.log(`   With openingOdds: ${pendingWithOpening}`);
  console.log(`   Ready for CLV fetch: ${pendingWithOpening}`);

  // Check pending predictions detail
  const pendingPreds = await prisma.prediction.findMany({
    where: { outcome: 'PENDING' },
    select: { 
      matchName: true, 
      valueBetOdds: true, 
      openingOdds: true, 
      odds: true,
      source: true,
      kickoff: true 
    },
    take: 10,
    orderBy: { kickoff: 'asc' }
  });
  
  console.log('\n📝 SAMPLE PENDING (next 10):');
  pendingPreds.forEach(p => {
    console.log(`   ${p.matchName}`);
    console.log(`      kickoff: ${p.kickoff?.toISOString()}`);
    console.log(`      odds: ${p.odds} | valueBetOdds: ${p.valueBetOdds} | openingOdds: ${p.openingOdds}`);
    console.log(`      source: ${p.source}`);
  });

  // Check what's preventing openingOdds
  const withValueBetOdds = await prisma.prediction.count({ where: { valueBetOdds: { not: null } } });
  const withOdds = await prisma.prediction.count({ where: { odds: { not: null } } });
  
  console.log('\n🔍 ODDS FIELDS ANALYSIS:');
  console.log(`   Has 'odds' field: ${withOdds}`);
  console.log(`   Has 'valueBetOdds' field: ${withValueBetOdds}`);
  console.log(`   Has 'openingOdds' field: ${withOpeningOdds}`);

  // Check by source
  const sources = await prisma.prediction.groupBy({
    by: ['source'],
    _count: { _all: true },
    where: { openingOdds: { not: null } }
  });
  
  console.log('\n📦 OPENING ODDS BY SOURCE:');
  sources.forEach(s => {
    console.log(`   ${s.source}: ${s._count._all}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
