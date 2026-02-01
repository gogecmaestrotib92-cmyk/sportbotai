import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newTools = [
  // AI & Algoritamski
  { name: 'Betting-AI', url: 'https://betting-ai.com', email: null },
  { name: 'PredictBet.ai', url: 'https://predictbet.ai', email: 'info@predictbet.ai' },
  { name: 'FootyStats', url: 'https://footystats.org', email: null },
  { name: 'WinDrawWin', url: 'https://windrawwin.com', email: null },
  { name: 'SoccerKeep', url: 'https://soccerkeep.com', email: 'office@soccerkeep.com' },
  { name: 'Betiroid', url: 'https://betiroid.com', email: 'support@betiroid.com' },
  { name: 'DataBet.ai', url: 'https://databet.ai', email: 'hello@databet.ai' },
  { name: 'ScoreBrain', url: 'https://scorebrain.com', email: null },
  { name: 'Stats24', url: 'https://stats24.com', email: 'support@stats24.com' },
  { name: 'Forebet', url: 'https://forebet.com', email: null },
  
  // Statisticki portali
  { name: 'CornerProBet', url: 'https://cornerprobet.com', email: 'support@cornerprobet.com' },
  { name: 'TotalCorner', url: 'https://totalcorner.com', email: 'wp@totalcorner.com' },
  { name: 'AdamChoi', url: 'https://adamchoi.co.uk', email: null },
  { name: 'FCStats', url: 'https://fcstats.com', email: null },
  { name: 'SoccerStats', url: 'https://soccerstats.com', email: null },
  { name: 'TableFootball', url: 'https://tablefootball.com', email: 'info@tablefootball.com' },
  { name: 'BettingClosed', url: 'https://bettingclosed.com', email: 'info@bettingclosed.com' },
  { name: 'Statarea', url: 'https://statarea.com', email: null },
  { name: 'SfStats', url: 'https://sfstats.net', email: 'info@sfstats.net' },
  { name: 'SportingLife', url: 'https://sportinglife.com', email: 'editorial@sportinglife.com' },
  
  // Tipsterske zajednice
  { name: 'Tipstrr', url: 'https://tipstrr.com', email: 'support@tipstrr.com' },
  { name: 'ProTipster', url: 'https://protipster.com', email: 'info@protipster.com' },
  { name: 'Betshoot', url: 'https://betshoot.com', email: null },
  { name: 'Vitibet', url: 'https://vitibet.com', email: 'info@vitibet.com' },
  { name: 'Betrush', url: 'https://betrush.com', email: 'info@betrush.com' },
  { name: 'JohnnyBet', url: 'https://johnnybet.com', email: null },
  { name: 'OLBG', url: 'https://olbg.com', email: null },
  { name: 'Pyckio', url: 'https://pyckio.com', email: 'support@pyckio.com' },
  { name: 'Bettingexpert', url: 'https://bettingexpert.com', email: null },
  { name: 'Blogabet', url: 'https://blogabet.com', email: null },
  
  // App Developeri
  { name: 'BetMines', url: 'https://betmines.com', email: 'info@betmines.com' },
  { name: 'BetsWall', url: 'https://betswall.com', email: 'support@betswall.com' },
  { name: 'Bullet Predictions', url: 'https://bulletpredictions.com', email: 'info@bulletpredictions.com' },
  { name: 'Prima Tips', url: 'https://primatips.com', email: 'support@primatips.com' },
  { name: 'Statsman', url: 'https://statsman.app', email: 'info@statsman.app' },
  { name: 'Football Predictions AI', url: 'https://fpai.app', email: 'support@fpai.app' },
  { name: 'BeSoccer', url: 'https://besoccer.com', email: 'info@besoccer.com' },
  { name: 'AiScore', url: 'https://aiscore.com', email: null },
  { name: 'EaglePredict', url: 'https://eaglepredict.com', email: 'info@eaglepredict.com' },
  { name: 'Main-Bet', url: 'https://main-bet.com', email: 'support@main-bet.com' },
];

async function main() {
  let added = 0, updated = 0, skipped = 0;
  
  for (const tool of newTools) {
    // Check if exists
    const existing = await prisma.toolReview.findFirst({
      where: { 
        OR: [
          { toolUrl: tool.url },
          { toolUrl: tool.url + '/' },
          { toolName: tool.name }
        ]
      }
    });
    
    if (existing) {
      // Update email if we have one and they don't
      if (tool.email && !existing.contactEmail) {
        await prisma.toolReview.update({
          where: { id: existing.id },
          data: { 
            contactEmail: tool.email,
            emailSource: 'manual_list',
            outreachStatus: 'NOT_SENT'
          }
        });
        console.log('📧 Updated email:', tool.name, '->', tool.email);
        updated++;
      } else {
        console.log('⏭️  Already exists:', tool.name);
        skipped++;
      }
    } else {
      // Add new tool
      await prisma.toolReview.create({
        data: {
          toolName: tool.name,
          toolUrl: tool.url,
          contactEmail: tool.email,
          emailSource: tool.email ? 'manual_list' : null,
          scrapedFrom: 'manual_curated',
          reviewStatus: 'PENDING',
          outreachStatus: tool.email ? 'NOT_SENT' : 'NO_EMAIL'
        }
      });
      console.log('✅ Added:', tool.name, tool.email ? '(with email)' : '(no email)');
      added++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('  Added:', added);
  console.log('  Updated emails:', updated);
  console.log('  Skipped (existed):', skipped);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
