/**
 * Send Upgrade Nurture Emails to FREE Users
 * 
 * This script sends personalized upgrade emails to FREE users who haven't subscribed yet.
 * 
 * Usage:
 *   # Preview mode (dry run, no emails sent):
 *   npx tsx scripts/send-upgrade-emails.ts --preview
 * 
 *   # Send to first 10 users (test batch):
 *   npx tsx scripts/send-upgrade-emails.ts --limit=10
 * 
 *   # Send to all FREE users:
 *   npx tsx scripts/send-upgrade-emails.ts --send-all
 * 
 *   # Send only to users who have used the product:
 *   npx tsx scripts/send-upgrade-emails.ts --engaged-only --limit=50
 * 
 * Environment:
 *   Requires DATABASE_URL and BREVO_API_KEY
 */

import { PrismaClient } from '@prisma/client';
import { sendUpgradeNurtureEmail } from '../src/lib/email';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const isPreview = args.includes('--preview');
const isSendAll = args.includes('--send-all');
const engagedOnly = args.includes('--engaged-only');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : (isSendAll ? undefined : 5);

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🚀 SportBot AI - Upgrade Nurture Email Campaign');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Mode: ${isPreview ? '👀 PREVIEW (no emails sent)' : '📧 SENDING EMAILS'}`);
  console.log(`  Target: ${engagedOnly ? 'Engaged users only (analysisCount > 0)' : 'All FREE users'}`);
  console.log(`  Limit: ${limit || 'No limit'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Fetch FREE users who haven't been sent an upgrade email yet
  // We'll track this with a new field or just use a simple approach for now
  const freeUsers = await prisma.user.findMany({
    where: {
      plan: 'FREE',
      stripeSubscriptionId: null,
      // Optionally only engaged users
      ...(engagedOnly ? { analysisCount: { gt: 0 } } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      analysisCount: true,
    },
    orderBy: [
      // Prioritize users who have used the product
      { analysisCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  });

  console.log(`Found ${freeUsers.length} FREE users to email\n`);

  if (freeUsers.length === 0) {
    console.log('No users to email. Exiting.');
    return;
  }

  // Show preview of users
  console.log('Users to email:');
  console.log('─────────────────────────────────────────────────────────────────');
  freeUsers.forEach((user, i) => {
    const daysSinceReg = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    console.log(`  ${i + 1}. ${user.email}`);
    console.log(`     Name: ${user.name || 'Not set'} | Analyses: ${user.analysisCount} | Days since reg: ${daysSinceReg}`);
  });
  console.log('─────────────────────────────────────────────────────────────────\n');

  if (isPreview) {
    console.log('🔍 PREVIEW MODE - No emails will be sent.');
    console.log('   Run with --limit=10 to send a test batch.');
    console.log('   Run with --send-all to send to everyone.');
    return;
  }

  // Confirm before sending
  if (!isSendAll && !limitArg) {
    console.log('⚠️  No --send-all or --limit flag provided. Defaulting to 5 users.');
    console.log('   Use --preview to see full list without sending.');
  }

  // Send emails
  console.log('\n📧 Sending emails...\n');
  
  let sent = 0;
  let failed = 0;
  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const user of freeUsers) {
    if (!user.email) {
      console.log(`⚠️  Skipping user ${user.id} - no email`);
      continue;
    }

    const daysSinceReg = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    try {
      const success = await sendUpgradeNurtureEmail(
        user.email,
        user.name,
        user.analysisCount,
        daysSinceReg
      );

      if (success) {
        console.log(`✅ Sent to ${user.email}`);
        sent++;
        results.push({ email: user.email, success: true });
      } else {
        console.log(`❌ Failed to send to ${user.email}`);
        failed++;
        results.push({ email: user.email, success: false, error: 'Send returned false' });
      }

      // Rate limit: wait 500ms between emails to avoid spam triggers
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`❌ Error sending to ${user.email}:`, error);
      failed++;
      results.push({ email: user.email, success: false, error: String(error) });
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

  if (failed > 0) {
    console.log('Failed emails:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.email}: ${r.error}`);
    });
  }
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
