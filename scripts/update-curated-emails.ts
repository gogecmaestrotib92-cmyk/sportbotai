import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email mapping from user's list
const emailMap: Record<string, string> = {
  'predictbet.ai': 'info@predictbet.ai',
  'soccerkeep.com': 'office@soccerkeep.com',
  'betiroid.com': 'support@betiroid.com',
  'databet.ai': 'hello@databet.ai',
  'stats24.com': 'support@stats24.com',
  'cornerprobet.com': 'support@cornerprobet.com',
  'totalcorner.com': 'wp@totalcorner.com',
  'tablefootball.com': 'info@tablefootball.com',
  'bettingclosed.com': 'info@bettingclosed.com',
  'sfstats.net': 'info@sfstats.net',
  'sportinglife.com': 'editorial@sportinglife.com',
  'tipstrr.com': 'support@tipstrr.com',
  'protipster.com': 'info@protipster.com',
  'vitibet.com': 'info@vitibet.com',
  'betrush.com': 'info@betrush.com',
  'pyckio.com': 'support@pyckio.com',
  'betmines.com': 'info@betmines.com',
  'betswall.com': 'support@betswall.com',
  'bulletpredictions.com': 'info@bulletpredictions.com',
  'primatips.com': 'support@primatips.com',
  'statsman.app': 'info@statsman.app',
  'fpai.app': 'support@fpai.app',
  'besoccer.com': 'info@besoccer.com',
  'eaglepredict.com': 'info@eaglepredict.com',
  'main-bet.com': 'support@main-bet.com',
};

async function main() {
  console.log('🔍 Updating emails for tools from curated list...\n');
  
  let updated = 0;
  
  for (const [domain, email] of Object.entries(emailMap)) {
    // Find tool by URL containing the domain
    const tool = await prisma.toolReview.findFirst({
      where: {
        toolUrl: { contains: domain },
        contactEmail: null
      }
    });
    
    if (tool) {
      await prisma.toolReview.update({
        where: { id: tool.id },
        data: {
          contactEmail: email,
          emailSource: 'manual_curated',
          outreachStatus: 'NOT_SENT'
        }
      });
      console.log(`📧 ${tool.toolName}: ${email}`);
      updated++;
    }
  }
  
  console.log(`\n✅ Updated ${updated} tools with emails`);
  
  // Show current stats
  const stats = await prisma.toolReview.groupBy({
    by: ['outreachStatus'],
    _count: true
  });
  
  console.log('\n📊 Current outreach status:');
  stats.forEach(s => console.log(`  ${s.outreachStatus}: ${s._count}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
