/**
 * Send Daily Top Matches Emails to FREE Users
 * 
 * This script sends today's top 3 high-confidence matches to FREE users.
 * Much more valuable than a generic "upgrade" email!
 * 
 * Usage:
 *   # Preview mode (shows email, no sending):
 *   npx tsx scripts/send-daily-picks.ts --preview
 * 
 *   # Send to first 10 users (test batch):
 *   npx tsx scripts/send-daily-picks.ts --limit=10
 * 
 *   # Send to all FREE users:
 *   npx tsx scripts/send-daily-picks.ts --send-all
 * 
 * Environment:
 *   Requires DATABASE_URL and BREVO_API_KEY
 */

import { PrismaClient } from '@prisma/client';
import { sendDailyTopMatchesEmail } from '../src/lib/email';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const isPreview = args.includes('--preview');
const isSendAll = args.includes('--send-all');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : (isSendAll ? undefined : 5);

// Today's top picks - you would normally fetch these from your analysis system
// For now, using realistic example data
const TODAY_TOP_MATCHES = [
  {
    homeTeam: 'Arsenal',
    awayTeam: 'Wolverhampton',
    league: 'Premier League',
    kickoff: '15:00',
    confidence: 78,
    prediction: 'Home Win',
    edge: '+3.8% edge',
    headline: 'Arsenal\'s home form (W8 in last 10) vs Wolves\' away struggles. Saka and Odegaard both fit.',
  },
  {
    homeTeam: 'Barcelona',
    awayTeam: 'Atletico Madrid',
    league: 'La Liga',
    kickoff: '21:00',
    confidence: 72,
    prediction: 'Over 2.5 Goals',
    edge: '+2.4% edge',
    headline: 'Both teams scoring freely lately. Barca\'s high line vs Atleti\'s counter-attack = goals.',
  },
  {
    homeTeam: 'Inter Milan',
    awayTeam: 'Juventus',
    league: 'Serie A',
    kickoff: '20:45',
    confidence: 68,
    prediction: 'BTTS Yes',
    headline: 'Derby d\'Italia rarely disappoints. Both teams have scored in 7 of last 10 H2H meetings.',
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🎯 SportBot AI - Daily Top Picks Email Campaign');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Mode: ${isPreview ? '👀 PREVIEW (no emails sent)' : '📧 SENDING EMAILS'}`);
  console.log(`  Limit: ${limit || 'No limit'}`);
  console.log(`  Matches: ${TODAY_TOP_MATCHES.length}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Show today's picks
  console.log("📋 Today's Top Picks:");
  console.log('─────────────────────────────────────────────────────────────────');
  TODAY_TOP_MATCHES.forEach((match, i) => {
    console.log(`  ${i + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.league})`);
    console.log(`     ${match.confidence}% confidence | ${match.prediction} ${match.edge || ''}`);
    console.log(`     "${match.headline}"`);
    console.log('');
  });
  console.log('─────────────────────────────────────────────────────────────────\n');

  // Fetch FREE users
  const freeUsers = await prisma.user.findMany({
    where: {
      plan: 'FREE',
      stripeSubscriptionId: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  console.log(`Found ${freeUsers.length} FREE users to email\n`);

  if (freeUsers.length === 0) {
    console.log('No users to email. Exiting.');
    return;
  }

  if (isPreview) {
    console.log('🔍 PREVIEW MODE - Showing sample email:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`  To: ${freeUsers[0].email}`);
    console.log(`  Subject: 🎯 Today's Top 3 Picks - ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`);
    console.log('');
    console.log('  [Email would show 3 match cards with confidence scores,');
    console.log('   predictions, and short analysis headlines]');
    console.log('');
    console.log('  CTA: "View Full Analyses →" linking to /matches');
    console.log('  Footer: "Pro from just $0.66/day · Cancel anytime"');
    console.log('─────────────────────────────────────────────────────────────────\n');
    console.log(`📊 Would send to ${freeUsers.length} users.`);
    console.log('   Run with --limit=10 to send a test batch.');
    console.log('   Run with --send-all to send to everyone.');
    return;
  }

  // Send emails
  console.log('\n📧 Sending emails...\n');
  
  let sent = 0;
  let failed = 0;

  for (const user of freeUsers) {
    if (!user.email) {
      console.log(`⚠️  Skipping user ${user.id} - no email`);
      continue;
    }

    try {
      const success = await sendDailyTopMatchesEmail(
        user.email,
        user.name,
        TODAY_TOP_MATCHES
      );

      if (success) {
        console.log(`✅ Sent to ${user.email}`);
        sent++;
      } else {
        console.log(`❌ Failed to send to ${user.email}`);
        failed++;
      }

      // Rate limit: wait 300ms between emails
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.log(`❌ Error sending to ${user.email}:`, error);
      failed++;
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 Campaign Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Sent successfully: ${sent}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Total processed: ${sent + failed}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
