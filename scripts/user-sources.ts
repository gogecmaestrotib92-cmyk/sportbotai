import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('\n📊 Recent Users & Sources\n');
  console.log('='.repeat(80));
  
  // Get recent users with sources
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      email: true,
      referralSource: true,
      referralMedium: true,
      referralCampaign: true,
      plan: true,
      createdAt: true,
    }
  });
  
  console.log(`\nTotal recent users: ${users.length}\n`);
  
  // Show individual users
  console.log('RECENT SIGNUPS:');
  console.log('-'.repeat(80));
  users.forEach((u, i) => {
    const source = u.referralSource || 'direct';
    const medium = u.referralMedium || '-';
    const campaign = u.referralCampaign || '-';
    const date = u.createdAt.toISOString().split('T')[0];
    console.log(`${i+1}. ${u.email?.substring(0, 30).padEnd(30)} | ${source.padEnd(12)} | ${medium.padEnd(10)} | ${campaign.padEnd(15)} | ${date} | ${u.plan}`);
  });
  
  // Aggregate by source
  console.log('\n\nSOURCE BREAKDOWN:');
  console.log('-'.repeat(40));
  
  const sourceStats = await prisma.user.groupBy({
    by: ['referralSource'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  
  sourceStats.forEach(s => {
    const source = s.referralSource || 'direct/unknown';
    console.log(`${source.padEnd(20)}: ${s._count.id} users`);
  });
  
  // Aggregate by medium
  console.log('\n\nMEDIUM BREAKDOWN:');
  console.log('-'.repeat(40));
  
  const mediumStats = await prisma.user.groupBy({
    by: ['referralMedium'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  
  mediumStats.forEach(s => {
    const medium = s.referralMedium || 'unknown';
    console.log(`${medium.padEnd(20)}: ${s._count.id} users`);
  });
  
  // Aggregate by campaign
  console.log('\n\nCAMPAIGN BREAKDOWN:');
  console.log('-'.repeat(40));
  
  const campaignStats = await prisma.user.groupBy({
    by: ['referralCampaign'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  
  campaignStats.forEach(s => {
    const campaign = s.referralCampaign || 'none';
    console.log(`${campaign.padEnd(25)}: ${s._count.id} users`);
  });
  
  // Users from last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const recentCount = await prisma.user.count({
    where: { createdAt: { gte: weekAgo } }
  });
  
  console.log(`\n\n📈 USERS IN LAST 7 DAYS: ${recentCount}`);
  
  // Today's signups
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayCount = await prisma.user.count({
    where: { createdAt: { gte: today } }
  });
  
  console.log(`📈 USERS TODAY: ${todayCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
